import React, { useEffect } from 'react'

// ── Bottom Sheet "Mais" (mobile) ──
// Props: open, onClose, setTab, onOpenMetas, darkMode, toggleDarkMode, user, onLogout, T
const AREAS = [
  { id: 'saude',    label: 'Saúde',     icon: '❤️' },
  { id: 'history',  label: 'Histórico', icon: '📅' },
  { id: 'analysis', label: 'Análises',  icon: '📈' },
  { id: 'foods',    label: 'Alimentos', icon: '🥗' },
]

export default function MoreSheet({ open, onClose, setTab, onOpenMetas, darkMode, toggleDarkMode, user, onLogout, T }) {
  // Escape fecha + bloqueia scroll da página
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prevOverflow }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      role="dialog" aria-modal="true" aria-label="Mais opções"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        animation: 'evoSheetFade .18s ease',
      }}
    >
      <div style={{
        width: '100%', maxWidth: 520, background: T.surfacePrimary,
        borderRadius: '18px 18px 0 0', border: `1px solid ${T.border}`, borderBottom: 'none',
        padding: '10px 16px calc(16px + env(safe-area-inset-bottom))',
        maxHeight: '82vh', overflowY: 'auto',
        animation: 'evoSheetUp .22s cubic-bezier(.2,.8,.2,1)',
      }}>
        {/* handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0 12px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: T.border }} />
        </div>

        {/* Áreas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
          {AREAS.map(a => (
            <button key={a.id} onClick={() => { setTab(a.id); onClose() }}
              style={btn(T)}>
              <span style={{ fontSize: 18 }}>{a.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{a.label}</span>
            </button>
          ))}
          <button onClick={() => { onOpenMetas(); onClose() }} style={{ ...btn(T), gridColumn: '1 / -1' }}>
            <span style={{ fontSize: 18 }}>🎯</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Metas</span>
          </button>
        </div>

        {/* Tema */}
        <button onClick={toggleDarkMode} style={{ ...rowBtn(T), marginBottom: 8 }}>
          <span style={{ fontSize: 16 }}>{darkMode ? '☀️' : '🌙'}</span>
          <span style={{ fontSize: 13 }}>{darkMode ? 'Tema claro' : 'Tema escuro'}</span>
        </button>

        {/* Perfil + sair */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: T.surfaceElevated }}>
          {user?.photoURL
            ? <img src={user.photoURL} alt="" style={{ width: 34, height: 34, borderRadius: '50%' }} />
            : <div style={{ width: 34, height: 34, borderRadius: '50%', background: T.accentTeal + '30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: T.accentTeal, fontWeight: 700 }}>{(user?.displayName || 'U')[0]}</div>}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.displayName || 'Usuário'}</div>
            {user?.email && <div style={{ fontSize: 10, color: T.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>}
          </div>
          {onLogout && <button onClick={() => { onLogout(); onClose() }} style={{ background: T.negativeBackground, border: 'none', borderRadius: 9, padding: '8px 14px', color: T.accentRed, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Sair</button>}
        </div>

        <button onClick={onClose} style={{ width: '100%', padding: 12, marginTop: 10, background: 'transparent', border: 'none', color: T.textMuted, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Fechar</button>
      </div>
    </div>
  )
}

const btn = (T) => ({
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '16px 8px',
  borderRadius: 12, border: `1px solid ${T.border}`, background: T.surfaceElevated,
  color: T.textPrimary, cursor: 'pointer', fontFamily: 'inherit', minHeight: 44,
})
const rowBtn = (T) => ({
  display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '12px', minHeight: 44,
  borderRadius: 12, border: `1px solid ${T.border}`, background: T.surfaceElevated,
  color: T.textSecondary, cursor: 'pointer', fontFamily: 'inherit',
})
