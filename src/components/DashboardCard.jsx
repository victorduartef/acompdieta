import React, { useState } from 'react'

// ── DashboardCard — cartão reutilizável do redesign ──
// Props: title, icon, accentColor, children, onClick, loading, empty, T (tema evoshape)
export default function DashboardCard({ title, icon, accentColor, children, onClick, loading, empty, emptyText, T, style }) {
  const [hover, setHover] = useState(false)
  const clickable = typeof onClick === 'function'

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      tabIndex={clickable ? 0 : undefined}
      role={clickable ? 'button' : undefined}
      style={{
        background: hover && clickable ? T.surfaceHover : T.surfacePrimary,
        border: `1px solid ${T.border}`,
        borderRadius: 12,
        padding: 16,
        boxShadow: hover && clickable ? '0 4px 16px rgba(0,0,0,0.25)' : '0 1px 3px rgba(0,0,0,0.15)',
        cursor: clickable ? 'pointer' : 'default',
        transition: 'background .15s, box-shadow .15s, border-color .15s',
        outline: 'none',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        ...style,
      }}
      onFocus={(e) => { e.currentTarget.style.borderColor = accentColor || T.accentTeal }}
      onBlur={(e) => { e.currentTarget.style.borderColor = T.border }}
    >
      {(title || icon) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: children ? 12 : 0 }}>
          {icon && (
            <span style={{
              fontSize: 13, width: 22, height: 22, borderRadius: 6, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: (accentColor || T.accentTeal) + '18', color: accentColor || T.accentTeal,
            }}>{icon}</span>
          )}
          {title && (
            <span style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary, letterSpacing: 0.2 }}>{title}</span>
          )}
        </div>
      )}

      {loading ? (
        <div style={{ color: T.textMuted, fontSize: 12, padding: '8px 0', fontFamily: 'JetBrains Mono, monospace' }}>
          Carregando dados da semana…
        </div>
      ) : empty ? (
        <div style={{ color: T.textMuted, fontSize: 12, padding: '8px 0' }}>
          {emptyText || 'Ainda não há dados para este período'}
        </div>
      ) : children}
    </div>
  )
}

// ── StatCard — cartão compacto de indicador (topo do dashboard) ──
// Props: label, icon, accentColor, value, unit, delta, sparkline (nós SVG opcional), T, loading, empty
export function StatCard({ label, icon, accentColor, value, unit, deltaText, deltaColor, footer, T, loading, empty }) {
  const [hover, setHover] = useState(false)
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: T.surfacePrimary,
        border: `1px solid ${T.border}`,
        borderRadius: 12,
        padding: 14,
        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
        display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0,
        transition: 'background .15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {icon && <span style={{ fontSize: 12, color: accentColor || T.accentTeal }}>{icon}</span>}
        <span style={{ fontSize: 11, color: T.textSecondary, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
      </div>

      {loading ? (
        <div style={{ color: T.textMuted, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>…</div>
      ) : empty ? (
        <div style={{ color: T.textMuted, fontSize: 16, fontWeight: 700 }}>—</div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: T.textPrimary, fontFamily: 'JetBrains Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{value ?? '—'}</span>
            {unit && <span style={{ fontSize: 11, color: T.textSecondary }}>{unit}</span>}
          </div>
          {(deltaText || footer) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {deltaText && <span style={{ fontSize: 10, fontWeight: 700, color: deltaColor || T.textMuted, fontFamily: 'JetBrains Mono, monospace' }}>{deltaText}</span>}
              {footer && <span style={{ fontSize: 10, color: T.textMuted }}>{footer}</span>}
            </div>
          )}
        </>
      )}
    </div>
  )
}
