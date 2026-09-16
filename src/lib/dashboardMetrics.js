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

function avgMacrosOverDates(days, dates, calcMacros, allFoods, currentDateKey) {
  const totals = { cal: [], prot: [], carb: [], fat: [] }
  dates.forEach(d => {
    const day = days?.[d]
    // Regra do dia alimentar encerrado (só aplica quando currentDateKey é informado)
    if (currentDateKey && !isNutritionDayEligible({ dateKey: d, dayData: day, currentDateKey })) return
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
  const { days, weights, bodyData, healthData, calcMacros, allFoods, ACTIVITIES, currentDateKey } = deps
  const weightAgg = avgOverDates(weights, dates, (v) => (typeof v === 'number' ? v : parseFloat(v)))
  const fatAgg = avgOverDates(bodyData, dates, (b) => b.bodyFat)
  const leanAgg = avgOverDates(bodyData, dates, (b) => b.leanMass)
  const stepsAgg = avgOverDates(healthData, dates, (h) => h.steps)
  const sleepAgg = avgOverDates(healthData, dates, (h) => h.sleep)
  const scoreAgg = avgOverDates(healthData, dates, (h) => h.sleepScore)
  const macros = avgMacrosOverDates(days, dates, calcMacros, allFoods, currentDateKey)
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
  const { days, calcMacros, allFoods, targets, targetsHistory, getTargetsForDate, currentDateKey } = deps
  const todayStr = currentDateKey || ymd(new Date())
  const dates = weekDates(monday)
  const bars = dates.map(d => {
    const day = days?.[d]
    const eligible = isNutritionDayEligible({ dateKey: d, dayData: day, currentDateKey: todayStr })
    let kcal = null
    let pendingDinner = false // hoje com comida mas sem jantar → aguardando
    if (day && day.meals) {
      const items = Object.values(day.meals).flat()
      if (items.length > 0) {
        if (eligible) {
          const m = calcMacros(items, allFoods)
          if (m.cal > 0) kcal = Math.round(m.cal)
        } else if (d === todayStr) {
          pendingDinner = true // tem comida hoje mas jantar ainda não registrado
        }
      }
    }
    const dObj = new Date(d + 'T12:00:00')
    const dow = dObj.getDay()
    const isWeekendDay = dow === 0 || dow === 6
    const goalT = getTargetsForDate(targets, targetsHistory, d)
    const goal = goalT?.cal || null
    const future = d > todayStr
    return { date: d, kcal, goal, isWeekendDay, future, pendingDinner }
  })
  const registered = bars.filter(b => b.kcal != null).map(b => b.kcal)
  const mean = registered.length ? Math.round(registered.reduce((a, b) => a + b, 0) / registered.length) : null
  const goalsForRegistered = bars.filter(b => b.kcal != null && b.goal != null).map(b => b.goal)
  const goalMean = goalsForRegistered.length ? Math.round(goalsForRegistered.reduce((a, b) => a + b, 0) / goalsForRegistered.length) : null
  return { bars, mean, n: registered.length, goalMean }
}

// ── Comparativo de médias por grupo de dias ──
// Grupos: geral, úteis (seg-sex), fds (sáb-dom), comTreino, semTreino
// deps: { days, weights, bodyData, healthData, calcMacros, allFoods }
export function weekComparison(monday, deps) {
  const { days, weights, bodyData, healthData, calcMacros, allFoods, currentDateKey } = deps
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
      // Regra do dia alimentar encerrado (só macros; passos/sono não usam)
      if (currentDateKey && !isNutritionDayEligible({ dateKey: d, dayData: day, currentDateKey })) return
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

// ── Composição corporal: 4 semanas terminando na semana selecionada ──
// deps: { bodyData, weights }. Retorna [{ label, weight, bodyFat, leanMass, fatMass, n }]
export function fourWeekBodyComposition(monday, deps) {
  const { bodyData, weights } = deps
  const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null
  const r1 = (v) => v == null ? null : Math.round(v * 10) / 10

  const weeks = []
  for (let i = 3; i >= 0; i--) {
    const d = new Date(monday + 'T12:00:00')
    d.setDate(d.getDate() - i * 7)
    const wkMon = ymd(d)
    const dates = weekDates(wkMon)
    const collect = (obj, keyFn) => {
      const vals = []
      dates.forEach(dt => { const e = obj?.[dt]; if (e == null) return; const v = keyFn(e); if (v != null && !isNaN(v)) vals.push(v) })
      return vals
    }
    const weightVals = collect(weights, (v) => (typeof v === 'number' ? v : parseFloat(v)))
    const fatVals = collect(bodyData, (b) => b.bodyFat)
    const leanVals = collect(bodyData, (b) => b.leanMass)
    const fatMassVals = collect(bodyData, (b) => b.fatMass)
    weeks.push({
      monday: wkMon,
      label: weekShortLabel(wkMon),
      weight: r1(avg(weightVals)),
      bodyFat: r1(avg(fatVals)),
      leanMass: r1(avg(leanVals)),
      fatMass: r1(avg(fatMassVals)),
      nBody: Math.max(fatVals.length, leanVals.length, fatMassVals.length),
      nWeight: weightVals.length,
    })
  }
  return weeks
}

function weekShortLabel(monday) {
  const dates = weekDates(monday)
  const s = new Date(dates[0] + 'T12:00:00'), e = new Date(dates[6] + 'T12:00:00')
  const dd = (d) => String(d.getDate()).padStart(2, '0')
  const mm = (d) => String(d.getMonth() + 1).padStart(2, '0')
  return `${dd(s)}/${mm(s)}`
}

// ── Saúde semanal: séries diárias + média + meta ──
// deps: { healthData, targets }. metric: 'steps'|'sleep'|'sleepScore'
export function weekHealthMetric(monday, healthData, metric) {
  const dates = weekDates(monday)
  const todayStr = ymd(new Date())
  const days = dates.map(d => {
    const h = healthData?.[d]
    const v = h && h[metric] != null && !isNaN(h[metric]) ? h[metric] : null
    return { date: d, value: v, future: d > todayStr }
  })
  const vals = days.filter(x => x.value != null).map(x => x.value)
  const mean = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
  return { days, mean, n: vals.length }
}

// ── Treino: resumo da semana (sessões, volume, atividades por dia) ──
// deps: { days, workoutLogs, ACTIVITIES, effectiveWeight? }
export function weekTraining(monday, deps) {
  const { days, workoutLogs, ACTIVITIES, effectiveWeight } = deps
  const ew = effectiveWeight || ((exId, w) => w || 0)
  const dates = weekDates(monday)
  const isType = (a, type) => ACTIVITIES.find(x => x.id === a)?.type === type

  // Sessões por dia (via activities, mesma regra dos KPIs — evita duplicar com logs)
  let strengthDays = 0, cardioDays = 0
  const dayChips = dates.map(d => {
    const acts = days?.[d]?.activities || []
    const hasStrength = acts.some(a => isType(a, 'strength'))
    const hasCardio = acts.some(a => isType(a, 'cardio'))
    const hasOther = acts.some(a => isType(a, 'other'))
    if (hasStrength) strengthDays++
    if (hasCardio) cardioDays++
    const labels = acts.map(a => ACTIVITIES.find(x => x.id === a)?.label).filter(Boolean)
    return { date: d, active: acts.length > 0, hasStrength, hasCardio, hasOther, labels, activityIds: acts }
  })

  // Volume de musculação: soma dos logs concluídos (séries válidas) da semana
  let volume = 0
  dates.forEach(d => {
    const logs = workoutLogs?.[d]
    if (!logs) return
    const arr = Array.isArray(logs) ? logs : [logs]
    arr.forEach(log => {
      (log.exercises || []).forEach(ex => {
        (ex.sets || []).forEach(s => { volume += ew(ex.exerciseId, s.weight) * (s.reps || 0) })
      })
    })
  })

  return { strengthDays, cardioDays, volume: Math.round(volume), dayChips }
}

// Volume total de musculação de uma semana (para comparar semanas)
export function weekVolume(monday, workoutLogs, effectiveWeight) {
  const ew = effectiveWeight || ((exId, w) => w || 0)
  const dates = weekDates(monday)
  let volume = 0
  dates.forEach(d => {
    const logs = workoutLogs?.[d]
    if (!logs) return
    const arr = Array.isArray(logs) ? logs : [logs]
    arr.forEach(log => { (log.exercises || []).forEach(ex => { (ex.sets || []).forEach(s => { volume += ew(ex.exerciseId, s.weight) * (s.reps || 0) }) }) })
  })
  return Math.round(volume)
}

// ── Insights determinísticos ──
// deps: { comparison, kpis, prevKpis, targets, bodyWeeks, healthSteps, healthSleep, healthScore }
export function buildInsights(deps) {
  const { comparison, kpis, targets, bodyWeeks, healthSleep, healthSteps } = deps
  const insights = []

  // 1. Calorias fim de semana vs úteis (atenção) — amostra suficiente
  const fdsCal = comparison?.fds?.cal, uteisCal = comparison?.uteis?.cal
  if (fdsCal?.v != null && uteisCal?.v != null && fdsCal.n >= 1 && uteisCal.n >= 2) {
    const diff = fdsCal.v - uteisCal.v
    if (Math.abs(diff) >= 150) {
      insights.push({
        cat: 'atencao', icon: '🎉', color: 'amber',
        title: `Fim de semana: ${diff > 0 ? '+' : ''}${diff} kcal`,
        text: `Sua média no fim de semana ficou ${Math.abs(diff)} kcal ${diff > 0 ? 'acima' : 'abaixo'} dos dias úteis.`,
        action: 'analysis',
      })
    }
  }

  // 2. Dias com vs sem treino (associação)
  const comCal = comparison?.comTreino?.cal, semCal = comparison?.semTreino?.cal
  if (comCal?.v != null && semCal?.v != null && comCal.n >= 2 && semCal.n >= 2) {
    const diff = comCal.v - semCal.v
    if (Math.abs(diff) >= 100) {
      insights.push({
        cat: 'associacao', icon: '🔗', color: 'blue',
        title: `Treino e alimentação`,
        text: `Nos dias com atividade, sua média calórica foi ${Math.abs(diff)} kcal ${diff < 0 ? 'menor' : 'maior'}.`,
        action: 'analysis',
      })
    }
  }

  // 3. Sono abaixo da meta (atenção) — >=3 registros e >=30min abaixo
  const sleepMean = kpis?.sleep?.value, sleepN = kpis?.sleep?.n
  const sleepGoal = targets?.sleepGoal // pode não existir
  if (sleepMean != null && sleepN >= 3 && sleepGoal) {
    const diffMin = Math.round((sleepMean - sleepGoal) * 60)
    if (diffMin <= -30) {
      const h = Math.floor(sleepMean), m = Math.round((sleepMean - h) * 60)
      insights.push({
        cat: 'atencao', icon: '😴', color: 'red',
        title: 'Sono abaixo da meta',
        text: `Sua média foi ${h}h${String(m).padStart(2, '0')}min, ${Math.abs(diffMin)} minutos abaixo da meta.`,
        action: 'saude',
      })
    }
  }

  // 4. Passos abaixo da meta (atenção)
  const stepsMean = kpis?.steps?.value, stepsN = kpis?.steps?.n
  const stepsGoal = targets?.stepsGoal
  if (stepsMean != null && stepsN >= 3 && stepsGoal && stepsMean < stepsGoal * 0.7) {
    insights.push({
      cat: 'atencao', icon: '👟', color: 'red',
      title: 'Passos abaixo da meta',
      text: `Média de ${stepsMean.toLocaleString('pt-BR')} passos/dia, abaixo da meta de ${stepsGoal.toLocaleString('pt-BR')}.`,
      action: 'saude',
    })
  }

  // 5. Proteína atingiu a meta (progresso)
  const protMean = kpis?.prot?.value, protN = kpis?.prot?.n
  const protGoal = targets?.protMin || targets?.prot
  if (protMean != null && protN >= 3 && protGoal && protMean >= protGoal) {
    insights.push({
      cat: 'progresso', icon: '🥩', color: 'teal',
      title: 'Proteína na meta',
      text: `Média de ${protMean}g/dia, atingindo a meta de ${protGoal}g.`,
      action: 'analysis',
    })
  }

  // 6. Tendência de gordura (progresso/associação) — >=2 semanas com medição
  if (bodyWeeks && bodyWeeks.length >= 2) {
    const withFat = bodyWeeks.filter(w => w.bodyFat != null)
    if (withFat.length >= 2) {
      const first = withFat[0].bodyFat, last = withFat[withFat.length - 1].bodyFat
      const diff = Math.round((last - first) * 10) / 10
      if (Math.abs(diff) >= 0.3) {
        insights.push({
          cat: 'associacao', icon: '🔥', color: 'blue',
          title: `Gordura ${diff < 0 ? 'em queda' : 'em alta'}`,
          text: `${diff > 0 ? '+' : ''}${diff} pp de gordura nas últimas ${withFat.length} semanas com medição.`,
          action: 'peso',
        })
      }
    }
  }

  // 7. Qualidade dos dados: poucos registros de sono
  if (sleepN != null && sleepN > 0 && sleepN <= 2) {
    insights.push({
      cat: 'qualidade', icon: '📉', color: 'amber',
      title: 'Poucos registros de sono',
      text: `Há somente ${sleepN} ${sleepN === 1 ? 'noite registrada' : 'noites registradas'} nesta semana; a média ainda pode variar bastante.`,
      action: 'saude',
    })
  }

  // Ordenação: atenção > progresso > associação > qualidade
  const order = { atencao: 0, progresso: 1, associacao: 2, qualidade: 3 }
  insights.sort((a, b) => order[a.cat] - order[b.cat])
  return insights.slice(0, 4)
}

// ── Regra do "dia alimentar encerrado" ──
// Dia atual só entra nas análises nutricionais depois de ter ao menos 1 item no Jantar (id 'janta').
// Dias passados entram se tiverem qualquer alimentação. Futuro nunca entra.
export const DINNER_MEAL_ID = 'janta'

function hasAnyFoodRegistered(dayData) {
  if (!dayData || !dayData.meals) return false
  return Object.values(dayData.meals).some(arr => Array.isArray(arr) && arr.length > 0)
}

function hasValidDinnerItem(dayData, dinnerMealId) {
  if (!dayData || !dayData.meals) return false
  const dinner = dayData.meals[dinnerMealId]
  return Array.isArray(dinner) && dinner.length > 0
}

// Retorna true se o dia é elegível para as métricas NUTRICIONAIS da Visão Geral
export function isNutritionDayEligible({ dateKey, dayData, currentDateKey, dinnerMealId = DINNER_MEAL_ID }) {
  if (dateKey > currentDateKey) return false            // futuro nunca entra
  if (dateKey < currentDateKey) return hasAnyFoodRegistered(dayData) // passado: qualquer alimentação
  return hasValidDinnerItem(dayData, dinnerMealId)      // hoje: só com jantar
}

// Filtra uma lista de datas retornando apenas as elegíveis para nutrição
export function eligibleNutritionDates(dates, days, currentDateKey, dinnerMealId = DINNER_MEAL_ID) {
  return dates.filter(d => isNutritionDayEligible({ dateKey: d, dayData: days?.[d], currentDateKey, dinnerMealId }))
}

// ── Duração total de treino na semana (só soma logs com start+end válidos) ──
export function weekWorkoutDuration(monday, workoutLogs) {
  const dates = weekDates(monday)
  let totalMs = 0, n = 0
  dates.forEach(d => {
    const logs = workoutLogs?.[d]
    if (!logs) return
    const arr = Array.isArray(logs) ? logs : [logs]
    arr.forEach(log => {
      if (log.startTime && log.endTime && log.endTime > log.startTime) {
        totalMs += (log.endTime - log.startTime)
        n++
      }
    })
  })
  return { totalMinutes: n > 0 ? Math.round(totalMs / 60000) : null, n }
}
