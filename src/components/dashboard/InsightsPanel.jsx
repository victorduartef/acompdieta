import React from 'react'

// ── Bloco: Insights determinísticos ──
// Props: insights [{cat, icon, color, title, text, action}], weekLabel, T, onAction
export default function InsightsPanel({ insights, weekLabel, T, onAction }) {
  const colorMap = {
    red: T.accentRed, teal: T.accentTeal, blue: T.accentBlue, purple: T.accentPurple, amber: T.accentAmber,
  }

  return (
    <div style={card(T)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 13, width: 22, height: 22, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.accentAmber + '18', color: T.accentAmber }}>💡</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>Insights</span>
        <span style={{ marginLeft: 'auto', fontSize: 9, color: T.textMuted, fontFamily: 'JetBrains Mono, monospace' }}>{weekLabel}</span>
      </div>

      {insights.length === 0 ? (
        <div style={{ color: T.textMuted, fontSize: 12, padding: '16px 0', textAlign: 'center' }}>
          Registre mais dados para gerar insights da semana.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {insights.map((ins, i) => {
            const c = colorMap[ins.color] || T.accentAmber
            return (
              <div key={i} onClick={() => ins.action && onAction && onAction(ins.action)}
                style={{
                  background: T.surfaceElevated, borderRadius: 9, padding: '9px 11px',
                  borderLeft: `3px solid ${c}`, cursor: ins.action ? 'pointer' : 'default',
                  display: 'flex', gap: 9, alignItems: 'flex-start',
                }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>{ins.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: c, marginBottom: 2 }}>{ins.title}</div>
                  <div style={{ fontSize: 11, color: T.textSecondary, lineHeight: 1.4 }}>{ins.text}</div>
                </div>
                {ins.action && <span style={{ fontSize: 12, color: T.textMuted, flexShrink: 0 }}>›</span>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function card(T) {
  return { background: T.surfacePrimary, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', minWidth: 0 }
}
