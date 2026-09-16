import React, { useState, useEffect } from 'react'

// ── Cartão de treino em andamento (só leitura de liveSession — lógica do treino ao vivo intocada) ──
// Props: liveSession {planId,startTime,exercises,currentIdx}, planName, getExercise, onContinue, T
export default function ActiveWorkoutCard({ liveSession, planName, getExercise, onContinue, T }) {
  const [, setTick] = useState(0)
  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(iv)
  }, [])

  if (!liveSession) return null

  const elapsedMs = Date.now() - liveSession.startTime
  const mins = Math.floor(elapsedMs / 60000)
  const secs = Math.floor((elapsedMs % 60000) / 1000)
  const startedAt = new Date(liveSession.startTime)
  const startLabel = `${String(startedAt.getHours()).padStart(2, '0')}:${String(startedAt.getMinutes()).padStart(2, '0')}`

  const currentEx = liveSession.exercises?.[liveSession.currentIdx]
  const currentExName = currentEx ? getExercise(currentEx.exerciseId)?.name : null

  return (
    <div style={{
      background: `linear-gradient(135deg, ${T.accentPurple}22, ${T.accentPurple}0a)`,
      border: `1px solid ${T.accentPurple}55`, borderRadius: 12, padding: 15, marginBottom: 14,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: T.accentPurple, display: 'inline-block' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: T.accentPurple, textTransform: 'uppercase', letterSpacing: 0.5 }}>Treino em andamento</span>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: T.textPrimary, fontFamily: 'JetBrains Mono, monospace' }}>{mins}:{String(secs).padStart(2, '0')}</span>
      </div>
      <div style={{ fontSize: 15, fontWeight: 800, color: T.textPrimary, marginBottom: 2 }}>{planName || 'Treino'}</div>
      <div style={{ fontSize: 11.5, color: T.textSecondary, marginBottom: currentExName ? 4 : 12 }}>Iniciado às {startLabel}</div>
      {currentExName && <div style={{ fontSize: 11.5, color: T.textSecondary, marginBottom: 12 }}>Exercício atual: <span style={{ color: T.textPrimary, fontWeight: 600 }}>{currentExName}</span></div>}
      <button onClick={onContinue}
        style={{ width: '100%', padding: 12, minHeight: 44, background: `linear-gradient(135deg,${T.accentPurple},${T.accentPurple}cc)`, border: 'none', borderRadius: 10, color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
        ▶ Continuar treino
      </button>
    </div>
  )
}
