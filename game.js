'use strict';
/* «Державы» — оригинальная кликер-стратегия на карте Европы. */

const $ = s => document.querySelector(s);
const MD = window.MAPDATA;
const W = MD.W, H = MD.H, NP = MD.provs.length, NC = MD.countries.length;

/* ---------- КАРТА: разбор данных ---------- */
const PC0 = new Int16Array(NP), PX = new Float32Array(NP), PY = new Float32Array(NP), PN = new Int32Array(NP);
const PNAME = [], ADJ = [], SEA = [], NB = [];
MD.provs.forEach(([c, x, y, n, name, adj], i) => { PC0[i] = c; PX[i] = x + .5; PY[i] = y + .5; PN[i] = n; PNAME[i] = name; ADJ[i] = adj; SEA[i] = []; });
MD.sea.forEach(([a, b]) => { SEA[a].push(b); SEA[b].push(a); });
for (let i = 0; i < NP; i++) NB[i] = ADJ[i].concat(SEA[i]);
const CNAME = MD.countries.map(c => c.name);
const CAP0 = MD.countries.map(c => c.cap);

const ids = new Uint16Array(W * H);
(function decode() {
  const bin = atob(MD.rle); let pos = 0, k = 0;
  const rd = () => { let n = 0, sh = 0, b; do { b = bin.charCodeAt(pos++); n += (b & 127) * Math.pow(2, sh); sh += 7; } while (b & 128); return n; };
  while (pos < bin.length) { const v = rd(), r = rd(); ids.fill(v, k, k + r); k += r; }
})();
const provCells = (() => {
  const cnt = new Int32Array(NP);
  for (let i = 0; i < ids.length; i++) if (ids[i] >= 2) cnt[ids[i] - 2]++;
  const arr = Array.from(cnt, n => new Int32Array(n)); const f = new Int32Array(NP);
  for (let i = 0; i < ids.length; i++) if (ids[i] >= 2) { const p = ids[i] - 2; arr[p][f[p]++] = i; }
  return arr;
})();

/* ---------- ЦВЕТА ---------- */
const PALETTE = ['#c9735e', '#d9a95e', '#93b36c', '#6fa5b3', '#9c84c4', '#d283a8', '#c7c060', '#6390d0', '#b8743f', '#7ec2a3',
  '#e08c6c', '#a7a65f', '#8d74b0', '#5ea67f', '#cf9f7c', '#7d90c0', '#b05f72', '#d6c48f'];
const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const CCOL = (() => {
  const nb = Array.from({ length: NC }, () => new Set());
  for (let p = 0; p < NP; p++) for (const q of NB[p]) if (PC0[p] !== PC0[q]) { nb[PC0[p]].add(PC0[q]); nb[PC0[q]].add(PC0[p]); }
  const res = new Array(NC);
  const order = [...Array(NC).keys()].sort((a, b) => nb[b].size - nb[a].size);
  order.forEach((c, k) => {
    for (let t = 0; t < PALETTE.length; t++) {
      const col = PALETTE[(k * 5 + t) % PALETTE.length];
      if (![...nb[c]].some(d => res[d] === col)) { res[c] = col; return; }
    }
    res[c] = PALETTE[k % PALETTE.length];
  });
  return res;
})();
const CRGB = CCOL.map(hex);

// бумажная текстура
const tex = new Float32Array(W * H);
(function noise() {
  let s = 777; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const G = 14, gw = Math.ceil(W / G) + 2, gh = Math.ceil(H / G) + 2, g = new Float32Array(gw * gh).map(() => r());
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const fx = x / G, fy = y / G, ix = fx | 0, iy = fy | 0, tx = fx - ix, ty = fy - iy;
    const a = g[iy * gw + ix], b = g[iy * gw + ix + 1], c = g[(iy + 1) * gw + ix], d = g[(iy + 1) * gw + ix + 1];
    const v = (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty;
    tex[y * W + x] = 0.9 + v * 0.12 + (r() - 0.5) * 0.05;
  }
})();
// глубина моря (расстояние до берега)
const seaD = new Uint8Array(W * H).fill(255);
(function () {
  let q = [];
  for (let i = 0; i < ids.length; i++) if (ids[i] !== 0) { seaD[i] = 0; q.push(i); }
  for (let d = 1; d <= 12 && q.length; d++) {
    const nq = [];
    for (const i of q) { const x = i % W; for (const j of [i - 1, i + 1, i - W, i + W]) { if (j < 0 || j >= ids.length || (j === i - 1 && x === 0) || (j === i + 1 && x === W - 1)) continue; if (seaD[j] === 255) { seaD[j] = d; nq.push(j); } } }
    q = nq;
  }
})();

/* ---------- ИГРОВЫЕ ДАННЫЕ ---------- */
const ERAS = [
  { name: 'Ренессанс', icon: '⚜️', year: 1500 }, { name: 'Эпоха пороха', icon: '🧨', year: 1550 },
  { name: 'Просвещение', icon: '📖', year: 1650 }, { name: 'Промышленная революция', icon: '🏭', year: 1780 },
  { name: 'Эпоха мировых войн', icon: '🪖', year: 1900 }, { name: 'Атомный век', icon: '⚛️', year: 1945 },
  { name: 'Информационная эра', icon: '💻', year: 1990 }, { name: 'Эра будущего', icon: '🚀', year: 2040 },
];
const TECHS = [
  { id: 'gunpowder', name: 'Порох', icon: '🧨', cost: 25, era: 1, eff: { atk: 1.5 } },
  { id: 'banking', name: 'Банковское дело', icon: '🏦', cost: 70, era: 1, eff: { gold: 1.5 } },
  { id: 'printing', name: 'Книгопечатание', icon: '📖', cost: 180, era: 2, eff: { sci: 1.5 } },
  { id: 'manufactory', name: 'Мануфактуры', icon: '🧵', cost: 450, era: 2, eff: { gold: 1.3 } },
  { id: 'cannons', name: 'Полевая артиллерия', icon: '💣', cost: 1100, era: 2, eff: { siege: 1.5 } },
  { id: 'steam', name: 'Паровая машина', icon: '♨️', cost: 3000, era: 3, eff: { gold: 1.5 } },
  { id: 'rail', name: 'Железные дороги', icon: '🚂', cost: 8000, era: 3, eff: { mp: 2, siege: 1.3 } },
  { id: 'rifles', name: 'Нарезное оружие', icon: '🎯', cost: 2e4, era: 3, eff: { def: 1.5 } },
  { id: 'electricity', name: 'Электричество', icon: '💡', cost: 5e4, era: 4, eff: { all: 1.5 } },
  { id: 'engine', name: 'Двигатель внутреннего сгорания', icon: '⚙️', cost: 1.3e5, era: 4, eff: { mp: 1.5 } },
  { id: 'aviation', name: 'Авиация', icon: '✈️', cost: 3.5e5, era: 4, eff: { siege: 1.5 } },
  { id: 'radio', name: 'Радио', icon: '📻', cost: 9e5, era: 5, eff: { sci: 2, diplo: 0.5 } },
  { id: 'nuclear', name: 'Ядерная физика', icon: '⚛️', cost: 2.5e6, era: 5, eff: { gold: 2 } },
  { id: 'rockets', name: 'Ракетостроение', icon: '🚀', cost: 7e6, era: 5, eff: { atk: 1.5 } },
  { id: 'computers', name: 'Компьютеры', icon: '💻', cost: 2e7, era: 6, eff: { sci: 3, click: 3 } },
  { id: 'internet', name: 'Интернет', icon: '🌐', cost: 6e7, era: 6, eff: { gold: 2 } },
  { id: 'drones', name: 'Беспилотники', icon: '🛸', cost: 2e8, era: 6, eff: { siege: 1.5 } },
  { id: 'ai', name: 'Искусственный интеллект', icon: '🧠', cost: 8e8, era: 7, eff: { all: 3 } },
  { id: 'fusion', name: 'Термоядерный синтез', icon: '🌞', cost: 4e9, era: 7, eff: { gold: 3 } },
  { id: 'orbital', name: 'Орбитальные станции', icon: '🛰️', cost: 2e10, era: 7, eff: { atk: 3, def: 3 } },
];
const TMAP = Object.fromEntries(TECHS.map(t => [t.id, t]));
const BUILDINGS = [
  { id: 'market', name: 'Рынок', icon: '⚖️', cost: 15, out: { gold: 1 }, req: null, desc: 'Торговцы платят пошлины.' },
  { id: 'farm', name: 'Ферма', icon: '🌾', cost: 25, out: { mp: 0.4 }, req: null, desc: 'Сытые деревни дают новобранцев.' },
  { id: 'school', name: 'Школа', icon: '📚', cost: 60, out: { sci: 0.2 }, req: null, desc: 'Грамотные люди двигают науку.' },
  { id: 'mine', name: 'Шахта', icon: '⛏️', cost: 140, out: { gold: 6 }, req: null, desc: 'Серебро и железо из недр.' },
  { id: 'barracks', name: 'Казармы', icon: '🏕️', cost: 900, out: { mp: 6 }, req: 'gunpowder', desc: 'Здесь обучают солдат.' },
  { id: 'bank', name: 'Банк', icon: '🏦', cost: 1300, out: { gold: 35 }, req: 'banking', desc: 'Кредиты и проценты.' },
  { id: 'university', name: 'Университет', icon: '🎓', cost: 2500, out: { sci: 4 }, req: 'printing', desc: 'Учёные и изобретатели.' },
  { id: 'manufactory', name: 'Мануфактура', icon: '🧵', cost: 1.6e4, out: { gold: 170 }, req: 'manufactory', desc: 'Ткани и товары на продажу.' },
  { id: 'factory', name: 'Завод', icon: '🏭', cost: 2.2e5, out: { gold: 1000 }, req: 'steam', desc: 'Станки работают день и ночь.' },
  { id: 'depot', name: 'Призывной пункт', icon: '🎖️', cost: 1.5e5, out: { mp: 120 }, req: 'rail', desc: 'Поезда везут новобранцев.' },
  { id: 'power', name: 'Электростанция', icon: '⚡', cost: 3e6, out: { gold: 7000 }, req: 'electricity', desc: 'Энергия для промышленности.' },
  { id: 'lab', name: 'Лаборатория', icon: '🧪', cost: 6e6, out: { sci: 600 }, req: 'radio', desc: 'Секретные исследования.' },
  { id: 'npp', name: 'АЭС', icon: '☢️', cost: 6e7, out: { gold: 6e4 }, req: 'nuclear', desc: 'Атом для мирной экономики.' },
  { id: 'datacenter', name: 'Дата-центр', icon: '🖥️', cost: 6e8, out: { sci: 3e4 }, req: 'computers', desc: 'Вычисления без конца.' },
  { id: 'fusion', name: 'Термоядерный реактор', icon: '🌞', cost: 3e10, out: { gold: 3e6 }, req: 'fusion', desc: 'Звезда в бутылке.' },
];
const UNITS = [
  { id: 'militia', name: 'Ополчение', icon: '🗡️', gold: 10, mp: 5, atk: 1, def: 2, req: null, desc: 'Крестьяне с вилами.' },
  { id: 'musket', name: 'Мушкетёры', icon: '💂', gold: 60, mp: 12, atk: 5, def: 6, req: 'gunpowder', desc: 'Залп — и в штыки!' },
  { id: 'cannon', name: 'Пушки', icon: '💣', gold: 500, mp: 25, atk: 30, def: 6, req: 'cannons', desc: 'Ломают крепостные стены.' },
  { id: 'rifle', name: 'Стрелковая дивизия', icon: '🎯', gold: 4000, mp: 80, atk: 70, def: 120, req: 'rifles', desc: 'Окопы и винтовки.' },
  { id: 'tank', name: 'Танковая дивизия', icon: '🛡️', gold: 1.2e5, mp: 300, atk: 900, def: 500, req: 'engine', desc: 'Стальной кулак прорыва.' },
  { id: 'plane', name: 'Авиаполк', icon: '✈️', gold: 1.2e6, mp: 800, atk: 5000, def: 1500, req: 'aviation', desc: 'Удары с неба.' },
  { id: 'missile', name: 'Ракетные войска', icon: '🚀', gold: 1.5e7, mp: 2000, atk: 4e4, def: 1e4, req: 'rockets', desc: 'Точно в цель за сотни километров.' },
  { id: 'drone', name: 'Рой дронов', icon: '🛸', gold: 2e8, mp: 4000, atk: 3e5, def: 1e5, req: 'drones', desc: 'Тысячи глаз и крыльев.' },
  { id: 'orbital', name: 'Орбитальная платформа', icon: '🛰️', gold: 4e9, mp: 1e4, atk: 3e6, def: 3e6, req: 'orbital', desc: 'Щит и меч с орбиты.' },
];
const BMAP = Object.fromEntries(BUILDINGS.map(b => [b.id, b]));
const UMAP = Object.fromEntries(UNITS.map(u => [u.id, u]));

