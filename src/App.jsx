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
  { id: 'frango_peito', name: 'Peito de Frango Grelhado', fav: ['almoco'], cal: 165, prot: 31, carb: 0, fat: 3.6, unit: 'g', def: 120, note: 'peso já pronto' },
  { id: 'arroz', name: 'Arroz Branco Cozido', fav: ['almoco'], cal: 130, prot: 2.7, carb: 28, fat: 0.3, unit: 'g', def: 120 },
  { id: 'batata_inglesa', name: 'Batata Inglesa Cozida', fav: ['almoco'], cal: 77, prot: 2, carb: 17.5, fat: 0.1, unit: 'g', def: 200 },
  { id: 'batata_doce', name: 'Batata Doce Cozida', fav: ['almoco', 'janta'], cal: 86, prot: 1.6, carb: 20, fat: 0.1, unit: 'g', def: 175 },
  { id: 'salada', name: 'Salada Mista', fav: ['almoco', 'janta'], cal: 28, prot: 1.2, carb: 5.6, fat: 0.2, unit: 'g', def: 125, note: 'folhas + legumes' },
  { id: 'doce_leite', name: 'Doce de Leite', fav: ['almoco'], cal: 350, prot: 7, carb: 65, fat: 8, unit: 'g', def: 20, note: 'sobremesa · 20g' },
  { id: 'chocolate_amargo', name: 'Chocolate Amargo 70%+', fav: ['almoco'], cal: 570, prot: 9, carb: 40, fat: 41, unit: 'g', def: 20, note: 'sobremesa · 20g' },
  { id: 'choc_nespresso', name: 'Chocolate Nespresso Nibs 75%', fav: ['almoco', 'extra'], cal: 30, prot: 0.5, carb: 1.6, fat: 2.3, unit: 'unid', def: 2, note: '1 unid = 5g · 30 kcal' },
  { id: 'acai', name: 'Polpa de Açaí (pura)', fav: ['lanche'], cal: 58, prot: 0.3, carb: 2.1, fat: 1.3, unit: 'g', def: 100, note: 'De Marchi, sem adoçar' },
  { id: 'pao_pullman', name: 'Pão Pullman Ferm. Natural', fav: ['lanche'], cal: 256, prot: 8.8, carb: 49, fat: 2.7, unit: 'g', def: 50, note: '2 fatias = ~50g' },
  { id: 'frango_desfiado', name: 'Frango Desfiado', fav: ['lanche', 'almoco'], cal: 165, prot: 31, carb: 0, fat: 3.6, unit: 'g', def: 50 },
  { id: 'tilapia', name: 'Tilápia Grelhada', fav: ['almoco', 'janta'], cal: 132, prot: 26.9, carb: 0, fat: 2.2, unit: 'g', def: 160, note: 'peso já pronto' },
  { id: 'mandioca', name: 'Mandioca Cozida', fav: ['almoco', 'janta'], cal: 132, prot: 1.1, carb: 31.7, fat: 0.2, unit: 'g', def: 120 },
  { id: 'abobora_moranga', name: 'Abóbora Moranga Cozida', fav: ['almoco', 'janta'], cal: 27, prot: 1.2, carb: 5.5, fat: 0.1, unit: 'g', def: 200 },
  { id: 'batata_baroa', name: 'Batata Baroa Cozida', fav: ['janta'], cal: 96, prot: 1.4, carb: 22.0, fat: 0.1, unit: 'g', def: 100 },
  { id: 'ovo_inteiro', name: 'Ovo Inteiro (extra)', fav: ['cafe_manha'], cal: 78, prot: 6.0, carb: 0.6, fat: 5.3, unit: 'unid', def: 1, note: 'ovo extra além do bready' },
  { id: 'ricota_light', name: 'Creme de Ricota Light', fav: ['lanche'], cal: 108, prot: 6.7, carb: 5.1, fat: 6.8, unit: 'g', def: 20 },
  { id: 'tortinha', name: 'Tortinha de Frango (3 porções)', fav: ['lanche'], cal: 276, prot: 37.7, carb: 1.4, fat: 11.8, unit: 'porção', def: 1, note: 'frango+ovos+cottage ÷12' },
  { id: 'patinho', name: 'Patinho Moído (pronto)', fav: ['janta'], cal: 152, prot: 24, carb: 0, fat: 6, unit: 'g', def: 150, note: 'peso já pronto' },
  { id: 'file_suino', name: 'Filé Mignon Suíno (pronto)', fav: ['janta'], cal: 165, prot: 26, carb: 0, fat: 6.5, unit: 'g', def: 150, note: 'peso já pronto' },
  { id: 'batata_doce_j', name: 'Batata Doce (janta)', fav: ['janta'], cal: 86, prot: 1.6, carb: 20, fat: 0.1, unit: 'g', def: 100 },
  { id: 'batata_ing_j', name: 'Batata Inglesa (janta)', fav: ['janta'], cal: 77, prot: 2, carb: 17.5, fat: 0.1, unit: 'g', def: 150 },
  { id: 'arroz_j', name: 'Arroz Branco (janta)', fav: ['janta'], cal: 130, prot: 2.7, carb: 28, fat: 0.3, unit: 'g', def: 80, note: '~equiv batata doce 100g' },
  { id: 'batata_baroa_j', name: 'Batata Baroa (janta)', fav: ['janta'], cal: 96, prot: 1.4, carb: 22.0, fat: 0.1, unit: 'g', def: 100 },
  { id: 'abobora_j', name: 'Abóbora Moranga (janta)', fav: ['janta'], cal: 27, prot: 1.2, carb: 5.5, fat: 0.1, unit: 'g', def: 150 },
  { id: 'tilapia_j', name: 'Tilápia Grelhada (janta)', fav: ['janta'], cal: 132, prot: 26.9, carb: 0, fat: 2.2, unit: 'g', def: 150, note: 'peso já pronto' },
]

const MEALS = [
  { id: 'cafe_manha', label: 'Café da Manhã', short: 'Café', icon: '☀️', color: '#f59e0b' },
  { id: 'almoco', label: 'Almoço', short: 'Almoço', icon: '🍽️', color: '#10b981' },
  { id: 'lanche', label: 'Lanche', short: 'Lanche', icon: '🥗', color: '#6366f1' },
  { id: 'janta', label: 'Janta', short: 'Janta', icon: '🌙', color: '#ec4899' },
  { id: 'extra', label: 'Refeição Extra', short: 'Extra', icon: '⚡', color: '#8b5cf6' },
]

const ACTIVITIES = [
  { id: 'musculacao', label: 'Musculação', icon: '🏋️', color: '#6366f1', type: 'strength' },
  { id: 'futsal', label: 'Futsal', icon: '⚽', color: '#10b981', type: 'cardio' },
  { id: 'futebol', label: 'Futebol', icon: '⚽', color: '#10b981', type: 'cardio' },
  { id: 'tenis', label: 'Tênis', icon: '🎾', color: '#f59e0b', type: 'cardio' },
  { id: 'volei', label: 'Vôlei', icon: '🏐', color: '#ec4899', type: 'cardio' },
  { id: 'corrida', label: 'Corrida', icon: '🏃', color: '#ef4444', type: 'cardio' },
  { id: 'natacao', label: 'Natação', icon: '🏊', color: '#0ea5e9', type: 'cardio' },
  { id: 'ciclismo', label: 'Ciclismo', icon: '🚴', color: '#8b5cf6', type: 'cardio' },
  { id: 'outro', label: 'Outro', icon: '🏃', color: '#6b7280', type: 'other' },
]

const DEFAULT_TARGETS = {
  cal: 1562, prot: 150, carb: 151, fat: 43,
  min: 1460, max: 1680, protMin: 138, protMax: 163, fatMax: 52,
}

