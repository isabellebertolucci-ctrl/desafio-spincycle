import { useState, useEffect, useRef } from "react";

/* ============================================================
   COMUNIDADE SPINCYCLE — v2
   Mesmo banco e mesmo login do Desafio das Missões.
   A Comunidade só LÊ os dados do Desafio; tudo que ela grava
   vai em chaves próprias (spincycle-comunidade-v1-*), sempre
   com GET validado antes de escrever e cópia -bak antes de PUT.
   ============================================================ */

const UNIDADE = "prudente";
const UNIDADE_NOME = "Spincycle Prudente";

// 🔒 PRÉ-LANÇAMENTO: enquanto true, só a equipe entra (usuário + PIN de adm).
// Alunos que abrirem o endereço veem apenas a tela "EM BREVE".
// No dia do lançamento, troque para false — uma linha, um commit. 🚀
const PRE_LANCAMENTO = true;

// 📸 Fotos de alunos no Mural: comece só com frases (false). Quando o feed
// provar vida, mude para true e anuncie como novidade — caminho com volta.
const FOTOS_NO_MURAL = false;
// 🧹 Posts de aluno saem da vitrine após N dias (ficam no banco, só saem da tela)
const JANELA_MURAL_DIAS = 60;

const AJUDA_WHATSAPP = "5518991404769";
const ADMINS = {
  recepcao: "203948!#",
  raquel: "211308!#",
  isabelle: "273646!#",
  monique: "937264!#",
};
// 👑 Dona do app (comunidade + clube): painel profundo, gestão de admins, tudo.
const SUPER_ADMIN = "raquel";
// Permissões selecionáveis (a dona marca o que cada pessoa pode fazer)
const PERMISSOES_ROTULOS = {
  postarFeed: "Postar no feed como oficial (📌)",
  excluirPosts: "Excluir posts de alunos no Mural",
  excluirComentarios: "Excluir respostas/comentários",
  excluirInstantes: "Excluir instantes (fotos 24h)",
  excluirRecados: "Excluir recados nos perfis",
  verKit: "Ver o Meu Kit dos alunos (dados sensíveis)",
  trocarFotos: "Trocar fotos de perfil dos alunos",
  editarPerfis: "Editar perfil de aluno (bio, frase)",
  resetarSenha: "Resetar senha de aluno",
  missoesRelampago: "Cadastrar prêmios e Missões Relâmpago",
  liberarMissoes: "Liberar/validar missões e pendências",
  editarArena: "Editar textos e desafios da Arena",
  verUso: "Ver uso do app (entradas e tempo — só isso)",
  painelCompleto: "Ver o painel completo (comportamento, Clube, campanhas)",
  clubeVer: "Clube: ver a vitrine da gestão (sem valores)",
  clubeValores: "Clube: ver valores, mensalidades e cobranças",
  clubeEditar: "Clube: cadastrar e editar parceiros",
  clubeCampanha: "Clube: criar campanhas no Mural",
  clubePagamentos: "Clube: registrar pagamentos (+30 dias)",
  agendaMarca: "Agenda: criar e remover eventos da marca",
};
const PERMISSOES_GRUPOS = [
  ["🐻 Mural & Comunidade", ["postarFeed", "excluirPosts", "excluirComentarios", "excluirInstantes", "excluirRecados"]],
  ["👥 Alunos & Perfis", ["verKit", "trocarFotos", "editarPerfis", "resetarSenha"]],
  ["🏟️ Missões & Arena", ["missoesRelampago", "liberarMissoes", "editarArena"]],
  ["📊 Painel", ["verUso", "painelCompleto"]],
  ["🎟️ Clube", ["clubeVer", "clubeValores", "clubeEditar", "clubeCampanha", "clubePagamentos"]],
  ["⚙️ Sistema", ["agendaMarca"]],
];
const TODAS_PERMISSOES = Object.fromEntries(Object.keys(PERMISSOES_ROTULOS).map((k) => [k, true]));
// Papéis pré-definidos: clicou, as permissões já vêm marcadas (e dá pra ajustar uma a uma)
const PAPEIS = {
  aluno: { rotulo: "PERFIL DE ALUNO", perms: {} },
  unidade: {
    rotulo: "ADMIN · UNIDADE",
    perms: { postarFeed: true, excluirPosts: true, excluirComentarios: true, missoesRelampago: true, verUso: true, trocarFotos: true, agendaMarca: true },
  },
  bastidores: { rotulo: "BASTIDORES", perms: { ...TODAS_PERMISSOES } },
  total: { rotulo: "ACESSO TOTAL (EU)", perms: { ...TODAS_PERMISSOES } },
};
// Admins fixos antigos (recepção, Isabelle, Monique) entram com o papel de unidade
const PERMISSOES_LEGADO = { ...PAPEIS.unidade.perms };
// 🏪 GESTÃO DO CLUBE — negócio terceirizado (Raquel), separado da administração
// das unidades. Só quem tem este PIN cadastra/cobra parceiros. TROQUE este PIN!
const GESTOR_CLUBE_PIN = "clube1308!#";
// Nome da empresa que opera o Clube (aparece nos avisos de transparência).
// TROQUE pelo nome/razão social oficial da sua empresa:
const CLUBE_GESTORA = "RT Parcerias";
// Categorias padronizadas dos parceiros (tags) — padronizar permite cruzar números por setor
const CATEGORIAS_CLUBE = [
  "Alimentação", "Beleza & Estética", "Saúde & Bem-estar", "Médico & Clínicas",
  "Fitness & Esporte", "Moda & Vestuário", "Tecnologia", "Serviços",
  "Educação", "Pet", "Casa & Decoração", "Automotivo", "Lazer & Turismo", "Outros",
];
const AVISO_CLUBE = `O Clube Spincycle é operado de forma independente por ${CLUBE_GESTORA}, empresa responsável pela gestão, cadastro e cobrança dos parceiros. O Clube não é administrado pela Spincycle nem por suas unidades.`;

const DESAFIO_URL = "https://desafio.spincycleprudente.com.br";
const AGENDAR_URL_PADRAO = "https://spincycle.com.br/agenda";

// Azul oficial da marca: #1f354d — usado em TODOS os pontos azuis.
// No tema escuro, textos azuis usam um tom clareado do MESMO azul (#8FA9C4)
// apenas para leitura sobre o fundo preto; fundos e botões usam o #1f354d puro.
const PALETAS = {
  escuro: {
    bg: "#0C0C0D", panel: "#14161C", panelSoft: "#1A1D25", navy: "#0E1420",
    teal: "#1f354d", tealSoft: "#8FA9C4", oak: "#B08D5E",
    cream: "#F2F2F2", mut: "#8F8F8F", line: "#262A33", ok: "#7FAF6E",
  },
  claro: {
    bg: "#FCFBF9", panel: "#FFFFFF", panelSoft: "#F6F5F1", navy: "#F8F7F4",
    teal: "#1f354d", tealSoft: "#1f354d", oak: "#8A6A3F",
    cream: "#1B1B1E", mut: "#6E6A60", line: "#E8E5DE", ok: "#4F7A42",
  },
};
const C = { ...PALETAS.escuro };
function aplicarTema(t) { Object.assign(C, PALETAS[t] || PALETAS.escuro); }

const REACTS = ["❤️", "🔥", "😳", "😂"];
const FRASES_PRONTAS = [
  "Hoje vou só no balancinho.",
  "Quem tiver do meu lado segura na minha mão e me puxa.",
  "Indo agorinha pra minha terapia diária.",
  "Perna tremendo, sorriso no rosto.",
  "O professor falou 'última subida' três vezes. TRÊS.",
  "Vim de má vontade e saí voando. De novo.",
  "Alguém guarda a bike do fundo pra mim?",
  "Playlist de hoje merecia bis.",
  "Suei tudo que comi no fim de semana.",
  "Contando as horas pra 6h15 de amanhã. (mentira) (ou não)",
];

// Símbolo do carimbo de cada missão — futuras conquistas de outros jogos entram aqui
const EMOJI_MISSAO = {
  dobra: "✌️", madruga: "🌅", maratona: "🚴", semana: "📆", zona: "🔄",
  fds: "🌞", giro: "🕐", fogo: "🔥", amigo: "🤝",
  cartela: "⭐", linha: "🏆",
};

function calcularCarimbos(prog) {
  const lista = [];
  if (!prog) return lista;
  MISSION_BASE.forEach((m, i) => {
    if (prog.done[i]) lista.push({ id: `st-${m.id}`, emoji: EMOJI_MISSAO[m.id] || "🎖️", nome: m.name, detalhe: "missão cumprida no Desafio das Missões" });
  });
  if (prog.linesDone.length > 0) lista.push({ id: "st-linha", emoji: EMOJI_MISSAO.linha, nome: `${prog.linesDone.length} linha${prog.linesDone.length > 1 ? "s" : ""} da cartela`, detalhe: "fechada(s) no Desafio das Missões" });
  if (prog.full) lista.push({ id: "st-cheia", emoji: EMOJI_MISSAO.cartela, nome: "CARTELA CHEIA", detalhe: "as 9 missões do Desafio das Missões" });
  return lista;
}

function CarimbosPassaporte({ carimbos, sid, avisar }) {
  const [todos, setTodos] = useState(false);
  if (!carimbos.length) return null;
  return (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 9, alignItems: "center" }}>
        {(todos ? carimbos : carimbos.slice(0, 6)).map((e) => (
          <button key={e.id} title={e.nome} onClick={() => avisar && avisar(`${e.emoji} ${e.nome} — ${e.detalhe}`)} style={{
            width: 62, height: 62, borderRadius: "50%",
            background: "transparent", cursor: "pointer", padding: 0,
            border: `1.6px dashed ${C.oak}99`,
            boxShadow: `inset 0 0 0 3px transparent, inset 0 0 0 4.5px ${C.oak}33`,
            display: "flex", alignItems: "center", justifyContent: "center",
            transform: `rotate(${(hash32(e.id + sid) % 25) - 12}deg)`,
            opacity: 0.92,
          }}>
            <span style={{ fontSize: 24, filter: "saturate(.85)" }}>{e.emoji}</span>
          </button>
        ))}
        {carimbos.length > 6 && !todos && (
          <button onClick={() => setTodos(true)} style={{
            background: "transparent", border: "none", cursor: "pointer",
            color: C.tealSoft, fontWeight: 800, fontSize: 12.5, padding: "0 4px",
          }}>+{carimbos.length - 6} ›</button>
        )}
        {todos && carimbos.length > 6 && (
          <button onClick={() => setTodos(false)} style={{
            background: "transparent", border: "none", cursor: "pointer",
            color: C.mut, fontWeight: 700, fontSize: 12, padding: "0 4px",
          }}>‹ menos</button>
        )}
      </div>
      <div style={{ color: C.mut, fontSize: 10.5, marginTop: 6 }}>Toque num carimbo pra ver a conquista.</div>
    </>
  );
}

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
  { id: "ilimitado", short: "ILIMITADOS",
    targets: { dobra: 4, madruga: 5, maratona: 30, semana: 7, zona: 3, fds: 4, giro: 5, fogo: 12, amigo: 8 } },
  { id: "pacote", short: "PACOTES",
    targets: { dobra: 2, madruga: 3, maratona: 16, semana: 5, zona: 3, fds: 4, giro: 4, fogo: 5, amigo: 10 } },
  { id: "passe", short: "HÍBRIDOS",
    targets: { dobra: 1, madruga: 3, maratona: 15, semana: 4, zona: 3, fds: 3, giro: 4, fogo: 4, amigo: 10 } },
];
const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];
const LINE_NAMES = [
  "de cima", "do meio", "de baixo",
  "da esquerda", "do centro", "da direita",
  "diagonal", "diagonal",
];
const WEEKDAY_SLOTS = ["06:15", "07:15", "08:15", "11:15", "16:30", "17:30", "18:30", "19:30"];
const INSTRUCTORS = ["Ana B.", "Ana Paula", "Gabriel Marcondes", "Gabriel Vilela", "Thiago"];

