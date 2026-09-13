// ── EvoShape — Agregações da Visão Geral (Fase 2) ──
// Funções PURAS. Recebem os dados já em memória do App (nada de Firestore aqui).
// Semana = segunda 00:00 a domingo 23:59, no fuso local. Reutiliza a mesma lógica de getMonday.

// Data local YYYY-MM-DD (mesmo padrão de todayKey do App)
function ymd(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Segunda-feira da semana que contém dateStr (mesma regra do renderAnalysis)
export function getMonday(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  const day = d.getDay() // 0=Dom..6=Sáb
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return ymd(d)
}

// Retorna as 7 chaves de data (seg..dom) da semana identificada pela segunda `monday`
export function weekDates(monday) {
  const start = new Date(monday + 'T12:00:00')
  const out = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    out.push(ymd(d))
  }
  return out
}

// Segunda-feira da semana atual, deslocada `offset` semanas para trás (0 = atual)
export function mondayForOffset(offset = 0) {
  const today = ymd(new Date())
  const mon = getMonday(today)
  const d = new Date(mon + 'T12:00:00')
  d.setDate(d.getDate() - offset * 7)
  return ymd(d)
}

// Rótulo do intervalo "07–13 set. 2026"
export function weekRangeLabel(monday) {
  const dates = weekDates(monday)
  const start = new Date(dates[0] + 'T12:00:00')
  const end = new Date(dates[6] + 'T12:00:00')
  const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  const dd = (d) => String(d.getDate()).padStart(2, '0')
  const sameMonth = start.getMonth() === end.getMonth()
  if (sameMonth) return `${dd(start)}–${dd(end)} ${meses[end.getMonth()]}. ${end.getFullYear()}`
  return `${dd(start)} ${meses[start.getMonth()]} – ${dd(end)} ${meses[end.getMonth()]}. ${end.getFullYear()}`
}

// Quantos dias da semana já decorreram (para semana parcial). Semana futura=0, passada=7.
export function elapsedDaysInWeek(monday) {
  const todayStr = ymd(new Date())
  const dates = weekDates(monday)
  if (todayStr < dates[0]) return 0
  if (todayStr > dates[6]) return 7
  return dates.filter(d => d <= todayStr).length
}

export function isCurrentWeek(monday) {
  return monday === getMonday(ymd(new Date()))
}

// ── Helpers de agregação ──
const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null
const r1 = (v) => v == null ? null : Math.round(v * 10) / 10
const rInt = (v) => v == null ? null : Math.round(v)

function avgOverDates(dataObj, dates, keyFn) {
  const vals = []
  dates.forEach(d => {
    const entry = dataObj?.[d]
    if (entry == null) return
    const v = keyFn(entry)
    if (v != null && !isNaN(v)) vals.push(v)
  })
  return { mean: avg(vals), n: vals.length }
}

function avgMacrosOverDates(days, dates, calcMacros, allFoods) {
  const totals = { cal: [], prot: [], carb: [], fat: [] }
  dates.forEach(d => {
    const day = days?.[d]
    if (!day || !day.meals) return
    const items = Object.values(day.meals).flat()
    if (items.length === 0) return
    const m = calcMacros(items, allFoods)
    if (m.cal <= 0) return
    totals.cal.push(m.cal); totals.prot.push(m.prot); totals.carb.push(m.carb); totals.fat.push(m.fat)
  })
  return {
    cal: avg(totals.cal), prot: avg(totals.prot), carb: avg(totals.carb), fat: avg(totals.fat),
    n: totals.cal.length,
  }
}

function countSessions(days, dates, ACTIVITIES) {
  const isType = (a, type) => ACTIVITIES.find(x => x.id === a)?.type === type
  let strength = 0, cardio = 0
  dates.forEach(d => {
    const acts = days?.[d]?.activities || []
    if (acts.some(a => isType(a, 'strength'))) strength++
    if (acts.some(a => isType(a, 'cardio'))) cardio++
  })
  return { strength, cardio }
}

