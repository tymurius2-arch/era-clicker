'use strict';
/* Era Clicker — оригинальный кликер про развитие цивилизации. */

const $ = s => document.querySelector(s);

/* ---------- ДАННЫЕ ---------- */

const RES = [
  { id: 'food',    name: 'Еда',    icon: '🍖', era: 0 },
  { id: 'wood',    name: 'Дерево', icon: '🪵', era: 0 },
  { id: 'stone',   name: 'Камень', icon: '🪨', era: 1 },
  { id: 'gold',    name: 'Золото', icon: '🪙', era: 2 },
  { id: 'science', name: 'Наука',  icon: '🔬', era: 3 },
];
const RES_IDS = RES.map(r => r.id);
const RESMAP = Object.fromEntries(RES.map(r => [r.id, r]));

const ERAS = [
  { name: 'Каменный век', icon: '🔥', desc: 'Племя у костра. Собирай ягоды и рубите лес.', cost: {},
    sky: ['#f6a96b', '#7b4a2a'], ground: '#6b4f2a', sun: '🌅' },
  { name: 'Бронзовый век', icon: '🏺', desc: 'Первые поселения, гончары и каменоломни.', cost: { food: 500, wood: 500 },
    sky: ['#f7cf86', '#b0703e'], ground: '#8a6a3a', sun: '☀️' },
  { name: 'Античность', icon: '🏛️', desc: 'Города, рынки и золотые монеты.', cost: { food: 2e4, wood: 2e4, stone: 1e4 },
    sky: ['#9fd3f0', '#efe0b8'], ground: '#c9b07a', sun: '☀️' },
  { name: 'Средневековье', icon: '🏰', desc: 'Замки, кузницы и первые библиотеки.', cost: { food: 5e5, stone: 3e5, gold: 1e5 },
    sky: ['#7fa6c9', '#3d5a7a'], ground: '#4f6b3a', sun: '🌤️' },
  { name: 'Возрождение', icon: '🎨', desc: 'Университеты, банки и великие мастера.', cost: { wood: 1e7, gold: 5e6, science: 1e5 },
    sky: ['#c9e3f5', '#f0d9a8'], ground: '#6f8f4a', sun: '☀️' },
  { name: 'Индустриальная эра', icon: '🏭', desc: 'Пар, заводы и железные дороги.', cost: { stone: 3e8, gold: 2e8, science: 1e7 },
    sky: ['#a8a8a8', '#5a4a40'], ground: '#4a3f36', sun: '🌥️' },
  { name: 'Современность', icon: '🏙️', desc: 'Мегаполисы, электричество и компьютеры.', cost: { food: 1e10, gold: 1e10, science: 1e9 },
    sky: ['#4aa3df', '#bfe3ff'], ground: '#555e66', sun: '☀️' },
  { name: 'Космическая эра', icon: '🚀', desc: 'Ракеты, колонии и энергия звёзд.', cost: { stone: 1e12, gold: 1e12, science: 1e11 },
    sky: ['#050816', '#2b1055'], ground: '#8a3b22', sun: '🪐' },
];

const BUILDINGS = [
  // Каменный век
  { id: 'gatherer', name: 'Собиратель', icon: '🧺', era: 0, cost: { food: 10 }, prod: { food: 0.3 }, desc: 'Ищет ягоды и коренья.' },
  { id: 'woodcutter', name: 'Дровосек', icon: '🪓', era: 0, cost: { food: 15 }, prod: { wood: 0.3 }, desc: 'Рубит ветки для костра.' },
  { id: 'hunter', name: 'Охотник', icon: '🏹', era: 0, cost: { food: 80, wood: 40 }, prod: { food: 2 }, desc: 'Приносит мамонтятину.' },
  { id: 'hut', name: 'Хижина', icon: '🛖', era: 0, cost: { food: 120, wood: 200 }, prod: { food: 1, wood: 3 }, desc: 'Дом для большой семьи.' },
  // Бронзовый век
  { id: 'quarry', name: 'Каменоломня', icon: '⛏️', era: 1, cost: { food: 600, wood: 600 }, prod: { stone: 4 }, desc: 'Добывает камень для построек.' },
  { id: 'farm', name: 'Ферма', icon: '🌾', era: 1, cost: { wood: 1500, stone: 500 }, prod: { food: 20 }, desc: 'Поля пшеницы до горизонта.' },
  { id: 'sawmill', name: 'Лесопилка', icon: '🪚', era: 1, cost: { food: 1500, stone: 600 }, prod: { wood: 20 }, desc: 'Пилит брёвна на доски.' },
  // Античность
  { id: 'market', name: 'Рынок', icon: '⚖️', era: 2, cost: { wood: 2.5e4, stone: 1.5e4 }, prod: { gold: 15 }, desc: 'Торговцы со всего света.' },
  { id: 'mine', name: 'Рудник', icon: '⛰️', era: 2, cost: { food: 4e4, wood: 3e4 }, prod: { stone: 120, gold: 10 }, desc: 'Глубокие шахты в горах.' },
  { id: 'aqueduct', name: 'Акведук', icon: '🌉', era: 2, cost: { stone: 6e4, gold: 5e3 }, prod: { food: 300, wood: 150 }, desc: 'Вода для полей и садов.' },
  // Средневековье
  { id: 'library', name: 'Библиотека', icon: '📜', era: 3, cost: { stone: 6e5, gold: 2e5 }, prod: { science: 20 }, desc: 'Монахи переписывают книги.' },
  { id: 'castle', name: 'Замок', icon: '🏰', era: 3, cost: { food: 1e6, stone: 1.5e6 }, prod: { stone: 2500, gold: 800 }, desc: 'Крепость с налогами.' },
  { id: 'smithy', name: 'Кузница', icon: '⚒️', era: 3, cost: { wood: 1.2e6, gold: 4e5 }, prod: { wood: 3000, food: 3000 }, desc: 'Плуги, пилы и подковы.' },
  // Возрождение
  { id: 'university', name: 'Университет', icon: '🎓', era: 4, cost: { gold: 8e6, science: 2e5 }, prod: { science: 400 }, desc: 'Учёные спорят о звёздах.' },
  { id: 'bank', name: 'Банк', icon: '🏦', era: 4, cost: { stone: 1e7, gold: 2e7 }, prod: { gold: 2.5e4 }, desc: 'Деньги делают деньги.' },
  { id: 'workshop', name: 'Мастерская', icon: '🖌️', era: 4, cost: { wood: 3e7, science: 5e5 }, prod: { food: 6e4, wood: 6e4, stone: 3e4 }, desc: 'Изобретатели и художники.' },
  // Индустриальная эра
  { id: 'factory', name: 'Завод', icon: '🏭', era: 5, cost: { stone: 5e8, gold: 3e8 }, prod: { wood: 2e6, stone: 2e6 }, desc: 'Дымят трубы, крутятся станки.' },
  { id: 'railway', name: 'Железная дорога', icon: '🚂', era: 5, cost: { wood: 8e8, gold: 5e8 }, prod: { food: 2e6, gold: 1e6 }, desc: 'Поезда везут товары.' },
  { id: 'lab', name: 'Лаборатория', icon: '🧪', era: 5, cost: { gold: 1e9, science: 2e7 }, prod: { science: 2e4 }, desc: 'Опыты с электричеством.' },
  // Современность
  { id: 'skyscraper', name: 'Небоскрёб', icon: '🏢', era: 6, cost: { stone: 2e10, gold: 1.5e10 }, prod: { gold: 5e7 }, desc: 'Офисы до самых облаков.' },
  { id: 'datacenter', name: 'Дата-центр', icon: '💻', era: 6, cost: { gold: 3e10, science: 2e9 }, prod: { science: 1e6 }, desc: 'Миллионы серверов думают.' },
  { id: 'powerplant', name: 'Электростанция', icon: '⚡', era: 6, cost: { gold: 5e10, science: 5e9 }, prod: { food: 1e8, wood: 1e8, stone: 1e8 }, desc: 'Энергия для всего города.' },
  // Космическая эра
  { id: 'spaceport', name: 'Космодром', icon: '🛰️', era: 7, cost: { gold: 2e12, science: 2e11 }, prod: { gold: 3e9, science: 5e7 }, desc: 'Запуски каждый день.' },
  { id: 'marsbase', name: 'База на Марсе', icon: '🔴', era: 7, cost: { stone: 5e12, gold: 5e12 }, prod: { food: 5e9, wood: 5e9, stone: 5e9 }, desc: 'Теплицы на красной планете.' },
  { id: 'dyson', name: 'Сфера Дайсона', icon: '🌞', era: 7, cost: { gold: 5e13, science: 5e12 }, prod: { food: 5e10, wood: 5e10, stone: 5e10, gold: 5e10, science: 1e9 }, desc: 'Вся энергия Солнца твоя.' },
];
const BMAP = Object.fromEntries(BUILDINGS.map(b => [b.id, b]));
const COST_GROWTH = 1.15;