// ---------- Datas e helpers ----------
const toDate = (s) => new Date(s + "T12:00:00");
const dayMs = 86400000;
const dayIndex = (s) => Math.round(toDate(s).getTime() / dayMs);
const mondayOf = (s) => dayIndex(s) - ((toDate(s).getDay() + 6) % 7);
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const MESES_FULL = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const fmtBR = (s) => { const d = toDate(s); return `${d.getDate()}/${MESES[d.getMonth()]}`; };
const fmtLongBR = (s) => { const d = toDate(s); return `${d.getDate()} de ${MESES_FULL[d.getMonth()]} de ${d.getFullYear()}`; };
const todayStr = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
const agoLabel = (ts) => {
  const dif = Date.now() - ts;
  const m = Math.floor(dif / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d`;
  return fmtBR(new Date(ts).toISOString().slice(0, 10));
};
const norm = (s) => (s || "").trim().replace(/\s+/g, " ").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const normPhone = (s) => (s || "").replace(/\D/g, "").replace(/^55/, "");
const fmtPhone = (s) => {
  const d = normPhone(s);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return s || "";
};
const firstName = (n) => (n || "").trim().split(" ")[0];

// ---------- Progresso da cartela (idêntico ao Desafio) ----------
const slotMin = (slot) => { const [h, m] = slot.split(":").map(Number); return h * 60 + m; };
function computeProgress(student, targets) {
  const recs = (student.records || []).filter((r) => r.status === "ok");
  const p = {};
  p.giro = new Set(recs.map((r) => r.slot)).size;
  p.dobra = 0;
  const byDate = {};
  recs.forEach((r) => { (byDate[r.date] = byDate[r.date] || []).push(slotMin(r.slot)); });
  for (const d in byDate) {
    const mins = [...new Set(byDate[d])].sort((a, b) => a - b);
    for (let i = 1; i < mins.length; i++) if (mins[i] - mins[i - 1] <= 60) { p.dobra++; break; }
  }
  p.madruga = recs.filter((r) => r.slot === "06:15").length;
  const dates = [...new Set(recs.map((r) => r.date))].sort();
  const byWeek = {};
  dates.forEach((d) => { (byWeek[mondayOf(d)] = byWeek[mondayOf(d)] || new Set()).add(dayIndex(d)); });
  p.semana = Object.values(byWeek).reduce((m, s) => Math.max(m, s.size), 0);
  const gok = (student.guests || []).filter((g) => g.status === "ok");
  p.amigo = gok.filter((g) => g.kind !== "spin").length + Math.min(2, gok.filter((g) => g.kind === "spin").length);
  const wkndWeeks = [...new Set(dates.filter((d) => [0, 6].includes(toDate(d).getDay())).map((d) => mondayOf(d)))].sort((a, b) => a - b);
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
  const done = MISSION_BASE.map((m) => p[m.id] >= targets[m.id]);
  const doneCount = done.filter(Boolean).length;
  const linesDone = LINES.map((ln, i) => (ln.every((j) => done[j]) ? i : -1)).filter((i) => i >= 0);
  return { p, done, doneCount, linesDone, full: doneCount === 9 };
}

// ---------- Persistência ----------
const KEY_DESAFIO = (track) => `spincycle-desafio-shared-v2-${track}`;
const KEY_DESAFIO_GLOBAL = "spincycle-desafio-shared-v2-global";
const KEY_FOTOS = (track) => `spincycle-desafio-shared-v2-fotos-${track}`;
const K = {
  config: `spincycle-comunidade-v1-${UNIDADE}-config`,
  muralAlunos: `spincycle-comunidade-v1-${UNIDADE}-mural-alunos`,
  reacts: `spincycle-comunidade-v1-${UNIDADE}-reacts`,
  perfis: `spincycle-comunidade-v1-${UNIDADE}-perfis`,
  agenda: `spincycle-comunidade-v1-${UNIDADE}-agenda`,
  clube: `spincycle-comunidade-v1-${UNIDADE}-clube`,
  buscas: `spincycle-comunidade-v1-${UNIDADE}-buscas`,
  metricas: `spincycle-comunidade-v1-${UNIDADE}-metricas`,
  admins: `spincycle-comunidade-v1-${UNIDADE}-admins`,
  presenca: `spincycle-comunidade-v1-${UNIDADE}-presenca`,
  torcida: `spincycle-comunidade-v1-${UNIDADE}-torcida`,
  comentarios: `spincycle-comunidade-v1-${UNIDADE}-comentarios`,
  instantes: `spincycle-comunidade-v1-${UNIDADE}-instantes`,
  recados: `spincycle-comunidade-v1-${UNIDADE}-recados`,
};

// ⚡ Instantes: mensagens curtinhas que somem sozinhas (estilo Notas do Instagram)
const INSTANTE_HORAS = 24; // mude para 48 se quiser mais fôlego
const K_SESSAO = "spincycle-comunidade-sessao";
const K_LEMBRETES = "spincycle-comunidade-lembretes";
const K_ADMIN = "spincycle-admin-device";
const K_PARCEIRO = "spincycle-comunidade-parceiro";
const K_TEMA = "spincycle-comunidade-tema";
const K_GESTOR = "spincycle-comunidade-gestor-clube";
const K_FRASES_LIDAS = "spincycle-comunidade-frases-lidas";
const K_FAVORITOS = "spincycle-comunidade-favoritos-clube";
const K_RECOLHIDOS = "spincycle-comunidade-recolhidos";
const K_VISITADOS = "spincycle-comunidade-visitados";
const K_TERMOS = "spincycle-comunidade-termos-recentes";

async function lerShared(key, fallback) {
  try {
    const r = await window.storage.get(key, true);
    if (r && r.value) return JSON.parse(r.value);
    return fallback;
  } catch { return undefined; }
}
async function gravarShared(key, obj) {
  try {
    const cur = await window.storage.get(key, true);
    if (cur && cur.value) await window.storage.set(key + "-bak", cur.value, true);
  } catch { /* backup é melhor esforço */ }
  await window.storage.set(key, JSON.stringify(obj), true);
}
async function lerLocal(key) {
  try { const r = await window.storage.get(key, false); return r ? JSON.parse(r.value) : null; } catch { return null; }
}
async function gravarLocal(key, obj) {
  try { await window.storage.set(key, JSON.stringify(obj), false); } catch { /* ok */ }
}

// ---------- Arena: catálogo de desafios e jogos ----------
// status: "andamento" | "breve" | "encerrado"
const DESAFIOS_PADRAO = [
  {
    id: "missoes", nome: "DESAFIO DAS MISSÕES", status: "andamento",
    periodo: "05/AGO A 20/SET", icone: "urso",
    resumo: "Cartela de 9 missões estilo bingo. Feche linhas, vire Madrugador, traga convidados e dispute o ranking.",
    url: DESAFIO_URL, cta: "ENTRAR NO DESAFIO",
  },
  {
    id: "rota-do-urso", nome: "ROTA DO URSO", status: "breve",
    periodo: "COMEÇA 10/10/26", icone: "dado",
    resumo: "Jogo de tabuleiro da comunidade: cada aula é uma jogada, cada casa uma surpresa. Prepare o fôlego.",
    url: "", cta: "",
  },
  {
    id: "spinrats", nome: "DESAFIO SPINRATS", status: "encerrado",
    periodo: "ENCERRADO", icone: "trofeu",
    resumo: "O desafio que abriu a temporada. Missão dada, missão cumprida — os troféus já estão na estante.",
    url: "", cta: "",
  },
];

const CONFIG_PADRAO = {
  agendarURL: AGENDAR_URL_PADRAO,
  desafios: DESAFIOS_PADRAO,
  desafio: {
    nome: "DESAFIO DAS MISSÕES",
    periodo: "05/AGO A 20/SET",
    chamada: "Escolha seu desafio e participe!",
    url: DESAFIO_URL,
  },
  unidades: [
    {
      id: "prudente", nome: "Spincycle Prudente", cidade: "Presidente Prudente · SP",
      endereco: "", fone: "", whats: AJUDA_WHATSAPP, ativa: true,
    },
  ],
};

// ---------- QR de demonstração (padrão determinístico a partir do código) ----------
// Na versão publicada trocamos por QR real (biblioteca `qrcode` no build).
function hash32(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function rngDe(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function QRCard({ codigo, size = 168 }) {
  const N = 21, cel = size / N;
  const rnd = rngDe(hash32(codigo));
  const mods = [];
  const finder = (x, y) => {
    for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) {
      const borda = i === 0 || i === 6 || j === 0 || j === 6;
      const miolo = i >= 2 && i <= 4 && j >= 2 && j <= 4;
      if (borda || miolo) mods.push([x + j, y + i]);
    }
  };
  finder(0, 0); finder(N - 7, 0); finder(0, N - 7);
  const ocupado = (x, y) => (x < 8 && y < 8) || (x >= N - 8 && y < 8) || (x < 8 && y >= N - 8);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (!ocupado(x, y) && rnd() > 0.52) mods.push([x, y]);
  }
  return (
    <div style={{ background: "#FFFFFF", borderRadius: 12, padding: 14, display: "inline-block" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {mods.map(([x, y], i) => (
          <rect key={i} x={x * cel} y={y * cel} width={cel * 0.95} height={cel * 0.95} fill="#111113" />
        ))}
      </svg>
      <div style={{ color: "#111113", fontWeight: 800, fontSize: 13, textAlign: "center", marginTop: 8, letterSpacing: 1 }}>{codigo}</div>
    </div>
  );
}

// ---------- Avatares e logos SVG (demonstração) ----------
function svgAvatar(nome, cor) {
  const ini = (nome || "?").trim().split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const txt = ["#e9e3d5", "#d7cfbd", "#aaa18d"].includes(cor) ? "#1f354d" : "#e9e3d5";
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><rect width='120' height='120' fill='${cor}'/><text x='60' y='74' font-family='Arial' font-size='44' font-weight='bold' fill='${txt}' text-anchor='middle'>${ini}</text></svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}
function svgFotoDemo(emoji, cor) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='480' height='340'><rect width='480' height='340' fill='${cor}'/><rect width='480' height='340' fill='rgba(0,0,0,.25)'/><text x='240' y='195' font-size='110' text-anchor='middle'>${emoji}</text></svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}
function svgLogo(emoji, cor) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><rect width='120' height='120' rx='16' fill='${cor}'/><text x='60' y='78' font-size='52' text-anchor='middle'>${emoji}</text></svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}
const CORES_AV = ["#1f354d", "#1b2c3f", "#415c7a", "#e9e3d5", "#d7cfbd", "#aaa18d"];

// ---------- Dados de demonstração ----------
// Só entram quando o banco está vazio — nunca na versão publicada.
const agoraMenos = (h) => Date.now() - h * 3600000;
const diasAtras = (n) => new Date(Date.now() - n * dayMs).toISOString().slice(0, 10);

const NOMES_DEMO = [
  "Raquel Trevisi", "Fabiana Souza", "Isabelle Cardoso", "Thiago Almeida", "Monique Ferreira",
  "Ana Clara Ribeiro", "Beatriz Nogueira", "Camila Duarte", "Daniela Prado", "Elaine Castro",
  "Fernanda Lopes", "Gabriela Nunes", "Helena Martins", "Ingrid Barbosa", "Juliana Campos",
  "Karina Teles", "Larissa Moraes", "Mariana Freitas", "Natália Pires", "Olívia Ramos",
  "Patrícia Mendes", "Renata Vieira", "Sabrina Costa", "Tatiane Rocha", "Vanessa Lima",
  "Bruno Carvalho", "Caio Monteiro", "Diego Fonseca", "Eduardo Reis", "Felipe Araújo",
  "Gustavo Peixoto", "Henrique Sales", "Igor Vasconcelos", "João Pedro Dias", "Lucas Tavares",
  "Marcelo Antunes", "Nicolas Braga", "Otávio Siqueira", "Paulo Henrique Melo", "Rafael Cunha",
  "Simone Aguiar", "Viviane Torres",
];

function gerarAlunosDemo() {
  const porTrilha = { ilimitado: [], pacote: [], passe: [] };
  const fotos = {};
  NOMES_DEMO.forEach((nome, i) => {
    const rnd = rngDe(hash32("aluno-" + nome));
    const track = i < 18 ? "ilimitado" : i < 32 ? "pacote" : "passe";
    const id = "demo-" + norm(nome).replace(/ /g, "-");
    const nAulas = 4 + Math.floor(rnd() * 26);
    const records = [];
    const diasUsados = new Set();
    for (let a = 0; a < nAulas; a++) {
      let d = Math.floor(rnd() * 30);
      if (diasUsados.has(d)) d = (d + 1 + Math.floor(rnd() * 5)) % 33;
      diasUsados.add(d);
      const slot = rnd() < 0.28 ? "06:15" : WEEKDAY_SLOTS[1 + Math.floor(rnd() * (WEEKDAY_SLOTS.length - 1))];
      records.push({
        date: diasAtras(d), slot,
        instructor: INSTRUCTORS[Math.floor(rnd() * INSTRUCTORS.length)],
        status: "ok", reg: agoraMenos(d * 24 + Math.floor(rnd() * 12)),
      });
    }
    const guests = [];
    const nConv = rnd() < 0.35 ? 1 + Math.floor(rnd() * 3) : 0;
    for (let g = 0; g < nConv; g++) {
      guests.push({
        name: `Convidado ${g + 1}`, status: "ok", kind: "novo",
        reg: agoraMenos(Math.floor(rnd() * 500)), bought: rnd() < 0.25,
      });
    }
    porTrilha[track].push({
      id, name: nome, pass: "demo", phone: "1899" + String(1000000 + i * 137).slice(0, 7),
      approved: true, records, guests,
    });
    fotos[`${track}:${id}`] = svgAvatar(nome, CORES_AV[i % CORES_AV.length]);
  });
  return {
    allData: {
      ilimitado: { students: porTrilha.ilimitado },
      pacote: { students: porTrilha.pacote },
      passe: { students: porTrilha.passe },
    },
    fotos,
  };
}

const GDATA_DEMO = { miniMissions: [
  { id: "demo-mm", name: "Pose do Gabriel", startTs: agoraMenos(25), endTs: agoraMenos(25) + 30 * dayMs },
] };

const BUSCAS_DEMO = {
  madrugador: 23, cartela: 18, "missao relampago": 14, fabiana: 11, cafe: 9,
  convidado: 8, acai: 7, ranking: 6, sapatilha: 5, playlist: 4, thiago: 3,
};

const PARCEIROS_DEMO = [
  ["Açaí do Vale", "Alimentação", "🍧", "10% off em qualquer copo — todo dia", true],
  ["Barbearia Norte", "Beleza", "💈", "Corte + barba com 15% off pra aluno Spin", false],
  ["Bike Fort", "Esporte", "🚲", "Revisão de bike com 20% de desconto", true],
  ["Café Colonial Dona Rosa", "Alimentação", "☕", "Café da manhã em dobro aos sábados", false],
  ["Corpo & Mente Fisioterapia", "Saúde", "🩺", "Avaliação postural gratuita", true],
  ["CrossNutri Suplementos", "Saúde", "💊", "12% off em creatina e whey", false],
  ["Doceria da Lê", "Alimentação", "🧁", "Brigadeiro grátis na compra de 6 doces", false],
  ["Espaço Pilates Prudente", "Esporte", "🧘", "1ª aula experimental por R$ 10", false],
  ["Farmácia VivaBem", "Saúde", "💚", "8% off em dermocosméticos", false],
  ["Hamburgueria do Zé", "Alimentação", "🍔", "Batata grátis no combo duplo", true],
  ["Ótica Olhar", "Serviços", "🕶️", "Óculos de sol com 25% off", false],
  ["Padaria Pão da Serra", "Alimentação", "🥖", "Pão francês em dobro após as 18h", false],
  ["Restaurante Sabor Caseiro", "Alimentação", "🍽️", "Suco grátis no prato executivo", false],
  ["Studio Nails Prudente", "Beleza", "💅", "Esmaltação em gel com 10% off", false],
  ["Sushi Naka", "Alimentação", "🍣", "Temaki em dobro às terças", false],
];
function gerarClubeDemo() {
  return {
    parceiros: PARCEIROS_DEMO.map(([nome, categoria, emoji, beneficio, plus], i) => {
      const slug = norm(nome).replace(/ /g, "-");
      return {
        id: "pc-" + slug,
        nome, categoria, beneficio, plus,
        codigo: slug.split("-")[0].toUpperCase() + "2026",
        unidade: i % 5 === 0 ? "global" : "prudente",
        endereco: i === 0 ? "Av. Washington Luiz, 825 — Centro" : i === 9 ? "R. Barão do Rio Branco, 410" : "",
        site: i === 0 ? "@acaidovale" : "",
        acoes: i === 0 ? [{ id: "ac-d1", titulo: "50% no segundo copo" }, { id: "ac-d2", titulo: "Leve 1 receba 2 (terças)" }]
          : i === 9 ? [{ id: "ac-d3", titulo: "Combo duplo com batata grátis" }] : [],
        mensalidade: plus ? "199" : "99",
        pagoAte: i === 12 ? diasAtras(6) : diasAtras(-25 - (i % 10)), // parceiro 12: vencido de propósito, p/ você ver o comportamento
        cobrancaLink: "",
        logo: svgLogo(emoji, CORES_AV[(i + 3) % CORES_AV.length]),
        vouchers: [
          { id: `v-${slug}-1`, titulo: beneficio, desc: "Apresente o QR na loja para validar.", codigo: `SPIN-${slug.split("-")[0].toUpperCase()}-${10 + i}` },
        ],
      };
    }),
  };
}

function gerarMuralAlunosDemo(allData, fotos) {
  const todos = [];
  TRACKS.forEach((t) => (allData[t.id].students || []).forEach((s) => todos.push({ ...s, track: t.id })));
  const posts = [];
  const rnd = rngDe(hash32("mural-demo"));
  for (let i = 0; i < 14; i++) {
    const s = todos[Math.floor(rnd() * todos.length)];
    const frase = FRASES_PRONTAS[Math.floor(rnd() * FRASES_PRONTAS.length)];
    posts.push({
      id: `al-demo-${i}`, ts: agoraMenos(1 + Math.floor(rnd() * 90)),
      texto: frase, fotoPost: null, autorNome: s.name, autorChave: `${s.track}:${s.id}`, tipo: "aluno",
    });
  }
  posts.push({
    id: "camp-demo", ts: agoraMenos(6), tipo: "campanha",
    texto: "Deu a loka no Açaí do Vale! 🍧 Compre um açaí de 500ml e leve um quilo pra casa. Corre que é só hoje.",
    fotoPost: null, autorNome: "Açaí do Vale", autorChave: null,
    logo: svgLogo("🍧", "#415c7a"), parceiroId: "pc-acai-do-vale",
  });
  posts.push({
    id: "al-demo-adm", ts: agoraMenos(12), tipo: "oficial",
    texto: "Sábado tem aula temática — playlist votada por vocês. Bora lotar o estúdio! 🖤",
    fotoPost: null, autorNome: "Spincycle Prudente", autorChave: null,
  });
  return posts.sort((a, b) => b.ts - a.ts);
}

function gerarReactsDemo(posts, chaves) {
  const out = {};
  const rnd = rngDe(hash32("reacts-demo"));
  posts.forEach((p) => {
    if (rnd() < 0.75) {
      out[p.id] = {};
      REACTS.forEach((e) => {
        const n = Math.floor(rnd() * 5);
        if (n > 0) {
          const inicio = Math.floor(rnd() * Math.max(1, chaves.length - n));
          out[p.id][e] = chaves.slice(inicio, inicio + n);
        }
      });
    }
  });
  return out;
}
function gerarTorcidaDemo(chaves) {
  const out = {};
  const rnd = rngDe(hash32("torcida-demo"));
  chaves.forEach((alvo, i) => {
    if (rnd() < 0.5) {
      const n = 1 + Math.floor(rnd() * 8);
      out[alvo] = chaves.filter((c) => c !== alvo).slice(i % 5, (i % 5) + n);
    }
  });
  return out;
}
function gerarComentariosDemo(posts, alunos) {
  const out = {};
  const rnd = rngDe(hash32("comentarios-demo"));
  const frases = ["Arrasou! 👏", "Te vejo lá!", "Essa é a energia!", "kkkkk eu me identifico", "Bora juntas amanhã?", "Merecido demais 🔥"];
  posts.slice(0, 8).forEach((p) => {
    const n = Math.floor(rnd() * 3);
    if (!n) return;
    out[p.id] = Array.from({ length: n }, (_, i) => {
      const a = alunos[Math.floor(rnd() * alunos.length)];
      return {
        id: `cd-${p.id}-${i}`, ts: p.ts + (i + 1) * 600000,
        texto: frases[Math.floor(rnd() * frases.length)],
        autorNome: a.name, autorChave: a.chave,
      };
    });
  });
  return out;
}

// ---------- Motor do Radar: eventos automáticos a partir do Desafio ----------
function gerarEventos(allData, gdata) {
  const ev = [];
  TRACKS.forEach((t) => {
    const d = allData[t.id];
    if (!d || !Array.isArray(d.students)) return;
    d.students.forEach((s) => {
      if (s.approved === false) return;
      const nome = firstName(s.name);
      const recsOk = (s.records || []).filter((r) => r.status === "ok");

      const madrugas = recsOk.filter((r) => r.slot === "06:15").sort((a, b) => (a.reg || 0) - (b.reg || 0));
      madrugas.forEach((r, i) => {
        const n = i + 1;
        if (n < 2) return;
        const ord = ["", "", "SEGUNDA", "TERCEIRA", "QUARTA", "QUINTA", "SEXTA", "SÉTIMA", "OITAVA", "NONA", "DÉCIMA"][n] || `${n}ª`;
        ev.push({
          id: `madruga-${t.id}-${s.id}-${n}`,
          ts: r.reg || 0, icon: "☕",
          titulo: `🥷 ${nome} acordou às 5h50 pela ${ord} vez.`,
          corpo: n >= (t.targets.madruga || 5)
            ? "O Madrugador é dele(a).\nAlguém dá um café pra essa pessoa."
            : "O sol nem nasceu e o pedal já girou.",
          sid: s.id, track: t.id,
        });
      });

      const gok = (s.guests || []).filter((g) => g.status === "ok").sort((a, b) => (a.reg || 0) - (b.reg || 0));
      gok.forEach((g, i) => {
        const n = i + 1;
        ev.push({
          id: `amigo-${t.id}-${s.id}-${n}`,
          ts: g.reg || 0, icon: "📣",
          titulo: `👏 ${nome} trouxe o ${n}º convidado.`,
          corpo: n >= 3 ? "Daqui a pouco a recepção vira fila de show." : "A bike do lado nunca fica vazia.",
          sid: s.id, track: t.id,
        });
      });

      (s.guests || []).filter((g) => g.bought).forEach((g, i) => {
        ev.push({
          id: `azul-${t.id}-${s.id}-${i}`,
          ts: g.reg || 0, icon: "🧸",
          titulo: `💙 Um convidado de ${nome} fechou pacote de 10+ aulas.`,
          corpo: "Ursinho pintado de azul. Rumo ao ⭐ Giro de 175 BPM.",
          sid: s.id, track: t.id,
        });
      });

      const prog = computeProgress(s, t.targets);
      if (prog.linesDone.length > 0) {
        const ultimoReg = recsOk.reduce((m, r) => Math.max(m, r.reg || 0), 0);
        prog.linesDone.forEach((li) => {
          ev.push({
            id: `linha-${t.id}-${s.id}-${li}`,
            ts: ultimoReg, icon: "🏆",
            titulo: `🏆 ${nome} fechou a linha ${LINE_NAMES[li]} da cartela.`,
            corpo: "Tá voando, gente.",
            sid: s.id, track: t.id,
          });
        });
      }
      if (prog.full) {
        const ultimoReg = recsOk.reduce((m, r) => Math.max(m, r.reg || 0), 0);
        ev.push({
          id: `cheia-${t.id}-${s.id}`,
          ts: ultimoReg, icon: "⭐",
          titulo: `⭐ ${nome} fechou a CARTELA CHEIA.`,
          corpo: "Nove missões. Zero desculpas.",
          sid: s.id, track: t.id,
        });
      }
    });

    (d.miniMissions || []).forEach((x) => {
      const ts = x.startTs || 0;
      if (!ts) return;
      ev.push({
        id: `mm-${t.id}-${x.id || x.name}`,
        ts, icon: "⚡",
        titulo: "⚡ Nova Missão Relâmpago no ar!",
        corpo: `${(x.name || "").toUpperCase()} — corre lá no app do Desafio! 🔥`,
      });
    });
  });

  ((gdata && gdata.miniMissions) || []).forEach((x) => {
    const ts = x.startTs || 0;
    if (!ts) return;
    ev.push({
      id: `mmg-${x.id || x.name}`,
      ts, icon: "⚡",
      titulo: "⚡ Nova Missão Relâmpago no ar!",
      corpo: `${(x.name || "").toUpperCase()} — a votação está aberta 🔥`,
    });
  });

  return ev.filter((e) => e.ts > 0).sort((a, b) => b.ts - a.ts);
}

// ---------- Ranking cruzado ----------
// Cruzamento geral: TODAS as turmas juntas, sem privilégio de trilha.
// Critério: missões cumpridas primeiro, depois quantidade de aulas feitas
// dentro dos desafios; empate vai pra quem chegou lá primeiro.
function rankingGeral(allData) {
  const out = [];
  TRACKS.forEach((t) => {
    const d = allData[t.id];
    if (!d) return;
    (d.students || []).forEach((s) => {
      if (s.approved === false) return;
      const prog = computeProgress(s, t.targets);
      const ultimoReg = (s.records || []).filter((r) => r.status === "ok").reduce((m, r) => Math.max(m, r.reg || 0), 0);
      out.push({
        sid: s.id, track: t.id, name: s.name,
        doneCount: prog.doneCount, aulas: prog.p.maratona || 0,
        ultimoReg,
      });
    });
  });
  return out.sort((a, b) =>
    b.doneCount - a.doneCount || b.aulas - a.aulas || (a.ultimoReg || Infinity) - (b.ultimoReg || Infinity)
  );
}

// ---------- Ícones SVG da marca (linha fina, estilo do mockup) ----------
const ICONE = {
  // Ícones funcionais: paths oficiais Lucide (ISC license) — grid 24, traço 2
  casa: [
    <path key="a" d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />,
    <path key="b" d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
  ],
  calendario: [
    <path key="a" d="M8 2v3" />,
    <path key="b" d="M16 2v3" />,
    <rect key="c" x="3" y="3" width="18" height="18" rx="2" />,
    <path key="d" d="M3 9h18" />,
    <path key="e" d="M8 13h.01" />,
    <path key="f" d="M12 13h.01" />,
    <path key="g" d="M16 13h.01" />,
    <path key="h" d="M8 17h.01" />,
    <path key="i" d="M12 17h.01" />,
    <path key="j" d="M16 17h.01" />,
  ],
  calendarioRelogio: [
    <path key="a" d="M16 14v2.2l1.6 1" />,
    <path key="b" d="M16 2v3" />,
    <path key="c" d="M21 7.338V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h2.338" />,
    <path key="d" d="M3 9h5.859" />,
    <path key="e" d="M8 2v3" />,
    <circle key="f" cx="16" cy="16" r="6" />,
  ],
  lupa: [
    <path key="a" d="m21 21-4.34-4.34" />,
    <circle key="b" cx="11" cy="11" r="8" />,
  ],
  globo: [
    <circle key="a" cx="12" cy="12" r="10" />,
    <path key="b" d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />,
    <path key="c" d="M2 12h20" />,
  ],
  pessoa: [
    <circle key="a" cx="12" cy="8" r="5" />,
    <path key="b" d="M20 21a8 8 0 0 0-16 0" />,
  ],
  bike: [
    <circle key="a" cx="18.5" cy="17.5" r="3.5" />,
    <circle key="b" cx="5.5" cy="17.5" r="3.5" />,
    <circle key="c" cx="15" cy="5" r="1" />,
    <path key="d" d="M12 17.5V14l-3-3 4-3 2 3h2" />,
  ],
  radar: [
    <path key="a" d="M19.07 4.93A10 10 0 0 0 6.99 3.34" />,
    <path key="b" d="M4 6h.01" />,
    <path key="c" d="M2.29 9.62A10 10 0 1 0 21.31 8.35" />,
    <path key="d" d="M16.24 7.76A6 6 0 1 0 8.23 16.67" />,
    <path key="e" d="M12 18h.01" />,
    <path key="f" d="M17.99 11.66A6 6 0 0 1 15.77 16.67" />,
    <circle key="g" cx="12" cy="12" r="2" />,
    <path key="h" d="m13.41 10.59 5.66-5.66" />,
  ],
  lapis: [
    <path key="a" d="M13 21h8" />,
    <path key="b" d="m15 5 4 4" />,
    <path key="c" d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />,
  ],
  ticket: [
    <path key="a" d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />,
    <path key="b" d="M13 5v2" />,
    <path key="c" d="M13 17v2" />,
    <path key="d" d="M13 11v2" />,
  ],
  barras: [
    <path key="a" d="M5 21v-6" />,
    <path key="b" d="M12 21V3" />,
    <path key="c" d="M19 21V9" />,
  ],
  olho: [
    <path key="a" d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />,
    <circle key="b" cx="12" cy="12" r="3" />,
  ],
  dado: [
    <rect key="a" width="18" height="18" x="3" y="3" rx="2" ry="2" />,
    <path key="b" d="M16 8h.01" />,
    <path key="c" d="M8 8h.01" />,
    <path key="d" d="M8 16h.01" />,
    <path key="e" d="M16 16h.01" />,
    <path key="f" d="M12 12h.01" />,
  ],
  trofeu: [
    <path key="a" d="M10 14.66V17a1 1 0 0 1-1 1 2 2 0 0 0-2 2v2" />,
    <path key="b" d="M14 14.66V17a1 1 0 0 0 1 1 2 2 0 0 1 2 2v2" />,
    <path key="c" d="M17.916 10H19.5A2.5 2.5 0 0 0 22 7.5V5a1 1 0 0 0-1-1h-3" />,
    <path key="d" d="M4 22h16" />,
    <path key="e" d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z" />,
    <path key="f" d="M6.084 10H4.5A2.5 2.5 0 0 1 2 7.5V5a1 1 0 0 1 1-1h3" />,
  ],
  balao: [
    <path key="a" d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719" />,
  ],
  balaoTracejado: [
    <path key="a" d="M10.1 2.182a10 10 0 0 1 3.8 0" />,
    <path key="b" d="M13.9 21.818a10 10 0 0 1-3.8 0" />,
    <path key="c" d="M17.609 3.72a10 10 0 0 1 2.69 2.7" />,
    <path key="d" d="M2.182 13.9a10 10 0 0 1 0-3.8" />,
    <path key="e" d="M20.28 17.61a10 10 0 0 1-2.7 2.69" />,
    <path key="f" d="M21.818 10.1a10 10 0 0 1 0 3.8" />,
    <path key="g" d="M3.721 6.391a10 10 0 0 1 2.7-2.69" />,
    <path key="h" d="m6.163 21.117-2.906.85a1 1 0 0 1-1.236-1.169l.965-2.98" />,
  ],
  // Mascote da marca (autoral)
  urso: [
    // orelhas com miolo
    <circle key="a" cx="6.9" cy="6.2" r="2.7" />,
    <circle key="b" cx="17.1" cy="6.2" r="2.7" />,
    <circle key="a2" cx="6.9" cy="6.2" r="1.1" />,
    <circle key="b2" cx="17.1" cy="6.2" r="1.1" />,
    // cabeça
    <circle key="c" cx="12" cy="13" r="7.4" />,
    // olhos
    <circle key="f" cx="9.2" cy="11.3" r="0.75" fill="currentColor" stroke="none" />,
    <circle key="g" cx="14.8" cy="11.3" r="0.75" fill="currentColor" stroke="none" />,
    // focinho
    <ellipse key="d" cx="12" cy="15.7" rx="3.1" ry="2.5" />,
    <path key="n" d="M11.1 14.8h1.8l-.9 1.1z" fill="currentColor" stroke="none" />,
    <path key="m" d="M12 15.9v.9M12 16.8c-.4.55-1.15.6-1.7.2M12 16.8c.4.55 1.15.6 1.7.2" strokeWidth="1.2" />,
  ],
};
function Ic({ nome, size = 24, stroke = 1.8, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", ...style }}>
      {ICONE[nome] || null}
    </svg>
  );
}

// ---------- Componentes básicos ----------
// Cores da marca para bolinhas sem foto (determinístico: cada pessoa sempre na mesma cor)
const CORES_BOLINHA = ["#1f354d", "#1b2c3f", "#415c7a", "#e9e3d5", "#d7cfbd", "#aaa18d"];
const BOLINHA_CLARA = new Set(["#e9e3d5", "#d7cfbd", "#aaa18d"]);
const corBolinha = (nome) => CORES_BOLINHA[hash32(norm(nome || "?")) % CORES_BOLINHA.length];
function Avatar({ foto, nome, size = 44 }) {
  if (foto) return (
    <img src={foto} alt={nome} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", border: `2px solid ${C.oak}55`, flexShrink: 0 }} />
  );
  const bg = corBolinha(nome);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: bg,
      color: BOLINHA_CLARA.has(bg) ? "#1f354d" : "#e9e3d5",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 800, fontSize: size * 0.4, flexShrink: 0,
    }}>
      {(nome || "?").trim().charAt(0).toUpperCase()}
    </div>
  );
}
function Painel({ children, style, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12,
      padding: 14, cursor: onClick ? "pointer" : "default", ...style,
    }}>{children}</div>
  );
}
function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div style={{
      position: "fixed", bottom: 84, left: "50%", transform: "translateX(-50%)",
      background: C.panelSoft, color: C.cream, border: `1px solid ${C.oak}88`,
      borderRadius: 10, padding: "10px 16px", fontSize: 13, zIndex: 200,
      maxWidth: "88vw", textAlign: "center", boxShadow: "0 6px 24px rgba(0,0,0,.5)",
    }}>{msg}</div>
  );
}
const inputStyle = () => ({
  width: "100%", background: C.panelSoft, border: `1px solid ${C.line}`, borderRadius: 10,
  color: C.cream, padding: "11px 12px", fontSize: 14, outline: "none", fontFamily: "inherit",
});
const btnPrimario = () => ({
  width: "100%", background: C.teal, color: "#F2F2F2", fontWeight: 800, fontSize: 14,
  border: "none", borderRadius: 10, padding: "12px 16px", cursor: "pointer", letterSpacing: 0.5,
});
const btnFantasma = () => ({
  background: "transparent", color: C.tealSoft, fontWeight: 700, fontSize: 13,
  border: "none", padding: "8px 4px", cursor: "pointer",
});

// ---------- Reações: balão de respostas + emojis, sobrepostos à borda do card ----------
function Reacoes({ postId, reacts, minhaChave, reagir, onVerQuem, respCount = 0, onResp }) {
  const doPost = reacts[postId] || {};
  const bolinha = (conteudo, onClick, ativo) => (
    <button onClick={onClick} style={{
      width: 34, height: 34, borderRadius: "50%", padding: 0,
      background: ativo ? C.teal : C.panelSoft,
      border: `1px solid ${ativo ? C.tealSoft : C.line}`,
      cursor: "pointer", fontSize: 15.5, lineHeight: 1,
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 2px 8px rgba(0,0,0,.35)",
      color: C.cream,
    }}>{conteudo}</button>
  );
  return (
    <div style={{ position: "absolute", bottom: 0, right: 12, display: "flex", gap: 8 }}>
      {onResp && (
        <span style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
          {bolinha(<Ic nome="balao" size={16} stroke={1.9} />, onResp, false)}
          <span style={{
            fontSize: 10, fontWeight: 700, minHeight: 12, lineHeight: 1.2,
            color: respCount ? C.oak : "transparent",
          }}>{respCount || "0"}</span>
        </span>
      )}
      {REACTS.map((e) => {
        const quem = doPost[e] || [];
        const eu = minhaChave && quem.includes(minhaChave);
        return (
          <span key={e} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
            {bolinha(e, () => reagir(postId, e), eu)}
            <button onClick={quem.length ? onVerQuem : undefined} style={{
              background: "transparent", border: "none", padding: 0,
              fontSize: 10, fontWeight: 700, minHeight: 12, lineHeight: 1.2,
              color: quem.length ? C.oak : "transparent",
              cursor: quem.length ? "pointer" : "default",
            }}>{quem.length || "0"}</button>
          </span>
        );
      })}
    </div>
  );
}

// ---------- Cartão de post (Radar e Mural) ----------
function PostCard({ e, fotos, reacts, minhaChave, reagir, onApagar, onAutor, seloTorcida,
  comentarios = [], onComentar, onApagarComentario, podeApagarComentario, onVerQuem, onLido, extraInfo }) {
  const ehPostDePessoa = !!e.autorNome;
  const campanha = e.tipo === "campanha";
  const foto = campanha ? (e.logo || null) : (e.autorChave ? fotos[e.autorChave] : null);
  const oficial = e.tipo === "oficial";
  const clicavel = onAutor ? { cursor: "pointer" } : {};
  const [abrirResp, setAbrirResp] = useState(false);
  const [resp, setResp] = useState("");
  const enviar = () => {
    if (!resp.trim() || !onComentar) return;
    onComentar(resp);
    setResp("");
  };
  return (
    <div style={{ position: "relative", paddingBottom: 29 }}>
      <Painel style={{ border: oficial ? `1px solid ${C.oak}66` : campanha ? `1px solid ${C.tealSoft}66` : `1px solid ${C.line}`, padding: abrirResp ? "12px 14px 26px" : "12px 14px 18px" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          {ehPostDePessoa && <span onClick={onAutor || undefined} style={clicavel}><Avatar foto={foto} nome={e.autorNome} size={38} /></span>}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
              <div style={{ fontWeight: 700, fontSize: 13.5, lineHeight: 1.35 }}>
                {ehPostDePessoa
                  ? <span onClick={onAutor || undefined} style={{ color: oficial ? C.oak : campanha ? C.tealSoft : C.cream, ...clicavel }}>{oficial ? "📌 " : campanha ? "🏷️ " : ""}{e.autorNome}{campanha ? " · Clube" : ""}</span>
                  : <span onClick={onAutor || undefined} style={clicavel}>{e.titulo}</span>}
                {seloTorcida && <span title="Você torce por essa pessoa" style={{ marginLeft: 5, fontSize: 11 }}>📣</span>}
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "baseline", flexShrink: 0 }}>
                {onApagar && (
                  <button onClick={onApagar} style={{ background: "transparent", border: "none", color: C.mut, cursor: "pointer", fontSize: 12, padding: 0 }}>🗑</button>
                )}
                <span style={{ color: C.oak, fontSize: 11.5 }}>{agoLabel(e.ts)}</span>
              </div>
            </div>
            {ehPostDePessoa
              ? (e.texto && <div style={{ fontSize: 13.5, marginTop: 3, lineHeight: 1.4, whiteSpace: "pre-line" }}>{e.texto}</div>)
              : (e.corpo && <div style={{ color: C.mut, fontSize: 12.5, marginTop: 3, whiteSpace: "pre-line", lineHeight: 1.4 }}>{e.corpo}</div>)}
            {e.fotoPost && <img src={e.fotoPost} alt="" style={{ width: "100%", borderRadius: 10, marginTop: 8, border: `1px solid ${C.line}` }} />}
            {extraInfo && <div style={{ color: C.oak, fontSize: 10.5, marginTop: 5 }}>{extraInfo}</div>}

            {/* Respostas */}
            {abrirResp && (
              <div style={{ marginTop: 6, borderTop: `1px solid ${C.line}`, paddingTop: 8, display: "grid", gap: 8 }}>
                {comentarios.map((c) => (
                  <div key={c.id} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <Avatar foto={c.autorChave ? fotos[c.autorChave] : null} nome={c.autorNome} size={24} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontWeight: 700, fontSize: 12 }}>{c.autorNome}</span>
                      <span style={{ color: C.oak, fontSize: 10.5, marginLeft: 6 }}>{agoLabel(c.ts)}</span>
                      <div style={{ fontSize: 12.5, lineHeight: 1.4, marginTop: 1 }}>{c.texto}</div>
                    </div>
                    {podeApagarComentario && podeApagarComentario(c) && (
                      <button onClick={() => onApagarComentario && onApagarComentario(c.id)}
                        style={{ background: "transparent", border: "none", color: C.mut, cursor: "pointer", fontSize: 11, padding: 0 }}>🗑</button>
                    )}
                  </div>
                ))}
                <div style={{ display: "flex", gap: 6 }}>
                  <input style={{ ...inputStyle(), padding: "8px 10px", fontSize: 12.5 }} maxLength={200}
                    placeholder="Escreve uma resposta…" value={resp}
                    onChange={(ev) => setResp(ev.target.value)}
                    onKeyDown={(ev) => { if (ev.key === "Enter") enviar(); }} />
                  <button onClick={enviar} style={{ ...btnPrimario(), width: "auto", padding: "8px 14px", fontSize: 12.5, opacity: resp.trim() ? 1 : 0.5 }}>➤</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Painel>
      <Reacoes postId={e.id} reacts={reacts} minhaChave={minhaChave} reagir={reagir} onVerQuem={onVerQuem}
        respCount={comentarios.length} onResp={onComentar ? () => { if (!abrirResp && onLido) onLido(); setAbrirResp(!abrirResp); } : null} />
    </div>
  );
}

// ---------- Compressão de imagem ----------
function lerImagem(f, cb, maxLado = 640) {
  if (!f) return;
  const img = new Image();
  const url = URL.createObjectURL(f);
  img.onload = () => {
    const sc = Math.min(1, maxLado / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * sc));
    const h = Math.max(1, Math.round(img.height * sc));
    const cv = document.createElement("canvas");
    cv.width = w; cv.height = h;
    cv.getContext("2d").drawImage(img, 0, 0, w, h);
    URL.revokeObjectURL(url);
    cb(cv.toDataURL("image/jpeg", 0.72));
  };
  img.onerror = () => URL.revokeObjectURL(url);
  img.src = url;
}

// ---------- Login ----------
function TelaLogin({ allData, carregando, onEntrar, entrarDemo, onParceiro, adminLiberado, entrarStaff }) {
  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [modoParc, setModoParc] = useState(false);
  const [codParc, setCodParc] = useState("");

  const tentar = () => {
    setErro("");
    if (!nome.trim() || !senha) { setErro("Preencha nome e senha."); return; }
    if (carregando) { setErro("Ainda carregando os dados… tenta de novo em instantes."); return; }
    const alvo = norm(nome);
    for (const t of TRACKS) {
      const d = allData[t.id];
      if (!d) continue;
      const s = (d.students || []).find((x) => norm(x.name) === alvo);
      if (s) {
        if (s.approved === false) { setErro("Seu cadastro ainda aguarda liberação da recepção."); return; }
        if (s.pass && s.pass === senha) { onEntrar({ track: t.id, sid: s.id, name: s.name }); return; }
        setErro("Senha incorreta. É a mesma do app do Desafio."); return;
      }
    }
    setErro("Não achei esse nome. Use exatamente o nome do seu cadastro no Desafio das Missões.");
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 24px", maxWidth: 440, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <Ic nome="urso" size={52} stroke={1.4} style={{ color: C.oak, margin: "0 auto 10px" }} />
        <div style={{ fontWeight: 800, fontSize: 22, letterSpacing: 1 }}>COMUNIDADE</div>
        <div style={{ fontWeight: 800, fontSize: 22, letterSpacing: 1, color: C.teal }}>SPINCYCLE</div>
        {!modoParc && (
          <div style={{ color: C.mut, fontSize: 12.5, marginTop: 10 }}>
            Entre com o <b style={{ color: C.cream }}>mesmo usuário e senha</b> do app do Desafio das Missões.
          </div>
        )}
      </div>
      {!modoParc ? (
        <div style={{ display: "grid", gap: 10 }}>
          <input style={inputStyle()} placeholder="Nome e sobrenome (igual ao Desafio)" value={nome} onChange={(e) => setNome(e.target.value)} />
          <input style={inputStyle()} type="password" placeholder="Senha" value={senha}
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") tentar(); }} />
          {erro && <div style={{ color: "#E08585", fontSize: 12.5 }}>{erro}</div>}
          <button style={btnPrimario()} onClick={tentar}>ENTRAR</button>
          <a href={DESAFIO_URL} target="_blank" rel="noreferrer" style={{ ...btnFantasma(), textAlign: "center", textDecoration: "none" }}>
            Ainda não tem cadastro? Cadastre-se no app do Desafio →
          </a>
          <div style={{ display: "flex", justifyContent: "center", gap: 18 }}>
            <button style={{ ...btnFantasma(), color: C.oak, fontSize: 12 }} onClick={() => setModoParc(true)}>🏪 Acesso parceiro</button>
            <a href={`https://wa.me/${AJUDA_WHATSAPP}?text=${encodeURIComponent("Olá! Preciso de ajuda para entrar na Comunidade Spincycle 🐻")}`}
              target="_blank" rel="noreferrer" style={{ ...btnFantasma(), textDecoration: "none", color: C.mut, fontSize: 12 }}>
              💬 Ajuda
            </a>
          </div>
          {!carregando && entrarDemo && (
            <button onClick={entrarDemo} style={{
              ...btnFantasma(), textAlign: "center", color: C.oak, marginTop: 12,
              border: `1px dashed ${C.oak}66`, borderRadius: 10, padding: "10px",
            }}>
              🧪 Banco vazio detectado — entrar em modo demonstração
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ color: C.mut, fontSize: 12.5, textAlign: "center" }}>
            Digite o <b style={{ color: C.cream }}>código de acesso</b> que a Spincycle entregou à sua empresa.
          </div>
          <input style={inputStyle()} placeholder="Código de acesso (ex.: ACAI2026)" value={codParc}
            onChange={(e) => setCodParc(e.target.value.toUpperCase())}
            onKeyDown={(e) => { if (e.key === "Enter") onParceiro(codParc, setErro); }} />
          {erro && <div style={{ color: "#E08585", fontSize: 12.5 }}>{erro}</div>}
          <button style={btnPrimario()} onClick={() => onParceiro(codParc, setErro)}>ENTRAR COMO PARCEIRO</button>
          <button style={{ ...btnFantasma(), color: C.mut }} onClick={() => { setModoParc(false); setErro(""); }}>‹ Voltar ao login de aluno</button>
        </div>
      )}
    </div>
  );
}

