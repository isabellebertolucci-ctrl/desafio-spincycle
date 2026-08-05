import { useState, useEffect } from "react";

// ---------- Constantes ----------
const WEEKDAY_SLOTS = ["06:15", "07:15", "08:15", "11:15", "16:30", "17:30", "18:30", "19:30"];
const WEEKEND_SLOTS = ["08:00", "09:00", "10:00", "11:00"];
const INSTRUCTORS = ["Ana B.", "Ana Paula", "Gabriel Marcondes", "Gabriel Vilela", "Thiago"];
const AJUDA_WHATSAPP = "5518991404769";
const DESAFIO_INICIO = "2026-08-05";
const ADMINS = {
  recepcao: "203948!#",
  raquel: "211308!#",
  isabelle: "273646!#",
  monique: "937264!#",
};
const isWeekendDate = (s) => {
  const d = new Date(s + "T12:00:00").getDay();
  return d === 0 || d === 6;
};

const C = {
  bg: "#0C0C0D",
  panel: "var(--panel)",
  panelSoft: "var(--panelSoft)",
  wine: "#3F6C85",
  wineDeep: "#1E3038",
  amber: "#249FA7",
  amberSoft: "#249FA7",
  oak: "#B08D5E",
  cream: "#F2F2F2",
  mut: "#8F8F8F",
  line: "var(--line)",
  ok: "#7FAF6E",
};

const MISSION_BASE = [
  { id: "dobra", name: "Dobradinha" },
  { id: "madruga", name: "Madrugador" },
  { id: "maratona", name: "Maratonista" },
  { id: "semana", name: "Semana Perfeita" },
  { id: "zona", name: "Troca a Base" },
  { id: "fds", name: "Fim de Semana Raiz" },
  { id: "giro", name: "Giro na Grade" },
  { id: "fogo", name: "Sequência de Fogo" },
  { id: "amigo", name: "Chama a Galera" },
];

const TRACKS = [
  { id: "ilimitado", label: "Alunos Ilimitados", sub: "Plano de aulas ilimitadas", short: "ILIMITADOS",
    targets: { dobra: 4, madruga: 5, maratona: 30, semana: 7, zona: 3, fds: 4, giro: 5, fogo: 12, amigo: 8 } },
  { id: "pacote", label: "Alunos de Pacotes", sub: "Pacotes de aulas avulsas", short: "PACOTES",
    targets: { dobra: 2, madruga: 3, maratona: 16, semana: 5, zona: 3, fds: 4, giro: 4, fogo: 5, amigo: 10 } },
  { id: "passe", label: "Alunos Híbridos", sub: "Gympass/TotalPass e Gympass/TotalPass+Pacote", short: "HÍBRIDOS",
    targets: { dobra: 1, madruga: 3, maratona: 15, semana: 4, zona: 3, fds: 3, giro: 4, fogo: 4, amigo: 10 } },
];

const missionDesc = (id, n) => ({
  dobra: n === 1 ? "2 aulas seguidas no mesmo dia (1 vez)" : `2 aulas seguidas no mesmo dia, em ${n} dias diferentes`,
  madruga: `${n} aulas das 6h15`,
  maratona: `Treinar em ${n} dias diferentes`,
  semana: n === 7 ? "Treinar todos os dias, de segunda a domingo" : `Treinar ${n} dias na mesma semana (seg a dom)`,
  zona: `Aulas com ${n} professores diferentes`,
  fds: `Treinar ${n} finais de semana seguidos`,
  giro: `Fazer aula em ${n} horários diferentes da grade (vale fim de semana)`,
  fogo: `${n} dias seguidos sem faltar`,
  amigo: `Trazer ${n} convidados — até 2 podem ser alunos da Spin que você trouxer para o desafio; os demais, gente nova (nunca pedalou ou 6+ meses sem aparecer). Validado pela recepção`,
}[id]);

const TRACK_MISSIONS = Object.fromEntries(TRACKS.map((t) => [
  t.id,
  MISSION_BASE.map((m) => ({ ...m, target: t.targets[m.id], desc: missionDesc(m.id, t.targets[m.id]) })),
]));

let MISSIONS = TRACK_MISSIONS.ilimitado;

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

// ---------- Datas ----------
const toDate = (s) => new Date(s + "T12:00:00");
const dayMs = 86400000;
const dayIndex = (s) => Math.round(toDate(s).getTime() / dayMs);
const mondayOf = (s) => dayIndex(s) - ((toDate(s).getDay() + 6) % 7);
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const fmtBR = (s) => { const d = toDate(s); return `${d.getDate()}/${MESES[d.getMonth()]}`; };
const fmtTs = (ts) => { const d = new Date(ts); const p = (n) => String(n).padStart(2, "0"); return `${d.getDate()}/${MESES[d.getMonth()]} \u00b7 ${p(d.getHours())}h${p(d.getMinutes())}`; };
const weekdayBR = (s) => toDate(s).toLocaleDateString("pt-BR", { weekday: "short" });
const norm = (s) => (s || "").trim().replace(/\s+/g, " ").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const normQ = (s) => norm(s).replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
const todayStr = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

// ---------- Cálculo das missões (só registros validados) ----------
const slotMin = (slot) => {
  const [h, m] = slot.split(":").map(Number);
  return h * 60 + m;
};

function computeProgress(student) {
  const recs = (student.records || []).filter((r) => r.status === "ok");
  const p = {};

  p.giro = new Set(recs.map((r) => r.slot)).size;

  p.dobra = 0;
  const byDate = {};
  recs.forEach((r) => { (byDate[r.date] = byDate[r.date] || []).push(slotMin(r.slot)); });
  for (const d in byDate) {
    const mins = [...new Set(byDate[d])].sort((a, b) => a - b);
    for (let i = 1; i < mins.length; i++) {
      if (mins[i] - mins[i - 1] <= 60) { p.dobra++; break; }
    }
  }

  p.madruga = recs.filter((r) => r.slot === "06:15").length;

  const dates = [...new Set(recs.map((r) => r.date))].sort();
  const byWeek = {};
  dates.forEach((d) => { (byWeek[mondayOf(d)] = byWeek[mondayOf(d)] || new Set()).add(dayIndex(d)); });
  p.semana = Object.values(byWeek).reduce((m, s) => Math.max(m, s.size), 0);

  const gok = (student.guests || []).filter((g) => g.status === "ok");
  p.amigo = gok.filter((g) => g.kind !== "spin").length + Math.min(2, gok.filter((g) => g.kind === "spin").length);

  const wkndWeeks = [...new Set(
    dates.filter((d) => [0, 6].includes(toDate(d).getDay())).map((d) => mondayOf(d))
  )].sort((a, b) => a - b);
  let best = wkndWeeks.length ? 1 : 0, run = 1;
  for (let i = 1; i < wkndWeeks.length; i++) {
    run = wkndWeeks[i] - wkndWeeks[i - 1] === 7 ? run + 1 : 1;
    best = Math.max(best, run);
  }
  p.fds = best;

  p.maratona = dates.length;
  p.zona = new Set(recs.map((r) => (r.instructor || "").trim().toLowerCase()).filter(Boolean)).size;

  const idxs = dates.map(dayIndex);
  let bestRun = idxs.length ? 1 : 0, r2 = 1;
  for (let i = 1; i < idxs.length; i++) {
    r2 = idxs[i] - idxs[i - 1] === 1 ? r2 + 1 : 1;
    bestRun = Math.max(bestRun, r2);
  }
  p.fogo = bestRun;

  const done = MISSIONS.map((m) => p[m.id] >= m.target);
  const doneCount = done.filter(Boolean).length;
  const linesDone = LINES.filter((ln) => ln.every((i) => done[i])).length;
  const corners = [0, 2, 6, 8].every((i) => done[i]);
  const vertLines = [[0, 3, 6], [1, 4, 7], [2, 5, 8]].filter((ln) => ln.every((i) => done[i])).length;
  const horizLines = [[0, 1, 2], [3, 4, 5], [6, 7, 8]].filter((ln) => ln.every((i) => done[i])).length;
  const diagLines = [[0, 4, 8], [2, 4, 6]].filter((ln) => ln.every((i) => done[i])).length;
  const bought = (student.guests || []).filter((g) => g.bought).length;
  const pending = (student.records || []).filter((r) => r.status === "pending").length
    + (student.guests || []).filter((g) => g.status === "pending").length;
  return { p, done, doneCount, linesDone, corners, vertLines, horizLines, diagLines, bought, full: doneCount === 9, pending };
}

// ---------- Data de conclusão de cada missão (para o Shake do Mês) ----------
function missionCompletionDates(student) {
  const T = Object.fromEntries(MISSIONS.map((m) => [m.id, m.target]));
  const recs = (student.records || []).filter((r) => r.status === "ok")
    .slice().sort((a, b) => ((a.date + a.slot) < (b.date + b.slot) ? -1 : 1));
  const out = {};
  const byDate = {};
  recs.forEach((r) => { (byDate[r.date] = byDate[r.date] || []).push(slotMin(r.slot)); });
  const sortedDates = Object.keys(byDate).sort();

  let c = 0;
  for (const d of sortedDates) {
    const mins = [...new Set(byDate[d])].sort((x, y) => x - y);
    if (mins.some((m, i) => i > 0 && m - mins[i - 1] <= 60)) { c++; if (c === T.dobra) { out.dobra = d; break; } }
  }

  const m615 = recs.filter((r) => r.slot === "06:15");
  if (m615.length >= T.madruga) out.madruga = m615[T.madruga - 1].date;

  if (sortedDates.length >= T.maratona) out.maratona = sortedDates[T.maratona - 1];

  const byWeek = {};
  sortedDates.forEach((d) => { const w = mondayOf(d); (byWeek[w] = byWeek[w] || []).push(d); });
  for (const w of Object.keys(byWeek).map(Number).sort((a, b) => a - b)) {
    const days = [...new Set(byWeek[w])].sort();
    if (days.length >= T.semana) { out.semana = days[T.semana - 1]; break; }
  }

  const seen = new Set();
  for (const r of recs) {
    const k = (r.instructor || "").trim().toLowerCase();
    if (k && !seen.has(k)) { seen.add(k); if (seen.size === T.zona) { out.zona = r.date; break; } }
  }

  const wkndByWeek = {};
  sortedDates.filter((d) => [0, 6].includes(toDate(d).getDay())).forEach((d) => {
    const w = mondayOf(d); (wkndByWeek[w] = wkndByWeek[w] || []).push(d);
  });
  const wWeeks = Object.keys(wkndByWeek).map(Number).sort((a, b) => a - b);
  let runW = wWeeks.length ? 1 : 0;
  if (runW === T.fds && wWeeks.length) out.fds = wkndByWeek[wWeeks[0]].sort()[0];
  for (let i = 1; i < wWeeks.length && !out.fds; i++) {
    runW = wWeeks[i] - wWeeks[i - 1] === 7 ? runW + 1 : 1;
    if (runW === T.fds) out.fds = wkndByWeek[wWeeks[i]].sort()[0];
  }

  const slotsSeen = new Set();
  for (const r of recs) {
    if (!slotsSeen.has(r.slot)) { slotsSeen.add(r.slot); if (slotsSeen.size === T.giro) { out.giro = r.date; break; } }
  }

  const idxs = sortedDates.map(dayIndex);
  let runF = idxs.length ? 1 : 0;
  if (runF === T.fogo && sortedDates.length) out.fogo = sortedDates[0];
  for (let i = 1; i < idxs.length && !out.fogo; i++) {
    runF = idxs[i] - idxs[i - 1] === 1 ? runF + 1 : 1;
    if (runF === T.fogo) out.fogo = sortedDates[i];
  }

  const g = (student.guests || []).filter((x) => x.status === "ok").slice().sort((a, b) => (a.date < b.date ? -1 : 1));
  let cnt = 0, spinUsed = 0;
  for (const gg of g) {
    if (gg.kind === "spin") {
      if (spinUsed < 2) { spinUsed++; cnt++; } else continue;
    } else cnt++;
    if (cnt >= T.amigo) { out.amigo = gg.date; break; }
  }

  return out;
}

// ---------- Primeiro a completar cada padrão premiado ----------
function computePrizeWinners(students) {
  const patternDate = (s, idxs) => {
    const md = missionCompletionDates(s);
    const ds = idxs.map((i) => md[MISSIONS[i].id]);
    return ds.every(Boolean) ? ds.slice().sort().slice(-1)[0] : null;
  };
  const bestOf = (groups, extra) => {
    let best = null;
    students.forEach((s) => {
      let d = null;
      groups.forEach((g) => {
        const x = patternDate(s, g);
        if (x && (!d || x < d)) d = x;
      });
      if (d && extra && !extra(s)) d = null;
      if (d && (!best || d < best.date)) best = { name: s.name, id: s.id, date: d };
    });
    return best;
  };
  return {
    horiz: bestOf([[0, 1, 2], [3, 4, 5], [6, 7, 8]]),
    vert: bestOf([[0, 3, 6], [1, 4, 7], [2, 5, 8]]),
    corners: bestOf([[0, 2, 6, 8]]),
    full: bestOf([[0, 1, 2, 3, 4, 5, 6, 7, 8]]),
    bpm: bestOf([[0, 1, 2, 3, 4, 5, 6, 7, 8]], (s) => (s.guests || []).filter((g) => g.bought).length >= 4),
  };
}

// ---------- Registro permanente de vencedores e colocações (nunca substituído) ----------
function captureWinners(d) {
  if (!d.winners) d.winners = { missions: {}, patterns: {} };
  if (!d.winners.placements) d.winners.placements = {};
  const now = Date.now();
  const mdCache = {};
  const md = (s) => (mdCache[s.id] = mdCache[s.id] || missionCompletionDates(s));
  const regOfDate = (s, dt) => {
    const regs = (s.records || []).filter((r) => r.status === "ok" && r.date === dt && r.reg).map((r) => r.reg);
    const gregs = (s.guests || []).filter((g) => g.status === "ok" && g.date === dt && g.reg).map((g) => g.reg);
    const all = regs.concat(gregs);
    return all.length ? Math.min(...all) : 0;
  };

  if (!d.winners.missionQueues) d.winners.missionQueues = {};
  MISSIONS.forEach((m) => {
    if (!d.winners.missionQueues[m.id]) d.winners.missionQueues[m.id] = [];
    const q = d.winners.missionQueues[m.id];
    if (!q.length && d.winners.missions[m.id]) q.push({ ...d.winners.missions[m.id] });
    const have = new Set(q.map((x) => x.id));
    const news = [];
    d.students.forEach((s) => {
      if (have.has(s.id)) return;
      const dt = md(s)[m.id];
      if (dt) news.push({ name: s.name, id: s.id, date: dt, reg: regOfDate(s, dt) });
    });
    news.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : (a.reg || 0) - (b.reg || 0)));
    news.forEach((n2) => q.push({ ...n2, ts: now }));
    if (!d.winners.missions[m.id] && q.length) d.winners.missions[m.id] = { ...q[0] };
  });

  const GROUPS = {
    horiz: [[0, 1, 2], [3, 4, 5], [6, 7, 8]],
    vert: [[0, 3, 6], [1, 4, 7], [2, 5, 8]],
    diag: [[0, 4, 8], [2, 4, 6]],
    corners: [[0, 2, 6, 8]],
    full: [[0, 1, 2, 3, 4, 5, 6, 7, 8]],
    bpm: [[0, 1, 2, 3, 4, 5, 6, 7, 8]],
  };
  const patternDate = (s, groups) => {
    let best = null;
    groups.forEach((g) => {
      const ds = g.map((i) => md(s)[MISSIONS[i].id]);
      if (ds.every(Boolean)) {
        const x = ds.slice().sort().slice(-1)[0];
        if (!best || x < best) best = x;
      }
    });
    return best;
  };
  Object.entries(GROUPS).forEach(([k, groups]) => {
    if (!d.winners.placements[k]) d.winners.placements[k] = [];
    const list = d.winners.placements[k];
    if (!list.length && d.winners.patterns[k]) list.push({ ...d.winners.patterns[k] });
    const have = new Set(list.map((x) => x.id));
    const news = [];
    d.students.forEach((s) => {
      if (have.has(s.id)) return;
      let dt = patternDate(s, groups);
      if (dt && k === "bpm" && (s.guests || []).filter((g) => g.bought).length < 4) dt = null;
      if (dt) news.push({ id: s.id, name: s.name, date: dt, reg: regOfDate(s, dt) });
    });
    news.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : (a.reg || 0) - (b.reg || 0)));
    news.forEach((n) => list.push({ ...n, ts: now }));
    if (!d.winners.patterns[k] && list.length) d.winners.patterns[k] = { ...list[0] };
  });

  if (!d.winners.placements.conv) d.winners.placements.conv = [];
  {
    const list = d.winners.placements.conv;
    const have = new Set(list.map((x) => x.id));
    const news = [];
    d.students.forEach((s) => {
      if (have.has(s.id)) return;
      const bs = (s.guests || []).filter((g) => g.bought).map((g) => g.boughtTs || g.reg || 0).sort((a, b) => a - b);
      if (bs.length >= 4) {
        const t4 = bs[3] || now;
        news.push({ id: s.id, name: s.name, date: new Date(t4).toISOString().slice(0, 10), reg: t4 });
      }
    });
    news.sort((a, b) => (a.reg || 0) - (b.reg || 0));
    news.forEach((n) => list.push({ ...n, ts: now }));
    if (!d.winners.patterns.conv && list.length) d.winners.patterns.conv = { ...list[0] };
  }
}