const BAL = { eraK: 2.5, eraMin: 25, cede: 0.25, wlMin: 20, wlPow: 2.5, pw: 6, hp: 40, F: 0.008, siege: 0.15, tech: 6 };
TECHS.forEach((t, i) => t.cost *= i < 8 ? BAL.tech : 2.5);

/* ---------- УТИЛИТЫ ---------- */
const SUF = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
function fmt(n) {
  if (!isFinite(n)) return '∞';
  if (n < 0) return '-' + fmt(-n);
  if (n < 10) return n === 0 ? '0' : (Math.round(n * 10) / 10).toString();
  if (n < 1000) return String(Math.floor(n));
  const e = Math.floor(Math.log10(n) / 3);
  if (e < SUF.length) { const v = n / Math.pow(1000, e); return (v < 10 ? v.toFixed(2) : v < 100 ? v.toFixed(1) : Math.floor(v)) + SUF[e]; }
  return n.toExponential(2).replace('+', '');
}
function fmtTime(s) { s = Math.floor(s); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return h ? `${h} ч ${m} мин` : m ? `${m} мин ${s % 60} с` : `${s} с`; }
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const chip = c => `<i class="cchip" style="background:${CCOL[c]}"></i>`;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---------- СОСТОЯНИЕ ---------- */
const SAVE_KEY = 'derzhavy_save_v1';
let S;
let owner = new Int16Array(NP), dev = new Uint8Array(NP), cap = new Int16Array(NC);

function newWorld(pc, keep) {
  let seed = 4242 + (keep ? keep.wins * 97 : 0);
  const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  owner = Int16Array.from(PC0);
  dev = Uint8Array.from({ length: NP }, () => 1 + Math.floor(r() * 3));
  cap = Int16Array.from(CAP0);
  for (let c = 0; c < NC; c++) dev[cap[c]] = Math.max(dev[cap[c]], 4);
  S = {
    v: 1, pc, gold: 30, mp: 20, sci: 0, time: 0,
    bld: {}, units: {}, tech: {},
    wars: {}, siege: {}, esiege: {},
    rel: Array.from({ length: NC }, () => Math.round(r() * 50 - 20)),
    trade: {}, ally: {}, truce: {},
    log: [], ach: {}, alive: Array(NC).fill(true),
    nextAiWar: 360, nextAiAi: 50,
    stats: { clicks: 0, conquered: 0, warsWon: 0, annexed: 0, lost: 0, goldTotal: 0, maxProv: 0 },
    wins: keep ? keep.wins : 0, sound: keep ? keep.sound : true, buyAmt: '1', lastSave: Date.now(), started: false,
    allAch: keep ? keep.allAch : {},
  };
  S.rel[pc] = 100;
}
function save() {
  if (!S || !S.started) return;
  S.lastSave = Date.now();
  const d = Object.assign({}, S, { owner: Array.from(owner), dev: Array.from(dev), cap: Array.from(cap) });
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(d)); } catch (e) { /* нет хранилища */ }
}
function load() {
  let raw = null;
  try { raw = localStorage.getItem(SAVE_KEY); } catch (e) { /* */ }
  if (!raw) return false;
  try {
    const d = JSON.parse(raw);
    if (!d.owner || d.owner.length !== NP) return false;
    newWorld(d.pc);
    owner = Int16Array.from(d.owner); dev = Uint8Array.from(d.dev); cap = Int16Array.from(d.cap);
    delete d.owner; delete d.dev; delete d.cap;
    Object.assign(S, d);
    S.stats = Object.assign(newStats(), d.stats || {});
    return true;
  } catch (e) { console.warn(e); return false; }
}
function newStats() { return { clicks: 0, conquered: 0, warsWon: 0, annexed: 0, lost: 0, goldTotal: 0, maxProv: 0 }; }

/* ---------- РАСЧЁТЫ ---------- */
let M = {};
function provsOf(c) { const a = []; for (let p = 0; p < NP; p++) if (owner[p] === c) a.push(p); return a; }
function countProv(c) { let n = 0; for (let p = 0; p < NP; p++) if (owner[p] === c) n++; return n; }
function devSum(c) { let n = 0; for (let p = 0; p < NP; p++) if (owner[p] === c) n += dev[p]; return n; }
function worldLevel() { return Math.pow(1 + S.time / 60 / BAL.wlMin, BAL.wlPow); }
function aiEra() { return Math.max(eraIndex(), Math.min(7, Math.floor(S.time / 60 / BAL.eraMin))); }
function power(c) { return devSum(c) * BAL.pw * worldLevel() * Math.pow(BAL.eraK, aiEra()); }
function eraIndex() { let e = 0; for (const t of TECHS) if (S.tech[t.id]) e = Math.max(e, t.era); return e; }
function hasReq(req) { return !req || !!S.tech[req]; }
function isNeighbor(c) {
  for (let p = 0; p < NP; p++) if (owner[p] === S.pc) for (const q of NB[p]) if (owner[q] === c) return true;
  return false;
}
function countNeighbors(c) {
  const s = new Set();
  for (let p = 0; p < NP; p++) if (owner[p] === c) for (const q of NB[p]) if (owner[q] !== c) s.add(owner[q]);
  return s;
}

function recalc() {
  const m = { gold: 1, mp: 1, sci: 1, atk: 1, def: 1, siege: 1, click: 1, diplo: 1, all: 1 };
  for (const t of TECHS) if (S.tech[t.id]) for (const k in t.eff) m[k] *= t.eff[k];
  const achN = Object.keys(S.ach).length;
  m.all *= (1 + 0.5 * S.wins) * (1 + 0.01 * achN);
  const trades = Object.keys(S.trade).filter(c => S.trade[c]).length;
  const allies = Object.keys(S.ally).filter(c => S.ally[c]).length;
  M = { m };
  M.prov = countProv(S.pc);
  M.devSum = devSum(S.pc);
  M.F = 1 + BAL.F * M.prov;
  const inc = { gold: M.devSum * 0.25, mp: M.devSum * 0.06, sci: M.prov * 0.03 };
  for (const b of BUILDINGS) { const n = S.bld[b.id] || 0; if (!n) continue; for (const k in b.out) inc[k] += n * b.out[k] * M.F; }
  M.goldPS = inc.gold * m.gold * m.all * (1 + 0.05 * Math.min(trades, 10));
  M.mpPS = inc.mp * m.mp * m.all;
  M.sciPS = inc.sci * m.sci * m.all;
  let A = 0, D = 0;
  for (const u of UNITS) { const n = S.units[u.id] || 0; A += n * u.atk; D += n * u.def; }
  M.atk = A * m.atk * m.all * (1 + 0.1 * allies);
  M.def = D * m.def * m.all;
  M.siegeMult = m.siege;
  M.clickMult = m.click * m.all;
  M.diplo = m.diplo;
  M.allies = allies; M.trades = trades;
  S.stats.maxProv = Math.max(S.stats.maxProv, M.prov);
}
function lowMP() { return S.mp <= 0 && Object.keys(S.wars).length > 0; }
function effAtk() { return M.atk * (lowMP() ? 0.5 : 1); }
function clickGold(p) { return ((1 + dev[p]) * M.clickMult + M.goldPS * 0.03) ; }
function clickDmg() { return (2 + effAtk() * 0.08) * Math.sqrt(M.clickMult); }
function hpEnemy(p) { const c = owner[p]; return BAL.hp * dev[p] * (1 + power(c) / 10) * (cap[c] === p ? 4 : 1); }
function hpMine(p) { return 15 * dev[p] * (1 + M.def / 15) * (cap[S.pc] === p ? 2.5 : 1); }
function devCost(p) { return Math.ceil(40 * Math.pow(1.9, dev[p] - 1)); }
function giftCost() { return Math.ceil((M.goldPS * 20 + 60) * M.diplo); }
function annexCost(c) { return Math.ceil((M.goldPS * 90 + 500) * M.diplo * Math.sqrt(countProv(c))); }
function peaceCost() { return Math.ceil(M.goldPS * 45 + 100); }