function kpisFromDates(dates, deps) {
  const { days, weights, bodyData, healthData, calcMacros, allFoods, ACTIVITIES } = deps
  const weightAgg = avgOverDates(weights, dates, (v) => (typeof v === 'number' ? v : parseFloat(v)))
  const fatAgg = avgOverDates(bodyData, dates, (b) => b.bodyFat)
  const leanAgg = avgOverDates(bodyData, dates, (b) => b.leanMass)
  const stepsAgg = avgOverDates(healthData, dates, (h) => h.steps)
  const sleepAgg = avgOverDates(healthData, dates, (h) => h.sleep)
  const scoreAgg = avgOverDates(healthData, dates, (h) => h.sleepScore)
  const macros = avgMacrosOverDates(days, dates, calcMacros, allFoods)
  const sessions = countSessions(days, dates, ACTIVITIES)
  return {
    weight:     { value: r1(weightAgg.mean), n: weightAgg.n },
    bodyFat:    { value: r1(fatAgg.mean), n: fatAgg.n },
    leanMass:   { value: r1(leanAgg.mean), n: leanAgg.n },
    cal:        { value: rInt(macros.cal), n: macros.n },
    prot:       { value: rInt(macros.prot), n: macros.n },
    carb:       { value: rInt(macros.carb), n: macros.n },
    fat:        { value: rInt(macros.fat), n: macros.n },
    steps:      { value: rInt(stepsAgg.mean), n: stepsAgg.n },
    sleep:      { value: r1(sleepAgg.mean), n: sleepAgg.n },
    sleepScore: { value: rInt(scoreAgg.mean), n: scoreAgg.n },
    strength:   { value: sessions.strength, n: sessions.strength },
    cardio:     { value: sessions.cardio, n: sessions.cardio },
  }
}

// KPIs da semana inteira
export function computeWeekKPIs(monday, deps) {
  return kpisFromDates(weekDates(monday), deps)
}

// KPIs limitados aos primeiros N dias (para comparar semana parcial vs mesmos dias da anterior)
export function computeWeekKPIsPartial(monday, elapsed, deps) {
  const dates = weekDates(monday).slice(0, Math.max(0, elapsed))
  if (dates.length === 0) return null
  return kpisFromDates(dates, deps)
}

// Formata horas decimais em "6h 18min"
export function formatSleep(hoursDecimal) {
  if (hoursDecimal == null) return '—'
  const h = Math.floor(hoursDecimal)
  const min = Math.round((hoursDecimal - h) * 60)
  if (min === 0) return `${h}h`
  return `${h}h ${String(min).padStart(2, '0')}min`
}

// ── Dados por dia da semana (para os gráficos dos painéis) ──

// Peso por dia da semana: [{ date, weight|null }] + média + nº medições
export function weekWeightSeries(monday, weights) {
  const dates = weekDates(monday)
  const points = dates.map(d => {
    const raw = weights?.[d]
    const v = raw == null ? null : (typeof raw === 'number' ? raw : parseFloat(raw))
    return { date: d, weight: (v != null && !isNaN(v)) ? v : null }
  })
  const vals = points.filter(p => p.weight != null).map(p => p.weight)
  const mean = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
  return { points, mean: mean == null ? null : Math.round(mean * 10) / 10, n: vals.length }
}

