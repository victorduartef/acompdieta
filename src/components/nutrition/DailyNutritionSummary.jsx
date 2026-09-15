import React from 'react'

// ── Resumo diário: calorias em destaque + P/C/G ──
// Usa calcMacros/getTargetsForDate já calculados pelo App (dayMacros, activeTargets) — nenhum cálculo paralelo.
// Props: dayMacros {cal,prot,carb,fat}, activeTargets, farolProt, farolFat, farolCarb, hasData, T
export default function DailyNutritionSummary({ dayMacros, activeTargets, farolProt, farolFat, farolCarb, hasData, T }) {
  const cal = dayMacros.cal
  const goal = activeTargets.cal
  const diff = goal - cal
  const pct = Math.min(100, (cal / (activeTargets.max || goal)) * 100)
  const over = cal > activeTargets.max
  const inRange = cal >= activeTargets.min && cal <= activeTargets.max
  const calColor = !hasData ? T.textMuted : over ? T.accentRed : inRange ? T.accentTeal : T.accentOrange

  const macroRows = [
    { label: 'Proteína', val: dayMacros.prot, goal: activeTargets.prot, min: activeTargets.protMin, max: activeTargets.protMax, color: T.accentOrange, farol: hasData ? farolProt(dayMacros.prot, activeTargets) : null },
    { label: 'Carboidratos', val: dayMacros.carb, goal: activeTargets.carb, min: activeTargets.controlCarb ? activeTargets.carbMin : null, max: activeTargets.controlCarb ? activeTargets.carbMax : null, color: T.accentAmber, farol: hasData ? farolCarb(dayMacros.carb, activeTargets) : null },
    { label: 'Gordura', val: dayMacros.fat, goal: activeTargets.fat, min: activeTargets.fatMin, max: activeTargets.fatMax, color: T.accentOrange, farol: hasData ? farolFat(dayMacros.fat, activeTargets) : null },
  ]

  return (
    <div style={{ background: T.surfacePrimary, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: T.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Resumo diário</div>

      {/* Calorias em destaque */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
          <span style={{ fontSize: 26, fontWeight: 800, color: T.textPrimary, fontFamily: 'JetBrains Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{Math.round(cal).toLocaleString('pt-BR')}</span>
          <span style={{ fontSize: 13, color: T.textSecondary }}>de {Math.round(goal).toLocaleString('pt-BR')} kcal</span>
        </div>
        <div style={{ background: T.surfaceElevated, borderRadius: 5, height: 9, overflow: 'hidden', marginBottom: 6 }}>
          <div style={{ height: '100%', width: `${Math.max(3, pct)}%`, background: calColor, borderRadius: 5, transition: 'width .3s' }} />
        </div>
        <div style={{ fontSize: 11.5, fontWeight: 600, color: calColor }}>
          {!hasData ? 'Nenhum registro ainda' : diff >= 0 ? `${Math.round(diff).toLocaleString('pt-BR')} kcal restantes` : `${Math.round(-diff).toLocaleString('pt-BR')} kcal acima da meta`}
        </div>
      </div>

      {/* Macros */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {macroRows.map(m => {
          const mPct = m.goal ? Math.min(100, (m.val / m.goal) * 100) : 0
          const remaining = m.goal != null ? Math.round(m.goal - m.val) : null
          const rangeLabel = m.min != null && m.max != null ? `${m.min}–${m.max}g` : (m.goal != null ? `${m.goal}g` : '—')
          return (
            <div key={m.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                <span style={{ fontSize: 11.5, color: T.textSecondary, fontWeight: 500 }}>{m.label}</span>
                <span style={{ fontSize: 11.5, fontFamily: 'JetBrains Mono, monospace', color: T.textPrimary, fontVariantNumeric: 'tabular-nums' }}>
                  {Math.round(m.val)}g <span style={{ color: T.textMuted }}>/ {rangeLabel}</span>
                </span>
              </div>
              <div style={{ background: T.surfaceElevated, borderRadius: 4, height: 6, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.max(2, mPct)}%`, background: m.farol || m.color, borderRadius: 4, transition: 'width .3s' }} />
              </div>
              {remaining != null && remaining > 0 && hasData && (
                <div style={{ fontSize: 9.5, color: T.textMuted, marginTop: 2 }}>{remaining}g restantes</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
