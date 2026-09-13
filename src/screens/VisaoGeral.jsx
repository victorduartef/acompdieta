import React, { useState } from 'react'
import DashboardCard, { StatCard } from '../components/DashboardCard.jsx'
import { formatSleep } from '../lib/dashboardMetrics.js'

// ── Visão Geral (Fase 2) — 12 KPIs conectados + seletor semanal ──
// Props: T, isWide, userName, weekLabel, isCurrentWeekFlag, isPartial, onPrevWeek, onNextWeek, onResetWeek,
//        kpis (semana selecionada), prevKpis (semana anterior p/ comparação), targets
export default function VisaoGeral({
  T, isWide, userName, weekLabel, isCurrentWeekFlag, isPartial,
  onPrevWeek, onNextWeek, onResetWeek, kpis, prevKpis, targets,
}) {
  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Bom dia'
    if (h < 18) return 'Boa tarde'
    return 'Boa noite'
  })()

  // Descrição de cada KPI: como formatar valor, unidade, cor de domínio, delta e semântica
  // deltaMode: 'raw' | 'pp' | 'int' | 'minutes' | 'count' ; goodDir: 'up'|'down'|'neutral'
  const defs = [
    { key:'weight',     label:'Peso médio',   icon:'⚖️', color:T.accentBlue,   unit:'kg', fmt:(v)=>v?.toFixed(1), deltaMode:'raw', decimals:1, goodDir:'neutral' },
    { key:'bodyFat',    label:'% Gordura',    icon:'🔥', color:T.accentBlue,   unit:'%',  fmt:(v)=>v?.toFixed(1), deltaMode:'pp', decimals:1, goodDir:'down' },
    { key:'leanMass',   label:'Massa magra',  icon:'💪', color:T.accentBlue,   unit:'kg', fmt:(v)=>v?.toFixed(1), deltaMode:'raw', decimals:1, goodDir:'up' },
    { key:'cal',        label:'Kcal médias',  icon:'🍽️', color:T.accentOrange, unit:'kcal', fmt:(v)=>v?.toLocaleString('pt-BR'), deltaMode:'int', goodDir:'neutral' },
    { key:'prot',       label:'Proteína',     icon:'🥩', color:T.accentOrange, unit:'g',  fmt:(v)=>v, deltaMode:'int', goodDir:'neutral' },
    { key:'carb',       label:'Carboidratos', icon:'🍞', color:T.accentOrange, unit:'g',  fmt:(v)=>v, deltaMode:'int', goodDir:'neutral' },
    { key:'fat',        label:'Gordura',      icon:'🧈', color:T.accentOrange, unit:'g',  fmt:(v)=>v, deltaMode:'int', goodDir:'neutral' },
    { key:'steps',      label:'Passos',       icon:'👟', color:T.accentTeal,   unit:'',   fmt:(v)=>v?.toLocaleString('pt-BR'), deltaMode:'int', goodDir:'up' },
    { key:'sleep',      label:'Sono',         icon:'😴', color:T.accentPurple, unit:'',   fmt:(v)=>formatSleep(v), deltaMode:'minutes', goodDir:'up', isSleep:true },
    { key:'sleepScore', label:'Nota do sono', icon:'⭐', color:T.accentPurple, unit:'',   fmt:(v)=>v, deltaMode:'int', goodDir:'up' },
    { key:'strength',   label:'Musculação',   icon:'🏋️', color:T.accentTeal,   unit:'×',  fmt:(v)=>v, deltaMode:'count', goodDir:'up', isCount:true },
    { key:'cardio',     label:'Cardio',       icon:'🏃', color:T.accentRed,    unit:'×',  fmt:(v)=>v, deltaMode:'count', goodDir:'up', isCount:true },
  ]

  // Calcula texto + cor do delta vs semana anterior
  const deltaFor = (d) => {
    const cur = kpis?.[d.key]?.value
    const prev = prevKpis?.[d.key]?.value
    if (cur == null || prev == null) return { text: null, color: T.textMuted }
    const diff = cur - prev
    if (Math.abs(diff) < (d.deltaMode === 'raw' && d.decimals === 1 ? 0.05 : 0.5)) return { text: '±0', color: T.textMuted }

    let text
    if (d.deltaMode === 'pp') text = `${diff > 0 ? '+' : ''}${diff.toFixed(1)} pp`
    else if (d.deltaMode === 'raw') text = `${diff > 0 ? '+' : ''}${diff.toFixed(d.decimals || 1)}${d.unit ? ' ' + d.unit : ''}`
    else if (d.deltaMode === 'minutes') { const m = Math.round(diff * 60); text = `${m > 0 ? '+' : ''}${m}min` }
    else if (d.deltaMode === 'count') text = `${diff > 0 ? '+' : ''}${diff}`
    else text = `${diff > 0 ? '+' : ''}${Math.round(diff).toLocaleString('pt-BR')}`

    // Cor por semântica
    let color = T.textMuted
    if (d.goodDir === 'neutral') color = T.textSecondary
    else {
      const improved = d.goodDir === 'up' ? diff > 0 : diff < 0
      color = improved ? T.accentTeal : T.accentRed
    }
    return { text, color }
  }

  const gridCols = (() => {
    if (!isWide) return 'repeat(2, 1fr)'
    // 12 numa linha em telas muito largas, 6 em desktop menor
    return 'repeat(auto-fit, minmax(112px, 1fr))'
  })()

  const placeholder = 'Painel será conectado na próxima etapa'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: T.textPrimary }}>
            {greeting}{userName ? `, ${userName}` : ''} 👋
          </div>
          <div style={{ fontSize: 12, color: T.textSecondary, marginTop: 2 }}>Disciplina hoje. Um você mais forte amanhã.</div>
        </div>

        {/* Seletor de semana */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={onPrevWeek} style={navBtn(T)} title="Semana anterior">‹</button>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10,
            background: T.surfaceElevated, border: `1px solid ${T.border}`, minWidth: 150, justifyContent: 'center',
          }}>
            <span style={{ fontSize: 12 }}>🗓️</span>
            <span style={{ fontSize: 12, color: T.textPrimary, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{weekLabel}</span>
          </div>
          <button onClick={onNextWeek} disabled={isCurrentWeekFlag} style={{ ...navBtn(T), opacity: isCurrentWeekFlag ? 0.4 : 1, cursor: isCurrentWeekFlag ? 'not-allowed' : 'pointer' }} title="Próxima semana">›</button>

          {isCurrentWeekFlag ? (
            <span style={{ fontSize: 10, padding: '4px 11px', borderRadius: 20, background: isPartial ? T.negativeBackground : T.activeBackground, color: isPartial ? T.accentAmber : T.accentTeal, fontWeight: 700, whiteSpace: 'nowrap' }}>
              {isPartial ? 'Em andamento' : 'Semana atual'}
            </span>
          ) : (
            <button onClick={onResetWeek} style={{ fontSize: 10, padding: '4px 11px', borderRadius: 20, background: T.surfaceElevated, border: `1px solid ${T.border}`, color: T.accentTeal, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
              ↺ Semana atual
            </button>
          )}
        </div>
      </div>

      {/* 12 KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 10 }}>
        {defs.map((d) => {
          const k = kpis?.[d.key]
          const hasData = k && k.value != null && k.n > 0
          const delta = deltaFor(d)
          const prevVal = prevKpis?.[d.key]?.value
          const tooltip = buildTooltip(d, k, prevVal, weekLabel)
          return (
            <div key={d.key} title={tooltip}>
              <StatCard
                label={d.label}
                icon={d.icon}
                accentColor={d.color}
                value={hasData ? d.fmt(k.value) : undefined}
                unit={hasData && !d.isSleep && !d.isCount ? d.unit : (d.isCount ? '' : '')}
                deltaText={hasData ? delta.text : null}
                deltaColor={delta.color}
                footer={hasData && k.n != null ? `${k.n} ${k.n === 1 ? 'reg.' : 'regs.'}` : null}
                T={T}
                empty={!hasData}
              />
            </div>
          )
        })}
      </div>

      {/* Blocos inferiores — placeholders (próxima fase) */}
      <div style={{ display: 'grid', gridTemplateColumns: isWide ? '1.2fr 1.2fr 1fr' : '1fr', gap: 14, alignItems: 'start' }}>
        <DashboardCard title="Evolução do peso" icon="⚖️" accentColor={T.accentBlue} T={T} empty emptyText={placeholder} style={{ minHeight: 180 }} />
        <DashboardCard title="Kcal ingeridas" icon="🔥" accentColor={T.accentOrange} T={T} empty emptyText={placeholder} style={{ minHeight: 180 }} />
        <DashboardCard title="Comparativo de médias" icon="📊" accentColor={T.accentAmber} T={T} empty emptyText={placeholder} style={{ minHeight: 180 }} />
        <DashboardCard title="Composição corporal" icon="🧬" accentColor={T.accentBlue} T={T} empty emptyText={placeholder} style={{ minHeight: 160 }} />
        <DashboardCard title="Saúde semanal" icon="❤️" accentColor={T.accentPurple} T={T} empty emptyText={placeholder} style={{ minHeight: 160 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <DashboardCard title="Treino" icon="💪" accentColor={T.accentTeal} T={T} empty emptyText={placeholder} style={{ minHeight: 72 }} />
          <DashboardCard title="Insights" icon="💡" accentColor={T.accentAmber} T={T} empty emptyText={placeholder} style={{ minHeight: 72 }} />
        </div>
      </div>
    </div>
  )
}

function buildTooltip(d, k, prevVal, weekLabel) {
  const lines = [`${d.label} · ${weekLabel}`]
  if (k && k.value != null && k.n > 0) {
    let val = d.isSleep ? formatSleep(k.value) : (typeof d.fmt(k.value) === 'string' ? d.fmt(k.value) : k.value)
    lines.push(`Valor: ${val}${d.unit && !d.isSleep ? ' ' + d.unit : ''}`)
    if (d.isSleep) lines.push(`(${k.value?.toFixed(1)} h decimal)`)
    lines.push(`${k.n} ${k.n === 1 ? 'registro' : 'registros'} na semana`)
    if (prevVal != null) lines.push(`Semana anterior: ${d.isSleep ? formatSleep(prevVal) : prevVal}`)
    lines.push('Média dos dias com registro')
  } else {
    lines.push('Ainda não há registros neste período.')
  }
  return lines.join('\n')
}

const navBtn = (T) => ({
  width: 32, height: 32, borderRadius: 8, border: `1px solid ${T.border}`,
  background: T.surfaceElevated, color: T.textSecondary, cursor: 'pointer',
  fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: 'inherit',
})