const UPGRADES = [
  { id: 'fire', name: 'Укрощение огня', icon: '🔥', era: 0, cost: { wood: 150 }, eff: [{ t: 'res', r: 'food', v: 2 }] },
  { id: 'stoneaxe', name: 'Каменный топор', icon: '🪓', era: 0, cost: { food: 200, wood: 100 }, eff: [{ t: 'click', v: 2 }] },
  { id: 'speech', name: 'Речь', icon: '🗣️', era: 0, cost: { food: 800, wood: 800 }, eff: [{ t: 'all', v: 1.25 }] },
  { id: 'bronze', name: 'Бронзовые инструменты', icon: '🔨', era: 1, cost: { food: 3000, wood: 3000, stone: 1000 }, eff: [{ t: 'click', v: 2 }] },
  { id: 'irrigation', name: 'Ирригация', icon: '💧', era: 1, cost: { food: 6000, stone: 3000 }, eff: [{ t: 'res', r: 'food', v: 2 }] },
  { id: 'masonry', name: 'Каменная кладка', icon: '🧱', era: 1, cost: { wood: 6000, stone: 8000 }, eff: [{ t: 'res', r: 'stone', v: 2 }] },
  { id: 'wheel', name: 'Колесо', icon: '🛞', era: 1, cost: { wood: 8000, stone: 4000 }, eff: [{ t: 'all', v: 1.5 }] },
  { id: 'iron', name: 'Железные орудия', icon: '🗡️', era: 2, cost: { stone: 6e4, gold: 2e4 }, eff: [{ t: 'clickpct', v: 0.01 }] },
  { id: 'coins', name: 'Чеканка монет', icon: '💰', era: 2, cost: { stone: 5e4, gold: 3e4 }, eff: [{ t: 'res', r: 'gold', v: 2 }] },
  { id: 'writing', name: 'Письменность', icon: '✍️', era: 2, cost: { food: 1e5, gold: 5e4 }, eff: [{ t: 'all', v: 1.5 }] },
  { id: 'astrology', name: 'Звездочёты', icon: '🔭', era: 2, cost: { gold: 8e4 }, eff: [{ t: 'efreq', v: 1.5 }] },
  { id: 'steel', name: 'Сталь', icon: '🛡️', era: 3, cost: { stone: 1e6, gold: 5e5 }, eff: [{ t: 'click', v: 3 }] },
  { id: 'monastery', name: 'Монастыри', icon: '⛪', era: 3, cost: { gold: 1e6, science: 5e4 }, eff: [{ t: 'res', r: 'science', v: 2 }] },
  { id: 'guilds', name: 'Гильдии', icon: '🤝', era: 3, cost: { food: 2e6, gold: 1.5e6 }, eff: [{ t: 'all', v: 1.5 }] },
  { id: 'fairs', name: 'Ярмарки', icon: '🎪', era: 3, cost: { food: 3e6, gold: 1e6 }, eff: [{ t: 'edur', v: 1.5 }] },
  { id: 'printing', name: 'Книгопечатание', icon: '📖', era: 4, cost: { wood: 5e7, science: 1e6 }, eff: [{ t: 'res', r: 'science', v: 3 }] },
  { id: 'compass', name: 'Компас', icon: '🧭', era: 4, cost: { gold: 5e7, science: 1e6 }, eff: [{ t: 'all', v: 2 }] },
  { id: 'perspective', name: 'Чертежи', icon: '📐', era: 4, cost: { gold: 8e7, science: 3e6 }, eff: [{ t: 'clickpct', v: 0.02 }] },
  { id: 'steam', name: 'Паровой двигатель', icon: '♨️', era: 5, cost: { wood: 2e9, science: 5e7 }, eff: [{ t: 'all', v: 2 }] },
  { id: 'conveyor', name: 'Конвейер', icon: '⚙️', era: 5, cost: { stone: 3e9, gold: 3e9 }, eff: [{ t: 'click', v: 5 }] },
  { id: 'telegraph', name: 'Телеграф', icon: '📡', era: 5, cost: { gold: 5e9, science: 1e8 }, eff: [{ t: 'efreq', v: 1.5 }] },
  { id: 'electric', name: 'Электричество', icon: '💡', era: 6, cost: { gold: 1e11, science: 1e10 }, eff: [{ t: 'all', v: 2 }] },
  { id: 'internet', name: 'Интернет', icon: '🌐', era: 6, cost: { gold: 2e11, science: 3e10 }, eff: [{ t: 'res', r: 'science', v: 3 }, { t: 'clickpct', v: 0.03 }] },
  { id: 'robots', name: 'Роботы', icon: '🤖', era: 6, cost: { stone: 3e11, science: 5e10 }, eff: [{ t: 'click', v: 10 }] },
  { id: 'ai', name: 'Искусственный интеллект', icon: '🧠', era: 7, cost: { gold: 1e13, science: 1e12 }, eff: [{ t: 'all', v: 3 }] },
  { id: 'fusion', name: 'Термоядерный синтез', icon: '☢️', era: 7, cost: { gold: 5e13, science: 5e12 }, eff: [{ t: 'all', v: 3 }] },
  { id: 'warp', name: 'Варп-двигатель', icon: '🌌', era: 7, cost: { gold: 2e14, science: 2e13 }, eff: [{ t: 'all', v: 5 }, { t: 'efreq', v: 2 }] },
];
// Улучшения построек: ×2 при 10, 25, 50, 100, 150, 200 штук
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'];
const THRESH = [10, 25, 50, 100, 150, 200];
BUILDINGS.forEach(b => THRESH.forEach((t, i) => {
  const cost = {};
  for (const r in b.cost) cost[r] = Math.ceil(b.cost[r] * Math.pow(COST_GROWTH, t) * 6);
  UPGRADES.push({ id: `${b.id}_${t}`, name: `${b.name} ${ROMAN[i]}`, icon: b.icon, era: b.era, need: { b: b.id, n: t }, cost, eff: [{ t: 'bld', b: b.id, v: 2 }] });
}));
const UMAP = Object.fromEntries(UPGRADES.map(u => [u.id, u]));