function bulkCost(base, owned, n, g) { return base * Math.pow(g, owned) * (Math.pow(g, n) - 1) / (g - 1); }
function maxAfford(base, owned, g, money) { return Math.max(0, Math.floor(Math.log(1 + money * (g - 1) / (base * Math.pow(g, owned))) / Math.log(g))); }
const BG = 1.15, UG = 1.025;
function bldPlan(b) {
  const own = S.bld[b.id] || 0;
  let n = S.buyAmt === 'max' ? Math.max(1, maxAfford(b.cost, own, BG, S.gold)) : +S.buyAmt;
  return { n, gold: Math.ceil(bulkCost(b.cost, own, n, BG)) };
}
function unitPlan(u) {
  const own = S.units[u.id] || 0;
  let n;
  if (S.buyAmt === 'max') {
    n = Math.min(maxAfford(u.gold, own, UG, S.gold), maxAfford(u.mp, own, UG, S.mp));
    n = Math.max(1, Math.min(n, 100000));
  } else n = +S.buyAmt;
  return { n, gold: Math.ceil(bulkCost(u.gold, own, n, UG)), mp: Math.ceil(bulkCost(u.mp, own, n, UG)) };
}

/* ---------- ДЕЙСТВИЯ ---------- */
function logMsg(text, cls) {
  S.log.unshift({ y: year(), t: text, c: cls || '' });
  if (S.log.length > 80) S.log.length = 80;
  if (activeTab === 'log') renderLog();
}
function year() { return Math.floor(Math.max(1500 + S.time / 12, ERAS[eraIndex()].year)); }

function buyBuilding(id) {
  const b = BMAP[id]; if (!hasReq(b.req)) return;
  const pl = bldPlan(b);
  if (S.gold < pl.gold) return beep(140, .08);
  S.gold -= pl.gold; S.bld[id] = (S.bld[id] || 0) + pl.n;
  recalc(); beep(520, .06); renderEcon();
}
function buyUnit(id) {
  const u = UMAP[id]; if (!hasReq(u.req)) return;
  const pl = unitPlan(u);
  if (S.gold < pl.gold || S.mp < pl.mp) return beep(140, .08);
  S.gold -= pl.gold; S.mp -= pl.mp; S.units[id] = (S.units[id] || 0) + pl.n;
  recalc(); beep(440, .06); renderArmy();
}
function research(id) {
  const t = TMAP[id], i = TECHS.indexOf(t);
  if (S.tech[id] || (i > 0 && !S.tech[TECHS[i - 1].id]) || S.sci < t.cost) return;
  const oldEra = eraIndex();
  S.sci -= t.cost; S.tech[id] = 1;
  recalc(); renderTech(); renderEcon(); renderArmy();
  toast(`${t.icon} Открыто: ${t.name}`);
  logMsg(`Учёные открыли: ${t.icon} ${t.name}`, 'good');
  const e = eraIndex();
  if (e > oldEra) { fanfare(); showModal(`<div class="bigicon">${ERAS[e].icon}</div><h2>${ERAS[e].name}</h2><p>Твоя держава вступает в новую эпоху. Открыты новые постройки и войска!</p>`); }
}
function developProvince(p) {
  if (owner[p] !== S.pc || dev[p] >= 30) return;
  const c = devCost(p); if (S.gold < c) return beep(140, .08);
  S.gold -= c; dev[p]++;
  recalc(); recolorProv(p); beep(600, .06); renderSel();
}

function clickProvince(p, sx, sy) {
  selectProv(p);
  const o = owner[p];
  if (o === S.pc) {
    S.stats.clicks++;
    if (S.esiege[p]) {
      const d = clickDmg() * 1.5; const e = S.esiege[p];
      e.prog = Math.max(0, e.prog - d);
      floatText(`🛡️ -${fmt(d)}`, sx, sy, 'def');
      beep(260, .04);
    } else {
      const g = clickGold(p); gain('gold', g);
      floatText(`+${fmt(g)} 💰`, sx, sy, 'gold');
      beep(700 + dev[p] * 10, .03);
    }
  } else if (S.wars[o]) {
    if (!isAdjToMe(p)) { floatText('Нет границы', sx, sy, 'bad'); return; }
    S.stats.clicks++;
    S.wars[o].target = p;
    const d = clickDmg();
    S.siege[p] = (S.siege[p] || 0) + d;
    floatText(`⚔️ ${fmt(d)}`, sx, sy, 'atk');
    beep(180 + Math.random() * 60, .04);
    if (S.siege[p] >= hpEnemy(p)) capture(p);
  } else {
    S.diploSel = o; if (activeTab === 'diplo') renderDiplo();
  }
}
function isAdjToMe(p) { for (const q of NB[p]) if (owner[q] === S.pc) return true; return false; }
function gain(k, v) { S[k] += v; if (k === 'gold') S.stats.goldTotal += v; }

function setOwner(p, c) {
  const old = owner[p];
  owner[p] = c;
  delete S.siege[p]; delete S.esiege[p];
  if (cap[old] === p) {
    const rest = provsOf(old);
    cap[old] = rest.length ? rest.sort((a, b) => dev[b] - dev[a])[0] : -1;
  }
  recolorProv(p);
  labelsDirty = true;
}
function capture(p) {
  const c = owner[p], wasCap = cap[c] === p;
  const loot = hpEnemy(p) * 0.15;
  setOwner(p, S.pc);
  S.stats.conquered++;
  gain('gold', loot);
  if (S.wars[c]) { S.wars[c].taken++; S.wars[c].lastChange = S.time; }
  logMsg(`Наши войска взяли ${PNAME[p]}${PNAME[p].includes('(') ? '' : ` (${CNAME[c]})`}`, 'good');
  toast(`🚩 Захвачено: ${PNAME[p]}`);
  fanfare(true);
  recalc();
  if (countProv(c) === 0) { destroyCountry(c, true); return; }
  const w = S.wars[c];
  if (wasCap) capitulate(c, countProv(c) <= 6 ? 'all' : 'border');
  else if (w && w.taken >= Math.max(2, Math.ceil(w.startProv * 0.5))) capitulate(c, 'border');
}
function capitulate(c, mode) {
  const w = S.wars[c];
  let n = 0;
  if (mode === 'all') { for (const p of provsOf(c)) { setOwner(p, S.pc); n++; } }
  else {
    const border = provsOf(c).filter(isAdjToMe).sort((x, y) => dev[y] - dev[x]);
    const k = Math.max(1, Math.ceil(countProv(c) * BAL.cede));
    for (const p of border.slice(0, k)) { setOwner(p, S.pc); n++; }
  }
  const rep = peaceCost();
  gain('gold', rep);
  endWar(c, true);
  S.stats.warsWon++;
  recalc();
  const gone = countProv(c) === 0;
  showModal(`<div class="bigicon">🏳️</div><h2>${CNAME[c]} капитулирует!</h2>
    <p>${mode === 'all' ? 'Столица пала. Вся страна переходит под твою власть.' : 'Враг сломлен и уступает часть пограничных земель.'}</p>
    <p>Новых провинций: <b>${n + (w ? w.taken : 0)}</b>, репарации: <b>${fmt(rep)} 💰</b></p>`);
  logMsg(`${CNAME[c]} капитулировала перед нами`, 'good');
  if (gone) destroyCountry(c, true);
  checkWin();
}
function destroyCountry(c, byMe) {
  if (!S.alive[c]) return;
  S.alive[c] = false;
  if (S.wars[c]) endWar(c, byMe);
  delete S.trade[c]; delete S.ally[c];
  logMsg(`${CNAME[c]} прекратила существование`, byMe ? 'good' : '');
  if (byMe) S.stats.annexed++;
  if (S.diploSel === c) S.diploSel = null;
  checkWin();
}
function declareWar(c) {
  if (S.wars[c] || c === S.pc || !S.alive[c]) return;
  if ((S.truce[c] || 0) > S.time) return toast('🕊️ Действует перемирие');
  if (!isNeighbor(c)) return toast('Нет общей границы');
  startWar(c, true);
}
function startWar(c, byMe) {
  S.wars[c] = { start: S.time, startProv: countProv(c), taken: 0, lost: 0, target: -1, etarget: -1, lastChange: S.time };
  S.rel[c] = -100; delete S.trade[c]; delete S.ally[c];
  if (byMe) for (let d = 0; d < NC; d++) if (d !== c && d !== S.pc) S.rel[d] = Math.max(-100, S.rel[d] - 5);
  logMsg(byMe ? `Мы объявили войну: ${CNAME[c]}` : `${CNAME[c]} объявила нам войну!`, 'bad');
  if (!byMe) { toast(`⚔️ ${CNAME[c]} объявила войну!`); alarm(); }
  else beep(200, .2);
  recalc(); renderWars(); if (activeTab === 'diplo') renderDiplo();
}
function endWar(c, won) {
  const w = S.wars[c]; if (!w) return;
  delete S.wars[c];
  for (const k in S.siege) if (owner[k] === c) delete S.siege[k];
  for (const k in S.esiege) if (S.esiege[k].c === c) { delete S.esiege[k]; recolorProv(+k); }
  S.truce[c] = S.time + 180;
  S.rel[c] = -30;
  for (let p = 0; p < NP; p++) if (owner[p] === c) recolorProv(p);
  renderWars(); if (activeTab === 'diplo') renderDiplo();
}
function offerPeace(c) {
  const w = S.wars[c]; if (!w) return;
  const free = w.taken >= w.lost;
  const cost = free ? 0 : peaceCost();
  if (S.gold < cost) return toast(`Нужно ${fmt(cost)} 💰 на мирный договор`);
  S.gold -= cost;
  endWar(c, false);
  logMsg(`Заключён мир с ${CNAME[c]}`, '');
  toast('🕊️ Мир заключён');
}
function gift(c) {
  const cost = giftCost(); if (S.gold < cost) return beep(140, .08);
  S.gold -= cost; S.rel[c] = Math.min(100, S.rel[c] + 20);
  beep(660, .06); renderDiplo();
}
function makeTrade(c) { if (S.rel[c] < 30 || S.wars[c]) return; S.trade[c] = true; recalc(); logMsg(`Торговый договор с ${CNAME[c]}`, 'good'); renderDiplo(); }
function makeAlly(c) { if (S.rel[c] < 70 || S.wars[c]) return; S.ally[c] = true; recalc(); logMsg(`Союз с ${CNAME[c]}`, 'good'); renderDiplo(); }
function annex(c) {
  if (!S.ally[c] || S.rel[c] < 90 || M.atk + M.def < power(c) * 2) return;
  const cost = annexCost(c); if (S.gold < cost) return;
  S.gold -= cost;
  const n = countProv(c);
  for (const p of provsOf(c)) setOwner(p, S.pc);
  destroyCountry(c, true);
  S.stats.peaceAnnex = (S.stats.peaceAnnex || 0) + 1;
  recalc(); fanfare();
  logMsg(`${CNAME[c]} мирно вошла в состав нашей державы`, 'good');
  showModal(`<div class="bigicon">🤝</div><h2>Мирное объединение</h2><p>${CNAME[c]} добровольно присоединилась к нам. +${n} провинций!</p>`);
  checkWin();
}