function todayKey() { return new Date().toISOString().slice(0, 10) }
function emptyDay() { return { meals: { cafe_manha: [], almoco: [], lanche: [], janta: [], extra: [] } } }
function r(v) { return Math.round(v * 10) / 10 }
function r0(v) { return Math.round(v) }
function formatDateFull(iso) {
  const dt = new Date(iso + 'T12:00:00')
  const wdays = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  return `${wdays[dt.getDay()]}, ${dt.getDate()} ${months[dt.getMonth()]}`
}

function calcMacros(items, allFoods) {
  return items.reduce((a, it) => {
    const f = allFoods.find(x => x.id === it.id) // customFoods override DEFAULT_FOODS
    if (!f) return a
    const fixed = ['unid','dose','porção'].includes(f.unit)
    const m = fixed ? it.qty : it.qty / 100
    return { cal: a.cal + f.cal * m, prot: a.prot + f.prot * m, carb: a.carb + f.carb * m, fat: a.fat + f.fat * m }
  }, { cal: 0, prot: 0, carb: 0, fat: 0 })
}

function farolCal(c, t) { return c <= t.cal ? '#10b981' : c <= t.max ? '#f59e0b' : '#ef4444' }
function farolProt(p, t) { return (p >= (t.protMin || 140) && p <= (t.protMax || 170)) ? '#10b981' : '#ef4444' }
function farolFat(f, t) { return f <= t.fat ? '#10b981' : f <= (t.fatMax || 52) ? '#f59e0b' : '#ef4444' }

async function loadFromFirebase(uid) {
  try {
    const snap = await getDoc(doc(db, 'users', uid))
    if (snap.exists()) return snap.data()
  } catch (e) { console.error('Firebase load error:', e) }
  return null
}

async function saveToFirebase(uid, data) {
  try {
    await setDoc(doc(db, 'users', uid), data, { merge: true })
  } catch (e) { console.error('Firebase save error:', e) }
}

