import React from 'react'
import { isNutritionDayEligible } from '../../lib/dashboardMetrics.js'

// ── Status do dia alimentar — deriva da regra do Jantar já implementada ──
// Nenhum campo novo é persistido; tudo é calculado a partir de `dayData` e `currentDateKey`.
// Props: dateKey, dayData, currentDateKey, T
export default function NutritionDayStatus({ dateKey, dayData, currentDateKey, T }) {
  const isFuture = dateKey > currentDateKey
  const isToday = dateKey === currentDateKey
  const isPast = dateKey < currentDateKey
  const eligible = isNutritionDayEligible({ dateKey, dayData, currentDateKey })

  let title, text, color, icon
  if (isFuture) {
    title = 'Data futura'
    text = 'Ainda não é possível registrar este dia.'
    color = T.textMuted
    icon = '🔒'
  } else if (isToday && !eligible) {
    title = 'Dia em andamento'
    text = 'Este dia entrará nas médias semanais após o primeiro registro no Jantar.'
    color = T.accentAmber
    icon = '⏳'
  } else if (isToday && eligible) {
    title = 'Dia incluído nas médias'
    text = 'O Jantar foi registrado e os dados de hoje já participam das análises semanais.'
    color = T.accentTeal
    icon = '✓'
  } else if (isPast) {
    title = 'Dia encerrado'
    text = eligible ? 'Este dia participa das análises semanais.' : 'Nenhum alimento foi registrado neste dia.'
    color = T.textSecondary
    icon = '📅'
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '9px 13px', borderRadius: 10,
      background: color + '14', border: `1px solid ${color}33`,
    }}>
      <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
      <div style={{ minWidth: 0 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>{title}</span>
        <span style={{ fontSize: 11, color: T.textSecondary, marginLeft: 7 }}>{text}</span>
      </div>
    </div>
  )
}