/* ---------- ВОЙНЫ: тик ---------- */
function warTick(dt) {
  const wars = Object.keys(S.wars).map(Number);
  if (!wars.length) return;
  const share = 1 / wars.length;
  for (const c of wars) {
    const w = S.wars[c];
    if (!S.alive[c] || countProv(c) === 0) { endWar(c, true); continue; }
    // наша цель
    if (w.target < 0 || owner[w.target] !== c || !isAdjToMe(w.target)) {
      let best = -1, bh = Infinity;
      for (let p = 0; p < NP; p++) if (owner[p] === c && isAdjToMe(p)) { const h = hpEnemy(p) - (S.siege[p] || 0); if (h < bh) { bh = h; best = p; } }
      w.target = best;
    }
    if (w.target < 0) {
      if (!isNeighbor(c)) { logMsg(`Война с ${CNAME[c]} затихла: нет общей границы`); endWar(c, false); continue; }
    } else {
      const p = w.target, prev = S.siege[p] || 0;
      S.siege[p] = prev + effAtk() * BAL.siege * M.siegeMult * share * dt;
      if (!prev) recolorProv(p);
      if (S.siege[p] >= hpEnemy(p)) { capture(p); if (!S.wars[c]) continue; }
    }
    // враг атакует
    const ep = power(c);
    if (w.etarget < 0 || owner[w.etarget] !== S.pc || !S.esiege[w.etarget]) {
      const cand = [];
      for (let p = 0; p < NP; p++) if (owner[p] === S.pc && !S.esiege[p]) for (const q of NB[p]) if (owner[q] === c) { cand.push(p); break; }
      if (cand.length) { w.etarget = cand[Math.floor(Math.random() * cand.length)]; S.esiege[w.etarget] = { c, prog: 0 }; recolorProv(w.etarget); }
      else w.etarget = -1;
    }
    if (w.etarget >= 0) {
      const e = S.esiege[w.etarget];
      const rate = Math.min(ep * 0.05 - M.def * 0.08 * share, hpMine(w.etarget) / 75);
      e.prog = Math.max(0, e.prog + rate * dt);
      if (e.prog >= hpMine(w.etarget)) {
        const p = w.etarget;
        setOwner(p, c); w.lost++; w.lastChange = S.time; S.stats.lost++; w.etarget = -1;
        logMsg(`${CNAME[c]} захватила ${PNAME[p]}`, 'bad');
        toast(`💥 Потеряна провинция: ${PNAME[p]}`); alarm();
        recalc();
        if (countProv(S.pc) === 0) return gameOver();
      }
    }
    S.mp = Math.max(0, S.mp - ep * 0.004 * dt);
    if (S.time - (w.lastChange || w.start) > 240 && S.time - w.start > 300) {
      endWar(c, false);
      logMsg(`Затяжная война с ${CNAME[c]} закончилась перемирием`);
      toast(`🕊️ ${CNAME[c]}: война закончилась вничью`);
    }
  }
}

/* ---------- ИИ ---------- */
function aiTick() {
  if (S.time >= S.nextAiWar) {
    S.nextAiWar = S.time + 60 + Math.random() * 70;
    const nWars = Object.keys(S.wars).length;
    if (nWars < 2) {
      const cand = [];
      for (let c = 0; c < NC; c++) {
        if (c === S.pc || !S.alive[c] || S.wars[c] || S.ally[c] || (S.truce[c] || 0) > S.time || S.rel[c] > 10) continue;
        if (!isNeighbor(c)) continue;
        const ratio = power(c) / (M.def + M.atk * 0.5 + 5);
        if (ratio > 0.9) cand.push([c, ratio]);
      }
      if (cand.length && Math.random() < 0.6) { cand.sort((a, b) => b[1] - a[1]); startWar(cand[0][0], false); }
    }
  }
  if (S.time >= S.nextAiAi) {
    S.nextAiAi = S.time + 25 + Math.random() * 35;
    const alive = []; for (let c = 0; c < NC; c++) if (S.alive[c] && c !== S.pc) alive.push(c);
    const a = alive[Math.floor(Math.random() * alive.length)];
    if (a === undefined) return;
    const nbs = [...countNeighbors(a)].filter(d => d !== S.pc && S.alive[d]);
    if (!nbs.length) return;
    const d = nbs[Math.floor(Math.random() * nbs.length)];
    if (power(a) * (0.6 + Math.random()) < power(d)) return;
    const border = provsOf(d).filter(p => NB[p].some(q => owner[q] === a));
    if (!border.length) return;
    const p = border[Math.floor(Math.random() * border.length)];
    setOwner(p, a);
    logMsg(`${CNAME[a]} отняла ${PNAME[p]} у ${CNAME[d]}`);
    if (countProv(d) === 0) destroyCountry(d, false);
  }
}
function relTick(dt) {
  for (let c = 0; c < NC; c++) {
    if (c === S.pc || S.wars[c]) continue;
    const base = S.ally[c] ? 60 : S.trade[c] ? 25 : 0;
    if (S.rel[c] > base) S.rel[c] = Math.max(base, S.rel[c] - 0.15 * dt);
    else if (S.rel[c] < base) S.rel[c] = Math.min(base, S.rel[c] + 0.1 * dt);
    if (S.trade[c] && S.rel[c] < 0) { delete S.trade[c]; recalc(); }
  }
}

function checkWin() {
  for (let c = 0; c < NC; c++) if (c !== S.pc && countProv(c) > 0) return;
  S.won = true;
  fanfare();
  showModal(`<div class="bigicon">👑</div><h2>Мировое господство!</h2>
    <p>Вся Европа окрашена в цвета твоей державы. Время в игре: ${fmtTime(S.time)}.</p>
    <p>Можно начать новую игру за любую страну с вечным бонусом <b>+50%</b> ко всему за каждую победу.</p>`,
    [{ text: 'Новая игра +', cls: 'gold', fn: () => newGamePlus() }, { text: 'Любоваться картой' }]);
}
function newGamePlus() { const keep = { wins: S.wins + 1, sound: S.sound, allAch: S.allAch }; newWorld(0, keep); chooseCountry(); }
function gameOver() {
  S.dead = true;
  showModal(`<div class="bigicon">💀</div><h2>Держава пала</h2><p>Враги захватили последнюю провинцию. История не прощает слабости… Но можно попробовать снова!</p>`,
    [{ text: 'Начать заново', cls: 'gold', fn: () => { const keep = { wins: S.wins, sound: S.sound, allAch: S.allAch }; newWorld(0, keep); chooseCountry(); } }]);
}

/* ---------- ДОСТИЖЕНИЯ ---------- */
const ACH = [
  { id: 'click1', icon: '👆', name: 'Первый указ', desc: 'Сделай первый клик', f: () => S.stats.clicks >= 1 },
  { id: 'click1k', icon: '🖱️', name: 'Неутомимый правитель', desc: '1000 кликов', f: () => S.stats.clicks >= 1000 },
  { id: 'click10k', icon: '🔥', name: 'Палец из стали', desc: '10 000 кликов', f: () => S.stats.clicks >= 10000 },
  { id: 'bld10', icon: '🏗️', name: 'Строитель', desc: 'Построй 10 зданий', f: () => sumObj(S.bld) >= 10 },
  { id: 'bld100', icon: '🏙️', name: 'Великая стройка', desc: '100 зданий', f: () => sumObj(S.bld) >= 100 },
  { id: 'bld500', icon: '🌆', name: 'Мегаполис', desc: '500 зданий', f: () => sumObj(S.bld) >= 500 },
  { id: 'army100', icon: '🪖', name: 'Армия', desc: 'Атака армии 100', f: () => M.atk >= 100 },
  { id: 'army1e4', icon: '🎖️', name: 'Военная машина', desc: 'Атака армии 10 000', f: () => M.atk >= 1e4 },
  { id: 'army1e7', icon: '☄️', name: 'Сверхдержава', desc: 'Атака армии 10 млн', f: () => M.atk >= 1e7 },
  { id: 'war1', icon: '⚔️', name: 'Первая кровь', desc: 'Захвати провинцию', f: () => S.stats.conquered >= 1 },
  { id: 'win1', icon: '🏳️', name: 'Капитуляция', desc: 'Выиграй войну', f: () => S.stats.warsWon >= 1 },
  { id: 'win5', icon: '🏆', name: 'Полководец', desc: 'Выиграй 5 войн', f: () => S.stats.warsWon >= 5 },
  { id: 'p25', icon: '🗺️', name: 'Королевство', desc: '25 провинций', f: () => M.prov >= 25 },
  { id: 'p50', icon: '🧭', name: 'Империя', desc: '50 провинций', f: () => M.prov >= 50 },
  { id: 'p100', icon: '🌍', name: 'Владыка континента', desc: '100 провинций', f: () => M.prov >= 100 },
  { id: 'p200', icon: '👑', name: 'Половина Европы', desc: '200 провинций', f: () => M.prov >= 200 },
  { id: 'dev10', icon: '🏛️', name: 'Жемчужина', desc: 'Развей провинцию до 10', f: () => { for (let p = 0; p < NP; p++) if (owner[p] === S.pc && dev[p] >= 10) return true; return false; } },
  { id: 'trade3', icon: '🤝', name: 'Торговая держава', desc: '3 торговых договора', f: () => M.trades >= 3 },
  { id: 'ally', icon: '🫱', name: 'Союзник', desc: 'Заключи союз', f: () => M.allies >= 1 },
  { id: 'annex', icon: '🕊️', name: 'Без единого выстрела', desc: 'Присоедини страну мирно', f: () => S.stats.peaceAnnex >= 1 },
  { id: 'era3', icon: '🏭', name: 'Промышленник', desc: 'Достигни промышленной революции', f: () => eraIndex() >= 3 },
  { id: 'era5', icon: '⚛️', name: 'Атомный век', desc: 'Достигни атомного века', f: () => eraIndex() >= 5 },
  { id: 'era7', icon: '🚀', name: 'Будущее наступило', desc: 'Достигни эры будущего', f: () => eraIndex() >= 7 },
  { id: 'rich', icon: '💰', name: 'Казна полна', desc: 'Заработай 1 млрд золота', f: () => S.stats.goldTotal >= 1e9 },
  { id: 'world', icon: '🌐', name: 'Мировое господство', desc: 'Захвати всю карту', f: () => !!S.won },
];
function sumObj(o) { let s = 0; for (const k in o) s += o[k]; return s; }
function checkAch() {
  let ch = false;
  for (const a of ACH) if (!S.ach[a.id] && a.f()) { S.ach[a.id] = 1; S.allAch[a.id] = 1; ch = true; toast(`🏆 ${a.name}`); }
  if (ch) { recalc(); if (activeTab === 'ach') renderAch(); }
}