// ---------- Novo Post (aba do Mural) ----------
function NovoPost({ publicar, admin }) {
  const [texto, setTexto] = useState("");
  const [foto, setFoto] = useState(null);
  const [comoOficial, setComoOficial] = useState(false);
  const fileRef = useRef(null);
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ color: C.mut, fontSize: 12.5, lineHeight: 1.5 }}>
        {(adminSuper || adminPerms.postarFeed || FOTOS_NO_MURAL) ? "Frase, foto, ou os dois. Todo mundo da comunidade vê. 🐻" : "Solta a frase — todo mundo da comunidade vê. 🐻"}
      </div>
      <textarea style={{ ...inputStyle(), minHeight: 80, resize: "vertical" }} maxLength={280}
        placeholder="Escreve aqui…" value={texto} onChange={(e) => setTexto(e.target.value)} />
      {foto && <img src={foto} alt="" style={{ width: "100%", borderRadius: 10 }} />}
      <div style={{ display: "flex", gap: 8 }}>
        {(adminSuper || adminPerms.postarFeed || FOTOS_NO_MURAL) && (
          <button style={{ ...btnFantasma(), border: `1px solid ${C.line}`, borderRadius: 10, padding: "10px 14px", flex: 1 }}
            onClick={() => fileRef.current && fileRef.current.click()}>
            📷 {foto ? "Trocar foto" : "Foto"}
          </button>
        )}
        <button style={{ ...btnPrimario(), flex: 2, opacity: texto.trim() || foto ? 1 : 0.5 }}
          onClick={() => {
            if (!texto.trim() && !foto) return;
            publicar(texto.trim(), foto, (adminSuper || adminPerms.postarFeed) && comoOficial);
            setTexto(""); setFoto(null);
          }}>
          PUBLICAR
        </button>
      </div>
      {(adminSuper || adminPerms.postarFeed) && (
        <label style={{ display: "flex", gap: 8, alignItems: "center", color: C.oak, fontSize: 12.5, cursor: "pointer" }}>
          <input type="checkbox" checked={comoOficial} onChange={(e) => setComoOficial(e.target.checked)} />
          📌 Postar como Spincycle Prudente (oficial)
        </label>
      )}
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
        onChange={(e) => lerImagem(e.target.files && e.target.files[0], setFoto)} />
      <div style={{ color: C.oak, fontWeight: 800, fontSize: 12.5, letterSpacing: 1, marginTop: 8 }}>⚡ OU MANDA UMA DESSAS</div>
      <div style={{ display: "grid", gap: 6 }}>
        {FRASES_PRONTAS.map((f, i) => (
          <button key={i} onClick={() => publicar(f, null, false)} style={{
            background: C.panelSoft, border: `1px solid ${C.line}`, borderRadius: 10,
            padding: "10px 12px", color: C.cream, fontSize: 13, textAlign: "left", cursor: "pointer",
            fontFamily: "inherit", lineHeight: 1.4,
          }}>
            {f}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------- App ----------
export default function App() {
  const [tela, setTela] = useState("inicio");
  const [perfilVisto, setPerfilVisto] = useState(null); // { track, sid } da página de aluno aberta // inicio | mural | ranking | agenda | clube | cadastroClube | busca | global | perfil | fotosAlunos
  const [abaMural, setAbaMural] = useState("radar"); // radar | mural | novo
  const [filtroRadar, setFiltroRadar] = useState("todos"); // todos | torcida
  const [sessao, setSessao] = useState(null);
  const [parceiro, setParceiro] = useState(null); // sessão de parceiro logado
  const [prontoSessao, setProntoSessao] = useState(false);
  const [allData, setAllData] = useState({});
  const [gdata, setGdata] = useState(null);
  const [fotos, setFotos] = useState({});
  const [perfis, setPerfis] = useState({});
  const [muralAlunos, setMuralAlunos] = useState([]);
  const [reacts, setReacts] = useState({});
  const [clube, setClube] = useState({ parceiros: [] });
  const [buscas, setBuscas] = useState({});
  const [metricas, setMetricas] = useState({ alunos: {}, parceiros: {}, campanhas: {} });
  const [adminInfo, setAdminInfo] = useState(null); // { usuario, super, perms, unidade }
  const [adminsReg, setAdminsReg] = useState([]);   // admins cadastrados pela dona
  const [presenca, setPresenca] = useState({});     // { chave: ts } — batimento de quem está online
  const metrBuf = useRef({ entradas: 0, min: 0, telas: {}, parceiros: {}, sujo: false });
  const [torcida, setTorcida] = useState({});      // { chaveAlvo: [chaveTorcedor, ...] }
  const [comentarios, setComentarios] = useState({}); // { postId: [{id, ts, texto, autorNome, autorChave}] }
  const [verReacoes, setVerReacoes] = useState(null); // postId do modal "quem reagiu"
  const [visitados, setVisitados] = useState([]);      // chaves dos últimos perfis xeretados (só neste aparelho)
  const [termosRecentes, setTermosRecentes] = useState([]);
  const [frasesLidas, setFrasesLidas] = useState([]);   // ids das últimas frases lidas (só neste aparelho)
  const [favoritos, setFavoritos] = useState([]);        // ids de parceiros favoritados (só neste aparelho)
  const [recolhidos, setRecolhidos] = useState({});      // seções da home recolhidas (só neste aparelho)
  const [clubeFoco, setClubeFoco] = useState(null);      // parceiro para abrir já expandido no Clube
  const [instantes, setInstantes] = useState([]);      // [{id, ts, texto, autorNome, autorChave}]
  const [recados, setRecados] = useState({});          // { chaveAlvo: [{id, ts, texto, autorNome, autorChave}] }
  const [agenda, setAgenda] = useState({ eventos: [] });
  const [lembretes, setLembretes] = useState([]);
  const [config, setConfig] = useState(CONFIG_PADRAO);
  const [carregando, setCarregando] = useState(true);
  const [admin, setAdmin] = useState(false);
  const [gestorClube, setGestorClube] = useState(false);
  const [msg, setMsg] = useState("");
  const [demo, setDemo] = useState(false);
  const [tema, setTemaSt] = useState("escuro");
  const timers = useRef({});
  const demoRef = useRef(false);
  const pilhaNav = useRef([]);
  const puloNav = useRef(false);
  const gestoRef = useRef(null);
  const contRef = useRef(null);
  const avisar = (m) => {
    setMsg(m);
    clearTimeout(timers.current.toast);
    timers.current.toast = setTimeout(() => setMsg(""), 3500);
  };

  const carregarLeves = async () => {
    if (demoRef.current) return;
    const [il, pc, ps, gg, ma, rc, pf, ag, cb, cf, bs, mt, adr, prs, tc, cm, it, rd] = await Promise.all([
      lerShared(KEY_DESAFIO("ilimitado"), { students: [] }),
      lerShared(KEY_DESAFIO("pacote"), { students: [] }),
      lerShared(KEY_DESAFIO("passe"), { students: [] }),
      lerShared(KEY_DESAFIO_GLOBAL, { miniMissions: [] }),
      lerShared(K.muralAlunos, []),
      lerShared(K.reacts, {}),
      lerShared(K.perfis, {}),
      lerShared(K.agenda, { eventos: [] }),
      lerShared(K.clube, { parceiros: [] }),
      lerShared(K.config, null),
      lerShared(K.buscas, {}),
      lerShared(K.metricas, { alunos: {}, parceiros: {}, campanhas: {} }),
      lerShared(K.admins, []),
      lerShared(K.presenca, {}),
      lerShared(K.torcida, {}),
      lerShared(K.comentarios, {}),
      lerShared(K.instantes, []),
      lerShared(K.recados, {}),
    ]);
    if (il !== undefined || pc !== undefined || ps !== undefined) {
      setAllData({
        ilimitado: il || { students: [] },
        pacote: pc || { students: [] },
        passe: ps || { students: [] },
      });
    }
    if (gg !== undefined) setGdata(gg || { miniMissions: [] });
    if (ma !== undefined) setMuralAlunos(Array.isArray(ma) ? ma : []);
    if (rc !== undefined) setReacts(rc || {});
    if (pf !== undefined) setPerfis(pf || {});
    if (ag !== undefined) setAgenda(ag || { eventos: [] });
    if (cb !== undefined) setClube(cb || { parceiros: [] });
    if (cf !== undefined) setConfig(cf || CONFIG_PADRAO);
    if (bs !== undefined) setBuscas(bs || {});
    if (mt !== undefined) setMetricas(mt || { alunos: {}, parceiros: {}, campanhas: {} });
    if (adr !== undefined) setAdminsReg(Array.isArray(adr) ? adr : []);
    if (prs !== undefined) setPresenca(prs || {});
    if (tc !== undefined) setTorcida(tc || {});
    if (cm !== undefined) setComentarios(cm || {});
    if (it !== undefined) setInstantes(Array.isArray(it) ? it : []);
    if (rd !== undefined) setRecados(rd || {});
  };
  const carregarFotos = async () => {
    if (demoRef.current) return;
    const mapa = {};
    for (const t of TRACKS) {
      const f = await lerShared(KEY_FOTOS(t.id), {});
      if (f) Object.keys(f).forEach((sid) => { mapa[`${t.id}:${sid}`] = f[sid]; });
    }
    setFotos(mapa);
  };
  useEffect(() => {
    (async () => {
      const s = await lerLocal(K_SESSAO);
      if (s && s.sid) { setSessao(s); if (!s.staff) { metrBuf.current.entradas += 1; metrBuf.current.sujo = true; } }
      const pj = await lerLocal(K_PARCEIRO);
      if (pj && pj.id) setParceiro(pj);
      const flag = await lerLocal(K_ADMIN);
      const pinFlag = typeof flag === "string" ? flag : (flag && flag.pin) || "";
      const uFlag = Object.keys(ADMINS).find((u) => ADMINS[u] === pinFlag);
      if (uFlag) {
        setAdmin(true);
        setAdminInfo({ usuario: uFlag, super: uFlag === SUPER_ADMIN, perms: uFlag === SUPER_ADMIN ? { ...PERMISSOES_LEGADO } : { ...PERMISSOES_LEGADO }, unidade: UNIDADE });
      } else if (pinFlag) {
        // pode ser um admin cadastrado pela dona — valida contra a lista compartilhada
        try {
          const raw = await window.storage.get(K.admins, true);
          const lista = raw ? JSON.parse(raw.value) : [];
          const reg = (lista || []).find((a) => a.pin === pinFlag);
          if (reg) {
            setAdmin(true);
            setAdminInfo({ usuario: reg.usuario, super: false, perms: reg.permissoes || {}, unidade: reg.unidade || UNIDADE });
          }
        } catch { /* segue sem admin */ }
      }
      else {
        try {
          const raw = await window.storage.get(K_ADMIN, false);
          if (raw && Object.values(ADMINS).includes(raw.value)) setAdmin(true);
        } catch { /* segue sem admin */ }
      }
      const lm = await lerLocal(K_LEMBRETES);
      if (Array.isArray(lm)) setLembretes(lm);
      const fl = await lerLocal(K_FRASES_LIDAS);
      if (Array.isArray(fl)) setFrasesLidas(fl);
      const fv = await lerLocal(K_FAVORITOS);
      if (Array.isArray(fv)) setFavoritos(fv);
      const rc2 = await lerLocal(K_RECOLHIDOS);
      if (rc2 && typeof rc2 === "object") setRecolhidos(rc2);
      const vs = await lerLocal(K_VISITADOS);
      if (Array.isArray(vs)) setVisitados(vs);
      const tr = await lerLocal(K_TERMOS);
      if (Array.isArray(tr)) setTermosRecentes(tr);
      try {
        const g = await window.storage.get(K_GESTOR, false);
        if (g && g.value === GESTOR_CLUBE_PIN) setGestorClube(true);
      } catch { /* segue sem gestor */ }
      const tPref = await lerLocal(K_TEMA);
      if (tPref === "claro" || tPref === "escuro") { aplicarTema(tPref); setTemaSt(tPref); }
      await carregarLeves();
      setCarregando(false);
      setProntoSessao(true);
      carregarFotos();
    })();
    const t = setInterval(carregarLeves, 60000);
    const tm = setInterval(() => { descarregarMetricas(); }, 120000);
    const tp = setInterval(() => { batimentoPresenca(); }, 60000);
    return () => { clearInterval(t); clearInterval(tm); clearInterval(tp); };
  }, []);

  const batimentoPresenca = async () => {
    const s = sessaoRef.current;
    if (!s || s.staff || demoRef.current) return;
    try {
      const raw = await window.storage.get(K.presenca, true).catch(() => null);
      const mapa = raw ? JSON.parse(raw.value) : {};
      const agora = Date.now();
      mapa[`${s.track}:${s.sid}`] = agora;
      Object.keys(mapa).forEach((c) => { if (agora - mapa[c] > 10 * 60000) delete mapa[c]; });
      await window.storage.set(K.presenca, JSON.stringify(mapa), true); // sem -bak: alto giro, dado efêmero
      setPresenca(mapa);
    } catch { /* silencioso */ }
  };

  // Conta visitas às áreas principais (uso interno do painel da adm)
  useEffect(() => {
    if (!sessao) return;
    const rastreadas = ["clube", "favoritos", "mural", "arena", "instantes", "busca", "agenda", "global"];
    if (rastreadas.includes(tela)) {
      const b = metrBuf.current;
      b.telas[tela] = (b.telas[tela] || 0) + 1;
      b.sujo = true;
    }
  }, [tela]);

  // ---------- Navegação por gesto (arrastar da borda esquerda volta) ----------
  useEffect(() => {
    if (puloNav.current) { puloNav.current = false; return; }
    const st = pilhaNav.current;
    const topo = st[st.length - 1];
    if (!topo || topo.tela !== tela || topo.pv !== perfilVisto) {
      st.push({ tela, pv: perfilVisto });
      if (st.length > 30) st.shift();
    }
  }, [tela, perfilVisto]);
  const voltarGesto = () => {
    const st = pilhaNav.current;
    if (st.length < 2) {
      if (tela !== "inicio") { puloNav.current = true; st.length = 0; setTela("inicio"); }
      return;
    }
    st.pop();
    const alvo = st[st.length - 1];
    puloNav.current = true;
    setPerfilVisto(alvo.pv || null);
    setTela(alvo.tela);
  };
  const aoTocar = (e) => {
    const t = e.touches[0];
    gestoRef.current = t.clientX <= 36 ? { x: t.clientX, y: t.clientY, ativo: true } : null;
  };
  const aoArrastar = (e) => {
    const g = gestoRef.current;
    if (!g || !g.ativo) return;
    const t = e.touches[0];
    const dx = t.clientX - g.x;
    const dy = Math.abs(t.clientY - g.y);
    if (dy > 70) {
      g.ativo = false;
      if (contRef.current) { contRef.current.style.transition = "transform .18s ease"; contRef.current.style.transform = ""; }
      return;
    }
    if (dx > 0 && contRef.current) {
      contRef.current.style.transition = "none";
      contRef.current.style.transform = `translateX(${Math.min(dx, 130)}px)`;
      contRef.current.style.opacity = String(1 - Math.min(dx, 130) / 500);
    }
  };
  const aoSoltar = (e) => {
    const g = gestoRef.current;
    if (!g) return;
    const dx = e.changedTouches[0].clientX - g.x;
    if (contRef.current) {
      contRef.current.style.transition = "transform .18s ease, opacity .18s ease";
      contRef.current.style.transform = "";
      contRef.current.style.opacity = "1";
    }
    if (g.ativo && dx > 70) voltarGesto();
    gestoRef.current = null;
  };

  // ---------- Modo demonstração ----------
  const bancoVazio = TRACKS.every((t) => {
    const d = allData[t.id];
    return !d || !Array.isArray(d.students) || d.students.length === 0;
  });
  const entrarDemo = () => {
    demoRef.current = true;
    setDemo(true);
    const { allData: ad, fotos: ft } = gerarAlunosDemo();
    const posts = gerarMuralAlunosDemo(ad, ft);
    const alunosPlano = [];
    TRACKS.forEach((t) => (ad[t.id].students || []).forEach((s) => alunosPlano.push({ name: s.name, chave: `${t.id}:${s.id}` })));
    const chaves = alunosPlano.map((a) => a.chave);
    setAllData(ad);
    setFotos(ft);
    setGdata(GDATA_DEMO);
    setMuralAlunos(posts);
    const eventosDemo = gerarEventos(ad, GDATA_DEMO).slice(0, 15);
    setReacts(gerarReactsDemo([...posts, ...eventosDemo], chaves));
    setTorcida(gerarTorcidaDemo(chaves));
    setComentarios(gerarComentariosDemo(posts, alunosPlano));
    // Instantes de exemplo (últimas horas)
    setInstantes([
      { id: "i-d1", ts: agoraMenos(1), texto: "Turma das 19h presente! 🔥", fotoPost: svgFotoDemo("🚴", "#1f354d"), tipo: "aluno", autorNome: alunosPlano[5].name, autorChave: alunosPlano[5].chave },
      { id: "i-d2", ts: agoraMenos(3), texto: "Café pós 6h15 com essa vista ☕", fotoPost: svgFotoDemo("☕", "#415c7a"), tipo: "aluno", autorNome: alunosPlano[2].name, autorChave: alunosPlano[2].chave },
      { id: "i-d3", ts: agoraMenos(7), texto: "", fotoPost: svgFotoDemo("💦", "#1b2c3f"), tipo: "aluno", autorNome: alunosPlano[9].name, autorChave: alunosPlano[9].chave },
    ]);
    // Recados de exemplo no perfil da Raquel
    setRecados({
      [alunosPlano[0].chave]: [
        { id: "r-d1", ts: agoraMenos(5), texto: "Raquel, a aula de ontem foi surreal. Obrigada por tudo! 🖤", autorNome: alunosPlano[1].name, autorChave: alunosPlano[1].chave },
        { id: "r-d2", ts: agoraMenos(20), texto: "Bora fechar essa cartela, hein! Tô de olho 👀", autorNome: alunosPlano[3].name, autorChave: alunosPlano[3].chave },
      ],
    });
    setClube(gerarClubeDemo());
    setBuscas({ ...BUSCAS_DEMO });
    setFavoritos(["pc-acai-do-vale", "pc-hamburgueria-do-ze"]);
    {
      const rndM = rngDe(hash32("metricas-demo"));
      const alunosM = {};
      alunosPlano.slice(0, 25).forEach((a, i) => {
        alunosM[a.chave] = {
          nome: a.name,
          entradas: 1 + Math.floor(rndM() * 20),
          min: 4 + Math.floor(rndM() * 120),
          ultima: Date.now() - Math.floor(rndM() * 6 * 86400000),
          telas: { mural: Math.floor(rndM() * 15), clube: Math.floor(rndM() * 8), instantes: Math.floor(rndM() * 10), arena: Math.floor(rndM() * 5) },
        };
      });
      setMetricas({
        alunos: alunosM,
        parceiros: {
          "pc-acai-do-vale": { aberturas: 34, favoritos: 12 }, "pc-hamburgueria-do-ze": { aberturas: 21, favoritos: 7 },
          "pc-bike-fort": { aberturas: 17, favoritos: 9 }, "pc-sushi-naka": { aberturas: 9, favoritos: 2 },
        },
        campanhas: { "camp-demo": { cliques: 11 } },
      });
    }
    setAdmin(true);
    setAdminInfo({ usuario: "raquel", super: true, perms: { ...PERMISSOES_LEGADO }, unidade: UNIDADE });
    setAdminsReg([{ id: "adm-d1", nome: "Recepção Prudente", usuario: "recepcao.pp", pin: "0000", unidade: "prudente", permissoes: { excluirComentarios: true, postarFeed: true, verUso: true, missoesRelampago: false } }]);
    setPresenca(Object.fromEntries(
      ["ilimitado:demo-raquel-trevisi", "ilimitado:demo-fernanda-lopes", "pacote:demo-vanessa-lima", "passe:demo-tatiane-rocha",
       "ilimitado:demo-joao-pedro-dias", "pacote:demo-mariana-freitas", "passe:demo-bruno-castro"].map((c, i) => [c, Date.now() - i * 20000])
    ));
    setGestorClube(true);
    setSessao({ track: "ilimitado", sid: "demo-raquel-trevisi", name: "Raquel Trevisi" });
    avisar("🧪 Modo demonstração — nada aqui é gravado no banco.");
  };

  // ---------- Sessões ----------
  const entrar = async (s) => {
    setSessao(s);
    if (!s.staff) {
      metrBuf.current.entradas += 1;
      metrBuf.current.sujo = true;
    }
    await gravarLocal(K_SESSAO, s);
    avisar(`Bem-vinda(o), ${firstName(s.name)}! 🐻`);
  };
  const entrarParceiro = (codigo, setErro) => {
    const p = (clube.parceiros || []).find((x) => (x.codigo || "").toUpperCase() === (codigo || "").toUpperCase());
    if (!p) { setErro("Código não encontrado. Confira com a administração da Spincycle."); return; }
    const sp = { id: p.id, nome: p.nome };
    setParceiro(sp);
    if (!demo) gravarLocal(K_PARCEIRO, sp);
    avisar(`🏪 Bem-vindo, ${p.nome}!`);
  };
  const sair = async () => {
    setSessao(null);
    setParceiro(null);
    setTela("inicio");
    if (demo) {
      // A demonstração continua ativa: assim dá pra testar o login de aluno
      // (senha "demo") e o 🏪 Acesso parceiro (códigos tipo ACAI2026).
      avisar("Você saiu — a demonstração segue ativa. Recarregue a página para encerrar. 🧪");
      return;
    }
    try { await window.storage.delete(K_SESSAO, false); } catch { /* ok */ }
    try { await window.storage.delete(K_PARCEIRO, false); } catch { /* ok */ }
  };

  // ---------- Mutações seguras (GET fresco → -bak → PUT; demo fica em memória) ----------
  const minhaChave = sessao ? `${sessao.track}:${sessao.sid}` : null;

  const sessaoRef = useRef(null);
  useEffect(() => { sessaoRef.current = sessao; }, [sessao]);
  const descarregarMetricas = async () => {
    const b = metrBuf.current;
    const s = sessaoRef.current;
    if (!s || s.staff || !b.sujo) return;
    b.min += 2; // intervalo do flush ≈ tempo ativo aproximado
    const meu = `${s.track}:${s.sid}`;
    const aplicar = (base) => {
      const novo = JSON.parse(JSON.stringify(base || { alunos: {}, parceiros: {} }));
      if (!novo.alunos) novo.alunos = {};
      if (!novo.parceiros) novo.parceiros = {};
      const a = novo.alunos[meu] || { entradas: 0, min: 0, telas: {}, ultima: 0 };
      a.nome = s.name;
      a.entradas += b.entradas;
      a.min += b.min;
      a.ultima = Date.now();
      Object.keys(b.telas).forEach((t) => { a.telas[t] = (a.telas[t] || 0) + b.telas[t]; });
      a.favs = (a.favs || 0) + (b.favs || 0);
      novo.alunos[meu] = a;
      Object.keys(b.parceiros).forEach((pid) => {
        const px = novo.parceiros[pid] || {};
        novo.parceiros[pid] = { ...px, aberturas: (px.aberturas || 0) + b.parceiros[pid] };
      });
      Object.keys(b.favParceiros || {}).forEach((pid) => {
        const px = novo.parceiros[pid] || {};
        novo.parceiros[pid] = { ...px, favoritos: (px.favoritos || 0) + b.favParceiros[pid] };
      });
      if (!novo.campanhas) novo.campanhas = {};
      Object.keys(b.camp || {}).forEach((cid) => {
        novo.campanhas[cid] = { cliques: ((novo.campanhas[cid] || {}).cliques || 0) + b.camp[cid] };
      });
      return novo;
    };
    const limpar = () => { metrBuf.current = { entradas: 0, min: 0, telas: {}, parceiros: {}, favParceiros: {}, favs: 0, camp: {}, sujo: false }; };
    if (demoRef.current) { setMetricas((m) => aplicar(m)); limpar(); return; }
    const base = await lerShared(K.metricas, { alunos: {}, parceiros: {} });
    if (base === undefined) return; // métricas não são críticas: tenta no próximo ciclo
    const novo = aplicar(base);
    try {
      await window.storage.set(K.metricas, JSON.stringify(novo), true); // sem -bak: dado estatístico, alto giro
      setMetricas(novo);
      limpar();
    } catch { /* silencioso */ }
  };

  const registrarAberturaParceiro = (pid) => {
    const b = metrBuf.current;
    b.parceiros[pid] = (b.parceiros[pid] || 0) + 1;
    b.sujo = true;
  };

  const salvarAdmins = async (transforma, msg) => {
    const aplicarT = (base) => {
      const lista = Array.isArray(base) ? JSON.parse(JSON.stringify(base)) : [];
      return transforma(lista);
    };
    if (demo) {
      const novo = aplicarT(adminsReg);
      if (novo) { setAdminsReg(novo); if (msg) avisar(msg); }
      return;
    }
    const base = await lerShared(K.admins, []);
    if (base === undefined) { avisar("⚠️ Sem conexão — nada foi salvo."); return; }
    const novo = aplicarT(base);
    if (!novo) return;
    try {
      await gravarShared(K.admins, novo);
      setAdminsReg(novo);
      if (msg) avisar(msg);
    } catch { avisar("⚠️ Falha ao salvar."); }
  };

  const lancarCampanha = async (parceiroId, parceiroNome, logo, texto, valor) => {
    const post = {
      id: `camp-${Date.now()}`, ts: Date.now(), texto, fotoPost: null,
      tipo: "campanha", autorNome: parceiroNome, autorChave: null,
      logo: logo || null, parceiroId,
    };
    // registra no histórico do parceiro (chamadas já feitas + valor combinado)
    salvarClube((c) => {
      const px = (c.parceiros || []).find((x) => x.id === parceiroId);
      if (px) {
        if (!px.campanhas) px.campanhas = [];
        px.campanhas.push({ id: post.id, ts: post.ts, texto, valor: valor || "" });
      }
    }, "🧾 Chamada registrada no histórico.");
    if (demo) {
      setMuralAlunos([post, ...muralAlunos]);
      avisar("📣 Campanha no ar no Mural!");
      return;
    }
    let base = await lerShared(K.muralAlunos, []);
    if (base === undefined) { avisar("⚠️ Sem conexão — a campanha NÃO foi publicada."); return; }
    if (!Array.isArray(base)) base = [];
    const novo = [post, ...base].slice(0, 200);
    try {
      await gravarShared(K.muralAlunos, novo);
      setMuralAlunos(novo);
      avisar("📣 Campanha no ar no Mural!");
    } catch { avisar("⚠️ Falha ao publicar a campanha."); }
  };

  const publicarAluno = async (texto, fotoPost, oficial) => {
    const post = {
      id: `al-${Date.now()}`, ts: Date.now(), texto, fotoPost: fotoPost || null,
      tipo: oficial ? "oficial" : "aluno",
      autorNome: oficial ? UNIDADE_NOME : sessao.name,
      autorChave: oficial ? null : minhaChave,
    };
    if (demo) {
      setMuralAlunos([post, ...muralAlunos]);
      setAbaMural("mural");
      avisar("📣 Publicado (demonstração — não gravado).");
      return;
    }
    let base = await lerShared(K.muralAlunos, []);
    if (base === undefined) { avisar("⚠️ Sem conexão — o post NÃO foi publicado. Tente novamente."); return; }
    if (!Array.isArray(base)) base = [];
    const novo = [post, ...base].slice(0, 200);
    try {
      await gravarShared(K.muralAlunos, novo);
      setMuralAlunos(novo);
      setAbaMural("mural");
      avisar("📣 Publicado no Mural!");
    } catch { avisar("⚠️ Falha ao publicar. Tente novamente."); }
  };

  const apagarPostAluno = async (id) => {
    if (demo) { setMuralAlunos(muralAlunos.filter((p) => p.id !== id)); avisar("🗑 Removido (demonstração)."); return; }
    let base = await lerShared(K.muralAlunos, []);
    if (base === undefined || !Array.isArray(base)) { avisar("⚠️ Sem conexão — nada foi apagado."); return; }
    const novo = base.filter((p) => p.id !== id);
    if (base.length - novo.length !== 1) { avisar("🛑 Trava anti-apagão: só um post por vez."); return; }
    try {
      await gravarShared(K.muralAlunos, novo);
      setMuralAlunos(novo);
      avisar("🗑 Post removido.");
    } catch { avisar("⚠️ Falha ao remover."); }
  };

  const reagir = async (postId, emoji) => {
    if (!minhaChave) return;
    const aplicar = (base) => {
      const novo = JSON.parse(JSON.stringify(base || {}));
      if (!novo[postId]) novo[postId] = {};
      if (!novo[postId][emoji]) novo[postId][emoji] = [];
      const i = novo[postId][emoji].indexOf(minhaChave);
      if (i >= 0) novo[postId][emoji].splice(i, 1);
      else novo[postId][emoji].push(minhaChave);
      return novo;
    };
    if (demo) { setReacts(aplicar(reacts)); return; }
    const base = await lerShared(K.reacts, {});
    if (base === undefined) { avisar("⚠️ Sem conexão — a reação não foi salva."); return; }
    const novo = aplicar(base);
    try {
      await gravarShared(K.reacts, novo);
      setReacts(novo);
    } catch { avisar("⚠️ Falha ao reagir."); }
  };

  const salvarPerfil = async (dados) => {
    if (!sessao) return;
    if (demo) {
      setPerfis({ ...perfis, [minhaChave]: { ...(perfis[minhaChave] || {}), ...dados } });
      avisar("✨ Perfil atualizado (demonstração).");
      return;
    }
    const base = await lerShared(K.perfis, {});
    if (base === undefined) { avisar("⚠️ Sem conexão — o perfil NÃO foi salvo. Tente novamente."); return; }
    const novo = { ...(base || {}) };
    novo[minhaChave] = { ...(novo[minhaChave] || {}), ...dados };
    try {
      await gravarShared(K.perfis, novo);
      setPerfis(novo);
      avisar("✨ Perfil atualizado!");
    } catch { avisar("⚠️ Falha ao salvar o perfil."); }
  };

  const salvarLembrete = async (novoArr) => {
    setLembretes(novoArr);
    if (!demo) await gravarLocal(K_LEMBRETES, novoArr);
  };
  const addEventoMarca = async (evObj) => {
    if (demo) { setAgenda({ eventos: [...((agenda && agenda.eventos) || []), evObj] }); avisar("📅 Evento adicionado (demonstração)."); return; }
    const base = await lerShared(K.agenda, { eventos: [] });
    if (base === undefined) { avisar("⚠️ Sem conexão — o evento NÃO foi salvo."); return; }
    const novo = { eventos: [...((base && base.eventos) || []), evObj] };
    try {
      await gravarShared(K.agenda, novo);
      setAgenda(novo);
      avisar("📅 Evento adicionado à agenda da marca!");
    } catch { avisar("⚠️ Falha ao salvar o evento."); }
  };
  const removerEventoMarca = async (id) => {
    if (demo) { setAgenda({ eventos: ((agenda && agenda.eventos) || []).filter((e) => e.id !== id) }); avisar("🗑 Removido (demonstração)."); return; }
    const base = await lerShared(K.agenda, { eventos: [] });
    if (base === undefined) { avisar("⚠️ Sem conexão — nada foi removido."); return; }
    const evs = (base && base.eventos) || [];
    const novo = { eventos: evs.filter((e) => e.id !== id) };
    if (evs.length - novo.eventos.length !== 1) { avisar("🛑 Trava anti-apagão: só um evento por vez."); return; }
    try {
      await gravarShared(K.agenda, novo);
      setAgenda(novo);
      avisar("🗑 Evento removido.");
    } catch { avisar("⚠️ Falha ao remover."); }
  };

  // ---------- Clube: cadastro de parceiros (adm) e ações do parceiro ----------
  const salvarClube = async (fn, okMsg) => {
    if (demo) {
      const novo = JSON.parse(JSON.stringify(clube));
      fn(novo);
      setClube(novo);
      avisar(okMsg + " (demonstração)");
      return;
    }
    const base = await lerShared(K.clube, { parceiros: [] });
    if (base === undefined) { avisar("⚠️ Sem conexão — nada foi salvo. Tente novamente."); return; }
    const novo = JSON.parse(JSON.stringify(base || { parceiros: [] }));
    fn(novo);
    try {
      await gravarShared(K.clube, novo);
      setClube(novo);
      avisar(okMsg);
    } catch { avisar("⚠️ Falha ao salvar."); }
  };
  const removerParceiro = async (id) => {
    if (demo) {
      const arr = (clube.parceiros || []).filter((p) => p.id !== id);
      if ((clube.parceiros || []).length - arr.length !== 1) { avisar("🛑 Trava anti-apagão: só um por vez."); return; }
      setClube({ ...clube, parceiros: arr });
      avisar("🗑 Parceiro removido (demonstração).");
      return;
    }
    const base = await lerShared(K.clube, { parceiros: [] });
    if (base === undefined) { avisar("⚠️ Sem conexão — nada foi removido."); return; }
    const arr = (base.parceiros || []).filter((p) => p.id !== id);
    if ((base.parceiros || []).length - arr.length !== 1) { avisar("🛑 Trava anti-apagão: só um por vez."); return; }
    try {
      await gravarShared(K.clube, { ...base, parceiros: arr });
      setClube({ ...base, parceiros: arr });
      avisar("🗑 Parceiro removido.");
    } catch { avisar("⚠️ Falha ao remover."); }
  };
  const trocarFotoAluno = async (track, sid, dataURL) => {
    if (demo) {
      setFotos({ ...fotos, [`${track}:${sid}`]: dataURL });
      avisar("📸 Foto trocada (demonstração — na versão publicada fica salva).");
      return;
    }
    let base = {};
    const r = await lerShared(KEY_FOTOS(track), {});
    if (r === undefined) { avisar("⚠️ Sem conexão — a foto NÃO foi salva."); return; }
    base = r || {};
    base[sid] = dataURL;
    try {
      await gravarShared(KEY_FOTOS(track), base);
      setFotos({ ...fotos, [`${track}:${sid}`]: dataURL });
      avisar("📸 Foto atualizada!");
    } catch { avisar("⚠️ Falha ao salvar a foto."); }
  };

  const liberarGestor = async (pin) => {
    if (pin !== GESTOR_CLUBE_PIN) return false;
    setGestorClube(true);
    try { await window.storage.set(K_GESTOR, pin, false); } catch { /* sessão atual liberada */ }
    return true;
  };

  const torcer = async (alvoChave) => {
    if (!minhaChave || alvoChave === minhaChave) return;
    const aplicar = (base) => {
      const novo = JSON.parse(JSON.stringify(base || {}));
      if (!novo[alvoChave]) novo[alvoChave] = [];
      const i = novo[alvoChave].indexOf(minhaChave);
      if (i >= 0) novo[alvoChave].splice(i, 1);
      else novo[alvoChave].push(minhaChave);
      return novo;
    };
    if (demo) { setTorcida(aplicar(torcida)); return; }
    const base = await lerShared(K.torcida, {});
    if (base === undefined) { avisar("⚠️ Sem conexão — tenta de novo."); return; }
    const novo = aplicar(base);
    try {
      await gravarShared(K.torcida, novo);
      setTorcida(novo);
    } catch { avisar("⚠️ Falha ao salvar."); }
  };

  const comentar = async (postId, texto) => {
    if (!sessao || !texto.trim()) return;
    const com = {
      id: `c-${Date.now()}`, ts: Date.now(), texto: texto.trim().slice(0, 200),
      autorNome: sessao.name, autorChave: minhaChave,
    };
    const aplicar = (base) => {
      const novo = JSON.parse(JSON.stringify(base || {}));
      if (!novo[postId]) novo[postId] = [];
      novo[postId].push(com);
      novo[postId] = novo[postId].slice(-60);
      return novo;
    };
    if (demo) { setComentarios(aplicar(comentarios)); return; }
    const base = await lerShared(K.comentarios, {});
    if (base === undefined) { avisar("⚠️ Sem conexão — a resposta NÃO foi enviada."); return; }
    const novo = aplicar(base);
    try {
      await gravarShared(K.comentarios, novo);
      setComentarios(novo);
    } catch { avisar("⚠️ Falha ao responder."); }
  };

  const apagarComentario = async (postId, comId) => {
    const aplicar = (base) => {
      const novo = JSON.parse(JSON.stringify(base || {}));
      const arr = novo[postId] || [];
      const dep = arr.filter((c) => c.id !== comId);
      if (arr.length - dep.length !== 1) return null; // trava anti-apagão
      novo[postId] = dep;
      return novo;
    };
    if (demo) {
      const novo = aplicar(comentarios);
      if (novo) setComentarios(novo);
      return;
    }
    const base = await lerShared(K.comentarios, {});
    if (base === undefined) { avisar("⚠️ Sem conexão — nada foi removido."); return; }
    const novo = aplicar(base);
    if (!novo) { avisar("🛑 Trava anti-apagão: só um por vez."); return; }
    try {
      await gravarShared(K.comentarios, novo);
      setComentarios(novo);
    } catch { avisar("⚠️ Falha ao remover."); }
  };

  const postarInstante = async (texto, fotoPost) => {
    if (!sessao || !fotoPost) return;
    const item = {
      id: `i-${Date.now()}`, ts: Date.now(), texto: (texto || "").trim().slice(0, 120),
      fotoPost, tipo: "aluno",
      autorNome: sessao.name, autorChave: minhaChave,
    };
    const poda = (arr) => [item, ...arr].filter((x) => Date.now() - x.ts < 2 * INSTANTE_HORAS * 3600000).slice(0, 40);
    if (demo) { setInstantes(poda(instantes)); avisar("⚡ Instante no ar! Some em " + INSTANTE_HORAS + "h."); return; }
    const base = await lerShared(K.instantes, []);
    if (base === undefined) { avisar("⚠️ Sem conexão — o instante NÃO foi enviado."); return; }
    const novo = poda(Array.isArray(base) ? base : []);
    try {
      await gravarShared(K.instantes, novo);
      setInstantes(novo);
      avisar("⚡ Instante no ar! Some em " + INSTANTE_HORAS + "h.");
    } catch { avisar("⚠️ Falha ao enviar."); }
  };
  const apagarInstante = async (id) => {
    const aplicar = (arr) => {
      const dep = arr.filter((x) => x.id !== id);
      return arr.length - dep.length === 1 ? dep : null;
    };
    if (demo) { const n = aplicar(instantes); if (n) setInstantes(n); return; }
    const base = await lerShared(K.instantes, []);
    if (base === undefined || !Array.isArray(base)) { avisar("⚠️ Sem conexão."); return; }
    const novo = aplicar(base);
    if (!novo) { avisar("🛑 Trava anti-apagão: só um por vez."); return; }
    try { await gravarShared(K.instantes, novo); setInstantes(novo); } catch { avisar("⚠️ Falha ao remover."); }
  };

  const deixarRecado = async (alvoChave, texto) => {
    if (!sessao || !texto.trim()) return;
    const rec = {
      id: `r-${Date.now()}`, ts: Date.now(), texto: texto.trim().slice(0, 200),
      autorNome: sessao.name, autorChave: minhaChave,
    };
    const aplicar = (base) => {
      const novo = JSON.parse(JSON.stringify(base || {}));
      if (!novo[alvoChave]) novo[alvoChave] = [];
      novo[alvoChave].unshift(rec);
      novo[alvoChave] = novo[alvoChave].slice(0, 50);
      return novo;
    };
    if (demo) { setRecados(aplicar(recados)); avisar("💬 Recado deixado!"); return; }
    const base = await lerShared(K.recados, {});
    if (base === undefined) { avisar("⚠️ Sem conexão — o recado NÃO foi enviado."); return; }
    const novo = aplicar(base);
    try {
      await gravarShared(K.recados, novo);
      setRecados(novo);
      avisar("💬 Recado deixado!");
    } catch { avisar("⚠️ Falha ao enviar."); }
  };
  const apagarRecado = async (alvoChave, id) => {
    const aplicar = (base) => {
      const novo = JSON.parse(JSON.stringify(base || {}));
      const arr = novo[alvoChave] || [];
      const dep = arr.filter((x) => x.id !== id);
      if (arr.length - dep.length !== 1) return null;
      novo[alvoChave] = dep;
      return novo;
    };
    if (demo) { const n = aplicar(recados); if (n) setRecados(n); return; }
    const base = await lerShared(K.recados, {});
    if (base === undefined) { avisar("⚠️ Sem conexão."); return; }
    const novo = aplicar(base);
    if (!novo) { avisar("🛑 Trava anti-apagão: só um por vez."); return; }
    try { await gravarShared(K.recados, novo); setRecados(novo); } catch { avisar("⚠️ Falha ao remover."); }
  };

  const registrarBusca = async (termo) => {
    const t = norm(termo).slice(0, 40);
    if (t.length < 3) return;
    const novosTermos = [t, ...termosRecentes.filter((x) => x !== t)].slice(0, 8);
    setTermosRecentes(novosTermos);
    if (!demo) gravarLocal(K_TERMOS, novosTermos);
    if (demo) {
      setBuscas((b) => ({ ...b, [t]: (b[t] || 0) + 1 }));
      return;
    }
    const base = await lerShared(K.buscas, {});
    if (base === undefined) return; // sem conexão: registro de busca não é crítico, segue em silêncio
    const novo = { ...(base || {}) };
    novo[t] = (novo[t] || 0) + 1;
    try {
      await gravarShared(K.buscas, novo);
      setBuscas(novo);
    } catch { /* silencioso */ }
  };

  const toggleRecolhido = (id) => {
    setRecolhidos((r) => {
      const novo = { ...r, [id]: !r[id] };
      gravarLocal(K_RECOLHIDOS, novo);
      return novo;
    });
  };

  const toggleFavorito = (pid) => {
    setFavoritos((arr) => {
      const adicionando = !arr.includes(pid);
      const novo = adicionando ? [...arr, pid] : arr.filter((x) => x !== pid);
      if (!demo) gravarLocal(K_FAVORITOS, novo);
      if (adicionando) {
        const b = metrBuf.current;
        if (!b.favParceiros) b.favParceiros = {};
        b.favParceiros[pid] = (b.favParceiros[pid] || 0) + 1;
        b.favs = (b.favs || 0) + 1;
        b.sujo = true;
      }
      return novo;
    });
  };

  const regFraseLida = (id) => {
    setFrasesLidas((arr) => {
      const novo = [id, ...arr.filter((x) => x !== id)].slice(0, 10);
      if (!demo) gravarLocal(K_FRASES_LIDAS, novo);
      return novo;
    });
  };

  const abrirPerfilAluno = (track, sid) => {
    if (!track || !sid) return;
    setPerfilVisto({ track, sid });
    setTela("alunoPerfil");
    const chave = `${track}:${sid}`;
    if (chave !== minhaChave) {
      const novo = [chave, ...visitados.filter((c) => c !== chave)].slice(0, 10);
      setVisitados(novo);
      if (!demo) gravarLocal(K_VISITADOS, novo);
    }
  };

  const mudarTema = (t) => {
    aplicarTema(t);
    setTemaSt(t);
    gravarLocal(K_TEMA, t);
  };

  // ---------- Dados derivados ----------
  const meuAluno = (() => {
    if (!sessao) return null;
    const d = allData[sessao.track];
    return d ? (d.students || []).find((s) => s.id === sessao.sid) : null;
  })();
  const meuPerfil = sessao ? (perfis[minhaChave] || {}) : {};
  const minhaFoto = sessao ? fotos[minhaChave] : null;
  const adminSuper = !!(adminInfo && adminInfo.super);
  const adminPerms = (adminInfo && adminInfo.perms) || {};
  const clubeAcesso = {
    ver: gestorClube || adminSuper || !!adminPerms.clubeVer || !!adminPerms.clubeEditar || !!adminPerms.clubeValores || !!adminPerms.clubeCampanha || !!adminPerms.clubePagamentos,
    valores: gestorClube || adminSuper || !!adminPerms.clubeValores,
    editar: gestorClube || adminSuper || !!adminPerms.clubeEditar,
    campanha: gestorClube || adminSuper || !!adminPerms.clubeCampanha,
    pagamentos: gestorClube || adminSuper || !!adminPerms.clubePagamentos,
  };

  const minhaTorcidaSet = new Set(Object.keys(torcida).filter((alvo) => (torcida[alvo] || []).includes(minhaChave)));
  const nomeDaChave = (chave) => {
    if (!chave) return "";
    const [tk, ...resto] = chave.split(":");
    const sid = resto.join(":");
    const s = (((allData[tk] || {}).students) || []).find((x) => x.id === sid);
    return s ? s.name : "Aluno(a) da comunidade";
  };
  const chaveDoPost = (e) => e.autorChave || (e.sid && e.track ? `${e.track}:${e.sid}` : null);
  const autorDe = (e) => {
    if (e.tipo === "campanha" && e.parceiroId) {
      return () => {
        const b = metrBuf.current;
        if (!b.camp) b.camp = {};
        b.camp[e.id] = (b.camp[e.id] || 0) + 1;
        b.sujo = true;
        registrarAberturaParceiro(e.parceiroId); // abriu o parceiro → QR na tela
        setClubeFoco(e.parceiroId);
        setTela("clube");
      };
    }
    const ch = chaveDoPost(e);
    if (!ch) return null;
    const [tk, ...r] = ch.split(":");
    return () => abrirPerfilAluno(tk, r.join(":"));
  };
  const postProps = (e) => ({
    e, fotos, reacts, minhaChave,
    reagir: (pid, em) => { regFraseLida(e.id); reagir(pid, em); },
    onLido: () => regFraseLida(e.id),
    onAutor: autorDe(e),
    seloTorcida: minhaTorcidaSet.has(chaveDoPost(e)),
    comentarios: comentarios[e.id] || [],
    onComentar: (t) => comentar(e.id, t),
    onApagarComentario: (cid) => apagarComentario(e.id, cid),
    podeApagarComentario: (c) => adminSuper || adminPerms.excluirComentarios || c.autorChave === minhaChave,
    onVerQuem: () => setVerReacoes(e.id),
  });

  const renderPost = (e, extra = {}) => <PostCard key={e.id} {...postProps(e)} {...extra} />;

  const feedRadar = gerarEventos(allData, gdata);
  // Vitrine do mural: posts de aluno dentro da janela; oficiais não expiram
  const muralVisivel = muralAlunos.filter((p) => p.tipo === "oficial" || p.tipo === "campanha" || Date.now() - p.ts < JANELA_MURAL_DIAS * dayMs);
  const feedMisto = [...feedRadar, ...muralVisivel].sort((a, b) => b.ts - a.ts);
  const radarVisivel = filtroRadar === "torcida"
    ? feedRadar.filter((e) => minhaTorcidaSet.has(chaveDoPost(e)))
    : feedRadar;
  const rk = rankingGeral(allData);
  const minhaPosicao = sessao ? rk.findIndex((r) => r.sid === sessao.sid && r.track === sessao.track) + 1 : 0;
  const memberSince = meuPerfil.desde
    || (meuAluno && (meuAluno.records || []).reduce((m, r) => (r.reg && (!m || r.reg < m) ? r.reg : m), 0))
    || null;

  // ---------- Shell ----------
  if (!prontoSessao) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, color: C.cream, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Montserrat', sans-serif" }}>
        <style>{"@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap');"}</style>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40 }}>🐻</div>
          <div style={{ color: C.mut, fontSize: 13, marginTop: 8 }}>Abrindo a Comunidade…</div>
        </div>
      </div>
    );
  }

  const shell = (conteudo, semNav) => (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.cream, fontFamily: "'Montserrat', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap');
        html, body { overscroll-behavior-y: none; margin: 0; background: ${C.bg}; }
        body { padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom); }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        button { font-family: inherit; }
      `}</style>
      <div ref={contRef} onTouchStart={aoTocar} onTouchMove={aoArrastar} onTouchEnd={aoSoltar}
        style={{ maxWidth: 520, margin: "0 auto", padding: "16px 16px 110px" }}>
        {conteudo}
      </div>
      {!semNav && <BarraInferior tela={tela} setTela={setTela} />}
      <Toast msg={msg} />
    </div>
  );

  // ---------- Trava de pré-lançamento ----------
  if (PRE_LANCAMENTO && !admin && !demo) {
    return shell(
      <TelaEmBreve adminsReg={adminsReg} liberar={async (pin, usuario, reg) => {
        setAdmin(true);
        setAdminInfo(reg
          ? { usuario: reg.usuario, super: false, perms: reg.permissoes || {}, unidade: reg.unidade || UNIDADE }
          : { usuario, super: usuario === SUPER_ADMIN, perms: { ...PERMISSOES_LEGADO }, unidade: UNIDADE });
        try { await window.storage.set(K_ADMIN, pin, false); } catch { /* segue liberado nesta sessão */ }
        avisar("🔓 Acesso da equipe liberado neste aparelho.");
      }} />,
      true
    );
  }

  // ---------- Painel do parceiro logado ----------
  if (parceiro) {
    const p = (clube.parceiros || []).find((x) => x.id === parceiro.id);
    return shell(
      <PainelParceiro p={p} salvarClube={salvarClube} sair={sair} avisar={avisar} />,
      true
    );
  }

  if (!sessao) {
    return shell(
      <TelaLogin allData={allData} carregando={carregando} onEntrar={entrar}
        adminLiberado={admin}
        entrarStaff={() => entrar({ track: "staff", sid: "gestao", name: "Administração", staff: true })}
        entrarDemo={bancoVazio ? entrarDemo : null} onParceiro={entrarParceiro} />,
      true
    );
  }

  // ---------- Home (Início) ----------
  const telaInicio = (
    <>
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginTop: 8 }}>
        <div style={{ position: "relative", cursor: "pointer" }} onClick={() => sessao.staff ? setTela("painel") : abrirPerfilAluno(sessao.track, sessao.sid)}>
          <Avatar foto={minhaFoto} nome={sessao.name} size={92} />
          <button onClick={(ev) => { ev.stopPropagation(); setTela("perfil"); }} style={{
            position: "absolute", bottom: -2, right: -2, width: 30, height: 30, borderRadius: "50%",
            background: C.oak, border: "none", cursor: "pointer", fontSize: 14,
          }}>✏️</button>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 21, letterSpacing: 0.5, textTransform: "uppercase", lineHeight: 1.15 }}>
            {sessao.name}
          </div>
          <div style={{ color: C.mut, fontSize: 13.5, marginTop: 6, lineHeight: 1.4 }}>
            {meuPerfil.bio || <span style={{ fontStyle: "italic" }}>Toque no ✏️ e escreva sua frase pessoal.</span>}
          </div>
        </div>
      </div>

      {memberSince ? (
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 16, color: C.oak, fontSize: 13 }}>
          <span>📅</span>
          <span>
            Aluna(o) da {UNIDADE_NOME} desde{" "}
            <b style={{ color: C.cream }}>{fmtLongBR(new Date(memberSince).toISOString().slice(0, 10))}</b>
          </span>
        </div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 18 }}>
        <Painel onClick={() => setTela("agenda")} style={{ textAlign: "center", padding: "18px 8px", height: "100%" }}>
          <Ic nome="calendarioRelogio" size={28} style={{ margin: "0 auto", color: C.oak }} />
          <div style={{ color: C.cream, fontWeight: 700, fontSize: 11.5, marginTop: 10, letterSpacing: 0.5 }}>AGENDA</div>
        </Painel>
        <Painel onClick={() => setTela("clube")} style={{ textAlign: "center", padding: "18px 8px" }}>
          <Ic nome="ticket" size={28} style={{ margin: "0 auto", color: C.oak }} />
          <div style={{ fontWeight: 700, fontSize: 11.5, marginTop: 10, letterSpacing: 0.5 }}>CLUBE SPINCYCLE</div>
        </Painel>
        <Painel onClick={() => setTela("ranking")} style={{ textAlign: "center", padding: "18px 8px" }}>
          <Ic nome="barras" size={28} style={{ margin: "0 auto", color: C.cream }} />
          <div style={{ fontWeight: 700, fontSize: 11.5, marginTop: 10, letterSpacing: 0.5 }}>MEU RANKING</div>
          {minhaPosicao > 0 && <div style={{ color: C.tealSoft, fontSize: 11, marginTop: 4, fontWeight: 800 }}>#{minhaPosicao}</div>}
        </Painel>
      </div>

      {(adminSuper || adminPerms.verUso || adminPerms.painelCompleto) && (
        <Painel onClick={() => setTela("painel")} style={{
          marginTop: 18, display: "flex", alignItems: "center", gap: 12,
          border: `1px solid ${C.oak}66`,
        }}>
          <Ic nome="barras" size={22} style={{ color: C.oak }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 13.5 }}>PAINEL DA COMUNIDADE</div>
            <div style={{ color: C.mut, fontSize: 11.5 }}>Entradas, tempo, comportamento e Clube — só você vê.</div>
          </div>
          <span style={{ color: C.mut }}>›</span>
        </Painel>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 26, marginBottom: 10 }}>
        <button onClick={() => toggleRecolhido("arena")} style={{
          background: "transparent", border: "none", cursor: "pointer", padding: 0,
          color: C.oak, fontWeight: 800, fontSize: 15, letterSpacing: 1, fontFamily: "inherit",
          display: "flex", gap: 8, alignItems: "center",
        }}>
          ARENA SPINCYCLE <span style={{ fontSize: 12, color: C.mut }}>{recolhidos.arena ? "▸" : "▾"}</span>
        </button>
        {!recolhidos.arena && <button style={{ ...btnFantasma(), fontSize: 12 }} onClick={() => setTela("arena")}>VER TODOS ›</button>}
      </div>
      {!recolhidos.arena && (() => {
        const lista = config.desafios || DESAFIOS_PADRAO;
        const fixado = lista.find((d) => d.status === "andamento") || lista[0];
        if (!fixado) return null;
        return (
          <a href={fixado.url || undefined} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}
            onClick={fixado.url ? undefined : (ev) => { ev.preventDefault(); setTela("arena"); }}>
            <Painel style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <div style={{
                width: 84, height: 84, borderRadius: "50%", border: `2px solid ${C.tealSoft}66`, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center", background: C.panelSoft,
              }}><Ic nome={fixado.icone || "urso"} size={44} stroke={1.4} style={{ color: C.oak }} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ color: C.cream, fontWeight: 800, fontSize: 16, letterSpacing: 0.5 }}>{fixado.nome}</div>
                  <span style={{ color: C.mut }}>›</span>
                </div>
                <div style={{ color: C.oak, fontSize: 12.5, marginTop: 4 }}>📅 {fixado.periodo}</div>
                <div style={{ color: C.mut, fontSize: 12.5, marginTop: 4 }}>{fixado.resumo}</div>
                {fixado.cta && <div style={{ color: C.tealSoft, fontWeight: 800, fontSize: 13, marginTop: 8, letterSpacing: 0.5 }}>{fixado.cta} ›</div>}
              </div>
            </Painel>
          </a>
        );
      })()}
      {!recolhidos.arena && (() => {
        const trilhaMeu = TRACKS.find((t) => t.id === sessao.track);
        const alunoMeu = (((allData[sessao.track] || {}).students) || []).find((s) => s.id === sessao.sid);
        const progMeu = alunoMeu && trilhaMeu ? computeProgress(alunoMeu, trilhaMeu.targets) : null;
        const meusCarimbos = calcularCarimbos(progMeu);
        if (!meusCarimbos.length) return null;
        return (
          <div style={{ marginTop: 14 }}>
            <div style={{ color: C.oak, fontWeight: 800, fontSize: 12.5, letterSpacing: 1, marginBottom: 8 }}>🎖️ MEUS CARIMBOS</div>
            <CarimbosPassaporte carimbos={meusCarimbos} sid={sessao.sid} avisar={avisar} />
          </div>
        );
      })()}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 26, marginBottom: 10 }}>
        <div style={{ color: C.oak, fontWeight: 800, fontSize: 15, letterSpacing: 1 }}>MURAL DA COMUNIDADE</div>
        <button style={{ ...btnFantasma(), fontSize: 12 }} onClick={() => { setAbaMural("radar"); setTela("mural"); }}>VER TUDO ›</button>
      </div>
      <div style={{ display: "grid", gap: 4 }}>
        {feedMisto.slice(0, 4).map((e) => (
          <PostCard key={e.id} {...postProps(e)} />
        ))}
        {feedMisto.length > 0 && (
          <button onClick={() => { setAbaMural("radar"); setTela("mural"); }} style={{
            ...btnFantasma(), width: "100%", border: `1px solid ${C.line}`, borderRadius: 10,
            padding: "11px", color: C.tealSoft, fontWeight: 800, fontSize: 12.5, marginTop: 4,
          }}>VER TUDO NO MURAL ›</button>
        )}
        {feedMisto.length === 0 && (
          <Painel><div style={{ color: C.mut, fontSize: 13, textAlign: "center" }}>
            O Mural acende conforme a comunidade pedala. As primeiras conquistas aparecem aqui. 🚴
          </div></Painel>
        )}
      </div>
    </>
  );

  // ---------- Página do Mural (3 abas) ----------
  const abaBtn = (id, emoji, rotulo) => {
    const ativo = abaMural === id;
    return (
      <button onClick={() => setAbaMural(id)} style={{
        flex: 1, background: ativo ? C.panelSoft : C.panel,
        border: `1px solid ${ativo ? C.teal : C.line}`, borderRadius: 12,
        padding: "14px 6px", cursor: "pointer", color: ativo ? C.cream : C.mut,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
      }}>
        <Ic nome={emoji} size={26} style={{ color: ativo ? C.oak : C.mut }} />
        <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 0.5 }}>{rotulo}</span>
      </button>
    );
  };
  const telaMural = (
    <>
      <CabecalhoTela titulo="MURAL DA COMUNIDADE" voltar={() => setTela("inicio")} />
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {abaBtn("radar", "radar", "RADAR")}
        {abaBtn("mural", "urso", "MURAL")}
        {abaBtn("novo", "lapis", "NOVO POST")}
      </div>
      {abaMural === "radar" && (
        <>
          <div style={{ color: C.mut, fontSize: 12.5, marginBottom: 10, lineHeight: 1.5 }}>
            📡 Tudo que os desafios estão gerando em tempo real — conquistas, madrugadas e missões relâmpago.
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            {[["todos", "TODOS"], ["torcida", "📣 MINHA TORCIDA"]].map(([id, rot]) => (
              <button key={id} onClick={() => setFiltroRadar(id)} style={{
                background: filtroRadar === id ? C.teal : C.panelSoft,
                color: filtroRadar === id ? "#F2F2F2" : C.mut,
                border: `1px solid ${filtroRadar === id ? C.teal : C.line}`,
                borderRadius: 16, padding: "5px 11px", cursor: "pointer",
                fontSize: 11, fontWeight: 800, letterSpacing: 0.5, fontFamily: "inherit",
              }}>{rot}</button>
            ))}
          </div>
          <div style={{ display: "grid", gap: 4 }}>
            {radarVisivel.map((e) => (
              <PostCard key={e.id} {...postProps(e)} />
            ))}
            {radarVisivel.length === 0 && (
              <Painel><div style={{ color: C.mut, fontSize: 13, textAlign: "center" }}>
                {filtroRadar === "torcida" ? "Sua torcida ainda não pontuou — ou você ainda não torce por ninguém. Entra no perfil de alguém e toca em 📣 TORCER!" : "Ainda nada no radar. 🚴"}
              </div></Painel>
            )}
          </div>
        </>
      )}
      {abaMural === "mural" && (
        <>
          <div style={{ color: C.mut, fontSize: 12.5, marginBottom: 10, lineHeight: 1.5 }}>
            🐻 O que a comunidade da {UNIDADE_NOME} está postando — todo mundo daqui, sem seguir ninguém.
          </div>
          <div style={{ display: "grid", gap: 4 }}>
            {muralVisivel.map((p) => (
              <PostCard key={p.id} {...postProps(p)}
                onApagar={(adminSuper || adminPerms.excluirPosts || p.autorChave === minhaChave) ? () => apagarPostAluno(p.id) : null} />
            ))}
            {muralVisivel.length === 0 && (
              <Painel><div style={{ color: C.mut, fontSize: 13, textAlign: "center" }}>
                Ninguém postou ainda. Toca em ✍️ NOVO POST e inaugura o Mural! 🎤
              </div></Painel>
            )}
          </div>
        </>
      )}
      {abaMural === "novo" && <NovoPost publicar={publicarAluno} admin={admin} />}
    </>
  );

  // ---------- Clube Spincycle ----------
  const telaClube = (
    <TelaClube clube={clube} gestor={gestorClube} liberarGestor={liberarGestor}
      irCadastro={() => setTela("cadastroClube")} sessao={sessao} avisar={avisar}
      favoritos={favoritos} toggleFavorito={toggleFavorito} abertoInicial={clubeFoco}
      registrarAbertura={registrarAberturaParceiro}
      acessoDireto={clubeAcesso.ver}
      voltar={() => { setClubeFoco(null); setTela("inicio"); }} />
  );
  const telaCadastroClube = (
    <CadastroClube clube={clube} salvarClube={salvarClube} removerParceiro={removerParceiro}
      lancarCampanha={lancarCampanha} metricas={metricas} acesso={clubeAcesso} voltar={() => setTela("clube")} />
  );

  const telaFavoritos = (
    <TelaClube clube={clube} sessao={sessao} avisar={avisar}
      favoritos={favoritos} toggleFavorito={toggleFavorito}
      soFavoritos irClubeCompleto={() => setTela("clube")}
      registrarAbertura={registrarAberturaParceiro}
      voltar={() => setTela("inicio")} />
  );

  // ---------- Ranking ----------
  const telaRanking = (
    <TelaRanking rk={rk} sessao={sessao} fotos={fotos} abrirPerfilAluno={abrirPerfilAluno} voltar={() => setTela("inicio")} />
  );

  // ---------- Agenda ----------
  const telaAgenda = (
    <TelaAgenda
      agenda={agenda} lembretes={lembretes} admin={adminSuper || !!adminPerms.agendaMarca}
      salvarLembrete={salvarLembrete} addEventoMarca={addEventoMarca} removerEventoMarca={removerEventoMarca}
      agendarURL={config.agendarURL || AGENDAR_URL_PADRAO}
      voltar={() => setTela("inicio")}
    />
  );

  // ---------- Instantes ----------
  const instantesVivos = instantes.filter((x) => Date.now() - x.ts < INSTANTE_HORAS * 3600000);
  const telaInstantes = (
    <TelaInstantes instantes={instantesVivos} minhaChave={minhaChave} admin={adminSuper || !!adminPerms.excluirInstantes}
      postar={postarInstante} apagar={apagarInstante} renderPost={renderPost}
      voltar={() => setTela("inicio")} />
  );

  // ---------- Página pública do aluno ----------
  const telaAlunoPerfil = perfilVisto ? (
    <TelaPerfilAluno
      track={perfilVisto.track} sid={perfilVisto.sid}
      allData={allData} perfis={perfis} fotos={fotos}
      muralVisivel={muralVisivel} feedRadar={feedRadar}
      ehMeu={sessao && perfilVisto.sid === sessao.sid && perfilVisto.track === sessao.track}
      torcida={torcida} torcer={torcer} minhaChave={minhaChave}
      recados={recados} deixarRecado={deixarRecado} apagarRecado={apagarRecado} admin={adminSuper || !!adminPerms.excluirRecados}
      avisar={avisar} renderPost={renderPost}
      irEditar={() => setTela("perfil")}
      voltar={() => setTela("inicio")}
    />
  ) : null;

  // ---------- Arena ----------
  const telaArena = (
    <TelaArena desafios={config.desafios || DESAFIOS_PADRAO} voltar={() => setTela("inicio")} />
  );

  // ---------- Busca (palavras e pessoas no feed) ----------
  const telaBusca = (
    <TelaBusca feedRadar={feedRadar} muralAlunos={muralVisivel} allData={allData}
      fotos={fotos} reacts={reacts} minhaChave={minhaChave} reagir={reagir}
      admin={admin} buscas={buscas} registrarBusca={registrarBusca}
      abrirPerfilAluno={abrirPerfilAluno}
      visitados={visitados} termosRecentes={termosRecentes} nomeDaChave={nomeDaChave}
      frasesLidas={frasesLidas.map((id) => [...feedMisto, ...instantesVivos].find((p) => p.id === id)).filter(Boolean).slice(0, 6)}
      renderPost={renderPost}
      voltar={() => setTela("inicio")} />
  );

  // ---------- Global ----------
  const telaGlobal = (
    <>
      <CabecalhoTela titulo="SPINCYCLE GLOBAL" sub="Todas as Spins do país: endereço, contato e a porta de entrada de cada comunidade." voltar={() => setTela("inicio")} />
      <div style={{ display: "grid", gap: 10 }}>
        {(config.unidades || []).map((u) => (
          <Painel key={u.id} style={{ opacity: u.ativa ? 1 : 0.55 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: 26 }}>🌐</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 14.5 }}>{u.nome}</div>
                <div style={{ color: C.mut, fontSize: 12 }}>{u.cidade}</div>
              </div>
              {u.ativa
                ? <span style={{ color: C.tealSoft, fontWeight: 800, fontSize: 12 }}>{u.id === UNIDADE ? "VOCÊ ESTÁ AQUI" : "ENTRAR ›"}</span>
                : <span style={{ color: C.mut, fontSize: 12 }}>EM BREVE</span>}
            </div>
            {u.endereco && <div style={{ color: C.mut, fontSize: 12.5, marginTop: 8 }}>📍 {u.endereco}</div>}
            <div style={{ display: "flex", gap: 16, marginTop: 10, alignItems: "center" }}>
              <button onClick={u.ativa ? () => { setTela("inicio"); if (u.id === UNIDADE) avisar("Você já está na comunidade da " + u.nome + " 🐻"); } : undefined}
                style={{ ...btnFantasma(), display: "flex", gap: 6, alignItems: "center", padding: 0, opacity: u.ativa ? 1 : 0.5, cursor: u.ativa ? "pointer" : "default" }}>
                <Ic nome="olho" size={17} /> Ver comunidade
              </button>
              {u.whats && (
                <a href={`https://wa.me/${u.whats}`} target="_blank" rel="noreferrer" style={{ color: C.tealSoft, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                  💬 WhatsApp
                </a>
              )}
              {u.fone && <span style={{ color: C.mut, fontSize: 13 }}>📞 {fmtPhone(u.fone)}</span>}
            </div>
          </Painel>
        ))}
      </div>
    </>
  );

  // ---------- Perfil ----------
  const telaPerfil = (
    <TelaPerfil
      sessao={sessao} aluno={meuAluno} perfil={meuPerfil} foto={minhaFoto}
      salvarPerfil={salvarPerfil} sair={sair} admin={admin}
      tema={tema} mudarTema={mudarTema}
      irFotos={() => setTela("fotosAlunos")}
      voltar={() => setTela("inicio")}
    />
  );

  // ---------- Fotos dos alunos (adm) ----------
  const telaFotos = (
    <FotosAlunos allData={allData} fotos={fotos} trocarFotoAluno={trocarFotoAluno} voltar={() => setTela("perfil")} />
  );

  const telaPainel = (
    <TelaPainelAdm metricas={metricas} clube={clube} fotos={fotos} allData={allData}
      muralAlunos={muralAlunos} reacts={reacts} comentarios={comentarios}
      profundo={adminSuper || !!adminPerms.painelCompleto} presenca={presenca}
      irAdmins={adminSuper ? () => setTela("gestaoAdmins") : null}
      abrirPerfilAluno={abrirPerfilAluno} voltar={() => setTela("inicio")} />
  );

  const telaGestaoAdmins = adminSuper ? (
    <TelaGestaoAdmins adminsReg={adminsReg} salvarAdmins={salvarAdmins} allData={allData} fotos={fotos} voltar={() => setTela("painel")} />
  ) : null;

  const conteudo = {
    inicio: telaInicio, mural: telaMural, ranking: telaRanking, agenda: telaAgenda,
    clube: telaClube, cadastroClube: telaCadastroClube, busca: telaBusca, arena: telaArena,
    favoritos: telaFavoritos, painel: telaPainel, gestaoAdmins: telaGestaoAdmins,
    alunoPerfil: telaAlunoPerfil, instantes: telaInstantes,
    global: telaGlobal, perfil: telaPerfil, fotosAlunos: telaFotos,
  }[tela] || telaInicio;

  return (
    <>
      {shell(conteudo)}
      {verReacoes && (
        <div onClick={() => setVerReacoes(null)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", zIndex: 180,
          display: "flex", alignItems: "flex-end", justifyContent: "center",
        }}>
          <div onClick={(ev) => ev.stopPropagation()} style={{
            background: C.panel, borderRadius: "16px 16px 0 0", border: `1px solid ${C.line}`,
            width: "100%", maxWidth: 520, padding: 18, maxHeight: "60vh", overflowY: "auto",
          }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: C.oak, marginBottom: 12 }}>Quem reagiu</div>
            {REACTS.map((em) => {
              const quem = ((reacts[verReacoes] || {})[em] || []);
              if (!quem.length) return null;
              return (
                <div key={em} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 15, marginBottom: 6 }}>{em} <span style={{ color: C.mut, fontSize: 11.5, fontWeight: 700 }}>{quem.length}</span></div>
                  <div style={{ display: "grid", gap: 6 }}>
                    {quem.map((ch) => (
                      <div key={ch} onClick={() => { setVerReacoes(null); const [tk, ...r] = ch.split(":"); abrirPerfilAluno(tk, r.join(":")); }}
                        style={{ display: "flex", gap: 10, alignItems: "center", cursor: "pointer" }}>
                        <Avatar foto={fotos[ch]} nome={nomeDaChave(ch)} size={28} />
                        <span style={{ fontSize: 13 }}>{nomeDaChave(ch)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {!Object.values(reacts[verReacoes] || {}).some((a) => a && a.length) && (
              <div style={{ color: C.mut, fontSize: 13, textAlign: "center" }}>Ninguém reagiu ainda.</div>
            )}
            <button onClick={() => setVerReacoes(null)} style={{ ...btnFantasma(), width: "100%", marginTop: 8, color: C.mut }}>Fechar</button>
          </div>
        </div>
      )}
    </>
  );
}

// ---------- Tela de pré-lançamento (EM BREVE + acesso da equipe) ----------
function TelaEmBreve({ liberar, adminsReg }) {
  const [aberto, setAberto] = useState(false);
  const [usuario, setUsuario] = useState("");
  const [pin, setPin] = useState("");
  const [erro, setErro] = useState("");
  const tentar = () => {
    const u = (usuario || "").trim().toLowerCase();
    if (ADMINS[u] && ADMINS[u] === pin) { liberar(pin, u); return; }
    const reg = (adminsReg || []).find((a) => a.usuario === u && a.pin === pin);
    if (reg) { liberar(pin, u, reg); return; }
    setErro("Usuário ou PIN incorretos.");
  };
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "0 24px", textAlign: "center" }}>
      <Ic nome="urso" size={64} stroke={1.4} style={{ color: C.oak, marginBottom: 14 }} />
      <div style={{ fontWeight: 800, fontSize: 24, letterSpacing: 1 }}>COMUNIDADE</div>
      <div style={{ fontWeight: 800, fontSize: 24, letterSpacing: 1, color: C.teal }}>SPINCYCLE</div>
      <div style={{ color: C.oak, fontWeight: 800, fontSize: 14, letterSpacing: 3, marginTop: 18 }}>EM BREVE</div>
      <div style={{ color: C.mut, fontSize: 13, marginTop: 10, lineHeight: 1.6, maxWidth: 300 }}>
        Uma coisa nova está sendo montada aqui dentro.
        Continua pedalando que você fica sabendo primeiro. 🚴🖤
      </div>
      {!aberto ? (
        <button onClick={() => setAberto(true)} style={{
          ...btnFantasma(), color: C.mut, fontSize: 11, marginTop: 48, opacity: 0.6,
        }}>acesso da equipe</button>
      ) : (
        <div style={{ display: "grid", gap: 8, marginTop: 28, width: "100%", maxWidth: 300 }}>
          <input style={inputStyle()} placeholder="Usuário" value={usuario} onChange={(e) => setUsuario(e.target.value)} />
          <input style={inputStyle()} type="password" placeholder="PIN" value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") tentar(); }} />
          {erro && <div style={{ color: "#E08585", fontSize: 12 }}>{erro}</div>}
          <button style={btnPrimario()} onClick={tentar}>ENTRAR</button>
        </div>
      )}
    </div>
  );
}