const PERKS = [
  { id: 'hand', name: 'Сильная рука', icon: '✊', cost: 1, desc: 'Клик ×5 навсегда.' },
  { id: 'start', name: 'Быстрый старт', icon: '🏃', cost: 3, desc: 'Каждое новое начало: 5 собирателей, 5 дровосеков и по 1000 еды и дерева.' },
  { id: 'chronicle', name: 'Летопись', icon: '📚', cost: 5, desc: 'Доход, пока игра закрыта: 100% вместо 50%, до 24 часов вместо 8.' },
  { id: 'builders', name: 'Мудрые зодчие', icon: '📏', cost: 10, desc: 'Все постройки дешевле на 10%.' },
  { id: 'stargazer', name: 'Звездочёт', icon: '🌠', cost: 15, desc: 'Падающие звёзды появляются в 2 раза чаще.' },
  { id: 'memory', name: 'Память эпох', icon: '⏳', cost: 25, desc: 'Переход в новую эпоху дешевле на 25%.' },
  { id: 'golden', name: 'Золотой век', icon: '👑', cost: 50, desc: 'Всё производство ×2.' },
  { id: 'eternal', name: 'Вечная империя', icon: '♾️', cost: 150, desc: 'Всё производство и клик ×3.' },
];

const ACH = [];
function buildAch() {
  [[1, 'Первый шаг'], [100, 'Работяга'], [1000, 'Мозоли'], [10000, 'Неутомимый'], [50000, 'Кликомания']]
    .forEach(([n, name]) => ACH.push({ id: 'cl' + n, name, icon: '👆', desc: `Сделай ${fmt(n)} кликов`, check: () => S.stats.clicks >= n }));
  [[10, 'Деревня'], [50, 'Посёлок'], [100, 'Город'], [250, 'Столица'], [500, 'Империя'], [1000, 'Планета']]
    .forEach(([n, name]) => ACH.push({ id: 'b' + n, name, icon: '🏘️', desc: `Имей ${n} построек одновременно`, check: () => totalBuildings() >= n }));
  ERAS.forEach((e, i) => { if (i) ACH.push({ id: 'era' + i, name: e.name, icon: e.icon, desc: `Достигни эпохи «${e.name}»`, check: () => S.stats.maxEra >= i }); });
  [[10, 'Ручеёк'], [1e3, 'Река'], [1e5, 'Водопад'], [1e7, 'Океан'], [1e9, 'Цунами'], [1e11, 'Вселенная']]
    .forEach(([n, name]) => ACH.push({ id: 'p' + n, name, icon: '📈', desc: `Производи ${fmt(n)} ресурсов в секунду`, check: () => M.totalProd >= n }));
  [[1, 'Загадай желание'], [10, 'Звездопад'], [50, 'Ловец звёзд']]
    .forEach(([n, name]) => ACH.push({ id: 's' + n, name, icon: '⭐', desc: `Поймай ${n} падающих звёзд`, check: () => S.stats.stars >= n }));
  [[1, 'Новое начало'], [5, 'Колесо истории'], [20, 'Вечное возвращение']]
    .forEach(([n, name]) => ACH.push({ id: 'pr' + n, name, icon: '🔄', desc: `Переродись ${n} раз`, check: () => S.stats.prestiges >= n }));
  ACH.push({ id: 'magnate', name: 'Магнат', icon: '🎩', desc: 'Имей 100 построек одного вида', check: () => BUILDINGS.some(b => (S.bld[b.id] || 0) >= 100) });
  ACH.push({ id: 'scholar', name: 'Мудрец', icon: '🦉', desc: 'Изучи 50 улучшений', check: () => Object.keys(S.upg).length >= 50 });
}

/* ---------- УТИЛИТЫ ---------- */

const SUFFIX = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
function fmt(n) {
  if (!isFinite(n)) return '∞';
  if (n < 0) return '-' + fmt(-n);
  if (n < 1) return n === 0 ? '0' : n.toFixed(2).replace(/\.?0+$/, '');
  if (n < 1000) return n < 10 && n % 1 ? n.toFixed(1).replace(/\.0$/, '') : String(Math.floor(n));
  const e = Math.floor(Math.log10(n) / 3);
  if (e < SUFFIX.length) {
    const v = n / Math.pow(1000, e);
    return (v < 10 ? v.toFixed(2) : v < 100 ? v.toFixed(1) : Math.floor(v)) + SUFFIX[e];
  }
  return n.toExponential(2).replace('+', '');
}
function fmtTime(sec) {
  sec = Math.floor(sec);
  const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
  if (h) return `${h} ч ${m} мин`;
  if (m) return `${m} мин ${s} с`;
  return `${s} с`;
}
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------- СОСТОЯНИЕ ---------- */

const SAVE_KEY = 'eraclicker_save_v1';
let S, M = { totalProd: 0, prod: {} };

function freshRun(base) {
  const s = base || {};
  s.res = Object.fromEntries(RES_IDS.map(r => [r, 0]));
  s.bld = {};
  s.upg = {};
  s.era = 0;
  s.runEarned = 0;
  s.runStart = Date.now();
  s.buffs = [];
  return s;
}
function freshState() {
  const s = freshRun({});
  Object.assign(s, {
    allEarned: 0, legacy: 0, chips: 0, perks: {}, ach: {},
    stats: { clicks: 0, stars: 0, prestiges: 0, maxEra: 0, bought: 0, earnedRes: Object.fromEntries(RES_IDS.map(r => [r, 0])), playTime: 0 },
    sound: true, buyAmt: '1', started: Date.now(), lastSave: Date.now(), seenIntro: false,
  });
  return s;
}
function applyStartPerk() {
  if (!S.perks.start) return;
  S.bld.gatherer = (S.bld.gatherer || 0) + 5;
  S.bld.woodcutter = (S.bld.woodcutter || 0) + 5;
  S.res.food += 1000; S.res.wood += 1000;
}

