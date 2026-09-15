import React from 'react'
import NutritionDayStatus from '../components/nutrition/NutritionDayStatus.jsx'
import DailyNutritionSummary from '../components/nutrition/DailyNutritionSummary.jsx'
import MealCard from '../components/nutrition/MealCard.jsx'

// ── Alimentação — tela de registro diário (redesign) ──
// Recebe todos os dados e callbacks por props; nenhuma lógica de persistência aqui.
export default function Alimentacao({
  T, C, isMobile, isWide,
  activeKey, today, isToday, currentDay, dayMacros, activeTargets, hasData,
  MEALS, ACTIVITIES, allFoods,
  activeMeal, setActiveMeal, addingFood, setAddingFood, search, setSearch,
  avulso, setAvulso, avulsoData, setAvulsoData,
  addFoodToMeal, addFavoriteMeal, toggleMealFav, updateQty, removeFood, addAvulsoItem,
  addActivityToDay, removeActivityFromDay,
  farolProt, farolFat, farolCarb, FoodRow,
  onPrevDay, onNextDay, onGoToday,
}) {
  const dt = new Date(activeKey + 'T12:00:00')
  const wd = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
  const mo = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  const fullDate = `${wd[dt.getDay()]}, ${dt.getDate()} de ${mo[dt.getMonth()]}`

  const openAddFor = (mealId) => { setActiveMeal(mealId); setAddingFood(true); setSearch(''); setAvulso(false) }
  const closeAdd = () => { setAddingFood(false); setSearch(''); setAvulso(false) }

  const activitiesPanel = (
    <div style={{ background: T.surfacePrimary, border: `1px solid ${T.border}`, borderRadius: 12, padding: 15 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: T.textSecondary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Atividades do dia</div>
      {(currentDay.activities || []).length === 0 && <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 10 }}>Nenhuma atividade registrada</div>}
      {(currentDay.activities || []).length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {(currentDay.activities || []).map(actId => {
            const act = ACTIVITIES.find(a => a.id === actId); if (!act) return null
            return (
              <div key={actId} style={{ display: 'flex', alignItems: 'center', gap: 5, background: act.color + '20', border: `1px solid ${act.color}44`, borderRadius: 20, padding: '5px 10px', minHeight: 30 }}>
                <span style={{ fontSize: 13 }}>{act.icon}</span>
                <span style={{ fontSize: 11, color: act.color, fontWeight: 600 }}>{act.label}</span>
                <button onClick={() => removeActivityFromDay(actId)} aria-label={`Remover ${act.label}`} style={{ background: 'none', border: 'none', color: act.color, cursor: 'pointer', fontSize: 14, padding: 0, minWidth: 20 }}>×</button>
              </div>
            )
          })}
        </div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {ACTIVITIES.map(act => {
          const done = (currentDay.activities || []).includes(act.id)
          return (
            <button key={act.id} onClick={() => addActivityToDay(act.id)} disabled={done} aria-label={`Adicionar ${act.label}`}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', minHeight: 32, border: `1px solid ${done ? act.color : T.border}`, borderRadius: 20, background: done ? act.color + '20' : 'transparent', cursor: done ? 'default' : 'pointer', fontFamily: 'inherit' }}>
              <span style={{ fontSize: 12 }}>{act.icon}</span>
              <span style={{ fontSize: 10, color: done ? act.color : T.textSecondary, fontWeight: done ? 700 : 400 }}>{act.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )

  const mealCards = MEALS.map(meal => (
    <MealCard
      key={meal.id}
      meal={meal}
      items={currentDay.meals[meal.id] || []}
      allFoods={allFoods}
      isMobile={isMobile}
      isToday={isToday}
      isDinner={meal.id === 'janta'}
      C={C} T={T}
      isActive={activeMeal === meal.id && addingFood}
      onOpenAdd={() => openAddFor(meal.id)}
      onCloseAdd={closeAdd}
      search={search} setSearch={setSearch}
      avulso={avulso} setAvulso={setAvulso}
      avulsoData={avulsoData} setAvulsoData={setAvulsoData}
      addFoodToMeal={addFoodToMeal}
      addFavoriteMeal={addFavoriteMeal}
      toggleMealFav={toggleMealFav}
      onQtyChange={(idx, val) => updateQty(meal.id, idx, val)}
      onRemove={(idx) => removeFood(meal.id, idx)}
      onAddAvulso={addAvulsoItem}
      FoodRow={FoodRow}
    />
  ))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 1180, margin: isWide ? '0 auto' : undefined }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: 10 }}>
        <div>
          <div style={{ fontSize: isMobile ? 17 : 19, fontWeight: 800, color: T.textPrimary }}>Alimentação</div>
          <div style={{ fontSize: 12.5, color: T.textSecondary, marginTop: 1 }}>{fullDate}{isToday && <span style={{ color: T.accentTeal, fontWeight: 700 }}> · hoje</span>}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: isMobile ? '100%' : 'auto' }}>
          <button onClick={onPrevDay} aria-label="Dia anterior" style={navBtn(T)}>‹</button>
          {!isToday && (
            <button onClick={onGoToday} style={{ fontSize: 11.5, fontWeight: 700, padding: '9px 12px', minHeight: 44, borderRadius: 9, border: `1px solid ${T.accentTeal}55`, background: T.activeBackground, color: T.accentTeal, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>Hoje</button>
          )}
          <button onClick={onNextDay} aria-label="Próximo dia" style={navBtn(T)}>›</button>
        </div>
      </div>

      {/* Status do dia */}
      <NutritionDayStatus dateKey={activeKey} dayData={currentDay} currentDateKey={today} T={T} />

      {/* Layout principal */}
      {isWide ? (
        <div style={{ display: 'grid', gridTemplateColumns: '66% 1fr', gap: 16, alignItems: 'start' }}>
          <div style={{ minWidth: 0 }}>{mealCards}</div>
          <div style={{ position: 'sticky', top: 16, display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
            <DailyNutritionSummary dayMacros={dayMacros} activeTargets={activeTargets} farolProt={farolProt} farolFat={farolFat} farolCarb={farolCarb} hasData={hasData} T={T} />
            {activitiesPanel}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <DailyNutritionSummary dayMacros={dayMacros} activeTargets={activeTargets} farolProt={farolProt} farolFat={farolFat} farolCarb={farolCarb} hasData={hasData} T={T} />
          {mealCards}
          {activitiesPanel}
        </div>
      )}
    </div>
  )
}

const navBtn = (T) => ({
  width: 44, height: 44, borderRadius: 9, border: `1px solid ${T.border}`,
  background: T.surfaceElevated, color: T.textSecondary, cursor: 'pointer',
  fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: 'inherit', flexShrink: 0,
})