// ---------- Cabeçalho padrão ----------
function CabecalhoTela({ titulo, sub, voltar }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <button style={{ ...btnFantasma(), padding: "4px 0", color: C.mut }} onClick={voltar}>‹ Início</button>
      <div style={{ color: C.oak, fontWeight: 800, fontSize: 18, letterSpacing: 1, marginTop: 4 }}>{titulo}</div>
      {sub && <div style={{ color: C.mut, fontSize: 12.5, marginTop: 4, lineHeight: 1.45 }}>{sub}</div>}
    </div>
  );
}

// ---------- Barra inferior ----------
function BarraInferior({ tela, setTela }) {
  const item = (id, conteudo) => {
    const ativo = tela === id;
    return (
      <button key={id} onClick={() => setTela(id)} aria-label={id} style={{
        background: "transparent", border: "none", cursor: "pointer", flex: 1,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "7px 0", color: ativo ? C.cream : C.mut,
      }}>
        <span style={{
          width: 56, height: 38, borderRadius: 999,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: ativo ? `${C.cream}1F` : "transparent",
          transition: "background .18s ease",
        }}>
          {conteudo(ativo)}
        </span>
      </button>
    );
  };
  return (
    <div style={{
      position: "fixed", left: 0, right: 0,
      bottom: "calc(10px + env(safe-area-inset-bottom))",
      display: "flex", justifyContent: "center", zIndex: 100, pointerEvents: "none",
    }}>
      <div style={{
        pointerEvents: "auto",
        display: "flex", width: "calc(100% - 32px)", maxWidth: 480,
        background: `${C.navy}E6`,
        backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        border: `1px solid ${C.line}99`, borderRadius: 999,
        boxShadow: "0 8px 28px rgba(0,0,0,.35)",
        padding: "2px 6px",
      }}>
        {item("inicio", (a) => <Ic nome="casa" size={24} stroke={a ? 2.1 : 1.7} />)}
        {item("instantes", (a) => <Ic nome="balaoTracejado" size={24} stroke={a ? 2.1 : 1.7} />)}
        {item("busca", (a) => <Ic nome="lupa" size={24} stroke={a ? 2.1 : 1.7} />)}
        {item("favoritos", (a) => <Ic nome="ticket" size={24} stroke={a ? 2.1 : 1.7} />)}
        {item("global", (a) => <Ic nome="globo" size={24} stroke={a ? 2.1 : 1.7} />)}
      </div>
    </div>
  );
}