// ---------- Distribuição de prêmios: teto de 2 shakes e 2 padrões por aluno ----------
function computeAwards(d) {
  const w = (d && d.winners) || {};
  const mq = w.missionQueues || {};
  const pq = w.placements || {};
  const events = [];
  MISSIONS.forEach((m) => (mq[m.id] || []).forEach((e, i) => events.push({ kind: "s", key: m.id, e, i })));
  ["horiz", "vert", "diag"].forEach((k) => (pq[k] || []).forEach((e, i) => events.push({ kind: "p", key: k, e, i })));
  events.sort((a, b) => ((a.e.ts || 0) - (b.e.ts || 0)) || (a.e.date < b.e.date ? -1 : a.e.date > b.e.date ? 1 : 0) || (a.i - b.i));
  const shakes = {}, pats = {}, sc = {}, pc = {};
  events.forEach(({ kind, key, e }) => {
    if (kind === "s") {
      if (shakes[key] || (sc[e.id] || 0) >= 2) return;
      shakes[key] = e; sc[e.id] = (sc[e.id] || 0) + 1;
    } else {
      if (pats[key] || (pc[e.id] || 0) >= 1) return;
      pats[key] = e; pc[e.id] = (pc[e.id] || 0) + 1;
    }
  });
  pats.corners = (pq.corners || [])[0] || null;
  pats.conv = (pq.conv || [])[0] || null;
  pats.full = (pq.full || [])[0] || null;
  pats.bpm = (pq.bpm || [])[0] || null;
  return { shakes, pats };
}

// ---------- Apuração das missões relâmpago ----------
function miniRecs(d, x) {
  const ini = x.start || DESAFIO_INICIO;
  const out = [];
  d.students.forEach((s) => {
    if (s.approved === false) return;
    (s.records || []).forEach((r) => {
      if (r.status === "ok" && r.date >= ini && r.date <= x.end) out.push({ s, r });
    });
  });
  return out;
}
function miniTop(d, x) {
  const by = {};
  miniRecs(d, x).forEach(({ s, r }) => {
    if (!by[s.id]) by[s.id] = { id: s.id, name: s.name, count: 0, first: r.reg || 0 };
    by[s.id].count += 1;
    if (r.reg && r.reg < by[s.id].first) by[s.id].first = r.reg;
  });
  return Object.values(by).sort((a, b) => b.count - a.count || (a.first || 0) - (b.first || 0));
}
function miniSlotFirsts(d, x) {
  const hits = miniRecs(d, x)
    .filter(({ r }) => (x.slots || []).includes(r.slot))
    .sort((a, b) => (a.r.reg || 0) - (b.r.reg || 0));
  const seen = new Set(); const out = [];
  hits.forEach(({ s, r }) => {
    if (seen.has(s.id)) return;
    seen.add(s.id);
    out.push({ id: s.id, name: s.name, reg: r.reg || 0 });
  });
  return out;
}
function miniElegiveis(d, x) {
  const ids = new Set(miniRecs(d, x).map(({ s }) => s.id));
  return d.students.filter((s) => ids.has(s.id));
}

// ---------- Persistência (compartilhada entre todos) ----------
const KEY_BASE = "spincycle-desafio-shared-v1";
const keyFor = (track) => `${KEY_BASE}-${track}`;
const ADMIN_KEY = "spincycle-admin-device";
const TRACK_PREF_KEY = "spincycle-track";
async function loadData(track) {
  try {
    const res = await window.storage.get(keyFor(track), true);
    return res ? JSON.parse(res.value) : { pin: null, students: [] };
  } catch {
    return { pin: null, students: [] };
  }
}
async function saveData(track, data) {
  try { await window.storage.set(keyFor(track), JSON.stringify(data), true); } catch (e) { console.error(e); }
}
async function loadTrackPref() {
  try { const r = await window.storage.get(TRACK_PREF_KEY, false); return r ? r.value : null; } catch { return null; }
}
async function saveTrackPref(t) {
  try { await window.storage.set(TRACK_PREF_KEY, t, false); } catch { /* ok */ }
}
async function loadAdminFlag() {
  try {
    const res = await window.storage.get(ADMIN_KEY, false);
    return res ? res.value : null;
  } catch { return null; }
}
async function saveAdminFlag(pin) {
  try { await window.storage.set(ADMIN_KEY, pin, false); } catch (e) { console.error(e); }
}
async function clearAdminFlag() {
  try { await window.storage.delete(ADMIN_KEY, false); } catch { /* ok */ }
}
const UNLOCK_KEY = "spincycle-unlocks";
async function loadUnlocks() {
  try {
    const res = await window.storage.get(UNLOCK_KEY, false);
    return res ? JSON.parse(res.value) : {};
  } catch { return {}; }
}
async function saveUnlocks(u) {
  try { await window.storage.set(UNLOCK_KEY, JSON.stringify(u), false); } catch { /* ok */ }
}
const MYID_KEY = "spincycle-myid";
async function loadMyIds() {
  try {
    const res = await window.storage.get(MYID_KEY, false);
    return res ? JSON.parse(res.value) : {};
  } catch { return {}; }
}
async function saveMyIds(m) {
  try { await window.storage.set(MYID_KEY, JSON.stringify(m), false); } catch { /* ok */ }
}

// ---------- Componentes ----------
function BingoCell({ mission, value, done, bear, shake, onClick }) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg p-2 text-left flex flex-col justify-between transition-all duration-300"
      style={{
        aspectRatio: "1",
        background: done ? `linear-gradient(150deg, ${C.amber}, #16696F)` : C.panelSoft,
        border: `1px solid ${done ? C.amberSoft : C.line}`,
        boxShadow: done ? `0 0 18px ${C.amber}55, inset 0 0 12px #249FA744` : "none",
      }}
    >
      <div style={{
        fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 12, lineHeight: 1.15,
        letterSpacing: "0.03em", textTransform: "uppercase",
        color: done ? C.bg : C.cream,
      }}>
        {mission.name}
      </div>
      <div className="flex-1 flex items-center justify-center">
        {bear === "gold" && <Bear gold size={36} />}
        {bear === "white" && <Bear size={36} />}
      </div>
      <div className="flex items-center justify-between gap-1">
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: done ? C.bg : C.mut }}>
          {value}/{mission.target}
        </div>
        {shake && (
          <div style={{ fontSize: 10, fontWeight: 700, color: done ? C.bg : C.amberSoft, whiteSpace: "nowrap" }}>
            ganhou 1 🥤
          </div>
        )}
      </div>
    </button>
  );
}

function Bear({ filled, gold, size = 20 }) {
  const painted = filled || gold;
  const s = painted ? "#0C0C0D" : "#FFFFFF";
  const f = gold ? "#D9A954" : filled ? C.amber : "rgba(255,255,255,0.22)";
  const inner = painted ? "#0C0C0D" : "#FFFFFF";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: "block", transition: "all .3s" }}>
      <circle cx="33" cy="26" r="7.5" fill={f} stroke={s} strokeWidth="3.8" />
      <circle cx="67" cy="26" r="7.5" fill={f} stroke={s} strokeWidth="3.8" />
      <path d="M35 50 C29 59 27 66 29 72 L71 72 C73 66 71 59 65 50 Z" fill={f} stroke="none" />
      <ellipse cx="50" cy="41" rx="19.5" ry="16" fill={f} stroke={s} strokeWidth="3.8" />
      <path d="M34.5 53 C29.5 58 27.4 62.5 27 68" fill="none" stroke={inner} strokeWidth="3.8" strokeLinecap="round" />
      <path d="M65.5 53 C70.5 58 72.6 62.5 73 68" fill="none" stroke={inner} strokeWidth="3.8" strokeLinecap="round" />
      <path d="M42.5 56.5 C40.3 59.5 39.2 62.5 38.9 65.5" fill="none" stroke={inner} strokeWidth="3.8" strokeLinecap="round" />
      <path d="M57.5 56.5 C59.7 59.5 60.8 62.5 61.1 65.5" fill="none" stroke={inner} strokeWidth="3.8" strokeLinecap="round" />
      <path d="M41.5 76.5 C45 79.5 55 79.5 58.5 76.5" fill="none" stroke={inner} strokeWidth="3.8" strokeLinecap="round" />
      <ellipse cx="32.5" cy="72" rx="10" ry="8.5" fill={f} stroke={s} strokeWidth="3.8" />
      <ellipse cx="67.5" cy="72" rx="10" ry="8.5" fill={f} stroke={s} strokeWidth="3.8" />
    </svg>
  );
}

