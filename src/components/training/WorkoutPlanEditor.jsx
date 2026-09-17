import React from 'react'
import WorkoutExerciseCard from './WorkoutExerciseCard.jsx'
import WorkoutPlanSummary from './WorkoutPlanSummary.jsx'

// ── Editor de ficha (criar/editar) ──
// Recebe dados e callbacks por props; toda persistência continua no App.jsx (autosave já existente).
// Props: plan, getExercise, getMuscle, getEquipment, isMobile, twoCol, T,
//        onBack, onRename, onMoveExercise(idx,dir), onRemoveExercise(idx),
//        onChangeExercise(idx,field,value), onAddExercise
export default function WorkoutPlanEditor({
  plan, getExercise, getMuscle, getEquipment, isMobile, twoCol, T,
  onBack, onRename, onMoveExercise, onRemoveExercise, onChangeExercise, onAddExercise,
}) {
  const exercises = plan.exercises || []
  const isEmpty = exercises.length === 0
  const title = isEmpty ? 'Nova ficha' : 'Editar ficha'

  const addButton = (
    <button onClick={onAddExercise} style={{ width: '100%', padding: 13, minHeight: 44, border: `1.5px dashed ${T.accentPurple}66`, borderRadius: 12, background: T.accentPurple + '10', color: T.accentPurple, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>
      + Adicionar exercício
    </button>
  )

  const mainColumn = (
    <div style={{ minWidth: 0 }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: T.accentPurple, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 12, padding: '6px 0', minHeight: 44, display: 'flex', alignItems: 'center' }}>
        ‹ Voltar às fichas
      </button>

      <div style={{ fontSize: isMobile ? 17 : 19, fontWeight: 800, color: T.textPrimary, marginBottom: 12 }}>{title}</div>

      <input value={plan.name} onChange={e => onRename(e.target.value)} aria-label="Nome da ficha"
        style={{ width: '100%', background: T.surfacePrimary, border: `1px solid ${T.border}`, borderRadius: 10, padding: '13px 14px', color: T.textPrimary, fontSize: 16, fontWeight: 700, fontFamily: 'inherit', marginBottom: 16 }} />

      {isEmpty ? (
        <div style={{ background: T.surfacePrimary, border: `1px solid ${T.border}`, borderRadius: 12, padding: '32px 20px', textAlign: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 30, marginBottom: 10 }}>🏋️</div>
          <div style={{ fontSize: 13, color: T.textSecondary, marginBottom: 4 }}>Esta ficha ainda não possui exercícios.</div>
          <div style={{ fontSize: 11.5, color: T.textMuted, marginBottom: 16 }}>Adicione o primeiro exercício para montar o treino.</div>
          <div style={{ maxWidth: 280, margin: '0 auto' }}>{addButton}</div>
        </div>
      ) : (
        <>
          {exercises.map((ex, idx) => {
            const info = getExercise(ex.exerciseId)
            const eq = info ? getEquipment(info.equipment) : null
            const pm = info ? getMuscle(info.primary) : null
            const secondary = info ? (info.secondary || []).map(sid => getMuscle(sid)).filter(Boolean) : []
            return (
              <WorkoutExerciseCard
                key={idx}
                index={idx}
                exercise={ex}
                exerciseInfo={info}
                equipmentInfo={eq}
                primaryMuscle={pm}
                secondaryMuscles={secondary}
                isFirst={idx === 0}
                isLast={idx === exercises.length - 1}
                isMobile={isMobile}
                T={T}
                onMoveUp={() => onMoveExercise(idx, -1)}
                onMoveDown={() => onMoveExercise(idx, 1)}
                onRemove={() => onRemoveExercise(idx)}
                onChangeSets={(v) => onChangeExercise(idx, 'targetSets', v)}
                onChangeReps={(v) => onChangeExercise(idx, 'targetReps', v)}
                onChangeRest={(v) => onChangeExercise(idx, 'restSeconds', v)}
              />
            )
          })}
          {addButton}
        </>
      )}

      <div style={{ fontSize: 10.5, color: T.textMuted, textAlign: 'center', marginTop: 14 }}>
        Alterações salvas automaticamente
      </div>
    </div>
  )

  const summaryColumn = <WorkoutPlanSummary plan={plan} getExercise={getExercise} getMuscle={getMuscle} T={T} />

  if (!twoCol) {
    return (
      <div>
        {mainColumn}
        <div style={{ marginTop: 16 }}>{summaryColumn}</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '70% 1fr', gap: 20, alignItems: 'start' }}>
      {mainColumn}
      <div style={{ position: 'sticky', top: 16 }}>{summaryColumn}</div>
    </div>
  )
}
