import React, { useState } from 'react';
import styles from './ParkingPanel.module.css';
import { MOCK_PARKING } from '../../data/mockData';

const TYPE_LABEL = { covered: '🏢 مغطى', open: '🌤 مفتوح', valet: '🎩 فاليه' };

function ParkingCard({ p, selected, onSelect }) {
  const pct = Math.round((p.available / p.total) * 100);
  const avColor = pct > 40 ? '#2d5a3d' : pct > 15 ? '#c87f0a' : '#c0392b';
  return (
    <div
      className={`${styles.card} ${selected ? styles.cardSelected : ''}`}
      onClick={() => onSelect(p.id)}
    >
      <div className={styles.cardTop}>
        <div className={styles.cardName}>{p.name}</div>
        <span className={styles.cardType}>{TYPE_LABEL[p.type]}</span>
      </div>
      <div className={styles.cardMeta}>
        <span style={{ color: avColor }} className={styles.avail}>{p.available} فراغ</span>
        <span className={styles.dist}>📍 {p.distance} كم</span>
        <span className={styles.price}>💰 {p.price} ج/ساعة</span>
      </div>
      <div className={styles.bar}>
        <div className={styles.barFill} style={{ width: `${100 - pct}%`, background: avColor }} />
      </div>
      <div className={styles.barLabel}>{pct}% متاح</div>
    </div>
  );
}

export default function ParkingPanel({ onClose }) {
  const [selected, setSelected] = useState(null);
  const sorted = [...MOCK_PARKING].sort((a, b) => b.available - a.available);
  const sel = MOCK_PARKING.find(p => p.id === selected);

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <div className={styles.title}>🅿 مواقف السيارات الذكية</div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.body}>
          <div className={styles.listCol}>
            <div className={styles.hint}>📡 مباشر — يتجدد كل 30 ثانية</div>
            {sorted.map(p => (
              <ParkingCard key={p.id} p={p} selected={selected === p.id} onSelect={setSelected} />
            ))}
          </div>

          <div className={styles.detailCol}>
            {sel ? (
              <>
                <div className={styles.detailName}>{sel.name}</div>
                <div className={styles.detailType}>{TYPE_LABEL[sel.type]}</div>
                <div className={styles.detailStats}>
                  <div className={styles.ds}><span className={styles.dsVal} style={{ color: '#2d5a3d' }}>{sel.available}</span><span className={styles.dsLbl}>مكان متاح</span></div>
                  <div className={styles.ds}><span className={styles.dsVal}>{sel.total}</span><span className={styles.dsLbl}>إجمالي</span></div>
                  <div className={styles.ds}><span className={styles.dsVal}>{sel.distance} كم</span><span className={styles.dsLbl}>البعد</span></div>
                  <div className={styles.ds}><span className={styles.dsVal}>{sel.price} ج</span><span className={styles.dsLbl}>الساعة</span></div>
                </div>
                <div className={styles.mapPreview}>
                  <svg viewBox="0 0 300 180" width="100%">
                    <rect width="300" height="180" fill="#e8e2d6" rx="8"/>
                    <text x="150" y="95" textAnchor="middle" fontSize="40">🅿</text>
                    <text x="150" y="140" textAnchor="middle" fontSize="12" fill="#2d5a3d" fontWeight="700">{sel.name}</text>
                  </svg>
                </div>
                <button className={styles.navBtn}>🗺 اتجه إلى الموقف</button>
                <button className={styles.reserveBtn}>📋 احجز مكان</button>
              </>
            ) : (
              <div className={styles.empty}>
                <div>🅿</div>
                <div>اختر موقفاً لعرض التفاصيل</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
