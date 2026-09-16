import React from 'react'

// ── Últimas 5 execuções (ordem decrescente) — reaproveita a mesma expansão/detalhe já existente ──
// Props: entries [{key,date,log}] (já ordenados/limitados pelo chamador), getExercise, effectiveWeight,
//        formatDateFull, expandedKey, onToggleExpand, T, isMobile
export default function RecentWorkoutList({ entries, getExercise, effectiveWeight, formatDateFull, expandedKey, onToggleExpand, T, isMobile }) {
  if (entries.length === 0) {
    return (
      <div style={{ background: T.surfacePrimary, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: T.textSecondary, fontWeight: 600, marginBottom: 4 }}>Nenhum treino concluído ainda.</div>
        <div style={{ fontSize: 11.5, color: T.textMuted }}>Inicie uma ficha para começar a acompanhar sua evolução.</div>
      </div>
    )
  }

  return (
    <div style={{ background: T.surfacePrimary, border: `1px solid ${T.border}`, borderRadius: 12, padding: isMobile ? 13 : 15 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: T.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Treinos recentes</div>

      {entries.map(({ key, date, log }) => {
        const totalSets = (log.exercises || []).reduce((a, e) => a + (e.sets?.length || 0), 0)
        const totalVolume = (log.exercises || []).reduce((a, e) => a + (e.sets || []).reduce((s, set) => s + effectiveWeight(e.exerciseId, set.weight) * (set.reps || 0), 0), 0)
        const durMin = log.endTime && log.startTime ? Math.round((log.endTime - log.startTime) / 60000) : null
        const isExp = expandedKey === key
        return (
          <div key={key} onClick={() => onToggleExpand(isExp ? null : key)}
            role="button" tabIndex={0} aria-expanded={isExp}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggleExpand(isExp ? null : key) } }}
            style={{ background: T.surfaceElevated, borderRadius: 10, padding: '11px 12px', marginBottom: 8, cursor: 'pointer', minHeight: 44 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary }}>{formatDateFull(date)} · {log.planName || 'Treino'}</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 10.5, color: T.textSecondary, fontFamily: 'JetBrains Mono, monospace', alignItems: 'center' }}>
              <span>{(log.exercises || []).length} exercícios</span>
              <span>{totalSets} séries</span>
              <span style={{ color: T.accentBlue, fontWeight: 700 }}>{Math.round(totalVolume).toLocaleString('pt-BR')} kg</span>
              {durMin != null && <span>{durMin} min</span>}
              <span style={{ marginLeft: 'auto', color: T.textMuted }}>{isExp ? '▲' : '▼ ver'}</span>
            </div>
            {isExp && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: `0.5px solid ${T.border}` }}>
                {(log.exercises || []).map((ex, ei) => {
                  const e = getExercise(ex.exerciseId)
                  const vol = (ex.sets || []).reduce((a, s) => a + effectiveWeight(ex.exerciseId, s.weight) * (s.reps || 0), 0)
                  return (
                    <div key={ei} style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: T.textPrimary }}>{e?.name || ex.exerciseId}</span>
                        <span style={{ fontSize: 10, color: T.accentBlue, fontFamily: 'JetBrains Mono, monospace' }}>{Math.round(vol)}kg</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {(ex.sets || []).map((set, si) => (
                          <span key={si} style={{ fontSize: 11, background: T.surfacePrimary, borderRadius: 6, padding: '3px 8px', color: T.textSecondary, fontFamily: 'JetBrains Mono, monospace' }}>{set.weight}×{set.reps}</span>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
