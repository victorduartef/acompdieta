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

function NavButton({ item, active, onClick, T }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 11, width: '100%',
        padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
        border: active ? `1px solid ${T.accentTeal}40` : '1px solid transparent',
        background: active ? T.activeBackground : hover ? T.surfaceHover : 'transparent',
        color: active ? T.textPrimary : T.textSecondary,
        fontFamily: 'inherit', fontSize: 13, fontWeight: active ? 600 : 500,
        transition: 'background .15s, color .15s, border-color .15s',
        textAlign: 'left',
      }}
    >
      <span style={{ fontSize: 15, width: 20, textAlign: 'center', filter: active ? 'none' : 'grayscale(0.3)', opacity: active ? 1 : 0.85 }}>{item.icon}</span>
      <span>{item.label}</span>
      {active && <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: T.accentTeal }} />}
    </button>
  )
}

export default function Sidebar({ tab, setTab, onOpenMetas, darkMode, toggleDarkMode, user, onLogout, T }) {
  return (
    <div style={{
      width: 216, flexShrink: 0, background: T.sidebarBackground,
      borderRight: `1px solid ${T.border}`, height: '100vh', position: 'sticky', top: 0,
      display: 'flex', flexDirection: 'column', padding: '18px 12px',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px', marginBottom: 22 }}>
        <img src="/icon-512.png" alt="" style={{ width: 28, height: 28, borderRadius: 8 }} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: T.textPrimary, letterSpacing: 1, lineHeight: 1 }}>EVOSHAPE</div>
          <div style={{ fontSize: 8, color: T.textMuted, letterSpacing: 2, marginTop: 2 }}>DISCIPLINA EVOLUI VOCÊ</div>
        </div>
      </div>

      {/* Navegação */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
        {NAV_ITEMS.map(item => (
          <NavButton key={item.id} item={item} active={tab === item.id} onClick={() => setTab(item.id)} T={T} />
        ))}
        {/* Metas abre o modal existente */}
        <NavButton item={{ id: 'metas', label: 'Metas', icon: '🎯' }} active={false} onClick={onOpenMetas} T={T} />
      </div>

      {/* Rodapé: tema + usuário + sair */}
      <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12, marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button onClick={toggleDarkMode} style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 12px', borderRadius: 10,
          border: '1px solid transparent', background: 'transparent', color: T.textSecondary, cursor: 'pointer',
          fontFamily: 'inherit', fontSize: 12,
        }}>
          <span style={{ fontSize: 14 }}>{darkMode ? '☀️' : '🌙'}</span>
          <span>{darkMode ? 'Tema claro' : 'Tema escuro'}</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px' }}>
          {user?.photoURL
            ? <img src={user.photoURL} alt="" style={{ width: 26, height: 26, borderRadius: '50%' }} />
            : <div style={{ width: 26, height: 26, borderRadius: '50%', background: T.accentTeal + '30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: T.accentTeal, fontWeight: 700 }}>{(user?.displayName || 'U')[0]}</div>}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: T.textPrimary, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.displayName?.split(' ')[0] || 'Usuário'}</div>
          </div>
          {onLogout && <button onClick={onLogout} style={{ background: 'none', border: 'none', color: T.textMuted, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>Sair</button>}
        </div>
      </div>
    </div>
  )
}
