import React from 'react'

// ── Resumo da ficha (painel lateral) — só dados DERIVADOS, nada persistido aqui ──
// Props: plan {name, exercises}, getExercise, getMuscle, T
export default function WorkoutPlanSummary({ plan, getExercise, getMuscle, T }) {
  const exercises = plan.exercises || []
  const count = exercises.length

  // Músculos principais (mesma lógica de tally usada no card da ficha)
  const muscleTally = {}
  exercises.forEach(ex => {
    const e = getExercise(ex.exerciseId)
    if (e) muscleTally[e.primary] = (muscleTally[e.primary] || 0) + 1
  })
  const topMuscles = Object.entries(muscleTally).sort((a, b) => b[1] - a[1]).slice(0, 4)
    .map(([mid]) => getMuscle(mid)).filter(Boolean)

  // Total de séries planejadas (só soma o que está preenchido)
  const setsFilled = exercises.filter(ex => ex.targetSets > 0)
  const totalSets = setsFilled.reduce((a, ex) => a + (ex.targetSets || 0), 0)

  // Descanso configurado — mostra faixa só se houver dado confiável, nunca soma um total inventado
  const restValues = exercises.map(ex => ex.restSeconds).filter(v => v > 0)
  const restInfo = restValues.length === 0 ? null
    : (Math.min(...restValues) === Math.max(...restValues) ? `${restValues[0]}s` : `${Math.min(...restValues)}–${Math.max(...restValues)}s`)

  // Avisos: ficha vazia (tratado fora) ou exercício com configuração incompleta
  const incomplete = exercises.filter(ex => !ex.targetSets || !ex.targetReps || !ex.restSeconds)

  return (
    <div style={{ background: T.surfacePrimary, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: T.textSecondary, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.5 }}>Resumo da ficha</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: incomplete.length > 0 ? 14 : 0 }}>
        <Stat T={T} label="Exercícios" value={count} />
        {setsFilled.length > 0 && <Stat T={T} label="Séries planejadas (total)" value={totalSets} />}
        {restInfo && <Stat T={T} label="Descanso configurado" value={restInfo} />}
        {topMuscles.length > 0 && (
          <div>
            <div style={{ fontSize: 10.5, color: T.textSecondary, marginBottom: 6 }}>Grupos musculares</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {topMuscles.map(m => (
                <span key={m.id} style={{ fontSize: 10.5, padding: '3px 9px', borderRadius: 8, background: m.color + '22', color: m.color, fontWeight: 700 }}>{m.label}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {incomplete.length > 0 && (
        <div style={{ background: T.negativeBackground, borderRadius: 9, padding: '9px 11px', borderLeft: `3px solid ${T.accentAmber}` }}>
          <div style={{ fontSize: 10.5, color: T.accentAmber, fontWeight: 700, marginBottom: 2 }}>⚠️ Configuração incompleta</div>
          <div style={{ fontSize: 10, color: T.textSecondary }}>
            {incomplete.length} {incomplete.length === 1 ? 'exercício está' : 'exercícios estão'} sem séries, reps ou descanso definidos.
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ T, label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <span style={{ fontSize: 11, color: T.textSecondary }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 800, color: T.textPrimary, fontFamily: 'JetBrains Mono, monospace' }}>{value}</span>
    </div>
  )
}
