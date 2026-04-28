// ═══════════════════════════════════════════════════
//  MapCanvas v3 — OpenStreetMap + Layers + Ruler + Export
//  ✅ Multiple tile layers (Street/Satellite/Topo/Dark)
//  ✅ Ruler tool with distance measurement
//  ✅ Flowing dash animation on optimal path
//  ✅ Dark mode support
//  ✅ Map export PNG
//  [API] عند الربط: nodes ستحتوي على lat/lng حقيقية
// ═══════════════════════════════════════════════════
import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './MapCanvas.module.css';
import { NODE_TYPES } from '../../data/mockData';
import MapLayersPanel, { TILE_LAYERS } from './MapLayers';

const CONGESTION_COLORS = { high: '#c0392b', medium: '#c87f0a', low: '#2d6a4f' };
const CAIRO_CENTER = [30.0444, 31.2357];
const CAIRO_ZOOM   = 14;

function svgToLatLng(node) {
  if (node.lat != null && node.lng != null) return [node.lat, node.lng];
  const lat = 30.0544 - (node.y / 600) * 0.10;
  const lng = 31.2100 + (node.x / 900) * 0.12;
  return [lat, lng];
}

function getNodeEmoji(type) {
  return NODE_TYPES.find(t => t.id === type)?.icon || '📍';
}

function makeMarkerHtml(node, isSelected, isInPath) {
  const border = isSelected ? '#2563eb' : isInPath ? '#2d5a3d' : node.color;
  const glow = isInPath
    ? `0 0 0 3px ${node.color}33, 0 0 16px ${node.color}55, 0 3px 12px rgba(0,0,0,.2)`
    : isSelected
    ? '0 0 0 3px #2563eb55, 0 3px 12px rgba(0,0,0,.25)'
    : '0 3px 10px rgba(0,0,0,.2)';
  const scale = isInPath ? 'transform:scale(1.12);' : '';
  return `
    <div style="
      width:40px;height:40px;
      background:white;border:2.5px solid ${border};border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-size:17px;box-shadow:${glow};
      position:relative;cursor:pointer;${scale}
      transition:box-shadow 0.3s,transform 0.2s;
    ">
      ${getNodeEmoji(node.type)}
      <div style="
        position:absolute;bottom:-18px;left:50%;transform:translateX(-50%);
        font-size:9px;font-weight:800;color:${node.color};white-space:nowrap;
        font-family:monospace;background:rgba(255,255,255,.92);
        padding:1px 5px;border-radius:4px;box-shadow:0 1px 3px rgba(0,0,0,.12);
      ">${node.id}</div>
    </div>
  `;
}

// Fix default marker icons when bundled with webpack
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl:       require('leaflet/dist/images/marker-icon.png'),
  shadowUrl:     require('leaflet/dist/images/marker-shadow.png'),
});