export default function App() {
  const [uid, setUid] = useState(null)
  const [user, setUser] = useState(null)
  const [days, setDays] = useState({})
  const [targets, setTargets] = useState(DEFAULT_TARGETS)
  const [customFoods, setCustomFoods] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [tab, setTab] = useState('today')
  const [activeMeal, setActiveMeal] = useState('cafe_manha')
  const [addingFood, setAddingFood] = useState(false)
  const [search, setSearch] = useState('')
  const [registerMode, setRegisterMode] = useState(false)
  const [editingFoodIdx, setEditingFoodIdx] = useState(null)
  const [editingDay, setEditingDay] = useState(null)
  const [showTargets, setShowTargets] = useState(false)
  const [newFood, setNewFood] = useState({ name: '', cal: '', prot: '', carb: '', fat: '', unit: 'g', def: '100', fav: [] })
  const [weights, setWeights] = useState({})
  const [showWeightModal, setShowWeightModal] = useState(false)
  const [newWeight, setNewWeight] = useState('')

  // Merge: customFoods overrides DEFAULT_FOODS by id
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

  const updateDays = (newDays) => { setDays(newDays); persist(newDays, targets, customFoods, weights) }
  const updateTargets = (t) => { setTargets(t); persist(days, t, customFoods, weights) }
  const updateCustomFoods = (cf) => { setCustomFoods(cf); persist(days, targets, cf, weights) }
  const updateWeights = (w) => { setWeights(w); persist(days, targets, customFoods, w) }

  function addActivityToDay(activityId) {
    const day = getDay(activeKey)
    const current = day.activities || []
    if (current.includes(activityId)) return
    const updated = { ...day, activities: [...current, activityId] }
    updateDays({ ...days, [activeKey]: updated })
  }

  function removeActivityFromDay(activityId) {
    const day = days[activeKey]
    if (!day) return
    const updated = { ...day, activities: (day.activities || []).filter(a => a !== activityId) }
    updateDays({ ...days, [activeKey]: updated })
  }

  function saveWeight(dateKey, value) {
    const updated = { ...weights, [dateKey]: parseFloat(value) }
    updateWeights(updated)
  }

  const activeKey = editingDay || todayKey()

  function getDay(key) {
    const d = days[key] || emptyDay()
    if (!d.meals.extra) d.meals.extra = []
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

  // ── EARLY RETURNS — after all hooks ──
  if (!loaded) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0c0c10', color: '#6366f1', fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>
        Carregando...
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
  const wdays = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
  const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  const headerDate = isToday ? `${wdays[dt.getDay()]}, ${dt.getDate()} de ${months[dt.getMonth()]}` : `✏️ ${dt.getDate()} de ${months[dt.getMonth()]}`
  const over = dayMacros.cal > targets.max
  const inRange = dayMacros.cal >= targets.min && dayMacros.cal <= targets.max
  const calPct = Math.min(100, (dayMacros.cal / targets.max) * 100)
  const calBarColor = over ? '#ef4444' : inRange ? '#10b981' : '#6366f1'
  const calDiff = targets.cal - dayMacros.cal
  const hasData = dayMacros.cal > 0

  return (
    <div style={{ background: '#0c0c10', minHeight: '100vh', fontFamily: "'Syne', system-ui, sans-serif", color: '#ededf5' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: '#13131f', borderBottom: '1px solid #1e1e30', padding: '20px 16px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: 2, color: '#55557a', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase' }}>EVOSHAPE</div>
              <div style={{ fontSize: 18, fontWeight: 800, marginTop: 3 }}>{headerDate}</div>
              <div style={{ display: 'inline-block', marginTop: 5, padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: !isToday ? '#92400e22' : over ? '#ef444422' : inRange && hasData ? '#10b98122' : '#1e1e30', color: !isToday ? '#f59e0b' : over ? '#ef4444' : inRange && hasData ? '#10b981' : '#8888aa' }}>
                {!isToday ? 'Editando dia anterior' : over ? 'Excesso' : inRange && hasData ? '✓ Na meta' : '—'}
              </div>
            </div>
            <button onClick={() => setShowTargets(true)} style={{ background: '#1e1e30', border: '1px solid #2a2a40', borderRadius: 10, padding: '7px 10px', color: '#8888aa', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>⚙ Metas</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, padding: '5px 8px', background: '#0c0c10', borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              {user?.photoURL && <img src={user.photoURL} alt="" style={{ width: 20, height: 20, borderRadius: '50%' }} />}
              <span style={{ fontSize: 11, color: '#55557a' }}>{user?.displayName || user?.email || 'Usuário'}</span>
            </div>
            <button onClick={() => logout()} style={{ background: 'none', border: 'none', color: '#55557a', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>Sair</button>
          </div>
          <div style={{ background: '#0c0c10', borderRadius: 14, padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 30, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: '#ededf5' }}>{r0(dayMacros.cal)}</span>
                <span style={{ fontSize: 12, color: '#55557a' }}>/ {targets.cal} kcal</span>
                {hasData && <span style={{ width: 8, height: 8, borderRadius: '50%', background: farolCal(dayMacros.cal, targets), display: 'inline-block' }} />}
              </div>
              <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: over ? '#ef4444' : inRange ? '#10b981' : '#55557a' }}>
                {calDiff >= 0 ? `−${r0(calDiff)}` : `+${r0(-calDiff)}`} kcal
              </span>
            </div>
            <div style={{ background: '#1e1e30', borderRadius: 4, height: 8, overflow: 'hidden', marginBottom: 12 }}>
              <div style={{ height: '100%', width: calPct + '%', background: calBarColor, borderRadius: 4, transition: 'width .5s' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { label: 'Proteína', val: dayMacros.prot, target: targets.prot, color: '#10b981', farol: hasData ? farolProt(dayMacros.prot, targets) : null },
                { label: 'Carb', val: dayMacros.carb, target: targets.carb, color: '#f59e0b', farol: null },
                { label: 'Gordura', val: dayMacros.fat, target: targets.fat, color: '#ec4899', farol: hasData ? farolFat(dayMacros.fat, targets) : null },
              ].map(m => (
                <div key={m.label} style={{ background: '#13131f', borderRadius: 10, padding: '8px 10px', position: 'relative' }}>
                  {m.farol && <span style={{ position: 'absolute', top: 8, right: 8, width: 7, height: 7, borderRadius: '50%', background: m.farol }} />}
                  <div style={{ fontSize: 9, color: '#55557a', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: 1 }}>{m.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: m.color, marginTop: 3, fontFamily: 'JetBrains Mono, monospace' }}>
                    {r(m.val)}<span style={{ fontSize: 9, color: '#55557a' }}>/{m.target}g</span>
                  </div>
                  <div style={{ background: '#1e1e30', borderRadius: 3, height: 4, marginTop: 5, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: Math.min(100, (m.val / m.target) * 100) + '%', background: m.color, transition: 'width .4s' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', marginTop: 14, gap: 2 }}>
            {[
              { id: 'today', label: 'Hoje', icon: '🏠' },
              { id: 'treino', label: 'Treino', icon: '💪' },
              { id: 'peso', label: 'Peso', icon: '⚖️' },
              { id: 'history', label: 'Histórico', icon: '📅' },
              { id: 'analysis', label: 'Análise', icon: '📊' },
              { id: 'foods', label: 'Alimentos', icon: '🥗' },
            ].map(t => (
              <button key={t.id} onClick={() => { setTab(t.id); setEditingDay(null); setAddingFood(false); setSearch(''); setRegisterMode(false) }}
                style={{ flex: 1, padding: '8px 0', border: 'none', background: 'transparent', color: tab === t.id ? '#ededf5' : '#55557a', fontWeight: tab === t.id ? 700 : 500, fontSize: 10, cursor: 'pointer', fontFamily: 'inherit', borderBottom: `2px solid ${tab === t.id ? '#6366f1' : 'transparent'}`, transition: 'all .2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
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
          <button onClick={() => { setEditingDay(null); setTab('history') }} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#8888aa', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', padding: 0, marginBottom: 14 }}>
            ← Voltar ao histórico
          </button>
        )}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
          {MEALS.map(m => {
            const mac = calcMacros(currentDay.meals[m.id] || [], allFoods)
            const active = activeMeal === m.id
            return (
              <button key={m.id} onClick={() => { setActiveMeal(m.id); setAddingFood(false); setSearch('') }}
                style={{ flexShrink: 0, minWidth: 68, padding: '8px 6px', border: `2px solid ${active ? m.color : '#1e1e30'}`, borderRadius: 12, background: active ? m.color + '18' : '#13131f', cursor: 'pointer', textAlign: 'center', fontFamily: 'inherit' }}>
                <div style={{ fontSize: 16 }}>{m.icon}</div>
                <div style={{ fontSize: 9, fontWeight: 700, marginTop: 2, color: active ? m.color : '#8888aa' }}>{m.short}</div>
                <div style={{ fontSize: 10, color: '#55557a', fontFamily: 'JetBrains Mono, monospace' }}>{r0(mac.cal)}</div>
              </button>
            )
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: meal.color }}>{meal.icon} {meal.label}</div>
          <div style={{ fontSize: 10, color: '#55557a', fontFamily: 'JetBrains Mono, monospace' }}>{r0(mealMacros.cal)} kcal · P:{r(mealMacros.prot)} · C:{r(mealMacros.carb)} · G:{r(mealMacros.fat)}</div>
        </div>
        {items.length === 0 && !addingFood && <div style={{ textAlign: 'center', padding: '20px 0', color: '#3a3a5a', fontSize: 13 }}>Nenhum alimento registrado</div>}
        {items.map((it, idx) => {
          const f = allFoods.find(x => x.id === it.id)
          if (!f) return null
          const fixed = ['unid','dose','porção'].includes(f.unit)
          const m = fixed ? it.qty : it.qty / 100
          return (
            <div key={idx} style={{ background: '#13131f', borderRadius: 12, padding: '10px 12px', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 8, border: '0.5px solid #1e1e30' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</div>
                <div style={{ fontSize: 11, color: '#55557a', fontFamily: 'JetBrains Mono, monospace', marginTop: 2 }}>{r0(f.cal * m)} kcal · P:{r(f.prot * m)}g · C:{r(f.carb * m)}g · G:{r(f.fat * m)}g</div>
              </div>
              <input type="number" value={it.qty} onChange={e => updateQty(activeMeal, idx, e.target.value)}
                style={{ width: 52, textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, padding: '5px 4px', border: '0.5px solid #2a2a40', borderRadius: 8, background: '#1e1e30', color: '#ededf5' }} />
              <span style={{ fontSize: 10, color: '#55557a', minWidth: 26 }}>{f.unit}</span>
              <button onClick={() => removeFood(activeMeal, idx)} style={{ background: '#ef444420', border: 'none', borderRadius: 8, width: 28, height: 28, color: '#ef4444', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>×</button>
            </div>
          )
        })}
        {!addingFood ? (
          <button onClick={() => setAddingFood(true)} style={{ width: '100%', padding: 12, border: '1.5px dashed #2a2a40', borderRadius: 12, background: 'transparent', color: '#55557a', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', marginTop: 4 }}>
            + Adicionar alimento
          </button>
        ) : (
          <div style={{ background: '#13131f', borderRadius: 14, padding: 14, border: '0.5px solid #2a2a40', marginTop: 8 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar alimento..."
                style={{ flex: 1, background: '#1e1e30', border: '0.5px solid #2a2a40', borderRadius: 10, padding: '10px 12px', color: '#ededf5', fontSize: 14, fontFamily: 'inherit' }} />
              <button onClick={() => { setAddingFood(false); setSearch('') }} style={{ background: '#1e1e30', border: 'none', borderRadius: 10, padding: '0 12px', color: '#8888aa', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              {!search && favFoods.length > 0 && (<>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#55557a', textTransform: 'uppercase', letterSpacing: 1, margin: '4px 0 8px', fontFamily: 'JetBrains Mono, monospace' }}>⭐ Favoritos desta refeição</div>
                {favFoods.map(f => <FoodRow key={f.id} food={f} onAdd={addFoodToMeal} mealId={activeMeal} />)}
                <div style={{ fontSize: 10, fontWeight: 700, color: '#55557a', textTransform: 'uppercase', letterSpacing: 1, margin: '12px 0 8px', fontFamily: 'JetBrains Mono, monospace' }}>Todos os alimentos</div>
                {otherFoods.map(f => <FoodRow key={f.id} food={f} onAdd={addFoodToMeal} mealId={activeMeal} />)}
              </>)}
              {!search && favFoods.length === 0 && allFoods.map(f => <FoodRow key={f.id} food={f} onAdd={addFoodToMeal} mealId={activeMeal} />)}
              {search && (filtered.length > 0
                ? filtered.map(f => <FoodRow key={f.id} food={f} onAdd={addFoodToMeal} mealId={activeMeal} />)
                : <div style={{ padding: '20px', textAlign: 'center', color: '#3a3a5a', fontSize: 13 }}>Nenhum resultado</div>
              )}
            </div>
          </div>
        )}

        {/* Activities for this day */}
        <div style={{ marginTop: 16, background: '#13131f', borderRadius: 14, padding: 14, border: '0.5px solid #1e1e30' }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: '#6366f1' }}>💪 Atividades do dia</div>
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
          {(currentDay.activities || []).length === 0 && (
            <div style={{ fontSize: 12, color: '#3a3a5a', marginBottom: 10 }}>Nenhuma atividade registrada</div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {ACTIVITIES.map(act => {
              const done = (currentDay.activities || []).includes(act.id)
              return (
                <button key={act.id} onClick={() => addActivityToDay(act.id)} disabled={done}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', border: `1px solid ${done ? act.color : '#2a2a40'}`, borderRadius: 20, background: done ? act.color + '20' : 'transparent', cursor: done ? 'default' : 'pointer', fontFamily: 'inherit' }}>
                  <span style={{ fontSize: 12 }}>{act.icon}</span>
                  <span style={{ fontSize: 10, color: done ? act.color : '#8888aa', fontWeight: done ? 700 : 400 }}>{act.label}</span>
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
    if (!entries.length) return <div style={{ textAlign: 'center', padding: '48px 0', color: '#3a3a5a', fontSize: 13 }}>Nenhum dia registrado ainda</div>
    return (
      <div>
        <div style={{ fontSize: 11, color: '#55557a', marginBottom: 14 }}>{entries.length} dias · Toque para editar</div>
        {entries.map(([day, data]) => {
          const isTod = day === today
          const all = Object.values(data.meals || {}).flat()
          const mac = calcMacros(all, allFoods)
          const ov = mac.cal > targets.max, ok = mac.cal >= targets.min && mac.cal <= targets.max
          const col = ov ? '#ef4444' : ok ? '#10b981' : '#f59e0b'
          const lbl = ov ? 'Excesso' : ok ? '✓ Na meta' : 'Abaixo'
          return (
            <div key={day} onClick={() => { setEditingDay(day); setActiveMeal('cafe_manha'); setAddingFood(false); setSearch('') }}
              style={{ background: '#13131f', borderRadius: 12, padding: '12px 14px', marginBottom: 8, border: '0.5px solid #1e1e30', cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{formatDateFull(day)}</div>
                  {isTod && <span style={{ fontSize: 10, background: '#6366f120', color: '#6366f1', padding: '1px 7px', borderRadius: 10 }}>hoje</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: col, fontFamily: 'JetBrains Mono, monospace' }}>{lbl}</span>
                  <span style={{ fontSize: 13, color: '#55557a' }}>✏️</span>
                </div>
              </div>
              <div style={{ background: '#1e1e30', borderRadius: 4, height: 6, marginBottom: 7, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: Math.min(110, (mac.cal / targets.cal) * 100) + '%', background: col, borderRadius: 4 }} />
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>
                <span style={{ fontWeight: 700 }}>{r0(mac.cal)} kcal</span>
                <span style={{ color: '#10b981' }}>P:{r(mac.prot)}g</span>
                <span style={{ color: '#f59e0b' }}>C:{r(mac.carb)}g</span>
                <span style={{ color: '#ec4899' }}>G:{r(mac.fat)}g</span>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  function renderAnalysis() {
    const entries = Object.entries(days).sort(([a], [b]) => a.localeCompare(b))
    if (entries.length < 2) return (
      <div style={{ textAlign: 'center', padding: '48px 20px', color: '#3a3a5a' }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>📊</div>
        <div style={{ fontSize: 14 }}>Registre pelo menos 2 dias para ver as análises</div>
      </div>
    )
    const last14 = entries.slice(-14)
    const within = last14.filter(([, d]) => { const m = calcMacros(Object.values(d.meals || {}).flat(), allFoods); return m.cal >= targets.min && m.cal <= targets.max })
    const over = last14.filter(([, d]) => { const m = calcMacros(Object.values(d.meals || {}).flat(), allFoods); return m.cal > targets.max })
    const under = last14.filter(([, d]) => { const m = calcMacros(Object.values(d.meals || {}).flat(), allFoods); return m.cal < targets.min && m.cal > 0 })
    const n = entries.length
    const avg = entries.reduce((a, [, d]) => { const m = calcMacros(Object.values(d.meals || {}).flat(), allFoods); return { cal: a.cal + m.cal, prot: a.prot + m.prot, carb: a.carb + m.carb, fat: a.fat + m.fat } }, { cal: 0, prot: 0, carb: 0, fat: 0 })
    Object.keys(avg).forEach(k => avg[k] = r0(avg[k] / n))
    const vals = last14.map(([, d]) => r0(calcMacros(Object.values(d.meals || {}).flat(), allFoods).cal))
    const maxV = Math.max(...vals, targets.max) * 1.1
    const W = 340, H = 90, PL = 8, PR = 8, PT = 8, PB = 16
    const cx = i => PL + (i / Math.max(vals.length - 1, 1)) * (W - PL - PR)
    const cy = v => PT + (1 - v / maxV) * (H - PT - PB)
    const pc = v => v > targets.max ? '#ef4444' : v < targets.min ? '#f59e0b' : '#10b981'
    const pts = vals.map((v, i) => `${cx(i)},${cy(v)}`).join(' ')
    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
          {[{ label: 'Na meta', count: within.length, color: '#10b981' }, { label: 'Excesso', count: over.length, color: '#ef4444' }, { label: 'Abaixo', count: under.length, color: '#f59e0b' }].map(s => (
            <div key={s.label} style={{ background: '#13131f', borderRadius: 12, padding: '10px 8px', textAlign: 'center', border: '0.5px solid #1e1e30' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: 'JetBrains Mono, monospace' }}>{s.count}</div>
              <div style={{ fontSize: 10, color: '#8888aa' }}>{s.label}</div>
              <div style={{ fontSize: 9, color: '#3a3a5a', fontFamily: 'JetBrains Mono, monospace' }}>/{last14.length}d</div>
            </div>
          ))}
        </div>
        <div style={{ background: '#13131f', borderRadius: 14, padding: 14, marginBottom: 12, border: '0.5px solid #1e1e30' }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>Calorias — últimos {last14.length} dias</div>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H }}>
            <line x1={PL} y1={cy(targets.max)} x2={W - PR} y2={cy(targets.max)} stroke="#10b98140" strokeWidth="1" strokeDasharray="3,3" />
            <line x1={PL} y1={cy(targets.min)} x2={W - PR} y2={cy(targets.min)} stroke="#f59e0b40" strokeWidth="1" strokeDasharray="3,3" />
            <line x1={PL} y1={cy(targets.cal)} x2={W - PR} y2={cy(targets.cal)} stroke="#6366f160" strokeWidth="1.5" strokeDasharray="5,4" />
            <polyline points={pts} fill="none" stroke="#6366f170" strokeWidth="1.5" strokeLinejoin="round" />
            {vals.map((v, i) => <circle key={i} cx={cx(i)} cy={cy(v)} r="4" fill={pc(v)} />)}
          </svg>
          <div style={{ display: 'flex', gap: 12, fontSize: 10, color: '#55557a', fontFamily: 'JetBrains Mono, monospace', marginTop: 6 }}>
            <span style={{ color: '#10b981' }}>● meta</span><span style={{ color: '#f59e0b' }}>● abaixo</span><span style={{ color: '#ef4444' }}>● excesso</span>
          </div>
        </div>
        <div style={{ background: '#13131f', borderRadius: 14, padding: 14, marginBottom: 12, border: '0.5px solid #1e1e30' }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Média diária vs meta ({n} dias)</div>
          {[{ l: 'Calorias', a: avg.cal, t: targets.cal, c: '#6366f1', u: 'kcal' }, { l: 'Proteína', a: avg.prot, t: targets.prot, c: '#10b981', u: 'g' }, { l: 'Carb', a: avg.carb, t: targets.carb, c: '#f59e0b', u: 'g' }, { l: 'Gordura', a: avg.fat, t: targets.fat, c: '#ec4899', u: 'g' }].map(m => {
            const ok = Math.abs(m.a - m.t) / m.t <= 0.08; const diff = m.a - m.t
            return (
              <div key={m.l} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: '#9898b8' }}>{m.l}</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
                    <span style={{ color: ok ? '#10b981' : diff > 0 ? '#ef4444' : '#f59e0b', fontWeight: 700 }}>{m.a}{m.u}</span>
                    <span style={{ color: '#3a3a5a' }}> / {m.t}{m.u}</span>
                  </span>
                </div>
                <div style={{ background: '#1e1e30', borderRadius: 3, height: 5, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: Math.min(130, (m.a / m.t) * 100) + '%', background: m.c, borderRadius: 3 }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Weight evolution */}
        {Object.keys(weights).length >= 2 && (() => {
          const wEntries = Object.entries(weights).sort(([a], [b]) => a.localeCompare(b))
          const firstW = wEntries[0][1]
          const lastW = wEntries[wEntries.length - 1][1]
          const totalDiff = (lastW - firstW).toFixed(1)
          const wVals = wEntries.map(([,v]) => v)
          const wMax = Math.max(...wVals) + 1
          const wMin = Math.min(...wVals) - 1
          const W2 = 340, H2 = 80, PL2 = 8, PR2 = 8, PT2 = 8, PB2 = 16
          const cx2 = i => PL2 + (i / Math.max(wVals.length - 1, 1)) * (W2 - PL2 - PR2)
          const cy2 = v => PT2 + (1 - (v - wMin) / (wMax - wMin)) * (H2 - PT2 - PB2)
          const pts2 = wVals.map((v, i) => `${cx2(i)},${cy2(v)}`).join(' ')
          return (
            <div style={{ background: '#13131f', borderRadius: 14, padding: 14, marginBottom: 12, border: '0.5px solid #1e1e30' }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>⚖️ Evolução do peso</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 24, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>{lastW} kg</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: parseFloat(totalDiff) < 0 ? '#10b981' : parseFloat(totalDiff) > 0 ? '#ef4444' : '#55557a' }}>
                  {parseFloat(totalDiff) > 0 ? '+' : ''}{totalDiff} kg total
                </span>
              </div>
              <svg viewBox={`0 0 ${W2} ${H2}`} style={{ width: '100%', height: H2 }}>
                <polyline points={pts2} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinejoin="round" />
                {wVals.map((v, i) => <circle key={i} cx={cx2(i)} cy={cy2(v)} r="4" fill="#6366f1" />)}
              </svg>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#55557a', fontFamily: 'JetBrains Mono, monospace', marginTop: 4 }}>
                <span>{wEntries[0][0]}</span><span>{wEntries[wEntries.length-1][0]}</span>
              </div>
            </div>
          )
        })()}

        {/* Activity vs Diet correlation */}
        {entries.length >= 3 && (() => {
          const activeDays = entries.filter(([d]) => (days[d]?.activities || []).length > 0)
          const inactiveDays = entries.filter(([d]) => (days[d]?.activities || []).length === 0)
          const avgCal = arr => arr.length ? Math.round(arr.reduce((s, [,d]) => s + calcMacros(Object.values(d.meals||{}).flat(), allFoods).cal, 0) / arr.length) : 0
          const activeAvg = avgCal(activeDays)
          const inactiveAvg = avgCal(inactiveDays)
          if (activeDays.length === 0) return null
          return (
            <div style={{ background: '#13131f', borderRadius: 14, padding: 14, marginBottom: 12, border: '0.5px solid #1e1e30' }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>💡 Insights — Treino vs Dieta</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                <div style={{ background: '#0c0c10', borderRadius: 10, padding: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#6366f1', marginBottom: 4 }}>Dias com treino</div>
                  <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: '#ededf5' }}>{activeAvg}</div>
                  <div style={{ fontSize: 9, color: '#55557a' }}>kcal médio ({activeDays.length}d)</div>
                </div>
                <div style={{ background: '#0c0c10', borderRadius: 10, padding: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#8888aa', marginBottom: 4 }}>Dias sem treino</div>
                  <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: '#ededf5' }}>{inactiveAvg}</div>
                  <div style={{ fontSize: 9, color: '#55557a' }}>kcal médio ({inactiveDays.length}d)</div>
                </div>
              </div>
              {activeAvg > 0 && inactiveAvg > 0 && (
                <div style={{ background: '#0c0c10', borderRadius: 10, padding: '10px 12px', fontSize: 12, color: '#8888aa', lineHeight: 1.5 }}>
                  {activeAvg > inactiveAvg
                    ? `📊 Nos dias de treino você come em média ${activeAvg - inactiveAvg} kcal a mais`
                    : `📊 Nos dias de treino você come em média ${inactiveAvg - activeAvg} kcal a menos`}
                </div>
              )}
            </div>
          )
        })()}
      </div>
    )
  }

  function renderTreino() {
    const todayActivities = currentDay.activities || []
    const mondayKey = (() => {
      const d = new Date()
      const day = d.getDay()
      const diff = day === 0 ? -6 : 1 - day
      d.setDate(d.getDate() + diff)
      return d.toISOString().slice(0, 10)
    })()

    // Week activity stats
    const weekDays = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(mondayKey + 'T12:00:00')
      d.setDate(d.getDate() + i)
      weekDays.push(d.toISOString().slice(0, 10))
    }
    const weekStrength = weekDays.filter(d => (days[d]?.activities || []).some(a => ACTIVITIES.find(x => x.id === a)?.type === 'strength')).length
    const weekCardio = weekDays.filter(d => (days[d]?.activities || []).some(a => ACTIVITIES.find(x => x.id === a)?.type === 'cardio')).length

    const strengthFarol = weekStrength >= 4 ? '#10b981' : weekStrength === 3 ? '#f59e0b' : '#ef4444'
    const cardioFarol = weekCardio >= 1 ? '#10b981' : '#ef4444'

    // Weight history
    const weightEntries = Object.entries(weights).sort(([a], [b]) => b.localeCompare(a)).slice(0, 8)
    const latestWeight = weightEntries[0]?.[1] || null
    const prevWeight = weightEntries[1]?.[1] || null
    const weightDiff = latestWeight && prevWeight ? (latestWeight - prevWeight).toFixed(1) : null

    return (
      <div>
        {/* Weekly summary */}
        <div style={{ background: '#13131f', borderRadius: 14, padding: 14, marginBottom: 14, border: '0.5px solid #1e1e30' }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>📅 Semana atual</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ background: '#0c0c10', borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: strengthFarol, display: 'inline-block' }} />
                <span style={{ fontSize: 11, color: '#8888aa' }}>Musculação</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: strengthFarol, fontFamily: 'JetBrains Mono, monospace' }}>{weekStrength}<span style={{ fontSize: 12, color: '#55557a', fontWeight: 400 }}>/4x</span></div>
              <div style={{ fontSize: 10, color: '#55557a', marginTop: 2 }}>{weekStrength >= 4 ? 'Meta atingida! ✓' : weekStrength === 3 ? 'Quase lá!' : 'Abaixo da meta'}</div>
            </div>
            <div style={{ background: '#0c0c10', borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: cardioFarol, display: 'inline-block' }} />
                <span style={{ fontSize: 11, color: '#8888aa' }}>Cardio</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: cardioFarol, fontFamily: 'JetBrains Mono, monospace' }}>{weekCardio}<span style={{ fontSize: 12, color: '#55557a', fontWeight: 400 }}>/1x</span></div>
              <div style={{ fontSize: 10, color: '#55557a', marginTop: 2 }}>{weekCardio >= 1 ? 'Meta atingida! ✓' : 'Sem cardio essa semana'}</div>
            </div>
          </div>
        </div>

        {/* Today activities */}
        <div style={{ background: '#13131f', borderRadius: 14, padding: 14, marginBottom: 14, border: '0.5px solid #1e1e30' }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>🏋️ Atividades de hoje</div>
          {todayActivities.length === 0 && (
            <div style={{ textAlign: 'center', padding: '12px 0', color: '#3a3a5a', fontSize: 13 }}>Nenhuma atividade registrada</div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {todayActivities.map(actId => {
              const act = ACTIVITIES.find(a => a.id === actId)
              if (!act) return null
              return (
                <div key={actId} style={{ display: 'flex', alignItems: 'center', gap: 6, background: act.color + '20', border: `1px solid ${act.color}40`, borderRadius: 20, padding: '6px 12px' }}>
                  <span style={{ fontSize: 14 }}>{act.icon}</span>
                  <span style={{ fontSize: 12, color: act.color, fontWeight: 600 }}>{act.label}</span>
                  <button onClick={() => removeActivityFromDay(actId)} style={{ background: 'none', border: 'none', color: act.color, cursor: 'pointer', fontSize: 14, padding: 0, lineHeight: 1 }}>×</button>
                </div>
              )
            })}
          </div>
          <div style={{ fontSize: 11, color: '#55557a', marginBottom: 8, fontWeight: 600 }}>Adicionar atividade:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {ACTIVITIES.map(act => {
              const done = todayActivities.includes(act.id)
              return (
                <button key={act.id} onClick={() => addActivityToDay(act.id)} disabled={done}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', border: `1px solid ${done ? act.color : '#2a2a40'}`, borderRadius: 20, background: done ? act.color + '20' : 'transparent', cursor: done ? 'default' : 'pointer', fontFamily: 'inherit' }}>
                  <span style={{ fontSize: 13 }}>{act.icon}</span>
                  <span style={{ fontSize: 11, color: done ? act.color : '#8888aa', fontWeight: done ? 700 : 400 }}>{act.label}</span>
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

    // Weekly weight chart data
    const chartEntries = [...weightEntries].reverse()
    const wVals = chartEntries.map(([,v]) => v)

    return (
      <div>
        {/* Header card */}
        <div style={{ background: '#13131f', borderRadius: 14, padding: 16, marginBottom: 14, border: '0.5px solid #1e1e30' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>⚖️ Peso Corporal</div>
            <button onClick={() => setShowWeightModal(true)}
              style={{ background: '#6366f1', border: 'none', borderRadius: 10, padding: '7px 14px', color: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>
              + Registrar
            </button>
          </div>
          {latestWeight ? (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: 40, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: '#ededf5' }}>{latestWeight}</span>
              <span style={{ fontSize: 16, color: '#55557a' }}>kg</span>
              {weightDiff !== null && (
                <span style={{ fontSize: 13, fontWeight: 700, color: parseFloat(weightDiff) < 0 ? '#10b981' : parseFloat(weightDiff) > 0 ? '#ef4444' : '#55557a' }}>
                  {parseFloat(weightDiff) > 0 ? '+' : ''}{weightDiff} kg
                </span>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#3a3a5a', fontSize: 13 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>⚖️</div>
              Nenhum peso registrado ainda.<br/>Registre toda segunda de manhã!
            </div>
          )}
          {weightEntries.length >= 2 && (() => {
            const first = weightEntries[weightEntries.length - 1][1]
            const last = weightEntries[0][1]
            const diff = (last - first).toFixed(1)
            return (
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <div style={{ flex: 1, background: '#0c0c10', borderRadius: 10, padding: '8px 10px', textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: '#55557a', marginBottom: 3 }}>INICIAL</div>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{first} kg</div>
                </div>
                <div style={{ flex: 1, background: '#0c0c10', borderRadius: 10, padding: '8px 10px', textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: '#55557a', marginBottom: 3 }}>VARIAÇÃO</div>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: parseFloat(diff) < 0 ? '#10b981' : parseFloat(diff) > 0 ? '#ef4444' : '#55557a' }}>
                    {parseFloat(diff) > 0 ? '+' : ''}{diff} kg
                  </div>
                </div>
                <div style={{ flex: 1, background: '#0c0c10', borderRadius: 10, padding: '8px 10px', textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: '#55557a', marginBottom: 3 }}>REGISTROS</div>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{weightEntries.length}x</div>
                </div>
              </div>
            )
          })()}
        </div>

        {/* Chart */}
        {wVals.length >= 2 && (() => {
          const W = 340, H = 100, PL = 8, PR = 8, PT = 12, PB = 20
          const maxV = Math.max(...wVals) + 0.5
          const minV = Math.min(...wVals) - 0.5
          const cx = i => PL + (i / Math.max(wVals.length - 1, 1)) * (W - PL - PR)
          const cy = v => PT + (1 - (v - minV) / (maxV - minV)) * (H - PT - PB)
          const pts = wVals.map((v, i) => `${cx(i)},${cy(v)}`).join(' ')
          const trend = wVals[wVals.length-1] < wVals[0] ? '#10b981' : '#ef4444'
          return (
            <div style={{ background: '#13131f', borderRadius: 14, padding: 14, marginBottom: 14, border: '0.5px solid #1e1e30' }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>📈 Evolução</div>
              <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H }}>
                <defs>
                  <linearGradient id="wGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={trend} stopOpacity="0.2"/>
                    <stop offset="100%" stopColor={trend} stopOpacity="0"/>
                  </linearGradient>
                </defs>
                <polygon points={`${cx(0)},${H-PB} ${pts} ${cx(wVals.length-1)},${H-PB}`} fill="url(#wGrad)" />
                <polyline points={pts} fill="none" stroke={trend} strokeWidth="2" strokeLinejoin="round" />
                {wVals.map((v, i) => (
                  <g key={i}>
                    <circle cx={cx(i)} cy={cy(v)} r="4" fill={trend} />
                    <text x={cx(i)} y={cy(v) - 6} fontSize="8" fill="#8888aa" textAnchor="middle">{v}</text>
                  </g>
                ))}
              </svg>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#3a3a5a', fontFamily: 'JetBrains Mono, monospace', marginTop: 2 }}>
                <span>{chartEntries[0]?.[0]}</span>
                <span>{chartEntries[chartEntries.length-1]?.[0]}</span>
              </div>
            </div>
          )
        })()}

        {/* History list */}
        <div style={{ background: '#13131f', borderRadius: 14, padding: 14, border: '0.5px solid #1e1e30' }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Histórico</div>
          {weightEntries.length === 0 && (
            <div style={{ textAlign: 'center', padding: '16px 0', color: '#3a3a5a', fontSize: 13 }}>Nenhum registro ainda</div>
          )}
          {weightEntries.map(([date, val], idx) => {
            const prev = weightEntries[idx + 1]?.[1]
            const diff = prev ? (val - prev).toFixed(1) : null
            return (
              <div key={date} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: idx < weightEntries.length - 1 ? '0.5px solid #1e1e30' : 'none' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{formatDateFull(date)}</div>
                  {diff !== null && (
                    <div style={{ fontSize: 11, color: parseFloat(diff) < 0 ? '#10b981' : parseFloat(diff) > 0 ? '#ef4444' : '#55557a', marginTop: 2 }}>
                      {parseFloat(diff) > 0 ? '+' : ''}{diff} kg vs anterior
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>{val} kg</span>
                  <button onClick={() => { if (window.confirm('Remover esse registro?')) { const w = {...weights}; delete w[date]; updateWeights(w) } }}
                    style={{ background: '#ef444418', border: 'none', borderRadius: 8, width: 26, height: 26, color: '#ef4444', cursor: 'pointer', fontSize: 14 }}>×</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  function renderFoods() {
    if (registerMode) {
      return (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{editingFoodIdx !== null ? 'Editar Alimento' : 'Novo Alimento'}</div>
            <button onClick={() => { setRegisterMode(false); setEditingFoodIdx(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8888aa', fontSize: 20 }}>×</button>
          </div>
          <div style={{ background: '#13131f', borderRadius: 14, padding: 16, border: '0.5px solid #1e1e30' }}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: '#8888aa', fontWeight: 500, marginBottom: 4, display: 'block' }}>Nome *</label>
              <input type="text" placeholder="Ex: Iogurte grego Danio" value={newFood.name}
                onChange={e => setNewFood(prev => ({ ...prev, name: e.target.value }))}
                style={{ width: '100%', background: '#1e1e30', border: '0.5px solid #2a2a40', borderRadius: 10, padding: '10px 12px', color: '#ededf5', fontSize: 14, fontFamily: 'inherit' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: '#8888aa', fontWeight: 500, marginBottom: 4, display: 'block' }}>Unidade *</label>
                <select value={newFood.unit} onChange={e => setNewFood(p => ({ ...p, unit: e.target.value }))}
                  style={{ width: '100%', background: '#1e1e30', border: '0.5px solid #2a2a40', borderRadius: 10, padding: '10px', color: '#ededf5', fontSize: 13, fontFamily: 'inherit' }}>
                  {['g','ml','unid','dose','porção'].map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#8888aa', fontWeight: 500, marginBottom: 4, display: 'block' }}>Qtd padrão</label>
                <input type="number" value={newFood.def} onChange={e => setNewFood(p => ({ ...p, def: e.target.value }))}
                  style={{ width: '100%', background: '#1e1e30', border: '0.5px solid #2a2a40', borderRadius: 10, padding: '10px', color: '#ededf5', fontSize: 13, fontFamily: 'inherit' }} />
              </div>
            </div>
            <div style={{ background: '#0c0c10', borderRadius: 10, padding: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: '#55557a', fontFamily: 'JetBrains Mono, monospace', marginBottom: 8 }}>MACROS POR 100g/ml OU POR UNIDADE *</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[{ k: 'cal', l: 'Calorias (kcal)', c: '#6366f1' }, { k: 'prot', l: 'Proteína (g)', c: '#10b981' }, { k: 'carb', l: 'Carb (g)', c: '#f59e0b' }, { k: 'fat', l: 'Gordura (g)', c: '#ec4899' }].map(f => (
                  <div key={f.k}>
                    <label style={{ fontSize: 11, color: f.c, fontWeight: 500, marginBottom: 4, display: 'block' }}>{f.l}</label>
                    <input type="number" placeholder="0" value={newFood[f.k]} onChange={e => setNewFood(p => ({ ...p, [f.k]: e.target.value }))}
                      style={{ width: '100%', background: '#1e1e30', border: '0.5px solid #2a2a40', borderRadius: 10, padding: '8px', color: '#ededf5', fontSize: 13, fontFamily: 'inherit' }} />
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: '#8888aa', fontWeight: 500, marginBottom: 6, display: 'block' }}>Favorito em qual refeição?</label>
              <div>{MEALS.map(m => (
                <span key={m.id} onClick={() => setNewFood(p => ({ ...p, fav: p.fav.includes(m.id) ? p.fav.filter(x => x !== m.id) : [...p.fav, m.id] }))}
                  style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 10, cursor: 'pointer', margin: '2px', border: '0.5px solid', borderColor: newFood.fav.includes(m.id) ? '#6366f1' : '#2a2a40', color: newFood.fav.includes(m.id) ? '#6366f1' : '#8888aa', background: newFood.fav.includes(m.id) ? '#6366f120' : 'transparent' }}>
                  {m.icon} {m.short}
                </span>
              ))}</div>
            </div>
            <button onClick={() => {
              if (!newFood.name || newFood.cal === '') return alert('Preencha nome e calorias.')
              const foodData = { name: newFood.name, fav: newFood.fav, cal: parseFloat(newFood.cal)||0, prot: parseFloat(newFood.prot)||0, carb: parseFloat(newFood.carb)||0, fat: parseFloat(newFood.fat)||0, unit: newFood.unit, def: parseFloat(newFood.def)||100 }
              if (editingFoodIdx !== null && String(editingFoodIdx).startsWith('default_')) {
                // Override a default food
                const defaultId = String(editingFoodIdx).replace('default_', '')
                const exists = customFoods.find(c => c.id === defaultId)
                if (exists) {
                  updateCustomFoods(customFoods.map(c => c.id === defaultId ? { ...c, ...foodData } : c))
                } else {
                  updateCustomFoods([...customFoods, { id: defaultId, ...foodData }])
                }
              } else if (editingFoodIdx !== null) {
                const updated = customFoods.map((f, i) => i === editingFoodIdx ? { ...f, ...foodData } : f)
                updateCustomFoods(updated)
              } else {
                updateCustomFoods([...customFoods, { id: 'custom_' + Date.now(), ...foodData }])
              }
              setRegisterMode(false)
              setEditingFoodIdx(null)
              setNewFood({ name: '', cal: '', prot: '', carb: '', fat: '', unit: 'g', def: '100', fav: [] })
            }} style={{ width: '100%', padding: 12, background: '#6366f1', border: 'none', borderRadius: 12, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 14 }}>
              {editingFoodIdx !== null ? 'Salvar alterações' : 'Salvar alimento'}
            </button>
          </div>
        </div>
      )
    }
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Alimentos</div>
          <button onClick={() => { setEditingFoodIdx(null); setNewFood({ name: '', cal: '', prot: '', carb: '', fat: '', unit: 'g', def: '100', fav: [] }); setRegisterMode(true) }} style={{ background: '#6366f1', border: 'none', borderRadius: 10, padding: '7px 12px', color: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>+ Novo</button>
        </div>
        {customFoods.length > 0 && (<>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#55557a', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px', fontFamily: 'JetBrains Mono, monospace' }}>Meus alimentos ({customFoods.length})</div>
          {customFoods.map((f, idx) => (
            <div key={f.id} style={{ background: '#13131f', borderRadius: 12, padding: '10px 12px', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 8, border: '0.5px solid #1e1e30' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</div>
                <div style={{ fontSize: 10, color: '#55557a', fontFamily: 'JetBrains Mono, monospace', marginTop: 1 }}>{f.cal} kcal · P:{f.prot}g · C:{f.carb}g · G:{f.fat}g / {f.unit}</div>
              </div>
              <button onClick={() => {
                setEditingFoodIdx(idx)
                setNewFood({ name: f.name, cal: String(f.cal), prot: String(f.prot), carb: String(f.carb), fat: String(f.fat), unit: f.unit, def: String(f.def), fav: f.fav || [] })
                setRegisterMode(true)
              }} style={{ background: '#6366f120', border: 'none', borderRadius: 8, width: 28, height: 28, color: '#6366f1', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✎</button>
              <button onClick={() => { if (window.confirm('Remover?')) updateCustomFoods(customFoods.filter((_, i) => i !== idx)) }} style={{ background: '#ef444420', border: 'none', borderRadius: 8, width: 28, height: 28, color: '#ef4444', cursor: 'pointer', fontSize: 16 }}>×</button>
            </div>
          ))}
        </>)}
        <div style={{ fontSize: 10, fontWeight: 700, color: '#55557a', textTransform: 'uppercase', letterSpacing: 1, margin: '12px 0 8px', fontFamily: 'JetBrains Mono, monospace' }}>Base padrão ({DEFAULT_FOODS.length})</div>
        {DEFAULT_FOODS.map(f => {
          const override = customFoods.find(c => c.id === f.id)
          const display = override || f
          return (
            <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '0.5px solid #1e1e30' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {display.name}
                  {override && <span style={{ marginLeft: 6, fontSize: 9, color: '#6366f1', background: '#6366f120', padding: '1px 5px', borderRadius: 8 }}>editado</span>}
                </div>
                <div style={{ fontSize: 10, color: '#55557a', fontFamily: 'JetBrains Mono, monospace' }}>{display.cal} kcal · P:{display.prot}g · C:{display.carb}g · G:{display.fat}g / {display.unit}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {override && (
                  <button onClick={() => { if (window.confirm('Restaurar valores originais?')) updateCustomFoods(customFoods.filter(c => c.id !== f.id)) }}
                    style={{ background: '#f59e0b20', border: 'none', borderRadius: 8, width: 28, height: 28, color: '#f59e0b', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↺</button>
                )}
                <button onClick={() => {
                  const editData = override || f
                  setEditingFoodIdx('default_' + f.id)
                  setNewFood({ name: editData.name, cal: String(editData.cal), prot: String(editData.prot), carb: String(editData.carb), fat: String(editData.fat), unit: editData.unit, def: String(editData.def), fav: editData.fav || [] })
                  setRegisterMode(true)
                }} style={{ background: '#6366f120', border: 'none', borderRadius: 8, width: 28, height: 28, color: '#6366f1', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✎</button>
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
  const fixed = ['unid','dose','porção'].includes(f.unit)
  const m = fixed ? qty : qty / 100
  return (
    <div style={{ padding: '10px 0', borderBottom: '0.5px solid #1e1e30' }}>
      <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{f.name}</div>
      {f.note && <div style={{ fontSize: 11, color: '#55557a', marginTop: 1 }}>{f.note}</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
        <div style={{ fontSize: 11, color: '#8888aa', fontFamily: 'JetBrains Mono, monospace', flex: 1 }}>
          {Math.round(f.cal * m)} kcal · P:{Math.round(f.prot * m * 10) / 10}g · C:{Math.round(f.carb * m * 10) / 10}g · G:{Math.round(f.fat * m * 10) / 10}g
        </div>
        <input type="number" value={qty} onChange={e => setQty(parseFloat(e.target.value) || 0)}
          style={{ width: 52, textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, padding: '5px 4px', border: '0.5px solid #2a2a40', borderRadius: 8, background: '#1e1e30', color: '#ededf5' }} />
        <span style={{ fontSize: 10, color: '#55557a', minWidth: 26 }}>{f.unit}</span>
        <button onClick={() => onAdd(f.id, qty)}
          style={{ background: '#6366f1', border: 'none', borderRadius: 10, padding: '7px 14px', color: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit', flexShrink: 0 }}>
          Add
        </button>
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
    try {
      await loginWithGoogle()
    } catch (e) {
      setError('Erro ao fazer login. Tente novamente.')
      setLoading(false)
    }
  }
  return (
    <div style={{ minHeight: '100vh', background: '#0c0c10', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Syne', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 360, width: '100%', textAlign: 'center' }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 11, letterSpacing: 3, color: '#55557a', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', marginBottom: 12 }}>EVOSHAPE</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#ededf5', lineHeight: 1.2, marginBottom: 8 }}>EvoShape</div>
          <div style={{ fontSize: 14, color: '#55557a', lineHeight: 1.5 }}>Dieta · Treino · Peso · Evolução</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 40 }}>
          {[{ label: 'Dieta', color: '#6366f1', icon: '🥗' }, { label: 'Treino', color: '#10b981', icon: '💪' }, { label: 'Evolução', color: '#f59e0b', icon: '📈' }].map(s => (
            <div key={s.label} style={{ background: '#13131f', borderRadius: 12, padding: '14px 8px', border: '0.5px solid #1e1e30' }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontSize: 11, color: s.color, fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <button onClick={handleLogin} disabled={loading}
          style={{ width: '100%', padding: '14px 20px', background: loading ? '#1e1e30' : '#fff', border: 'none', borderRadius: 14, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, fontSize: 15, fontWeight: 700, fontFamily: 'inherit', color: loading ? '#55557a' : '#1a1a1a' }}>
          {!loading && (
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
          )}
          {loading ? 'Entrando...' : 'Entrar com Google'}
        </button>
        {error && <div style={{ marginTop: 12, fontSize: 12, color: '#ef4444' }}>{error}</div>}
        <div style={{ marginTop: 20, fontSize: 11, color: '#3a3a5a', lineHeight: 1.5 }}>
          Seus dados ficam salvos na nuvem e sincronizados entre todos os seus dispositivos
        </div>
      </div>
    </div>
  )
}

function WeightModal({ onSave, onClose }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [weight, setWeight] = useState('')

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#13131f', borderRadius: '16px 16px 0 0', padding: 24, width: '100%', maxWidth: 480, border: '0.5px solid #2a2a40' }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>⚖️ Registrar Peso</div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, color: '#8888aa', fontWeight: 500, marginBottom: 4, display: 'block' }}>Data</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            style={{ width: '100%', background: '#1e1e30', border: '0.5px solid #2a2a40', borderRadius: 10, padding: '10px 14px', color: '#ededf5', fontSize: 14, fontFamily: 'JetBrains Mono, monospace' }} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 11, color: '#10b981', fontWeight: 500, marginBottom: 4, display: 'block' }}>Peso (kg)</label>
          <input type="number" step="0.1" placeholder="Ex: 76.5" value={weight} onChange={e => setWeight(e.target.value)} autoFocus
            style={{ width: '100%', background: '#1e1e30', border: '0.5px solid #10b98140', borderRadius: 10, padding: '10px 14px', color: '#ededf5', fontSize: 18, fontFamily: 'JetBrains Mono, monospace', textAlign: 'center' }} />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 12, background: '#1e1e30', border: 'none', borderRadius: 12, color: '#8888aa', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
          <button onClick={() => { if (weight) { onSave(date, weight); } }} style={{ flex: 2, padding: 12, background: '#6366f1', border: 'none', borderRadius: 12, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 14 }}>Salvar</button>
        </div>
      </div>
    </div>
  )
}

function TargetsModal({ targets, onSave, onClose }) {
  const [t, setT] = useState(targets)
  const fields = [
    { k: 'cal', l: 'Calorias alvo (kcal)', c: '#6366f1' }, { k: 'min', l: 'Kcal mínimo', c: '#f59e0b' }, { k: 'max', l: 'Kcal máximo', c: '#ef4444' },
    { k: 'prot', l: 'Proteína alvo (g)', c: '#10b981' }, { k: 'protMin', l: 'Proteína mínima (g)', c: '#10b981' }, { k: 'protMax', l: 'Proteína máxima (g)', c: '#10b981' },
    { k: 'carb', l: 'Carboidratos (g)', c: '#f59e0b' }, { k: 'fat', l: 'Gordura alvo (g)', c: '#ec4899' }, { k: 'fatMax', l: 'Gordura máxima (g)', c: '#ec4899' },
  ]
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#13131f', borderRadius: '16px 16px 0 0', padding: 24, width: '100%', maxWidth: 480, border: '0.5px solid #2a2a40', maxHeight: '80vh', overflowY: 'auto' }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Metas diárias</div>
        {fields.map(f => (
          <div key={f.k} style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: f.c, fontWeight: 500, marginBottom: 4, display: 'block' }}>{f.l}</label>
            <input type="number" value={t[f.k] || ''} onChange={e => setT(prev => ({ ...prev, [f.k]: parseFloat(e.target.value) || 0 }))}
              style={{ width: '100%', background: '#1e1e30', border: `0.5px solid ${f.c}40`, borderRadius: 10, padding: '10px 14px', color: '#ededf5', fontSize: 14, fontFamily: 'JetBrains Mono, monospace' }} />
          </div>
        ))}
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 12, background: '#1e1e30', border: 'none', borderRadius: 12, color: '#8888aa', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
          <button onClick={() => onSave(t)} style={{ flex: 2, padding: 12, background: '#6366f1', border: 'none', borderRadius: 12, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 14 }}>Salvar</button>
        </div>
        <div style={{ marginTop: 12, padding: '8px 12px', background: '#0c0c10', borderRadius: 10, fontSize: 10, color: '#55557a', fontFamily: 'JetBrains Mono, monospace' }}>
          Padrão: 1562 kcal · min 1460 · max 1680 · P:150g · C:151g · G:43g
        </div>
      </div>
    </div>
  )
}
