import React, { useState } from 'react'

// ── Painel 2: Kcal ingeridas (barras Seg-Dom) ──
// Props: data {bars:[{date,kcal,goal,isWeekendDay,future}], mean, n, goalMean}, T, onClick, onBarClick
export default function CaloriesChart({ data, T, onClick, onBarClick }) {
  const [hover, setHover] = useState(null)
  const { bars, mean, n, goalMean } = data
  const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

  const W = 320, H = 150, PL = 32, PR = 12, PT = 14, PB = 26

  const allVals = bars.filter(b => b.kcal != null).map(b => b.kcal)
  const allGoals = bars.filter(b => b.goal != null).map(b => b.goal)
  const maxV = Math.max(...(allVals.length ? allVals : [0]), ...(allGoals.length ? allGoals : [0])) * 1.15 || 2000

  const barW = (W - PL - PR) / 7 * 0.62
  const slot = (W - PL - PR) / 7
  const bx = (i) => PL + i * slot + (slot - barW) / 2
  const by = (v) => PT + (1 - v / maxV) * (H - PT - PB)
  const baseY = H - PB

  if (n === 0) {
    return (
      <div onClick={onClick} style={cardStyle(T, !!onClick)}>
        <Header T={T} />
        <div style={{ color: T.textMuted, fontSize: 12, padding: '28px 0', textAlign: 'center' }}>Ainda não há refeições registradas neste período</div>
      </div>
    )
  }

  const meanDiff = (mean != null && goalMean != null) ? mean - goalMean : null

  return (
    <div onClick={onClick} style={cardStyle(T, !!onClick)}>
      <Header T={T} right={<span style={{ fontSize: 15, fontWeight: 800, color: T.textPrimary, fontFamily: 'JetBrains Mono, monospace' }}>{mean?.toLocaleString('pt-BR')} <span style={{ fontSize: 10, color: T.textSecondary }}>kcal/d</span></span>} />

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }} onMouseLeave={() => setHover(null)}>
        {/* grades horizontais */}
        {[0.25, 0.5, 0.75, 1].map((f, i) => (
          <line key={i} x1={PL} y1={PT + f * (H - PT - PB)} x2={W - PR} y2={PT + f * (H - PT - PB)} stroke={T.border} strokeWidth="0.5" opacity="0.4" />
        ))}

        {/* barras */}
        {bars.map((b, i) => {
          if (b.kcal == null) {
            // dia sem registro, futuro, ou hoje aguardando jantar
            if (b.pendingDinner) {
              // hoje com comida mas sem jantar: contorno tracejado (não é total definitivo)
              const ph = (H - PT - PB) * 0.35
              return (
                <g key={i} onMouseEnter={() => setHover(i)} onClick={() => setHover(h => h === i ? null : i)} style={{ cursor: 'pointer' }}>
                  <rect x={bx(i)} y={baseY - ph} width={barW} height={ph} rx="3" fill="none" stroke={T.accentOrange} strokeWidth="1" strokeDasharray="3,2" opacity="0.6" />
                  <text x={bx(i) + barW / 2} y={baseY - ph - 3} fontSize="8" fill={T.accentOrange} textAnchor="middle">⏳</text>
                  <text x={bx(i) + barW / 2} y={baseY + 14} fontSize="7.5" fill={T.accentOrange} textAnchor="middle" fontFamily="JetBrains Mono, monospace">{dias[i]}</text>
                </g>
              )
            }
            return (
              <g key={i}>
                <text x={bx(i) + barW / 2} y={baseY + 14} fontSize="7.5" fill={T.textMuted} textAnchor="middle" fontFamily="JetBrains Mono, monospace">{dias[i]}</text>
                <text x={bx(i) + barW / 2} y={baseY - 3} fontSize="7" fill={T.textMuted} textAnchor="middle" opacity="0.5">{b.future ? '–' : ''}</text>
              </g>
            )
          }
          const color = b.isWeekendDay ? T.accentRed : T.accentBlue
          const h = baseY - by(b.kcal)
          return (
            <g key={i} onMouseEnter={() => setHover(i)} style={{ cursor: 'pointer' }}
              onClick={(e) => { e.stopPropagation(); setHover(h => h === i ? null : i); if (onBarClick) onBarClick(b.date) }}>
              <rect x={bx(i)} y={by(b.kcal)} width={barW} height={Math.max(1, h)} rx="3"
                fill={color} opacity={hover === i ? 1 : 0.85} />
              <text x={bx(i) + barW / 2} y={baseY + 14} fontSize="7.5" fill={b.isWeekendDay ? T.accentRed : T.textMuted} textAnchor="middle" fontFamily="JetBrains Mono, monospace" opacity={b.isWeekendDay ? 0.9 : 1}>{dias[i]}</text>
            </g>
          )
        })}

        {/* linha da meta média (âmbar pontilhada) */}
        {goalMean != null && (
          <g>
            <line x1={PL} y1={by(goalMean)} x2={W - PR} y2={by(goalMean)} stroke={T.accentAmber} strokeWidth="1" strokeDasharray="4,3" opacity="0.9" />
            <text x={W - PR} y={by(goalMean) - 3} fontSize="7" fill={T.accentAmber} textAnchor="end" fontFamily="JetBrains Mono, monospace">meta {goalMean}</text>
          </g>
        )}

        {/* tooltip pending dinner */}
        {hover != null && bars[hover].pendingDinner && (
          <g>
            <rect x={Math.min(bx(hover) - 40, W - 150)} y={PT} width="148" height="16" rx="4" fill={T.surfaceElevated} stroke={T.border} strokeWidth="0.5" />
            <text x={Math.min(bx(hover) - 34, W - 144)} y={PT + 11} fontSize="7" fill={T.accentOrange} fontFamily="JetBrains Mono, monospace">Aguardando registro do jantar</text>
          </g>
        )}
        {/* tooltip */}
        {hover != null && bars[hover].kcal != null && (
          <g>
            <rect x={Math.min(bx(hover) - 20, W - 72)} y={by(bars[hover].kcal) - 30} width="70" height="24" rx="4" fill={T.surfaceElevated} stroke={T.border} strokeWidth="0.5" />
            <text x={Math.min(bx(hover) + barW / 2, W - 37)} y={by(bars[hover].kcal) - 19} fontSize="7.5" fill={T.textPrimary} textAnchor="middle" fontFamily="JetBrains Mono, monospace">{bars[hover].date.slice(5).replace('-', '/')} · {bars[hover].kcal}</text>
            <text x={Math.min(bx(hover) + barW / 2, W - 37)} y={by(bars[hover].kcal) - 10} fontSize="7" fill={T.textSecondary} textAnchor="middle" fontFamily="JetBrains Mono, monospace">meta {bars[hover].goal || '—'}</text>
          </g>
        )}
      </svg>

      {/* legenda */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginTop: 8, fontSize: 10, color: T.textSecondary }}>
        <Legend color={T.accentBlue} label="Dias úteis" />
        <Legend color={T.accentRed} label="Fim de semana" />
        <Legend color={T.accentAmber} label="Meta" dashed />
        <span style={{ marginLeft: 'auto', fontFamily: 'JetBrains Mono, monospace' }}>{n} {n === 1 ? 'dia' : 'dias'}</span>
        {meanDiff != null && (
          <span style={{ fontFamily: 'JetBrains Mono, monospace', color: T.textSecondary }}>
            {meanDiff > 0 ? '+' : ''}{meanDiff} vs meta
          </span>
        )}
      </div>
      {bars.some(b => b.pendingDinner) && (
        <div style={{ fontSize: 9.5, color: T.accentOrange, marginTop: 6, fontFamily: 'JetBrains Mono, monospace' }}>
          ⏳ Hoje ainda não incluído — aguardando registro do jantar
        </div>
      )}
    </div>
  )
}

function Header({ T, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <span style={{ fontSize: 13, width: 22, height: 22, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.accentOrange + '18', color: T.accentOrange }}>🔥</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>Kcal ingeridas</span>
      {right && <span style={{ marginLeft: 'auto' }}>{right}</span>}
    </div>
  )
}

function Legend({ color, label, dashed }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 12, height: dashed ? 0 : 8, borderTop: dashed ? `2px dashed ${color}` : 'none', background: dashed ? 'none' : color, borderRadius: dashed ? 0 : 2, display: 'inline-block' }} />
      {label}
    </span>
  )
}

function cardStyle(T, clickable) {
  return {
    background: T.surfacePrimary, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16,
    boxShadow: '0 1px 3px rgba(0,0,0,0.15)', cursor: clickable ? 'pointer' : 'default',
    display: 'flex', flexDirection: 'column', minWidth: 0,
  }
}