/* ---------- ОТРИСОВКА КАРТЫ ---------- */
const canvas = $('#map'), ctx = canvas.getContext('2d');
const off = document.createElement('canvas'); off.width = W; off.height = H;
const octx = off.getContext('2d');
const img = octx.createImageData(W, H), px = img.data;
let imgDirty = true, labelsDirty = true, selProv = -1;
const view = { s: 1, x: 0, y: 0 };

function colorCell(i) {
  const v = ids[i], t = tex[i], o4 = i * 4;
  let r, g, b;
  if (v === 0) {
    const d = seaD[i];
    if (d <= 1) { r = 92; g = 128; b = 140; }
    else { const k = Math.min(d, 12) / 12; r = 160 - 40 * k; g = 196 - 30 * k; b = 206 - 18 * k; }
    r *= t; g *= t; b *= t;
  } else if (v === 1) {
    const x = i % W, y = (i / W) | 0;
    const hatch = (x + y) % 7 === 0;
    r = 176; g = 168; b = 150; if (hatch) { r -= 25; g -= 25; b -= 25; } r *= t; g *= t; b *= t;
  } else {
    const p = v - 2, o = owner[p];
    [r, g, b] = CRGB[o];
    const x = i % W;
    let cb = 0, pb = 0, coast = 0, gold = 0;
    const nbs = [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i - W, i + W];
    for (const j of nbs) {
      if (j < 0 || j >= ids.length) continue;
      const vj = ids[j];
      if (vj < 2) { coast = 1; continue; }
      if (vj === v) continue;
      const oq = owner[vj - 2];
      if (oq !== o) { cb = 1; if (o === S.pc || oq === S.pc) gold = 1; } else pb = 1;
    }
    if (gold) { r = 255; g = 205; b = 60; }
    else if (cb) { r = 45; g = 32; b = 24; }
    else if (coast) { r *= .62; g *= .62; b *= .62; }
    else {
      if (pb) { r *= .8; g *= .8; b *= .8; }
      r *= t; g *= t; b *= t;
      const y = (i / W) | 0;
      if (S.siege[p] !== undefined && owner[p] !== S.pc && (x + y) % 8 < 3) { r = r * .5 + 200 * .5; g = g * .5 + 40 * .5; b = b * .5 + 30 * .5; }
      if (S.esiege[p] && (x - y + 4000) % 8 < 3) { const e = CRGB[S.esiege[p].c]; r = r * .4 + e[0] * .6 * .8; g = g * .4 + e[1] * .6 * .8; b = b * .4 + e[2] * .6 * .8; }
      if (p === selProv) { r = r + (255 - r) * .35; g = g + (255 - g) * .35; b = b + (255 - b) * .35; }
    }
  }
  px[o4] = r; px[o4 + 1] = g; px[o4 + 2] = b; px[o4 + 3] = 255;
}
function redrawAll() { for (let i = 0; i < ids.length; i++) colorCell(i); imgDirty = true; }
function recolorProv(p) {
  if (p < 0) return;
  const touch = [p, ...NB[p]];
  for (const q of touch) for (const i of provCells[q]) colorCell(i);
  imgDirty = true;
}
function selectProv(p) {
  const old = selProv; selProv = p;
  if (old >= 0) for (const i of provCells[old]) colorCell(i);
  if (p >= 0) for (const i of provCells[p]) colorCell(i);
  imgDirty = true; renderSel();
}

let labels = [];
function computeLabels() {
  labels = [];
  const sx = new Float64Array(NC), sy = new Float64Array(NC), sn = new Float64Array(NC);
  for (let p = 0; p < NP; p++) { const o = owner[p]; sx[o] += PX[p] * PN[p]; sy[o] += PY[p] * PN[p]; sn[o] += PN[p]; }
  for (let c = 0; c < NC; c++) {
    if (!sn[c]) continue;
    const cx = sx[c] / sn[c], cy = sy[c] / sn[c];
    let best = -1, bd = Infinity;
    for (let p = 0; p < NP; p++) if (owner[p] === c) { const d = (PX[p] - cx) ** 2 + (PY[p] - cy) ** 2; if (d < bd) { bd = d; best = p; } }
    const x = (bd < 400) ? cx : PX[best], y = (bd < 400) ? cy : PY[best];
    labels.push({ c, x, y, size: Math.sqrt(sn[c]) });
  }
  labelsDirty = false;
}

function resizeCanvas() {
  const r = canvas.parentNode.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
  canvas.style.width = r.width + 'px'; canvas.style.height = r.height + 'px';
  view.dpr = dpr; view.cw = r.width; view.ch = r.height;
}
function fitAll() { view.s = Math.min(view.cw / W, view.ch / H); view.x = (view.cw - W * view.s) / 2; view.y = (view.ch - H * view.s) / 2; }
function focusOn(c, zoom) {
  let minx = W, miny = H, maxx = 0, maxy = 0;
  for (let p = 0; p < NP; p++) if (owner[p] === c) { minx = Math.min(minx, PX[p]); maxx = Math.max(maxx, PX[p]); miny = Math.min(miny, PY[p]); maxy = Math.max(maxy, PY[p]); }
  if (minx > maxx) return fitAll();
  const pad = 60, s = Math.min(view.cw / (maxx - minx + pad * 2), view.ch / (maxy - miny + pad * 2), zoom || 4);
  view.s = Math.max(s, Math.min(view.cw / W, view.ch / H));
  view.x = view.cw / 2 - (minx + maxx) / 2 * view.s; view.y = view.ch / 2 - (miny + maxy) / 2 * view.s;
  clampView();
}
function clampView() {
  const minS = Math.min(view.cw / W, view.ch / H) * 0.9;
  view.s = clamp(view.s, minS, 14);
  const mw = W * view.s, mh = H * view.s;
  view.x = mw < view.cw ? (view.cw - mw) / 2 : clamp(view.x, view.cw - mw - 40, 40);
  view.y = mh < view.ch ? (view.ch - mh) / 2 : clamp(view.y, view.ch - mh - 40, 40);
}
const toScreen = (x, y) => [view.x + x * view.s, view.y + y * view.s];

