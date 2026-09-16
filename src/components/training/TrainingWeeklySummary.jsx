import React, { useState } from 'react'

// ── Resumo semanal: sessões, volume, duração, cardio + dias da semana ──
// Todos os valores vêm já calculados (dashboardMetrics.js) — nenhum cálculo paralelo aqui.
// Props: training {strengthDays,cardioDays,volume,dayChips}, prevTraining, duration {totalMinutes,n}, T, isMobile
export default function TrainingWeeklySummary({ training, prevTraining, duration, T, isMobile, getActivity, onRemoveActivity }) {
  const [tapDay, setTapDay] = useState(null)
  const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

  const volDelta = (prevTraining?.volume != null && training.volume != null && prevTraining.volume > 0)
    ? Math.round((training.volume - prevTraining.volume) / prevTraining.volume * 100) : null
  const strengthDelta = prevTraining ? training.strengthDays - prevTraining.strengthDays : null
  const cardioDelta = prevTraining ? training.cardioDays - prevTraining.cardioDays : null

  const stats = [
    { label: 'Musculação', icon: '🏋️', value: `${training.strengthDays}×`, color: T.accentPurple, delta: strengthDelta },
    { label: 'Volume total', icon: '📦', value: training.volume > 0 ? `${training.volume.toLocaleString('pt-BR')} kg` : '—', color: T.accentBlue, delta: volDelta != null ? `${volDelta > 0 ? '+' : ''}${volDelta}%` : null },
    ...(duration && duration.n > 0 ? [{ label: 'Duração total', icon: '⏱️', value: `${duration.totalMinutes} min`, color: T.accentAmber, delta: null }] : []),
    { label: 'Cardio / outros', icon: '🏃', value: `${training.cardioDays}×`, color: T.accentTeal, delta: cardioDelta },
  ]

  return (
    <div style={{ background: T.surfacePrimary, border: `1px solid ${T.border}`, borderRadius: 12, padding: isMobile ? 13 : 16, marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: T.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Resumo semanal</div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : `repeat(${stats.length}, 1fr)`, gap: 10, marginBottom: 16 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: T.surfaceElevated, borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: s.color }}>{s.icon}</span>
              <span style={{ fontSize: 10.5, color: T.textSecondary }}>{s.label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 17, fontWeight: 800, color: T.textPrimary, fontFamily: 'JetBrains Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{s.value}</span>
              {s.delta != null && s.delta !== 0 && (
                <span style={{ fontSize: 10, fontWeight: 700, color: (typeof s.delta === 'number' ? s.delta > 0 : s.delta.startsWith('+')) ? T.accentTeal : T.accentRed, fontFamily: 'JetBrains Mono, monospace' }}>
                  {typeof s.delta === 'number' ? `${s.delta > 0 ? '+' : ''}${s.delta}` : s.delta}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Dias da semana */}
      <div style={{ display: 'flex', gap: 5, justifyContent: 'space-between' }}>
        {training.dayChips.map((c, i) => {
          const active = c.active
          const bg = c.hasStrength ? T.accentPurple : c.hasCardio ? T.accentTeal : c.hasOther ? T.accentAmber : 'transparent'
          const tooltip = c.labels.length ? c.labels.join(', ') : 'Sem atividade'
          return (
            <button key={i}
              onClick={() => setTapDay(tapDay === i ? null : i)}
              title={tooltip}
              aria-label={`${dias[i]}: ${tooltip}`}
              style={{
                flex: 1, minHeight: 44, textAlign: 'center', padding: '6px 2px', borderRadius: 8, fontSize: 9.5, fontWeight: 700,
                fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer',
                background: active ? bg + '22' : 'transparent',
                border: `1px solid ${active ? bg + '55' : T.borderSoft}`,
                color: active ? bg : T.textMuted,
              }}
            >{dias[i]}</button>
          )
        })}
      </div>
      {tapDay != null && training.dayChips[tapDay].active && (
        <div style={{ marginTop: 8, background: T.surfaceElevated, borderRadius: 8, padding: '8px 10px' }}>
          <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 6, fontFamily: 'JetBrains Mono, monospace' }}>{dias[tapDay]}, {training.dayChips[tapDay].date.slice(5).split('-').reverse().join('/')}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {training.dayChips[tapDay].activityIds.map(actId => {
              const act = getActivity ? getActivity(actId) : null
              return (
                <div key={actId} style={{ display: 'flex', alignItems: 'center', gap: 5, background: T.surfacePrimary, border: `1px solid ${T.border}`, borderRadius: 20, padding: '4px 6px 4px 10px' }}>
                  <span style={{ fontSize: 11, color: T.textSecondary }}>{act ? `${act.icon} ${act.label}` : actId}</span>
                  {onRemoveActivity && (
                    <button onClick={() => onRemoveActivity(training.dayChips[tapDay].date, actId)} aria-label={`Remover ${act?.label || actId} de ${dias[tapDay]}`}
                      style={{ background: T.negativeBackground, border: 'none', borderRadius: '50%', width: 20, height: 20, color: T.accentRed, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>×</button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
