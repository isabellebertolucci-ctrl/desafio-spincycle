import { useState, useEffect, useRef } from "react";

// ---------- Constantes ----------
const WEEKDAY_SLOTS = ["06:15", "07:15", "08:15", "11:15", "16:30", "17:30", "18:30", "19:30"];
const WEEKEND_SLOTS = ["08:00", "09:00", "10:00", "11:00"];
const INSTRUCTORS = ["Ana B.", "Ana Paula", "Gabriel Marcondes", "Gabriel Vilela", "Thiago"];
const AJUDA_WHATSAPP = "5518991404769";
const DESAFIO_INICIO = "2026-08-06";
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
  semana: `Treinar ${n} dias seguidos, sem falhar nenhum (a sequência pode começar em qualquer dia)`,
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
const normPhone = (s) => (s || "").replace(/\D/g, "").replace(/^55/, "");
const phonesMatch = (a, b) => {
  const x = normPhone(a), y = normPhone(b);
  if (!x || !y || x.length < 8 || y.length < 8) return false;
  return x === y || x.slice(-10) === y.slice(-10) || x.slice(-8) === y.slice(-8);
};
const fmtPhone = (s) => {
  const d = normPhone(s);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return s || "";
};
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
  // Semana Perfeita: maior sequência de dias CORRIDOS (não depende do calendário).
  // Treinar de quinta a quarta vale igual a treinar de segunda a domingo.
  {
    const idx = dates.map(dayIndex).sort((a, b) => a - b);
    let melhor = idx.length ? 1 : 0;
    let corrida = idx.length ? 1 : 0;
    for (let i = 1; i < idx.length; i++) {
      corrida = idx[i] === idx[i - 1] + 1 ? corrida + 1 : 1;
      if (corrida > melhor) melhor = corrida;
    }
    p.semana = melhor;
  }

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

  // Semana Perfeita: dia em que completou N dias CORRIDOS de treino
  {
    const unicos = [...new Set(sortedDates)].sort();
    let corrida = 0;
    let anterior = null;
    for (const d of unicos) {
      const i = dayIndex(d);
      corrida = (anterior !== null && i === anterior + 1) ? corrida + 1 : 1;
      anterior = i;
      if (corrida >= T.semana) { out.semana = d; break; }
    }
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
      if (d.winners.excluded && d.winners.excluded[`m:${m.id}:${s.id}`]) return;
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
      if (d.winners.excluded && d.winners.excluded[`p:${k}:${s.id}`]) return;
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
      if (d.winners.excluded && d.winners.excluded[`p:conv:${s.id}`]) return;
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
function purgeStudentWins(d, sid) {
  const w = d.winners;
  if (w) {
    if (w.missionQueues) Object.keys(w.missionQueues).forEach((k) => {
      w.missionQueues[k] = (w.missionQueues[k] || []).filter((e) => e.id !== sid);
      if (w.missions && w.missions[k] && w.missions[k].id === sid) {
        w.missions[k] = w.missionQueues[k][0] ? { ...w.missionQueues[k][0] } : null;
      }
    });
    if (w.placements) Object.keys(w.placements).forEach((k) => {
      w.placements[k] = (w.placements[k] || []).filter((e) => e.id !== sid);
      if (w.patterns && w.patterns[k] && w.patterns[k].id === sid) {
        w.patterns[k] = w.placements[k][0] ? { ...w.placements[k][0] } : null;
      }
    });
  }
  (d.miniMissions || []).forEach((x) => {
    if (x.winners) x.winners = x.winners.filter((e) => e.id !== sid);
    if (x.attempts) delete x.attempts[sid];
  });
}

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

// ---------- Tempo das missões relâmpago ----------
const dtNowLocal = () => {
  const d = new Date(); d.setSeconds(0, 0);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
const fmtHM = (ts) => {
  const d = new Date(ts); const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getHours())}h${p(d.getMinutes())}`;
};
const fmtDT = (ts) => {
  const d = new Date(ts);
  const meses = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
  return `${d.getDate()}/${meses[d.getMonth()]} ${fmtHM(ts)}`;
};
const isoDateOf = (ts) => {
  const d = new Date(ts); const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
function mmStartTs(x) { return x.startTs || Date.parse((x.start || DESAFIO_INICIO) + "T00:00:00"); }
function mmEndTs(x) { return x.endTs || Date.parse((x.end || "2000-01-01") + "T23:59:59"); }
function mmPhase(x, now) {
  const s = mmStartTs(x), e = mmEndTs(x);
  if (now < s) return "agendada";
  const fechouPorPremio = x.openMode !== "tempo" && (x.winners || []).length >= x.qty;
  if (now <= e && !fechouPorPremio) return "ativa";
  const fimReal = fechouPorPremio ? Math.max(...(x.winners || []).map((w) => w.ts || 0), 0) || e : Math.min(e, now);
  const marco = fechouPorPremio ? fimReal : e;
  if (now <= marco + 10 * 60000) return "resultado";
  return "encerrada";
}

// ---------- Apuração das missões relâmpago ----------
function miniRecs(d, x) {
  const ini = isoDateOf(mmStartTs(x));
  const fim = isoDateOf(mmEndTs(x));
  const out = [];
  d.students.forEach((s) => {
    if (s.approved === false) return;
    (s.records || []).forEach((r) => {
      if (r.status === "ok" && r.date >= ini && r.date <= fim) out.push({ s, r });
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
const KEY_BASE = "spincycle-desafio-shared-v2";
const keyFor = (track) => `${KEY_BASE}-${track}`;
const KEY_BASE_V1 = "spincycle-desafio-shared-v1";
const keyForV1 = (track) => `${KEY_BASE_V1}-${track}`;
const ADMIN_KEY = "spincycle-admin-device";
const TRACK_PREF_KEY = "spincycle-track";
// Marca objetos que NÃO vieram de uma leitura confiável do banco.
// Nada marcado assim pode ser gravado por cima dos dados reais.
const NAO_CONFIAVEL = "__leituraFalhou";
const leituraOk = (d) => !!d && !d[NAO_CONFIAVEL] && Array.isArray(d.students);

// ID sempre único: horário + aleatoriedade. Sem isso, dois cadastros no mesmo
// instante (ou o cruzamento de dois backups) geram o MESMO id — e o React
// deixa de desenhar os repetidos, fazendo alunos "sumirem" da tela.
const novoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// Conserta ids repetidos preservando o primeiro de cada grupo.
// Devolve quantos foram renomeados.
function corrigirIdsDuplicados(d) {
  if (!d || !Array.isArray(d.students)) return 0;
  const vistos = new Set();
  let corrigidos = 0;
  d.students.forEach((s) => {
    if (!s) return;
    if (!s.id || vistos.has(s.id)) {
      const antigo = s.id;
      s.id = novoId();
      s.idAnterior = antigo || null;
      corrigidos++;
      console.warn(`[ID-DUPLICADO] "${s.name}" tinha id repetido (${antigo}) → ${s.id}`);
    }
    vistos.add(s.id);
    // Mesma checagem dentro das aulas e convidados de cada aluno
    const dedup = (arr) => {
      if (!Array.isArray(arr)) return;
      const vs = new Set();
      arr.forEach((it) => {
        if (!it) return;
        if (!it.id || vs.has(it.id)) { it.id = novoId(); corrigidos++; }
        vs.add(it.id);
      });
    };
    dedup(s.records);
    dedup(s.guests);
  });
  return corrigidos;
}

// Avisa a interface que houve uma restauração automática
let onAutoRestore = null;

// Busca a versão antiga (v1) — em alguns grupos a migração v1→v2 nunca chegou
// a acontecer porque a v2 já existia, e alunos ficaram presos na v1.
async function alunosDaV1(track) {
  try {
    const r = await window.storage.get(keyForV1(track), true);
    if (!r || !r.value) return null;
    const d = JSON.parse(r.value);
    if (d && Array.isArray(d.students) && d.students.length > 0) return d;
  } catch { /* sem v1 */ }
  return null;
}

// Recupera do cofre — e também da v1 — quando o banco aparece vazio ou menor que o esperado
async function tentarAutoRestauracao(track, atual, motivo) {
  let melhor = await melhorSnapshot(track);
  // A v1 também conta como fonte de recuperação
  const v1 = await alunosDaV1(track);
  if (v1 && (!melhor || v1.students.length > melhor.alunos)) {
    melhor = { data: v1, alunos: v1.students.length, ts: 0, slot: "v1" };
  }
  if (!melhor || melhor.alunos === 0) return null;
  const qtdAtual = atual && Array.isArray(atual.students) ? atual.students.length : 0;
  if (melhor.alunos <= qtdAtual) return null;
  console.error(`[AUTO-RESTAURO] ${track}: ${motivo}. Banco tem ${qtdAtual}, cofre tem ${melhor.alunos}. Restaurando…`);
  const restaurado = JSON.parse(JSON.stringify(melhor.data));
  // Preserva quem foi cadastrado depois do snapshot (não perde ninguém novo)
  if (atual && Array.isArray(atual.students)) {
    const ids = new Set(restaurado.students.map((s) => s.id));
    atual.students.forEach((s) => { if (s && !ids.has(s.id)) restaurado.students.push(s); });
  }
  restaurado.rev = ((atual && atual.rev) || 0) + 1;
  restaurado.savedAt = Date.now();
  restaurado.restauradoEm = Date.now();
  try {
    await window.storage.set(keyFor(track), JSON.stringify(restaurado), true);
    if (onAutoRestore) onAutoRestore(track, qtdAtual, restaurado.students.length);
    return restaurado;
  } catch (e) {
    console.error("[AUTO-RESTAURO] falha ao gravar restauração", e);
    return null;
  }
}

async function loadData(track) {
  try {
    const res = await window.storage.get(keyFor(track), true);
    if (res && res.value) {
      const d = JSON.parse(res.value);
      if (d && Array.isArray(d.students)) {
        // Vigia: banco vazio mas o cofre tem alunos → restaura sozinho
        if (d.students.length === 0) {
          const rec = await tentarAutoRestauracao(track, d, "banco vazio");
          if (rec) return rec;
        }
        // Vigia: a v1 tem alunos que não estão na v2? Traz de volta (mescla, não substitui)
        try {
          const v1 = await alunosDaV1(track);
          if (v1) {
            const idsV2 = new Set(d.students.map((s) => s.id));
            const faltando = v1.students.filter((s) => s && !idsV2.has(s.id));
            if (faltando.length > 0) {
              console.error(`[RESGATE-V1] ${track}: ${faltando.length} aluno(s) só existiam na versão antiga. Trazendo de volta…`);
              faltando.forEach((s) => d.students.push(s));
              // Preserva prêmios já registrados na v1 que não estejam na v2
              const w1 = v1.winners || {};
              d.winners = d.winners || {};
              ["missions", "patterns", "placements", "missionQueues"].forEach((sec) => {
                if (!w1[sec]) return;
                d.winners[sec] = d.winners[sec] || {};
                Object.keys(w1[sec]).forEach((k) => {
                  if (d.winners[sec][k] === undefined) d.winners[sec][k] = w1[sec][k];
                });
              });
              d.rev = (d.rev || 0) + 1;
              d.savedAt = Date.now();
              try {
                await window.storage.set(keyFor(track), JSON.stringify(d), true);
                if (onAutoRestore) onAutoRestore(track + ":v1", 0, faltando.length);
              } catch { /* segue com a correção em memória */ }
            }
          }
        } catch { /* resgate é melhor esforço */ }

        // Conserta ids repetidos (alunos que existem no banco mas somem da tela)
        const corrigidos = corrigirIdsDuplicados(d);
        if (corrigidos > 0) {
          console.error(`[ID-DUPLICADO] ${track}: ${corrigidos} id(s) repetido(s) corrigido(s). Regravando…`);
          d.rev = (d.rev || 0) + 1;
          d.savedAt = Date.now();
          try {
            await window.storage.set(keyFor(track), JSON.stringify(d), true);
            if (onAutoRestore) onAutoRestore(track + ":ids", 0, corrigidos);
          } catch { /* segue com a correção em memória */ }
        }
        return d;
      }
      // Valor corrompido: tenta o cofre antes de desistir
      const rec = await tentarAutoRestauracao(track, null, "dado corrompido");
      if (rec) return rec;
      return { pin: null, students: [], [NAO_CONFIAVEL]: true };
    }
    // Chave sumiu: o cofre pode salvar
    const rec = await tentarAutoRestauracao(track, null, "chave inexistente");
    if (rec) return rec;
    // Migração automática v1 → v2 (uma única vez, quando v2 ainda não existe)
    try {
      const old = await window.storage.get(keyForV1(track), true);
      if (old && old.value) {
        const d = JSON.parse(old.value);
        if (d && Array.isArray(d.students) && d.students.length > 0) {
          await window.storage.set(keyFor(track), old.value, true);
          return d;
        }
      }
    } catch { /* segue */ }
    // Primeiro uso de verdade — vazio legítimo
    return { pin: null, students: [] };
  } catch {
    // Falha de rede/leitura: vazio MARCADO, que nunca pode ser gravado
    return { pin: null, students: [], [NAO_CONFIAVEL]: true };
  }
}
const GLOBAL_KEY = "spincycle-desafio-shared-v2-global";
const GLOBAL_KEY_V1 = "spincycle-desafio-shared-v1-global";
const fotosKey = (t) => `spincycle-desafio-shared-v2-fotos-${t}`;
const fotosKeyV1 = (t) => `spincycle-desafio-shared-v1-fotos-${t}`;
const globalOk = (g) => !!g && !g[NAO_CONFIAVEL] && Array.isArray(g.miniMissions);
const gSnapKey = (i) => `${GLOBAL_KEY}-snap-${i}`;
const gSnapMetaKey = () => `${GLOBAL_KEY}-snapmeta`;

async function gravarSnapshotGlobal(valorAtual, qtd) {
  try {
    let meta = { next: 0, slots: [] };
    try {
      const m = await window.storage.get(gSnapMetaKey(), true);
      if (m && m.value) meta = JSON.parse(m.value);
    } catch { /* primeira vez */ }
    const slot = (meta.next || 0) % SNAP_SLOTS;
    await window.storage.set(gSnapKey(slot), valorAtual, true);
    meta.slots = meta.slots || [];
    meta.slots[slot] = { ts: Date.now(), qtd };
    meta.next = (slot + 1) % SNAP_SLOTS;
    await window.storage.set(gSnapMetaKey(), JSON.stringify(meta), true);
  } catch (e) { console.warn("[COFRE-GLOBAL] falha no snapshot", e); }
}

async function melhorSnapshotGlobal() {
  let melhor = null;
  for (let i = 0; i < SNAP_SLOTS; i++) {
    try {
      const r = await window.storage.get(gSnapKey(i), true);
      if (!r || !r.value) continue;
      const d = JSON.parse(r.value);
      if (!d || !Array.isArray(d.miniMissions)) continue;
      const cand = { data: d, qtd: d.miniMissions.length };
      if (!melhor || cand.qtd > melhor.qtd) melhor = cand;
    } catch { /* próximo slot */ }
  }
  try {
    const b = await window.storage.get(GLOBAL_KEY + "-bak", true);
    if (b && b.value) {
      const d = JSON.parse(b.value);
      if (d && Array.isArray(d.miniMissions)) {
        const cand = { data: d, qtd: d.miniMissions.length };
        if (!melhor || cand.qtd > melhor.qtd) melhor = cand;
      }
    }
  } catch { /* ok */ }
  return melhor;
}

async function loadGlobal() {
  try {
    const r = await window.storage.get(GLOBAL_KEY, true);
    if (r && r.value) {
      const g = JSON.parse(r.value);
      if (g && Array.isArray(g.miniMissions)) {
        // Vigia: global vazio mas o cofre tem missões → restaura sozinho
        if (g.miniMissions.length === 0) {
          const melhor = await melhorSnapshotGlobal();
          if (melhor && melhor.qtd > 0) {
            const rec = JSON.parse(JSON.stringify(melhor.data));
            rec.rev = (g.rev || 0) + 1;
            try {
              await window.storage.set(GLOBAL_KEY, JSON.stringify(rec), true);
              console.error(`[AUTO-RESTAURO] global: 0 → ${melhor.qtd} missões`);
              if (onAutoRestore) onAutoRestore("global", 0, melhor.qtd);
              return rec;
            } catch { /* segue com o que temos */ }
          }
        }
        return g;
      }
      return { miniMissions: [], [NAO_CONFIAVEL]: true };
    }
    try {
      const old = await window.storage.get(GLOBAL_KEY_V1, true);
      if (old && old.value) {
        const g = JSON.parse(old.value);
        if (g && Array.isArray(g.miniMissions)) {
          await window.storage.set(GLOBAL_KEY, old.value, true);
          return g;
        }
      }
    } catch { /* segue */ }
    return { miniMissions: [] };
  } catch {
    // Falha de rede: vazio MARCADO, que nunca pode ser gravado
    return { miniMissions: [], [NAO_CONFIAVEL]: true };
  }
}

async function saveGlobal(g, opts) {
  const o = opts || {};
  if (!globalOk(g)) {
    console.error("[ANTI-WIPE] global bloqueado: dados não confiáveis");
    throw new Error("dados-nao-confiaveis");
  }
  let cur = null;
  try {
    cur = await window.storage.get(GLOBAL_KEY, true);
  } catch {
    console.error("[ANTI-WIPE] global bloqueado: falha ao ler estado atual");
    throw new Error("sem-leitura-previa");
  }
  if (cur && cur.value) {
    let atual = null;
    try { atual = JSON.parse(cur.value); } catch { /* ilegível */ }
    if (atual && Array.isArray(atual.miniMissions)) {
      const antes = atual.miniMissions.length;
      const depois = (g.miniMissions || []).length;
      const revBanco = atual.rev || 0;
      const revBase = g.__revBase;
      if (!o.forcar && typeof revBase === "number" && revBanco !== revBase) {
        console.warn("[ANTI-WIPE] global: conflito de versão", revBanco, "vs", revBase);
        throw new Error("conflito-de-versao");
      }
      if (!o.permitirQueda) {
        if (antes > 0 && depois === 0) {
          console.error("[ANTI-WIPE] global bloqueado: apagaria todas as missões", antes, "→ 0");
          throw new Error("esvaziaria-global");
        }
        if (antes - depois > 1) {
          console.error("[ANTI-WIPE] global bloqueado: remoção em massa", antes, "→", depois);
          throw new Error("remocao-em-massa");
        }
      }
      await gravarSnapshotGlobal(cur.value, antes);
    }
  }
  const limpo = { ...g };
  delete limpo[NAO_CONFIAVEL];
  delete limpo.__revBase;
  limpo.rev = ((cur && cur.value && (() => { try { return JSON.parse(cur.value).rev || 0; } catch { return 0; } })()) || 0) + 1;
  limpo.savedAt = Date.now();
  await window.storage.set(GLOBAL_KEY, JSON.stringify(limpo), true);
}

// ---------- Cofre: snapshots rotativos por grupo ----------
// Mantém 6 fotografias do banco. Mesmo várias gravações ruins seguidas
// não conseguem apagar o histórico inteiro.
const SNAP_SLOTS = 6;
const snapKey = (track, i) => `${keyFor(track)}-snap-${i}`;
const snapMetaKey = (track) => `${keyFor(track)}-snapmeta`;

async function gravarSnapshot(track, valorAtual, qtdAlunos) {
  try {
    let meta = { next: 0, slots: [] };
    try {
      const m = await window.storage.get(snapMetaKey(track), true);
      if (m && m.value) meta = JSON.parse(m.value);
    } catch { /* primeira vez */ }
    const slot = (meta.next || 0) % SNAP_SLOTS;
    await window.storage.set(snapKey(track, slot), valorAtual, true);
    meta.slots = meta.slots || [];
    meta.slots[slot] = { ts: Date.now(), alunos: qtdAlunos };
    meta.next = (slot + 1) % SNAP_SLOTS;
    await window.storage.set(snapMetaKey(track), JSON.stringify(meta), true);
  } catch (e) { console.warn("[COFRE] falha ao gravar snapshot", e); }
}

// Procura, entre os snapshots, o melhor (mais alunos; empate = mais recente)
async function melhorSnapshot(track) {
  let meta = null;
  try {
    const m = await window.storage.get(snapMetaKey(track), true);
    if (m && m.value) meta = JSON.parse(m.value);
  } catch { /* sem meta */ }
  let melhor = null;
  for (let i = 0; i < SNAP_SLOTS; i++) {
    try {
      const r = await window.storage.get(snapKey(track, i), true);
      if (!r || !r.value) continue;
      const d = JSON.parse(r.value);
      if (!d || !Array.isArray(d.students)) continue;
      const info = (meta && meta.slots && meta.slots[i]) || {};
      const cand = { data: d, alunos: d.students.length, ts: info.ts || 0, slot: i };
      if (!melhor || cand.alunos > melhor.alunos || (cand.alunos === melhor.alunos && cand.ts > melhor.ts)) melhor = cand;
    } catch { /* slot ilegível, tenta o próximo */ }
  }
  // Compatibilidade com o backup antigo de slot único
  try {
    const b = await window.storage.get(keyFor(track) + "-bak", true);
    if (b && b.value) {
      const d = JSON.parse(b.value);
      if (d && Array.isArray(d.students)) {
        const cand = { data: d, alunos: d.students.length, ts: 0, slot: "bak" };
        if (!melhor || cand.alunos > melhor.alunos) melhor = cand;
      }
    }
  } catch { /* ok */ }
  return melhor;
}

async function saveData(track, data, opts) {
  const o = opts || {};
  // Trava 1: jamais gravar algo que não veio de uma leitura confiável
  if (!leituraOk(data)) {
    console.error("[ANTI-WIPE] bloqueado: dados não confiáveis", track);
    throw new Error("dados-nao-confiaveis");
  }
  let cur = null;
  try {
    cur = await window.storage.get(keyFor(track), true);
  } catch {
    console.error("[ANTI-WIPE] bloqueado: falha ao ler estado atual", track);
    throw new Error("sem-leitura-previa");
  }

  if (cur && cur.value) {
    let atual = null;
    try { atual = JSON.parse(cur.value); } catch { /* ilegível */ }
    if (atual && Array.isArray(atual.students)) {
      const antes = atual.students.length;
      const depois = (data.students || []).length;

      // Trava 2: controle de revisão — detecta gravação de aba desatualizada
      // (outra aba/aparelho gravou entre a nossa leitura e esta escrita)
      const revBanco = atual.rev || 0;
      const revBase = data.__revBase;
      if (!o.forcar && typeof revBase === "number" && revBanco !== revBase) {
        console.warn("[ANTI-WIPE] conflito de versão", track, "banco:", revBanco, "aba:", revBase);
        throw new Error("conflito-de-versao");
      }

      // Trava 3: nunca esvaziar nem remover em massa
      if (!o.permitirQueda) {
        if (antes > 0 && depois === 0) {
          console.error("[ANTI-WIPE] bloqueado: esvaziaria o grupo", track, antes, "→ 0");
          throw new Error("esvaziaria-grupo");
        }
        if (antes - depois > 1) {
          console.error("[ANTI-WIPE] bloqueado: remoção em massa", track, antes, "→", depois);
          throw new Error("remocao-em-massa");
        }
      }
      await gravarSnapshot(track, cur.value, antes);
    }
  }

  const limpo = { ...data };
  delete limpo[NAO_CONFIAVEL];
  delete limpo.__revBase;
  limpo.rev = ((cur && cur.value && (() => { try { return JSON.parse(cur.value).rev || 0; } catch { return 0; } })()) || 0) + 1;
  limpo.savedAt = Date.now();
  await window.storage.set(keyFor(track), JSON.stringify(limpo), true);
}
async function loadTrackPref() {
  try { const r = await window.storage.get(TRACK_PREF_KEY, false); return r ? r.value : null; } catch { return null; }
}
async function saveTrackPref(t) {
  try { await window.storage.set(TRACK_PREF_KEY, t, false); } catch { /* ok */ }
}
// ---------- Registro de uso (chave separada: nunca toca nos dados dos alunos) ----------
const USO_KEY = `${KEY_BASE}-uso`;

async function loadUso() {
  try {
    const r = await window.storage.get(USO_KEY, true);
    if (r && r.value) {
      const u = JSON.parse(r.value);
      if (u && typeof u === "object") return u;
    }
  } catch { /* sem registro ainda */ }
  return {};
}

// Grava o "ping" de uma pessoa. Nunca apaga o histórico de ninguém:
// só acrescenta/atualiza a entrada dela.
async function registrarUso(sid, nome, track, tela, cartelaDe) {
  if (!sid) return;
  try {
    const atual = await loadUso();
    const agora = Date.now();
    const e = atual[sid] || { nome, track, sessoes: 0, minutos: 0, telas: {}, visitas: {}, primeiro: agora, ultimo: 0 };
    e.nome = nome || e.nome;
    e.track = track || e.track;
    // Sessão nova quando ficou mais de 30 min sem aparecer
    const gap = agora - (e.ultimo || 0);
    if (gap > 30 * 60000) e.sessoes = (e.sessoes || 0) + 1;
    else e.minutos = Math.round(((e.minutos || 0) + gap / 60000) * 10) / 10;
    if (tela) e.telas[tela] = (e.telas[tela] || 0) + 1;
    // Se está numa cartela que não é a dele, registra QUAL colega foi visitada
    if (cartelaDe) {
      if (!e.visitas) e.visitas = {};
      e.visitas[cartelaDe] = (e.visitas[cartelaDe] || 0) + 1;
    }
    e.ultimo = agora;
    atual[sid] = e;
    await window.storage.set(USO_KEY, JSON.stringify(atual), true);
  } catch { /* registro de uso é melhor esforço — nunca atrapalha o app */ }
}

// ---------- Entrega de prêmios (chave separada: nunca toca nos dados dos alunos) ----------
const ENTREGAS_KEY = `${KEY_BASE}-entregas`;

async function loadEntregas() {
  try {
    const r = await window.storage.get(ENTREGAS_KEY, true);
    if (r && r.value) {
      const u = JSON.parse(r.value);
      if (u && typeof u === "object") return u;
    }
  } catch { /* sem registro ainda */ }
  return {};
}

async function marcarEntrega(chave, valor) {
  try {
    const atual = await loadEntregas();
    if (valor) atual[chave] = { ts: Date.now() };
    else delete atual[chave];
    await window.storage.set(ENTREGAS_KEY, JSON.stringify(atual), true);
    return atual;
  } catch { return null; }
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
  const [form, setForm] = useState({ date: todayStr(), slot: "", instructor: "" });
  const [qform, setQform] = useState({ studentId: "", date: todayStr(), slot: "", instructor: "" });
  const [qsaved, setQsaved] = useState(false);
  const [gform, setGform] = useState({ name: "", date: todayStr(), slot: "", kind: "novo" });
  const [gErr, setGErr] = useState("");
  const [gSaved, setGSaved] = useState(false);
  const [detailMission, setDetailMission] = useState(null);
  const [showAllHist, setShowAllHist] = useState(false);
  const [showAllRank, setShowAllRank] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [mm, setMm] = useState({ name: "", startDT: dtNowLocal(), durMin: 30, desc: "", prize: "", qty: 1, mode: "manual", slots: [], answersText: "", optionsText: "", correct: "", tries: 3, scope: "todos", openMode: "fila", aulaDate: todayStr(), aulaSlot: "", grupo: "ilimitado" });
  const [qzAns, setQzAns] = useState({});
  const [qzMsg, setQzMsg] = useState({});
  const [mmMsg, setMmMsg] = useState("");
  const [miniAward, setMiniAward] = useState({});
  const [showAllMini, setShowAllMini] = useState(false);
  const [confirmDel, setConfirmDel] = useState("");
  const [addOpen, setAddOpen] = useState("");
  const [syncMsg, setSyncMsg] = useState("");
  const avisar = (m) => { setSyncMsg(m); setTimeout(() => setSyncMsg(""), 6000); };
  const [newPhone, setNewPhone] = useState("");
  const [recMode, setRecMode] = useState(false);
  const [rcName, setRcName] = useState("");
  const [rcPhone, setRcPhone] = useState("");
  const [rcPass, setRcPass] = useState("");
  const [rcErr, setRcErr] = useState("");
  const [rcStep, setRcStep] = useState(1);
  const [fixPhone, setFixPhone] = useState("");
  const [editG, setEditG] = useState(null);
  const [editP, setEditP] = useState(null);
  const [trackCounts, setTrackCounts] = useState({});
  const [showCad, setShowCad] = useState(false);
  const [cadQ, setCadQ] = useState("");
  const [editC, setEditC] = useState(null);
  const [expC, setExpC] = useState(null);
  const [spy, setSpy] = useState(false);
  const [editH, setEditH] = useState(null);
  const [selfEditH, setSelfEditH] = useState(null);
  const [editN, setEditN] = useState(null);
  const [gData, setGData] = useState({ miniMissions: [] });
  const [miniPage, setMiniPage] = useState(null);
  const [photos, setPhotos] = useState({});
  const [showPerfil, setShowPerfil] = useState(false);
  const [rankQ, setRankQ] = useState("");
  const [showMM, setShowMM] = useState(false);
  const [showRel, setShowRel] = useState(false);
  const [showWins, setShowWins] = useState(false);
  const [novoCad, setNovoCad] = useState(null);
  const [premiosTrack, setPremiosTrack] = useState(null);
  const [showUso, setShowUso] = useState(false);
  const [usoData, setUsoData] = useState(null);
  const [usoLoading, setUsoLoading] = useState(false);
  const [usoOrdem, setUsoOrdem] = useState("recente");
  const [filtroDesemp, setFiltroDesemp] = useState("quase");
  const [buscaDesemp, setBuscaDesemp] = useState("");
  const [showPremios, setShowPremios] = useState(false);
  const [premiosData, setPremiosData] = useState(null);
  const [premiosLoading, setPremiosLoading] = useState(false);
  const [entregasData, setEntregasData] = useState(null);
  const [premiosExpanded, setPremiosExpanded] = useState(null);
  const [confirmDelP, setConfirmDelP] = useState(null);
  const [impRes, setImpRes] = useState(null);
  const bootView = useRef(false);
  const [obsDraft, setObsDraft] = useState("");
  const [allData, setAllData] = useState({});
  const [showPend, setShowPend] = useState(false);
  const [showEntry, setShowEntry] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [confirmRefuse, setConfirmRefuse] = useState(null);
  const [saved, setSaved] = useState(false);
  const [recErr, setRecErr] = useState("");
  const [qErr, setQErr] = useState("");

  // Arrastar pra baixo no topo da página → recarrega
  const [puxando, setPuxando] = useState(0);
  const puxandoRef = useRef(0);
  useEffect(() => { puxandoRef.current = puxando; }, [puxando]);
  useEffect(() => {
    let y0 = null;
    let ativo = false;
    const inicio = (e) => {
      if (window.scrollY > 4) { y0 = null; return; }
      y0 = e.touches[0].clientY;
      ativo = true;
    };
    const mover = (e) => {
      if (!ativo || y0 === null) return;
      const dy = e.touches[0].clientY - y0;
      if (dy > 0 && window.scrollY <= 4) {
        setPuxando(Math.min(dy, 110));
      } else {
        setPuxando(0);
      }
    };
    const soltar = () => {
      if (puxandoRef.current >= 70) window.location.reload();
      setPuxando(0);
      ativo = false; y0 = null;
    };
    window.addEventListener("touchstart", inicio, { passive: true });
    window.addEventListener("touchmove", mover, { passive: true });
    window.addEventListener("touchend", soltar, { passive: true });
    return () => {
      window.removeEventListener("touchstart", inicio);
      window.removeEventListener("touchmove", mover);
      window.removeEventListener("touchend", soltar);
    };
  }, []);

  // Registra o uso a cada 2 minutos enquanto a cartela está aberta.
  // Fica numa chave separada — não encosta nos dados dos alunos.
  const telaAtual = () =>
    showPend ? "pendencias" : showCad ? "cadastros" : showMM ? "relampago"
    : showRel ? "relatorio" : showWins ? "desempenho" : showPremios ? "premios"
    : showManual ? "manual" : showUso ? "uso" : view ? (spy ? "colega" : "cartela") : "inicio";

  useEffect(() => {
    if (!view || admin) return;
    const s = (data && data.students) ? data.students.find((x) => x.id === view) : null;
    if (!s) return;
    // Quem registra é sempre QUEM ESTÁ NAVEGANDO, não a dona da cartela visitada.
    const meuId = myIds[track];
    if (spy && !meuId) return; // visitante sem identidade neste aparelho: não registra em ninguém
    const quemId = spy ? meuId : view;
    const quemNome = spy
      ? ((((data && data.students) || []).find((x) => x.id === meuId) || {}).name || "?")
      : s.name;
    const cartelaDe = spy ? s.name : null;
    registrarUso(quemId, quemNome, track, telaAtual(), cartelaDe);
    const t = setInterval(() => {
      registrarUso(quemId, quemNome, track, telaAtual(), cartelaDe);
    }, 120000);
    return () => clearInterval(t);
  }, [view, admin, track, spy, myIds]);

  // Liga o aviso de auto-restauração à interface
  useEffect(() => {
    onAutoRestore = (tid, de, para) => {
      if (typeof tid === "string" && tid.endsWith(":v1")) {
        const t0 = tid.replace(":v1", "");
        const n0 = (TRACKS.find((t) => t.id === t0) || {}).short || t0;
        avisar(`🔁 ${n0}: ${para} aluno(s) resgatado(s) da versão antiga do banco — já aparecem na lista.`);
        return;
      }
      if (typeof tid === "string" && tid.endsWith(":ids")) {
        const t0 = tid.replace(":ids", "");
        const n0 = (TRACKS.find((t) => t.id === t0) || {}).short || t0;
        avisar(`🔧 ${n0}: ${para} cadastro(s) com código repetido foram corrigidos — quem estava oculto voltou a aparecer.`);
        return;
      }
      const nome = tid === "global" ? "missões relâmpago" : ((TRACKS.find((t) => t.id === tid) || {}).short || tid);
      avisar(`🛡️ Recuperação automática em ${nome}: ${de} → ${para} restaurados do cofre.`);
    };
    return () => { onAutoRestore = null; };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const flag = await loadAdminFlag();
        let ehAdmin = false;
        if (flag && flag.includes("|")) {
          const [fu, fp] = flag.split("|");
          if (ADMINS[fu] && ADMINS[fu] === fp) { setAdmin(true); setAdminUser(fu); ehAdmin = true; }
        }
        if (!ehAdmin) {
          const saved = await loadTrackPref();
          if (saved && TRACKS.some((t) => t.id === saved)) setTrack(saved);
        }
      } catch (e) {
        console.error("[BOOT] falha ao carregar preferências:", e);
      } finally {
        // Aconteça o que acontecer, a tela SAI do "Carregando…"
        setTrackLoaded(true);
      }
    })();
    // Rede de segurança: se em 8s nada resolveu, libera a tela mesmo assim
    const destravar = setTimeout(() => setTrackLoaded(true), 8000);
    loadUnlocks().then(setUnlocks).catch(() => {});
    loadMyIds().then(setMyIds).catch(() => {});
    return () => clearTimeout(destravar);
  }, []);

  useEffect(() => {
    if (!track) return;
    MISSIONS = TRACK_MISSIONS[track];
    let alive = true;
    (async () => {
      const d = await loadData(track);
      const before = JSON.stringify(d.winners || null);
      captureWinners(d);
      // Só regrava os winners se a leitura veio íntegra E há alunos.
      // Se a rede falhou, NUNCA gravar — era exatamente aqui que o banco era zerado.
      if (leituraOk(d) && (d.students || []).length > 0 && JSON.stringify(d.winners) !== before) {
        try { await saveData(track, d); } catch { /* segue com o estado local */ }
      }
      if (alive && leituraOk(d)) setData(d);
      const g = await loadGlobal();
      if (alive) setGData(g);
      try {
        let rf = await window.storage.get(fotosKey(track), true);
        if (!rf || !rf.value) {
          try {
            const oldF = await window.storage.get(fotosKeyV1(track), true);
            if (oldF && oldF.value) {
              await window.storage.set(fotosKey(track), oldF.value, true);
              rf = oldF;
            }
          } catch { /* segue */ }
        }
        if (alive) setPhotos(rf && rf.value ? JSON.parse(rf.value) : {});
      } catch { if (alive) setPhotos({}); }
    })();
    const t = setInterval(async () => {
      try {
        const fresh = await loadData(track);
        // Leitura falhou? mantém a tela como está — não mostra lista vazia falsa
        if (!leituraOk(fresh)) return;
        captureWinners(fresh);
        if (alive) setData(fresh);
        const g = await loadGlobal();
        if (alive) setGData(g);
      } catch { /* mantém o estado atual */ }
    }, 30000);
    return () => { alive = false; clearInterval(t); };
  }, [track]);

  useEffect(() => {
    if (!data || view || admin || spy || bootView.current) return;
    bootView.current = true;
    const sid = myIds[track];
    const s = sid ? data.students.find((x) => x.id === sid) : null;
    if (s && s.pass && unlocks[s.id] === s.pass) {
      setView(s.id); setDetailMission(null); setShowAllHist(false); setConfirmRemove(false);
    }
  }, [data]);

  useEffect(() => {
    if (track) return;
    let alive = true;
    (async () => {
      const out = {};
      for (const t of TRACKS) {
        try {
          const d = await loadData(t.id);
          // Leitura falhou? mostra "—" em vez de "0 participantes" (que assusta e engana)
          out[t.id] = leituraOk(d) ? (d.students || []).filter((s) => s.approved !== false).length : null;
        } catch { out[t.id] = null; }
      }
      if (alive) setTrackCounts(out);
    })();
    return () => { alive = false; };
  }, [track]);

  useEffect(() => {
    if (!admin) return;
    let alive = true;
    const loadAll = async () => {
      const out = {};
      let algumaFalha = false;
      for (const t of TRACKS) {
        try {
          const d = await loadData(t.id);
          if (leituraOk(d)) out[t.id] = d;
          else { algumaFalha = true; out[t.id] = null; }
        } catch { algumaFalha = true; out[t.id] = null; }
      }
      // Mantém o último estado bom dos grupos que falharam, em vez de mostrar vazio
      if (alive) setAllData((prev) => {
        if (!algumaFalha) return out;
        const merged = { ...out };
        TRACKS.forEach((t) => { if (!merged[t.id] && prev && prev[t.id]) merged[t.id] = prev[t.id]; });
        return merged;
      });
      try {
        const g = await loadGlobal();
        if (alive) setGData(g);
      } catch { /* mantém */ }
    };
    loadAll();
    const iv = setInterval(loadAll, 30000);
    return () => { alive = false; clearInterval(iv); };
  }, [admin]);

  const delWin = (kind, key, sid) => {
    mutate((d) => {
      if (!d.winners) return;
      d.winners.excluded = d.winners.excluded || {};
      d.winners.excluded[`${kind}:${key}:${sid}`] = true;
      if (kind === "m") {
        if (d.winners.missionQueues) {
          d.winners.missionQueues[key] = (d.winners.missionQueues[key] || []).filter((e) => e.id !== sid);
        }
        if (d.winners.missions && d.winners.missions[key] && d.winners.missions[key].id === sid) {
          const q = (d.winners.missionQueues && d.winners.missionQueues[key]) || [];
          d.winners.missions[key] = q[0] ? { ...q[0] } : null;
        }
      } else {
        if (d.winners.placements) {
          d.winners.placements[key] = (d.winners.placements[key] || []).filter((e) => e.id !== sid);
        }
        if (d.winners.patterns && d.winners.patterns[key] && d.winners.patterns[key].id === sid) {
          const l = (d.winners.placements && d.winners.placements[key]) || [];
          d.winners.patterns[key] = l[0] ? { ...l[0] } : null;
        }
      }
    });
  };

  const addWinManual = (kind, key, sid) => {
    mutate((d) => {
      const s = d.students.find((x) => x.id === sid);
      if (!s) return;
      if (!d.winners) d.winners = { missions: {}, patterns: {}, placements: {}, missionQueues: {} };
      if (d.winners.excluded) delete d.winners.excluded[`${kind}:${key}:${sid}`];
      const entry = { id: s.id, name: s.name, date: todayStr(), reg: Date.now(), ts: Date.now() };
      if (kind === "m") {
        if (!d.winners.missionQueues) d.winners.missionQueues = {};
        const q = d.winners.missionQueues[key] = d.winners.missionQueues[key] || [];
        if (!q.some((e) => e.id === sid)) q.push(entry);
        if (!d.winners.missions[key]) d.winners.missions[key] = { ...entry };
      } else {
        if (!d.winners.placements) d.winners.placements = {};
        const l = d.winners.placements[key] = d.winners.placements[key] || [];
        if (!l.some((e) => e.id === sid)) l.push(entry);
        if (!d.winners.patterns) d.winners.patterns = {};
        if (!d.winners.patterns[key]) d.winners.patterns[key] = { ...entry };
      }
    });
    setAddOpen("");
  };

  const mutateGlobal = (fn) => {
    (async () => {
      for (let tentativa = 1; tentativa <= 4; tentativa++) {
        let base = null;
        try { base = await loadGlobal(); } catch { base = null; }
        // Sem leitura íntegra NÃO se escreve nada — mesma regra de ouro
        if (!globalOk(base)) {
          avisar("⚠️ Sem conexão com o banco — a ação NÃO foi salva. Tente novamente.");
          return;
        }
        const next = JSON.parse(JSON.stringify(base));
        next.__revBase = base.rev || 0;
        try { fn(next); } catch (e) { console.error(e); return; }
        try {
          await saveGlobal(next);
          delete next.__revBase;
          setGData(next);
          return;
        } catch (e) {
          if (e && e.message === "conflito-de-versao" && tentativa < 4) {
            await new Promise((r) => setTimeout(r, 150 * tentativa));
            continue;
          }
          if (e && (e.message === "esvaziaria-global" || e.message === "remocao-em-massa")) {
            avisar("🛡️ Ação bloqueada: ela apagaria missões em massa. Nada foi alterado.");
            return;
          }
          avisar("⚠️ Falha ao salvar — a ação NÃO foi gravada. Tente novamente.");
          return;
        }
      }
      avisar("⚠️ O app está muito concorrido agora. Tente de novo em alguns segundos.");
    })();
  };
  const doMini = (x) => (x && x.scope === "todos" || (x && x.scope === "aula") ? mutateGlobal : mutate);
  const salvarFoto = async (sid, dataURL) => {
    let base = null;
    let existia = false;
    try {
      const r = await window.storage.get(fotosKey(track), true);
      if (r && r.value) {
        const parsed = JSON.parse(r.value);
        if (parsed && typeof parsed === "object") { base = parsed; existia = true; }
      } else {
        base = {}; // chave ainda não existe: primeiro upload do grupo
      }
    } catch {
      avisar("⚠️ Sem conexão — a foto NÃO foi salva. Tente novamente.");
      return;
    }
    if (!base) {
      avisar("⚠️ Não foi possível ler as fotos — nada foi alterado. Tente novamente.");
      return;
    }
    const antes = Object.keys(base).length;
    if (dataURL) base[sid] = dataURL; else delete base[sid];
    const depois = Object.keys(base).length;
    // Trava: só pode diminuir 1 (a remoção pedida), nunca mais que isso
    if (existia && antes - depois > 1) {
      console.error("[ANTI-WIPE] fotos: bloqueado", antes, "→", depois);
      avisar("🛡️ Ação bloqueada por segurança — as fotos não foram alteradas.");
      return;
    }
    try {
      // Guarda a versão anterior antes de sobrescrever
      if (existia && antes > 0) {
        try { await window.storage.set(fotosKey(track) + "-bak", JSON.stringify(base), true); } catch { /* melhor esforço */ }
      }
      await window.storage.set(fotosKey(track), JSON.stringify(base), true);
      setPhotos(base);
      avisar(dataURL ? "📸 Foto atualizada!" : "🗑 Foto removida.");
    } catch {
      avisar("⚠️ Falha ao salvar a foto. Tente novamente.");
    }
  };
  const onFotoFile = (sid, file) => {
    if (!file) return;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const M = 240;
      const sc = Math.min(1, M / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * sc));
      const h = Math.max(1, Math.round(img.height * sc));
      const cv = document.createElement("canvas");
      cv.width = w; cv.height = h;
      cv.getContext("2d").drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      salvarFoto(sid, cv.toDataURL("image/jpeg", 0.72));
    };
    img.onerror = () => { URL.revokeObjectURL(url); avisar("⚠️ Não consegui ler essa imagem."); };
    img.src = url;
  };
  const alunosDeTodos = () => {
    const out = [];
    TRACKS.forEach((t) => {
      const d2 = allData[t.id];
      if (d2) d2.students.forEach((s) => out.push(s));
    });
    return out;
  };

  // Aplica uma alteração de forma segura:
  // lê fresco → aplica → grava conferindo a revisão. Se outra aba gravou no
  // meio do caminho, refaz automaticamente sobre os dados novos (até 4 vezes).
  const aplicarComSeguranca = async (tid, fn, aoConcluir) => {
    for (let tentativa = 1; tentativa <= 4; tentativa++) {
      let base = null;
      try {
        const res = await window.storage.get(keyFor(tid), true);
        base = res && res.value ? JSON.parse(res.value) : null;
      } catch { base = null; }

      // Sem leitura íntegra do banco NÃO se escreve nada — regra de ouro
      if (!base || !Array.isArray(base.students)) {
        avisar("⚠️ Sem conexão com o banco — a ação NÃO foi salva. Tente novamente.");
        return;
      }

      const next = JSON.parse(JSON.stringify(base));
      next.__revBase = base.rev || 0;
      try { fn(next); } catch (e) { console.error(e); return; }

      if ((base.students || []).length - (next.students || []).length > 1) {
        avisar("⚠️ Ação bloqueada por segurança: removeria vários alunos de uma vez.");
        return;
      }

      const prevM = MISSIONS;
      MISSIONS = TRACK_MISSIONS[tid];
      captureWinners(next);
      MISSIONS = prevM;

      try {
        await saveData(tid, next);
        delete next.__revBase;
        if (aoConcluir) aoConcluir(next);
        return;
      } catch (e) {
        if (e && e.message === "conflito-de-versao" && tentativa < 4) {
          // Outra aba gravou primeiro: espera um instante e refaz sobre o dado novo
          await new Promise((r) => setTimeout(r, 150 * tentativa));
          continue;
        }
        if (e && (e.message === "esvaziaria-grupo" || e.message === "remocao-em-massa")) {
          avisar("🛡️ Ação bloqueada: ela apagaria alunos em massa. Nada foi alterado.");
          return;
        }
        avisar("⚠️ Falha ao salvar — a ação NÃO foi gravada. Tente novamente.");
        return;
      }
    }
    avisar("⚠️ O app está muito concorrido agora. Tente de novo em alguns segundos.");
  };

  const mutateTrack = (tid, fn) => {
    aplicarComSeguranca(tid, fn, (next) => {
      setAllData((a) => ({ ...a, [tid]: next }));
      if (tid === track) setData(next);
    });
  };

  const mutate = (fn) => {
    aplicarComSeguranca(track, fn, (next) => setData(next));
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

  const fonts = (
    <>
      <style>{"@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap'); html, body { overscroll-behavior-y: none; } body { padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom); }"}</style>
      {puxando > 0 && (
        <div style={{ position: "fixed", top: Math.min(puxando * 0.5, 46), left: "50%", transform: "translateX(-50%)", zIndex: 9997, background: C.panel, border: `1px solid ${C.line}`, color: puxando >= 70 ? C.ok : C.mut, padding: "6px 14px", borderRadius: 999, fontSize: 11.5, fontWeight: 700, pointerEvents: "none", transition: "color .15s" }}>
          {puxando >= 70 ? "↻ solte para atualizar" : "↓ puxe para atualizar"}
        </div>
      )}
      {syncMsg && (
        <div style={{ position: "fixed", top: 10, left: "50%", transform: "translateX(-50%)", zIndex: 9999, background: "#B15560", color: "#fff", padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 700, maxWidth: "92%", textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,.5)" }}>
          {syncMsg}
        </div>
      )}
    </>
  );

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
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ "--panel": "rgba(255,255,255,0.05)", "--panelSoft": "rgba(255,255,255,0.09)", "--line": "rgba(255,255,255,0.14)", background: C.bg, color: C.mut, fontFamily: "'Montserrat', sans-serif" }}>
        <div style={{ fontSize: 15 }}>Carregando…</div>
        <div className="text-center" style={{ fontSize: 12, marginTop: 10, maxWidth: 300, lineHeight: 1.6, opacity: 0.7 }}>
          Se demorar mais que alguns segundos, sua conexão pode estar instável.
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={() => window.location.reload()} className="rounded-lg px-4 py-2"
            style={{ background: C.panel, border: `1px solid ${C.line}`, color: C.cream, fontSize: 12.5, fontWeight: 700 }}>
            ↻ Recarregar
          </button>
          <button onClick={() => setTrackLoaded(true)} className="rounded-lg px-4 py-2"
            style={{ background: "transparent", border: `1px solid ${C.line}`, color: C.mut, fontSize: 12.5 }}>
            Continuar assim mesmo
          </button>
        </div>
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
    const restaurarBackup = async (tid) => {
      try {
        const melhor = await melhorSnapshot(tid);
        if (!melhor) { avisar("Não há backup disponível para este grupo ainda."); return; }
        // Lê o estado atual para não descartar quem entrou depois do snapshot
        let atual = null;
        try {
          const r = await window.storage.get(keyFor(tid), true);
          if (r && r.value) atual = JSON.parse(r.value);
        } catch { /* segue só com o snapshot */ }
        const d = JSON.parse(JSON.stringify(melhor.data));
        let novos = 0;
        if (atual && Array.isArray(atual.students)) {
          const ids = new Set(d.students.map((s) => s.id));
          atual.students.forEach((s) => { if (s && !ids.has(s.id)) { d.students.push(s); novos++; } });
        }
        d.rev = ((atual && atual.rev) || 0) + 1;
        d.savedAt = Date.now();
        await window.storage.set(keyFor(tid), JSON.stringify(d), true);
        setAllData((a) => ({ ...a, [tid]: d }));
        if (tid === track) setData(d);
        avisar(`↩️ Restaurado: ${melhor.alunos} alunos do cofre${novos ? ` + ${novos} novo(s) preservado(s)` : ""}.`);
      } catch {
        avisar("⚠️ Falha ao restaurar. Tente novamente.");
      }
    };
    const validarGrupo = (tid) => {
      mutateTrack(tid, (d) => {
        d.students.forEach((s) => {
          (s.records || []).forEach((r) => { if (r.status === "pending" && !r.alert) r.status = "ok"; });
          (s.guests || []).forEach((g) => { if (g.status === "pending" && !g.alert) g.status = "ok"; });
        });
      });
    };
    const hNorm = (s) => {
      const d = String(s || "").replace(/[^0-9]/g, "");
      if (d.length < 3 || d.length > 4) return "";
      const hh = (d.length === 3 ? "0" + d[0] : d.slice(0, 2));
      return hh + ":" + d.slice(-2);
    };
    const dNorm = (s) => {
      const t = String(s || "").trim();
      let m = t.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (m) return `${m[1]}-${m[2]}-${m[3]}`;
      m = t.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
      if (m) {
        const ano = m[3] ? (m[3].length === 2 ? "20" + m[3] : m[3]) : "2026";
        return `${ano}-${String(m[2]).padStart(2, "0")}-${String(m[1]).padStart(2, "0")}`;
      }
      return "";
    };
    const nomeBate = (a, b) => {
      const x = norm(a), y = norm(b);
      if (!x || !y) return false;
      return x === y || x.includes(y) || y.includes(x);
    };
    const analisarArquivo = (file) => {
      if (!file) return;
      const fr = new FileReader();
      fr.onload = () => {
        let txt = "";
        try {
          const buf = new Uint8Array(fr.result);
          txt = new TextDecoder("utf-8", { fatal: false }).decode(buf);
          if (txt.includes("\uFFFD")) txt = new TextDecoder("iso-8859-1").decode(buf);
        } catch { setImpRes({ erro: "Não consegui ler o arquivo." }); return; }
        const linhas = txt.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        const presencas = [];
        linhas.forEach((l) => {
          const low = norm(l);
          if (low.includes("nome") && (low.includes("hora") || low.includes("data") || low.includes("telefone"))) return;
          const sep = (l.match(/;/g) || []).length >= (l.match(/,/g) || []).length ? ";" : (l.includes("\t") ? "\t" : ",");
          const cells = l.split(sep).map((c) => c.replace(/^"|"$/g, "").trim());
          let nome = "", fone = "", dataA = "", hora = "";
          cells.forEach((c) => {
            if (!c) return;
            if (!hora && hNorm(c) && /\d{1,2}[:h]?\d{2}/.test(c) && c.replace(/[^0-9]/g, "").length <= 4) { hora = hNorm(c); return; }
            if (!dataA && dNorm(c) && /\d/.test(c) && (c.includes("/") || /\d{4}-\d{2}/.test(c))) { dataA = dNorm(c); return; }
            const digs = c.replace(/[^0-9]/g, "");
            if (!fone && digs.length >= 8 && digs.length <= 14 && digs.length >= c.replace(/[^a-zA-ZÀ-ú]/g, "").length) { fone = c; return; }
            if (!nome && /[a-zA-ZÀ-ú]{2,}/.test(c)) { nome = c; return; }
          });
          if ((nome || fone) && dataA && hora) presencas.push({ nome, fone, dataA, hora });
        });
        if (!presencas.length) { setImpRes({ erro: "Nenhuma linha válida encontrada. O arquivo precisa ter colunas com Nome (ou Telefone), Data e Horário." }); return; }
        const casos = [];
        TRACKS.forEach((t) => {
          const d = allData[t.id]; if (!d) return;
          d.students.forEach((s) => {
            (s.records || []).forEach((r) => {
              if (r.status !== "pending" || r.alert) return;
              const bate = presencas.some((pz) =>
                pz.dataA === r.date && pz.hora === r.slot &&
                ((pz.nome && nomeBate(pz.nome, s.name)) || (pz.fone && s.phone && phonesMatch(pz.fone, s.phone)))
              );
              if (bate) casos.push({ tid: t.id, sid: s.id, rid: r.id, nome: s.name, gr: t.short, data: r.date, slot: r.slot });
            });
          });
        });
        setImpRes({ presencas: presencas.length, casos });
      };
      fr.readAsArrayBuffer(file);
    };
    const aplicarImport = () => {
      if (!impRes || !impRes.casos || !impRes.casos.length) return;
      const porTid = {};
      impRes.casos.forEach((c) => { (porTid[c.tid] = porTid[c.tid] || []).push(c); });
      Object.entries(porTid).forEach(([tid, lista]) => {
        mutateTrack(tid, (d) => {
          lista.forEach((c) => {
            const s = d.students.find((x) => x.id === c.sid);
            const r = s && (s.records || []).find((x) => x.id === c.rid);
            if (r && r.status === "pending" && !r.alert) r.status = "ok";
          });
        });
      });
      avisar(`🤖 ${impRes.casos.length} check-in${impRes.casos.length === 1 ? "" : "s"} validado${impRes.casos.length === 1 ? "" : "s"} pelo arquivo!`);
      setImpRes(null);
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

          <div className="rounded-xl p-4 mb-4" style={{ background: C.panel, border: `1.5px solid ${C.ok}66` }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.25em", color: C.ok, textTransform: "uppercase", marginBottom: 4 }}>
              🤖 Validação automática
            </div>
            <div style={{ color: C.mut, fontSize: 11.5, lineHeight: 1.6, marginBottom: 10 }}>
              Importe o relatório de presenças do seu sistema (CSV com colunas <b style={{ color: C.cream }}>Nome; Telefone; Data; Horário</b> — em qualquer ordem).
              Eu caso cada linha com as aulas pendentes por <b style={{ color: C.cream }}>(nome OU telefone) + data + horário</b>, tolerando maiúsculas, acentos, sobrenome a mais/a menos, +55, símbolos e formatos de hora.
              Sinalizadas ⚠️ ficam de fora. Nada é gravado antes da sua confirmação.
            </div>
            {!impRes && (
              <label className="block w-full rounded-lg py-3 text-center font-bold" style={{ background: C.ok, color: C.bg, fontSize: 13, cursor: "pointer" }}>
                📂 Escolher arquivo do sistema (.csv)
                <input type="file" accept=".csv,.txt,text/csv" style={{ display: "none" }}
                  onChange={(e) => { analisarArquivo(e.target.files && e.target.files[0]); e.target.value = ""; }} />
              </label>
            )}
            {impRes && impRes.erro && (
              <div>
                <div className="rounded-lg px-3 py-2 mb-2" style={{ background: "#B1556022", border: "1px solid #B15560", color: "#E8A0A8", fontSize: 12 }}>{impRes.erro}</div>
                <button onClick={() => setImpRes(null)} className="rounded-lg px-3 py-1.5" style={{ color: C.mut, fontSize: 12, border: `1px solid ${C.line}` }}>tentar outro arquivo</button>
              </div>
            )}
            {impRes && !impRes.erro && (
              <div>
                <div style={{ color: C.cream, fontSize: 12.5, lineHeight: 1.6, marginBottom: 8 }}>
                  📄 {impRes.presencas} presença{impRes.presencas === 1 ? "" : "s"} no arquivo · <b style={{ color: C.ok }}>{impRes.casos.length} pendência{impRes.casos.length === 1 ? "" : "s"} casaram</b> e podem ser validadas:
                </div>
                <div className="flex flex-col gap-1 mb-2" style={{ maxHeight: 180, overflowY: "auto" }}>
                  {impRes.casos.map((c, i) => (
                    <div key={i} className="rounded px-2.5 py-1 flex items-center gap-2" style={{ background: C.panelSoft, fontSize: 11.5 }}>
                      <span className="flex-1 min-w-0 truncate" style={{ color: C.cream, fontWeight: 700 }}>{c.nome}</span>
                      <span className="shrink-0" style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.mut }}>{fmtBR(c.data)} {c.slot.replace(":", "h")} · {c.gr}</span>
                    </div>
                  ))}
                  {impRes.casos.length === 0 && <div style={{ color: C.mut, fontSize: 12 }}>Nenhuma pendência casou — confira datas e horários do arquivo.</div>}
                </div>
                <div className="flex gap-2">
                  {impRes.casos.length > 0 && (
                    <button onClick={aplicarImport} className="flex-1 rounded-lg py-2.5 font-bold" style={{ background: C.ok, color: C.bg, fontSize: 13 }}>
                      ✓ Validar {impRes.casos.length} agora
                    </button>
                  )}
                  <button onClick={() => setImpRes(null)} className="rounded-lg px-4" style={{ color: C.mut, fontSize: 12, border: `1px solid ${C.line}` }}>cancelar</button>
                </div>
              </div>
            )}
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
                {d && (
                  <div className="mt-2 flex items-center justify-between" style={{ fontSize: 11, color: C.mut }}>
                    <span>{d.students.length} aluno{d.students.length === 1 ? "" : "s"} cadastrado{d.students.length === 1 ? "" : "s"}</span>
                    {confirmDel === `bak:${t.id}` ? (
                      <span className="flex items-center gap-1">
                        <span style={{ color: "#C96A76", fontWeight: 700, fontSize: 10 }}>Substitui os dados atuais!</span>
                        <button onClick={() => { restaurarBackup(t.id); setConfirmDel(""); }} className="rounded px-1.5 py-0.5 font-bold" style={{ background: "#B15560", color: C.cream, fontSize: 10 }}>SIM</button>
                        <button onClick={() => setConfirmDel("")} className="rounded px-1.5 py-0.5" style={{ color: C.mut, fontSize: 10, border: `1px solid ${C.line}` }}>não</button>
                      </span>
                    ) : (
                      <button onClick={() => setConfirmDel(`bak:${t.id}`)} className="rounded px-2 py-0.5" style={{ color: C.oak, fontSize: 10.5, border: `1px dashed ${C.line}` }}>
                        🛡️ Restaurar do cofre
                      </button>
                    )}
                  </div>
                )}

                {cadastros.length > 0 && (
                  <div className="mt-3">
                    <div style={{ color: C.mut, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>⏳ Cadastros aguardando liberação</div>
                    <div className="flex flex-col gap-1">
                      {cadastros.map((s) => (
                        <div key={s.id} className="rounded-lg px-3 py-2 flex items-center gap-2" style={{ background: C.panelSoft, border: `1px dashed ${C.line}` }}>
                          <div className="flex-1 min-w-0">
                            <div className="truncate" style={{ color: C.cream, fontWeight: 700, fontSize: 13 }}>{s.name}</div>
                            {s.phone && (
                              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10.5, color: C.mut }}>📱 {fmtPhone(s.phone)}</div>
                            )}
                          </div>
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
                      {(() => {
                        const porData = {};
                        itens.forEach((o) => { (porData[o.it.date] = porData[o.it.date] || []).push(o); });
                        const datas = Object.keys(porData).sort((a, b) => (a < b ? 1 : -1));
                        return datas.map((dt) => (
                          <div key={dt} className="flex flex-col gap-1.5">
                            <div className="mt-1" style={{ fontFamily: "'DM Mono', monospace", fontSize: 10.5, letterSpacing: "0.15em", color: C.oak, textTransform: "uppercase" }}>
                              📅 {weekdayBR(dt)} {fmtBR(dt)} · {porData[dt].length}
                            </div>
                            {porData[dt].map(({ tipo, s, it }) => {
                        const editando = editP && editP.tid === t.id && editP.id === it.id;
                        const slotsEd = editando && editP.date && isWeekendDate(editP.date) ? WEEKEND_SLOTS : WEEKDAY_SLOTS;
                        return (
                        <div key={it.id} className="rounded-lg px-3 py-2" style={{ background: C.panelSoft, border: `1px solid ${it.alert ? "#B15560" : C.amber + "55"}` }}>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="truncate" style={{ color: C.cream, fontWeight: 700, fontSize: 13 }}>{s.name}</div>
                              {!editando && (
                                <div style={{ color: C.mut, fontSize: 11.5, fontFamily: "'DM Mono', monospace" }}>
                                  {tipo === "rec"
                                    ? `aula · ${fmtBR(it.date)} · ${it.slot.replace(":", "h")} · ${it.instructor}${it.correctedByStudent && !it.alert ? " · ✎ corrigido" : ""}`
                                    : `amigo · ${it.name} · ${fmtBR(it.date)} · ${it.slot.replace(":", "h")}`}
                                </div>
                              )}
                            </div>
                            {!editando && (
                              <button
                                onClick={() => mutateTrack(t.id, (d) => {
                                  const s2 = d.students.find((x) => x.id === s.id);
                                  if (!s2) return;
                                  const alvo = tipo === "rec"
                                    ? (s2.records || []).find((x) => x.id === it.id)
                                    : (s2.guests || []).find((x) => x.id === it.id);
                                  if (alvo) alvo.alert = !alvo.alert;
                                })}
                                className="shrink-0 rounded px-1" title={it.alert ? "Remover sinalização" : "Sinalizar incongruência (não valida, não apaga)"}
                                style={{ background: it.alert ? "#B15560" : "transparent", border: it.alert ? "none" : `1px solid ${C.line}`, borderRadius: 6, fontSize: 12, cursor: "pointer", padding: "2px 5px" }}
                              >⚠️</button>
                            )}
                            {tipo === "rec" && it.alert && s.phone && !editando && (
                              <a
                                href={`https://wa.me/55${normPhone(s.phone)}?text=${encodeURIComponent(`Oi ${s.name.split(" ")[0]}! Sua aula de ${fmtBR(it.date)} às ${it.slot.replace(":", "h")} está com informações incongruentes no nosso sistema. Dá uma olhadinha no seu painel do Desafio e corrige direto por lá — daí a gente valida rapidinho! 🙏`)}`}
                                target="_blank" rel="noreferrer"
                                className="shrink-0 rounded px-1" title="Avisar aluno pelo WhatsApp"
                                style={{ background: "transparent", border: `1px solid ${C.line}`, borderRadius: 6, fontSize: 12, textDecoration: "none", padding: "2px 5px", display: "inline-block" }}
                              >📲</a>
                            )}
                            {tipo === "rec" && !editando && (
                              <button
                                onClick={() => setEditP({ tid: t.id, sid: s.id, id: it.id, date: it.date, slot: it.slot, instructor: it.instructor })}
                                className="shrink-0 rounded px-1" title="Corrigir data/horário/professor"
                                style={{ background: "transparent", border: "none", fontSize: 13, cursor: "pointer", opacity: 0.8 }}
                              >✏️</button>
                            )}
                            {!editando && (
                              <button onClick={() => validarItem(t.id, s.id, tipo, it.id)} className="rounded px-2.5 py-1 font-bold shrink-0" style={{ background: C.ok, color: C.bg, fontSize: 12 }}>✓</button>
                            )}
                            {!editando && confirmDelP !== `pnd:${it.id}` && (
                              <button
                                onClick={() => setConfirmDelP(`pnd:${it.id}`)}
                                className="shrink-0" title="Apagar esta pendência"
                                style={{ background: "transparent", border: "none", color: C.mut, fontSize: 13, cursor: "pointer" }}
                              >✕</button>
                            )}
                            {!editando && confirmDelP === `pnd:${it.id}` && (
                              <div className="shrink-0 flex items-center gap-1">
                                <span style={{ color: "#C96A76", fontSize: 9, fontWeight: 700 }}>Apagar?</span>
                                <button
                                  onClick={() => {
                                    mutateTrack(t.id, (d) => {
                                      const s2 = d.students.find((x) => x.id === s.id);
                                      if (!s2) return;
                                      if (tipo === "rec") s2.records = (s2.records || []).filter((x) => x.id !== it.id);
                                      else s2.guests = (s2.guests || []).filter((x) => x.id !== it.id);
                                    });
                                    setConfirmDelP(null);
                                  }}
                                  className="rounded px-1.5 py-0.5 font-bold"
                                  style={{ background: "#B15560", color: C.cream, fontSize: 10 }}>SIM</button>
                                <button onClick={() => setConfirmDelP(null)} className="rounded px-1.5 py-0.5" style={{ color: C.mut, fontSize: 10, border: `1px solid ${C.line}` }}>não</button>
                              </div>
                            )}
                          </div>
                          {editando && (
                            <div className="mt-2 flex flex-col gap-1.5">
                              <div className="flex gap-1.5">
                                <input type="date" value={editP.date} min={DESAFIO_INICIO} max={todayStr()}
                                  onChange={(e) => {
                                    const nd = e.target.value;
                                    const vs = nd && isWeekendDate(nd) ? WEEKEND_SLOTS : WEEKDAY_SLOTS;
                                    setEditP({ ...editP, date: nd, slot: vs.includes(editP.slot) ? editP.slot : "" });
                                  }}
                                  className="flex-1 rounded px-2 py-1.5 outline-none"
                                  style={{ background: C.panel, border: `1px solid ${C.line}`, color: C.cream, fontSize: 12, colorScheme: "dark" }} />
                                <select value={editP.slot} onChange={(e) => setEditP({ ...editP, slot: e.target.value })}
                                  className="rounded px-2 py-1.5 outline-none"
                                  style={{ background: C.panel, border: `1px solid ${C.line}`, color: editP.slot ? C.cream : C.mut, fontSize: 12 }}>
                                  <option value="" disabled>— horário —</option>
                                  {slotsEd.map((sl) => <option key={sl} value={sl}>{sl.replace(":", "h")}</option>)}
                                </select>
                              </div>
                              <div className="flex gap-1.5">
                                <select value={editP.instructor} onChange={(e) => setEditP({ ...editP, instructor: e.target.value })}
                                  className="flex-1 rounded px-2 py-1.5 outline-none"
                                  style={{ background: C.panel, border: `1px solid ${C.line}`, color: C.cream, fontSize: 12 }}>
                                  {INSTRUCTORS.map((i) => <option key={i} value={i}>{i}</option>)}
                                </select>
                                <button
                                  onClick={() => {
                                    if (!editP.slot || !editP.date) { avisar("Escolha data e horário."); return; }
                                    mutateTrack(editP.tid, (d) => {
                                      const s4 = d.students.find((x) => x.id === editP.sid);
                                      const r4 = s4 && (s4.records || []).find((x) => x.id === editP.id);
                                      if (r4) { r4.date = editP.date; r4.slot = editP.slot; r4.instructor = editP.instructor; }
                                    });
                                    setEditP(null);
                                  }}
                                  className="rounded px-2.5 font-bold" style={{ background: C.ok, color: C.bg, fontSize: 12 }}>✓ salvar</button>
                                <button onClick={() => setEditP(null)} className="rounded px-2" style={{ color: C.mut, fontSize: 12, border: `1px solid ${C.line}` }}>✕</button>
                              </div>
                            </div>
                          )}
                        </div>
                        );
                      })}
                          </div>
                        ));
                      })()}
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

  // ---------- Conquistas (administração) ----------
  if (showWins && admin) {
    const PATL = { horiz: "Linha Horizontal", vert: "Linha Vertical", diag: "Diagonal", corners: "4 Cantos", conv: "4 Conversões", full: "Cartela Cheia", bpm: "Giro de 175 BPM" };
    const hoje = dayIndex(todayStr());

    // ---- Monta uma ficha por aluno, com tudo que os filtros precisam ----
    const fichas = [];
    const prevM = MISSIONS;
    TRACKS.forEach((t) => {
      const d = allData[t.id]; if (!d) return;
      MISSIONS = TRACK_MISSIONS[t.id];
      d.students.forEach((s) => {
        if (s.approved === false) return;
        const r = computeProgress(s);
        const recs = (s.records || []).filter((x) => x.status === "ok");
        const dias = [...new Set(recs.map((x) => x.date))].sort();
        const ultima = dias.length ? dias[dias.length - 1] : null;
        const semPedalar = ultima ? hoje - dayIndex(ultima) : null;
        const guestsOk = (s.guests || []).filter((g) => g.status === "ok");
        const faltando = [];
        MISSIONS.forEach((m) => {
          const rem = m.target - Math.min(r.p[m.id], m.target);
          if (rem === 1) faltando.push(m.name);
        });
        fichas.push({
          id: s.id, nome: s.name, phone: s.phone, grupo: t.short, trackId: t.id,
          aulas: recs.length, dias: dias.length, ultima, semPedalar,
          feitas: r.doneCount, faltando,
          quaseCartela: r.doneCount === 8,
          amigos: guestsOk.length,
          megafone: guestsOk.some((g) => g.kind === "novo"),
          semIncentivo: !!s.semIncentivo,
        });
      });
    });
    MISSIONS = prevM;

    // ---- Filtros disponíveis ----
    const FILTROS = [
      { id: "quase",   rot: "🔥 Falta 1",        desc: "A uma aula de completar uma missão",
        fn: (f) => f.faltando.length > 0 || f.quaseCartela },
      { id: "zero",    rot: "😴 Nunca pedalou",  desc: "Entrou no desafio mas não registrou nenhuma aula",
        fn: (f) => f.aulas === 0 },
      { id: "sumidos", rot: "👀 Sumidos 5d+",    desc: "Sem pedalar há 5 dias ou mais",
        fn: (f) => f.semPedalar !== null && f.semPedalar >= 5 },
      { id: "parados", rot: "⏳ Parados 3d+",    desc: "Sem pedalar há 3 dias ou mais",
        fn: (f) => f.semPedalar !== null && f.semPedalar >= 3 },
      { id: "megafone",rot: "📣 Trouxe amigo",   desc: "Já trouxe pelo menos um convidado novo",
        fn: (f) => f.megafone },
      { id: "semamigo",rot: "🤝 Sem convidado",  desc: "Ainda não trouxe ninguém",
        fn: (f) => f.amigos === 0 },
      { id: "fortes",  rot: "💪 Em alta",        desc: "Pedalou nos últimos 2 dias",
        fn: (f) => f.semPedalar !== null && f.semPedalar <= 1 },
      { id: "semtel",  rot: "📵 Sem telefone",   desc: "Cadastro sem WhatsApp — não dá para chamar por mensagem. Complete pelo menu Cadastros.",
        fn: (f) => !f.phone || !String(f.phone).trim() },
      { id: "todos",   rot: "👥 Todos",          desc: "Todos os participantes",
        fn: () => true },
    ];
    const filtroAtivo = FILTROS.find((x) => x.id === filtroDesemp) || FILTROS[0];
    const termo = buscaDesemp.trim().toLowerCase();
    const lista = fichas
      .filter(filtroAtivo.fn)
      .filter((f) => !termo || f.nome.toLowerCase().includes(termo))
      .sort((a, b) => {
        if (filtroDesemp === "sumidos" || filtroDesemp === "parados") return (b.semPedalar || 0) - (a.semPedalar || 0);
        if (filtroDesemp === "quase") return (b.quaseCartela ? 1 : 0) - (a.quaseCartela ? 1 : 0) || b.faltando.length - a.faltando.length;
        return a.nome.localeCompare(b.nome);
      });

    // ---- Mensagem sob medida para cada situação ----
    const msgPara = (f) => {
      const p1 = f.nome.split(" ")[0];
      if (f.aulas === 0)
        return `Oi ${p1}! 💙 Vi que você entrou no Desafio das Missões mas ainda não registrou nenhuma aula. Tá com alguma dificuldade pra usar o app, ou pra encaixar o horário? Me fala que a gente dá um jeito juntas — quero muito te ver na bike! 🚴‍♀️`;
      if (f.quaseCartela)
        return `${p1}!! 🤯 Você está com 8 de 9 missões concluídas. FALTA UMA pra cartela cheia! Bora fechar essa semana? Me diz qual dia você consegue vir que eu te ajudo a montar a estratégia. 🏆`;
      if (f.faltando.length > 0)
        return `Oi ${p1}! 🔥 Você está a UMA aula de completar ${f.faltando.length > 1 ? "as missões " + f.faltando.join(" e ") : "a missão " + f.faltando[0]}. Vamos marcar essa aula? Me fala o melhor dia que eu te encaixo! 🚴‍♀️`;
      if (f.semPedalar !== null && f.semPedalar >= 5)
        return `Oi ${p1}! 💙 Faz ${f.semPedalar} dias que a gente não te vê por aqui e estamos com saudade. Tá tudo bem? Se precisar de ajuda pra retomar o ritmo, me chama — a bike tá te esperando! 🚴‍♀️`;
      if (f.semPedalar !== null && f.semPedalar >= 3)
        return `Oi ${p1}! 👀 Faz ${f.semPedalar} dias desde a sua última pedalada. Bora não perder o embalo do desafio? Qual dia dessa semana você consegue vir? 💪`;
      if (f.amigos === 0)
        return `Oi ${p1}! 📣 Sabia que trazer uma amiga pra experimentar vale missão no desafio? Ela ganha uma aula experimental e você avança na cartela. Tem alguém em mente? 💙`;
      return `Oi ${p1}! 🚴‍♀️ Passando pra dizer que você está mandando muito bem no Desafio das Missões. Continua assim! 💪`;
    };
    const waLink = (f) => `https://wa.me/55${normPhone(f.phone || "")}?text=${encodeURIComponent(msgPara(f))}`;

    // ---- Últimas conquistas (mantido) ----
    const feed = [];
    TRACKS.forEach((t) => {
      const d = allData[t.id]; if (!d) return;
      const M = TRACK_MISSIONS[t.id];
      const w = d.winners || {};
      Object.entries(w.missions || {}).forEach(([mid, e]) => {
        if (e && e.ts) feed.push({ ts: e.ts, nome: e.name, oq: `🥤 Shake — ${(M.find((m) => m.id === mid) || {}).name || mid}`, gr: t.short });
      });
      Object.entries(w.placements || {}).forEach(([k, arr]) => {
        (arr || []).forEach((e) => { if (e && e.ts) feed.push({ ts: e.ts, nome: e.name, oq: `🏆 ${PATL[k] || k}`, gr: t.short }); });
      });
      Object.entries(w.missionQueues || {}).forEach(([mid, arr]) => {
        (arr || []).forEach((e, idx) => { if (e && e.ts && idx > 0) feed.push({ ts: e.ts, nome: e.name, oq: `⏳ Fila do ${(M.find((m) => m.id === mid) || {}).name || mid} (${idx + 1}º)`, gr: t.short }); });
      });
      (d.miniMissions || []).forEach((x) => (x.winners || []).forEach((e, i) => {
        if (e && e.ts) feed.push({ ts: e.ts, nome: e.name, oq: `⚡ ${x.name} (${i + 1}º)`, gr: t.short });
      }));
    });
    (gData.miniMissions || []).forEach((x) => (x.winners || []).forEach((e, i) => {
      if (e && e.ts) feed.push({ ts: e.ts, nome: e.name, oq: `⚡🌍 ${x.name} (${i + 1}º)`, gr: "todos" });
    }));
    feed.sort((a, b) => b.ts - a.ts);

    const alternarIncentivo = (f) => {
      mutateTrack(f.trackId, (d) => {
        const s = d.students.find((x) => x.id === f.id);
        if (s) s.semIncentivo = !s.semIncentivo;
      });
    };

    return (
      <div className="min-h-screen" style={{ ...pageVars, background: pageBg, fontFamily: "'Montserrat', sans-serif", transition: "background .4s" }}>
        {fonts}{modal}
        <main className="max-w-md mx-auto px-5 pb-16 pt-6">
          <div className="flex items-center justify-between">
            <button onClick={() => setShowWins(false)} style={{ color: C.oak, fontSize: 13 }}>← Voltar</button>
            {lockBtn}
          </div>
          <h2 className="mt-4 mb-1" style={{ fontWeight: 800, fontSize: 22, color: C.amber, textTransform: "uppercase", letterSpacing: "0.03em" }}>
            🏅 Desempenho Geral
          </h2>
          <div style={{ color: C.mut, fontSize: 11.5, marginBottom: 12, lineHeight: 1.5 }}>
            Filtre a turma e toque em 📲 para chamar cada aluna com a mensagem certa pra situação dela.
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {FILTROS.map((f) => {
              const n = fichas.filter(f.fn).length;
              const on = filtroDesemp === f.id;
              return (
                <button key={f.id} onClick={() => setFiltroDesemp(f.id)}
                  className="rounded-lg px-2.5 py-1.5"
                  style={{ background: on ? C.amber : C.panel, color: on ? C.bg : C.cream, border: `1px solid ${on ? C.amber : C.line}`, fontSize: 11.5, fontWeight: on ? 800 : 600 }}>
                  {f.rot} <span style={{ opacity: 0.75 }}>{n}</span>
                </button>
              );
            })}
          </div>
          <div style={{ color: C.mut, fontSize: 11, marginBottom: 8 }}>{filtroAtivo.desc}</div>
          {(() => {
            const semTel = fichas.filter((f) => !f.phone || !String(f.phone).trim());
            if (semTel.length === 0 || filtroDesemp === "semtel") return null;
            return (
              <button onClick={() => setFiltroDesemp("semtel")}
                className="w-full rounded-lg px-3 py-2 mb-3 text-left"
                style={{ background: C.wineDeep, border: `1px solid ${C.oak}66`, color: C.oak, fontSize: 11.5 }}>
                📵 <b>{semTel.length} aluno{semTel.length === 1 ? "" : "s"} sem WhatsApp cadastrado</b> — não dá pra chamar por mensagem. Toque para ver quem é.
              </button>
            );
          })()}

          <input value={buscaDesemp} onChange={(e) => setBuscaDesemp(e.target.value)} placeholder="🔍 buscar por nome…"
            className="w-full rounded-lg px-3 py-2 mb-3 outline-none"
            style={{ background: C.panel, border: `1px solid ${C.line}`, color: C.cream, fontSize: 13 }} />

          {/* Lista */}
          {lista.length === 0 && (
            <div className="rounded-xl p-5 text-center" style={{ background: C.panel, border: `1px solid ${C.line}`, color: C.mut, fontSize: 12.5 }}>
              Ninguém nesse filtro agora. 🎉
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            {lista.map((f) => (
              <div key={f.id + f.trackId} className="rounded-lg px-3 py-2.5" style={{ background: C.panel, border: `1px solid ${f.quaseCartela ? C.amber : C.line}` }}>
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate" style={{ color: C.cream, fontWeight: 700, fontSize: 13 }}>{f.nome}</span>
                      {f.megafone && <span title="Trouxe convidado novo" style={{ fontSize: 12 }}>📣</span>}
                      {f.semIncentivo && <span title="Não quer receber mensagens de incentivo" style={{ fontSize: 12 }}>🔕</span>}
                    </div>
                    <div style={{ color: C.mut, fontSize: 10.5, fontFamily: "'DM Mono', monospace", marginTop: 2 }}>
                      {f.grupo} · {f.aulas} aula{f.aulas === 1 ? "" : "s"} · {f.feitas}/9 missões
                      {f.ultima ? ` · última ${fmtBR(f.ultima)}` : " · nunca pedalou"}
                    </div>
                    {f.quaseCartela && <div style={{ color: C.amber, fontSize: 11.5, fontWeight: 800, marginTop: 3 }}>🤯 8/9 — falta 1 pra CARTELA CHEIA!</div>}
                    {!f.quaseCartela && f.faltando.length > 0 && (
                      <div style={{ color: C.amberSoft, fontSize: 11.5, fontWeight: 700, marginTop: 3 }}>🔥 falta 1 · {f.faltando.join(", ")}</div>
                    )}
                    {f.semPedalar !== null && f.semPedalar >= 3 && (
                      <div style={{ color: "#E8A0A8", fontSize: 11.5, fontWeight: 600, marginTop: 3 }}>👀 {f.semPedalar} dias sem pedalar</div>
                    )}
                    {!f.phone && (
                      <div style={{ color: C.oak, fontSize: 11, fontWeight: 600, marginTop: 3 }}>📵 sem WhatsApp cadastrado</div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    {f.phone && !f.semIncentivo && (
                      <a href={waLink(f)} target="_blank" rel="noreferrer" title="Chamar no WhatsApp"
                        className="rounded-lg px-2.5 py-1.5" style={{ background: "#25D366", textDecoration: "none", fontSize: 14, lineHeight: 1 }}>📲</a>
                    )}
                    {!f.phone && (
                      <button
                        onClick={() => {
                          const txt = msgPara(f);
                          try {
                            navigator.clipboard.writeText(txt);
                            avisar("📋 Mensagem copiada! Cole no WhatsApp da aluna.");
                          } catch { avisar("Não consegui copiar. Toque e segure para selecionar o texto."); }
                        }}
                        title="Sem WhatsApp cadastrado — copiar a mensagem"
                        className="rounded-lg px-2.5 py-1.5"
                        style={{ background: C.wineDeep, border: `1px solid ${C.oak}`, color: C.oak, fontSize: 13, lineHeight: 1 }}>📋</button>
                    )}
                    <button onClick={() => alternarIncentivo(f)} title={f.semIncentivo ? "Voltar a enviar incentivos" : "Não enviar mensagens de incentivo"}
                      className="rounded-lg px-2.5 py-1" style={{ background: "transparent", border: `1px solid ${C.line}`, color: C.mut, fontSize: 12 }}>
                      {f.semIncentivo ? "🔔" : "🔕"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Últimas conquistas */}
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.25em", color: C.oak, textTransform: "uppercase", margin: "20px 0 6px" }}>
            🏅 Últimas conquistas · {feed.length}
          </div>
          {feed.length === 0 && <div style={{ color: C.mut, fontSize: 12.5 }}>Nenhuma conquista registrada ainda.</div>}
          <div className="flex flex-col gap-1">
            {feed.slice(0, 60).map((f, i) => (
              <div key={i} className="rounded-lg px-3 py-1.5 flex items-center gap-2" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
                <span className="shrink-0" style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.mut }}>{fmtTs(f.ts)}</span>
                <span className="min-w-0 truncate" style={{ color: C.amber, fontWeight: 700, fontSize: 12.5 }}>{f.nome}</span>
                <span className="flex-1 min-w-0 truncate" style={{ color: C.cream, fontSize: 11.5 }}>{f.oq}</span>
                <span className="shrink-0" style={{ color: C.mut, fontSize: 10, fontFamily: "'DM Mono', monospace" }}>{f.gr}</span>
              </div>
            ))}
          </div>
          {footerNote}
          <div className="flex justify-center pb-8">{helpBtn}</div>
        </main>
      </div>
    );
  }

  // ---------- Comportamento dos Usuários ----------
  if (showUso && admin) {
    if (!usoData && !usoLoading) {
      setUsoLoading(true);
      loadUso().then((u) => { setUsoData(u); setUsoLoading(false); }).catch(() => { setUsoData({}); setUsoLoading(false); });
    }
    const agora = Date.now();
    const TELA_NOME = {
      inicio: "Início", cartela: "Própria cartela", colega: "Cartela de colega", pendencias: "Pendências", cadastros: "Cadastros",
      relampago: "Relâmpago", relatorio: "Relatório", desempenho: "Desempenho", premios: "Prêmios",
      manual: "Manual", uso: "Comportamento",
    };
    const linhas = Object.entries(usoData || {}).map(([sid, e]) => {
      const min = Math.round(e.minutos || 0);
      const top = Object.entries(e.telas || {}).sort((a, b) => b[1] - a[1]).slice(0, 3);
      const visitas = Object.entries(e.visitas || {}).sort((a, b) => b[1] - a[1]).slice(0, 6);
      return {
        sid, nome: e.nome || "—", track: e.track,
        grupo: (TRACKS.find((t) => t.id === e.track) || {}).short || "—",
        sessoes: e.sessoes || 0, minutos: min, ultimo: e.ultimo || 0,
        online: agora - (e.ultimo || 0) < 5 * 60000,
        telas: top, visitas,
      };
    });
    const online = linhas.filter((l) => l.online);
    const ordenadas = [...linhas].sort((a, b) => {
      if (usoOrdem === "alfabetica") return a.nome.localeCompare(b.nome);
      if (usoOrdem === "tempo") return b.minutos - a.minutos;
      if (usoOrdem === "sessoes") return b.sessoes - a.sessoes;
      return b.ultimo - a.ultimo;
    });
    const totalMin = linhas.reduce((n, l) => n + l.minutos, 0);
    const totalSes = linhas.reduce((n, l) => n + l.sessoes, 0);
    const telasGerais = {};
    linhas.forEach((l) => l.telas.forEach(([t, n]) => { telasGerais[t] = (telasGerais[t] || 0) + n; }));
    const topTelas = Object.entries(telasGerais).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const quando = (ts) => {
      if (!ts) return "nunca";
      const d = agora - ts;
      if (d < 60000) return "agora";
      if (d < 3600000) return `há ${Math.floor(d / 60000)} min`;
      if (d < 86400000) return `há ${Math.floor(d / 3600000)}h`;
      return fmtTs(ts);
    };
    const Ordem = ({ id, rot }) => (
      <button onClick={() => setUsoOrdem(id)} className="rounded-lg px-2.5 py-1.5"
        style={{ background: usoOrdem === id ? C.amber : C.panel, color: usoOrdem === id ? C.bg : C.cream,
                 border: `1px solid ${usoOrdem === id ? C.amber : C.line}`, fontSize: 11.5, fontWeight: usoOrdem === id ? 800 : 600 }}>
        {rot}
      </button>
    );

    return (
      <div className="min-h-screen" style={{ ...pageVars, background: pageBg, fontFamily: "'Montserrat', sans-serif", transition: "background .4s" }}>
        {fonts}{modal}
        <main className="max-w-md mx-auto px-5 pb-16 pt-6">
          <div className="flex items-center justify-between">
            <button onClick={() => setShowUso(false)} style={{ color: C.oak, fontSize: 13 }}>← Voltar</button>
            {lockBtn}
          </div>
          <h2 className="mt-4 mb-1" style={{ fontWeight: 800, fontSize: 22, color: C.amber, textTransform: "uppercase", letterSpacing: "0.03em" }}>
            📈 Comportamento dos Usuários
          </h2>
          <div style={{ color: C.mut, fontSize: 11.5, marginBottom: 12, lineHeight: 1.5 }}>
            Registro de quem abre a cartela, quanto tempo fica e onde navega. Só conta alunas — o acesso da administração não entra.
          </div>

          {usoLoading && <div className="text-center py-10" style={{ color: C.mut, fontSize: 13 }}>carregando…</div>}

          {!usoLoading && linhas.length === 0 && (
            <div className="rounded-xl p-5 text-center" style={{ background: C.panel, border: `1px solid ${C.line}`, color: C.mut, fontSize: 12.5, lineHeight: 1.6 }}>
              Ainda não há registros. Os dados começam a aparecer conforme as alunas abrirem a cartela delas a partir de agora.
            </div>
          )}

          {!usoLoading && linhas.length > 0 && (
            <>
              {/* Resumo */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="rounded-xl p-3" style={{ background: online.length ? C.wineDeep : C.panel, border: `1px solid ${online.length ? C.ok : C.line}` }}>
                  <div style={{ color: online.length ? C.ok : C.mut, fontSize: 22, fontWeight: 800 }}>
                    {online.length ? "🟢" : "⚪"} {online.length}
                  </div>
                  <div style={{ color: C.mut, fontSize: 10.5, marginTop: 2 }}>online agora (5 min)</div>
                </div>
                <div className="rounded-xl p-3" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
                  <div style={{ color: C.amberSoft, fontSize: 22, fontWeight: 800 }}>{linhas.length}</div>
                  <div style={{ color: C.mut, fontSize: 10.5, marginTop: 2 }}>alunas já usaram</div>
                </div>
                <div className="rounded-xl p-3" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
                  <div style={{ color: C.amberSoft, fontSize: 22, fontWeight: 800 }}>{totalSes}</div>
                  <div style={{ color: C.mut, fontSize: 10.5, marginTop: 2 }}>acessos no total</div>
                </div>
                <div className="rounded-xl p-3" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
                  <div style={{ color: C.amberSoft, fontSize: 22, fontWeight: 800 }}>{totalMin}</div>
                  <div style={{ color: C.mut, fontSize: 10.5, marginTop: 2 }}>minutos somados</div>
                </div>
              </div>

              {/* Telas mais visitadas */}
              {topTelas.length > 0 && (
                <div className="rounded-xl p-3 mb-3" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
                  <div style={{ color: C.oak, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>
                    Telas mais visitadas
                  </div>
                  {topTelas.map(([t, n]) => {
                    const maior = topTelas[0][1] || 1;
                    return (
                      <div key={t} className="flex items-center gap-2 mb-1">
                        <span style={{ color: C.cream, fontSize: 11.5, width: 92 }}>{TELA_NOME[t] || t}</span>
                        <span style={{ flex: 1, height: 6, background: C.line, borderRadius: 3, overflow: "hidden" }}>
                          <span style={{ display: "block", height: "100%", width: `${(n / maior) * 100}%`, background: C.amber }} />
                        </span>
                        <span style={{ color: C.mut, fontSize: 10.5, fontFamily: "'DM Mono', monospace", width: 30, textAlign: "right" }}>{n}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Ordenação */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                <Ordem id="recente" rot="🕐 Mais recentes" />
                <Ordem id="tempo" rot="⏱️ Mais tempo" />
                <Ordem id="sessoes" rot="🔁 Mais acessos" />
                <Ordem id="alfabetica" rot="🔤 A–Z" />
              </div>

              {/* Lista */}
              <div className="flex flex-col gap-1.5">
                {ordenadas.map((l) => (
                  <div key={l.sid} className="rounded-lg px-3 py-2.5" style={{ background: C.panel, border: `1px solid ${l.online ? C.ok + "88" : C.line}` }}>
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 9, color: l.online ? C.ok : C.line }}>●</span>
                      <span className="flex-1 min-w-0 truncate" style={{ color: C.cream, fontWeight: 700, fontSize: 13 }}>{l.nome}</span>
                      <span style={{ color: C.mut, fontSize: 10, fontFamily: "'DM Mono', monospace" }}>{l.grupo}</span>
                    </div>
                    <div style={{ color: C.mut, fontSize: 10.5, fontFamily: "'DM Mono', monospace", marginTop: 3 }}>
                      {l.sessoes} acesso{l.sessoes === 1 ? "" : "s"} · {l.minutos} min · {quando(l.ultimo)}
                    </div>
                    {l.telas.length > 0 && (
                      <div style={{ color: C.oak, fontSize: 10.5, marginTop: 3 }}>
                        {l.telas.map(([t, n]) => `${TELA_NOME[t] || t} (${n})`).join(" · ")}
                      </div>
                    )}
                    {l.visitas && l.visitas.length > 0 && (
                      <div style={{ color: C.amberSoft, fontSize: 10.5, marginTop: 2 }}>
                        👀 entrou na cartela de: {l.visitas.map(([nm, n]) => `${nm} (${n})`).join(" · ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
          {footerNote}
          <div className="flex justify-center pb-8">{helpBtn}</div>
        </main>
      </div>
    );
  }

  // ---------- Relatório Geral (administração) ----------
  if (showRel && admin) {
    if (!entregasData) {
      loadEntregas().then((e) => setEntregasData(e)).catch(() => setEntregasData({}));
    }
    const semanas = [];
    {
      let ini = new Date(DESAFIO_INICIO + "T12:00");
      const fim = new Date("2026-09-20T12:00");
      let n = 1;
      while (ini <= fim) {
        const f2 = new Date(ini); f2.setDate(f2.getDate() + 6);
        semanas.push({ n, ini: ini.toISOString().slice(0, 10), fim: (f2 > fim ? fim : f2).toISOString().slice(0, 10) });
        ini = new Date(f2); ini.setDate(ini.getDate() + 1); n++;
      }
    }
    const hoje = todayStr();
    const idTs = (id) => { const v = parseInt(id, 36); return v > 1.7e12 && v < 1.9e12 ? v : null; };
    const linhas = semanas.map((w) => {
      let aulas = 0, novos = 0;
      TRACKS.forEach((t) => {
        const d = allData[t.id]; if (!d) return;
        d.students.forEach((s) => {
          (s.records || []).forEach((r) => { if (r.status === "ok" && r.date >= w.ini && r.date <= w.fim) aulas++; });
          const ts = idTs(s.id);
          if (ts) { const dt = new Date(ts).toISOString().slice(0, 10); if (dt >= w.ini && dt <= w.fim) novos++; }
        });
      });
      return { ...w, aulas, novos };
    });
    const tot = { alunos: 0, aulas: 0, pend: 0, conv: 0, convAmigo: 0, convAluno: 0, bought: 0 };
    const porGrupo = TRACKS.map((t) => {
      const d = allData[t.id];
      const alunos = d ? d.students.filter((s) => s.approved !== false).length : 0;
      let aulas = 0, pend = 0, conv = 0, convAmigo = 0, convAluno = 0, bought = 0;
      if (d) d.students.forEach((s) => {
        (s.records || []).forEach((r) => { if (r.status === "ok") aulas++; else if (r.status === "pending") pend++; });
        (s.guests || []).forEach((g) => {
          if (g.status === "ok") { conv++; if (g.kind === "spin") convAluno++; else convAmigo++; }
          if (g.boughtTs || g.bought) bought++;
        });
      });
      tot.alunos += alunos; tot.aulas += aulas; tot.pend += pend; tot.conv += conv; tot.convAmigo += convAmigo; tot.convAluno += convAluno; tot.bought += bought;
      return { t, alunos, aulas, conv, convAmigo, convAluno, bought };
    });
    const baixarCSV = (nome, linhas) => {
      const csv = "\ufeff" + linhas.map((l) => l.map((c) => `"${String(c == null ? "" : c).replace(/"/g, '""')}"`).join(";")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = nome; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    };
    const REL = (() => {
      const pendA = [["Grupo", "Aluno", "WhatsApp", "Data", "Horário", "Professor", "Sinalizado ⚠️"]];
      const pendG = [["Grupo", "Anfitrião", "WhatsApp", "Convidado", "Data", "Horário", "Sinalizado ⚠️"]];
      const aulasCSV = [["Grupo", "Aluno", "Data", "Horário", "Professor"]];
      const alunosCSV = [["Grupo", "Nome", "WhatsApp", "Liberado", "Aulas validadas", "Pendentes", "Missões (de 9)"]];
      const convsCSV = [["Grupo", "Anfitrião", "Convidado", "Data", "Horário", "Status", "Tipo", "Fechou pacote 10+"]];
      const missoesCSV = [["Grupo", "Missão", "Meta", "Completaram", "A 1 de completar"]];
      const horarioMap = {};
      const profMap = {};
      const prevM = MISSIONS;
      TRACKS.forEach((t) => {
        const d = allData[t.id]; if (!d) return;
        MISSIONS = TRACK_MISSIONS[t.id];
        const done = {}, quase1 = {};
        d.students.forEach((s) => {
          const r = computeProgress(s);
          const fone = s.phone ? fmtPhone(s.phone) : "";
          let ok = 0, pd = 0;
          (s.records || []).forEach((rr) => {
            if (rr.status === "ok") {
              ok++;
              aulasCSV.push([t.short, s.name, fmtBR(rr.date), rr.slot.replace(":", "h"), rr.instructor || ""]);
              if (rr.instructor) {
                profMap[rr.instructor] = profMap[rr.instructor] || {};
                profMap[rr.instructor][t.id] = (profMap[rr.instructor][t.id] || 0) + 1;
              }
              const hk = `${t.id}|${rr.date}|${rr.slot}`;
              if (!horarioMap[hk]) horarioMap[hk] = { grupo: t.short, data: rr.date, slot: rr.slot, profs: new Set(), alunos: [] };
              if (rr.instructor) horarioMap[hk].profs.add(rr.instructor);
              horarioMap[hk].alunos.push({ nome: s.name, reg: rr.reg || null });
            } else if (rr.status === "pending") {
              pd++;
              pendA.push([t.short, s.name, fone, fmtBR(rr.date), rr.slot.replace(":", "h"), rr.instructor || "", rr.alert ? "SIM" : ""]);
            }
          });
          (s.guests || []).forEach((g) => {
            if (g.status === "pending") {
              pd++;
              pendG.push([t.short, s.name, fone, g.name, fmtBR(g.date), (g.slot || "").replace(":", "h"), g.alert ? "SIM" : ""]);
            }
            convsCSV.push([t.short, s.name, g.name, fmtBR(g.date), (g.slot || "").replace(":", "h"), g.status === "ok" ? "validado" : "pendente", g.kind === "spin" ? "aluno convidado 📣" : "novo", (g.boughtTs || g.bought) ? "SIM" : ""]);
          });
          alunosCSV.push([t.short, s.name, fone, s.approved === false ? "não" : "sim", ok, pd, r.doneCount]);
          MISSIONS.forEach((m) => {
            const got = Math.min(r.p[m.id], m.target);
            if (got >= m.target) done[m.id] = (done[m.id] || 0) + 1;
            else if (m.target - got === 1) quase1[m.id] = (quase1[m.id] || 0) + 1;
          });
        });
        MISSIONS.forEach((m) => missoesCSV.push([t.short, m.name, m.target, done[m.id] || 0, quase1[m.id] || 0]));
      });
      MISSIONS = prevM;
      const profsCSV = [["Professor", "Grupo", "Aulas validadas"]];
      Object.keys(profMap).sort().forEach((pr) => {
        let tt = 0;
        TRACKS.forEach((t) => {
          const n = profMap[pr][t.id] || 0;
          if (n) profsCSV.push([pr, t.short, n]);
          tt += n;
        });
        profsCSV.push([pr, "TOTAL", tt]);
      });
      // Aulas por horário: uma LINHA POR ALUNO (fácil de filtrar/ordenar no Excel), com o horário exato do check-in (com segundos)
      const fmtHMS = (ts) => {
        if (!ts) return "";
        const d = new Date(ts);
        const p = (n) => String(n).padStart(2, "0");
        return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
      };
      const horarioCSV = [["Data", "Horário da aula", "Grupo", "Professor(es)", "Aluno", "Check-in registrado às"]];
      Object.values(horarioMap)
        .sort((a, b) => (a.data + a.slot < b.data + b.slot ? -1 : 1))
        .forEach((h) => {
          const profsTxt = [...h.profs].join(", ") || "—";
          h.alunos
            .slice()
            .sort((a, b) => (a.reg || 0) - (b.reg || 0))
            .forEach((al) => {
              horarioCSV.push([fmtBR(h.data), h.slot.replace(":", "h"), h.grupo, profsTxt, al.nome, fmtHMS(al.reg)]);
            });
        });
      // Missões e desafios concluídos: cada conquista que entrou na fila de prêmio, com data/hora e a pessoa.
      // "Ganhou prêmio" usa o TETO REAL (computeAwards: 2 shakes e 1 padrão horiz/vert/diag por aluno, somando
      // todas as missões) — não é mais "os 2 primeiros da fila", porque o 1º pode já ter batido o teto em outra missão.
      const PATL_REL = {
        horiz: { label: "Linha Horizontal", prize: "Camiseta Spincycle", emoji: "👕" },
        vert: { label: "Linha Vertical", prize: "Camiseta Spincycle", emoji: "👕" },
        diag: { label: "Diagonal", prize: "Camiseta Spincycle", emoji: "👕" },
        corners: { label: "4 Cantos", prize: "Bolsinha Spincycle", emoji: "👜" },
        conv: { label: "4 Conversões", prize: "Aula temática à escolha", emoji: "🎯" },
        full: { label: "Cartela Cheia", prize: "Treinamento + 1 mês ilimitado", emoji: "🏆" },
        bpm: { label: "Giro de 175 BPM", prize: "Aula fechada para 33 convidados", emoji: "⭐" },
      };
      const ENTREGAVEIS_REL = new Set(["horiz", "vert", "diag", "corners", "conv", "full"]);
      const concluidasCSV = [["Grupo", "Tipo", "Conquista", "Aluno", "Data/Hora", "Posição na fila", "Ganhou prêmio"]];
      const premiosCSV = [["Grupo", "Prêmio", "Aluno", "Data/Hora", "Entregue?"]];
      const prevM2 = MISSIONS;
      TRACKS.forEach((t) => {
        const d = allData[t.id]; if (!d) return;
        const w = d.winners || {};
        MISSIONS = TRACK_MISSIONS[t.id];
        const AW = computeAwards(d);
        (TRACK_MISSIONS[t.id] || []).forEach((m) => {
          const q = (w.missionQueues || {})[m.id] || [];
          const vencedorId = AW.shakes[m.id] && AW.shakes[m.id].id;
          q.forEach((e, i) => {
            const ganhou = !!vencedorId && e.id === vencedorId;
            concluidasCSV.push([t.short, "Missão (shake)", m.name, e.name, e.ts ? fmtDT(e.ts) : (e.date ? fmtBR(e.date) : "—"), i + 1, ganhou ? "sim" : "não"]);
            if (ganhou) {
              const chave = `shake-${t.id}-${m.id}::${i + 1}::${e.name}`;
              premiosCSV.push([t.short, `🥤 Shake — ${m.name}`, e.name, e.ts ? fmtDT(e.ts) : (e.date ? fmtBR(e.date) : "—"), (entregasData && entregasData[chave]) ? "sim" : "não"]);
            }
          });
        });
        Object.entries(PATL_REL).forEach(([k, info]) => {
          const arr = (w.placements || {})[k] || [];
          const vencedorId = AW.pats[k] && AW.pats[k].id;
          arr.forEach((e, i) => {
            const ganhou = !!vencedorId && e.id === vencedorId;
            concluidasCSV.push([t.short, "Padrão da cartela", info.label, e.name, e.ts ? fmtDT(e.ts) : (e.date ? fmtBR(e.date) : "—"), i + 1, ganhou ? "sim" : "não"]);
            if (ganhou && ENTREGAVEIS_REL.has(k)) {
              const chave = `pat-${t.id}-${k}::${i + 1}::${e.name}`;
              premiosCSV.push([t.short, `${info.emoji} ${info.prize} — ${info.label}`, e.name, e.ts ? fmtDT(e.ts) : (e.date ? fmtBR(e.date) : "—"), (entregasData && entregasData[chave]) ? "sim" : "não"]);
            }
          });
        });
      });
      MISSIONS = prevM2;
      return { pendA, pendG, aulasCSV, alunosCSV, convsCSV, profsCSV, missoesCSV, horarioCSV, concluidasCSV, premiosCSV };
    })();
    const BtnCSV = ({ rotulo, n, arq, dados }) => (
      <button
        onClick={() => baixarCSV(`${arq}-${todayStr()}.csv`, dados)}
        className="w-full rounded-lg px-3 py-2.5 text-left font-bold flex items-center justify-between"
        style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.amberSoft, fontSize: 12.5 }}
      >
        <span>{rotulo}</span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: C.mut }}>{n} · baixar ⬇</span>
      </button>
    );
    const Row = ({ a, b, forte }) => (
      <div className="flex justify-between items-baseline" style={{ fontSize: 12.5, lineHeight: 1.9, color: forte ? C.cream : C.mut, fontWeight: forte ? 800 : 500 }}>
        <span>{a}</span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12 }}>{b}</span>
      </div>
    );
    return (
      <div className="min-h-screen" style={{ ...pageVars, background: pageBg, fontFamily: "'Montserrat', sans-serif", transition: "background .4s" }}>
        {fonts}{modal}
        <main className="max-w-md mx-auto px-5 pb-16 pt-6">
          <div className="flex items-center justify-between">
            <button onClick={() => setShowRel(false)} style={{ color: C.oak, fontSize: 13 }}>← Voltar</button>
            {lockBtn}
          </div>
          <h2 className="mt-4 mb-3" style={{ fontWeight: 800, fontSize: 22, color: C.amber, textTransform: "uppercase", letterSpacing: "0.03em" }}>
            📊 Relatório Geral
          </h2>
          <div className="rounded-xl p-4 mb-3" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.25em", color: C.oak, textTransform: "uppercase", marginBottom: 6 }}>Participantes e aulas</div>
            {porGrupo.map(({ t, alunos, aulas }) => (
              <Row key={t.id} a={t.short || t.label} b={`${alunos} alunos · ${aulas} aulas`} />
            ))}
            <div style={{ borderTop: `1px dashed ${C.line}`, marginTop: 4, paddingTop: 4 }}>
              <Row a="TOTAL" b={`${tot.alunos} alunos · ${tot.aulas} aulas`} forte />
              {tot.pend > 0 && <Row a="aguardando validação" b={String(tot.pend)} />}
            </div>
          </div>
          <div className="rounded-xl p-4 mb-3" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.25em", color: C.oak, textTransform: "uppercase", marginBottom: 6 }}>Convidados</div>
            <Row a="Aulas experimentais validadas" b={String(tot.conv)} forte />
            <Row a="🧑‍🤝‍🧑 Amigos convidados (indicação livre)" b={String(tot.convAmigo)} />
            <Row a="📣 Alunos convidados ao desafio (limite 2)" b={String(tot.convAluno)} />
            <Row a="🧸 Fecharam pacote 10+" b={String(tot.bought)} forte />
          </div>
          <div className="rounded-xl p-4" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.25em", color: C.oak, textTransform: "uppercase", marginBottom: 6 }}>Crescimento semana a semana</div>
            {linhas.map((w, i) => {
              const futura = w.ini > hoje;
              const ant = i > 0 ? linhas[i - 1].aulas : 0;
              const delta = i > 0 && ant > 0 && !futura ? Math.round(((w.aulas - ant) / ant) * 100) : null;
              return (
                <div key={w.n} style={{ opacity: futura ? 0.35 : 1 }}>
                  <Row
                    a={`Sem ${w.n} · ${fmtBR(w.ini)}–${fmtBR(w.fim)}`}
                    b={futura ? "—" : `${w.aulas} aulas${delta != null ? ` (${delta >= 0 ? "+" : ""}${delta}%)` : ""} · ${w.novos} novos`}
                    forte={!futura && w.ini <= hoje && hoje <= w.fim}
                  />
                </div>
              );
            })}
            <div style={{ color: C.mut, fontSize: 10.5, marginTop: 6, lineHeight: 1.5 }}>
              "Novos" = cadastros feitos pelo app na semana. Semana atual em destaque.
            </div>
          </div>
          <div className="rounded-xl p-4 mt-3" style={{ background: C.panel, border: `1.5px solid ${C.amber}66` }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.25em", color: C.oak, textTransform: "uppercase", marginBottom: 4 }}>
              📥 Gerar listas (CSV)
            </div>
            <div style={{ color: C.mut, fontSize: 11.5, lineHeight: 1.5, marginBottom: 10 }}>
              Baixa em CSV e abre direto no Excel/Planilhas — perfeito pra cruzar com o relatório do sistema e validar em lote.
            </div>
            <div className="flex flex-col gap-1.5">
              <BtnCSV rotulo="⏳ Aulas PENDENTES" n={REL.pendA.length - 1} arq="aulas-pendentes" dados={REL.pendA} />
              <BtnCSV rotulo="📣 Amigos PENDENTES" n={REL.pendG.length - 1} arq="amigos-pendentes" dados={REL.pendG} />
              <BtnCSV rotulo="✅ Aulas validadas (todas)" n={REL.aulasCSV.length - 1} arq="aulas-validadas" dados={REL.aulasCSV} />
              <BtnCSV rotulo="👥 Alunos (cadastro completo)" n={REL.alunosCSV.length - 1} arq="alunos" dados={REL.alunosCSV} />
              <BtnCSV rotulo="📣 Convidados e conversões" n={REL.convsCSV.length - 1} arq="convidados" dados={REL.convsCSV} />
              <BtnCSV rotulo="🧑‍🏫 Aulas por professor" n={REL.profsCSV.length - 1} arq="professores" dados={REL.profsCSV} />
              <BtnCSV rotulo="🎯 Missões por desafio" n={REL.missoesCSV.length - 1} arq="missoes" dados={REL.missoesCSV} />
              <BtnCSV rotulo="🕐 Aulas por horário (com professor)" n={REL.horarioCSV.length - 1} arq="aulas-por-horario" dados={REL.horarioCSV} />
              <BtnCSV rotulo="🏅 Missões e desafios concluídos" n={REL.concluidasCSV.length - 1} arq="conquistas" dados={REL.concluidasCSV} />
              <BtnCSV rotulo="🎁 Relatório de prêmios (quem ganhou e quem já recebeu)" n={REL.premiosCSV.length - 1} arq="relatorio-premios" dados={REL.premiosCSV} />
            </div>
            <div style={{ color: C.mut, fontSize: 10, lineHeight: 1.5, marginTop: 8 }}>
              "Missões e desafios concluídos" mostra a fila de cada prêmio na ordem de conquista, já aplicando o teto real (2 shakes e 1 padrão horiz/vert/diag por aluno, somando todas as missões). "Relatório de prêmios" traz só quem realmente ganhou, com o status de entrega — a mesma fonte da página 🏆 Missões Concluídas.
            </div>
          </div>
          {footerNote}
          <div className="flex justify-center pb-8">{helpBtn}</div>
        </main>
      </div>
    );
  }

  // ---------- Missões Relâmpago (criação e gestão) ----------
  if (showMM && admin) {
    const doMiniAt = (x, tid) => ((x.scope === "todos" || x.scope === "aula") ? mutateGlobal : (fn) => mutateTrack(tid, fn));
    return (
      <div className="min-h-screen" style={{ ...pageVars, background: pageBg, fontFamily: "'Montserrat', sans-serif", transition: "background .4s" }}>
        {fonts}{modal}
        <main className="max-w-md mx-auto px-5 pb-16 pt-6">
          <div className="flex items-center justify-between">
            <button onClick={() => setShowMM(false)} style={{ color: C.oak, fontSize: 13 }}>← Voltar</button>
            {lockBtn}
          </div>
          <h2 className="mt-4 mb-1" style={{ fontWeight: 800, fontSize: 22, color: C.amber, textTransform: "uppercase", letterSpacing: "0.03em" }}>
            ⚡ Missões Relâmpago
          </h2>
          <div style={{ color: C.mut, fontSize: 12, marginBottom: 12 }}>
            Crie, acompanhe, apure e encerre — tudo aqui, para qualquer grupo.
          </div>

            <section className="rounded-xl p-4 mt-6" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.25em", color: C.oak, textTransform: "uppercase", marginBottom: 10 }}>
                ⚡ Missões relâmpago (administração)
              </div>
              <div className="flex flex-col gap-2">
                <input value={mm.name} onChange={(e) => setMm({ ...mm, name: e.target.value })} placeholder="Nome da missão (ex.: Story na Bike)"
                  className="rounded-lg px-3 py-2 outline-none" style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.cream }} />
                <div className="flex items-center gap-2">
                  <span className="shrink-0" style={{ color: C.mut, fontSize: 12, width: 96 }}>Começa em</span>
                  <input type="datetime-local" value={mm.startDT}
                    onChange={(e) => setMm({ ...mm, startDT: e.target.value })}
                    className="flex-1 rounded-lg px-3 py-2 outline-none" style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.cream, colorScheme: "dark" }} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="shrink-0" style={{ color: C.mut, fontSize: 12, width: 96 }}>Dura (minutos)</span>
                  <input type="number" min="1" max="20160" value={mm.durMin}
                    onChange={(e) => setMm({ ...mm, durMin: Math.max(1, parseInt(e.target.value || "1", 10)) })}
                    className="flex-1 rounded-lg px-3 py-2 outline-none" style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.cream }} />
                  <span className="shrink-0" style={{ color: C.mut, fontSize: 11 }}>
                    {mm.durMin >= 1440 ? `${Math.round(mm.durMin / 1440)} dia(s)` : mm.durMin >= 60 ? `${Math.floor(mm.durMin / 60)}h${mm.durMin % 60 ? String(mm.durMin % 60).padStart(2, "0") : ""}` : ""}
                  </span>
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
                <select value={mm.scope} onChange={(e) => setMm({ ...mm, scope: e.target.value })}
                  className="rounded-lg px-3 py-2 outline-none" style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.cream }}>
                  <option value="todos">🌍 Todos os participantes — um pódio só</option>
                  <option value="grupos">🥇 1 prêmio para cada grupo (Ilimitados, Pacotes e Híbridos)</option>
                  <option value="aula">🚴 Só quem fez check-in em uma aula que eu escolher</option>
                  <option value="um">🎯 Só para um grupo específico</option>
                </select>
                {mm.scope === "um" && (
                  <select value={mm.grupo} onChange={(e) => setMm({ ...mm, grupo: e.target.value })}
                    className="rounded-lg px-3 py-2 outline-none" style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.cream }}>
                    {TRACKS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                )}
                {mm.scope === "aula" && (
                  <div className="flex gap-2">
                    <input type="date" value={mm.aulaDate} min={DESAFIO_INICIO} max="2026-09-20"
                      onChange={(e) => {
                        const nd = e.target.value;
                        const vs = nd && isWeekendDate(nd) ? WEEKEND_SLOTS : WEEKDAY_SLOTS;
                        setMm({ ...mm, aulaDate: nd, aulaSlot: vs.includes(mm.aulaSlot) ? mm.aulaSlot : "" });
                      }}
                      className="flex-1 rounded-lg px-3 py-2 outline-none" style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.cream, colorScheme: "dark" }} />
                    <select value={mm.aulaSlot} onChange={(e) => setMm({ ...mm, aulaSlot: e.target.value })}
                      className="rounded-lg px-3 py-2 outline-none" style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: mm.aulaSlot ? C.cream : C.mut }}>
                      <option value="" disabled>— aula —</option>
                      {(mm.aulaDate && isWeekendDate(mm.aulaDate) ? WEEKEND_SLOTS : WEEKDAY_SLOTS).map((sl) => (
                        <option key={sl} value={sl}>{sl.replace(":", "h")}</option>
                      ))}
                    </select>
                  </div>
                )}
                <select value={mm.openMode} onChange={(e) => setMm({ ...mm, openMode: e.target.value })}
                  className="rounded-lg px-3 py-2 outline-none" style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.cream }}>
                  <option value="fila">🏁 Fecha assim que os prêmios acabarem</option>
                  <option value="tempo">⏱️ Aberta até o fim do tempo — todos respondem, resultado sai no final</option>
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
                    const startTs = Date.parse(mm.startDT);
                    if (!startTs) { setMmMsg("Escolha a data e a hora de início."); return; }
                    if (mm.scope === "aula" && !mm.aulaSlot) { setMmMsg("Escolha a aula (dia e horário) que dá acesso à missão."); return; }
                    const endTs = startTs + mm.durMin * 60000;
                    const answers = mm.answersText.split(",").map((a) => a.trim()).filter(Boolean);
                    const options = mm.optionsText.split(",").map((o) => o.trim()).filter(Boolean);
                    if (mm.mode === "quizText" && !answers.length) { setMmMsg("Informe ao menos 1 resposta aceita."); return; }
                    if (mm.mode === "quizChoice" && (options.length < 2 || !mm.correct)) { setMmMsg("Informe 2+ opções e marque a correta."); return; }
                    const nova = {
                      id: novoId(),
                      name: mm.name.trim(), desc: mm.desc.trim(), prize: mm.prize.trim(),
                      qty: mm.qty, startTs, endTs, start: isoDateOf(startTs), end: isoDateOf(endTs),
                      mode: mm.mode, slots: mm.slots, winners: [], log: [],
                      openMode: mm.openMode, aulaDate: mm.aulaDate, aulaSlot: mm.aulaSlot,
                      answers, options, correct: mm.correct, tries: mm.tries, attempts: {},
                    };
                    nova.scope = mm.scope;
                    if (mm.scope === "todos" || mm.scope === "aula") {
                      mutateGlobal((d) => { if (!d.miniMissions) d.miniMissions = []; d.miniMissions.push(nova); });
                    } else if (mm.scope === "grupos") {
                      TRACKS.forEach((t) => mutateTrack(t.id, (d) => {
                        if (!d.miniMissions) d.miniMissions = [];
                        d.miniMissions.push(JSON.parse(JSON.stringify(nova)));
                      }));
                    } else {
                      mutateTrack(mm.grupo, (d) => { if (!d.miniMissions) d.miniMissions = []; d.miniMissions.push(nova); });
                    }
                    setMm({ name: "", startDT: dtNowLocal(), durMin: 30, desc: "", prize: "", qty: 1, mode: "manual", slots: [], answersText: "", optionsText: "", correct: "", tries: 3, scope: "todos", openMode: "fila", aulaDate: todayStr(), aulaSlot: "", grupo: "ilimitado" });
                    setMmMsg(
                      mm.scope === "todos" ? "⚡🌍 Missão criada para TODOS — um pódio só!"
                      : mm.scope === "grupos" ? "⚡🥇 Missão criada nos 3 grupos — 1 pódio por grupo!"
                      : mm.scope === "aula" ? `⚡🚴 Missão criada só para a aula de ${fmtBR(mm.aulaDate)} às ${mm.aulaSlot.replace(":", "h")}!`
                      : `⚡ Missão criada só para ${(TRACKS.find((t) => t.id === mm.grupo) || {}).short}!`
                    );
                    setTimeout(() => setMmMsg(""), 3500);
                  }}
                  className="rounded-lg py-2.5 font-bold" style={{ background: `linear-gradient(120deg, ${C.amber}, #16696F)`, color: C.cream }}>
                  Criar missão
                </button>
                {mmMsg && <div className="text-center" style={{ color: C.amberSoft, fontSize: 12 }}>{mmMsg}</div>}
              </div>

              {[
                ...((gData.miniMissions || []).map((x) => ({ x, tid: null }))),
                ...TRACKS.flatMap((t) => ((((allData[t.id] || {}).miniMissions) || []).map((x) => ({ x, tid: t.id })))),
              ]
                .sort((a, b) => (a.x.id < b.x.id ? 1 : -1))
                .map(({ x, tid }) => {
                const fase = mmPhase(x, Date.now());
                const ativa = fase === "ativa";
                const naAula = (s) => (s.records || []).some((r) => r.status === "ok" && r.date === x.aulaDate && r.slot === x.aulaSlot);
                const baseTodos = x.scope === "todos" || x.scope === "aula";
                let base = baseTodos ? alunosDeTodos() : (((allData[tid] || {}).students) || []);
                if (x.scope === "aula") base = base.filter(naAula);
                const dx = baseTodos
                  ? { students: x.scope === "aula" ? base : alunosDeTodos() }
                  : { students: ((allData[tid] || {}).students) || [] };
                const candidatos = base.filter((s) => s.approved !== false && !(x.winners || []).some((w) => w.id === s.id))
                  .sort((a, b) => a.name.localeCompare(b.name));
                return (
                  <div key={x.id} className="rounded-lg p-3 mt-3" style={{ background: C.panelSoft, border: `1px solid ${ativa ? C.amber + "88" : C.line}` }}>
                    <div className="flex items-center justify-between gap-2">
                      <div style={{ color: C.cream, fontWeight: 800, fontSize: 13 }}>⚡ {x.scope === "todos" ? "🌍 " : x.scope === "grupos" ? "🥇 " : x.scope === "aula" ? "🚴 " : ""}{x.name}{tid ? <span style={{ color: C.mut, fontWeight: 500, fontSize: 10, textTransform: "none" }}> · {(TRACKS.find((t) => t.id === tid) || {}).short}</span> : null}</div>
                      <div style={{ color: fase === "ativa" ? C.amberSoft : fase === "agendada" ? C.oak : C.mut, fontSize: 11 }}>
                        {fase === "agendada" ? `⏳ começa ${fmtDT(mmStartTs(x))}`
                          : fase === "ativa" ? `⏱️ até ${fmtDT(mmEndTs(x))}`
                          : fase === "resultado" ? "🏁 resultado no ar"
                          : "encerrada"}
                      </div>
                    </div>
                    <div style={{ color: C.mut, fontSize: 12, marginTop: 2 }}>
                      {x.desc} · 🏆 {x.prize} ({(x.winners || []).length}/{x.qty})
                      {x.scope === "aula" && x.aulaDate ? ` · 🚴 aula de ${fmtBR(x.aulaDate)} ${String(x.aulaSlot || "").replace(":", "h")}` : ""}
                      {x.openMode === "tempo" ? " · ⏱️ aberta até o fim do tempo" : ""}
                    </div>
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
                      const parcial = x.mode === "top" ? miniTop(dx, x).slice(0, x.qty)
                        : x.mode === "slot" ? miniSlotFirsts(dx, x).slice(0, x.qty)
                        : miniElegiveis(dx, x);
                      const apurar = () => {
                        doMiniAt(x, tid)((d) => {
                          const xx = (d.miniMissions || []).find((y) => y.id === x.id);
                          if (!xx) return;
                          if (!xx.winners) xx.winners = [];
                          const ja = new Set(xx.winners.map((w) => w.id));
                          const fonte = xx.scope === "todos" ? dx : d;
                          let lista = [];
                          if (xx.mode === "top") lista = miniTop(fonte, xx);
                          else if (xx.mode === "slot") lista = miniSlotFirsts(fonte, xx);
                          else {
                            const el = miniElegiveis(fonte, xx).filter((s) => !ja.has(s.id));
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
                            const cand = candidatos.find((y) => y.id === sid);
                            if (!cand) return;
                            doMiniAt(x, tid)((d) => {
                              const xx = (d.miniMissions || []).find((y) => y.id === x.id);
                              if (!xx) return;
                              if (!xx.winners) xx.winners = [];
                              if (xx.winners.length >= xx.qty || xx.winners.some((w) => w.id === sid)) return;
                              xx.winners.push({ id: cand.id, name: cand.name, ts: Date.now() });
                            });
                            setMiniAward({ ...miniAward, [x.id]: "" });
                          }}
                          className="rounded-lg px-3 font-bold" style={{ background: C.amber, color: C.cream, fontSize: 12 }}>
                          Premiar
                        </button>
                      </div>
                    )}
                    <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                      {ativa && (
                        <button
                          onClick={() => doMiniAt(x, tid)((d) => { const xx = (d.miniMissions || []).find((y) => y.id === x.id); if (xx) { xx.endTs = Date.now() - 1000; xx.end = "2000-01-01"; } })}
                          className="rounded-lg px-2 py-1" title="Encerrar missão" style={{ border: `1px solid ${C.line}`, color: C.mut, fontSize: 11 }}>
                          ✕ Encerrar sem premiar o restante
                        </button>
                      )}
                      {confirmDel !== `mm:${x.id}:${tid || "g"}` ? (
                        <button
                          onClick={() => setConfirmDel(`mm:${x.id}:${tid || "g"}`)}
                          className="rounded-lg px-2 py-1" title="Excluir missão e suas medalhas"
                          style={{ border: `1px solid #B1556066`, color: "#C96A76", fontSize: 11 }}>
                          🗑 Excluir missão
                        </button>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span style={{ color: "#C96A76", fontSize: 10, fontWeight: 700 }}>Apaga a missão e as medalhas — Irreversível!</span>
                          <button
                            onClick={() => {
                              doMiniAt(x, tid)((d) => { d.miniMissions = (d.miniMissions || []).filter((y) => y.id !== x.id); });
                              setConfirmDel("");
                            }}
                            className="rounded px-1.5 py-0.5 font-bold" style={{ background: "#B15560", color: C.cream, fontSize: 10 }}>SIM</button>
                          <button onClick={() => setConfirmDel("")} className="rounded px-1.5 py-0.5" style={{ color: C.mut, fontSize: 10, border: `1px solid ${C.line}` }}>não</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </section>
          
          {footerNote}
          <div className="flex justify-center pb-8">{helpBtn}</div>
        </main>
      </div>
    );
  }

  // ---------- Cadastros (administração) ----------
  if (showCad && admin) {
    const rows = [];
    TRACKS.forEach((t) => {
      const d = allData[t.id];
      if (d) d.students.forEach((s) => rows.push({ t, s }));
    });
    rows.sort((a, b) => norm(a.s.name).localeCompare(norm(b.s.name)));
    const qTxt = norm(cadQ);
    const qNum = cadQ.replace(/\D/g, "");
    const filtrados = qTxt
      ? rows.filter(({ s }) => norm(s.name).includes(qTxt) || (qNum.length >= 2 && normPhone(s.phone || "").includes(qNum)))
      : rows;
    const semZap = rows.filter(({ s }) => !s.phone).length;
    return (
      <div className="min-h-screen" style={{ ...pageVars, background: pageBg, fontFamily: "'Montserrat', sans-serif", transition: "background .4s" }}>
        {fonts}{modal}
        <main className="max-w-md mx-auto px-5 pb-16 pt-6">
          <div className="flex items-center justify-between">
            <button onClick={() => { setShowCad(false); setEditC(null); }} style={{ color: C.oak, fontSize: 13 }}>← Voltar</button>
            {lockBtn}
          </div>
          <h2 className="mt-4 mb-1" style={{ fontWeight: 800, fontSize: 22, color: C.amber, textTransform: "uppercase", letterSpacing: "0.03em" }}>
            👥 Cadastros
          </h2>
          <div style={{ color: C.mut, fontSize: 12, marginBottom: 10 }}>
            {rows.length} aluno{rows.length === 1 ? "" : "s"} nos 3 desafios, em ordem alfabética
            {semZap > 0 && <span style={{ color: C.oak }}> · {semZap} sem WhatsApp</span>}
          </div>
          {/* Cadastrar aluno direto por aqui */}
          {!novoCad ? (
            <button
              onClick={() => setNovoCad({ nome: "", fone: "", senha: "", track: TRACKS[0].id, erro: "" })}
              className="w-full rounded-lg px-4 py-2.5 mb-3 font-bold"
              style={{ background: C.amber, color: C.bg, fontSize: 13 }}
            >
              ➕ Cadastrar aluno
            </button>
          ) : (
            <div className="rounded-xl p-3 mb-3 flex flex-col gap-2" style={{ background: C.panel, border: `1px solid ${C.amber}66` }}>
              <div style={{ color: C.amberSoft, fontWeight: 800, fontSize: 12.5 }}>➕ Novo cadastro</div>
              <input
                value={novoCad.nome} autoFocus
                onChange={(e) => setNovoCad({ ...novoCad, nome: e.target.value, erro: "" })}
                placeholder="Nome e sobrenome"
                className="rounded-lg px-3 py-2 outline-none"
                style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.cream, fontSize: 13 }}
              />
              <div className="flex gap-2">
                <input
                  value={novoCad.fone} inputMode="numeric"
                  onChange={(e) => setNovoCad({ ...novoCad, fone: e.target.value, erro: "" })}
                  placeholder="WhatsApp com DDD"
                  className="flex-1 rounded-lg px-3 py-2 outline-none"
                  style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.cream, fontSize: 13 }}
                />
                <input
                  value={novoCad.senha}
                  onChange={(e) => setNovoCad({ ...novoCad, senha: e.target.value, erro: "" })}
                  placeholder="Senha (mín. 4)"
                  className="rounded-lg px-3 py-2 outline-none"
                  style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.cream, fontSize: 13, width: 120 }}
                />
              </div>
              <select
                value={novoCad.track}
                onChange={(e) => setNovoCad({ ...novoCad, track: e.target.value })}
                className="rounded-lg px-3 py-2 outline-none"
                style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.cream, fontSize: 13 }}
              >
                {TRACKS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
              {novoCad.erro && <div style={{ color: "#C96A76", fontSize: 11.5 }}>{novoCad.erro}</div>}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const nome = novoCad.nome.trim().replace(/\s+/g, " ");
                    if (nome.split(" ").filter((w) => w.length >= 2).length < 2) {
                      setNovoCad({ ...novoCad, erro: "Digite nome e sobrenome." }); return;
                    }
                    const fone = normPhone(novoCad.fone);
                    if (fone.length < 10 || fone.length > 11) {
                      setNovoCad({ ...novoCad, erro: "WhatsApp com DDD, só números (ex.: 18999342345)." }); return;
                    }
                    const senha = novoCad.senha.trim();
                    if (senha.length < 4) {
                      setNovoCad({ ...novoCad, erro: "A senha precisa ter ao menos 4 caracteres." }); return;
                    }
                    const jaTem = TRACKS.some((t) => ((allData[t.id] || {}).students || [])
                      .some((s) => s.name.toLowerCase() === nome.toLowerCase() || (s.phone && normPhone(s.phone) === fone)));
                    if (jaTem) {
                      setNovoCad({ ...novoCad, erro: "Já existe um cadastro com esse nome ou telefone." }); return;
                    }
                    mutateTrack(novoCad.track, (d) => {
                      d.students.push({ id: novoId(), name: nome, pass: senha, phone: fone, friends: 0, guests: [], records: [], approved: true });
                    });
                    setNovoCad(null);
                    avisar(`✓ ${nome.split(" ")[0]} cadastrada e já liberada!`);
                  }}
                  className="flex-1 rounded-lg py-2 font-bold"
                  style={{ background: C.ok, color: C.bg, fontSize: 13 }}
                >✓ Cadastrar</button>
                <button onClick={() => setNovoCad(null)} className="rounded-lg px-4 py-2"
                  style={{ border: `1px solid ${C.line}`, color: C.mut, fontSize: 13 }}>Cancelar</button>
              </div>
            </div>
          )}
          <input
            value={cadQ}
            onChange={(e) => setCadQ(e.target.value)}
            placeholder="🔍 Buscar por nome ou telefone…"
            className="w-full rounded-lg px-4 py-2.5 outline-none mb-3"
            style={{ background: C.panel, border: `1px solid ${C.line}`, color: C.cream, fontSize: 13 }}
          />
          <div className="flex flex-col gap-1.5">
            {filtrados.length === 0 && (
              <div className="text-center py-6" style={{ color: C.mut, fontSize: 13 }}>Nenhum cadastro encontrado.</div>
            )}
            {filtrados.map(({ t, s }) => {
              const em = editC && editC.tid === t.id && editC.sid === s.id;
              return (
                <div key={t.id + s.id} className="rounded-lg px-3 py-2" style={{ background: C.panel, border: `1px solid ${em ? C.amber : C.line}` }}>
                  {!em ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="truncate" style={{ color: C.cream, fontWeight: 700, fontSize: 13 }}>
                          {s.name}
                          {s.approved === false && <span className="ml-1" style={{ color: C.amberSoft, fontSize: 10 }}>⏳</span>}
                        </div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10.5, color: C.mut }}>
                          {t.short || t.label}
                          {s.phone
                            ? <a href={`https://wa.me/55${normPhone(s.phone)}`} target="_blank" rel="noreferrer" style={{ color: C.amberSoft, textDecoration: "underline", textUnderlineOffset: 2 }}> · 📱 {fmtPhone(s.phone)}</a>
                            : <span style={{ color: C.oak, fontWeight: 700 }}> · sem WhatsApp</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => setEditC({ tid: t.id, sid: s.id, name: s.name, phone: s.phone ? normPhone(s.phone) : "", pass: s.pass || "" })}
                        className="shrink-0 rounded px-1" title="Editar nome, WhatsApp e senha"
                        style={{ background: "transparent", border: "none", fontSize: 13, cursor: "pointer", opacity: 0.8 }}
                      >✏️</button>
                      <button
                        onClick={() => {
                          const k = t.id + ":" + s.id;
                          if (expC === k) { setExpC(null); } else { setExpC(k); setObsDraft(s.notes || ""); }
                        }}
                        className="shrink-0 rounded px-1" title="Ver desempenho e observações"
                        style={{ background: "transparent", border: "none", fontSize: 13, cursor: "pointer", opacity: 0.85 }}
                      >{expC === t.id + ":" + s.id ? "▾" : "📊"}</button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      <input value={editC.name} autoFocus
                        onChange={(e) => setEditC({ ...editC, name: e.target.value })}
                        placeholder="Nome e sobrenome"
                        className="rounded px-2.5 py-1.5 outline-none"
                        style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.cream, fontSize: 13 }} />
                      <input type="tel" inputMode="numeric" value={editC.phone}
                        onChange={(e) => setEditC({ ...editC, phone: e.target.value.replace(/\D/g, "").replace(/^0+/, "").slice(0, 11) })}
                        placeholder="WhatsApp — só números (ex.: 18999342345)"
                        className="rounded px-2.5 py-1.5 outline-none"
                        style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.cream, fontSize: 13 }} />
                      <input value={editC.pass}
                        onChange={(e) => setEditC({ ...editC, pass: e.target.value })}
                        placeholder="Senha (mín. 4) — vazio mantém a atual"
                        className="rounded px-2.5 py-1.5 outline-none"
                        style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.cream, fontSize: 13, fontFamily: "'DM Mono', monospace" }} />
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => {
                            const nm = editC.name.trim().replace(/\s+/g, " ");
                            if (nm.split(" ").filter((w) => w.length >= 2).length < 2) { avisar("Digite nome e sobrenome."); return; }
                            const dAll = allData[editC.tid];
                            if (dAll && dAll.students.some((x) => x.id !== editC.sid && norm(x.name) === norm(nm))) { avisar("⚠️ Já existe um aluno com esse nome neste desafio."); return; }
                            const ph = normPhone(editC.phone);
                            if (editC.phone && (ph.length < 10 || ph.length > 11)) { avisar("WhatsApp inválido — DDD + número, 10 ou 11 dígitos."); return; }
                            const pw = editC.pass.trim();
                            if (pw && pw.length < 4) { avisar("A senha precisa de pelo menos 4 caracteres."); return; }
                            mutateTrack(editC.tid, (d) => {
                              const s2 = d.students.find((x) => x.id === editC.sid);
                              if (!s2) return;
                              s2.name = nm;
                              if (ph) s2.phone = ph; else delete s2.phone;
                              if (pw) s2.pass = pw;
                              const fix = (e) => { if (e && e.id === editC.sid) e.name = nm; };
                              const w = d.winners || {};
                              Object.values(w.missions || {}).forEach(fix);
                              Object.values(w.patterns || {}).forEach(fix);
                              Object.values(w.missionQueues || {}).forEach((q) => (q || []).forEach(fix));
                              Object.values(w.placements || {}).forEach((q) => (q || []).forEach(fix));
                              (d.miniMissions || []).forEach((x) => (x.winners || []).forEach(fix));
                            });
                            setEditC(null);
                          }}
                          className="flex-1 rounded px-2 py-1.5 font-bold" style={{ background: C.ok, color: C.bg, fontSize: 12 }}>✓ Salvar</button>
                        <button onClick={() => setEditC(null)} className="rounded px-3" style={{ color: C.mut, fontSize: 12, border: `1px solid ${C.line}` }}>✕</button>
                      </div>
                    </div>
                  )}
                  {!em && expC === t.id + ":" + s.id && (() => {
                    const prevM = MISSIONS;
                    MISSIONS = TRACK_MISSIONS[t.id];
                    const M = TRACK_MISSIONS[t.id];
                    const r = computeProgress(s);
                    const dTrack = allData[t.id];
                    const AW = dTrack ? computeAwards(dTrack) : { shakes: {}, pats: {} };
                    MISSIONS = prevM;
                    const recsOk = (s.records || []).filter((x) => x.status === "ok");
                    const pendN = (s.records || []).filter((x) => x.status === "pending").length;
                    const dias = new Set(recsOk.map((x) => x.date)).size;
                    const semanas = Math.max(1, Math.ceil((new Date(todayStr() + "T12:00") - new Date(DESAFIO_INICIO + "T12:00")) / (7 * 864e5)));
                    const freq = (dias / semanas).toFixed(1).replace(".", ",");
                    const porSlot = {};
                    recsOk.forEach((x) => { porSlot[x.slot] = (porSlot[x.slot] || 0) + 1; });
                    const porProf = {};
                    recsOk.forEach((x) => { porProf[x.instructor] = (porProf[x.instructor] || 0) + 1; });
                    const gs = s.guests || [];
                    const gOk = gs.filter((g) => g.status === "ok").length;
                    const gPend = gs.filter((g) => g.status === "pending").length;
                    const gBought = gs.filter((g) => g.bought).length;
                    const shakesGanhos = M.filter((m) => AW.shakes[m.id] && AW.shakes[m.id].id === s.id).map((m) => m.name);
                    const PAT_LABELS = { horiz: "Horizontal", vert: "Vertical", diag: "Diagonal", corners: "4 Cantos", conv: "4 Conversões", full: "Cartela Cheia", bpm: "Giro de 175 BPM" };
                    const patsGanhos = Object.keys(PAT_LABELS).filter((k) => AW.pats[k] && AW.pats[k].id === s.id).map((k) => PAT_LABELS[k]);
                    const miniGanhas = [...((dTrack && dTrack.miniMissions) || []), ...(gData.miniMissions || [])].filter((x) => (x.winners || []).some((w) => w.id === s.id)).map((x) => x.name);
                    const totalAlvo = M.reduce((n, m) => n + m.target, 0);
                    const totalFeito = M.reduce((n, m) => n + Math.min(r.p[m.id], m.target), 0);
                    const pctCaminho = Math.round((totalFeito / totalAlvo) * 100);
                    const Sec = ({ children }) => (
                      <div style={{ color: C.oak, fontWeight: 800, fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.12em", marginTop: 10, marginBottom: 3 }}>{children}</div>
                    );
                    const Row = ({ a, b, dim }) => (
                      <div className="flex justify-between items-baseline" style={{ fontSize: 12, lineHeight: 1.8, color: dim ? C.mut : C.cream }}>
                        <span>{a}</span>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11 }}>{b}</span>
                      </div>
                    );
                    const conquistas = [
                      ...shakesGanhos.map((n) => `🥤 Shake do Mês — ${n}`),
                      ...patsGanhos.map((n) => `🏆 ${n}`),
                      ...miniGanhas.map((n) => `⚡ Relâmpago — ${n}`),
                    ];
                    const aulasTxt = (n) => `${n} aula${n === 1 ? "" : "s"}`;
                    return (
                      <div className="mt-2 pt-1" style={{ borderTop: `1px dashed ${C.line}` }}>
                        <Sec>🏅 Conquistas</Sec>
                        {conquistas.length
                          ? conquistas.map((c, i) => <div key={i} style={{ fontSize: 12, color: C.cream, lineHeight: 1.8 }}>{c}</div>)
                          : <div style={{ fontSize: 12, color: C.mut }}>nenhuma ainda</div>}

                        <Sec>📊 Progresso</Sec>
                        <Row a="Missões concluídas" b={`${r.doneCount}/9 · ${Math.round((r.doneCount / 9) * 100)}%`} />
                        <Row a="Caminho total percorrido" b={`${pctCaminho}%`} />

                        <Sec>🚴 Frequência</Sec>
                        <Row a="Aulas validadas" b={String(recsOk.length)} />
                        {pendN > 0 && <Row a="Aguardando validação" b={String(pendN)} />}
                        <Row a="Dias de treino" b={String(dias)} />
                        <Row a="Média semanal" b={`~${freq}x`} />

                        <Sec>⏰ Aulas por horário</Sec>
                        {WEEKDAY_SLOTS.map((sl) => (
                          <Row key={sl} a={sl.replace(":", "h")} b={aulasTxt(porSlot[sl] || 0)} dim={!porSlot[sl]} />
                        ))}
                        {WEEKEND_SLOTS.map((sl) => (
                          <Row key={sl} a={`${sl.replace(":", "h")} · fim de semana`} b={aulasTxt(porSlot[sl] || 0)} dim={!porSlot[sl]} />
                        ))}

                        <Sec>🧑‍🏫 Aulas por professor</Sec>
                        {INSTRUCTORS.map((i) => (
                          <Row key={i} a={i} b={aulasTxt(porProf[i] || 0)} dim={!porProf[i]} />
                        ))}

                        <Sec>📣 Convidados</Sec>
                        <Row a="Convidados trazidos" b={String(gs.length)} dim={!gs.length} />
                        <Row a="🧸 Fecharam pacote 10+" b={String(gBought)} dim={!gBought} />
                        {gs.map((g) => (
                          <div key={g.id} className="flex justify-between items-baseline gap-2" style={{ fontSize: 12, lineHeight: 1.8, color: C.cream }}>
                            <span className="truncate">• {g.name}{g.kind === "spin" ? " 📣" : ""}{g.bought ? " 🧸" : ""}</span>
                            <span className="shrink-0" style={{ fontFamily: "'DM Mono', monospace", fontSize: 10.5, color: g.status === "ok" ? C.ok : C.amberSoft }}>
                              {g.status === "ok" ? "✓ validado" : "pendente"}
                            </span>
                          </div>
                        ))}

                        <Sec>📝 Observações (só a administração vê)</Sec>
                        <textarea
                          value={obsDraft}
                          onChange={(e) => setObsDraft(e.target.value)}
                          placeholder="Comportamento, problemas no cadastro, combinados…"
                          rows={3}
                          className="w-full rounded px-2.5 py-2 outline-none"
                          style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.cream, fontSize: 12, resize: "vertical", fontFamily: "'Montserrat', sans-serif" }}
                        />
                        <button
                          onClick={() => {
                            mutateTrack(t.id, (d) => { const s2 = d.students.find((x) => x.id === s.id); if (s2) s2.notes = obsDraft.trim(); });
                            avisar("📝 Observação salva!");
                          }}
                          className="mt-1 rounded px-3 py-1.5 font-bold"
                          style={{ background: C.amber, color: C.cream, fontSize: 12 }}
                        >Salvar observação</button>
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
          {footerNote}
          <div className="flex justify-center pb-8">{helpBtn}</div>
        </main>
      </div>
    );
  }

  // ---------- Escolha do desafio ----------
  // ---------- Página pública: Missões e Prêmios Concluídos ----------
  if (showPremios) {
    if (admin && !entregasData) {
      loadEntregas().then((e) => setEntregasData(e)).catch(() => setEntregasData({}));
    }
    const toggleEntrega = (chave) => {
      const jaEntregue = !!(entregasData && entregasData[chave]);
      setEntregasData((prev) => {
        const novo = { ...(prev || {}) };
        if (jaEntregue) delete novo[chave]; else novo[chave] = { ts: Date.now() };
        return novo;
      });
      marcarEntrega(chave, !jaEntregue);
    };
    const PATL = {
      horiz: { label: "Linha Horizontal", prize: "Camiseta Spincycle", emoji: "👕" },
      vert:  { label: "Linha Vertical",   prize: "Camiseta Spincycle", emoji: "👕" },
      diag:  { label: "Diagonal",         prize: "Camiseta Spincycle", emoji: "👕" },
      corners:{ label: "4 Cantos",        prize: "Bolsinha Spincycle", emoji: "👜" },
      conv:  { label: "4 Conversões",     prize: "Aula temática à escolha", emoji: "🎯" },
      full:  { label: "Cartela Cheia",    prize: "Treinamento + 1 mês ilimitado", emoji: "🏆" },
      bpm:   { label: "Giro de 175 BPM", prize: "Aula fechada para 33 convidados", emoji: "⭐" },
    };
    const grupos = [];
    if (!premiosLoading && premiosData) {
      TRACKS.filter((t) => !premiosTrack || t.id === premiosTrack).forEach((t) => {
        const d = premiosData[t.id]; if (!d) return;
        const M = TRACK_MISSIONS[t.id];
        const w = d.winners || {};
        // computeAwards aplica o teto real (2 shakes e 1 padrão horiz/vert/diag por aluno, contando TODAS as missões
        // juntas) — por isso quem "ganha de verdade" pode não ser o 1º da fila daquela missão específica.
        const prevM = MISSIONS;
        MISSIONS = M;
        const AW = computeAwards(d);
        MISSIONS = prevM;
        // Shakes por missão
        M.forEach((m) => {
          const q = (w.missionQueues || {})[m.id] || [];
          if (q.length === 0) return;
          const id = `shake-${t.id}-${m.id}`;
          const vencedorId = AW.shakes[m.id] && AW.shakes[m.id].id;
          grupos.push({
            id, emoji: "🥤", label: `Shake — ${m.name}`, prize: "Shake do mês", grupo: t.short,
            entregavel: true,
            lista: q.map((e, i) => ({ pos: i + 1, nome: e.name, ts: e.ts, date: e.date, ganhouPremio: !!vencedorId && e.id === vencedorId })),
          });
        });
        // Padrões — só entram no botão de entrega os prêmios físicos/tangíveis (camiseta, bolsinha, aula temática, treinamento).
        // "Aula fechada para 33 convidados" (bpm) fica de fora: não é retirada na recepção.
        const ENTREGAVEIS_PADRAO = new Set(["horiz", "vert", "diag", "corners", "conv", "full"]);
        Object.entries(PATL).forEach(([k, info]) => {
          const arr = (w.placements || {})[k] || [];
          if (arr.length === 0) return;
          const vencedorId = AW.pats[k] && AW.pats[k].id;
          grupos.push({
            id: `pat-${t.id}-${k}`, emoji: info.emoji, label: info.label, prize: info.prize, grupo: t.short,
            entregavel: ENTREGAVEIS_PADRAO.has(k),
            lista: arr.map((e, i) => ({ pos: i + 1, nome: e.name, ts: e.ts, date: e.date, ganhouPremio: !!vencedorId && e.id === vencedorId })),
          });
        });
      });
      // Relâmpagos globais e por grupo
      const minis = [
        ...(premiosTrack ? [] : ((premiosData._global || {}).miniMissions || []).map((x) => ({ x, gr: "🌍 Todos" }))),
        ...TRACKS.filter((t) => !premiosTrack || t.id === premiosTrack)
          .flatMap((t) => ((premiosData[t.id] || {}).miniMissions || []).map((x) => ({ x, gr: t.short }))),
      ];
      minis.forEach(({ x, gr }) => {
        const ws = (x.winners || []);
        if (ws.length === 0) return;
        grupos.push({
          id: `mini-${x.id}`, emoji: "⚡", label: x.name, prize: x.prize || "prêmio relâmpago", grupo: gr,
          lista: ws.map((e, i) => ({ pos: i + 1, nome: e.name, ts: e.ts })),
        });
      });
    }
    return (
      <div className="min-h-screen" style={{ ...pageVars, background: pageBg, fontFamily: "'Montserrat', sans-serif", transition: "background .4s" }}>
        {fonts}{modal}
        <main className="max-w-md mx-auto px-5 pb-16 pt-6">
          <div className="flex items-center justify-between">
            <button onClick={() => { setShowPremios(false); setPremiosExpanded(null); setPremiosTrack(null); }} style={{ color: C.oak, fontSize: 13 }}>← Voltar</button>
            {lockBtn}
          </div>
          <h2 className="mt-4 mb-1" style={{ fontWeight: 800, fontSize: 22, color: C.amber, textTransform: "uppercase", letterSpacing: "0.03em" }}>
            🏆 Missões Concluídas
          </h2>
          <div style={{ color: C.mut, fontSize: 12, marginBottom: 12 }}>
            {premiosTrack
              ? <>Grupo <b style={{ color: C.amberSoft }}>{(TRACKS.find((t) => t.id === premiosTrack) || {}).label}</b> — toque em qualquer prêmio para ver a colocação completa.</>
              : "Prêmios já conquistados — toque em qualquer um para ver a colocação completa."}
          </div>
          {premiosTrack && (
            <button onClick={() => setPremiosTrack(null)} className="rounded-lg px-3 py-1.5 mb-3"
              style={{ background: C.panel, border: `1px solid ${C.line}`, color: C.amberSoft, fontSize: 11.5 }}>
              👥 Ver de todos os grupos
            </button>
          )}

          {premiosLoading && (
            <div className="text-center py-10" style={{ color: C.mut, fontSize: 13 }}>carregando prêmios…</div>
          )}

          {!premiosLoading && grupos.length === 0 && (
            <div className="text-center py-10 rounded-xl" style={{ background: C.panel, border: `1px solid ${C.line}`, color: C.mut, fontSize: 13 }}>
              Nenhum prêmio conquistado ainda — o desafio está apenas começando! 🚴‍♀️
            </div>
          )}

          {!premiosLoading && grupos.length > 0 && (
            <div className="flex flex-col gap-2">
              {grupos.map((g) => {
                const aberto = premiosExpanded === g.id;
                const primeiro = g.lista[0];
                return (
                  <div key={g.id} className="rounded-xl overflow-hidden" style={{ background: C.panel, border: `1px solid ${aberto ? C.amber + "77" : C.line}` }}>
                    <button
                      className="w-full px-4 py-3 text-left flex items-center gap-3"
                      onClick={() => setPremiosExpanded(aberto ? null : g.id)}
                      style={{ background: "transparent", border: "none", cursor: "pointer" }}
                    >
                      <span style={{ fontSize: 22, lineHeight: 1 }}>{g.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span style={{ color: C.cream, fontWeight: 800, fontSize: 13 }}>{g.label}</span>
                          <span className="rounded px-1.5 py-0.5" style={{ fontSize: 9.5, background: C.wineDeep, color: C.oak, fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em" }}>
                            {g.grupo}
                          </span>
                        </div>
                        <div style={{ color: C.mut, fontSize: 11, marginTop: 2 }}>{g.prize}</div>
                        {primeiro && (
                          <div style={{ color: C.ok, fontSize: 11.5, marginTop: 3, fontWeight: 700 }}>
                            🥇 {primeiro.nome}
                            {primeiro.ts ? <span style={{ color: C.mut, fontWeight: 400 }}> · {fmtDT(primeiro.ts)}</span> : primeiro.date ? <span style={{ color: C.mut, fontWeight: 400 }}> · {fmtBR(primeiro.date)}</span> : ""}
                            {g.lista.length > 1 && <span style={{ color: C.mut, fontWeight: 400 }}> +{g.lista.length - 1} mais</span>}
                          </div>
                        )}
                      </div>
                      <span style={{ color: C.mut, fontSize: 16 }}>{aberto ? "▲" : "▼"}</span>
                    </button>

                    {aberto && (
                      <div className="px-4 pb-3 flex flex-col gap-1.5">
                        <div style={{ height: 1, background: C.line, marginBottom: 6 }} />
                        {g.lista.map((e) => {
                          const chave = `${g.id}::${e.pos}::${e.nome}`;
                          const entregue = !!(entregasData && entregasData[chave]);
                          return (
                          <div key={e.pos} className="flex items-center gap-3 rounded-lg px-3 py-2" style={{ background: C.panelSoft }}>
                            <div style={{
                              width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                              fontWeight: 800, fontSize: 13, flexShrink: 0,
                              background: e.pos === 1 ? "#B8860B" : e.pos === 2 ? "#888" : e.pos === 3 ? "#7B5B3A" : C.wineDeep,
                              color: e.pos <= 3 ? "#FFF" : C.mut,
                            }}>
                              {e.pos === 1 ? "🥇" : e.pos === 2 ? "🥈" : e.pos === 3 ? "🥉" : e.pos}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="truncate" style={{ color: C.cream, fontWeight: 700, fontSize: 13 }}>
                                {e.nome}
                                {g.entregavel && e.ganhouPremio && (
                                  <span style={{ color: C.ok, fontWeight: 800, fontSize: 10.5, marginLeft: 6 }}>🎁 ganhou</span>
                                )}
                              </div>
                              <div style={{ color: C.mut, fontSize: 11, fontFamily: "'DM Mono', monospace" }}>
                                {e.ts ? fmtDT(e.ts) : e.date ? fmtBR(e.date) : "—"}
                              </div>
                            </div>
                            {admin && g.entregavel && e.ganhouPremio && (
                              <button
                                onClick={() => toggleEntrega(chave)}
                                className="rounded-lg px-2.5 py-1.5 shrink-0 font-bold"
                                style={{
                                  fontSize: 11,
                                  background: entregue ? C.ok + "22" : "transparent",
                                  border: `1px solid ${entregue ? C.ok : C.line}`,
                                  color: entregue ? C.ok : C.mut,
                                }}
                              >
                                {entregue ? "✅ Entregue" : "◻️ Marcar entrega"}
                              </button>
                            )}
                          </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {footerNote}
          <div className="flex justify-center pb-8">{helpBtn}</div>
        </main>
      </div>
    );
  }

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
            <h1
              onClick={() => { setView(null); setSpy(false); setShowManual(false); setShowPend(false); setShowCad(false); setShowEntry(false); setLoginMode(false); setShowSignup(false); setRecMode(false); setData(null); setTrack(null); }}
              title="Voltar ao início"
              style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 34, letterSpacing: "0.04em", color: C.cream, textTransform: "uppercase", lineHeight: 1.05, marginTop: 6, cursor: "pointer" }}
            >
              Desafio das <span style={{ color: C.amber, textShadow: `0 0 24px ${C.amber}66` }}>Missões</span>
            </h1>
            <div className="mx-auto mt-4" style={{ width: 56, height: 3, background: `linear-gradient(90deg, ${C.amber}, ${C.amberSoft})`, borderRadius: 2 }} />
          </div>
        </header>
        <main className="max-w-md mx-auto px-5 pb-16">
          {/* ---- Grade de atalhos do admin (2 colunas) ---- */}
          {admin && (() => {
            const nPend = (() => {
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
            })();
            const nCad = TRACKS.reduce((n, t) => n + ((allData[t.id] || {}).students || []).length, 0);
            const Atalho = ({ icone, titulo, badge, destaque, onClick }) => (
              <button onClick={() => { onClick(); window.scrollTo({ top: 0 }); }}
                className="rounded-xl px-3 py-4 flex flex-col items-center justify-center gap-2"
                style={{ background: C.panel, border: `1px solid ${destaque ? C.amber + "88" : C.line}`, minHeight: 92 }}>
                <span style={{ fontSize: 22, lineHeight: 1 }}>{icone}</span>
                <span style={{ color: C.amberSoft, fontWeight: 800, fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "center", lineHeight: 1.25 }}>
                  {titulo}
                </span>
                {badge != null && (
                  <span className="rounded-full px-2" style={{ background: destaque ? C.amber : C.wineDeep, color: destaque ? C.bg : C.amberSoft, fontSize: 10.5, fontWeight: 800 }}>
                    {badge}
                  </span>
                )}
              </button>
            );
            return (
              <div className="grid grid-cols-2 gap-2 mt-4 mb-5">
                <Atalho icone="📋" titulo="Pendências" badge={nPend} destaque={nPend > 0} onClick={() => setShowPend(true)} />
                <Atalho icone="👥" titulo="Cadastros" badge={nCad} onClick={() => { setShowCad(true); setCadQ(""); setEditC(null); }} />
                <Atalho icone="🏅" titulo="Desempenho do desafio" onClick={() => setShowWins(true)} />
                <Atalho icone="⚡" titulo="Missões relâmpago" onClick={() => setShowMM(true)} />
                <Atalho icone="📊" titulo="Relatório geral" onClick={() => setShowRel(true)} />
                <Atalho icone="📈" titulo="Comportamento dos usuários" onClick={() => setShowUso(true)} />
              </div>
            );
          })()}

          {/* ---- Grupos de alunos ---- */}
          {admin && (
            <div className="flex items-center gap-3 mb-2">
              <span style={{ color: C.amberSoft, fontWeight: 800, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.12em" }}>
                Grupos de alunos
              </span>
              <span style={{ flex: 1, height: 1, background: C.line }} />
            </div>
          )}
          {!admin && (
            <p className="text-center mt-4 mb-4" style={{ color: C.mut, fontSize: 14 }}>
              Escolha o desafio do seu plano:
            </p>
          )}
          <div className="flex flex-col gap-3">
            {TRACKS.map((t) => {
              const cartao = (
                <button
                  onClick={() => { setData(null); setView(null); setShowSignup(false); setTrack(t.id); saveTrackPref(t.id); }}
                  className="rounded-xl px-5 py-4 text-left w-full h-full"
                  style={{ background: C.panel, border: `1px solid ${C.line}` }}
                >
                  <div style={{ color: C.amberSoft, fontWeight: 800, fontSize: 17, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                    {t.label}
                  </div>
                  <div style={{ color: C.mut, fontSize: 12, marginTop: 2 }}>{t.sub}</div>
                  {trackCounts[t.id] != null && (
                    <div style={{ color: C.amberSoft, fontSize: 11.5, marginTop: 5, fontWeight: 700 }}>
                      👥 {trackCounts[t.id]} participante{trackCounts[t.id] === 1 ? "" : "s"}
                    </div>
                  )}
                  {t.note && (
                    <div style={{ color: C.oak, fontSize: 10.5, marginTop: 6, fontStyle: "italic" }}>{t.note}</div>
                  )}
                </button>
              );
              if (!admin) return <div key={t.id}>{cartao}</div>;
              return (
                <div key={t.id} className="flex gap-2 items-stretch">
                  <div className="flex-1 min-w-0">{cartao}</div>
                  <button
                    onClick={() => {
                      setPremiosTrack(t.id);
                      setShowPremios(true);
                      if (!premiosData) {
                        setPremiosLoading(true);
                        (async () => {
                          const out = {};
                          for (const tt of TRACKS) {
                            try { out[tt.id] = await loadData(tt.id); } catch { out[tt.id] = null; }
                          }
                          let gl = { miniMissions: [] };
                          try { gl = await loadGlobal(); } catch { /* ok */ }
                          out._global = gl;
                          setPremiosData(out);
                          setPremiosLoading(false);
                        })();
                      }
                      window.scrollTo({ top: 0 });
                    }}
                    className="rounded-xl px-3 py-3 flex flex-col items-center justify-center gap-1.5 shrink-0"
                    style={{ background: C.panel, border: `1px solid ${C.line}`, width: 104 }}
                  >
                    <span style={{ fontSize: 20, lineHeight: 1 }}>🏆</span>
                    <span style={{ color: C.amberSoft, fontWeight: 800, fontSize: 9.5, textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "center", lineHeight: 1.25 }}>
                      Missões concluídas
                    </span>
                    <span style={{ width: 22, height: 2, background: C.amber }} />
                  </button>
                </div>
              );
            })}
          </div>
          {!admin && (
            <button
              onClick={() => {
                setShowPremios(true);
                if (!premiosData) {
                  setPremiosLoading(true);
                  (async () => {
                    const out = {};
                    for (const t of TRACKS) {
                      try { out[t.id] = await loadData(t.id); } catch { out[t.id] = null; }
                    }
                    let gl = { miniMissions: [] };
                    try { gl = await loadGlobal(); } catch { /* ok */ }
                    out._global = gl;
                    setPremiosData(out);
                    setPremiosLoading(false);
                  })();
                }
                window.scrollTo({ top: 0 });
              }}
              className="w-full rounded-lg px-3 py-2.5 mt-3 text-center font-bold"
              style={{ background: C.panel, color: C.ok, fontSize: 13, border: `1px solid ${C.ok}44` }}
            >
              🏆 MISSÕES CONCLUÍDAS → ver prêmios e colocações
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
        semanaEx: "7 dias seguidos, sem pular nenhum. Pode começar em qualquer dia — os horários do fim de semana ajudam a manter a sequência.",
        fogoEx: "De 10 a 21 de agosto sem falhar um dia = 12 dias de fogo.",
      },
      pacote: {
        dobraDica: "2 dobradinhas custam só 4 aulas do seu pacote — escolha os dias com carinho.",
        maratonaEx: "3 a 4 aulas por semana desde o início fecham os 16 dias com folga.",
        semanaEx: "Ex.: quinta, sexta, sábado, domingo e segunda = 5 dias seguidos. ✅",
        fogoEx: "Quarta a domingo sem falhar = 5 dias seguidos (o fim de semana é seu aliado).",
      },
      passe: {
        dobraDica: "Os apps permitem 1 check-in por dia — a 2ª aula da dobradinha pode ser 1 aula avulsa. É só uma vez no desafio inteiro!",
        maratonaEx: "3 a 4 check-ins por semana desde o início fecham os 15 dias tranquilamente.",
        semanaEx: "Ex.: sexta, sábado, domingo e segunda = 4 dias seguidos. ✅",
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
        meta: `${TG.semana} dias seguidos`,
        como: TG.semana === 7
          ? "Treinar 7 dias seguidos, sem falhar nenhum. A sequência pode começar em qualquer dia da semana."
          : `Treinar ${TG.semana} dias seguidos, sem falhar nenhum. A sequência pode começar em qualquer dia da semana.`,
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
            Aulas valem de 6 de agosto a 20 de setembro de 2026
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
              {bullet(<span><b>Cadastre-se</b> com nome e sobrenome, crie sua senha e informe seu WhatsApp (só você acessa sua cartela — e o WhatsApp é sua chave se esquecer a senha).</span>, 1)}
              {bullet(<span>A recepção <b>libera seu cadastro</b> e você já pode registrar.</span>, 2)}
              {bullet(<span><b>Registre cada aula</b> no app (data, horário e professor). O registro fica <b>pendente</b> até a recepção validar.</span>, 3)}
              {bullet(<span>Esqueceu de registrar? Sem pânico: dá para registrar <b>dias anteriores</b> (a partir de 6/ago). Datas futuras não valem.</span>, 4)}
              {bullet(<span>Existem <b>3 desafios separados</b> — Ilimitados, Pacotes e Híbridos. Cada grupo compete apenas entre si, com metas ajustadas ao seu ritmo.</span>, 5)}
              {bullet(<span><b>Esqueceu a senha?</b> Toque em "🔑 Esqueci minha senha", confirme seu nome + o WhatsApp cadastrado e crie uma nova na hora — sem precisar da recepção.</span>, 7)}
              {bullet(<span><b>O check-in é feito APÓS o fim da aula</b> — nem um minuto antes ou durante. Se houver denúncia de check-in antes do término, o registro será conferido e <b>anulado</b>.</span>, 8)}
              {bullet(<span><b>Critério de desempate</b> de qualquer prêmio: o <b>horário do check-in</b> — quem registrou primeiro leva.</span>, 9)}
              {bullet(<span><b>Desafio válido apenas para a modalidade de BIKE.</b> Aulas de <b>Strong Basics não valem como check-in</b> e não fazem parte do desafio.</span>, 10)}
              {bullet(<span><b>Desempate do desafio inteiro:</b> a missão <b>⭐ Giro de 175 BPM</b> é o critério — <b>quanto mais rápido você completá-la, mais chance tem</b>. Quem fechar primeiro a cartela cheia + as 4 vendas de pacote 10+ leva.</span>, 11)}
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
    const ph = normPhone(newPhone);
    if (ph.length < 10 || ph.length > 11) {
      setNameErr("Digite seu WhatsApp com DDD, só números, sem espaços (ex.: 18999342345).");
      return;
    }
    const nid = novoId();
    mutate((d) => d.students.push({ id: nid, name, pass: pw, phone: ph, friends: 0, guests: [], records: [], approved: admin }));
    const nu = { ...unlocks, [nid]: pw };
    setUnlocks(nu); saveUnlocks(nu);
    const nm = { ...myIds, [track]: nid };
    setMyIds(nm); saveMyIds(nm);
    setNewName(""); setNewPass(""); setNewPhone("");
    setNameErr("");
    if (!admin) { setShowSignup(false); setRegOk(true); setTimeout(() => setRegOk(false), 6000); }
  };

  const validaData = (d) => {
    if (d < DESAFIO_INICIO) return `O desafio começa em 6/ago — só valem aulas a partir dessa data.`;
    if (d > todayStr()) return "Não dá para registrar aulas de datas futuras.";
    return "";
  };

  const addRecord = () => {
    if (!form.date || !form.instructor) return;
    if (!form.slot) { setRecErr("Selecione o horário da aula."); return; }
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
        id: novoId(),
        reg: Date.now(),
        status: admin ? "ok" : "pending",
      });
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const addQuickRecord = () => {
    if (!qform.studentId || !qform.date || !qform.instructor) return;
    if (!qform.slot) { setQErr("Selecione o horário da aula."); return; }
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
        id: novoId(),
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
    // Aluno já da casa convidado ao desafio (📣) não faz aula experimental → horário não se aplica
    if (gform.kind !== "spin" && !gform.slot) { setGErr("Selecione o horário da aula experimental do seu convidado."); return; }
    if (gform.kind === "spin") {
      const usados = (student.guests || []).filter((g) => g.kind === "spin").length;
      if (usados >= 2) { setGErr("⚠️ Você já usou seus 2 convites de ALUNO CONVIDADO AO DESAFIO (📣)."); return; }
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
        id: novoId(),
        name,
        date: gform.date,
        slot: gform.slot,
        kind: gform.kind || "novo",
        reg: Date.now(),
        status: admin ? "ok" : "pending",
      });
    });
    setGform({ name: "", date: todayStr(), slot: "", kind: "novo" });
    setGErr("");
    setGSaved(true);
    setTimeout(() => setGSaved(false), 3000);
  };

  // ---------- Resultados das Missões Relâmpago ----------
  if (miniPage && track && data) {
    const misturadas = [...(gData.miniMissions || []), ...(data.miniMissions || [])].sort((a, b) => (a.id < b.id ? 1 : -1));
    const voltarBtn = (fn, rotulo) => (
      <button onClick={fn} style={{ color: C.oak, fontSize: 13 }}>{rotulo}</button>
    );
    if (miniPage === "list") {
      return (
        <div className="min-h-screen" style={{ ...pageVars, background: pageBg, fontFamily: "'Montserrat', sans-serif", transition: "background .4s" }}>
          {fonts}{modal}
          <main className="max-w-md mx-auto px-5 pb-16 pt-6">
            <div className="flex items-center justify-between">
              {voltarBtn(() => setMiniPage(null), "← Voltar")}
              {helpBtn}
            </div>
            <h2 className="mt-4 mb-1" style={{ fontWeight: 800, fontSize: 22, color: C.amber, textTransform: "uppercase", letterSpacing: "0.03em" }}>
              ⚡ Missões Relâmpago
            </h2>
            <div style={{ color: C.mut, fontSize: 12, marginBottom: 12 }}>
              Toque em uma missão para ver o resultado completo.
            </div>
            <div className="flex flex-col gap-2">
              {misturadas.map((x) => {
                const fase = mmPhase(x, Date.now());
                const ws = x.winners || [];
                return (
                  <button
                    key={x.id}
                    onClick={() => { setMiniPage(x.id); window.scrollTo({ top: 0 }); }}
                    className="rounded-xl px-4 py-3 text-left"
                    style={{ background: C.panel, border: `1px solid ${fase === "ativa" ? C.amber : C.line}` }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div style={{ color: C.cream, fontWeight: 800, fontSize: 13, textTransform: "uppercase" }}>
                        ⚡ {x.scope === "todos" ? "🌍 " : x.scope === "grupos" ? "🥇 " : x.scope === "aula" ? "🚴 " : ""}{x.name}
                      </div>
                      <div className="shrink-0" style={{ color: fase === "ativa" ? C.amberSoft : C.mut, fontSize: 11, fontWeight: 700 }}>
                        {fase === "agendada" ? "⏳ agendada" : fase === "ativa" ? "⏱️ rolando" : "🏁 resultado"}
                      </div>
                    </div>
                    <div style={{ color: C.mut, fontSize: 11.5, marginTop: 3, fontFamily: "'DM Mono', monospace" }}>
                      {fmtDT(mmStartTs(x))} → {fmtDT(mmEndTs(x))} · 🏆 {x.prize} ({ws.length}/{x.qty})
                    </div>
                  </button>
                );
              })}
            </div>
            {footerNote}
            <div className="flex justify-center pb-8">{helpBtn}</div>
          </main>
        </div>
      );
    }
    const x = misturadas.find((y) => y.id === miniPage);
    if (!x) { setMiniPage("list"); return null; }
    const fase = mmPhase(x, Date.now());
    const ws = (x.winners || []).slice().sort((a, b) => (a.ts || 0) - (b.ts || 0));
    const idsW = new Set(ws.map((w) => w.id));
    const logOrd = (x.log || []).slice().sort((a, b) => (a.ts || 0) - (b.ts || 0));
    const mostraGabarito = fase === "resultado" || fase === "encerrada";
    return (
      <div className="min-h-screen" style={{ ...pageVars, background: pageBg, fontFamily: "'Montserrat', sans-serif", transition: "background .4s" }}>
        {fonts}{modal}
        <main className="max-w-md mx-auto px-5 pb-16 pt-6">
          <div className="flex items-center justify-between">
            <button onClick={() => setMiniPage("list")} style={{ color: C.oak, fontSize: 13 }}>← Todas as relâmpago</button>
            <button onClick={() => setMiniPage(null)} style={{ color: C.oak, fontSize: 13 }}>✕ fechar</button>
          </div>
          <h2 className="mt-4 mb-1" style={{ fontWeight: 800, fontSize: 20, color: C.amber, textTransform: "uppercase", letterSpacing: "0.03em", lineHeight: 1.3 }}>
            ⚡ {x.scope === "todos" ? "🌍 " : x.scope === "grupos" ? "🥇 " : x.scope === "aula" ? "🚴 " : ""}{x.name}
          </h2>
          <div style={{ color: C.mut, fontSize: 12, marginBottom: 4, fontFamily: "'DM Mono', monospace" }}>
            {fmtDT(mmStartTs(x))} → {fmtDT(mmEndTs(x))} · 🏆 {x.prize}
          </div>
          <div style={{ color: C.cream, fontSize: 13, lineHeight: 1.55, marginBottom: 12 }}>{x.desc}</div>
          {(x.mode === "quizText" || x.mode === "quizChoice") && mostraGabarito && (
            <div className="rounded-lg px-3 py-2 mb-3" style={{ background: C.panelSoft, border: `1px solid ${C.ok}66`, color: C.ok, fontSize: 12.5, fontWeight: 700 }}>
              ✓ Resposta correta: {x.mode === "quizChoice" ? x.correct : (x.answers || [])[0]}
            </div>
          )}
          {fase === "ativa" && (
            <div className="rounded-lg px-3 py-2 mb-3" style={{ background: C.wineDeep, color: C.amberSoft, fontSize: 12.5, fontWeight: 700 }}>
              ⏱️ Missão ainda rolando — resultado completo às {fmtHM(mmEndTs(x))}!
            </div>
          )}

          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.25em", color: C.oak, textTransform: "uppercase", margin: "14px 0 6px" }}>
            🏆 Vencedores
          </div>
          {ws.length === 0 && <div style={{ color: C.mut, fontSize: 12.5 }}>Ainda sem vencedores{fase === "ativa" ? "…" : "."}</div>}
          <div className="flex flex-col gap-1">
            {ws.map((w, i) => (
              <div key={w.id + i} className="rounded-lg px-3 py-2 flex items-center gap-2" style={{ background: C.panel, border: `1px solid ${C.oak}66` }}>
                <span className="shrink-0" style={{ fontWeight: 800, color: C.oak, fontSize: 13 }}>{i + 1}º</span>
                <span className="flex-1 min-w-0 truncate" style={{ color: C.amber, fontWeight: 700, fontSize: 13 }}>{w.name}</span>
                <span className="shrink-0" style={{ fontFamily: "'DM Mono', monospace", fontSize: 10.5, color: C.mut }}>{w.ts ? fmtTs(w.ts) : ""}</span>
              </div>
            ))}
          </div>

          {(x.mode === "quizText" || x.mode === "quizChoice") && (
            <>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.25em", color: C.oak, textTransform: "uppercase", margin: "16px 0 6px" }}>
                Todas as respostas · {logOrd.length}
              </div>
              {!mostraGabarito && logOrd.length > 0 && (
                <div style={{ color: C.mut, fontSize: 12 }}>As respostas de todo mundo aparecem aqui quando a missão encerrar. 🤫</div>
              )}
              {mostraGabarito && logOrd.length === 0 && (
                <div style={{ color: C.mut, fontSize: 12 }}>Nenhuma resposta registrada (ou missão criada antes desse recurso).</div>
              )}
              {mostraGabarito && (
                <div className="flex flex-col gap-1">
                  {logOrd.map((l, i) => (
                    <div key={i} className="rounded-lg px-3 py-1.5 flex items-center gap-2" style={{ background: C.panelSoft, border: `1px solid ${C.line}` }}>
                      <span className="shrink-0" style={{ fontFamily: "'DM Mono', monospace", fontSize: 10.5, color: C.mut }}>{fmtHM(l.ts)}</span>
                      <span className="min-w-0 truncate" style={{ color: idsW.has(l.sid) && l.ok ? C.amber : C.cream, fontWeight: 700, fontSize: 12.5 }}>{l.name}</span>
                      <span className="flex-1 min-w-0 truncate" style={{ color: C.mut, fontSize: 12, fontStyle: "italic" }}>“{l.ans}”</span>
                      <span className="shrink-0" style={{ fontSize: 12 }}>{l.ok ? "✅" : "❌"}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          {footerNote}
          <div className="flex justify-center pb-8">{helpBtn}</div>
        </main>
      </div>
    );
  }

  // ---------- Entrar nas Missões (menu de acesso) ----------
  if (showEntry && !admin) {
    const entrarDireto = () => {
      const sid = myIds[track];
      const s = sid ? data.students.find((x) => x.id === sid) : null;
      if (s && s.pass && unlocks[s.id] === s.pass) {
        setShowEntry(false); setSpy(false);
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
                  placeholder="Crie uma senha (mín. 4 caracteres)"
                  className="rounded-lg px-4 py-3 outline-none"
                  style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.cream }}
                />
                <input
                  type="tel"
                  inputMode="numeric"
                  value={newPhone}
                  onChange={(e) => { setNewPhone(e.target.value.replace(/\D/g, "").replace(/^0+/, "").slice(0, 11)); setNameErr(""); }}
                  onKeyDown={(e) => e.key === "Enter" && addStudent()}
                  placeholder="Seu WhatsApp — só números (ex.: 18999342345)"
                  className="rounded-lg px-4 py-3 outline-none"
                  style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.cream }}
                />
                <div style={{ color: C.mut, fontSize: 11, marginTop: -4 }}>
                  📱 Usado apenas para recuperar sua senha e contatos do desafio — só a administração vê.
                </div>
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
        setLoginMode(false); setLoginPass(""); setLoginErr(""); setSpy(false);
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
          {!recMode ? (
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
              autoComplete="username"
              name="username"
              style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.cream }}
            />
            <input
              type="password"
              name="password"
              autoComplete="current-password"
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
            <button
              onClick={() => { setRecMode(true); setRcName(loginName.trim()); setRcPhone(""); setRcPass(""); setRcErr(""); setRcStep(1); }}
              className="block w-full text-center mt-3"
              style={{ color: C.oak, fontSize: 12.5, textDecoration: "underline", textUnderlineOffset: 3, background: "transparent", border: "none" }}
            >
              🔑 Esqueci minha senha
            </button>
          </section>
          ) : (
          <section className="rounded-xl p-4" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
            <p style={{ color: C.mut, fontSize: 13, marginBottom: 12 }}>
              🔑 Recuperar senha: confirme seu nome e o WhatsApp que você cadastrou.
            </p>
            <input
              value={rcName}
              disabled={rcStep === 2}
              onChange={(e) => { setRcName(e.target.value); setRcErr(""); }}
              placeholder="Seu nome e sobrenome"
              className="w-full rounded-lg px-4 py-3 outline-none mb-2"
              style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.cream, opacity: rcStep === 2 ? 0.6 : 1 }}
            />
            <input
              type="tel"
              inputMode="numeric"
              value={rcPhone}
              disabled={rcStep === 2}
              onChange={(e) => { setRcPhone(e.target.value.replace(/\D/g, "").replace(/^0+/, "").slice(0, 11)); setRcErr(""); }}
              placeholder="Seu WhatsApp (só números, ex.: 18999342345)"
              className="w-full rounded-lg px-4 py-3 outline-none mb-2"
              style={{ background: C.panelSoft, border: `1px solid ${rcErr && rcStep === 1 ? "#B15560" : C.line}`, color: C.cream, opacity: rcStep === 2 ? 0.6 : 1 }}
            />
            {rcStep === 1 ? (
              <>
                {rcErr && <div className="mb-2" style={{ color: "#C96A76", fontSize: 12 }}>{rcErr}</div>}
                <button
                  onClick={() => {
                    const s = data.students.find((x) => norm(x.name) === norm(rcName));
                    if (!s) { setRcErr("Não encontramos esse nome neste desafio — confira se você está no desafio certo (Ilimitados, Pacotes ou Híbridos)."); return; }
                    if (!s.phone) { setRcErr("Seu cadastro ainda não tem WhatsApp registrado. Toque no botão 💬 AJUDA que a recepção redefine rapidinho."); return; }
                    if (!phonesMatch(s.phone, rcPhone)) { setRcErr("O WhatsApp digitado não confere com o do cadastro."); return; }
                    setRcErr(""); setRcStep(2);
                  }}
                  className="w-full rounded-lg py-3 font-bold"
                  style={{ background: `linear-gradient(120deg, ${C.amber}, #16696F)`, color: C.cream }}
                >
                  Verificar
                </button>
              </>
            ) : (
              <>
                <div className="mb-2" style={{ color: C.ok, fontSize: 12.5, fontWeight: 700 }}>✓ Identidade confirmada! Agora crie sua nova senha:</div>
                <input
                  type="password"
                  name="new-password"
                  autoComplete="new-password"
                  autoFocus
                  value={rcPass}
                  onChange={(e) => { setRcPass(e.target.value); setRcErr(""); }}
                  placeholder="Nova senha (mín. 4 caracteres)"
                  className="w-full rounded-lg px-4 py-3 outline-none mb-2"
                  style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.cream }}
                />
                {rcErr && <div className="mb-2" style={{ color: "#C96A76", fontSize: 12 }}>{rcErr}</div>}
                <button
                  onClick={() => {
                    const pw = rcPass.trim();
                    if (pw.length < 4) { setRcErr("A senha precisa de pelo menos 4 caracteres."); return; }
                    const s = data.students.find((x) => norm(x.name) === norm(rcName));
                    if (!s) { setRcErr("Algo deu errado — recomece."); setRcStep(1); return; }
                    mutate((d) => { const s2 = d.students.find((x) => x.id === s.id); if (s2) s2.pass = pw; });
                    const nu = { ...unlocks, [s.id]: pw }; setUnlocks(nu); saveUnlocks(nu);
                    const nm = { ...myIds, [track]: s.id }; setMyIds(nm); saveMyIds(nm);
                    setRecMode(false); setRcName(""); setRcPhone(""); setRcPass(""); setRcStep(1);
                    setLoginMode(false); setSpy(false);
                    setView(s.id); setDetailMission(null); setShowAllHist(false); setConfirmRemove(false);
                  }}
                  className="w-full rounded-lg py-3 font-bold"
                  style={{ background: `linear-gradient(120deg, ${C.amber}, #16696F)`, color: C.cream }}
                >
                  Salvar nova senha e entrar
                </button>
              </>
            )}
            <button
              onClick={() => { setRecMode(false); setRcErr(""); setRcStep(1); }}
              className="block w-full text-center mt-3"
              style={{ color: C.oak, fontSize: 12.5, background: "transparent", border: "none" }}
            >
              ← voltar ao login
            </button>
          </section>
          )}
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
      .map((s) => {
        const r = computeProgress(s);
        const feito = MISSIONS.reduce((n, m) => n + Math.min(r.p[m.id], m.target), 0);
        return { s, r, feito };
      })
      .sort((a, b) => b.feito - a.feito || b.r.doneCount - a.r.doneCount || b.r.p.maratona - a.r.p.maratona || a.s.name.localeCompare(b.s.name))
      .map((e, idx) => ({ ...e, pos: idx }));
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
            <h1
              onClick={() => { setView(null); setSpy(false); setShowManual(false); setShowPend(false); setShowCad(false); setShowEntry(false); setLoginMode(false); setShowSignup(false); setRecMode(false); setData(null); setTrack(null); }}
              title="Voltar ao início"
              style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 34, letterSpacing: "0.04em", color: C.cream, textTransform: "uppercase", lineHeight: 1.05, marginTop: 6, cursor: "pointer" }}
            >
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

          <input
            value={rankQ}
            onChange={(e) => setRankQ(e.target.value)}
            placeholder="🔍 Buscar aluno no ranking…"
            className="w-full rounded-lg px-4 py-2.5 outline-none mb-2"
            style={{ background: C.panel, border: `1px solid ${C.line}`, color: C.cream, fontSize: 13 }}
          />
          <div className="flex flex-col gap-2">
            {(rankQ.trim()
              ? ranked.filter(({ s }) => norm(s.name).includes(norm(rankQ)))
              : (showAllRank ? ranked : ranked.slice(0, 5))
            ).map(({ s, r, pos }) => (
              <button
                key={s.id}
                onClick={() => {
                  const dono = admin || (s.pass && unlocks[s.id] === s.pass);
                  setSpy(!dono);
                  setView(s.id); setDetailMission(null); setShowAllHist(false); setConfirmRemove(false);
                  window.scrollTo({ top: 0 });
                }}
                className="rounded-xl px-4 py-3 flex items-center gap-3 text-left"
                style={{ background: C.panel, border: `1px solid ${r.full ? C.amber : C.line}`, cursor: "pointer" }}
              >
                {(() => {
                  const medal = r.doneCount > 0 && pos < 3 ? [
                    { bg: "linear-gradient(135deg, #E8C169, #B08D3E)", bd: "#F2D98C", glow: "#D9A95466" },
                    { bg: "linear-gradient(135deg, #D7DBE0, #9FA6AD)", bd: "#E8ECF0", glow: "#C0C4C955" },
                    { bg: "linear-gradient(135deg, #C98F5A, #8E5F33)", bd: "#DFA877", glow: "#B07A4A55" },
                  ][pos] : null;
                  const foto = photos[s.id];
                  return (
                    <div className="relative shrink-0" style={{ width: 38, height: 38 }}>
                      <div className="flex items-center justify-center rounded-full overflow-hidden" style={{
                        width: 38, height: 38,
                        background: medal ? medal.bg : C.panelSoft,
                        color: medal ? "#141414" : C.mut,
                        border: medal ? `2px solid ${medal.bd}` : `1px solid ${C.line}`,
                        boxShadow: medal ? `0 0 10px ${medal.glow}` : "none",
                        fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 500,
                      }}>
                        {foto ? <img src={foto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (pos + 1)}
                      </div>
                      {foto && (
                        <div className="absolute flex items-center justify-center rounded-full" style={{
                          bottom: -3, right: -3, width: 17, height: 17,
                          background: medal ? medal.bg : "#2A2A2C",
                          color: medal ? "#141414" : C.mut,
                          border: medal ? `1.5px solid ${medal.bd}` : `1px solid ${C.line}`,
                          fontFamily: "'DM Mono', monospace", fontSize: 9.5, fontWeight: 700,
                        }}>
                          {pos + 1}
                        </div>
                      )}
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
                                onClick={() => { mutate((d) => { purgeStudentWins(d, s.id); d.students = d.students.filter((y) => y.id !== s.id); }); setConfirmRefuse(null); }}
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

          {(() => {
            const AW = computeAwards(data);
            const winners = MISSIONS.map((m) => ({ m, best: AW.shakes[m.id] || null }));
            return (
              <section className="rounded-xl p-4 mt-6" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.25em", color: C.oak, textTransform: "uppercase", marginBottom: 10 }}>
                  🥤 Shake do Mês · 1º de cada missão
                </div>
                <div className="flex flex-col gap-1.5">
                  {winners.map(({ m, best }) => {
                    const dk = `m:${m.id}`;
                    return (
                    <div key={m.id} className="flex items-center gap-2">
                      <div className="shrink-0" style={{ width: 128, fontSize: 11, fontWeight: 700, color: best ? C.cream : C.mut, textTransform: "uppercase", lineHeight: 1.2 }}>
                        {m.name}
                      </div>
                      {admin && addOpen === dk && !best ? (
                        <select autoFocus defaultValue="" onChange={(e) => e.target.value && addWinManual("m", m.id, e.target.value)}
                          className="flex-1 min-w-0 rounded px-2 py-1 outline-none" style={{ background: C.panelSoft, border: `1px solid ${C.amber}`, color: C.cream, fontSize: 12 }}>
                          <option value="" disabled>Premiar aluno…</option>
                          {data.students.filter((s) => s.approved !== false).sort((a, b) => a.name.localeCompare(b.name)).map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="flex-1 min-w-0 truncate" style={{ fontSize: 12, color: best ? C.amber : C.mut, fontWeight: best ? 700 : 400 }}>
                          {best ? best.name : "em aberto"}
                        </div>
                      )}
                      {best && confirmDel !== dk && (
                        <div className="shrink-0" style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.mut }}>
                          {best.reg ? fmtTs(best.reg) : best.ts ? fmtTs(best.ts) : fmtBR(best.date)}
                        </div>
                      )}
                      {admin && best && confirmDel !== dk && (
                        <button onClick={() => setConfirmDel(dk)} className="shrink-0 rounded px-1.5" title="Excluir conquista"
                          style={{ color: "#C96A76", fontSize: 12, border: `1px solid ${C.line}` }}>✕</button>
                      )}
                      {admin && best && confirmDel === dk && (
                        <div className="shrink-0 flex items-center gap-1">
                          <span style={{ color: "#C96A76", fontSize: 9.5, fontWeight: 700 }}>Irreversível!</span>
                          <button onClick={() => { delWin("m", m.id, best.id); setConfirmDel(""); }}
                            className="rounded px-1.5 py-0.5 font-bold" style={{ background: "#B15560", color: C.cream, fontSize: 10 }}>SIM</button>
                          <button onClick={() => setConfirmDel("")} className="rounded px-1.5 py-0.5" style={{ color: C.mut, fontSize: 10, border: `1px solid ${C.line}` }}>não</button>
                        </div>
                      )}
                      {admin && !best && (
                        <button onClick={() => setAddOpen(addOpen === dk ? "" : dk)} className="shrink-0 rounded px-1.5" title="Premiar manualmente"
                          style={{ color: C.oak, fontSize: 12, border: `1px solid ${C.line}` }}>{addOpen === dk ? "✕" : "＋"}</button>
                      )}
                    </div>
                    );
                  })}
                </div>
              </section>
            );
          })()}

          {(() => {
            const AW2 = computeAwards(data);
            const PRIZES = [
              { k: "horiz", label: "Horizontal", prize: "camiseta Spincycle", best: AW2.pats.horiz || null },
              { k: "vert", label: "Vertical", prize: "camiseta Spincycle", best: AW2.pats.vert || null },
              { k: "diag", label: "Diagonal", prize: "camiseta Spincycle", best: AW2.pats.diag || null },
              { k: "corners", label: "4 Cantos", prize: "bolsinha Spincycle", best: AW2.pats.corners || null },
              { k: "conv", label: "4 Conversões", prize: "escolha da aula temática (independe de missões)", best: AW2.pats.conv || null },
              { k: "full", label: "Cartela Cheia", prize: "treinamento + 1 mês de aula ilimitado", best: AW2.pats.full || null },
              { k: "bpm", label: "Giro de 175 BPM", prize: "Desafio Plus: aula fechada (sáb ou dom) para 33 convidados", best: AW2.pats.bpm || null },
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
                  {PRIZES.map((p) => {
                    const dk = `p:${p.k}`;
                    return (
                    <div key={p.k} className="flex items-center gap-2">
                      <div className="shrink-0" style={{ width: 100, fontSize: 11, fontWeight: 700, color: p.best ? C.cream : C.mut, textTransform: "uppercase", lineHeight: 1.2 }}>
                        {p.label}
                      </div>
                      <div className="flex-1 min-w-0">
                        {admin && addOpen === dk && !p.best ? (
                          <select autoFocus defaultValue="" onChange={(e) => e.target.value && addWinManual("p", p.k, e.target.value)}
                            className="w-full rounded px-2 py-1 outline-none" style={{ background: C.panelSoft, border: `1px solid ${C.amber}`, color: C.cream, fontSize: 12 }}>
                            <option value="" disabled>Premiar aluno…</option>
                            {data.students.filter((s) => s.approved !== false).sort((a, b) => a.name.localeCompare(b.name)).map((s) => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="truncate" style={{ fontSize: 12, color: p.best ? (p.k === "bpm" ? C.oak : C.amber) : C.mut, fontWeight: p.best ? 700 : 400 }}>
                            {p.best ? p.best.name : "em aberto"}
                          </div>
                        )}
                        <div style={{ fontSize: 10, color: C.mut }}>{p.prize}</div>
                      </div>
                      {p.best && confirmDel !== dk && (
                        <div className="shrink-0" style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.mut }}>
                          {p.best.reg ? fmtTs(p.best.reg) : p.best.ts ? fmtTs(p.best.ts) : fmtBR(p.best.date)}
                        </div>
                      )}
                      {admin && p.best && confirmDel !== dk && (
                        <button onClick={() => setConfirmDel(dk)} className="shrink-0 rounded px-1.5" title="Excluir conquista"
                          style={{ color: "#C96A76", fontSize: 12, border: `1px solid ${C.line}` }}>✕</button>
                      )}
                      {admin && p.best && confirmDel === dk && (
                        <div className="shrink-0 flex items-center gap-1">
                          <span style={{ color: "#C96A76", fontSize: 9.5, fontWeight: 700 }}>Irreversível!</span>
                          <button onClick={() => { delWin("p", p.k, p.best.id); setConfirmDel(""); }}
                            className="rounded px-1.5 py-0.5 font-bold" style={{ background: "#B15560", color: C.cream, fontSize: 10 }}>SIM</button>
                          <button onClick={() => setConfirmDel("")} className="rounded px-1.5 py-0.5" style={{ color: C.mut, fontSize: 10, border: `1px solid ${C.line}` }}>não</button>
                        </div>
                      )}
                      {admin && !p.best && (
                        <button onClick={() => setAddOpen(addOpen === dk ? "" : dk)} className="shrink-0 rounded px-1.5" title="Premiar manualmente"
                          style={{ color: C.oak, fontSize: 12, border: `1px solid ${C.line}` }}>{addOpen === dk ? "✕" : "＋"}</button>
                      )}
                    </div>
                    );
                  })}

                </div>
              </section>
            );
          })()}

          {(() => {
            const todas = [...(gData.miniMissions || []), ...(data.miniMissions || [])].sort((a, b) => (a.id < b.id ? 1 : -1));
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
                          const faseP = mmPhase(x, Date.now());
                          const emAberto = faseP === "ativa";
                          const agendada = faseP === "agendada";
                          return (
                            <div key={x.id} className="flex items-center gap-2">
                              <div className="shrink-0" style={{ width: 100, fontSize: 11, fontWeight: 700, color: ws.length ? C.cream : C.mut, textTransform: "uppercase", lineHeight: 1.2 }}>
                                ⚡ {x.scope === "todos" ? "🌍 " : ""}{x.name}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div style={{ fontSize: 12, color: ws.length ? C.amber : C.mut, fontWeight: ws.length ? 700 : 400, lineHeight: 1.4 }}>
                                  {ws.length
                                    ? ws.map((w, i) => `${i + 1}º ${w.name}`).join(" · ")
                                    : agendada ? `começa ${fmtDT(mmStartTs(x))}` : emAberto ? "em aberto" : "encerrada sem ganhador"}
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

          {(() => {
            const total = (gData.miniMissions || []).length + (data.miniMissions || []).length;
            if (!total) return null;
            return (
              <button
                onClick={() => { setMiniPage("list"); window.scrollTo({ top: 0 }); }}
                className="w-full rounded-lg py-2.5 mt-2 font-bold"
                style={{ background: C.panel, border: `1px solid ${C.oak}`, color: C.oak, fontSize: 13 }}
              >
                🏁 VER RESULTADOS DE TODAS AS RELÂMPAGO
              </button>
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
                      setQform({ ...qform, date, slot: valid.includes(qform.slot) ? qform.slot : "" });
                    }}
                    className="flex-1 rounded-lg px-3 py-2 outline-none"
                    style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.cream, colorScheme: "dark" }}
                  />
                  <select
                    value={qform.slot}
                    onChange={(e) => setQform({ ...qform, slot: e.target.value })}
                    className="rounded-lg px-3 py-2 outline-none"
                    style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: qform.slot ? C.cream : C.mut }}
                  >
                    <option value="" disabled>— horário —</option>
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
  if (!admin && !spy && !(student.pass && unlocks[student.id] === student.pass)) {
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
              name="password"
              autoComplete={creating ? "new-password" : "current-password"}
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
            {!creating && (
              <button
                onClick={() => { const nm2 = student.name; setView(null); setLoginMode(true); setRecMode(true); setRcName(nm2); setRcPhone(""); setRcPass(""); setRcErr(""); setRcStep(1); }}
                className="block w-full text-center mt-3"
                style={{ color: C.oak, fontSize: 12.5, textDecoration: "underline", textUnderlineOffset: 3, background: "transparent", border: "none" }}
              >
                🔑 Esqueci minha senha
              </button>
            )}
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
          <button onClick={() => { setView(null); setSpy(false); }} style={{ color: C.oak, fontSize: 13 }}>← Ranking</button>
          <button
            onClick={async () => {
              try {
                const fresh = await loadData(track);
                captureWinners(fresh);
                setData(fresh);
                const g = await loadGlobal();
                setGData(g);
                try {
                  const rf = await window.storage.get(fotosKey(track), true);
                  setPhotos(rf && rf.value ? JSON.parse(rf.value) : {});
                } catch { /* fotos ficam como estão */ }
                avisar("✓ Página atualizada!");
              } catch {
                avisar("⚠️ Sem conexão — tente novamente.");
              }
            }}
            className="rounded-full px-3 py-1"
            style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: C.amberSoft, border: `1px solid ${C.line}`, background: C.panel }}
          >
            🔄 atualizar
          </button>
          {lockBtn}
        </div>

        {!admin && spy && !(student.pass && unlocks[student.id] === student.pass) && (
          <div className="rounded-xl px-4 py-3 mt-4" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
            <div style={{ color: C.cream, fontSize: 12.5, lineHeight: 1.55 }}>
              👀 Você está <b>visitando</b> a cartela de {student.name.split(" ")[0]} — pode espiar tudo, mas só o dono registra aulas aqui. 😄
            </div>
            <button
              onClick={() => { setSpy(false); setView(null); setShowEntry(true); window.scrollTo({ top: 0 }); }}
              className="mt-2 rounded-lg px-3 py-1.5 font-bold"
              style={{ background: `linear-gradient(120deg, ${C.amber}, #16696F)`, color: C.cream, fontSize: 12 }}
            >
              🚴 Entrar nas MINHAS missões
            </button>
          </div>
        )}
        <div className="mt-4 mb-1 flex items-end justify-between gap-2">
          {admin && editN ? (
            <div className="flex-1 flex items-center gap-1.5">
              <input
                autoFocus
                value={editN.name}
                onChange={(e) => setEditN({ name: e.target.value })}
                className="flex-1 rounded px-2 py-1.5 outline-none"
                style={{ background: C.panel, border: `1px solid ${C.amber}`, color: C.cream, fontSize: 16, fontWeight: 800 }}
              />
              <button
                onClick={() => {
                  const nm = editN.name.trim().replace(/\s+/g, " ");
                  if (nm.split(" ").filter((w) => w.length >= 2).length < 2) { avisar("Digite nome e sobrenome."); return; }
                  if (data.students.some((x) => x.id !== view && norm(x.name) === norm(nm))) { avisar("⚠️ Já existe um aluno com esse nome neste desafio."); return; }
                  mutate((d) => {
                    const s2 = d.students.find((x) => x.id === view);
                    if (!s2) return;
                    s2.name = nm;
                    const fix = (e) => { if (e && e.id === view) e.name = nm; };
                    const w = d.winners || {};
                    Object.values(w.missions || {}).forEach(fix);
                    Object.values(w.patterns || {}).forEach(fix);
                    Object.values(w.missionQueues || {}).forEach((q) => (q || []).forEach(fix));
                    Object.values(w.placements || {}).forEach((q) => (q || []).forEach(fix));
                    (d.miniMissions || []).forEach((x) => (x.winners || []).forEach(fix));
                  });
                  setEditN(null);
                }}
                className="rounded px-2 py-1 font-bold" style={{ background: C.ok, color: C.bg, fontSize: 12 }}>✓</button>
              <button onClick={() => setEditN(null)} className="rounded px-2 py-1" style={{ color: C.mut, fontSize: 12, border: `1px solid ${C.line}` }}>✕</button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 min-w-0">
              {photos[student.id] && (
                <img src={photos[student.id]} alt=""
                  className="rounded-full shrink-0"
                  style={{ width: 46, height: 46, objectFit: "cover", border: `2px solid ${C.amber}66` }} />
              )}
              <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 24, color: C.amberSoft, textTransform: "uppercase", letterSpacing: "0.03em", lineHeight: 1.15 }}>
                {student.name}
                {admin && (
                  <button onClick={() => setEditN({ name: student.name })} title="Corrigir nome do aluno"
                    style={{ background: "transparent", border: "none", fontSize: 14, cursor: "pointer", marginLeft: 6, opacity: 0.8 }}>✏️</button>
                )}
              </h2>
            </div>
          )}
        </div>

        {!admin && student.pass && unlocks[student.id] === student.pass && (
          <div className="flex gap-2 mb-3 mt-1">
            <button
              onClick={() => setShowPerfil(!showPerfil)}
              className="flex-1 rounded-full py-2 font-bold text-center"
              style={{ fontSize: 12, background: showPerfil ? C.amber : C.panel, color: showPerfil ? C.cream : C.amberSoft, border: `1px solid ${showPerfil ? C.amber : C.line}` }}
            >👤 Meu perfil</button>
            <button
              onClick={() => { setView(null); setSpy(false); window.scrollTo({ top: 0 }); }}
              className="flex-1 rounded-full py-2 font-bold text-center"
              style={{ fontSize: 12, background: C.panel, color: C.amberSoft, border: `1px solid ${C.line}` }}
            >🏆 Ranking</button>
            <button
              onClick={() => { const el = document.getElementById("sec-registrar"); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }}
              className="flex-1 rounded-full py-2 font-bold text-center"
              style={{ fontSize: 12, background: C.panel, color: C.amberSoft, border: `1px solid ${C.line}` }}
            >🚴 Registrar ↓</button>
          </div>
        )}
        {!admin && showPerfil && student.pass && unlocks[student.id] === student.pass && (
          <div className="rounded-xl p-4 mb-3" style={{ background: C.panel, border: `1.5px solid ${C.amber}`, boxShadow: `0 0 14px ${C.amber}33` }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.25em", color: C.oak, textTransform: "uppercase", marginBottom: 10 }}>
              👤 Meu perfil
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-full shrink-0 flex items-center justify-center overflow-hidden"
                style={{ width: 74, height: 74, background: C.panelSoft, border: `2px solid ${C.amber}88` }}>
                {photos[student.id]
                  ? <img src={photos[student.id]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ fontSize: 28 }}>🚴</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div style={{ color: C.cream, fontWeight: 800, fontSize: 14 }}>{student.name}</div>
                {student.phone && <div style={{ color: C.mut, fontSize: 11.5, fontFamily: "'DM Mono', monospace" }}>📱 {fmtPhone(student.phone)}</div>}
                <div className="flex gap-2 mt-2">
                  <label className="rounded-lg px-3 py-1.5 font-bold" style={{ background: C.amber, color: C.cream, fontSize: 12, cursor: "pointer" }}>
                    📷 {photos[student.id] ? "Trocar foto" : "Escolher foto"}
                    <input type="file" accept="image/*" style={{ display: "none" }}
                      onChange={(e) => { onFotoFile(student.id, e.target.files && e.target.files[0]); e.target.value = ""; }} />
                  </label>
                  {photos[student.id] && (
                    <button onClick={() => salvarFoto(student.id, null)} className="rounded-lg px-3 py-1.5" style={{ color: C.mut, fontSize: 12, border: `1px solid ${C.line}` }}>
                      🗑 Remover
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div style={{ color: C.mut, fontSize: 11, marginTop: 8, lineHeight: 1.5 }}>
              Sua foto aparece no ranking e na sua cartela — assim todo mundo sabe quem é você. 😄
            </div>
          </div>
        )}
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
                <div className="rounded-lg px-4 py-4 mb-1" style={{ background: C.wineDeep, border: `2px solid ${C.amber}` }}>
                  <div className="text-center" style={{ fontSize: 30, lineHeight: 1.1 }}>🎉🏆🎉</div>
                  <div className="text-center mt-1" style={{ color: C.amber, fontWeight: 800, fontSize: 16, letterSpacing: "0.02em" }}>
                    PARABÉNS, {(student.name || "").split(" ")[0].toUpperCase()}!
                  </div>
                  <div className="text-center mt-2" style={{ color: C.cream, fontSize: 12.5, lineHeight: 1.6 }}>
                    Você fechou <b>as 9 missões</b> da cartela. Isso é constância, coragem e muita pedalada —
                    e pouquíssima gente chega até aqui. Que orgulho da sua caminhada! 💙
                  </div>
                  <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${C.line}` }}>
                    <div style={{ color: C.amberSoft, fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                      🎯 E agora, qual é a estratégia pro próximo desafio?
                    </div>
                    <div style={{ color: C.mut, fontSize: 11.5, lineHeight: 1.55 }}>
                      Vem contar pra gente o que funcionou pra você — sua tática pode inspirar a turma inteira.
                      Toque em 💬 AJUDA no rodapé e manda sua estratégia. 🚴‍♀️
                    </div>
                  </div>
                </div>
              )}
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

        {!admin && !spy && !student.phone && (
          <div className="rounded-xl p-3 mb-3" style={{ background: C.panel, border: `1.5px solid ${C.oak}`, boxShadow: `0 0 12px ${C.oak}33` }}>
            <div style={{ color: C.oak, fontWeight: 800, fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              📱 Complete seu cadastro
            </div>
            <div style={{ color: C.cream, fontSize: 12, lineHeight: 1.5, marginBottom: 8 }}>
              Informe seu WhatsApp — é ele que permite você <b>recuperar sua senha sozinho(a)</b> se esquecer. Só a administração vê.
            </div>
            <div className="flex gap-2">
              <input
                type="tel"
                inputMode="numeric"
                value={fixPhone}
                onChange={(e) => setFixPhone(e.target.value.replace(/\D/g, "").replace(/^0+/, "").slice(0, 11))}
                placeholder="18999342345 (DDD + número)"
                className="flex-1 rounded-lg px-3 py-2 outline-none"
                style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.cream }}
              />
              <button
                onClick={() => {
                  const ph = normPhone(fixPhone);
                  if (ph.length < 10 || ph.length > 11) { avisar("Digite o WhatsApp com DDD — só números (10 ou 11 dígitos)."); return; }
                  mutate((d) => { const s2 = d.students.find((x) => x.id === view); if (s2) s2.phone = ph; });
                  setFixPhone("");
                }}
                className="rounded-lg px-4 font-bold"
                style={{ background: C.amber, color: C.cream, fontSize: 13 }}
              >
                Salvar
              </button>
            </div>
          </div>
        )}
        {admin && student.phone && (
          <a
            href={`https://wa.me/55${normPhone(student.phone)}`}
            target="_blank" rel="noreferrer"
            className="inline-block rounded-full px-3 py-1 mb-3"
            style={{ color: C.amberSoft, fontSize: 12, border: `1px solid ${C.line}`, textDecoration: "none", fontFamily: "'DM Mono', monospace" }}
          >
            📱 {fmtPhone(student.phone)} · abrir WhatsApp
          </a>
        )}
        {(() => {
          const agora = Date.now();
          const misturadas = [...(gData.miniMissions || []), ...(data.miniMissions || [])].sort((a, b) => (a.id < b.id ? 1 : -1));
          const souDono = admin || (student.pass && unlocks[student.id] === student.pass);
          const fazAula = (x) => (student.records || []).some((r) => r.status === "ok" && r.date === x.aulaDate && r.slot === x.aulaSlot);
          const ativas = misturadas.filter((x) => mmPhase(x, agora) === "ativa");
          const resultados = misturadas.filter((x) => mmPhase(x, agora) === "resultado");
          if (!ativas.length && !resultados.length) return null;
          return (
            <div className="flex flex-col gap-2 mb-3">
              {resultados.map((x) => (
                <button
                  key={"res" + x.id}
                  onClick={() => { setMiniPage(x.id); window.scrollTo({ top: 0 }); }}
                  className="rounded-xl px-4 py-3 text-left"
                  style={{ background: `linear-gradient(120deg, ${C.oak}22, transparent)`, border: `1.5px solid ${C.oak}`, boxShadow: `0 0 14px ${C.oak}44` }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div style={{ color: C.oak, fontWeight: 800, fontSize: 13, textTransform: "uppercase" }}>
                      🏁 ⚡ {x.name} — encerrada!
                    </div>
                    <div className="shrink-0" style={{ color: C.oak, fontWeight: 800, fontSize: 12 }}>VER RESULTADO →</div>
                  </div>
                </button>
              ))}
              {ativas.map((x) => {
                const eDaAula = x.scope !== "aula" || fazAula(x);
                return (
                  <div key={x.id} className="rounded-xl px-4 py-3" style={{ background: C.panel, border: `1.5px solid ${C.amber}`, boxShadow: `0 0 14px ${C.amber}33` }}>
                    <div className="flex items-center justify-between gap-2">
                      <div style={{ color: C.amberSoft, fontWeight: 800, fontSize: 13, textTransform: "uppercase" }}>
                        ⚡ Missão relâmpago: {x.scope === "todos" ? "🌍 " : x.scope === "grupos" ? "🥇 " : x.scope === "aula" ? "🚴 " : ""}{x.name}
                      </div>
                      <div className="shrink-0" style={{ color: C.oak, fontWeight: 700, fontSize: 11 }}>
                        das {fmtHM(mmStartTs(x))} às {fmtHM(mmEndTs(x))}
                      </div>
                    </div>
                    <div style={{ color: C.cream, fontSize: 12.5, lineHeight: 1.55, marginTop: 3 }}>{x.desc}</div>
                    {x.mode === "slot" && (x.slots || []).length > 0 && (
                      <div style={{ color: C.amberSoft, fontSize: 12, fontWeight: 700, marginTop: 4 }}>
                        ⏰ Vale check-in nas aulas: {(x.slots || []).map((sl) => sl.replace(":", "h")).join(" · ")}
                      </div>
                    )}
                    {x.scope === "aula" && (
                      <div style={{ color: eDaAula ? C.ok : C.oak, fontSize: 12, fontWeight: 700, marginTop: 4 }}>
                        {eDaAula
                          ? `✓ Você fez a aula de ${fmtBR(x.aulaDate)} às ${String(x.aulaSlot || "").replace(":", "h")} — pode participar!`
                          : `🔒 Exclusiva de quem fez check-in na aula de ${fmtBR(x.aulaDate)} às ${String(x.aulaSlot || "").replace(":", "h")}.`}
                      </div>
                    )}
                    <div style={{ color: C.oak, fontSize: 12, fontWeight: 700, marginTop: 4 }}>
                      🏆 {x.prize} — {x.qty} prêmio{x.qty === 1 ? "" : "s"}
                      {x.mode === "top" ? " para quem fizer MAIS aulas no período"
                        : x.mode === "slot" ? " por ordem de chegada"
                        : x.mode === "sorteio" ? " por sorteio entre quem treinar no período"
                        : x.mode === "quizText" || x.mode === "quizChoice" ? " para os primeiros que acertarem"
                        : " por ordem de conquista"}
                      {x.openMode === "tempo" ? " · resultado sai quando o tempo acabar ⏱️" : ` — restam ${Math.max(0, x.qty - (x.winners || []).length)}`}
                    </div>
                    {x.scope !== "todos" && x.scope !== "aula" && x.mode === "top" && (() => {
                      const parc = miniTop(data, x).slice(0, 3);
                      return parc.length ? (
                        <div style={{ color: C.mut, fontSize: 11.5, marginTop: 3 }}>
                          parcial: {parc.map((w, i) => `${i + 1}º ${w.name} (${w.count})`).join(" · ")}
                        </div>
                      ) : null;
                    })()}
                    {x.scope !== "todos" && x.scope !== "aula" && x.mode === "slot" && (() => {
                      const parc = miniSlotFirsts(data, x).slice(0, x.qty);
                      return parc.length ? (
                        <div style={{ color: C.mut, fontSize: 11.5, marginTop: 3 }}>
                          já garantiram: {parc.map((w) => w.name).join(" · ")}
                        </div>
                      ) : null;
                    })()}
                    {(x.mode === "quizText" || x.mode === "quizChoice") && !admin && souDono && eDaAula && (() => {
                      const at = (x.attempts || {})[student.id] || { n: 0, ok: false };
                      const tries = x.tries || 3;
                      if (at.ok) {
                        return <div style={{ color: C.ok, fontSize: 12.5, fontWeight: 700, marginTop: 6 }}>
                          {x.openMode === "tempo" ? "🎉 Resposta certa registrada! Resultado sai quando o tempo acabar." : "🎉 Você acertou e garantiu o prêmio!"}
                        </div>;
                      }
                      if (at.n >= tries) {
                        return <div style={{ color: C.mut, fontSize: 12, marginTop: 6 }}>Suas {tries} tentativas acabaram — aguarde o resultado! 💪</div>;
                      }
                      const responder = () => {
                        const val = (qzAns[x.id] || "").trim();
                        if (!val) return;
                        const certo = x.mode === "quizChoice"
                          ? normQ(val) === normQ(x.correct || "")
                          : (x.answers || []).some((a) => normQ(a) === normQ(val));
                        doMini(x)((d) => {
                          const xx = (d.miniMissions || []).find((y) => y.id === x.id);
                          if (!xx) return;
                          if (mmPhase(xx, Date.now()) !== "ativa") return;
                          if (!xx.attempts) xx.attempts = {};
                          const a2 = xx.attempts[student.id] || { n: 0, ok: false };
                          if (a2.ok || a2.n >= (xx.tries || 3)) return;
                          if (xx.openMode !== "tempo" && (xx.winners || []).length >= xx.qty) return;
                          a2.n += 1;
                          const ok2 = xx.mode === "quizChoice"
                            ? normQ(val) === normQ(xx.correct || "")
                            : (xx.answers || []).some((a) => normQ(a) === normQ(val));
                          if (!xx.log) xx.log = [];
                          xx.log.push({ sid: student.id, name: student.name, ans: val, ok: ok2, ts: Date.now() });
                          if (ok2) {
                            a2.ok = true;
                            if (!xx.winners) xx.winners = [];
                            if (xx.winners.length < xx.qty) xx.winners.push({ id: student.id, name: student.name, ts: Date.now() });
                          }
                          xx.attempts[student.id] = a2;
                        });
                        setQzMsg({ ...qzMsg, [x.id]: certo
                          ? (x.openMode === "tempo" ? "🎉 Certa resposta! Registrada — resultado no fim do tempo." : "🎉 Acertou! Prêmio garantido — sua medalha ⚡ já está na cartela.")
                          : `Não foi dessa vez… restam ${tries - at.n - 1} tentativa${tries - at.n - 1 === 1 ? "" : "s"}.` });
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
                );
              })}
            </div>
          );
        })()}
        {!admin && !spy && student.pass && unlocks[student.id] === student.pass && student.approved !== false && (() => {
          const rank2 = data.students
            .filter((s2) => s2.approved !== false)
            .map((s2) => { const r2 = computeProgress(s2); const f2 = MISSIONS.reduce((n, m) => n + Math.min(r2.p[m.id], m.target), 0); return { id: s2.id, nome: s2.name, f: f2, dc: r2.doneCount, mar: r2.p.maratona }; })
            .sort((a, b) => b.f - a.f || b.dc - a.dc || b.mar - a.mar || a.nome.localeCompare(b.nome));
          const idx = rank2.findIndex((x) => x.id === student.id);
          const rival = idx > 0 ? rank2[idx - 1] : null;
          const eu = idx >= 0 ? rank2[idx] : null;
          const restos = MISSIONS
            .map((m) => ({ m, rem: m.target - Math.min(res.p[m.id], m.target) }))
            .filter((x) => x.rem > 0)
            .sort((a, b) => a.rem - b.rem);
          const prox = restos[0];
          if (!prox && !rival) return null;
          return (
            <div className="rounded-xl px-4 py-3 mb-3" style={{ background: `linear-gradient(120deg, ${C.oak}18, transparent)`, border: `1.5px dashed ${C.oak}` }}>
              <div style={{ color: C.oak, fontWeight: 800, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>
                🔥 Acelera!
              </div>
              <div style={{ color: C.cream, fontSize: 12.5, lineHeight: 1.6 }}>
                {prox && <span>Falta{prox.rem === 1 ? "" : "m"} só <b style={{ color: C.amberSoft }}>{prox.rem}</b> pra você completar o <b style={{ color: C.amberSoft }}>{prox.m.name}</b>. </span>}
                {rival && eu && <span>E {rival.nome.split(" ")[0]} está <b style={{ color: C.amberSoft }}>{Math.max(1, rival.f - eu.f)} bolinha{rival.f - eu.f === 1 ? "" : "s"}</b> à sua frente no ranking — uma aula pode virar o jogo. 🚴</span>}
                {rival === null && <span>Você está em <b style={{ color: C.amberSoft }}>1º lugar</b> — agora é defender o trono! 👑</span>}
              </div>
            </div>
          );
        })()}
        <div className="flex justify-end" style={{ marginBottom: 4 }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: res.full ? C.amber : C.mut }}>
            {res.doneCount}/9 missões
          </span>
        </div>
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

        {student.approved !== false && (() => {
          const misturadas = [...(gData.miniMissions || []), ...(data.miniMissions || [])];
          const vencidas = misturadas.filter((x) => (x.winners || []).some((w) => w.id === student.id));
          const AWme = computeAwards(data);
          const meusShakes = MISSIONS.filter((m) => AWme.shakes[m.id] && AWme.shakes[m.id].id === student.id).map((m) => m.name);
          const PATL = { horiz: "Linha Horizontal", vert: "Linha Vertical", diag: "Diagonal", corners: "4 Cantos", conv: "4 Conversões", full: "Cartela Cheia", bpm: "Giro de 175 BPM" };
          const meusPats = Object.keys(PATL).filter((k) => AWme.pats[k] && AWme.pats[k].id === student.id).map((k) => PATL[k]);
          const rankAll = data.students
            .filter((s2) => s2.approved !== false)
            .map((s2) => { const r2 = computeProgress(s2); const f2 = MISSIONS.reduce((n, m) => n + Math.min(r2.p[m.id], m.target), 0); return { id: s2.id, nome: s2.name, f: f2, dc: r2.doneCount, mar: r2.p.maratona }; })
            .sort((a, b) => b.f - a.f || b.dc - a.dc || b.mar - a.mar || a.nome.localeCompare(b.nome));
          const minhaPos = rankAll.findIndex((x) => x.id === student.id) + 1;
          const chip = (txt, key, ouro) => (
            <span key={key} className="rounded-full px-2.5 py-1" style={ouro
              ? { background: `linear-gradient(120deg, #D9A954, #B08D3E)`, color: "#141414", fontSize: 11, fontWeight: 800 }
              : { background: C.panel, color: C.amberSoft, fontSize: 11, fontWeight: 800, border: `1px solid ${C.amber}66` }}>
              {txt}
            </span>
          );
          return (
            <div className="rounded-xl px-4 py-3 mt-3" style={{ background: C.panelSoft, border: `1px solid ${C.oak}` }}>
              <div style={{ color: C.oak, fontWeight: 800, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
                🏅 Minhas conquistas
              </div>
              <div className="flex flex-wrap gap-1.5">
                {minhaPos > 0 && chip(`🏆 ${minhaPos}º no ranking`, "pos", minhaPos <= 3)}
                {meusShakes.map((n, i) => chip(`🥤 ${n}`, "sk" + i, true))}
                {meusPats.map((n, i) => chip(`🏆 ${n}`, "pt" + i, true))}
                {vencidas.map((x) => {
                  const posV = (x.winners || []).findIndex((w) => w.id === student.id) + 1;
                  return chip(`⚡ ${posV}º · ${x.name}`, "mm" + x.id, true);
                })}
              </div>
              {meusShakes.length > 0 && (
                <div className="rounded-lg px-3 py-2 mt-2.5" style={{ background: `${C.amber}18`, border: `1px solid ${C.amber}55` }}>
                  <div style={{ color: C.amberSoft, fontWeight: 700, fontSize: 12, lineHeight: 1.5 }}>
                    🥤 Parabéns! Para retirar seu shake, apresente essa página na Spin Coffee &amp; Shakes.
                  </div>
                </div>
              )}
              {(meusPats.length > 0 || vencidas.length > 0) && (
                <div className="rounded-lg px-3 py-2 mt-2.5" style={{ background: `${C.oak}18`, border: `1px solid ${C.oak}55` }}>
                  <div style={{ color: C.oak, fontWeight: 700, fontSize: 12, lineHeight: 1.5 }}>
                    🎁 Apresente essa página na recepção e retire seu prêmio.
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
        {(admin || (student.pass && unlocks[student.id] === student.pass)) && student.approved !== false && (
        <section id="sec-registrar" className="rounded-xl p-4 mt-6" style={{ background: C.panel, border: `1px solid ${C.line}`, scrollMarginTop: 16 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.25em", color: C.oak, textTransform: "uppercase", marginBottom: 6 }}>
            {admin ? "Registrar aula (validada)" : "Registrar minha aula"}
          </div>
          <div style={{ color: C.mut, fontSize: 11.5, lineHeight: 1.5, marginBottom: 10 }}>
            🚴 O check-in vale <b style={{ color: C.cream }}>apenas para a modalidade de BIKE</b>. Aulas de <b style={{ color: C.cream }}>Strong Basics não valem como check-in</b> e não fazem parte do desafio. Registre <b style={{ color: C.cream }}>somente após o fim da aula</b>.
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
                  setForm({ ...form, date, slot: valid.includes(form.slot) ? form.slot : "" });
                }}
                className="flex-1 rounded-lg px-3 py-2 outline-none"
                style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.cream, colorScheme: "dark" }}
              />
              <select
                value={form.slot}
                onChange={(e) => setForm({ ...form, slot: e.target.value })}
                className="rounded-lg px-3 py-2 outline-none"
                style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: form.slot ? C.cream : C.mut }}
              >
                <option value="" disabled>— horário —</option>
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
        {!admin && student.pass && unlocks[student.id] === student.pass && (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="w-full rounded-lg py-2 mt-2"
            style={{ color: C.oak, fontSize: 12, border: `1px dashed ${C.line}`, background: "transparent" }}
          >
            ↑ Voltar ao topo
          </button>
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
                    {admin && editG && editG.id === g.id ? (
                      <input
                        autoFocus
                        value={editG.name}
                        onChange={(e) => setEditG({ ...editG, name: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key !== "Enter") return;
                          const nm3 = editG.name.trim().replace(/\s+/g, " ");
                          if (!nm3) return;
                          const dup3 = data.students.some((s3) => (s3.guests || []).some((x) => x.id !== g.id && norm(x.name) === norm(nm3)));
                          if (dup3) { avisar("⚠️ Já existe um convidado com esse nome no desafio."); return; }
                          mutate((d) => { const s3 = d.students.find((x) => x.id === view); const gg = s3 && s3.guests.find((x) => x.id === g.id); if (gg) gg.name = nm3; });
                          setEditG(null);
                        }}
                        className="w-full rounded px-2 py-1 outline-none"
                        style={{ background: C.panel, border: `1px solid ${C.amber}`, color: C.cream, fontSize: 13 }}
                      />
                    ) : (
                      <div className="truncate" style={{ color: g.status === "ok" ? C.cream : C.amberSoft, fontSize: 13, fontWeight: 700 }}>
                        {g.name}
                      </div>
                    )}
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: C.mut }}>
                      {weekdayBR(g.date)} {fmtBR(g.date)} · {g.slot.replace(":", "h")}
                    </div>
                  </div>
                  {admin && (editG && editG.id === g.id ? (
                    <>
                      <button
                        onClick={() => {
                          const nm3 = editG.name.trim().replace(/\s+/g, " ");
                          if (!nm3) return;
                          const dup3 = data.students.some((s3) => (s3.guests || []).some((x) => x.id !== g.id && norm(x.name) === norm(nm3)));
                          if (dup3) { avisar("⚠️ Já existe um convidado com esse nome no desafio."); return; }
                          mutate((d) => { const s3 = d.students.find((x) => x.id === view); const gg = s3 && s3.guests.find((x) => x.id === g.id); if (gg) gg.name = nm3; });
                          setEditG(null);
                        }}
                        className="shrink-0 rounded px-1.5 py-0.5 font-bold"
                        style={{ background: C.ok, color: C.bg, fontSize: 11 }}
                      >✓</button>
                      <button onClick={() => setEditG(null)} className="shrink-0 rounded px-1.5 py-0.5" style={{ color: C.mut, fontSize: 11, border: `1px solid ${C.line}` }}>✕</button>
                    </>
                  ) : (
                    <button
                      onClick={() => setEditG({ id: g.id, name: g.name })}
                      className="shrink-0 rounded px-1"
                      title="Corrigir nome do convidado"
                      style={{ background: "transparent", border: "none", fontSize: 13, cursor: "pointer", opacity: 0.75 }}
                    >✏️</button>
                  ))}
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
                  {admin && confirmDel !== `hg:${g.id}` && (
                    <button onClick={() => setConfirmDel(`hg:${g.id}`)} style={{ color: C.mut, fontSize: 12 }}>✕</button>
                  )}
                  {admin && confirmDel === `hg:${g.id}` && (
                    <div className="shrink-0 flex items-center gap-1">
                      <span style={{ color: "#C96A76", fontSize: 9.5, fontWeight: 700 }}>Irreversível!</span>
                      <button
                        onClick={() => { mutate((d) => { const s = d.students.find((x) => x.id === view); s.guests = s.guests.filter((x) => x.id !== g.id); }); setConfirmDel(""); }}
                        className="rounded px-1.5 py-0.5 font-bold" style={{ background: "#B15560", color: C.cream, fontSize: 10 }}>SIM</button>
                      <button onClick={() => setConfirmDel("")} className="rounded px-1.5 py-0.5" style={{ color: C.mut, fontSize: 10, border: `1px solid ${C.line}` }}>não</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {(admin || (student.pass && unlocks[student.id] === student.pass)) && (
          <div className="flex flex-col gap-2">
            <div style={{ color: C.mut, fontSize: 11.5, lineHeight: 1.5 }}>
              {gform.kind === "spin"
                ? <>📣 Este é um <b style={{ color: C.cream }}>aluno que já pedala na Spin</b> e você está convidando pro desafio. Informe só o <b style={{ color: C.cream }}>nome</b> e a <b style={{ color: C.cream }}>data do convite</b> — não precisa horário.</>
                : <>📅 A data e o ⏰ horário abaixo são <b style={{ color: C.cream }}>da aula que o SEU CONVIDADO vai fazer</b> — a aula experimental que ele ganhou de você. A marcação é feita com a recepção (nome completo, telefone e e-mail dele).</>}
            </div>
            <input
              value={gform.name}
              onChange={(e) => { setGform({ ...gform, name: e.target.value }); setGErr(""); }}
              placeholder="Nome e sobrenome do amigo"
              className="rounded-lg px-3 py-2 outline-none"
              style={{ background: C.panelSoft, border: `1px solid ${gErr ? "#B15560" : C.line}`, color: C.cream }}
            />
            <select
              value={gform.kind}
              onChange={(e) => setGform({ ...gform, kind: e.target.value, slot: e.target.value === "spin" ? "" : gform.slot })}
              className="rounded-lg px-3 py-2 outline-none"
              style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.cream }}
            >
              <option value="novo">🆕 Convidado novo (nunca pedalou na Spin ou sumido há 6+ meses)</option>
              <option value="spin" disabled={(student.guests || []).filter((g) => g.kind === "spin").length >= 2}>
                📣 ALUNO CONVIDADO AO DESAFIO (máx. 2)
              </option>
            </select>
            <div className="flex gap-2">
              <input
                type="date" value={gform.date}
                min={DESAFIO_INICIO} max={todayStr()}
                onChange={(e) => {
                  const date = e.target.value;
                  setGErr("");
                  const valid = date && isWeekendDate(date) ? WEEKEND_SLOTS : WEEKDAY_SLOTS;
                  setGform({ ...gform, date, slot: valid.includes(gform.slot) ? gform.slot : "" });
                }}
                className="flex-1 rounded-lg px-3 py-2 outline-none"
                style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.cream, colorScheme: "dark" }}
              />
              {gform.kind !== "spin" && (
                <select
                  value={gform.slot}
                  onChange={(e) => setGform({ ...gform, slot: e.target.value })}
                  className="rounded-lg px-3 py-2 outline-none"
                  style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: gform.slot ? C.cream : C.mut }}
                >
                  <option value="" disabled>— horário —</option>
                  {(gform.date && isWeekendDate(gform.date) ? WEEKEND_SLOTS : WEEKDAY_SLOTS).map((s) => (
                    <option key={s} value={s}>{s.replace(":", "h")}</option>
                  ))}
                </select>
              )}
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
          )}
        </section>
        )}

        {/* Histórico */}
        <section className="mt-6">
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.25em", color: C.oak, textTransform: "uppercase", marginBottom: 8 }}>
            Histórico · {student.records.length} registro{student.records.length !== 1 ? "s" : ""}
          </div>
          {recsSorted.length === 0 && <p style={{ color: C.mut, fontSize: 13 }}>Nenhuma aula registrada ainda.</p>}
          <div className="flex flex-col gap-1">
            {(showAllHist ? recsSorted : recsSorted.slice(0, 5)).map((r) => {
              const emEd = editH && editH.id === r.id;
              const slotsEd = emEd && editH.date && isWeekendDate(editH.date) ? WEEKEND_SLOTS : WEEKDAY_SLOTS;
              return (
              <div key={r.id} className="rounded-lg px-3 py-2" style={{
                background: C.panel,
                border: `1px solid ${r.status === "pending" ? C.amber + "66" : C.line}`,
              }}>
                <div className="flex items-center gap-2">
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: r.status === "pending" ? C.amberSoft : C.cream, minWidth: 96 }}>
                    {weekdayBR(r.date)} {fmtBR(r.date)} · {r.slot.replace(":", "h")}
                  </div>
                  <div className="flex-1 min-w-0 truncate" style={{ color: C.mut, fontSize: 13 }}>{r.instructor || "—"}</div>
                  {r.status === "pending" && !emEd && (
                    <span className="rounded px-1.5 py-0.5 shrink-0" style={{ fontSize: 10, background: r.alert ? "#B15560" : C.wineDeep, color: r.alert ? C.cream : C.amberSoft, fontWeight: r.alert ? 800 : 500 }}>
                      {r.alert ? "⚠️ verificar" : "pendente"}
                    </span>
                  )}
                  {r.status === "pending" && !r.alert && r.correctedByStudent && !emEd && (
                    <span className="rounded px-1.5 py-0.5 shrink-0" style={{ fontSize: 10, background: C.oak + "33", color: C.oak, fontWeight: 700 }}>
                      ✎ corrigido
                    </span>
                  )}
                  {admin && r.status === "pending" && !emEd && confirmDel !== `hr:${r.id}` && (
                    <button
                      onClick={() => mutate((d) => {
                        const s2 = d.students.find((x) => x.id === view);
                        const rec2 = s2 && (s2.records || []).find((x) => x.id === r.id);
                        if (rec2) rec2.alert = !rec2.alert;
                      })}
                      className="shrink-0" title={r.alert ? "Remover sinalização" : "Sinalizar incongruência"}
                      style={{ background: r.alert ? "#B15560" : "transparent", border: r.alert ? "none" : `1px solid ${C.line}`, borderRadius: 6, fontSize: 11, cursor: "pointer", padding: "2px 5px" }}
                    >⚠️</button>
                  )}
                  {admin && r.status === "pending" && r.alert && student.phone && !emEd && confirmDel !== `hr:${r.id}` && (
                    <a
                      href={`https://wa.me/55${normPhone(student.phone)}?text=${encodeURIComponent(`Oi ${student.name.split(" ")[0]}! Sua aula de ${fmtBR(r.date)} às ${r.slot.replace(":", "h")} está com informações incongruentes no nosso sistema. Dá uma olhadinha no seu painel do Desafio e corrige direto por lá — daí a gente valida rapidinho! 🙏`)}`}
                      target="_blank" rel="noreferrer"
                      className="shrink-0" title="Avisar aluno pelo WhatsApp"
                      style={{ background: "transparent", border: `1px solid ${C.line}`, borderRadius: 6, fontSize: 11, textDecoration: "none", padding: "2px 5px", display: "inline-block" }}
                    >📲</a>
                  )}
                  {admin && r.status === "pending" && !emEd && confirmDel !== `hr:${r.id}` && (
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
                  {admin && !emEd && confirmDel !== `hr:${r.id}` && (
                    <button
                      onClick={() => { setEditH({ id: r.id, date: r.date, slot: r.slot, instructor: r.instructor }); setConfirmDel(""); }}
                      className="shrink-0 rounded px-1" title="Corrigir data/horário/professor"
                      style={{ background: "transparent", border: "none", fontSize: 13, cursor: "pointer", opacity: 0.8 }}
                    >✏️</button>
                  )}
                  {admin && !emEd && confirmDel !== `hr:${r.id}` && (
                    <button onClick={() => setConfirmDel(`hr:${r.id}`)} className="shrink-0" style={{ color: C.mut, fontSize: 12 }}>✕</button>
                  )}
                  {admin && confirmDel === `hr:${r.id}` && (
                    <div className="shrink-0 flex items-center gap-1">
                      <span style={{ color: "#C96A76", fontSize: 9.5, fontWeight: 700 }}>Irreversível!</span>
                      <button
                        onClick={() => { mutate((d) => { const s = d.students.find((x) => x.id === view); s.records = s.records.filter((x) => x.id !== r.id); }); setConfirmDel(""); }}
                        className="rounded px-1.5 py-0.5 font-bold" style={{ background: "#B15560", color: C.cream, fontSize: 10 }}>SIM</button>
                      <button onClick={() => setConfirmDel("")} className="rounded px-1.5 py-0.5" style={{ color: C.mut, fontSize: 10, border: `1px solid ${C.line}` }}>não</button>
                    </div>
                  )}
                </div>
                {!admin && r.status === "pending" && r.alert && (
                  <>
                    <a
                      href={`https://wa.me/${AJUDA_WHATSAPP}?text=${encodeURIComponent(`Oi! Gostaria de entender por que meu check-in de ${fmtBR(r.date)} às ${r.slot.replace(":", "h")} está pendente. Qual foi o erro, para que eu possa corrigir? 🙏`)}`}
                      target="_blank" rel="noreferrer"
                      className="block mt-2 rounded-lg px-3 py-2"
                      style={{ background: "#B1556022", border: "1px solid #B15560", textDecoration: "none" }}
                    >
                      <div style={{ color: "#E8A0A8", fontSize: 11.5, lineHeight: 1.5 }}>
                        ⚠️ Este check-in está pendente por alguma <b>incongruência na informação</b>.
                        <span style={{ color: C.cream, fontWeight: 700 }}> Toque aqui</span> para falar com a recepção, ou corrija você mesmo(a) abaixo. 💬
                      </div>
                    </a>
                    {!(selfEditH && selfEditH.id === r.id) ? (
                      <button
                        onClick={() => setSelfEditH({ id: r.id, date: r.date, slot: r.slot, instructor: r.instructor })}
                        className="block w-full text-center mt-2 rounded-lg py-2 font-bold"
                        style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.amberSoft, fontSize: 12.5 }}
                      >
                        ✏️ Corrigir data, horário ou professor
                      </button>
                    ) : (
                      <div className="mt-2 flex flex-col gap-1.5">
                        <div className="flex gap-1.5">
                          <input type="date" value={selfEditH.date} min={DESAFIO_INICIO} max={todayStr()}
                            onChange={(e) => {
                              const nd = e.target.value;
                              const vs = nd && isWeekendDate(nd) ? WEEKEND_SLOTS : WEEKDAY_SLOTS;
                              setSelfEditH({ ...selfEditH, date: nd, slot: vs.includes(selfEditH.slot) ? selfEditH.slot : "" });
                            }}
                            className="flex-1 rounded px-2 py-1.5 outline-none"
                            style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.cream, fontSize: 12, colorScheme: "dark" }} />
                          <select value={selfEditH.slot} onChange={(e) => setSelfEditH({ ...selfEditH, slot: e.target.value })}
                            className="rounded px-2 py-1.5 outline-none"
                            style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: selfEditH.slot ? C.cream : C.mut, fontSize: 12 }}>
                            <option value="" disabled>— horário —</option>
                            {(selfEditH.date && isWeekendDate(selfEditH.date) ? WEEKEND_SLOTS : WEEKDAY_SLOTS).map((sl) => <option key={sl} value={sl}>{sl.replace(":", "h")}</option>)}
                          </select>
                        </div>
                        <div className="flex gap-1.5">
                          <select value={selfEditH.instructor} onChange={(e) => setSelfEditH({ ...selfEditH, instructor: e.target.value })}
                            className="flex-1 rounded px-2 py-1.5 outline-none"
                            style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.cream, fontSize: 12 }}>
                            {INSTRUCTORS.map((i) => <option key={i} value={i}>{i}</option>)}
                          </select>
                          <button
                            onClick={() => {
                              if (!selfEditH.date || !selfEditH.slot) { avisar("Escolha data e horário."); return; }
                              mutate((d) => {
                                const s = d.students.find((x) => x.id === view);
                                const rec = s && (s.records || []).find((x) => x.id === selfEditH.id);
                                if (rec) { rec.date = selfEditH.date; rec.slot = selfEditH.slot; rec.instructor = selfEditH.instructor; rec.alert = false; rec.correctedByStudent = true; }
                              });
                              setSelfEditH(null);
                              avisar("Correção enviada! A recepção vai validar em breve. 👍");
                            }}
                            className="rounded px-2.5 font-bold" style={{ background: C.ok, color: C.bg, fontSize: 12 }}>✓ salvar correção</button>
                          <button onClick={() => setSelfEditH(null)} className="rounded px-2" style={{ color: C.mut, fontSize: 12, border: `1px solid ${C.line}` }}>✕</button>
                        </div>
                      </div>
                    )}
                  </>
                )}
                {emEd && (
                  <div className="mt-2 flex flex-col gap-1.5">
                    <div className="flex gap-1.5">
                      <input type="date" value={editH.date} min={DESAFIO_INICIO} max={todayStr()}
                        onChange={(e) => {
                          const nd = e.target.value;
                          const vs = nd && isWeekendDate(nd) ? WEEKEND_SLOTS : WEEKDAY_SLOTS;
                          setEditH({ ...editH, date: nd, slot: vs.includes(editH.slot) ? editH.slot : "" });
                        }}
                        className="flex-1 rounded px-2 py-1.5 outline-none"
                        style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.cream, fontSize: 12, colorScheme: "dark" }} />
                      <select value={editH.slot} onChange={(e) => setEditH({ ...editH, slot: e.target.value })}
                        className="rounded px-2 py-1.5 outline-none"
                        style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: editH.slot ? C.cream : C.mut, fontSize: 12 }}>
                        <option value="" disabled>— horário —</option>
                        {slotsEd.map((sl) => <option key={sl} value={sl}>{sl.replace(":", "h")}</option>)}
                      </select>
                    </div>
                    <div className="flex gap-1.5">
                      <select value={editH.instructor} onChange={(e) => setEditH({ ...editH, instructor: e.target.value })}
                        className="flex-1 rounded px-2 py-1.5 outline-none"
                        style={{ background: C.panelSoft, border: `1px solid ${C.line}`, color: C.cream, fontSize: 12 }}>
                        {INSTRUCTORS.map((i) => <option key={i} value={i}>{i}</option>)}
                      </select>
                      <button
                        onClick={() => {
                          if (!editH.date || !editH.slot) { avisar("Escolha data e horário."); return; }
                          mutate((d) => {
                            const s = d.students.find((x) => x.id === view);
                            const rec = s && (s.records || []).find((x) => x.id === editH.id);
                            if (rec) { rec.date = editH.date; rec.slot = editH.slot; rec.instructor = editH.instructor; }
                          });
                          setEditH(null);
                        }}
                        className="rounded px-2.5 font-bold" style={{ background: C.ok, color: C.bg, fontSize: 12 }}>✓ salvar</button>
                      <button onClick={() => setEditH(null)} className="rounded px-2" style={{ color: C.mut, fontSize: 12, border: `1px solid ${C.line}` }}>✕</button>
                    </div>
                  </div>
                )}
              </div>
              );
            })}
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
                s.records.forEach((r) => { if (r.status === "pending" && !r.alert) r.status = "ok"; });
                (s.guests || []).forEach((g) => { if (g.status === "pending" && !g.alert) g.status = "ok"; });
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
                    mutate((d) => { purgeStudentWins(d, view); d.students = d.students.filter((x) => x.id !== view); });
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
