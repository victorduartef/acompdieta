import React, { useState } from 'react'

// ── Painel 1: Evolução do Peso (semana Seg-Dom) ──
// Props: series {points:[{date,weight}], mean, n}, prevMean, T, onClick
export default function WeightChart({ series, prevMean, T, onClick }) {
  const [hover, setHover] = useState(null)
  const { points, mean, n } = series

  const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
  const W = 320, H = 150, PL = 30, PR = 12, PT = 14, PB = 26

  const withData = points.filter(p => p.weight != null)
  const vals = withData.map(p => p.weight)

  if (n === 0) {
    return <Empty T={T} text="Ainda não há pesagens neste período" onClick={onClick} />
  }

  const maxV = Math.max(...vals) + 0.4
  const minV = Math.min(...vals) - 0.4
  const range = Math.max(0.1, maxV - minV)
  const cx = (i) => PL + (i / 6) * (W - PL - PR)
  const cy = (v) => PT + (1 - (v - minV) / range) * (H - PT - PB)

  // Segmentos de linha: só conecta dias adjacentes; se houver lacuna >1 dia entre pontos, não conecta enganosamente
  const segs = []
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i], b = points[i + 1]
    if (a.weight != null && b.weight != null) segs.push([i, i + 1])
  }
  // Também conectar pontos com 1 dia de gap? Não — regra: não conectar sequência longa sem medições.
  // Conectamos apenas dias consecutivos com dado. Para lacuna de 1 dia, ligamos com tracejado leve.
  const gapSegs = []
  let last = null
  points.forEach((p, i) => {
    if (p.weight != null) {
      if (last != null && i - last > 1) gapSegs.push([last, i])
      last = i
    }
  })

  const lastReg = [...withData].pop()
  const meanY = cy(mean)
  const delta = (prevMean != null && mean != null) ? mean - prevMean : null

  return (
    <div onClick={onClick} style={cardStyle(T, !!onClick)}>
      <Header T={T} title="Evolução do peso" icon="⚖️" accent={T.accentBlue}
        right={lastReg && <span style={{ fontSize: 15, fontWeight: 800, color: T.textPrimary, fontFamily: 'JetBrains Mono, monospace' }}>{lastReg.weight.toFixed(1)} <span style={{ fontSize: 10, color: T.textSecondary }}>kg</span></span>} />

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }} onMouseLeave={() => setHover(null)}>
        {/* Eixo Y (kg) */}
        {[maxV, (maxV + minV) / 2, minV].map((v, i) => (
          <g key={i}>
            <line x1={PL} y1={cy(v)} x2={W - PR} y2={cy(v)} stroke={T.border} strokeWidth="0.5" opacity="0.5" />
            <text x={PL - 4} y={cy(v) + 3} fontSize="7" fill={T.textMuted} textAnchor="end" fontFamily="JetBrains Mono, monospace">{v.toFixed(1)}</text>
          </g>
        ))}
        {/* Linha média */}
        {mean != null && (
          <line x1={PL} y1={meanY} x2={W - PR} y2={meanY} stroke={T.accentTeal} strokeWidth="1" strokeDasharray="4,3" opacity="0.8" />
        )}
        {/* Segmentos consecutivos */}
        {segs.map(([a, b], i) => (
          <line key={'s' + i} x1={cx(a)} y1={cy(points[a].weight)} x2={cx(b)} y2={cy(points[b].weight)} stroke={T.accentBlue} strokeWidth="2" strokeLinecap="round" />
        ))}
        {/* Gaps de 1 dia: tracejado leve */}
        {gapSegs.map(([a, b], i) => (
          <line key={'g' + i} x1={cx(a)} y1={cy(points[a].weight)} x2={cx(b)} y2={cy(points[b].weight)} stroke={T.accentBlue} strokeWidth="1.5" strokeDasharray="2,3" opacity="0.5" />
        ))}
        {/* Pontos + eixo X */}
        {points.map((p, i) => (
          <g key={i}>
            {p.weight != null && (
              <circle cx={cx(i)} cy={cy(p.weight)} r={hover === i ? 4.5 : 3.5} fill={T.accentBlue}
                onMouseEnter={() => setHover(i)} onClick={() => setHover(h => h === i ? null : i)} style={{ cursor: 'pointer' }} />
            )}
            <text x={cx(i)} y={H - 8} fontSize="7.5" fill={T.textMuted} textAnchor="middle" fontFamily="JetBrains Mono, monospace">{dias[i]}</text>
          </g>
        ))}
        {/* Tooltip */}
        {hover != null && points[hover].weight != null && (
          <g>
            <rect x={Math.min(cx(hover) - 26, W - 56)} y={cy(points[hover].weight) - 26} width="52" height="18" rx="4" fill={T.surfaceElevated} stroke={T.border} strokeWidth="0.5" />
            <text x={Math.min(cx(hover), W - 30)} y={cy(points[hover].weight) - 13} fontSize="8" fill={T.textPrimary} textAnchor="middle" fontFamily="JetBrains Mono, monospace">{points[hover].date.slice(5).replace('-', '/')} · {points[hover].weight.toFixed(1)}</text>
          </g>
        )}
      </svg>

      {/* Legenda + info */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginTop: 8, fontSize: 10, color: T.textSecondary }}>
        <Legend color={T.accentBlue} label="Peso diário" />
        <Legend color={T.accentTeal} label="Média da semana" dashed />
        <span style={{ marginLeft: 'auto', fontFamily: 'JetBrains Mono, monospace' }}>{n} {n === 1 ? 'medição' : 'medições'}</span>
        {delta != null && (
          <span style={{ fontFamily: 'JetBrains Mono, monospace', color: T.textSecondary }}>
            média {delta > 0 ? '+' : ''}{delta.toFixed(1)} kg vs ant.
          </span>
        )}
      </div>
      {n === 1 && <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>Apenas uma medição nesta semana</div>}
    </div>
  )
}

function Empty({ T, text, onClick }) {
  return (
    <div onClick={onClick} style={cardStyle(T, !!onClick)}>
      <Header T={T} title="Evolução do peso" icon="⚖️" accent={T.accentBlue} />
      <div style={{ color: T.textMuted, fontSize: 12, padding: '28px 0', textAlign: 'center' }}>{text}</div>
    </div>
  )
}

function Header({ T, title, icon, accent, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <span style={{ fontSize: 13, width: 22, height: 22, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: accent + '18', color: accent }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>{title}</span>
      {right && <span style={{ marginLeft: 'auto' }}>{right}</span>}
    </div>
  )
}

function Legend({ color, label, dashed }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 14, height: 0, borderTop: `2px ${dashed ? 'dashed' : 'solid'} ${color}`, display: 'inline-block' }} />
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
