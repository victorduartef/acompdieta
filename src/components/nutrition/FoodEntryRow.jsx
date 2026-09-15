import React from 'react'

// ── Linha de um alimento registrado (avulso ou do banco) ──
// Props: item {avulso?, name?, cal,prot,carb,fat, id?, qty}, food (objeto do banco, se não-avulso), isMobile, onQtyChange, onRemove, T
export default function FoodEntryRow({ item, food, isMobile, onQtyChange, onRemove, T }) {
  const isAvulso = !!item.avulso
  const fixed = food && ['unid', 'dose', 'porção'].includes(food.unit)
  const m = isAvulso ? 1 : (fixed ? item.qty : item.qty / 100)
  const name = isAvulso ? item.name : food?.name
  const cal = isAvulso ? item.cal : (food?.cal || 0) * m
  const prot = isAvulso ? item.prot : (food?.prot || 0) * m
  const carb = isAvulso ? item.carb : (food?.carb || 0) * m
  const fat = isAvulso ? item.fat : (food?.fat || 0) * m

  if (!isAvulso && !food) return null

  const macrosLine = `${Math.round(cal)} kcal · P:${Math.round(prot * 10) / 10}g · C:${Math.round(carb * 10) / 10}g · G:${Math.round(fat * 10) / 10}g`

  if (isMobile) {
    return (
      <div style={{ background: T.surfaceElevated, borderRadius: 10, padding: '9px 11px', marginBottom: 6, border: isAvulso ? `1px solid ${T.accentAmber}40` : `1px solid ${T.borderSoft}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {isAvulso && <span style={{ fontSize: 9, background: T.accentAmber + '22', color: T.accentAmber, padding: '1px 6px', borderRadius: 8, fontWeight: 700, flexShrink: 0 }}>avulso</span>}
              <span style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>{name}{!isAvulso && ` · ${item.qty}${food.unit}`}</span>
            </div>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary, fontFamily: 'JetBrains Mono, monospace', flexShrink: 0 }}>{Math.round(cal)} kcal</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          <span style={{ fontSize: 11, color: T.textSecondary, fontFamily: 'JetBrains Mono, monospace' }}>
            {Math.round(prot * 10) / 10}P · {Math.round(carb * 10) / 10}C · {Math.round(fat * 10) / 10}G
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {!isAvulso && (
              <input type="number" value={item.qty} onChange={e => onQtyChange(e.target.value)} aria-label={`Quantidade de ${name}`}
                style={{ width: 48, textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, padding: '9px 4px', border: `1px solid ${T.border}`, borderRadius: 8, background: T.surfacePrimary, color: T.textPrimary, minHeight: 36 }} />
            )}
            <button onClick={onRemove} aria-label={`Remover ${name}`}
              style={{ background: T.negativeBackground, border: 'none', borderRadius: 8, width: 36, height: 36, color: T.accentRed, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>×</button>
          </div>
        </div>
      </div>
    )
  }

  // Desktop: linha compacta alinhada
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 11px', borderRadius: 9, marginBottom: 5, background: T.surfaceElevated, border: isAvulso ? `1px solid ${T.accentAmber}40` : `1px solid ${T.borderSoft}` }}>
      {isAvulso && <span style={{ fontSize: 9, background: T.accentAmber + '22', color: T.accentAmber, padding: '1px 6px', borderRadius: 8, fontWeight: 700, flexShrink: 0 }}>avulso</span>}
      <span style={{ fontSize: 13, fontWeight: 500, color: T.textPrimary, flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {name}{!isAvulso && <span style={{ color: T.textMuted }}> · {item.qty}{food.unit}</span>}
      </span>
      <span style={{ fontSize: 11.5, color: T.textSecondary, fontFamily: 'JetBrains Mono, monospace', flexShrink: 0, whiteSpace: 'nowrap' }}>
        {Math.round(cal)} kcal &nbsp; {Math.round(prot * 10) / 10}P &nbsp; {Math.round(carb * 10) / 10}C &nbsp; {Math.round(fat * 10) / 10}G
      </span>
      {!isAvulso && (
        <input type="number" value={item.qty} onChange={e => onQtyChange(e.target.value)} aria-label={`Quantidade de ${name}`}
          style={{ width: 46, textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, padding: '5px 4px', border: `1px solid ${T.border}`, borderRadius: 7, background: T.surfacePrimary, color: T.textPrimary, flexShrink: 0 }} />
      )}
      <button onClick={onRemove} aria-label={`Remover ${name}`}
        style={{ background: T.negativeBackground, border: 'none', borderRadius: 7, width: 26, height: 26, color: T.accentRed, cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>×</button>
    </div>
  )
}
