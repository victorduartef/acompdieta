import React from 'react'

// ── Navegação interna do módulo Treino (5 itens) ──
// Desktop: segmented control horizontal. Mobile: rolagem horizontal, item ativo sempre visível.
const ITEMS = [
  { id: 'resumo', label: 'Resumo', icon: '📊' },
  { id: 'fichas', label: 'Fichas', icon: '📋' },
  { id: 'exercicios', label: 'Exercícios', icon: '🏋️' },
  { id: 'evolucao', label: 'Evolução', icon: '📈' },
  { id: 'mapa', label: 'Mapa muscular', icon: '🗺️' },
]

export default function TrainingNavigation({ active, onChange, T, isMobile }) {
  return (
    <div role="tablist" aria-label="Seções do Treino"
      style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 2 }}>
      {ITEMS.map(item => {
        const selected = active === item.id
        return (
          <button
            key={item.id}
            role="tab"
            aria-selected={selected}
            aria-current={selected ? 'page' : undefined}
            onClick={() => onChange(item.id)}
            style={{
              flexShrink: 0, minWidth: isMobile ? 96 : 110, minHeight: 44,
              padding: '9px 14px', border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 12.5, fontWeight: selected ? 700 : 500,
              background: selected ? T.activeBackground : T.surfaceElevated,
              color: selected ? T.accentPurple : T.textSecondary,
              border: selected ? `1px solid ${T.accentPurple}55` : `1px solid transparent`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ fontSize: 13 }}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}
