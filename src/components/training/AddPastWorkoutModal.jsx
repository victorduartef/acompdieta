import React, { useState } from 'react'

// ── Registrar manualmente um treino de um dia que já passou ──
// (ex: esqueceu de usar o modo Live, ou o treino não foi salvo por algum motivo)
// Props: workoutPlans, allExercises, getExercise, todayKey, onSave(dateKey, log), onClose, T
export default function AddPastWorkoutModal({ workoutPlans, allExercises, getExercise, todayKey, onSave, onClose, T }) {
  const [date, setDate] = useState(todayKey)
  const [planId, setPlanId] = useState(workoutPlans[0]?.id || '')
  const plan = workoutPlans.find(p => p.id === planId)
  const [exercises, setExercises] = useState(() =>
    plan ? plan.exercises.map(ex => ({ exerciseId: ex.exerciseId, sets: [] })) : []
  )
  const [exSearch, setExSearch] = useState('')
  const [showExPicker, setShowExPicker] = useState(false)

  const changePlan = (id) => {
    setPlanId(id)
    const p = workoutPlans.find(x => x.id === id)
    setExercises(p ? p.exercises.map(ex => ({ exerciseId: ex.exerciseId, sets: [] })) : [])
  }

  const addSet = (exIdx) => {
    setExercises(prev => {
      const next = [...prev]
      const lastSet = next[exIdx].sets[next[exIdx].sets.length - 1]
      next[exIdx] = { ...next[exIdx], sets: [...next[exIdx].sets, { weight: lastSet?.weight || 0, reps: lastSet?.reps || 10 }] }
      return next
    })
  }
  const updateSet = (exIdx, setIdx, field, value) => {
    setExercises(prev => {
      const next = [...prev]
      const sets = [...next[exIdx].sets]
      sets[setIdx] = { ...sets[setIdx], [field]: field === 'weight' ? parseFloat(value) || 0 : parseInt(value) || 0 }
      next[exIdx] = { ...next[exIdx], sets }
      return next
    })
  }
  const removeSet = (exIdx, setIdx) => {
    setExercises(prev => {
      const next = [...prev]
      next[exIdx] = { ...next[exIdx], sets: next[exIdx].sets.filter((_, i) => i !== setIdx) }
      return next
    })
  }
  const removeExercise = (exIdx) => setExercises(prev => prev.filter((_, i) => i !== exIdx))
  const addExercise = (exerciseId) => {
    if (exercises.some(e => e.exerciseId === exerciseId)) { setShowExPicker(false); return }
    setExercises(prev => [...prev, { exerciseId, sets: [] }])
    setShowExPicker(false); setExSearch('')
  }

  const canSave = date && date <= todayKey && exercises.some(ex => ex.sets.length > 0)

  const handleSave = () => {
    if (!canSave) return
    const cleanExercises = exercises.filter(ex => ex.sets.length > 0)
    const log = {
      planId: plan?.id || null,
      planName: plan?.name || 'Treino avulso',
      startTime: new Date(date + 'T12:00:00').getTime(),
      endTime: null,
      exercises: cleanExercises,
    }
    onSave(date, log)
  }

  const filteredLibrary = exSearch
    ? allExercises.filter(e => e.name.toLowerCase().includes(exSearch.toLowerCase()) && !exercises.some(ex => ex.exerciseId === e.id))
    : allExercises.filter(e => !exercises.some(ex => ex.exerciseId === e.id))

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: T.surfacePrimary, borderRadius: '16px 16px 0 0', padding: 20, width: '100%', maxWidth: 480, border: `1px solid ${T.border}`, maxHeight: '88vh', overflowY: 'auto' }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: T.textPrimary }}>📅 Registrar treino de um dia anterior</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 10, color: T.textSecondary, marginBottom: 4, fontFamily: 'JetBrains Mono, monospace' }}>DATA</div>
            <input type="date" value={date} max={todayKey} onChange={e => setDate(e.target.value)}
              style={{ width: '100%', background: T.surfaceElevated, border: `1px solid ${T.border}`, borderRadius: 8, padding: '9px 10px', color: T.textPrimary, fontSize: 13, fontFamily: 'JetBrains Mono, monospace' }} />
          </div>
          <div>
            <div style={{ fontSize: 10, color: T.textSecondary, marginBottom: 4, fontFamily: 'JetBrains Mono, monospace' }}>FICHA</div>
            <select value={planId} onChange={e => changePlan(e.target.value)}
              style={{ width: '100%', background: T.surfaceElevated, border: `1px solid ${T.border}`, borderRadius: 8, padding: '9px 10px', color: T.textPrimary, fontSize: 13, fontFamily: 'inherit' }}>
              {workoutPlans.length === 0 && <option value="">Sem fichas</option>}
              {workoutPlans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        {exercises.length === 0 && (
          <div style={{ fontSize: 12, color: T.textMuted, textAlign: 'center', padding: '10px 0 16px' }}>Nenhum exercício ainda — adicione abaixo.</div>
        )}

        {exercises.map((ex, exIdx) => {
          const exInfo = getExercise(ex.exerciseId)
          return (
            <div key={exIdx} style={{ background: T.surfaceElevated, borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary }}>{exInfo?.name || ex.exerciseId}</span>
                <button onClick={() => removeExercise(exIdx)} aria-label={`Remover ${exInfo?.name || 'exercício'}`}
                  style={{ background: T.negativeBackground, border: 'none', borderRadius: 7, width: 26, height: 26, color: T.accentRed, cursor: 'pointer', fontSize: 14 }}>×</button>
              </div>
              {ex.sets.map((set, setIdx) => (
                <div key={setIdx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: T.textMuted, width: 20, fontFamily: 'JetBrains Mono, monospace' }}>#{setIdx + 1}</span>
                  <input type="number" step="0.5" value={set.weight} onChange={e => updateSet(exIdx, setIdx, 'weight', e.target.value)}
                    aria-label={`Peso da série ${setIdx + 1}`}
                    style={{ width: 64, textAlign: 'center', background: T.surfacePrimary, border: `1px solid ${T.border}`, borderRadius: 7, padding: '6px 4px', color: T.textPrimary, fontSize: 13, fontFamily: 'JetBrains Mono, monospace' }} />
                  <span style={{ fontSize: 11, color: T.textMuted }}>kg ×</span>
                  <input type="number" value={set.reps} onChange={e => updateSet(exIdx, setIdx, 'reps', e.target.value)}
                    aria-label={`Repetições da série ${setIdx + 1}`}
                    style={{ width: 54, textAlign: 'center', background: T.surfacePrimary, border: `1px solid ${T.border}`, borderRadius: 7, padding: '6px 4px', color: T.textPrimary, fontSize: 13, fontFamily: 'JetBrains Mono, monospace' }} />
                  <span style={{ fontSize: 11, color: T.textMuted }}>reps</span>
                  <button onClick={() => removeSet(exIdx, setIdx)} aria-label={`Remover série ${setIdx + 1}`}
                    style={{ marginLeft: 'auto', background: 'none', border: 'none', color: T.textMuted, cursor: 'pointer', fontSize: 15 }}>×</button>
                </div>
              ))}
              <button onClick={() => addSet(exIdx)} style={{ width: '100%', padding: '7px', marginTop: 4, border: `1px dashed ${T.border}`, borderRadius: 8, background: 'transparent', color: T.accentPurple, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                + Adicionar série
              </button>
            </div>
          )
        })}

        {!showExPicker ? (
          <button onClick={() => setShowExPicker(true)} style={{ width: '100%', padding: 11, minHeight: 44, border: `1px dashed ${T.accentPurple}66`, borderRadius: 10, background: T.accentPurple + '10', color: T.accentPurple, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 16 }}>
            + Adicionar exercício
          </button>
        ) : (
          <div style={{ background: T.surfaceElevated, borderRadius: 10, padding: 10, marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input autoFocus value={exSearch} onChange={e => setExSearch(e.target.value)} placeholder="Buscar exercício..."
                style={{ flex: 1, background: T.surfacePrimary, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 10px', color: T.textPrimary, fontSize: 13, fontFamily: 'inherit' }} />
              <button onClick={() => { setShowExPicker(false); setExSearch('') }} style={{ background: T.surfacePrimary, border: `1px solid ${T.border}`, borderRadius: 8, padding: '0 12px', color: T.textSecondary, cursor: 'pointer', fontSize: 15 }}>✕</button>
            </div>
            <div style={{ maxHeight: 160, overflowY: 'auto' }}>
              {filteredLibrary.slice(0, 30).map(e => (
                <div key={e.id} onClick={() => addExercise(e.id)} style={{ padding: '8px 10px', borderRadius: 7, cursor: 'pointer', fontSize: 12.5, color: T.textPrimary }}
                  onMouseEnter={(ev) => ev.currentTarget.style.background = T.surfacePrimary}
                  onMouseLeave={(ev) => ev.currentTarget.style.background = 'transparent'}>
                  {e.name}
                </div>
              ))}
              {filteredLibrary.length === 0 && <div style={{ padding: 10, fontSize: 12, color: T.textMuted, textAlign: 'center' }}>Nenhum resultado</div>}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 12, minHeight: 44, background: T.surfaceElevated, border: 'none', borderRadius: 10, color: T.textSecondary, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
          <button onClick={handleSave} disabled={!canSave}
            style={{ flex: 2, padding: 12, minHeight: 44, background: canSave ? `linear-gradient(135deg,${T.accentPurple},${T.accentPurple}cc)` : T.surfaceElevated, border: 'none', borderRadius: 10, color: canSave ? '#fff' : T.textMuted, cursor: canSave ? 'pointer' : 'not-allowed', fontFamily: 'inherit', fontWeight: 700, fontSize: 14 }}>
            Salvar treino
          </button>
        </div>
      </div>
    </div>
  )
}