// ---------- Relógio vivo (antifraude do voucher: print não mexe, app mexe) ----------
function RelogioVivo() {
  const [agora, setAgora] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setAgora(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const p = (n) => String(n).padStart(2, "0");
  return (
    <span style={{ fontVariantNumeric: "tabular-nums" }}>
      {p(agora.getDate())}/{p(agora.getMonth() + 1)}/{agora.getFullYear()} · {p(agora.getHours())}:{p(agora.getMinutes())}:{p(agora.getSeconds())}
    </span>
  );
}

// ---------- Clube Spincycle (lista) ----------
function TelaClube({ clube, gestor, liberarGestor, irCadastro, sessao, avisar, favoritos = [], toggleFavorito, abertoInicial, soFavoritos, irClubeCompleto, registrarAbertura, acessoDireto, voltar }) {
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState(abertoInicial || null);
  const [pedirPin, setPedirPin] = useState(false);
  const [pin, setPin] = useState("");
  const hoje = todayStr();
  // Parceiro com mensalidade vencida sai da vitrine automaticamente
  let parceiros = (clube.parceiros || []).filter((p) => !p.pagoAte || p.pagoAte >= hoje);
  if (soFavoritos) parceiros = parceiros.filter((p) => favoritos.includes(p.id));
  const q = norm(busca);
  const filtrados = parceiros.filter((p) => !q || norm(p.nome).includes(q) || norm(p.categoria || "").includes(q));
  const plus = filtrados.filter((p) => p.plus).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  const comuns = filtrados.filter((p) => !p.plus).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  // Sufixo pessoal do voucher: iniciais + marca do cadastro (identifica o aluno no balcão)
  const sufixo = sessao
    ? (sessao.name || "").trim().split(" ").map((x) => x[0]).slice(0, 2).join("").toUpperCase() + "-" + String(hash32(`${sessao.track}:${sessao.sid}`) % 1000).padStart(3, "0")
    : "VISITA";

  const cartao = (p, destaque) => (
    <Painel key={p.id} onClick={() => {
      const abrindo = aberto !== p.id;
      setAberto(abrindo ? p.id : null);
      if (abrindo && registrarAbertura) registrarAbertura(p.id);
    }}
      style={{ border: destaque ? `1px solid ${C.oak}` : `1px solid ${C.line}` }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        {p.logo
          ? <img src={p.logo} alt={p.nome} style={{ width: 48, height: 48, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
          : <div style={{ width: 48, height: 48, borderRadius: 10, background: C.panelSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🏪</div>}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ fontWeight: 800, fontSize: 14 }}>{p.nome}</span>
            {destaque && <span style={{ color: C.oak, fontSize: 10.5, fontWeight: 800, border: `1px solid ${C.oak}77`, borderRadius: 6, padding: "1px 6px" }}>⭐ PLUS</span>}
            {p.unidade === "global" && <span style={{ color: C.tealSoft, fontSize: 10.5, fontWeight: 800, border: `1px solid ${C.tealSoft}55`, borderRadius: 6, padding: "1px 6px" }}>🌍 GLOBAL</span>}
          </div>
          <div style={{ color: C.mut, fontSize: 11.5, marginTop: 2 }}>{p.categoria}</div>
          <div style={{ color: C.tealSoft, fontSize: 12.5, marginTop: 4, fontWeight: 700 }}>{p.beneficio}</div>
          {(p.acoes || []).length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
              {p.acoes.map((a) => (
                <span key={a.id} style={{
                  color: C.oak, border: `1px solid ${C.oak}55`, borderRadius: 6,
                  padding: "1px 7px", fontSize: 10.5, fontWeight: 700,
                }}>🏷️ {a.titulo}</span>
              ))}
            </div>
          )}
        </div>
        <button onClick={(ev) => { ev.stopPropagation(); toggleFavorito && toggleFavorito(p.id); }} style={{
          background: "transparent", border: "none", cursor: "pointer", padding: "2px 4px",
          fontSize: 17, color: favoritos.includes(p.id) ? C.oak : C.mut, flexShrink: 0,
        }}>{favoritos.includes(p.id) ? "★" : "☆"}</button>
        <span style={{ color: C.mut }}>{aberto === p.id ? "▾" : "›"}</span>
      </div>
      {aberto === p.id && (
        <div style={{ marginTop: 14, borderTop: `1px solid ${C.line}`, paddingTop: 14 }}>
          {(p.endereco || p.site) && (
            <div style={{ textAlign: "center", marginBottom: 12, display: "grid", gap: 3 }}>
              {p.endereco && <div style={{ color: C.mut, fontSize: 12 }}>📍 {p.endereco}</div>}
              {p.site && (
                <a href={p.site.startsWith("http") ? p.site : `https://${p.site.replace(/^@/, "instagram.com/")}`}
                  target="_blank" rel="noreferrer"
                  style={{ color: C.tealSoft, fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
                  🔗 {p.site}
                </a>
              )}
            </div>
          )}
          {(p.vouchers || []).map((v) => (
            <div key={v.id} style={{ textAlign: "center", marginBottom: 10 }}>
              <div style={{ fontWeight: 800, fontSize: 13.5, marginBottom: 4 }}>{v.titulo}</div>
              {v.desc && <div style={{ color: C.mut, fontSize: 12, marginBottom: 10 }}>{v.desc}</div>}
              <QRCard codigo={`${v.codigo}·${sufixo}`} />
              <div style={{ marginTop: 8, fontSize: 12.5, fontWeight: 800 }}>
                {sessao ? sessao.name : ""}
              </div>
              <div style={{ color: C.oak, fontSize: 11.5, marginTop: 2 }}><RelogioVivo /></div>
            </div>
          ))}
          {(p.vouchers || []).length === 0 && (
            <div style={{ color: C.mut, fontSize: 12.5, textAlign: "center" }}>Este parceiro ainda não publicou vouchers.</div>
          )}
          <div style={{ color: C.mut, fontSize: 11, textAlign: "center", marginTop: 8, lineHeight: 1.5 }}>
            🎟️ Válido só com o app aberto — o relógio acima precisa estar correndo.
            Print de tela não vale: o balcão confere seu nome e o relógio vivo.
          </div>
        </div>
      )}
    </Painel>
  );

  return (
    <>
      <CabecalhoTela
        titulo={soFavoritos ? "MEUS FAVORITOS 🎟️" : "CLUBE SPINCYCLE"}
        sub={soFavoritos
          ? "Seus parceiros estrelados do Clube Spincycle — benefício a um toque."
          : "Vantagens exclusivas pra quem pedala com a gente. Toque num parceiro e apresente o QR na loja."}
        voltar={voltar} />
      {!soFavoritos && (
        <input style={{ ...inputStyle(), marginBottom: 14 }} placeholder="🔎 Buscar parceiro ou categoria…" value={busca} onChange={(e) => setBusca(e.target.value)} />
      )}
      {soFavoritos ? (
        <div style={{ display: "grid", gap: 10 }}>
          {[...plus, ...comuns].map((p) => cartao(p, p.plus))}
          {filtrados.length === 0 && (
            <Painel><div style={{ color: C.mut, fontSize: 13, textAlign: "center", lineHeight: 1.6 }}>
              Nenhum favorito ainda. ⭐<br />Abre o Clube, toca na estrelinha dos seus parceiros preferidos e eles ficam fixados aqui.
            </div></Painel>
          )}
          <button onClick={irClubeCompleto} style={{ ...btnPrimario(), marginTop: 6 }}>VER O CLUBE COMPLETO ›</button>
        </div>
      ) : (
        <>
          {plus.length > 0 && (
            <>
              <div style={{ color: C.oak, fontWeight: 800, fontSize: 12.5, letterSpacing: 1, marginBottom: 8 }}>⭐ PATROCINADORES PLUS</div>
              <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>{plus.map((p) => cartao(p, true))}</div>
            </>
          )}
          <div style={{ color: C.oak, fontWeight: 800, fontSize: 12.5, letterSpacing: 1, marginBottom: 8 }}>TODOS OS PARCEIROS · A–Z</div>
          <div style={{ display: "grid", gap: 10 }}>
            {comuns.map((p) => cartao(p, false))}
            {filtrados.length === 0 && <Painel><div style={{ color: C.mut, fontSize: 13, textAlign: "center" }}>Nenhum parceiro encontrado. 🔎</div></Painel>}
          </div>
        </>
      )}

      {soFavoritos ? null : <>
      {/* Banner: venda de espaço no Clube */}
      <Painel style={{ marginTop: 18, border: `1px solid ${C.oak}88`, textAlign: "center", padding: "20px 16px" }}>
        <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: 0.5 }}>Sua empresa no Clube Spincycle? 🏪</div>
        <div style={{ color: C.mut, fontSize: 12.5, marginTop: 6, lineHeight: 1.55 }}>
          Centenas de alunos ativos vendo sua marca toda semana — com voucher, QR e vitrine dentro do app.
        </div>
        <a href={`https://wa.me/${AJUDA_WHATSAPP}?text=${encodeURIComponent("Olá! Tenho interesse em colocar minha empresa no Clube Spincycle. Pode me apresentar o clube? 🏪")}`}
          target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
          <div style={{ ...btnPrimario(), marginTop: 12 }}>QUERO FAZER PARTE</div>
        </a>
        <div style={{ color: C.mut, fontSize: 10.5, marginTop: 10, lineHeight: 1.5 }}>
          Gestão independente: {CLUBE_GESTORA}
        </div>
      </Painel>

      <div style={{ color: C.mut, fontSize: 10.5, textAlign: "center", marginTop: 16, lineHeight: 1.55, padding: "0 8px" }}>
        {AVISO_CLUBE}
      </div>

      {/* Gestão do Clube — acesso exclusivo (terceirizado), separado da adm da unidade */}
      <div style={{ textAlign: "center", marginTop: 14 }}>
        {gestor ? (
          <button style={{ ...btnFantasma(), color: C.oak }} onClick={irCadastro}>⚙️ Gestão do Clube</button>
        ) : !pedirPin ? (
          <button style={{ ...btnFantasma(), color: C.mut, fontSize: 11, opacity: 0.6 }} onClick={() => setPedirPin(true)}>gestão do clube</button>
        ) : (
          <div style={{ display: "flex", gap: 8, maxWidth: 300, margin: "0 auto" }}>
            <input style={{ ...inputStyle(), flex: 1 }} type="password" placeholder="PIN da gestão" value={pin}
              onChange={(e) => setPin(e.target.value)} />
            <button style={{ ...btnPrimario(), width: "auto", padding: "10px 16px" }} onClick={async () => {
              const ok = await liberarGestor(pin);
              if (ok) { setPedirPin(false); setPin(""); avisar("🔓 Gestão do Clube liberada neste aparelho."); irCadastro(); }
              else avisar("PIN incorreto.");
            }}>OK</button>
          </div>
        )}
      </div>
      </>}
    </>
  );
}

// ---------- Gestão do Clube (terceirizado — só o PIN de gestão entra) ----------
function CadastroClube({ clube, salvarClube, removerParceiro, lancarCampanha, metricas = { parceiros: {} }, acesso = { ver: true, valores: true, editar: true, campanha: true, pagamentos: true }, voltar }) {
  const vazio = { id: null, nome: "", categoria: "", endereco: "", site: "", documento: "", unidade: "", beneficio: "", codigo: "", plus: false, logo: null, mensalidade: "", cobrancaLink: "", pagoAte: "", acoes: [] };
  const hoje = todayStr();
  const [form, setForm] = useState(null); // null = lista; objeto = editando/criando
  const fileRef = useRef(null);
  const parceiros = [...(clube.parceiros || [])].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  const salvar = () => {
    if (!form.nome.trim() || !form.codigo.trim() || !form.unidade) return;
    const f = { ...form, nome: form.nome.trim(), codigo: form.codigo.trim().toUpperCase() };
    delete f.novaAcao; delete f.campanhaTxt;
    salvarClube((c) => {
      if (!c.parceiros) c.parceiros = [];
      if (f.id) {
        const i = c.parceiros.findIndex((p) => p.id === f.id);
        if (i >= 0) c.parceiros[i] = { ...c.parceiros[i], ...f };
      } else {
        c.parceiros.push({ ...f, id: `pc-${Date.now()}`, vouchers: [] });
      }
    }, f.id ? "💾 Parceiro atualizado!" : "🏪 Parceiro cadastrado!");
    setForm(null);
  };

  return (
    <>
      <CabecalhoTela titulo="GESTÃO DO CLUBE" sub="Espaço da gestão terceirizada: cadastro, cobrança e vigência dos parceiros. Cada parceiro recebe um código de acesso para gerenciar os próprios vouchers (tela de login → 🏪 Acesso parceiro). Parceiro com mensalidade vencida sai da vitrine automaticamente." voltar={voltar} />
      {!form ? (
        <>
          <button style={{ ...btnPrimario(), marginBottom: 12 }} onClick={() => setForm({ ...vazio })}>+ NOVO PARCEIRO</button>
          <div style={{ display: "grid", gap: 8 }}>
            {parceiros.map((p) => (
              <Painel key={p.id} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                {p.logo
                  ? <img src={p.logo} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                  : <div style={{ width: 40, height: 40, borderRadius: 8, background: C.panelSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>🏪</div>}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>{p.nome} {p.plus && <span style={{ color: C.oak, fontSize: 11 }}>⭐</span>}</div>
                  <div style={{ color: C.mut, fontSize: 11.5 }}>{p.categoria} · código <b style={{ color: C.tealSoft }}>{p.codigo}</b> · {(p.vouchers || []).length} voucher(s) · 👁 {((metricas.parceiros || {})[p.id] || {}).aberturas || 0} aberturas</div>
                  <div style={{ fontSize: 11.5, marginTop: 3 }}>
                    {p.mensalidade && <span style={{ color: C.mut }}>R$ {p.mensalidade}/mês · </span>}
                    {!p.pagoAte
                      ? <span style={{ color: C.mut }}>sem controle de vigência</span>
                      : p.pagoAte >= hoje
                        ? <span style={{ color: C.ok, fontWeight: 700 }}>✔ em dia até {fmtBR(p.pagoAte)}</span>
                        : <span style={{ color: "#E08585", fontWeight: 700 }}>✖ vencido em {fmtBR(p.pagoAte)} — fora da vitrine</span>}
                  </div>
                  <button style={{ ...btnFantasma(), fontSize: 11.5, padding: "4px 0" }} onClick={(ev) => {
                    ev.stopPropagation();
                    salvarClube((c) => {
                      const px = c.parceiros.find((x) => x.id === p.id);
                      if (px) {
                        const base = px.pagoAte && px.pagoAte >= hoje ? toDate(px.pagoAte) : toDate(hoje);
                        base.setDate(base.getDate() + 30);
                        px.pagoAte = base.toISOString().slice(0, 10);
                      }
                    }, "💰 Recebimento registrado: +30 dias de vigência.");
                  }}>💰 Registrar recebimento (+30 dias)</button>
                </div>
                <button style={{ ...btnFantasma(), fontSize: 12 }} onClick={() => setForm({ id: p.id, nome: p.nome, categoria: p.categoria || "", endereco: p.endereco || "", site: p.site || "", documento: p.documento || "", unidade: p.unidade || "", beneficio: p.beneficio || "", codigo: p.codigo || "", plus: !!p.plus, logo: p.logo || null, mensalidade: p.mensalidade || "", cobrancaLink: p.cobrancaLink || "", pagoAte: p.pagoAte || "", acoes: p.acoes || [] })}>✏️</button>
                <button style={{ background: "transparent", border: "none", color: C.mut, cursor: "pointer" }} onClick={() => removerParceiro(p.id)}>🗑</button>
              </Painel>
            ))}
            {parceiros.length === 0 && <Painel><div style={{ color: C.mut, fontSize: 13, textAlign: "center" }}>Nenhum parceiro ainda — cadastra o primeiro! 🏪</div></Painel>}
          </div>
        </>
      ) : (
        <Painel style={{ display: "grid", gap: 10 }}>
          <div style={{ fontWeight: 800, color: C.oak, fontSize: 14 }}>{form.id ? "✏️ Editar parceiro" : "🏪 Novo parceiro"}</div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {form.logo
              ? <img src={form.logo} alt="" style={{ width: 56, height: 56, borderRadius: 10, objectFit: "cover" }} />
              : <div style={{ width: 56, height: 56, borderRadius: 10, background: C.panelSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🏪</div>}
            <button style={{ ...btnFantasma(), border: `1px solid ${C.line}`, borderRadius: 10, padding: "8px 12px" }}
              onClick={() => fileRef.current && fileRef.current.click()}>
              📷 {form.logo ? "Trocar logo/foto" : "Adicionar logo/foto"}
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
              onChange={(e) => lerImagem(e.target.files && e.target.files[0], (d) => setForm({ ...form, logo: d }), 360)} />
          </div>
          <input style={inputStyle()} placeholder="Nome da empresa" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          <div>
            <div style={{ color: C.oak, fontSize: 11.5, fontWeight: 800, letterSpacing: 0.4, marginBottom: 6 }}>CATEGORIA</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {CATEGORIAS_CLUBE.map((cat) => (
                <button key={cat} onClick={() => setForm({ ...form, categoria: cat })} style={{
                  background: form.categoria === cat ? C.teal : C.panelSoft,
                  color: form.categoria === cat ? "#F2F2F2" : C.mut,
                  border: `1px solid ${form.categoria === cat ? C.teal : C.line}`,
                  borderRadius: 14, padding: "5px 11px", cursor: "pointer",
                  fontSize: 11.5, fontWeight: 700, fontFamily: "inherit",
                }}>{cat}</button>
              ))}
            </div>
          </div>
          <input style={inputStyle()} placeholder="Endereço físico (opcional)" value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} />
          <input style={inputStyle()} placeholder="Site ou Instagram (opcional)" value={form.site} onChange={(e) => setForm({ ...form, site: e.target.value })} />
          <input style={inputStyle()} placeholder="CNPJ ou CPF" value={form.documento} onChange={(e) => setForm({ ...form, documento: e.target.value })} />
          <div style={{ color: C.oak, fontSize: 11.5, fontWeight: 800, letterSpacing: 0.4, marginBottom: -4 }}>VINCULADO A QUAL UNIDADE</div>
          <select value={form.unidade} onChange={(e) => setForm({ ...form, unidade: e.target.value })}
            style={{ ...inputStyle(), appearance: "auto", color: form.unidade ? C.cream : C.mut }}>
            <option value="" disabled>Vinculado a qual unidade…</option>
            <option value="prudente">Spincycle Prudente</option>
            <option value="global">🌍 Global — todas as unidades</option>
          </select>
          <input style={inputStyle()} placeholder="Benefício fixo do clube (ex.: 10% off todo dia)" value={form.beneficio} onChange={(e) => setForm({ ...form, beneficio: e.target.value })} />
          <input style={inputStyle()} placeholder="Código de acesso do parceiro (ex.: ACAI2026)" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })} />
          <label style={{ display: "flex", gap: 8, alignItems: "center", color: C.oak, fontSize: 13, cursor: "pointer" }}>
            <input type="checkbox" checked={form.plus} onChange={(e) => setForm({ ...form, plus: e.target.checked })} />
            ⭐ Patrocinador Plus (fica fixado no topo do Clube)
          </label>
          {acesso.valores && <>
          <div style={{ display: "flex", gap: 8 }}>
            <input style={{ ...inputStyle(), flex: 1 }} placeholder="Mensalidade R$ (ex.: 99)" value={form.mensalidade} onChange={(e) => setForm({ ...form, mensalidade: e.target.value.replace(/[^0-9,]/g, "") })} />
            <div style={{ flex: 1.4 }}>
              <input style={inputStyle()} type="date" value={form.pagoAte} onChange={(e) => setForm({ ...form, pagoAte: e.target.value })} title="Pago até" />
            </div>
          </div>
          <input style={inputStyle()} placeholder="Link de cobrança (Pix/assinatura — Mercado Pago, InfinitePay…)" value={form.cobrancaLink} onChange={(e) => setForm({ ...form, cobrancaLink: e.target.value })} />
          <div style={{ color: C.mut, fontSize: 11, lineHeight: 1.5 }}>
            "Pago até" controla a vigência: vencido = parceiro some da vitrine (o cadastro fica guardado). O link de cobrança aparece no painel do parceiro para ele pagar a renovação.
          </div>
          </>}

          <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 10 }}>
            <div style={{ color: C.oak, fontWeight: 800, fontSize: 12.5, letterSpacing: 0.5, marginBottom: 6 }}>🏷️ AÇÕES PERMANENTES</div>
            <div style={{ color: C.mut, fontSize: 11, lineHeight: 1.5, marginBottom: 8 }}>
              Promoções por tempo indeterminado que aparecem no cartão do parceiro no Clube (ex.: 50% de desconto, Leve 1 receba 2, produto específico).
            </div>
            {(form.acoes || []).map((a) => (
              <div key={a.id} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                <span style={{ flex: 1, fontSize: 12.5, background: C.panelSoft, border: `1px solid ${C.line}`, borderRadius: 8, padding: "7px 10px" }}>🏷️ {a.titulo}</span>
                <button onClick={() => setForm({ ...form, acoes: form.acoes.filter((x) => x.id !== a.id) })}
                  style={{ background: "transparent", border: "none", color: C.mut, cursor: "pointer" }}>✕</button>
              </div>
            ))}
            <div style={{ display: "flex", gap: 6 }}>
              <input style={{ ...inputStyle(), flex: 1 }} placeholder="Nova ação (ex.: Leve 1 receba 2)" value={form.novaAcao || ""}
                onChange={(e) => setForm({ ...form, novaAcao: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (form.novaAcao || "").trim()) {
                    setForm({ ...form, acoes: [...(form.acoes || []), { id: `ac-${Date.now()}`, titulo: form.novaAcao.trim() }], novaAcao: "" });
                  }
                }} />
              <button onClick={() => {
                if (!(form.novaAcao || "").trim()) return;
                setForm({ ...form, acoes: [...(form.acoes || []), { id: `ac-${Date.now()}`, titulo: form.novaAcao.trim() }], novaAcao: "" });
              }} style={{ ...btnPrimario(), width: "auto", padding: "9px 14px" }}>+</button>
            </div>
          </div>

          {form.id && acesso.campanha && (
            <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 10 }}>
              <div style={{ color: C.oak, fontWeight: 800, fontSize: 12.5, letterSpacing: 0.5, marginBottom: 6 }}>📣 CAMPANHA NO MURAL (paga)</div>
              <div style={{ color: C.mut, fontSize: 11, lineHeight: 1.5, marginBottom: 8 }}>
                Escreva a chamada e publique — ela entra no feed da comunidade entre as mensagens do Radar, com a marca do parceiro. Combine o valor com o parceiro antes de ativar.
              </div>
              <textarea style={{ ...inputStyle(), minHeight: 70, resize: "vertical" }} maxLength={200}
                placeholder={'Ex.: "Deu a loka no ' + form.nome + '! Compre um açaí de 500ml e leve um quilo pra casa."'}
                value={form.campanhaTxt || ""} onChange={(e) => setForm({ ...form, campanhaTxt: e.target.value })} />
              <input style={{ ...inputStyle(), marginTop: 8 }} placeholder="Valor combinado desta chamada — R$ (ex.: 150)"
                value={form.campanhaValor || ""} onChange={(e) => setForm({ ...form, campanhaValor: e.target.value.replace(/[^0-9,]/g, "") })} />
              <button onClick={() => {
                if (!(form.campanhaTxt || "").trim()) return;
                lancarCampanha(form.id, form.nome, form.logo, form.campanhaTxt.trim(), (form.campanhaValor || "").trim());
                setForm({ ...form, campanhaTxt: "", campanhaValor: "" });
              }} style={{ ...btnPrimario(), marginTop: 8, opacity: (form.campanhaTxt || "").trim() ? 1 : 0.5 }}>
                📣 PUBLICAR CAMPANHA NO MURAL
              </button>
              {(() => {
                const px = (clube.parceiros || []).find((x) => x.id === form.id);
                const hist = (px && px.campanhas) || [];
                if (!hist.length) return null;
                const total = hist.reduce((s, c) => s + (parseFloat(String(c.valor || "0").replace(",", ".")) || 0), 0);
                return (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ color: C.oak, fontSize: 11.5, fontWeight: 800, letterSpacing: 0.4, marginBottom: 6 }}>
                      CHAMADAS JÁ FEITAS · {hist.length} {total > 0 ? `· R$ ${total.toFixed(2).replace(".", ",")}` : ""}
                    </div>
                    <div style={{ display: "grid", gap: 6 }}>
                      {[...hist].reverse().map((c) => (
                        <div key={c.id} style={{ background: C.panelSoft, border: `1px solid ${C.line}`, borderRadius: 8, padding: "8px 10px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                            <span style={{ color: C.oak, fontSize: 10.5, fontWeight: 700 }}>{agoLabel(c.ts)}</span>
                            {c.valor && <span style={{ color: C.ok, fontSize: 10.5, fontWeight: 800 }}>R$ {c.valor}</span>}
                          </div>
                          <div style={{ fontSize: 12, lineHeight: 1.4, marginTop: 2 }}>{c.texto}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ ...btnFantasma(), flex: 1, color: C.mut }} onClick={() => setForm(null)}>Cancelar</button>
            <button style={{ ...btnPrimario(), flex: 1, opacity: acesso.editar && form.nome.trim() && form.codigo.trim() && form.unidade ? 1 : 0.4 }}
              onClick={() => acesso.editar && salvar()}>{acesso.editar ? "SALVAR" : "SOMENTE LEITURA"}</button>
          </div>
        </Painel>
      )}
    </>
  );
}

// ---------- Painel do parceiro ----------
function PainelParceiro({ p, salvarClube, sair, avisar }) {
  const [novoV, setNovoV] = useState(null); // { titulo, desc }
  if (!p) {
    return (
      <div style={{ textAlign: "center", paddingTop: 80 }}>
        <div style={{ fontSize: 36 }}>🏪</div>
        <div style={{ color: C.mut, fontSize: 13, marginTop: 10 }}>Parceiro não encontrado — o cadastro pode ter sido removido.</div>
        <button style={{ ...btnPrimario(), maxWidth: 240, margin: "20px auto 0" }} onClick={sair}>SAIR</button>
      </div>
    );
  }
  const slug = norm(p.nome).split(" ")[0].toUpperCase();
  return (
    <>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 8, marginBottom: 4 }}>
        {p.logo
          ? <img src={p.logo} alt="" style={{ width: 56, height: 56, borderRadius: 10, objectFit: "cover" }} />
          : <div style={{ width: 56, height: 56, borderRadius: 10, background: C.panelSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🏪</div>}
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 17 }}>{p.nome}</div>
          <div style={{ color: C.oak, fontSize: 12 }}>Painel do parceiro · Clube Spincycle {p.plus ? "· ⭐ Plus" : ""}</div>
        </div>
      </div>
      <div style={{ color: C.mut, fontSize: 12.5, lineHeight: 1.5, margin: "10px 0 12px" }}>
        Seus vouchers aparecem para todos os alunos no Clube. No balcão, aceite só o app aberto: confira o nome do aluno e o relógio correndo abaixo do QR — print de tela não vale.
      </div>
      {p.pagoAte && (
        <Painel style={{ marginBottom: 14, border: `1px solid ${p.pagoAte >= todayStr() ? C.line : "#E08585"}` }}>
          <div style={{ fontSize: 12.5 }}>
            {p.pagoAte >= todayStr()
              ? <span style={{ color: C.ok, fontWeight: 700 }}>✔ Assinatura em dia até {fmtBR(p.pagoAte)}</span>
              : <span style={{ color: "#E08585", fontWeight: 700 }}>✖ Assinatura vencida em {fmtBR(p.pagoAte)} — sua vitrine está pausada</span>}
          </div>
          {p.cobrancaLink && (
            <a href={p.cobrancaLink} target="_blank" rel="noreferrer" style={{ ...btnFantasma(), display: "inline-block", padding: "6px 0", textDecoration: "none" }}>
              💳 Pagar / renovar assinatura →
            </a>
          )}
        </Painel>
      )}

      <div style={{ color: C.oak, fontWeight: 800, fontSize: 13, letterSpacing: 1, marginBottom: 8 }}>🎟️ MEUS VOUCHERS</div>
      <div style={{ display: "grid", gap: 10 }}>
        {(p.vouchers || []).map((v) => (
          <Painel key={v.id}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <div style={{ fontWeight: 800, fontSize: 14 }}>{v.titulo}</div>
              <button style={{ background: "transparent", border: "none", color: C.mut, cursor: "pointer" }}
                onClick={() => salvarClube((c) => {
                  const px = c.parceiros.find((x) => x.id === p.id);
                  if (px) px.vouchers = (px.vouchers || []).filter((x) => x.id !== v.id);
                }, "🗑 Voucher removido.")}>🗑</button>
            </div>
            {v.desc && <div style={{ color: C.mut, fontSize: 12.5, marginTop: 3 }}>{v.desc}</div>}
            <div style={{ textAlign: "center", marginTop: 12 }}><QRCard codigo={v.codigo} size={140} /></div>
          </Painel>
        ))}
        {(p.vouchers || []).length === 0 && <Painel><div style={{ color: C.mut, fontSize: 13, textAlign: "center" }}>Nenhum voucher publicado ainda.</div></Painel>}
      </div>

      {!novoV ? (
        <button style={{ ...btnPrimario(), marginTop: 14 }} onClick={() => setNovoV({ titulo: "", desc: "" })}>+ NOVO VOUCHER</button>
      ) : (
        <Painel style={{ display: "grid", gap: 10, marginTop: 14 }}>
          <input style={inputStyle()} placeholder="Título (ex.: 10% off em qualquer copo)" value={novoV.titulo} onChange={(e) => setNovoV({ ...novoV, titulo: e.target.value })} />
          <input style={inputStyle()} placeholder="Regras/observações (opcional)" value={novoV.desc} onChange={(e) => setNovoV({ ...novoV, desc: e.target.value })} />
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ ...btnFantasma(), flex: 1, color: C.mut }} onClick={() => setNovoV(null)}>Cancelar</button>
            <button style={{ ...btnPrimario(), flex: 1, opacity: novoV.titulo.trim() ? 1 : 0.5 }} onClick={() => {
              if (!novoV.titulo.trim()) return;
              const cod = `SPIN-${slug}-${String(Date.now()).slice(-4)}`;
              salvarClube((c) => {
                const px = c.parceiros.find((x) => x.id === p.id);
                if (px) {
                  if (!px.vouchers) px.vouchers = [];
                  px.vouchers.push({ id: `v-${Date.now()}`, titulo: novoV.titulo.trim(), desc: novoV.desc.trim(), codigo: cod });
                }
              }, "🎟️ Voucher publicado com QR novo!");
              setNovoV(null);
            }}>PUBLICAR</button>
          </div>
        </Painel>
      )}

      <div style={{ color: C.mut, fontSize: 10.5, textAlign: "center", marginTop: 18, lineHeight: 1.55 }}>
        {AVISO_CLUBE} Dúvidas sobre contrato, cobrança e vigência: fale com a gestão.
      </div>
      <button onClick={sair} style={{ ...btnFantasma(), width: "100%", marginTop: 16, color: "#E08585", border: `1px solid ${C.line}`, borderRadius: 10, padding: "12px" }}>
        Sair do painel do parceiro
      </button>
    </>
  );
}

// ---------- Instantes (fotos da comunidade que somem em 24h) ----------
function TelaInstantes({ instantes, minhaChave, admin, postar, apagar, renderPost, voltar }) {
  const [texto, setTexto] = useState("");
  const [foto, setFoto] = useState(null);
  const fileRef = useRef(null);
  const enviar = () => {
    if (!foto) return;
    postar(texto, foto);
    setTexto(""); setFoto(null);
  };
  return (
    <>
      <CabecalhoTela titulo="INSTANTES ⚡"
        sub={`As fotos da comunidade AGORA — todas somem sozinhas em ${INSTANTE_HORAS}h. Pode reagir e responder!`}
        voltar={voltar} />
      <Painel style={{ display: "grid", gap: 8, marginBottom: 14 }}>
        {foto
          ? <img src={foto} alt="" style={{ width: "100%", borderRadius: 10 }} />
          : (
            <button onClick={() => fileRef.current && fileRef.current.click()} style={{
              border: `1.5px dashed ${C.oak}77`, borderRadius: 10, background: "transparent",
              color: C.oak, fontWeight: 800, fontSize: 13, padding: "22px 0", cursor: "pointer", fontFamily: "inherit",
            }}>📸 Postar um instante</button>
          )}
        {foto && (
          <>
            <input style={inputStyle()} maxLength={120} placeholder="Legenda (opcional)…"
              value={texto} onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") enviar(); }} />
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ ...btnFantasma(), flex: 1, color: C.mut }} onClick={() => { setFoto(null); setTexto(""); }}>Cancelar</button>
              <button style={{ ...btnPrimario(), flex: 2 }} onClick={enviar}>⚡ PUBLICAR ({INSTANTE_HORAS}h no ar)</button>
            </div>
          </>
        )}
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
          onChange={(e) => lerImagem(e.target.files && e.target.files[0], setFoto)} />
      </Painel>
      <div style={{ display: "grid", gap: 4 }}>
        {instantes.map((x) => {
          const h = Math.max(0, INSTANTE_HORAS - (Date.now() - x.ts) / 3600000);
          return renderPost(x, {
            extraInfo: h >= 1 ? `⏳ resta ${Math.floor(h)}h no ar` : `⏳ resta ${Math.max(1, Math.round(h * 60))}min no ar`,
            onApagar: (admin || x.autorChave === minhaChave) ? () => apagar(x.id) : null,
          });
        })}
        {instantes.length === 0 && (
          <Painel><div style={{ color: C.mut, fontSize: 13, textAlign: "center", lineHeight: 1.6 }}>
            Nenhum instante no ar agora. ⚡<br />Posta a primeira foto — daqui a {INSTANTE_HORAS}h ela já era.
          </div></Painel>
        )}
      </div>
    </>
  );
}

