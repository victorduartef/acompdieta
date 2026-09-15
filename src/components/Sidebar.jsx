import React, { useState } from 'react'

// ── Sidebar vertical (desktop) do redesign ──
// Props: tab, setTab, onOpenMetas, darkMode, toggleDarkMode, user, onLogout, T
const NAV_ITEMS = [
  { id: 'overview', label: 'Visão Geral', icon: '📊' },
  { id: 'today',    label: 'Alimentação', icon: '🍽️' },
  { id: 'treino',   label: 'Treino',      icon: '💪' },
  { id: 'peso',     label: 'Corpo',       icon: '🧍' },
  { id: 'saude',    label: 'Saúde',       icon: '❤️' },
  { id: 'history',  label: 'Histórico',   icon: '📅' },
  { id: 'analysis', label: 'Análises',    icon: '📈' },
  { id: 'foods',    label: 'Alimentos',   icon: '🥗' },
]

function NavButton({ item, active, onClick, T, compact }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-label={item.label}
      aria-current={active ? 'page' : undefined}
      title={compact ? item.label : undefined}
      style={{
        display: 'flex', alignItems: 'center', gap: compact ? 0 : 11, width: '100%', minHeight: 44,
        padding: compact ? '11px 0' : '10px 12px', borderRadius: 10, cursor: 'pointer',
        justifyContent: compact ? 'center' : 'flex-start',
        border: active ? `1px solid ${T.accentTeal}40` : '1px solid transparent',
        background: active ? T.activeBackground : hover ? T.surfaceHover : 'transparent',
        color: active ? T.textPrimary : T.textSecondary,
        fontFamily: 'inherit', fontSize: 13, fontWeight: active ? 600 : 500,
        transition: 'background .15s, color .15s, border-color .15s',
        textAlign: 'left', position: 'relative',
      }}
    >
      <span style={{ fontSize: compact ? 18 : 15, width: 20, textAlign: 'center', filter: active ? 'none' : 'grayscale(0.3)', opacity: active ? 1 : 0.85 }}>{item.icon}</span>
      {!compact && <span>{item.label}</span>}
      {!compact && active && <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: T.accentTeal }} />}
      {compact && active && <span style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 20, borderRadius: 2, background: T.accentTeal }} />}
    </button>
  )
}

export default function Sidebar({ tab, setTab, onOpenMetas, darkMode, toggleDarkMode, user, onLogout, T, compact }) {
  return (
    <div style={{
      width: compact ? 60 : 196, flexShrink: 0, background: T.sidebarBackground,
      borderRight: `1px solid ${T.border}`, height: '100vh', position: 'sticky', top: 0,
      display: 'flex', flexDirection: 'column', padding: compact ? '16px 8px' : '18px 12px',
      transition: 'width .2s',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: compact ? 0 : '0 8px', marginBottom: 22, justifyContent: compact ? 'center' : 'flex-start' }}>
        <img src="/icon-512.png" alt="EvoShape" style={{ width: 28, height: 28, borderRadius: 8 }} />
        {!compact && (
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: T.textPrimary, letterSpacing: 1, lineHeight: 1 }}>EVOSHAPE</div>
            <div style={{ fontSize: 8, color: T.textMuted, letterSpacing: 2, marginTop: 2 }}>DISCIPLINA EVOLUI VOCÊ</div>
          </div>
        )}
      </div>

      {/* Navegação */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
        {NAV_ITEMS.map(item => (
          <NavButton key={item.id} item={item} active={tab === item.id} onClick={() => setTab(item.id)} T={T} compact={compact} />
        ))}
        <NavButton item={{ id: 'metas', label: 'Metas', icon: '🎯' }} active={false} onClick={onOpenMetas} T={T} compact={compact} />
      </div>

      {/* Rodapé: tema + usuário + sair */}
      <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12, marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8, alignItems: compact ? 'center' : 'stretch' }}>
        <button onClick={toggleDarkMode} aria-label={darkMode ? 'Tema claro' : 'Tema escuro'} title={compact ? (darkMode ? 'Tema claro' : 'Tema escuro') : undefined} style={{
          display: 'flex', alignItems: 'center', gap: compact ? 0 : 10, width: '100%', minHeight: 44, padding: compact ? '8px 0' : '8px 12px', borderRadius: 10,
          justifyContent: compact ? 'center' : 'flex-start',
          border: '1px solid transparent', background: 'transparent', color: T.textSecondary, cursor: 'pointer',
          fontFamily: 'inherit', fontSize: 12,
        }}>
          <span style={{ fontSize: 14 }}>{darkMode ? '☀️' : '🌙'}</span>
          {!compact && <span>{darkMode ? 'Tema claro' : 'Tema escuro'}</span>}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: compact ? 0 : '4px 12px', justifyContent: compact ? 'center' : 'flex-start' }}>
          {user?.photoURL
            ? <img src={user.photoURL} alt="" title={compact ? user?.displayName : undefined} style={{ width: 26, height: 26, borderRadius: '50%' }} />
            : <div title={compact ? user?.displayName : undefined} style={{ width: 26, height: 26, borderRadius: '50%', background: T.accentTeal + '30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: T.accentTeal, fontWeight: 700 }}>{(user?.displayName || 'U')[0]}</div>}
          {!compact && <>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: T.textPrimary, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.displayName?.split(' ')[0] || 'Usuário'}</div>
            </div>
            {onLogout && <button onClick={onLogout} style={{ background: 'none', border: 'none', color: T.textMuted, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', minHeight: 32, padding: '6px 4px' }}>Sair</button>}
          </>}
        </div>
      </div>
    </div>
  )
}