// Kcal por dia da semana + meta do dia (getTargetsForDate) + média (só dias com registro)
// deps: { days, calcMacros, allFoods, targets, targetsHistory, getTargetsForDate }
export function weekCaloriesSeries(monday, deps) {
  const { days, calcMacros, allFoods, targets, targetsHistory, getTargetsForDate } = deps
  const todayStr = ymd(new Date())
  const dates = weekDates(monday)
  const bars = dates.map(d => {
    const day = days?.[d]
    let kcal = null
    if (day && day.meals) {
      const items = Object.values(day.meals).flat()
      if (items.length > 0) {
        const m = calcMacros(items, allFoods)
        if (m.cal > 0) kcal = Math.round(m.cal)
      }
    }
    const dObj = new Date(d + 'T12:00:00')
    const dow = dObj.getDay() // 0=Dom,6=Sáb
    const isWeekendDay = dow === 0 || dow === 6
    const goalT = getTargetsForDate(targets, targetsHistory, d)
    const goal = goalT?.cal || null
    const future = d > todayStr
    return { date: d, kcal, goal, isWeekendDay, future }
  })
  const registered = bars.filter(b => b.kcal != null).map(b => b.kcal)
  const mean = registered.length ? Math.round(registered.reduce((a, b) => a + b, 0) / registered.length) : null
  // Meta média dos dias com registro
  const goalsForRegistered = bars.filter(b => b.kcal != null && b.goal != null).map(b => b.goal)
  const goalMean = goalsForRegistered.length ? Math.round(goalsForRegistered.reduce((a, b) => a + b, 0) / goalsForRegistered.length) : null
  return { bars, mean, n: registered.length, goalMean }
}

// ── Comparativo de médias por grupo de dias ──
// Grupos: geral, úteis (seg-sex), fds (sáb-dom), comTreino, semTreino
// deps: { days, weights, bodyData, healthData, calcMacros, allFoods }
export function weekComparison(monday, deps) {
  const { days, weights, bodyData, healthData, calcMacros, allFoods } = deps
  const dates = weekDates(monday)

  const isWeekend = (d) => { const w = new Date(d + 'T12:00:00').getDay(); return w === 0 || w === 6 }
  const hasTraining = (d) => (days?.[d]?.activities || []).length > 0 // mesma regra da aba Análises

  const groups = {
    geral:      dates,
    uteis:      dates.filter(d => !isWeekend(d)),
    fds:        dates.filter(d => isWeekend(d)),
    comTreino:  dates.filter(d => hasTraining(d)),
    semTreino:  dates.filter(d => !hasTraining(d)),
  }

  const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null

  // Para cada grupo, calcula médias de cada indicador (só registros existentes)
  const calcGroup = (groupDates) => {
    const macroVals = { cal: [], prot: [], carb: [], fat: [] }
    groupDates.forEach(d => {
      const day = days?.[d]
      if (day && day.meals) {
        const items = Object.values(day.meals).flat()
        if (items.length > 0) {
          const m = calcMacros(items, allFoods)
          if (m.cal > 0) { macroVals.cal.push(m.cal); macroVals.prot.push(m.prot); macroVals.carb.push(m.carb); macroVals.fat.push(m.fat) }
        }
      }
    })
    const steps = [], sleep = [], score = []
    groupDates.forEach(d => {
      const h = healthData?.[d]
      if (h) {
        if (h.steps != null && !isNaN(h.steps)) steps.push(h.steps)
        if (h.sleep != null && !isNaN(h.sleep)) sleep.push(h.sleep)
        if (h.sleepScore != null && !isNaN(h.sleepScore)) score.push(h.sleepScore)
      }
    })
    const r0v = (v) => v == null ? null : Math.round(v)
    const r1v = (v) => v == null ? null : Math.round(v * 10) / 10
    return {
      cal:   { v: r0v(avg(macroVals.cal)),  n: macroVals.cal.length },
      prot:  { v: r0v(avg(macroVals.prot)), n: macroVals.prot.length },
      carb:  { v: r0v(avg(macroVals.carb)), n: macroVals.carb.length },
      fat:   { v: r0v(avg(macroVals.fat)),  n: macroVals.fat.length },
      steps: { v: r0v(avg(steps)), n: steps.length },
      sleep: { v: r1v(avg(sleep)), n: sleep.length },
      score: { v: r0v(avg(score)), n: score.length },
    }
  }

  return {
    geral:     calcGroup(groups.geral),
    uteis:     calcGroup(groups.uteis),
    fds:       calcGroup(groups.fds),
    comTreino: calcGroup(groups.comTreino),
    semTreino: calcGroup(groups.semTreino),
  }
}