function AdminModal({ onClose, onSubmit }) {
  const [u, setU] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  return (
    <div className="fixed inset-0 flex items-center justify-center p-6 z-50" style={{ background: "#000000CC" }}>
      <div className="rounded-xl p-5 w-full max-w-xs" style={{ background: "#1C1C1F", border: `1px solid ${C.line}` }}>
        <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, color: C.cream, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
          Modo administração
        </div>
        <p style={{ color: C.mut, fontSize: 12, marginBottom: 12 }}>
          Entre com seu usuário e senha de administração.
        </p>
        <input
          value={u} autoFocus autoCapitalize="none"
          onChange={(e) => { setU(e.target.value); setErr(""); }}
          placeholder="Usuário"
          className="w-full rounded-lg px-3 py-2 outline-none mb-2"
          style={{ background: "#26262A", border: `1px solid ${C.line}`, color: C.cream }}
        />
        <input
          type="password" value={pw}
          onChange={(e) => { setPw(e.target.value); setErr(""); }}
          onKeyDown={(e) => { if (e.key === "Enter") { const ok = onSubmit(u, pw); if (ok === false) setErr("Usuário ou senha incorretos."); } }}
          placeholder="Senha"
          className="w-full rounded-lg px-3 py-2 outline-none mb-2"
          style={{ background: "#26262A", border: `1px solid ${C.line}`, color: C.cream }}
        />
        {err && <div style={{ color: "#C96A76", fontSize: 12, marginBottom: 8 }}>{err}</div>}
        <div className="flex gap-2 mt-1">
          <button onClick={onClose} className="flex-1 rounded-lg py-2" style={{ border: `1px solid ${C.line}`, color: C.mut }}>
            Cancelar
          </button>
          <button
            onClick={() => { const ok = onSubmit(u, pw); if (ok === false) setErr("Usuário ou senha incorretos."); }}
            className="flex-1 rounded-lg py-2 font-bold"
            style={{ background: C.amber, color: C.cream }}
          >
            Entrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [data, setData] = useState(null);
  const [track, setTrack] = useState(null);
  const [trackLoaded, setTrackLoaded] = useState(false);
  const [view, setView] = useState(null);
  const [admin, setAdmin] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [pinModal, setPinModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [nameErr, setNameErr] = useState("");
  const [regOk, setRegOk] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [newPass, setNewPass] = useState("");
  const [unlocks, setUnlocks] = useState({});
  const [gatePass, setGatePass] = useState("");
  const [gateErr, setGateErr] = useState("");
  const [myIds, setMyIds] = useState({});
  const [loginMode, setLoginMode] = useState(false);
  const [loginName, setLoginName] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginErr, setLoginErr] = useState("");
  const [form, setForm] = useState({ date: todayStr(), slot: "18:30", instructor: "" });
  const [qform, setQform] = useState({ studentId: "", date: todayStr(), slot: "18:30", instructor: "" });
  const [qsaved, setQsaved] = useState(false);
  const [gform, setGform] = useState({ name: "", date: todayStr(), slot: "18:30", kind: "novo" });
  const [gErr, setGErr] = useState("");
  const [gSaved, setGSaved] = useState(false);
  const [detailMission, setDetailMission] = useState(null);
  const [showAllHist, setShowAllHist] = useState(false);
  const [showAllRank, setShowAllRank] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [mm, setMm] = useState({ name: "", start: todayStr(), end: todayStr(), desc: "", prize: "", qty: 1, mode: "manual", slots: [], answersText: "", optionsText: "", correct: "", tries: 3 });
  const [qzAns, setQzAns] = useState({});
  const [qzMsg, setQzMsg] = useState({});
  const [mmMsg, setMmMsg] = useState("");
  const [miniAward, setMiniAward] = useState({});
  const [showAllMini, setShowAllMini] = useState(false);
  const [allData, setAllData] = useState({});
  const [showPend, setShowPend] = useState(false);
  const [showEntry, setShowEntry] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [confirmRefuse, setConfirmRefuse] = useState(null);
  const [saved, setSaved] = useState(false);
  const [recErr, setRecErr] = useState("");
  const [qErr, setQErr] = useState("");

  useEffect(() => {
    (async () => {
      const flag = await loadAdminFlag();
      if (flag && flag.includes("|")) {
        const [fu, fp] = flag.split("|");
        if (ADMINS[fu] && ADMINS[fu] === fp) { setAdmin(true); setAdminUser(fu); }
      }
      const saved = await loadTrackPref();
      if (saved && TRACKS.some((t) => t.id === saved)) setTrack(saved);
      setTrackLoaded(true);
    })();
    loadUnlocks().then(setUnlocks);
    loadMyIds().then(setMyIds);
  }, []);

  useEffect(() => {
    if (!track) return;
    MISSIONS = TRACK_MISSIONS[track];
    let alive = true;
    (async () => {
      const d = await loadData(track);
      const before = JSON.stringify(d.winners || null);
      captureWinners(d);
      if (JSON.stringify(d.winners) !== before) {
        try { await saveData(track, d); } catch { /* segue com o estado local */ }
      }
      if (alive) setData(d);
    })();
    const t = setInterval(async () => {
      try {
        const fresh = await loadData(track);
        captureWinners(fresh);
        if (alive) setData(fresh);
      } catch { /* mantém o estado atual */ }
    }, 30000);
    return () => { alive = false; clearInterval(t); };
  }, [track]);

  useEffect(() => {
    if (!admin) return;
    let alive = true;
    const loadAll = async () => {
      const out = {};
      for (const t of TRACKS) {
        try { out[t.id] = await loadData(t.id); } catch { out[t.id] = null; }
      }
      if (alive) setAllData(out);
    };
    loadAll();
    const iv = setInterval(loadAll, 30000);
    return () => { alive = false; clearInterval(iv); };
  }, [admin]);

  const mutateTrack = (tid, fn) => {
    (async () => {
      let base = allData[tid] || { pin: null, students: [] };
      try {
        const res = await window.storage.get(keyFor(tid), true);
        if (res) base = JSON.parse(res.value);
      } catch { /* usa o estado atual */ }
      const next = JSON.parse(JSON.stringify(base));
      try { fn(next); } catch (e) { console.error(e); return; }
      const prevM = MISSIONS;
      MISSIONS = TRACK_MISSIONS[tid];
      captureWinners(next);
      MISSIONS = prevM;
      await saveData(tid, next);
      setAllData((a) => ({ ...a, [tid]: next }));
      if (tid === track) setData(next);
    })();
  };

  const mutate = (fn) => {
    (async () => {
      let base = data;
      try {
        const res = await window.storage.get(keyFor(track), true);
        if (res) base = JSON.parse(res.value);
      } catch { /* sem conexão: usa o estado atual */ }
      const next = JSON.parse(JSON.stringify(base));
      try { fn(next); } catch (e) { console.error(e); return; }
      captureWinners(next);
      await saveData(track, next);
      setData(next);
    })();
  };

  const pageBg = admin ? "#262629" : C.bg;
  const pageVars = admin
    ? { "--panel": "rgba(255,255,255,0.10)", "--panelSoft": "rgba(255,255,255,0.16)", "--line": "rgba(255,255,255,0.24)" }
    : { "--panel": "rgba(255,255,255,0.05)", "--panelSoft": "rgba(255,255,255,0.09)", "--line": "rgba(255,255,255,0.14)" };

  const helpBtn = (
    <a
      href={`https://wa.me/${AJUDA_WHATSAPP}?text=${encodeURIComponent("Olá! Preciso de ajuda com o app do Desafio das Missões 🚴")}`}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-full px-3 py-1"
      style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#25D366", border: "1px solid #25D366", background: "rgba(255,255,255,0.22)", textDecoration: "none" }}
    >
      💬 AJUDA
    </a>
  );

  const footerNote = (
    <footer className="mt-12 px-2 pb-4 text-center" style={{ color: C.mut, fontSize: 12, lineHeight: 1.6 }}>
      {track && !showManual && (
        <button
          onClick={() => { setShowManual(true); window.scrollTo({ top: 0 }); }}
          className="w-full mb-5 rounded-lg py-3 font-bold"
          style={{ background: C.panel, border: `1px solid ${C.amber}`, color: C.amberSoft, fontSize: 13, letterSpacing: "0.02em" }}
        >
          📒 Manual Prático das Missões
        </button>
      )}
      <img
        src="data:image/png;base64,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"
        alt="Spincycle"
        style={{ height: 26, display: "block", margin: "0 auto 14px", opacity: 0.95 }}
      />
      Este app foi idealizado e desenvolvido com carinho por mim, Raquel, para criar momentos entre vocês, alunos, e fortalecer a nossa comunidade.
      Se aparecer algum errinho ou instabilidade pelo caminho, calma e paciência — é só tocar no <span style={{ color: "#25D366", fontWeight: 700 }}>💬 AJUDA</span> que resolvemos juntos. Combinado? 🩵
    </footer>
  );

  const lockBtn = admin ? (
    <button
      onClick={() => { setAdmin(false); setAdminUser(null); clearAdminFlag(); }}
      className="rounded-full px-3 py-1"
      style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, background: C.amber, color: C.bg, border: `1px solid ${C.amber}` }}
    >
      {`● ADMIN · ${(adminUser || "").toUpperCase()}`}
    </button>
  ) : track && !view ? (
    <button
      onClick={() => { setShowEntry(true); setShowSignup(false); window.scrollTo({ top: 0 }); }}
      className="rounded-full px-3.5 py-1 font-bold"
      style={{ fontSize: 11.5, background: `linear-gradient(120deg, ${C.amber}, #16696F)`, color: C.cream, border: `1px solid ${C.amber}`, letterSpacing: "0.04em" }}
    >
      ENTRAR NAS MISSÕES
    </button>
  ) : track ? null : (
    <button
      onClick={() => setPinModal(true)}
      className="rounded-full px-3 py-1"
      style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, background: "transparent", color: C.mut, border: `1px solid ${C.line}` }}
    >
      🔒 administração
    </button>
  );

  const fonts = <style>{"@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');"}</style>;

  const modal = pinModal && (
    <AdminModal
      onClose={() => setPinModal(false)}
      onSubmit={(u, pw) => {
        const user = u.trim().toLowerCase();
        if (ADMINS[user] && ADMINS[user] === pw) {
          saveAdminFlag(`${user}|${pw}`);
          setAdmin(true); setAdminUser(user); setPinModal(false);
          return true;
        }
        return false;
      }}
    />
  );


  if (!trackLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ "--panel": "rgba(255,255,255,0.05)", "--panelSoft": "rgba(255,255,255,0.09)", "--line": "rgba(255,255,255,0.14)", background: C.bg, color: C.mut }}>
        Carregando…
      </div>
    );
  }

  // ---------- Central de pendências (administração) ----------
  if (showPend && admin) {
    const validarItem = (tid, sid, kind, itemId) => {
      mutateTrack(tid, (d) => {
        const s = d.students.find((x) => x.id === sid);
        if (!s) return;
        const arr = kind === "rec" ? s.records : s.guests;
        const it = (arr || []).find((x) => x.id === itemId);
        if (it) it.status = "ok";
      });
    };
    const liberar = (tid, sid) => {
      mutateTrack(tid, (d) => { const s = d.students.find((x) => x.id === sid); if (s) s.approved = true; });
    };
    const validarGrupo = (tid) => {
      mutateTrack(tid, (d) => {
        d.students.forEach((s) => {
          (s.records || []).forEach((r) => { if (r.status === "pending") r.status = "ok"; });
          (s.guests || []).forEach((g) => { if (g.status === "pending") g.status = "ok"; });
        });
      });
    };
    return (
      <div className="min-h-screen" style={{ ...pageVars, background: pageBg, fontFamily: "'Montserrat', sans-serif", transition: "background .4s" }}>
        {fonts}{modal}
        <main className="max-w-md mx-auto px-5 pb-16 pt-6">
          <div className="flex items-center justify-between">
            <button onClick={() => setShowPend(false)} style={{ color: C.oak, fontSize: 13 }}>← Voltar</button>
            {lockBtn}
          </div>
          <h2 className="mt-4 mb-1" style={{ fontWeight: 800, fontSize: 22, color: C.amber, textTransform: "uppercase", letterSpacing: "0.03em" }}>
            📋 Central de Pendências
          </h2>
          <div style={{ color: C.mut, fontSize: 12, marginBottom: 12 }}>
            Valide um a um ou o grupo inteiro de uma vez. Atualiza sozinha a cada 30s.
          </div>

          {TRACKS.map((t) => {
            const d = allData[t.id];
            const cadastros = d ? d.students.filter((s) => s.approved === false) : [];
            const itens = [];
            if (d) d.students.forEach((s) => {
              (s.records || []).forEach((r) => {
                if (r.status === "pending") itens.push({ tipo: "rec", s, it: r, ord: r.reg || 0 });
              });
              (s.guests || []).forEach((g) => {
                if (g.status === "pending") itens.push({ tipo: "guest", s, it: g, ord: g.reg || 0 });
              });
            });
            itens.sort((a, b) => a.ord - b.ord);
            const total = itens.length + cadastros.length;
            return (
              <section key={t.id} className="rounded-xl p-4 mt-4" style={{ background: C.panel, border: `1px solid ${total ? C.amber + "77" : C.line}` }}>
                <div className="flex items-center justify-between gap-2">
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.2em", color: C.oak, textTransform: "uppercase" }}>
                    {t.label}
                  </div>
                  <div style={{ color: total ? C.amberSoft : C.mut, fontWeight: 800, fontSize: 12 }}>
                    {total} pendência{total === 1 ? "" : "s"}
                  </div>
                </div>
                {!d && <div className="mt-2" style={{ color: C.mut, fontSize: 12 }}>carregando…</div>}
                {d && total === 0 && <div className="mt-2" style={{ color: C.ok, fontSize: 12 }}>✓ tudo em dia</div>}

                {cadastros.length > 0 && (
                  <div className="mt-3">
                    <div style={{ color: C.mut, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>⏳ Cadastros aguardando liberação</div>
                    <div className="flex flex-col gap-1">
                      {cadastros.map((s) => (
                        <div key={s.id} className="rounded-lg px-3 py-2 flex items-center gap-2" style={{ background: C.panelSoft, border: `1px dashed ${C.line}` }}>
                          <div className="flex-1 min-w-0 truncate" style={{ color: C.cream, fontWeight: 700, fontSize: 13 }}>{s.name}</div>
                          <button onClick={() => liberar(t.id, s.id)} className="rounded px-2.5 py-1 font-bold" style={{ background: C.ok, color: C.bg, fontSize: 12 }}>Liberar</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {itens.length > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                      <div style={{ color: C.mut, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em" }}>Aulas e amigos pendentes</div>
                      <button onClick={() => validarGrupo(t.id)} className="rounded px-2 py-1 font-bold" style={{ background: C.amber, color: C.cream, fontSize: 11 }}>
                        ✓ Validar todas ({itens.length})
                      </button>
                    </div>
                    <div className="flex flex-col gap-1">
                      {itens.map(({ tipo, s, it }) => (
                        <div key={it.id} className="rounded-lg px-3 py-2 flex items-center gap-2" style={{ background: C.panelSoft, border: `1px solid ${C.amber}55` }}>
                          <div className="flex-1 min-w-0">
                            <div className="truncate" style={{ color: C.cream, fontWeight: 700, fontSize: 13 }}>{s.name}</div>
                            <div style={{ color: C.mut, fontSize: 11.5, fontFamily: "'DM Mono', monospace" }}>
                              {tipo === "rec"
                                ? `aula · ${fmtBR(it.date)} · ${it.slot.replace(":", "h")} · ${it.instructor}`
                                : `amigo · ${it.name} · ${fmtBR(it.date)} · ${it.slot.replace(":", "h")}`}
                            </div>
                          </div>
                          <button onClick={() => validarItem(t.id, s.id, tipo, it.id)} className="rounded px-2.5 py-1 font-bold" style={{ background: C.ok, color: C.bg, fontSize: 12 }}>✓</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            );
          })}

          {footerNote}
          <div className="flex justify-center pb-8">{helpBtn}</div>
        </main>
      </div>
    );
  }

  // ---------- Escolha do desafio ----------
  if (!track) {
    return (
      <div className="min-h-screen" style={{ ...pageVars, background: pageBg, fontFamily: "'Montserrat', sans-serif", transition: "background .4s" }}>
        {fonts}{modal}
        <header className="pt-6 pb-2 px-5">
          <div className="flex items-center justify-between">{helpBtn}{lockBtn}</div>
          <div className="text-center">
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.35em", color: C.oak, textTransform: "uppercase" }}>
              Spincycle Prudente
            </div>
            <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 34, letterSpacing: "0.04em", color: C.cream, textTransform: "uppercase", lineHeight: 1.05, marginTop: 6 }}>
              Desafio das <span style={{ color: C.amber, textShadow: `0 0 24px ${C.amber}66` }}>Missões</span>
            </h1>
            <div className="mx-auto mt-4" style={{ width: 56, height: 3, background: `linear-gradient(90deg, ${C.amber}, ${C.amberSoft})`, borderRadius: 2 }} />
          </div>
        </header>
        <main className="max-w-md mx-auto px-5 pb-16">
          <p className="text-center mt-4 mb-4" style={{ color: C.mut, fontSize: 14 }}>
            Escolha o desafio do seu plano:
          </p>
          <div className="flex flex-col gap-3">
            {TRACKS.map((t) => (
              <button
                key={t.id}
                onClick={() => { setData(null); setView(null); setShowSignup(false); setTrack(t.id); saveTrackPref(t.id); }}
                className="rounded-xl px-5 py-4 text-left"
                style={{ background: C.panel, border: `1px solid ${C.line}` }}
              >
                <div style={{ color: C.amberSoft, fontWeight: 800, fontSize: 17, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                  {t.label}
                </div>
                <div style={{ color: C.mut, fontSize: 12, marginTop: 2 }}>{t.sub}</div>
                {t.note && (
                  <div style={{ color: C.oak, fontSize: 10.5, marginTop: 6, fontStyle: "italic" }}>{t.note}</div>
                )}
              </button>
            ))}
          </div>
          {admin && (
            <button
              onClick={() => { setShowPend(true); window.scrollTo({ top: 0 }); }}
              className="w-full rounded-lg px-3 py-2.5 mt-4 text-center font-bold"
              style={{ background: C.wineDeep, color: C.amberSoft, fontSize: 13, border: `1px solid ${C.amber}66` }}
            >
              📋 PENDÊNCIAS · {(() => {
                let n = 0;
                TRACKS.forEach((t) => {
                  const d = allData[t.id];
                  if (!d) return;
                  d.students.forEach((s) => {
                    n += (s.records || []).filter((r) => r.status === "pending").length;
                    n += (s.guests || []).filter((g) => g.status === "pending").length;
                    if (s.approved === false) n += 1;
                  });
                });
                return n;
              })()} → abrir central de validação
            </button>
          )}
          {footerNote}
        </main>
      </div>
    );
  }

  // ---------- Manual Prático das Missões ----------
  if (showManual) {
    const M = TRACK_MISSIONS[track];
    const TK = TRACKS.find((t) => t.id === track) || {};
    const TG = TK.targets || {};
    const EX = {
      ilimitado: {
        dobraDica: "4 dobradinhas em 47 dias = menos de 1 por semana. Programe as suas!",
        maratonaEx: "Treinando 5x por semana desde o início, você fecha os 30 dias na 6ª semana.",
        semanaEx: "Segunda a domingo da mesma semana, sem pular nenhum dia — os 4 horários do fim de semana ajudam a fechar.",
        fogoEx: "De 10 a 21 de agosto sem falhar um dia = 12 dias de fogo.",
      },
      pacote: {
        dobraDica: "2 dobradinhas custam só 4 aulas do seu pacote — escolha os dias com carinho.",
        maratonaEx: "3 a 4 aulas por semana desde o início fecham os 16 dias com folga.",
        semanaEx: "Seg, qua, sex + sáb e dom da mesma semana = 5 dias.",
        fogoEx: "Quarta a domingo sem falhar = 5 dias seguidos (o fim de semana é seu aliado).",
      },
      passe: {
        dobraDica: "Os apps permitem 1 check-in por dia — a 2ª aula da dobradinha pode ser 1 aula avulsa. É só uma vez no desafio inteiro!",
        maratonaEx: "3 a 4 check-ins por semana desde o início fecham os 15 dias tranquilamente.",
        semanaEx: "Seg, qua, sex + sábado da mesma semana = 4 dias.",
        fogoEx: "Quinta a domingo sem falhar = 4 dias seguidos.",
      },
    }[track] || {};
    const label = (t) => (
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.25em", color: C.oak, textTransform: "uppercase", margin: "20px 0 8px" }}>{t}</div>
    );
    const card = (children, key) => (
      <div key={key} className="rounded-xl p-4" style={{ background: C.panel, border: `1px solid ${C.line}`, color: C.cream, fontSize: 13, lineHeight: 1.65 }}>{children}</div>
    );
    const bullet = (children, k) => (
      <div key={k} className="flex gap-2" style={{ fontSize: 12.5, lineHeight: 1.6 }}>
        <span style={{ color: C.amberSoft }}>•</span><span style={{ color: C.cream }}>{children}</span>
      </div>
    );
    const MC = {
      dobra: {
        meta: TG.dobra === 1 ? "1 vez" : `${TG.dobra} dias diferentes`,
        como: TG.dobra === 1
          ? "Fazer 2 aulas seguidas (uma imediatamente após a outra) no mesmo dia."
          : `Fazer 2 aulas seguidas (uma imediatamente após a outra) no mesmo dia, em ${TG.dobra} dias diferentes.`,
        ex: ["Vale: 6h15+7h15 · 7h15+8h15 · 16h30+17h30 · 17h30+18h30 · 18h30+19h30.",
             "No fim de semana: 8h+9h · 9h+10h · 10h+11h.",
             "Não vale: 8h15 + 11h15 (têm intervalo entre elas)."],
        dica: EX.dobraDica,
      },
      madruga: {
        meta: `${TG.madruga} aulas`,
        como: `Fazer ${TG.madruga} aulas no horário das 6h15 (segunda a sexta), em qualquer ritmo — não precisam ser seguidas.`,
        ex: ["Exemplo: uma 6h15 por semana já fecha a missão dentro do desafio."],
        dica: "O despertador é o vilão, o shake é a recompensa.",
      },
      maratona: {
        meta: `${TG.maratona} dias de treino`,
        como: `Treinar em ${TG.maratona} dias diferentes ao longo do desafio. Fazer 2 ou 3 aulas no mesmo dia conta como 1 dia só.`,
        ex: [`Exemplo: ${EX.maratonaEx}`],
        dica: "É a missão da constância — o coração do desafio.",
      },
      semana: {
        meta: TG.semana === 7 ? "7 dias (seg a dom)" : `${TG.semana} dias na mesma semana`,
        como: TG.semana === 7
          ? "Treinar todos os dias de uma mesma semana, de segunda a domingo."
          : `Treinar em ${TG.semana} dias diferentes dentro de uma mesma semana (segunda a domingo).`,
        ex: [`Exemplo: ${EX.semanaEx}`],
      },
      zona: {
        meta: "3 professores",
        como: "Fazer aula com 3 professores diferentes: Ana B., Ana Paula, Gabriel Marcondes, Gabriel Vilela e Thiago.",
        ex: ["Exemplo: segunda com o Thiago, quarta com a Ana Paula, sábado com o Gabriel Vilela — pronto!"],
        dica: "Cada base tem sua energia. Prove todas.",
      },
      fds: {
        meta: `${TG.fds} fins de semana seguidos`,
        como: `Treinar (sábado ou domingo, pelo menos 1 aula) em ${TG.fds} fins de semana consecutivos. Se pular um fim de semana, a contagem recomeça.`,
        ex: [`Exemplo: sábado 8/ago → domingo 16/ago → sábado 22/ago${TG.fds >= 4 ? " → sábado 29/ago" : ""} = missão completa.`],
      },
      giro: {
        meta: `${TG.giro} horários diferentes`,
        como: `Fazer aula em ${TG.giro} horários diferentes da grade — vale misturar semana e fim de semana.`,
        ex: [`Exemplo: 6h15, 11h15, 17h30, 19h30${TG.giro >= 5 ? " e 9h (sábado)" : ""} = ${TG.giro} horários.`],
      },
      fogo: {
        meta: `${TG.fogo} dias seguidos`,
        como: `Treinar ${TG.fogo} dias corridos, sem falhar nenhum. Um dia sem aula zera a sequência.`,
        ex: [`Exemplo: ${EX.fogoEx}`],
        dica: "Sábado e domingo contam — use a grade do fim de semana para não quebrar a corrente.",
      },
      amigo: {
        meta: `${TG.amigo} convidados`,
        como: `Trazer ${TG.amigo} convidados para a aula experimental. Vale quem nunca pedalou na Spin ou está há mais de 6 meses sem aparecer. Até 2 podem ser alunos da Spin que você trouxer para dentro do desafio (marcados com o megafone 📣 no app).`,
        ex: ["Como marcar: entre em contato com a recepção para agendar a aula do convidado, informando os dados completos dele — nome completo, telefone e e-mail.",
             "Os horários disponíveis são todos os da grade normal, e a reserva de bike e vaga funciona da mesma forma que para um aluno regular.",
             "Registre o convidado no app (nome + aula que ele fez) — a recepção valida na chegada.",
             "Quando um convidado seu fechar pacote de 10+ aulas, a recepção pinta o ursinho 🧸 dele de azul — 4 ursinhos azuis + cartela cheia = ⭐ Giro de 175 BPM."],
        dica: "O desafio cresce no boca a boca — e quem chama, brilha.",
      },
    };
    const PR = [
      ["🥤 Shake do Mês (9 por desafio)", "1º a completar cada missão"],
      ["Horizontal completa", "camiseta Spincycle"],
      ["Vertical completa", "camiseta Spincycle"],
      ["Diagonal completa", "camiseta Spincycle"],
      ["4 Cantos", "bolsinha Spincycle"],
      ["4 Conversões (independe de missões)", "escolha de uma aula temática"],
      ["🏆 Cartela Cheia", "treinamento com os profs + 1 mês de aula ilimitada"],
      ["⭐ Giro de 175 BPM (Plus)", "aula fechada no sáb/dom para 33 convidados"],
    ];
    const RESUMO = [
      ["Dobradinha", MC.dobra.meta], ["Madrugador", `${TG.madruga} aulas 6h15`],
      ["Maratonista", `${TG.maratona} dias de treino`], ["Semana Perfeita", MC.semana.meta],
      ["Troca a Base", "3 professores"], ["Fim de Semana Raiz", `${TG.fds} fds seguidos`],
      ["Giro na Grade", `${TG.giro} horários`], ["Sequência de Fogo", `${TG.fogo} dias seguidos`],
      ["Chama a Galera", `${TG.amigo} convidados`],
    ];
    return (
      <div className="min-h-screen" style={{ ...pageVars, background: pageBg, fontFamily: "'Montserrat', sans-serif", transition: "background .4s" }}>
        {fonts}{modal}
        <main className="max-w-md mx-auto px-5 pb-16 pt-6">
          <div className="flex items-center justify-between">
            <button onClick={() => setShowManual(false)} style={{ color: C.oak, fontSize: 13 }}>← Voltar</button>
            {lockBtn}
          </div>
          <h2 className="mt-4" style={{ fontWeight: 800, fontSize: 20, color: C.amber, textTransform: "uppercase", letterSpacing: "0.03em", lineHeight: 1.3 }}>
            📒 Manual Prático das Missões | {TK.label}
          </h2>
          <div style={{ color: C.mut, fontSize: 12, marginBottom: 4, marginTop: 4 }}>
            Desafio válido de 5 de agosto a 20 de setembro de 2026
          </div>
          {track === "passe" && (
            <div className="rounded-xl p-4 mt-3" style={{ background: C.panel, border: `1.5px solid ${C.oak}`, boxShadow: `0 0 14px ${C.oak}33` }}>
              <div style={{ color: C.oak, fontWeight: 800, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
                ⭐ Dica de ouro
              </div>
              <div style={{ color: C.cream, fontSize: 12.5, lineHeight: 1.65 }}>
                Este desafio vale tanto para quem pedala <b>só pelo Gympass/TotalPass</b> quanto para quem <b>complementa com pacote</b>. E aqui vai a dica: aulas avulsas e pacotes também contam para as missões — comprar um pacotinho <b>acelera e turbina</b> a sua cartela. 😉
              </div>
            </div>
          )}

          {label("Como funciona o desafio")}
          {card(
            <div className="flex flex-col gap-2">
              <div style={{ fontSize: 12.5 }}>Cada aluno tem uma <b>cartela com 9 missões</b>. Complete missões para acender ursinhos, formar linhas e concorrer aos prêmios. Tudo acontece pelo app:</div>
              {bullet(<span><b>Cadastre-se</b> com nome e sobrenome e crie sua senha (só você acessa sua cartela).</span>, 1)}
              {bullet(<span>A recepção <b>libera seu cadastro</b> e você já pode registrar.</span>, 2)}
              {bullet(<span><b>Registre cada aula</b> no app (data, horário e professor). O registro fica <b>pendente</b> até a recepção validar.</span>, 3)}
              {bullet(<span>Esqueceu de registrar? Sem pânico: dá para registrar <b>dias anteriores</b> (a partir de 5/ago). Datas futuras não valem.</span>, 4)}
              {bullet(<span>Existem <b>3 desafios separados</b> — Ilimitados, Pacotes e Híbridos. Cada grupo compete apenas entre si, com metas ajustadas ao seu ritmo.</span>, 5)}
              {bullet(
                track === "ilimitado" ? (
                  <span><b>O que vale neste desafio:</b> as aulas do seu plano ilimitado (Spin Mensal, Spin Ilimitado ou Spin & Strong Ilimitado). O que conta é pedalar! 🚴</span>
                ) : track === "pacote" ? (
                  <span><b>O que vale neste desafio:</b> as aulas dos seus pacotes e as aulas avulsas. O que conta é pedalar! 🚴</span>
                ) : (
                  <span><b>O que vale neste desafio:</b> seus check-ins do Gympass/TotalPass — e também os pacotes e aulas avulsas que você usar para complementar. O que conta é pedalar! 🚴</span>
                ), 6)}
            </div>
          )}

          {label("Jogo limpo 🤝")}
          {card(
            <span><b>A aula só vale inteira:</b> não é permitido sair antes do fim da aula. Não haverá controle em todas as aulas — confiamos em você. Mas, havendo denúncia, o caso será conferido e a aula será invalidada. Denúncias devem ser feitas pelo botão <b>💬 AJUDA</b> (WhatsApp), no topo ou no final da página do desafio. A identidade de quem denuncia é preservada.</span>
          )}

          {label("As 9 missões — " + (TK.short || ""))}
          <div className="flex flex-col gap-2">
            {M.map((m) => {
              const c = MC[m.id];
              return (
                <div key={m.id} className="rounded-xl px-4 py-3" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
                  <div className="flex items-baseline justify-between gap-2">
                    <div style={{ color: C.amberSoft, fontWeight: 800, fontSize: 13, textTransform: "uppercase" }}>{m.name}</div>
                    <div className="shrink-0" style={{ color: C.oak, fontWeight: 700, fontSize: 11.5 }}>{c.meta}</div>
                  </div>
                  <div style={{ color: C.cream, fontSize: 12.5, lineHeight: 1.6, marginTop: 3 }}>{c.como}</div>
                  <div className="flex flex-col gap-1 mt-2">
                    {c.ex.map((e, i) => bullet(e, i))}
                  </div>
                  {c.dica && <div style={{ color: C.mut, fontSize: 11.5, fontStyle: "italic", marginTop: 6 }}>💡 {c.dica}</div>}
                </div>
              );
            })}
          </div>

          {label("Resumo das metas")}
          {card(
            <div className="flex flex-col gap-1.5">
              {RESUMO.map(([a, b]) => (
                <div key={a} className="flex justify-between gap-2" style={{ fontSize: 12.5 }}>
                  <span style={{ color: C.cream, fontWeight: 700 }}>{a}</span>
                  <span style={{ color: C.mut, textAlign: "right" }}>{b}</span>
                </div>
              ))}
            </div>
          )}

          {label("Prêmios (iguais nos 3 desafios)")}
          {card(
            <div className="flex flex-col gap-2">
              {PR.map(([a, b]) => (
                <div key={a} className="flex justify-between gap-3" style={{ fontSize: 12.5 }}>
                  <span style={{ color: C.cream, fontWeight: 700 }}>{a}</span>
                  <span style={{ color: C.mut, textAlign: "right" }}>{b}</span>
                </div>
              ))}
              <div style={{ borderTop: `1px solid ${C.line}`, marginTop: 4, paddingTop: 8 }}>
                <div style={{ color: C.cream, fontWeight: 700, fontSize: 12.5, marginBottom: 4 }}>Regras de ouro da premiação:</div>
                <div className="flex flex-col gap-1.5">
                  {bullet(<span>Prêmio vai para o <b>1º que completar</b> — o app registra a data e a hora do seu registro automaticamente, sem discussão.</span>, 1)}
                  {bullet(<span><b>Máximo de 2 shakes por aluno e 1 prêmio de linha</b> (horizontal, vertical ou diagonal) por aluno — o excedente passa ao próximo da fila.</span>, 2)}
                  {bullet(<span><b>Giro de 175 BPM:</b> cartela cheia + 4 convidados seus fechando pacote de 10+ aulas (os ursinhos pintados de azul 🧸).</span>, 3)}
                  {bullet(<span><b>4 Conversões:</b> o 1º aluno cujos 4 convidados fecharem pacote de 10+ aulas leva a aula temática — sem precisar de nenhuma missão cumprida. Valem apenas convidados registrados na sua lista do app.</span>, 4)}
                </div>
              </div>
            </div>
          )}

          {label("Missões relâmpago ⚡")}
          {card(
            <span>De tempos em tempos podem surgir <b>missões extras</b> — as Missões Relâmpago ⚡ — com prêmios que podem ser por <b>ordem de conquista</b>, para quem fizer <b>mais aulas no período</b>, por <b>check-in em horários especiais</b>, por <b>quiz</b> (digitado ou de múltipla escolha, com tentativas limitadas) ou até por <b>sorteio</b> entre quem treinar. Elas aparecem como um alerta <b>abaixo da sua cartela</b>, com a explicação, o prêmio e o prazo — algumas valem só um dia! Quando os prêmios acabam ou o prazo encerra, o alerta some, e cada vencedor ganha uma <b>medalha ⚡ especial</b> na cartela. Fique de olho no app e no grupo!</span>
          )}

          <div className="rounded-xl p-4 mt-3" style={{ background: C.panel, border: `1.5px solid ${C.oak}`, boxShadow: `0 0 14px ${C.oak}33` }}>
            <div style={{ color: C.oak, fontWeight: 800, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
              🔥 Entrou com o desafio já rolando?
            </div>
            <div style={{ color: C.cream, fontSize: 12.5, lineHeight: 1.65 }}>
              Relaxa: <b>você não ficou para trás.</b> As Missões Relâmpago surgem a todo momento — quiz, sorteios e provas do dia em que <b>todo mundo larga do zero</b>, não importa quando você entrou. E na cartela principal sempre tem prêmio esperando dono: quando alguém atinge o teto de shakes ou de linhas, <b>o prêmio passa para o próximo da fila</b> — que pode ser você. Cada aula registrada a partir de hoje já conta. Cadastre-se, registre a primeira e boa corrida! 🚴💨
            </div>
          </div>

          {label("Dicas finais")}
          {card(
            <div className="flex flex-col gap-1.5">
              {bullet(<span><b>Registre no dia</b> — a conquista é carimbada pela data e hora do registro. Quem registra rápido, garante o lugar na fila.</span>, 1)}
              {bullet(<span><b>Acompanhe as bolinhas</b> — o painel de progresso mostra exatamente quanto falta em cada missão.</span>, 2)}
              {bullet(<span><b>Dúvidas ou probleminhas no app?</b> Toque no botão 💬 AJUDA — a gente resolve junto.</span>, 3)}
              <div className="text-center" style={{ color: C.amberSoft, fontWeight: 800, fontSize: 15, marginTop: 8 }}>Bora girar? 🚴 Nos vemos na bike!</div>
            </div>
          )}

          {footerNote}
          <div className="flex justify-center pb-8">{helpBtn}</div>
        </main>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ "--panel": "rgba(255,255,255,0.05)", "--panelSoft": "rgba(255,255,255,0.09)", "--line": "rgba(255,255,255,0.14)", background: C.bg, color: C.mut }}>
        Carregando…
      </div>
    );
  }

  const student = view ? data.students.find((s) => s.id === view) : null;

  const addStudent = () => {
    const name = newName.trim().replace(/\s+/g, " ");
    if (!name) return;
    if (name.split(" ").filter((w) => w.length >= 2).length < 2) {
      setNameErr("Digite seu nome completo (nome e sobrenome).");
      return;
    }
    if (data.students.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      setNameErr("Esse nome já está no desafio. Se for você, toque nele na lista acima.");
      return;
    }
    const pw = newPass.trim();
    if (pw.length < 4) {
      setNameErr("Crie uma senha com pelo menos 4 caracteres.");
      return;
    }
    const nid = Date.now().toString(36);
    mutate((d) => d.students.push({ id: nid, name, pass: pw, friends: 0, guests: [], records: [], approved: admin }));
    const nu = { ...unlocks, [nid]: pw };
    setUnlocks(nu); saveUnlocks(nu);
    const nm = { ...myIds, [track]: nid };
    setMyIds(nm); saveMyIds(nm);
    setNewName(""); setNewPass("");
    setNameErr("");
    if (!admin) { setShowSignup(false); setRegOk(true); setTimeout(() => setRegOk(false), 6000); }
  };

  const validaData = (d) => {
    if (d < DESAFIO_INICIO) return `O desafio começa em 5/ago — só valem aulas a partir dessa data.`;
    if (d > todayStr()) return "Não dá para registrar aulas de datas futuras.";
    return "";
  };

  const addRecord = () => {
    if (!form.date || !form.instructor) return;
    const e = validaData(form.date);
    if (e) { setRecErr(e); return; }
    const dup = (student.records || []).some((r) => r.status !== "removed" && r.date === form.date && r.slot === form.slot);
    if (dup) {
      setRecErr(`Você já registrou a aula das ${form.slot.replace(":", "h")} nesse dia. Cada horário vale 1 registro por dia.`);
      return;
    }
    setRecErr("");
    mutate((d) => {
      const s = d.students.find((x) => x.id === view);
      if (!s) return;
      s.records.push({
        ...form,
        instructor: form.instructor.trim(),
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
        reg: Date.now(),
        status: admin ? "ok" : "pending",
      });
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const addQuickRecord = () => {
    if (!qform.studentId || !qform.date || !qform.instructor) return;
    const e = validaData(qform.date);
    if (e) { setQErr(e); return; }
    const alvoQ = data.students.find((x) => x.id === qform.studentId);
    const dupQ = alvoQ && (alvoQ.records || []).some((r) => r.date === qform.date && r.slot === qform.slot);
    if (dupQ) {
      setQErr(`Este aluno já tem a aula das ${qform.slot.replace(":", "h")} registrada nesse dia.`);
      return;
    }
    setQErr("");
    mutate((d) => {
      const s = d.students.find((x) => x.id === qform.studentId);
      if (!s) return;
      s.records.push({
        date: qform.date,
        slot: qform.slot,
        instructor: qform.instructor,
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
        reg: Date.now(),
        status: admin ? "ok" : "pending",
      });
    });
    setQsaved(true);
    setTimeout(() => setQsaved(false), 3000);
  };

  const addGuest = () => {
    const name = gform.name.trim().replace(/\s+/g, " ");
    if (!name || !gform.date) return;
    if (name.split(" ").filter((w) => w.length >= 2).length < 2) {
      setGErr("Digite o nome completo do amigo (nome e sobrenome).");
      return;
    }
    const eData = validaData(gform.date);
    if (eData) { setGErr(eData); return; }
    const jaConvidado = data.students.some((s) => (s.guests || []).some((g) => norm(g.name) === norm(name)));
    if (jaConvidado) {
      setGErr("⚠️ Aluno já convidado — entre em contato através do botão 💬 AJUDA que você encontra no rodapé desta página.");
      return;
    }
    mutate((d) => {
      const s = d.students.find((x) => x.id === view);
      if (!s) return;
      if (!s.guests) s.guests = [];
      s.guests.push({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
        name,
        date: gform.date,
        slot: gform.slot,
        kind: gform.kind || "novo",
        reg: Date.now(),
        status: admin ? "ok" : "pending",
      });
    });
    setGform({ name: "", date: todayStr(), slot: "18:30", kind: "novo" });
    setGErr("");
    setGSaved(true);
    setTimeout(() => setGSaved(false), 3000);
  };

  // ---------- Entrar nas Missões (menu de acesso) ----------
  if (showEntry && !admin) {
    const entrarDireto = () => {
      const sid = myIds[track];
      const s = sid ? data.students.find((x) => x.id === sid) : null;
      if (s && s.pass && unlocks[s.id] === s.pass) {
        setShowEntry(false);
        setView(s.id); setDetailMission(null); setShowAllHist(false); setConfirmRemove(false);
      } else {
        setLoginName(s ? s.name : ""); setLoginPass(""); setLoginErr("");
        setShowEntry(false); setLoginMode(true);
      }
    };
    return (
      <div className="min-h-screen" style={{ ...pageVars, background: pageBg, fontFamily: "'Montserrat', sans-serif", transition: "background .4s" }}>
        {fonts}{modal}
        <main className="max-w-md mx-auto px-5 pb-16 pt-6">
          <div className="flex items-center justify-between">
            <button onClick={() => { setShowEntry(false); setShowSignup(false); setNameErr(""); }} style={{ color: C.oak, fontSize: 13 }}>← Voltar</button>
            {helpBtn}
          </div>
          <h2 className="mt-4 mb-1" style={{ fontWeight: 800, fontSize: 22, color: C.amber, textTransform: "uppercase", letterSpacing: "0.03em" }}>
            🚴 Entrar nas Missões
          </h2>
          <div style={{ color: C.mut, fontSize: 12, marginBottom: 14 }}>
            {(TRACKS.find((t) => t.id === track) || {}).label}
          </div>

          {!showSignup ? (
            <div className="flex flex-col gap-2.5">
              <button
                onClick={entrarDireto}
                className="rounded-xl py-4 font-bold text-center"
                style={{ background: `linear-gradient(120deg, ${C.amber}, #16696F)`, color: C.cream, fontSize: 15, letterSpacing: "0.02em" }}
              >
                🚴 ENTRAR EM MINHAS MISSÕES
                <div style={{ fontSize: 11, fontWeight: 500, opacity: 0.85, marginTop: 2 }}>usuário e senha — para quem já é cadastrado</div>
              </button>
              <button
                onClick={() => { setShowSignup(true); setNameErr(""); }}
                className="rounded-xl py-4 font-bold text-center"
                style={{ background: C.panel, border: `1px solid ${C.amber}`, color: C.amberSoft, fontSize: 14, letterSpacing: "0.02em" }}
              >
                ✨ PRIMEIRA VEZ? CRIAR MEU CADASTRO
              </button>
              <button
                onClick={() => setPinModal(true)}
                className="rounded-xl py-2.5 text-center"
                style={{ background: "transparent", border: `1px dashed ${C.line}`, color: C.mut, fontSize: 12, fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em" }}
              >
                🔒 ADMINISTRAÇÃO
              </button>
              {regOk && (
                <div className="mt-1 text-center" style={{ color: C.amberSoft, fontSize: 12 }}>✓ Cadastro enviado! Aguardando liberação da recepção.</div>
              )}
            </div>
          ) : (
            <div className="rounded-xl p-4" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.25em", color: C.oak, textTransform: "uppercase" }}>
                  Criar meu cadastro
                </div>
                <button onClick={() => { setShowSignup(false); setNameErr(""); }} style={{ color: C.mut, fontSize: 12 }}>← voltar</button>
              </div>
              <div className="flex flex-col gap-2">
                <input
                  value={newName}
                  onChange={(e) => { setNewName(e.target.value); setNameErr(""); }}
                  placeholder="Nome e sobrenome"
                  className="rounded-lg px-4 py-3 outline-none"
                  style={{ background: C.panelSoft, border: `1px solid ${nameErr ? "#B15560" : C.line}`, color: C.cream }}
                />
                <input
                  type="password"
                  value={newPass}
                  onChange={(e) => { setNewPass(e.target.value); setNameErr(""); }}
                  onKeyDown={(e) => e.key === "Enter" && addStudent()}
                  placeholder="Crie uma senha (mín. 4 caracteres)"
                  className="rounded-lg px-4 py-3 outline-none"
                  style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.cream }}
                />
                <button onClick={addStudent} className="rounded-lg py-3 font-bold" style={{ background: C.amber, color: C.cream }}>
                  Entrar no desafio
                </button>
              </div>
              {nameErr && <div className="mt-2" style={{ color: "#C96A76", fontSize: 12 }}>{nameErr}</div>}
              {regOk && (
                <div className="mt-2 text-center" style={{ color: C.amberSoft, fontSize: 12 }}>✓ Cadastro enviado! Aguardando liberação da recepção.</div>
              )}
            </div>
          )}

          {footerNote}
          <div className="flex justify-center pb-8">{helpBtn}</div>
        </main>
      </div>
    );
  }

  // ---------- Já estou no desafio (login) ----------
  if (!student && loginMode) {
    const tryLogin = () => {
      const alvo = norm(loginName);
      if (!alvo) { setLoginErr("Digite seu nome completo."); return; }
      const s = data.students.find((x) => norm(x.name) === alvo);
      if (!s) { setLoginErr("Nome não encontrado. Digite igual ao cadastro (nome e sobrenome)."); return; }
      if (s.approved === false) { setLoginErr("Seu cadastro ainda aguarda liberação da recepção."); return; }
      if (!s.pass) {
        setLoginMode(false); setLoginPass(""); setLoginErr("");
        setView(s.id); setDetailMission(null); setShowAllHist(false); setConfirmRemove(false);
        return;
      }
      if (loginPass === s.pass) {
        const nu = { ...unlocks, [s.id]: s.pass };
        setUnlocks(nu); saveUnlocks(nu);
        const nm = { ...myIds, [track]: s.id };
        setMyIds(nm); saveMyIds(nm);
        setLoginMode(false); setLoginPass(""); setLoginErr("");
        setView(s.id); setDetailMission(null); setShowAllHist(false); setConfirmRemove(false);
      } else {
        setLoginErr("Senha incorreta. Esqueceu? Fale com a recepção para redefinir.");
      }
    };
    return (
      <div className="min-h-screen" style={{ ...pageVars, background: pageBg, fontFamily: "'Montserrat', sans-serif", transition: "background .4s" }}>
        {fonts}{modal}
        <main className="max-w-md mx-auto px-5 pb-16 pt-6">
          <div className="flex items-center justify-between">
            <button onClick={() => { setLoginMode(false); setLoginPass(""); setLoginErr(""); }} style={{ color: C.oak, fontSize: 13 }}>← Voltar</button>
            {lockBtn}
          </div>
          <h2 className="mt-4 mb-3" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 24, color: C.amberSoft, textTransform: "uppercase", letterSpacing: "0.03em" }}>
            Minhas missões
          </h2>
          <section className="rounded-xl p-4" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
            <p style={{ color: C.mut, fontSize: 13, marginBottom: 12 }}>
              Escolha seu nome e digite sua senha para abrir sua cartela.
            </p>
            <input
              value={loginName}
              autoFocus
              onChange={(e) => { setLoginName(e.target.value); setLoginErr(""); }}
              onKeyDown={(e) => e.key === "Enter" && tryLogin()}
              placeholder="Seu nome e sobrenome"
              className="w-full rounded-lg px-4 py-3 outline-none mb-2"
              style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.cream }}
            />
            <input
              type="password"
              value={loginPass}
              onChange={(e) => { setLoginPass(e.target.value); setLoginErr(""); }}
              onKeyDown={(e) => e.key === "Enter" && tryLogin()}
              placeholder="Sua senha"
              className="w-full rounded-lg px-4 py-3 outline-none mb-2"
              style={{ background: C.panelSoft, border: `1px solid ${loginErr ? "#B15560" : C.line}`, color: C.cream }}
            />
            {loginErr && <div className="mb-2" style={{ color: "#C96A76", fontSize: 12 }}>{loginErr}</div>}
            <button onClick={tryLogin} className="w-full rounded-lg py-3 font-bold" style={{ background: `linear-gradient(120deg, ${C.amber}, #16696F)`, color: C.cream }}>
              Entrar
            </button>
          </section>
          {footerNote}
          <div className="flex justify-center pb-8">{helpBtn}</div>
        </main>
      </div>
    );
  }

  // ---------- Lista de alunos ----------
  if (!student) {
    const ranked = data.students
      .filter((s) => s.approved !== false)
      .map((s) => ({ s, r: computeProgress(s) }))
      .sort((a, b) => b.r.doneCount - a.r.doneCount || b.r.p.maratona - a.r.p.maratona);
    const totalPending = ranked.reduce((n, x) => n + x.r.pending, 0);

    return (
      <div className="min-h-screen" style={{ ...pageVars, background: pageBg, fontFamily: "'Montserrat', sans-serif", transition: "background .4s" }}>
        {fonts}{modal}
        <header className="pt-6 pb-5 px-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => { setTrack(null); setView(null); setData(null); setShowSignup(false); }} style={{ color: C.oak, fontSize: 13 }}>← voltar</button>
              {helpBtn}
            </div>
            {lockBtn}
          </div>
          <div className="text-center">
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.35em", color: C.oak, textTransform: "uppercase" }}>
              Spincycle Prudente
            </div>
            <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 34, letterSpacing: "0.04em", color: C.cream, textTransform: "uppercase", lineHeight: 1.05, marginTop: 6 }}>
              Desafio das <span style={{ color: C.amber, textShadow: `0 0 24px ${C.amber}66` }}>Missões</span>
            </h1>
            <div className="mx-auto mt-4" style={{ width: 56, height: 3, background: `linear-gradient(90deg, ${C.amber}, ${C.amberSoft})`, borderRadius: 2 }} />
            <button
              onClick={() => { setTrack(null); setView(null); setData(null); setShowSignup(false); }}
              className="mt-3 rounded-full px-3 py-1"
              style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.15em", color: C.amberSoft, border: `1px solid ${C.line}`, background: C.panel }}
            >
              {(TRACKS.find((t) => t.id === track) || {}).short} · TROCAR
            </button>
          </div>
        </header>

        <main className="max-w-md mx-auto px-5 pb-16">
          <p className="text-center mb-3" style={{ color: C.mut, fontSize: 13 }}>
            Toque em ENTRAR NAS MISSÕES, no topo, para registrar suas aulas — e acompanhe o ranking do desafio abaixo.
          </p>

          <div className="flex flex-col gap-2">
            {(showAllRank ? ranked : ranked.slice(0, 5)).map(({ s, r }, i) => (
              <button
                key={s.id}
                onClick={() => { if (!admin) return; setView(s.id); setDetailMission(null); setShowAllHist(false); setConfirmRemove(false); }}
                className="rounded-xl px-4 py-3 flex items-center gap-3 text-left"
                style={{ background: C.panel, border: `1px solid ${r.full ? C.amber : C.line}`, cursor: admin ? "pointer" : "default" }}
              >
                {(() => {
                  const medal = r.doneCount > 0 && i < 3 ? [
                    { bg: "linear-gradient(135deg, #E8C169, #B08D3E)", bd: "#F2D98C", glow: "#D9A95466" },
                    { bg: "linear-gradient(135deg, #D7DBE0, #9FA6AD)", bd: "#E8ECF0", glow: "#C0C4C955" },
                    { bg: "linear-gradient(135deg, #C98F5A, #8E5F33)", bd: "#DFA877", glow: "#B07A4A55" },
                  ][i] : null;
                  return (
                    <div className="flex items-center justify-center rounded-full shrink-0" style={{
                      width: 34, height: 34,
                      background: medal ? medal.bg : C.panelSoft,
                      color: medal ? "#141414" : C.mut,
                      border: medal ? `2px solid ${medal.bd}` : `1px solid ${C.line}`,
                      boxShadow: medal ? `0 0 10px ${medal.glow}` : "none",
                      fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 500,
                    }}>
                      {i + 1}
                    </div>
                  );
                })()}
                <div className="flex-1 min-w-0">
                  <div style={{ color: C.amberSoft, fontWeight: 700 }}>{s.name}</div>
                  <div style={{ color: C.mut, fontSize: 12 }}>
                    {r.p.maratona} dia{r.p.maratona !== 1 ? "s" : ""} de treino · {r.full ? "CARTELA CHEIA 🏆" : `${r.doneCount}/9 missões`}
                    {r.pending > 0 && <span style={{ color: C.amberSoft }}> · {r.pending} pendente{r.pending > 1 ? "s" : ""}</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: 9 }).map((_, j) => (
                    <div key={j} className="rounded-full" style={{
                      width: 7, height: 7,
                      background: j < r.doneCount ? C.amber : C.line,
                      boxShadow: j < r.doneCount ? `0 0 6px ${C.amber}` : "none",
                    }} />
                  ))}
                </div>
              </button>
            ))}
          </div>

          {ranked.length === 0 && (
            <p className="text-center py-6" style={{ color: C.mut, fontSize: 13 }}>
              {admin ? "Nenhum aluno cadastrado ainda." : "Nenhum aluno cadastrado ainda — seja a primeira pessoa a entrar no desafio! 🚴"}
            </p>
          )}

          {ranked.length > 5 && (
            <button
              onClick={() => setShowAllRank(!showAllRank)}
              className="mt-2 w-full rounded-lg py-2"
              style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.amberSoft, fontSize: 12, fontWeight: 700 }}
            >
              {showAllRank ? "Ver menos" : `Ver mais (${ranked.length - 5} participantes)`}
            </button>
          )}

          {(() => {
            const pend = data.students.filter((s) => s.approved === false);
            if (!pend.length) return null;
            return (
              <div className="mt-4">
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.25em", color: C.oak, textTransform: "uppercase", marginBottom: 8 }}>
                  ⏳ Aguardando liberação
                </div>
                <div className="flex flex-col gap-1">
                  {pend.map((s) => (
                    <div key={s.id} className="rounded-lg px-4 py-2.5 flex items-center gap-2" style={{ background: C.panel, border: `1px dashed ${C.line}` }}>
                      <div className="flex-1 min-w-0 truncate" style={{ color: C.mut, fontWeight: 700, fontSize: 14 }}>{s.name}</div>
                      {admin ? (
                        <>
                          <button
                            onClick={() => mutate((d) => { const x = d.students.find((y) => y.id === s.id); if (x) x.approved = true; })}
                            className="rounded px-2.5 py-1 font-bold" style={{ background: C.ok, color: C.bg, fontSize: 12 }}
                          >Liberar</button>
                          {confirmRefuse === s.id ? (
                            <>
                              <button
                                onClick={() => { mutate((d) => { d.students = d.students.filter((y) => y.id !== s.id); }); setConfirmRefuse(null); }}
                                className="rounded px-2 py-1 font-bold"
                                style={{ background: "#B15560", color: C.cream, fontSize: 11 }}
                              >Confirmar exclusão</button>
                              <button onClick={() => setConfirmRefuse(null)} style={{ color: C.mut, fontSize: 12 }}>voltar</button>
                            </>
                          ) : (
                            <button onClick={() => setConfirmRefuse(s.id)} style={{ color: C.mut, fontSize: 12 }}>✕</button>
                          )}
                        </>
                      ) : (
                        <span className="rounded px-1.5 py-0.5" style={{ fontSize: 10, background: C.wineDeep, color: C.amberSoft }}>pendente</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {admin && (
            <section className="rounded-xl p-4 mt-6" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.25em", color: C.oak, textTransform: "uppercase", marginBottom: 10 }}>
                ⚡ Missões relâmpago (administração)
              </div>
              <div className="flex flex-col gap-2">
                <input value={mm.name} onChange={(e) => setMm({ ...mm, name: e.target.value })} placeholder="Nome da missão (ex.: Story na Bike)"
                  className="rounded-lg px-3 py-2 outline-none" style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.cream }} />
                <div className="flex items-center gap-2">
                  <span className="shrink-0" style={{ color: C.mut, fontSize: 12, width: 96 }}>Data de início</span>
                  <input type="date" value={mm.start} min={todayStr()} max="2026-09-20"
                    onChange={(e) => setMm({ ...mm, start: e.target.value, end: mm.end < e.target.value ? e.target.value : mm.end })}
                    className="flex-1 rounded-lg px-3 py-2 outline-none" style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.cream, colorScheme: "dark" }} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="shrink-0" style={{ color: C.mut, fontSize: 12, width: 96 }}>Data de fim</span>
                  <input type="date" value={mm.end} min={mm.start} max="2026-09-20"
                    onChange={(e) => setMm({ ...mm, end: e.target.value })}
                    className="flex-1 rounded-lg px-3 py-2 outline-none" style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.cream, colorScheme: "dark" }} />
                </div>
                <input value={mm.desc} onChange={(e) => setMm({ ...mm, desc: e.target.value })} placeholder="Explicação breve (o que o aluno precisa fazer)"
                  className="rounded-lg px-3 py-2 outline-none" style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.cream }} />
                <select value={mm.mode} onChange={(e) => setMm({ ...mm, mode: e.target.value })}
                  className="rounded-lg px-3 py-2 outline-none" style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.cream }}>
                  <option value="manual">🖐 Premiação manual (eu escolho os vencedores)</option>
                  <option value="top">📈 Automática: quem fizer MAIS check-ins no período</option>
                  <option value="slot">⏰ Automática: check-in em horário(s) que eu definir</option>
                  <option value="sorteio">🎲 Sorteio entre quem treinar no período</option>
                  <option value="quizText">✍️ Quiz — a pessoa digita a resposta</option>
                  <option value="quizChoice">❓ Quiz — lista suspensa de opções</option>
                </select>
                {mm.mode === "slot" && (
                  <div className="flex flex-wrap gap-1.5">
                    {[...WEEKDAY_SLOTS, ...WEEKEND_SLOTS].map((sl) => {
                      const on = mm.slots.includes(sl);
                      return (
                        <button key={sl}
                          onClick={() => setMm({ ...mm, slots: on ? mm.slots.filter((x) => x !== sl) : [...mm.slots, sl] })}
                          className="rounded-full px-2.5 py-1"
                          style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", background: on ? C.amber : C.panelSoft, color: on ? C.cream : C.mut, border: `1px solid ${on ? C.amber : C.line}` }}>
                          {sl.replace(":", "h")}
                        </button>
                      );
                    })}
                  </div>
                )}
                {(mm.mode === "quizText" || mm.mode === "quizChoice") && (
                  <>
                    {mm.mode === "quizText" && (
                      <input value={mm.answersText} onChange={(e) => setMm({ ...mm, answersText: e.target.value })}
                        placeholder="Respostas aceitas, separadas por vírgula (ex.: Vamos time, Vamo time, Vamosss timeee)"
                        className="rounded-lg px-3 py-2 outline-none" style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.cream }} />
                    )}
                    {mm.mode === "quizChoice" && (
                      <>
                        <input value={mm.optionsText} onChange={(e) => setMm({ ...mm, optionsText: e.target.value, correct: "" })}
                          placeholder="Opções separadas por vírgula (ex.: Trança, Tiara, Cabelo rosa)"
                          className="rounded-lg px-3 py-2 outline-none" style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.cream }} />
                        <select value={mm.correct} onChange={(e) => setMm({ ...mm, correct: e.target.value })}
                          className="rounded-lg px-3 py-2 outline-none" style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: mm.correct ? C.cream : C.mut }}>
                          <option value="" disabled>Qual é a resposta correta?</option>
                          {mm.optionsText.split(",").map((o) => o.trim()).filter(Boolean).map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </>
                    )}
                    <div className="flex items-center gap-2">
                      <span style={{ color: C.mut, fontSize: 12 }}>Tentativas por aluno:</span>
                      <input type="number" min="1" max="20" value={mm.tries}
                        onChange={(e) => setMm({ ...mm, tries: Math.max(1, parseInt(e.target.value || "1", 10)) })}
                        className="rounded-lg px-3 py-1.5 outline-none" style={{ width: 70, background: C.panelSoft, border: `1px solid ${C.line}`, color: C.cream }} />
                    </div>
                  </>
                )}
                <div className="flex gap-2">
                  <input value={mm.prize} onChange={(e) => setMm({ ...mm, prize: e.target.value })} placeholder="Prêmio (ex.: CAMISETA)"
                    className="flex-1 rounded-lg px-3 py-2 outline-none" style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.cream }} />
                  <input type="number" min="1" max="99" value={mm.qty}
                    onChange={(e) => setMm({ ...mm, qty: Math.max(1, parseInt(e.target.value || "1", 10)) })}
                    className="rounded-lg px-3 py-2 outline-none" style={{ width: 76, background: C.panelSoft, border: `1px solid ${C.line}`, color: C.cream }} />
                </div>
                <button
                  onClick={() => {
                    if (!mm.name.trim() || !mm.desc.trim() || !mm.prize.trim()) { setMmMsg("Preencha nome, explicação e prêmio."); return; }
                    if (mm.mode === "slot" && !mm.slots.length) { setMmMsg("Escolha ao menos 1 horário para essa missão."); return; }
                    if (mm.end < mm.start) { setMmMsg("A data de fim não pode ser antes da data de início."); return; }
                    const answers = mm.answersText.split(",").map((a) => a.trim()).filter(Boolean);
                    const options = mm.optionsText.split(",").map((o) => o.trim()).filter(Boolean);
                    if (mm.mode === "quizText" && !answers.length) { setMmMsg("Informe ao menos 1 resposta aceita."); return; }
                    if (mm.mode === "quizChoice" && (options.length < 2 || !mm.correct)) { setMmMsg("Informe 2+ opções e marque a correta."); return; }
                    const nova = {
                      id: Date.now().toString(36),
                      name: mm.name.trim(), desc: mm.desc.trim(), prize: mm.prize.trim(),
                      qty: mm.qty, start: mm.start, end: mm.end,
                      mode: mm.mode, slots: mm.slots, winners: [],
                      answers, options, correct: mm.correct, tries: mm.tries, attempts: {},
                    };
                    mutate((d) => { if (!d.miniMissions) d.miniMissions = []; d.miniMissions.push(nova); });
                    setMm({ name: "", start: todayStr(), end: todayStr(), desc: "", prize: "", qty: 1, mode: "manual", slots: [], answersText: "", optionsText: "", correct: "", tries: 3 });
                    setMmMsg("⚡ Missão criada! Já está visível na cartela dos alunos.");
                    setTimeout(() => setMmMsg(""), 3500);
                  }}
                  className="rounded-lg py-2.5 font-bold" style={{ background: `linear-gradient(120deg, ${C.amber}, #16696F)`, color: C.cream }}>
                  Criar missão
                </button>
                {mmMsg && <div className="text-center" style={{ color: C.amberSoft, fontSize: 12 }}>{mmMsg}</div>}
              </div>

              {(data.miniMissions || []).slice().reverse().map((x) => {
                const ativa = x.end >= todayStr() && (x.winners || []).length < x.qty;
                const candidatos = data.students.filter((s) => s.approved !== false && !(x.winners || []).some((w) => w.id === s.id))
                  .sort((a, b) => a.name.localeCompare(b.name));
                return (
                  <div key={x.id} className="rounded-lg p-3 mt-3" style={{ background: C.panelSoft, border: `1px solid ${ativa ? C.amber + "88" : C.line}` }}>
                    <div className="flex items-center justify-between gap-2">
                      <div style={{ color: C.cream, fontWeight: 800, fontSize: 13 }}>⚡ {x.name}</div>
                      <div style={{ color: ativa ? C.amberSoft : C.mut, fontSize: 11 }}>
                        {ativa
                          ? (x.start && x.start > todayStr() ? `⏳ começa ${fmtBR(x.start)}`
                            : x.end === todayStr() ? "só hoje!"
                            : `até ${fmtBR(x.end)}`)
                          : "encerrada"}
                      </div>
                    </div>
                    <div style={{ color: C.mut, fontSize: 12, marginTop: 2 }}>{x.desc} · 🏆 {x.prize} ({(x.winners || []).length}/{x.qty})</div>
                    {x.mode === "quizText" && (
                      <div style={{ color: C.oak, fontSize: 11, marginTop: 2 }}>
                        ✍️ aceita: {(x.answers || []).join(" | ")} · {x.tries || 3} tentativa{(x.tries || 3) === 1 ? "" : "s"} · {Object.keys(x.attempts || {}).length} responderam
                      </div>
                    )}
                    {x.mode === "quizChoice" && (
                      <div style={{ color: C.oak, fontSize: 11, marginTop: 2 }}>
                        ❓ opções: {(x.options || []).map((o) => (o === x.correct ? `✔${o}` : o)).join(" | ")} · {x.tries || 3} tentativa{(x.tries || 3) === 1 ? "" : "s"} · {Object.keys(x.attempts || {}).length} responderam
                      </div>
                    )}
                    {(x.winners || []).length > 0 && (
                      <div style={{ color: C.amberSoft, fontSize: 11.5, marginTop: 4 }}>
                        {(x.winners || []).map((w, i) => `${i + 1}º ${w.name}`).join(" · ")}
                      </div>
                    )}
                    {ativa && (x.mode === "top" || x.mode === "slot" || x.mode === "sorteio") && (() => {
                      const faltam = x.qty - (x.winners || []).length;
                      const parcial = x.mode === "top" ? miniTop(data, x).slice(0, x.qty)
                        : x.mode === "slot" ? miniSlotFirsts(data, x).slice(0, x.qty)
                        : miniElegiveis(data, x);
                      const apurar = () => {
                        mutate((d) => {
                          const xx = (d.miniMissions || []).find((y) => y.id === x.id);
                          if (!xx) return;
                          if (!xx.winners) xx.winners = [];
                          const ja = new Set(xx.winners.map((w) => w.id));
                          let lista = [];
                          if (xx.mode === "top") lista = miniTop(d, xx);
                          else if (xx.mode === "slot") lista = miniSlotFirsts(d, xx);
                          else {
                            const el = miniElegiveis(d, xx).filter((s) => !ja.has(s.id));
                            for (let i = el.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [el[i], el[j]] = [el[j], el[i]]; }
                            lista = el;
                          }
                          lista.filter((w) => !ja.has(w.id)).slice(0, xx.qty - xx.winners.length)
                            .forEach((w) => xx.winners.push({ id: w.id, name: w.name, ts: Date.now() }));
                        });
                      };
                      return (
                        <div className="mt-2">
                          {x.mode !== "sorteio" && parcial.length > 0 && (
                            <div style={{ color: C.mut, fontSize: 11.5, marginBottom: 4 }}>
                              parcial: {parcial.map((w, i) => `${i + 1}º ${w.name}${x.mode === "top" ? ` (${w.count})` : ""}`).join(" · ")}
                            </div>
                          )}
                          {x.mode === "sorteio" && (
                            <div style={{ color: C.mut, fontSize: 11.5, marginBottom: 4 }}>
                              {parcial.length} participante{parcial.length === 1 ? "" : "s"} elegível{parcial.length === 1 ? "" : "eis"} (com aula no período)
                            </div>
                          )}
                          <button onClick={apurar} className="w-full rounded-lg py-2 font-bold" style={{ background: C.amber, color: C.cream, fontSize: 12 }}>
                            {x.mode === "sorteio" ? `🎲 Sortear ${faltam} vencedor${faltam === 1 ? "" : "es"} agora` : `🏁 Apurar vencedores automaticamente`}
                          </button>
                        </div>
                      );
                    })()}
                    {ativa && x.mode !== "top" && x.mode !== "slot" && x.mode !== "sorteio" && (
                      <div className="flex gap-2 mt-2">
                        <select value={miniAward[x.id] || ""} onChange={(e) => setMiniAward({ ...miniAward, [x.id]: e.target.value })}
                          className="flex-1 rounded-lg px-2 py-1.5 outline-none" style={{ background: C.panel, border: `1px solid ${C.line}`, color: C.cream, fontSize: 12 }}>
                          <option value="" disabled>Premiar aluno…</option>
                          {candidatos.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <button
                          onClick={() => {
                            const sid = miniAward[x.id];
                            if (!sid) return;
                            mutate((d) => {
                              const xx = (d.miniMissions || []).find((y) => y.id === x.id);
                              const s = d.students.find((y) => y.id === sid);
                              if (!xx || !s) return;
                              if (!xx.winners) xx.winners = [];
                              if (xx.winners.length >= xx.qty || xx.winners.some((w) => w.id === sid)) return;
                              xx.winners.push({ id: s.id, name: s.name, ts: Date.now() });
                            });
                            setMiniAward({ ...miniAward, [x.id]: "" });
                          }}
                          className="rounded-lg px-3 font-bold" style={{ background: C.amber, color: C.cream, fontSize: 12 }}>
                          Premiar
                        </button>
                      </div>
                    )}
                    {ativa && (
                      <button
                        onClick={() => mutate((d) => { const xx = (d.miniMissions || []).find((y) => y.id === x.id); if (xx) xx.end = "2000-01-01"; })}
                        className="mt-2 rounded-lg px-2 py-1" title="Encerrar missão" style={{ border: `1px solid ${C.line}`, color: C.mut, fontSize: 11 }}>
                        ✕ Encerrar missão sem premiar o restante
                      </button>
                    )}
                  </div>
                );
              })}
            </section>
          )}

          {(() => {
            const AW = computeAwards(data);
            const winners = MISSIONS.map((m) => ({ m, best: AW.shakes[m.id] || null }));
            return (
              <section className="rounded-xl p-4 mt-6" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.25em", color: C.oak, textTransform: "uppercase", marginBottom: 10 }}>
                  🥤 Shake do Mês · 1º de cada missão
                </div>
                <div className="flex flex-col gap-1.5">
                  {winners.map(({ m, best }) => (
                    <div key={m.id} className="flex items-center gap-2">
                      <div className="shrink-0" style={{ width: 128, fontSize: 11, fontWeight: 700, color: best ? C.cream : C.mut, textTransform: "uppercase", lineHeight: 1.2 }}>
                        {m.name}
                      </div>
                      <div className="flex-1 min-w-0 truncate" style={{ fontSize: 12, color: best ? C.amber : C.mut, fontWeight: best ? 700 : 400 }}>
                        {best ? best.name : "em aberto"}
                      </div>
                      {best && (
                        <div className="shrink-0" style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.mut }}>
                          {best.reg ? fmtTs(best.reg) : best.ts ? fmtTs(best.ts) : fmtBR(best.date)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );
          })()}

          {(() => {
            const AW2 = computeAwards(data);
            const PRIZES = [
              { label: "Horizontal", prize: "camiseta Spincycle", best: AW2.pats.horiz || null },
              { label: "Vertical", prize: "camiseta Spincycle", best: AW2.pats.vert || null },
              { label: "Diagonal", prize: "camiseta Spincycle", best: AW2.pats.diag || null },
              { label: "4 Cantos", prize: "bolsinha Spincycle", best: AW2.pats.corners || null },
              { label: "4 Conversões", prize: "escolha da aula temática (independe de missões)", best: AW2.pats.conv || null },
              { label: "Cartela Cheia", prize: "treinamento + 1 mês de aula ilimitado", best: AW2.pats.full || null },
              { label: "Giro de 175 BPM", prize: "Desafio Plus: aula fechada (sáb ou dom) para 33 convidados", best: AW2.pats.bpm || null },
            ];
            return (
              <section className="rounded-xl p-4 mt-3" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.25em", color: C.oak, textTransform: "uppercase", marginBottom: 4 }}>
                  🏆 Prêmios da Cartela
                </div>
                <div style={{ color: C.mut, fontSize: 10.5, marginBottom: 10 }}>
                  Máx. 2 shakes e 1 prêmio de linha (horizontal/vertical/diagonal) por aluno — o excedente passa ao próximo da fila.
                </div>
                <div className="flex flex-col gap-2">
                  {PRIZES.map((p) => (
                    <div key={p.label} className="flex items-center gap-2">
                      <div className="shrink-0" style={{ width: 100, fontSize: 11, fontWeight: 700, color: p.best ? C.cream : C.mut, textTransform: "uppercase", lineHeight: 1.2 }}>
                        {p.label}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="truncate" style={{ fontSize: 12, color: p.best ? (p.label === "Giro de 175 BPM" ? C.oak : C.amber) : C.mut, fontWeight: p.best ? 700 : 400 }}>
                          {p.best ? p.best.name : "em aberto"}
                        </div>
                        <div style={{ fontSize: 10, color: C.mut }}>{p.prize}</div>
                      </div>
                      {p.best && (
                        <div className="shrink-0" style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.mut }}>
                          {p.best.reg ? fmtTs(p.best.reg) : p.best.ts ? fmtTs(p.best.ts) : fmtBR(p.best.date)}
                        </div>
                      )}
                    </div>
                  ))}

                </div>
              </section>
            );
          })()}

          {(() => {
            const todas = (data.miniMissions || []).slice().reverse();
            return (
              <section className="rounded-xl p-4 mt-3" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.25em", color: C.oak, textTransform: "uppercase", marginBottom: 10 }}>
                  ⚡ Missões Relâmpago
                </div>
                {!todas.length ? (
                  <div style={{ fontSize: 12, color: C.mut }}>Ainda não há missões cadastradas — fique de olho! ⚡</div>
                ) : (() => {
                  const visiveis = todas.length >= 7 && !showAllMini ? todas.slice(0, 6) : todas;
                  return (
                    <>
                      <div className="flex flex-col gap-2">
                        {visiveis.map((x) => {
                          const ws = (x.winners || []);
                          const emAberto = (x.start || "") <= todayStr() && x.end >= todayStr() && ws.length < x.qty;
                          const agendada = (x.start || "") > todayStr();
                          return (
                            <div key={x.id} className="flex items-center gap-2">
                              <div className="shrink-0" style={{ width: 100, fontSize: 11, fontWeight: 700, color: ws.length ? C.cream : C.mut, textTransform: "uppercase", lineHeight: 1.2 }}>
                                ⚡ {x.name}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div style={{ fontSize: 12, color: ws.length ? C.amber : C.mut, fontWeight: ws.length ? 700 : 400, lineHeight: 1.4 }}>
                                  {ws.length
                                    ? ws.map((w, i) => `${i + 1}º ${w.name}`).join(" · ")
                                    : agendada ? `começa ${fmtBR(x.start)}` : emAberto ? "em aberto" : "encerrada sem ganhador"}
                                </div>
                                <div style={{ fontSize: 10, color: C.mut }}>{x.prize} ({ws.length}/{x.qty})</div>
                              </div>
                              {ws.length > 0 && (
                                <div className="shrink-0" style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.mut }}>
                                  {fmtTs(ws[ws.length - 1].ts)}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {todas.length >= 7 && (
                        <button
                          onClick={() => setShowAllMini(!showAllMini)}
                          className="mt-2 w-full rounded-lg py-1.5"
                          style={{ color: C.oak, fontSize: 12, border: `1px dashed ${C.line}` }}
                        >
                          {showAllMini ? "▴ Ver menos" : `▾ Ver todas (${todas.length} missões)`}
                        </button>
                      )}
                    </>
                  );
                })()}
              </section>
            );
          })()}

          {admin && data.students.length > 0 && (
            <section className="rounded-xl p-4 mt-6" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.25em", color: C.oak, textTransform: "uppercase", marginBottom: 10 }}>
                {admin ? "Registrar presença (validada)" : "Registrar presença"}
              </div>
              <div className="flex flex-col gap-2">
                <select
                  value={qform.studentId}
                  onChange={(e) => setQform({ ...qform, studentId: e.target.value })}
                  className="rounded-lg px-3 py-2 outline-none"
                  style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: qform.studentId ? C.cream : C.mut }}
                >
                  <option value="" disabled>Quem fez a aula?</option>
                  {data.students.filter((s) => s.approved !== false).sort((a, b) => a.name.localeCompare(b.name)).map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <input
                    type="date" value={qform.date}
                    min={DESAFIO_INICIO} max={todayStr()}
                    onChange={(e) => {
                      const date = e.target.value;
                      setQErr("");
                      const valid = date && isWeekendDate(date) ? WEEKEND_SLOTS : WEEKDAY_SLOTS;
                      setQform({ ...qform, date, slot: valid.includes(qform.slot) ? qform.slot : valid[0] });
                    }}
                    className="flex-1 rounded-lg px-3 py-2 outline-none"
                    style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.cream, colorScheme: "dark" }}
                  />
                  <select
                    value={qform.slot}
                    onChange={(e) => setQform({ ...qform, slot: e.target.value })}
                    className="rounded-lg px-3 py-2 outline-none"
                    style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.cream }}
                  >
                    {(qform.date && isWeekendDate(qform.date) ? WEEKEND_SLOTS : WEEKDAY_SLOTS).map((s) => (
                      <option key={s} value={s}>{s.replace(":", "h")}</option>
                    ))}
                  </select>
                </div>
                <select
                  value={qform.instructor}
                  onChange={(e) => setQform({ ...qform, instructor: e.target.value })}
                  className="rounded-lg px-3 py-2 outline-none"
                  style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: qform.instructor ? C.cream : C.mut }}
                >
                  <option value="" disabled>Professor(a) da aula</option>
                  {INSTRUCTORS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <button onClick={addQuickRecord} className="rounded-lg py-3 font-bold mt-1" style={{ background: `linear-gradient(120deg, ${C.amber}, #16696F)`, color: C.cream }}>
                  Registrar presença
                </button>
                {qErr && (
                  <div className="text-center" style={{ color: "#C96A76", fontSize: 12 }}>{qErr}</div>
                )}
                {qsaved && (
                  <div className="text-center" style={{ color: admin ? C.ok : C.amberSoft, fontSize: 12 }}>
                    {admin ? "✓ Presença registrada e validada" : "✓ Registrado! Aguardando validação da recepção"}
                  </div>
                )}
              </div>
            </section>
          )}



          {footerNote}
        </main>
      </div>
    );
  }

  // ---------- Portão de senha da cartela ----------
  if (!admin && !(student.pass && unlocks[student.id] === student.pass)) {
    const creating = !student.pass;
    const tryEnter = () => {
      const pw = gatePass.trim();
      if (creating) {
        if (pw.length < 4) { setGateErr("A senha precisa de pelo menos 4 caracteres."); return; }
        mutate((d) => { const s = d.students.find((x) => x.id === view); if (s && !s.pass) s.pass = pw; });
        const nu = { ...unlocks, [student.id]: pw };
        setUnlocks(nu); saveUnlocks(nu);
        setGatePass(""); setGateErr("");
      } else if (pw === student.pass) {
        const nu = { ...unlocks, [student.id]: student.pass };
        setUnlocks(nu); saveUnlocks(nu);
        const nm = { ...myIds, [track]: student.id };
        setMyIds(nm); saveMyIds(nm);
        setGatePass(""); setGateErr("");
      } else {
        setGateErr("Senha incorreta. Esqueceu? Fale com a recepção para redefinir.");
      }
    };
    return (
      <div className="min-h-screen" style={{ ...pageVars, background: pageBg, fontFamily: "'Montserrat', sans-serif", transition: "background .4s" }}>
        {fonts}{modal}
        <main className="max-w-md mx-auto px-5 pb-16 pt-6">
          <div className="flex items-center justify-between">
            <button onClick={() => { setView(null); setGatePass(""); setGateErr(""); }} style={{ color: C.oak, fontSize: 13 }}>← Ranking</button>
            {lockBtn}
          </div>
          <h2 className="mt-4 mb-3" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 26, color: C.amberSoft, textTransform: "uppercase", letterSpacing: "0.03em" }}>
            {student.name}
          </h2>
          <section className="rounded-xl p-4" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.25em", color: C.oak, textTransform: "uppercase", marginBottom: 8 }}>
              {creating ? "🔐 Crie sua senha de acesso" : "🔐 Cartela protegida"}
            </div>
            <p style={{ color: C.mut, fontSize: 13, marginBottom: 12 }}>
              {creating
                ? "Primeiro acesso: crie uma senha para proteger sua cartela. Só você (e a administração) poderá acessá-la."
                : "Digite sua senha para abrir sua cartela e registrar suas aulas."}
            </p>
            <input
              type="password"
              value={gatePass}
              autoFocus
              onChange={(e) => { setGatePass(e.target.value); setGateErr(""); }}
              onKeyDown={(e) => e.key === "Enter" && tryEnter()}
              placeholder={creating ? "Crie uma senha (mín. 4 caracteres)" : "Sua senha"}
              className="w-full rounded-lg px-4 py-3 outline-none mb-2"
              style={{ background: C.panelSoft, border: `1px solid ${gateErr ? "#B15560" : C.line}`, color: C.cream }}
            />
            {gateErr && <div className="mb-2" style={{ color: "#C96A76", fontSize: 12 }}>{gateErr}</div>}
            <button onClick={tryEnter} className="w-full rounded-lg py-3 font-bold" style={{ background: `linear-gradient(120deg, ${C.amber}, #16696F)`, color: C.cream }}>
              {creating ? "Criar senha e entrar" : "Entrar"}
            </button>
          </section>
          {footerNote}
          <div className="flex justify-center pb-8">{helpBtn}</div>
        </main>
      </div>
    );
  }

  // ---------- Detalhe do aluno ----------
  const res = computeProgress(student);
  const recsSorted = [...student.records].sort((a, b) => (a.date + a.slot < b.date + b.slot ? 1 : -1));
  const validSlots = form.date && isWeekendDate(form.date) ? WEEKEND_SLOTS : WEEKDAY_SLOTS;

  return (
    <div className="min-h-screen" style={{ ...pageVars, background: pageBg, fontFamily: "'Montserrat', sans-serif", transition: "background .4s" }}>
      {fonts}{modal}
      <main className="max-w-md mx-auto px-5 pb-16 pt-6">
        <div className="flex items-center justify-between">
          <button onClick={() => setView(null)} style={{ color: C.oak, fontSize: 13 }}>← Ranking</button>
          {lockBtn}
        </div>

        <div className="mt-4 mb-1 flex items-end justify-between">
          <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 26, color: C.amberSoft, textTransform: "uppercase", letterSpacing: "0.03em" }}>
            {student.name}
          </h2>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: res.full ? C.amber : C.mut }}>
            {res.doneCount}/9
          </div>
        </div>

        {student.approved === false && (
          <div className="rounded-lg px-3 py-2 mb-3 text-center" style={{ background: C.wineDeep, color: C.amberSoft, fontWeight: 700, fontSize: 13 }}>
            ⏳ Cadastro aguardando liberação da recepção
            {admin && (
              <button
                onClick={() => mutate((d) => { const s = d.students.find((x) => x.id === view); if (s) s.approved = true; })}
                className="ml-2 rounded px-2 py-1 font-bold"
                style={{ background: C.ok, color: C.bg, fontSize: 12 }}
              >Liberar</button>
            )}
          </div>
        )}

        {(() => {
          const pl = (data.winners && data.winners.placements) || {};
          const AWb = computeAwards(data);
          const pos = (k) => { const l = pl[k] || []; const i = l.findIndex((x) => x.id === student.id); return i >= 0 ? i + 1 : null; };
          const tag = (k, nome, premio, icone, fallback) => {
            const n = pos(k);
            const aw = AWb.pats[k] || null;
            const meu = aw && aw.id === student.id;
            const medal = n === 1 ? "🥇" : n === 2 ? "🥈" : n === 3 ? "🥉" : null;
            if (n) return `${medal || icone} ${n}º ${nome}${meu ? ` — ${premio}!` : "!"}`;
            return `${icone} ${fallback}`;
          };
          if (!(res.vertLines > 0 || res.horizLines > 0 || res.diagLines > 0 || res.full || res.corners || res.bought >= 4)) return null;
          return (
            <div className="flex flex-col gap-1 mb-3">
              {res.full && (
                <div className="rounded-lg px-3 py-2 text-center" style={{ background: C.amber, color: C.bg, fontWeight: 700, fontSize: 13 }}>
                  {tag("full", "CARTELA CHEIA", "treinamento com os profs + 1 mês de aula ilimitado", "🏆", "Cartela Cheia completa!")}
                </div>
              )}
              {res.full && res.bought >= 4 && (
                <div className="rounded-lg px-3 py-2 text-center" style={{ background: `linear-gradient(120deg, ${C.oak}, #8A6C42)`, color: C.bg, fontWeight: 700, fontSize: 13 }}>
                  {tag("bpm", "GIRO DE 175 BPM", "aula fechada no sábado ou domingo para 33 convidados", "⭐", "Giro de 175 BPM completo!")}
                </div>
              )}
              {res.bought >= 4 && (
                <div className="rounded-lg px-3 py-2 text-center" style={{ background: C.wineDeep, color: C.amberSoft, fontWeight: 700, fontSize: 13 }}>
                  {tag("conv", "nas 4 CONVERSÕES", "escolha da aula temática", "🧸", "4 Conversões completas!")}
                </div>
              )}
              {!res.full && res.corners && (
                <div className="rounded-lg px-3 py-2 text-center" style={{ background: C.wineDeep, color: C.amberSoft, fontWeight: 700, fontSize: 13 }}>
                  {tag("corners", "nos 4 CANTOS", "bolsinha Spincycle", "✦", "4 Cantos completos!")}
                </div>
              )}
              {!res.full && res.vertLines > 0 && (
                <div className="rounded-lg px-3 py-2 text-center" style={{ background: C.wineDeep, color: C.amberSoft, fontWeight: 700, fontSize: 13 }}>
                  {tag("vert", "na VERTICAL", "camiseta Spincycle", "▮", "Vertical completa!")}
                </div>
              )}
              {!res.full && res.horizLines > 0 && (
                <div className="rounded-lg px-3 py-2 text-center" style={{ background: C.wineDeep, color: C.amberSoft, fontWeight: 700, fontSize: 13 }}>
                  {tag("horiz", "na HORIZONTAL", "camiseta Spincycle", "▬", "Horizontal completa!")}
                </div>
              )}
              {!res.full && res.diagLines > 0 && (
                <div className="rounded-lg px-3 py-2 text-center" style={{ background: C.wineDeep, color: C.amberSoft, fontWeight: 700, fontSize: 13 }}>
                  {tag("diag", "na DIAGONAL", "camiseta Spincycle", "╱", "Diagonal completa!")}
                </div>
              )}
            </div>
          );
        })()}

        <div className="grid grid-cols-3 gap-2">
          {(() => {
            const lineCells = new Set();
            [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6], [0, 2, 6, 8]].forEach((ln) => {
              if (ln.every((i) => res.done[i])) ln.forEach((i) => lineCells.add(i));
            });
            const AWg = computeAwards(data);
            return MISSIONS.map((m, i) => (
              <BingoCell
                key={m.id} mission={m} value={res.p[m.id]} done={res.done[i]}
                bear={res.full ? "gold" : (lineCells.has(i) ? "white" : "none")}
                shake={!!(AWg.shakes[m.id] && AWg.shakes[m.id].id === student.id)}
                onClick={() => setDetailMission(detailMission === m.id ? null : m.id)}
              />
            ));
          })()}
        </div>
        {detailMission && (
          <div className="rounded-lg px-3 py-2 mt-2" style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.oak, fontSize: 13 }}>
            {MISSIONS.find((m) => m.id === detailMission).desc}
          </div>
        )}

        {/* Missões relâmpago: alerta abaixo da cartela */}
        {(() => {
          const ativas = (data.miniMissions || []).filter((x) => (x.start || "") <= todayStr() && x.end >= todayStr() && (x.winners || []).length < x.qty);
          const vencidas = (data.miniMissions || []).filter((x) => (x.winners || []).some((w) => w.id === student.id));
          if (!ativas.length && !vencidas.length) return null;
          return (
            <div className="flex flex-col gap-2 mt-3">
              {ativas.map((x) => (
                <div key={x.id} className="rounded-xl px-4 py-3" style={{ background: C.panel, border: `1.5px solid ${C.amber}`, boxShadow: `0 0 14px ${C.amber}33` }}>
                  <div className="flex items-center justify-between gap-2">
                    <div style={{ color: C.amberSoft, fontWeight: 800, fontSize: 13, textTransform: "uppercase" }}>⚡ Missão relâmpago: {x.name}</div>
                    <div className="shrink-0" style={{ color: C.oak, fontWeight: 700, fontSize: 11 }}>
                      {x.end === todayStr() ? "SÓ HOJE!" : `até ${fmtBR(x.end)}`}
                    </div>
                  </div>
                  <div style={{ color: C.cream, fontSize: 12.5, lineHeight: 1.55, marginTop: 3 }}>{x.desc}</div>
                  {x.mode === "slot" && (x.slots || []).length > 0 && (
                    <div style={{ color: C.amberSoft, fontSize: 12, fontWeight: 700, marginTop: 4 }}>
                      ⏰ Vale check-in nas aulas: {(x.slots || []).map((sl) => sl.replace(":", "h")).join(" · ")}
                    </div>
                  )}
                  <div style={{ color: C.oak, fontSize: 12, fontWeight: 700, marginTop: 4 }}>
                    🏆 {x.prize} — {x.qty} prêmio{x.qty === 1 ? "" : "s"}
                    {x.mode === "top" ? " para quem fizer MAIS aulas no período"
                      : x.mode === "slot" ? " por ordem de chegada"
                      : x.mode === "sorteio" ? " por sorteio entre quem treinar no período"
                      : x.mode === "quizText" || x.mode === "quizChoice" ? " para os primeiros que acertarem"
                      : " por ordem de conquista"}
                    {x.mode !== "sorteio" ? ` — restam ${x.qty - (x.winners || []).length}` : ""}
                  </div>
                  {x.mode === "top" && (() => {
                    const parc = miniTop(data, x).slice(0, 3);
                    return parc.length ? (
                      <div style={{ color: C.mut, fontSize: 11.5, marginTop: 3 }}>
                        parcial: {parc.map((w, i) => `${i + 1}º ${w.name} (${w.count})`).join(" · ")}
                      </div>
                    ) : null;
                  })()}
                  {x.mode === "slot" && (() => {
                    const parc = miniSlotFirsts(data, x).slice(0, x.qty);
                    return parc.length ? (
                      <div style={{ color: C.mut, fontSize: 11.5, marginTop: 3 }}>
                        já garantiram: {parc.map((w) => w.name).join(" · ")}
                      </div>
                    ) : null;
                  })()}
                  {(x.mode === "quizText" || x.mode === "quizChoice") && !admin && (() => {
                    const at = (x.attempts || {})[student.id] || { n: 0, ok: false };
                    const tries = x.tries || 3;
                    if (at.ok) {
                      return <div style={{ color: C.ok, fontSize: 12.5, fontWeight: 700, marginTop: 6 }}>🎉 Você acertou e garantiu o prêmio!</div>;
                    }
                    if (at.n >= tries) {
                      return <div style={{ color: C.mut, fontSize: 12, marginTop: 6 }}>Suas {tries} tentativas acabaram — fica pra próxima! 💪</div>;
                    }
                    const responder = () => {
                      const val = (qzAns[x.id] || "").trim();
                      if (!val) return;
                      const certo = x.mode === "quizChoice"
                        ? normQ(val) === normQ(x.correct || "")
                        : (x.answers || []).some((a) => normQ(a) === normQ(val));
                      mutate((d) => {
                        const xx = (d.miniMissions || []).find((y) => y.id === x.id);
                        const s = d.students.find((y) => y.id === view);
                        if (!xx || !s) return;
                        if (!xx.attempts) xx.attempts = {};
                        const a2 = xx.attempts[s.id] || { n: 0, ok: false };
                        if (a2.ok || a2.n >= (xx.tries || 3) || (xx.winners || []).length >= xx.qty) return;
                        a2.n += 1;
                        const ok2 = xx.mode === "quizChoice"
                          ? normQ(val) === normQ(xx.correct || "")
                          : (xx.answers || []).some((a) => normQ(a) === normQ(val));
                        if (ok2) {
                          a2.ok = true;
                          if (!xx.winners) xx.winners = [];
                          xx.winners.push({ id: s.id, name: s.name, ts: Date.now() });
                        }
                        xx.attempts[s.id] = a2;
                      });
                      setQzMsg({ ...qzMsg, [x.id]: certo ? "🎉 Acertou! Prêmio garantido — sua medalha ⚡ já está na cartela." : `Não foi dessa vez… restam ${tries - at.n - 1} tentativa${tries - at.n - 1 === 1 ? "" : "s"}.` });
                      setQzAns({ ...qzAns, [x.id]: "" });
                    };
                    return (
                      <div className="mt-2">
                        {x.mode === "quizChoice" ? (
                          <select value={qzAns[x.id] || ""} onChange={(e) => { setQzAns({ ...qzAns, [x.id]: e.target.value }); setQzMsg({ ...qzMsg, [x.id]: "" }); }}
                            className="w-full rounded-lg px-3 py-2 outline-none mb-1.5"
                            style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: qzAns[x.id] ? C.cream : C.mut }}>
                            <option value="" disabled>Escolha sua resposta…</option>
                            {(x.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : (
                          <input value={qzAns[x.id] || ""}
                            onChange={(e) => { setQzAns({ ...qzAns, [x.id]: e.target.value }); setQzMsg({ ...qzMsg, [x.id]: "" }); }}
                            onKeyDown={(e) => e.key === "Enter" && responder()}
                            placeholder="Digite sua resposta…"
                            className="w-full rounded-lg px-3 py-2 outline-none mb-1.5"
                            style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.cream }} />
                        )}
                        <button onClick={responder} className="w-full rounded-lg py-2 font-bold" style={{ background: C.amber, color: C.cream, fontSize: 13 }}>
                          Responder ({tries - at.n} tentativa{tries - at.n === 1 ? "" : "s"} restante{tries - at.n === 1 ? "" : "s"})
                        </button>
                        {qzMsg[x.id] && <div className="mt-1.5 text-center" style={{ color: qzMsg[x.id].startsWith("🎉") ? C.ok : C.amberSoft, fontSize: 12 }}>{qzMsg[x.id]}</div>}
                      </div>
                    );
                  })()}
                </div>
              ))}
              {vencidas.length > 0 && (
                <div className="rounded-xl px-4 py-3" style={{ background: C.panelSoft, border: `1px solid ${C.oak}` }}>
                  <div style={{ color: C.oak, fontWeight: 800, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
                    ⚡ Medalhas relâmpago
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {vencidas.map((x) => {
                      const posV = (x.winners || []).findIndex((w) => w.id === student.id) + 1;
                      return (
                        <span key={x.id} className="rounded-full px-2.5 py-1" style={{ background: `linear-gradient(120deg, #D9A954, #B08D3E)`, color: "#141414", fontSize: 11, fontWeight: 800 }}>
                          ⚡ {posV}º · {x.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Bolinhas de progresso de cada missão */}
        <div className="rounded-xl p-4 mt-3" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.25em", color: C.oak, textTransform: "uppercase", marginBottom: 10 }}>
            Progresso das missões
          </div>
          <div className="flex flex-col gap-2.5">
            {MISSIONS.map((m, i) => {
              const val = Math.min(res.p[m.id], m.target);
              return (
                <div key={m.id} className="flex items-center gap-2">
                  <div className="shrink-0" style={{
                    width: 118, fontSize: 11, fontWeight: 700,
                    color: res.done[i] ? C.amberSoft : C.cream,
                    textTransform: "uppercase", letterSpacing: "0.02em", lineHeight: 1.2,
                  }}>
                    {m.name}
                  </div>
                  <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${Math.min(m.target, 15)}, minmax(0, 14px))`, justifyContent: "start", gap: 3 }}>
                    {Array.from({ length: m.target }).map((_, j) => (
                      <div key={j} className="rounded-full transition-all duration-300" style={{
                        width: "100%", maxWidth: 11, aspectRatio: "1", justifySelf: "start",
                        background: j < val ? C.amber : C.panelSoft,
                        border: `1px solid ${j < val ? C.amberSoft : C.line}`,
                        boxShadow: j < val ? `0 0 6px ${C.amber}88` : "none",
                      }} />
                    ))}
                  </div>
                  <div className="shrink-0" style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: res.done[i] ? C.amber : C.mut }}>
                    {res.p[m.id]}/{m.target}
                  </div>
                </div>
              );
            })}
          </div>
          {(() => {
            const totalAlvo = MISSIONS.reduce((n, m) => n + m.target, 0);
            const totalFeito = MISSIONS.reduce((n, m) => n + Math.min(res.p[m.id], m.target), 0);
            const pctMissoes = Math.round((res.doneCount / 9) * 100);
            const pctBolinhas = Math.round((totalFeito / totalAlvo) * 100);
            const aulas = (student.records || []).filter((r) => r.status === "ok").length;
            return (
              <div className="mt-3 pt-3 text-center" style={{ borderTop: `1px solid ${C.line}` }}>
                <div style={{ color: C.amberSoft, fontWeight: 800, fontSize: 15 }}>
                  {pctMissoes}% das missões concluídas
                </div>
                <div style={{ color: C.mut, fontSize: 11.5, marginTop: 2 }}>
                  {aulas} aula{aulas === 1 ? "" : "s"} validada{aulas === 1 ? "" : "s"} · {res.doneCount}/9 missões · {pctBolinhas}% do caminho total percorrido
                </div>
              </div>
            );
          })()}
        </div>

        {/* Registrar aula */}
        {student.approved !== false && (
        <section className="rounded-xl p-4 mt-6" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.25em", color: C.oak, textTransform: "uppercase", marginBottom: 10 }}>
            {admin ? "Registrar aula (validada)" : "Registrar minha aula"}
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                type="date" value={form.date}
                min={DESAFIO_INICIO} max={todayStr()}
                onChange={(e) => {
                  const date = e.target.value;
                  setRecErr("");
                  const valid = date && isWeekendDate(date) ? WEEKEND_SLOTS : WEEKDAY_SLOTS;
                  setForm({ ...form, date, slot: valid.includes(form.slot) ? form.slot : valid[0] });
                }}
                className="flex-1 rounded-lg px-3 py-2 outline-none"
                style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.cream, colorScheme: "dark" }}
              />
              <select
                value={form.slot}
                onChange={(e) => setForm({ ...form, slot: e.target.value })}
                className="rounded-lg px-3 py-2 outline-none"
                style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.cream }}
              >
                {validSlots.map((s) => <option key={s} value={s}>{s.replace(":", "h")}</option>)}
              </select>
            </div>
            <select
              value={form.instructor}
              onChange={(e) => setForm({ ...form, instructor: e.target.value })}
              className="rounded-lg px-3 py-2 outline-none"
              style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: form.instructor ? C.cream : C.mut }}
            >
              <option value="" disabled>Professor(a) da aula</option>
              {INSTRUCTORS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <button onClick={addRecord} className="rounded-lg py-3 font-bold mt-1" style={{ background: `linear-gradient(120deg, ${C.amber}, #16696F)`, color: C.cream }}>
              Registrar presença
            </button>
            {recErr && (
              <div className="text-center" style={{ color: "#C96A76", fontSize: 12 }}>{recErr}</div>
            )}
            {saved && (
              <div className="text-center" style={{ color: admin ? C.ok : C.amberSoft, fontSize: 12 }}>
                {admin ? "✓ Presença registrada e validada" : "✓ Registrado! Aguardando validação da recepção"}
              </div>
            )}
          </div>
        </section>
        )}

        {/* Amigos */}
        {student.approved !== false && (
        <section className="rounded-xl p-4 mt-3" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
          <div className="flex items-center justify-between mb-1">
            <div style={{ color: C.cream, fontWeight: 700, fontSize: 14 }}>Amigos trazidos</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: C.amber }}>
              {res.p.amigo}/{(MISSIONS.find((m) => m.id === "amigo") || {}).target}
            </div>
          </div>
          <div style={{ color: C.mut, fontSize: 12, marginBottom: 10 }}>
            Registre o amigo e a aula experimental que ele fez — a recepção valida na chegada. Vale amigo novo: quem nunca pedalou no estúdio ou está há mais de 6 meses sem aparecer.
          </div>

          <div className="rounded-lg px-3 py-2.5 mb-3 flex items-center gap-3" style={{
            background: res.bought >= 4 ? `${C.oak}33` : C.panelSoft,
            border: `1px solid ${res.bought >= 4 ? C.oak : C.line}`,
            boxShadow: res.bought >= 4 ? `0 0 14px ${C.oak}55` : "none",
          }}>
            <span style={{ fontSize: 18 }}>{res.bought >= 4 ? "⭐" : "☆"}</span>
            <div className="flex-1">
              <div style={{ color: res.bought >= 4 ? C.oak : C.cream, fontWeight: 700, fontSize: 13 }}>
                Giro de 175 BPM (Desafio Plus)
              </div>
              <div style={{ color: C.mut, fontSize: 11 }}>
                4 amigos trazidos comprando pacote de 10+ aulas. Vale junto com a cartela cheia. A recepção pinta o ursinho 🧸 do amigo que comprou.
              </div>
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: res.bought >= 4 ? C.oak : C.mut }}>
              {Math.min(res.bought, 4)}/4
            </div>
          </div>

          <div className="rounded-lg px-3 py-2 mb-2" style={{ background: C.panelSoft, border: `1px solid ${C.line}` }}>
            <div className="flex items-center gap-2" style={{ color: C.mut, fontSize: 11, lineHeight: 1.5 }}>
              <span className="shrink-0"><Bear filled size={16} /></span>
              <span><b style={{ color: C.cream }}>ursinho pintado</b> = convidado que fechou pacote de 10+ aulas (a recepção marca)</span>
            </div>
            <div className="flex items-center gap-2 mt-1" style={{ color: C.mut, fontSize: 11, lineHeight: 1.5 }}>
              <span className="shrink-0" style={{ fontSize: 14 }}>📣</span>
              <span><b style={{ color: C.cream }}>megafone</b> = aluno da Spin que você trouxe pro desafio (vale até 2)</span>
            </div>
          </div>

          {(student.guests || []).length > 0 && (
            <div className="flex flex-col gap-1 mb-3">
              {[...(student.guests || [])].sort((a, b) => (a.date < b.date ? 1 : -1)).map((g) => (
                <div key={g.id} className="rounded-lg px-3 py-2 flex items-center gap-2" style={{
                  background: C.panelSoft,
                  border: `1px solid ${g.status === "pending" ? C.amber + "66" : C.line}`,
                }}>
                  <div className="flex-1 min-w-0">
                    <div className="truncate" style={{ color: g.status === "ok" ? C.cream : C.amberSoft, fontSize: 13, fontWeight: 700 }}>
                      {g.name}
                    </div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: C.mut }}>
                      {weekdayBR(g.date)} {fmtBR(g.date)} · {g.slot.replace(":", "h")}
                    </div>
                  </div>
                  {g.status === "pending" && (
                    <span className="rounded px-1.5 py-0.5 shrink-0" style={{ fontSize: 10, background: C.wineDeep, color: C.amberSoft }}>
                      pendente
                    </span>
                  )}
                  {g.status === "ok" && !admin && (
                    <span className="shrink-0" style={{ fontSize: 12, color: C.ok }}>✓</span>
                  )}
                  {(() => {
                    const spinCount = (student.guests || []).filter((x) => x.kind === "spin").length;
                    const capReached = !g.kind || g.kind !== "spin" ? spinCount >= 2 : false;
                    const on = g.kind === "spin";
                    return (
                      <button
                        onClick={() => {
                          if (!on && capReached) return;
                          mutate((d) => {
                            const s = d.students.find((x) => x.id === view);
                            const gg = s && s.guests.find((x) => x.id === g.id);
                            if (gg) gg.kind = gg.kind === "spin" ? "novo" : "spin";
                          });
                        }}
                        className="shrink-0 rounded px-1 py-0.5"
                        title={on ? "Aluno da Spin trazido pro desafio (toque para desmarcar)" : capReached ? "Limite de 2 alunos da Spin atingido" : "Marcar como aluno da Spin trazido pro desafio"}
                        style={{
                          fontSize: 15, background: "transparent", cursor: !on && capReached ? "default" : "pointer",
                          border: "none",
                          opacity: on ? 1 : capReached ? 0.2 : 0.45,
                          filter: on ? "none" : "grayscale(100%)",
                        }}
                      >📣</button>
                    );
                  })()}
                  {admin ? (
                    <button
                      onClick={() => mutate((d) => {
                        const s = d.students.find((x) => x.id === view);
                        const gg = s.guests.find((x) => x.id === g.id);
                        if (!gg) return;
                        gg.bought = !gg.bought;
                        if (gg.bought) gg.boughtTs = Date.now(); else delete gg.boughtTs;
                      })}
                      className="shrink-0 p-1"
                      title="Marcar que comprou pacote de 10+ aulas"
                      style={{ background: "transparent", border: "none", cursor: "pointer", opacity: g.bought ? 1 : 0.55 }}
                    >
                      <Bear filled={!!g.bought} size={20} />
                    </button>
                  ) : (
                    <span className="shrink-0 p-1" style={{ opacity: g.bought ? 1 : 0.55 }}>
                      <Bear filled={!!g.bought} size={20} />
                    </span>
                  )}
                  {admin && g.status === "pending" && (
                    <button
                      onClick={() => mutate((d) => {
                        const s = d.students.find((x) => x.id === view);
                        const gg = s.guests.find((x) => x.id === g.id);
                        gg.status = "ok";
                      })}
                      className="rounded px-2 py-1 shrink-0 font-bold"
                      style={{ background: C.ok, color: C.bg, fontSize: 12 }}
                    >✓</button>
                  )}
                  {admin && (
                    <button
                      onClick={() => mutate((d) => {
                        const s = d.students.find((x) => x.id === view);
                        s.guests = s.guests.filter((x) => x.id !== g.id);
                      })}
                      style={{ color: C.mut, fontSize: 12 }}
                    >✕</button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <input
              value={gform.name}
              onChange={(e) => { setGform({ ...gform, name: e.target.value }); setGErr(""); }}
              placeholder="Nome e sobrenome do amigo"
              className="rounded-lg px-3 py-2 outline-none"
              style={{ background: C.panelSoft, border: `1px solid ${gErr ? "#B15560" : C.line}`, color: C.cream }}
            />
            <div className="flex gap-2">
              <input
                type="date" value={gform.date}
                min={DESAFIO_INICIO} max={todayStr()}
                onChange={(e) => {
                  const date = e.target.value;
                  setGErr("");
                  const valid = date && isWeekendDate(date) ? WEEKEND_SLOTS : WEEKDAY_SLOTS;
                  setGform({ ...gform, date, slot: valid.includes(gform.slot) ? gform.slot : valid[0] });
                }}
                className="flex-1 rounded-lg px-3 py-2 outline-none"
                style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.cream, colorScheme: "dark" }}
              />
              <select
                value={gform.slot}
                onChange={(e) => setGform({ ...gform, slot: e.target.value })}
                className="rounded-lg px-3 py-2 outline-none"
                style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.cream }}
              >
                {(gform.date && isWeekendDate(gform.date) ? WEEKEND_SLOTS : WEEKDAY_SLOTS).map((s) => (
                  <option key={s} value={s}>{s.replace(":", "h")}</option>
                ))}
              </select>
            </div>
            {gErr && <div style={{ color: "#C96A76", fontSize: 12 }}>{gErr}</div>}
            <button onClick={addGuest} className="rounded-lg py-2.5 font-bold" style={{ background: `linear-gradient(120deg, ${C.amber}, #16696F)`, color: C.cream }}>
              Registrar amigo
            </button>
            {gSaved && (
              <div className="text-center" style={{ color: admin ? C.ok : C.amberSoft, fontSize: 12 }}>
                {admin ? "✓ Amigo registrado e validado" : "✓ Registrado! Aguardando validação da recepção"}
              </div>
            )}
          </div>
        </section>
        )}

        {/* Histórico */}
        <section className="mt-6">
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.25em", color: C.oak, textTransform: "uppercase", marginBottom: 8 }}>
            Histórico · {student.records.length} registro{student.records.length !== 1 ? "s" : ""}
          </div>
          {recsSorted.length === 0 && <p style={{ color: C.mut, fontSize: 13 }}>Nenhuma aula registrada ainda.</p>}
          <div className="flex flex-col gap-1">
            {(showAllHist ? recsSorted : recsSorted.slice(0, 5)).map((r) => (
              <div key={r.id} className="rounded-lg px-3 py-2 flex items-center gap-2" style={{
                background: C.panel,
                border: `1px solid ${r.status === "pending" ? C.amber + "66" : C.line}`,
              }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: r.status === "pending" ? C.amberSoft : C.cream, minWidth: 96 }}>
                  {weekdayBR(r.date)} {fmtBR(r.date)} · {r.slot.replace(":", "h")}
                </div>
                <div className="flex-1 min-w-0 truncate" style={{ color: C.mut, fontSize: 13 }}>{r.instructor || "—"}</div>
                {r.status === "pending" && (
                  <span className="rounded px-1.5 py-0.5 shrink-0" style={{ fontSize: 10, background: C.wineDeep, color: C.amberSoft }}>
                    pendente
                  </span>
                )}
                {admin && r.status === "pending" && (
                  <button
                    onClick={() => mutate((d) => {
                      const s = d.students.find((x) => x.id === view);
                      const rec = s.records.find((x) => x.id === r.id);
                      rec.status = "ok";
                    })}
                    className="rounded px-2 py-1 shrink-0 font-bold"
                    style={{ background: C.ok, color: C.bg, fontSize: 12 }}
                  >✓</button>
                )}
                {admin && (
                  <button
                    onClick={() => mutate((d) => {
                      const s = d.students.find((x) => x.id === view);
                      s.records = s.records.filter((x) => x.id !== r.id);
                    })}
                    style={{ color: C.mut, fontSize: 12 }}
                  >✕</button>
                )}
              </div>
            ))}
          </div>

          {recsSorted.length > 5 && (
            <button
              onClick={() => setShowAllHist(!showAllHist)}
              className="mt-2 w-full rounded-lg py-2"
              style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.amberSoft, fontSize: 12, fontWeight: 700 }}
            >
              {showAllHist ? "Ver menos" : `Ver mais (${recsSorted.length - 5} registros)`}
            </button>
          )}

          {admin && res.pending > 0 && (
            <button
              onClick={() => mutate((d) => {
                const s = d.students.find((x) => x.id === view);
                s.records.forEach((r) => { if (r.status === "pending") r.status = "ok"; });
                (s.guests || []).forEach((g) => { if (g.status === "pending") g.status = "ok"; });
              })}
              className="mt-3 w-full rounded-lg py-2 font-bold"
              style={{ background: C.ok, color: C.bg, fontSize: 13 }}
            >
              Validar todas as pendentes ({res.pending})
            </button>
          )}

          {admin && (
            <button
              onClick={() => mutate((d) => { const s = d.students.find((x) => x.id === view); if (s) s.pass = null; })}
              className="mt-8 w-full rounded-lg py-2"
              style={{ color: C.amberSoft, fontSize: 13, border: `1px solid ${C.line}` }}
            >
              Redefinir senha do aluno (ele criará uma nova)
            </button>
          )}
          {admin && !confirmRemove && (
            <button
              onClick={() => setConfirmRemove(true)}
              className="mt-3 w-full rounded-lg py-2"
              style={{ color: "#B15560", fontSize: 13, border: `1px solid ${C.wineDeep}` }}
            >
              Remover aluno do desafio
            </button>
          )}
          {admin && confirmRemove && (
            <div className="mt-3 rounded-lg p-3" style={{ border: "1px solid #B15560", background: "rgba(177,85,96,0.12)" }}>
              <div style={{ color: "#C96A76", fontSize: 13, fontWeight: 700, textAlign: "center", marginBottom: 10 }}>
                ⚠️ Tem certeza que deseja remover {student.name}?<br />
                Todas as aulas, amigos e conquistas serão apagados. Essa ação não pode ser desfeita.
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmRemove(false)}
                  className="flex-1 rounded-lg py-2"
                  style={{ border: `1px solid ${C.line}`, color: C.cream, fontSize: 13 }}
                >Cancelar</button>
                <button
                  onClick={() => {
                    mutate((d) => { d.students = d.students.filter((x) => x.id !== view); });
                    setConfirmRemove(false);
                    setView(null);
                  }}
                  className="flex-1 rounded-lg py-2 font-bold"
                  style={{ background: "#B15560", color: C.cream, fontSize: 13 }}
                >Sim, remover</button>
              </div>
            </div>
          )}
        </section>

        {footerNote}
        <div className="flex justify-center pb-8">{helpBtn}</div>
      </main>
    </div>
  );
}