// ---------- Página pública do aluno (estilo perfil de rede social) ----------
function TelaPerfilAluno({ track, sid, allData, perfis, fotos, muralVisivel, feedRadar, ehMeu, torcida, torcer, minhaChave, recados, deixarRecado, apagarRecado, admin, avisar, irEditar, renderPost, voltar }) {
  const [novoRec, setNovoRec] = useState("");
  const chave = `${track}:${sid}`;
  const trilha = TRACKS.find((t) => t.id === track);
  const aluno = (((allData[track] || {}).students) || []).find((s) => s.id === sid);
  const perfil = perfis[chave] || {};
  const foto = fotos[chave];
  if (!aluno) {
    return (
      <>
        <CabecalhoTela titulo="PERFIL" voltar={voltar} />
        <Painel><div style={{ color: C.mut, fontSize: 13, textAlign: "center" }}>Aluno não encontrado.</div></Painel>
      </>
    );
  }
  const desde = (aluno.records || []).reduce((m, r) => (r.reg && (!m || r.reg < m) ? r.reg : m), 0);
  const prog = trilha ? computeProgress(aluno, trilha.targets) : null;
  const participa = (aluno.records || []).length > 0 || (aluno.guests || []).length > 0;
  const torcedores = torcida[chave] || [];
  const euTorco = torcedores.includes(minhaChave);

  // Carimbos: as missões cumpridas + conquistas especiais
  const carimbos = calcularCarimbos(prog);
  // Últimas: o que falaram dele (Radar) + o que ele escreveu, em ordem
  const meusPosts = muralVisivel.filter((p) => p.autorChave === chave);
  const sobreEle = feedRadar.filter((e) => e.sid === sid && e.track === track);
  const ultimas = [...meusPosts, ...sobreEle].sort((a, b) => b.ts - a.ts).slice(0, 20);
  const meusRecados = (recados[chave] || []);
  const enviarRec = () => { if (!novoRec.trim()) return; deixarRecado(chave, novoRec); setNovoRec(""); };

  return (
    <>
      <button style={{ ...btnFantasma(), padding: "4px 0", color: C.mut }} onClick={voltar}>‹ Início</button>

      {/* Cabeçalho no formato da home: foto à esquerda, nome + bio à direita */}
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginTop: 8 }}>
        <Avatar foto={foto} nome={aluno.name} size={92} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: 0.5, textTransform: "uppercase", lineHeight: 1.15 }}>
              {aluno.name}
            </span>
            {ehMeu ? (
              <button onClick={irEditar} style={{
                ...btnFantasma(), border: `1px solid ${C.line}`, borderRadius: 8,
                padding: "4px 10px", fontSize: 11, flexShrink: 0,
              }}>✏️ Editar</button>
            ) : (
              <button onClick={() => torcer(chave)} style={{
                background: euTorco ? C.panelSoft : C.teal,
                color: euTorco ? C.tealSoft : "#F2F2F2",
                border: euTorco ? `1px solid ${C.tealSoft}` : "none",
                borderRadius: 8, padding: "5px 12px", fontWeight: 800, fontSize: 11.5,
                cursor: "pointer", fontFamily: "inherit", letterSpacing: 0.4, flexShrink: 0,
              }}>{euTorco ? "📣 TORCENDO ✓" : "📣 TORCER"}</button>
            )}
          </div>
          {perfil.bio && <div style={{ color: C.mut, fontSize: 13.5, marginTop: 6, lineHeight: 1.4 }}>{perfil.bio}</div>}
        </div>
      </div>

      {desde ? (
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 16, color: C.oak, fontSize: 13 }}>
          <span>📅</span>
          <span>
            Aluna(o) da {UNIDADE_NOME} desde{" "}
            <b style={{ color: C.cream }}>{fmtLongBR(new Date(desde).toISOString().slice(0, 10))}</b>
          </span>
        </div>
      ) : null}
      {(torcedores.length > 0 || perfil.instagram) && (
        <div style={{ display: "flex", gap: 12, marginTop: 6, flexWrap: "wrap" }}>
          {torcedores.length > 0 && (
            <span style={{ color: C.tealSoft, fontSize: 12, fontWeight: 700 }}>
              📣 {torcedores.length} na torcida{ehMeu ? " · sua!" : ""}
            </span>
          )}
          {perfil.instagram && (
            <a href={`https://instagram.com/${perfil.instagram}`} target="_blank" rel="noreferrer"
              style={{ color: C.tealSoft, fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
              @{perfil.instagram}
            </a>
          )}
        </div>
      )}

      {/* Na Arena: quadrados lado a lado, como os atalhos da home */}
      <div style={{ color: C.oak, fontWeight: 800, fontSize: 12.5, letterSpacing: 1, margin: "18px 0 8px" }}>🏟️ NA ARENA</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {participa && prog ? (
          <Painel style={{ textAlign: "center", padding: "16px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
            <Ic nome="urso" size={30} stroke={1.4} style={{ color: C.oak }} />
            <div style={{ fontWeight: 800, fontSize: 10.5, letterSpacing: 0.4, lineHeight: 1.3 }}>DESAFIO DAS MISSÕES</div>
            <div style={{ color: C.mut, fontSize: 10.5, lineHeight: 1.4 }}>
              <b style={{ color: C.oak }}>{prog.doneCount}/9</b> · {prog.p.maratona || 0} aulas
              {prog.linesDone.length > 0 && <><br />🏆 {prog.linesDone.length} linha(s)</>}
            </div>
            <span style={{ color: C.ok, fontSize: 9, fontWeight: 800, border: `1px solid ${C.ok}66`, borderRadius: 6, padding: "1px 6px", letterSpacing: 0.4 }}>EM ANDAMENTO</span>
          </Painel>
        ) : (
          <Painel style={{ textAlign: "center", padding: "16px 8px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, opacity: 0.6 }}>
            <div style={{ color: C.mut, fontSize: 11, lineHeight: 1.4 }}>Ainda fora dos desafios 🚴</div>
          </Painel>
        )}
      </div>

      {/* Carimbos estilo passaporte */}
      {carimbos.length > 0 && (
        <>
          <div style={{ color: C.oak, fontWeight: 800, fontSize: 12.5, letterSpacing: 1, margin: "18px 0 8px" }}>🎖️ CARIMBOS</div>
          <CarimbosPassaporte carimbos={carimbos} sid={sid} avisar={avisar} />
        </>
      )}

      {/* Últimas: o que falaram dele + o que ele escreveu */}
      <div style={{ color: C.oak, fontWeight: 800, fontSize: 12.5, letterSpacing: 1, margin: "18px 0 8px" }}>💬 ÚLTIMAS D{aluno.name.trim().toLowerCase().endsWith("a") ? "A" : "O"} {firstName(aluno.name).toUpperCase()}</div>
      <div style={{ display: "grid", gap: 4 }}>
        {ultimas.map((e) => renderPost(e))}
        {ultimas.length === 0 && (
          <Painel><div style={{ color: C.mut, fontSize: 13, textAlign: "center" }}>
            Nada por aqui ainda — frases e conquistas aparecem nessa linha do tempo. 🐻
          </div></Painel>
        )}
      </div>

      {/* Recados de quem visita */}
      <div style={{ color: C.oak, fontWeight: 800, fontSize: 12.5, letterSpacing: 1, margin: "18px 0 8px" }}>📮 RECADOS</div>
      <Painel style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        <input style={{ ...inputStyle(), flex: 1 }} maxLength={200}
          placeholder={ehMeu ? "Escreve no seu próprio mural…" : `Deixa um recado pra ${firstName(aluno.name)}…`}
          value={novoRec} onChange={(e) => setNovoRec(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") enviarRec(); }} />
        <button onClick={enviarRec} style={{ ...btnPrimario(), width: "auto", padding: "10px 16px", opacity: novoRec.trim() ? 1 : 0.5 }}>➤</button>
      </Painel>
      <div style={{ display: "grid", gap: 6 }}>
        {meusRecados.map((r) => (
          <Painel key={r.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <Avatar foto={fotos[r.autorChave]} nome={r.autorNome} size={28} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontWeight: 700, fontSize: 12 }}>{r.autorNome}</span>
              <span style={{ color: C.oak, fontSize: 10.5, marginLeft: 6 }}>{agoLabel(r.ts)}</span>
              <div style={{ fontSize: 13, lineHeight: 1.4, marginTop: 1 }}>{r.texto}</div>
            </div>
            {(admin || ehMeu || r.autorChave === minhaChave) && (
              <button onClick={() => apagarRecado(chave, r.id)} style={{ background: "transparent", border: "none", color: C.mut, cursor: "pointer", fontSize: 11, padding: 0 }}>🗑</button>
            )}
          </Painel>
        ))}
        {meusRecados.length === 0 && (
          <div style={{ color: C.mut, fontSize: 12.5, textAlign: "center" }}>Nenhum recado ainda — seja a primeira pessoa a deixar um. 📮</div>
        )}
      </div>
    </>
  );
}

// ---------- Painel da Comunidade (só a adm vê) ----------
function BarraGraf({ rotulo, valor, max, sufixo = "", cor }) {
  const pct = max > 0 ? Math.max(3, Math.round((valor / max) * 100)) : 0;
  return (
    <div style={{ display: "grid", gap: 3 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5 }}>
        <span style={{ color: C.cream }}>{rotulo}</span>
        <span style={{ color: C.oak, fontWeight: 800 }}>{valor}{sufixo}</span>
      </div>
      <div style={{ height: 8, background: C.panelSoft, borderRadius: 6, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: cor || C.tealSoft, borderRadius: 6 }} />
      </div>
    </div>
  );
}

function TelaPainelAdm({ metricas, clube, fotos, allData, muralAlunos, reacts, comentarios, abrirPerfilAluno, profundo, presenca = {}, irAdmins, voltar }) {
  const [ordem, setOrdem] = useState("recentes"); // recentes | az | ativos
  const [verTodosAlunos, setVerTodosAlunos] = useState(false);
  const dia = 86400000;
  const alunos = Object.entries(metricas.alunos || {}).map(([chave, a]) => ({ chave, ...a }));
  const hoje = alunos.filter((a) => Date.now() - (a.ultima || 0) < dia).length;
  const semana = alunos.filter((a) => Date.now() - (a.ultima || 0) < 7 * dia).length;

  // Quem participa de desafio (tem registro na cartela)
  const participantes = new Set();
  TRACKS.forEach((t) => (((allData[t.id] || {}).students) || []).forEach((s) => {
    if ((s.records || []).length > 0 || (s.guests || []).length > 0) participantes.add(`${t.id}:${s.id}`);
  }));
  const media = (arr) => arr.length ? Math.round(arr.reduce((s, x) => s + x, 0) / arr.length) : 0;
  const minDesafio = media(alunos.filter((a) => participantes.has(a.chave)).map((a) => a.min || 0));
  const minFora = media(alunos.filter((a) => !participantes.has(a.chave)).map((a) => a.min || 0));

  // Clube por categoria (aberturas e favoritos somados por setor)
  const porCategoria = {};
  (clube.parceiros || []).forEach((p) => {
    const m = (metricas.parceiros || {})[p.id] || {};
    const cat = p.categoria || "Outros";
    if (!porCategoria[cat]) porCategoria[cat] = { aberturas: 0, favoritos: 0 };
    porCategoria[cat].aberturas += m.aberturas || 0;
    porCategoria[cat].favoritos += m.favoritos || 0;
  });
  const categorias = Object.entries(porCategoria)
    .filter(([, v]) => v.aberturas > 0 || v.favoritos > 0)
    .sort((a, b) => b[1].aberturas - a[1].aberturas);
  const maxCat = Math.max(1, ...categorias.map(([, v]) => v.aberturas));

  // Parceiros: aberturas (QR na tela) + favoritados
  const parceiros = Object.entries(metricas.parceiros || {})
    .map(([pid, m]) => ({
      pid, aberturas: m.aberturas || 0, favoritos: m.favoritos || 0,
      nome: ((clube.parceiros || []).find((p) => p.id === pid) || {}).nome || pid,
    }))
    .sort((a, b) => b.aberturas - a.aberturas).slice(0, 6);

  // Campanhas no feed: engajamento (assertividade)
  const campanhas = (muralAlunos || []).filter((p) => p.tipo === "campanha").map((p) => {
    const rx = reacts[p.id] || {};
    const nReacoes = Object.values(rx).reduce((s, arr) => s + (arr ? arr.length : 0), 0);
    const nResp = (comentarios[p.id] || []).length;
    return { ...p, nReacoes, nResp };
  }).sort((a, b) => b.ts - a.ts).slice(0, 5);

  const listaAlunos = [...alunos].sort((a, b) => {
    if (ordem === "az") return (a.nome || "").localeCompare(b.nome || "", "pt-BR");
    if (ordem === "ativos") return ((b.min || 0) + (b.entradas || 0) * 2) - ((a.min || 0) + (a.entradas || 0) * 2);
    return (b.ultima || 0) - (a.ultima || 0);
  });
  const resumoTelas = (t) => Object.entries(t || {}).sort((a, b) => b[1] - a[1]).slice(0, 3)
    .map(([k, v]) => `${k} ${v}×`).join(" · ");

  return (
    <>
      <CabecalhoTela titulo={`PAINEL · ${UNIDADE_NOME.toUpperCase()}`}
        sub="Visão da administração desta unidade — cada Spincycle terá o seu painel, separado. Números aproximados, atualizados a cada ~2 minutos de uso."
        voltar={voltar} />

      {profundo && (() => {
        const online = Object.values(presenca).filter((ts) => Date.now() - ts < 3 * 60000).length;
        return (
          <Painel style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, border: `1px solid ${C.ok}55` }}>
            <span style={{ fontSize: 12.5, fontWeight: 800 }}>
              <span style={{ color: C.ok }}>🟢 ONLINE AGORA</span>
              <span style={{ color: C.mut, fontWeight: 700 }}> · {UNIDADE_NOME}: </span>{online}
              <span style={{ color: C.mut, fontWeight: 700 }}> · Global (todas): </span>{online}
            </span>
          </Painel>
        );
      })()}
      {profundo && irAdmins && (
        <button onClick={irAdmins} style={{ ...btnFantasma(), width: "100%", border: `1px solid ${C.line}`, borderRadius: 10, padding: "10px", marginBottom: 14, color: C.oak, fontWeight: 800, fontSize: 12 }}>
          👤 TODOS OS CADASTROS · PERMISSÕES ›
        </button>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
        {[["HOJE", hoje], ["7 DIAS", semana], ["COM REGISTRO", alunos.length]].map(([r, n]) => (
          <Painel key={r} style={{ textAlign: "center", padding: "14px 6px" }}>
            <div style={{ color: C.tealSoft, fontWeight: 800, fontSize: 20 }}>{n}</div>
            <div style={{ color: C.mut, fontSize: 10, fontWeight: 700, letterSpacing: 0.5, marginTop: 3 }}>{r}</div>
          </Painel>
        ))}
      </div>

      {/* Desafio × tempo no app */}
      {profundo && <>
      <div style={{ color: C.oak, fontWeight: 800, fontSize: 12.5, letterSpacing: 1, marginBottom: 8 }}>🏟️ DESAFIO × TEMPO NO APP</div>
      <Painel style={{ display: "grid", gap: 10, marginBottom: 16 }}>
        <BarraGraf rotulo="Quem está em desafio" valor={minDesafio} max={Math.max(minDesafio, minFora)} sufixo=" min (média)" cor={C.tealSoft} />
        <BarraGraf rotulo="Quem está fora" valor={minFora} max={Math.max(minDesafio, minFora)} sufixo=" min (média)" cor={`${C.mut}`} />
        <div style={{ color: C.mut, fontSize: 10.5, lineHeight: 1.5 }}>
          Tempo médio acumulado no app por pessoa. Diferença grande = o desafio está segurando a comunidade. 🐻
        </div>
      </Painel>

      {/* Clube por categoria */}
      {categorias.length > 0 && (
        <>
          <div style={{ color: C.oak, fontWeight: 800, fontSize: 12.5, letterSpacing: 1, marginBottom: 8 }}>🎟️ CLUBE · O QUE MAIS USAM, POR CATEGORIA</div>
          <Painel style={{ display: "grid", gap: 10, marginBottom: 16 }}>
            {categorias.map(([cat, v]) => (
              <BarraGraf key={cat} rotulo={`${cat} · ⭐${v.favoritos}`} valor={v.aberturas} max={maxCat} sufixo=" aberturas" />
            ))}
          </Painel>
        </>
      )}

      {/* Parceiros */}
      {parceiros.length > 0 && (
        <>
          <div style={{ color: C.oak, fontWeight: 800, fontSize: 12.5, letterSpacing: 1, marginBottom: 8 }}>🏪 PARCEIROS · QR NA TELA E FAVORITOS</div>
          <Painel style={{ display: "grid", gap: 6, marginBottom: 16 }}>
            {parceiros.map((p, i) => (
              <div key={p.pid} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, gap: 8 }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i + 1}. {p.nome}</span>
                <span style={{ flexShrink: 0 }}>
                  <span style={{ color: C.oak, fontWeight: 800 }}>👁 {p.aberturas}</span>
                  <span style={{ color: C.tealSoft, fontWeight: 800, marginLeft: 10 }}>⭐ {p.favoritos}</span>
                </span>
              </div>
            ))}
            <div style={{ color: C.mut, fontSize: 10.5, lineHeight: 1.5 }}>👁 = cartão aberto com QR na tela · ⭐ = adicionado aos favoritos</div>
          </Painel>
        </>
      )}

      {/* Campanhas: assertividade */}
      {campanhas.length > 0 && (
        <>
          <div style={{ color: C.oak, fontWeight: 800, fontSize: 12.5, letterSpacing: 1, marginBottom: 8 }}>📣 CAMPANHAS NO FEED · ENGAJAMENTO</div>
          <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
            {campanhas.map((c) => (
              <Painel key={c.id}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ color: C.tealSoft, fontWeight: 800, fontSize: 12 }}>🏷️ {c.autorNome}</span>
                  <span style={{ color: C.oak, fontSize: 10.5, flexShrink: 0 }}>{agoLabel(c.ts)}</span>
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.4, marginTop: 3, color: C.mut }}>{c.texto}</div>
                <div style={{ display: "flex", gap: 14, marginTop: 7, fontSize: 12, fontWeight: 800, flexWrap: "wrap" }}>
                  <span style={{ color: C.cream }}>❤️ {c.nReacoes} reações</span>
                  <span style={{ color: C.cream }}>💬 {c.nResp} respostas</span>
                  <span style={{ color: C.oak }}>👆 {(((metricas.campanhas || {})[c.id]) || {}).cliques || 0} foram ao parceiro (QR aberto)</span>
                </div>
              </Painel>
            ))}
          </div>
        </>
      )}

      </>}

      {/* Alunos com filtros */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, gap: 8, flexWrap: "wrap" }}>
        <div style={{ color: C.oak, fontWeight: 800, fontSize: 12.5, letterSpacing: 1 }}>👥 ALUNOS</div>
        <div style={{ display: "flex", gap: 5 }}>
          {[["recentes", "RECENTES"], ["az", "A–Z"], ["ativos", "MAIS ATIVOS"]].map(([id, rot]) => (
            <button key={id} onClick={() => setOrdem(id)} style={{
              background: ordem === id ? C.teal : C.panelSoft,
              color: ordem === id ? "#F2F2F2" : C.mut,
              border: `1px solid ${ordem === id ? C.teal : C.line}`,
              borderRadius: 14, padding: "4px 10px", cursor: "pointer",
              fontSize: 10, fontWeight: 800, letterSpacing: 0.4, fontFamily: "inherit",
            }}>{rot}</button>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {(verTodosAlunos ? listaAlunos : listaAlunos.slice(0, 6)).map((a) => {
          const [tk, ...r] = a.chave.split(":");
          return (
            <Painel key={a.chave} onClick={() => abrirPerfilAluno(tk, r.join(":"))} style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <Avatar foto={fotos[a.chave]} nome={a.nome} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {a.nome || a.chave}{participantes.has(a.chave) ? " 🐻" : ""}
                </div>
                <div style={{ color: C.mut, fontSize: 11 }}>
                  {a.entradas || 0} entrada(s) · ~{a.min || 0} min
                  {profundo && <> · {resumoTelas(a.telas) || "só navegou na home"}
                    {(a.telas || {}).clube || (a.telas || {}).favoritos
                      ? <span style={{ color: C.oak }}> · 🎟️ Clube {((a.telas || {}).clube || 0) + ((a.telas || {}).favoritos || 0)}×</span>
                      : null}
                    {a.favs ? <span style={{ color: C.tealSoft }}> · ⭐ {a.favs} fav</span> : null}</>}
                </div>
              </div>
              <span style={{ color: C.oak, fontSize: 10.5, flexShrink: 0 }}>{a.ultima ? agoLabel(a.ultima) : ""}</span>
            </Painel>
          );
        })}
        {listaAlunos.length === 0 && (
          <Painel><div style={{ color: C.mut, fontSize: 12.5, textAlign: "center", lineHeight: 1.6 }}>
            Ainda sem registros — conforme os alunos usarem o app, os números aparecem aqui. 📊
          </div></Painel>
        )}
        {listaAlunos.length > 6 && (
          <button onClick={() => setVerTodosAlunos(!verTodosAlunos)} style={{
            ...btnFantasma(), width: "100%", border: `1px solid ${C.line}`, borderRadius: 10,
            padding: "10px", color: C.tealSoft, fontWeight: 800, fontSize: 12,
          }}>
            {verTodosAlunos ? "‹ MOSTRAR MENOS" : `MOSTRAR MAIS (${listaAlunos.length - 6}) ›`}
          </button>
        )}
      </div>
    </>
  );
}

// ---------- Central de cadastros e permissões (só a dona do app) ----------
function TelaGestaoAdmins({ adminsReg, salvarAdmins, allData, fotos, voltar }) {
  const vazio = { id: null, nome: "", usuario: "", pin: "", unidade: "prudente", papel: "aluno", permissoes: {} };
  const [form, setForm] = useState(vazio);
  const [confirmar, setConfirmar] = useState(null);
  const [buscaAluno, setBuscaAluno] = useState("");
  const salvar = () => {
    if (!form.nome.trim() || !form.usuario.trim() || !form.pin.trim()) return;
    salvarAdmins((lista) => {
      const limpo = { ...form, usuario: form.usuario.trim().toLowerCase() };
      if (form.id) {
        const i = lista.findIndex((a) => a.id === form.id);
        if (i >= 0) lista[i] = limpo;
      } else {
        lista.push({ ...limpo, id: `adm-${Date.now()}` });
      }
      return lista;
    }, "✅ Cadastro salvo.");
    setForm(vazio);
  };
  const aplicarPapel = (id) => {
    setForm({ ...form, papel: id, permissoes: { ...PAPEIS[id].perms } });
  };
  const alunosBusca = (() => {
    if (!buscaAluno.trim()) return [];
    const q = buscaAluno.trim().toLowerCase();
    const out = [];
    TRACKS.forEach((t) => (((allData[t.id] || {}).students) || []).forEach((s) => {
      if (s.name.toLowerCase().includes(q)) out.push({ ...s, track: t.id });
    }));
    return out.slice(0, 6);
  })();
  const nPerms = Object.values(form.permissoes || {}).filter(Boolean).length;
  return (
    <>
      <CabecalhoTela titulo="TODOS OS CADASTROS"
        sub="Só você (dona do app) vê esta central. Promova qualquer pessoa, use um papel pronto e ajuste permissão por permissão."
        voltar={voltar} />

      {/* Promover um aluno existente */}
      <Painel style={{ display: "grid", gap: 8, marginBottom: 14 }}>
        <div style={{ color: C.oak, fontWeight: 800, fontSize: 12.5 }}>🔎 PROMOVER UM ALUNO</div>
        <input style={inputStyle()} placeholder="Busca o aluno pelo nome…" value={buscaAluno} onChange={(e) => setBuscaAluno(e.target.value)} />
        {alunosBusca.map((s) => (
          <div key={`${s.track}-${s.id}`} onClick={() => {
            setForm({ ...vazio, nome: s.name, usuario: s.name.toLowerCase().split(" ")[0] + "." + (s.name.toLowerCase().split(" ")[1] || "").slice(0, 2) });
            setBuscaAluno("");
          }} style={{ display: "flex", gap: 10, alignItems: "center", cursor: "pointer" }}>
            <Avatar foto={fotos[`${s.track}:${s.id}`]} nome={s.name} size={28} />
            <span style={{ fontSize: 13, flex: 1 }}>{s.name}</span>
            <span style={{ color: C.tealSoft, fontSize: 11, fontWeight: 800 }}>SELECIONAR ›</span>
          </div>
        ))}
      </Painel>

      {/* Formulário */}
      <Painel style={{ display: "grid", gap: 10, marginBottom: 16 }}>
        <div style={{ color: C.oak, fontWeight: 800, fontSize: 13 }}>{form.id ? "✏️ Editar cadastro" : "➕ Novo cadastro"}</div>
        <input style={inputStyle()} placeholder="Nome (ex.: Isabelle)" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
        <div style={{ display: "flex", gap: 8 }}>
          <input style={{ ...inputStyle(), flex: 1 }} placeholder="Usuário (ex.: isabelle.pp)" value={form.usuario} onChange={(e) => setForm({ ...form, usuario: e.target.value })} />
          <input style={{ ...inputStyle(), flex: 1 }} placeholder="PIN" value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value })} />
        </div>
        <div>
          <div style={{ color: C.oak, fontSize: 11.5, fontWeight: 800, letterSpacing: 0.4, marginBottom: 4 }}>UNIDADE</div>
          <select value={form.unidade} onChange={(e) => setForm({ ...form, unidade: e.target.value })}
            style={{ ...inputStyle(), appearance: "auto" }}>
            <option value="prudente">Spincycle Prudente</option>
          </select>
        </div>

        {/* Papéis pré-definidos */}
        <div>
          <div style={{ color: C.oak, fontSize: 11.5, fontWeight: 800, letterSpacing: 0.4, marginBottom: 6 }}>PAPEL — TOQUE E AS PERMISSÕES JÁ VÊM MARCADAS</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {Object.entries(PAPEIS).map(([id, p]) => (
              <button key={id} onClick={() => aplicarPapel(id)} style={{
                background: form.papel === id ? C.teal : C.panelSoft,
                color: form.papel === id ? "#F2F2F2" : C.mut,
                border: `1px solid ${form.papel === id ? C.teal : C.line}`,
                borderRadius: 14, padding: "6px 12px", cursor: "pointer",
                fontSize: 11, fontWeight: 800, letterSpacing: 0.4, fontFamily: "inherit",
              }}>{p.rotulo}</button>
            ))}
          </div>
        </div>

        {/* Permissões por grupo */}
        <div>
          <div style={{ color: C.oak, fontSize: 11.5, fontWeight: 800, letterSpacing: 0.4, marginBottom: 6 }}>
            AJUSTE FINO · {nPerms} permissão(ões) ativa(s)
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            {PERMISSOES_GRUPOS.map(([titulo, itens]) => (
              <div key={titulo}>
                <div style={{ color: C.cream, fontSize: 12, fontWeight: 800, marginBottom: 5 }}>{titulo}</div>
                <div style={{ display: "grid", gap: 6 }}>
                  {itens.map((id) => (
                    <label key={id} style={{ display: "flex", gap: 9, alignItems: "flex-start", cursor: "pointer", fontSize: 12.5, lineHeight: 1.4 }}>
                      <input type="checkbox" checked={!!form.permissoes[id]} style={{ marginTop: 2 }}
                        onChange={(e) => setForm({ ...form, papel: "custom", permissoes: { ...form.permissoes, [id]: e.target.checked } })} />
                      <span style={{ color: form.permissoes[id] ? C.cream : C.mut }}>{PERMISSOES_ROTULOS[id]}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ color: C.mut, fontSize: 10.5, marginTop: 8, lineHeight: 1.5 }}>
            Missões & Arena aplicam no app do Desafio (ponte em breve). Gerir admins e permissões é sempre — e somente — seu.
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {form.id && <button style={{ ...btnFantasma(), flex: 1, color: C.mut }} onClick={() => setForm(vazio)}>Cancelar</button>}
          <button style={{ ...btnPrimario(), flex: 2, opacity: form.nome.trim() && form.usuario.trim() && form.pin.trim() ? 1 : 0.5 }} onClick={salvar}>SALVAR</button>
        </div>
      </Painel>

      <div style={{ color: C.oak, fontWeight: 800, fontSize: 12.5, letterSpacing: 1, marginBottom: 8 }}>CADASTROS COM ACESSO</div>
      <div style={{ display: "grid", gap: 8 }}>
        {adminsReg.map((a) => (
          <Painel key={a.id}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
              <div style={{ flex: 1, minWidth: 0 }} onClick={() => setForm({ ...vazio, ...a, permissoes: a.permissoes || {}, papel: a.papel || "custom" })}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>
                  {a.nome} <span style={{ color: C.mut, fontWeight: 400 }}>· {a.usuario}</span>
                  {a.papel && PAPEIS[a.papel] && <span style={{ color: C.tealSoft, fontSize: 10, fontWeight: 800, marginLeft: 6 }}>{PAPEIS[a.papel].rotulo}</span>}
                </div>
                <div style={{ color: C.mut, fontSize: 11, marginTop: 2 }}>
                  {Object.values(a.permissoes || {}).filter(Boolean).length} permissão(ões) · toque para editar
                </div>
              </div>
              {confirmar === a.id ? (
                <span style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button onClick={() => { salvarAdmins((lista) => lista.filter((x) => x.id !== a.id), "🗑 Cadastro removido."); setConfirmar(null); }}
                    style={{ background: "#7A2E2E", color: "#F2DADA", border: "none", borderRadius: 8, padding: "5px 10px", fontWeight: 800, fontSize: 11, cursor: "pointer" }}>SIM</button>
                  <button onClick={() => setConfirmar(null)} style={{ ...btnFantasma(), fontSize: 11, color: C.mut }}>não</button>
                </span>
              ) : (
                <button onClick={() => setConfirmar(a.id)} style={{ background: "transparent", border: "none", color: C.mut, cursor: "pointer", flexShrink: 0 }}>✕</button>
              )}
            </div>
          </Painel>
        ))}
        {adminsReg.length === 0 && (
          <Painel><div style={{ color: C.mut, fontSize: 12.5, textAlign: "center", lineHeight: 1.6 }}>
            Nenhum cadastro criado ainda. Os acessos fixos da equipe atual (recepção, Isabelle, Monique) continuam valendo com o papel ADMIN · UNIDADE.
          </div></Painel>
        )}
      </div>
      <div style={{ color: C.mut, fontSize: 10.5, marginTop: 12, lineHeight: 1.55 }}>
        A pessoa entra pela tela EM BREVE → "acesso da equipe" com o usuário e PIN criados aqui, e vê exatamente o que você marcou.
      </div>
    </>
  );
}

// ---------- Ranking geral ----------
function TelaRanking({ rk, sessao, fotos, abrirPerfilAluno, voltar }) {
  const [busca, setBusca] = useState("");
  const q = norm(busca);
  const lista = q ? rk.filter((r) => norm(r.name).includes(q)) : rk;
  return (
    <>
      <CabecalhoTela titulo="RANKING GERAL"
        sub="Todas as missões, todo mundo junto — sem separar Ilimitados, Pacotes ou Híbridos. Conta o que você fez: missões cumpridas e aulas feitas dentro dos desafios."
        voltar={voltar} />
      <input style={{ ...inputStyle(), marginBottom: 14 }} placeholder="🔎 Buscar aluno no ranking…"
        value={busca} onChange={(e) => setBusca(e.target.value)} />
      <div style={{ display: "grid", gap: 8 }}>
        {lista.map((r) => {
          const pos = rk.indexOf(r) + 1;
          const eu = sessao && r.sid === sessao.sid && r.track === sessao.track;
          const foto = fotos[`${r.track}:${r.sid}`];
          const medalha = pos === 1 ? "🥇" : pos === 2 ? "🥈" : pos === 3 ? "🥉" : null;
          return (
            <Painel key={`${r.track}-${r.sid}`} onClick={() => abrirPerfilAluno(r.track, r.sid)} style={{
              display: "flex", gap: 12, alignItems: "center",
              border: eu ? `1px solid ${C.tealSoft}` : `1px solid ${C.line}`,
            }}>
              <div style={{ width: 34, textAlign: "center", flexShrink: 0 }}>
                {medalha
                  ? <span style={{ fontSize: 22 }}>{medalha}</span>
                  : <span style={{ color: C.mut, fontWeight: 800, fontSize: 14 }}>{pos}</span>}
              </div>
              <Avatar foto={foto} nome={r.name} size={38} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {r.name} {eu && <span style={{ color: C.tealSoft, fontSize: 11 }}>· você</span>}
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ color: C.oak, fontWeight: 800, fontSize: 13 }}>{r.doneCount}/9 missões</div>
                <div style={{ color: C.mut, fontSize: 11.5 }}>{r.aulas} {r.aulas === 1 ? "aula" : "aulas"}</div>
              </div>
            </Painel>
          );
        })}
        {lista.length === 0 && (
          <Painel><div style={{ color: C.mut, fontSize: 13, textAlign: "center" }}>
            {q ? `Ninguém encontrado com "${busca}". 🔎` : "Sem dados ainda."}
          </div></Painel>
        )}
      </div>
    </>
  );
}

