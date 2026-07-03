import { useState, useEffect, useCallback } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db, initAuth, loginWithGoogle, handleRedirectResult, logout } from './firebase.js'

const DEFAULT_FOODS = [
  { id: 'bready_ovo', name: 'Bready + Ovo', fav: ['cafe_manha'], cal: 135, prot: 14.2, carb: 5.9, fat: 6.1, unit: 'unid', def: 1, note: '20g Bready Dux + 1 ovo preparado' },
  { id: 'supercoffee', name: 'SuperCoffee', fav: ['cafe_manha'], cal: 49, prot: 1.6, carb: 2.1, fat: 3.8, unit: 'dose', def: 1, note: '1 dose = 10g' },
  { id: 'queijo_minas', name: 'Queijo Minas Light Verde Mar', fav: ['cafe_manha'], cal: 296, prot: 28.3, carb: 4.7, fat: 18.3, unit: 'g', def: 25, note: '25g por porção' },
  { id: 'whey_meia', name: '½ Whey Fresh Dux', fav: ['cafe_manha'], cal: 60, prot: 10, carb: 0.9, fat: 1.9, unit: 'dose', def: 1, note: 'meia dose = 15g' },
  { id: 'whey_full', name: 'Whey Fresh Dux (dose cheia)', fav: ['lanche'], cal: 120, prot: 20, carb: 1.8, fat: 3.8, unit: 'dose', def: 1, note: 'dose cheia = 30g' },
  { id: 'banana', name: 'Banana', fav: ['cafe_manha', 'lanche'], cal: 89, prot: 1.1, carb: 23, fat: 0.3, unit: 'g', def: 100 },
  { id: 'leite_desnatado', name: 'Leite Desnatado', fav: ['cafe_manha'], cal: 34, prot: 3.4, carb: 4.8, fat: 0, unit: 'ml', def: 150, note: 'por 100ml' },
  { id: 'ovo_inteiro', name: 'Ovo Inteiro (extra)', fav: ['cafe_manha'], cal: 78, prot: 6.0, carb: 0.6, fat: 5.3, unit: 'unid', def: 1, note: 'ovo extra além do bready' },
  { id: 'frango_peito', name: 'Peito de Frango Grelhado', fav: ['almoco'], cal: 165, prot: 31, carb: 0, fat: 3.6, unit: 'g', def: 120, note: 'peso já pronto' },
  { id: 'arroz', name: 'Arroz Branco Cozido', fav: ['almoco'], cal: 130, prot: 2.7, carb: 28, fat: 0.3, unit: 'g', def: 120 },
  { id: 'batata_inglesa', name: 'Batata Inglesa Cozida', fav: ['almoco'], cal: 77, prot: 2, carb: 17.5, fat: 0.1, unit: 'g', def: 200 },
  { id: 'batata_doce', name: 'Batata Doce Cozida', fav: ['almoco', 'janta'], cal: 86, prot: 1.6, carb: 20, fat: 0.1, unit: 'g', def: 175 },
  { id: 'mandioca', name: 'Mandioca Cozida', fav: ['almoco', 'janta'], cal: 132, prot: 1.1, carb: 31.7, fat: 0.2, unit: 'g', def: 120 },
  { id: 'abobora_moranga', name: 'Abóbora Moranga Cozida', fav: ['almoco', 'janta'], cal: 27, prot: 1.2, carb: 5.5, fat: 0.1, unit: 'g', def: 200 },
  { id: 'tilapia', name: 'Tilápia Grelhada', fav: ['almoco', 'janta'], cal: 132, prot: 26.9, carb: 0, fat: 2.2, unit: 'g', def: 160, note: 'peso já pronto' },
  { id: 'salada', name: 'Salada Mista', fav: ['almoco', 'janta'], cal: 28, prot: 1.2, carb: 5.6, fat: 0.2, unit: 'g', def: 125, note: 'folhas + legumes' },
  { id: 'doce_leite', name: 'Doce de Leite', fav: ['almoco'], cal: 350, prot: 7, carb: 65, fat: 8, unit: 'g', def: 20, note: 'sobremesa · 20g' },
  { id: 'chocolate_amargo', name: 'Chocolate Amargo 70%+', fav: ['almoco'], cal: 570, prot: 9, carb: 40, fat: 41, unit: 'g', def: 20, note: 'sobremesa · 20g' },
  { id: 'choc_nespresso', name: 'Chocolate Nespresso Nibs 75%', fav: ['almoco', 'extra'], cal: 30, prot: 0.5, carb: 1.6, fat: 2.3, unit: 'unid', def: 2, note: '1 unid = 5g · 30 kcal' },
  { id: 'acai', name: 'Polpa de Açaí (pura)', fav: ['lanche'], cal: 58, prot: 0.3, carb: 2.1, fat: 1.3, unit: 'g', def: 100, note: 'De Marchi, sem adoçar' },
  { id: 'pao_pullman', name: 'Pão Pullman Ferm. Natural', fav: ['lanche'], cal: 256, prot: 8.8, carb: 49, fat: 2.7, unit: 'g', def: 50, note: '2 fatias = ~50g' },
  { id: 'frango_desfiado', name: 'Frango Desfiado', fav: ['lanche', 'almoco'], cal: 165, prot: 31, carb: 0, fat: 3.6, unit: 'g', def: 50 },
  { id: 'ricota_light', name: 'Creme de Ricota Light', fav: ['lanche'], cal: 108, prot: 6.7, carb: 5.1, fat: 6.8, unit: 'g', def: 20 },
  { id: 'tortinha', name: 'Tortinha de Frango (3 porções)', fav: ['lanche'], cal: 276, prot: 37.7, carb: 1.4, fat: 11.8, unit: 'porção', def: 1, note: 'frango+ovos+cottage ÷12' },
  { id: 'patinho', name: 'Patinho Moído (pronto)', fav: ['janta'], cal: 152, prot: 24, carb: 0, fat: 6, unit: 'g', def: 150, note: 'peso já pronto' },
  { id: 'file_suino', name: 'Filé Mignon Suíno (pronto)', fav: ['janta'], cal: 165, prot: 26, carb: 0, fat: 6.5, unit: 'g', def: 150, note: 'peso já pronto' },
  { id: 'batata_doce_j', name: 'Batata Doce (janta)', fav: ['janta'], cal: 86, prot: 1.6, carb: 20, fat: 0.1, unit: 'g', def: 100 },
  { id: 'batata_ing_j', name: 'Batata Inglesa (janta)', fav: ['janta'], cal: 77, prot: 2, carb: 17.5, fat: 0.1, unit: 'g', def: 150 },
  { id: 'arroz_j', name: 'Arroz Branco (janta)', fav: ['janta'], cal: 130, prot: 2.7, carb: 28, fat: 0.3, unit: 'g', def: 80, note: '~equiv batata doce 100g' },
  { id: 'batata_baroa_j', name: 'Batata Baroa (janta)', fav: ['janta'], cal: 96, prot: 1.4, carb: 22.0, fat: 0.1, unit: 'g', def: 100 },
  { id: 'abobora_j', name: 'Abóbora Moranga (janta)', fav: ['janta'], cal: 27, prot: 1.2, carb: 5.5, fat: 0.1, unit: 'g', def: 150 },
  { id: 'mandioca_j', name: 'Mandioca Cozida (janta)', fav: ['janta'], cal: 132, prot: 1.1, carb: 31.7, fat: 0.2, unit: 'g', def: 120 },
  { id: 'tilapia_j', name: 'Tilápia Grelhada (janta)', fav: ['janta'], cal: 132, prot: 26.9, carb: 0, fat: 2.2, unit: 'g', def: 150, note: 'peso já pronto' },
]

const MEALS = [
  { id: 'cafe_manha', label: 'Café da Manhã', short: 'Café', icon: '☀️', color: '#e8a040' },
  { id: 'almoco', label: 'Almoço', short: 'Almoço', icon: '🍽️', color: '#2ab8b8' },
  { id: 'lanche', label: 'Lanche', short: 'Lanche', icon: '🥗', color: '#c8873a' },
  { id: 'janta', label: 'Janta', short: 'Janta', icon: '🌙', color: '#e07060' },
  { id: 'extra', label: 'Refeição Extra', short: 'Extra', icon: '⚡', color: '#8b5cf6' },
]

const ACTIVITIES = [
  { id: 'musculacao', label: 'Musculação', icon: '🏋️', color: '#c8873a', type: 'strength' },
  { id: 'futsal', label: 'Futsal', icon: '⚽', color: '#2ab8b8', type: 'cardio' },
  { id: 'futebol', label: 'Futebol', icon: '⚽', color: '#2ab8b8', type: 'cardio' },
  { id: 'tenis', label: 'Tênis', icon: '🎾', color: '#e8a040', type: 'cardio' },
  { id: 'volei', label: 'Vôlei', icon: '🏐', color: '#e07060', type: 'cardio' },
  { id: 'corrida', label: 'Corrida', icon: '🏃', color: '#ef4444', type: 'cardio' },
  { id: 'natacao', label: 'Natação', icon: '🏊', color: '#0ea5e9', type: 'cardio' },
  { id: 'ciclismo', label: 'Ciclismo', icon: '🚴', color: '#8b5cf6', type: 'cardio' },
  { id: 'outro', label: 'Outro', icon: '🏃', color: '#6b7280', type: 'other' },
]

const DEFAULT_TARGETS = {
  cal: 1562, prot: 150, carb: 151, fat: 43,
  min: 1460, max: 1680, protMin: 138, protMax: 163, fatMax: 52,
  dualMode: false,
  targets2: { cal: 1800, prot: 150, carb: 220, fat: 50, min: 1700, max: 1900, protMin: 138, protMax: 163, fatMax: 60 },
  highCarbDays: [1, 3, 5], // Mon, Wed, Fri = carbo alto by default
}

function getTargetsForDate(targets, dateKey) {
  if (!targets.dualMode) return targets
  const d = new Date(dateKey + 'T12:00:00')
  const dayOfWeek = d.getDay() // 0=Sun, 1=Mon...
  const highCarbDays = targets.highCarbDays || [1, 3, 5]
  if (highCarbDays.includes(dayOfWeek)) {
    return { ...targets.targets2, dualMode: true, highCarbDays, targets2: targets.targets2 }
  }
  return targets
}

