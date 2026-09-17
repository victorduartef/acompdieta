import React from 'react'

// ── Cartão de um exercício dentro do editor de ficha ──
// Props: index, exercise {exerciseId,targetSets,targetReps,restSeconds}, exerciseInfo, equipmentInfo,
//        primaryMuscle, secondaryMuscles (array), isFirst, isLast, isMobile, T,
//        onMoveUp, onMoveDown, onRemove, onChangeSets, onChangeReps, onChangeRest
export default function WorkoutExerciseCard({
  index, exercise, exerciseInfo, equipmentInfo, primaryMuscle, secondaryMuscles,
  isFirst, isLast, isMobile, T,
  onMoveUp, onMoveDown, onRemove, onChangeSets, onChangeReps, onChangeRest,
}) {
  if (!exerciseInfo) return null

  return (
    <div style={{ background: T.surfacePrimary, border: `1px solid ${T.border}`, borderRadius: 12, padding: isMobile ? 13 : 14, marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 9, gap: 8 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
            <span style={{ fontSize: 11, color: T.textMuted, fontFamily: 'JetBrains Mono, monospace', flexShrink: 0 }}>{index + 1}.</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: T.textPrimary }}>{exerciseInfo.name}</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
            {equipmentInfo && <span style={{ fontSize: 9.5, padding: '2px 8px', borderRadius: 8, background: T.surfaceElevated, color: T.textSecondary }}>{equipmentInfo.icon} {equipmentInfo.label}</span>}
            {primaryMuscle && <span style={{ fontSize: 9.5, padding: '2px 8px', borderRadius: 8, background: primaryMuscle.color + '22', color: primaryMuscle.color, fontWeight: 700 }}>{primaryMuscle.label}</span>}
            {secondaryMuscles.map(sm => (
              <span key={sm.id} style={{ fontSize: 9.5, padding: '2px 8px', borderRadius: 8, background: T.surfaceElevated, color: T.textMuted }}>{sm.label}</span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 9.5, color: T.textSecondary, marginBottom: 3, fontFamily: 'JetBrains Mono, monospace' }}>SÉRIES</div>
          <input type="number" inputMode="numeric" value={exercise.targetSets || ''} onChange={e => onChangeSets(e.target.value)} placeholder="4"
            aria-label="Séries alvo"
            style={{ width: '100%', background: T.surfaceElevated, border: `1px solid ${T.border}`, borderRadius: 8, padding: isMobile ? '9px 8px' : '7px 8px', color: T.textPrimary, fontSize: 13, fontFamily: 'JetBrains Mono, monospace' }} />
        </div>
        <div>
          <div style={{ fontSize: 9.5, color: T.textSecondary, marginBottom: 3, fontFamily: 'JetBrains Mono, monospace' }}>REPS</div>
          <input value={exercise.targetReps || ''} onChange={e => onChangeReps(e.target.value)} placeholder="8-12"
            aria-label="Repetições alvo"
            style={{ width: '100%', background: T.surfaceElevated, border: `1px solid ${T.border}`, borderRadius: 8, padding: isMobile ? '9px 8px' : '7px 8px', color: T.textPrimary, fontSize: 13, fontFamily: 'JetBrains Mono, monospace' }} />
        </div>
        <div>
          <div style={{ fontSize: 9.5, color: T.textSecondary, marginBottom: 3, fontFamily: 'JetBrains Mono, monospace' }}>DESCANSO (S)</div>
          <input type="number" inputMode="numeric" value={exercise.restSeconds || ''} onChange={e => onChangeRest(e.target.value)} placeholder="90"
            aria-label="Descanso em segundos"
            style={{ width: '100%', background: T.surfaceElevated, border: `1px solid ${T.border}`, borderRadius: 8, padding: isMobile ? '9px 8px' : '7px 8px', color: T.textPrimary, fontSize: 13, fontFamily: 'JetBrains Mono, monospace' }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={onMoveUp} disabled={isFirst} aria-label="Mover exercício para cima"
          style={{ minWidth: 44, minHeight: 36, background: T.surfaceElevated, border: `1px solid ${T.border}`, borderRadius: 8, color: isFirst ? T.textMuted : T.textSecondary, cursor: isFirst ? 'not-allowed' : 'pointer', fontSize: 13, opacity: isFirst ? 0.4 : 1 }}>↑</button>
        <button onClick={onMoveDown} disabled={isLast} aria-label="Mover exercício para baixo"
          style={{ minWidth: 44, minHeight: 36, background: T.surfaceElevated, border: `1px solid ${T.border}`, borderRadius: 8, color: isLast ? T.textMuted : T.textSecondary, cursor: isLast ? 'not-allowed' : 'pointer', fontSize: 13, opacity: isLast ? 0.4 : 1 }}>↓</button>
        <button onClick={onRemove} aria-label={`Remover ${exerciseInfo.name}`}
          style={{ marginLeft: 'auto', minWidth: 44, minHeight: 36, background: T.negativeBackground, border: 'none', borderRadius: 8, color: T.accentRed, cursor: 'pointer', fontSize: 14 }}>×</button>
      </div>
    </div>
  )
}
