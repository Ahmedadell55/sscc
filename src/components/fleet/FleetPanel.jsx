import React, { useState } from 'react';
import styles from './FleetPanel.module.css';
import { MOCK_FLEET, FLEET_STATS } from '../../data/mockData';
import { SkeletonList } from '../common/Skeleton';
// [API] import { fleetAPI } from '../../services/api';

const STATUS_META = {
  moving:  { label: 'يتحرك',  color: '#2d5a3d', bg: 'var(--green-bg)' },
  idle:    { label: 'خامل',   color: '#c87f0a', bg: 'var(--amber-bg)' },
  stopped: { label: 'متوقف',  color: '#c0392b', bg: 'var(--red-bg)'   },
};
const TYPE_ICON = { truck: '🚛', van: '🚐', car: '🚗' };

function VehicleCard({ v, selected, onSelect }) {
  const sm = STATUS_META[v.status] || STATUS_META.idle;
  return (
    <div
      className={`${styles.vCard} ${selected ? styles.vCardSelected : ''}`}
      onClick={() => onSelect(v.id)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onSelect(v.id)}
      aria-selected={selected}
    >
      <div className={styles.vTop}>
        <span className={styles.vIcon}>{TYPE_ICON[v.type]}</span>
        <div className={styles.vInfo}>
          <div className={styles.vId}>{v.id}</div>
          <div className={styles.vDriver}>{v.driver}</div>
        </div>
        <span className={styles.vStatus} style={{ color: sm.color, background: sm.bg }}>
          {sm.label}
        </span>
      </div>
      <div className={styles.vRoute}>{v.route}</div>
      <div className={styles.vMeta}>
        <span>🏎 {v.speed} كم/س</span>
        <span>⛽ {v.fuel}%</span>
        <span>⏱ {v.eta}</span>
      </div>
      {v.alerts.length > 0 && (
        <div className={styles.vAlerts}>
          {v.alerts.map((a, i) => (
            <span key={i} className={styles.vAlert}>⚠ {a}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function FuelBar({ pct }) {
  const color = pct > 60 ? '#2d5a3d' : pct > 30 ? '#c87f0a' : '#c0392b';
  return (
    <div className={styles.fuelBar}>
      <div className={styles.fuelFill} style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export default function FleetPanel({ onClose }) {
  const [selectedId, setSelectedId] = useState(null);
  const [loading] = useState(false);   // [API] useState(true) → fetch on mount
  const [error] = useState(null);      // [API] catch errors from fleetAPI.getVehicles()

  const selectedV = MOCK_FLEET.find(v => v.id === selectedId);

  // [API] useEffect(() => { fleetAPI.getVehicles().then(setFleet).catch(setError).finally(() => setLoading(false)); }, []);

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <div className={styles.title}>🚛 إدارة الأسطول</div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="إغلاق">✕</button>
        </div>

        {/* Stats row */}
        <div className={styles.statsRow}>
          <div className={styles.statItem}><span className={styles.statNum} style={{color:'var(--green-d)'}}>{FLEET_STATS.activeNow}</span><span className={styles.statLbl}>يتحرك</span></div>
          <div className={styles.statItem}><span className={styles.statNum}>{FLEET_STATS.totalVehicles}</span><span className={styles.statLbl}>إجمالي</span></div>
          <div className={styles.statItem}><span className={styles.statNum} style={{color:'var(--amber)'}}>{FLEET_STATS.totalKmToday}</span><span className={styles.statLbl}>كم اليوم</span></div>
          <div className={styles.statItem}><span className={styles.statNum} style={{color:'var(--green-d)'}}>{FLEET_STATS.deliveries}</span><span className={styles.statLbl}>توصيل</span></div>
        </div>

        <div className={styles.body}>
          {/* Vehicle list */}
          <div className={styles.listCol}>
            {loading && <SkeletonList count={4} />}
            {error && (
              <div className={styles.errorState}>
                <span className={styles.errorIcon}>⚠️</span>
                <span>{error}</span>
                <button className={styles.retryBtn}>إعادة المحاولة</button>
              </div>
            )}
            {!loading && !error && MOCK_FLEET.map(v => (
              <VehicleCard key={v.id} v={v} selected={selectedId === v.id} onSelect={setSelectedId} />
            ))}
          </div>

          {/* Detail col */}
          <div className={styles.detailCol}>
            {selectedV ? (
              <>
                <div className={styles.detailHeader}>
                  <span className={styles.detailIcon}>{TYPE_ICON[selectedV.type]}</span>
                  <div>
                    <div className={styles.detailId}>{selectedV.id}</div>
                    <div className={styles.detailDriver}>{selectedV.driver}</div>
                  </div>
                </div>
                <div className={styles.detailSection}>
                  <div className={styles.dsTitle}>الوقود</div>
                  <FuelBar pct={selectedV.fuel} />
                  <div className={styles.fuelPct}>{selectedV.fuel}%</div>
                </div>
                <div className={styles.detailSection}>
                  <div className={styles.dsTitle}>المسار</div>
                  <div className={styles.detailRoute}>{selectedV.route}</div>
                  <div className={styles.detailEta}>⏱ وصول خلال: {selectedV.eta}</div>
                </div>
                <div className={styles.detailSection}>
                  <div className={styles.dsTitle}>السرعة الحالية</div>
                  <div className={styles.speedGauge}>
                    <div className={styles.speedVal}>{selectedV.speed}</div>
                    <div className={styles.speedUnit}>كم/س</div>
                  </div>
                </div>
                {selectedV.alerts.length > 0 && (
                  <div className={styles.detailSection}>
                    <div className={styles.dsTitle}>تنبيهات</div>
                    {selectedV.alerts.map((a, i) => (
                      <div key={i} className={styles.alertRow}>⚠ {a}</div>
                    ))}
                  </div>
                )}
                <button className={styles.routeBtn}>🗺 تحسين مسار هذه المركبة</button>
              </>
            ) : (
              <div className={styles.emptyDetail}>
                <div className={styles.emptyIcon}>🚛</div>
                <div>اختر مركبة لعرض تفاصيلها</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
