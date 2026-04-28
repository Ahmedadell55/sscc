// ═══════════════════════════════════════════════════
//  useAppState v3 — إدارة الحالة الكاملة
//  ✅ localStorage + جميع الخوارزميات الأربعة
//  ✅ Import/Export JSON
//  ✅ جاهز للربط بـ API (كل دالة معلّق عليها)
// ═══════════════════════════════════════════════════
import { useState, useCallback, useRef } from 'react';
import { useLocalStorage } from './useLocalStorage';
import {
  DEFAULT_NODES, DEFAULT_EDGES,
  runDijkstra, runAStar, runBellmanFord, runFloydWarshall,
  analyzeCity,
} from '../data/mockData';

// ── عند ربط الـ API، استورد هذا: ──────────────────
// import { authAPI, projectsAPI, routingAPI, cityAPI } from '../services/api';

export function useAppState() {

  // ── Auth ─────────────────────────────────────────
  const [user, setUser] = useLocalStorage('darb_user', null);
  const [page, setPage] = useState(user ? 'app' : 'landing');

  // ── Projects / File management ───────────────────
  const [currentFile, setCurrentFile] = useState({ name: 'مشروع جديد', saved: false, id: null });
  const [fileHistory, setFileHistory] = useLocalStorage('darb_projects', []);

  // ── Canvas state ─────────────────────────────────
  const CANVAS_VERSION = 'v3';   // غيّر هذا لإعادة ضبط الكانفاس للجميع
  const [nodes, setNodes] = useState(() => {
    try {
      const saved = localStorage.getItem('darb_canvas');
      if (saved) {
        const p = JSON.parse(saved);
        if (p.version === CANVAS_VERSION) return p.nodes || DEFAULT_NODES;
      }
    } catch {}
    return DEFAULT_NODES;
  });
  const [edges, setEdges] = useState(() => {
    try {
      const saved = localStorage.getItem('darb_canvas');
      if (saved) {
        const p = JSON.parse(saved);
        if (p.version === CANVAS_VERSION) return p.edges || DEFAULT_EDGES;
      }
    } catch {}
    return DEFAULT_EDGES;
  });

  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [activeTool, setActiveTool] = useState('move');
  const [zoom, setZoom] = useState(100);
  const [drawingEdge, setDrawingEdge] = useState(null);

  // ── Algorithm ────────────────────────────────────
  const [selectedAlgo, setSelectedAlgo] = useLocalStorage('darb_algo', 'dijkstra');
  const [algoResult, setAlgoResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  // ── UI ───────────────────────────────────────────
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);
  const [rightPanel, setRightPanel] = useLocalStorage('darb_panel', 'algorithm');
  const toastTimer = useRef(null);

  // ── Toast ─────────────────────────────────────────
  const showToast = useCallback((msg, type = 'default') => {
    clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }, []);

  const changeZoom = useCallback((delta) => {
    setZoom(z => Math.min(200, Math.max(30, z + delta)));
  }, []);

  const persistCanvas = useCallback((n, e) => {
    try { localStorage.setItem('darb_canvas', JSON.stringify({ version: CANVAS_VERSION, nodes: n, edges: e })); }
    catch {}
  }, []);

  // ── File actions ──────────────────────────────────
  const newFile = useCallback(() => {
    setNodes(DEFAULT_NODES);
    setEdges(DEFAULT_EDGES);
    setAlgoResult(null);
    setSelectedNode(null);
    setCurrentFile({ name: 'مشروع جديد', saved: false, id: null });
    persistCanvas(DEFAULT_NODES, DEFAULT_EDGES);
    showToast('📄 تم إنشاء مشروع جديد');
  }, [showToast, persistCanvas]);

  const saveFile = useCallback((name) => {
    // [API] await projectsAPI.create(name, nodes, edges)
    const saved = {
      id: currentFile.id || Date.now().toString(36),
      name: name || currentFile.name,
      nodes,
      edges,
      updatedAt: new Date().toLocaleDateString('ar-EG'),
      nodeCount: nodes.length,
    };
    setFileHistory(h => {
      const filtered = h.filter(p => p.id !== saved.id);
      return [saved, ...filtered].slice(0, 10);
    });
    setCurrentFile(f => ({ ...f, name: saved.name, saved: true, id: saved.id }));
    showToast('💾 تم الحفظ: ' + saved.name);
  }, [currentFile, nodes, edges, showToast, setFileHistory]);

  const loadFile = useCallback((saved) => {
    // [API] await projectsAPI.get(saved.id)
    setNodes(saved.nodes);
    setEdges(saved.edges);
    setCurrentFile({ name: saved.name, saved: true, id: saved.id });
    setAlgoResult(null);
    persistCanvas(saved.nodes, saved.edges);
    showToast('📂 تم تحميل: ' + saved.name);
  }, [showToast, persistCanvas]);

  const deleteProject = useCallback((id) => {
    // [API] await projectsAPI.remove(id)
    setFileHistory(h => h.filter(p => p.id !== id));
    showToast('🗑 تم حذف المشروع');
  }, [showToast, setFileHistory]);

  // ── Import JSON ───────────────────────────────────
  const importFromJson = useCallback((jsonData) => {
    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      if (!data.nodes || !data.edges) throw new Error('تنسيق JSON غير صالح');
      setNodes(data.nodes);
      setEdges(data.edges);
      setAlgoResult(null);
      setCurrentFile({ name: data.name || 'مشروع مستورد', saved: false, id: null });
      persistCanvas(data.nodes, data.edges);
      showToast('📥 تم استيراد: ' + (data.name || 'مشروع'));
    } catch (e) {
      showToast('❌ فشل الاستيراد: ' + e.message, 'error');
    }
  }, [showToast, persistCanvas]);

  // ── Node actions ──────────────────────────────────
  const addNode = useCallback((type, x, y, lat, lng) => {
    const id = 'N' + Date.now().toString(36).toUpperCase().slice(-3);
    const newNode = { id, type: type.id, label: type.label, x, y, color: type.color, ...(lat != null ? { lat, lng } : {}) };
    setNodes(n => {
      const updated = [...n, newNode];
      persistCanvas(updated, edges);
      return updated;
    });
    setCurrentFile(f => ({ ...f, saved: false }));
    showToast('➕ تمت إضافة: ' + type.label);
    return newNode;
  }, [showToast, persistCanvas, edges]);

  const deleteNode = useCallback((nodeId) => {
    setNodes(n => {
      const updated = n.filter(nd => nd.id !== nodeId);
      setEdges(e => {
        const updatedE = e.filter(ed => ed.from !== nodeId && ed.to !== nodeId);
        persistCanvas(updated, updatedE);
        return updatedE;
      });
      return updated;
    });
    setSelectedNode(null);
    setCurrentFile(f => ({ ...f, saved: false }));
    showToast('🗑 تم حذف العقدة');
  }, [showToast, persistCanvas]);

  const moveNode = useCallback((nodeId, x, y, lat, lng) => {
    setNodes(n => {
      const updated = n.map(nd =>
        nd.id === nodeId
          ? { ...nd, x, y, ...(lat != null ? { lat, lng } : {}) }
          : nd
      );
      persistCanvas(updated, edges);
      return updated;
    });
    setCurrentFile(f => ({ ...f, saved: false }));
  }, [persistCanvas, edges]);

  // حساب المسافة الحقيقية بين نقطتين (Haversine)
  const haversineKm = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 +
              Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
    return +(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(2);
  };

  const addEdge = useCallback((from, to, weight = null) => {
    setNodes(currentNodes => {
      setEdges(e => {
        const exists = e.find(ed =>
          (ed.from === from && ed.to === to) || (ed.from === to && ed.to === from)
        );
        if (exists || from === to) return e;
        const id = from + to;
        const congestions = ['low', 'medium', 'high'];
        const congestion = congestions[Math.floor(Math.random() * 3)];
        // حساب الوزن الحقيقي من المسافة الجغرافية
        let realWeight = weight;
        if (realWeight == null) {
          const fn = currentNodes.find(n => n.id === from);
          const tn = currentNodes.find(n => n.id === to);
          if (fn?.lat && tn?.lat) {
            realWeight = haversineKm(fn.lat, fn.lng, tn.lat, tn.lng) || 1.0;
          } else {
            realWeight = 1.0;
          }
        }
        const updated = [...e, { id, from, to, weight: +realWeight.toFixed(2), congestion }];
        persistCanvas(currentNodes, updated);
        return updated;
      });
      return currentNodes;
    });
    setCurrentFile(f => ({ ...f, saved: false }));
    showToast('🔗 تم ربط: ' + from + ' ↔ ' + to);
  }, [showToast, persistCanvas]);

  // تحديث بيانات عقدة
  const updateNode = useCallback((nodeId, changes) => {
    setNodes(n => {
      const updated = n.map(nd => nd.id === nodeId ? { ...nd, ...changes } : nd);
      persistCanvas(updated, edges);
      return updated;
    });
    setCurrentFile(f => ({ ...f, saved: false }));
    showToast('✏️ تم تحديث العقدة');
  }, [edges, persistCanvas, showToast]);

  // تحديث بيانات طريق
  const updateEdge = useCallback((edgeId, changes) => {
    setEdges(e => {
      const updated = e.map(ed => ed.id === edgeId ? { ...ed, ...changes } : ed);
      persistCanvas(nodes, updated);
      return updated;
    });
    setCurrentFile(f => ({ ...f, saved: false }));
    showToast('✏️ تم تحديث الطريق');
  }, [nodes, persistCanvas, showToast]);

  const deleteEdge = useCallback((edgeId) => {
    setEdges(e => {
      const updated = e.filter(ed => ed.id !== edgeId);
      persistCanvas(nodes, updated);
      return updated;
    });
    setSelectedEdge(null);
    setCurrentFile(f => ({ ...f, saved: false }));
    showToast('🗑 تم حذف الطريق');
  }, [nodes, showToast, persistCanvas]);

  // ── Run Algorithm ─────────────────────────────────
  const runAlgorithm = useCallback((startId, endId, priority) => {
    if (!startId || !endId) { showToast('❌ اختر نقطة البداية والنهاية'); return; }
    if (startId === endId)  { showToast('❌ البداية والنهاية متطابقتان'); return; }
    setIsRunning(true);
    setAlgoResult(null);

    // [API] استبدل بـ: const result = await routingAPI.calculate(nodes, edges, startId, endId, selectedAlgo, priority)
    setTimeout(() => {
      try {
        let result;
        switch (selectedAlgo) {
          case 'astar':
            result = runAStar(nodes, edges, startId, endId);
            break;
          case 'bellman':
            result = runBellmanFord(nodes, edges, startId, endId);
            break;
          case 'floyd':
            result = runFloydWarshall(nodes, edges, startId, endId);
            break;
          default:
            result = runDijkstra(nodes, edges, startId, endId);
        }

        if (!isFinite(result.distance)) {
          showToast('❌ لا يوجد مسار بين هذين الموقعين', 'error');
          setIsRunning(false);
          return;
        }
        setAlgoResult({ ...result, algo: selectedAlgo, startId, endId, priority });
        showToast('✓ ' + selectedAlgo + ' — ' + result.distance.toFixed(1) + ' كم', 'success');
      } catch (err) {
        showToast('❌ خطأ في تشغيل الخوارزمية', 'error');
      }
      setIsRunning(false);
    }, 900);
  }, [nodes, edges, selectedAlgo, showToast]);

  const getCityAnalysis = useCallback(() => {
    // [API] await cityAPI.analyze(nodes, edges)
    return analyzeCity(nodes, edges);
  }, [nodes, edges]);

  // ── Auth ──────────────────────────────────────────
  const login = useCallback((userData, token) => {
    // [API] token from authAPI.login() → localStorage.setItem('darb_token', token)
    if (token) localStorage.setItem('darb_token', token);
    setUser(userData);
    setPage('app');
    showToast('👋 أهلاً ' + userData.name.split(' ')[0] + '!');
  }, [setUser, showToast]);

  const logout = useCallback(() => {
    // [API] authAPI.logout()
    localStorage.removeItem('darb_token');
    setUser(null);
    setPage('landing');
    setAlgoResult(null);
    showToast('👋 تم تسجيل الخروج');
  }, [setUser, showToast]);

  return {
    user, login, logout, page, setPage,
    currentFile, fileHistory, newFile, saveFile, loadFile, deleteProject, importFromJson,
    nodes, edges,
    selectedNode, setSelectedNode,
    selectedEdge, setSelectedEdge,
    activeTool, setActiveTool,
    zoom, changeZoom,
    drawingEdge, setDrawingEdge,
    addNode, deleteNode, moveNode, updateNode,
    addEdge, deleteEdge, updateEdge,
    selectedAlgo, setSelectedAlgo,
    algoResult, isRunning, runAlgorithm,
    getCityAnalysis,
    toast, showToast,
    modal, setModal,
    rightPanel, setRightPanel,
  };
}