function save() {
  S.lastSave = Date.now();
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* хранилище недоступно */ }
}
function load() {
  S = freshState();
  let raw = null;
  try { raw = localStorage.getItem(SAVE_KEY); } catch (e) { /* ignore */ }
  if (raw) {
    try { mergeSave(JSON.parse(raw)); } catch (e) { console.warn('Сохранение повреждено', e); }
  }
}
function mergeSave(d) {
  const base = freshState();
  S = Object.assign(base, d);
  S.res = Object.assign(base.res, d.res || {});
  S.stats = Object.assign(freshState().stats, d.stats || {});
  S.stats.earnedRes = Object.assign(freshState().stats.earnedRes, (d.stats || {}).earnedRes || {});
  S.buffs = (d.buffs || []).filter(b => b.until > Date.now());
  S.era = Math.min(S.era, ERAS.length - 1);
}

/* ---------- РАСЧЁТЫ ---------- */

function achCount() { return Object.keys(S.ach).length; }
function totalBuildings() { let n = 0; for (const k in S.bld) n += S.bld[k]; return n; }
function buffMult(type) {
  let m = 1; const now = Date.now();
  for (const b of S.buffs) if (b.type === type && b.until > now) m *= b.mult;
  return m;
}

function recalc() {
  M = { bld: {}, res: {}, all: 1, click: 1, clickPct: 0, efreq: 1, edur: 1, cost: 1, eraCost: 1, prod: {}, totalProd: 0 };
  BUILDINGS.forEach(b => M.bld[b.id] = 1);
  RES_IDS.forEach(r => M.res[r] = 1);
  for (const id in S.upg) {
    const u = UMAP[id]; if (!u) continue;
    for (const e of u.eff) {
      if (e.t === 'res') M.res[e.r] *= e.v;
      else if (e.t === 'all') M.all *= e.v;
      else if (e.t === 'bld') M.bld[e.b] *= e.v;
      else if (e.t === 'click') M.click *= e.v;
      else if (e.t === 'clickpct') M.clickPct += e.v;
      else if (e.t === 'efreq') M.efreq *= e.v;
      else if (e.t === 'edur') M.edur *= e.v;
    }
  }
  const P = S.perks;
  if (P.hand) M.click *= 5;
  if (P.builders) M.cost *= 0.9;
  if (P.stargazer) M.efreq *= 2;
  if (P.memory) M.eraCost *= 0.75;
  if (P.golden) M.all *= 2;
  if (P.eternal) { M.all *= 3; M.click *= 3; }
  M.eraBonus = Math.pow(1.25, S.era);
  M.legacyBonus = 1 + 0.05 * S.legacy;
  M.achBonus = 1 + 0.02 * achCount();
  M.all *= M.eraBonus * M.legacyBonus * M.achBonus;
  for (const r of RES_IDS) M.prod[r] = 0;
  for (const b of BUILDINGS) {
    const n = S.bld[b.id] || 0; if (!n) continue;
    for (const r in b.prod) M.prod[r] += n * b.prod[r] * M.bld[b.id];
  }
  for (const r of RES_IDS) { M.prod[r] *= M.res[r] * M.all; M.totalProd += M.prod[r]; }
}
function prodNow(r) { return M.prod[r] * buffMult('prod'); }
function clickValue(r) {
  return (M.click * M.all + M.clickPct * M.prod[r]) * buffMult('click');
}
function bldUnitCost(b, owned) {
  const k = Math.pow(COST_GROWTH, owned) * M.cost, c = {};
  for (const r in b.cost) c[r] = Math.ceil(b.cost[r] * k);
  return c;
}
function bldBulkCost(b, owned, n) {
  const k = Math.pow(COST_GROWTH, owned) * (Math.pow(COST_GROWTH, n) - 1) / (COST_GROWTH - 1) * M.cost, c = {};
  for (const r in b.cost) c[r] = Math.ceil(b.cost[r] * k);
  return c;
}
function bldMaxAfford(b, owned) {
  let n = Infinity;
  for (const r in b.cost) {
    const first = b.cost[r] * Math.pow(COST_GROWTH, owned) * M.cost;
    const k = Math.floor(Math.log(1 + S.res[r] * (COST_GROWTH - 1) / first) / Math.log(COST_GROWTH));
    n = Math.min(n, k);
  }
  return Math.max(0, Math.min(n, 1000));
}
function canAfford(cost) { for (const r in cost) if (S.res[r] < cost[r]) return false; return true; }
function pay(cost) { for (const r in cost) S.res[r] -= cost[r]; }
function eraCost(i) {
  const c = {};
  for (const r in ERAS[i].cost) c[r] = Math.ceil(ERAS[i].cost[r] * M.eraCost);
  return c;
}
function legacyPotential() { return Math.floor(Math.cbrt(S.allEarned / 1e7)); }
function legacyGain() { return Math.max(0, legacyPotential() - S.legacy); }

function gain(r, v) {
  S.res[r] += v; S.runEarned += v; S.allEarned += v; S.stats.earnedRes[r] += v;
}

/* ---------- ДЕЙСТВИЯ ---------- */

function doClick(r, x, y) {
  if (ERAS[S.era] && RESMAP[r].era > S.era) return;
  const v = clickValue(r);
  gain(r, v);
  S.stats.clicks++;
  floatText(`+${fmt(v)} ${RESMAP[r].icon}`, x, y);
  beep(300 + RES_IDS.indexOf(r) * 90, 0.05);
}

function buyBuilding(id) {
  const b = BMAP[id], owned = S.bld[id] || 0;
  let n = S.buyAmt === 'max' ? bldMaxAfford(b, owned) : +S.buyAmt;
  if (n < 1) n = 1;
  const cost = bldBulkCost(b, owned, n);
  if (!canAfford(cost)) { beep(120, 0.08); return; }
  pay(cost);
  S.bld[id] = owned + n;
  S.stats.bought += n;
  recalc();
  beep(520, 0.07);
  renderBuildings(); renderScene();
}

function buyUpgrade(id) {
  const u = UMAP[id];
  if (!u || S.upg[id] || !upgVisible(u) || !canAfford(u.cost)) return;
  pay(u.cost);
  S.upg[id] = 1;
  recalc();
  beep(660, 0.1);
  toast(`${u.icon} Изучено: ${u.name}`);
  renderUpgrades(); renderBuildings(); renderClickTiles();
}