// ---------- Arena (todos os desafios e jogos) ----------
function TelaArena({ desafios, voltar }) {
  const [filtro, setFiltro] = useState("todos");
  const ROTULOS = { andamento: "EM ANDAMENTO", breve: "EM BREVE", encerrado: "ENCERRADOS" };
  const CORES_ST = { andamento: C.ok, breve: C.oak, encerrado: C.mut };
  const ordem = { andamento: 0, breve: 1, encerrado: 2 };
  const lista = [...desafios]
    .filter((d) => filtro === "todos" || d.status === filtro)
    .sort((a, b) => (ordem[a.status] ?? 9) - (ordem[b.status] ?? 9));
  const chip = (id, rot) => (
    <button key={id} onClick={() => setFiltro(id)} style={{
      background: filtro === id ? C.teal : C.panelSoft,
      color: filtro === id ? "#F2F2F2" : C.mut,
      border: `1px solid ${filtro === id ? C.teal : C.line}`,
      borderRadius: 16, padding: "6px 12px", cursor: "pointer",
      fontSize: 11.5, fontWeight: 800, letterSpacing: 0.5, fontFamily: "inherit",
      whiteSpace: "nowrap",
    }}>{rot}</button>
  );
  return (
    <>
      <CabecalhoTela titulo="ARENA SPINCYCLE" sub="Todos os desafios e jogos da comunidade — os que estão rolando, os que vêm aí e os que já fizeram história." voltar={voltar} />
      <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
        {chip("todos", "TODOS")}
        {chip("andamento", "EM ANDAMENTO")}
        {chip("breve", "EM BREVE")}
        {chip("encerrado", "ENCERRADOS")}
      </div>
      <div style={{ display: "grid", gap: 12 }}>
        {lista.map((d) => {
          const encerrado = d.status === "encerrado";
          const quadro = (
            <Painel key={d.id} style={{
              display: "flex", gap: 14, alignItems: "stretch",
              opacity: encerrado ? 0.72 : 1,
              border: d.status === "andamento" ? `1px solid ${C.tealSoft}55` : `1px solid ${C.line}`,
            }}>
              {/* Quadro com a cara do desafio */}
              <div style={{
                width: 92, minHeight: 92, borderRadius: 12, flexShrink: 0,
                background: C.panelSoft, border: `1.5px solid ${CORES_ST[d.status]}55`,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
              }}>
                <Ic nome={d.icone || "urso"} size={40} stroke={1.4} style={{ color: C.oak }} />
              </div>
              {/* Resumo à direita */}
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 800, fontSize: 14.5, letterSpacing: 0.4 }}>{d.nome}</span>
                  <span style={{
                    color: CORES_ST[d.status], border: `1px solid ${CORES_ST[d.status]}66`,
                    borderRadius: 6, padding: "1px 7px", fontSize: 10, fontWeight: 800, letterSpacing: 0.5,
                  }}>{ROTULOS[d.status]}</span>
                </div>
                <div style={{ color: C.oak, fontSize: 12, marginTop: 4 }}>📅 {d.periodo}</div>
                <div style={{ color: C.mut, fontSize: 12.5, marginTop: 5, lineHeight: 1.45, flex: 1 }}>{d.resumo}</div>
                {d.status === "andamento" && d.url && (
                  <div style={{ color: C.tealSoft, fontWeight: 800, fontSize: 12.5, marginTop: 8, letterSpacing: 0.5 }}>{d.cta || "ENTRAR"} ›</div>
                )}
                {d.status === "breve" && (
                  <div style={{ color: C.oak, fontWeight: 800, fontSize: 12, marginTop: 8, letterSpacing: 0.5 }}>🔔 Aguarde — vem coisa boa aí.</div>
                )}
              </div>
            </Painel>
          );
          return d.status === "andamento" && d.url
            ? <a key={d.id} href={d.url} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>{quadro}</a>
            : quadro;
        })}
        {lista.length === 0 && (
          <Painel><div style={{ color: C.mut, fontSize: 13, textAlign: "center" }}>Nada nessa categoria por enquanto. 🚴</div></Painel>
        )}
      </div>
    </>
  );
}

