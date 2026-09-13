import React, { useState } from 'react'

// ── Bloco: Composição corporal (4 semanas) ──
// Props: weeks [{label,weight,bodyFat,leanMass,fatMass,nBody}], T, onClick
export default function BodyCompositionChart({ weeks, T, onClick }) {
  const [hover, setHover] = useState(null)
  const withData = weeks.filter(w => w.nBody > 0 || w.nWeight > 0)

  if (withData.length === 0) {
    return (
      <div onClick={onClick} style={card(T, !!onClick)}>
        <Header T={T} />
        <div style={{ color: T.textMuted, fontSize: 12, padding: '24px 0', textAlign: 'center' }}>Ainda não há medições corporais suficientes neste período.</div>
      </div>
    )
  }

  const W = 320, H = 132, PL = 28, PR = 30, PT = 12, PB = 24
  const leanVals = weeks.map(w => w.leanMass).filter(v => v != null)
  const fatVals = weeks.map(w => w.fatMass).filter(v => v != null)
  const kgVals = [...leanVals, ...fatVals]
  const maxKg = kgVals.length ? Math.max(...kgVals) * 1.1 : 70
  const fatPctVals = weeks.map(w => w.bodyFat).filter(v => v != null)
  const maxPct = fatPctVals.length ? Math.max(...fatPctVals) + 3 : 20
  const minPct = fatPctVals.length ? Math.max(0, Math.min(...fatPctVals) - 3) : 0

  const slot = (W - PL - PR) / 4
  const groupW = slot * 0.6
  const barW = groupW / 2
  const gx = (i) => PL + i * slot + (slot - groupW) / 2
  const byKg = (v) => PT + (1 - v / maxKg) * (H - PT - PB)
  const byPct = (v) => PT + (1 - (v - minPct) / (maxPct - minPct || 1)) * (H - PT - PB)
  const baseY = H - PB

  // linha de % gordura
  const fatPts = weeks.map((w, i) => w.bodyFat != null ? { x: gx(i) + groupW / 2, y: byPct(w.bodyFat), i } : null).filter(Boolean)
  const fatSegs = []
  for (let i = 0; i < fatPts.length - 1; i++) fatSegs.push([fatPts[i], fatPts[i + 1]])

  // Resumo de variação de gordura
  const summary = (() => {
    const wf = weeks.filter(w => w.bodyFat != null)
    if (wf.length < 2) return 'Amostra insuficiente para tendência'
    const diff = Math.round((wf[wf.length - 1].bodyFat - wf[0].bodyFat) * 10) / 10
    if (Math.abs(diff) < 0.3) return 'Sem variação relevante nas últimas 4 semanas'
    return `${diff > 0 ? '+' : ''}${diff} pp de gordura nas últimas 4 semanas`
  })()

  return (
    <div onClick={onClick} style={card(T, !!onClick)}>
      <Header T={T} />
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }} onMouseLeave={() => setHover(null)}>
        {/* eixo kg esq */}
        {[maxKg, maxKg / 2, 0].map((v, i) => (
          <text key={i} x={PL - 4} y={byKg(v) + 3} fontSize="6.5" fill={T.textMuted} textAnchor="end" fontFamily="JetBrains Mono, monospace">{Math.round(v)}</text>
        ))}
        {/* barras massa magra + gordura */}
        {weeks.map((w, i) => (
          <g key={i} onMouseEnter={() => setHover(i)} style={{ cursor: 'pointer' }}>
            {w.leanMass != null && (
              <rect x={gx(i)} y={byKg(w.leanMass)} width={barW} height={Math.max(1, baseY - byKg(w.leanMass))} rx="2" fill={T.accentTeal} opacity={hover === i ? 1 : 0.85} />
            )}
            {w.fatMass != null && (
              <rect x={gx(i) + barW} y={byKg(w.fatMass)} width={barW} height={Math.max(1, baseY - byKg(w.fatMass))} rx="2" fill={T.accentRed} opacity={hover === i ? 1 : 0.75} />
            )}
            <text x={gx(i) + groupW / 2} y={H - 8} fontSize="7" fill={T.textMuted} textAnchor="middle" fontFamily="JetBrains Mono, monospace">{w.label}</text>
          </g>
        ))}
        {/* linha % gordura */}
        {fatSegs.map(([a, b], i) => (
          <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={T.accentBlue} strokeWidth="1.5" />
        ))}
        {fatPts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={T.accentBlue} />)}
        {/* eixo % dir */}
        {[maxPct, (maxPct + minPct) / 2, minPct].map((v, i) => (
          <text key={i} x={W - PR + 4} y={byPct(v) + 3} fontSize="6.5" fill={T.accentBlue} textAnchor="start" fontFamily="JetBrains Mono, monospace" opacity="0.7">{v.toFixed(0)}%</text>
        ))}
        {/* tooltip */}
        {hover != null && (weeks[hover].nBody > 0 || weeks[hover].nWeight > 0) && (
          <g>
            <rect x={Math.min(gx(hover) - 10, W - 96)} y={4} width="92" height="46" rx="4" fill={T.surfaceElevated} stroke={T.border} strokeWidth="0.5" />
            <text x={Math.min(gx(hover) - 5, W - 91)} y={15} fontSize="7" fill={T.textPrimary} fontFamily="JetBrains Mono, monospace">{weeks[hover].label}</text>
            <text x={Math.min(gx(hover) - 5, W - 91)} y={24} fontSize="6.5" fill={T.textSecondary} fontFamily="JetBrains Mono, monospace">Peso {weeks[hover].weight ?? '—'} · Gord {weeks[hover].bodyFat ?? '—'}%</text>
            <text x={Math.min(gx(hover) - 5, W - 91)} y={33} fontSize="6.5" fill={T.textSecondary} fontFamily="JetBrains Mono, monospace">Magra {weeks[hover].leanMass ?? '—'} · Gord.kg {weeks[hover].fatMass ?? '—'}</text>
            <text x={Math.min(gx(hover) - 5, W - 91)} y={42} fontSize="6.5" fill={T.textMuted} fontFamily="JetBrains Mono, monospace">{weeks[hover].nBody} med.</text>
          </g>
        )}
      </svg>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginTop: 6, fontSize: 9.5, color: T.textSecondary }}>
        <Leg color={T.accentTeal} label="Massa magra" />
        <Leg color={T.accentRed} label="Massa gorda" />
        <Leg color={T.accentBlue} label="% Gordura" line />
      </div>
      <div style={{ fontSize: 10.5, color: T.textPrimary, marginTop: 6, fontWeight: 600 }}>{summary}</div>
    </div>
  )
}

function Header({ T }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <span style={{ fontSize: 13, width: 22, height: 22, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.accentBlue + '18', color: T.accentBlue }}>🧬</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>Composição corporal</span>
      <span style={{ marginLeft: 'auto', fontSize: 9, color: T.textMuted, fontFamily: 'JetBrains Mono, monospace' }}>4 semanas</span>
    </div>
  )
}
function Leg({ color, label, line }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><span style={{ width: line ? 12 : 8, height: line ? 0 : 8, borderTop: line ? `2px solid ${color}` : 'none', background: line ? 'none' : color, borderRadius: 2, display: 'inline-block' }} />{label}</span>
}
function card(T, clickable) {
  return { background: T.surfacePrimary, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.15)', cursor: clickable ? 'pointer' : 'default', display: 'flex', flexDirection: 'column', minWidth: 0 }
}