function advanceEra() {
  const i = S.era + 1;
  if (i >= ERAS.length) return;
  const c = eraCost(i);
  if (!canAfford(c)) return;
  pay(c);
  S.era = i;
  S.stats.maxEra = Math.max(S.stats.maxEra, i);
  recalc();
  renderAll();
  fanfare();
  const newB = BUILDINGS.filter(b => b.era === i).map(b => `${b.icon} ${b.name}`).join(', ');
  const newR = RES.filter(r => r.era === i).map(r => `${r.icon} ${r.name}`).join(', ');
  showModal(`<div class="bigicon">${ERAS[i].icon}</div><h2>${ERAS[i].name}</h2><p>${ERAS[i].desc}</p>
    ${newR ? `<p>Новый ресурс: <b>${newR}</b></p>` : ''}
    <p>Новые постройки: <b>${newB}</b></p>
    <p>Бонус эпохи: всё производство и клик <b>×1.25</b></p>`);
}

function doPrestige() {
  const g = legacyGain();
  if (S.era < 4 || g < 1) return;
  showModal(`<div class="bigicon">👑</div><h2>Перерождение</h2>
    <p>Цивилизация начнётся заново с каменного века. Ресурсы, постройки, улучшения и эпохи сбросятся.</p>
    <p>Ты получишь <b>${g}</b> 👑 очков наследия: каждое навсегда даёт <b>+5%</b> ко всему, а ещё их можно потратить на особые умения.</p>
    <p>Достижения и умения наследия останутся.</p>`,
    [{ text: 'Переродиться', cls: 'gold', fn: () => {
      S.legacy += g; S.chips += g; S.stats.prestiges++;
      freshRun(S);
      applyStartPerk();
      recalc(); renderAll(); save();
      fanfare();
      toast(`👑 Новое начало! Наследие: ${S.legacy}`);
    } }, { text: 'Отмена' }]);
}

function buyPerk(id) {
  const p = PERKS.find(x => x.id === id);
  if (!p || S.perks[id] || S.chips < p.cost) return;
  S.chips -= p.cost;
  S.perks[id] = 1;
  if (id === 'start' && S.era === 0 && totalBuildings() === 0) applyStartPerk();
  recalc(); renderLegacy(); renderBuildings();
  beep(700, 0.12);
  toast(`${p.icon} Умение: ${p.name}`);
}

/* ---------- ПАДАЮЩАЯ ЗВЕЗДА ---------- */

let nextStar = Date.now() + 40000, starHide = 0;
function scheduleStar() { nextStar = Date.now() + (60 + Math.random() * 120) * 1000 / M.efreq; }
function showStar() {
  const el = $('#star'), area = $('#left').getBoundingClientRect();
  el.style.left = (area.left + 30 + Math.random() * Math.max(10, area.width - 90)) + 'px';
  el.style.top = (area.top + 60 + Math.random() * Math.max(10, area.height - 160)) + 'px';
  el.hidden = false;
  starHide = Date.now() + 13000;
}
function hideStar() { $('#star').hidden = true; starHide = 0; scheduleStar(); }
function catchStar() {
  hideStar();
  S.stats.stars++;
  const roll = Math.random(), dur = M.edur;
  if (roll < 0.45) {
    S.buffs.push({ type: 'prod', mult: 7, until: Date.now() + 30000 * dur, name: 'Золотой век', icon: '🌟' });
    toast('🌟 Золотой век! Производство ×7');
  } else if (roll < 0.75) {
    S.buffs.push({ type: 'click', mult: 30, until: Date.now() + 15000 * dur, name: 'Клик-буря', icon: '⚡' });
    toast('⚡ Клик-буря! Клик ×30');
  } else {
    const parts = [];
    for (const r of RES) {
      if (r.era > S.era) continue;
      const v = Math.max(20 * clickValue(r.id), Math.min(S.res[r.id] * 0.25, M.prod[r.id] * 900));
      gain(r.id, v);
      parts.push(`${r.icon}${fmt(v)}`);
    }
    toast('💎 Клад! ' + parts.join(' '));
  }
  fanfare();
}

/* ---------- ОТРИСОВКА ---------- */

function costHTML(cost) {
  return Object.entries(cost).map(([r, v]) =>
    `<span class="c ${S.res[r] >= v ? 'ok' : 'no'}" data-r="${r}" data-v="${v}">${RESMAP[r].icon}${fmt(v)}</span>`).join('');
}
function refreshCosts(root) {
  root.querySelectorAll('.c[data-r]').forEach(el => {
    const ok = S.res[el.dataset.r] >= +el.dataset.v;
    el.classList.toggle('ok', ok); el.classList.toggle('no', !ok);
  });
}
function effText(e) {
  switch (e.t) {
    case 'res': return `${RESMAP[e.r].icon} ${RESMAP[e.r].name}: производство ×${e.v}`;
    case 'all': return `Всё производство ×${e.v}`;
    case 'bld': return `${BMAP[e.b].name}: производство ×${e.v}`;
    case 'click': return `Сила клика ×${e.v}`;
    case 'clickpct': return `Клик даёт ещё ${e.v * 100}% от производства в секунду`;
    case 'efreq': return `Падающие звёзды чаще ×${e.v}`;
    case 'edur': return `Эффекты звёзд дольше ×${e.v}`;
  }
  return '';
}
function prodText(b) {
  return Object.entries(b.prod).map(([r, v]) => `${RESMAP[r].icon}${fmt(v * M.bld[b.id] * M.res[r] * M.all)}/с`).join(' ');
}

function renderResBar() {
  $('#resbar').innerHTML = RES.filter(r => r.era <= S.era).map(r =>
    `<div class="res" title="${r.name}"><span class="ri">${r.icon}</span><div><b id="ra-${r.id}">0</b><small id="rr-${r.id}">+0/с</small></div></div>`).join('');
}
function renderClickTiles() {
  $('#clickArea').innerHTML = RES.filter(r => r.era <= S.era).map(r =>
    `<button class="tile" data-r="${r.id}"><span class="ti">${r.icon}</span><span class="tn">${r.name}</span><span class="tv" id="tv-${r.id}"></span></button>`).join('');
}
function renderBuildings() {
  const list = BUILDINGS.filter(b => b.era <= S.era);
  const next = BUILDINGS.find(b => b.era === S.era + 1);
  let html = list.slice().reverse().map(b => {
    const n = S.bld[b.id] || 0;
    return `<div class="card bld" data-b="${b.id}">
      <div class="ci">${b.icon}</div>
      <div class="cb"><div class="cn">${b.name} <span class="own">${n}</span></div>
        <div class="cd">${b.desc}</div>
        <div class="cp">Каждый: ${prodText(b)}</div>
        <div class="cc" id="bc-${b.id}"></div></div>
    </div>`;
  }).join('');
  if (next) html = `<div class="card locked"><div class="ci">❔</div><div class="cb"><div class="cn">???</div><div class="cd">Откроется в эпоху «${ERAS[next.era].name}»</div></div></div>` + html;
  $('#buildList').innerHTML = html;
  updateBuildings();
}
function updateBuildings() {
  for (const b of BUILDINGS) {
    if (b.era > S.era) continue;
    const el = document.getElementById('bc-' + b.id); if (!el) continue;
    const owned = S.bld[b.id] || 0;
    let n = S.buyAmt === 'max' ? Math.max(1, bldMaxAfford(b, owned)) : +S.buyAmt;
    const cost = bldBulkCost(b, owned, n);
    const key = n + ':' + JSON.stringify(cost);
    if (el.dataset.key !== key) { el.dataset.key = key; el.innerHTML = (n > 1 ? `<span class="cnt">×${n}</span>` : '') + costHTML(cost); }
    else refreshCosts(el);
    el.parentNode.parentNode.classList.toggle('can', canAfford(cost));
  }
}

