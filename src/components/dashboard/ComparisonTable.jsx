import React from 'react'
import { formatSleep } from '../../lib/dashboardMetrics.js'

// ── Painel 3: Comparativo de Médias ──
// Props: comp {geral, uteis, fds, comTreino, semTreino} (cada um com {cal,prot,carb,fat,steps,sleep,score}), T
export default function ComparisonTable({ comp, T }) {
  const cols = [
    { key: 'geral',     label: 'Geral' },
    { key: 'uteis',     label: 'Dias úteis' },
    { key: 'fds',       label: 'Fim de sem.' },
    { key: 'comTreino', label: 'Com treino' },
    { key: 'semTreino', label: 'Sem treino' },
  ]
  const rows = [
    { key: 'cal',   label: 'Kcal',        fmt: (v) => v?.toLocaleString('pt-BR'), unit: '' },
    { key: 'prot',  label: 'Proteína',    fmt: (v) => v, unit: 'g' },
    { key: 'carb',  label: 'Carboidr.',   fmt: (v) => v, unit: 'g' },
    { key: 'fat',   label: 'Gordura',     fmt: (v) => v, unit: 'g' },
    { key: 'steps', label: 'Passos',      fmt: (v) => v?.toLocaleString('pt-BR'), unit: '' },
    { key: 'sleep', label: 'Sono',        fmt: (v) => formatSleep(v), unit: '', isSleep: true },
    { key: 'score', label: 'Nota sono',   fmt: (v) => v, unit: '' },
  ]

  const cell = (colKey, row) => {
    const g = comp?.[colKey]?.[row.key]
    if (!g || g.v == null || g.n === 0) return { text: '—', n: 0, low: false }
    const text = `${row.fmt(g.v)}${row.unit ? ' ' + row.unit : ''}`
    return { text, n: g.n, low: g.n <= 1 }
  }

  return (
    <div style={{ background: T.surfacePrimary, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.15)', minWidth: 0, overflowX: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 13, width: 22, height: 22, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.accentAmber + '18', color: T.accentAmber }}>📊</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>Comparativo de médias</span>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'JetBrains Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', fontSize: 9.5, color: T.textMuted, fontWeight: 600, padding: '4px 6px', borderBottom: `1px solid ${T.border}` }}>Indicador</th>
            {cols.map(c => (
              <th key={c.key} title={`Média de ${c.label.toLowerCase()} (só dias com registro)`} style={{ textAlign: 'right', fontSize: 9.5, color: T.textMuted, fontWeight: 600, padding: '4px 6px', borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={row.key} style={{ borderBottom: ri < rows.length - 1 ? `0.5px solid ${T.borderSoft}` : 'none' }}>
              <td style={{ textAlign: 'left', fontSize: 11, color: T.textSecondary, fontWeight: 500, padding: '6px', fontFamily: "'Syne', sans-serif" }}>{row.label}</td>
              {cols.map(c => {
                const cl = cell(c.key, row)
                return (
                  <td key={c.key} title={cl.n > 0 ? `n=${cl.n} ${cl.n === 1 ? 'registro' : 'registros'}` : 'Sem registros'}
                    style={{ textAlign: 'right', fontSize: 11, color: cl.text === '—' ? T.textMuted : T.textPrimary, padding: '6px', whiteSpace: 'nowrap', opacity: cl.low ? 0.7 : 1 }}>
                    {cl.text}
                    {cl.low && cl.text !== '—' && <span style={{ fontSize: 8, color: T.accentAmber, marginLeft: 2 }} title="Amostra pequena">•</span>}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ fontSize: 9, color: T.textMuted, marginTop: 8, fontFamily: 'JetBrains Mono, monospace' }}>
        Médias só de dias com registro · <span style={{ color: T.accentAmber }}>•</span> amostra pequena (≤1)
      </div>
    </div>
  )
}
