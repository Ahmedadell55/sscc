import React, { useState } from 'react';
import styles from './GamificationPanel.module.css';
import { GAMIFICATION_BADGES, LEADERBOARD, MOCK_USER } from '../../data/mockData';

const LEVEL_COLORS = { Platinum: '#7c3aed', Gold: '#c87f0a', Silver: '#6b7280', Bronze: '#92400e' };

export default function GamificationPanel({ onClose }) {
  const [tab, setTab] = useState('badges');
  const nextLevelPts = 1500;
  const progress = Math.round((MOCK_USER.points / nextLevelPts) * 100);

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <div className={styles.title}>🏆 نظام المكافآت</div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* User rank card */}
        <div className={styles.rankCard}>
          <div className={styles.rankLeft}>
            <div className={styles.rankAvatar}>{MOCK_USER.avatar}</div>
            <div>
              <div className={styles.rankName}>{MOCK_USER.name}</div>
              <div className={styles.rankLevel} style={{ color: LEVEL_COLORS[MOCK_USER.level] || '#c87f0a' }}>
                ✦ {MOCK_USER.level}
              </div>
            </div>
          </div>
          <div className={styles.rankRight}>
            <div className={styles.rankPts}>{MOCK_USER.points.toLocaleString()}</div>
            <div className={styles.rankPtsLbl}>نقطة</div>
            <div className={styles.rankPos}>المرتبة #{MOCK_USER.rank}</div>
          </div>
        </div>
        <div className={styles.progressWrap}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
          <div className={styles.progressLbl}>{MOCK_USER.points} / {nextLevelPts} للمستوى التالي</div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {[{ id: 'badges', label: '🏅 الشارات' }, { id: 'leaderboard', label: '🏆 المتصدرون' }].map(t => (
            <button key={t.id} className={`${styles.tab} ${tab === t.id ? styles.tabActive : ''}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'badges' && (
          <div className={styles.badgeGrid}>
            {GAMIFICATION_BADGES.map(b => (
              <div key={b.id} className={`${styles.badge} ${b.earned ? styles.badgeEarned : styles.badgeLocked}`}>
                <div className={styles.badgeIcon}>{b.icon}</div>
                <div className={styles.badgeName}>{b.label}</div>
                <div className={styles.badgeDesc}>{b.desc}</div>
                <div className={styles.badgePts}>+{b.points} نقطة</div>
                {!b.earned && <div className={styles.lockOverlay}>🔒</div>}
              </div>
            ))}
          </div>
        )}

        {tab === 'leaderboard' && (
          <div className={styles.lbList}>
            {LEADERBOARD.map(u => (
              <div key={u.rank} className={`${styles.lbRow} ${u.isMe ? styles.lbMe : ''}`}>
                <div className={styles.lbRank}>{u.badge}</div>
                <div className={styles.lbName}>{u.name} {u.isMe && <span className={styles.meTag}>أنت</span>}</div>
                <div className={styles.lbLevel} style={{ color: LEVEL_COLORS[u.level] || '#c87f0a' }}>{u.level}</div>
                <div className={styles.lbPts}>{u.points.toLocaleString()} نقطة</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
