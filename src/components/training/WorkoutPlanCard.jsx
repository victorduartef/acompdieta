import React, { useState } from 'react'

// ── Cartão de uma ficha de treino ──
// Grupos musculares derivados só dos exercícios cadastrados (getExercise/getMuscle) — nunca do nome da ficha.
// Props: plan, getExercise, getMuscle, lastExecution {date,volume,durationMin}|null, formatDateFull,
//        isLastTrained, isSuggestedNext, onStart, onEdit, onDelete, onAddExercises, T, isMobile
export default function WorkoutPlanCard({
  plan, getExercise, getMuscle, lastExecution, formatDateFull,
  isLastTrained, isSuggestedNext, onStart, onEdit, onDelete, onAddExercises, T, isMobile,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const isEmpty = plan.exercises.length === 0

  // Grupos musculares principais — só se derivável com segurança dos exercícios cadastrados
  const muscleTally = {}
  plan.exercises.forEach(ex => {
    const e = getExercise(ex.exerciseId)
    if (e) muscleTally[e.primary] = (muscleTally[e.primary] || 0) + 1
  })
  const topMuscles = Object.entries(muscleTally).sort((a, b) => b[1] - a[1]).slice(0, 3)
    .map(([mid]) => getMuscle(mid)?.label).filter(Boolean)

  return (
    <div style={{ background: T.surfacePrimary, border: `1px solid ${T.border}`, borderRadius: 12, padding: isMobile ? 14 : 15, marginBottom: 12, position: 'relative' }}>
      {/* Badges de estado */}
      {(isLastTrained || isSuggestedNext) && (
        <div style={{ position: 'absolute', top: 12, right: 12 }}>
          {isLastTrained && <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: T.textMuted + '22', color: T.textSecondary }}>Última realizada</span>}
          {isSuggestedNext && <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: T.accentTeal + '22', color: T.accentTeal }}>Próximo treino</span>}
        </div>
      )}

      <div style={{ fontSize: 15, fontWeight: 800, color: T.textPrimary, marginBottom: 3, paddingRight: 90 }}>{plan.name}</div>
      {topMuscles.length > 0 && (
        <div style={{ fontSize: 11, color: T.accentPurple, marginBottom: 10 }}>{topMuscles.join(' · ')}</div>
      )}

      {isEmpty ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: topMuscles.length ? 0 : 8 }}>
          <span style={{ fontSize: 12, color: T.textMuted }}>Esta ficha ainda não possui exercícios.</span>
        </div>
      ) : (
        <div style={{ fontSize: 11.5, color: T.textSecondary, marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span>{plan.exercises.length} exercícios</span>
          {lastExecution ? (
            <>
              <span>Último treino: {formatDateFull(lastExecution.date)}</span>
              <span style={{ display: 'flex', gap: 10, fontFamily: 'JetBrains Mono, monospace', color: T.textMuted }}>
                {lastExecution.volume > 0 && <span>Volume: {Math.round(lastExecution.volume).toLocaleString('pt-BR')} kg</span>}
                {lastExecution.durationMin != null && <span>{lastExecution.durationMin} min</span>}
              </span>
            </>
          ) : (
            <span style={{ color: T.textMuted }}>Nunca treinada</span>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {isEmpty ? (
          <button onClick={onAddExercises} style={{ flex: 1, padding: 11, minHeight: 44, background: `linear-gradient(135deg,${T.accentPurple},${T.accentPurple}cc)`, border: 'none', borderRadius: 10, color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            Adicionar exercícios
          </button>
        ) : (
          <button onClick={onStart} style={{ flex: 1, padding: 11, minHeight: 44, background: `linear-gradient(135deg,${T.accentTeal},#0ea5a5)`, border: 'none', borderRadius: 10, color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            ▶ Iniciar treino
          </button>
        )}
        <button onClick={onEdit} aria-label={`Editar ${plan.name}`}
          style={{ minWidth: 44, minHeight: 44, background: T.surfaceElevated, border: `1px solid ${T.border}`, borderRadius: 10, color: T.textSecondary, fontSize: 13, cursor: 'pointer' }}>✎</button>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setMenuOpen(v => !v)} aria-label={`Mais ações para ${plan.name}`} aria-expanded={menuOpen}
            style={{ minWidth: 44, minHeight: 44, background: T.surfaceElevated, border: `1px solid ${T.border}`, borderRadius: 10, color: T.textSecondary, fontSize: 15, cursor: 'pointer' }}>⋮</button>
          {menuOpen && (
            <div onMouseLeave={() => setMenuOpen(false)} style={{ position: 'absolute', right: 0, top: '110%', background: T.surfaceElevated, border: `1px solid ${T.border}`, borderRadius: 10, padding: 6, minWidth: 140, zIndex: 5, boxShadow: '0 4px 16px rgba(0,0,0,0.25)' }}>
              <button onClick={() => { setMenuOpen(false); onDelete() }}
                style={{ width: '100%', textAlign: 'left', padding: '9px 10px', minHeight: 44, background: 'none', border: 'none', borderRadius: 7, color: T.accentRed, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit' }}>
                Excluir ficha
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
