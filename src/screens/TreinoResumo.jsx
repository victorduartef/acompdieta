import React from 'react'
import TrainingWeeklySummary from '../components/training/TrainingWeeklySummary.jsx'
import WorkoutPlanCard from '../components/training/WorkoutPlanCard.jsx'
import RecentWorkoutList from '../components/training/RecentWorkoutList.jsx'
import ActiveWorkoutCard from '../components/training/ActiveWorkoutCard.jsx'

// ── Treino — Resumo (tela inicial do módulo) ──
// Recebe tudo por props; nenhuma lógica de persistência aqui.
export default function TreinoResumo({
  T, isMobile, twoCol,
  liveSession, activePlanName, onContinueLive,
  workoutPlans, planInsights, getExercise, getMuscle, formatDateFull,
  training, prevTraining, duration,
  recentEntries, expandedKey, onToggleExpand, effectiveWeight,
  onStartPlan, onEditPlan, onDeletePlan, onAddExercisesToPlan, onNewFicha, onEditWorkout,
  getActivity, onRemoveActivity, onAddPastWorkout,
}) {
  const fichasGrid = (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary }}>Suas fichas</div>
        <button onClick={onNewFicha} style={{ background: T.activeBackground, border: `1px solid ${T.accentPurple}55`, borderRadius: 9, padding: '7px 12px', minHeight: 36, color: T.accentPurple, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>+ Nova ficha</button>
      </div>

      {workoutPlans.length === 0 ? (
        <div style={{ background: T.surfacePrimary, border: `1px solid ${T.border}`, borderRadius: 12, padding: '32px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 30, marginBottom: 10 }}>📋</div>
          <div style={{ fontSize: 13, color: T.textSecondary, marginBottom: 4 }}>Nenhuma ficha ainda</div>
          <div style={{ fontSize: 11.5, color: T.textMuted }}>Crie sua primeira ficha de treino</div>
        </div>
      ) : (
        <div style={twoCol ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 } : {}}>
          {workoutPlans.map(plan => (
            <WorkoutPlanCard
              key={plan.id}
              plan={plan}
              getExercise={getExercise}
              getMuscle={getMuscle}
              formatDateFull={formatDateFull}
              lastExecution={planInsights.getLastExecution(plan.id)}
              isLastTrained={planInsights.lastTrained?.planId === plan.id}
              isSuggestedNext={planInsights.suggestNext?.id === plan.id}
              onStart={() => onStartPlan(plan)}
              onEdit={() => onEditPlan(plan.id)}
              onDelete={() => onDeletePlan(plan)}
              onAddExercises={() => onAddExercisesToPlan(plan.id)}
              T={T} isMobile={isMobile}
            />
          ))}
        </div>
      )}
    </div>
  )

  const recentList = (
    <div>
      <RecentWorkoutList
        entries={recentEntries}
        getExercise={getExercise}
        effectiveWeight={effectiveWeight}
        formatDateFull={formatDateFull}
        expandedKey={expandedKey}
        onToggleExpand={onToggleExpand}
        onEdit={onEditWorkout}
        T={T} isMobile={isMobile}
      />
      {onAddPastWorkout && (
        <button onClick={onAddPastWorkout} style={{ width: '100%', padding: 11, minHeight: 44, marginTop: 10, border: `1px dashed ${T.border}`, borderRadius: 10, background: 'transparent', color: T.textSecondary, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
          📅 Registrar treino de um dia anterior
        </button>
      )}
    </div>
  )

  return (
    <div>
      {liveSession && (
        <ActiveWorkoutCard liveSession={liveSession} planName={activePlanName} getExercise={getExercise} onContinue={onContinueLive} T={T} />
      )}

      <TrainingWeeklySummary training={training} prevTraining={prevTraining} duration={duration} T={T} isMobile={isMobile} getActivity={getActivity} onRemoveActivity={onRemoveActivity} />

      {twoCol ? (
        <div style={{ display: 'grid', gridTemplateColumns: '65% 1fr', gap: 16, alignItems: 'start' }}>
          {fichasGrid}
          {recentList}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {fichasGrid}
          {recentList}
        </div>
      )}
    </div>
  )
}
