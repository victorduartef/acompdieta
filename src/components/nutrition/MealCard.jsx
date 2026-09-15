import React from 'react'
import FoodEntryRow from './FoodEntryRow.jsx'

// ── Cartão de uma refeição (Café, Almoço, Lanche, Jantar, Extra) ──
// Preserva 100% do fluxo antigo (busca, favoritos, avulso, refeição favorita) — apenas reorganizado em card.
// Props: meal {id,label,icon,color}, items, allFoods, isMobile, isToday, isDinner, C, T,
//        isActive (painel de adicionar aberto para este card), onOpenAdd, onCloseAdd,
//        search, setSearch, avulso, setAvulso, avulsoData, setAvulsoData,
//        addFoodToMeal, addFavoriteMeal, toggleMealFav, onQtyChange, onRemove, FoodRow
export default function MealCard({
  meal, items, allFoods, isMobile, isToday, isDinner, C, T,
  isActive, onOpenAdd, onCloseAdd,
  search, setSearch, avulso, setAvulso, avulsoData, setAvulsoData,
  addFoodToMeal, addFavoriteMeal, toggleMealFav, onQtyChange, onRemove, onAddAvulso, FoodRow,
}) {
  const subtotalCal = items.reduce((a, it) => {
    if (it.avulso) return a + (it.cal || 0)
    const f = allFoods.find(x => x.id === it.id)
    if (!f) return a
    const fixed = ['unid', 'dose', 'porção'].includes(f.unit)
    const m = fixed ? it.qty : it.qty / 100
    return a + (f.cal || 0) * m
  }, 0)

  const favFoods = allFoods.filter(f => f.fav && f.fav.includes(meal.id))
  const otherFoods = allFoods.filter(f => !f.fav || !f.fav.includes(meal.id))
  const filtered = search ? allFoods.filter(f => f.name.toLowerCase().includes(search.toLowerCase())) : null
  const favCount = favFoods.length

  const dinnerNote = isDinner && isToday
    ? (items.length > 0
        ? { text: '✓ Dia incluído nas médias semanais.', color: T.accentTeal }
        : { text: 'Registrar o Jantar encerra o dia para as médias semanais.', color: T.accentAmber })
    : null

  return (
    <div style={{ background: T.surfacePrimary, border: `1px solid ${T.border}`, borderRadius: 12, padding: isMobile ? 13 : 15, marginBottom: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: items.length > 0 || isActive ? 10 : 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 17 }}>{meal.icon}</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.textPrimary }}>{meal.label}</div>
            {items.length > 0 && <div style={{ fontSize: 10.5, color: T.textMuted }}>{items.length} {items.length === 1 ? 'alimento' : 'alimentos'}</div>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {items.length > 0 && <span style={{ fontSize: 14, fontWeight: 700, color: meal.color, fontFamily: 'JetBrains Mono, monospace' }}>{Math.round(subtotalCal)} kcal</span>}
          <button onClick={onOpenAdd} aria-label={`Adicionar alimento em ${meal.label}`}
            style={{ width: 30, height: 30, borderRadius: 9, border: 'none', background: meal.color + '22', color: meal.color, fontSize: 17, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>+</button>
        </div>
      </div>

      {dinnerNote && (
        <div style={{ fontSize: 10.5, color: dinnerNote.color, background: dinnerNote.color + '14', borderRadius: 8, padding: '6px 10px', marginBottom: 10, fontWeight: 500 }}>
          {dinnerNote.text}
        </div>
      )}

      {/* Lista de alimentos */}
      {items.length === 0 && !isActive && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 2px 6px' }}>
          <span style={{ fontSize: 12, color: T.textMuted }}>Nenhum alimento registrado</span>
          <button onClick={onOpenAdd} style={{ background: 'none', border: 'none', color: meal.color, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: '6px 4px' }}>+ Adicionar</button>
        </div>
      )}

      {items.map((it, idx) => {
        const food = it.avulso ? null : allFoods.find(x => x.id === it.id)
        return (
          <FoodEntryRow key={idx} item={it} food={food} isMobile={isMobile}
            onQtyChange={(val) => onQtyChange(idx, val)} onRemove={() => onRemove(idx)} T={T} />
        )
      })}

      {/* Painel de adicionar (inline, dentro do card ativo) */}
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
  )
}
