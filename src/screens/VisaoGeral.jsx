import React from 'react'
import DashboardCard, { StatCard } from '../components/DashboardCard.jsx'

// ── Visão Geral (Fase 1) — estrutura + placeholders, sem dados reais ainda ──
// Props: T (tema evoshape), isWide, weekLabel, onPrevWeek, onNextWeek, isCurrentWeek
export default function VisaoGeral({ T, isWide, weekLabel = 'Semana atual', onPrevWeek, onNextWeek, isCurrentWeek = true, userName }) {

  // Cartões superiores — cada um com domínio de cor, ainda sem valores
  const topCards = [
    { label: 'Peso médio',   icon: '⚖️', color: T.accentBlue },
    { label: '% Gordura',    icon: '🔥', color: T.accentBlue },
    { label: 'Massa magra',  icon: '💪', color: T.accentBlue },
    { label: 'Kcal médias',  icon: '🍽️', color: T.accentOrange },
    { label: 'Proteína',     icon: '🥩', color: T.accentOrange },
    { label: 'Carboidratos', icon: '🍞', color: T.accentOrange },
    { label: 'Gordura',      icon: '🧈', color: T.accentOrange },
    { label: 'Passos',       icon: '👟', color: T.accentTeal },
    { label: 'Sono',         icon: '😴', color: T.accentPurple },
    { label: 'Nota do sono', icon: '⭐', color: T.accentPurple },
    { label: 'Musculação',   icon: '🏋️', color: T.accentTeal },
    { label: 'Cardio',       icon: '🏃', color: T.accentRed },
  ]

  // Blocos principais
  const placeholderText = 'Indicador será conectado na próxima etapa'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: T.textPrimary }}>
            Boa noite{userName ? `, ${userName}` : ''} 👋
          </div>
          <div style={{ fontSize: 12, color: T.textSecondary, marginTop: 2 }}>Disciplina hoje. Um você mais forte amanhã.</div>
        </div>

        {/* Seletor de semana */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={onPrevWeek} style={navBtn(T)}>‹</button>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10,
            background: T.surfaceElevated, border: `1px solid ${T.border}`,
          }}>
            <span style={{ fontSize: 12 }}>🗓️</span>
            <span style={{ fontSize: 12, color: T.textPrimary, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>{weekLabel}</span>
          </div>
          <button onClick={onNextWeek} disabled={isCurrentWeek} style={{ ...navBtn(T), opacity: isCurrentWeek ? 0.4 : 1, cursor: isCurrentWeek ? 'not-allowed' : 'pointer' }}>›</button>
          {isCurrentWeek && (
            <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, background: T.activeBackground, color: T.accentTeal, fontWeight: 700 }}>Semana atual</span>
          )}
        </div>
      </div>

      {/* Cartões superiores */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isWide ? 'repeat(6, 1fr)' : 'repeat(2, 1fr)',
        gap: 10,
      }}>
        {topCards.map((c, i) => (
          <StatCard key={i} label={c.label} icon={c.icon} accentColor={c.color} T={T} empty />
        ))}
      </div>

      {/* Blocos principais */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isWide ? '1.2fr 1.2fr 1fr' : '1fr',
        gap: 14,
        alignItems: 'start',
      }}>
        <DashboardCard title="Evolução do peso" icon="⚖️" accentColor={T.accentBlue} T={T} empty emptyText={placeholderText} style={{ minHeight: 200 }} />
        <DashboardCard title="Kcal ingeridas" icon="🔥" accentColor={T.accentOrange} T={T} empty emptyText={placeholderText} style={{ minHeight: 200 }} />
        <DashboardCard title="Comparativo de médias" icon="📊" accentColor={T.accentAmber} T={T} empty emptyText={placeholderText} style={{ minHeight: 200 }} />

        <DashboardCard title="Composição corporal" icon="🧬" accentColor={T.accentBlue} T={T} empty emptyText={placeholderText} style={{ minHeight: 180 }} />
        <DashboardCard title="Saúde semanal" icon="❤️" accentColor={T.accentPurple} T={T} empty emptyText={placeholderText} style={{ minHeight: 180 }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <DashboardCard title="Treino" icon="💪" accentColor={T.accentTeal} T={T} empty emptyText={placeholderText} style={{ minHeight: 82 }} />
          <DashboardCard title="Insights" icon="💡" accentColor={T.accentAmber} T={T} empty emptyText={placeholderText} style={{ minHeight: 82 }} />
        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: 10, color: T.textMuted, padding: '4px 0 12px', fontFamily: 'JetBrains Mono, monospace' }}>
        Estrutura da Visão Geral · dados serão conectados na próxima etapa
      </div>
    </div>
  )
}

const navBtn = (T) => ({
  width: 32, height: 32, borderRadius: 8, border: `1px solid ${T.border}`,
  background: T.surfaceElevated, color: T.textSecondary, cursor: 'pointer',
  fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: 'inherit',
})