function render(now) {
  if (imgDirty) { octx.putImageData(img, 0, 0); imgDirty = false; }
  if (labelsDirty) computeLabels();
  const d = view.dpr;
  ctx.setTransform(d, 0, 0, d, 0, 0);
  ctx.fillStyle = '#8fb3bd'; ctx.fillRect(0, 0, view.cw, view.ch);
  ctx.imageSmoothingEnabled = view.s < 3;
  ctx.drawImage(off, view.x, view.y, W * view.s, H * view.s);
  const s = view.s;
  // морские пути
  ctx.save(); ctx.setLineDash([4, 5]); ctx.strokeStyle = 'rgba(40,60,80,.35)'; ctx.lineWidth = 1.2;
  for (const [a, b] of MD.sea) { const [x1, y1] = toScreen(PX[a], PY[a]), [x2, y2] = toScreen(PX[b], PY[b]); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
  ctx.restore();
  // столицы
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let c = 0; c < NC; c++) {
    const p = cap[c]; if (p < 0 || owner[p] !== c) continue;
    const [x, y] = toScreen(PX[p], PY[p]);
    ctx.font = `${Math.max(9, Math.min(18, 5 * s))}px serif`;
    ctx.fillStyle = c === S.pc ? '#ffd23f' : '#2a1d14'; ctx.fillText('★', x, y);
  }
  // названия провинций при приближении
  if (s > 2.6) {
    ctx.font = `600 ${Math.min(13, 3 * s)}px Georgia, serif`;
    for (let p = 0; p < NP; p++) {
      const [x, y] = toScreen(PX[p], PY[p]); if (x < -50 || y < -20 || x > view.cw + 50 || y > view.ch + 20) continue;
      const nm = PNAME[p].replace(/ \(.*\)$/, '');
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,248,230,.75)'; ctx.strokeText(nm, x, y + 9 + s);
      ctx.fillStyle = '#2a1d14'; ctx.fillText(nm, x, y + 9 + s);
    }
  }
  // названия стран
  for (const L of labels) {
    const fs = clamp(L.size * 0.11 * s, 9, 64);
    if (s > 2.6 && fs < 20) continue;
    const [x, y] = toScreen(L.x, L.y);
    ctx.font = `700 ${fs}px Georgia, "Times New Roman", serif`;
    const txt = CNAME[L.c].toUpperCase();
    ctx.lineWidth = Math.max(2, fs / 7); ctx.strokeStyle = 'rgba(255,248,230,.7)';
    ctx.strokeText(txt, x, y - (s > 2.6 ? 14 : 0));
    ctx.fillStyle = L.c === S.pc ? '#5a2d00' : 'rgba(40,26,18,.88)';
    ctx.fillText(txt, x, y - (s > 2.6 ? 14 : 0));
  }
  // осады
  const pulse = (Math.sin(now / 180) + 1) / 2;
  for (const k in S.siege) {
    const p = +k; if (owner[p] === S.pc) continue;
    drawSiege(p, S.siege[p] / hpEnemy(p), '#e8452c', '⚔️', pulse);
  }
  for (const k in S.esiege) {
    const p = +k, e = S.esiege[k];
    drawSiege(p, e.prog / hpMine(p), CCOL[e.c], '🔥', pulse);
  }
  if (selProv >= 0) {
    const [x, y] = toScreen(PX[selProv], PY[selProv]);
    ctx.strokeStyle = `rgba(255,255,255,${.4 + pulse * .5})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, 10 + pulse * 6, 0, 7); ctx.stroke();
  }
}
function drawSiege(p, f, col, icon, pulse) {
  const [x, y] = toScreen(PX[p], PY[p]);
  const w = 34;
  ctx.font = `${16 + pulse * 3}px serif`; ctx.fillText(icon, x, y - 12);
  ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(x - w / 2 - 1, y + 1, w + 2, 7);
  ctx.fillStyle = col; ctx.fillRect(x - w / 2, y + 2, w * clamp(f, 0, 1), 5);
}

/* ---------- ВВОД НА КАРТЕ ---------- */
const pointers = new Map(); let drag = null, pinch = null;
canvas.addEventListener('pointerdown', e => {
  canvas.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 1) drag = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y, moved: 0, t: performance.now() };
  if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), s: view.s, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, vx: view.x, vy: view.y }; drag = null; }
});
canvas.addEventListener('pointermove', e => {
  if (!pointers.has(e.pointerId)) return;
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pinch && pointers.size === 2) {
    const [a, b] = [...pointers.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
    const r = canvas.getBoundingClientRect();
    const ns = clamp(pinch.s * d / pinch.d, 0.3, 14), cx = pinch.cx - r.left, cy = pinch.cy - r.top;
    view.x = cx - (cx - pinch.vx) * ns / pinch.s; view.y = cy - (cy - pinch.vy) * ns / pinch.s; view.s = ns; clampView();
  } else if (drag) {
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag.moved = Math.max(drag.moved, Math.hypot(dx, dy));
    if (drag.moved > 6) { view.x = drag.vx + dx; view.y = drag.vy + dy; clampView(); }
  }
});
function endPointer(e) {
  if (!pointers.has(e.pointerId)) return;
  pointers.delete(e.pointerId);
  if (drag && drag.moved <= 6 && pointers.size === 0) {
    const r = canvas.getBoundingClientRect(), sx = e.clientX - r.left, sy = e.clientY - r.top;
    const mx = Math.floor((sx - view.x) / view.s), my = Math.floor((sy - view.y) / view.s);
    if (mx >= 0 && my >= 0 && mx < W && my < H) {
      const v = ids[my * W + mx];
      if (v >= 2 && S.started && !S.dead) clickProvince(v - 2, e.clientX, e.clientY);
      else if (v < 2) selectProv(-1);
    }
  }
  if (pointers.size < 2) pinch = null;
  if (pointers.size === 0) drag = null;
}
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);
canvas.addEventListener('wheel', e => {
  e.preventDefault();
  const r = canvas.getBoundingClientRect(), cx = e.clientX - r.left, cy = e.clientY - r.top;
  zoomAt(cx, cy, Math.exp(-e.deltaY * 0.0015));
}, { passive: false });
function zoomAt(cx, cy, k) {
  const ns = clamp(view.s * k, 0.3, 14);
  view.x = cx - (cx - view.x) * ns / view.s; view.y = cy - (cy - view.y) * ns / view.s; view.s = ns; clampView();
}

/* ---------- ПАНЕЛИ ---------- */
let activeTab = 'econ';
function setTab(t) {
  activeTab = t;
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
  document.querySelectorAll('.panel').forEach(p => p.classList.toggle('on', p.id === 'p-' + t));
  ({ econ: renderEcon, army: renderArmy, tech: renderTech, diplo: renderDiplo, log: renderLog, ach: renderAch, set: renderSettings })[t]();
}
function setBuyAmt(a) {
  S.buyAmt = a;
  document.querySelectorAll('.buyamt button').forEach(b => b.classList.toggle('on', b.dataset.amt === a));
  renderEcon(); renderArmy();
}
const costSpan = (k, v) => `<span class="c ${S[k] >= v ? 'ok' : 'no'}" data-k="${k}" data-v="${v}">${k === 'gold' ? '💰' : k === 'mp' ? '👥' : '🔬'}${fmt(v)}</span>`;
function refreshCosts(root) {
  root.querySelectorAll('.c[data-k]').forEach(el => { const ok = S[el.dataset.k] >= +el.dataset.v; el.classList.toggle('ok', ok); el.classList.toggle('no', !ok); });
}
function outText(o) { return Object.entries(o).map(([k, v]) => `${k === 'gold' ? '💰' : k === 'mp' ? '👥' : '🔬'}${fmt(v * M.F * M.m[k] * M.m.all)}/с`).join(' '); }

function renderEcon() {
  $('#econInfo').innerHTML = `Каждая провинция усиливает постройки: <b>×${M.F.toFixed(2)}</b> (провинций: ${M.prov}).<br>Торговые договоры: <b>+${Math.min(M.trades, 10) * 5}%</b> золота.`;
  let html = '';
  for (const b of BUILDINGS) {
    const ok = hasReq(b.req), n = S.bld[b.id] || 0;
    if (!ok) { html += `<div class="card locked"><div class="ci">🔒</div><div class="cb"><div class="cn">${b.name}</div><div class="cd">Нужна технология: ${TMAP[b.req].icon} ${TMAP[b.req].name}</div></div></div>`; continue; }
    const pl = bldPlan(b);
    html += `<div class="card ${S.gold >= pl.gold ? 'can' : ''}" data-b="${b.id}"><div class="ci">${b.icon}</div><div class="cb">
      <div class="cn">${b.name}<span class="own">${n}</span></div><div class="cd">${b.desc}</div>
      <div class="cp">Каждое: ${outText(b.out)}</div>
      <div class="cc">${pl.n > 1 ? `<span class="cnt">×${pl.n}</span>` : ''}${costSpan('gold', pl.gold)}</div></div></div>`;
  }
  $('#bldList').innerHTML = html;
}
function renderArmy() {
  $('#armyInfo').innerHTML = `⚔️ Атака: <b>${fmt(M.atk)}</b> · 🛡️ Оборона: <b>${fmt(M.def)}</b><br>
    Сила клика по врагу: <b>${fmt(clickDmg())}</b>. Армия сама штурмует провинции во время войны.${M.allies ? `<br>Союзники: +${M.allies * 10}% к атаке` : ''}${lowMP() ? '<br><b class="bad">Нет рекрутов! Атака армии вдвое слабее.</b>' : ''}`;
  let html = '';
  for (const u of UNITS) {
    const ok = hasReq(u.req), n = S.units[u.id] || 0;
    if (!ok) { html += `<div class="card locked"><div class="ci">🔒</div><div class="cb"><div class="cn">${u.name}</div><div class="cd">Нужна технология: ${TMAP[u.req].icon} ${TMAP[u.req].name}</div></div></div>`; continue; }
    const pl = unitPlan(u);
    html += `<div class="card ${S.gold >= pl.gold && S.mp >= pl.mp ? 'can' : ''}" data-u="${u.id}"><div class="ci">${u.icon}</div><div class="cb">
      <div class="cn">${u.name}<span class="own">${fmt(n)}</span></div><div class="cd">${u.desc}</div>
      <div class="cp">⚔️${fmt(u.atk * M.m.atk * M.m.all)} 🛡️${fmt(u.def * M.m.def * M.m.all)}</div>
      <div class="cc">${pl.n > 1 ? `<span class="cnt">×${fmt(pl.n)}</span>` : ''}${costSpan('gold', pl.gold)}${costSpan('mp', pl.mp)}</div></div></div>`;
  }
  $('#unitList').innerHTML = html;
}
function effStr(eff) {
  const N = { gold: 'золото', mp: 'рекруты', sci: 'наука', atk: 'атака', def: 'оборона', siege: 'скорость штурма', click: 'сила клика', all: 'всё' };
  return Object.entries(eff).map(([k, v]) => k === 'diplo' ? 'дипломатия дешевле вдвое' : `${N[k]} ×${v}`).join(', ');
}
function renderTech() {
  const e = eraIndex();
  let html = `<div class="info">Эпоха: <b>${ERAS[e].icon} ${ERAS[e].name}</b>. Наука копится сама — от провинций, школ и университетов.</div>`;
  let prevDone = true;
  for (const t of TECHS) {
    const done = !!S.tech[t.id];
    const unl = [...BUILDINGS.filter(b => b.req === t.id).map(b => b.icon + ' ' + b.name), ...UNITS.filter(u => u.req === t.id).map(u => u.icon + ' ' + u.name)];
    const avail = !done && prevDone;
    html += `<div class="card ${done ? 'owned' : avail && S.sci >= t.cost ? 'can' : avail ? '' : 'locked'}" data-t="${t.id}"><div class="ci">${t.icon}</div><div class="cb">
      <div class="cn">${t.name}<small class="era">${ERAS[t.era].name}</small></div>
      <div class="cp">${effStr(t.eff)}</div>${unl.length ? `<div class="cd">Открывает: ${unl.join(', ')}</div>` : ''}
      <div class="cc">${done ? '<span class="c ok">✔ Изучено</span>' : costSpan('sci', t.cost)}</div></div></div>`;
    prevDone = done;
  }
  $('#p-tech').innerHTML = html;
}
function relWord(r) { return r >= 70 ? 'дружба' : r >= 30 ? 'тёплые' : r >= 0 ? 'нейтральные' : r > -60 ? 'холодные' : 'вражда'; }
function renderDiplo() {
  const c = S.diploSel;
  let html = '';
  if (c != null && c !== S.pc && S.alive[c]) {
    const n = countProv(c), war = S.wars[c], nb = isNeighbor(c);
    const truce = (S.truce[c] || 0) > S.time;
    html += `<div class="dsel"><h3>${chip(c)} ${CNAME[c]}</h3>
      <p>Провинций: <b>${n}</b> · Мощь: <b>${fmt(power(c))}</b> (твоя: ${fmt(M.atk + M.def)})</p>
      <p>Отношения: <b>${Math.round(S.rel[c])}</b> (${relWord(S.rel[c])})${S.trade[c] ? ' · 🤝 торговля' : ''}${S.ally[c] ? ' · 🫱 союз' : ''}${war ? ' · ⚔️ <b class="bad">война</b>' : ''}${truce ? ' · 🕊️ перемирие' : ''}</p>
      <div class="dbtns">`;
    if (war) html += `<button data-act="peace">🕊️ Предложить мир ${war.taken >= war.lost ? '(бесплатно)' : `(${fmt(peaceCost())} 💰)`}</button>`;
    else {
      html += `<button data-act="gift">🎁 Подарок +20 (${fmt(giftCost())} 💰)</button>`;
      html += `<button data-act="trade" ${S.trade[c] || S.rel[c] < 30 ? 'disabled' : ''}>🤝 Торговля${S.trade[c] ? ' ✔' : ' (от 30)'}</button>`;
      html += `<button data-act="ally" ${S.ally[c] || S.rel[c] < 70 ? 'disabled' : ''}>🫱 Союз${S.ally[c] ? ' ✔' : ' (от 70)'}</button>`;
      const canAnnex = S.ally[c] && S.rel[c] >= 90 && M.atk + M.def >= power(c) * 2;
      html += `<button data-act="annex" ${canAnnex ? '' : 'disabled'}>👑 Присоединить (${fmt(annexCost(c))} 💰)<small>союз, отношения 90+, твоя мощь вдвое больше</small></button>`;
      html += `<button data-act="war" class="danger" ${!nb || truce ? 'disabled' : ''}>⚔️ Объявить войну${!nb ? ' (нет границы)' : ''}</button>`;
    }
    html += `</div></div>`;
  } else html += `<div class="info">Кликни на чужую страну на карте или выбери из списка ниже.</div>`;
  const list = [];
  for (let d = 0; d < NC; d++) if (d !== S.pc && S.alive[d]) list.push(d);
  const nbs = countNeighbors(S.pc);
  list.sort((a, b) => (nbs.has(b) - nbs.has(a)) || (countProv(b) - countProv(a)));
  html += `<h4>Страны</h4><div class="clist">${list.map(d => `<button class="crow ${d === c ? 'on' : ''}" data-c="${d}">${chip(d)}<span>${CNAME[d]}</span>
    <small>${S.wars[d] ? '⚔️' : ''}${S.ally[d] ? '🫱' : ''}${S.trade[d] ? '🤝' : ''}${nbs.has(d) ? '📍' : ''} ${countProv(d)} пр.</small><b class="${S.rel[d] >= 0 ? 'good' : 'bad'}">${Math.round(S.rel[d])}</b></button>`).join('')}</div>
    <p class="muted small">📍 — сосед, с ним можно воевать.</p>`;
  $('#p-diplo').innerHTML = html;
}
function renderLog() {
  $('#p-log').innerHTML = S.log.length ? S.log.map(l => `<div class="logrow ${l.c}"><b>${l.y}</b> ${esc(l.t)}</div>`).join('') : '<p class="muted">Пока ничего не случилось.</p>';
}
function renderAch() {
  $('#p-ach').innerHTML = `<p>Открыто <b>${Object.keys(S.ach).length}</b> из ${ACH.length}. Каждое даёт <b>+1%</b> ко всему.</p>
    <div class="achgrid">${ACH.map(a => `<div class="ach ${S.ach[a.id] ? 'got' : ''}"><span>${S.ach[a.id] ? a.icon : '🔒'}</span><small>${a.name}</small><em>${a.desc}</em></div>`).join('')}</div>`;
}
function renderSettings() {
  const st = S.stats;
  $('#p-set').innerHTML = `<h3>Статистика</h3><table class="stats">
    <tr><td>Время правления</td><td>${fmtTime(S.time)}</td></tr><tr><td>Кликов</td><td>${fmt(st.clicks)}</td></tr>
    <tr><td>Провинций захвачено</td><td>${st.conquered}</td></tr><tr><td>Провинций потеряно</td><td>${st.lost}</td></tr>
    <tr><td>Войн выиграно</td><td>${st.warsWon}</td></tr><tr><td>Максимум провинций</td><td>${st.maxProv}</td></tr>
    <tr><td>Золота заработано</td><td>${fmt(st.goldTotal)}</td></tr><tr><td>Побед (мировое господство)</td><td>${S.wins} (+${S.wins * 50}%)</td></tr></table>
    <h3>Настройки</h3><div class="setbtns">
    <button id="soundBtn">${S.sound ? '🔊 Звук: вкл' : '🔇 Звук: выкл'}</button><button id="saveBtn">💾 Сохранить</button>
    <button id="exportBtn">📤 Экспорт</button><button id="importBtn">📥 Импорт</button>
    <button id="resetBtn" class="danger">🗑️ Новая игра</button></div>
    <textarea id="saveText" placeholder="Код сохранения"></textarea>
    <h3>Как играть</h3><ul class="help">
    <li>Кликай по своим провинциям — получаешь золото. Чем развитее провинция, тем больше.</li>
    <li>Строй здания (вкладка «Экономика») и изучай технологии («Наука»).</li>
    <li>Нанимай войска и объявляй войну соседям во вкладке «Дипломатия».</li>
    <li>Во время войны кликай по вражеским провинциям у границы — так ты их штурмуешь. Армия штурмует и сама.</li>
    <li>Если враг осаждает твою провинцию (🔥), кликай по ней, чтобы отбиться.</li>
    <li>Возьми вражескую столицу ★ — и вся страна твоя! Захвати всю карту, чтобы победить.</li></ul>`;
}

function renderSel() {
  const el = $('#sel'), p = selProv;
  if (p < 0 || !S.started) { el.hidden = true; return; }
  const o = owner[p]; el.hidden = false;
  let html = `<div class="selh">${chip(o)}<b>${esc(PNAME[p])}</b>${cap[o] === p ? ' ★' : ''}<button class="x" data-act="close">✕</button></div>
    <div class="selb">${CNAME[o]} · развитие <b>${dev[p]}</b>`;
  if (o === S.pc) {
    html += ` · клик: +${fmt(clickGold(p))} 💰</div>`;
    if (S.esiege[p]) html += `<div class="bad">🔥 Осада: ${CNAME[S.esiege[p].c]} — <b id="selProg"></b>. Кликай, чтобы отбить!</div>`;
    html += `<button data-act="dev" ${dev[p] >= 30 ? 'disabled' : ''}>🏛️ Развить (${fmt(devCost(p))} 💰)</button>`;
  } else if (S.wars[o]) {
    html += `</div><div>⚔️ Штурм: <b id="selProg"></b> ${isAdjToMe(p) ? '' : '<span class="bad">(нет границы)</span>'}</div>`;
  } else {
    html += ` · отношения ${Math.round(S.rel[o])}</div><button data-act="diplo">🤝 Дипломатия</button>`;
  }
  el.innerHTML = html;
  updateSelProg();
}
function updateSelProg() {
  const el = document.getElementById('selProg'); if (!el || selProv < 0) return;
  const p = selProv;
  if (owner[p] === S.pc && S.esiege[p]) el.textContent = Math.floor(S.esiege[p].prog / hpMine(p) * 100) + '%';
  else if (S.wars[owner[p]]) el.textContent = Math.floor((S.siege[p] || 0) / hpEnemy(p) * 100) + '%';
}
function renderWars() {
  const ws = Object.keys(S.wars).map(Number);
  $('#wars').innerHTML = ws.map(c => {
    const w = S.wars[c];
    return `<div class="war" data-c="${c}">${chip(c)}<b>${CNAME[c]}</b><small>взято ${w.taken} · потеряно ${w.lost}</small>
      <div class="wbar"><i id="wb-${c}"></i></div><div class="wbar e"><i id="we-${c}"></i></div></div>`;
  }).join('');
}
function updateWars() {
  for (const c in S.wars) {
    const w = S.wars[c], a = document.getElementById('wb-' + c), b = document.getElementById('we-' + c);
    if (a) a.style.width = (w.target >= 0 ? clamp((S.siege[w.target] || 0) / hpEnemy(w.target), 0, 1) * 100 : 0) + '%';
    if (b) b.style.width = (w.etarget >= 0 && S.esiege[w.etarget] ? clamp(S.esiege[w.etarget].prog / hpMine(w.etarget), 0, 1) * 100 : 0) + '%';
  }
}

function updateTop() {
  $('#realmChip').style.background = CCOL[S.pc];
  $('#realmName').textContent = CNAME[S.pc];
  const e = eraIndex();
  $('#eraName').textContent = `${ERAS[e].icon} ${ERAS[e].name}`;
  $('#year').textContent = year() + ' г.';
  $('#r-gold').textContent = fmt(S.gold); $('#rr-gold').textContent = `+${fmt(M.goldPS)}/с`;
  $('#r-mp').textContent = fmt(S.mp); $('#rr-mp').textContent = `+${fmt(M.mpPS)}/с`;
  $('#r-sci').textContent = fmt(S.sci); $('#rr-sci').textContent = `+${fmt(M.sciPS)}/с`;
  $('#r-atk').textContent = fmt(effAtk()); $('#r-def').textContent = fmt(M.def); $('#r-prov').textContent = M.prov;
  const nt = TECHS.find(t => !S.tech[t.id]);
  $('#techBadge').hidden = !(nt && S.sci >= nt.cost);
}
let lastPanelRefresh = 0;
function refreshPanels() {
  if (activeTab === 'econ') {
    document.querySelectorAll('#bldList .card[data-b]').forEach(el => { const pl = bldPlan(BMAP[el.dataset.b]); el.classList.toggle('can', S.gold >= pl.gold); });
    if (S.buyAmt === 'max') renderEcon(); else refreshCosts($('#bldList'));
  } else if (activeTab === 'army') {
    if (S.buyAmt === 'max') renderArmy();
    else { document.querySelectorAll('#unitList .card[data-u]').forEach(el => { const pl = unitPlan(UMAP[el.dataset.u]); el.classList.toggle('can', S.gold >= pl.gold && S.mp >= pl.mp); }); refreshCosts($('#unitList')); }
  } else if (activeTab === 'tech') renderTech();
  else if (activeTab === 'diplo') { /* обновляется по событиям */ }
}

/* ---------- ЭФФЕКТЫ ---------- */
function floatText(t, x, y, cls) {
  const el = document.createElement('div'); el.className = 'float ' + (cls || ''); el.textContent = t;
  el.style.left = (x + Math.random() * 24 - 12) + 'px'; el.style.top = (y - 12) + 'px';
  $('#floats').appendChild(el); setTimeout(() => el.remove(), 900);
}
function toast(t) {
  const box = $('#toasts'), el = document.createElement('div'); el.className = 'toast'; el.textContent = t;
  box.appendChild(el); while (box.children.length > 4) box.firstChild.remove();
  setTimeout(() => el.classList.add('out'), 3000); setTimeout(() => el.remove(), 3600);
}
function showModal(html, btns) {
  $('#modalBody').innerHTML = html;
  const box = $('#modalBtns'); box.innerHTML = '';
  (btns || [{ text: 'Хорошо' }]).forEach(b => {
    const el = document.createElement('button'); el.textContent = b.text; if (b.cls) el.className = b.cls;
    el.onclick = () => { $('#modal').hidden = true; if (b.fn) b.fn(); };
    box.appendChild(el);
  });
  $('#modal').hidden = false;
}
let actx;
function beep(f, d, type) {
  if (!S || !S.sound) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type || 'triangle'; o.frequency.value = f;
    g.gain.setValueAtTime(.07, actx.currentTime); g.gain.exponentialRampToValueAtTime(.0001, actx.currentTime + d);
    o.connect(g); g.connect(actx.destination); o.start(); o.stop(actx.currentTime + d);
  } catch (e) { /* */ }
}
function fanfare(short) { (short ? [523, 784] : [523, 659, 784, 1047]).forEach((f, i) => setTimeout(() => beep(f, .15), i * 110)); }
function alarm() { [300, 220, 300, 220].forEach((f, i) => setTimeout(() => beep(f, .14, 'square'), i * 150)); }

/* ---------- ВЫБОР СТРАНЫ ---------- */
function chooseCountry() {
  S.started = false;
  owner = Int16Array.from(PC0); cap = Int16Array.from(CAP0);
  redrawAll(); labelsDirty = true; fitAll(); selectProv(-1);
  const list = [...Array(NC).keys()].sort((a, b) => countProv(b) - countProv(a));
  const diff = n => n >= 15 ? '<em class="e">легко</em>' : n >= 6 ? '<em class="m">средне</em>' : '<em class="h">сложно</em>';
  showModal(`<div class="bigicon">🗺️</div><h2>Выбери державу</h2>
    <p>Начни с одной страны и окрась всю Европу в свой цвет!${S.wins ? `<br>Бонус побед: <b>+${S.wins * 50}%</b>` : ''}</p>
    <div class="pick">${list.map(c => `<button data-pick="${c}">${chip(c)}<span>${CNAME[c]}</span>${diff(countProv(c))}<small>${countProv(c)} пр.</small></button>`).join('')}</div>`, []);
}
function startAs(c) {
  const keep = { wins: S.wins, sound: S.sound, allAch: S.allAch || {} };
  newWorld(c, keep);
  S.started = true;
  recalc(); redrawAll(); labelsDirty = true;
  focusOn(c, 3.5);
  $('#modal').hidden = true;
  logMsg(`Начало правления: ${CNAME[c]}`, 'good');
  renderAllPanels();
  save();
  showModal(`<div class="bigicon">⚜️</div><h2>${CNAME[c]}</h2>
    <p>Кликай по своим провинциям, чтобы наполнить казну. Строй рынки и шахты, нанимай ополчение — и бери соседей кликами!</p>
    <p class="muted small">Подсказка: колёсико мыши или два пальца — приблизить карту, перетаскивание — двигать.</p>`, [{ text: 'К делу!' }]);
}
function renderAllPanels() { renderEcon(); renderArmy(); renderTech(); renderDiplo(); renderLog(); renderAch(); renderSettings(); renderWars(); renderSel(); updateTop(); }

/* ---------- СОБЫТИЯ ИНТЕРФЕЙСА ---------- */
function bind() {
  $('#tabs').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setTab(b.dataset.tab); });
  document.querySelectorAll('.buyamt').forEach(el => el.addEventListener('click', e => { const b = e.target.closest('button'); if (b) setBuyAmt(b.dataset.amt); }));
  $('#bldList').addEventListener('click', e => { const c = e.target.closest('[data-b]'); if (c) buyBuilding(c.dataset.b); });
  $('#unitList').addEventListener('click', e => { const c = e.target.closest('[data-u]'); if (c) buyUnit(c.dataset.u); });
  $('#p-tech').addEventListener('click', e => { const c = e.target.closest('[data-t]'); if (c) research(c.dataset.t); });
  $('#p-diplo').addEventListener('click', e => {
    const row = e.target.closest('[data-c]'); if (row) { S.diploSel = +row.dataset.c; renderDiplo(); return; }
    const b = e.target.closest('[data-act]'); if (!b) return; const c = S.diploSel;
    ({ gift: () => gift(c), trade: () => makeTrade(c), ally: () => makeAlly(c), annex: () => annex(c),
      war: () => showModal(`<h2>Война с ${CNAME[c]}?</h2><p>Их мощь: <b>${fmt(power(c))}</b>, твоя атака: <b>${fmt(M.atk)}</b>, оборона: <b>${fmt(M.def)}</b>.</p><p>Остальные страны станут относиться к тебе хуже.</p>`,
        [{ text: '⚔️ В бой!', cls: 'danger', fn: () => declareWar(c) }, { text: 'Отмена' }]),
      peace: () => offerPeace(c) })[b.dataset.act]();
  });
  $('#sel').addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    if (b.dataset.act === 'close') selectProv(-1);
    else if (b.dataset.act === 'dev') developProvince(selProv);
    else if (b.dataset.act === 'diplo') { S.diploSel = owner[selProv]; setTab('diplo'); }
  });
  $('#wars').addEventListener('click', e => { const w = e.target.closest('[data-c]'); if (w) { S.diploSel = +w.dataset.c; setTab('diplo'); } });
  $('#modalBody').addEventListener('click', e => { const b = e.target.closest('[data-pick]'); if (b) startAs(+b.dataset.pick); });
  $('#p-set').addEventListener('click', e => {
    const id = e.target.id;
    if (id === 'soundBtn') { S.sound = !S.sound; renderSettings(); }
    else if (id === 'saveBtn') { save(); toast('💾 Сохранено'); }
    else if (id === 'exportBtn') { save(); try { $('#saveText').value = btoa(unescape(encodeURIComponent(localStorage.getItem(SAVE_KEY)))); } catch (err) { /* */ } $('#saveText').select(); }
    else if (id === 'importBtn') {
      try { const raw = decodeURIComponent(escape(atob($('#saveText').value.trim()))); JSON.parse(raw); localStorage.setItem(SAVE_KEY, raw); location.reload(); }
      catch (err) { toast('❌ Неверный код'); }
    } else if (id === 'resetBtn') showModal('<h2>Начать новую игру?</h2><p>Текущая партия будет потеряна.</p>',
      [{ text: 'Да, заново', cls: 'danger', fn: () => { const keep = { wins: S.wins, sound: S.sound, allAch: S.allAch }; newWorld(0, keep); chooseCountry(); } }, { text: 'Отмена' }]);
  });
  $('#zIn').onclick = () => zoomAt(view.cw / 2, view.ch / 2, 1.4);
  $('#zOut').onclick = () => zoomAt(view.cw / 2, view.ch / 2, 1 / 1.4);
  $('#zHome').onclick = () => S.started ? focusOn(S.pc, 3.5) : fitAll();
  window.addEventListener('resize', () => { resizeCanvas(); clampView(); });
  window.addEventListener('beforeunload', save);
  document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
}

/* ---------- ЦИКЛ ---------- */
let last = performance.now(), acc1 = 0, acc5 = 0;
function step(dt) {
  if (!S.started || S.dead) return;
  S.time += dt;
  gain('gold', M.goldPS * dt); S.mp += M.mpPS * dt; S.sci += M.sciPS * dt;
  warTick(dt);
  aiTick();
  relTick(dt);
}
function frame(now) {
  let dt = (now - last) / 1000; last = now;
  if (dt > 5) dt = 5;
  step(dt);
  acc1 += dt; acc5 += dt;
  if (S.started) {
    updateTop(); updateWars(); updateSelProg();
    if (acc1 > 0.5) { acc1 = 0; refreshPanels(); checkAch(); const hint = $('#hint'); hint.hidden = S.stats.clicks > 15; }
    if (acc5 > 10) { acc5 = 0; save(); }
  }
  render(now);
  requestAnimationFrame(frame);
}
function offline() {
  const sec = (Date.now() - S.lastSave) / 1000;
  if (sec < 60 || !S.started) return;
  const t = Math.min(sec, 8 * 3600), k = 0.5;
  const g = M.goldPS * t * k, m = M.mpPS * t * k, sc = M.sciPS * t * k;
  gain('gold', g); S.mp += m; S.sci += sc;
  showModal(`<div class="bigicon">🌙</div><h2>С возвращением!</h2><p>Тебя не было ${fmtTime(sec)}. Подданные трудились (на 50%):</p>
    <p class="loot">💰 ${fmt(g)}<br>👥 ${fmt(m)}<br>🔬 ${fmt(sc)}</p>`);
}

function start() {
  resizeCanvas();
  bind();
  if (load() && S.started) {
    recalc(); redrawAll(); labelsDirty = true; focusOn(S.pc, 3.5);
    renderAllPanels(); offline();
  } else {
    newWorld(0); recalc(); chooseCountry();
  }
  requestAnimationFrame(frame);
}
start();