function upgVisible(u) {
  if (u.era > S.era) return false;
  if (u.need && (S.bld[u.need.b] || 0) < u.need.n) return false;
  return true;
}
function costWeight(c) { let s = 0; for (const r in c) s += c[r] * Math.pow(30, RES_IDS.indexOf(r)); return s; }
let upgSig = '';
function availableUpgrades() {
  return UPGRADES.filter(u => !S.upg[u.id] && upgVisible(u)).sort((a, b) => costWeight(a.cost) - costWeight(b.cost));
}
function renderUpgrades() {
  const av = availableUpgrades();
  upgSig = av.map(u => u.id).join(',');
  $('#upgList').innerHTML = av.length ? av.map(u => `<div class="card upg" data-u="${u.id}">
      <div class="ci">${u.icon}</div>
      <div class="cb"><div class="cn">${u.name}</div><div class="cd">${u.eff.map(effText).join('<br>')}</div>
      <div class="cc">${costHTML(u.cost)}</div></div></div>`).join('')
    : '<p class="muted">Новых улучшений пока нет. Строй больше построек или перейди в новую эпоху.</p>';
  const owned = UPGRADES.filter(u => S.upg[u.id]);
  $('#upgOwned').innerHTML = owned.length ? owned.map(u => `<span class="chip" title="${esc(u.name + ': ' + u.eff.map(effText).join(', '))}">${u.icon}</span>`).join('') : '<p class="muted">Пока ничего.</p>';
  updateUpgrades();
}
function updateUpgrades() {
  let affordable = 0;
  document.querySelectorAll('#upgList .upg').forEach(el => {
    const u = UMAP[el.dataset.u];
    const ok = canAfford(u.cost);
    if (ok) affordable++;
    el.classList.toggle('can', ok);
    refreshCosts(el);
  });
  const badge = $('#upgBadge');
  badge.hidden = !affordable; badge.textContent = affordable;
}

function renderEra() {
  const cur = ERAS[S.era], i = S.era + 1, nx = ERAS[i];
  let html = `<div class="eracur"><div class="bigicon">${cur.icon}</div><div><h3>${cur.name}</h3><p>${cur.desc}</p>
    <p class="muted">Бонус эпох: всё ×${fmt(M.eraBonus)} (по ×1.25 за каждую)</p></div></div>`;
  if (nx) {
    const c = eraCost(i);
    html += `<div class="nextera"><h3>Следующая: ${nx.icon} ${nx.name}</h3><p>${nx.desc}</p>
      ${Object.entries(c).map(([r, v]) => `<div class="req"><span>${RESMAP[r].icon} ${RESMAP[r].name}</span>
        <div class="bar"><i id="eb-${r}"></i></div><small id="et-${r}"></small></div>`).join('')}
      <button id="eraBtn" class="big gold">Перейти в новую эпоху</button></div>`;
  } else {
    html += `<div class="nextera"><h3>🌌 Вершина достигнута!</h3><p>Ты прошёл все эпохи. Переродись во вкладке «Наследие», чтобы стать ещё сильнее.</p></div>`;
  }
  html += `<h4>История</h4><div class="timeline">${ERAS.map((e, k) =>
    `<div class="te ${k < S.era ? 'done' : k === S.era ? 'now' : ''}"><span>${k <= S.stats.maxEra ? e.icon : '❔'}</span><small>${k <= S.stats.maxEra ? e.name : '???'}</small></div>`).join('')}</div>`;
  $('#p-era').innerHTML = html;
  updateEra();
}
function updateEra() {
  const i = S.era + 1, nx = ERAS[i];
  let ready = false;
  if (nx) {
    const c = eraCost(i);
    ready = canAfford(c);
    for (const r in c) {
      const bar = document.getElementById('eb-' + r); if (!bar) continue;
      bar.style.width = Math.min(100, S.res[r] / c[r] * 100) + '%';
      document.getElementById('et-' + r).textContent = `${fmt(Math.min(S.res[r], c[r]))} / ${fmt(c[r])}`;
    }
    const btn = $('#eraBtn'); if (btn) btn.disabled = !ready;
  }
  $('#eraBadge').hidden = !ready;
}

function renderLegacy() {
  const g = legacyGain();
  $('#p-legacy').innerHTML = `<div class="legacyhead">
      <div><div class="bigicon">👑</div></div>
      <div><h3>Наследие: ${S.legacy}</h3>
      <p>Бонус ко всему: <b>+${S.legacy * 5}%</b>. Очков для умений: <b id="chips">${S.chips}</b> 👑</p></div></div>
    <div class="nextera">
      <p>Перерождение доступно с эпохи «${ERAS[4].name}». Чем больше ресурсов ты добыл за всю игру, тем больше очков получишь.</p>
      <p>Сейчас получишь: <b id="lgain">${g}</b> 👑 <small class="muted" id="lnext"></small></p>
      <button id="prestigeBtn" class="big gold">Переродиться</button>
    </div>
    <h4>Умения наследия</h4>
    <div id="perkList">${PERKS.map(p => `<div class="card perk ${S.perks[p.id] ? 'owned' : ''}" data-p="${p.id}">
      <div class="ci">${p.icon}</div><div class="cb"><div class="cn">${p.name}</div><div class="cd">${p.desc}</div>
      <div class="cc">${S.perks[p.id] ? '<span class="c ok">✔ Изучено</span>' : `<span class="c">👑 ${p.cost}</span>`}</div></div></div>`).join('')}</div>`;
  updateLegacy();
}
function updateLegacy() {
  const g = legacyGain();
  const el = $('#lgain'); if (!el) return;
  el.textContent = g;
  const nextAt = Math.pow(legacyPotential() + 1, 3) * 1e7;
  $('#lnext').textContent = `(следующее очко при ${fmt(nextAt)} добытых ресурсов за всё время, сейчас ${fmt(S.allEarned)})`;
  $('#prestigeBtn').disabled = S.era < 4 || g < 1;
  document.querySelectorAll('#perkList .perk').forEach(c => {
    const p = PERKS.find(x => x.id === c.dataset.p);
    c.classList.toggle('can', !S.perks[p.id] && S.chips >= p.cost);
  });
}

