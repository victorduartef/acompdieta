import React from 'react'
import FoodEntryRow from './FoodEntryRow.jsx'

// ── Cartão de uma refeição — agora com accordion (expandir/recolher) ──
// Cálculo de subtotal usa o MESMO calcMacros da página (nenhuma lógica paralela).
// Props: meal, items, allFoods, calcMacros, isMobile, isToday, isDinner, C, T,
//        expanded, onToggleExpand, isActive, onOpenAdd, onCloseAdd,
//        search, setSearch, avulso, setAvulso, avulsoData, setAvulsoData,
//        addFoodToMeal, addFavoriteMeal, toggleMealFav, onQtyChange, onRemove, onAddAvulso, FoodRow
export default function MealCard({
  meal, items, allFoods, calcMacros, isMobile, isToday, isDinner, C, T,
  expanded, onToggleExpand, isActive, onOpenAdd, onCloseAdd,
  search, setSearch, avulso, setAvulso, avulsoData, setAvulsoData,
  addFoodToMeal, addFavoriteMeal, toggleMealFav, onQtyChange, onRemove, onAddAvulso, FoodRow,
}) {
  const isEmpty = items.length === 0
  const macros = calcMacros(items, allFoods) // {cal, prot, carb, fat} — mesma função da página

  const favFoods = allFoods.filter(f => f.fav && f.fav.includes(meal.id))
  const otherFoods = allFoods.filter(f => !f.fav || !f.fav.includes(meal.id))
  const filtered = search ? allFoods.filter(f => f.name.toLowerCase().includes(search.toLowerCase())) : null
  const favCount = favFoods.length

  const dinnerActive = isDinner && isToday
  const dinnerLongNote = dinnerActive
    ? (items.length > 0
        ? { text: '✓ Dia incluído nas médias semanais.', color: T.accentTeal }
        : { text: 'Registrar o Jantar encerra o dia para as médias semanais.', color: T.accentAmber })
    : null
  const dinnerShortNote = dinnerActive
    ? (items.length > 0 ? { text: 'Dia incluído nas médias', color: T.accentTeal } : { text: 'Aguardando Jantar', color: T.accentAmber })
    : null

  const plusBtnSize = isMobile ? 40 : 30
  const contentId = `meal-content-${meal.id}`

  // ── Refeição vazia: sempre compacta, sem accordion ──
  if (isEmpty && !isActive) {
    return (
      <div style={{ background: T.surfacePrimary, border: `1px solid ${T.border}`, borderRadius: 12, padding: isMobile ? 13 : 15, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <span style={{ fontSize: 17, flexShrink: 0 }}>{meal.icon}</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.textPrimary }}>{meal.label}</div>
              <div style={{ fontSize: 11.5, color: T.textMuted, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span>Nenhum alimento registrado</span>
                {dinnerShortNote && <span style={{ color: dinnerShortNote.color, fontWeight: 600 }}>· {dinnerShortNote.text}</span>}
              </div>
            </div>
          </div>
          <button onClick={onOpenAdd} aria-label={`Adicionar alimento em ${meal.label}`}
            style={{ width: plusBtnSize, height: plusBtnSize, minWidth: 44, minHeight: isMobile ? 44 : plusBtnSize, borderRadius: 9, border: 'none', background: meal.color + '22', color: meal.color, fontSize: 17, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>+</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: T.surfacePrimary, border: `1px solid ${T.border}`, borderRadius: 12, padding: isMobile ? 13 : 15, marginBottom: 12 }}>
      {/* Cabeçalho — área de toggle (div com role=button) + botão "+" separado (não aninhado) */}
      <div style={{ position: 'relative' }}>
        <div
          role="button"
          tabIndex={0}
          aria-expanded={expanded}
          aria-controls={contentId}
          aria-label={`${expanded ? 'Recolher' : 'Expandir'} ${meal.label}`}
          onClick={onToggleExpand}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggleExpand() } }}
          style={{ cursor: 'pointer', outline: 'none', minHeight: 44, paddingRight: 46 }}
          className="evo-meal-toggle"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <span style={{ fontSize: 17, flexShrink: 0 }}>{meal.icon}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: T.textPrimary }}>{meal.label}</span>
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: meal.color, fontFamily: 'JetBrains Mono, monospace', flexShrink: 0 }}>{Math.round(macros.cal)} kcal</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 3 }}>
            <span style={{ fontSize: 11, color: T.textMuted, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span>{items.length} {items.length === 1 ? 'alimento' : 'alimentos'}</span>
              {dinnerShortNote && !expanded && <span style={{ color: dinnerShortNote.color, fontWeight: 600 }}>· {dinnerShortNote.text}</span>}
            </span>
            <span style={{ fontSize: 10.5, color: T.textSecondary, fontFamily: 'JetBrains Mono, monospace', flexShrink: 0 }}>
              {Math.round(macros.prot * 10) / 10}P · {Math.round(macros.carb * 10) / 10}C · {Math.round(macros.fat * 10) / 10}G
            </span>
          </div>
        </div>

        {/* Chevron (indica estado — nunca a única pista, o aria-expanded + label também comunicam) */}
        <span aria-hidden="true" className="evo-chevron" style={{
          position: 'absolute', top: 2, right: 46, fontSize: 13, color: T.textMuted,
          transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .18s ease',
          pointerEvents: 'none',
        }}>⌄</span>

        {/* Botão "+" — não aninhado no toggle; propagação interrompida */}
        <button onClick={(e) => { e.stopPropagation(); onOpenAdd() }} onKeyDown={(e) => e.stopPropagation()}
          aria-label={`Adicionar alimento em ${meal.label}`}
          style={{
            position: 'absolute', right: 0, bottom: 0, width: plusBtnSize, height: plusBtnSize,
            minWidth: isMobile ? 44 : plusBtnSize, minHeight: isMobile ? 44 : plusBtnSize,
            borderRadius: 9, border: 'none', background: meal.color + '22', color: meal.color,
            fontSize: 17, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>+</button>
      </div>

      {/* Conteúdo expandido */}
      {expanded && (
        <div id={contentId}>
          {dinnerLongNote && (
            <div style={{ fontSize: 10.5, color: dinnerLongNote.color, background: dinnerLongNote.color + '14', borderRadius: 8, padding: '6px 10px', marginTop: 10, marginBottom: 6, fontWeight: 500 }}>
              {dinnerLongNote.text}
            </div>
          )}

          <div style={{ marginTop: dinnerLongNote ? 0 : 10 }}>
            {items.map((it, idx) => {
              const food = it.avulso ? null : allFoods.find(x => x.id === it.id)
              return (
                <FoodEntryRow key={idx} item={it} food={food} isMobile={isMobile}
                  onQtyChange={(val) => onQtyChange(idx, val)} onRemove={() => onRemove(idx)} T={T} />
              )
            })}
          </div>

          {/* Painel de adicionar (inline) */}
          {isActive && (
            <div style={{ background: T.surfaceElevated, borderRadius: 11, padding: 12, marginTop: 8, border: `1px solid ${T.border}` }}>
              {favCount > 0 && !avulso && (
                <button onClick={addFavoriteMeal} style={{ width: '100%', padding: 11, border: 'none', borderRadius: 10, background: `linear-gradient(135deg,${meal.color},${meal.color}cc)`, color: '#fff', fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, marginBottom: 8 }}>
                  ⭐ Add refeição favorita ({favCount} {favCount === 1 ? 'item' : 'itens'})
                </button>
              )}

              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <input autoFocus value={search} onChange={e => { setSearch(e.target.value); setAvulso(false) }} placeholder="Buscar alimento..."
                  style={{ flex: 1, background: T.surfacePrimary, border: `1px solid ${T.border}`, borderRadius: 9, padding: '10px 12px', color: T.textPrimary, fontSize: 14, fontFamily: 'inherit' }} />
                <button onClick={onCloseAdd} aria-label="Fechar busca"
                  style={{ background: T.surfacePrimary, border: `1px solid ${T.border}`, borderRadius: 9, padding: '0 13px', color: T.textSecondary, cursor: 'pointer', fontSize: 16, minWidth: 44 }}>✕</button>
              </div>

              {!avulso && (
                <button onClick={() => { setAvulso(true); setSearch('') }}
                  style={{ width: '100%', padding: '9px', border: `1px dashed ${T.accentAmber}66`, borderRadius: 9, background: T.accentAmber + '10', color: T.accentAmber, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, marginBottom: 10 }}>
                  ⚡ Entrada avulsa (evento, estimativa...)
                </button>
              )}

              {avulso && (
                <div style={{ background: T.surfacePrimary, borderRadius: 10, padding: 11, marginBottom: 10, border: `1px solid ${T.accentAmber}55` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: T.accentAmber }}>⚡ Entrada avulsa</span>
                    <button onClick={() => setAvulso(false)} style={{ background: 'none', border: 'none', color: T.textSecondary, cursor: 'pointer', fontSize: 16 }}>×</button>
                  </div>
                  <input placeholder="Nome (ex: Churrasco, Evento...)" value={avulsoData.name} onChange={e => setAvulsoData(p => ({ ...p, name: e.target.value }))}
                    style={{ width: '100%', background: T.surfaceElevated, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 10px', color: T.textPrimary, fontSize: 13, fontFamily: 'inherit', marginBottom: 8 }} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
                    {[{ key: 'cal', label: 'Kcal' }, { key: 'prot', label: 'Proteína (g)' }, { key: 'carb', label: 'Carb (g)' }, { key: 'fat', label: 'Gordura (g)' }].map(f => (
                      <div key={f.key}>
                        <div style={{ fontSize: 10, color: T.textSecondary, marginBottom: 3, fontFamily: 'JetBrains Mono, monospace' }}>{f.label}</div>
                        <input type="number" placeholder="0" value={avulsoData[f.key]} onChange={e => setAvulsoData(p => ({ ...p, [f.key]: e.target.value }))}
                          style={{ width: '100%', background: T.surfaceElevated, border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 8px', color: T.textPrimary, fontSize: 13, fontFamily: 'JetBrains Mono, monospace' }} />
                      </div>
                    ))}
                  </div>
                  <button onClick={onAddAvulso}
                    style={{ width: '100%', padding: '10px', background: `linear-gradient(135deg,${T.accentAmber},${T.accentAmber}cc)`, border: 'none', borderRadius: 9, color: '#1a1408', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Adicionar à refeição
                  </button>
                </div>
              )}

              {!avulso && (
                <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                  {!search && favFoods.length > 0 && (<>
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 1, margin: '4px 0 8px', fontFamily: 'JetBrains Mono, monospace' }}>⭐ Favoritos</div>
                    {favFoods.map(f => <FoodRow key={f.id} food={f} onAdd={addFoodToMeal} mealId={meal.id} C={C} onToggleFav={toggleMealFav} />)}
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 1, margin: '12px 0 8px', fontFamily: 'JetBrains Mono, monospace' }}>Todos</div>
                    {otherFoods.map(f => <FoodRow key={f.id} food={f} onAdd={addFoodToMeal} mealId={meal.id} C={C} onToggleFav={toggleMealFav} />)}
                  </>)}
                  {!search && favFoods.length === 0 && allFoods.map(f => <FoodRow key={f.id} food={f} onAdd={addFoodToMeal} mealId={meal.id} C={C} onToggleFav={toggleMealFav} />)}
                  {search && (filtered.length > 0 ? filtered.map(f => <FoodRow key={f.id} food={f} onAdd={addFoodToMeal} mealId={meal.id} C={C} onToggleFav={toggleMealFav} />) : <div style={{ padding: 20, textAlign: 'center', color: T.textMuted, fontSize: 13 }}>Nenhum resultado</div>)}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
