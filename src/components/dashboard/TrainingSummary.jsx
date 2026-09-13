import React from 'react'

// ── Bloco: Treino (resumo da semana) ──
// Props: training {strengthDays, cardioDays, volume, dayChips:[{date,active,hasStrength,hasCardio,hasOther,labels}]}, prevVolume, T, onClick
export default function TrainingSummary({ training, prevVolume, T, onClick }) {
  const { strengthDays, cardioDays, volume, dayChips } = training
  const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
  const volDelta = (prevVolume != null && volume != null) ? volume - prevVolume : null
  const volDeltaPct = (prevVolume && volume != null) ? Math.round((volume - prevVolume) / prevVolume * 100) : null

  return (
    <div onClick={onClick} style={card(T, !!onClick)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 13, width: 22, height: 22, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.accentTeal + '18', color: T.accentTeal }}>💪</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>Treino</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <Stat T={T} icon="🏋️" label="Musculação" value={`${strengthDays}×`} color={T.accentTeal} />
        <Stat T={T} icon="🏃" label="Cardio" value={`${cardioDays}×`} color={T.accentRed} />
        <Stat T={T} icon="📦" label="Volume" value={volume > 0 ? `${volume.toLocaleString('pt-BR')} kg` : '—'} color={T.accentAmber}
          delta={volDelta != null && volume > 0 ? `${volDeltaPct > 0 ? '+' : ''}${volDeltaPct}%` : null}
          deltaColor={volDelta > 0 ? T.accentTeal : volDelta < 0 ? T.accentRed : T.textMuted} span2 />
      </div>

      {/* chips dos dias */}
      <div style={{ display: 'flex', gap: 4, justifyContent: 'space-between' }}>
        {dayChips.map((c, i) => {
          const active = c.active
          const bg = c.hasStrength ? T.accentTeal : c.hasCardio ? T.accentRed : c.hasOther ? T.accentAmber : 'transparent'
          const tooltip = c.labels.length ? c.labels.join(', ') : 'Sem atividade'
          return (
            <div key={i} title={tooltip} style={{
              flex: 1, textAlign: 'center', padding: '5px 0', borderRadius: 7, fontSize: 9, fontWeight: 700,
              fontFamily: 'JetBrains Mono, monospace',
              background: active ? bg + '22' : 'transparent',
              border: `1px solid ${active ? bg + '55' : T.borderSoft}`,
              color: active ? bg : T.textMuted,
            }}>{dias[i]}</div>
          )
        })}
      </div>
    </div>
  )
}

function Stat({ T, icon, label, value, color, delta, deltaColor, span2 }) {
  return (
    <div style={{ background: T.surfaceElevated, borderRadius: 9, padding: '8px 10px', gridColumn: span2 ? '1 / -1' : 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
        <span style={{ fontSize: 10, color }}>{icon}</span>
        <span style={{ fontSize: 9.5, color: T.textSecondary }}>{label}</span>
        {delta && <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, color: deltaColor, fontFamily: 'JetBrains Mono, monospace' }}>{delta}</span>}
      </div>
      <div style={{ fontSize: 16, fontWeight: 800, color: T.textPrimary, fontFamily: 'JetBrains Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  )
}

function card(T, clickable) {
  return { background: T.surfacePrimary, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.15)', cursor: clickable ? 'pointer' : 'default', display: 'flex', flexDirection: 'column', minWidth: 0 }
}