function renderAch() {
  $('#p-ach').innerHTML = `<p>Открыто <b>${achCount()}</b> из ${ACH.length}. Каждое достижение даёт <b>+2%</b> ко всему.</p>
    <div class="achgrid">${ACH.map(a => `<div class="ach ${S.ach[a.id] ? 'got' : ''}" title="${esc(a.name + ' — ' + a.desc)}">
      <span>${S.ach[a.id] ? a.icon : '🔒'}</span><small>${a.name}</small><em>${a.desc}</em></div>`).join('')}</div>`;
}
function checkAch() {
  let changed = false;
  for (const a of ACH) {
    if (!S.ach[a.id] && a.check()) {
      S.ach[a.id] = Date.now(); changed = true;
      toast(`🏆 Достижение: ${a.name}`);
    }
  }
  if (changed) { recalc(); if (activeTab === 'ach') renderAch(); }
}

function renderStats() {
  const st = S.stats;
  const rows = [
    ['Время в игре', fmtTime(st.playTime)],
    ['Текущая эпоха', `${ERAS[S.era].icon} ${ERAS[S.era].name}`],
    ['Всего кликов', fmt(st.clicks)],
    ['Построек сейчас', fmt(totalBuildings())],
    ['Построек куплено за всё время', fmt(st.bought)],
    ['Улучшений изучено', Object.keys(S.upg).length + ' / ' + UPGRADES.length],
    ['Падающих звёзд поймано', st.stars],
    ['Перерождений', st.prestiges],
    ['Ресурсов за это перерождение', fmt(S.runEarned)],
    ['Ресурсов за всё время', fmt(S.allEarned)],
    ['Множитель производства', '×' + fmt(M.all)],
    ['Множитель клика', '×' + fmt(M.click * M.all)],
    ...RES.map(r => [`${r.icon} ${r.name} добыто всего`, fmt(st.earnedRes[r.id])]),
  ];
  $('#p-stats').innerHTML = `<table class="stats">${rows.map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join('')}</table>`;
}

function renderSettings() {
  $('#p-set').innerHTML = `<h3>Настройки</h3>
    <p class="muted">Игра сохраняется сама каждые 10 секунд в этом браузере.</p>
    <div class="setbtns">
      <button id="saveBtn">💾 Сохранить сейчас</button>
      <button id="soundBtn">${S.sound ? '🔊 Звук: вкл' : '🔇 Звук: выкл'}</button>
      <button id="exportBtn">📤 Экспорт сохранения</button>
      <button id="importBtn">📥 Импорт сохранения</button>
      <button id="resetBtn" class="danger">🗑️ Начать всё с нуля</button>
    </div>
    <textarea id="saveText" placeholder="Сюда появится код сохранения. Чтобы загрузить — вставь код и нажми «Импорт»."></textarea>
    <h4>Как играть</h4>
    <ul class="help">
      <li>Нажимай на ресурсы слева, чтобы добывать их.</li>
      <li>Покупай постройки — они добывают ресурсы сами, даже когда игра закрыта.</li>
      <li>Изучай улучшения, чтобы всё работало быстрее.</li>
      <li>Накопи ресурсы и перейди в новую эпоху: откроются новые ресурсы и постройки.</li>
      <li>Лови падающие звёзды ⭐ — они дают мощные бонусы.</li>
      <li>С эпохи Возрождения можно переродиться и получить вечные бонусы наследия.</li>
    </ul>`;
}

function renderScene() {
  const e = ERAS[S.era];
  $('#left').style.setProperty('--sky1', e.sky[0]);
  $('#left').style.setProperty('--sky2', e.sky[1]);
  $('#left').style.setProperty('--ground', e.ground);
  $('#sky').textContent = e.sun;
  const owned = BUILDINGS.filter(b => S.bld[b.id]);
  $('#sceneItems').innerHTML = owned.length
    ? owned.map(b => `<span class="si" title="${b.name}">${b.icon}<i>${fmt(S.bld[b.id])}</i></span>`).join('')
    : '<span class="muted small">Здесь вырастет твоя цивилизация</span>';
  $('#eraIcon').textContent = e.icon;
  $('#eraName').textContent = e.name;
  document.body.dataset.era = S.era;
}

function renderGoal() {
  const i = S.era + 1;
  let html;
  if (i < ERAS.length) {
    const c = eraCost(i);
    html = `🎯 Цель: ${Object.entries(c).map(([r, v]) => `${RESMAP[r].icon}${fmt(v)}`).join(' ')} → ${ERAS[i].icon} ${ERAS[i].name}`;
  } else html = '🌌 Все эпохи пройдены! Перерождайся ради наследия.';
  const g = $('#goal'); if (g.innerHTML !== html) g.innerHTML = html;
}

function renderBuffs() {
  const now = Date.now();
  S.buffs = S.buffs.filter(b => b.until > now);
  $('#buffs').innerHTML = S.buffs.map(b => `<div class="buff">${b.icon} ${b.name} ×${b.mult} <b>${Math.ceil((b.until - now) / 1000)}с</b></div>`).join('');
}

function renderAll() {
  renderResBar(); renderClickTiles(); renderBuildings(); renderUpgrades(); renderEra();
  renderLegacy(); renderAch(); renderStats(); renderSettings(); renderScene(); renderGoal();
  setBuyAmt(S.buyAmt);
  updateUI();
}

function updateUI() {
  for (const r of RES) {
    if (r.era > S.era) continue;
    const a = document.getElementById('ra-' + r.id); if (!a) continue;
    a.textContent = fmt(S.res[r.id]);
    document.getElementById('rr-' + r.id).textContent = `+${fmt(prodNow(r.id))}/с`;
    document.getElementById('tv-' + r.id).textContent = `+${fmt(clickValue(r.id))} за клик`;
  }
  updateBuildings();
  const sig = availableUpgrades().map(u => u.id).join(',');
  if (sig !== upgSig) renderUpgrades(); else updateUpgrades();
  updateEra();
  if (activeTab === 'legacy') updateLegacy();
  renderGoal();
  renderBuffs();
}

/* ---------- ЭФФЕКТЫ ---------- */

function floatText(text, x, y) {
  const el = document.createElement('div');
  el.className = 'float';
  el.textContent = text;
  el.style.left = (x + (Math.random() * 30 - 15)) + 'px';
  el.style.top = (y - 10) + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}