// ---------- Busca ----------
function TelaBusca({ feedRadar, muralAlunos, allData, fotos, reacts, minhaChave, reagir, admin, buscas, registrarBusca, abrirPerfilAluno, visitados, termosRecentes, nomeDaChave, frasesLidas = [], renderPost, voltar }) {
  const [q, setQ] = useState("");
  const nq = norm(q);
  const jaRegistrou = useRef(new Set());
  useEffect(() => {
    if (nq.length < 3 || jaRegistrou.current.has(nq)) return;
    const t = setTimeout(() => {
      jaRegistrou.current.add(nq);
      registrarBusca(nq);
    }, 1400);
    return () => clearTimeout(t);
  }, [nq]);
  const maisBuscadas = admin
    ? Object.entries(buscas || {}).sort((a, b) => b[1] - a[1]).slice(0, 10)
    : [];
  const pessoas = [];
  if (nq.length >= 2) {
    TRACKS.forEach((t) => (((allData[t.id] || {}).students) || []).forEach((s) => {
      if (s.approved !== false && norm(s.name).includes(nq)) pessoas.push({ ...s, track: t.id, trackShort: t.short });
    }));
    pessoas.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }
  const posts = nq.length >= 2
    ? [...feedRadar, ...muralAlunos]
        .filter((e) => norm([e.titulo, e.corpo, e.texto, e.autorNome].filter(Boolean).join(" ")).includes(nq))
        .sort((a, b) => b.ts - a.ts)
    : [];
  return (
    <>
      <CabecalhoTela titulo="BUSCAR" sub="Procure uma palavra ou uma pessoa — aparece tudo que já passou pelo Radar e pelo Mural." voltar={voltar} />
      <input style={{ ...inputStyle(), marginBottom: 14 }} autoFocus placeholder="Buscar palavras ou pessoas…"
        value={q} onChange={(e) => setQ(e.target.value)} />
      {admin && maisBuscadas.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ color: C.oak, fontWeight: 800, fontSize: 12.5, letterSpacing: 1, marginBottom: 8 }}>
            📈 MAIS BUSCADAS <span style={{ color: C.mut, fontWeight: 700 }}>· só a adm vê</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {maisBuscadas.map(([termo, n]) => (
              <button key={termo} onClick={() => setQ(termo)} style={{
                background: C.panelSoft, border: `1px solid ${C.line}`, borderRadius: 16,
                padding: "5px 11px", cursor: "pointer", color: C.cream, fontSize: 12.5,
                fontFamily: "inherit", display: "flex", gap: 6, alignItems: "center",
              }}>
                {termo}
                <span style={{ color: C.oak, fontWeight: 800, fontSize: 11 }}>{n}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {nq.length < 2 ? (
        <>
          {visitados.length > 0 && (
            <>
              <div style={{ color: C.oak, fontWeight: 800, fontSize: 12.5, letterSpacing: 1, marginBottom: 8 }}>🕘 PERFIS QUE VOCÊ XERETOU</div>
              <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 6, marginBottom: 14 }}>
                {visitados.map((ch) => (
                  <button key={ch} onClick={() => { const [tk, ...r] = ch.split(":"); abrirPerfilAluno(tk, r.join(":")); }} style={{
                    background: "transparent", border: "none", cursor: "pointer", padding: 0,
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 5, flexShrink: 0, width: 62,
                  }}>
                    <Avatar foto={fotos[ch]} nome={nomeDaChave(ch)} size={48} />
                    <span style={{ color: C.cream, fontSize: 10, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>
                      {firstName(nomeDaChave(ch))}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
          {termosRecentes.length > 0 && (
            <>
              <div style={{ color: C.oak, fontWeight: 800, fontSize: 12.5, letterSpacing: 1, marginBottom: 8 }}>💬 FRASES QUE VOCÊ BUSCOU</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                {termosRecentes.map((t) => (
                  <button key={t} onClick={() => setQ(t)} style={{
                    background: C.panelSoft, border: `1px solid ${C.line}`, borderRadius: 16,
                    padding: "5px 11px", cursor: "pointer", color: C.cream, fontSize: 12.5, fontFamily: "inherit",
                  }}>{t}</button>
                ))}
              </div>
            </>
          )}
          {frasesLidas.length > 0 && (
            <>
              <div style={{ color: C.oak, fontWeight: 800, fontSize: 12.5, letterSpacing: 1, marginBottom: 8 }}>👁️ FRASES QUE VOCÊ LEU</div>
              <div style={{ display: "grid", gap: 4, marginBottom: 14 }}>
                {frasesLidas.map((p) => renderPost(p))}
              </div>
            </>
          )}
          {visitados.length === 0 && termosRecentes.length === 0 && frasesLidas.length === 0 && (
            <div style={{ color: C.mut, fontSize: 12.5, textAlign: "center", marginTop: 24, lineHeight: 1.6 }}>
              Ex.: "madrugador", "cartela", "Fabiana", "relâmpago"… 🔎
            </div>
          )}
        </>
      ) : (
        <>
          {pessoas.length > 0 && (
            <>
              <div style={{ color: C.oak, fontWeight: 800, fontSize: 12.5, letterSpacing: 1, marginBottom: 8 }}>PESSOAS</div>
              <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
                {pessoas.slice(0, 8).map((s) => (
                  <Painel key={`${s.track}-${s.id}`} style={{ display: "flex", gap: 12, alignItems: "center" }}
                    onClick={() => abrirPerfilAluno(s.track, s.id)}>
                    <Avatar foto={fotos[`${s.track}:${s.id}`]} nome={s.name} size={38} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13.5 }}>{s.name}</div>
                      <div style={{ color: C.mut, fontSize: 11.5 }}>{s.trackShort}</div>
                    </div>
                    <span style={{ color: C.mut }}>›</span>
                  </Painel>
                ))}
              </div>
            </>
          )}
          <div style={{ color: C.oak, fontWeight: 800, fontSize: 12.5, letterSpacing: 1, marginBottom: 8 }}>
            PUBLICAÇÕES {posts.length > 0 && <span style={{ color: C.mut }}>· {posts.length}</span>}
          </div>
          <div style={{ display: "grid", gap: 4 }}>
            {posts.slice(0, 30).map((e) => (
              <PostCard key={e.id} e={e} fotos={fotos} reacts={reacts} minhaChave={minhaChave} reagir={reagir} />
            ))}
            {posts.length === 0 && (
              <Painel><div style={{ color: C.mut, fontSize: 13, textAlign: "center" }}>
                Nada encontrado com "{q}". Tenta outra palavra! 🔎
              </div></Painel>
            )}
          </div>
        </>
      )}
    </>
  );
}

// ---------- Agenda ----------
function TelaAgenda({ agenda, lembretes, admin, salvarLembrete, addEventoMarca, removerEventoMarca, agendarURL, voltar }) {
  const [editando, setEditando] = useState(null); // id do lembrete em edição
  const [novoTxt, setNovoTxt] = useState("");
  const [novoData, setNovoData] = useState(todayStr());
  const [admTitulo, setAdmTitulo] = useState("");
  const [admData, setAdmData] = useState(todayStr());
  const [admDesc, setAdmDesc] = useState("");
  const [admAberto, setAdmAberto] = useState(false);

  const eventos = [...((agenda && agenda.eventos) || [])].sort((a, b) => (a.data || "").localeCompare(b.data || ""));
  const futuros = eventos.filter((e) => e.data >= todayStr());
  const meus = [...lembretes].sort((a, b) => (a.data || "").localeCompare(b.data || ""));

  return (
    <>
      <CabecalhoTela titulo="AGENDA" sub="Sua central: agende sua aula, acompanhe os eventos da Spincycle e anote seus lembretes." voltar={voltar} />

      <a href={agendarURL} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
        <div style={{ ...btnPrimario(), marginBottom: 18, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Ic nome="bike" size={19} stroke={2} /> AGENDAR AULA ›
        </div>
      </a>

      <div style={{ color: C.oak, fontWeight: 800, fontSize: 13.5, letterSpacing: 1, marginBottom: 8 }}>🚴 EVENTOS DA MARCA</div>
      <div style={{ display: "grid", gap: 8, marginBottom: 8 }}>
        {futuros.map((e) => (
          <Painel key={e.id} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ textAlign: "center", flexShrink: 0, minWidth: 44 }}>
              <div style={{ color: C.tealSoft, fontWeight: 800, fontSize: 16 }}>{toDate(e.data).getDate()}</div>
              <div style={{ color: C.mut, fontSize: 10.5, textTransform: "uppercase" }}>{MESES[toDate(e.data).getMonth()]}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>{e.titulo}</div>
              {e.desc && <div style={{ color: C.mut, fontSize: 12.5, marginTop: 3 }}>{e.desc}</div>}
            </div>
            {admin && <button onClick={() => removerEventoMarca(e.id)} style={{ background: "transparent", border: "none", color: C.mut, cursor: "pointer" }}>🗑</button>}
          </Painel>
        ))}
        {futuros.length === 0 && <Painel><div style={{ color: C.mut, fontSize: 13, textAlign: "center" }}>Nenhum evento agendado por enquanto.</div></Painel>}
      </div>
      {admin && (
        <div style={{ marginBottom: 20 }}>
          {!admAberto
            ? <button style={{ ...btnFantasma }} onClick={() => setAdmAberto(true)}>+ Adicionar evento da marca</button>
            : (
              <Painel style={{ display: "grid", gap: 8 }}>
                <input style={inputStyle()} placeholder="Título do evento" value={admTitulo} onChange={(e) => setAdmTitulo(e.target.value)} />
                <input style={inputStyle()} type="date" value={admData} onChange={(e) => setAdmData(e.target.value)} />
                <input style={inputStyle()} placeholder="Descrição (opcional)" value={admDesc} onChange={(e) => setAdmDesc(e.target.value)} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={{ ...btnFantasma(), flex: 1, color: C.mut }} onClick={() => setAdmAberto(false)}>Cancelar</button>
                  <button style={{ ...btnPrimario(), flex: 1, opacity: admTitulo.trim() ? 1 : 0.5 }} onClick={() => {
                    if (!admTitulo.trim()) return;
                    addEventoMarca({ id: `ev-${Date.now()}`, titulo: admTitulo.trim(), data: admData, desc: admDesc.trim() });
                    setAdmTitulo(""); setAdmDesc(""); setAdmAberto(false);
                  }}>SALVAR</button>
                </div>
              </Painel>
            )}
        </div>
      )}

      <div style={{ color: C.oak, fontWeight: 800, fontSize: 13.5, letterSpacing: 1, margin: "16px 0 8px" }}>📝 MEUS LEMBRETES</div>
      <div style={{ display: "grid", gap: 8 }}>
        {[...meus].sort((a, b) => (a.feito === b.feito ? 0 : a.feito ? 1 : -1)).map((l) => (
          <Painel key={l.id} style={{ display: "flex", gap: 10, alignItems: "center", opacity: l.feito ? 0.55 : 1 }}>
            <button title={l.feito ? "Desmarcar" : "Concluir"}
              onClick={() => salvarLembrete(lembretes.map((x) => x.id === l.id ? { ...x, feito: !x.feito } : x))}
              style={{
                width: 24, height: 24, borderRadius: "50%", flexShrink: 0, cursor: "pointer",
                background: l.feito ? C.ok : "transparent",
                border: `1.6px solid ${l.feito ? C.ok : C.mut}`,
                color: l.feito ? "#0E1B12" : "transparent",
                fontSize: 13, fontWeight: 800, lineHeight: 1, padding: 0,
              }}>✓</button>
            <div style={{ color: C.oak, fontSize: 12, flexShrink: 0, minWidth: 46 }}>{fmtBR(l.data)}</div>
            <div style={{ flex: 1, fontSize: 13.5, textDecoration: l.feito ? "line-through" : "none" }}>{l.texto}</div>
            <button title="Editar" onClick={() => { setEditando(l.id); setNovoTxt(l.texto); setNovoData(l.data || todayStr()); }}
              style={{ background: "transparent", border: "none", color: C.mut, cursor: "pointer", fontSize: 13, padding: "0 2px" }}>
              <Ic nome="lapis" size={15} stroke={1.8} />
            </button>
            <button title="Apagar" onClick={() => { salvarLembrete(lembretes.filter((x) => x.id !== l.id)); if (editando === l.id) { setEditando(null); setNovoTxt(""); } }}
              style={{ background: "transparent", border: "none", color: C.mut, cursor: "pointer", fontSize: 13, padding: 0 }}>🗑</button>
          </Painel>
        ))}
        {meus.length === 0 && <div style={{ color: C.mut, fontSize: 12.5 }}>Anote aqui o que não pode esquecer — só você vê.</div>}
      </div>
      <Painel style={{ display: "grid", gap: 8, marginTop: 10, border: editando ? `1px solid ${C.tealSoft}66` : undefined }}>
        {editando && <div style={{ color: C.tealSoft, fontSize: 11.5, fontWeight: 800 }}>✏️ Editando lembrete</div>}
        <input style={inputStyle()} placeholder="Novo lembrete…" value={novoTxt} onChange={(e) => setNovoTxt(e.target.value)} />
        <div style={{ display: "flex", gap: 8 }}>
          <input style={{ ...inputStyle(), flex: 1 }} type="date" value={novoData} onChange={(e) => setNovoData(e.target.value)} />
          {editando && (
            <button style={{ ...btnFantasma(), color: C.mut, padding: "10px 12px" }}
              onClick={() => { setEditando(null); setNovoTxt(""); setNovoData(todayStr()); }}>✕</button>
          )}
          <button style={{ ...btnPrimario(), width: "auto", padding: "10px 18px", opacity: novoTxt.trim() ? 1 : 0.5 }} onClick={() => {
            if (!novoTxt.trim()) return;
            if (editando) {
              salvarLembrete(lembretes.map((x) => x.id === editando ? { ...x, texto: novoTxt.trim(), data: novoData } : x));
              setEditando(null);
            } else {
              salvarLembrete([...lembretes, { id: `lm-${Date.now()}`, texto: novoTxt.trim(), data: novoData }]);
            }
            setNovoTxt("");
          }}>{editando ? "SALVAR" : "+"}</button>
        </div>
      </Painel>

    </>
  );
}

// ---------- Perfil ----------
const TAM_CAMISETA = ["PP", "P", "M", "G", "GG"];
function TelaPerfil({ sessao, aluno, perfil, foto, salvarPerfil, sair, admin, tema, mudarTema, irFotos, voltar }) {
  const [bio, setBio] = useState(perfil.bio || "");
  const [editandoBio, setEditandoBio] = useState(false);
  const [extra, setExtra] = useState({
    sapatilha: perfil.sapatilha || "", camiseta: perfil.camiseta || "",
    cpf: perfil.cpf || "", endereco: perfil.endereco || "",
    quemTrouxe: perfil.quemTrouxe || "", instagram: perfil.instagram || "",
  });
  const [editandoExtra, setEditandoExtra] = useState(false);
  useEffect(() => { setBio(perfil.bio || ""); }, [perfil.bio]);

  return (
    <>
      <CabecalhoTela titulo="MEU PERFIL" voltar={voltar} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <Avatar foto={foto} nome={sessao.name} size={110} />
        <div style={{ fontWeight: 800, fontSize: 18, textTransform: "uppercase", letterSpacing: 0.5 }}>{sessao.name}</div>
        <div style={{ color: C.mut, fontSize: 12, textAlign: "center", lineHeight: 1.5, maxWidth: 320 }}>
          A foto do perfil é a mesma do app do Desafio — para trocar, troque por lá que ela atualiza aqui. 📸
        </div>
      </div>

      <div style={{ color: C.oak, fontWeight: 800, fontSize: 13.5, letterSpacing: 1, marginBottom: 8 }}>✨ MINHA FRASE</div>
      {!editandoBio ? (
        <Painel onClick={() => setEditandoBio(true)}>
          <div style={{ fontSize: 14, lineHeight: 1.5, color: bio ? C.cream : C.mut, fontStyle: bio ? "normal" : "italic" }}>
            {bio || "Toque para escrever a frase que te descreve."}
          </div>
        </Painel>
      ) : (
        <Painel style={{ display: "grid", gap: 8 }}>
          <textarea style={{ ...inputStyle(), minHeight: 70, resize: "vertical" }} maxLength={140}
            value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Ex.: Disciplina que move, propósito que transforma." />
          <div style={{ color: C.mut, fontSize: 11, textAlign: "right" }}>{bio.length}/140</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ ...btnFantasma(), flex: 1, color: C.mut }} onClick={() => { setBio(perfil.bio || ""); setEditandoBio(false); }}>Cancelar</button>
            <button style={{ ...btnPrimario(), flex: 1 }} onClick={() => { salvarPerfil({ bio: bio.trim() }); setEditandoBio(false); }}>SALVAR</button>
          </div>
        </Painel>
      )}

      <div style={{ color: C.oak, fontWeight: 800, fontSize: 13.5, letterSpacing: 1, margin: "20px 0 8px" }}>📇 MEUS DADOS</div>
      <Painel style={{ display: "grid", gap: 8 }}>
        <div style={{ fontSize: 13 }}><span style={{ color: C.mut }}>Nome: </span>{sessao.name}</div>
        {aluno && aluno.phone && <div style={{ fontSize: 13 }}><span style={{ color: C.mut }}>WhatsApp: </span>{fmtPhone(aluno.phone)}</div>}
        <div style={{ color: C.mut, fontSize: 11.5, lineHeight: 1.5 }}>
          Nome, senha e WhatsApp são os mesmos do app do Desafio — alterações por lá (ou com a recepção) valem para os dois apps.
        </div>
      </Painel>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "20px 0 8px" }}>
        <div style={{ color: C.oak, fontWeight: 800, fontSize: 13.5, letterSpacing: 1 }}>🚴 MEU KIT (opcional)</div>
        {!editandoExtra && <button style={{ ...btnFantasma(), fontSize: 12 }} onClick={() => setEditandoExtra(true)}>✏️ Editar</button>}
      </div>
      {!editandoExtra ? (
        <Painel style={{ display: "grid", gap: 6 }}>
          {[["Sapatilha", extra.sapatilha], ["Camiseta", extra.camiseta], ["Instagram", extra.instagram && "@" + extra.instagram.replace(/^@/, "")],
            ["Quem te trouxe pra bike", extra.quemTrouxe], ["CPF", extra.cpf], ["Endereço", extra.endereco]]
            .filter(([, v]) => v)
            .map(([k, v]) => <div key={k} style={{ fontSize: 13 }}><span style={{ color: C.mut }}>{k}: </span>{v}</div>)}
          {!extra.sapatilha && !extra.camiseta && !extra.cpf && !extra.endereco && !extra.quemTrouxe && !extra.instagram && (
            <div style={{ color: C.mut, fontSize: 12.5, fontStyle: "italic" }}>
              Complete quando quiser: número de sapatilha, tamanho de camiseta, Instagram… Ajuda a gente a preparar brindes e eventos no seu tamanho. 🎁
            </div>
          )}
          <div style={{ color: C.mut, fontSize: 11, lineHeight: 1.5, marginTop: 4 }}>
            🔒 Esses dados são para uso da administração da Spincycle — não aparecem para outros alunos.
          </div>
        </Painel>
      ) : (
        <Painel style={{ display: "grid", gap: 8 }}>
          <input style={inputStyle()} placeholder="Número de sapatilha (ex.: 37)" value={extra.sapatilha} onChange={(e) => setExtra({ ...extra, sapatilha: e.target.value })} />
          <div style={{ display: "flex", gap: 6 }}>
            {TAM_CAMISETA.map((t) => (
              <button key={t} onClick={() => setExtra({ ...extra, camiseta: extra.camiseta === t ? "" : t })} style={{
                flex: 1, background: extra.camiseta === t ? C.teal : C.panelSoft,
                color: extra.camiseta === t ? "#F2F2F2" : C.cream,
                border: `1px solid ${extra.camiseta === t ? C.teal : C.line}`,
                borderRadius: 10, padding: "10px 0", fontWeight: 800, cursor: "pointer", fontSize: 13,
              }}>{t}</button>
            ))}
          </div>
          <input style={inputStyle()} placeholder="Instagram (sem @)" value={extra.instagram} onChange={(e) => setExtra({ ...extra, instagram: e.target.value.replace(/^@/, "") })} />
          <input style={inputStyle()} placeholder="Quem te trouxe pra bike?" value={extra.quemTrouxe} onChange={(e) => setExtra({ ...extra, quemTrouxe: e.target.value })} />
          <input style={inputStyle()} placeholder="CPF (só a administração vê)" value={extra.cpf} onChange={(e) => setExtra({ ...extra, cpf: e.target.value })} />
          <input style={inputStyle()} placeholder="Endereço (só a administração vê)" value={extra.endereco} onChange={(e) => setExtra({ ...extra, endereco: e.target.value })} />
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ ...btnFantasma(), flex: 1, color: C.mut }} onClick={() => setEditandoExtra(false)}>Cancelar</button>
            <button style={{ ...btnPrimario(), flex: 1 }} onClick={() => { salvarPerfil(extra); setEditandoExtra(false); }}>SALVAR</button>
          </div>
        </Painel>
      )}

      <div style={{ color: C.oak, fontWeight: 800, fontSize: 13.5, letterSpacing: 1, margin: "20px 0 8px" }}>🌓 APARÊNCIA</div>
      <div style={{ display: "flex", gap: 8 }}>
        {[["escuro", "🌙 Escuro"], ["claro", "☀️ Claro"]].map(([t, rot]) => (
          <button key={t} onClick={() => mudarTema(t)} style={{
            flex: 1, background: tema === t ? C.teal : C.panelSoft,
            color: tema === t ? "#F2F2F2" : C.cream,
            border: `1px solid ${tema === t ? C.teal : C.line}`,
            borderRadius: 10, padding: "11px 0", fontWeight: 800, cursor: "pointer", fontSize: 13,
            fontFamily: "inherit",
          }}>{rot}</button>
        ))}
      </div>

      {admin && (
        <>
          <div style={{ color: C.oak, fontWeight: 800, fontSize: 13.5, letterSpacing: 1, margin: "20px 0 8px" }}>⚙️ ADMINISTRAÇÃO</div>
          <div style={{ display: "grid", gap: 8 }}>
            <Painel onClick={irFotos} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13.5, fontWeight: 700 }}>📸 Fotos dos alunos</span><span style={{ color: C.mut }}>›</span>
            </Painel>
          </div>
        </>
      )}

      <button onClick={sair} style={{ ...btnFantasma(), width: "100%", marginTop: 24, color: "#E08585", border: `1px solid ${C.line}`, borderRadius: 10, padding: "12px" }}>
        Sair da conta
      </button>
    </>
  );
}

// ---------- Fotos dos alunos (adm) ----------
function FotosAlunos({ allData, fotos, trocarFotoAluno, voltar }) {
  const [busca, setBusca] = useState("");
  const fileRef = useRef(null);
  const alvoRef = useRef(null);
  const todos = [];
  TRACKS.forEach((t) => ((allData[t.id] || {}).students || []).forEach((s) => {
    if (s.approved !== false) todos.push({ ...s, track: t.id, trackShort: t.short });
  }));
  const q = norm(busca);
  const lista = todos.filter((s) => !q || norm(s.name).includes(q)).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  return (
    <>
      <CabecalhoTela titulo="FOTOS DOS ALUNOS" sub="Toque em 📷 para trocar a foto de qualquer aluno — ela atualiza na Comunidade e no Desafio." voltar={voltar} />
      <input style={{ ...inputStyle(), marginBottom: 12 }} placeholder="🔎 Buscar aluno…" value={busca} onChange={(e) => setBusca(e.target.value)} />
      <div style={{ display: "grid", gap: 8 }}>
        {lista.map((s) => (
          <Painel key={`${s.track}-${s.id}`} style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Avatar foto={fotos[`${s.track}:${s.id}`]} nome={s.name} size={40} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
              <div style={{ color: C.mut, fontSize: 11.5 }}>{s.trackShort}</div>
            </div>
            <button style={{ ...btnFantasma(), fontSize: 15 }} onClick={() => {
              alvoRef.current = { track: s.track, sid: s.id };
              fileRef.current && fileRef.current.click();
            }}>📷</button>
          </Painel>
        ))}
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
        onChange={(e) => {
          const alvo = alvoRef.current;
          lerImagem(e.target.files && e.target.files[0], (d) => {
            if (alvo) trocarFotoAluno(alvo.track, alvo.sid, d);
          }, 240);
          e.target.value = "";
        }} />
    </>
  );
}