export default function MapCanvas({
  nodes, edges, activeTool, zoom,
  selectedNode, setSelectedNode,
  selectedEdge, setSelectedEdge,
  algoResult, isRunning,
  onMoveNode, onAddNode, onDeleteNode, onDeleteEdge, onAddEdge,
  onUpdateNode, onUpdateEdge,
  showToast, showSignals, theme,
  showLayersPanel, setShowLayersPanel,
  onMapRef, onLeafletMapRef,
}) {
  const mapContainerRef  = useRef(null);
  const mapRef           = useRef(null);
  const markersRef       = useRef({});
  const polylinesRef     = useRef({});
  const edgeLabelsRef    = useRef({});
  const tileLayerRef     = useRef(null);

  const userMarkerRef    = useRef(null);
  const userCircleRef    = useRef(null);
  const watchIdRef       = useRef(null);
  const [userPos, setUserPos]         = useState(null);
  const [trackingActive, setTracking] = useState(false);

  const linePreviewRef   = useRef(null);
  const pendingNodeRef   = useRef(null);

  const [rulerPoints, setRulerPoints] = useState([]);
  const [rulerDistance, setRulerDistance] = useState(null);
  const rulerMarkersRef = useRef([]);
  const rulerLineRef    = useRef(null);

  const [currentLayerId, setCurrentLayerId] = useState(() =>
    localStorage.getItem('darb_maplayer') || 'street'
  );

  const pathEdges = useMemo(() => {
    const s = new Set();
    if (algoResult?.path) {
      for (let i = 0; i < algoResult.path.length - 1; i++) {
        const a = algoResult.path[i], b = algoResult.path[i + 1];
        s.add(a + b); s.add(b + a);
      }
    }
    return s;
  }, [algoResult]);

  // ── Init map ──────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: CAIRO_CENTER,
      zoom: CAIRO_ZOOM,
      zoomControl: false,
    });

    const defaultLayer = TILE_LAYERS.find(l => l.id === currentLayerId) || TILE_LAYERS[0];
    tileLayerRef.current = L.tileLayer(defaultLayer.url, {
      attribution: defaultLayer.attribution,
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;
    onMapRef?.(mapContainerRef);
    onLeafletMapRef?.(map);

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = {};
      polylinesRef.current = {};
    };
  }, []);

  // ── Change tile layer ─────────────────────────────
  const handleLayerSelect = useCallback((layer) => {
    const map = mapRef.current;
    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }
    tileLayerRef.current = L.tileLayer(layer.url, {
      attribution: layer.attribution,
      maxZoom: 19,
    }).addTo(map);
    setCurrentLayerId(layer.id);
    localStorage.setItem('darb_maplayer', layer.id);
    showToast(`🗺 تم التبديل إلى طبقة: ${layer.label}`);
  }, [showToast]);

  // ── User Location Tracking ───────────────────────
  const updateUserMarker = useCallback((lat, lng, accuracy) => {
    const map = mapRef.current;

    const pulseHtml = `
      <div style="position:relative;width:20px;height:20px;">
        <div style="
          position:absolute;inset:0;border-radius:50%;
          background:rgba(37,99,235,0.25);
          animation:userPulse 2s ease-out infinite;
        "></div>
        <div style="
          position:absolute;inset:3px;border-radius:50%;
          background:#2563eb;border:2.5px solid white;
          box-shadow:0 2px 8px rgba(37,99,235,0.6);
        "></div>
      </div>
    `;

    const icon = L.divIcon({
      className: '',
      html: pulseHtml,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([lat, lng]);
    } else {
      userMarkerRef.current = L.marker([lat, lng], { icon, zIndexOffset: 1000 })
        .addTo(map)
        .bindPopup(`<div style="font-family:Tajawal,sans-serif;direction:rtl;font-size:13px"><strong>📍 موقعك الحالي</strong><br>دقة: ${Math.round(accuracy)} م</div>`);
    }

    if (userCircleRef.current) {
      userCircleRef.current.setLatLng([lat, lng]).setRadius(accuracy);
    } else {
      userCircleRef.current = L.circle([lat, lng], {
        radius: accuracy,
        color: '#2563eb',
        fillColor: '#2563eb',
        fillOpacity: 0.08,
        weight: 1.5,
        dashArray: '4 4',
      }).addTo(map);
    }
  }, []);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) { showToast('❌ المتصفح لا يدعم تحديد الموقع'); return; }
    setTracking(true);
    showToast('📍 جارٍ تحديد موقعك...');

    const success = (pos) => {
      const { latitude: lat, longitude: lng, accuracy } = pos.coords;
      setUserPos({ lat, lng, accuracy });
      updateUserMarker(lat, lng, accuracy);
      mapRef.current?.flyTo([lat, lng], 15, { animate: true, duration: 1.5 });
      showToast(`📍 موقعك: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    };

    const error = () => {
      showToast('❌ تأكد من السماح للمتصفح بالوصول للموقع');
      setTracking(false);
    };

    navigator.geolocation.getCurrentPosition(success, error, { enableHighAccuracy: true });
    watchIdRef.current = navigator.geolocation.watchPosition(success, error, {
      enableHighAccuracy: true,
      maximumAge: 5000,
    });
  }, [updateUserMarker, showToast]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (userMarkerRef.current) { userMarkerRef.current.remove(); userMarkerRef.current = null; }
    if (userCircleRef.current) { userCircleRef.current.remove(); userCircleRef.current = null; }
    setUserPos(null);
    setTracking(false);
    showToast('📍 تم إيقاف تتبع الموقع');
  }, [showToast]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;

    if (activeTool !== 'ruler') {
      rulerMarkersRef.current.forEach(m => m.remove());
      rulerMarkersRef.current = [];
      if (rulerLineRef.current) { rulerLineRef.current.remove(); rulerLineRef.current = null; }
      setRulerPoints([]);
      setRulerDistance(null);
      return;
    }

    const onClick = (e) => {
      const { lat, lng } = e.latlng;
      const pt = [lat, lng];

      setRulerPoints(prev => {
        const next = [...prev, pt];

        const icon = L.divIcon({
          className: '',
          html: `<div style="width:12px;height:12px;background:#2563eb;border:2px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>`,
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        });
        const marker = L.marker(pt, { icon }).addTo(map);
        rulerMarkersRef.current.push(marker);

        if (rulerLineRef.current) rulerLineRef.current.remove();
        if (next.length > 1) {
          rulerLineRef.current = L.polyline(next, {
            color: '#2563eb',
            weight: 2,
            dashArray: '6 4',
            opacity: 0.9,
          }).addTo(map);

          let total = 0;
          for (let i = 1; i < next.length; i++) {
            total += L.latLng(next[i-1]).distanceTo(L.latLng(next[i]));
          }
          const km = (total / 1000).toFixed(2);
          setRulerDistance(km);
          showToast(`📏 المسافة: ${km} كم`);
        }
        return next;
      });
    };

    map.on('click', onClick);
    return () => map.off('click', onClick);
  }, [activeTool, showToast]);

  // ── Sync Markers ──────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;

    const existing = markersRef.current;
    const nodeIds = new Set(nodes.map(n => n.id));

    Object.keys(existing).forEach(id => {
      if (!nodeIds.has(id)) { existing[id].remove(); delete existing[id]; }
    });

    nodes.forEach(node => {
      const latlng = svgToLatLng(node);
      const isSelected = selectedNode === node.id;
      const isInPath   = algoResult?.path?.includes(node.id);
      const icon = L.divIcon({
        className: '',
        html: makeMarkerHtml(node, isSelected, isInPath),
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -25],
      });

      if (existing[node.id]) {
        existing[node.id].setLatLng(latlng);
        existing[node.id].setIcon(icon);
      } else {
        const marker = L.marker(latlng, { icon, draggable: activeTool === 'move' })
          .addTo(map)
          .bindPopup(() => {
            const connCount = edges.filter(e => e.from === node.id || e.to === node.id).length;
            const latStr = node.lat != null ? node.lat.toFixed(5) : '—';
            const lngStr = node.lng != null ? node.lng.toFixed(5) : '—';
            const div = document.createElement('div');
            div.style.cssText = 'font-family:Tajawal,sans-serif;direction:rtl;min-width:220px;font-size:13px;';
            div.innerHTML = `
              <div style="border-bottom:1px solid #eee;padding-bottom:8px;margin-bottom:8px;">
                <strong style="font-size:15px;color:#1a1a1a">${getNodeEmoji(node.type)} ${node.label}</strong>
                <div style="color:#888;font-size:11px;margin-top:2px">ID: ${node.id} · ${node.type}</div>
              </div>
              <div style="margin-bottom:6px;">
                <label style="font-size:11px;color:#555;display:block;margin-bottom:3px">✏️ اسم العقدة</label>
                <input id="nlabel-${node.id}" value="${node.label}"
                  style="width:100%;border:1.5px solid #ddd;border-radius:6px;padding:4px 8px;
                  font-family:Tajawal,sans-serif;font-size:13px;box-sizing:border-box;outline:none;"/>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px;font-size:11px;color:#555;">
                <div>📍 خط العرض: <strong>${latStr}</strong></div>
                <div>📍 خط الطول: <strong>${lngStr}</strong></div>
                <div>🔗 طرق متصلة: <strong>${connCount}</strong></div>
                <div>🎨 اللون: <input type="color" id="ncolor-${node.id}" value="${node.color}"
                  style="width:32px;height:20px;border:none;cursor:pointer;vertical-align:middle;border-radius:4px;"/></div>
              </div>
              <div style="display:flex;gap:6px;">
                <button id="save-node-${node.id}" style="flex:1;background:#2d5a3d;color:white;border:none;
                  border-radius:6px;padding:6px;cursor:pointer;font-size:12px;font-family:Tajawal,sans-serif;font-weight:700">
                  💾 حفظ التعديلات
                </button>
                <button id="del-node-${node.id}" style="background:#c0392b;color:white;border:none;
                  border-radius:6px;padding:6px 10px;cursor:pointer;font-size:12px;font-family:Tajawal,sans-serif">
                  🗑
                </button>
              </div>
            `;
            setTimeout(() => {
              document.getElementById('save-node-' + node.id)?.addEventListener('click', () => {
                const newLabel = document.getElementById('nlabel-' + node.id)?.value?.trim();
                const newColor = document.getElementById('ncolor-' + node.id)?.value;
                if (newLabel) onUpdateNode?.(node.id, { label: newLabel, color: newColor });
                map.closePopup();
              });
              document.getElementById('del-node-' + node.id)?.addEventListener('click', () => {
                map.closePopup();
                onDeleteNode(node.id);
              });
            }, 10);
            return div;
          });

        marker.on('click', () => {
          if (activeTool === 'ruler') return;
          if (activeTool === 'delete') { onDeleteNode(node.id); return; }
          if (activeTool === 'line') {
            setSelectedNode(prev => {
              if (prev && prev !== node.id) {
                onAddEdge(prev, node.id);
                pendingNodeRef.current = null;
                if (linePreviewRef.current) {
                  linePreviewRef.current.remove();
                  linePreviewRef.current = null;
                }
                return null;
              }
              pendingNodeRef.current = node.id;
              return node.id;
            });
            return;
          }
          setSelectedNode(prev => prev === node.id ? null : node.id);
          setSelectedEdge(null);
        });

        marker.on('dragend', (e) => {
          const ll = e.target.getLatLng();
          const x = Math.round(((ll.lng - 31.21) / 0.12) * 900);
          const y = Math.round(((30.0544 - ll.lat) / 0.10) * 600);
          onMoveNode(node.id, x, y, ll.lat, ll.lng);
        });

        existing[node.id] = marker;
      }

      if (existing[node.id]?.dragging) {
        activeTool === 'move'
          ? existing[node.id].dragging.enable()
          : existing[node.id].dragging.disable();
      }
    });
  }, [nodes, selectedNode, algoResult, activeTool, edges, setSelectedNode, setSelectedEdge, onDeleteNode, onMoveNode, onAddEdge, onUpdateNode]);

  // ── Sync Polylines ────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;

    const existing       = polylinesRef.current;
    const existingLabels = edgeLabelsRef.current;
    const edgeIds = new Set(edges.map(e => e.id));

    // Remove stale polylines + labels
    Object.keys(existing).forEach(id => {
      if (!edgeIds.has(id) && !id.endsWith('_casing')) {
        existing[id].remove();
        delete existing[id];
        if (existing[id + '_casing']) { existing[id + '_casing'].remove(); delete existing[id + '_casing']; }
      }
    });
    Object.keys(existingLabels).forEach(id => {
      if (!edgeIds.has(id)) { existingLabels[id].remove(); delete existingLabels[id]; }
    });

    edges.forEach(edge => {
      const from = nodes.find(n => n.id === edge.from);
      const to   = nodes.find(n => n.id === edge.to);
      if (!from || !to) return;

      const isPath     = pathEdges.has(edge.id);
      const isSelected = selectedEdge === edge.id;

      const roadWidth = edge.weight >= 6 ? 'highway'
                      : edge.weight >= 3 ? 'main'
                      : 'street';

      const color = isPath     ? '#2d5a3d'
                  : isSelected ? '#2563eb'
                  : CONGESTION_COLORS[edge.congestion] || '#888';

      const weight = isPath     ? 8
                   : isSelected ? 6
                   : roadWidth === 'highway' ? 6
                   : roadWidth === 'main'    ? 4.5
                   : 3;

      const dashArray = isPath ? '16 8' : isSelected ? '6 3' : null;
      const opacity   = isPath ? 1 : isSelected ? 0.95 : 0.82;

      const positions = [svgToLatLng(from), svgToLatLng(to)];

      if (existing[edge.id]) {
        existing[edge.id].setLatLngs(positions);
        existing[edge.id].setStyle({ color, weight, dashArray, opacity });
        const el = existing[edge.id].getElement();
        if (el) {
          if (isPath) el.classList.add('flow-path');
          else el.classList.remove('flow-path');
        }
        if (existingLabels[edge.id]) {
          const mid = [
            (positions[0][0] + positions[1][0]) / 2,
            (positions[0][1] + positions[1][1]) / 2,
          ];
          const congColor = CONGESTION_COLORS[edge.congestion] || '#888';
          const labelIcon = L.divIcon({
            className: '',
            html: `<div style="background:white;border:1.5px solid ${congColor};border-radius:8px;padding:2px 7px;font-size:10px;font-weight:800;color:${congColor};font-family:Tajawal,sans-serif;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.15);pointer-events:none;">${edge.weight.toFixed(1)} كم</div>`,
            iconAnchor: [20, 10],
          });
          existingLabels[edge.id].setLatLng(mid);
          existingLabels[edge.id].setIcon(labelIcon);
        }
      } else {
        const casingId = edge.id + '_casing';
        if (!existing[casingId] && !isPath) {
          existing[casingId] = L.polyline(positions, {
            color: 'rgba(0,0,0,0.15)',
            weight: weight + 3,
            opacity: 0.5,
            interactive: false,
          }).addTo(map);
        }

        const poly = L.polyline(positions, {
          color, weight, opacity, dashArray,
          className: isPath ? 'flow-path' : '',
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(map).bindPopup(() => {
          const div = document.createElement('div');
          div.style.cssText = 'font-family:Tajawal,sans-serif;direction:rtl;font-size:13px;min-width:230px;';
          const rwLabel = roadWidth === 'highway' ? '🛣 طريق سريع' : roadWidth === 'main' ? '🚗 شارع رئيسي' : '🛤 شارع فرعي';
          div.innerHTML = `
            <div style="border-bottom:1px solid #eee;padding-bottom:8px;margin-bottom:8px;">
              <strong style="font-size:14px;color:#1a1a1a">🛤 ${from.label} ↔ ${to.label}</strong>
              <div style="color:#888;font-size:11px;margin-top:2px">${rwLabel} · ID: ${edge.id}</div>
            </div>
            <div style="margin-bottom:6px;">
              <label style="font-size:11px;color:#555;display:block;margin-bottom:3px">📏 المسافة (كم)</label>
            <input
  id="eweight-${edge.id}"
  type="number"
  min="0.1"
  step="0.1"
  value="${edge.weight ?? 1}"
  style="width: 100%;"
/>









