import React, { useState } from 'react'

// ── Editar/excluir um treino já registrado ──
// Props: date, index, log, getExercise, onSave(updatedLog, newDate), onDelete, onClose, T
export default function WorkoutLogEditModal({ date, index, log, getExercise, onSave, onDelete, onClose, T }) {
  const [logDate, setLogDate] = useState(date)
  const [exercises, setExercises] = useState(() => (log.exercises || []).map(ex => ({ ...ex, sets: ex.sets.map(s => ({ ...s })) })))

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
  const removeExercise = (exIdx) => {
    setExercises(prev => prev.filter((_, i) => i !== exIdx))
  }

  const handleSave = () => {
    const cleanExercises = exercises.filter(ex => ex.sets.length > 0)
    const updatedLog = { ...log, exercises: cleanExercises }
    onSave(updatedLog, logDate !== date ? logDate : undefined)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: T.surfacePrimary, borderRadius: '16px 16px 0 0', padding: 20, width: '100%', maxWidth: 480, border: `1px solid ${T.border}`, maxHeight: '88vh', overflowY: 'auto' }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: T.textPrimary }}>✎ Editar treino</div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: T.textSecondary, marginBottom: 4, fontFamily: 'JetBrains Mono, monospace' }}>DATA DO TREINO</div>
          <input type="date" value={logDate} onChange={e => setLogDate(e.target.value)}
            style={{ width: '100%', background: T.surfaceElevated, border: `1px solid ${T.border}`, borderRadius: 8, padding: '9px 12px', color: T.textPrimary, fontSize: 14, fontFamily: 'JetBrains Mono, monospace' }} />
        </div>

        {exercises.length === 0 && (
          <div style={{ fontSize: 12, color: T.textMuted, textAlign: 'center', padding: '16px 0' }}>Nenhum exercício restante — salvar irá remover este treino.</div>
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
            </div>
          )
        })}

        <button onClick={() => { if (window.confirm('Excluir este treino? Esta ação não pode ser desfeita.')) onDelete() }}
          style={{ width: '100%', padding: 11, minHeight: 44, background: T.negativeBackground, border: `1px solid ${T.accentRed}55`, borderRadius: 10, color: T.accentRed, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10, marginTop: 4 }}>
          🗑 Excluir treino inteiro
        </button>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 12, minHeight: 44, background: T.surfaceElevated, border: 'none', borderRadius: 10, color: T.textSecondary, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
          <button onClick={handleSave} style={{ flex: 2, padding: 12, minHeight: 44, background: `linear-gradient(135deg,${T.accentPurple},${T.accentPurple}cc)`, border: 'none', borderRadius: 10, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 14 }}>Salvar alterações</button>
        </div>
      </div>
    </div>
  )
}
