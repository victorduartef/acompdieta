import { useState, useEffect, useCallback } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db, initAuth, loginWithGoogle, handleRedirectResult, logout } from './firebase.js'
import { getEvoTheme } from './theme/evoshapeTheme.js'
import Sidebar from './components/Sidebar.jsx'
import VisaoGeral from './screens/VisaoGeral.jsx'
import BottomNav from './components/BottomNav.jsx'
import MoreSheet from './components/MoreSheet.jsx'
import { mondayForOffset, weekRangeLabel, elapsedDaysInWeek, isCurrentWeek as isCurWeek, computeWeekKPIs, computeWeekKPIsPartial, weekWeightSeries, weekCaloriesSeries, weekComparison, fourWeekBodyComposition, weekHealthMetric, weekTraining, weekVolume, buildInsights } from './lib/dashboardMetrics.js'

// ── FOODS DATABASE ──────────────────────────────────────────────────────────
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
  { id: 'choc_nespresso', name: 'Chocolate Nespresso Nibs 75%', fav: ['almoco', 'extra'], cal: 30, prot: 0.5, carb: 1.6, fat: 2.3, unit: 'unid', def: 2, note: '1 unid = 5g' },
  { id: 'acai', name: 'Polpa de Açaí (pura)', fav: ['lanche'], cal: 58, prot: 0.3, carb: 2.1, fat: 1.3, unit: 'g', def: 100, note: 'De Marchi, sem adoçar' },
  { id: 'pao_pullman', name: 'Pão Pullman Ferm. Natural', fav: ['lanche'], cal: 256, prot: 8.8, carb: 49, fat: 2.7, unit: 'g', def: 50, note: '2 fatias = ~50g' },
  { id: 'frango_desfiado', name: 'Frango Desfiado', fav: ['lanche', 'almoco'], cal: 165, prot: 31, carb: 0, fat: 3.6, unit: 'g', def: 50 },
  { id: 'ricota_light', name: 'Creme de Ricota Light', fav: ['lanche'], cal: 108, prot: 6.7, carb: 5.1, fat: 6.8, unit: 'g', def: 20 },
  { id: 'tortinha', name: 'Tortinha de Frango (3 porções)', fav: ['lanche'], cal: 276, prot: 37.7, carb: 1.4, fat: 11.8, unit: 'porção', def: 1, note: 'frango+ovos+cottage ÷12' },
  { id: 'patinho', name: 'Patinho Moído (pronto)', fav: ['janta'], cal: 152, prot: 24, carb: 0, fat: 6, unit: 'g', def: 150, note: 'peso já pronto' },
  { id: 'file_suino', name: 'Filé Mignon Suíno (pronto)', fav: ['janta'], cal: 165, prot: 26, carb: 0, fat: 6.5, unit: 'g', def: 150, note: 'peso já pronto' },
  { id: 'batata_doce_j', name: 'Batata Doce (janta)', fav: ['janta'], cal: 86, prot: 1.6, carb: 20, fat: 0.1, unit: 'g', def: 100 },
  { id: 'batata_ing_j', name: 'Batata Inglesa (janta)', fav: ['janta'], cal: 77, prot: 2, carb: 17.5, fat: 0.1, unit: 'g', def: 150 },
  { id: 'arroz_j', name: 'Arroz Branco (janta)', fav: ['janta'], cal: 130, prot: 2.7, carb: 28, fat: 0.3, unit: 'g', def: 80 },
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
  { id: 'extra', label: 'Refeição Extra', short: 'Extra', icon: '⚡', color: '#8b8be0' },
]

const ACTIVITIES = [
  { id: 'musculacao', label: 'Musculação', icon: '🏋️', color: '#c8873a', type: 'strength' },
  { id: 'futsal', label: 'Futsal', icon: '⚽', color: '#2ab8b8', type: 'cardio' },
  { id: 'futebol', label: 'Futebol', icon: '⚽', color: '#2ab8b8', type: 'cardio' },
  { id: 'tenis', label: 'Tênis', icon: '🎾', color: '#e8a040', type: 'cardio' },
  { id: 'volei', label: 'Vôlei', icon: '🏐', color: '#e07060', type: 'cardio' },
  { id: 'corrida', label: 'Corrida', icon: '🏃', color: '#e05555', type: 'cardio' },
  { id: 'natacao', label: 'Natação', icon: '🏊', color: '#0ea5e9', type: 'cardio' },
  { id: 'ciclismo', label: 'Ciclismo', icon: '🚴', color: '#8b8be0', type: 'cardio' },
  { id: 'outro', label: 'Outro', icon: '🏃', color: '#6b7280', type: 'other' },
]

// ── GRUPOS MUSCULARES ──
const MUSCLE_GROUPS = [
  { id: 'peito',      label: 'Peitoral',      color: '#e05555', region: 'front' },
  { id: 'costas',     label: 'Costas',        color: '#2ab8b8', region: 'back' },
  { id: 'ombro_ant',  label: 'Deltoide Ant.', color: '#e8a040', region: 'front' },
  { id: 'ombro_lat',  label: 'Deltoide Lat.', color: '#f5b04a', region: 'front' },
  { id: 'ombro_post', label: 'Deltoide Post.',color: '#d97706', region: 'back' },
  { id: 'biceps',     label: 'Bíceps',        color: '#8b7fd4', region: 'front' },
  { id: 'triceps',    label: 'Tríceps',       color: '#c8873a', region: 'back' },
  { id: 'antebraco',  label: 'Antebraço',     color: '#6b7280', region: 'front' },
  { id: 'quadriceps', label: 'Quadríceps',    color: '#0ea5e9', region: 'front' },
  { id: 'posterior',  label: 'Posterior',     color: '#e07060', region: 'back' },
  { id: 'gluteo',     label: 'Glúteos',       color: '#ec4899', region: 'back' },
  { id: 'panturrilha',label: 'Panturrilha',   color: '#10b981', region: 'back' },
  { id: 'abdomen',    label: 'Abdômen',       color: '#f59e0b', region: 'front' },
  { id: 'lombar',     label: 'Lombar',        color: '#84cc16', region: 'back' },
  { id: 'trapezio',   label: 'Trapézio',      color: '#a78bfa', region: 'back' },
]

// ── EQUIPAMENTOS ──
const EQUIPMENTS = [
  { id: 'barra',     label: 'Barra',        icon: '🏋️' },
  { id: 'halter',    label: 'Halteres',     icon: '💪' },
  { id: 'maquina',   label: 'Máquina',      icon: '⚙️' },
  { id: 'cabo',      label: 'Cabo/Polia',   icon: '🔗' },
  { id: 'smith',     label: 'Smith',        icon: '🏗️' },
  { id: 'corpo',     label: 'Peso Corporal',icon: '🤸' },
  { id: 'kettlebell',label: 'Kettlebell',   icon: '🔔' },
  { id: 'elastico',  label: 'Elástico',     icon: '➰' },
]

// ── BIBLIOTECA DE EXERCÍCIOS (pré-cadastrada) ──
// primary = músculo principal, secondary = [músculos secundários]
const EXERCISE_LIBRARY = [
  // ── PEITO ──
  { id:'ex_supino_reto',      name:'Supino Reto',              equipment:'barra',   primary:'peito',    secondary:['triceps','ombro_ant'] },
  { id:'ex_supino_inclinado', name:'Supino Inclinado',         equipment:'barra',   primary:'peito',    secondary:['triceps','ombro_ant'] },
  { id:'ex_supino_declinado', name:'Supino Declinado',         equipment:'barra',   primary:'peito',    secondary:['triceps'] },
  { id:'ex_supino_halter',    name:'Supino com Halteres',      equipment:'halter',  primary:'peito',    secondary:['triceps','ombro_ant'] },
  { id:'ex_supino_incl_halt', name:'Supino Inclinado Halteres',equipment:'halter',  primary:'peito',    secondary:['triceps','ombro_ant'] },
  { id:'ex_crucifixo',        name:'Crucifixo',                equipment:'halter',  primary:'peito',    secondary:['ombro_ant'] },
  { id:'ex_crossover',        name:'Crossover',                equipment:'cabo',    primary:'peito',    secondary:['ombro_ant'] },
  { id:'ex_peck_deck',        name:'Peck Deck (Voador)',       equipment:'maquina', primary:'peito',    secondary:[] },
  { id:'ex_flexao',           name:'Flexão de Braço',          equipment:'corpo',   primary:'peito',    secondary:['triceps','ombro_ant'] },
  { id:'ex_supino_maquina',   name:'Supino na Máquina',        equipment:'maquina', primary:'peito',    secondary:['triceps','ombro_ant'] },

  // ── COSTAS ──
  { id:'ex_puxada_frente',    name:'Puxada Frontal',           equipment:'cabo',    primary:'costas',   secondary:['biceps'] },
  { id:'ex_puxada_tras',      name:'Puxada Atrás',             equipment:'cabo',    primary:'costas',   secondary:['biceps'] },
  { id:'ex_remada_curvada',   name:'Remada Curvada',           equipment:'barra',   primary:'costas',   secondary:['biceps','lombar'] },
  { id:'ex_remada_halter',    name:'Remada Unilateral',        equipment:'halter',  primary:'costas',   secondary:['biceps'] },
  { id:'ex_remada_baixa',     name:'Remada Baixa (Cabo)',      equipment:'cabo',    primary:'costas',   secondary:['biceps'] },
  { id:'ex_remada_cavalinho', name:'Remada Cavalinho',         equipment:'maquina', primary:'costas',   secondary:['biceps'] },
  { id:'ex_barra_fixa',       name:'Barra Fixa',               equipment:'corpo',   primary:'costas',   secondary:['biceps'] },
  { id:'ex_pulldown',         name:'Pulldown',                 equipment:'cabo',    primary:'costas',   secondary:[] },
  { id:'ex_levantamento_terra',name:'Levantamento Terra',      equipment:'barra',   primary:'costas',   secondary:['lombar','posterior','gluteo','trapezio'] },
  { id:'ex_remada_maquina',   name:'Remada na Máquina',        equipment:'maquina', primary:'costas',   secondary:['biceps'] },

  // ── OMBRO ──
  { id:'ex_desenvolvimento',  name:'Desenvolvimento',          equipment:'barra',   primary:'ombro_ant',secondary:['triceps','ombro_lat'] },
  { id:'ex_desenv_halter',    name:'Desenvolvimento Halteres', equipment:'halter',  primary:'ombro_ant',secondary:['triceps','ombro_lat'] },
  { id:'ex_elevacao_lateral', name:'Elevação Lateral',         equipment:'halter',  primary:'ombro_lat',secondary:[] },
  { id:'ex_elevacao_frontal', name:'Elevação Frontal',         equipment:'halter',  primary:'ombro_ant',secondary:[] },
  { id:'ex_crucifixo_inv',    name:'Crucifixo Invertido',      equipment:'halter',  primary:'ombro_post',secondary:['costas','trapezio'] },
  { id:'ex_desenv_maquina',   name:'Desenvolvimento Máquina',  equipment:'maquina', primary:'ombro_ant',secondary:['triceps','ombro_lat'] },
  { id:'ex_arnold_press',     name:'Arnold Press',             equipment:'halter',  primary:'ombro_ant',secondary:['triceps','ombro_lat'] },
  { id:'ex_face_pull',        name:'Face Pull',                equipment:'cabo',    primary:'ombro_post',secondary:['trapezio','costas'] },
  { id:'ex_encolhimento',     name:'Encolhimento',             equipment:'halter',  primary:'trapezio', secondary:[] },

  // ── BÍCEPS ──
  { id:'ex_rosca_direta',     name:'Rosca Direta',             equipment:'barra',   primary:'biceps',   secondary:['antebraco'] },
  { id:'ex_rosca_alternada',  name:'Rosca Alternada',          equipment:'halter',  primary:'biceps',   secondary:['antebraco'] },
  { id:'ex_rosca_martelo',    name:'Rosca Martelo',            equipment:'halter',  primary:'biceps',   secondary:['antebraco'] },
  { id:'ex_rosca_scott',      name:'Rosca Scott',              equipment:'barra',   primary:'biceps',   secondary:[] },
  { id:'ex_rosca_concentrada',name:'Rosca Concentrada',        equipment:'halter',  primary:'biceps',   secondary:[] },
  { id:'ex_rosca_cabo',       name:'Rosca no Cabo',            equipment:'cabo',    primary:'biceps',   secondary:[] },

  // ── TRÍCEPS ──
  { id:'ex_triceps_testa',    name:'Tríceps Testa',            equipment:'barra',   primary:'triceps',  secondary:[] },
  { id:'ex_triceps_pulley',   name:'Tríceps Pulley',           equipment:'cabo',    primary:'triceps',  secondary:[] },
  { id:'ex_triceps_corda',    name:'Tríceps Corda',            equipment:'cabo',    primary:'triceps',  secondary:[] },
  { id:'ex_triceps_frances',  name:'Tríceps Francês',          equipment:'halter',  primary:'triceps',  secondary:[] },
  { id:'ex_mergulho',         name:'Mergulho (Dips)',          equipment:'corpo',   primary:'triceps',  secondary:['peito','ombro_ant'] },
  { id:'ex_triceps_coice',    name:'Tríceps Coice',            equipment:'halter',  primary:'triceps',  secondary:[] },

  // ── QUADRÍCEPS / PERNAS ──
  { id:'ex_agachamento',      name:'Agachamento Livre',        equipment:'barra',   primary:'quadriceps',secondary:['gluteo','posterior','lombar'] },
  { id:'ex_leg_press',        name:'Leg Press',                equipment:'maquina', primary:'quadriceps',secondary:['gluteo','posterior'] },
  { id:'ex_cadeira_extensora',name:'Cadeira Extensora',        equipment:'maquina', primary:'quadriceps',secondary:[] },
  { id:'ex_agach_smith',      name:'Agachamento Smith',        equipment:'smith',   primary:'quadriceps',secondary:['gluteo'] },
  { id:'ex_afundo',           name:'Afundo',                   equipment:'halter',  primary:'quadriceps',secondary:['gluteo','posterior'] },
  { id:'ex_hack',             name:'Hack Squat',               equipment:'maquina', primary:'quadriceps',secondary:['gluteo'] },
  { id:'ex_agach_bulgaro',    name:'Agachamento Búlgaro',      equipment:'halter',  primary:'quadriceps',secondary:['gluteo'] },

  // ── POSTERIOR / GLÚTEO ──
  { id:'ex_stiff',            name:'Stiff',                    equipment:'barra',   primary:'posterior',secondary:['gluteo','lombar'] },
  { id:'ex_mesa_flexora',     name:'Mesa Flexora',             equipment:'maquina', primary:'posterior',secondary:[] },
  { id:'ex_cadeira_flexora',  name:'Cadeira Flexora',          equipment:'maquina', primary:'posterior',secondary:[] },
  { id:'ex_elevacao_pelvica', name:'Elevação Pélvica',         equipment:'barra',   primary:'gluteo',   secondary:['posterior'] },
  { id:'ex_cadeira_abdutora', name:'Cadeira Abdutora',         equipment:'maquina', primary:'gluteo',   secondary:[] },
  { id:'ex_coice_cabo',       name:'Coice no Cabo',            equipment:'cabo',    primary:'gluteo',   secondary:['posterior'] },

  // ── PANTURRILHA ──
  { id:'ex_panturrilha_pe',   name:'Panturrilha em Pé',        equipment:'maquina', primary:'panturrilha',secondary:[] },
  { id:'ex_panturrilha_sent', name:'Panturrilha Sentado',      equipment:'maquina', primary:'panturrilha',secondary:[] },
  { id:'ex_panturrilha_leg',  name:'Panturrilha no Leg',       equipment:'maquina', primary:'panturrilha',secondary:[] },

  // ── ABDÔMEN / CORE ──
  { id:'ex_abdominal',        name:'Abdominal',                equipment:'corpo',   primary:'abdomen',  secondary:[] },
  { id:'ex_prancha',          name:'Prancha',                  equipment:'corpo',   primary:'abdomen',  secondary:['lombar'] },
  { id:'ex_elevacao_pernas',  name:'Elevação de Pernas',       equipment:'corpo',   primary:'abdomen',  secondary:[] },
  { id:'ex_abdominal_cabo',   name:'Abdominal no Cabo',        equipment:'cabo',    primary:'abdomen',  secondary:[] },
  { id:'ex_prancha_lateral',  name:'Prancha Lateral',          equipment:'corpo',   primary:'abdomen',  secondary:[] },

  // ── LOMBAR ──
  { id:'ex_hiperextensao',    name:'Hiperextensão Lombar',     equipment:'corpo',   primary:'lombar',   secondary:['gluteo','posterior'] },
]

const HEALTH_CUTOFF = '2026-08-19' // início do monitoramento de passos e sono (relógio usado a partir daqui)

const DEFAULT_TARGETS = {
  cal: 1562, prot: 150, carb: 151, fat: 43,
  min: 1460, max: 1680, protMin: 138, protMax: 163, fatMax: 52,
  controlCarb: false, carbMin: 130, carbMax: 170,
  fatMin: 35,
  dualMode: false,
  targets2: { cal: 1800, prot: 150, carb: 220, fat: 50, min: 1700, max: 1900, protMin: 138, protMax: 163, fatMax: 60, carbMin: 190, carbMax: 240, fatMin: 40 },
  variableDays: [1, 3, 5],
  validFrom: '2020-01-01',
}

// ── HELPERS ─────────────────────────────────────────────────────────────────
function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function emptyDay() { return { meals: { cafe_manha:[], almoco:[], lanche:[], janta:[], extra:[] }, activities:[] } }
function r(v) { return Math.round(v * 10) / 10 }
function r0(v) { return Math.round(v) }
function formatDateFull(iso) {
  const dt = new Date(iso + 'T12:00:00')
  const wd = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
  const mo = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  return `${wd[dt.getDay()]}, ${dt.getDate()} ${mo[dt.getMonth()]}`
}
function isWeekend(iso) { const d = new Date(iso+'T12:00:00'); return d.getDay()===0||d.getDay()===6 }
function isWeekday(iso) { return !isWeekend(iso) }

// Returns the targets that were active for a given date, considering history
function getTargetsForDate(targets, targetsHistory, dateKey) {
  // Find best matching historical snapshot (latest one that started on or before dateKey)
  let best = null
  if (targetsHistory && targetsHistory.length > 0) {
    const sorted = [...targetsHistory].sort((a,b) => b.validFrom.localeCompare(a.validFrom))
    for (const snap of sorted) {
      if (snap.validFrom <= dateKey) { best = snap; break }
    }
  }
  const t = best || targets
  // Apply dual mode if enabled
  if (!t.dualMode) return t
  const d = new Date(dateKey + 'T12:00:00')
  const dow = d.getDay()
  const variableDays = t.variableDays || [1,3,5]
  if (variableDays.includes(dow)) return { ...t.targets2, dualMode:true, variableDays, targets2:t.targets2, validFrom:t.validFrom }
  return t
}

function calcMacros(items, allFoods) {
  return items.reduce((a, it) => {
    // Avulso items store macros directly
    if (it.avulso) return { cal:a.cal+(it.cal||0), prot:a.prot+(it.prot||0), carb:a.carb+(it.carb||0), fat:a.fat+(it.fat||0) }
    const f = allFoods.find(x => x.id === it.id)
    if (!f) return a
    const fixed = ['unid','dose','porção'].includes(f.unit)
    const m = fixed ? it.qty : it.qty/100
    return { cal:a.cal+f.cal*m, prot:a.prot+f.prot*m, carb:a.carb+f.carb*m, fat:a.fat+f.fat*m }
  }, { cal:0, prot:0, carb:0, fat:0 })
}

function farolCal(c,t) { return c<=t.cal?'#2ab8b8':c<=t.max?'#e8a040':'#e05555' }
function farolProt(p,t) { return (p>=(t.protMin||138)&&p<=(t.protMax||163))?'#2ab8b8':'#e05555' }
function farolFat(f,t) {
  const fmin = t.fatMin
  const fmax = t.fatMax||52
  if (fmin && f < fmin) return '#e8a040' // below min = amber
  return f<=fmax?'#2ab8b8':'#e05555'
}
function farolCarb(c,t) {
  if (!t.controlCarb) return null
  const cmin = t.carbMin, cmax = t.carbMax
  if (cmin && c < cmin) return '#e8a040'
  if (cmax && c > cmax) return '#e05555'
  return '#2ab8b8'
}

async function loadFromFirebase(uid) {
  try { const snap = await getDoc(doc(db,'users',uid)); if(snap.exists()) return snap.data() } catch(e) { console.error(e) }
  return null
}
async function saveToFirebase(uid, data, fullReplace) {
  try {
    await setDoc(doc(db,'users',uid), data, { merge: !fullReplace })
  } catch(e) { console.error(e) }
}

// ── THEME ────────────────────────────────────────────────────────────────────
const DARK = {
  bg:'#0d1a1f', surface:'#122028', surface2:'#1a2d35', border:'#1e3540',
  gold:'#c8873a', gold2:'#e8a040', teal:'#2ab8b8', red:'#e05555', terra:'#e07060',
  text:'#f0e8d8', text2:'#7a9aa8', text3:'#3d5a68', btnText:'#0d1a1f',
}
const LIGHT = {
  bg:'#f7f8fa', surface:'#ffffff', surface2:'#f0f2f5', border:'#e3e7ec',
  gold:'#4f46e5', gold2:'#6366f1', teal:'#0ea5a5', red:'#ef4444', terra:'#f59e0b',
  text:'#111827', text2:'#6b7280', text3:'#9ca3af', btnText:'#ffffff',
}

// ── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [uid, setUid] = useState(null)
  const [user, setUser] = useState(null)
  const [days, setDays] = useState({})
  const [targets, setTargets] = useState(DEFAULT_TARGETS)
  const [targetsHistory, setTargetsHistory] = useState([])
  const [customFoods, setCustomFoods] = useState([])
  const [weights, setWeights] = useState({})
  const [bodyData, setBodyData] = useState({}) // stores full body composition per date
  const [showRelaxFitModal, setShowRelaxFitModal] = useState(false)
  const [healthData, setHealthData] = useState({}) // { 'YYYY-MM-DD': { steps, sleepHours, ... } }
  const [showHealthImport, setShowHealthImport] = useState(false)
  const [showHealthManual, setShowHealthManual] = useState(false)
  const [healthEditDate, setHealthEditDate] = useState(null)
  const [workoutPlans, setWorkoutPlans] = useState([]) // fichas de treino do usuário
  const [customExercises, setCustomExercises] = useState([]) // exercícios criados pelo usuário
  const [workoutLogs, setWorkoutLogs] = useState({}) // registros de treino por data
  const [treinoView, setTreinoView] = useState('resumo') // resumo | fichas | ficha | live | exercicios
  const [activePlanId, setActivePlanId] = useState(null)
  const [editingExercise, setEditingExercise] = useState(null)
  const [liveSession, setLiveSession] = useState(null) // { planId, exercises:[{exId, sets:[{weight,reps,done}], skipped}], startTime }
  const [restTimer, setRestTimer] = useState(null) // { total, endsAt } — baseado em timestamp
  const [restNow, setRestNow] = useState(Date.now())
  const [exSearch, setExSearch] = useState('')
  const [exMuscleFilter, setExMuscleFilter] = useState('')
  const [expandedWorkout, setExpandedWorkout] = useState(null)
  const [pesoPeriod, setPesoPeriod] = useState('90d') // 30d | 90d | 180d | all
  const [insightPeriod, setInsightPeriod] = useState('last') // 'last' | '7d' | '30d'
  const [loaded, setLoaded] = useState(false)
  const [tab, setTab] = useState(() => (typeof window !== 'undefined' && window.innerWidth >= 1024) ? 'overview' : 'today')
  const [activeMeal, setActiveMeal] = useState('cafe_manha')
  const [addingFood, setAddingFood] = useState(false)
  const [search, setSearch] = useState('')
  const [foodSearch, setFoodSearch] = useState('')
  const [registerMode, setRegisterMode] = useState(false)
  const [editingFoodIdx, setEditingFoodIdx] = useState(null)
  const [editingDay, setEditingDay] = useState(null)
  const [showTargets, setShowTargets] = useState(false)
  const [showWeightModal, setShowWeightModal] = useState(false)
  const [analysisFilters, setAnalysisFilters] = useState([])
  const [analysisDateFrom, setAnalysisDateFrom] = useState('')
  const [analysisDateTo, setAnalysisDateTo] = useState('')
  const [avulso, setAvulso] = useState(false)
  const [avulsoData, setAvulsoData] = useState({ name:'', cal:'', prot:'', carb:'', fat:'' })
  const [newFood, setNewFood] = useState({ name:'', cal:'', prot:'', carb:'', fat:'', unit:'g', def:'100', fav:[] })
  const [darkMode, setDarkMode] = useState(true)

  const C = darkMode ? DARK : LIGHT
  const T = getEvoTheme(darkMode) // tokens do redesign (Visão Geral / sidebar)
  const [overviewWeekOffset, setOverviewWeekOffset] = useState(0) // 0 = semana atual

  const [winW, setWinW] = useState(typeof window !== 'undefined' ? window.innerWidth : 480)
  useEffect(() => {
    const onResize = () => setWinW(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  // Breakpoints do EvoShape
  const isMobile = winW < 768      // bottom navigation
  const isTablet = winW >= 768 && winW < 1024  // sidebar compacta
  const isDesktop = winW >= 1024   // sidebar completa
  const isWide = winW >= 1024      // desktop: sidebar + Visão Geral shell (mantém compat)
  const [showMoreSheet, setShowMoreSheet] = useState(false)

  // Rest timer baseado em timestamp (resiste a tela bloqueada / app em background)
  useEffect(() => {
    if (!restTimer || !restTimer.endsAt) return
    let beeped = false
    const tick = () => {
      const now = Date.now()
      setRestNow(now)
      if (now >= restTimer.endsAt && !beeped) {
        beeped = true
        try {
          const ctx = new (window.AudioContext||window.webkitAudioContext)()
          const osc = ctx.createOscillator(); const gain = ctx.createGain()
          osc.connect(gain); gain.connect(ctx.destination)
          osc.frequency.value = 880; gain.gain.value = 0.3
          osc.start(); osc.stop(ctx.currentTime + 0.3)
        } catch(e) {}
        if (navigator.vibrate) navigator.vibrate([200,100,200])
      }
    }
    const iv = setInterval(tick, 500)
    // Recalcula ao voltar o foco/visibilidade (desbloqueio de tela)
    const onVis = () => { if (!document.hidden) tick() }
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('focus', onVis)
    tick()
    return () => { clearInterval(iv); document.removeEventListener('visibilitychange', onVis); window.removeEventListener('focus', onVis) }
  }, [restTimer])

  // ── Persistência do treino em andamento (localStorage) ──
  // Restaura sessão ao abrir; salva a cada mudança para não perder progresso ao atualizar/fechar.
  useEffect(() => {
    try {
      const saved = localStorage.getItem('evoshape_live_session')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && parsed.planId && parsed.exercises) setLiveSession(parsed)
      }
      const savedTimer = localStorage.getItem('evoshape_rest_timer')
      if (savedTimer) {
        const t = JSON.parse(savedTimer)
        if (t && t.endsAt && t.endsAt > Date.now()) setRestTimer(t)
        else localStorage.removeItem('evoshape_rest_timer')
      }
    } catch(e) {}
  }, [])

  useEffect(() => {
    try {
      if (liveSession) localStorage.setItem('evoshape_live_session', JSON.stringify(liveSession))
      else localStorage.removeItem('evoshape_live_session')
    } catch(e) {}
  }, [liveSession])

  useEffect(() => {
    try {
      if (restTimer && restTimer.endsAt) localStorage.setItem('evoshape_rest_timer', JSON.stringify(restTimer))
      else localStorage.removeItem('evoshape_rest_timer')
    } catch(e) {}
  }, [restTimer])


  // Sync browser chrome (status bar tint + color-scheme) with the in-app theme,
  // so Chrome Android doesn't force its own auto dark mode over our colors.
  useEffect(() => {
    document.documentElement.style.colorScheme = darkMode ? 'dark' : 'light'
    document.body.style.background = C.bg
    let meta = document.querySelector('meta[name="theme-color"]')
    if (!meta) { meta = document.createElement('meta'); meta.name = 'theme-color'; document.head.appendChild(meta) }
    meta.content = C.bg
  }, [darkMode, C.bg])

  const allFoods = DEFAULT_FOODS.map(f => {
    const ov = customFoods.find(c => c.id === f.id)
    return ov ? ov : f
  }).concat(customFoods.filter(c => !DEFAULT_FOODS.find(f => f.id === c.id)))

  // Custom overrides têm precedência sobre a biblioteca (mesmo padrão dos alimentos)
  const allExercises = EXERCISE_LIBRARY.map(e => {
    const ov = customExercises.find(c => c.id === e.id)
    return ov ? ov : e
  }).concat(customExercises.filter(c => !EXERCISE_LIBRARY.find(e => e.id === c.id)))
  const getExercise = (id) => allExercises.find(e => e.id === id)
  // Peso efetivo para tonelagem: considera barra e peso por lado configurados no exercício
  const effectiveWeight = (exId, registeredWeight) => {
    const e = getExercise(exId)
    let w = registeredWeight || 0
    if (!e) return w
    // Peso por lado: multiplica por 2 (independente de barra)
    if (e.perSide) w = w * 2
    // Barra livre: soma o peso da barra
    if (e.usesBar) w = w + (e.barWeight || 0)
    return w
  }
  const getMuscle = (id) => MUSCLE_GROUPS.find(m => m.id === id) || (id === 'ombro' ? MUSCLE_GROUPS.find(m => m.id === 'ombro_ant') : null)
  const getEquipment = (id) => EQUIPMENTS.find(e => e.id === id)

  useEffect(() => {
    handleRedirectResult()
    initAuth((fu) => {
      if (fu) {
        setUid(fu.uid); setUser(fu)
        loadFromFirebase(fu.uid).then(data => {
          if (data) {
            if (data.days) setDays(data.days)
            if (data.targets) setTargets(t => ({ ...DEFAULT_TARGETS, ...t, ...data.targets }))
            if (data.targetsHistory) setTargetsHistory(data.targetsHistory)
            if (data.customFoods) setCustomFoods(data.customFoods)
            if (data.weights) setWeights(data.weights)
            if (data.bodyData) setBodyData(data.bodyData)
            if (data.healthData) setHealthData(data.healthData)
            if (data.workoutPlans) setWorkoutPlans(data.workoutPlans)
            if (data.customExercises) setCustomExercises(data.customExercises)
            if (data.workoutLogs) setWorkoutLogs(data.workoutLogs)
            if (data.targetsHistory) setTargetsHistory(data.targetsHistory)
            if (data.darkMode !== undefined) setDarkMode(data.darkMode)
          }
          setLoaded(true)
        })
      } else { setUid(null); setUser(null); setLoaded(true) }
    })
  }, [])

  const persist = useCallback((nd, nt, nth, ncf, nw, ndm, nbd) => {
    if (!uid) return
    const payload = {
      days: nd,
      targets: nt,
      targetsHistory: nth,
      customFoods: ncf,
      weights: nw,
      darkMode: ndm,
      bodyData: nbd !== undefined ? nbd : bodyData,
      healthData,
      workoutPlans,
      customExercises,
      workoutLogs,
    }
    // fullReplace=true ensures deleted keys (e.g. removed weight entries) are actually removed
    saveToFirebase(uid, payload, true)
  }, [uid, bodyData, healthData, workoutPlans, customExercises, workoutLogs])

  const updateDays = (nd) => { setDays(nd); persist(nd, targets, targetsHistory, customFoods, weights, darkMode) }
  const updateTargets = (nt, nth) => {
    setTargets(nt)
    const newHist = nth || targetsHistory
    setTargetsHistory(newHist)
    persist(days, nt, newHist, customFoods, weights, darkMode)
  }
  const updateCustomFoods = (cf) => { setCustomFoods(cf); persist(days, targets, targetsHistory, cf, weights, darkMode) }
  const updateWeights = (w) => { setWeights(w); persist(days, targets, targetsHistory, customFoods, w, darkMode) }
  const updateBodyData = (bd) => { setBodyData(bd); persist(days, targets, targetsHistory, customFoods, weights, darkMode, bd) }
  const updateHealthData = (hd) => {
    setHealthData(hd)
    if (!uid) return
    saveToFirebase(uid, { days, targets, targetsHistory, customFoods, weights, darkMode, bodyData, healthData: hd, workoutPlans, customExercises, workoutLogs }, true)
  }
  const saveWorkoutState = (plans, exercises, logs) => {
    if (!uid) return
    saveToFirebase(uid, { days, targets, targetsHistory, customFoods, weights, darkMode, bodyData, healthData, workoutPlans:plans, customExercises:exercises, workoutLogs:logs }, true)
  }
  const updateWorkoutPlans = (plans) => { setWorkoutPlans(plans); saveWorkoutState(plans, customExercises, workoutLogs) }
  const updateCustomExercises = (ex) => { setCustomExercises(ex); saveWorkoutState(workoutPlans, ex, workoutLogs) }
  const updateWorkoutLogs = (logs) => { setWorkoutLogs(logs); saveWorkoutState(workoutPlans, customExercises, logs) }
  const toggleDarkMode = () => { const nm = !darkMode; setDarkMode(nm); persist(days, targets, targetsHistory, customFoods, weights, nm) }

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
    updateDays({ ...days, [activeKey]: { ...day, meals: { ...day.meals, [activeMeal]: [...(day.meals[activeMeal]||[]), { id:foodId, qty:qty??f.def }] } } })
    setAddingFood(false); setSearch('')
  }

  // Toggle a food as favorite for a specific meal (stored as override in customFoods)
  function toggleMealFav(foodId, mealId) {
    const base = DEFAULT_FOODS.find(f => f.id === foodId)
    const existing = customFoods.find(c => c.id === foodId)
    const src = existing || base
    if (!src) return
    const curFav = src.fav || []
    const newFav = curFav.includes(mealId) ? curFav.filter(m => m !== mealId) : [...curFav, mealId]
    const updated = { ...src, fav: newFav }
    const newCustom = existing
      ? customFoods.map(c => c.id === foodId ? updated : c)
      : [...customFoods, updated]
    updateCustomFoods(newCustom)
  }

  // Add all favorite foods of the active meal at once
  function addFavoriteMeal() {
    const favs = allFoods.filter(f => f.fav && f.fav.includes(activeMeal))
    if (favs.length === 0) return
    const day = getDay(activeKey)
    const newItems = favs.map(f => ({ id:f.id, qty:f.def }))
    updateDays({ ...days, [activeKey]: { ...day, meals: { ...day.meals, [activeMeal]: [...(day.meals[activeMeal]||[]), ...newItems] } } })
    setAddingFood(false); setSearch('')
  }
  function removeFood(mealId, idx) {
    const day = days[activeKey]; if (!day) return
    updateDays({ ...days, [activeKey]: { ...day, meals: { ...day.meals, [mealId]: day.meals[mealId].filter((_,i)=>i!==idx) } } })
  }
  function updateQty(mealId, idx, val) {
    const day = days[activeKey]; if (!day) return
    updateDays({ ...days, [activeKey]: { ...day, meals: { ...day.meals, [mealId]: day.meals[mealId].map((it,i)=>i===idx?{...it,qty:parseFloat(val)||0}:it) } } })
  }
  function addActivityToDay(activityId) {
    const day = getDay(activeKey)
    if ((day.activities||[]).includes(activityId)) return
    updateDays({ ...days, [activeKey]: { ...day, activities: [...(day.activities||[]), activityId] } })
  }
  function removeActivityFromDay(activityId) {
    const day = days[activeKey]; if (!day) return
    updateDays({ ...days, [activeKey]: { ...day, activities: (day.activities||[]).filter(a=>a!==activityId) } })
  }
  function saveWeight(dateKey, value) {
    updateWeights({ ...weights, [dateKey]: parseFloat(value) })
  }

  // Save weight + body composition together in a single persist (avoids race condition)
  function saveWeightAndBody(dateKey, bodyObj) {
    const newWeights = { ...weights, [dateKey]: parseFloat(bodyObj.weight) }
    const newBodyData = { ...bodyData, [dateKey]: bodyObj }
    setWeights(newWeights)
    setBodyData(newBodyData)
    persist(days, targets, targetsHistory, customFoods, newWeights, darkMode, newBodyData)
  }

  if (!loaded) return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#0d1a1f', gap:24 }}>
      <img src="/icon-512.png" alt="EvoShape" style={{ width:140, height:140, borderRadius:32, boxShadow:'0 0 60px #c8873a40, 0 0 120px #2ab8b820' }} />
      <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, letterSpacing:4, color:'#7a9aa8', textTransform:'uppercase' }}>Carregando...</div>
    </div>
  )
  if (!uid) return <LoginScreen />

  const today = todayKey()
  const currentDay = getDay(activeKey)
  const allItems = Object.values(currentDay.meals).flat()
  const activeTargets = getTargetsForDate(targets, targetsHistory, activeKey)
  const dayMacros = calcMacros(allItems, allFoods)
  const isEditing = !!editingDay
  const isToday = activeKey === today
  const dt = new Date(activeKey + 'T12:00:00')
  const wdH = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
  const moH = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  const headerDate = isToday ? `${wdH[dt.getDay()]}, ${dt.getDate()} de ${moH[dt.getMonth()]}` : `✏️ ${dt.getDate()} de ${moH[dt.getMonth()]}`
  const over = dayMacros.cal > activeTargets.max
  const inRange = dayMacros.cal >= activeTargets.min && dayMacros.cal <= activeTargets.max
  const calPct = Math.min(100, (dayMacros.cal / activeTargets.max) * 100)
  const calBarColor = over ? C.red : inRange ? C.teal : C.gold
  const calDiff = activeTargets.cal - dayMacros.cal
  const hasData = dayMacros.cal > 0

  // ── Visão Geral: cálculo dos KPIs da semana selecionada (memória, sem Firestore) ──
  const overviewMonday = mondayForOffset(overviewWeekOffset)
  const overviewIsCurrent = isCurWeek(overviewMonday)
  const overviewElapsed = elapsedDaysInWeek(overviewMonday)
  const overviewPartial = overviewIsCurrent && overviewElapsed < 7
  const overviewToday = todayKey()
  const kpiDeps = { days, weights, bodyData, healthData, calcMacros, allFoods, ACTIVITIES, currentDateKey: overviewToday }
  const overviewKpis = computeWeekKPIs(overviewMonday, kpiDeps)
  const overviewPrevMonday = mondayForOffset(overviewWeekOffset + 1)
  // Semana parcial compara com os mesmos dias decorridos da semana anterior; completa compara semana cheia
  const overviewPrevKpis = overviewPartial
    ? computeWeekKPIsPartial(overviewPrevMonday, overviewElapsed, kpiDeps)
    : computeWeekKPIs(overviewPrevMonday, kpiDeps)
  const overviewWeekLabel = weekRangeLabel(overviewMonday)

  // Painéis: séries por dia da semana selecionada
  const overviewWeightSeries = weekWeightSeries(overviewMonday, weights)
  const overviewPrevWeightSeries = weekWeightSeries(overviewPrevMonday, weights)
  const overviewCaloriesData = weekCaloriesSeries(overviewMonday, { days, calcMacros, allFoods, targets, targetsHistory, getTargetsForDate, currentDateKey: overviewToday })
  const overviewComparison = weekComparison(overviewMonday, { days, weights, bodyData, healthData, calcMacros, allFoods, currentDateKey: overviewToday })

  // Blocos inferiores (Fase 4)
  const overviewBodyWeeks = fourWeekBodyComposition(overviewMonday, { bodyData, weights })
  const ovSteps = weekHealthMetric(overviewMonday, healthData, 'steps')
  const ovSleep = weekHealthMetric(overviewMonday, healthData, 'sleep')
  const ovScore = weekHealthMetric(overviewMonday, healthData, 'sleepScore')
  const ovPrevSteps = weekHealthMetric(overviewPrevMonday, healthData, 'steps')
  const ovPrevSleep = weekHealthMetric(overviewPrevMonday, healthData, 'sleep')
  const ovPrevScore = weekHealthMetric(overviewPrevMonday, healthData, 'sleepScore')
  const overviewHealthPrevMeans = { steps: ovPrevSteps.mean, sleep: ovPrevSleep.mean, score: ovPrevScore.mean }
  const overviewTraining = weekTraining(overviewMonday, { days, workoutLogs, ACTIVITIES, effectiveWeight })
  const overviewPrevVolume = weekVolume(overviewPrevMonday, workoutLogs, effectiveWeight)
  const overviewInsights = buildInsights({
    comparison: overviewComparison, kpis: overviewKpis, targets, bodyWeeks: overviewBodyWeeks,
    healthSleep: ovSleep, healthSteps: ovSteps,
  })

  // No desktop, a Visão Geral e a navegação usam a nova sidebar + tema do redesign.
  // Shell novo: desktop (sidebar completa) + tablet (sidebar compacta). Mobile usa bottom nav.
  const useNewShell = isDesktop || isTablet
  const navReset = (t)=>{ setTab(t); setEditingDay(null); setAddingFood(false); setSearch(''); setRegisterMode(false); setAvulso(false) }

  return (
    <div style={{ background: useNewShell ? T.appBackground : (isMobile ? T.appBackground : C.bg), minHeight:'100vh', fontFamily:"'Syne',system-ui,sans-serif", color: (useNewShell||isMobile) ? T.textPrimary : C.text, transition:'background .3s', display: useNewShell ? 'flex' : 'block' }}>
      {useNewShell && (
        <Sidebar
          tab={tab}
          setTab={navReset}
          onOpenMetas={()=>setShowTargets(true)}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          user={user}
          onLogout={logout}
          T={T}
          compact={isTablet}
        />
      )}

      {/* Nova Visão Geral (desktop) */}
      {useNewShell && tab==='overview' && (
        <div style={{ flex:1, minWidth:0, height:'100vh', overflowY:'auto', padding:'24px 28px' }}>
          <VisaoGeral
            T={T}
            isWide={isWide}
            isMobile={isMobile}
            userName={user?.displayName?.split(' ')[0]}
            weekLabel={overviewWeekLabel}
            isCurrentWeekFlag={overviewIsCurrent}
            isPartial={overviewPartial}
            onPrevWeek={()=>setOverviewWeekOffset(o=>o+1)}
            onNextWeek={()=>setOverviewWeekOffset(o=>Math.max(0,o-1))}
            onResetWeek={()=>setOverviewWeekOffset(0)}
            kpis={overviewKpis}
            prevKpis={overviewPrevKpis}
            targets={targets}
            weightSeries={overviewWeightSeries}
            prevWeightMean={overviewPrevWeightSeries.mean}
            caloriesData={overviewCaloriesData}
            comparison={overviewComparison}
            onOpenPeso={()=>{ setTab('peso'); setEditingDay(null) }}
            onOpenDay={(dateKey)=>{ setEditingDay(dateKey); setTab('today'); setActiveMeal('cafe_manha') }}
            bodyWeeks={overviewBodyWeeks}
            healthSteps={ovSteps}
            healthSleep={ovSleep}
            healthScore={ovScore}
            healthPrevMeans={overviewHealthPrevMeans}
            training={overviewTraining}
            prevVolume={overviewPrevVolume}
            insights={overviewInsights}
            onOpenSaude={()=>{ setTab('saude'); setEditingDay(null) }}
            onOpenTreino={()=>{ setTab('treino'); setEditingDay(null) }}
            onInsightAction={(a)=>{ setTab(a); setEditingDay(null) }}
          />
        </div>
      )}

      {/* Conteúdo existente (todas as outras telas) */}
      <div style={{ display: (useNewShell && tab==='overview') ? 'none' : 'flex', flex: useNewShell ? 1 : undefined, minWidth:0, flexDirection:'column', ...(useNewShell ? { height:'100vh', overflowY:'auto' } : {}) }}>
      <div style={{ maxWidth:isWide?(tab==='analysis'?1600:1200):480, margin:'0 auto', width:'100%', minHeight:'100vh', display:'flex', flexDirection:'column', transition:'max-width .2s' }}>

        {/* ── HEADER ── (oculto no overview mobile — VisaoGeral tem cabeçalho próprio) */}
        {!(isMobile && tab==='overview') && <div style={{ background:darkMode?'linear-gradient(180deg,#0f2028 0%,#122028 100%)':C.surface, borderBottom:`1px solid ${C.border}`, padding:'16px 16px 0', flexShrink:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                <img src="/icon-512.png" alt="" style={{ width:22, height:22, borderRadius:6 }} />
                <div style={{ fontSize:10, letterSpacing:2.5, color:C.gold, fontFamily:'JetBrains Mono,monospace', fontWeight:700, textTransform:'uppercase' }}>EVOSHAPE</div>
              </div>
              <div style={{ fontSize:17, fontWeight:800, color:C.text }}>{headerDate}</div>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:5 }}>
                <div style={{ display:'inline-block', padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:500, background:!isToday?`${C.gold}22`:over?`${C.red}22`:inRange&&hasData?`${C.teal}22`:C.surface2, color:!isToday?C.gold:over?C.red:inRange&&hasData?C.teal:C.text2 }}>
                  {!isToday?'Editando dia anterior':over?'Excesso':inRange&&hasData?'✓ Na meta':'—'}
                </div>
                {targets.dualMode&&(()=>{
                  const isVar=(targets.variableDays||[1,3,5]).includes(new Date(activeKey+'T12:00:00').getDay())
                  return <div style={{ display:'inline-block', padding:'2px 8px', borderRadius:20, fontSize:10, fontWeight:700, background:isVar?`${C.teal}22`:`${C.gold}22`, color:isVar?C.teal:C.gold }}>{isVar?'● Meta 2':'● Meta 1'}</div>
                })()}
              </div>
            </div>
            <div style={{ display:'flex', gap:6, alignItems:'center' }}>
              <button onClick={toggleDarkMode} style={{ background:C.surface2, border:`1px solid ${C.border}`, borderRadius:8, padding:'6px 8px', color:C.text2, fontSize:14, cursor:'pointer' }}>{darkMode?'☀️':'🌙'}</button>
              <button onClick={()=>setShowTargets(true)} style={{ background:C.surface2, border:`1px solid ${C.border}`, borderRadius:8, padding:'6px 9px', color:C.text2, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>⚙ Metas</button>
            </div>
          </div>

          {/* User row */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10, padding:'5px 8px', background:C.bg, borderRadius:8 }}>
            <div style={{ display:'flex', alignItems:'center', gap:7 }}>
              {user?.photoURL&&<img src={user.photoURL} alt="" style={{ width:20, height:20, borderRadius:'50%' }}/>}
              <span style={{ fontSize:11, color:C.text2 }}>{user?.displayName||user?.email||'Usuário'}</span>
            </div>
            <button onClick={()=>logout()} style={{ background:'none', border:'none', color:C.text3, fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>Sair</button>
          </div>

          {/* Macro summary */}
          <div style={{ background:C.bg, borderRadius:14, padding:14 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:6 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:30, fontWeight:800, fontFamily:'JetBrains Mono,monospace', color:C.text }}>{r0(dayMacros.cal)}</span>
                <span style={{ fontSize:12, color:C.text2 }}>/ {activeTargets.cal} kcal</span>
                {hasData&&<span style={{ width:8, height:8, borderRadius:'50%', background:farolCal(dayMacros.cal,activeTargets), display:'inline-block' }}/>}
              </div>
              <span style={{ fontSize:11, fontFamily:'JetBrains Mono,monospace', color:over?C.red:inRange?C.teal:C.text2 }}>
                {calDiff>=0?`−${r0(calDiff)}`:`+${r0(-calDiff)}`} kcal
              </span>
            </div>
            <div style={{ background:C.surface2, borderRadius:4, height:8, overflow:'hidden', marginBottom:12 }}>
              <div style={{ height:'100%', width:calPct+'%', background:calBarColor, borderRadius:4, transition:'width .5s' }}/>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
              {[
                { label:'Proteína', val:dayMacros.prot, target:activeTargets.prot, color:C.teal, farol:hasData?farolProt(dayMacros.prot,activeTargets):null },
                { label:'Carb', val:dayMacros.carb, target:activeTargets.carb, color:C.gold2, farol:hasData?farolCarb(dayMacros.carb,activeTargets):null },
                { label:'Gordura', val:dayMacros.fat, target:activeTargets.fat, color:C.terra, farol:hasData?farolFat(dayMacros.fat,activeTargets):null },
              ].map(m => {
                const diff = r(m.val - m.target)
                return (
                  <div key={m.label} style={{ background:C.surface, borderRadius:10, padding:'8px 10px', position:'relative' }}>
                    {m.farol&&<span style={{ position:'absolute', top:8, right:8, width:7, height:7, borderRadius:'50%', background:m.farol }}/>}
                    <div style={{ fontSize:9, color:C.text2, fontFamily:'JetBrains Mono,monospace', textTransform:'uppercase', letterSpacing:1 }}>{m.label}</div>
                    <div style={{ fontSize:13, fontWeight:700, color:m.color, marginTop:3, fontFamily:'JetBrains Mono,monospace' }}>
                      {r(m.val)}<span style={{ fontSize:9, color:C.text2 }}>/{m.target}g</span>
                    </div>
                    {hasData&&<div style={{ fontSize:9, color:diff>0?C.red:diff<0?C.gold:C.teal, fontFamily:'JetBrains Mono,monospace', marginTop:2 }}>{diff>0?`+${diff}g`:diff<0?`${diff}g`:'✓'}</div>}
                    <div style={{ background:C.surface2, borderRadius:3, height:4, marginTop:4, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:Math.min(100,(m.val/m.target)*100)+'%', background:m.color, transition:'width .4s' }}/>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Nav tabs (oculto no mobile — usa bottom nav) */}
          {!isMobile && <div style={{ display:'flex', marginTop:14, overflowX:'auto' }}>
            {[{id:'overview',label:'Visão Geral',icon:'📊'},{id:'today',label:'Hoje',icon:'🏠'},{id:'treino',label:'Treino',icon:'💪'},{id:'peso',label:'Peso',icon:'⚖️'},{id:'saude',label:'Saúde',icon:'❤️'},{id:'history',label:'Histórico',icon:'📅'},{id:'analysis',label:'Análise',icon:'📊'},{id:'foods',label:'Alimentos',icon:'🥗'}].map(t=>(
              <button key={t.id} onClick={()=>{ setTab(t.id); setEditingDay(null); setAddingFood(false); setSearch(''); setRegisterMode(false); setAvulso(false) }}
                style={{ flex:1, minWidth:52, padding:'8px 0', border:'none', background:'transparent', color:tab===t.id?C.text:C.text2, fontWeight:tab===t.id?700:500, fontSize:10, cursor:'pointer', fontFamily:'inherit', borderBottom:`2px solid ${tab===t.id?C.gold:'transparent'}`, transition:'all .2s', display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                <span style={{ fontSize:16 }}>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>}
        </div>}

        {/* ── CONTENT ── */}
        <div style={{ flex:1, padding:isWide?'24px 24px 100px':(isMobile?'12px 12px 84px':'16px 16px 100px'), overflowY:'auto', background:isMobile?T.appBackground:C.bg }}>
          {tab==='overview'&&!editingDay&&(
            <VisaoGeral
              T={T}
              isWide={isWide}
              isMobile={isMobile}
              userName={user?.displayName?.split(' ')[0]}
              weekLabel={overviewWeekLabel}
              isCurrentWeekFlag={overviewIsCurrent}
              isPartial={overviewPartial}
              onPrevWeek={()=>setOverviewWeekOffset(o=>o+1)}
              onNextWeek={()=>setOverviewWeekOffset(o=>Math.max(0,o-1))}
              onResetWeek={()=>setOverviewWeekOffset(0)}
              kpis={overviewKpis}
              prevKpis={overviewPrevKpis}
              targets={targets}
              weightSeries={overviewWeightSeries}
              prevWeightMean={overviewPrevWeightSeries.mean}
              caloriesData={overviewCaloriesData}
              comparison={overviewComparison}
              onOpenPeso={()=>{ setTab('peso'); setEditingDay(null) }}
              onOpenDay={(dateKey)=>{ setEditingDay(dateKey); setTab('today'); setActiveMeal('cafe_manha') }}
              bodyWeeks={overviewBodyWeeks}
              healthSteps={ovSteps}
              healthSleep={ovSleep}
              healthScore={ovScore}
              healthPrevMeans={overviewHealthPrevMeans}
              training={overviewTraining}
              prevVolume={overviewPrevVolume}
              insights={overviewInsights}
              onOpenSaude={()=>{ setTab('saude'); setEditingDay(null) }}
              onOpenTreino={()=>{ setTab('treino'); setEditingDay(null) }}
              onInsightAction={(a)=>{ setTab(a); setEditingDay(null) }}
            />
          )}
          {(tab==='today'||editingDay)&&renderDayEditor()}
          {tab==='treino'&&!editingDay&&renderTreino()}
          {tab==='peso'&&!editingDay&&renderPeso()}
          {tab==='saude'&&!editingDay&&renderSaude()}
          {tab==='history'&&!editingDay&&renderHistory()}
          {tab==='analysis'&&!editingDay&&renderAnalysis()}
          {tab==='foods'&&!editingDay&&renderFoods()}
        </div>
      </div>
      </div>

      {showTargets&&<TargetsModal targets={targets} targetsHistory={targetsHistory} C={C} onSave={(nt,nth)=>{ updateTargets(nt,nth); setShowTargets(false) }} onClose={()=>setShowTargets(false)}/>}
      {showWeightModal&&<WeightModal C={C} onSave={(date,val)=>{ saveWeight(date,val); setShowWeightModal(false) }} onClose={()=>setShowWeightModal(false)}/>}
      {showRelaxFitModal&&<RelaxFitModal C={C} onSave={(date,data)=>{
        saveWeightAndBody(date, data)
        setShowRelaxFitModal(false)
      }} onClose={()=>setShowRelaxFitModal(false)}/>}
      {showHealthImport&&<HealthImportModal C={C} healthData={healthData} onSave={(hd)=>{
        updateHealthData(hd)
        setShowHealthImport(false)
      }} onClose={()=>setShowHealthImport(false)}/>}
      {showHealthManual&&<HealthManualModal C={C} healthData={healthData} initialDate={healthEditDate} onSave={(hd)=>{
        updateHealthData(hd)
        setShowHealthManual(false)
        setHealthEditDate(null)
      }} onClose={()=>{ setShowHealthManual(false); setHealthEditDate(null) }}/>}
      {editingExercise&&(editingExercise.mode==='create'||editingExercise.mode==='view')&&<ExerciseModal
        C={C}
        mode={editingExercise.mode}
        exercise={editingExercise.exercise}
        isEdited={editingExercise.exercise ? !!customExercises.find(c=>c.id===editingExercise.exercise.id) : false}
        onSave={(ex)=>{
          const existing = customExercises.find(c=>c.id===ex.id)
          if (existing) updateCustomExercises(customExercises.map(c=>c.id===ex.id?ex:c))
          else updateCustomExercises([...customExercises, ex])
          setEditingExercise(null)
        }}
        onDelete={(id)=>{ updateCustomExercises(customExercises.filter(c=>c.id!==id)); setEditingExercise(null) }}
        onClose={()=>setEditingExercise(null)}
      />}

      {/* Navegação mobile (bottom nav + bottom sheet "Mais") */}
      {isMobile && (
        <BottomNav
          tab={tab}
          setTab={navReset}
          onOpenMore={()=>setShowMoreSheet(true)}
          moreActive={showMoreSheet || ['saude','history','analysis','foods'].includes(tab)}
          T={T}
        />
      )}
      {isMobile && (
        <MoreSheet
          open={showMoreSheet}
          onClose={()=>setShowMoreSheet(false)}
          setTab={navReset}
          onOpenMetas={()=>setShowTargets(true)}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          user={user}
          onLogout={logout}
          T={T}
        />
      )}
    </div>
  )

  // ── DAY EDITOR ──────────────────────────────────────────────────────────────
  function renderDayEditor() {
    const meal = MEALS.find(m=>m.id===activeMeal)
    const items = currentDay.meals[activeMeal]||[]
    const mealMacros = calcMacros(items, allFoods)
    const favFoods = allFoods.filter(f=>f.fav&&f.fav.includes(activeMeal))
    const otherFoods = allFoods.filter(f=>!f.fav||!f.fav.includes(activeMeal))
    const filtered = search ? allFoods.filter(f=>f.name.toLowerCase().includes(search.toLowerCase())) : null
    return (
      <div>
        {isEditing&&<button onClick={()=>{ setEditingDay(null); setTab('history') }} style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', color:C.text2, fontSize:13, cursor:'pointer', fontFamily:'inherit', padding:0, marginBottom:14 }}>← Voltar</button>}
        {/* Meal pills */}
        <div style={{ display:'flex', gap:6, marginBottom:16, overflowX:'auto', paddingBottom:4 }}>
          {MEALS.map(m=>{
            const mac=calcMacros(currentDay.meals[m.id]||[],allFoods)
            const active=activeMeal===m.id
            return <button key={m.id} onClick={()=>{ setActiveMeal(m.id); setAddingFood(false); setSearch(''); setAvulso(false) }}
              style={{ flexShrink:0, minWidth:68, padding:'8px 6px', border:`2px solid ${active?m.color:C.border}`, borderRadius:12, background:active?m.color+'18':C.surface, cursor:'pointer', textAlign:'center', fontFamily:'inherit' }}>
              <div style={{ fontSize:16 }}>{m.icon}</div>
              <div style={{ fontSize:9, fontWeight:700, marginTop:2, color:active?m.color:C.text2 }}>{m.short}</div>
              <div style={{ fontSize:10, color:C.text3, fontFamily:'JetBrains Mono,monospace' }}>{r0(mac.cal)}</div>
            </button>
          })}
        </div>
        {/* Meal header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div style={{ fontSize:15, fontWeight:700, color:meal.color }}>{meal.icon} {meal.label}</div>
          <div style={{ fontSize:10, color:C.text2, fontFamily:'JetBrains Mono,monospace' }}>{r0(mealMacros.cal)} kcal · P:{r(mealMacros.prot)} · C:{r(mealMacros.carb)} · G:{r(mealMacros.fat)}</div>
        </div>
        {/* Food items */}
        {items.length===0&&!addingFood&&<div style={{ textAlign:'center', padding:'20px 0', color:C.text3, fontSize:13 }}>Nenhum alimento registrado</div>}
        {items.map((it,idx)=>{
          // Avulso item
          if (it.avulso) return (
            <div key={idx} style={{ background:C.surface, borderRadius:12, padding:'10px 12px', marginBottom:7, display:'flex', alignItems:'center', gap:8, border:`1px solid ${C.gold}30` }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ fontSize:10, background:`${C.gold}20`, color:C.gold, padding:'1px 6px', borderRadius:8, fontWeight:700, flexShrink:0 }}>avulso</span>
                  <div style={{ fontSize:13, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{it.name}</div>
                </div>
                <div style={{ fontSize:11, color:C.text2, fontFamily:'JetBrains Mono,monospace', marginTop:2 }}>{r0(it.cal)} kcal · P:{r(it.prot)}g · C:{r(it.carb)}g · G:{r(it.fat)}g</div>
              </div>
              <button onClick={()=>removeFood(activeMeal,idx)} style={{ background:`${C.red}20`, border:'none', borderRadius:8, width:28, height:28, color:C.red, cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>×</button>
            </div>
          )
          // Regular item
          const f = allFoods.find(x=>x.id===it.id)
          if (!f) return null
          const fixed = ['unid','dose','porção'].includes(f.unit)
          const m = fixed ? it.qty : it.qty/100
          return (
            <div key={idx} style={{ background:C.surface, borderRadius:12, padding:'10px 12px', marginBottom:7, display:'flex', alignItems:'center', gap:8, border:`0.5px solid ${C.border}` }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', color:C.text }}>{f.name}</div>
                <div style={{ fontSize:11, color:C.text2, fontFamily:'JetBrains Mono,monospace', marginTop:2 }}>{r0(f.cal*m)} kcal · P:{r(f.prot*m)}g · C:{r(f.carb*m)}g · G:{r(f.fat*m)}g</div>
              </div>
              <input type="number" value={it.qty} onChange={e=>updateQty(activeMeal,idx,e.target.value)}
                style={{ width:52, textAlign:'center', fontFamily:'JetBrains Mono,monospace', fontSize:12, padding:'5px 4px', border:`0.5px solid ${C.border}`, borderRadius:8, background:C.surface2, color:C.text }}/>
              <span style={{ fontSize:10, color:C.text2, minWidth:26 }}>{f.unit}</span>
              <button onClick={()=>removeFood(activeMeal,idx)} style={{ background:`${C.red}20`, border:'none', borderRadius:8, width:28, height:28, color:C.red, cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>×</button>
            </div>
          )
        })}
        {/* Add food */}
        {!addingFood
          ? <div style={{ marginTop:4 }}>
              {allFoods.filter(f=>f.fav&&f.fav.includes(activeMeal)).length>0 && (
                <button onClick={addFavoriteMeal} style={{ width:'100%', padding:12, border:'none', borderRadius:12, background:`linear-gradient(135deg,${C.gold},${C.gold2})`, color:C.btnText, fontSize:13, cursor:'pointer', fontFamily:'inherit', fontWeight:700, marginBottom:8, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                  ⭐ Add refeição favorita ({allFoods.filter(f=>f.fav&&f.fav.includes(activeMeal)).length} itens)
                </button>
              )}
              <button onClick={()=>setAddingFood(true)} style={{ width:'100%', padding:12, border:`1.5px dashed ${C.border}`, borderRadius:12, background:'transparent', color:C.text2, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>+ Adicionar alimento</button>
            </div>
          : <div style={{ background:C.surface, borderRadius:14, padding:14, border:`0.5px solid ${C.border}`, marginTop:8 }}>
              <div style={{ display:'flex', gap:8, marginBottom:10 }}>
                <input autoFocus value={search} onChange={e=>{ setSearch(e.target.value); setAvulso(false) }} placeholder="Buscar alimento..."
                  style={{ flex:1, background:C.surface2, border:`0.5px solid ${C.border}`, borderRadius:10, padding:'10px 12px', color:C.text, fontSize:14, fontFamily:'inherit' }}/>
                <button onClick={()=>{ setAddingFood(false); setSearch(''); setAvulso(false) }} style={{ background:C.surface2, border:'none', borderRadius:10, padding:'0 12px', color:C.text2, cursor:'pointer', fontSize:18 }}>✕</button>
              </div>
              {/* Avulso button */}
              {!avulso&&<button onClick={()=>{ setAvulso(true); setSearch('') }}
                style={{ width:'100%', padding:'9px', border:`1px dashed ${C.gold}60`, borderRadius:10, background:`${C.gold}08`, color:C.gold, fontSize:12, cursor:'pointer', fontFamily:'inherit', fontWeight:600, marginBottom:10, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                ⚡ Entrada avulsa (evento, estimativa...)
              </button>}
              {/* Avulso form */}
              {avulso&&<div style={{ background:C.surface2, borderRadius:12, padding:12, marginBottom:10, border:`1px solid ${C.gold}40` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                  <span style={{ fontSize:12, fontWeight:700, color:C.gold }}>⚡ Entrada avulsa</span>
                  <button onClick={()=>setAvulso(false)} style={{ background:'none', border:'none', color:C.text2, cursor:'pointer', fontSize:16 }}>×</button>
                </div>
                <input placeholder="Nome (ex: Churrasco, Evento...)" value={avulsoData.name} onChange={e=>setAvulsoData(p=>({...p,name:e.target.value}))}
                  style={{ width:'100%', background:C.surface, border:`0.5px solid ${C.border}`, borderRadius:8, padding:'8px 10px', color:C.text, fontSize:13, fontFamily:'inherit', marginBottom:8 }}/>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:10 }}>
                  {[{key:'cal',label:'Kcal',color:C.gold},{key:'prot',label:'Proteína (g)',color:C.teal},{key:'carb',label:'Carb (g)',color:C.gold2},{key:'fat',label:'Gordura (g)',color:C.terra}].map(f=>(
                    <div key={f.key}>
                      <div style={{ fontSize:10, color:f.color, marginBottom:3, fontFamily:'JetBrains Mono,monospace' }}>{f.label}</div>
                      <input type="number" placeholder="0" value={avulsoData[f.key]} onChange={e=>setAvulsoData(p=>({...p,[f.key]:e.target.value}))}
                        style={{ width:'100%', background:C.surface, border:`0.5px solid ${C.border}`, borderRadius:8, padding:'7px 8px', color:C.text, fontSize:13, fontFamily:'JetBrains Mono,monospace' }}/>
                    </div>
                  ))}
                </div>
                <button onClick={()=>{
                  if (!avulsoData.name&&!avulsoData.cal) return
                  const day=getDay(activeKey)
                  const item={ id:'avulso_'+Date.now(), qty:1, avulso:true, name:avulsoData.name||'Entrada avulsa', cal:parseFloat(avulsoData.cal)||0, prot:parseFloat(avulsoData.prot)||0, carb:parseFloat(avulsoData.carb)||0, fat:parseFloat(avulsoData.fat)||0 }
                  updateDays({...days,[activeKey]:{...day,meals:{...day.meals,[activeMeal]:[...(day.meals[activeMeal]||[]),item]}}})
                  setAvulsoData({name:'',cal:'',prot:'',carb:'',fat:''}); setAvulso(false); setAddingFood(false)
                }} style={{ width:'100%', padding:'10px', background:`linear-gradient(135deg,${C.gold},${C.gold2})`, border:'none', borderRadius:10, color:C.btnText, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                  Adicionar à refeição
                </button>
              </div>}
              {/* Food list */}
              {!avulso&&<div style={{ maxHeight:280, overflowY:'auto' }}>
                {!search&&favFoods.length>0&&(<>
                  <div style={{ fontSize:10, fontWeight:700, color:C.text2, textTransform:'uppercase', letterSpacing:1, margin:'4px 0 8px', fontFamily:'JetBrains Mono,monospace' }}>⭐ Favoritos</div>
                  {favFoods.map(f=><FoodRow key={f.id} food={f} onAdd={addFoodToMeal} mealId={activeMeal} C={C} onToggleFav={toggleMealFav}/>)}
                  <div style={{ fontSize:10, fontWeight:700, color:C.text2, textTransform:'uppercase', letterSpacing:1, margin:'12px 0 8px', fontFamily:'JetBrains Mono,monospace' }}>Todos</div>
                  {otherFoods.map(f=><FoodRow key={f.id} food={f} onAdd={addFoodToMeal} mealId={activeMeal} C={C} onToggleFav={toggleMealFav}/>)}
                </>)}
                {!search&&favFoods.length===0&&allFoods.map(f=><FoodRow key={f.id} food={f} onAdd={addFoodToMeal} mealId={activeMeal} C={C} onToggleFav={toggleMealFav}/>)}
                {search&&(filtered.length>0?filtered.map(f=><FoodRow key={f.id} food={f} onAdd={addFoodToMeal} mealId={activeMeal} C={C} onToggleFav={toggleMealFav}/>):<div style={{ padding:'20px', textAlign:'center', color:C.text3, fontSize:13 }}>Nenhum resultado</div>)}
              </div>}
            </div>
        }
        {/* Activities */}
        <div style={{ marginTop:16, background:C.surface, borderRadius:14, padding:14, border:`0.5px solid ${C.border}` }}>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:10, color:C.gold }}>💪 Atividades do dia</div>
          {(currentDay.activities||[]).length===0&&<div style={{ fontSize:12, color:C.text3, marginBottom:10 }}>Nenhuma atividade registrada</div>}
          {(currentDay.activities||[]).length>0&&<div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 }}>
            {(currentDay.activities||[]).map(actId=>{
              const act=ACTIVITIES.find(a=>a.id===actId); if(!act) return null
              return <div key={actId} style={{ display:'flex', alignItems:'center', gap:5, background:act.color+'20', border:`1px solid ${act.color}40`, borderRadius:20, padding:'5px 10px' }}>
                <span style={{ fontSize:13 }}>{act.icon}</span>
                <span style={{ fontSize:11, color:act.color, fontWeight:600 }}>{act.label}</span>
                <button onClick={()=>removeActivityFromDay(actId)} style={{ background:'none', border:'none', color:act.color, cursor:'pointer', fontSize:14, padding:0 }}>×</button>
              </div>
            })}
          </div>}
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {ACTIVITIES.map(act=>{
              const done=(currentDay.activities||[]).includes(act.id)
              return <button key={act.id} onClick={()=>addActivityToDay(act.id)} disabled={done}
                style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', border:`1px solid ${done?act.color:C.border}`, borderRadius:20, background:done?act.color+'20':'transparent', cursor:done?'default':'pointer', fontFamily:'inherit' }}>
                <span style={{ fontSize:12 }}>{act.icon}</span>
                <span style={{ fontSize:10, color:done?act.color:C.text2, fontWeight:done?700:400 }}>{act.label}</span>
              </button>
            })}
          </div>
        </div>
      </div>
    )
  }

  // ── HISTORY ─────────────────────────────────────────────────────────────────
  function renderHistory() {
    const entries = Object.entries(days).sort(([a],[b])=>b.localeCompare(a)).slice(0,90)
    return (
      <div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <div style={{ fontSize:11, color:C.text2 }}>{entries.length} dias registrados</div>
          <button onClick={()=>{
            const input=document.createElement('input'); input.type='date'; input.max=todayKey(); input.value=todayKey()
            input.style.cssText='position:fixed;opacity:0;top:50%;left:50%'; document.body.appendChild(input); input.showPicker?.()
            input.addEventListener('change',e=>{ const chosen=e.target.value; if(chosen){ if(!days[chosen]) updateDays({...days,[chosen]:emptyDay()}); setEditingDay(chosen); setActiveMeal('cafe_manha'); setAddingFood(false); setSearch('') }; try{document.body.removeChild(input)}catch(e){} })
            input.addEventListener('blur',()=>{ try{document.body.removeChild(input)}catch(e){} })
          }} style={{ background:`linear-gradient(135deg,${C.gold},${C.gold2})`, border:'none', borderRadius:10, padding:'6px 12px', color:C.btnText, fontSize:11, cursor:'pointer', fontFamily:'inherit', fontWeight:700 }}>+ Dia anterior</button>
        </div>
        {entries.length===0&&<div style={{ textAlign:'center', padding:'32px 0', color:C.text3, fontSize:13 }}>
          <div style={{ fontSize:32, marginBottom:8 }}>📅</div>Nenhum dia registrado ainda.
        </div>}
        {entries.map(([day,data])=>{
          const isTod=day===today
          const all=Object.values(data.meals||{}).flat()
          const mac=calcMacros(all,allFoods)
          const t=getTargetsForDate(targets,targetsHistory,day)
          const ov=mac.cal>t.max, ok=mac.cal>=t.min&&mac.cal<=t.max
          const col=ov?C.red:ok?C.teal:C.gold
          const lbl=ov?'Excesso':ok?'✓ Na meta':'Abaixo'
          const acts=data.activities||[]
          return (
            <div key={day} onClick={()=>{ setEditingDay(day); setActiveMeal('cafe_manha'); setAddingFood(false); setSearch('') }}
              style={{ background:C.surface, borderRadius:12, padding:'12px 14px', marginBottom:8, border:`0.5px solid ${C.border}`, cursor:'pointer' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:7 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ fontSize:14, fontWeight:600, color:C.text }}>{formatDateFull(day)}</div>
                  {isTod&&<span style={{ fontSize:10, background:`${C.gold}20`, color:C.gold, padding:'1px 7px', borderRadius:10 }}>hoje</span>}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  {acts.length>0&&<span style={{ fontSize:11 }}>{acts.slice(0,2).map(id=>ACTIVITIES.find(a=>a.id===id)?.icon||'').join('')}</span>}
                  <span style={{ fontSize:11, fontWeight:700, color:col, fontFamily:'JetBrains Mono,monospace' }}>{lbl}</span>
                  <button onClick={(e)=>{ e.stopPropagation(); if(window.confirm(`Excluir o dia ${formatDateFull(day)}? Esta ação remove todos os registros deste dia.`)){ const nd={...days}; delete nd[day]; updateDays(nd) } }}
                    style={{ background:`${C.red}18`, border:'none', borderRadius:8, width:26, height:26, color:C.red, cursor:'pointer', fontSize:15, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
                </div>
              </div>
              <div style={{ background:C.surface2, borderRadius:4, height:6, marginBottom:7, overflow:'hidden' }}>
                <div style={{ height:'100%', width:Math.min(110,(mac.cal/t.cal)*100)+'%', background:col, borderRadius:4 }}/>
              </div>
              <div style={{ display:'flex', gap:12, fontSize:11, fontFamily:'JetBrains Mono,monospace' }}>
                <span style={{ fontWeight:700, color:C.text }}>{r0(mac.cal)} kcal</span>
                <span style={{ color:C.teal }}>P:{r(mac.prot)}g</span>
                <span style={{ color:C.gold2 }}>C:{r(mac.carb)}g</span>
                <span style={{ color:C.terra }}>G:{r(mac.fat)}g</span>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // ── TREINO ──────────────────────────────────────────────────────────────────
  // ── TREINO ROUTER ──
  function renderTreino() {
    if (liveSession) return renderLive()
    return (
      <div>
        {/* Sub-navegação */}
        <div style={{ display:'flex', gap:6, marginBottom:16, overflowX:'auto' }}>
          {[
            { id:'resumo', label:'📊 Resumo' },
            { id:'fichas', label:'📋 Fichas' },
            { id:'evolucao', label:'📈 Evolução' },
            { id:'exercicios', label:'🏋️ Exercícios' },
          ].map(v => (
            <button key={v.id} onClick={()=>{ setTreinoView(v.id); setActivePlanId(null); setEditingExercise(null) }}
              style={{ flex:isWide?'0 0 auto':1, minWidth:100, padding:'9px 14px', border:'none', borderRadius:10, fontSize:12, fontWeight:treinoView===v.id?700:400, cursor:'pointer', fontFamily:'inherit',
                background: treinoView===v.id ? `linear-gradient(135deg,${C.gold},${C.gold2})` : C.surface2,
                color: treinoView===v.id ? C.btnText : C.text2 }}>
              {v.label}
            </button>
          ))}
        </div>

        {treinoView==='resumo' && renderTreinoResumo()}
        {treinoView==='fichas' && !activePlanId && renderFichas()}
        {treinoView==='fichas' && activePlanId && renderFichaEditor()}
        {treinoView==='evolucao' && renderEvolucao()}
        {treinoView==='exercicios' && renderExerciciosLib()}
      </div>
    )
  }

  // ── FICHAS (lista) ──
  function renderFichas() {
    // Build history of which plan was trained on each date (most recent first)
    const planHistory = []
    Object.entries(workoutLogs).sort(([a],[b])=>b.localeCompare(a)).forEach(([date, logs]) => {
      const arr = Array.isArray(logs) ? logs : [logs]
      arr.forEach(log => { if (log.planId) planHistory.push({ date, planId:log.planId, planName:log.planName }) })
    })
    const lastTrained = planHistory[0] || null
    // Suggest next plan: the one trained longest ago (or never), following rotation
    const suggestNext = (() => {
      if (workoutPlans.length === 0) return null
      // For each plan, find its last trained date
      const lastByPlan = {}
      planHistory.forEach(h => { if (!lastByPlan[h.planId]) lastByPlan[h.planId] = h.date })
      // Plan never trained comes first, else the oldest
      const sorted = [...workoutPlans].sort((a,b) => {
        const da = lastByPlan[a.id] || '0000-00-00'
        const db = lastByPlan[b.id] || '0000-00-00'
        return da.localeCompare(db)
      })
      return sorted[0]
    })()

    return (
      <div>
        {/* Última ficha treinada + sugestão */}
        {lastTrained && (() => {
          const lastPlan = workoutPlans.find(p=>p.id===lastTrained.planId)
          return (
            <div style={{ background:C.surface, borderRadius:14, padding:14, marginBottom:14, border:`0.5px solid ${C.border}` }}>
              <div style={{ display:'flex', gap:12, alignItems:'stretch' }}>
                <div style={{ flex:1, background:C.bg, borderRadius:10, padding:'10px 12px' }}>
                  <div style={{ fontSize:9, color:C.text2, marginBottom:4, fontFamily:'JetBrains Mono,monospace', textTransform:'uppercase', letterSpacing:1 }}>Última treinada</div>
                  <div style={{ fontSize:15, fontWeight:800, color:C.text }}>{lastPlan?.name || lastTrained.planName || '—'}</div>
                  <div style={{ fontSize:10, color:C.text3, marginTop:2, fontFamily:'JetBrains Mono,monospace' }}>{formatDateFull(lastTrained.date)}</div>
                </div>
                {suggestNext && (
                  <div style={{ flex:1, background:`${C.teal}12`, borderRadius:10, padding:'10px 12px', border:`1px solid ${C.teal}40` }}>
                    <div style={{ fontSize:9, color:C.teal, marginBottom:4, fontFamily:'JetBrains Mono,monospace', textTransform:'uppercase', letterSpacing:1 }}>Sugestão de hoje</div>
                    <div style={{ fontSize:15, fontWeight:800, color:C.text }}>{suggestNext.name}</div>
                    <button onClick={()=>{
                      if (suggestNext.exercises.length === 0) { alert('Adicione exercícios à ficha primeiro!'); return }
                      const session = {
                        planId: suggestNext.id, startTime: Date.now(),
                        exercises: suggestNext.exercises.map(ex => ({ exerciseId:ex.exerciseId, targetSets:ex.targetSets||3, targetReps:ex.targetReps||'10', restSeconds:ex.restSeconds||90, sets:[], skipped:false })),
                        currentIdx: 0,
                      }
                      setLiveSession(session)
                    }} style={{ marginTop:6, background:`linear-gradient(135deg,${C.teal},#0ea5a5)`, border:'none', borderRadius:8, padding:'6px 12px', color:'#fff', fontSize:11, cursor:'pointer', fontFamily:'inherit', fontWeight:700 }}>▶ Iniciar esta</button>
                  </div>
                )}
              </div>
            </div>
          )
        })()}

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <div style={{ fontSize:15, fontWeight:700, color:C.text }}>Minhas Fichas</div>
          <button onClick={()=>{
            const id = 'plan_' + Date.now()
            const newPlan = { id, name:'Nova Ficha', exercises:[] }
            updateWorkoutPlans([...workoutPlans, newPlan])
            setActivePlanId(id)
          }} style={{ background:`linear-gradient(135deg,${C.gold},${C.gold2})`, border:'none', borderRadius:10, padding:'8px 14px', color:C.btnText, fontSize:12, cursor:'pointer', fontFamily:'inherit', fontWeight:700 }}>+ Nova Ficha</button>
        </div>

        {workoutPlans.length === 0 && (
          <div style={{ textAlign:'center', padding:'40px 20px', color:C.text3 }}>
            <div style={{ fontSize:36, marginBottom:12 }}>📋</div>
            <div style={{ fontSize:14, marginBottom:6, color:C.text2 }}>Nenhuma ficha ainda</div>
            <div style={{ fontSize:12 }}>Crie sua primeira ficha de treino (A, B, C...)</div>
          </div>
        )}

        <div style={isWide?{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }:{}}>
        {workoutPlans.map(plan => {
          // Muscle summary for this plan
          const muscles = {}
          plan.exercises.forEach(ex => {
            const e = getExercise(ex.exerciseId)
            if (e) muscles[e.primary] = (muscles[e.primary]||0) + 1
          })
          const planLast = planHistory.find(h => h.planId === plan.id)
          const topMuscles = Object.entries(muscles).sort((a,b)=>b[1]-a[1]).slice(0,3)
          return (
            <div key={plan.id} style={{ background:C.surface, borderRadius:14, padding:14, marginBottom:isWide?0:10, border:`0.5px solid ${C.border}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                <div onClick={()=>setActivePlanId(plan.id)} style={{ flex:1, cursor:'pointer' }}>
                  <div style={{ fontSize:15, fontWeight:700, color:C.text }}>{plan.name}</div>
                  <div style={{ fontSize:11, color:C.text2, marginTop:2 }}>{plan.exercises.length} exercício(s)</div>
                  {planLast ? <div style={{ fontSize:10, color:C.teal, marginTop:2, fontFamily:'JetBrains Mono,monospace' }}>última: {formatDateFull(planLast.date)}</div> : <div style={{ fontSize:10, color:C.text3, marginTop:2, fontFamily:'JetBrains Mono,monospace' }}>nunca treinada</div>}
                </div>
              </div>
              {topMuscles.length > 0 && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:12 }}>
                  {topMuscles.map(([mid, count]) => {
                    const m = getMuscle(mid)
                    return <span key={mid} style={{ fontSize:9, padding:'2px 8px', borderRadius:10, background:`${m?.color||C.gold}20`, color:m?.color||C.gold, fontWeight:600 }}>{m?.label||mid} ({count})</span>
                  })}
                </div>
              )}
              <div style={{ display:'flex', gap:6 }}>
                <button onClick={()=>{
                  if (plan.exercises.length === 0) { alert('Adicione exercícios à ficha primeiro!'); return }
                  const session = {
                    planId: plan.id,
                    startTime: Date.now(),
                    exercises: plan.exercises.map(ex => ({
                      exerciseId: ex.exerciseId,
                      targetSets: ex.targetSets || 3,
                      targetReps: ex.targetReps || '10',
                      restSeconds: ex.restSeconds || 90,
                      sets: [],
                      skipped: false,
                    })),
                    currentIdx: 0,
                  }
                  setLiveSession(session)
                }} style={{ flex:1, background:`linear-gradient(135deg,${C.teal},#0ea5a5)`, border:'none', borderRadius:10, padding:'9px', color:'#fff', fontSize:12, cursor:'pointer', fontFamily:'inherit', fontWeight:700 }}>▶ Iniciar</button>
                <button onClick={()=>setActivePlanId(plan.id)} style={{ background:C.surface2, border:`1px solid ${C.border}`, borderRadius:10, padding:'9px 12px', color:C.text2, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>✎</button>
                <button onClick={()=>{ if(window.confirm(`Excluir ficha "${plan.name}"?`)) updateWorkoutPlans(workoutPlans.filter(p=>p.id!==plan.id)) }} style={{ background:`${C.red}18`, border:'none', borderRadius:10, padding:'9px 12px', color:C.red, fontSize:14, cursor:'pointer' }}>×</button>
              </div>
            </div>
          )
        })}
        </div>
      </div>
    )
  }

  // ── EDITOR DE FICHA ──
  function renderFichaEditor() {
    const plan = workoutPlans.find(p => p.id === activePlanId)
    if (!plan) { setActivePlanId(null); return null }
    const updatePlan = (updated) => updateWorkoutPlans(workoutPlans.map(p => p.id === plan.id ? updated : p))

    return (
      <div>
        <button onClick={()=>setActivePlanId(null)} style={{ background:'none', border:'none', color:C.gold, fontSize:13, cursor:'pointer', fontFamily:'inherit', marginBottom:12, padding:0 }}>‹ Voltar às fichas</button>

        <input value={plan.name} onChange={e=>updatePlan({ ...plan, name:e.target.value })}
          style={{ width:'100%', background:C.surface, border:`0.5px solid ${C.border}`, borderRadius:10, padding:'12px 14px', color:C.text, fontSize:16, fontWeight:700, fontFamily:'inherit', marginBottom:14 }}/>

        {plan.exercises.map((ex, idx) => {
          const e = getExercise(ex.exerciseId)
          if (!e) return null
          const eq = getEquipment(e.equipment)
          const pm = getMuscle(e.primary)
          return (
            <div key={idx} style={{ background:C.surface, borderRadius:12, padding:12, marginBottom:8, border:`0.5px solid ${C.border}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{e.name}</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginTop:4 }}>
                    <span style={{ fontSize:9, padding:'2px 7px', borderRadius:8, background:C.surface2, color:C.text2 }}>{eq?.icon} {eq?.label}</span>
                    <span style={{ fontSize:9, padding:'2px 7px', borderRadius:8, background:`${pm?.color||C.gold}20`, color:pm?.color||C.gold, fontWeight:600 }}>{pm?.label}</span>
                    {(e.secondary||[]).map(sid => { const sm=getMuscle(sid); return <span key={sid} style={{ fontSize:9, padding:'2px 7px', borderRadius:8, background:C.surface2, color:C.text3 }}>{sm?.label}</span> })}
                  </div>
                </div>
                <div style={{ display:'flex', gap:4 }}>
                  {idx>0 && <button onClick={()=>{ const arr=[...plan.exercises]; [arr[idx-1],arr[idx]]=[arr[idx],arr[idx-1]]; updatePlan({...plan,exercises:arr}) }} style={{ background:C.surface2, border:'none', borderRadius:6, width:26, height:26, color:C.text2, cursor:'pointer', fontSize:12 }}>↑</button>}
                  {idx<plan.exercises.length-1 && <button onClick={()=>{ const arr=[...plan.exercises]; [arr[idx+1],arr[idx]]=[arr[idx],arr[idx+1]]; updatePlan({...plan,exercises:arr}) }} style={{ background:C.surface2, border:'none', borderRadius:6, width:26, height:26, color:C.text2, cursor:'pointer', fontSize:12 }}>↓</button>}
                  <button onClick={()=>updatePlan({ ...plan, exercises:plan.exercises.filter((_,i)=>i!==idx) })} style={{ background:`${C.red}18`, border:'none', borderRadius:6, width:26, height:26, color:C.red, cursor:'pointer', fontSize:14 }}>×</button>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6 }}>
                <div>
                  <div style={{ fontSize:9, color:C.text2, marginBottom:3 }}>Séries</div>
                  <input type="number" value={ex.targetSets||''} onChange={ev=>{ const arr=[...plan.exercises]; arr[idx]={...ex,targetSets:parseInt(ev.target.value)||0}; updatePlan({...plan,exercises:arr}) }} placeholder="4" style={{ width:'100%', background:C.surface2, border:`0.5px solid ${C.border}`, borderRadius:6, padding:'6px 8px', color:C.text, fontSize:13, fontFamily:'JetBrains Mono,monospace' }}/>
                </div>
                <div>
                  <div style={{ fontSize:9, color:C.text2, marginBottom:3 }}>Reps</div>
                  <input value={ex.targetReps||''} onChange={ev=>{ const arr=[...plan.exercises]; arr[idx]={...ex,targetReps:ev.target.value}; updatePlan({...plan,exercises:arr}) }} placeholder="8-12" style={{ width:'100%', background:C.surface2, border:`0.5px solid ${C.border}`, borderRadius:6, padding:'6px 8px', color:C.text, fontSize:13, fontFamily:'JetBrains Mono,monospace' }}/>
                </div>
                <div>
                  <div style={{ fontSize:9, color:C.text2, marginBottom:3 }}>Descanso(s)</div>
                  <input type="number" value={ex.restSeconds||''} onChange={ev=>{ const arr=[...plan.exercises]; arr[idx]={...ex,restSeconds:parseInt(ev.target.value)||0}; updatePlan({...plan,exercises:arr}) }} placeholder="90" style={{ width:'100%', background:C.surface2, border:`0.5px solid ${C.border}`, borderRadius:6, padding:'6px 8px', color:C.text, fontSize:13, fontFamily:'JetBrains Mono,monospace' }}/>
                </div>
              </div>
            </div>
          )
        })}

        <button onClick={()=>{ setEditingExercise({ mode:'addToPlan', planId:plan.id }); setTreinoView('exercicios') }}
          style={{ width:'100%', padding:12, border:`1.5px dashed ${C.gold}60`, borderRadius:12, background:`${C.gold}08`, color:C.gold, fontSize:13, cursor:'pointer', fontFamily:'inherit', fontWeight:600, marginTop:4 }}>
          + Adicionar exercício
        </button>
      </div>
    )
  }

  // ── BIBLIOTECA DE EXERCÍCIOS ──
  function renderExerciciosLib() {
    const addingToPlan = editingExercise?.mode === 'addToPlan'
    const grouped = {}
    allExercises.forEach(e => {
      if (exSearch && !e.name.toLowerCase().includes(exSearch.toLowerCase())) return
      if (exMuscleFilter && e.primary !== exMuscleFilter) return
      if (!grouped[e.primary]) grouped[e.primary] = []
      grouped[e.primary].push(e)
    })

    return (
      <div>
        {addingToPlan && (
          <div style={{ background:`${C.gold}12`, borderRadius:10, padding:'10px 12px', marginBottom:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:12, color:C.gold, fontWeight:600 }}>Selecione um exercício para adicionar à ficha</span>
            <button onClick={()=>{ setEditingExercise(null); setActivePlanId(editingExercise.planId); setTreinoView('fichas') }} style={{ background:'none', border:'none', color:C.text2, fontSize:16, cursor:'pointer' }}>×</button>
          </div>
        )}

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
          <div style={{ fontSize:15, fontWeight:700, color:C.text }}>Exercícios</div>
          <button onClick={()=>setEditingExercise({ mode:'create' })} style={{ background:`linear-gradient(135deg,${C.gold},${C.gold2})`, border:'none', borderRadius:10, padding:'8px 12px', color:C.btnText, fontSize:12, cursor:'pointer', fontFamily:'inherit', fontWeight:700 }}>+ Criar</button>
        </div>

        <input value={exSearch} onChange={e=>setExSearch(e.target.value)} placeholder="🔍 Buscar exercício..."
          style={{ width:'100%', background:C.surface2, border:`0.5px solid ${C.border}`, borderRadius:10, padding:'10px 12px', color:C.text, fontSize:13, fontFamily:'inherit', marginBottom:10 }}/>

        <div style={{ display:'flex', gap:5, marginBottom:14, overflowX:'auto', paddingBottom:4 }}>
          <button onClick={()=>setExMuscleFilter('')} style={{ flexShrink:0, padding:'5px 12px', borderRadius:20, fontSize:10, fontWeight:700, cursor:'pointer', fontFamily:'inherit', border:`1.5px solid ${!exMuscleFilter?C.gold:C.border}`, background:!exMuscleFilter?`${C.gold}20`:'transparent', color:!exMuscleFilter?C.gold:C.text2 }}>Todos</button>
          {MUSCLE_GROUPS.map(m => (
            <button key={m.id} onClick={()=>setExMuscleFilter(m.id)} style={{ flexShrink:0, padding:'5px 12px', borderRadius:20, fontSize:10, fontWeight:700, cursor:'pointer', fontFamily:'inherit', border:`1.5px solid ${exMuscleFilter===m.id?m.color:C.border}`, background:exMuscleFilter===m.id?`${m.color}20`:'transparent', color:exMuscleFilter===m.id?m.color:C.text2 }}>{m.label}</button>
          ))}
        </div>

        <div style={isWide?{ columnWidth:340, columnGap:16 }:{}}>
        {MUSCLE_GROUPS.filter(m=>grouped[m.id]).map(m => (
          <div key={m.id} style={{ marginBottom:16, breakInside:'avoid' }}>
            <div style={{ fontSize:11, fontWeight:700, color:m.color, marginBottom:8, fontFamily:'JetBrains Mono,monospace', textTransform:'uppercase', letterSpacing:1 }}>{m.label}</div>
            {grouped[m.id].map(e => {
              const eq = getEquipment(e.equipment)
              const override = customExercises.find(c=>c.id===e.id)
              const isLibOverride = override && e.id.startsWith('ex_')
              const isPureCustom = override && e.id.startsWith('cust_')
              return (
                <div key={e.id} onClick={()=>{
                  if (addingToPlan) {
                    const plan = workoutPlans.find(p=>p.id===editingExercise.planId)
                    if (plan) {
                      const updated = { ...plan, exercises:[...plan.exercises, { exerciseId:e.id, targetSets:3, targetReps:'10', restSeconds:90 }] }
                      updateWorkoutPlans(workoutPlans.map(p=>p.id===plan.id?updated:p))
                      setEditingExercise(null); setActivePlanId(plan.id); setTreinoView('fichas')
                    }
                  } else {
                    setEditingExercise({ mode:'view', exercise:e })
                  }
                }} style={{ background:C.surface, borderRadius:10, padding:'10px 12px', marginBottom:6, border:`0.5px solid ${C.border}`, cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{e.name} {isPureCustom&&<span style={{ fontSize:9, color:C.gold }}>•custom</span>}{isLibOverride&&<span style={{ fontSize:9, color:C.teal }}>•editado</span>}{e.perSide&&<span style={{ fontSize:9, color:C.text3 }}> ⚖️×2</span>}{e.usesBar&&<span style={{ fontSize:9, color:C.text3 }}> 🏋️{e.barWeight}kg</span>}</div>
                    <div style={{ fontSize:10, color:C.text2, marginTop:2 }}>
                      {eq?.icon} {eq?.label}
                      {(e.secondary||[]).length>0 && <span style={{ color:C.text3 }}> · +{e.secondary.map(s=>getMuscle(s)?.label).filter(Boolean).join(', ')}</span>}
                    </div>
                  </div>
                  {addingToPlan && <span style={{ fontSize:18, color:C.gold, marginLeft:8 }}>+</span>}
                </div>
              )
            })}
          </div>
        ))}
        </div>
      </div>
    )
  }

  // ── MODO LIVE ──
  function renderLive() {
    const s = liveSession
    const plan = workoutPlans.find(p => p.id === s.planId)
    const exList = s.exercises
    const curEx = exList[s.currentIdx]
    const e = curEx ? getExercise(curEx.exerciseId) : null
    const totalEx = exList.length
    const doneEx = exList.filter(x => x.sets.length > 0 || x.skipped).length

    const finishLive = () => {
      // Save to workoutLogs
      const dateKey = todayKey()
      const log = {
        planId: s.planId,
        planName: plan?.name || 'Treino',
        startTime: s.startTime,
        endTime: Date.now(),
        exercises: exList.filter(x => x.sets.length > 0).map(x => ({ exerciseId: x.exerciseId, sets: x.sets })),
      }
      const existing = workoutLogs[dateKey] ? (Array.isArray(workoutLogs[dateKey]) ? workoutLogs[dateKey] : [workoutLogs[dateKey]]) : []
      updateWorkoutLogs({ ...workoutLogs, [dateKey]: [...existing, log] })
      // Also register musculação activity for the day
      const day = getDay(dateKey)
      if (!(day.activities||[]).includes('musculacao')) {
        updateDays({ ...days, [dateKey]: { ...day, activities:[...(day.activities||[]), 'musculacao'] } })
      }
      setLiveSession(null)
      setRestTimer(null)
      setTreinoView('resumo')
    }

    // Suggest alternative exercises (same primary muscle, different)
    const alternatives = e ? allExercises.filter(x => x.primary === e.primary && x.id !== e.id).slice(0, 4) : []

    if (!curEx || !e) {
      return (
        <div style={{ textAlign:'center', padding:'40px 20px' }}>
          <div style={{ fontSize:40, marginBottom:16 }}>🎉</div>
          <div style={{ fontSize:18, fontWeight:800, color:C.text, marginBottom:8 }}>Treino concluído!</div>
          <button onClick={finishLive} style={{ background:`linear-gradient(135deg,${C.gold},${C.gold2})`, border:'none', borderRadius:12, padding:'12px 24px', color:C.btnText, fontSize:14, cursor:'pointer', fontFamily:'inherit', fontWeight:700, marginTop:12 }}>Finalizar e Salvar</button>
        </div>
      )
    }

    const pm = getMuscle(e.primary)
    const eq = getEquipment(e.equipment)
    const targetSets = curEx.targetSets || 3
    const completedSets = curEx.sets.length

    // Last log for this exercise (for reference weight)
    // Get last 3 sessions of this exercise for history reference
    const exerciseSessions = (() => {
      const sessions = []
      const allLogs = Object.entries(workoutLogs).sort(([a],[b])=>b.localeCompare(a))
      for (const [date, logs] of allLogs) {
        const arr = Array.isArray(logs) ? logs : [logs]
        for (const log of arr) {
          const found = (log.exercises||[]).find(x => x.exerciseId === e.id)
          if (found && found.sets.length) {
            const volume = found.sets.reduce((a,s)=>a+effectiveWeight(e.id, s.weight)*(s.reps||0),0)
            const maxW = Math.max(...found.sets.map(s=>s.weight||0))
            sessions.push({ date, sets:found.sets, volume, maxW })
          }
        }
        if (sessions.length >= 3) break
      }
      return sessions
    })()
    const lastWeights = exerciseSessions[0]?.sets || null

    return (
      <div>
        {/* Header live */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <div>
            <div style={{ fontSize:11, color:C.teal, fontWeight:700, fontFamily:'JetBrains Mono,monospace' }}>🔴 AO VIVO · {plan?.name}</div>
            <div style={{ fontSize:11, color:C.text2, marginTop:2 }}>Exercício {s.currentIdx+1} de {totalEx} · {doneEx} feitos</div>
          </div>
          <button onClick={()=>{ if(window.confirm('Encerrar treino? O progresso será salvo.')) finishLive() }} style={{ background:`${C.red}18`, border:'none', borderRadius:10, padding:'8px 14px', color:C.red, fontSize:12, cursor:'pointer', fontFamily:'inherit', fontWeight:700 }}>Encerrar</button>
        </div>

        {/* Progress bar */}
        <div style={{ background:C.surface2, borderRadius:4, height:6, marginBottom:16, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${(doneEx/totalEx)*100}%`, background:C.teal, borderRadius:4, transition:'width .3s' }}/>
        </div>

        {/* Rest timer (if active) */}
        {restTimer && (() => {
          const remainingMs = Math.max(0, restTimer.endsAt - restNow)
          const remaining = Math.ceil(remainingMs / 1000)
          if (remaining > 0) return (
          <div style={{ background:`linear-gradient(135deg,${C.teal},#0ea5a5)`, borderRadius:14, padding:'16px', marginBottom:16, textAlign:'center' }}>
            <div style={{ fontSize:11, color:'#fff', opacity:0.9, marginBottom:4, fontWeight:600 }}>⏱️ DESCANSO</div>
            <div style={{ fontSize:40, fontWeight:800, color:'#fff', fontFamily:'JetBrains Mono,monospace' }}>{Math.floor(remaining/60)}:{String(remaining%60).padStart(2,'0')}</div>
            <div style={{ display:'flex', gap:8, justifyContent:'center', marginTop:10 }}>
              <button onClick={()=>setRestTimer(prev=>({...prev, endsAt:prev.endsAt+30000}))} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:8, padding:'6px 12px', color:'#fff', fontSize:12, cursor:'pointer', fontWeight:700 }}>+30s</button>
              <button onClick={()=>setRestTimer(null)} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:8, padding:'6px 12px', color:'#fff', fontSize:12, cursor:'pointer', fontWeight:700 }}>Pular descanso</button>
            </div>
          </div>
          )
          return (
          <div onClick={()=>setRestTimer(null)} style={{ background:`${C.gold}20`, border:`1px solid ${C.gold}`, borderRadius:14, padding:'14px', marginBottom:16, textAlign:'center', cursor:'pointer' }}>
            <div style={{ fontSize:16, fontWeight:800, color:C.gold }}>✓ Descanso concluído! Toque para continuar</div>
          </div>
          )
        })()}

        {/* Current exercise card */}
        <div style={{ background:C.surface, borderRadius:16, padding:16, marginBottom:14, border:`1px solid ${pm?.color||C.gold}40` }}>
          <div style={{ fontSize:20, fontWeight:800, color:C.text, marginBottom:6 }}>{e.name}</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:14 }}>
            <span style={{ fontSize:10, padding:'3px 9px', borderRadius:10, background:C.surface2, color:C.text2 }}>{eq?.icon} {eq?.label}</span>
            <span style={{ fontSize:10, padding:'3px 9px', borderRadius:10, background:`${pm?.color||C.gold}20`, color:pm?.color||C.gold, fontWeight:600 }}>{pm?.label}</span>
            {(e.secondary||[]).map(sid => { const sm=getMuscle(sid); return <span key={sid} style={{ fontSize:10, padding:'3px 9px', borderRadius:10, background:C.surface2, color:C.text3 }}>{sm?.label}</span> })}
          </div>

          <div style={{ fontSize:11, color:C.text2, marginBottom:10, fontFamily:'JetBrains Mono,monospace' }}>
            Meta: {targetSets} séries × {curEx.targetReps} reps · descanso {curEx.restSeconds}s
          </div>

          {/* Histórico das últimas sessões deste exercício */}
          {exerciseSessions.length > 0 && (
            <div style={{ background:C.bg, borderRadius:10, padding:'10px 12px', marginBottom:12 }}>
              <div style={{ fontSize:9, color:C.text2, marginBottom:8, fontFamily:'JetBrains Mono,monospace', textTransform:'uppercase', letterSpacing:1 }}>📊 Últimas {exerciseSessions.length} vezes</div>
              {exerciseSessions.map((sess, si) => {
                const prevSess = exerciseSessions[si+1]
                const volDiff = prevSess ? sess.volume - prevSess.volume : null
                return (
                  <div key={si} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'4px 0', borderBottom:si<exerciseSessions.length-1?`0.5px solid ${C.border}`:'none' }}>
                    <span style={{ fontSize:10, color:C.text3, fontFamily:'JetBrains Mono,monospace', width:44 }}>{sess.date.slice(5).replace('-','/')}</span>
                    <span style={{ flex:1, fontSize:11, color:C.text, fontFamily:'JetBrains Mono,monospace' }}>{sess.sets.map(s=>`${s.weight}×${s.reps}`).join('  ')}</span>
                    <span style={{ fontSize:10, color:C.gold, fontFamily:'JetBrains Mono,monospace', fontWeight:700 }}>{Math.round(sess.volume)}kg</span>
                    {volDiff !== null && Math.abs(volDiff) > 0 && (
                      <span style={{ fontSize:9, fontWeight:700, marginLeft:6, width:38, textAlign:'right', color:volDiff>0?C.teal:C.red, fontFamily:'JetBrains Mono,monospace' }}>{volDiff>0?'↑':'↓'}{Math.abs(Math.round(volDiff))}</span>
                    )}
                    {(volDiff === null || volDiff === 0) && <span style={{ width:38 }}/>}
                  </div>
                )
              })}
              {exerciseSessions.length >= 2 && (() => {
                const cur = exerciseSessions[0].volume
                const prev = exerciseSessions[1].volume
                if (cur > prev) return <div style={{ fontSize:10, color:C.teal, marginTop:6, fontWeight:600 }}>📈 Você evoluiu no volume! Tente manter ou superar hoje.</div>
                if (cur < prev) return <div style={{ fontSize:10, color:C.amber, marginTop:6, fontWeight:600 }}>📉 Volume caiu na última. Bora recuperar hoje!</div>
                return <div style={{ fontSize:10, color:C.text2, marginTop:6 }}>➡️ Volume estável. Tente progredir hoje.</div>
              })()}
            </div>
          )}

          {/* Sets */}
          {curEx.sets.map((set, si) => (
            <div key={si} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, background:C.bg, borderRadius:10, padding:'8px 12px' }}>
              <span style={{ fontSize:12, fontWeight:700, color:C.teal, fontFamily:'JetBrains Mono,monospace', width:24 }}>#{si+1}</span>
              <span style={{ flex:1, fontSize:14, fontWeight:700, color:C.text, fontFamily:'JetBrains Mono,monospace' }}>{set.weight}kg × {set.reps} reps</span>
              <span style={{ fontSize:16, color:C.teal }}>✓</span>
            </div>
          ))}

          {/* Add set form */}
          {completedSets < targetSets + 2 && (
            <div style={{ display:'flex', gap:8, alignItems:'flex-end', marginTop:10 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:9, color:C.text2, marginBottom:3 }}>Peso (kg)</div>
                <input type="number" step="0.5" id="live-weight" placeholder={lastWeights?.[completedSets]?.weight || '0'} style={{ width:'100%', background:C.surface2, border:`0.5px solid ${C.border}`, borderRadius:8, padding:'10px', color:C.text, fontSize:16, fontFamily:'JetBrains Mono,monospace', textAlign:'center' }}/>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:9, color:C.text2, marginBottom:3 }}>Reps</div>
                <input type="number" id="live-reps" placeholder={curEx.targetReps} style={{ width:'100%', background:C.surface2, border:`0.5px solid ${C.border}`, borderRadius:8, padding:'10px', color:C.text, fontSize:16, fontFamily:'JetBrains Mono,monospace', textAlign:'center' }}/>
              </div>
              <button onClick={()=>{
                const w = parseFloat(document.getElementById('live-weight').value) || parseFloat(document.getElementById('live-weight').placeholder) || 0
                const r = parseInt(document.getElementById('live-reps').value) || parseInt(curEx.targetReps) || 0
                const arr = [...exList]
                arr[s.currentIdx] = { ...curEx, sets:[...curEx.sets, { weight:w, reps:r, done:true }] }
                setLiveSession({ ...s, exercises:arr })
                document.getElementById('live-weight').value = ''
                document.getElementById('live-reps').value = ''
                // Start rest timer
                setRestTimer({ total: curEx.restSeconds, endsAt: Date.now() + curEx.restSeconds * 1000 })
              }} style={{ background:`linear-gradient(135deg,${C.teal},#0ea5a5)`, border:'none', borderRadius:8, padding:'10px 16px', color:'#fff', fontSize:14, cursor:'pointer', fontFamily:'inherit', fontWeight:700, whiteSpace:'nowrap' }}>✓ Série</button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display:'flex', gap:8, marginBottom:12 }}>
          <button onClick={()=>{
            // Next exercise
            if (s.currentIdx < totalEx - 1) setLiveSession({ ...s, currentIdx: s.currentIdx + 1 })
            else setLiveSession({ ...s, currentIdx: totalEx }) // triggers finish screen
            setRestTimer(null)
          }} style={{ flex:2, background:`linear-gradient(135deg,${C.gold},${C.gold2})`, border:'none', borderRadius:12, padding:'12px', color:C.btnText, fontSize:14, cursor:'pointer', fontFamily:'inherit', fontWeight:700 }}>
            {s.currentIdx < totalEx-1 ? 'Próximo exercício ›' : 'Concluir treino ✓'}
          </button>
          <button onClick={()=>{
            const arr = [...exList]
            arr[s.currentIdx] = { ...curEx, skipped:true }
            if (s.currentIdx < totalEx - 1) setLiveSession({ ...s, exercises:arr, currentIdx: s.currentIdx + 1 })
            else setLiveSession({ ...s, exercises:arr, currentIdx: totalEx })
            setRestTimer(null)
          }} style={{ flex:1, background:C.surface2, border:`1px solid ${C.border}`, borderRadius:12, padding:'12px', color:C.text2, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Pular ⏭</button>
        </div>

        {/* Alternatives (equipment busy) */}
        {alternatives.length > 0 && (
          <div style={{ background:C.surface, borderRadius:12, padding:12, border:`0.5px solid ${C.border}` }}>
            <div style={{ fontSize:11, color:C.text2, marginBottom:8, fontWeight:600 }}>🔄 Aparelho ocupado? Substitua por:</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {alternatives.map(alt => {
                const aeq = getEquipment(alt.equipment)
                return (
                  <button key={alt.id} onClick={()=>{
                    const arr = [...exList]
                    arr[s.currentIdx] = { ...curEx, exerciseId: alt.id }
                    setLiveSession({ ...s, exercises:arr })
                  }} style={{ padding:'6px 10px', borderRadius:10, border:`1px solid ${C.border}`, background:C.surface2, color:C.text, fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>
                    {alt.name} <span style={{ color:C.text3 }}>{aeq?.icon}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── MAPA MUSCULAR VISUAL ──
  function renderMuscleMap(muscleVolume, maxVol) {
    // Simplified body silhouette with muscle regions as colored shapes
    const intensity = (mid) => {
      const v = muscleVolume[mid] || 0
      if (v === 0) return 0
      return Math.min(1, v / maxVol)
    }
    const col = (mid, baseColor) => {
      const i = intensity(mid)
      if (i === 0) return C.surface2
      // interpolate opacity via the muscle color
      const alpha = Math.round((0.25 + i*0.75) * 255).toString(16).padStart(2,'0')
      return (getMuscle(mid)?.color || baseColor) + alpha
    }
    return (
      <div style={{ background:C.surface, borderRadius:14, padding:14, marginBottom:12, border:`0.5px solid ${C.border}` }}>
        <div style={{ fontSize:13, fontWeight:700, marginBottom:4, color:C.text }}>🗺️ Mapa Muscular</div>
        <div style={{ fontSize:10, color:C.text2, marginBottom:12, fontFamily:'JetBrains Mono,monospace' }}>Intensidade de treino (4 semanas)</div>
        <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
          {/* FRENTE */}
          <div style={{ textAlign:'center' }}>
            <svg viewBox="0 0 120 220" style={{ width:120, height:220 }}>
              {/* cabeça */}
              <circle cx="60" cy="18" r="12" fill={C.surface2}/>
              {/* trapézio */}
              <path d="M45 32 L75 32 L70 42 L50 42 Z" fill={col('trapezio')} stroke={C.border} strokeWidth="0.5"/>
              {/* ombros: anterior (interno) + lateral (externo) */}
              <circle cx="41" cy="45" r="7" fill={col('ombro_ant')} stroke={C.border} strokeWidth="0.5"/>
              <circle cx="33" cy="47" r="6" fill={col('ombro_lat')} stroke={C.border} strokeWidth="0.5"/>
              <circle cx="79" cy="45" r="7" fill={col('ombro_ant')} stroke={C.border} strokeWidth="0.5"/>
              <circle cx="87" cy="47" r="6" fill={col('ombro_lat')} stroke={C.border} strokeWidth="0.5"/>
              {/* peito */}
              <path d="M45 42 L75 42 L72 68 L48 68 Z" fill={col('peito')} stroke={C.border} strokeWidth="0.5"/>
              {/* abdomen */}
              <rect x="50" y="70" width="20" height="30" rx="3" fill={col('abdomen')} stroke={C.border} strokeWidth="0.5"/>
              {/* bíceps */}
              <ellipse cx="32" cy="65" rx="7" ry="15" fill={col('biceps')} stroke={C.border} strokeWidth="0.5"/>
              <ellipse cx="88" cy="65" rx="7" ry="15" fill={col('biceps')} stroke={C.border} strokeWidth="0.5"/>
              {/* antebraço */}
              <ellipse cx="28" cy="90" rx="6" ry="14" fill={col('antebraco')} stroke={C.border} strokeWidth="0.5"/>
              <ellipse cx="92" cy="90" rx="6" ry="14" fill={col('antebraco')} stroke={C.border} strokeWidth="0.5"/>
              {/* quadríceps */}
              <path d="M48 102 L59 102 L57 150 L50 150 Z" fill={col('quadriceps')} stroke={C.border} strokeWidth="0.5"/>
              <path d="M61 102 L72 102 L70 150 L63 150 Z" fill={col('quadriceps')} stroke={C.border} strokeWidth="0.5"/>
              {/* panturrilha frente */}
              <ellipse cx="53" cy="175" rx="6" ry="18" fill={col('panturrilha')} stroke={C.border} strokeWidth="0.5"/>
              <ellipse cx="67" cy="175" rx="6" ry="18" fill={col('panturrilha')} stroke={C.border} strokeWidth="0.5"/>
              <text x="60" y="212" fontSize="9" fill={C.text3} textAnchor="middle" fontFamily="JetBrains Mono,monospace">FRENTE</text>
            </svg>
          </div>
          {/* COSTAS */}
          <div style={{ textAlign:'center' }}>
            <svg viewBox="0 0 120 220" style={{ width:120, height:220 }}>
              <circle cx="60" cy="18" r="12" fill={C.surface2}/>
              {/* trapézio */}
              <path d="M44 32 L76 32 L72 50 L48 50 Z" fill={col('trapezio')} stroke={C.border} strokeWidth="0.5"/>
              {/* ombros: posterior (interno) + lateral (externo) */}
              <circle cx="41" cy="45" r="7" fill={col('ombro_post')} stroke={C.border} strokeWidth="0.5"/>
              <circle cx="33" cy="47" r="6" fill={col('ombro_lat')} stroke={C.border} strokeWidth="0.5"/>
              <circle cx="79" cy="45" r="7" fill={col('ombro_post')} stroke={C.border} strokeWidth="0.5"/>
              <circle cx="87" cy="47" r="6" fill={col('ombro_lat')} stroke={C.border} strokeWidth="0.5"/>
              {/* costas (dorsal) */}
              <path d="M46 50 L74 50 L70 80 L50 80 Z" fill={col('costas')} stroke={C.border} strokeWidth="0.5"/>
              {/* lombar */}
              <rect x="51" y="82" width="18" height="18" rx="3" fill={col('lombar')} stroke={C.border} strokeWidth="0.5"/>
              {/* tríceps */}
              <ellipse cx="32" cy="65" rx="7" ry="15" fill={col('triceps')} stroke={C.border} strokeWidth="0.5"/>
              <ellipse cx="88" cy="65" rx="7" ry="15" fill={col('triceps')} stroke={C.border} strokeWidth="0.5"/>
              {/* glúteo */}
              <path d="M48 100 L59 100 L58 118 L49 118 Z" fill={col('gluteo')} stroke={C.border} strokeWidth="0.5"/>
              <path d="M61 100 L72 100 L71 118 L62 118 Z" fill={col('gluteo')} stroke={C.border} strokeWidth="0.5"/>
              {/* posterior */}
              <path d="M49 120 L58 120 L56 150 L50 150 Z" fill={col('posterior')} stroke={C.border} strokeWidth="0.5"/>
              <path d="M62 120 L71 120 L70 150 L64 150 Z" fill={col('posterior')} stroke={C.border} strokeWidth="0.5"/>
              {/* panturrilha */}
              <ellipse cx="53" cy="175" rx="6" ry="18" fill={col('panturrilha')} stroke={C.border} strokeWidth="0.5"/>
              <ellipse cx="67" cy="175" rx="6" ry="18" fill={col('panturrilha')} stroke={C.border} strokeWidth="0.5"/>
              <text x="60" y="212" fontSize="9" fill={C.text3} textAnchor="middle" fontFamily="JetBrains Mono,monospace">COSTAS</text>
            </svg>
          </div>
        </div>
        {/* Legenda */}
        <div style={{ display:'flex', alignItems:'center', gap:8, justifyContent:'center', marginTop:8 }}>
          <span style={{ fontSize:9, color:C.text3 }}>Menos</span>
          <div style={{ display:'flex', gap:2 }}>
            {[0.2,0.4,0.6,0.8,1].map(i=><div key={i} style={{ width:16, height:8, borderRadius:2, background:C.gold+Math.round(i*255).toString(16).padStart(2,'0') }}/>)}
          </div>
          <span style={{ fontSize:9, color:C.text3 }}>Mais</span>
        </div>
      </div>
    )
  }

  // ── EVOLUÇÃO DE CARGA (Fase 2) + ANÁLISE MUSCULAR (Fase 4) ──
  function renderEvolucao() {
    // Build per-exercise history from workoutLogs
    const exerciseHistory = {} // exId -> [{ date, sets, maxWeight, volume }]
    Object.entries(workoutLogs).forEach(([date, logs]) => {
      const arr = Array.isArray(logs) ? logs : [logs]
      arr.forEach(log => {
        (log.exercises||[]).forEach(ex => {
          if (!ex.sets || ex.sets.length === 0) return
          const maxWeight = Math.max(...ex.sets.map(s=>s.weight||0))
          const volume = ex.sets.reduce((a,s)=>a+effectiveWeight(ex.exerciseId, s.weight)*(s.reps||0),0)
          if (!exerciseHistory[ex.exerciseId]) exerciseHistory[ex.exerciseId] = []
          exerciseHistory[ex.exerciseId].push({ date, sets:ex.sets, maxWeight, volume })
        })
      })
    })
    Object.keys(exerciseHistory).forEach(k => exerciseHistory[k].sort((a,b)=>a.date.localeCompare(b.date)))

    const exercisesWithData = Object.keys(exerciseHistory)

    // ── Muscle volume analysis (last 4 weeks = sets per muscle) ──
    const d30 = new Date(); d30.setDate(d30.getDate()-28)
    const cutoff30 = `${d30.getFullYear()}-${String(d30.getMonth()+1).padStart(2,'0')}-${String(d30.getDate()).padStart(2,'0')}`
    const muscleVolume = {} // muscleId -> total sets (primary counts full, secondary counts half)
    Object.entries(workoutLogs).forEach(([date, logs]) => {
      if (date < cutoff30) return
      const arr = Array.isArray(logs) ? logs : [logs]
      arr.forEach(log => {
        (log.exercises||[]).forEach(ex => {
          const e = getExercise(ex.exerciseId)
          if (!e || !ex.sets) return
          const nSets = ex.sets.length
          muscleVolume[e.primary] = (muscleVolume[e.primary]||0) + nSets
          ;(e.secondary||[]).forEach(sid => { muscleVolume[sid] = (muscleVolume[sid]||0) + nSets*0.5 })
        })
      })
    })
    const maxMuscleVol = Math.max(1, ...Object.values(muscleVolume))
    const sortedMuscles = MUSCLE_GROUPS.map(m => ({ ...m, vol: muscleVolume[m.id]||0 })).sort((a,b)=>b.vol-a.vol)
    const neglected = sortedMuscles.filter(m => m.vol > 0 && m.vol < maxMuscleVol*0.3)
    const untrained = sortedMuscles.filter(m => m.vol === 0)

    if (exercisesWithData.length === 0) {
      return (
        <div style={{ textAlign:'center', padding:'40px 20px', color:C.text3 }}>
          <div style={{ fontSize:36, marginBottom:12 }}>📈</div>
          <div style={{ fontSize:14, marginBottom:6, color:C.text2 }}>Sem dados de treino ainda</div>
          <div style={{ fontSize:12 }}>Complete treinos no modo Live para ver sua evolução</div>
        </div>
      )
    }

    return (
      <div style={isWide?{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, alignItems:'start' }:{}}>
        {/* Coluna: Análise muscular */}
        <div>
          {renderMuscleMap(muscleVolume, maxMuscleVol)}
          {/* Volume por músculo (últimas 4 semanas) */}
          <div style={{ background:C.surface, borderRadius:14, padding:14, marginBottom:12, border:`0.5px solid ${C.border}` }}>
            <div style={{ fontSize:13, fontWeight:700, marginBottom:4, color:C.text }}>💪 Volume por Músculo</div>
            <div style={{ fontSize:10, color:C.text2, marginBottom:12, fontFamily:'JetBrains Mono,monospace' }}>Séries nas últimas 4 semanas</div>
            {sortedMuscles.filter(m=>m.vol>0).map(m => (
              <div key={m.id} style={{ marginBottom:8 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                  <span style={{ fontSize:11, color:C.text, fontWeight:600 }}>{m.label}</span>
                  <span style={{ fontSize:11, color:m.color, fontWeight:700, fontFamily:'JetBrains Mono,monospace' }}>{Math.round(m.vol)} séries</span>
                </div>
                <div style={{ background:C.surface2, borderRadius:4, height:8, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${(m.vol/maxMuscleVol)*100}%`, background:m.color, borderRadius:4 }}/>
                </div>
              </div>
            ))}
          </div>

          {/* Alertas de músculos esquecidos */}
          {(neglected.length > 0 || untrained.length > 0) && (
            <div style={{ background:C.surface, borderRadius:14, padding:14, marginBottom:12, border:`0.5px solid ${C.border}` }}>
              <div style={{ fontSize:13, fontWeight:700, marginBottom:10, color:C.text }}>⚠️ Atenção</div>
              {neglected.map(m => (
                <div key={m.id} style={{ background:`${C.amber}12`, borderRadius:8, padding:'8px 10px', marginBottom:6, borderLeft:`3px solid ${C.amber}` }}>
                  <span style={{ fontSize:12, color:C.text2 }}><b style={{ color:m.color }}>{m.label}</b> com pouco volume ({Math.round(m.vol)} séries) — pode estar ficando pra trás.</span>
                </div>
              ))}
              {untrained.slice(0,5).map(m => (
                <div key={m.id} style={{ background:`${C.red}10`, borderRadius:8, padding:'8px 10px', marginBottom:6, borderLeft:`3px solid ${C.red}` }}>
                  <span style={{ fontSize:12, color:C.text2 }}><b style={{ color:m.color }}>{m.label}</b> sem treino nas últimas 4 semanas.</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Coluna: Evolução de carga por exercício */}
        <div>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:10, color:C.text }}>📈 Evolução de Carga</div>
          {exercisesWithData.map(exId => {
            const e = getExercise(exId)
            if (!e) return null
            const hist = exerciseHistory[exId]
            const pm = getMuscle(e.primary)
            const pr = Math.max(...hist.map(h=>h.maxWeight))
            const firstW = hist[0].maxWeight
            const lastW = hist[hist.length-1].maxWeight
            const progress = firstW > 0 ? ((lastW-firstW)/firstW*100).toFixed(0) : 0
            // Mini chart of maxWeight over time
            const vals = hist.map(h=>h.maxWeight)
            const W=300, H=60, PL=4, PR=4, PT=8, PB=14
            const maxV=Math.max(...vals)*1.05, minV=Math.min(...vals)*0.95
            const cx=i=>PL+(i/Math.max(vals.length-1,1))*(W-PL-PR)
            const cy=v=>PT+(1-(v-minV)/(maxV-minV||1))*(H-PT-PB)
            const pts=vals.map((v,i)=>`${cx(i)},${cy(v)}`).join(' ')
            const trend = lastW>=firstW?C.teal:C.red
            return (
              <div key={exId} style={{ background:C.surface, borderRadius:12, padding:12, marginBottom:10, border:`0.5px solid ${C.border}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{e.name}</div>
                    <span style={{ fontSize:9, padding:'2px 7px', borderRadius:8, background:`${pm?.color||C.gold}20`, color:pm?.color||C.gold, fontWeight:600 }}>{pm?.label}</span>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:16, fontWeight:800, color:trend, fontFamily:'JetBrains Mono,monospace' }}>{lastW}kg</div>
                    <div style={{ fontSize:9, color:C.text3, fontFamily:'JetBrains Mono,monospace' }}>PR: {pr}kg</div>
                  </div>
                </div>
                {vals.length >= 2 && (
                  <svg viewBox={`0 0 ${W} ${H}`} style={{ width:'100%', height:H }}>
                    <polyline points={pts} fill="none" stroke={trend} strokeWidth="2" strokeLinejoin="round"/>
                    {vals.map((v,i)=>(
                      <g key={i}>
                        <circle cx={cx(i)} cy={cy(v)} r="3" fill={trend}/>
                        <text x={cx(i)} y={H-2} fontSize="7" fill={C.text2} textAnchor="middle" fontFamily="JetBrains Mono,monospace">{hist[i].date.slice(5).replace('-','/')}</text>
                      </g>
                    ))}
                  </svg>
                )}
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:6, fontSize:10, fontFamily:'JetBrains Mono,monospace' }}>
                  <span style={{ color:C.text2 }}>{hist.length} treino(s)</span>
                  {progress != 0 && <span style={{ color:progress>0?C.teal:C.red, fontWeight:700 }}>{progress>0?'+':''}{progress}% desde o início</span>}
                </div>
                {/* Progression suggestion */}
                {(() => {
                  const lastSession = hist[hist.length-1]
                  const allHitTarget = lastSession.sets.length >= 3 && lastSession.sets.every(s => s.reps >= 10)
                  const stagnant = hist.length >= 3 && hist.slice(-3).every(h => h.maxWeight === lastW)
                  if (allHitTarget && stagnant) return (
                    <div style={{ background:`${C.teal}12`, borderRadius:8, padding:'6px 10px', marginTop:8, fontSize:11, color:C.teal }}>
                      💡 Você bateu as reps 3x seguidas com {lastW}kg — hora de subir a carga!
                    </div>
                  )
                  return null
                })()}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  function renderTreinoResumo() {
    const todayActivities=currentDay.activities||[]
    const d=new Date(); const dow=d.getDay(); const diff=dow===0?-6:1-dow
    const monday=new Date(d); monday.setDate(d.getDate()+diff)
    const weekDays=[]
    for(let i=0;i<7;i++){ const wd=new Date(monday); wd.setDate(monday.getDate()+i); weekDays.push(`${wd.getFullYear()}-${String(wd.getMonth()+1).padStart(2,'0')}-${String(wd.getDate()).padStart(2,'0')}`) }
    const weekStrength=weekDays.filter(wd=>(days[wd]?.activities||[]).some(a=>ACTIVITIES.find(x=>x.id===a)?.type==='strength')).length
    const weekCardio=weekDays.filter(wd=>(days[wd]?.activities||[]).some(a=>ACTIVITIES.find(x=>x.id===a)?.type==='cardio')).length
    const sf=weekStrength>=4?C.teal:weekStrength===3?C.gold:C.red
    const cf=weekCardio>=1?C.teal:C.red
    return (
      <div>
        <div style={{ background:C.surface, borderRadius:14, padding:14, marginBottom:14, border:`0.5px solid ${C.border}` }}>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:12, color:C.text }}>📅 Semana atual</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {[{label:'Musculação',val:weekStrength,meta:'4x',farol:sf,msg:weekStrength>=4?'Meta atingida! ✓':weekStrength===3?'Quase lá!':'Abaixo da meta'},{label:'Cardio',val:weekCardio,meta:'1x',farol:cf,msg:weekCardio>=1?'Meta atingida! ✓':'Sem cardio essa semana'}].map(s=>(
              <div key={s.label} style={{ background:C.bg, borderRadius:10, padding:'10px 12px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                  <span style={{ width:8, height:8, borderRadius:'50%', background:s.farol, display:'inline-block' }}/>
                  <span style={{ fontSize:11, color:C.text2 }}>{s.label}</span>
                </div>
                <div style={{ fontSize:22, fontWeight:800, color:s.farol, fontFamily:'JetBrains Mono,monospace' }}>{s.val}<span style={{ fontSize:12, color:C.text2, fontWeight:400 }}>/{s.meta}</span></div>
                <div style={{ fontSize:10, color:C.text2, marginTop:2 }}>{s.msg}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background:C.surface, borderRadius:14, padding:14, border:`0.5px solid ${C.border}` }}>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:10, color:C.text }}>🏋️ Atividades de hoje</div>
          {todayActivities.length===0&&<div style={{ fontSize:12, color:C.text3, marginBottom:10 }}>Nenhuma atividade registrada</div>}
          {todayActivities.length>0&&<div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 }}>
            {todayActivities.map(actId=>{
              const act=ACTIVITIES.find(a=>a.id===actId); if(!act) return null
              return <div key={actId} style={{ display:'flex', alignItems:'center', gap:6, background:act.color+'20', border:`1px solid ${act.color}40`, borderRadius:20, padding:'6px 12px' }}>
                <span style={{ fontSize:14 }}>{act.icon}</span>
                <span style={{ fontSize:12, color:act.color, fontWeight:600 }}>{act.label}</span>
                <button onClick={()=>removeActivityFromDay(actId)} style={{ background:'none', border:'none', color:act.color, cursor:'pointer', fontSize:14, padding:0 }}>×</button>
              </div>
            })}
          </div>}
          <div style={{ fontSize:11, color:C.text2, marginBottom:8, fontWeight:600 }}>Adicionar:</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {ACTIVITIES.map(act=>{
              const done=todayActivities.includes(act.id)
              return <button key={act.id} onClick={()=>addActivityToDay(act.id)} disabled={done}
                style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', border:`1px solid ${done?act.color:C.border}`, borderRadius:20, background:done?act.color+'20':'transparent', cursor:done?'default':'pointer', fontFamily:'inherit' }}>
                <span style={{ fontSize:13 }}>{act.icon}</span>
                <span style={{ fontSize:11, color:done?act.color:C.text2, fontWeight:done?700:400 }}>{act.label}</span>
              </button>
            })}
          </div>
        </div>

        {/* Treinos recentes */}
        {Object.keys(workoutLogs).length > 0 && (
          <div style={{ background:C.surface, borderRadius:14, padding:14, marginTop:12, border:`0.5px solid ${C.border}` }}>
            <div style={{ fontSize:13, fontWeight:700, marginBottom:12, color:C.text }}>🏋️ Treinos Recentes</div>
            {Object.entries(workoutLogs).sort(([a],[b])=>b.localeCompare(a)).slice(0,8).map(([date, logs]) => {
              const arr = Array.isArray(logs) ? logs : [logs]
              return arr.map((log, li) => {
                const totalSets = (log.exercises||[]).reduce((a,e)=>a+(e.sets?.length||0),0)
                const totalVolume = (log.exercises||[]).reduce((a,e)=>a+(e.sets||[]).reduce((s,set)=>s+effectiveWeight(e.exerciseId, set.weight)*(set.reps||0),0),0)
                const durMin = log.endTime&&log.startTime ? Math.round((log.endTime-log.startTime)/60000) : null
                const wKey = date+'_'+li
                const isExp = expandedWorkout === wKey
                return (
                  <div key={date+li} style={{ background:C.bg, borderRadius:10, padding:'10px 12px', marginBottom:8, cursor:'pointer' }} onClick={()=>setExpandedWorkout(isExp?null:wKey)}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                      <span style={{ fontSize:13, fontWeight:700, color:C.text }}>{log.planName||'Treino'}</span>
                      <span style={{ fontSize:11, color:C.text2, fontFamily:'JetBrains Mono,monospace' }}>{formatDateFull(date)}</span>
                    </div>
                    <div style={{ display:'flex', gap:12, fontSize:10, color:C.text2, fontFamily:'JetBrains Mono,monospace', alignItems:'center' }}>
                      <span>{(log.exercises||[]).length} exercícios</span>
                      <span>{totalSets} séries</span>
                      <span style={{ color:C.gold }}>{Math.round(totalVolume).toLocaleString()} kg vol</span>
                      {durMin && <span>{durMin} min</span>}
                      <span style={{ marginLeft:'auto', color:C.text3 }}>{isExp?'▲':'▼ ver'}</span>
                    </div>
                    {isExp && (
                      <div style={{ marginTop:10, paddingTop:10, borderTop:`0.5px solid ${C.border}` }}>
                        {(log.exercises||[]).map((ex, ei) => {
                          const e = getExercise(ex.exerciseId)
                          const vol = (ex.sets||[]).reduce((a,s)=>a+effectiveWeight(ex.exerciseId, s.weight)*(s.reps||0),0)
                          return (
                            <div key={ei} style={{ marginBottom:8 }}>
                              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                                <span style={{ fontSize:12, fontWeight:600, color:C.text }}>{e?.name||ex.exerciseId}</span>
                                <span style={{ fontSize:10, color:C.gold, fontFamily:'JetBrains Mono,monospace' }}>{Math.round(vol)}kg</span>
                              </div>
                              <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                                {(ex.sets||[]).map((set, si) => (
                                  <span key={si} style={{ fontSize:11, background:C.surface2, borderRadius:6, padding:'3px 8px', color:C.text2, fontFamily:'JetBrains Mono,monospace' }}>{set.weight}×{set.reps}</span>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })
            })}
          </div>
        )}
      </div>
    )
  }// ── PESO ────────────────────────────────────────────────────────────────────
  function renderSaude() {
    const hEntries = Object.entries(healthData).filter(([,d])=>d.steps||d.sleep||d.sleepScore).sort(([a],[b])=>b.localeCompare(a))
    return (
      <div>
        {/* Saúde - Samsung Health */}
        <div style={{ background:C.surface, borderRadius:14, padding:14, marginBottom:12, border:`0.5px solid ${C.border}` }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:(() => { const hEntries = Object.entries(healthData).filter(([,d])=>d.steps||d.sleep); return hEntries.length>0?12:0 })() }}>
            <div style={{ fontSize:13, fontWeight:700, color:C.text }}>👟 Atividade & Sono</div>
            <div style={{ display:'flex', gap:6 }}>
              <button onClick={()=>setShowHealthManual(true)} style={{ background:`linear-gradient(135deg,${C.gold},${C.gold2})`, border:'none', borderRadius:10, padding:'7px 12px', color:C.btnText, fontSize:11, cursor:'pointer', fontFamily:'inherit', fontWeight:700 }}>+ Registrar</button>
              <button onClick={()=>setShowHealthImport(true)} style={{ background:C.surface2, border:`1px solid ${C.gold}60`, borderRadius:10, padding:'7px 12px', color:C.gold, fontSize:11, cursor:'pointer', fontFamily:'inherit', fontWeight:700 }}>📥 CSV</button>
            </div>
          </div>
          {(() => {
            const hEntries = Object.entries(healthData).filter(([,d])=>d.steps||d.sleep).sort(([a],[b])=>b.localeCompare(a))
            if (hEntries.length === 0) return (
              <div style={{ textAlign:'center', padding:'8px 0 0', color:C.text3, fontSize:12 }}>
                Importe seus dados de passos e sono do Samsung Health
              </div>
            )
            // Latest values + 7-day averages
            const last7 = hEntries.slice(0, 7)
            const avgOf = (key) => { const s = last7.map(([,d])=>d[key]).filter(v=>v!=null); return s.length?s.reduce((a,b)=>a+b,0)/s.length:null }
            const avgSteps = (() => { const v = avgOf('steps'); return v?Math.round(v):null })()
            const avgSleep = (() => { const v = avgOf('sleep'); return v?v.toFixed(1):null })()
            const avgScore = (() => { const v = avgOf('sleepScore'); return v?Math.round(v):null })()
            const latestSteps = hEntries.find(([,d])=>d.steps)?.[1]?.steps
            const latestSleepE = hEntries.find(([,d])=>d.sleep)?.[1]
            return (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {latestSteps != null && (
                  <div style={{ background:C.bg, borderRadius:10, padding:'10px 12px' }}>
                    <div style={{ fontSize:10, color:C.text2, marginBottom:4 }}>👟 Passos (último)</div>
                    <div style={{ fontSize:20, fontWeight:800, color:C.teal, fontFamily:'JetBrains Mono,monospace' }}>{latestSteps.toLocaleString()}</div>
                    {avgSteps && <div style={{ fontSize:10, color:C.text3, marginTop:2, fontFamily:'JetBrains Mono,monospace' }}>média 7d: {avgSteps.toLocaleString()}</div>}
                  </div>
                )}
                {latestSleepE?.sleep != null && (
                  <div style={{ background:C.bg, borderRadius:10, padding:'10px 12px' }}>
                    <div style={{ fontSize:10, color:C.text2, marginBottom:4 }}>😴 Sono (último)</div>
                    <div style={{ fontSize:20, fontWeight:800, color:'#8b7fd4', fontFamily:'JetBrains Mono,monospace' }}>{latestSleepE.sleep}h</div>
                    {avgSleep && <div style={{ fontSize:10, color:C.text3, marginTop:2, fontFamily:'JetBrains Mono,monospace' }}>média 7d: {avgSleep}h</div>}
                  </div>
                )}
                {avgScore != null && (
                  <div style={{ background:C.bg, borderRadius:10, padding:'10px 12px', gridColumn:'1 / -1' }}>
                    <div style={{ fontSize:10, color:C.text2, marginBottom:4 }}>⭐ Nota do Sono (média 7d)</div>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ fontSize:20, fontWeight:800, color:avgScore>=70?C.teal:avgScore>=50?C.gold:C.red, fontFamily:'JetBrains Mono,monospace' }}>{avgScore}<span style={{ fontSize:11, color:C.text3 }}>/100</span></div>
                      <div style={{ flex:1, background:C.surface2, borderRadius:4, height:8, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:avgScore+'%', background:avgScore>=70?C.teal:avgScore>=50?C.gold:C.red, borderRadius:4 }}/>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })()}
        </div>

        {/* Histórico de saúde (passos/sono) - editável */}
        {Object.keys(healthData).filter(d=>healthData[d].steps||healthData[d].sleep||healthData[d].sleepScore).length > 0 && (
          <div style={{ background:C.surface, borderRadius:14, padding:14, marginBottom:12, border:`0.5px solid ${C.border}` }}>
            <div style={{ fontSize:13, fontWeight:500, marginBottom:12, color:C.text }}>📋 Registros de Saúde</div>
            {Object.entries(healthData)
              .filter(([,d])=>d.steps||d.sleep||d.sleepScore)
              .sort(([a],[b])=>b.localeCompare(a))
              .slice(0, 30)
              .map(([date, d], idx, arr) => (
                <div key={date} onClick={()=>{ setHealthEditDate(date); setShowHealthManual(true) }}
                  style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:idx<arr.length-1?`0.5px solid ${C.border}`:'none', cursor:'pointer' }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{formatDateFull(date)}</div>
                    <div style={{ display:'flex', gap:10, marginTop:3, fontSize:11, fontFamily:'JetBrains Mono,monospace' }}>
                      {d.steps != null && <span style={{ color:C.teal }}>👟 {d.steps.toLocaleString()}</span>}
                      {d.sleep != null && <span style={{ color:'#8b7fd4' }}>😴 {d.sleep}h</span>}
                      {d.sleepScore != null && <span style={{ color:C.gold }}>⭐ {d.sleepScore}</span>}
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:11, color:C.text3 }}>editar ›</span>
                    <button onClick={(e)=>{ e.stopPropagation(); if(window.confirm(`Excluir registro de ${formatDateFull(date)}?`)){ const hd={...healthData}; delete hd[date]; updateHealthData(hd) } }}
                      style={{ background:`${C.red}18`, border:'none', borderRadius:8, width:26, height:26, color:C.red, cursor:'pointer', fontSize:14, flexShrink:0 }}>×</button>
                  </div>
                </div>
              ))}
          </div>
        )}


        {/* Gráficos de evolução */}
        {(() => {
          const stepsEntries = Object.entries(healthData).filter(([,d])=>d.steps).sort(([a],[b])=>a.localeCompare(b))
          if (stepsEntries.length < 2) return null
          const sVals = stepsEntries.map(([,d])=>d.steps)
          const W=340, H=90, PL=8, PR=8, PT=8, PB=24
          const maxV=Math.max(...sVals)*1.1, minV=0
          const cx=i=>PL+(i/Math.max(sVals.length-1,1))*(W-PL-PR)
          const cy=v=>PT+(1-(v-minV)/(maxV-minV))*(H-PT-PB)
          const pts=sVals.map((v,i)=>`${cx(i)},${cy(v)}`).join(' ')
          return (
            <div style={{ background:C.surface, borderRadius:14, padding:14, marginBottom:12, border:`0.5px solid ${C.border}` }}>
              <div style={{ fontSize:13, fontWeight:500, marginBottom:10, color:C.text }}>👟 Evolução de Passos</div>
              <svg viewBox={`0 0 ${W} ${H}`} style={{ width:'100%', height:H }}>
                <polyline points={pts} fill="none" stroke={C.teal} strokeWidth="2" strokeLinejoin="round"/>
                {sVals.map((v,i)=>(
                  <g key={i}>
                    <circle cx={cx(i)} cy={cy(v)} r="3.5" fill={C.teal}/>
                    <text x={cx(i)} y={H-2} fontSize="7.5" fill={C.text2} textAnchor="middle" fontFamily="JetBrains Mono,monospace">{stepsEntries[i]?.[0]?.slice(5).replace('-','/')}</text>
                  </g>
                ))}
              </svg>
            </div>
          )
        })()}

        {(() => {
          const sleepEntries = Object.entries(healthData).filter(([,d])=>d.sleep).sort(([a],[b])=>a.localeCompare(b))
          if (sleepEntries.length < 2) return null
          const sVals = sleepEntries.map(([,d])=>d.sleep)
          const W=340, H=90, PL=8, PR=8, PT=8, PB=24
          const maxV=Math.max(...sVals)+1, minV=Math.max(0,Math.min(...sVals)-1)
          const cx=i=>PL+(i/Math.max(sVals.length-1,1))*(W-PL-PR)
          const cy=v=>PT+(1-(v-minV)/(maxV-minV))*(H-PT-PB)
          const pts=sVals.map((v,i)=>`${cx(i)},${cy(v)}`).join(' ')
          return (
            <div style={{ background:C.surface, borderRadius:14, padding:14, marginBottom:12, border:`0.5px solid ${C.border}` }}>
              <div style={{ fontSize:13, fontWeight:500, marginBottom:10, color:C.text }}>😴 Evolução do Sono</div>
              <svg viewBox={`0 0 ${W} ${H}`} style={{ width:'100%', height:H }}>
                <polyline points={pts} fill="none" stroke="#8b7fd4" strokeWidth="2" strokeLinejoin="round"/>
                {sVals.map((v,i)=>(
                  <g key={i}>
                    <circle cx={cx(i)} cy={cy(v)} r="3.5" fill="#8b7fd4"/>
                    <text x={cx(i)} y={cy(v)-6} fontSize="7.5" fill="#8b7fd4" textAnchor="middle" fontFamily="JetBrains Mono,monospace">{v}h</text>
                    <text x={cx(i)} y={H-2} fontSize="7.5" fill={C.text2} textAnchor="middle" fontFamily="JetBrains Mono,monospace">{sleepEntries[i]?.[0]?.slice(5).replace('-','/')}</text>
                  </g>
                ))}
              </svg>
            </div>
          )
        })()}
      </div>
    )
  }

  function renderPeso() {
    const weightEntries = Object.entries(weights).sort(([a],[b]) => b.localeCompare(a))
    const latestWeight = weightEntries[0]?.[1] || null
    const prevWeight = weightEntries[1]?.[1] || null
    const weightDiff = latestWeight && prevWeight ? (latestWeight - prevWeight).toFixed(1) : null

    // Period filter cutoff
    const periodCutoff = (() => {
      if (pesoPeriod === 'all') return '0000-00-00'
      const days = pesoPeriod === '30d' ? 30 : pesoPeriod === '90d' ? 90 : 180
      const d = new Date(); d.setDate(d.getDate() - days)
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    })()

    const chartEntries = [...weightEntries].reverse().filter(([date]) => date >= periodCutoff)
    const wVals = chartEntries.map(([,v]) => v)

    // Body composition trends
    const bodyEntries = Object.entries(bodyData).filter(([date]) => date >= periodCutoff).sort(([a],[b]) => a.localeCompare(b))
    const latestBody = bodyEntries.length > 0 ? bodyEntries[bodyEntries.length-1][1] : null
    const prevBody = bodyEntries.length > 1 ? bodyEntries[bodyEntries.length-2][1] : null

    // Trends: positive = improved
    const fatTrend = latestBody && prevBody && latestBody.bodyFat && prevBody.bodyFat ? (latestBody.bodyFat - prevBody.bodyFat).toFixed(1) : null
    const muscleTrend = latestBody && prevBody && latestBody.muscleMass && prevBody.muscleMass ? (latestBody.muscleMass - prevBody.muscleMass).toFixed(1) : null
    const leanTrend = latestBody && prevBody && latestBody.leanMass && prevBody.leanMass ? (latestBody.leanMass - prevBody.leanMass).toFixed(1) : null

    return (
      <div>
        {/* Header card - peso atual */}
        <div style={{ background:C.surface, borderRadius:14, padding:16, marginBottom:12, border:`0.5px solid ${C.border}` }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div style={{ fontSize:13, fontWeight:700, color:C.text }}>⚖️ Peso Corporal</div>
            <div style={{ display:'flex', gap:6 }}>
              <button onClick={()=>setShowWeightModal(true)} style={{ background:`linear-gradient(135deg,${C.gold},${C.gold2})`, border:'none', borderRadius:10, padding:'7px 12px', color:C.btnText, fontSize:11, cursor:'pointer', fontFamily:'inherit', fontWeight:700 }}>+ Registrar</button>
              <button onClick={()=>setShowRelaxFitModal(true)} style={{ background:C.surface2, border:`1px solid ${C.gold}60`, borderRadius:10, padding:'7px 12px', color:C.gold, fontSize:11, cursor:'pointer', fontFamily:'inherit', fontWeight:700 }}>📷 RelaxFit</button>
            </div>
          </div>
          {latestWeight ? (<>
            <div style={{ display:'flex', alignItems:'baseline', gap:10, marginBottom:10 }}>
              <span style={{ fontSize:40, fontWeight:800, fontFamily:'JetBrains Mono,monospace', color:C.text }}>{latestWeight}</span>
              <span style={{ fontSize:16, color:C.text2 }}>kg</span>
              {weightDiff !== null && (
                <span style={{ fontSize:13, fontWeight:700, color:parseFloat(weightDiff)<0?C.teal:parseFloat(weightDiff)>0?C.red:C.text2 }}>
                  {parseFloat(weightDiff)>0?'+':''}{weightDiff} kg
                </span>
              )}
            </div>
            {weightEntries.length >= 2 && (() => {
              const first = weightEntries[weightEntries.length-1][1]
              const last = weightEntries[0][1]
              const diff = (last - first).toFixed(1)
              return (
                <div style={{ display:'flex', gap:8 }}>
                  {[
                    { l:'INICIAL', v:`${first} kg` },
                    { l:'VARIAÇÃO', v:`${parseFloat(diff)>0?'+':''}${diff} kg`, c:parseFloat(diff)<0?C.teal:parseFloat(diff)>0?C.red:C.text2 },
                    { l:'REGISTROS', v:`${weightEntries.length}x` },
                  ].map(s => (
                    <div key={s.l} style={{ flex:1, background:C.bg, borderRadius:10, padding:'8px', textAlign:'center' }}>
                      <div style={{ fontSize:9, color:C.text2, marginBottom:3, fontFamily:'JetBrains Mono,monospace' }}>{s.l}</div>
                      <div style={{ fontSize:15, fontWeight:700, fontFamily:'JetBrains Mono,monospace', color:s.c||C.text }}>{s.v}</div>
                    </div>
                  ))}
                </div>
              )
            })()}
          </>) : (
            <div style={{ textAlign:'center', padding:'20px 0', color:C.text3, fontSize:13 }}>
              <div style={{ fontSize:32, marginBottom:8 }}>⚖️</div>
              Nenhum peso registrado.<br/>Use RelaxFit para importar!
            </div>
          )}
        </div>

        {/* Composição corporal atual */}
        {latestBody && (
          <div style={{ background:C.surface, borderRadius:14, padding:14, marginBottom:12, border:`0.5px solid ${C.border}` }}>
            <div style={{ fontSize:13, fontWeight:700, marginBottom:12, color:C.text }}>🧬 Composição Corporal</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
              {[
                { label:'% Gordura', val:latestBody.bodyFat, unit:'%', color:C.terra, trend:fatTrend, goodDown:true },
                { label:'% Músculo', val:latestBody.muscleMass, unit:'%', color:C.teal, trend:muscleTrend, goodDown:false },
                { label:'Massa Magra', val:latestBody.leanMass, unit:'kg', color:C.teal, trend:leanTrend, goodDown:false },
                { label:'% Água', val:latestBody.bodyWater, unit:'%', color:'#60a5fa', trend:null },
                { label:'Gordura Visceral', val:latestBody.visceralFat, unit:'', color:C.terra, trend:null },
                { label:'Massa Óssea', val:latestBody.boneMass, unit:'kg', color:C.text2, trend:null },
              ].filter(x => x.val).map(x => {
                const trendNum = x.trend ? parseFloat(x.trend) : 0
                const trendGood = x.goodDown ? trendNum < 0 : trendNum > 0
                const trendBad = x.goodDown ? trendNum > 0 : trendNum < 0
                return (
                  <div key={x.label} style={{ background:C.bg, borderRadius:10, padding:'10px 12px' }}>
                    <div style={{ fontSize:10, color:C.text2, marginBottom:4 }}>{x.label}</div>
                    <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
                      <span style={{ fontSize:20, fontWeight:800, fontFamily:'JetBrains Mono,monospace', color:x.color }}>{x.val}</span>
                      <span style={{ fontSize:11, color:C.text2 }}>{x.unit}</span>
                      {x.trend && <span style={{ fontSize:10, fontWeight:700, color:trendGood?C.teal:trendBad?C.red:C.text2 }}>
                        {trendNum>0?'+':''}{x.trend}
                      </span>}
                    </div>
                  </div>
                )
              })}
            </div>
            {[
              { label:'TMB', val:latestBody.bmr, unit:'kcal/dia' },
              { label:'Tipo de Corpo', val:latestBody.bodyType, unit:'' },
              { label:'Idade Corporal', val:latestBody.bodyAge, unit:'anos' },
            ].filter(x => x.val).length > 0 && (
              <div style={{ display:'flex', gap:8 }}>
                {[
                  { label:'TMB', val:latestBody.bmr, unit:'kcal' },
                  { label:'Idade Corp.', val:latestBody.bodyAge, unit:'anos' },
                  { label:'Tipo', val:latestBody.bodyType, unit:'' },
                ].filter(x => x.val).map(x => (
                  <div key={x.label} style={{ flex:1, background:C.bg, borderRadius:8, padding:'6px 8px', textAlign:'center' }}>
                    <div style={{ fontSize:8, color:C.text2, marginBottom:2 }}>{x.label}</div>
                    <div style={{ fontSize:12, fontWeight:700, color:C.gold, fontFamily:'JetBrains Mono,monospace' }}>{x.val} {x.unit}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Seletor de período para os gráficos */}
        {(weightEntries.length >= 2 || bodyEntries.length >= 2) && (
          <div style={{ display:'flex', gap:6, marginBottom:12 }}>
            {[
              { id:'30d', label:'30 dias' },
              { id:'90d', label:'90 dias' },
              { id:'180d', label:'6 meses' },
              { id:'all', label:'Tudo' },
            ].map(p => (
              <button key={p.id} onClick={()=>setPesoPeriod(p.id)}
                style={{ flex:1, padding:'8px 4px', border:'none', borderRadius:10, fontSize:11, fontWeight:pesoPeriod===p.id?700:400, cursor:'pointer', fontFamily:'inherit',
                  background: pesoPeriod===p.id ? `linear-gradient(135deg,${C.gold},${C.gold2})` : C.surface2,
                  color: pesoPeriod===p.id ? C.btnText : C.text2 }}>
                {p.label}
              </button>
            ))}
          </div>
        )}

        {/* Gráfico de peso */}
        {wVals.length >= 2 && (() => {
          const W=340, H=100, PL=8, PR=8, PT=12, PB=28
          const maxV = Math.max(...wVals)+0.5, minV = Math.min(...wVals)-0.5
          const cx = i => PL+(i/Math.max(wVals.length-1,1))*(W-PL-PR)
          const cy = v => PT+(1-(v-minV)/(maxV-minV))*(H-PT-PB)
          const trend = wVals[wVals.length-1] < wVals[0] ? C.teal : C.red
          const pts = wVals.map((v,i) => `${cx(i)},${cy(v)}`).join(' ')
          return (
            <div style={{ background:C.surface, borderRadius:14, padding:14, marginBottom:12, border:`0.5px solid ${C.border}` }}>
              <div style={{ fontSize:13, fontWeight:500, marginBottom:10, color:C.text }}>📈 Evolução do Peso</div>
              <svg viewBox={`0 0 ${W} ${H}`} style={{ width:'100%', height:H }}>
                <polyline points={pts} fill="none" stroke={trend} strokeWidth="2" strokeLinejoin="round"/>
                {wVals.map((v,i) => (
                  <g key={i}>
                    <circle cx={cx(i)} cy={cy(v)} r="4" fill={trend}/>
                    <text x={cx(i)} y={H-4} fontSize="8" fill={C.text2} textAnchor="middle" fontFamily="JetBrains Mono,monospace">
                      {chartEntries[i]?.[0]?.slice(5).replace('-','/')}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          )
        })()}

        {/* Gráfico % Gordura */}
        {bodyEntries.filter(([,d]) => d.bodyFat).length >= 2 && (() => {
          const fatEntries = bodyEntries.filter(([,d]) => d.bodyFat)
          const fVals = fatEntries.map(([,d]) => d.bodyFat)
          const W=340, H=80, PL=8, PR=8, PT=8, PB=24
          const maxV = Math.max(...fVals)+1, minV = Math.max(0, Math.min(...fVals)-1)
          const cx = i => PL+(i/Math.max(fVals.length-1,1))*(W-PL-PR)
          const cy = v => PT+(1-(v-minV)/(maxV-minV))*(H-PT-PB)
          const trend = fVals[fVals.length-1] < fVals[0] ? C.teal : C.terra
          const pts = fVals.map((v,i) => `${cx(i)},${cy(v)}`).join(' ')
          return (
            <div style={{ background:C.surface, borderRadius:14, padding:14, marginBottom:12, border:`0.5px solid ${C.border}` }}>
              <div style={{ fontSize:13, fontWeight:500, marginBottom:10, color:C.text }}>🔥 Evolução % Gordura</div>
              <svg viewBox={`0 0 ${W} ${H}`} style={{ width:'100%', height:H }}>
                <polyline points={pts} fill="none" stroke={trend} strokeWidth="2" strokeLinejoin="round"/>
                {fVals.map((v,i) => (
                  <g key={i}>
                    <circle cx={cx(i)} cy={cy(v)} r="4" fill={trend}/>
                    <text x={cx(i)} y={H-2} fontSize="7.5" fill={C.text2} textAnchor="middle" fontFamily="JetBrains Mono,monospace">
                      {fatEntries[i]?.[0]?.slice(5).replace('-','/')}
                    </text>
                    <text x={cx(i)} y={cy(v)-6} fontSize="7.5" fill={trend} textAnchor="middle" fontFamily="JetBrains Mono,monospace">{v}%</text>
                  </g>
                ))}
              </svg>
            </div>
          )
        })()}

        {/* Gráfico Massa Magra */}
        {bodyEntries.filter(([,d]) => d.leanMass).length >= 2 && (() => {
          const leanEntries = bodyEntries.filter(([,d]) => d.leanMass)
          const lVals = leanEntries.map(([,d]) => d.leanMass)
          const W=340, H=80, PL=8, PR=8, PT=8, PB=24
          const maxV = Math.max(...lVals)+0.5, minV = Math.min(...lVals)-0.5
          const cx = i => PL+(i/Math.max(lVals.length-1,1))*(W-PL-PR)
          const cy = v => PT+(1-(v-minV)/(maxV-minV))*(H-PT-PB)
          const trend = lVals[lVals.length-1] > lVals[0] ? C.teal : C.gold
          const pts = lVals.map((v,i) => `${cx(i)},${cy(v)}`).join(' ')
          return (
            <div style={{ background:C.surface, borderRadius:14, padding:14, marginBottom:12, border:`0.5px solid ${C.border}` }}>
              <div style={{ fontSize:13, fontWeight:500, marginBottom:10, color:C.text }}>💪 Evolução Massa Magra</div>
              <svg viewBox={`0 0 ${W} ${H}`} style={{ width:'100%', height:H }}>
                <polyline points={pts} fill="none" stroke={trend} strokeWidth="2" strokeLinejoin="round"/>
                {lVals.map((v,i) => (
                  <g key={i}>
                    <circle cx={cx(i)} cy={cy(v)} r="4" fill={trend}/>
                    <text x={cx(i)} y={H-2} fontSize="7.5" fill={C.text2} textAnchor="middle" fontFamily="JetBrains Mono,monospace">
                      {leanEntries[i]?.[0]?.slice(5).replace('-','/')}
                    </text>
                    <text x={cx(i)} y={cy(v)-6} fontSize="7.5" fill={trend} textAnchor="middle" fontFamily="JetBrains Mono,monospace">{v}kg</text>
                  </g>
                ))}
              </svg>
            </div>
          )
        })()}

        {/* Histórico completo */}
        <div style={{ background:C.surface, borderRadius:14, padding:14, border:`0.5px solid ${C.border}` }}>
          <div style={{ fontSize:13, fontWeight:500, marginBottom:12, color:C.text }}>Histórico</div>
          {weightEntries.length === 0 && <div style={{ textAlign:'center', padding:'16px 0', color:C.text3, fontSize:13 }}>Nenhum registro ainda</div>}
          {weightEntries.map(([date, val], idx) => {
            const prev = weightEntries[idx+1]?.[1]
            const diff = prev ? (val - prev).toFixed(1) : null
            const bd = bodyData[date]
            return (
              <div key={date} style={{ padding:'10px 0', borderBottom:idx<weightEntries.length-1?`0.5px solid ${C.border}`:'none' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:bd?6:0 }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:500, color:C.text }}>{formatDateFull(date)}</div>
                    {diff !== null && (
                      <div style={{ fontSize:11, color:parseFloat(diff)<0?C.teal:parseFloat(diff)>0?C.red:C.text2, marginTop:2 }}>
                        {parseFloat(diff)>0?'+':''}{diff} kg vs anterior
                      </div>
                    )}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:18, fontWeight:800, fontFamily:'JetBrains Mono,monospace', color:C.text }}>{val} kg</span>
                    <button onClick={()=>{ if(window.confirm('Remover?')){ const w={...weights}; delete w[date]; updateWeights(w) } }}
                      style={{ background:`${C.red}18`, border:'none', borderRadius:8, width:26, height:26, color:C.red, cursor:'pointer', fontSize:14 }}>×</button>
                  </div>
                </div>
                {bd && (
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:4 }}>
                    {[
                      { label:'Gordura', v:bd.bodyFat, u:'%', c:C.terra },
                      { label:'Músculo', v:bd.muscleMass, u:'%', c:C.teal },
                      { label:'Água', v:bd.bodyWater, u:'%', c:'#60a5fa' },
                      { label:'M.Magra', v:bd.leanMass, u:'kg', c:C.teal },
                      { label:'M.Gorda', v:bd.fatMass, u:'kg', c:C.terra },
                      { label:'TMB', v:bd.bmr, u:'kcal', c:C.amber },
                    ].filter(x=>x.v).map(x=>(
                      <div key={x.label} style={{ background:C.surface2, borderRadius:6, padding:'4px 6px', textAlign:'center' }}>
                        <div style={{ fontSize:8, color:C.text2 }}>{x.label}</div>
                        <div style={{ fontSize:11, fontWeight:700, color:x.c, fontFamily:'JetBrains Mono,monospace' }}>{x.v}{x.u}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }


  function renderAnalysis() {
    const today = todayKey()
    const allEntries=Object.entries(days).filter(([d])=>d!==today).sort(([a],[b])=>a.localeCompare(b))
    if(allEntries.length<2) return <div style={{ textAlign:'center', padding:'48px 20px', color:C.text3 }}><div style={{ fontSize:32, marginBottom:10 }}>📊</div><div style={{ fontSize:14 }}>Registre pelo menos 2 dias para ver análises</div></div>

    const hasTraining=(iso)=>(days[iso]?.activities||[]).length>0
    const toggleFilter=(id)=>{
      setAnalysisFilters(prev=>{
        const pF=['weekday','weekend'], tF=['training','notraining']
        if(prev.includes(id)) return prev.filter(f=>f!==id)
        let next=[...prev]
        if(pF.includes(id)) next=next.filter(f=>!pF.includes(f))
        if(tF.includes(id)) next=next.filter(f=>!tF.includes(f))
        return [...next,id]
      })
    }

    // Date range filter
    const dateFiltered=allEntries.filter(([d])=>{
      if(analysisDateFrom&&d<analysisDateFrom) return false
      if(analysisDateTo&&d>analysisDateTo) return false
      return true
    })

    const applyFilters=(entries,filters)=>entries.filter(([d])=>{
      if(filters.includes('weekday')&&!isWeekday(d)) return false
      if(filters.includes('weekend')&&!isWeekend(d)) return false
      if(filters.includes('training')&&!hasTraining(d)) return false
      if(filters.includes('notraining')&&hasTraining(d)) return false
      return true
    })
    const filteredEntries=applyFilters(dateFiltered,analysisFilters)
    const last14=filteredEntries.slice(-14)

    const avgMacros=(entries)=>{
      if(!entries.length) return {cal:0,prot:0,carb:0,fat:0,n:0}
      const sum=entries.reduce((a,[,d])=>{ const m=calcMacros(Object.values(d.meals||{}).flat(),allFoods); return {cal:a.cal+m.cal,prot:a.prot+m.prot,carb:a.carb+m.carb,fat:a.fat+m.fat} },{cal:0,prot:0,carb:0,fat:0})
      const n=entries.length
      return {cal:r0(sum.cal/n),prot:r0(sum.prot/n),carb:r0(sum.carb/n),fat:r0(sum.fat/n),n}
    }

    const avg=avgMacros(filteredEntries)
    const baseEntries=filteredEntries.length>0?filteredEntries:dateFiltered
    const compAll=avgMacros(dateFiltered)
    const compWd=avgMacros(baseEntries.filter(([d])=>isWeekday(d)))
    const compWe=avgMacros(baseEntries.filter(([d])=>isWeekend(d)))
    const compTr=avgMacros(baseEntries.filter(([d])=>hasTraining(d)))
    const compNo=avgMacros(baseEntries.filter(([d])=>!hasTraining(d)))

    // Use per-day targets for within/over/under
    const within=filteredEntries.filter(([d,dd])=>{ const t=getTargetsForDate(targets,targetsHistory,d); const m=calcMacros(Object.values(dd.meals||{}).flat(),allFoods); return m.cal>=t.min&&m.cal<=t.max })
    const over=filteredEntries.filter(([d,dd])=>{ const t=getTargetsForDate(targets,targetsHistory,d); const m=calcMacros(Object.values(dd.meals||{}).flat(),allFoods); return m.cal>t.max })
    const under=filteredEntries.filter(([d,dd])=>{ const t=getTargetsForDate(targets,targetsHistory,d); const m=calcMacros(Object.values(dd.meals||{}).flat(),allFoods); return m.cal<t.min&&m.cal>0 })

    const vals=last14.map(([,d])=>r0(calcMacros(Object.values(d.meals||{}).flat(),allFoods).cal))
    const maxV=vals.length?Math.max(...vals,activeTargets.max)*1.1:2000
    const W=340,H=110,PL=8,PR=8,PT=8,PB=36
    const cx=i=>PL+(i/Math.max(vals.length-1,1))*(W-PL-PR)
    const cy=v=>PT+(1-v/maxV)*(H-PT-PB)
    const pc=(v,date)=>{ const t=getTargetsForDate(targets,targetsHistory,date); return v>t.max?C.red:v<t.min?C.gold:C.teal }
    const pts=vals.map((v,i)=>`${cx(i)},${cy(v)}`).join(' ')

    const activeLabel=()=>{
      const parts=[]
      if(analysisFilters.includes('weekday')) parts.push('Seg–Sex')
      if(analysisFilters.includes('weekend')) parts.push('Fim de semana')
      if(analysisFilters.includes('training')) parts.push('com treino')
      if(analysisFilters.includes('notraining')) parts.push('sem treino')
      return parts.length?parts.join(' + '):'Todos os dias'
    }

    return (
      <div>
        {/* Date range filter */}
        <div style={{ background:C.surface, borderRadius:14, padding:12, marginBottom:12, border:`0.5px solid ${C.border}` }}>
          <div style={{ fontSize:11, color:C.text2, marginBottom:8, fontFamily:'JetBrains Mono,monospace' }}>📅 INTERVALO DE DATAS</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <div>
              <div style={{ fontSize:10, color:C.text2, marginBottom:4 }}>De</div>
              <input type="date" value={analysisDateFrom} onChange={e=>setAnalysisDateFrom(e.target.value)}
                style={{ width:'100%', background:C.surface2, border:`0.5px solid ${C.border}`, borderRadius:8, padding:'8px', color:C.text, fontSize:12, fontFamily:'inherit' }}/>
            </div>
            <div>
              <div style={{ fontSize:10, color:C.text2, marginBottom:4 }}>Até</div>
              <input type="date" value={analysisDateTo} onChange={e=>setAnalysisDateTo(e.target.value)}
                style={{ width:'100%', background:C.surface2, border:`0.5px solid ${C.border}`, borderRadius:8, padding:'8px', color:C.text, fontSize:12, fontFamily:'inherit' }}/>
            </div>
          </div>
          {(analysisDateFrom||analysisDateTo)&&<button onClick={()=>{ setAnalysisDateFrom(''); setAnalysisDateTo('') }}
            style={{ marginTop:8, fontSize:11, color:C.red, background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>✕ Limpar intervalo</button>}
          <div style={{ marginTop:6, fontSize:10, color:C.text3 }}>{dateFiltered.length} dias no intervalo selecionado</div>
        </div>

        {/* Filters */}
        <div style={{ background:C.surface, borderRadius:14, padding:12, marginBottom:12, border:`0.5px solid ${C.border}` }}>
          <div style={{ fontSize:11, color:C.text2, marginBottom:8, fontFamily:'JetBrains Mono,monospace' }}>FILTROS</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {[{id:'weekday',label:'💼 Seg–Sex'},{id:'weekend',label:'🎉 Fim de semana'},{id:'training',label:'💪 Com treino'},{id:'notraining',label:'🛋️ Sem treino'}].map(f=>{
              const active=analysisFilters.includes(f.id)
              return <button key={f.id} onClick={()=>toggleFilter(f.id)}
                style={{ padding:'6px 12px', borderRadius:20, border:`1.5px solid ${active?C.gold:C.border}`, background:active?`${C.gold}20`:'transparent', color:active?C.gold:C.text2, fontSize:11, fontWeight:active?700:400, cursor:'pointer', fontFamily:'inherit' }}>
                {f.label}{active?' ✓':''}
              </button>
            })}
            {analysisFilters.length>0&&<button onClick={()=>setAnalysisFilters([])} style={{ padding:'6px 12px', borderRadius:20, border:`1.5px solid ${C.red}40`, background:`${C.red}10`, color:C.red, fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>✕ Limpar</button>}
          </div>
          {analysisFilters.length>0&&<div style={{ marginTop:8, fontSize:11, color:C.gold, fontWeight:600 }}>Mostrando: {activeLabel()} — {filteredEntries.length} dias</div>}
        </div>

        {filteredEntries.length===0
          ?<div style={{ textAlign:'center', padding:'32px 20px', color:C.text3, background:C.surface, borderRadius:14, border:`0.5px solid ${C.border}` }}><div style={{ fontSize:28, marginBottom:8 }}>🔍</div>Nenhum dia com esses filtros</div>
          :(<>
          <div style={isWide?{ display:'flex', gap:20, alignItems:'flex-start' }:{}}>
          <div className="evo-col" style={isWide?{ flex:1, minWidth:0 }:{}}>
          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:12 }}>
            {[{label:'Na meta',count:within.length,color:C.teal},{label:'Excesso',count:over.length,color:C.red},{label:'Abaixo',count:under.length,color:C.gold}].map(s=>(
              <div key={s.label} style={{ background:C.surface, borderRadius:12, padding:'10px 8px', textAlign:'center', border:`0.5px solid ${C.border}` }}>
                <div style={{ fontSize:22, fontWeight:800, color:s.color, fontFamily:'JetBrains Mono,monospace' }}>{s.count}</div>
                <div style={{ fontSize:10, color:C.text2 }}>{s.label}</div>
                <div style={{ fontSize:9, color:C.text3, fontFamily:'JetBrains Mono,monospace' }}>/{filteredEntries.length}d</div>
              </div>
            ))}
          </div>

          {/* Average */}
          <div style={{ background:C.surface, borderRadius:14, padding:14, marginBottom:12, border:`0.5px solid ${C.border}` }}>
            <div style={{ fontSize:13, fontWeight:500, marginBottom:10, color:C.text }}>Média — {activeLabel()} ({filteredEntries.length} dias)</div>
            <div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:10 }}>
              <span style={{ fontSize:32, fontWeight:800, fontFamily:'JetBrains Mono,monospace', color:avg.cal>activeTargets.max?C.red:avg.cal>=activeTargets.min?C.teal:C.gold }}>{avg.cal}</span>
              <span style={{ fontSize:13, color:C.text2 }}>kcal/dia</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
              {[{l:'Proteína',v:avg.prot,c:C.teal,t:activeTargets.prot},{l:'Carb',v:avg.carb,c:C.gold2,t:activeTargets.carb},{l:'Gordura',v:avg.fat,c:C.terra,t:activeTargets.fat}].map(m=>(
                <div key={m.l} style={{ background:C.bg, borderRadius:10, padding:'8px' }}>
                  <div style={{ fontSize:9, color:C.text2, marginBottom:3 }}>{m.l}</div>
                  <div style={{ fontSize:13, fontWeight:700, color:m.c, fontFamily:'JetBrains Mono,monospace' }}>{m.v}g</div>
                  <div style={{ background:C.surface2, borderRadius:3, height:4, marginTop:4, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:Math.min(100,(m.v/m.t)*100)+'%', background:m.c }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chart */}
          {vals.length>=2&&<div style={{ background:C.surface, borderRadius:14, padding:14, marginBottom:12, border:`0.5px solid ${C.border}` }}>
            <div style={{ fontSize:13, fontWeight:500, marginBottom:10, color:C.text }}>Calorias — {activeLabel()}</div>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width:'100%', height:H }}>
              <line x1={PL} y1={cy(activeTargets.max)} x2={W-PR} y2={cy(activeTargets.max)} stroke={`${C.teal}40`} strokeWidth="1" strokeDasharray="3,3"/>
              <line x1={PL} y1={cy(activeTargets.min)} x2={W-PR} y2={cy(activeTargets.min)} stroke={`${C.gold}40`} strokeWidth="1" strokeDasharray="3,3"/>
              <line x1={PL} y1={cy(activeTargets.cal)} x2={W-PR} y2={cy(activeTargets.cal)} stroke={`${C.gold}60`} strokeWidth="1.5" strokeDasharray="5,4"/>
              <polyline points={pts} fill="none" stroke={`${C.gold}70`} strokeWidth="1.5" strokeLinejoin="round"/>
              {last14.map(([date],i)=><circle key={i} cx={cx(i)} cy={cy(vals[i])} r="4" fill={pc(vals[i],date)}/>)}
              {last14.map(([date],i)=>{
                const d=new Date(date+'T12:00:00')
                const label=`${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`
                const x=cx(i)
                // Show every label if <=7 points, else show every 2nd
                if(last14.length>7&&i%2!==0) return null
                return <text key={i} x={x} y={H-4} fontSize="7.5" fill={C.text2} textAnchor="middle" fontFamily="JetBrains Mono,monospace">{label}</text>
              })}
            </svg>
            <div style={{ display:'flex', gap:12, fontSize:10, color:C.text2, fontFamily:'JetBrains Mono,monospace', marginTop:6 }}>
              <span style={{ color:C.teal }}>● meta</span><span style={{ color:C.gold }}>● abaixo</span><span style={{ color:C.red }}>● excesso</span>
            </div>
          </div>}
          </div>
          <div className="evo-col" style={isWide?{ flex:1, minWidth:0 }:{}}>
          {/* Comparativo */}
          <div style={{ background:C.surface, borderRadius:14, padding:14, marginBottom:12, border:`0.5px solid ${C.border}` }}>
            <div style={{ fontSize:13, fontWeight:500, marginBottom:4, color:C.text }}>📊 Comparativo de médias</div>
            <div style={{ fontSize:10, color:C.text2, marginBottom:12 }}>{analysisFilters.length>0?`Dentro do filtro: ${activeLabel()}`:`Todos os ${dateFiltered.length} dias`}</div>
            {[{label:'📊 Geral',data:compAll,show:true},{label:'💼 Seg–Sex',data:compWd,show:!analysisFilters.includes('weekend')},{label:'🎉 Fim de semana',data:compWe,show:!analysisFilters.includes('weekday')},{label:'💪 Com treino',data:compTr,show:!analysisFilters.includes('notraining')},{label:'🛋️ Sem treino',data:compNo,show:!analysisFilters.includes('training')}].filter(row=>row.show&&row.data.n>0).map(row=>{
              const pct=Math.min(100,(row.data.cal/activeTargets.cal)*100)
              const col=row.data.cal>activeTargets.max?C.red:row.data.cal>=activeTargets.min?C.teal:C.gold
              return <div key={row.label} style={{ marginBottom:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
                  <span style={{ color:C.text2 }}>{row.label}</span>
                  <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11 }}>
                    <span style={{ color:col, fontWeight:700 }}>{row.data.cal} kcal</span>
                    <span style={{ color:C.text3 }}> ({row.data.n}d)</span>
                  </span>
                </div>
                <div style={{ background:C.surface2, borderRadius:3, height:6, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:pct+'%', background:col, borderRadius:3 }}/>
                </div>
              </div>
            })}
          </div>

          {/* Weight evolution */}
          {Object.keys(weights).length>=2&&(()=>{
            const wEntries=Object.entries(weights).sort(([a],[b])=>a.localeCompare(b))
            const wVals=wEntries.map(([,v])=>v)
            const lastW=wVals[wVals.length-1],firstW=wVals[0],totalDiff=(lastW-firstW).toFixed(1)
            const W2=340,H2=80,PL2=8,PR2=8,PT2=8,PB2=16
            const wMax=Math.max(...wVals)+1,wMin=Math.min(...wVals)-1
            const cx2=i=>PL2+(i/Math.max(wVals.length-1,1))*(W2-PL2-PR2)
            const cy2=v=>PT2+(1-(v-wMin)/(wMax-wMin))*(H2-PT2-PB2)
            const pts2=wVals.map((v,i)=>`${cx2(i)},${cy2(v)}`).join(' ')
            return <div style={{ background:C.surface, borderRadius:14, padding:14, marginBottom:12, border:`0.5px solid ${C.border}` }}>
              <div style={{ fontSize:13, fontWeight:500, marginBottom:4, color:C.text }}>⚖️ Evolução do peso</div>
              <div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:10 }}>
                <span style={{ fontSize:24, fontWeight:800, fontFamily:'JetBrains Mono,monospace', color:C.text }}>{lastW} kg</span>
                <span style={{ fontSize:12, fontWeight:700, color:parseFloat(totalDiff)<0?C.teal:parseFloat(totalDiff)>0?C.red:C.text2 }}>{parseFloat(totalDiff)>0?'+':''}{totalDiff} kg total</span>
              </div>
              <svg viewBox={`0 0 ${W2} ${H2}`} style={{ width:'100%', height:H2 }}>
                <polyline points={pts2} fill="none" stroke={C.teal} strokeWidth="2" strokeLinejoin="round"/>
                {wVals.map((v,i)=><circle key={i} cx={cx2(i)} cy={cy2(v)} r="4" fill={C.teal}/>)}
              </svg>
            </div>
          })()}

          </div>
          <div className="evo-col" style={isWide?{ flex:1, minWidth:0 }:{}}>
          {/* Insights */}
          {compTr.n>0&&compNo.n>0&&<div style={{ background:C.surface, borderRadius:14, padding:14, marginBottom:12, border:`0.5px solid ${C.border}` }}>
            <div style={{ fontSize:13, fontWeight:500, marginBottom:10, color:C.text }}>💡 Insights</div>
            <div style={{ background:C.bg, borderRadius:10, padding:'10px 12px', fontSize:12, color:C.text2, lineHeight:1.7 }}>
              {compTr.cal>compNo.cal?`💪 Com treino você come em média ${compTr.cal-compNo.cal} kcal a mais.`:`💪 Com treino você come em média ${compNo.cal-compTr.cal} kcal a menos.`}
              {compWe.n>0&&compWd.n>0&&!analysisFilters.includes('weekday')&&!analysisFilters.includes('weekend')&&<span style={{ display:'block', marginTop:6 }}>{compWe.cal>compWd.cal?`🎉 Fim de semana: +${compWe.cal-compWd.cal} kcal vs dias úteis.`:`🎉 Fim de semana: −${compWd.cal-compWe.cal} kcal vs dias úteis.`}</span>}
            </div>
          </div>}

          {/* Body composition cross-insights - 3 periods */}
          {(() => {
            const bdEntries = Object.entries(bodyData).sort(([a],[b]) => a.localeCompare(b))
            if (bdEntries.length < 1) return null

            // Helper to compute insights for a period
            const computeInsights = (startDate, endDate, latestBd, prevBd, periodLabel) => {
              const weightLatest = weights[endDate]
              const weightPrev = weights[startDate]
              const weightChange = weightLatest && weightPrev ? (weightLatest - weightPrev).toFixed(1) : null
              const fatChange = latestBd?.bodyFat && prevBd?.bodyFat ? (latestBd.bodyFat - prevBd.bodyFat).toFixed(1) : null
              const muscleChange = latestBd?.muscleMass && prevBd?.muscleMass ? (latestBd.muscleMass - prevBd.muscleMass).toFixed(1) : null
              const leanChange = latestBd?.leanMass && prevBd?.leanMass ? (latestBd.leanMass - prevBd.leanMass).toFixed(1) : null
              const entriesBetween = allEntries.filter(([d]) => d >= startDate && d <= endDate)
              const avgBetween = avgMacros(entriesBetween)
              const trainDays = entriesBetween.filter(([d]) => (days[d]?.activities||[]).length > 0).length
              const strengthDays = entriesBetween.filter(([d]) => (days[d]?.activities||[]).some(a => ACTIVITIES.find(x=>x.id===a)?.type==='strength')).length
              const cardioDays = entriesBetween.filter(([d]) => (days[d]?.activities||[]).some(a => ACTIVITIES.find(x=>x.id===a)?.type==='cardio')).length

              const ins = []

              // Weight insights
              if (weightChange) {
                const wNum = parseFloat(weightChange)
                if (wNum > 0.5 && avgBetween.cal > activeTargets.cal + 100)
                  ins.push({ icon:'⚠️', text:`Ganho de ${weightChange}kg — média de ${avgBetween.cal} kcal/dia (${avgBetween.cal - activeTargets.cal} kcal acima da meta).`, color:C.red })
                else if (wNum < -0.5 && avgBetween.cal <= activeTargets.max)
                  ins.push({ icon:'✅', text:`Perda de ${Math.abs(wNum).toFixed(1)}kg com média de ${avgBetween.cal} kcal/dia. Bom progresso!`, color:C.teal })
                else if (wNum > 0.3 && fatChange && parseFloat(fatChange) > 0)
                  ins.push({ icon:'🔴', text:`Peso (+${wNum}kg) e gordura (+${fatChange}%) subiram. Possível excesso calórico ou retenção hídrica.`, color:C.red })
                else if (wNum > 0.3 && muscleChange && parseFloat(muscleChange) > 0)
                  ins.push({ icon:'💪', text:`Peso subiu ${weightChange}kg mas músculo aumentou ${muscleChange}% — possível ganho de massa magra!`, color:C.teal })
                else if (Math.abs(wNum) < 0.3 && fatChange && parseFloat(fatChange) < -0.3 && muscleChange && parseFloat(muscleChange) > 0.3)
                  ins.push({ icon:'🎯', text:`Recomposição corporal! Peso estável mas gordura caiu ${fatChange}% e músculo subiu ${muscleChange}%.`, color:C.teal })
              }

              // Fat insights
              if (fatChange) {
                const fNum = parseFloat(fatChange)
                if (fNum < -0.5 && strengthDays >= 3)
                  ins.push({ icon:'🔥', text:`Gordura caiu ${Math.abs(fNum).toFixed(1)}% com ${strengthDays} treinos de força. Excelente!`, color:C.teal })
                else if (fNum > 0.5 && trainDays < 2)
                  ins.push({ icon:'⚠️', text:`Gordura subiu ${fNum}% — apenas ${trainDays} treino(s) no período. Mais atividade pode ajudar.`, color:C.amber })
              }

              // Lean mass insights
              if (leanChange) {
                const lNum = parseFloat(leanChange)
                if (lNum > 0.3 && strengthDays >= 3)
                  ins.push({ icon:'💪', text:`Massa magra +${leanChange}kg com ${strengthDays} treinos de força. Continue assim!`, color:C.teal })
                else if (lNum < -0.3 && avgBetween.prot < (activeTargets.protMin || 138))
                  ins.push({ icon:'🥩', text:`Massa magra caiu ${Math.abs(lNum).toFixed(1)}kg e proteína abaixo da meta (${avgBetween.prot}g vs ${activeTargets.protMin}g mín). Aumente a proteína!`, color:C.terra })
                else if (lNum < -0.3)
                  ins.push({ icon:'⚠️', text:`Massa magra caiu ${Math.abs(lNum).toFixed(1)}kg. Verifique proteína (média: ${avgBetween.prot}g) e frequência de treinos.`, color:C.amber })
              }

              // Protein insight
              if (avgBetween.n > 0 && avgBetween.prot < (activeTargets.protMin || 138))
                ins.push({ icon:'🥩', text:`Proteína abaixo da meta no período — média ${avgBetween.prot}g vs mínimo ${activeTargets.protMin}g.`, color:C.terra })

              // Training insights
              if (trainDays === 0 && entriesBetween.length >= 5)
                ins.push({ icon:'🛋️', text:`Nenhum treino registrado no período. Atividade física é fundamental para a composição corporal.`, color:C.amber })
              else if (strengthDays === 0 && entriesBetween.length >= 7)
                ins.push({ icon:'🏋️', text:`Sem musculação no período (${cardioDays} cardio). Treino de força ajuda a preservar massa magra.`, color:C.amber })

              // Calorie consistency
              if (avgBetween.n >= 5) {
                const daysOver = entriesBetween.filter(([d,dd]) => calcMacros(Object.values(dd.meals||{}).flat(),allFoods).cal > activeTargets.max).length
                if (daysOver > entriesBetween.length * 0.4)
                  ins.push({ icon:'📈', text:`${daysOver} de ${entriesBetween.length} dias acima da meta calórica (${Math.round(daysOver/entriesBetween.length*100)}%). Consistência é chave!`, color:C.amber })
              }

              return { ins, entriesBetween, trainDays, strengthDays, cardioDays, avgBetween, weightChange, fatChange, leanChange, startDate, endDate, periodLabel }
            }

            // Compute data for each period
            const latest = bdEntries[bdEntries.length-1]
            const prev = bdEntries.length >= 2 ? bdEntries[bdEntries.length-2] : null

            const todayD = todayKey()
            const d7 = new Date(); d7.setDate(d7.getDate()-7)
            const d30 = new Date(); d30.setDate(d30.getDate()-30)
            const date7 = `${d7.getFullYear()}-${String(d7.getMonth()+1).padStart(2,'0')}-${String(d7.getDate()).padStart(2,'0')}`
            const date30 = `${d30.getFullYear()}-${String(d30.getMonth()+1).padStart(2,'0')}-${String(d30.getDate()).padStart(2,'0')}`

            const bd7Start = [...bdEntries].reverse().find(([d]) => d <= date7)
            const bd30Start = [...bdEntries].reverse().find(([d]) => d <= date30)

            const periods = [
              { id:'last', label:'Última medição', available: prev !== null },
              { id:'7d', label:'7 dias', available: bd7Start !== null },
              { id:'30d', label:'30 dias', available: bd30Start !== null },
            ]

            let data = null
            if (insightPeriod === 'last' && prev) {
              data = computeInsights(prev[0], latest[0], latest[1], prev[1], `${prev[0]} → ${latest[0]}`)
            } else if (insightPeriod === '7d' && bd7Start) {
              data = computeInsights(bd7Start[0], latest[0], latest[1], bd7Start[1], 'últimos 7 dias')
            } else if (insightPeriod === '30d' && bd30Start) {
              data = computeInsights(bd30Start[0], latest[0], latest[1], bd30Start[1], 'últimos 30 dias')
            }

            return (
              <div style={{ background:C.surface, borderRadius:14, padding:14, marginBottom:12, border:`0.5px solid ${C.border}` }}>
                <div style={{ fontSize:13, fontWeight:500, marginBottom:12, color:C.text }}>🧬 Insights — Corpo + Dieta + Treino</div>

                {/* Period selector */}
                <div style={{ display:'flex', gap:6, marginBottom:14 }}>
                  {periods.map(p => (
                    <button key={p.id} onClick={()=>setInsightPeriod(p.id)} disabled={!p.available}
                      style={{ flex:1, padding:'7px 4px', border:'none', borderRadius:10, fontSize:10, fontWeight:insightPeriod===p.id?700:400, cursor:p.available?'pointer':'not-allowed', fontFamily:'inherit',
                        background: insightPeriod===p.id ? `linear-gradient(135deg,${C.gold},${C.gold2})` : C.surface2,
                        color: insightPeriod===p.id ? '#0d1a1f' : p.available ? C.text2 : C.text3 }}>
                      {p.label}
                    </button>
                  ))}
                </div>

                {data ? (<>
                  {/* Summary stats */}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, marginBottom:12 }}>
                    {[
                      { label:'Dias', v:data.entriesBetween.length, c:C.text },
                      { label:'Treinos', v:data.trainDays, c:C.gold },
                      { label:'Força', v:data.strengthDays, c:C.teal },
                      { label:'Cardio', v:data.cardioDays, c:C.amber },
                    ].map(s => (
                      <div key={s.label} style={{ background:C.bg, borderRadius:8, padding:'6px', textAlign:'center' }}>
                        <div style={{ fontSize:8, color:C.text2, marginBottom:2, fontFamily:'JetBrains Mono,monospace' }}>{s.label}</div>
                        <div style={{ fontSize:16, fontWeight:800, color:s.c, fontFamily:'JetBrains Mono,monospace' }}>{s.v}</div>
                      </div>
                    ))}
                  </div>

                  {/* Changes */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, marginBottom:12 }}>
                    {[
                      { label:'Peso', v:data.weightChange, u:'kg', goodDown:true },
                      { label:'% Gordura', v:data.fatChange, u:'%', goodDown:true },
                      { label:'M. Magra', v:data.leanChange, u:'kg', goodDown:false },
                    ].filter(x=>x.v!==null).map(s => {
                      const n = parseFloat(s.v)
                      const good = s.goodDown ? n < 0 : n > 0
                      const bad = s.goodDown ? n > 0.3 : n < -0.3
                      const col = good ? C.teal : bad ? C.red : C.text2
                      return (
                        <div key={s.label} style={{ background:C.bg, borderRadius:8, padding:'8px', textAlign:'center' }}>
                          <div style={{ fontSize:9, color:C.text2, marginBottom:3 }}>{s.label}</div>
                          <div style={{ fontSize:15, fontWeight:800, color:col, fontFamily:'JetBrains Mono,monospace' }}>
                            {n>0?'+':''}{s.v}{s.u}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Avg diet */}
                  {data.avgBetween.n > 0 && (
                    <div style={{ background:C.bg, borderRadius:8, padding:'8px 12px', marginBottom:12, display:'flex', gap:12, fontSize:11, fontFamily:'JetBrains Mono,monospace' }}>
                      <span style={{ color:C.gold }}>⚡ {data.avgBetween.cal} kcal/dia</span>
                      <span style={{ color:C.teal }}>P:{data.avgBetween.prot}g</span>
                      <span style={{ color:C.amber }}>C:{data.avgBetween.carb}g</span>
                      <span style={{ color:C.terra }}>G:{data.avgBetween.fat}g</span>
                    </div>
                  )}

                  {/* Insights */}
                  {data.ins.length > 0 ? data.ins.map((ins, i) => (
                    <div key={i} style={{ background:C.bg, borderRadius:10, padding:'10px 12px', marginBottom:8, borderLeft:`3px solid ${ins.color}` }}>
                      <span style={{ fontSize:14 }}>{ins.icon} </span>
                      <span style={{ fontSize:12, color:C.text2, lineHeight:1.6 }}>{ins.text}</span>
                    </div>
                  )) : (
                    <div style={{ textAlign:'center', padding:'12px 0', color:C.text3, fontSize:12 }}>
                      Sem dados suficientes para gerar insights neste período.
                    </div>
                  )}
                </>) : (
                  <div style={{ textAlign:'center', padding:'16px 0', color:C.text3, fontSize:12 }}>
                    {insightPeriod === 'last' ? 'Registre pelo menos 2 medições para ver insights.' :
                     insightPeriod === '7d' ? 'Sem medição há mais de 7 dias para comparar.' :
                     'Sem medição há mais de 30 dias para comparar.'}
                  </div>
                )}
              </div>
            )
          })()}

          </div>
        </div>

        {/* Comparativo Semanal - largura total abaixo */}
        <div style={{ marginTop:isWide?20:0 }}>
          {/* Weekly body composition + diet comparison */}
          {(() => {
            const CUTOFF = '2026-07-08' // start of body composition tracking

            // Get ISO week key (Monday-Sunday), returns the Monday date string
            const getMonday = (dateStr) => {
              const d = new Date(dateStr + 'T12:00:00')
              const day = d.getDay() // 0=Sun..6=Sat
              const diff = day === 0 ? -6 : 1 - day // shift to Monday
              d.setDate(d.getDate() + diff)
              return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
            }

            // Group body data by week (only from cutoff)
            const bodyByWeek = {}
            Object.entries(bodyData).filter(([d]) => d >= CUTOFF).forEach(([date, bd]) => {
              const wk = getMonday(date)
              if (!bodyByWeek[wk]) bodyByWeek[wk] = []
              bodyByWeek[wk].push({ date, ...bd })
            })

            // Group diet by week (only from cutoff)
            const dietByWeek = {}
            Object.entries(days).filter(([d]) => d >= CUTOFF && d !== today).forEach(([date, dd]) => {
              const wk = getMonday(date)
              const m = calcMacros(Object.values(dd.meals||{}).flat(), allFoods)
              if (m.cal <= 0) return
              if (!dietByWeek[wk]) dietByWeek[wk] = []
              dietByWeek[wk].push(m)
            })

            const allWeeks = [...new Set([...Object.keys(bodyByWeek), ...Object.keys(dietByWeek)])].sort()
            if (allWeeks.length === 0) return null

            const avg = (arr, key) => {
              const vals = arr.map(x => x[key]).filter(v => v != null && !isNaN(v))
              return vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : null
            }

            // Build week summaries
            const weekData = allWeeks.map((wk, i) => {
              const body = bodyByWeek[wk] || []
              const diet = dietByWeek[wk] || []
              const mondayD = new Date(wk + 'T12:00:00')
              const label = `${String(mondayD.getDate()).padStart(2,'0')}/${String(mondayD.getMonth()+1).padStart(2,'0')}`
              return {
                wk, label, weekNum: i+1,
                weight: avg(body, 'weight'),
                fatMass: avg(body, 'fatMass'),
                leanMass: avg(body, 'leanMass'),
                bodyFat: avg(body, 'bodyFat'),
                cal: diet.length ? Math.round(avg(diet, 'cal')) : null,
                prot: diet.length ? Math.round(avg(diet, 'prot')) : null,
                carb: diet.length ? Math.round(avg(diet, 'carb')) : null,
                fat: diet.length ? Math.round(avg(diet, 'fat')) : null,
                bodyDays: body.length,
                dietDays: diet.length,
              }
            })

            // Comparison bars component
            const CompareRow = ({ label, dataKey, unit, color, goodDown }) => {
              const vals = weekData.map(w => w[dataKey]).filter(v => v != null)
              if (vals.length === 0) return null
              const maxV = Math.max(...vals)
              const minV = Math.min(...vals) * 0.95
              return (
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:11, color:C.text2, marginBottom:6, fontWeight:600 }}>{label}</div>
                  {weekData.map((w, i) => {
                    const v = w[dataKey]
                    if (v == null) return (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                        <span style={{ fontSize:9, color:C.text3, width:52, fontFamily:'JetBrains Mono,monospace' }}>S{w.weekNum} {w.label}</span>
                        <span style={{ fontSize:10, color:C.text3 }}>—</span>
                      </div>
                    )
                    const pct = maxV > minV ? ((v - minV) / (maxV - minV)) * 100 : 50
                    const prev = i > 0 ? weekData[i-1][dataKey] : null
                    const delta = prev != null ? (v - prev) : null
                    const deltaGood = delta != null ? (goodDown ? delta < 0 : delta > 0) : null
                    return (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                        <span style={{ fontSize:9, color:C.text2, width:52, fontFamily:'JetBrains Mono,monospace', flexShrink:0 }}>S{w.weekNum} {w.label}</span>
                        <div style={{ flex:1, background:C.surface2, borderRadius:4, height:20, position:'relative', overflow:'hidden' }}>
                          <div style={{ height:'100%', width:Math.max(15,pct)+'%', background:color, borderRadius:4, transition:'width .3s' }}/>
                          <span style={{ position:'absolute', right:6, top:'50%', transform:'translateY(-50%)', fontSize:10, fontWeight:700, color:C.text, fontFamily:'JetBrains Mono,monospace' }}>
                            {typeof v === 'number' ? v.toFixed(dataKey==='cal'||dataKey==='prot'||dataKey==='carb'||dataKey==='fat'?0:1) : v}{unit}
                          </span>
                        </div>
                        {delta != null && Math.abs(delta) > 0.05 && (
                          <span style={{ fontSize:9, fontWeight:700, width:42, textAlign:'right', color:deltaGood?C.teal:C.red, fontFamily:'JetBrains Mono,monospace', flexShrink:0 }}>
                            {delta>0?'+':''}{delta.toFixed(dataKey==='cal'?0:1)}
                          </span>
                        )}
                        {(delta == null || Math.abs(delta) <= 0.05) && <span style={{ width:42, flexShrink:0 }}/>}
                      </div>
                    )
                  })}
                </div>
              )
            }

            return (
              <div style={{ background:C.surface, borderRadius:14, padding:14, marginBottom:12, border:`0.5px solid ${C.border}` }}>
                <div style={{ fontSize:13, fontWeight:500, marginBottom:4, color:C.text }}>📅 Comparativo Semanal</div>
                <div style={{ fontSize:10, color:C.text2, marginBottom:14, fontFamily:'JetBrains Mono,monospace' }}>
                  Seg–Dom · a partir de 08/07 · {weekData.length} semana(s)
                </div>

                {/* Body composition section */}
                <div style={{ fontSize:11, fontWeight:700, color:C.gold, marginBottom:10, fontFamily:'JetBrains Mono,monospace', textTransform:'uppercase', letterSpacing:1 }}>🧬 Composição Corporal</div>
                <div style={{ display:'grid', gridTemplateColumns:isWide?'1fr 1fr':'1fr', gap:isWide?24:0 }}>
                  <CompareRow label="Peso (kg)" dataKey="weight" unit="" color={C.gold} goodDown={true} />
                  <CompareRow label="% Gordura" dataKey="bodyFat" unit="%" color={C.terra} goodDown={true} />
                  <CompareRow label="Massa Gorda (kg)" dataKey="fatMass" unit="" color={C.terra} goodDown={true} />
                  <CompareRow label="Massa Magra (kg)" dataKey="leanMass" unit="" color={C.teal} goodDown={false} />
                </div>

                {/* Diet section */}
                <div style={{ fontSize:11, fontWeight:700, color:C.gold, margin:'18px 0 10px', fontFamily:'JetBrains Mono,monospace', textTransform:'uppercase', letterSpacing:1 }}>⚡ Dieta Média</div>
                <div style={{ display:'grid', gridTemplateColumns:isWide?'1fr 1fr':'1fr', gap:isWide?24:0 }}>
                  <CompareRow label="Calorias (kcal/dia)" dataKey="cal" unit="" color={C.gold} goodDown={false} />
                  <CompareRow label="Proteína (g/dia)" dataKey="prot" unit="" color={C.teal} goodDown={false} />
                  <CompareRow label="Carboidrato (g/dia)" dataKey="carb" unit="" color={C.gold2} goodDown={false} />
                  <CompareRow label="Gordura (g/dia)" dataKey="fat" unit="" color={C.terra} goodDown={false} />
                </div>

                <div style={{ fontSize:9, color:C.text3, marginTop:10, lineHeight:1.5, fontFamily:'JetBrains Mono,monospace' }}>
                  As setas mostram a variação vs semana anterior. Verde = melhora (peso/gordura ↓, massa magra ↑).
                </div>
              </div>
            )
          })()}

          {/* Weekly health (steps, sleep) comparison */}
          {Object.keys(healthData).length > 0 && (() => {
            const getMonday = (dateStr) => {
              const d = new Date(dateStr + 'T12:00:00')
              const day = d.getDay()
              const diff = day === 0 ? -6 : 1 - day
              d.setDate(d.getDate() + diff)
              return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
            }

            const byWeek = {}
            Object.entries(healthData).forEach(([date, hd]) => {
              const wk = getMonday(date)
              if (!byWeek[wk]) byWeek[wk] = { steps:[], sleep:[], score:[] }
              if (hd.steps) byWeek[wk].steps.push(hd.steps)
              if (hd.sleep) byWeek[wk].sleep.push(hd.sleep)
              if (hd.sleepScore) byWeek[wk].score.push(hd.sleepScore)
            })

            const weeks = Object.keys(byWeek).sort()
            if (weeks.length === 0) return null
            const avg = (arr) => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : null

            const weekData = weeks.map((wk, i) => {
              const mondayD = new Date(wk + 'T12:00:00')
              const label = `${String(mondayD.getDate()).padStart(2,'0')}/${String(mondayD.getMonth()+1).padStart(2,'0')}`
              return {
                weekNum: i+1, label,
                steps: byWeek[wk].steps.length ? Math.round(avg(byWeek[wk].steps)) : null,
                sleep: byWeek[wk].sleep.length ? Math.round(avg(byWeek[wk].sleep)*10)/10 : null,
                score: byWeek[wk].score.length ? Math.round(avg(byWeek[wk].score)) : null,
              }
            }).slice(-8) // last 8 weeks max

            const HealthRow = ({ label, dataKey, unit, color, fmt }) => {
              const vals = weekData.map(w => w[dataKey]).filter(v => v != null)
              if (vals.length === 0) return null
              const maxV = Math.max(...vals)
              const minV = Math.min(...vals) * 0.9
              return (
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:11, color:C.text2, marginBottom:6, fontWeight:600 }}>{label}</div>
                  {weekData.map((w, i) => {
                    const v = w[dataKey]
                    if (v == null) return null
                    const pct = maxV > minV ? ((v - minV) / (maxV - minV)) * 100 : 50
                    const prev = i > 0 ? weekData[i-1][dataKey] : null
                    const delta = prev != null ? (v - prev) : null
                    return (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                        <span style={{ fontSize:9, color:C.text2, width:52, fontFamily:'JetBrains Mono,monospace', flexShrink:0 }}>S{w.weekNum} {w.label}</span>
                        <div style={{ flex:1, background:C.surface2, borderRadius:4, height:20, position:'relative', overflow:'hidden' }}>
                          <div style={{ height:'100%', width:Math.max(15,pct)+'%', background:color, borderRadius:4 }}/>
                          <span style={{ position:'absolute', right:6, top:'50%', transform:'translateY(-50%)', fontSize:10, fontWeight:700, color:C.text, fontFamily:'JetBrains Mono,monospace' }}>{fmt?fmt(v):v}{unit}</span>
                        </div>
                        {delta != null && Math.abs(delta) > 0.05 && (
                          <span style={{ fontSize:9, fontWeight:700, width:42, textAlign:'right', color:delta>0?C.teal:C.red, fontFamily:'JetBrains Mono,monospace', flexShrink:0 }}>{delta>0?'+':''}{fmt?fmt(delta):Math.round(delta)}</span>
                        )}
                        {(delta == null || Math.abs(delta) <= 0.05) && <span style={{ width:42, flexShrink:0 }}/>}
                      </div>
                    )
                  })}
                </div>
              )
            }

            return (
              <div style={{ background:C.surface, borderRadius:14, padding:14, marginBottom:12, border:`0.5px solid ${C.border}` }}>
                <div style={{ fontSize:13, fontWeight:500, marginBottom:4, color:C.text }}>👟 Saúde Semanal</div>
                <div style={{ fontSize:10, color:C.text2, marginBottom:14, fontFamily:'JetBrains Mono,monospace' }}>
                  Passos, sono e nota · Seg–Dom · {weekData.length} semana(s)
                </div>
                <div style={{ display:'grid', gridTemplateColumns:isWide?'1fr 1fr 1fr':'1fr', gap:isWide?24:0 }}>
                  <HealthRow label="Passos (média/dia)" dataKey="steps" unit="" color={C.teal} fmt={v=>Math.round(v).toLocaleString()} />
                  <HealthRow label="Sono (horas/dia)" dataKey="sleep" unit="h" color="#8b7fd4" fmt={v=>v.toFixed(1)} />
                  <HealthRow label="Nota do Sono (0-100)" dataKey="score" unit="" color={C.gold} fmt={v=>Math.round(v)} />
                </div>
              </div>
            )
          })()}

          </div>
        </>)}
      </div>
    )
  }

  // ── FOODS ───────────────────────────────────────────────────────────────────
  function renderFoods() {
    const myFoods=customFoods.filter(c=>!DEFAULT_FOODS.find(f=>f.id===c.id))
    const filtMyFoods=myFoods.filter(f=>!foodSearch||f.name.toLowerCase().includes(foodSearch.toLowerCase()))
    const filtDefFoods=DEFAULT_FOODS.filter(f=>!foodSearch||(customFoods.find(c=>c.id===f.id)||f).name.toLowerCase().includes(foodSearch.toLowerCase()))

    if (registerMode) return (
      <div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <div style={{ fontSize:15, fontWeight:700, color:C.text }}>{editingFoodIdx!==null?'Editar Alimento':'Novo Alimento'}</div>
          <button onClick={()=>{ setRegisterMode(false); setEditingFoodIdx(null) }} style={{ background:'none', border:'none', cursor:'pointer', color:C.text2, fontSize:20 }}>×</button>
        </div>
        <div style={{ background:C.surface, borderRadius:14, padding:16, border:`0.5px solid ${C.border}` }}>
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:11, color:C.text2, fontWeight:500, marginBottom:4, display:'block' }}>Nome *</label>
            <input type="text" placeholder="Ex: Iogurte grego" value={newFood.name} onChange={e=>setNewFood(p=>({...p,name:e.target.value}))}
              style={{ width:'100%', background:C.surface2, border:`0.5px solid ${C.border}`, borderRadius:10, padding:'10px 12px', color:C.text, fontSize:14, fontFamily:'inherit' }}/>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
            <div>
              <label style={{ fontSize:11, color:C.text2, fontWeight:500, marginBottom:4, display:'block' }}>Unidade *</label>
              <select value={newFood.unit} onChange={e=>setNewFood(p=>({...p,unit:e.target.value}))}
                style={{ width:'100%', background:C.surface2, border:`0.5px solid ${C.border}`, borderRadius:10, padding:'10px', color:C.text, fontSize:13, fontFamily:'inherit' }}>
                {['g','ml','unid','dose','porção'].map(u=><option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:11, color:C.text2, fontWeight:500, marginBottom:4, display:'block' }}>Qtd padrão</label>
              <input type="number" value={newFood.def} onChange={e=>setNewFood(p=>({...p,def:e.target.value}))}
                style={{ width:'100%', background:C.surface2, border:`0.5px solid ${C.border}`, borderRadius:10, padding:'10px', color:C.text, fontSize:13, fontFamily:'inherit' }}/>
            </div>
          </div>
          <div style={{ background:C.bg, borderRadius:10, padding:12, marginBottom:12 }}>
            <div style={{ fontSize:10, color:C.text2, fontFamily:'JetBrains Mono,monospace', marginBottom:8 }}>MACROS POR 100g/ml OU POR UNIDADE *</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {[{k:'cal',l:'Calorias (kcal)',c:C.gold},{k:'prot',l:'Proteína (g)',c:C.teal},{k:'carb',l:'Carb (g)',c:C.gold2},{k:'fat',l:'Gordura (g)',c:C.terra}].map(f=>(
                <div key={f.k}>
                  <label style={{ fontSize:11, color:f.c, fontWeight:500, marginBottom:4, display:'block' }}>{f.l}</label>
                  <input type="number" placeholder="0" value={newFood[f.k]} onChange={e=>setNewFood(p=>({...p,[f.k]:e.target.value}))}
                    style={{ width:'100%', background:C.surface2, border:`0.5px solid ${C.border}`, borderRadius:10, padding:'8px', color:C.text, fontSize:13, fontFamily:'inherit' }}/>
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:11, color:C.text2, fontWeight:500, marginBottom:6, display:'block' }}>Favorito em qual refeição?</label>
            <div>{MEALS.map(m=>(
              <span key={m.id} onClick={()=>setNewFood(p=>({...p,fav:p.fav.includes(m.id)?p.fav.filter(x=>x!==m.id):[...p.fav,m.id]}))}
                style={{ display:'inline-block', padding:'2px 8px', borderRadius:20, fontSize:10, cursor:'pointer', margin:'2px', border:'0.5px solid', borderColor:newFood.fav.includes(m.id)?C.gold:C.border, color:newFood.fav.includes(m.id)?C.gold:C.text2, background:newFood.fav.includes(m.id)?`${C.gold}20`:'transparent' }}>
                {m.icon} {m.short}
              </span>
            ))}</div>
          </div>
          <button onClick={()=>{
            if(!newFood.name||newFood.cal==='') return alert('Preencha nome e calorias.')
            const foodData={ name:newFood.name, fav:newFood.fav, cal:parseFloat(newFood.cal)||0, prot:parseFloat(newFood.prot)||0, carb:parseFloat(newFood.carb)||0, fat:parseFloat(newFood.fat)||0, unit:newFood.unit, def:parseFloat(newFood.def)||100 }
            if(editingFoodIdx!==null&&String(editingFoodIdx).startsWith('default_')) {
              const defId=String(editingFoodIdx).replace('default_','')
              const exists=customFoods.find(c=>c.id===defId)
              if(exists) updateCustomFoods(customFoods.map(c=>c.id===defId?{...c,...foodData}:c))
              else updateCustomFoods([...customFoods,{id:defId,...foodData}])
            } else if(editingFoodIdx!==null) {
              updateCustomFoods(customFoods.map((f,i)=>i===editingFoodIdx?{...f,...foodData}:f))
            } else {
              updateCustomFoods([...customFoods,{id:'custom_'+Date.now(),...foodData}])
            }
            setRegisterMode(false); setEditingFoodIdx(null); setNewFood({name:'',cal:'',prot:'',carb:'',fat:'',unit:'g',def:'100',fav:[]})
          }} style={{ width:'100%', padding:12, background:`linear-gradient(135deg,${C.gold},${C.gold2})`, border:'none', borderRadius:12, color:C.btnText, cursor:'pointer', fontFamily:'inherit', fontWeight:700, fontSize:14 }}>
            {editingFoodIdx!==null?'Salvar alterações':'Salvar alimento'}
          </button>
        </div>
      </div>
    )

    return (
      <div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
          <div style={{ fontSize:15, fontWeight:700, color:C.text }}>Alimentos</div>
          <button onClick={()=>{ setEditingFoodIdx(null); setNewFood({name:'',cal:'',prot:'',carb:'',fat:'',unit:'g',def:'100',fav:[]}); setRegisterMode(true) }}
            style={{ background:`linear-gradient(135deg,${C.gold},${C.gold2})`, border:'none', borderRadius:10, padding:'7px 12px', color:C.btnText, fontSize:12, cursor:'pointer', fontFamily:'inherit', fontWeight:700 }}>+ Novo</button>
        </div>
        <input value={foodSearch} onChange={e=>setFoodSearch(e.target.value)} placeholder="🔍 Buscar na lista..."
          style={{ width:'100%', background:C.surface2, border:`0.5px solid ${C.border}`, borderRadius:10, padding:'10px 12px', color:C.text, fontSize:13, fontFamily:'inherit', marginBottom:14 }}/>
        {filtMyFoods.length>0&&(<>
          <div style={{ fontSize:10, fontWeight:700, color:C.text2, textTransform:'uppercase', letterSpacing:1, margin:'0 0 8px', fontFamily:'JetBrains Mono,monospace' }}>Meus alimentos ({filtMyFoods.length})</div>
          {filtMyFoods.map((f,idx)=>(
            <div key={f.id} style={{ background:C.surface, borderRadius:12, padding:'10px 12px', marginBottom:7, display:'flex', alignItems:'center', gap:8, border:`0.5px solid ${C.border}` }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', color:C.text }}>{f.name}</div>
                <div style={{ fontSize:10, color:C.text2, fontFamily:'JetBrains Mono,monospace', marginTop:1 }}>{f.cal} kcal · P:{f.prot}g · C:{f.carb}g · G:{f.fat}g / {f.unit}</div>
              </div>
              <button onClick={()=>{ const ri=customFoods.findIndex(c=>c.id===f.id); setEditingFoodIdx(ri); setNewFood({name:f.name,cal:String(f.cal),prot:String(f.prot),carb:String(f.carb),fat:String(f.fat),unit:f.unit,def:String(f.def),fav:f.fav||[]}); setRegisterMode(true) }}
                style={{ background:`${C.gold}20`, border:'none', borderRadius:8, width:28, height:28, color:C.gold, cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>✎</button>
              <button onClick={()=>{ if(window.confirm('Remover?')) updateCustomFoods(customFoods.filter(c=>c.id!==f.id)) }}
                style={{ background:`${C.red}20`, border:'none', borderRadius:8, width:28, height:28, color:C.red, cursor:'pointer', fontSize:16 }}>×</button>
            </div>
          ))}
        </>)}
        <div style={{ fontSize:10, fontWeight:700, color:C.text2, textTransform:'uppercase', letterSpacing:1, margin:'12px 0 8px', fontFamily:'JetBrains Mono,monospace' }}>Base padrão ({filtDefFoods.length})</div>
        {filtDefFoods.map(f=>{
          const override=customFoods.find(c=>c.id===f.id); const display=override||f
          return <div key={f.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 0', borderBottom:`0.5px solid ${C.border}` }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12, fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', color:C.text }}>
                {display.name}
                {override&&<span style={{ marginLeft:6, fontSize:9, color:C.gold, background:`${C.gold}20`, padding:'1px 5px', borderRadius:8 }}>editado</span>}
              </div>
              <div style={{ fontSize:10, color:C.text2, fontFamily:'JetBrains Mono,monospace' }}>{display.cal} kcal · P:{display.prot}g · C:{display.carb}g · G:{display.fat}g / {display.unit}</div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:4 }}>
              {override&&<button onClick={()=>{ if(window.confirm('Restaurar valores originais?')) updateCustomFoods(customFoods.filter(c=>c.id!==f.id)) }}
                style={{ background:`${C.gold2}20`, border:'none', borderRadius:8, width:28, height:28, color:C.gold2, cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>↺</button>}
              <button onClick={()=>{ setEditingFoodIdx('default_'+f.id); setNewFood({name:display.name,cal:String(display.cal),prot:String(display.prot),carb:String(display.carb),fat:String(display.fat),unit:display.unit,def:String(display.def),fav:display.fav||[]}); setRegisterMode(true) }}
                style={{ background:`${C.gold}20`, border:'none', borderRadius:8, width:28, height:28, color:C.gold, cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>✎</button>
              <div style={{ fontSize:11 }}>{(display.fav||[]).map(id=>{ const m=MEALS.find(x=>x.id===id); return m?m.icon:'' }).join('')}</div>
            </div>
          </div>
        })}
      </div>
    )
  }
}

// ── FOOD ROW ─────────────────────────────────────────────────────────────────
function FoodRow({ food:f, onAdd, mealId, C, onToggleFav }) {
  const [qty, setQty] = useState(f.def)
  useEffect(()=>{ setQty(f.def) },[mealId,f.id,f.def])
  const fixed=['unid','dose','porção'].includes(f.unit)
  const m=fixed?qty:qty/100
  const isFav = f.fav && f.fav.includes(mealId)
  return (
    <div style={{ padding:'10px 0', borderBottom:`0.5px solid ${C.border}` }}>
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        {onToggleFav && (
          <button onClick={()=>onToggleFav(f.id, mealId)} title={isFav?'Remover dos favoritos':'Marcar como favorito desta refeição'}
            style={{ background:'none', border:'none', cursor:'pointer', fontSize:15, padding:0, flexShrink:0, opacity:isFav?1:0.3, filter:isFav?'none':'grayscale(1)' }}>
            {isFav?'⭐':'☆'}
          </button>
        )}
        <div style={{ fontSize:13, fontWeight:600, lineHeight:1.3, color:C.text, flex:1 }}>{f.name}</div>
      </div>
      {f.note&&<div style={{ fontSize:11, color:C.text2, marginTop:1 }}>{f.note}</div>}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:6 }}>
        <div style={{ fontSize:11, color:C.text2, fontFamily:'JetBrains Mono,monospace', flex:1 }}>{Math.round(f.cal*m)} kcal · P:{Math.round(f.prot*m*10)/10}g · C:{Math.round(f.carb*m*10)/10}g · G:{Math.round(f.fat*m*10)/10}g</div>
        <input type="number" value={qty} onChange={e=>setQty(parseFloat(e.target.value)||0)}
          style={{ width:52, textAlign:'center', fontFamily:'JetBrains Mono,monospace', fontSize:13, padding:'5px 4px', border:`0.5px solid ${C.border}`, borderRadius:8, background:C.surface2, color:C.text }}/>
        <span style={{ fontSize:10, color:C.text2, minWidth:26 }}>{f.unit}</span>
        <button onClick={()=>onAdd(f.id,qty)} style={{ background:`linear-gradient(135deg,${C.gold},${C.gold2})`, border:'none', borderRadius:10, padding:'7px 14px', color:C.btnText, fontSize:12, cursor:'pointer', fontWeight:700, fontFamily:'inherit', flexShrink:0 }}>Add</button>
      </div>
    </div>
  )
}

// ── LOGIN ─────────────────────────────────────────────────────────────────────
function LoginScreen() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  async function handleLogin() { setLoading(true); setError(''); try{ await loginWithGoogle() }catch(e){ setError('Erro ao fazer login. Tente novamente.'); setLoading(false) } }
  return (
    <div style={{ minHeight:'100vh', background:'#0d1a1f', display:'flex', alignItems:'center', justifyContent:'center', padding:24, fontFamily:"'Syne',system-ui,sans-serif" }}>
      <div style={{ maxWidth:360, width:'100%', textAlign:'center' }}>
        <img src="/icon-512.png" alt="EvoShape" style={{ width:120, height:120, borderRadius:28, marginBottom:20, boxShadow:'0 8px 40px #c8873a50, 0 0 80px #2ab8b820' }}/>
        <div style={{ fontSize:28, fontWeight:800, color:'#f0e8d8', lineHeight:1.2, marginBottom:6, letterSpacing:-0.5 }}>EvoShape</div>
        <div style={{ fontSize:13, color:'#7a9aa8', lineHeight:1.5, letterSpacing:1, marginBottom:40 }}>DIETA · TREINO · PESO · EVOLUÇÃO</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:40 }}>
          {[{label:'Dieta',color:'#c8873a',icon:'🥗'},{label:'Treino',color:'#2ab8b8',icon:'💪'},{label:'Evolução',color:'#e8a040',icon:'📈'}].map(s=>(
            <div key={s.label} style={{ background:'#122028', borderRadius:12, padding:'14px 8px', border:'0.5px solid #1e3540' }}>
              <div style={{ fontSize:22, marginBottom:4 }}>{s.icon}</div>
              <div style={{ fontSize:11, color:s.color, fontWeight:600 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <button onClick={handleLogin} disabled={loading}
          style={{ width:'100%', padding:'14px 20px', background:loading?'#1a2d35':'#fff', border:'none', borderRadius:14, cursor:loading?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:12, fontSize:15, fontWeight:700, fontFamily:'inherit', color:loading?'#7a9aa8':'#1a1a1a' }}>
          {!loading&&<svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>}
          {loading?'Entrando...':'Entrar com Google'}
        </button>
        {error&&<div style={{ marginTop:12, fontSize:12, color:'#e05555' }}>{error}</div>}
        <div style={{ marginTop:20, fontSize:11, color:'#3d5a68', lineHeight:1.5 }}>Seus dados ficam salvos na nuvem e sincronizados entre todos os seus dispositivos</div>
      </div>
    </div>
  )
}

// ── WEIGHT MODAL ──────────────────────────────────────────────────────────────
function RelaxFitModal({ C, onSave, onClose }) {
  const [img, setImg] = useState(null)
  const [parsing, setParsing] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0,10))

  function parseRelaxFitImage(imgElement) {
    // Use canvas to read text via pixel analysis - but since we can't do OCR in browser
    // we use a form-based approach where user confirms extracted values
    return null
  }

  function extractFromText(text) {
    const out = {}
    const full = text.replace(/\r/g, '').replace(/[ \t]+/g, ' ')

    // ── Strategy 1: label-based matching (tolerant to OCR noise) ──
    // Fuzzy labels handle common OCR errors (MANSA→MASSA, etc.) via loose patterns
    const defs = [
      { key:'weight',         re:/Peso\s+(\d+[.,]?\d*)\s*kg/i },
      { key:'bmi',            re:/(?:IMC|BMI)\s*(?:IMC)?\s*(\d+[.,]?\d*)/i },
      { key:'bodyFat',        re:/Gordura corpora\w*\s+(\d+[.,]?\d*)\s*%/i },
      { key:'muscleMass',     re:/Taxa musc\w*\s+(\d+[.,]?\d*)\s*%/i },
      { key:'leanMass',       re:/Corporal? Magra\s+(\d+[.,]?\d*)\s*kg/i },
      { key:'subcutFat',      re:/Subcut[aâ]?\w*\s+(\d+[.,]?\d*)\s*%/i },
      { key:'visceralFat',    re:/\w*\s*Visceral\s+(\d+[.,]?\d*)/i },
      { key:'bodyWater',      re:/[ÁA]gua Corpora\w*\s+(\d+[.,]?\d*)\s*%/i },
      { key:'skeletalMuscle', re:/Esquel[eé]?\w*\s+(\d+[.,]?\d*)\s*%/i },
      { key:'muscleMassKg',   re:/M[a2]n?ssa Musc\w*\s+(\d+[.,]?\d*)\s*kg/i },
      { key:'boneMass',       re:/M[a2]n?ssa [ÓO]ss\w*\s+(\d+[.,]?\d*)\s*kg/i },
      { key:'protein',        re:/Prote[íi]?\w*\s+(\d+[.,]?\d*)\s*%/i },
      { key:'bmr',            re:/TMB\s+(\d+[.,]?\d*)\s*kcal/i },
      { key:'bodyAge',        re:/Idade do corpo\s+(\d+)/i },
      { key:'fatMass',        re:/M[a2]n?ssa Gorda\s+(\d+[.,]?\d*)\s*kg/i },
      { key:'waterMass',      re:/Peso da [ÁA]gua\s+(\d+[.,]?\d*)\s*kg/i },
      { key:'proteinMass',    re:/M[a2]n?ssa de Prote[íi]?\w*\s+(\d+[.,]?\d*)\s*kg/i },
    ]
    defs.forEach(({ key, re }) => {
      const m = full.match(re)
      if (m) { const v = parseFloat(m[1].replace(',', '.')); if (!isNaN(v)) out[key] = v }
    })

    // ── Strategy 2: sequential fallback for missing fields ──
    // The RelaxFit body-index block always lists values in this exact order & unit.
    // We extract all number+unit tokens from the block and fill any gaps by position.
    const SEQUENCE = [
      { key:'weight',        unit:'kg'   },
      { key:'bmi',           unit:'none' },
      { key:'bodyFat',       unit:'%'    },
      { key:'muscleMass',    unit:'%'    },
      { key:'leanMass',      unit:'kg'   },
      { key:'subcutFat',     unit:'%'    },
      { key:'visceralFat',   unit:'none' },
      { key:'bodyWater',     unit:'%'    },
      { key:'skeletalMuscle',unit:'%'    },
      { key:'muscleMassKg',  unit:'kg'   },
      { key:'boneMass',      unit:'kg'   },
      { key:'protein',       unit:'%'    },
      { key:'bmr',           unit:'kcal' },
      { key:'bodyAge',       unit:'none' },
      { key:'fatMass',       unit:'kg'   },
      { key:'waterMass',     unit:'kg'   },
      { key:'proteinMass',   unit:'kg'   },
    ]

    // Isolate the body-index block (starts near "Indice corporal" or first "Peso ... kg")
    let block = full
    const idxSec = full.search(/[ÍIíi]ndice corporal/i)
    if (idxSec >= 0) block = full.slice(idxSec)
    else {
      const p = full.search(/Peso\s+\d+[.,]?\d*\s*kg/i)
      if (p >= 0) block = full.slice(p)
    }

    // Collect tokens in order, de-duplicating consecutive repeats (from slice overlap)
    const tokenRe = /(\d+[.,]?\d*)\s*(kg|kcal|%)?/gi
    const tokens = []
    let mm
    while ((mm = tokenRe.exec(block)) !== null) {
      const val = parseFloat(mm[1].replace(',', '.'))
      if (isNaN(val)) continue
      let unit = (mm[2] || '').toLowerCase()
      if (!unit) unit = 'none'
      // skip obvious noise: the "-10.7 kg" segment values and "114.8 %" appear BEFORE
      // the index block, so block slicing already excludes them
      const last = tokens[tokens.length-1]
      if (last && last.val === val && last.unit === unit) continue // dedupe overlap
      tokens.push({ val, unit })
    }

    // Walk sequence; for each field find next token matching its unit
    let ti = 0
    for (const field of SEQUENCE) {
      let matchedIdx = -1
      for (let k = ti; k < tokens.length; k++) {
        if (tokens[k].unit === field.unit) { matchedIdx = k; break }
      }
      if (matchedIdx >= 0) {
        // Only fill if label strategy missed it
        if (out[field.key] === undefined) out[field.key] = tokens[matchedIdx].val
        ti = matchedIdx + 1
      }
    }

    // Body type (textual)
    const btMatch = full.match(/Tipo de corpo\s+([A-Za-zÀ-ú]{4,})/i)
    if (btMatch) out.bodyType = btMatch[1]

    return out
  }

  async function handleImage(file) {
    if (!file) return
    setParsing(true)
    setError('')
    setResult(null)

    const reader = new FileReader()
    reader.onload = async (e) => {
      const dataUrl = e.target.result
      setImg(dataUrl)

      try {
        // Split tall image into overlapping slices so OCR reads everything
        const slices = await sliceImage(dataUrl)
        console.log('Image split into', slices.length, 'slices')

        const OCR_KEY = 'K83530470088957' // chave própria OCR.space (25.000 leituras/mês)
        let fullText = ''
        for (let i = 0; i < slices.length; i++) {
          // Delay between requests to avoid 429 rate limiting
          if (i > 0) await new Promise(r => setTimeout(r, 600))

          try {
            const formData = new FormData()
            formData.append('base64Image', slices[i])
            formData.append('language', 'por')
            formData.append('OCREngine', '2')
            formData.append('scale', 'true')
            formData.append('isTable', 'true')

            const resp = await fetch('https://api.ocr.space/parse/image', {
              method: 'POST',
              headers: { 'apikey': OCR_KEY },
              body: formData,
            })

            if (resp.status === 429) {
              // Rate limited - wait longer and retry once
              await new Promise(r => setTimeout(r, 3000))
              const retry = await fetch('https://api.ocr.space/parse/image', {
                method: 'POST', headers: { 'apikey': OCR_KEY }, body: formData,
              })
              const rdata = await retry.json()
              if (!rdata.IsErroredOnProcessing) {
                fullText += '\n' + (rdata.ParsedResults?.[0]?.ParsedText || '')
              }
              continue
            }

            const data = await resp.json()
            if (data.IsErroredOnProcessing) {
              console.warn('Slice', i, 'error:', data.ErrorMessage)
              continue
            }
            const t = data.ParsedResults?.[0]?.ParsedText || ''
            fullText += '\n' + t
          } catch(sliceErr) {
            console.warn('Slice', i, 'fetch error:', sliceErr)
          }
        }

        console.log('=== OCR FULL TEXT ===\n' + fullText + '\n===============')

        const extracted = extractFromText(fullText)
        console.log('Extracted:', extracted)

        if (Object.keys(extracted).length >= 2) {
          setResult(extracted)
          setError(Object.keys(extracted).length < 10 ? '⚠️ Alguns campos podem não ter sido lidos. Confira abaixo.' : '')
        } else {
          setError('Não consegui ler os dados. Preencha manualmente.')
          setResult({})
        }
      } catch(err) {
        console.error('OCR error:', err)
        setError('Erro ao ler imagem: ' + err.message + '. Preencha manualmente.')
        setResult({})
      }
      setParsing(false)
    }
    reader.readAsDataURL(file)
  }

  // Slice a tall image into overlapping horizontal bands, each compressed under 1MB
  function sliceImage(dataUrl) {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const iw = img.naturalWidth
        const ih = img.naturalHeight
        const aspect = ih / iw

        // If image is not very tall, just send whole thing
        if (aspect < 3) {
          const c = document.createElement('canvas')
          const scale = Math.min(1, 1500 / iw)
          c.width = iw * scale
          c.height = ih * scale
          const ctx = c.getContext('2d')
          ctx.fillStyle = '#fff'; ctx.fillRect(0,0,c.width,c.height)
          ctx.drawImage(img, 0, 0, c.width, c.height)
          let q = 0.9, r = c.toDataURL('image/jpeg', q)
          while (r.length > 1024*1024 && q > 0.3) { q -= 0.15; r = c.toDataURL('image/jpeg', q) }
          return resolve([r])
        }

        // Tall image: split into fewer, taller slices to minimize API calls
        const numSlices = Math.min(3, Math.ceil(aspect / 2.5)) // max 3 slices
        const sliceHeight = Math.ceil(ih / numSlices)
        const overlap = Math.floor(sliceHeight * 0.12) // 12% overlap to not cut text
        const slices = []

        for (let i = 0; i < numSlices; i++) {
          const y0 = Math.max(0, i * sliceHeight - overlap)
          const y1 = Math.min(ih, (i+1) * sliceHeight + overlap)
          const sh = y1 - y0

          const c = document.createElement('canvas')
          // Upscale narrow images for better OCR accuracy
          const scale = Math.min(2, 1500 / iw)
          c.width = Math.floor(iw * scale)
          c.height = Math.floor(sh * scale)
          const ctx = c.getContext('2d')
          ctx.fillStyle = '#fff'; ctx.fillRect(0,0,c.width,c.height)
          ctx.drawImage(img, 0, y0, iw, sh, 0, 0, c.width, c.height)

          let q = 0.9, r = c.toDataURL('image/jpeg', q)
          while (r.length > 1024*1024 && q > 0.3) { q -= 0.15; r = c.toDataURL('image/jpeg', q) }
          slices.push(r)
        }
        resolve(slices)
      }
      img.onerror = () => resolve([dataUrl])
      img.src = dataUrl
    })
  }



  const fields = [
    { key: 'weight', label: 'Peso (kg)', color: C.gold },
    { key: 'bmi', label: 'IMC', color: C.text2 },
    { key: 'bodyFat', label: '% Gordura Corporal', color: C.terra },
    { key: 'muscleMass', label: '% Taxa Muscular', color: C.teal },
    { key: 'leanMass', label: 'Massa Magra (kg)', color: C.teal },
    { key: 'subcutFat', label: '% Gordura Subcutânea', color: C.terra },
    { key: 'visceralFat', label: 'Gordura Visceral', color: C.terra },
    { key: 'bodyWater', label: '% Água Corporal', color: '#60a5fa' },
    { key: 'skeletalMuscle', label: '% Músculo Esquelético', color: C.teal },
    { key: 'muscleMassKg', label: 'Massa Muscular (kg)', color: C.teal },
    { key: 'boneMass', label: 'Massa Óssea (kg)', color: C.text2 },
    { key: 'protein', label: '% Proteína', color: C.gold },
    { key: 'bmr', label: 'TMB (kcal)', color: C.amber },
    { key: 'bodyAge', label: 'Idade Corporal', color: C.text2 },
    { key: 'fatMass', label: 'Massa Gorda (kg)', color: C.terra },
  ]

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:200 }} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:C.surface, borderRadius:'16px 16px 0 0', padding:20, width:'100%', maxWidth:480, border:`0.5px solid ${C.border}`, maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ fontSize:15, fontWeight:700, marginBottom:4, color:C.text }}>📷 Importar do RelaxFit</div>
        <div style={{ fontSize:11, color:C.text2, marginBottom:16 }}>Suba a imagem gerada pelo RelaxFit e confira os dados extraídos</div>

        {/* Date */}
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:10, color:C.text2, marginBottom:4 }}>Data da medição</div>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)}
            style={{ width:'100%', background:C.surface2, border:`0.5px solid ${C.border}`, borderRadius:8, padding:'8px', color:C.text, fontSize:13, fontFamily:'JetBrains Mono,monospace' }}/>
        </div>

        {/* Image upload */}
        <label style={{ display:'block', width:'100%', padding:'14px', border:`1.5px dashed ${C.gold}60`, borderRadius:12, background:`${C.gold}08`, cursor:'pointer', textAlign:'center', marginBottom:12 }}>
          <input type="file" accept="image/*" style={{ display:'none' }} onChange={e=>handleImage(e.target.files[0])}/>
          {img
            ? <img src={img} alt="RelaxFit" style={{ maxWidth:'100%', maxHeight:200, borderRadius:8, objectFit:'contain' }}/>
            : <div><div style={{ fontSize:28, marginBottom:6 }}>📷</div><div style={{ fontSize:12, color:C.gold, fontWeight:600 }}>Toque para selecionar a imagem do RelaxFit</div><div style={{ fontSize:10, color:C.text2, marginTop:4 }}>Compartilhe a imagem do app e selecione aqui</div></div>
          }
        </label>

        {parsing && <div style={{ textAlign:'center', padding:'16px 0', color:C.gold, fontSize:13 }}>⏳ Lendo imagem...</div>}

        {error && <div style={{ background:`${C.red}15`, border:`0.5px solid ${C.red}40`, borderRadius:8, padding:'8px 12px', fontSize:11, color:C.red, marginBottom:12 }}>{error}</div>}

        {/* Manual fields - always shown after image upload */}
        {result !== null && (
          <div>
            <div style={{ fontSize:11, color:C.text2, fontWeight:700, marginBottom:10, fontFamily:'JetBrains Mono,monospace' }}>CONFIRME / PREENCHA OS DADOS:</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
              {fields.map(f => (
                <div key={f.key}>
                  <div style={{ fontSize:9, color:f.color, marginBottom:3, fontFamily:'JetBrains Mono,monospace' }}>{f.label}</div>
                  <input type={f.key==='bodyType'?'text':'number'} step="0.1"
                    value={result[f.key]||''}
                    onChange={e=>setResult(p=>({...p, [f.key]: f.key==='bodyType'?e.target.value:parseFloat(e.target.value)||''}))}
                    placeholder="—"
                    style={{ width:'100%', background:C.surface2, border:`0.5px solid ${f.color}40`, borderRadius:8, padding:'7px 8px', color:C.text, fontSize:13, fontFamily:'JetBrains Mono,monospace' }}/>
                </div>
              ))}
            </div>
            <button onClick={()=>{
              if (!result.weight) return
              onSave(date, result)
            }} style={{ width:'100%', padding:12, background:`linear-gradient(135deg,${C.gold},${C.gold2})`, border:'none', borderRadius:12, color:C.btnText, fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>
              Salvar medição
            </button>
          </div>
        )}

        {/* Show manual entry button if no image yet */}
        {result === null && !parsing && (
          <button onClick={()=>setResult({})}
            style={{ width:'100%', padding:10, background:'transparent', border:`0.5px solid ${C.border}`, borderRadius:10, color:C.text2, fontSize:12, cursor:'pointer', fontFamily:'inherit', marginTop:4 }}>
            Preencher manualmente sem imagem
          </button>
        )}

        <button onClick={onClose} style={{ width:'100%', padding:10, background:'transparent', border:'none', color:C.text2, fontSize:12, cursor:'pointer', fontFamily:'inherit', marginTop:8 }}>Cancelar</button>
      </div>
    </div>
  )
}

function ExerciseModal({ C, mode, exercise, isEdited, onSave, onDelete, onClose }) {
  const [name, setName] = useState(exercise?.name || '')
  const [equipment, setEquipment] = useState(exercise?.equipment || 'barra')
  const [primary, setPrimary] = useState(exercise?.primary || 'peito')
  const [secondary, setSecondary] = useState(exercise?.secondary || [])
  const [usesBar, setUsesBar] = useState(exercise?.usesBar || false)
  const [barWeight, setBarWeight] = useState(exercise?.barWeight != null ? String(exercise.barWeight) : '20')
  const [perSide, setPerSide] = useState(exercise?.perSide || false)
  const [editing, setEditing] = useState(false) // permite editar um exercício aberto em modo view
  const isView = mode === 'view' && !editing
  const isCustom = exercise?.id?.startsWith('cust_')
  const isLibrary = exercise?.id?.startsWith('ex_')

  const toggleSec = (mid) => {
    setSecondary(prev => prev.includes(mid) ? prev.filter(m=>m!==mid) : [...prev, mid])
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:200 }} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:C.surface, borderRadius:'16px 16px 0 0', padding:20, width:'100%', maxWidth:480, border:`0.5px solid ${C.border}`, maxHeight:'88vh', overflowY:'auto' }}>
        <div style={{ fontSize:15, fontWeight:700, marginBottom:16, color:C.text }}>
          {isView ? '🏋️ ' + exercise.name : (exercise ? 'Editar Exercício' : 'Novo Exercício')}
        </div>

        {!isView && (
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:10, color:C.text2, marginBottom:4, fontFamily:'JetBrains Mono,monospace' }}>NOME</div>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Ex: Supino Reto"
              style={{ width:'100%', background:C.surface2, border:`0.5px solid ${C.border}`, borderRadius:8, padding:'10px 12px', color:C.text, fontSize:14, fontFamily:'inherit' }}/>
          </div>
        )}

        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:10, color:C.text2, marginBottom:6, fontFamily:'JetBrains Mono,monospace' }}>EQUIPAMENTO</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {EQUIPMENTS.map(eq => (
              <button key={eq.id} disabled={isView} onClick={()=>setEquipment(eq.id)}
                style={{ padding:'7px 12px', borderRadius:10, fontSize:11, cursor:isView?'default':'pointer', fontFamily:'inherit', fontWeight:equipment===eq.id?700:400, border:`1.5px solid ${equipment===eq.id?C.gold:C.border}`, background:equipment===eq.id?`${C.gold}20`:'transparent', color:equipment===eq.id?C.gold:C.text2 }}>
                {eq.icon} {eq.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:10, color:C.text2, marginBottom:6, fontFamily:'JetBrains Mono,monospace' }}>MÚSCULO PRINCIPAL</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {MUSCLE_GROUPS.map(m => (
              <button key={m.id} disabled={isView} onClick={()=>setPrimary(m.id)}
                style={{ padding:'7px 12px', borderRadius:10, fontSize:11, cursor:isView?'default':'pointer', fontFamily:'inherit', fontWeight:primary===m.id?700:400, border:`1.5px solid ${primary===m.id?m.color:C.border}`, background:primary===m.id?`${m.color}20`:'transparent', color:primary===m.id?m.color:C.text2 }}>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:10, color:C.text2, marginBottom:6, fontFamily:'JetBrains Mono,monospace' }}>MÚSCULOS SECUNDÁRIOS</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {MUSCLE_GROUPS.filter(m=>m.id!==primary).map(m => {
              const on = secondary.includes(m.id)
              return (
                <button key={m.id} disabled={isView} onClick={()=>toggleSec(m.id)}
                  style={{ padding:'7px 12px', borderRadius:10, fontSize:11, cursor:isView?'default':'pointer', fontFamily:'inherit', fontWeight:on?700:400, border:`1.5px solid ${on?m.color:C.border}`, background:on?`${m.color}20`:'transparent', color:on?m.color:C.text2 }}>
                  {m.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Configuração de peso (para tonelagem correta) */}
        <div style={{ background:C.surface2, borderRadius:12, padding:'12px 14px', marginBottom:16, border:`0.5px solid ${C.border}` }}>
          <div style={{ fontSize:11, color:C.text2, fontWeight:700, marginBottom:10, fontFamily:'JetBrains Mono,monospace', textTransform:'uppercase', letterSpacing:1 }}>⚖️ Cálculo de tonelagem</div>

          {/* Peso por lado (independente de barra) */}
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:11, color:C.text2, marginBottom:6 }}>O peso que você registra é...</div>
            <div style={{ display:'flex', gap:6 }}>
              <button disabled={isView} onClick={()=>setPerSide(false)} style={{ flex:1, padding:'9px 4px', borderRadius:8, fontSize:11, fontWeight:perSide?400:700, cursor:isView?'default':'pointer', fontFamily:'inherit', border:`1.5px solid ${!perSide?C.gold:C.border}`, background:!perSide?`${C.gold}20`:'transparent', color:!perSide?C.gold:C.text2 }}>Peso total</button>
              <button disabled={isView} onClick={()=>setPerSide(true)} style={{ flex:1, padding:'9px 4px', borderRadius:8, fontSize:11, fontWeight:perSide?700:400, cursor:isView?'default':'pointer', fontFamily:'inherit', border:`1.5px solid ${perSide?C.gold:C.border}`, background:perSide?`${C.gold}20`:'transparent', color:perSide?C.gold:C.text2 }}>Peso de cada lado (×2)</button>
            </div>
            <div style={{ fontSize:9, color:C.text3, marginTop:4 }}>{perSide?'O app multiplica o peso registrado por 2 (anilhas dos dois lados)':'Usa o peso exatamente como registrado'}</div>
          </div>

          {/* Usa barra */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:10, borderTop:`0.5px solid ${C.border}` }}>
            <div>
              <div style={{ fontSize:12, fontWeight:600, color:C.text }}>Usa barra livre?</div>
              <div style={{ fontSize:10, color:C.text2, marginTop:2 }}>Soma o peso da barra na tonelagem</div>
            </div>
            {isView ? (
              <span style={{ fontSize:12, color:usesBar?C.teal:C.text3, fontWeight:700 }}>{usesBar?'Sim':'Não'}</span>
            ) : (
              <div onClick={()=>setUsesBar(v=>!v)} style={{ width:44, height:24, borderRadius:12, background:usesBar?C.gold:C.border, cursor:'pointer', position:'relative', transition:'background .2s', flexShrink:0 }}>
                <div style={{ position:'absolute', top:3, left:usesBar?22:3, width:18, height:18, borderRadius:'50%', background:C.text, transition:'left .2s' }}/>
              </div>
            )}
          </div>
          {usesBar && (
            <div style={{ marginTop:10 }}>
              <div style={{ fontSize:10, color:C.text2, marginBottom:4 }}>Peso da barra (kg)</div>
              <input type="number" step="0.5" value={barWeight} disabled={isView} onChange={e=>setBarWeight(e.target.value)} placeholder="20"
                style={{ width:'100%', background:C.surface, border:`0.5px solid ${C.border}`, borderRadius:8, padding:'8px 10px', color:C.text, fontSize:13, fontFamily:'JetBrains Mono,monospace' }}/>
              <div style={{ fontSize:9, color:C.text3, marginTop:3 }}>Barra olímpica: 20kg</div>
            </div>
          )}

          {/* Exemplo do cálculo */}
          {!isView && (perSide || usesBar) && (
            <div style={{ marginTop:10, fontSize:10, color:C.text2, background:C.surface, borderRadius:8, padding:'8px 10px', fontFamily:'JetBrains Mono,monospace' }}>
              {(() => {
                const bar = usesBar ? (parseFloat(barWeight)||20) : 0
                const eff = perSide ? (27.5*2 + bar) : (27.5 + bar)
                const parts = perSide ? `27.5×2${usesBar?` + ${bar}`:''}` : (usesBar?`27.5 + ${bar}`:'27.5')
                return `Ex: registro 27.5kg → tonelagem usa ${parts} = ${eff}kg`
              })()}
            </div>
          )}
        </div>

        {isView ? (
          <div style={{ display:'flex', gap:10 }}>
            {isCustom && <button onClick={()=>{ if(window.confirm('Excluir este exercício?')) onDelete(exercise.id) }} style={{ flex:1, padding:12, background:`${C.red}18`, border:'none', borderRadius:12, color:C.red, cursor:'pointer', fontFamily:'inherit', fontWeight:700, fontSize:12 }}>Excluir</button>}
            {isLibrary && isEdited && <button onClick={()=>{ if(window.confirm('Restaurar este exercício ao padrão da biblioteca?')) onDelete(exercise.id) }} style={{ flex:1, padding:12, background:C.surface2, border:'none', borderRadius:12, color:C.text2, cursor:'pointer', fontFamily:'inherit', fontSize:12 }}>↺ Restaurar</button>}
            <button onClick={onClose} style={{ flex:1, padding:12, background:C.surface2, border:'none', borderRadius:12, color:C.text2, cursor:'pointer', fontFamily:'inherit' }}>Fechar</button>
            <button onClick={()=>setEditing(true)} style={{ flex:2, padding:12, background:`linear-gradient(135deg,${C.gold},${C.gold2})`, border:'none', borderRadius:12, color:C.btnText, cursor:'pointer', fontFamily:'inherit', fontWeight:700 }}>✎ Editar</button>
          </div>
        ) : (
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={onClose} style={{ flex:1, padding:12, background:C.surface2, border:'none', borderRadius:12, color:C.text2, cursor:'pointer', fontFamily:'inherit' }}>Cancelar</button>
            <button onClick={()=>{
              if (!name.trim()) return
              const id = exercise?.id || 'cust_' + Date.now()
              onSave({ id, name:name.trim(), equipment, primary, secondary, usesBar, barWeight: usesBar ? (parseFloat(barWeight)||0) : 0, perSide })
            }} style={{ flex:2, padding:12, background:`linear-gradient(135deg,${C.gold},${C.gold2})`, border:'none', borderRadius:12, color:C.btnText, cursor:'pointer', fontFamily:'inherit', fontWeight:700, fontSize:14 }}>Salvar</button>
          </div>
        )}
      </div>
    </div>
  )
}

function HealthManualModal({ C, healthData, initialDate, onSave, onClose }) {
  const todayStr = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` })()
  const [date, setDate] = useState(initialDate || todayStr)
  const [steps, setSteps] = useState('')
  const [sleep, setSleep] = useState('')
  const [sleepScore, setSleepScore] = useState('')

  // Pre-fill if data already exists for the chosen date
  useEffect(() => {
    const d = healthData[date]
    setSteps(d?.steps != null ? String(d.steps) : '')
    setSleep(d?.sleep != null ? String(d.sleep) : '')
    setSleepScore(d?.sleepScore != null ? String(d.sleepScore) : '')
  }, [date])

  const canSave = steps !== '' || sleep !== '' || sleepScore !== ''

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:200 }} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:C.surface, borderRadius:'16px 16px 0 0', padding:20, width:'100%', maxWidth:480, border:`0.5px solid ${C.border}`, maxHeight:'88vh', overflowY:'auto' }}>
        <div style={{ fontSize:15, fontWeight:700, marginBottom:16, color:C.text }}>👟 {(healthData[date]&&(healthData[date].steps||healthData[date].sleep||healthData[date].sleepScore))?'Editar':'Registrar'} Atividade & Sono</div>

        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:10, color:C.text2, marginBottom:4, fontFamily:'JetBrains Mono,monospace' }}>DATA</div>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)}
            style={{ width:'100%', background:C.surface2, border:`0.5px solid ${C.border}`, borderRadius:8, padding:'9px 12px', color:C.text, fontSize:14, fontFamily:'JetBrains Mono,monospace' }}/>
        </div>

        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:11, color:C.teal, fontWeight:500, marginBottom:4 }}>👟 Passos</div>
          <input type="number" value={steps} onChange={e=>setSteps(e.target.value)} placeholder="ex: 8000"
            style={{ width:'100%', background:C.surface2, border:`0.5px solid ${C.teal}40`, borderRadius:8, padding:'10px 12px', color:C.text, fontSize:14, fontFamily:'JetBrains Mono,monospace' }}/>
        </div>

        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:11, color:'#8b7fd4', fontWeight:500, marginBottom:4 }}>😴 Horas de sono</div>
          <input type="number" step="0.1" value={sleep} onChange={e=>setSleep(e.target.value)} placeholder="ex: 7.5"
            style={{ width:'100%', background:C.surface2, border:`0.5px solid #8b7fd440`, borderRadius:8, padding:'10px 12px', color:C.text, fontSize:14, fontFamily:'JetBrains Mono,monospace' }}/>
        </div>

        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:11, color:C.gold, fontWeight:500, marginBottom:4 }}>⭐ Nota do sono (0-100)</div>
          <input type="number" value={sleepScore} onChange={e=>setSleepScore(e.target.value)} placeholder="ex: 75"
            style={{ width:'100%', background:C.surface2, border:`0.5px solid ${C.gold}40`, borderRadius:8, padding:'10px 12px', color:C.text, fontSize:14, fontFamily:'JetBrains Mono,monospace' }}/>
        </div>

        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:12, background:C.surface2, border:'none', borderRadius:12, color:C.text2, cursor:'pointer', fontFamily:'inherit' }}>Cancelar</button>
          <button onClick={()=>{
            if (!canSave) return
            const entry = { ...(healthData[date]||{}) }
            if (steps !== '') entry.steps = parseInt(steps); else delete entry.steps
            if (sleep !== '') entry.sleep = parseFloat(sleep); else delete entry.sleep
            if (sleepScore !== '') entry.sleepScore = parseInt(sleepScore); else delete entry.sleepScore
            const merged = { ...healthData }
            if (Object.keys(entry).length > 0) merged[date] = entry
            else delete merged[date]
            onSave(merged)
          }} disabled={!canSave} style={{ flex:2, padding:12, background:canSave?`linear-gradient(135deg,${C.gold},${C.gold2})`:C.surface2, border:'none', borderRadius:12, color:canSave?C.btnText:C.text3, cursor:canSave?'pointer':'not-allowed', fontFamily:'inherit', fontWeight:700, fontSize:14 }}>Salvar</button>
        </div>
      </div>
    </div>
  )
}

function HealthImportModal({ C, healthData, onSave, onClose }) {
  const [parsing, setParsing] = useState(false)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')
  const [dataType, setDataType] = useState('steps')

  // Parse Samsung Health step_daily_trend CSV
  function parseStepsCsv(text) {
    const lines = text.split('\n')
    // Line 0 = metadata, line 1 = header
    if (lines.length < 3) return {}
    const header = lines[1].split(',')
    const idxCount = header.indexOf('count')
    const idxDay = header.indexOf('day_time')
    const idxSource = header.indexOf('source_type')
    if (idxCount < 0 || idxDay < 0) return {}

    // For each day, take source_type -2 (the representative daily total)
    const byDay = {}
    for (let i = 2; i < lines.length; i++) {
      const cols = lines[i].split(',')
      if (cols.length < header.length) continue
      const day = (cols[idxDay] || '').slice(0, 10)
      const count = parseInt(cols[idxCount])
      const src = cols[idxSource]
      if (!day || isNaN(count)) continue
      // Prefer source_type -2; fallback to max
      if (src === '-2') {
        byDay[day] = count
      } else if (byDay[day] === undefined || count > byDay[day]) {
        if (byDay['__hasNeg2_'+day] !== true) byDay[day] = Math.max(byDay[day]||0, count)
      }
      if (src === '-2') byDay['__hasNeg2_'+day] = true
    }
    // Clean up helper keys and apply cutoff date
    const result = {}
    Object.keys(byDay).forEach(k => { if (!k.startsWith('__') && k >= HEALTH_CUTOFF) result[k] = byDay[k] })
    return result
  }

  // Parse Samsung Health sleep_combined CSV — extracts duration + score
  function parseSleepCsv(text) {
    const lines = text.split('\n')
    if (lines.length < 3) return {}
    const header = lines[1].split(',')
    const idxEnd = header.indexOf('end_time')
    const idxDur = header.indexOf('sleep_duration')
    const idxScore = header.indexOf('sleep_score')
    const idxEff = header.indexOf('efficiency')
    if (idxEnd < 0 || idxDur < 0) return {}

    const byDay = {}
    for (let i = 2; i < lines.length; i++) {
      const cols = lines[i].split(',')
      if (cols.length < header.length) continue
      const end = cols[idxEnd]
      const durMin = parseFloat(cols[idxDur])
      if (!end || isNaN(durMin)) continue
      const day = end.slice(0, 10)
      if (day < HEALTH_CUTOFF) continue
      const hours = Math.round((durMin/60)*10)/10
      const score = idxScore >= 0 ? parseFloat(cols[idxScore]) : null
      const eff = idxEff >= 0 ? parseFloat(cols[idxEff]) : null
      // If multiple sleep sessions in a day, sum hours and keep best score
      if (byDay[day]) {
        byDay[day].sleep = Math.round((byDay[day].sleep + hours)*10)/10
        if (score && (!byDay[day].sleepScore || score > byDay[day].sleepScore)) byDay[day].sleepScore = score
      } else {
        byDay[day] = { sleep: hours }
        if (score && !isNaN(score)) byDay[day].sleepScore = score
        if (eff && !isNaN(eff)) byDay[day].sleepEff = eff
      }
    }
    return byDay
  }

  async function handleFile(file) {
    if (!file) return
    setParsing(true)
    setError('')
    setPreview(null)
    try {
      const text = await file.text()
      let parsed = {}
      // Auto-detect type from filename or content
      const isSteps = file.name.includes('step') || text.includes('step_daily_trend')
      const isSleep = file.name.includes('sleep') || text.includes('sleep_combined') || text.includes('shealth.sleep')

      if (isSteps) { parsed = parseStepsCsv(text); setDataType('steps') }
      else if (isSleep) { parsed = parseSleepCsv(text); setDataType('sleep') }
      else {
        parsed = parseStepsCsv(text); setDataType('steps')
      }

      const count = Object.keys(parsed).length
      if (count === 0) {
        setError('Não consegui ler os dados. Verifique se é o CSV correto do Samsung Health.')
      } else {
        setPreview(parsed)
      }
    } catch(err) {
      console.error(err)
      setError('Erro ao ler arquivo: ' + err.message)
    }
    setParsing(false)
  }

  const previewEntries = preview ? Object.entries(preview).sort(([a],[b]) => b.localeCompare(a)) : []

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:200 }} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:C.surface, borderRadius:'16px 16px 0 0', padding:20, width:'100%', maxWidth:480, border:`0.5px solid ${C.border}`, maxHeight:'88vh', overflowY:'auto' }}>
        <div style={{ fontSize:15, fontWeight:700, marginBottom:4, color:C.text }}>👟 Importar do Samsung Health</div>
        <div style={{ fontSize:11, color:C.text2, marginBottom:12, lineHeight:1.5 }}>
          No Samsung Health: ⋮ → Configurações → Baixar dados pessoais. Extraia o ZIP e envie o CSV de passos ou sono.
        </div>
        <div style={{ fontSize:10, color:C.gold, marginBottom:16, background:`${C.gold}12`, borderRadius:8, padding:'8px 10px', lineHeight:1.4 }}>
          📅 Apenas dados a partir de {HEALTH_CUTOFF.split('-').reverse().join('/')} serão importados (início do monitoramento).
        </div>

        <label style={{ display:'block', width:'100%', padding:'14px', border:`1.5px dashed ${C.gold}60`, borderRadius:12, background:`${C.gold}08`, cursor:'pointer', textAlign:'center', marginBottom:12 }}>
          <input type="file" accept=".csv" style={{ display:'none' }} onChange={e=>handleFile(e.target.files[0])}/>
          <div style={{ fontSize:28, marginBottom:6 }}>📄</div>
          <div style={{ fontSize:12, color:C.gold, fontWeight:600 }}>Selecionar arquivo CSV</div>
          <div style={{ fontSize:10, color:C.text2, marginTop:4 }}>step_daily_trend ou sleep</div>
        </label>

        {parsing && <div style={{ textAlign:'center', padding:'16px 0', color:C.gold, fontSize:13 }}>⏳ Lendo arquivo...</div>}
        {error && <div style={{ background:`${C.red}15`, border:`0.5px solid ${C.red}40`, borderRadius:8, padding:'8px 12px', fontSize:11, color:C.red, marginBottom:12 }}>{error}</div>}

        {preview && (
          <div>
            <div style={{ background:`${C.teal}15`, border:`0.5px solid ${C.teal}40`, borderRadius:8, padding:'10px 12px', marginBottom:12 }}>
              <div style={{ fontSize:12, color:C.teal, fontWeight:700 }}>✓ {previewEntries.length} dias de {dataType==='steps'?'passos':'sono'} encontrados</div>
              <div style={{ fontSize:10, color:C.text2, marginTop:2, fontFamily:'JetBrains Mono,monospace' }}>
                {previewEntries[previewEntries.length-1]?.[0]} até {previewEntries[0]?.[0]}
              </div>
            </div>

            <div style={{ maxHeight:200, overflowY:'auto', marginBottom:12 }}>
              {previewEntries.slice(0,8).map(([date, val]) => (
                <div key={date} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:`0.5px solid ${C.border}`, fontSize:12, fontFamily:'JetBrains Mono,monospace' }}>
                  <span style={{ color:C.text2 }}>{date}</span>
                  <span style={{ color:C.text, fontWeight:700 }}>
                    {dataType==='steps'
                      ? `${val.toLocaleString()} passos`
                      : `${val.sleep}h${val.sleepScore?` · nota ${val.sleepScore}`:''}`}
                  </span>
                </div>
              ))}
              {previewEntries.length > 8 && <div style={{ textAlign:'center', fontSize:10, color:C.text3, padding:'8px 0' }}>+ {previewEntries.length-8} dias</div>}
            </div>

            <button onClick={()=>{
              const merged = { ...healthData }
              Object.entries(preview).forEach(([date, val]) => {
                if (dataType === 'steps') {
                  merged[date] = { ...(merged[date]||{}), steps: val }
                } else {
                  // sleep returns an object {sleep, sleepScore, sleepEff}
                  merged[date] = { ...(merged[date]||{}), ...val }
                }
              })
              onSave(merged)
            }} style={{ width:'100%', padding:12, background:`linear-gradient(135deg,${C.gold},${C.gold2})`, border:'none', borderRadius:12, color:C.btnText, fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>
              Importar {previewEntries.length} dias
            </button>
          </div>
        )}

        <button onClick={onClose} style={{ width:'100%', padding:10, background:'transparent', border:'none', color:C.text2, fontSize:12, cursor:'pointer', fontFamily:'inherit', marginTop:8 }}>Cancelar</button>
      </div>
    </div>
  )
}

function WeightModal({ C, onSave, onClose }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0,10))
  const [weight, setWeight] = useState('')
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:200 }} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:C.surface, borderRadius:'16px 16px 0 0', padding:24, width:'100%', maxWidth:480, border:`0.5px solid ${C.border}` }}>
        <div style={{ fontSize:15, fontWeight:700, marginBottom:20, color:C.text }}>⚖️ Registrar Peso</div>
        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:11, color:C.text2, fontWeight:500, marginBottom:4, display:'block' }}>Data</label>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)}
            style={{ width:'100%', background:C.surface2, border:`0.5px solid ${C.border}`, borderRadius:10, padding:'10px 14px', color:C.text, fontSize:14, fontFamily:'JetBrains Mono,monospace' }}/>
        </div>
        <div style={{ marginBottom:20 }}>
          <label style={{ fontSize:11, color:C.teal, fontWeight:500, marginBottom:4, display:'block' }}>Peso (kg)</label>
          <input type="number" step="0.1" placeholder="Ex: 76.5" value={weight} onChange={e=>setWeight(e.target.value)} autoFocus
            style={{ width:'100%', background:C.surface2, border:`0.5px solid ${C.teal}40`, borderRadius:10, padding:'10px 14px', color:C.text, fontSize:18, fontFamily:'JetBrains Mono,monospace', textAlign:'center' }}/>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:12, background:C.surface2, border:'none', borderRadius:12, color:C.text2, cursor:'pointer', fontFamily:'inherit' }}>Cancelar</button>
          <button onClick={()=>{ if(weight) onSave(date,weight) }} style={{ flex:2, padding:12, background:`linear-gradient(135deg,${C.gold},${C.gold2})`, border:'none', borderRadius:12, color:C.btnText, cursor:'pointer', fontFamily:'inherit', fontWeight:700, fontSize:14 }}>Salvar</button>
        </div>
      </div>
    </div>
  )
}

// ── TARGETS MODAL ─────────────────────────────────────────────────────────────
function TargetsModal({ targets, targetsHistory, C, onSave, onClose }) {
  const [t, setT] = useState({
    ...targets,
    targets2: targets.targets2||{ cal:1800, prot:150, carb:220, fat:50, min:1700, max:1900, protMin:138, protMax:163, fatMax:60, carbMin:190, carbMax:240, fatMin:40 },
    variableDays: targets.variableDays||[1,3,5],
    dualMode: targets.dualMode||false,
    controlCarb: targets.controlCarb||false,
    carbMin: targets.carbMin ?? 130, carbMax: targets.carbMax ?? 170,
    fatMin: targets.fatMin ?? 35,
    validFrom: targets.validFrom||'2020-01-01',
  })
  const [activeTab, setActiveTab] = useState('meta1')
  const DAYS=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
  const baseFields=[
    {k:'cal',l:'Calorias alvo (kcal)',c:C.gold},{k:'min',l:'Kcal mínimo',c:C.gold2},{k:'max',l:'Kcal máximo',c:C.red},
    {k:'prot',l:'Proteína alvo (g)',c:C.teal},{k:'protMin',l:'Proteína mínima (g)',c:C.teal},{k:'protMax',l:'Proteína máxima (g)',c:C.teal},
    {k:'carb',l:'Carboidratos alvo (g)',c:C.gold2},
    ...(t.controlCarb?[{k:'carbMin',l:'Carbo mínimo (g)',c:C.gold2},{k:'carbMax',l:'Carbo máximo (g)',c:C.gold2}]:[]),
    {k:'fat',l:'Gordura alvo (g)',c:C.terra},{k:'fatMin',l:'Gordura mínima (g)',c:C.terra},{k:'fatMax',l:'Gordura máxima (g)',c:C.terra},
  ]
  const fields=baseFields
  const toggleDay=(day)=>setT(p=>({...p,variableDays:(p.variableDays||[]).includes(day)?p.variableDays.filter(d=>d!==day):[...(p.variableDays||[]),day]}))

  function handleSave() {
    // Add current targets to history with validFrom date
    const newSnap={ ...t, validFrom:t.validFrom }
    const existingIdx=(targetsHistory||[]).findIndex(h=>h.validFrom===t.validFrom)
    let newHistory
    if(existingIdx>=0) { newHistory=[...targetsHistory]; newHistory[existingIdx]=newSnap }
    else { newHistory=[...(targetsHistory||[]),newSnap] }
    // Sort by date
    newHistory.sort((a,b)=>a.validFrom.localeCompare(b.validFrom))
    onSave(t, newHistory)
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:200 }} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:C.surface, borderRadius:'16px 16px 0 0', padding:20, width:'100%', maxWidth:480, border:`0.5px solid ${C.border}`, maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ fontSize:15, fontWeight:700, marginBottom:16, color:C.text }}>⚙️ Metas diárias</div>

        {/* Valid from date */}
        <div style={{ background:C.bg, borderRadius:12, padding:'12px 14px', marginBottom:14, border:`0.5px solid ${C.border}` }}>
          <div style={{ fontSize:12, fontWeight:600, color:C.text, marginBottom:6 }}>📅 Vigente a partir de</div>
          <div style={{ fontSize:11, color:C.text2, marginBottom:8 }}>Permite retroagir metas para datas passadas</div>
          <input type="date" value={t.validFrom} onChange={e=>setT(p=>({...p,validFrom:e.target.value}))}
            style={{ width:'100%', background:C.surface2, border:`0.5px solid ${C.gold}40`, borderRadius:8, padding:'9px', color:C.text, fontSize:13, fontFamily:'JetBrains Mono,monospace' }}/>
          {(targetsHistory||[]).length>0&&<div style={{ marginTop:10 }}>
            <div style={{ fontSize:10, color:C.text2, marginBottom:6 }}>Histórico de metas:</div>
            {[...targetsHistory].sort((a,b)=>b.validFrom.localeCompare(a.validFrom)).map((h,i)=>(
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'4px 0', borderBottom:`0.5px solid ${C.border}`, fontSize:11 }}>
                <span style={{ color:C.text2 }}>A partir de {h.validFrom}</span>
                <span style={{ color:C.gold, fontFamily:'JetBrains Mono,monospace' }}>{h.cal} kcal</span>
              </div>
            ))}
          </div>}
        </div>

        {/* Dual mode toggle */}
        <div style={{ background:C.surface2, borderRadius:12, padding:'12px 14px', marginBottom:14, border:`0.5px solid ${C.border}` }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:C.text }}>Dieta variável</div>
              <div style={{ fontSize:11, color:C.text2, marginTop:2 }}>Meta 1 e Meta 2 por dia da semana</div>
            </div>
            <div onClick={()=>setT(p=>({...p,dualMode:!p.dualMode}))}
              style={{ width:44, height:24, borderRadius:12, background:t.dualMode?C.gold:C.border, cursor:'pointer', position:'relative', transition:'background .2s', flexShrink:0 }}>
              <div style={{ position:'absolute', top:3, left:t.dualMode?22:3, width:18, height:18, borderRadius:'50%', background:C.text, transition:'left .2s' }}/>
            </div>
          </div>
          {t.dualMode&&<div style={{ marginTop:12 }}>
            <div style={{ fontSize:11, color:C.text2, marginBottom:8 }}>Dias de <span style={{ color:C.teal, fontWeight:700 }}>Meta 2</span>:</div>
            <div style={{ display:'flex', gap:5 }}>
              {DAYS.map((day,idx)=>{
                const on=(t.variableDays||[]).includes(idx)
                return <div key={idx} onClick={()=>toggleDay(idx)} style={{ flex:1, textAlign:'center', padding:'6px 0', borderRadius:8, cursor:'pointer', fontSize:10, fontWeight:700, border:`1.5px solid ${on?C.teal:C.border}`, background:on?`${C.teal}20`:'transparent', color:on?C.teal:C.text2 }}>{day}</div>
              })}
            </div>
            <div style={{ marginTop:8, fontSize:10, color:C.text3, fontFamily:'JetBrains Mono,monospace' }}>Dias não marcados → <span style={{ color:C.gold }}>Meta 1</span></div>
          </div>}
        </div>

        {/* Tab selector */}
        {t.dualMode&&<div style={{ display:'flex', gap:6, marginBottom:14 }}>
          <button onClick={()=>setActiveTab('meta1')} style={{ flex:1, padding:'9px 0', border:'none', borderRadius:10, background:activeTab==='meta1'?C.gold:C.surface2, color:activeTab==='meta1'?'#0d1a1f':C.text2, fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>🟡 Meta 1</button>
          <button onClick={()=>setActiveTab('meta2')} style={{ flex:1, padding:'9px 0', border:'none', borderRadius:10, background:activeTab==='meta2'?C.teal:C.surface2, color:activeTab==='meta2'?'#0d1a1f':C.text2, fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>🔵 Meta 2</button>
        </div>}

        {/* Carb control toggle */}
        {(!t.dualMode||activeTab==='meta1')&&(
          <div style={{ background:C.surface2, borderRadius:12, padding:'12px 14px', marginBottom:14, border:`0.5px solid ${C.border}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:C.text }}>Controlar carboidrato</div>
                <div style={{ fontSize:11, color:C.text2, marginTop:2 }}>Define mínimo e máximo de carbo</div>
              </div>
              <div onClick={()=>setT(p=>({...p,controlCarb:!p.controlCarb}))}
                style={{ width:44, height:24, borderRadius:12, background:t.controlCarb?C.gold:C.border, cursor:'pointer', position:'relative', transition:'background .2s', flexShrink:0 }}>
                <div style={{ position:'absolute', top:3, left:t.controlCarb?22:3, width:18, height:18, borderRadius:'50%', background:C.text, transition:'left .2s' }}/>
              </div>
            </div>
          </div>
        )}

        {/* Fields */}
        {(!t.dualMode||activeTab==='meta1')&&fields.map(f=>(
          <div key={f.k} style={{ marginBottom:10 }}>
            <label style={{ fontSize:11, color:f.c, fontWeight:500, marginBottom:4, display:'block' }}>{f.l}</label>
            <input type="number" value={t[f.k]||''} onChange={e=>setT(p=>({...p,[f.k]:parseFloat(e.target.value)||0}))}
              style={{ width:'100%', background:C.surface2, border:`0.5px solid ${f.c}40`, borderRadius:10, padding:'9px 14px', color:C.text, fontSize:14, fontFamily:'JetBrains Mono,monospace' }}/>
          </div>
        ))}
        {t.dualMode&&activeTab==='meta2'&&fields.map(f=>(
          <div key={f.k} style={{ marginBottom:10 }}>
            <label style={{ fontSize:11, color:C.teal, fontWeight:500, marginBottom:4, display:'block' }}>{f.l} <span style={{ color:C.text3, fontSize:10 }}>(Meta 2)</span></label>
            <input type="number" value={(t.targets2||{})[f.k]||''} onChange={e=>setT(p=>({...p,targets2:{...(p.targets2||{}),[f.k]:parseFloat(e.target.value)||0}}))}
              style={{ width:'100%', background:C.surface2, border:`0.5px solid ${C.teal}40`, borderRadius:10, padding:'9px 14px', color:C.text, fontSize:14, fontFamily:'JetBrains Mono,monospace' }}/>
          </div>
        ))}

             {(targetsHistory||[]).length>0&&(
          <div style={{ background:C.bg, borderRadius:10, padding:'10px 12px', marginBottom:10 }}>
            <div style={{ fontSize:10, color:C.text2, fontWeight:700, marginBottom:6, fontFamily:'JetBrains Mono,monospace' }}>HISTÓRICO DE METAS</div>
            {[...targetsHistory].sort((a,b)=>b.validFrom.localeCompare(a.validFrom)).slice(0,5).map((h,i)=>(
              <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:C.text3, fontFamily:'JetBrains Mono,monospace', padding:'3px 0', borderBottom:`0.5px solid ${C.border}` }}>
                <span style={{ color:C.text2 }}>a partir de {h.validFrom}</span>
                <span>{h.cal} kcal · P:{h.prot}g · C:{h.carb}g</span>
              </div>
            ))}
          </div>
        )}
        <div style={{ display:'flex', gap:10, marginTop:8 }}>
          <button onClick={onClose} style={{ flex:1, padding:12, background:C.surface2, border:'none', borderRadius:12, color:C.text2, cursor:'pointer', fontFamily:'inherit' }}>Cancelar</button>
          <button onClick={handleSave} style={{ flex:2, padding:12, background:`linear-gradient(135deg,${C.gold},${C.gold2})`, border:'none', borderRadius:12, color:C.btnText, cursor:'pointer', fontFamily:'inherit', fontWeight:700, fontSize:14 }}>Salvar</button>
        </div>
      </div>
    </div>
  )
}
