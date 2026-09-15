import React from 'react'

// ── Bottom Navigation (mobile) ──
// Props: tab, setTab, onOpenMore, T
const ITEMS = [
  { id: 'today',    label: 'Alimentação', icon: '🍽️' },
  { id: 'treino',   label: 'Treino',      icon: '💪' },
  { id: 'overview', label: 'Visão Geral', icon: '📊' },
  { id: 'peso',     label: 'Corpo',       icon: '🧍' },
  { id: 'more',     label: 'Mais',        icon: '⋯' },
]

export default function BottomNav({ tab, setTab, onOpenMore, moreActive, T }) {
  return (
    <nav aria-label="Navegação principal" style={{
      position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 150,
      background: T.sidebarBackground,
      borderTop: `1px solid ${T.border}`,
      display: 'flex',
      paddingBottom: 'env(safe-area-inset-bottom)',
      boxShadow: '0 -2px 12px rgba(0,0,0,0.25)',
    }}>
      {ITEMS.map(item => {
        const active = item.id === 'more' ? moreActive : tab === item.id
        return (
          <button
            key={item.id}
            onClick={() => item.id === 'more' ? onOpenMore() : setTab(item.id)}
            aria-label={item.label}
            aria-current={active ? 'page' : undefined}
            style={{
              flex: 1, minHeight: 56, border: 'none', background: 'transparent', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
              fontFamily: 'inherit', padding: '6px 0',
              color: active ? T.accentTeal : T.textSecondary,
              position: 'relative',
            }}
          >
            {active && <span style={{ position: 'absolute', top: 0, width: 28, height: 3, borderRadius: 2, background: T.accentTeal }} />}
            <span style={{ fontSize: 19, lineHeight: 1 }}>{item.icon}</span>
            <span style={{ fontSize: 9.5, fontWeight: active ? 700 : 500 }}>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