function todayKey() {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
function emptyDay() { return { meals: { cafe_manha: [], almoco: [], lanche: [], janta: [], extra: [] }, activities: [] } }
function r(v) { return Math.round(v * 10) / 10 }
function r0(v) { return Math.round(v) }
function formatDateFull(iso) {
  const dt = new Date(iso + 'T12:00:00')
  const wdays = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  return `${wdays[dt.getDay()]}, ${dt.getDate()} ${months[dt.getMonth()]}`
}
function isWeekend(iso) { const d = new Date(iso + 'T12:00:00'); return d.getDay() === 0 || d.getDay() === 6 }
function isWeekday(iso) { return !isWeekend(iso) }

function calcMacros(items, allFoods) {
  return items.reduce((a, it) => {
    if (it.avulso) {
      return { cal: a.cal + (it.cal || 0), prot: a.prot + (it.prot || 0), carb: a.carb + (it.carb || 0), fat: a.fat + (it.fat || 0) }
    }
    const f = allFoods.find(x => x.id === it.id)
    if (!f) return a
    const fixed = ['unid','dose','porção'].includes(f.unit)
    const m = fixed ? it.qty : it.qty / 100
    return { cal: a.cal + f.cal * m, prot: a.prot + f.prot * m, carb: a.carb + f.carb * m, fat: a.fat + f.fat * m }
  }, { cal: 0, prot: 0, carb: 0, fat: 0 })
}

function farolCal(c, t) { return c <= t.cal ? '#2ab8b8' : c <= t.max ? '#e8a040' : '#ef4444' }
function farolProt(p, t) { return (p >= (t.protMin || 138) && p <= (t.protMax || 163)) ? '#2ab8b8' : '#ef4444' }
function farolFat(f, t) { return f <= t.fat ? '#2ab8b8' : f <= (t.fatMax || 52) ? '#e8a040' : '#ef4444' }

async function loadFromFirebase(uid) {
  try {
    const snap = await getDoc(doc(db, 'users', uid))
    if (snap.exists()) return snap.data()
  } catch (e) { console.error('Firebase load error:', e) }
  return null
}
async function saveToFirebase(uid, data) {
  try { await setDoc(doc(db, 'users', uid), data, { merge: true }) } catch (e) { console.error('Firebase save error:', e) }
}

export default function App() {
  const [uid, setUid] = useState(null)
  const [user, setUser] = useState(null)
  const [days, setDays] = useState({})
  const [targets, setTargets] = useState(DEFAULT_TARGETS)
  const [customFoods, setCustomFoods] = useState([])
  const [weights, setWeights] = useState({})
  const [loaded, setLoaded] = useState(false)
  const [tab, setTab] = useState('today')
  const [activeMeal, setActiveMeal] = useState('cafe_manha')
  const [addingFood, setAddingFood] = useState(false)
  const [search, setSearch] = useState('')
  const [registerMode, setRegisterMode] = useState(false)
  const [editingFoodIdx, setEditingFoodIdx] = useState(null)
  const [editingDay, setEditingDay] = useState(null)
  const [showTargets, setShowTargets] = useState(false)
  const [showWeightModal, setShowWeightModal] = useState(false)
  const [analysisFilters, setAnalysisFilters] = useState([])
  const [newFood, setNewFood] = useState({ name: '', cal: '', prot: '', carb: '', fat: '', unit: 'g', def: '100', fav: [] })
  const [foodSearch, setFoodSearch] = useState('')
  const [avulso, setAvulso] = useState(false)
  const [avulsoData, setAvulsoData] = useState({ name: '', cal: '', prot: '', carb: '', fat: '' })

  const allFoods = DEFAULT_FOODS.map(f => {
    const override = customFoods.find(c => c.id === f.id)
    return override ? override : f
  }).concat(customFoods.filter(c => !DEFAULT_FOODS.find(f => f.id === c.id)))

  useEffect(() => {
    handleRedirectResult()
    initAuth((firebaseUser) => {
      if (firebaseUser) {
        setUid(firebaseUser.uid)
        setUser(firebaseUser)
        loadFromFirebase(firebaseUser.uid).then(data => {
          if (data) {
            if (data.days) setDays(data.days)
            if (data.targets) setTargets(t => ({ ...t, ...data.targets }))
            if (data.customFoods) setCustomFoods(data.customFoods)
            if (data.weights) setWeights(data.weights)
          }
          setLoaded(true)
        })
      } else {
        setUid(null)
        setUser(null)
        setLoaded(true)
      }
    })
  }, [])

  const persist = useCallback((newDays, newTargets, newCustomFoods, newWeights) => {
    if (!uid) return
    saveToFirebase(uid, { days: newDays, targets: newTargets, customFoods: newCustomFoods, weights: newWeights })
  }, [uid])

  const updateDays = (nd) => { setDays(nd); persist(nd, targets, customFoods, weights) }
  const updateTargets = (t) => { setTargets(t); persist(days, t, customFoods, weights) }
  const updateCustomFoods = (cf) => { setCustomFoods(cf); persist(days, targets, cf, weights) }
  const updateWeights = (w) => { setWeights(w); persist(days, targets, customFoods, w) }

  const activeKey = editingDay || todayKey()

  function getDay(key) {
    const d = days[key] || emptyDay()
    if (!d.meals.extra) d.meals.extra = []
    if (!d.activities) d.activities = []
    return d
  }

  function addFoodToMeal(foodId, qty) {
    const f = allFoods.find(x => x.id === foodId)
    if (!f) return
    const day = getDay(activeKey)
    const updated = { ...day, meals: { ...day.meals, [activeMeal]: [...(day.meals[activeMeal] || []), { id: foodId, qty: qty ?? f.def }] } }
    updateDays({ ...days, [activeKey]: updated })
    setAddingFood(false)
    setSearch('')
  }

  function removeFood(mealId, idx) {
    const day = days[activeKey]
    if (!day) return
    const meals = { ...day.meals, [mealId]: day.meals[mealId].filter((_, i) => i !== idx) }
    updateDays({ ...days, [activeKey]: { ...day, meals } })
  }

  function updateQty(mealId, idx, val) {
    const day = days[activeKey]
    if (!day) return
    const meals = { ...day.meals, [mealId]: day.meals[mealId].map((it, i) => i === idx ? { ...it, qty: parseFloat(val) || 0 } : it) }
    updateDays({ ...days, [activeKey]: { ...day, meals } })
  }

  function addActivityToDay(activityId) {
    const day = getDay(activeKey)
    const current = day.activities || []
    if (current.includes(activityId)) return
    updateDays({ ...days, [activeKey]: { ...day, activities: [...current, activityId] } })
  }

  function removeActivityFromDay(activityId) {
    const day = days[activeKey]
    if (!day) return
    updateDays({ ...days, [activeKey]: { ...day, activities: (day.activities || []).filter(a => a !== activityId) } })
  }

  function saveWeight(dateKey, value) {
    updateWeights({ ...weights, [dateKey]: parseFloat(value) })
  }

  if (!loaded) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0d1a1f', gap: 24 }}>
        <img src="/icon-512.png" alt="EvoShape" style={{ width: 140, height: 140, borderRadius: 32, boxShadow: '0 0 60px #c8873a40, 0 0 120px #2ab8b820' }} />
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: 4, color: '#7a9aa8', textTransform: 'uppercase' }}>Carregando...</div>
      </div>
    )
  }

  if (!uid) return <LoginScreen />

  const today = todayKey()
  const currentDay = getDay(activeKey)
  const allItems = Object.values(currentDay.meals).flat()
  const dayMacros = calcMacros(allItems, allFoods)
  const isEditing = !!editingDay
  const isToday = activeKey === today
  const dt = new Date(activeKey + 'T12:00:00')
  const wdaysH = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
  const monthsH = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  const headerDate = isToday ? `${wdaysH[dt.getDay()]}, ${dt.getDate()} de ${monthsH[dt.getMonth()]}` : `✏️ ${dt.getDate()} de ${monthsH[dt.getMonth()]}`
  const activeTargets = getTargetsForDate(targets, activeKey)
  const over = dayMacros.cal > activeTargets.max
  const inRange = dayMacros.cal >= activeTargets.min && dayMacros.cal <= activeTargets.max
  const calPct = Math.min(100, (dayMacros.cal / activeTargets.max) * 100)
  const calBarColor = over ? '#e05555' : inRange ? '#2ab8b8' : '#c8873a'
  const calDiff = activeTargets.cal - dayMacros.cal
  const hasData = dayMacros.cal > 0

  return (
    <div style={{ background: '#0d1a1f', minHeight: '100vh', fontFamily: "'Syne', system-ui, sans-serif", color: '#f0e8d8' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: '#122028', borderBottom: '1px solid #1e1e30', padding: '20px 16px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <img src="/icon-512.png" alt="" style={{ width: 22, height: 22, borderRadius: 6 }} />
                <div style={{ fontSize: 10, letterSpacing: 2, color: '#c8873a', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', fontWeight: 700 }}>EVOSHAPE</div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, marginTop: 3 }}>{headerDate}</div>
              <div style={{ display: 'inline-block', marginTop: 5, padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: !isToday ? '#92400e22' : over ? '#ef444422' : inRange && hasData ? '#2ab8b822' : '#1a2d35', color: !isToday ? '#e8a040' : over ? '#ef4444' : inRange && hasData ? '#2ab8b8' : '#6a8a98' }}>
                {!isToday ? 'Editando dia anterior' : over ? 'Excesso' : inRange && hasData ? '✓ Na meta' : '—'}
              </div>
            </div>
            <button onClick={() => setShowTargets(true)} style={{ background: '#1a2d35', border: '1px solid #2a2a40', borderRadius: 10, padding: '7px 10px', color: '#6a8a98', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>⚙ Metas</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, padding: '5px 8px', background: '#0d1a1f', borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              {user?.photoURL && <img src={user.photoURL} alt="" style={{ width: 20, height: 20, borderRadius: '50%' }} />}
              <span style={{ fontSize: 11, color: '#7a9aa8' }}>{user?.displayName || user?.email || 'Usuário'}</span>
            </div>
            <button onClick={() => logout()} style={{ background: 'none', border: 'none', color: '#7a9aa8', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>Sair</button>
          </div>
          <div style={{ background: '#0d1a1f', borderRadius: 14, padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 30, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: '#f0e8d8' }}>{r0(dayMacros.cal)}</span>
                <span style={{ fontSize: 12, color: '#7a9aa8' }}>/ {activeTargets.cal} kcal</span>
                {hasData && <span style={{ width: 8, height: 8, borderRadius: '50%', background: farolCal(dayMacros.cal, activeTargets), display: 'inline-block' }} />}
              </div>
              <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: over ? '#ef4444' : inRange ? '#2ab8b8' : '#7a9aa8' }}>
                {calDiff >= 0 ? `−${r0(calDiff)}` : `+${r0(-calDiff)}`} kcal
              </span>
            </div>
            <div style={{ background: '#1a2d35', borderRadius: 4, height: 8, overflow: 'hidden', marginBottom: 12 }}>
              <div style={{ height: '100%', width: calPct + '%', background: calBarColor, borderRadius: 4, transition: 'width .5s' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { label: 'Proteína', val: dayMacros.prot, target: activeTargets.prot, color: '#2ab8b8', farol: hasData ? farolProt(dayMacros.prot, activeTargets) : null },
                { label: 'Carb', val: dayMacros.carb, target: activeTargets.carb, color: '#e8a040', farol: null },
                { label: 'Gordura', val: dayMacros.fat, target: activeTargets.fat, color: '#e07060', farol: hasData ? farolFat(dayMacros.fat, activeTargets) : null },
              ].map(m => (
                <div key={m.label} style={{ background: '#122028', borderRadius: 10, padding: '8px 10px', position: 'relative' }}>
                  {m.farol && <span style={{ position: 'absolute', top: 8, right: 8, width: 7, height: 7, borderRadius: '50%', background: m.farol }} />}
                  <div style={{ fontSize: 9, color: '#7a9aa8', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: 1 }}>{m.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: m.color, marginTop: 3, fontFamily: 'JetBrains Mono, monospace' }}>
                    {r(m.val)}<span style={{ fontSize: 9, color: '#7a9aa8' }}>/{m.target}g</span>
                  </div>
                  <div style={{ background: '#1a2d35', borderRadius: 3, height: 4, marginTop: 5, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: Math.min(100, (m.val / m.target) * 100) + '%', background: m.color, transition: 'width .4s' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', marginTop: 14, gap: 2, overflowX: 'auto' }}>
            {[
              { id: 'today', label: 'Hoje', icon: '🏠' },
              { id: 'treino', label: 'Treino', icon: '💪' },
              { id: 'peso', label: 'Peso', icon: '⚖️' },
              { id: 'history', label: 'Histórico', icon: '📅' },
              { id: 'analysis', label: 'Análise', icon: '📊' },
              { id: 'foods', label: 'Alimentos', icon: '🥗' },
            ].map(t => (
              <button key={t.id} onClick={() => { setTab(t.id); setEditingDay(null); setAddingFood(false); setSearch(''); setRegisterMode(false) }}
                style={{ flex: 1, minWidth: 52, padding: '8px 0', border: 'none', background: 'transparent', color: tab === t.id ? '#f0e8d8' : '#6a8a98', fontWeight: tab === t.id ? 700 : 500, fontSize: 10, cursor: 'pointer', fontFamily: 'inherit', borderBottom: `2px solid ${tab === t.id ? '#c8873a' : 'transparent'}`, transition: 'all .2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <span style={{ fontSize: 16 }}>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, padding: '16px 16px 100px', overflowY: 'auto' }}>
          {(tab === 'today' || editingDay) && renderDayEditor()}
          {tab === 'history' && !editingDay && renderHistory()}
          {tab === 'analysis' && !editingDay && renderAnalysis()}
          {tab === 'treino' && !editingDay && renderTreino()}
          {tab === 'peso' && !editingDay && renderPeso()}
          {tab === 'foods' && !editingDay && renderFoods()}
        </div>
      </div>
      {showTargets && <TargetsModal targets={targets} onSave={t => { updateTargets(t); setShowTargets(false) }} onClose={() => setShowTargets(false)} />}
      {showWeightModal && <WeightModal onSave={(date, val) => { saveWeight(date, val); setShowWeightModal(false) }} onClose={() => setShowWeightModal(false)} />}
    </div>
  )

  function renderDayEditor() {
    const meal = MEALS.find(m => m.id === activeMeal)
    const items = currentDay.meals[activeMeal] || []
    const mealMacros = calcMacros(items, allFoods)
    const favFoods = allFoods.filter(f => f.fav && f.fav.includes(activeMeal))
    const otherFoods = allFoods.filter(f => !f.fav || !f.fav.includes(activeMeal))
    const filtered = search ? allFoods.filter(f => f.name.toLowerCase().includes(search.toLowerCase())) : null
    return (
      <div>
        {isEditing && (
          <button onClick={() => { setEditingDay(null); setTab('history') }} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#6a8a98', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', padding: 0, marginBottom: 14 }}>
            ← Voltar ao histórico
          </button>
        )}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
          {MEALS.map(m => {
            const mac = calcMacros(currentDay.meals[m.id] || [], allFoods)
            const active = activeMeal === m.id
            return (
              <button key={m.id} onClick={() => { setActiveMeal(m.id); setAddingFood(false); setSearch('') }}
                style={{ flexShrink: 0, minWidth: 68, padding: '8px 6px', border: `2px solid ${active ? m.color : '#1a2d35'}`, borderRadius: 12, background: active ? m.color + '18' : '#122028', cursor: 'pointer', textAlign: 'center', fontFamily: 'inherit' }}>
                <div style={{ fontSize: 16 }}>{m.icon}</div>
                <div style={{ fontSize: 9, fontWeight: 700, marginTop: 2, color: active ? m.color : '#6a8a98' }}>{m.short}</div>
                <div style={{ fontSize: 10, color: '#7a9aa8', fontFamily: 'JetBrains Mono, monospace' }}>{r0(mac.cal)}</div>
              </button>
            )
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: meal.color }}>{meal.icon} {meal.label}</div>
          <div style={{ fontSize: 10, color: '#7a9aa8', fontFamily: 'JetBrains Mono, monospace' }}>{r0(mealMacros.cal)} kcal · P:{r(mealMacros.prot)} · C:{r(mealMacros.carb)} · G:{r(mealMacros.fat)}</div>
        </div>
        {items.length === 0 && !addingFood && <div style={{ textAlign: 'center', padding: '20px 0', color: '#2d4a58', fontSize: 13 }}>Nenhum alimento registrado</div>}
        {items.map((it, idx) => {
          const f = allFoods.find(x => x.id === it.id)
          if (!f) return null
          const fixed = ['unid','dose','porção'].includes(f.unit)
          const m = fixed ? it.qty : it.qty / 100
          return (
            <div key={idx} style={{ background: '#122028', borderRadius: 12, padding: '10px 12px', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 8, border: '0.5px solid #1e1e30' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</div>
                <div style={{ fontSize: 11, color: '#7a9aa8', fontFamily: 'JetBrains Mono, monospace', marginTop: 2 }}>{r0(f.cal * m)} kcal · P:{r(f.prot * m)}g · C:{r(f.carb * m)}g · G:{r(f.fat * m)}g</div>
              </div>
              <input type="number" value={it.qty} onChange={e => updateQty(activeMeal, idx, e.target.value)}
                style={{ width: 52, textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, padding: '5px 4px', border: '0.5px solid #2a2a40', borderRadius: 8, background: '#1a2d35', color: '#f0e8d8' }} />
              <span style={{ fontSize: 10, color: '#7a9aa8', minWidth: 26 }}>{f.unit}</span>
              <button onClick={() => removeFood(activeMeal, idx)} style={{ background: '#ef444420', border: 'none', borderRadius: 8, width: 28, height: 28, color: '#ef4444', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>×</button>
            </div>
          )
        })}
        {!addingFood ? (
          <button onClick={() => setAddingFood(true)} style={{ width: '100%', padding: 12, border: '1.5px dashed #2a2a40', borderRadius: 12, background: 'transparent', color: '#7a9aa8', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', marginTop: 4 }}>
            + Adicionar alimento
          </button>
        ) : (
          <div style={{ background: '#122028', borderRadius: 14, padding: 14, border: '0.5px solid #2a2a40', marginTop: 8 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar alimento..."
                style={{ flex: 1, background: '#1a2d35', border: '0.5px solid #2a2a40', borderRadius: 10, padding: '10px 12px', color: '#f0e8d8', fontSize: 14, fontFamily: 'inherit' }} />
              <button onClick={() => { setAddingFood(false); setSearch(''); setAvulso(false) }} style={{ background: '#1a2d35', border: 'none', borderRadius: 10, padding: '0 12px', color: '#6a8a98', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>

            {!avulso && (
              <button onClick={() => { setAvulso(true); setSearch('') }}
                style={{ width: '100%', padding: '10px', border: '1px dashed #c8873a60', borderRadius: 10, background: '#c8873a0a', color: '#c8873a', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                ⚡ Entrada avulsa (evento, estimativa...)
              </button>
            )}

            {avulso && (
              <div style={{ background: '#1a2d35', borderRadius: 12, padding: 12, marginBottom: 10, border: '1px solid #c8873a40' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#c8873a' }}>⚡ Entrada avulsa</span>
                  <button onClick={() => setAvulso(false)} style={{ background: 'none', border: 'none', color: '#6a8a98', cursor: 'pointer', fontSize: 16 }}>×</button>
                </div>
                <input
                  placeholder="Nome (ex: Evento, Pizza, Churrasco...)"
                  value={avulsoData.name}
                  onChange={e => setAvulsoData(p => ({ ...p, name: e.target.value }))}
                  style={{ width: '100%', background: '#122028', border: '0.5px solid #1e3540', borderRadius: 8, padding: '8px 10px', color: '#f0e8d8', fontSize: 13, fontFamily: 'inherit', marginBottom: 8 }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
                  {[
                    { key: 'cal', label: 'Kcal', color: '#c8873a' },
                    { key: 'prot', label: 'Proteína (g)', color: '#2ab8b8' },
                    { key: 'carb', label: 'Carb (g)', color: '#e8a040' },
                    { key: 'fat', label: 'Gordura (g)', color: '#e07060' },
                  ].map(f => (
                    <div key={f.key}>
                      <div style={{ fontSize: 10, color: f.color, marginBottom: 3, fontFamily: 'JetBrains Mono, monospace' }}>{f.label}</div>
                      <input type="number" placeholder="0" value={avulsoData[f.key]}
                        onChange={e => setAvulsoData(p => ({ ...p, [f.key]: e.target.value }))}
                        style={{ width: '100%', background: '#122028', border: '0.5px solid #1e3540', borderRadius: 8, padding: '7px 8px', color: '#f0e8d8', fontSize: 13, fontFamily: 'JetBrains Mono, monospace' }} />
                    </div>
                  ))}
                </div>
                <button onClick={() => {
                    if (!avulsoData.name && !avulsoData.cal) return
                    const id = 'avulso_' + Date.now()
                    const day = getDay(activeKey)
                    const item = { id, qty: 1, avulso: true, name: avulsoData.name || 'Entrada avulsa', cal: parseFloat(avulsoData.cal) || 0, prot: parseFloat(avulsoData.prot) || 0, carb: parseFloat(avulsoData.carb) || 0, fat: parseFloat(avulsoData.fat) || 0 }
                    updateDays({ ...days, [activeKey]: { ...day, meals: { ...day.meals, [activeMeal]: [...(day.meals[activeMeal] || []), item] } } })
                    setAvulsoData({ name: '', cal: '', prot: '', carb: '', fat: '' })
                    setAvulso(false)
                    setAddingFood(false)
                  }}
                  style={{ width: '100%', padding: '10px', background: 'linear-gradient(135deg, #c8873a, #e8a040)', border: 'none', borderRadius: 10, color: '#0d1a1f', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Adicionar à refeição
                </button>
              </div>
            )}

            {!avulso && <div style={{ maxHeight: 280, overflowY: 'auto' }}>
              {!search && favFoods.length > 0 && (<>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#7a9aa8', textTransform: 'uppercase', letterSpacing: 1, margin: '4px 0 8px', fontFamily: 'JetBrains Mono, monospace' }}>⭐ Favoritos desta refeição</div>
                {favFoods.map(f => <FoodRow key={f.id} food={f} onAdd={addFoodToMeal} mealId={activeMeal} />)}
                <div style={{ fontSize: 10, fontWeight: 700, color: '#7a9aa8', textTransform: 'uppercase', letterSpacing: 1, margin: '12px 0 8px', fontFamily: 'JetBrains Mono, monospace' }}>Todos os alimentos</div>
                {otherFoods.map(f => <FoodRow key={f.id} food={f} onAdd={addFoodToMeal} mealId={activeMeal} />)}
              </>)}
              {!search && favFoods.length === 0 && allFoods.map(f => <FoodRow key={f.id} food={f} onAdd={addFoodToMeal} mealId={activeMeal} />)}
              {search && (filtered.length > 0
                ? filtered.map(f => <FoodRow key={f.id} food={f} onAdd={addFoodToMeal} mealId={activeMeal} />)
                : <div style={{ padding: '20px', textAlign: 'center', color: '#2d4a58', fontSize: 13 }}>Nenhum resultado</div>
              )}
            </div>}
          </div>
        )}
        <div style={{ marginTop: 16, background: '#122028', borderRadius: 14, padding: 14, border: '0.5px solid #1e1e30' }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: '#c8873a' }}>💪 Atividades do dia</div>
          {(currentDay.activities || []).length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {(currentDay.activities || []).map(actId => {
                const act = ACTIVITIES.find(a => a.id === actId)
                if (!act) return null
                return (
                  <div key={actId} style={{ display: 'flex', alignItems: 'center', gap: 5, background: act.color + '20', border: `1px solid ${act.color}40`, borderRadius: 20, padding: '5px 10px' }}>
                    <span style={{ fontSize: 13 }}>{act.icon}</span>
                    <span style={{ fontSize: 11, color: act.color, fontWeight: 600 }}>{act.label}</span>
                    <button onClick={() => removeActivityFromDay(actId)} style={{ background: 'none', border: 'none', color: act.color, cursor: 'pointer', fontSize: 14, padding: 0 }}>×</button>
                  </div>
                )
              })}
            </div>
          )}
          {(currentDay.activities || []).length === 0 && <div style={{ fontSize: 12, color: '#2d4a58', marginBottom: 10 }}>Nenhuma atividade registrada</div>}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {ACTIVITIES.map(act => {
              const done = (currentDay.activities || []).includes(act.id)
              return (
                <button key={act.id} onClick={() => addActivityToDay(act.id)} disabled={done}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', border: `1px solid ${done ? act.color : '#1e3540'}`, borderRadius: 20, background: done ? act.color + '20' : 'transparent', cursor: done ? 'default' : 'pointer', fontFamily: 'inherit' }}>
                  <span style={{ fontSize: 12 }}>{act.icon}</span>
                  <span style={{ fontSize: 10, color: done ? act.color : '#6a8a98', fontWeight: done ? 700 : 400 }}>{act.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  function renderHistory() {
    const entries = Object.entries(days).sort(([a], [b]) => b.localeCompare(a)).slice(0, 60)
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: '#7a9aa8' }}>{entries.length} dias · Toque para editar</div>
          <button onClick={() => {
            const input = document.createElement('input')
            input.type = 'date'
            input.max = todayKey()
            input.value = todayKey()
            input.style.cssText = 'position:fixed;opacity:0;top:50%;left:50%'
            document.body.appendChild(input)
            input.showPicker?.()
            input.addEventListener('change', e => {
              const chosen = e.target.value
              if (chosen) {
                if (!days[chosen]) updateDays({ ...days, [chosen]: emptyDay() })
                setEditingDay(chosen)
                setActiveMeal('cafe_manha')
                setAddingFood(false)
                setSearch('')
              }
              try { document.body.removeChild(input) } catch(e) {}
            })
            input.addEventListener('blur', () => { try { document.body.removeChild(input) } catch(e){} })
          }} style={{ background: 'linear-gradient(135deg, #c8873a, #e8a040)', border: 'none', borderRadius: 10, padding: '6px 12px', color: '#fff', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>
            + Dia anterior
          </button>
        </div>
        {entries.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#2d4a58', fontSize: 13 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
            Nenhum dia registrado. Clique em "+ Dia anterior"!
          </div>
        )}
        {entries.map(([day, data]) => {
          const isTod = day === today
          const all = Object.values(data.meals || {}).flat()
          const mac = calcMacros(all, allFoods)
          const ov = mac.cal > targets.max, ok = mac.cal >= targets.min && mac.cal <= targets.max
          const col = ov ? '#ef4444' : ok ? '#2ab8b8' : '#e8a040'
          const lbl = ov ? 'Excesso' : ok ? '✓ Na meta' : 'Abaixo'
          const acts = data.activities || []
          return (
            <div key={day} onClick={() => { setEditingDay(day); setActiveMeal('cafe_manha'); setAddingFood(false); setSearch('') }}
              style={{ background: '#122028', borderRadius: 12, padding: '12px 14px', marginBottom: 8, border: '0.5px solid #1e1e30', cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{formatDateFull(day)}</div>
                  {isTod && <span style={{ fontSize: 10, background: '#c8873a20', color: '#c8873a', padding: '1px 7px', borderRadius: 10 }}>hoje</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {acts.length > 0 && <span style={{ fontSize: 11 }}>{acts.slice(0,2).map(id => ACTIVITIES.find(a=>a.id===id)?.icon || '').join('')}</span>}
                  <span style={{ fontSize: 11, fontWeight: 700, color: col, fontFamily: 'JetBrains Mono, monospace' }}>{lbl}</span>
                  <span style={{ fontSize: 13, color: '#7a9aa8' }}>✏️</span>
                </div>
              </div>
              <div style={{ background: '#1a2d35', borderRadius: 4, height: 6, marginBottom: 7, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: Math.min(110, (mac.cal / targets.cal) * 100) + '%', background: col, borderRadius: 4 }} />
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>
                <span style={{ fontWeight: 700 }}>{r0(mac.cal)} kcal</span>
                <span style={{ color: '#2ab8b8' }}>P:{r(mac.prot)}g</span>
                <span style={{ color: '#e8a040' }}>C:{r(mac.carb)}g</span>
                <span style={{ color: '#e07060' }}>G:{r(mac.fat)}g</span>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  function renderTreino() {
    const todayActivities = currentDay.activities || []
    const d = new Date()
    const dayOfWeek = d.getDay()
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = new Date(d)
    monday.setDate(d.getDate() + diffToMonday)
    const weekDays = []
    for (let i = 0; i < 7; i++) {
      const wd = new Date(monday)
      wd.setDate(monday.getDate() + i)
      const y = wd.getFullYear()
      const mo = String(wd.getMonth() + 1).padStart(2, '0')
      const dy = String(wd.getDate()).padStart(2, '0')
      weekDays.push(`${y}-${mo}-${dy}`)
    }
    const weekStrength = weekDays.filter(wd => (days[wd]?.activities || []).some(a => ACTIVITIES.find(x => x.id === a)?.type === 'strength')).length
    const weekCardio = weekDays.filter(wd => (days[wd]?.activities || []).some(a => ACTIVITIES.find(x => x.id === a)?.type === 'cardio')).length
    const strengthFarol = weekStrength >= 4 ? '#2ab8b8' : weekStrength === 3 ? '#e8a040' : '#ef4444'
    const cardioFarol = weekCardio >= 1 ? '#2ab8b8' : '#ef4444'
    return (
      <div>
        <div style={{ background: '#122028', borderRadius: 14, padding: 14, marginBottom: 14, border: '0.5px solid #1e1e30' }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>📅 Semana atual</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ background: '#0d1a1f', borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: strengthFarol, display: 'inline-block' }} />
                <span style={{ fontSize: 11, color: '#6a8a98' }}>Musculação</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: strengthFarol, fontFamily: 'JetBrains Mono, monospace' }}>{weekStrength}<span style={{ fontSize: 12, color: '#7a9aa8', fontWeight: 400 }}>/4x</span></div>
              <div style={{ fontSize: 10, color: '#7a9aa8', marginTop: 2 }}>{weekStrength >= 4 ? 'Meta atingida! ✓' : weekStrength === 3 ? 'Quase lá!' : 'Abaixo da meta'}</div>
            </div>
            <div style={{ background: '#0d1a1f', borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: cardioFarol, display: 'inline-block' }} />
                <span style={{ fontSize: 11, color: '#6a8a98' }}>Cardio</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: cardioFarol, fontFamily: 'JetBrains Mono, monospace' }}>{weekCardio}<span style={{ fontSize: 12, color: '#7a9aa8', fontWeight: 400 }}>/1x</span></div>
              <div style={{ fontSize: 10, color: '#7a9aa8', marginTop: 2 }}>{weekCardio >= 1 ? 'Meta atingida! ✓' : 'Sem cardio essa semana'}</div>
            </div>
          </div>
        </div>
        <div style={{ background: '#122028', borderRadius: 14, padding: 14, border: '0.5px solid #1e1e30' }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>🏋️ Atividades de hoje</div>
          {todayActivities.length === 0 && <div style={{ fontSize: 12, color: '#2d4a58', marginBottom: 10 }}>Nenhuma atividade registrada</div>}
          {todayActivities.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {todayActivities.map(actId => {
                const act = ACTIVITIES.find(a => a.id === actId)
                if (!act) return null
                return (
                  <div key={actId} style={{ display: 'flex', alignItems: 'center', gap: 6, background: act.color + '20', border: `1px solid ${act.color}40`, borderRadius: 20, padding: '6px 12px' }}>
                    <span style={{ fontSize: 14 }}>{act.icon}</span>
                    <span style={{ fontSize: 12, color: act.color, fontWeight: 600 }}>{act.label}</span>
                    <button onClick={() => removeActivityFromDay(actId)} style={{ background: 'none', border: 'none', color: act.color, cursor: 'pointer', fontSize: 14, padding: 0 }}>×</button>
                  </div>
                )
              })}
            </div>
          )}
          <div style={{ fontSize: 11, color: '#7a9aa8', marginBottom: 8, fontWeight: 600 }}>Adicionar atividade:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {ACTIVITIES.map(act => {
              const done = todayActivities.includes(act.id)
              return (
                <button key={act.id} onClick={() => addActivityToDay(act.id)} disabled={done}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', border: `1px solid ${done ? act.color : '#1e3540'}`, borderRadius: 20, background: done ? act.color + '20' : 'transparent', cursor: done ? 'default' : 'pointer', fontFamily: 'inherit' }}>
                  <span style={{ fontSize: 13 }}>{act.icon}</span>
                  <span style={{ fontSize: 11, color: done ? act.color : '#6a8a98', fontWeight: done ? 700 : 400 }}>{act.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  function renderPeso() {
    const weightEntries = Object.entries(weights).sort(([a], [b]) => b.localeCompare(a))
    const latestWeight = weightEntries[0]?.[1] || null
    const prevWeight = weightEntries[1]?.[1] || null
    const weightDiff = latestWeight && prevWeight ? (latestWeight - prevWeight).toFixed(1) : null
    const chartEntries = [...weightEntries].reverse()
    const wVals = chartEntries.map(([, v]) => v)
    return (
      <div>
        <div style={{ background: '#122028', borderRadius: 14, padding: 16, marginBottom: 14, border: '0.5px solid #1e1e30' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>⚖️ Peso Corporal</div>
            <button onClick={() => setShowWeightModal(true)} style={{ background: '#c8873a', border: 'none', borderRadius: 10, padding: '7px 14px', color: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>+ Registrar</button>
          </div>
          {latestWeight ? (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: 40, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: '#f0e8d8' }}>{latestWeight}</span>
                <span style={{ fontSize: 16, color: '#7a9aa8' }}>kg</span>
                {weightDiff !== null && (
                  <span style={{ fontSize: 13, fontWeight: 700, color: parseFloat(weightDiff) < 0 ? '#2ab8b8' : parseFloat(weightDiff) > 0 ? '#ef4444' : '#7a9aa8' }}>
                    {parseFloat(weightDiff) > 0 ? '+' : ''}{weightDiff} kg
                  </span>
                )}
              </div>
              {weightEntries.length >= 2 && (() => {
                const first = weightEntries[weightEntries.length - 1][1]
                const last = weightEntries[0][1]
                const diff = (last - first).toFixed(1)
                return (
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <div style={{ flex: 1, background: '#0d1a1f', borderRadius: 10, padding: '8px 10px', textAlign: 'center' }}>
                      <div style={{ fontSize: 9, color: '#7a9aa8', marginBottom: 3 }}>INICIAL</div>
                      <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{first} kg</div>
                    </div>
                    <div style={{ flex: 1, background: '#0d1a1f', borderRadius: 10, padding: '8px 10px', textAlign: 'center' }}>
                      <div style={{ fontSize: 9, color: '#7a9aa8', marginBottom: 3 }}>VARIAÇÃO</div>
                      <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: parseFloat(diff) < 0 ? '#2ab8b8' : parseFloat(diff) > 0 ? '#ef4444' : '#7a9aa8' }}>
                        {parseFloat(diff) > 0 ? '+' : ''}{diff} kg
                      </div>
                    </div>
                    <div style={{ flex: 1, background: '#0d1a1f', borderRadius: 10, padding: '8px 10px', textAlign: 'center' }}>
                      <div style={{ fontSize: 9, color: '#7a9aa8', marginBottom: 3 }}>REGISTROS</div>
                      <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{weightEntries.length}x</div>
                    </div>
                  </div>
                )
              })()}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#2d4a58', fontSize: 13 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>⚖️</div>
              Nenhum peso registrado ainda.<br />Registre toda segunda de manhã!
            </div>
          )}
        </div>
        {wVals.length >= 2 && (() => {
          const W = 340, H = 100, PL = 8, PR = 8, PT = 12, PB = 20
          const maxV = Math.max(...wVals) + 0.5
          const minV = Math.min(...wVals) - 0.5
          const cx = i => PL + (i / Math.max(wVals.length - 1, 1)) * (W - PL - PR)
          const cy = v => PT + (1 - (v - minV) / (maxV - minV)) * (H - PT - PB)
          const pts = wVals.map((v, i) => `${cx(i)},${cy(v)}`).join(' ')
          const trend = wVals[wVals.length - 1] < wVals[0] ? '#2ab8b8' : '#ef4444'
          return (
            <div style={{ background: '#122028', borderRadius: 14, padding: 14, marginBottom: 14, border: '0.5px solid #1e1e30' }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>📈 Evolução</div>
              <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H }}>
                <polyline points={pts} fill="none" stroke={trend} strokeWidth="2" strokeLinejoin="round" />
                {wVals.map((v, i) => (
                  <g key={i}>
                    <circle cx={cx(i)} cy={cy(v)} r="4" fill={trend} />
                    <text x={cx(i)} y={cy(v) - 6} fontSize="8" fill="#8888aa" textAnchor="middle">{v}</text>
                  </g>
                ))}
              </svg>
            </div>
          )
        })()}
        <div style={{ background: '#122028', borderRadius: 14, padding: 14, border: '0.5px solid #1e1e30' }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Histórico</div>
          {weightEntries.length === 0 && <div style={{ textAlign: 'center', padding: '16px 0', color: '#2d4a58', fontSize: 13 }}>Nenhum registro ainda</div>}
          {weightEntries.map(([date, val], idx) => {
            const prev = weightEntries[idx + 1]?.[1]
            const diff = prev ? (val - prev).toFixed(1) : null
            return (
              <div key={date} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: idx < weightEntries.length - 1 ? '0.5px solid #1e1e30' : 'none' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{formatDateFull(date)}</div>
                  {diff !== null && <div style={{ fontSize: 11, color: parseFloat(diff) < 0 ? '#2ab8b8' : parseFloat(diff) > 0 ? '#ef4444' : '#7a9aa8', marginTop: 2 }}>{parseFloat(diff) > 0 ? '+' : ''}{diff} kg vs anterior</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>{val} kg</span>
                  <button onClick={() => { if (window.confirm('Remover?')) { const w = { ...weights }; delete w[date]; updateWeights(w) } }}
                    style={{ background: '#ef444418', border: 'none', borderRadius: 8, width: 26, height: 26, color: '#ef4444', cursor: 'pointer', fontSize: 14 }}>×</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  function renderAnalysis() {
    const allEntries = Object.entries(days).filter(([d]) => d !== todayKey()).sort(([a], [b]) => a.localeCompare(b))
    if (allEntries.length < 2) return (
      <div style={{ textAlign: 'center', padding: '48px 20px', color: '#2d4a58' }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>📊</div>
        <div style={{ fontSize: 14 }}>Registre pelo menos 2 dias para ver as análises</div>
      </div>
    )
    const hasTraining = (iso) => (days[iso]?.activities || []).length > 0
    const toggleFilter = (id) => {
      setAnalysisFilters(prev => {
        const periodFilters = ['weekday', 'weekend']
        const trainingFilters = ['training', 'notraining']
        if (prev.includes(id)) return prev.filter(f => f !== id)
        let next = [...prev]
        if (periodFilters.includes(id)) next = next.filter(f => !periodFilters.includes(f))
        if (trainingFilters.includes(id)) next = next.filter(f => !trainingFilters.includes(f))
        return [...next, id]
      })
    }
    const applyFilters = (entries, filters) => entries.filter(([d]) => {
      if (filters.includes('weekday') && !isWeekday(d)) return false
      if (filters.includes('weekend') && !isWeekend(d)) return false
      if (filters.includes('training') && !hasTraining(d)) return false
      if (filters.includes('notraining') && hasTraining(d)) return false
      return true
    })
    const filteredEntries = applyFilters(allEntries, analysisFilters)
    const last14 = filteredEntries.slice(-14)
    const avgMacros = (entries) => {
      if (!entries.length) return { cal: 0, prot: 0, carb: 0, fat: 0, n: 0 }
      const sum = entries.reduce((a, [, d]) => { const m = calcMacros(Object.values(d.meals || {}).flat(), allFoods); return { cal: a.cal + m.cal, prot: a.prot + m.prot, carb: a.carb + m.carb, fat: a.fat + m.fat } }, { cal: 0, prot: 0, carb: 0, fat: 0 })
      const n = entries.length
      return { cal: r0(sum.cal / n), prot: r0(sum.prot / n), carb: r0(sum.carb / n), fat: r0(sum.fat / n), n }
    }
    const avg = avgMacros(filteredEntries)
    const baseEntries = filteredEntries.length > 0 ? filteredEntries : allEntries
    const compAll = avgMacros(allEntries)
    const compWeekday = avgMacros(baseEntries.filter(([d]) => isWeekday(d)))
    const compWeekend = avgMacros(baseEntries.filter(([d]) => isWeekend(d)))
    const compTraining = avgMacros(baseEntries.filter(([d]) => hasTraining(d)))
    const compNoTraining = avgMacros(baseEntries.filter(([d]) => !hasTraining(d)))
    const within = filteredEntries.filter(([, d]) => { const m = calcMacros(Object.values(d.meals || {}).flat(), allFoods); return m.cal >= targets.min && m.cal <= targets.max })
    const over = filteredEntries.filter(([, d]) => { const m = calcMacros(Object.values(d.meals || {}).flat(), allFoods); return m.cal > targets.max })
    const under = filteredEntries.filter(([, d]) => { const m = calcMacros(Object.values(d.meals || {}).flat(), allFoods); return m.cal < targets.min && m.cal > 0 })
    const vals = last14.map(([, d]) => r0(calcMacros(Object.values(d.meals || {}).flat(), allFoods).cal))
    const maxV = vals.length ? Math.max(...vals, targets.max) * 1.1 : 2000
    const W = 340, H = 90, PL = 8, PR = 8, PT = 8, PB = 16
    const cx = i => PL + (i / Math.max(vals.length - 1, 1)) * (W - PL - PR)
    const cy = v => PT + (1 - v / maxV) * (H - PT - PB)
    const pc = v => v > targets.max ? '#ef4444' : v < targets.min ? '#e8a040' : '#2ab8b8'
    const pts = vals.map((v, i) => `${cx(i)},${cy(v)}`).join(' ')
    const activeLabel = () => {
      const parts = []
      if (analysisFilters.includes('weekday')) parts.push('Seg–Sex')
      if (analysisFilters.includes('weekend')) parts.push('Fim de semana')
      if (analysisFilters.includes('training')) parts.push('com treino')
      if (analysisFilters.includes('notraining')) parts.push('sem treino')
      return parts.length ? parts.join(' + ') : 'Todos os dias'
    }
    const filterBtns = [
      { id: 'weekday', label: '💼 Seg–Sex' },
      { id: 'weekend', label: '🎉 Fim de semana' },
      { id: 'training', label: '💪 Com treino' },
      { id: 'notraining', label: '🛋️ Sem treino' },
    ]
    return (
      <div>
        <div style={{ background: '#122028', borderRadius: 14, padding: 12, marginBottom: 14, border: '0.5px solid #1e1e30' }}>
          <div style={{ fontSize: 11, color: '#7a9aa8', marginBottom: 8, fontFamily: 'JetBrains Mono, monospace' }}>FILTROS — combine para comparar</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {filterBtns.map(f => {
              const active = analysisFilters.includes(f.id)
              return (
                <button key={f.id} onClick={() => toggleFilter(f.id)}
                  style={{ padding: '6px 12px', borderRadius: 20, border: `1.5px solid ${active ? '#c8873a' : '#1e3540'}`, background: active ? '#c8873a20' : 'transparent', color: active ? '#c8873a' : '#6a8a98', fontSize: 11, fontWeight: active ? 700 : 400, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                  {f.label}{active ? ' ✓' : ''}
                </button>
              )
            })}
            {analysisFilters.length > 0 && (
              <button onClick={() => setAnalysisFilters([])} style={{ padding: '6px 12px', borderRadius: 20, border: '1.5px solid #ef444440', background: '#ef444410', color: '#ef4444', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>✕ Limpar</button>
            )}
          </div>
          {analysisFilters.length > 0 && <div style={{ marginTop: 8, fontSize: 11, color: '#c8873a', fontWeight: 600 }}>Mostrando: {activeLabel()} — {filteredEntries.length} dias</div>}
        </div>
        {filteredEntries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 20px', color: '#2d4a58', background: '#122028', borderRadius: 14, border: '0.5px solid #1e1e30' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
            <div style={{ fontSize: 13 }}>Nenhum dia com esses filtros</div>
          </div>
        ) : (<>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
            {[{ label: 'Na meta', count: within.length, color: '#2ab8b8' }, { label: 'Excesso', count: over.length, color: '#ef4444' }, { label: 'Abaixo', count: under.length, color: '#e8a040' }].map(s => (
              <div key={s.label} style={{ background: '#122028', borderRadius: 12, padding: '10px 8px', textAlign: 'center', border: '0.5px solid #1e1e30' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: 'JetBrains Mono, monospace' }}>{s.count}</div>
                <div style={{ fontSize: 10, color: '#6a8a98' }}>{s.label}</div>
                <div style={{ fontSize: 9, color: '#2d4a58', fontFamily: 'JetBrains Mono, monospace' }}>/{filteredEntries.length}d</div>
              </div>
            ))}
          </div>
          <div style={{ background: '#122028', borderRadius: 14, padding: 14, marginBottom: 12, border: '0.5px solid #1e1e30' }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>Média — {activeLabel()} ({filteredEntries.length} dias)</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 32, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: avg.cal > targets.max ? '#ef4444' : avg.cal >= targets.min ? '#2ab8b8' : '#e8a040' }}>{avg.cal}</span>
              <span style={{ fontSize: 13, color: '#7a9aa8' }}>kcal/dia</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[{ l: 'Proteína', v: avg.prot, c: '#2ab8b8', t: targets.prot }, { l: 'Carb', v: avg.carb, c: '#e8a040', t: targets.carb }, { l: 'Gordura', v: avg.fat, c: '#e07060', t: targets.fat }].map(m => (
                <div key={m.l} style={{ background: '#0d1a1f', borderRadius: 10, padding: '8px' }}>
                  <div style={{ fontSize: 9, color: '#7a9aa8', marginBottom: 3 }}>{m.l}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: m.c, fontFamily: 'JetBrains Mono, monospace' }}>{m.v}g</div>
                  <div style={{ background: '#1a2d35', borderRadius: 3, height: 4, marginTop: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: Math.min(100, (m.v / m.t) * 100) + '%', background: m.c }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          {vals.length >= 2 && (
            <div style={{ background: '#122028', borderRadius: 14, padding: 14, marginBottom: 12, border: '0.5px solid #1e1e30' }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>Calorias — {activeLabel()}</div>
              <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H }}>
                <line x1={PL} y1={cy(targets.max)} x2={W - PR} y2={cy(targets.max)} stroke="#10b98140" strokeWidth="1" strokeDasharray="3,3" />
                <line x1={PL} y1={cy(targets.min)} x2={W - PR} y2={cy(targets.min)} stroke="#f59e0b40" strokeWidth="1" strokeDasharray="3,3" />
                <line x1={PL} y1={cy(targets.cal)} x2={W - PR} y2={cy(targets.cal)} stroke="#6366f160" strokeWidth="1.5" strokeDasharray="5,4" />
                <polyline points={pts} fill="none" stroke="#6366f170" strokeWidth="1.5" strokeLinejoin="round" />
                {vals.map((v, i) => <circle key={i} cx={cx(i)} cy={cy(v)} r="4" fill={pc(v)} />)}
              </svg>
              <div style={{ display: 'flex', gap: 12, fontSize: 10, color: '#7a9aa8', fontFamily: 'JetBrains Mono, monospace', marginTop: 6 }}>
                <span style={{ color: '#2ab8b8' }}>● meta</span><span style={{ color: '#e8a040' }}>● abaixo</span><span style={{ color: '#ef4444' }}>● excesso</span>
              </div>
            </div>
          )}
          <div style={{ background: '#122028', borderRadius: 14, padding: 14, marginBottom: 12, border: '0.5px solid #1e1e30' }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>📊 Comparativo de médias</div>
            <div style={{ fontSize: 10, color: '#7a9aa8', marginBottom: 12 }}>{analysisFilters.length > 0 ? `Dentro do filtro: ${activeLabel()}` : `Todos os ${allEntries.length} dias`}</div>
            {[
              { label: '📊 Geral', data: compAll, show: true },
              { label: '💼 Seg–Sex', data: compWeekday, show: !analysisFilters.includes('weekend') },
              { label: '🎉 Fim de semana', data: compWeekend, show: !analysisFilters.includes('weekday') },
              { label: '💪 Com treino', data: compTraining, show: !analysisFilters.includes('notraining') },
              { label: '🛋️ Sem treino', data: compNoTraining, show: !analysisFilters.includes('training') },
            ].filter(row => row.show && row.data.n > 0).map(row => {
              const pct = Math.min(100, (row.data.cal / targets.cal) * 100)
              const col = row.data.cal > targets.max ? '#ef4444' : row.data.cal >= targets.min ? '#2ab8b8' : '#e8a040'
              return (
                <div key={row.label} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: '#7a9aa8' }}>{row.label}</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
                      <span style={{ color: col, fontWeight: 700 }}>{row.data.cal} kcal</span>
                      <span style={{ color: '#2d4a58' }}> ({row.data.n}d)</span>
                    </span>
                  </div>
                  <div style={{ background: '#1a2d35', borderRadius: 3, height: 6, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: pct + '%', background: col, borderRadius: 3 }} />
                  </div>
                </div>
              )
            })}
          </div>
          {Object.keys(weights).length >= 2 && (() => {
            const wEntries = Object.entries(weights).sort(([a], [b]) => a.localeCompare(b))
            const wVals = wEntries.map(([, v]) => v)
            const lastW = wVals[wVals.length - 1], firstW = wVals[0]
            const totalDiff = (lastW - firstW).toFixed(1)
            const W2 = 340, H2 = 80, PL2 = 8, PR2 = 8, PT2 = 8, PB2 = 16
            const wMax = Math.max(...wVals) + 1, wMin = Math.min(...wVals) - 1
            const cx2 = i => PL2 + (i / Math.max(wVals.length - 1, 1)) * (W2 - PL2 - PR2)
            const cy2 = v => PT2 + (1 - (v - wMin) / (wMax - wMin)) * (H2 - PT2 - PB2)
            const pts2 = wVals.map((v, i) => `${cx2(i)},${cy2(v)}`).join(' ')
            return (
              <div style={{ background: '#122028', borderRadius: 14, padding: 14, marginBottom: 12, border: '0.5px solid #1e1e30' }}>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>⚖️ Evolução do peso</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 24, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>{lastW} kg</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: parseFloat(totalDiff) < 0 ? '#2ab8b8' : parseFloat(totalDiff) > 0 ? '#ef4444' : '#7a9aa8' }}>
                    {parseFloat(totalDiff) > 0 ? '+' : ''}{totalDiff} kg total
                  </span>
                </div>
                <svg viewBox={`0 0 ${W2} ${H2}`} style={{ width: '100%', height: H2 }}>
                  <polyline points={pts2} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinejoin="round" />
                  {wVals.map((v, i) => <circle key={i} cx={cx2(i)} cy={cy2(v)} r="4" fill="#6366f1" />)}
                </svg>
              </div>
            )
          })()}
          {compTraining.n > 0 && compNoTraining.n > 0 && (
            <div style={{ background: '#122028', borderRadius: 14, padding: 14, marginBottom: 12, border: '0.5px solid #1e1e30' }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>💡 Insights</div>
              <div style={{ background: '#0d1a1f', borderRadius: 10, padding: '10px 12px', fontSize: 12, color: '#6a8a98', lineHeight: 1.7 }}>
                {compTraining.cal > compNoTraining.cal
                  ? `💪 Nos dias de treino você come em média ${compTraining.cal - compNoTraining.cal} kcal a mais que nos dias de descanso.`
                  : `💪 Nos dias de treino você come em média ${compNoTraining.cal - compTraining.cal} kcal a menos que nos dias de descanso.`}
                {compWeekend.n > 0 && compWeekday.n > 0 && !analysisFilters.includes('weekday') && !analysisFilters.includes('weekend') && (
                  <span style={{ display: 'block', marginTop: 6 }}>
                    {compWeekend.cal > compWeekday.cal
                      ? `🎉 Nos fins de semana você come em média ${compWeekend.cal - compWeekday.cal} kcal a mais que nos dias úteis.`
                      : `🎉 Nos fins de semana você come em média ${compWeekday.cal - compWeekend.cal} kcal a menos que nos dias úteis.`}
                  </span>
                )}
              </div>
            </div>
          )}
        </>)}
      </div>
    )
  }

  function renderFoods() {
    if (registerMode) {
      return (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{editingFoodIdx !== null ? 'Editar Alimento' : 'Novo Alimento'}</div>
            <button onClick={() => { setRegisterMode(false); setEditingFoodIdx(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6a8a98', fontSize: 20 }}>×</button>
          </div>
          <div style={{ background: '#122028', borderRadius: 14, padding: 16, border: '0.5px solid #1e1e30' }}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: '#6a8a98', fontWeight: 500, marginBottom: 4, display: 'block' }}>Nome *</label>
              <input type="text" placeholder="Ex: Iogurte grego" value={newFood.name} onChange={e => setNewFood(p => ({ ...p, name: e.target.value }))}
                style={{ width: '100%', background: '#1a2d35', border: '0.5px solid #2a2a40', borderRadius: 10, padding: '10px 12px', color: '#f0e8d8', fontSize: 14, fontFamily: 'inherit' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: '#6a8a98', fontWeight: 500, marginBottom: 4, display: 'block' }}>Unidade *</label>
                <select value={newFood.unit} onChange={e => setNewFood(p => ({ ...p, unit: e.target.value }))}
                  style={{ width: '100%', background: '#1a2d35', border: '0.5px solid #2a2a40', borderRadius: 10, padding: '10px', color: '#f0e8d8', fontSize: 13, fontFamily: 'inherit' }}>
                  {['g', 'ml', 'unid', 'dose', 'porção'].map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#6a8a98', fontWeight: 500, marginBottom: 4, display: 'block' }}>Qtd padrão</label>
                <input type="number" value={newFood.def} onChange={e => setNewFood(p => ({ ...p, def: e.target.value }))}
                  style={{ width: '100%', background: '#1a2d35', border: '0.5px solid #2a2a40', borderRadius: 10, padding: '10px', color: '#f0e8d8', fontSize: 13, fontFamily: 'inherit' }} />
              </div>
            </div>
            <div style={{ background: '#0d1a1f', borderRadius: 10, padding: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: '#7a9aa8', fontFamily: 'JetBrains Mono, monospace', marginBottom: 8 }}>MACROS POR 100g/ml OU POR UNIDADE *</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[{ k: 'cal', l: 'Calorias (kcal)', c: '#c8873a' }, { k: 'prot', l: 'Proteína (g)', c: '#2ab8b8' }, { k: 'carb', l: 'Carb (g)', c: '#e8a040' }, { k: 'fat', l: 'Gordura (g)', c: '#e07060' }].map(f => (
                  <div key={f.k}>
                    <label style={{ fontSize: 11, color: f.c, fontWeight: 500, marginBottom: 4, display: 'block' }}>{f.l}</label>
                    <input type="number" placeholder="0" value={newFood[f.k]} onChange={e => setNewFood(p => ({ ...p, [f.k]: e.target.value }))}
                      style={{ width: '100%', background: '#1a2d35', border: '0.5px solid #2a2a40', borderRadius: 10, padding: '8px', color: '#f0e8d8', fontSize: 13, fontFamily: 'inherit' }} />
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: '#6a8a98', fontWeight: 500, marginBottom: 6, display: 'block' }}>Favorito em qual refeição?</label>
              <div>{MEALS.map(m => (
                <span key={m.id} onClick={() => setNewFood(p => ({ ...p, fav: p.fav.includes(m.id) ? p.fav.filter(x => x !== m.id) : [...p.fav, m.id] }))}
                  style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 10, cursor: 'pointer', margin: '2px', border: '0.5px solid', borderColor: newFood.fav.includes(m.id) ? '#c8873a' : '#1e3540', color: newFood.fav.includes(m.id) ? '#c8873a' : '#6a8a98', background: newFood.fav.includes(m.id) ? '#c8873a20' : 'transparent' }}>
                  {m.icon} {m.short}
                </span>
              ))}</div>
            </div>
            <button onClick={() => {
              if (!newFood.name || newFood.cal === '') return alert('Preencha nome e calorias.')
              const foodData = { name: newFood.name, fav: newFood.fav, cal: parseFloat(newFood.cal) || 0, prot: parseFloat(newFood.prot) || 0, carb: parseFloat(newFood.carb) || 0, fat: parseFloat(newFood.fat) || 0, unit: newFood.unit, def: parseFloat(newFood.def) || 100 }
              if (editingFoodIdx !== null && String(editingFoodIdx).startsWith('default_')) {
                const defaultId = String(editingFoodIdx).replace('default_', '')
                const exists = customFoods.find(c => c.id === defaultId)
                if (exists) { updateCustomFoods(customFoods.map(c => c.id === defaultId ? { ...c, ...foodData } : c)) }
                else { updateCustomFoods([...customFoods, { id: defaultId, ...foodData }]) }
              } else if (editingFoodIdx !== null) {
                updateCustomFoods(customFoods.map((f, i) => i === editingFoodIdx ? { ...f, ...foodData } : f))
              } else {
                updateCustomFoods([...customFoods, { id: 'custom_' + Date.now(), ...foodData }])
              }
              setRegisterMode(false)
              setEditingFoodIdx(null)
              setNewFood({ name: '', cal: '', prot: '', carb: '', fat: '', unit: 'g', def: '100', fav: [] })
            }} style={{ width: '100%', padding: 12, background: 'linear-gradient(135deg, #c8873a 0%, #e8a040 100%)', border: 'none', borderRadius: 12, color: '#0d1a1f', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 14 }}>
              {editingFoodIdx !== null ? 'Salvar alterações' : 'Salvar alimento'}
            </button>
          </div>
        </div>
      )
    }
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Alimentos</div>
          <button onClick={() => { setEditingFoodIdx(null); setNewFood({ name: '', cal: '', prot: '', carb: '', fat: '', unit: 'g', def: '100', fav: [] }); setRegisterMode(true) }}
            style={{ background: '#c8873a', border: 'none', borderRadius: 10, padding: '7px 12px', color: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>+ Novo</button>
        </div>
        <input value={foodSearch} onChange={e => setFoodSearch(e.target.value)} placeholder="🔍 Buscar na lista..."
          style={{ width: '100%', background: '#1a2d35', border: '0.5px solid #1e3540', borderRadius: 10, padding: '10px 12px', color: '#f0e8d8', fontSize: 13, fontFamily: 'inherit', marginBottom: 14 }} />
        {customFoods.filter(c => !DEFAULT_FOODS.find(f => f.id === c.id) && (!foodSearch || c.name.toLowerCase().includes(foodSearch.toLowerCase()))).length > 0 && (<>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#7a9aa8', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px', fontFamily: 'JetBrains Mono, monospace' }}>
            Meus alimentos ({customFoods.filter(c => !DEFAULT_FOODS.find(f => f.id === c.id)).length})
          </div>
          {customFoods.filter(c => !DEFAULT_FOODS.find(f => f.id === c.id) && (!foodSearch || c.name.toLowerCase().includes(foodSearch.toLowerCase()))).map((f, idx) => (
            <div key={f.id} style={{ background: '#122028', borderRadius: 12, padding: '10px 12px', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 8, border: '0.5px solid #1e1e30' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</div>
                <div style={{ fontSize: 10, color: '#7a9aa8', fontFamily: 'JetBrains Mono, monospace', marginTop: 1 }}>{f.cal} kcal · P:{f.prot}g · C:{f.carb}g · G:{f.fat}g / {f.unit}</div>
              </div>
              <button onClick={() => { const realIdx = customFoods.findIndex(c => c.id === f.id); setEditingFoodIdx(realIdx); setNewFood({ name: f.name, cal: String(f.cal), prot: String(f.prot), carb: String(f.carb), fat: String(f.fat), unit: f.unit, def: String(f.def), fav: f.fav || [] }); setRegisterMode(true) }}
                style={{ background: '#c8873a20', border: 'none', borderRadius: 8, width: 28, height: 28, color: '#c8873a', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✎</button>
              <button onClick={() => { if (window.confirm('Remover?')) updateCustomFoods(customFoods.filter(c => c.id !== f.id)) }}
                style={{ background: '#ef444420', border: 'none', borderRadius: 8, width: 28, height: 28, color: '#ef4444', cursor: 'pointer', fontSize: 16 }}>×</button>
            </div>
          ))}
        </>)}
        <div style={{ fontSize: 10, fontWeight: 700, color: '#7a9aa8', textTransform: 'uppercase', letterSpacing: 1, margin: '12px 0 8px', fontFamily: 'JetBrains Mono, monospace' }}>Base padrão ({DEFAULT_FOODS.length})</div>
        {DEFAULT_FOODS.filter(f => !foodSearch || (customFoods.find(c=>c.id===f.id)||f).name.toLowerCase().includes(foodSearch.toLowerCase())).map(f => {
          const override = customFoods.find(c => c.id === f.id)
          const display = override || f
          return (
            <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '0.5px solid #1e1e30' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {display.name}
                  {override && <span style={{ marginLeft: 6, fontSize: 9, color: '#c8873a', background: '#c8873a20', padding: '1px 5px', borderRadius: 8 }}>editado</span>}
                </div>
                <div style={{ fontSize: 10, color: '#7a9aa8', fontFamily: 'JetBrains Mono, monospace' }}>{display.cal} kcal · P:{display.prot}g · C:{display.carb}g · G:{display.fat}g / {display.unit}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {override && (
                  <button onClick={() => { if (window.confirm('Restaurar valores originais?')) updateCustomFoods(customFoods.filter(c => c.id !== f.id)) }}
                    style={{ background: '#e8a04020', border: 'none', borderRadius: 8, width: 28, height: 28, color: '#e8a040', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↺</button>
                )}
                <button onClick={() => { setEditingFoodIdx('default_' + f.id); setNewFood({ name: display.name, cal: String(display.cal), prot: String(display.prot), carb: String(display.carb), fat: String(display.fat), unit: display.unit, def: String(display.def), fav: display.fav || [] }); setRegisterMode(true) }}
                  style={{ background: '#c8873a20', border: 'none', borderRadius: 8, width: 28, height: 28, color: '#c8873a', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✎</button>
                <div style={{ fontSize: 11 }}>{(display.fav || []).map(id => { const m = MEALS.find(x => x.id === id); return m ? m.icon : '' }).join('')}</div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }
}

function FoodRow({ food: f, onAdd, mealId }) {
  const [qty, setQty] = useState(f.def)
  useEffect(() => { setQty(f.def) }, [mealId, f.id, f.def])
  const fixed = ['unid', 'dose', 'porção'].includes(f.unit)
  const m = fixed ? qty : qty / 100
  return (
    <div style={{ padding: '10px 0', borderBottom: '0.5px solid #1e1e30' }}>
      <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{f.name}</div>
      {f.note && <div style={{ fontSize: 11, color: '#7a9aa8', marginTop: 1 }}>{f.note}</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
        <div style={{ fontSize: 11, color: '#6a8a98', fontFamily: 'JetBrains Mono, monospace', flex: 1 }}>
          {Math.round(f.cal * m)} kcal · P:{Math.round(f.prot * m * 10) / 10}g · C:{Math.round(f.carb * m * 10) / 10}g · G:{Math.round(f.fat * m * 10) / 10}g
        </div>
        <input type="number" value={qty} onChange={e => setQty(parseFloat(e.target.value) || 0)}
          style={{ width: 52, textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, padding: '5px 4px', border: '0.5px solid #2a2a40', borderRadius: 8, background: '#1a2d35', color: '#f0e8d8' }} />
        <span style={{ fontSize: 10, color: '#7a9aa8', minWidth: 26 }}>{f.unit}</span>
        <button onClick={() => onAdd(f.id, qty)} style={{ background: '#c8873a', border: 'none', borderRadius: 10, padding: '7px 14px', color: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit', flexShrink: 0 }}>Add</button>
      </div>
    </div>
  )
}

function LoginScreen() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  async function handleLogin() {
    setLoading(true)
    setError('')
    try { await loginWithGoogle() } catch (e) { setError('Erro ao fazer login. Tente novamente.'); setLoading(false) }
  }
  return (
    <div style={{ minHeight: '100vh', background: '#0d1a1f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Syne', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 360, width: '100%', textAlign: 'center' }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 11, letterSpacing: 3, color: '#7a9aa8', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', marginBottom: 12 }}>EVOSHAPE</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#f0e8d8', lineHeight: 1.2, marginBottom: 8 }}>EvoShape</div>
          <div style={{ fontSize: 14, color: '#7a9aa8', lineHeight: 1.5 }}>Dieta · Treino · Peso · Evolução</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 40 }}>
          {[{ label: 'Dieta', color: '#c8873a', icon: '🥗' }, { label: 'Treino', color: '#2ab8b8', icon: '💪' }, { label: 'Evolução', color: '#e8a040', icon: '📈' }].map(s => (
            <div key={s.label} style={{ background: '#122028', borderRadius: 12, padding: '14px 8px', border: '0.5px solid #1e1e30' }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontSize: 11, color: s.color, fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <button onClick={handleLogin} disabled={loading}
          style={{ width: '100%', padding: '14px 20px', background: loading ? '#1a2d35' : '#fff', border: 'none', borderRadius: 14, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, fontSize: 15, fontWeight: 700, fontFamily: 'inherit', color: loading ? '#7a9aa8' : '#1a1a1a' }}>
          {!loading && (
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
          )}
          {loading ? 'Entrando...' : 'Entrar com Google'}
        </button>
        {error && <div style={{ marginTop: 12, fontSize: 12, color: '#ef4444' }}>{error}</div>}
        <div style={{ marginTop: 20, fontSize: 11, color: '#2d4a58', lineHeight: 1.5 }}>Seus dados ficam salvos na nuvem e sincronizados entre todos os seus dispositivos</div>
      </div>
    </div>
  )
}

function WeightModal({ onSave, onClose }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [weight, setWeight] = useState('')
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#122028', borderRadius: '16px 16px 0 0', padding: 24, width: '100%', maxWidth: 480, border: '0.5px solid #2a2a40' }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>⚖️ Registrar Peso</div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, color: '#6a8a98', fontWeight: 500, marginBottom: 4, display: 'block' }}>Data</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            style={{ width: '100%', background: '#1a2d35', border: '0.5px solid #2a2a40', borderRadius: 10, padding: '10px 14px', color: '#f0e8d8', fontSize: 14, fontFamily: 'JetBrains Mono, monospace' }} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 11, color: '#2ab8b8', fontWeight: 500, marginBottom: 4, display: 'block' }}>Peso (kg)</label>
          <input type="number" step="0.1" placeholder="Ex: 76.5" value={weight} onChange={e => setWeight(e.target.value)} autoFocus
            style={{ width: '100%', background: '#1a2d35', border: '0.5px solid #10b98140', borderRadius: 10, padding: '10px 14px', color: '#f0e8d8', fontSize: 18, fontFamily: 'JetBrains Mono, monospace', textAlign: 'center' }} />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 12, background: '#1a2d35', border: 'none', borderRadius: 12, color: '#6a8a98', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
          <button onClick={() => { if (weight) onSave(date, weight) }} style={{ flex: 2, padding: 12, background: 'linear-gradient(135deg, #c8873a 0%, #e8a040 100%)', border: 'none', borderRadius: 12, color: '#0d1a1f', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 14 }}>Salvar</button>
        </div>
      </div>
    </div>
  )
}

function TargetsModal({ targets, onSave, onClose }) {
  const [t, setT] = useState({
    ...targets,
    targets2: targets.targets2 || { cal: 1800, prot: 150, carb: 220, fat: 50, min: 1700, max: 1900, protMin: 138, protMax: 163, fatMax: 60 },
    highCarbDays: targets.highCarbDays || [1, 3, 5],
    dualMode: targets.dualMode || false,
  })
  const [activeTab, setActiveTab] = useState('meta1')
  const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const fields = [
    { k: 'cal', l: 'Calorias alvo (kcal)', c: '#c8873a' }, { k: 'min', l: 'Kcal mínimo', c: '#e8a040' }, { k: 'max', l: 'Kcal máximo', c: '#e05555' },
    { k: 'prot', l: 'Proteína alvo (g)', c: '#2ab8b8' }, { k: 'protMin', l: 'Proteína mínima (g)', c: '#2ab8b8' }, { k: 'protMax', l: 'Proteína máxima (g)', c: '#2ab8b8' },
    { k: 'carb', l: 'Carboidratos (g)', c: '#e8a040' }, { k: 'fat', l: 'Gordura alvo (g)', c: '#e07060' }, { k: 'fatMax', l: 'Gordura máxima (g)', c: '#e07060' },
  ]
  const toggleDay = (day) => setT(p => ({ ...p, highCarbDays: (p.highCarbDays||[]).includes(day) ? p.highCarbDays.filter(d=>d!==day) : [...(p.highCarbDays||[]), day] }))

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#122028', borderRadius: '16px 16px 0 0', padding: 20, width: '100%', maxWidth: 480, border: '0.5px solid #1e3540', maxHeight: '88vh', overflowY: 'auto' }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: '#f0e8d8' }}>⚙️ Metas diárias</div>

        {/* Toggle dual mode */}
        <div style={{ background: '#1a2d35', borderRadius: 12, padding: '12px 14px', marginBottom: 14, border: '0.5px solid #1e3540' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#f0e8d8' }}>Metas por tipo de dia</div>
              <div style={{ fontSize: 11, color: '#7a9aa8', marginTop: 2 }}>Carbo alto em dias específicos</div>
            </div>
            <div onClick={() => setT(p => ({ ...p, dualMode: !p.dualMode }))}
              style={{ width: 44, height: 24, borderRadius: 12, background: t.dualMode ? '#c8873a' : '#1e3540', cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: 3, left: t.dualMode ? 22 : 3, width: 18, height: 18, borderRadius: '50%', background: '#f0e8d8', transition: 'left .2s' }} />
            </div>
          </div>
          {t.dualMode && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11, color: '#7a9aa8', marginBottom: 8 }}>Marque os dias de <span style={{ color: '#2ab8b8', fontWeight: 700 }}>Carbo Alto</span> (Meta 2):</div>
              <div style={{ display: 'flex', gap: 5 }}>
                {DAYS.map((day, idx) => {
                  const on = (t.highCarbDays||[]).includes(idx)
                  return <div key={idx} onClick={() => toggleDay(idx)} style={{ flex: 1, textAlign: 'center', padding: '6px 0', borderRadius: 8, cursor: 'pointer', fontSize: 10, fontWeight: 700, border: `1.5px solid ${on ? '#2ab8b8' : '#1e3540'}`, background: on ? '#2ab8b820' : 'transparent', color: on ? '#2ab8b8' : '#7a9aa8' }}>{day}</div>
                })}
              </div>
              <div style={{ marginTop: 8, fontSize: 10, color: '#3d5a68', fontFamily: 'JetBrains Mono, monospace' }}>
                Dias não marcados → <span style={{ color: '#c8873a' }}>Carbo Baixo (Meta 1)</span>
              </div>
            </div>
          )}
        </div>

        {/* Tab selector for dual mode */}
        {t.dualMode && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            <button onClick={() => setActiveTab('meta1')} style={{ flex: 1, padding: '9px 0', border: 'none', borderRadius: 10, background: activeTab === 'meta1' ? '#c8873a' : '#1a2d35', color: activeTab === 'meta1' ? '#0d1a1f' : '#7a9aa8', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>🟡 Meta 1 — Carbo Baixo</button>
            <button onClick={() => setActiveTab('meta2')} style={{ flex: 1, padding: '9px 0', border: 'none', borderRadius: 10, background: activeTab === 'meta2' ? '#2ab8b8' : '#1a2d35', color: activeTab === 'meta2' ? '#0d1a1f' : '#7a9aa8', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>🔵 Meta 2 — Carbo Alto</button>
          </div>
        )}

        {/* Meta 1 fields */}
        {(!t.dualMode || activeTab === 'meta1') && fields.map(f => (
          <div key={f.k} style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, color: f.c, fontWeight: 500, marginBottom: 4, display: 'block' }}>{f.l}</label>
            <input type="number" value={t[f.k] || ''} onChange={e => setT(p => ({ ...p, [f.k]: parseFloat(e.target.value) || 0 }))}
              style={{ width: '100%', background: '#1a2d35', border: `0.5px solid ${f.c}40`, borderRadius: 10, padding: '9px 14px', color: '#f0e8d8', fontSize: 14, fontFamily: 'JetBrains Mono, monospace' }} />
          </div>
        ))}

        {/* Meta 2 fields */}
        {t.dualMode && activeTab === 'meta2' && fields.map(f => (
          <div key={f.k} style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, color: '#2ab8b8', fontWeight: 500, marginBottom: 4, display: 'block' }}>{f.l} <span style={{ color: '#3d5a68', fontSize: 10 }}>(Carbo Alto)</span></label>
            <input type="number" value={(t.targets2||{})[f.k] || ''} onChange={e => setT(p => ({ ...p, targets2: { ...(p.targets2||{}), [f.k]: parseFloat(e.target.value) || 0 } }))}
              style={{ width: '100%', background: '#1a2d35', border: '0.5px solid #2ab8b840', borderRadius: 10, padding: '9px 14px', color: '#f0e8d8', fontSize: 14, fontFamily: 'JetBrains Mono, monospace' }} />
          </div>
        ))}

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 12, background: '#1a2d35', border: 'none', borderRadius: 12, color: '#7a9aa8', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
          <button onClick={() => onSave(t)} style={{ flex: 2, padding: 12, background: 'linear-gradient(135deg, #c8873a, #e8a040)', border: 'none', borderRadius: 12, color: '#0d1a1f', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 14 }}>Salvar</button>
        </div>
        {!t.dualMode && <div style={{ marginTop: 10, padding: '8px 12px', background: '#0d1a1f', borderRadius: 10, fontSize: 10, color: '#3d5a68', fontFamily: 'JetBrains Mono, monospace' }}>Padrão: 1562 kcal · min 1460 · max 1680 · P:150g · C:151g · G:43g</div>}
      </div>
    </div>
  )
}