function toast(text) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = text;
  const box = $('#toasts');
  box.appendChild(el);
  while (box.children.length > 4) box.firstChild.remove();
  setTimeout(() => el.classList.add('out'), 3200);
  setTimeout(() => el.remove(), 3800);
}
function showModal(html, buttons) {
  $('#modalBody').innerHTML = html;
  const box = $('#modalBtns');
  box.innerHTML = '';
  (buttons || [{ text: 'Отлично!' }]).forEach(b => {
    const btn = document.createElement('button');
    btn.textContent = b.text;
    if (b.cls) btn.className = b.cls;
    btn.onclick = () => { $('#modal').hidden = true; if (b.fn) b.fn(); };
    box.appendChild(btn);
  });
  $('#modal').hidden = false;
}

let actx = null;
function beep(freq, dur) {
  if (!S.sound) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = 'triangle'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.08, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + dur);
    o.connect(g); g.connect(actx.destination);
    o.start(); o.stop(actx.currentTime + dur);
  } catch (e) { /* без звука */ }
}
function fanfare() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.15), i * 110)); }

/* ---------- ВКЛАДКИ И СОБЫТИЯ ---------- */

let activeTab = 'build';
function setTab(t) {
  activeTab = t;
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
  document.querySelectorAll('.panel').forEach(p => p.classList.toggle('on', p.id === 'p-' + t));
  if (t === 'ach') renderAch();
  if (t === 'stats') renderStats();
  if (t === 'legacy') renderLegacy();
  if (t === 'era') renderEra();
}
function setBuyAmt(a) {
  S.buyAmt = a;
  document.querySelectorAll('.buyamt button').forEach(b => b.classList.toggle('on', b.dataset.amt === a));
  updateBuildings();
}

function bindEvents() {
  $('#tabs').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setTab(b.dataset.tab); });
  $('.buyamt').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setBuyAmt(b.dataset.amt); });
  $('#clickArea').addEventListener('click', e => {
    const t = e.target.closest('.tile'); if (!t) return;
    const x = e.clientX || t.getBoundingClientRect().left + 40, y = e.clientY || t.getBoundingClientRect().top + 20;
    doClick(t.dataset.r, x, y);
    t.classList.remove('pop'); void t.offsetWidth; t.classList.add('pop');
    updateUI();
  });
  $('#buildList').addEventListener('click', e => { const c = e.target.closest('[data-b]'); if (c) buyBuilding(c.dataset.b); });
  $('#upgList').addEventListener('click', e => { const c = e.target.closest('[data-u]'); if (c) buyUpgrade(c.dataset.u); });
  $('#p-era').addEventListener('click', e => { if (e.target.id === 'eraBtn') advanceEra(); });
  $('#p-legacy').addEventListener('click', e => {
    if (e.target.id === 'prestigeBtn') return doPrestige();
    const c = e.target.closest('[data-p]'); if (c) buyPerk(c.dataset.p);
  });
  $('#p-set').addEventListener('click', e => {
    const id = e.target.id;
    if (id === 'saveBtn') { save(); toast('💾 Сохранено'); }
    else if (id === 'soundBtn') toggleSound();
    else if (id === 'exportBtn') {
      save();
      $('#saveText').value = btoa(unescape(encodeURIComponent(JSON.stringify(S))));
      $('#saveText').select();
      toast('📤 Скопируй код из поля ниже');
    } else if (id === 'importBtn') {
      try {
        const d = JSON.parse(decodeURIComponent(escape(atob($('#saveText').value.trim()))));
        if (!d || !d.res) throw new Error('bad');
        mergeSave(d); recalc(); renderAll(); save();
        toast('📥 Сохранение загружено');
      } catch (err) { toast('❌ Неверный код сохранения'); }
    } else if (id === 'resetBtn') {
      showModal('<h2>Начать с нуля?</h2><p>Удалится <b>всё</b>: ресурсы, наследие и достижения. Отменить нельзя.</p>',
        [{ text: 'Удалить всё', cls: 'danger', fn: () => { S = freshState(); S.seenIntro = true; recalc(); renderAll(); save(); toast('Новая игра'); } }, { text: 'Отмена' }]);
    }
  });
  $('#muteBtn').addEventListener('click', toggleSound);
  $('#star').addEventListener('click', catchStar);
  window.addEventListener('beforeunload', save);
  document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
}
function toggleSound() {
  S.sound = !S.sound;
  $('#muteBtn').textContent = S.sound ? '🔊' : '🔇';
  renderSettings();
}

/* ---------- ИГРОВОЙ ЦИКЛ ---------- */

let last = Date.now(), lastAch = 0, lastSaveT = Date.now(), lastStats = 0;
function tick() {
  const now = Date.now();
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0) {
    if (dt > 60) { offlineGain(dt); dt = 0; }
    const bm = buffMult('prod');
    for (const r of RES_IDS) if (M.prod[r]) gain(r, M.prod[r] * bm * dt);
    S.stats.playTime += dt;
  }
  if (!starHide && now > nextStar && !document.hidden) showStar();
  if (starHide && now > starHide) hideStar();
  if (now - lastAch > 1000) { lastAch = now; checkAch(); if (activeTab === 'stats') renderStats(); }
  if (now - lastSaveT > 10000) { lastSaveT = now; save(); }
  updateUI();
}

function offlineGain(sec) {
  const full = !!S.perks.chronicle;
  const cap = full ? 24 * 3600 : 8 * 3600;
  const t = Math.min(sec, cap), k = full ? 1 : 0.5;
  const parts = [];
  for (const r of RES) {
    const v = M.prod[r.id] * t * k;
    if (v > 0) { gain(r.id, v); parts.push(`${r.icon} ${fmt(v)}`); }
  }
  if (parts.length) showModal(`<div class="bigicon">🌙</div><h2>С возвращением!</h2>
    <p>Тебя не было ${fmtTime(sec)}. Пока ты отдыхал, твой народ работал${full ? '' : ' (50% скорости)'}:</p>
    <p class="loot">${parts.join('<br>')}</p>`);
}

/* ---------- СТАРТ ---------- */

function start() {
  buildAch();
  load();
  recalc();
  bindEvents();
  $('#muteBtn').textContent = S.sound ? '🔊' : '🔇';
  renderAll();
  const away = (Date.now() - S.lastSave) / 1000;
  if (S.seenIntro && away > 60) offlineGain(away);
  if (!S.seenIntro) {
    S.seenIntro = true;
    showModal(`<div class="bigicon">🔥</div><h2>Era Clicker</h2>
      <p>Проведи своё племя от костра в пещере до полётов к звёздам!</p>
      <p>Нажимай на 🍖 еду и 🪵 дерево, нанимай работников, изучай открытия и переходи в новые эпохи.</p>`,
      [{ text: 'Начать!' }]);
  }
  scheduleStar();
  nextStar = Date.now() + 45000 / M.efreq;
  last = Date.now();
  setInterval(tick, 100);
}
start();
