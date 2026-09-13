import React from 'react'
import { formatSleep } from '../../lib/dashboardMetrics.js'

// ── Bloco: Saúde semanal (passos, sono, nota) ──
// Props: steps/sleep/score = {days:[{date,value,future}], mean, n}, prevMeans {steps,sleep,score}, targets, T, onClick
export default function WeeklyHealth({ steps, sleep, score, prevMeans, targets, T, onClick }) {
  return (
    <div onClick={onClick} style={card(T, !!onClick)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 13, width: 22, height: 22, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.accentPurple + '18', color: T.accentPurple }}>❤️</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>Saúde semanal</span>
      </div>

      <Row T={T} icon="👟" label="Passos" color={T.accentTeal}
        data={steps} prevMean={prevMeans?.steps} goal={targets?.stepsGoal}
        fmt={(v) => Math.round(v).toLocaleString('pt-BR')} deltaFmt={(d) => `${d > 0 ? '+' : ''}${Math.round(d).toLocaleString('pt-BR')}`} goodDir="up" />

      <Row T={T} icon="😴" label="Sono" color={T.accentPurple}
        data={sleep} prevMean={prevMeans?.sleep} goal={targets?.sleepGoal}
        fmt={(v) => formatSleep(v)} deltaFmt={(d) => `${d > 0 ? '+' : ''}${Math.round(d * 60)}min`} goodDir="up" isSleep />

      <Row T={T} icon="⭐" label="Nota do sono" color={T.accentAmber}
        data={score} prevMean={prevMeans?.score} goal={targets?.sleepScoreGoal}
        fmt={(v) => Math.round(v)} deltaFmt={(d) => `${d > 0 ? '+' : ''}${Math.round(d)}`} goodDir="up" last />
    </div>
  )
}

function Row({ T, icon, label, color, data, prevMean, goal, fmt, deltaFmt, goodDir, isSleep, last }) {
  const { days, mean, n } = data
  const hasData = mean != null && n > 0
  const delta = (hasData && prevMean != null) ? mean - prevMean : null
  const deltaColor = delta == null ? T.textMuted : (Math.abs(delta) < (isSleep ? 0.008 : 0.5) ? T.textMuted : ((goodDir === 'up' ? delta > 0 : delta < 0) ? T.accentTeal : T.accentRed))

  // mini barras
  const vals = days.filter(d => d.value != null).map(d => d.value)
  const maxV = vals.length ? Math.max(...vals, goal || 0) : 1
  const bw = 7, gap = 3, chartW = 7 * bw + 6 * gap, chartH = 20

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: last ? 'none' : `0.5px solid ${T.borderSoft}` }}>
      <span style={{ fontSize: 14, color, width: 18, textAlign: 'center' }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: T.textSecondary, fontWeight: 500 }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: hasData ? T.textPrimary : T.textMuted, fontFamily: 'JetBrains Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{hasData ? fmt(mean) : '—'}</span>
          {delta != null && Math.abs(delta) >= (isSleep ? 0.008 : 0.5) && (
            <span style={{ fontSize: 9.5, fontWeight: 700, color: deltaColor, fontFamily: 'JetBrains Mono, monospace' }}>{deltaFmt(delta)}</span>
          )}
        </div>
      </div>
      {/* mini barras */}
      <svg width={chartW} height={chartH} style={{ flexShrink: 0 }}>
        {days.map((d, i) => {
          if (d.value == null) return <rect key={i} x={i * (bw + gap)} y={chartH - 2} width={bw} height={2} rx={1} fill={T.border} opacity={0.4} />
          const h = Math.max(2, (d.value / maxV) * chartH)
          const wknd = (() => { const w = new Date(d.date + 'T12:00:00').getDay(); return w === 0 || w === 6 })()
          return <rect key={i} x={i * (bw + gap)} y={chartH - h} width={bw} height={h} rx={1.5} fill={color} opacity={wknd ? 0.55 : 0.9} />
        })}
        {goal != null && <line x1={0} y1={chartH - (goal / maxV) * chartH} x2={chartW} y2={chartH - (goal / maxV) * chartH} stroke={T.accentAmber} strokeWidth="1" strokeDasharray="2,2" opacity="0.7" />}
      </svg>
      <div style={{ width: 52, textAlign: 'right', flexShrink: 0 }}>
        {goal != null && <div style={{ fontSize: 8.5, color: T.textMuted, fontFamily: 'JetBrains Mono, monospace' }}>meta {isSleep ? formatSleep(goal) : goal.toLocaleString('pt-BR')}</div>}
        <div style={{ fontSize: 8.5, color: T.textMuted, fontFamily: 'JetBrains Mono, monospace' }}>{n} {n === 1 ? 'reg' : 'regs'}</div>
      </div>
    </div>
  )
}

function card(T, clickable) {
  return { background: T.surfacePrimary, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.15)', cursor: clickable ? 'pointer' : 'default', display: 'flex', flexDirection: 'column', minWidth: 0 }
}
