import { useState, useEffect, useRef } from "react";
import { escolherMsgRadar, categoriaInatividade } from "./RADAR_MSGS_400";
import ursoCabecaImg from "./urso-cabeca.png";
import ursoLogoDesafioImg from "./urso-logo-desafio.png";

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
// Nome de exibição de cada admin ao entrar como "staff" — cada um com sua própria
// identidade (sid próprio), em vez de uma "Administração" genérica compartilhada.
const NOME_ADMIN = {
  recepcao: "Recepção",
  raquel: "Raquel (Admin)",
  isabelle: "Isabelle (Admin)",
  monique: "Monique (Admin)",
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

const REACTS = ["❤️", "🔥", "💪", "😳", "😂"];
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

// ============================================================
// CATÁLOGO DE SELOS — o selo é conquistado dentro de cada desafio
// (Desafio das Missões, e futuramente Rota do Urso e outros jogos),
// mas só vira vitrine visual aqui na Arena/Comunidade. Pra somar um
// desafio novo: adiciona uma chave nova abaixo (mesmo formato) — o
// resto do app (passaporte, perfil, toast) já funciona sem mexer em nada.
// ============================================================
// Índices do tabuleiro 3x3 (mesma ordem do MISSION_BASE): cantos = 0,2,6,8
const CANTOS_IDX = [0, 2, 6, 8];

const CATALOGO_SELOS = {
  missoes: {
    rotulo: "Desafio das Missões",
    selos: {
      dobra:    { nome: "Dobradinha",         svg: "dobradinha" },
      madruga:  { nome: "Madrugador",         svg: "madrugador" },
      maratona: { nome: "Maratonista",        svg: "maratonista" },
      semana:   { nome: "Semana Perfeita",    svg: "semana_perfeita" },
      zona:     { nome: "Troca a Base",       svg: "troca_a_base" },
      fds:      { nome: "Fim de Semana Raiz", svg: "fim_de_semana_raiz" },
      giro:     { nome: "Giro na Grade",      svg: "giro_na_grade" },
      fogo:     { nome: "Sequência de Fogo",  svg: "sequencia_de_fogo" },
      amigo:    { nome: "Chama a Galera",     svg: "chama_a_galera" },
      linha_h:  { nome: "Linha Horizontal",   svg: "linha_da_cartela" },
      linha_v:  { nome: "Linha Vertical",     svg: "linha_vertical" },
      linha_d:  { nome: "Linha Transversal",  svg: "linha_transversal" },
      cantos:   { nome: "Quatro Cantos",      svg: "quatro_cantos" },
      cartela:  { nome: "Cartela Cheia",      svg: "cartela_cheia" },
      giro175:  { nome: "Giro 175",           svg: "giro_175" },
      pacotes4: { nome: "4 Pacotes de 10",    svg: "ingresso" },
      relampago:{ nome: "Missão Relâmpago",   svg: "ovo_surpresa" },
    },
  },
  // Próximo desafio entra assim, com seu próprio conjunto de selos:
  // rota_urso: { rotulo: "Rota do Urso", selos: { ... } },
};

// concedidos: { giro175: {chave:true}, pacotes4: {chave:true} } — selos que não vêm
// de `prog`, concedidos manualmente pelo admin (ver alternarGiro175 / alternarPacotes4)
// aluno + targets (opcionais): quando informados para o desafio "missoes", calcula o
// instante exato de cada conquista (via progressoIncrementos) pra ordenar os carimbos
// com os mais recentes primeiro.
function calcularCarimbos(prog, desafioId = "missoes", concedidos = {}, chaveAluno = "", aluno = null, targets = null) {
  const lista = [];
  if (!prog) return lista;
  const cat = CATALOGO_SELOS[desafioId];
  if (!cat) return lista;
  const S = cat.selos;

  // Timestamp de cada missão individual (quando disponível), pra ordenar por "mais nova primeiro".
  let tsPorIdx = {};
  if (desafioId === "missoes" && aluno && targets) {
    progressoIncrementos(aluno, targets).forEach((inc) => { tsPorIdx[inc.idx] = inc.ts; });
  }
  const tsDe = (idxs) => idxs.reduce((m, i) => (tsPorIdx[i] ? Math.max(m, tsPorIdx[i]) : m), 0) || 0;

  MISSION_BASE.forEach((m, i) => {
    if (prog.done[i] && S[m.id]) lista.push({ id: `${desafioId}-${m.id}`, svg: S[m.id].svg, nome: S[m.id].nome, detalhe: `missão cumprida no ${cat.rotulo}`, ts: tsPorIdx[i] || 0 });
  });
  // linhas: uma vez por direção (0-2 horizontal, 3-5 vertical, 6-7 transversal/diagonal)
  const temH = prog.linesDone.some((i) => i < 3), temV = prog.linesDone.some((i) => i >= 3 && i < 6), temD = prog.linesDone.some((i) => i >= 6);
  if (temH && S.linha_h) lista.push({ id: `${desafioId}-linha-h`, svg: S.linha_h.svg, nome: S.linha_h.nome, detalhe: `linha horizontal fechada no ${cat.rotulo}`, ts: tsDe([0, 1, 2]) });
  if (temV && S.linha_v) lista.push({ id: `${desafioId}-linha-v`, svg: S.linha_v.svg, nome: S.linha_v.nome, detalhe: `linha vertical fechada no ${cat.rotulo}`, ts: tsDe([3, 4, 5]) });
  if (temD && S.linha_d) lista.push({ id: `${desafioId}-linha-d`, svg: S.linha_d.svg, nome: S.linha_d.nome, detalhe: `linha transversal fechada no ${cat.rotulo}`, ts: tsDe([6, 7, 8]) });
  // quatro cantos
  if (CANTOS_IDX.every((i) => prog.done[i]) && S.cantos) lista.push({ id: `${desafioId}-cantos`, svg: S.cantos.svg, nome: S.cantos.nome, detalhe: `os quatro cantos da cartela no ${cat.rotulo}`, ts: tsDe(CANTOS_IDX) });
  if (prog.full && S.cartela) lista.push({ id: `${desafioId}-cheia`, svg: S.cartela.svg, nome: "Cartela Cheia", detalhe: `as 9 missões do ${cat.rotulo}`, ts: tsDe(MISSION_BASE.map((_, i) => i)) });
  // 4 Pacotes de 10 aulas: venda não tem dado no app, concedido manualmente pelo admin
  // Selos concedidos manualmente não têm data exata — ficam sempre no topo (mais "novos").
  if ((concedidos.pacotes4 || {})[chaveAluno] && S.pacotes4) lista.push({ id: `${desafioId}-pacotes4`, svg: S.pacotes4.svg, nome: S.pacotes4.nome, detalhe: "4 pacotes de 10 aulas vendidos, confirmado pela administração", ts: Infinity });
  // Missão Relâmpago: easter egg pra quem ganhou — concedido manualmente (sem dado de vencedor no app ainda)
  if ((concedidos.relampago || {})[chaveAluno] && S.relampago) lista.push({ id: `${desafioId}-relampago`, svg: S.relampago.svg, nome: S.relampago.nome, detalhe: "venceu uma Missão Relâmpago — o ovo de páscoa da temporada 🥚", ts: Infinity });
  // Giro 175: concedido manualmente (cartela cheia + 8 amigos no Ilimitados + 4 pacotes de 10 vendidos)
  if ((concedidos.giro175 || {})[chaveAluno] && S.giro175) lista.push({ id: `${desafioId}-giro175`, svg: S.giro175.svg, nome: "Giro 175", detalhe: "cartela cheia, 8 amigos e 4 pacotes de 10 aulas — o combo raiz", ts: Infinity });
  return lista.sort((a, b) => (b.ts || 0) - (a.ts || 0));
}

// Um selo real (asset do Kittl), giro sutil e cor conforme o tema atual.
function SeloCarimbo({ carimbo, sid, avisar }) {
  const rot = (hash32(carimbo.id + sid) % 10) - 5; // giro sutil, mantém o carimbo legível
  const cor = C.cream; // preto no tema claro, quase-branco no tema escuro — acompanha o app
  return (
    <button title={carimbo.nome} onClick={() => avisar && avisar(`${carimbo.nome} — ${carimbo.detalhe}`)} style={{
      width: "100%", aspectRatio: "1", maxWidth: 84, background: "transparent", border: "none", cursor: "pointer", padding: 0,
      transform: `rotate(${rot}deg)`,
    }} dangerouslySetInnerHTML={{ __html: seloSvgHtml(carimbo.svg, cor) }} />
  );
}

function CarimbosPassaporte({ carimbos, sid, avisar }) {
  const [todos, setTodos] = useState(false);
  const PRIMEIRA_FILEIRA = 5;
  if (!carimbos.length) {
    return (
      <>
        <div style={{
          width: 84, height: 84, borderRadius: "50%", border: `2px dashed ${C.line}`,
          display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.55,
        }}>
          <Ic nome="trofeu" size={30} stroke={1.4} style={{ color: C.mut }} />
        </div>
        <div style={{ color: C.mut, fontSize: 10.5, marginTop: 8 }}>Suas conquistas aparecem aqui assim que você fechar a primeira missão.</div>
      </>
    );
  }
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${PRIMEIRA_FILEIRA}, 1fr)`, gap: 8 }}>
        {(todos ? carimbos : carimbos.slice(0, PRIMEIRA_FILEIRA)).map((e) => (
          <SeloCarimbo key={e.id} carimbo={e} sid={sid} avisar={avisar} />
        ))}
      </div>
      {carimbos.length > PRIMEIRA_FILEIRA && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
          <button onClick={() => setTodos(!todos)} title={todos ? "Ver menos" : "Ver todos os carimbos"} style={{
            width: 34, height: 34, borderRadius: "50%", padding: 0,
            background: C.panelSoft, border: `1px solid ${C.line}`, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", color: C.oak, fontSize: 15,
          }}>{todos ? "︿" : "﹀"}</button>
        </div>
      )}
      <div style={{ color: C.mut, fontSize: 10.5, marginTop: 8 }}>Toque num carimbo pra ver a conquista · mais recentes primeiro.</div>
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
  giro175: `spincycle-comunidade-v1-${UNIDADE}-giro175`,
  pacotes4: `spincycle-comunidade-v1-${UNIDADE}-pacotes4`,
  relampago: `spincycle-comunidade-v1-${UNIDADE}-relampago`,
  indicacoes: `spincycle-comunidade-v1-${UNIDADE}-indicacoes`,
  equipe: `spincycle-comunidade-v1-${UNIDADE}-equipe`,
  gestaoApp: `spincycle-comunidade-v1-${UNIDADE}-gestao-app`,
};

// Regras do programa "Indicar um Amigo" — ticket dourado a cada indicação confirmada.
const METAS_INDICACAO = [
  { qtd: 5, premio: "1 camiseta" },
  { qtd: 10, premio: "bolsinha Spin" },
  { qtd: 15, premio: "boné + camiseta" },
  { qtd: 30, premio: "kit completo (mochila, toalha e garrafa térmica)" },
];
const TOTAL_TICKETS_INDICACAO = 30;

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
const K_MODO_PAINEL = "spincycle-comunidade-modo-painel"; // "web" | "mobile" — só muda quando a pessoa clica

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
// ---------- Radar: progresso incremental (quando cada missão foi fechada) ----------
// Reconstrói a cartela passo a passo, na ordem real dos eventos (aulas + convidados),
// e devolve o momento exato em que cada missão virou "feita". Isso permite dizer
// "essa foi a Nª missão de fulano" e "falta só esta pra fechar tudo".
function progressoIncrementos(student, targets) {
  const recs = (student.records || []).filter((r) => r.status === "ok" && r.reg).map((r) => ({ ...r, _tipo: "rec" }));
  const guests = (student.guests || []).filter((g) => g.status === "ok" && g.reg).map((g) => ({ ...g, _tipo: "guest" }));
  const itens = [...recs, ...guests].sort((a, b) => (a.reg || 0) - (b.reg || 0));
  let doneAnterior = MISSION_BASE.map(() => false);
  const recAcc = [], gAcc = [];
  const out = [];
  itens.forEach((item) => {
    if (item._tipo === "rec") recAcc.push(item); else gAcc.push(item);
    const prog = computeProgress({ records: recAcc, guests: gAcc }, targets);
    prog.done.forEach((v, idx) => {
      if (v && !doneAnterior[idx]) {
        out.push({ ts: item.reg, n: prog.doneCount, missao: MISSION_BASE[idx].name, idx, doneArr: prog.done });
      }
    });
    doneAnterior = prog.done;
  });
  return out;
}

// ---------- Radar: dias corridos de aula dobrada no mesmo dia ----------
function diasComAulaDobrada(student) {
  const recs = (student.records || []).filter((r) => r.status === "ok");
  const porData = {};
  recs.forEach((r) => { (porData[r.date] = porData[r.date] || []).push(r); });
  const dias = [];
  Object.entries(porData).forEach(([data, lista]) => {
    const mins = [...new Set(lista.map((r) => slotMin(r.slot)))].sort((a, b) => a - b);
    let dobrou = false;
    for (let i = 1; i < mins.length; i++) if (mins[i] - mins[i - 1] <= 60) { dobrou = true; break; }
    if (dobrou) {
      const ultimoTs = lista.reduce((m, r) => Math.max(m, r.reg || 0), 0);
      dias.push({ data, ts: ultimoTs });
    }
  });
  return dias;
}

function gerarEventos(allData, gdata) {
  const ev = [];
  TRACKS.forEach((t) => {
    const d = allData[t.id];
    if (!d || !Array.isArray(d.students)) return;
    d.students.forEach((s) => {
      if (s.approved === false) return;
      const nome = firstName(s.name);
      const genero = s.genero === "M" || s.genero === "F" ? s.genero : "F"; // legado sem gênero definido = Feminino, por decisão da Raquel (cadastros novos já vêm com o campo preenchido)
      const recsOk = (s.records || []).filter((r) => r.status === "ok");

      // ---------- 1) Madrugada (Nª vez) ----------
      const madrugas = recsOk.filter((r) => r.slot === "06:15").sort((a, b) => (a.reg || 0) - (b.reg || 0));
      madrugas.forEach((r, i) => {
        const n = i + 1;
        if (n < 2) return;
        const id = `madruga-${t.id}-${s.id}-${n}`;
        const texto = escolherMsgRadar("madrugada", genero, id, { nome, n });
        ev.push({
          id, ts: r.reg || 0, icon: "☕",
          titulo: texto || `🥷 ${nome} acordou às 5h50 pela ${n}ª vez.`,
          corpo: n >= (t.targets.madruga || 5) ? "O Madrugador é dele(a). 🥇" : "O sol nem nasceu e o pedal já girou.",
          sid: s.id, track: t.id,
        });
      });

      // ---------- 2) Convidados trazidos (Nº) ----------
      const gok = (s.guests || []).filter((g) => g.status === "ok").sort((a, b) => (a.reg || 0) - (b.reg || 0));
      gok.forEach((g, i) => {
        const n = i + 1;
        const id = `amigo-${t.id}-${s.id}-${n}`;
        const texto = escolherMsgRadar("convidados", genero, id, { nome, n });
        ev.push({
          id, ts: g.reg || 0, icon: "📣",
          titulo: texto || `👏 ${nome} trouxe o ${n}º convidado.`,
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

      // ---------- 3) Aula dobrada no mesmo dia ----------
      diasComAulaDobrada(s).forEach(({ data, ts }, i) => {
        const id = `dobra-${t.id}-${s.id}-${data}`;
        const texto = escolherMsgRadar("aula_dobrada", genero, id, { nome });
        ev.push({
          id, ts, icon: "🥤",
          titulo: texto || `${nome} fez 2 aulas no mesmo dia.`,
          corpo: "Dose dupla de energia.",
          sid: s.id, track: t.id,
        });
      });

      // ---------- 4/6/7) Progresso de missões, quase-desafio e missão específica ----------
      const incrementos = progressoIncrementos(s, t.targets);
      incrementos.forEach((inc) => {
        if (inc.n >= 9) return; // a 9ª (cartela cheia) tem o evento especial "cheia" abaixo
        const id = `missao-${t.id}-${s.id}-${inc.n}`;
        const texto = escolherMsgRadar("progresso_missao", genero, id, { nome, n: inc.n });
        ev.push({
          id, ts: inc.ts, icon: "🎯",
          titulo: texto || `${nome} completou a missão nº ${inc.n}.`,
          corpo: `${MISSION_BASE[inc.idx].name} concluída.`,
          sid: s.id, track: t.id,
        });

        // Falta só 1 missão pra fechar tudo
        if (inc.n === 8) {
          const faltante = MISSION_BASE.find((m, idx) => !inc.doneArr[idx]);
          if (faltante) {
            const idFalta = `falta1-${t.id}-${s.id}`;
            const textoFalta = escolherMsgRadar("missao_especifica", genero, idFalta, { nome, missao: faltante.name });
            ev.push({
              id: idFalta, ts: inc.ts, icon: "🔔",
              titulo: textoFalta || `${nome}, falta só ${faltante.name} pra fechar tudo!`,
              corpo: "Bora, comunidade, dá aquele empurrão.",
              sid: s.id, track: t.id,
            });
          }
        }

        // Quase completando o desafio (70%+ e ainda não fechou)
        if (inc.n === 7) {
          const pct = Math.round((inc.n / 9) * 100);
          const idPct = `quase-${t.id}-${s.id}`;
          const textoPct = escolherMsgRadar("quase_desafio", genero, idPct, { nome, pct });
          ev.push({
            id: idPct, ts: inc.ts, icon: "📈",
            titulo: textoPct || `${nome} já tá em ${pct}% do desafio!`,
            corpo: "Vamos mandar mensagem de incentivo, minha gente.",
            sid: s.id, track: t.id,
          });
        }
      });

      // ---------- 5) Inatividade (5 / 15 / 30 dias sem check-in) ----------
      const ultimoRegAtivo = recsOk.reduce((m, r) => Math.max(m, r.reg || 0), 0);
      if (ultimoRegAtivo > 0) {
        const dias = Math.floor((Date.now() - ultimoRegAtivo) / 86400000);
        const tier = categoriaInatividade(dias);
        if (tier) {
          const id = `inativ-${t.id}-${s.id}-${tier}`;
          const texto = escolherMsgRadar(tier, genero, id, { nome, dias });
          ev.push({
            id, ts: Date.now(), icon: "📵",
            titulo: texto || `${nome} não faz check-in há ${dias} dias.`,
            corpo: "Vamos mandar um incentivo pra ele(a) voltar.",
            sid: s.id, track: t.id,
          });
        }
      }

      // ---------- 8) Frequência baixa mas constante ----------
      // Critério: pelo menos 3 aulas registradas, presença "espaçada mas nunca
      // sumida" (maior intervalo entre check-ins fica entre 4 e 10 dias) e
      // ainda ativo (última aula há no máximo 10 dias, senão já virou inatividade).
      if (recsOk.length >= 3 && ultimoRegAtivo > 0) {
        const diasDesdeUltima = Math.floor((Date.now() - ultimoRegAtivo) / 86400000);
        const datasOrdenadas = [...new Set(recsOk.map((r) => r.date))].sort();
        let maiorIntervalo = 0;
        for (let i = 1; i < datasOrdenadas.length; i++) {
          const gap = dayIndex(datasOrdenadas[i]) - dayIndex(datasOrdenadas[i - 1]);
          maiorIntervalo = Math.max(maiorIntervalo, gap);
        }
        if (diasDesdeUltima <= 10 && maiorIntervalo >= 4 && maiorIntervalo <= 10) {
          const id = `freqbaixa-${t.id}-${s.id}`;
          const texto = escolherMsgRadar("frequencia_baixa", genero, id, { nome });
          ev.push({
            id, ts: ultimoRegAtivo, icon: "🐢",
            titulo: texto || `${nome} vem no seu ritmo, mas não desiste.`,
            corpo: "Devagar também se chega lá.",
            sid: s.id, track: t.id,
          });
        }
      }

      // ---------- Linhas e cartela cheia (mantidos como já eram) ----------
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

// ============================================================
// SELOS — assets vetoriais reais (Kittl), estilo carimbo vintage.
// SELO_DEFS_HTML fica escondido e é renderizado 1x no topo do app;
// cada selo individual (abaixo) referencia essa textura/símbolos
// compartilhados via url(#...) e <use>, sem duplicar peso.
// ============================================================
const SELO_DEFS_HTML = `<svg aria-hidden="true" style="position:absolute;width:0;height:0;overflow:hidden">
<defs><!-- Pequenas falhas transparentes para simular tinta de carimbo. -->
    <mask id="distress-mask" maskUnits="userSpaceOnUse" x="-225" y="-225" width="450" height="450">
      <rect x="-225" y="-225" width="450" height="450" fill="#fff"/>
      <g fill="#000" opacity=".82">
        <circle cx="-118" cy="-93" r="2.4"/><circle cx="-82" cy="-124" r="1.5"/>
        <circle cx="-28" cy="-137" r="2.2"/><circle cx="24" cy="-128" r="1.4"/>
        <circle cx="92" cy="-103" r="2.7"/><circle cx="131" cy="-56" r="1.8"/>
        <circle cx="143" cy="8" r="2.3"/><circle cx="121" cy="71" r="1.6"/>
        <circle cx="83" cy="121" r="2.8"/><circle cx="18" cy="139" r="1.6"/>
        <circle cx="-45" cy="132" r="2.5"/><circle cx="-104" cy="107" r="1.7"/>
        <circle cx="-139" cy="51" r="2.4"/><circle cx="-143" cy="-16" r="1.7"/>
        <circle cx="-88" cy="-37" r="1.7"/><circle cx="-47" cy="-68" r="2.2"/>
        <circle cx="1" cy="-82" r="1.4"/><circle cx="57" cy="-57" r="2.5"/>
        <circle cx="91" cy="-11" r="1.8"/><circle cx="82" cy="49" r="2.7"/>
        <circle cx="38" cy="83" r="1.9"/><circle cx="-12" cy="71" r="2.1"/>
        <circle cx="-64" cy="78" r="1.5"/><circle cx="-91" cy="29" r="2.6"/>
        <circle cx="-61" cy="4" r="1.3"/><circle cx="-18" cy="-25" r="2.1"/>
        <circle cx="34" cy="-13" r="1.8"/><circle cx="49" cy="31" r="2.4"/>
      </g>
      <g stroke="#000" stroke-linecap="round" opacity=".68">
        <path d="M-151-72l16 4m222-78l14 5m-8 282l17-6M-147 96l14-3" stroke-width="2.2"/>
        <path d="M-74-103l10 3m109-2l12-3M-5 112l16 2M-124 12l11-2" stroke-width="1.6"/>
        <path d="M-68 43l18-4m80 13l15 4M-12-50l13-3m97 35l12 2" stroke-width="2"/>
      </g>
    </mask>

    <filter id="rough-edge" x="-8%" y="-8%" width="116%" height="116%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.018 0.09" numOctaves="2" seed="27" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.15" xChannelSelector="R" yChannelSelector="G"/>
    </filter>

    <polygon id="tiny-star" points="0,-8 2.35,-2.5 8,-2.5 3.7,1.2 5.2,7 0,3.8 -5.2,7 -3.7,1.2 -8,-2.5 -2.35,-2.5"/>

    <g id="wheel" class="icon-line">
      <circle r="49"/><circle r="5" class="icon-fill"/>
      <path d="M0-49V49M-49 0H49M-34.65-34.65l69.3 69.3M34.65-34.65l-69.3 69.3
               M-18.75-45.25l37.5 90.5M18.75-45.25l-37.5 90.5
               M-45.25-18.75l90.5 37.5M-45.25 18.75l90.5-37.5" stroke-width="2.1"/>
    </g></defs>
<style>
.badge { fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; }
    .ink-red, .ink-blue, .ink-black { color: #111111; }
    .stamp-body { mask: url(#distress-mask); filter: url(#rough-edge); }
    .outer-ring { stroke-width: 5.4; stroke-dasharray: 470 8 42 5 125 7; }
    .echo-ring { stroke-width: 1.8; stroke-dasharray: 46 4 118 3 75 5; }
    .inner-ring { stroke-width: 2.2; stroke-dasharray: 3 5; }
    .contour-classic .outer-ring { stroke-width: 5.4; stroke-dasharray: 470 8 42 5 125 7; opacity: .96; }
    .contour-classic .echo-ring { stroke-width: 1.8; stroke-dasharray: 46 4 118 3 75 5; opacity: .9; }
    .contour-worn .outer-ring { stroke-width: 6.4; stroke-dasharray: 79 17 5 12 127 22 3 15 58 10; opacity: .8; }
    .contour-worn .echo-ring { stroke-width: 2.3; stroke-dasharray: 18 8 4 12 49 7 2 10; opacity: .65; }
    .contour-worn > .stamp-body > circle.inner-ring { stroke-dasharray: 1 10 2 15; opacity: .62; }
    .contour-double-dash .outer-ring { stroke-width: 4.7; stroke-dasharray: 20 11; opacity: .96; }
    .contour-double-dash .echo-ring { stroke-width: 3; stroke-dasharray: 8 7; stroke-dashoffset: 4; opacity: .9; }
    .contour-double-dash > .stamp-body > circle.inner-ring { display: none; }
    .label {
      fill: currentColor; stroke: none; font-family: Rockwell, "Roboto Slab", Georgia, serif;
      font-weight: 800; letter-spacing: 2.8px;
    }
    .icon-line { fill: none; stroke: currentColor; stroke-width: 5; stroke-linecap: round; stroke-linejoin: round; }
    .icon-thin { fill: none; stroke: currentColor; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
    .icon-fill { fill: currentColor; stroke: none; }
    .ornament { fill: currentColor; stroke: none; }
    .bottom-arc { stroke-width: 2; stroke-dasharray: 2 9; }
    .label, .bottom-arc, .ornament { display: none; }
</style>
</svg>`;

const SELO_SVG = {
  dobradinha: { vb: 340, svg: `<g id="badge-dobradinha" class="badge contour-classic">
    <path id="arc-dobradinha" d="M-120 28A124 124 0 0 1 120 28" fill="none" stroke="none"/>
    <g class="stamp-body">
      <circle class="outer-ring" r="151"/><circle class="echo-ring" r="143"/><circle class="inner-ring" r="127"/>
      <text class="label" x="0" y="-79" text-anchor="middle" font-size="25">DOBRADINHA</text>
      <g transform="translate(-40 0) scale(1.12)"><use href="#wheel" xlink:href="#wheel"/></g>
      <g transform="translate(40 0) scale(1.12)"><use href="#wheel" xlink:href="#wheel"/></g>
      <path class="bottom-arc" d="M-88 96Q0 132 88 96"/>
      <use class="ornament" href="#tiny-star" xlink:href="#tiny-star" transform="translate(-31 113) scale(.72)"/>
      <use class="ornament" href="#tiny-star" xlink:href="#tiny-star" transform="translate(0 119) scale(.82)"/>
      <use class="ornament" href="#tiny-star" xlink:href="#tiny-star" transform="translate(31 113) scale(.72)"/>
    </g>
  </g>` },
  madrugador: { vb: 340, svg: `<g id="badge-madrugador" class="badge contour-worn">
    <path id="arc-madrugador" d="M-120 28A124 124 0 0 1 120 28" fill="none" stroke="none"/>
    <g class="stamp-body">
      <circle class="outer-ring" r="151"/><circle class="echo-ring" r="143"/><circle class="inner-ring" r="127"/>
      <text class="label" x="0" y="-79" text-anchor="middle" font-size="25">MADRUGADOR</text>
      <path class="icon-fill" transform="translate(0 -9) scale(1.26)" d="M-50 55A50 50 0 0 1 50 55Z"/>
      <g class="icon-line" transform="translate(0 -9) scale(1.26)">
        <path d="M-82 56H82"/>
        <path d="M0-31V-11M-55-12l14 15M55-12L41 3M-82 25l20 6M82 25l-20 6"/>
      </g>
      <path class="bottom-arc" d="M-88 94Q0 130 88 94"/>
      <use class="ornament" href="#tiny-star" xlink:href="#tiny-star" transform="translate(-31 112) scale(.72)"/>
      <use class="ornament" href="#tiny-star" xlink:href="#tiny-star" transform="translate(0 118) scale(.82)"/>
      <use class="ornament" href="#tiny-star" xlink:href="#tiny-star" transform="translate(31 112) scale(.72)"/>
    </g>
  </g>` },
  maratonista: { vb: 340, svg: `<g id="badge-maratonista" class="badge contour-double-dash">
    <path id="arc-maratonista" d="M-120 28A124 124 0 0 1 120 28" fill="none" stroke="none"/>
    <g class="stamp-body">
      <circle class="outer-ring" r="151"/><circle class="echo-ring" r="143"/><circle class="inner-ring" r="127"/>
      <text class="label" x="0" y="-79" text-anchor="middle" font-size="24">MARATONISTA</text>
      <g transform="translate(0 0) scale(1.72)"><use href="#wheel" xlink:href="#wheel"/></g>
      <path class="bottom-arc" d="M-88 96Q0 132 88 96"/>
      <use class="ornament" href="#tiny-star" xlink:href="#tiny-star" transform="translate(-31 113) scale(.72)"/>
      <use class="ornament" href="#tiny-star" xlink:href="#tiny-star" transform="translate(0 119) scale(.82)"/>
      <use class="ornament" href="#tiny-star" xlink:href="#tiny-star" transform="translate(31 113) scale(.72)"/>
    </g>
  </g>` },
  semana_perfeita: { vb: 340, svg: `<g id="badge-semana-perfeita" class="badge contour-classic">
    <path id="arc-semana" d="M-120 28A124 124 0 0 1 120 28" fill="none" stroke="none"/>
    <g class="stamp-body">
      <circle class="outer-ring" r="151"/><circle class="echo-ring" r="143"/><circle class="inner-ring" r="127"/>
      <text class="label" x="0" y="-79" text-anchor="middle" font-size="19">SEMANA PERFEITA</text>
      <g class="icon-line" transform="translate(-5 0) scale(1.08)" stroke-width="6">
        <path d="M-102 1l10 12 18-27"/><path d="M-71 1l10 12 18-27"/>
        <path d="M-40 1l10 12 18-27"/><path d="M-9 1L1 13l18-27"/>
        <path d="M22 1l10 12 18-27"/><path d="M53 1l10 12 18-27"/>
        <path d="M84 1l10 12 18-27"/>
      </g>
      <path class="bottom-arc" d="M-88 82Q0 121 88 82"/>
      <use class="ornament" href="#tiny-star" xlink:href="#tiny-star" transform="translate(-31 105) scale(.72)"/>
      <use class="ornament" href="#tiny-star" xlink:href="#tiny-star" transform="translate(0 112) scale(.82)"/>
      <use class="ornament" href="#tiny-star" xlink:href="#tiny-star" transform="translate(31 105) scale(.72)"/>
    </g>
  </g>` },
  troca_a_base: { vb: 340, svg: `<g id="badge-troca-a-base" class="badge contour-worn">
    <path id="arc-troca" d="M-120 28A124 124 0 0 1 120 28" fill="none" stroke="none"/>
    <g class="stamp-body">
      <circle class="outer-ring" r="151"/><circle class="echo-ring" r="143"/><circle class="inner-ring" r="127"/>
      <text class="label" x="0" y="-79" text-anchor="middle" font-size="23">TROCA A BASE</text>
      <g class="icon-fill" transform="translate(0 -22) scale(1.2)">
        <path d="M-82-25H43v-22l46 37-46 37V5H-82Z"/>
        <path d="M82 34H-43v22l-46-37 46-37V4H82Z" transform="translate(0 34)"/>
      </g>
      <path class="bottom-arc" d="M-88 96Q0 132 88 96"/>
      <use class="ornament" href="#tiny-star" xlink:href="#tiny-star" transform="translate(-31 113) scale(.72)"/>
      <use class="ornament" href="#tiny-star" xlink:href="#tiny-star" transform="translate(0 119) scale(.82)"/>
      <use class="ornament" href="#tiny-star" xlink:href="#tiny-star" transform="translate(31 113) scale(.72)"/>
    </g>
  </g>` },
  fim_de_semana_raiz: { vb: 340, svg: `<g id="badge-fim-de-semana-raiz" class="badge contour-double-dash">
    <path id="arc-fim-semana" d="M-120 28A124 124 0 0 1 120 28" fill="none" stroke="none"/>
    <g class="stamp-body">
      <circle class="outer-ring" r="151"/><circle class="echo-ring" r="143"/><circle class="inner-ring" r="127"/>
      <text class="label" x="0" y="-79" text-anchor="middle" font-size="17">FIM DE SEMANA RAIZ</text>
      <g class="icon-line" transform="translate(0 -5) scale(1.08)">
        <circle cx="-55" cy="0" r="29"/><circle cx="55" cy="0" r="29"/>
        <path d="M-55 0l34-39L0 0Zm55 0l30-39 25 39M-21-39h51M-29-45h-23M30-39l10-15h19"/>
        <circle cx="0" cy="0" r="5" class="icon-fill"/>
        <path d="M-82 48q20-15 41 0t41 0 41 0 41 0"/>
        <path d="M-82 67q20-15 41 0t41 0 41 0 41 0"/>
        <path d="M-82 86q20-15 41 0t41 0 41 0 41 0"/>
      </g>
      <path class="bottom-arc" d="M-87 98Q0 129 87 98"/>
      <use class="ornament" href="#tiny-star" xlink:href="#tiny-star" transform="translate(-18 113) scale(.7)"/>
      <use class="ornament" href="#tiny-star" xlink:href="#tiny-star" transform="translate(18 113) scale(.7)"/>
    </g>
  </g>` },
  giro_na_grade: { vb: 340, svg: `<g id="badge-giro-na-grade" class="badge contour-classic">
    <path id="arc-giro" d="M-120 28A124 124 0 0 1 120 28" fill="none" stroke="none"/>
    <g class="stamp-body">
      <circle class="outer-ring" r="151"/><circle class="echo-ring" r="143"/><circle class="inner-ring" r="127"/>
      <text class="label" x="0" y="-79" text-anchor="middle" font-size="21">GIRO NA GRADE</text>
      <g class="icon-line" transform="translate(0 0) scale(1.4)">
        <circle r="62"/>
        <path d="M0-52v10M0 42v10M-52 0h10M42 0h10" stroke-width="3"/>
        <path d="M0 0V-34M0 0l31 24" stroke-width="6"/>
        <circle r="6" class="icon-fill"/>
      </g>
      <path class="bottom-arc" d="M-88 96Q0 132 88 96"/>
      <use class="ornament" href="#tiny-star" xlink:href="#tiny-star" transform="translate(-31 113) scale(.72)"/>
      <use class="ornament" href="#tiny-star" xlink:href="#tiny-star" transform="translate(0 119) scale(.82)"/>
      <use class="ornament" href="#tiny-star" xlink:href="#tiny-star" transform="translate(31 113) scale(.72)"/>
    </g>
  </g>` },
  sequencia_de_fogo: { vb: 340, svg: `<g id="badge-sequencia-de-fogo" class="badge contour-worn">
    <path id="arc-fogo" d="M-120 28A124 124 0 0 1 120 28" fill="none" stroke="none"/>
    <g class="stamp-body">
      <circle class="outer-ring" r="151"/><circle class="echo-ring" r="143"/><circle class="inner-ring" r="127"/>
      <text class="label" x="0" y="-79" text-anchor="middle" font-size="17">SEQUÊNCIA DE FOGO</text>
      <path class="icon-fill" transform="translate(0 -5) scale(1.18)" d="M2-67c4 28-8 38-17 52-7-20-22-29-22-29 5 28-34 43-22 83 9 31 34 51 61 51 36 0 67-27 67-64 0-31-17-58-45-80 2 21-3 33-10 43C12-32 2-67 2-67Zm-4 126c-15 0-27-12-27-28 0-12 8-22 18-34 0 13 7 18 12 25 7-10 13-19 14-32 14 12 22 26 22 41 0 16-12 28-27 28Z"/>
      <path class="bottom-arc" d="M-88 100Q0 132 88 100"/>
      <use class="ornament" href="#tiny-star" xlink:href="#tiny-star" transform="translate(-30 115) scale(.7)"/>
      <use class="ornament" href="#tiny-star" xlink:href="#tiny-star" transform="translate(30 115) scale(.7)"/>
    </g>
  </g>` },
  chama_a_galera: { vb: 340, svg: `<g id="badge-chama-a-galera" class="badge contour-double-dash">
    <path id="arc-galera" d="M-120 28A124 124 0 0 1 120 28" fill="none" stroke="none"/>
    <g class="stamp-body">
      <circle class="outer-ring" r="151"/><circle class="echo-ring" r="143"/><circle class="inner-ring" r="127"/>
      <text class="label" x="0" y="-79" text-anchor="middle" font-size="20">CHAMA A GALERA</text>
      <g class="icon-fill" transform="translate(0 -10) scale(1.17)">
        <circle cx="-38" cy="-18" r="25"/><circle cx="38" cy="-18" r="25"/>
        <path d="M-91 68c0-38 22-63 53-63S15 30 15 68Z"/>
        <path d="M-15 68c0-38 22-63 53-63S91 30 91 68Z"/>
      </g>
      <path class="bottom-arc" d="M-88 96Q0 132 88 96"/>
      <use class="ornament" href="#tiny-star" xlink:href="#tiny-star" transform="translate(-31 113) scale(.72)"/>
      <use class="ornament" href="#tiny-star" xlink:href="#tiny-star" transform="translate(0 119) scale(.82)"/>
      <use class="ornament" href="#tiny-star" xlink:href="#tiny-star" transform="translate(31 113) scale(.72)"/>
    </g>
  </g>` },
  linha_da_cartela: { vb: 340, svg: `<g id="badge-linha-da-cartela" class="badge contour-worn">
    <path id="arc-linha" d="M-120 28A124 124 0 0 1 120 28" fill="none" stroke="none"/>
    <g class="stamp-body">
      <circle class="outer-ring" r="151"/><circle class="echo-ring" r="143"/><circle class="inner-ring" r="127"/>
      <text class="label" x="0" y="-79" text-anchor="middle" font-size="18">LINHA DA CARTELA</text>
      <g class="icon-line" transform="translate(0 0) scale(1.27)">
        <rect x="-88" y="-31" width="50" height="58"/><path d="M-82-24l38 44M-44-24l-38 44"/>
        <rect x="-25" y="-31" width="50" height="58"/><path d="M-19-24l38 44M19-24l-38 44"/>
        <rect x="38" y="-31" width="50" height="58"/><path d="M44-24l38 44M82-24L44 20"/>
      </g>
      <path class="bottom-arc" d="M-88 88Q0 126 88 88"/>
      <use class="ornament" href="#tiny-star" xlink:href="#tiny-star" transform="translate(-31 108) scale(.72)"/>
      <use class="ornament" href="#tiny-star" xlink:href="#tiny-star" transform="translate(0 115) scale(.82)"/>
      <use class="ornament" href="#tiny-star" xlink:href="#tiny-star" transform="translate(31 108) scale(.72)"/>
    </g>
  </g>` },
  quatro_cantos: { vb: 340, svg: `<g id="badge-quatro-cantos" class="badge contour-classic">
    <g class="stamp-body">
      <circle class="outer-ring" r="151"/><circle class="echo-ring" r="143"/><circle class="inner-ring" r="127"/>
      <g class="icon-line" stroke-width="10">
        <path d="M-31-88H-88v57M31-88h57v57M-88 31v57h57M88 31v57H31"/>
      </g>
    </g>
  </g>` },
  linha_vertical: { vb: 340, svg: `<g id="badge-linha-vertical" class="badge contour-double-dash">
    <g class="stamp-body">
      <circle class="outer-ring" r="151"/><circle class="echo-ring" r="143"/><circle class="inner-ring" r="127"/>
      <g class="icon-line" transform="scale(1.27)">
        <rect x="-25" y="-88" width="50" height="50"/><path d="M-19-82l38 38M19-82l-38 38"/>
        <rect x="-25" y="-25" width="50" height="50"/><path d="M-19-19l38 38M19-19l-38 38"/>
        <rect x="-25" y="38" width="50" height="50"/><path d="M-19 44l38 38M19 44l-38 38"/>
      </g>
    </g>
  </g>` },
  linha_transversal: { vb: 340, svg: `<g id="badge-linha-transversal" class="badge contour-double-dash">
    <g class="stamp-body">
      <circle class="outer-ring" r="151"/><circle class="echo-ring" r="143"/><circle class="inner-ring" r="127"/>
      <g class="icon-line" transform="scale(1.2)">
        <rect x="-82" y="31" width="50" height="50"/><path d="M-76 37l38 38M-38 37l-38 38"/>
        <rect x="-25" y="-25" width="50" height="50"/><path d="M-19-19l38 38M19-19l-38 38"/>
        <rect x="32" y="-81" width="50" height="50"/><path d="M38-75l38 38M76-75L38-37"/>
      </g>
    </g>
  </g>` },
  cartela_cheia: { vb: 420, svg: `<g id="badge-cartela-cheia" class="badge contour-classic">
    <path id="arc-cheia" d="M-143 35A148 148 0 0 1 143 35" fill="none" stroke="none"/>
    <g class="stamp-body">
      <circle class="outer-ring" r="184" stroke-width="7"/>
      <circle class="echo-ring" r="174"/><circle class="inner-ring" r="154"/>
      <text class="label" x="0" y="-109" text-anchor="middle" font-size="27">CARTELA CHEIA</text>
      <circle cx="0" cy="0" r="106" stroke-width="5"/>
      <circle cx="0" cy="0" r="92" class="inner-ring"/>
      <path class="icon-fill" d="M0-38l18 42 46 4-35 30 11 45L0 59l-40 24 11-45-35-30 46-4Z" transform="translate(0 -7) scale(1.16)"/>
      <path class="icon-fill" d="M-68 104l-8 105 39-30 28 42 15-106Z"/>
      <path class="icon-fill" d="M68 104l8 105-39-30-28 42-15-106Z"/>
      <path class="icon-thin" d="M-120 116Q0 164 120 116"/>
      <use class="ornament" href="#tiny-star" xlink:href="#tiny-star" transform="translate(-134 72) scale(1.05)"/>
      <use class="ornament" href="#tiny-star" xlink:href="#tiny-star" transform="translate(134 72) scale(1.05)"/>
    </g>
  </g>` },
  giro_175: { vb: 420, svg: `<g id="badge-giro-175" class="badge contour-worn">
    <g class="stamp-body">
      <circle class="outer-ring" r="184" stroke-width="7"/>
      <circle class="echo-ring" r="174"/><circle class="inner-ring" r="154"/>
      <use class="icon-fill" href="#tiny-star" xlink:href="#tiny-star" transform="translate(-95 -92) scale(1.7)"/>
      <use class="icon-fill" href="#tiny-star" xlink:href="#tiny-star" transform="translate(95 -92) scale(1.7)"/>
      <use class="icon-fill" href="#tiny-star" xlink:href="#tiny-star" transform="translate(-112 65) scale(1.7)"/>
      <use class="icon-fill" href="#tiny-star" xlink:href="#tiny-star" transform="translate(112 65) scale(1.7)"/>
      <circle cx="0" cy="0" r="106" stroke-width="5"/>
      <circle cx="0" cy="0" r="92" class="inner-ring"/>
      <text x="0" y="18" text-anchor="middle" font-family="Rockwell, &quot;Roboto Slab&quot;, Georgia, serif" font-weight="800" font-size="78" class="icon-fill">175</text>
      <path class="icon-line" stroke-width="6" fill="none" d="M-58 62h24l9-19 13 34 11-23 8 8h27"/>
      <path class="icon-line" d="M-68 104l-8 105 39-30 28 42 15-106Z"/>
      <path class="icon-line" d="M68 104l8 105-39-30-28 42-15-106Z"/>
      <path class="icon-thin" d="M-120 116Q0 164 120 116"/>
    </g>
  </g>` },
  ingresso: { vb: 340, svg: `<g id="badge-ingresso" class="badge contour-classic">
    <g class="stamp-body">
      <circle class="outer-ring" r="151"/><circle class="echo-ring" r="143"/><circle class="inner-ring" r="127"/>
      <g class="icon-line" transform="rotate(-10) scale(1.12)" stroke-width="5">
        <path d="M-91-50H91v29c-15 0-15 24 0 24v47H-91V21c15 0 15-24 0-24Z"/>
        <path d="M-48-50V50M48-50V50" stroke-width="3" stroke-dasharray="4 9"/>
        <path class="icon-fill" stroke="none" d="M0-25l7 17 19 2-14 12 4 19L0 15l-16 10 4-19-14-12 19-2Z"/>
        <path d="M-76-34h15M-76 34h15M61-34h15M61 34h15" stroke-width="3"/>
      </g>
    </g>
  </g>` },
  ovo_surpresa: { vb: 340, svg: `<g id="badge-ovo-surpresa" class="badge contour-double-dash">
    <g class="stamp-body">
      <circle class="outer-ring" r="151"/><circle class="echo-ring" r="143"/><circle class="inner-ring" r="127"/>
      <g class="icon-line" stroke-width="5">
        <path d="M0-104C-53-96-78-37-75 20c3 58 32 94 75 94s72-36 75-94C78-37 53-96 0-104Z"/>
        <path d="M-58-56q14-15 28 0t28 0 28 0 28 0"/>
        <path d="M-68-24l18 17 18-17 18 17 18-17L22-7l18-17L58-7"/>
        <path d="M-73 18Q0 42 73 18M-72 48Q0 26 72 48"/>
        <circle class="icon-fill" cx="-43" cy="34" r="6"/><circle class="icon-fill" cx="-14" cy="39" r="6"/>
        <circle class="icon-fill" cx="15" cy="39" r="6"/><circle class="icon-fill" cx="44" cy="34" r="6"/>
        <path d="M-58 72q14-15 28 0t28 0 28 0 28 0"/>
      </g>
    </g>
  </g>` },
};
// Um selo isolado: monta o svg pronto (com a cor certa pro tema atual) via dangerouslySetInnerHTML,
// porque o asset vem direto do Kittl (marcações como xlink:href não existem em JSX puro).
function seloSvgHtml(chaveSvg, cor) {
  const s = SELO_SVG[chaveSvg];
  if (!s) return "";
  const vbAttr = s.viewBox || `-${s.vb / 2} -${s.vb / 2} ${s.vb} ${s.vb}`;
  return `<svg viewBox="${vbAttr}" width="100%" height="100%" style="color:${cor}">${s.svg}</svg>`;
}
// ---------- Ícone da Arena (silhueta de estádio, vetor original enviado pela Raquel) ----------
const ARENA_SVG_INNER = `<defs><clipPath id="370515748d"><path d="M 243.078125 557 L 346 557 L 346 653 L 243.078125 653 Z M 243.078125 557 " clip-rule="nonzero"/></clipPath><clipPath id="132d6f9325"><path d="M 243.078125 495 L 559 495 L 559 607 L 243.078125 607 Z M 243.078125 495 " clip-rule="nonzero"/></clipPath><clipPath id="a6472661c2"><path d="M 369 604 L 432 604 L 432 657.457031 L 369 657.457031 Z M 369 604 " clip-rule="nonzero"/></clipPath><clipPath id="fd066ef5ba"><path d="M 243.078125 354.605469 L 566.921875 354.605469 L 566.921875 489 L 243.078125 489 Z M 243.078125 354.605469 " clip-rule="nonzero"/></clipPath></defs><path fill="currentColor" d="M 321.117188 539.6875 L 321.117188 513.707031 C 312.308594 519.179688 305.132812 525.597656 300.136719 532.75 C 306.699219 535.324219 313.722656 537.636719 321.117188 539.6875 Z M 321.117188 539.6875 " fill-opacity="1" fill-rule="nonzero"/><g clip-path="url(#370515748d)"><path fill="currentColor" d="M 243.179688 557.117188 L 243.179688 583.238281 C 243.179688 615.054688 285.910156 642.253906 345.753906 652.785156 L 345.753906 611.957031 C 294.332031 603.027344 256.46875 582.234375 243.179688 557.117188 Z M 243.179688 557.117188 " fill-opacity="1" fill-rule="nonzero"/></g><path fill="currentColor" d="M 326.335938 541.082031 C 347.78125 546.519531 372.199219 549.667969 398.113281 549.867188 L 398.113281 512.09375 L 326.335938 512.09375 Z M 326.335938 541.082031 " fill-opacity="1" fill-rule="nonzero"/><path fill="currentColor" d="M 538.761719 511.402344 C 530.4375 480.671875 470.378906 456.777344 400.722656 456.777344 C 331.035156 456.777344 271.007812 480.664062 262.679688 511.402344 C 266.511719 514.675781 270.863281 517.792969 275.664062 520.742188 C 289.746094 491.175781 341.496094 470 400.722656 470 C 459.949219 470 511.695312 491.175781 525.785156 520.742188 C 530.582031 517.792969 534.933594 514.675781 538.761719 511.402344 Z M 538.761719 511.402344 " fill-opacity="1" fill-rule="nonzero"/><path fill="currentColor" d="M 475.109375 512.09375 L 403.332031 512.09375 L 403.332031 549.867188 C 429.246094 549.664062 453.660156 546.519531 475.109375 541.082031 Z M 475.109375 512.09375 " fill-opacity="1" fill-rule="nonzero"/><path fill="currentColor" d="M 521.253906 523.398438 C 508.390625 495.359375 458.34375 475.210938 400.722656 475.210938 C 343.097656 475.210938 293.050781 495.359375 280.191406 523.398438 C 284.84375 526.003906 289.851562 528.457031 295.207031 530.738281 C 312.179688 505.359375 354.164062 488.433594 400.722656 488.433594 C 447.28125 488.433594 489.265625 505.359375 506.238281 530.738281 C 511.59375 528.460938 516.601562 526.003906 521.253906 523.398438 Z M 521.253906 523.398438 " fill-opacity="1" fill-rule="nonzero"/><path fill="currentColor" d="M 480.324219 513.707031 L 480.324219 539.6875 C 487.722656 537.636719 494.746094 535.324219 501.308594 532.75 C 496.3125 525.597656 489.132812 519.179688 480.324219 513.707031 Z M 480.324219 513.707031 " fill-opacity="1" fill-rule="nonzero"/><path fill="currentColor" d="M 467.40625 506.875 C 448.761719 498.511719 425.445312 493.65625 400.722656 493.65625 C 375.996094 493.65625 352.679688 498.511719 334.035156 506.875 Z M 467.40625 506.875 " fill-opacity="1" fill-rule="nonzero"/><path fill="currentColor" d="M 553.292969 494.210938 C 535.265625 461.261719 472.890625 438.339844 400.722656 438.339844 C 328.558594 438.339844 266.179688 461.261719 248.148438 494.210938 C 250.679688 498.832031 254.148438 503.277344 258.429688 507.507812 C 269.808594 475.339844 329.460938 451.5625 400.722656 451.5625 C 471.953125 451.5625 531.632812 475.34375 543.015625 507.507812 C 547.292969 503.277344 550.761719 498.832031 553.292969 494.210938 Z M 553.292969 494.210938 " fill-opacity="1" fill-rule="nonzero"/><path fill="currentColor" d="M 431.519531 564.332031 C 429.5625 564.332031 427.96875 565.917969 427.96875 567.871094 C 427.96875 569.820312 429.5625 571.40625 431.519531 571.40625 C 433.480469 571.40625 435.070312 569.820312 435.070312 567.871094 C 435.070312 565.921875 433.480469 564.332031 431.519531 564.332031 Z M 431.519531 564.332031 " fill-opacity="1" fill-rule="nonzero"/><g clip-path="url(#132d6f9325)"><path fill="currentColor" d="M 543.890625 513.433594 C 543.625 513.878906 543.210938 514.207031 542.722656 514.433594 C 538.015625 518.523438 532.609375 522.402344 526.546875 526.007812 C 526.269531 526.359375 525.933594 526.667969 525.484375 526.84375 C 525.289062 526.917969 525.089844 526.929688 524.890625 526.957031 C 519.378906 530.132812 513.363281 533.089844 506.910156 535.804688 C 506.789062 535.914062 506.695312 536.050781 506.550781 536.140625 C 506.160156 536.378906 505.738281 536.464844 505.3125 536.484375 C 497.164062 539.828125 488.347656 542.792969 478.960938 545.316406 C 478.585938 545.523438 478.175781 545.675781 477.714844 545.675781 C 477.695312 545.675781 477.679688 545.664062 477.660156 545.660156 C 454.734375 551.691406 428.535156 555.117188 400.722656 555.117188 C 372.910156 555.117188 346.710938 551.691406 323.785156 545.660156 C 323.765625 545.660156 323.746094 545.675781 323.726562 545.675781 C 323.265625 545.675781 322.855469 545.523438 322.480469 545.316406 C 313.128906 542.800781 304.339844 539.851562 296.21875 536.519531 C 295.765625 536.515625 295.304688 536.394531 294.890625 536.144531 C 294.746094 536.054688 294.652344 535.917969 294.53125 535.808594 C 288.070312 533.085938 282.046875 530.128906 276.53125 526.949219 C 276.339844 526.917969 276.144531 526.921875 275.953125 526.847656 C 275.507812 526.671875 275.171875 526.359375 274.894531 526.007812 C 268.914062 522.457031 263.582031 518.636719 258.925781 514.609375 C 258.28125 514.386719 257.78125 513.945312 257.484375 513.371094 C 251.40625 507.890625 246.625 502.027344 243.304688 495.871094 C 243.261719 495.820312 243.21875 495.78125 243.179688 495.730469 L 243.179688 537.140625 C 243.179688 568.058594 284.273438 595.792969 345.753906 606.660156 L 345.753906 583.238281 C 345.753906 581.800781 346.925781 580.632812 348.363281 580.632812 L 453.078125 580.632812 C 454.515625 580.632812 455.683594 581.800781 455.683594 583.238281 L 455.683594 606.660156 C 517.167969 595.792969 558.261719 568.058594 558.261719 537.140625 L 558.261719 495.730469 C 558.222656 495.78125 558.179688 495.820312 558.136719 495.863281 C 554.808594 502.042969 550.003906 507.933594 543.890625 513.433594 Z M 369.921875 576.628906 C 365.089844 576.628906 361.15625 572.703125 361.15625 567.875 C 361.15625 563.042969 365.089844 559.117188 369.921875 559.117188 C 374.757812 559.117188 378.691406 563.046875 378.691406 567.875 C 378.691406 572.699219 374.757812 576.628906 369.921875 576.628906 Z M 400.722656 576.628906 C 395.886719 576.628906 391.957031 572.703125 391.957031 567.875 C 391.957031 563.042969 395.886719 559.117188 400.722656 559.117188 C 405.558594 559.117188 409.492188 563.046875 409.492188 567.875 C 409.492188 572.699219 405.554688 576.628906 400.722656 576.628906 Z M 431.519531 576.628906 C 426.683594 576.628906 422.753906 572.703125 422.753906 567.875 C 422.753906 563.042969 426.683594 559.117188 431.519531 559.117188 C 436.355469 559.117188 440.289062 563.046875 440.289062 567.875 C 440.289062 572.699219 436.355469 576.628906 431.519531 576.628906 Z M 431.519531 576.628906 " fill-opacity="1" fill-rule="nonzero"/></g><path fill="currentColor" d="M 400.722656 564.332031 C 398.765625 564.332031 397.171875 565.917969 397.171875 567.871094 C 397.171875 569.820312 398.765625 571.40625 400.722656 571.40625 C 402.679688 571.40625 404.273438 569.820312 404.273438 567.871094 C 404.273438 565.921875 402.679688 564.332031 400.722656 564.332031 Z M 400.722656 564.332031 " fill-opacity="1" fill-rule="nonzero"/><path fill="currentColor" d="M 350.972656 653.640625 C 355.3125 654.324219 359.734375 654.917969 364.234375 655.421875 L 364.234375 601.675781 C 364.234375 600.238281 365.402344 599.070312 366.839844 599.070312 L 434.601562 599.070312 C 436.039062 599.070312 437.207031 600.238281 437.207031 601.675781 L 437.207031 655.425781 C 441.707031 654.917969 446.128906 654.324219 450.472656 653.644531 L 450.472656 585.847656 L 350.972656 585.847656 Z M 350.972656 653.640625 " fill-opacity="1" fill-rule="nonzero"/><path fill="currentColor" d="M 455.6875 611.957031 L 455.6875 652.789062 C 515.53125 642.257812 558.265625 615.058594 558.265625 583.238281 L 558.265625 557.117188 C 544.976562 582.234375 507.109375 603.027344 455.6875 611.957031 Z M 455.6875 611.957031 " fill-opacity="1" fill-rule="nonzero"/><g clip-path="url(#a6472661c2)"><path fill="currentColor" d="M 369.453125 655.980469 C 379.5625 656.945312 390.015625 657.457031 400.722656 657.457031 C 411.425781 657.457031 421.882812 656.945312 431.992188 655.980469 L 431.992188 604.285156 L 369.453125 604.285156 Z M 369.453125 655.980469 " fill-opacity="1" fill-rule="nonzero"/></g><path fill="currentColor" d="M 369.921875 564.332031 C 367.964844 564.332031 366.371094 565.917969 366.371094 567.871094 C 366.371094 569.820312 367.964844 571.40625 369.921875 571.40625 C 371.882812 571.40625 373.476562 569.820312 373.476562 567.871094 C 373.476562 565.921875 371.882812 564.332031 369.921875 564.332031 Z M 369.921875 564.332031 " fill-opacity="1" fill-rule="nonzero"/><g clip-path="url(#fd066ef5ba)"><path fill="currentColor" d="M 566.523438 401.480469 C 566.328125 400.34375 565.410156 399.472656 564.265625 399.335938 C 559.203125 398.722656 554.152344 397.714844 549.261719 396.339844 C 546.21875 395.484375 543.1875 394.480469 540.253906 393.347656 C 539.449219 393.035156 538.546875 393.144531 537.839844 393.628906 C 537.128906 394.117188 536.707031 394.917969 536.707031 395.78125 L 536.707031 414.164062 C 536.707031 414.203125 536.707031 414.238281 536.707031 414.273438 L 536.707031 438.273438 C 509.746094 416.605469 460.160156 401.929688 403.328125 401.492188 L 403.328125 377.527344 L 426.523438 365.953125 C 427.554688 365.441406 428.125 364.3125 427.929688 363.175781 C 427.734375 362.042969 426.816406 361.171875 425.671875 361.03125 C 420.609375 360.417969 415.558594 359.410156 410.664062 358.039062 C 407.640625 357.1875 404.609375 356.179688 401.660156 355.039062 C 400.859375 354.730469 399.957031 354.835938 399.246094 355.320312 C 398.539062 355.808594 398.113281 356.617188 398.113281 357.472656 L 398.113281 375.859375 C 398.113281 375.894531 398.113281 375.933594 398.113281 375.96875 L 398.113281 401.492188 C 341.28125 401.929688 291.695312 416.605469 264.738281 438.269531 L 264.738281 415.828125 L 287.933594 404.257812 C 288.964844 403.746094 289.535156 402.613281 289.339844 401.480469 C 289.144531 400.34375 288.226562 399.472656 287.082031 399.335938 C 282.019531 398.722656 276.96875 397.714844 272.078125 396.339844 C 269.035156 395.484375 266.003906 394.480469 263.070312 393.347656 C 262.265625 393.035156 261.363281 393.144531 260.65625 393.628906 C 259.945312 394.117188 259.523438 394.917969 259.523438 395.78125 L 259.523438 414.164062 C 259.523438 414.203125 259.523438 414.238281 259.523438 414.273438 L 259.523438 442.8125 C 249.078125 452.726562 243.179688 463.882812 243.179688 475.679688 C 243.179688 480.019531 244.019531 484.265625 245.542969 488.402344 C 266.667969 455.628906 329.128906 433.121094 400.722656 433.121094 C 472.316406 433.121094 534.777344 455.628906 555.898438 488.402344 C 557.425781 484.265625 558.265625 480.019531 558.265625 475.679688 C 558.265625 463.882812 552.363281 452.726562 541.921875 442.8125 L 541.921875 415.828125 L 565.117188 404.257812 C 566.144531 403.746094 566.71875 402.613281 566.523438 401.480469 Z M 419.199219 426.507812 L 382.242188 426.507812 L 382.242188 408.070312 L 419.199219 408.070312 Z M 419.199219 426.507812 " fill-opacity="1" fill-rule="nonzero"/></g>`;
function IconeArena({ size = 24, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 810 1012.49997" style={{ display: "block", ...style }}
      dangerouslySetInnerHTML={{ __html: ARENA_SVG_INNER }} />
  );
}

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
  const [abrirPicker, setAbrirPicker] = useState(false);
  const pickerRef = useRef(null);
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

  const minhaReacao = minhaChave ? REACTS.find((e) => (doPost[e] || []).includes(minhaChave)) : null;
  const totalReacoes = REACTS.reduce((soma, e) => soma + (doPost[e] || []).length, 0);
  const resumoPorEmoji = REACTS.map((e) => ({ e, n: (doPost[e] || []).length })).filter((x) => x.n > 0);

  useEffect(() => {
    if (!abrirPicker) return;
    const aoClicarFora = (ev) => { if (pickerRef.current && !pickerRef.current.contains(ev.target)) setAbrirPicker(false); };
    document.addEventListener("mousedown", aoClicarFora);
    document.addEventListener("touchstart", aoClicarFora);
    return () => {
      document.removeEventListener("mousedown", aoClicarFora);
      document.removeEventListener("touchstart", aoClicarFora);
    };
  }, [abrirPicker]);

  return (
    <div style={{ position: "absolute", bottom: 0, right: 12, display: "flex", alignItems: "flex-end", gap: 8 }}>
      {onResp && (
        <span style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
          {bolinha(<Ic nome="balao" size={16} stroke={1.9} />, onResp, false)}
          <span style={{
            fontSize: 10, fontWeight: 700, minHeight: 12, lineHeight: 1.2,
            color: respCount ? C.oak : "transparent",
          }}>{respCount || "0"}</span>
        </span>
      )}

      {resumoPorEmoji.length > 0 && (
        <span style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
          <button onClick={onVerQuem} style={{
            height: 34, display: "flex", alignItems: "center", gap: 6, background: C.panelSoft,
            border: `1px solid ${C.line}`, borderRadius: 16, padding: "0 9px", cursor: "pointer",
          }}>
            {resumoPorEmoji.map(({ e, n }) => (
              <span key={e} style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 12 }}>
                <span>{e}</span><span style={{ color: C.oak, fontWeight: 800, fontSize: 10.5 }}>{n}</span>
              </span>
            ))}
          </button>
          <span style={{ minHeight: 12 }} />
        </span>
      )}

      <span ref={pickerRef} style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
        {abrirPicker && (
          <div style={{
            position: "absolute", bottom: 42, right: -6, display: "flex", gap: 6, padding: "6px 8px",
            background: C.panel, border: `1px solid ${C.line}`, borderRadius: 20,
            boxShadow: "0 4px 16px rgba(0,0,0,.45)", zIndex: 5,
          }}>
            {REACTS.map((e) => (
              <button key={e} onClick={async () => {
                if (minhaReacao && minhaReacao !== e) await reagir(postId, minhaReacao);
                await reagir(postId, e);
                setAbrirPicker(false);
              }} style={{
                width: 30, height: 30, borderRadius: "50%", padding: 0, fontSize: 16, lineHeight: 1,
                background: e === minhaReacao ? C.teal : "transparent",
                border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{e}</button>
            ))}
          </div>
        )}
        {bolinha(minhaReacao || <span style={{ fontSize: 18, fontWeight: 700, lineHeight: 1 }}>+</span>, () => setAbrirPicker(!abrirPicker), !!minhaReacao)}
        <span style={{ minHeight: 12 }} />
      </span>
    </div>
  );
}

// ---------- Cartão de post (Radar e Mural) ----------
function PostCard({ e, fotos, reacts, minhaChave, reagir, onApagar, onAutor, seloTorcida, gestaoAppAutor,
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
                  ? <span onClick={onAutor || undefined} style={{ color: oficial ? C.oak : campanha ? C.tealSoft : C.cream, ...clicavel }}>{oficial ? "📌 " : campanha ? "🏷️ " : ""}{e.autorNome}{campanha ? " · Clube" : ""}{gestaoAppAutor && <span title="Gestão do App" style={{ marginLeft: 4, fontSize: 11, color: C.teal }}>✓</span>}</span>
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
function TelaLogin({ allData, carregando, onEntrar, entrarDemo, onParceiro, adminLiberado, entrarStaff, nomeAdminAtual }) {
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
        <IconeArena size={52} style={{ color: C.oak, margin: "0 auto 10px" }} />
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
          {adminLiberado && entrarStaff && (
            <button onClick={entrarStaff} style={{
              ...btnFantasma(), textAlign: "center", color: C.oak, marginTop: 12,
              border: `1px solid ${C.oak}66`, borderRadius: 10, padding: "10px", fontWeight: 800,
            }}>
              🔒 Entrar como {nomeAdminAtual || "Administração"}
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
function NovoPost({ publicar, admin, podePostarOficial }) {
  const [texto, setTexto] = useState("");
  const [foto, setFoto] = useState(null);
  const [comoOficial, setComoOficial] = useState(false);
  const fileRef = useRef(null);
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ color: C.mut, fontSize: 12.5, lineHeight: 1.5 }}>
        {(podePostarOficial || FOTOS_NO_MURAL) ? "Frase, foto, ou os dois. Todo mundo da comunidade vê. 🐻" : "Solta a frase — todo mundo da comunidade vê. 🐻"}
      </div>
      <textarea style={{ ...inputStyle(), minHeight: 80, resize: "vertical" }} maxLength={280}
        placeholder="Escreve aqui…" value={texto} onChange={(e) => setTexto(e.target.value)} />
      {foto && <img src={foto} alt="" style={{ width: "100%", borderRadius: 10 }} />}
      <div style={{ display: "flex", gap: 8 }}>
        {(podePostarOficial || FOTOS_NO_MURAL) && (
          <button style={{ ...btnFantasma(), border: `1px solid ${C.line}`, borderRadius: 10, padding: "10px 14px", flex: 1 }}
            onClick={() => fileRef.current && fileRef.current.click()}>
            📷 {foto ? "Trocar foto" : "Foto"}
          </button>
        )}
        <button style={{ ...btnPrimario(), flex: 2, opacity: texto.trim() || foto ? 1 : 0.5 }}
          onClick={() => {
            if (!texto.trim() && !foto) return;
            publicar(texto.trim(), foto, podePostarOficial && comoOficial);
            setTexto(""); setFoto(null);
          }}>
          PUBLICAR
        </button>
      </div>
      {podePostarOficial && (
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
  const [menuAberto, setMenuAberto] = useState(false);
  const [larga, setLarga] = useState(typeof window !== "undefined" && window.innerWidth >= 900);
  const [larguraJanela, setLarguraJanela] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  // "web" | "mobile" | null. null = ainda não escolheu → usa a largura da tela como sugestão inicial.
  // Uma vez escolhido (clicou em "versão mobile" ou "abrir painel completo"), SÓ muda de novo com outro clique —
  // nem redimensionar a janela, nem dar F5/apertar Enter na barra de endereço muda mais sozinho.
  const [modoPainelWeb, setModoPainelWeb] = useState(null);
  const [seletorUnidadeAberto, setSeletorUnidadeAberto] = useState(false);
  const escolherModoPainel = (modo) => { // modo: "web" | "mobile"
    setModoPainelWeb(modo);
    if (!demo) gravarLocal(K_MODO_PAINEL, modo);
  };
  const mostrarDashboard = modoPainelWeb === "web" || (modoPainelWeb === null && larga);
  const [abaAdminLarga, setAbaAdminLarga] = useState("geral"); // geral | cadastros | clube | admins | missoes
  useEffect(() => {
    const aoRedimensionar = () => { setLarga(window.innerWidth >= 900); setLarguraJanela(window.innerWidth); };
    window.addEventListener("resize", aoRedimensionar);
    return () => window.removeEventListener("resize", aoRedimensionar);
  }, []);
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
  const [indicacoes, setIndicacoes] = useState({});     // { chaveIndicador: [{id, ts, nome, telefone}] }
  const [giro175, setGiro175] = useState({});          // { chaveAluno: { ts, por } } — concedido manualmente pelo admin
  const [pacotes4, setPacotes4] = useState({});         // { chaveAluno: { ts, por } } — venda de 4 pacotes de 10, idem
  const [equipe, setEquipe] = useState({});             // { chaveAluno: { ts, por } } — marcado como Equipe Spincycle pelo admin
  const [gestaoApp, setGestaoApp] = useState({});        // { chaveAluno: { ts, por } } — selo verificado, Gestão do App (só Raquel/Isabelle hoje)
  const [relampago, setRelampago] = useState({});       // { chaveAluno: { ts, por } } — ganhou Missão Relâmpago, idem
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
    const [il, pc, ps, gg, ma, rc, pf, ag, cb, cf, bs, mt, adr, prs, tc, cm, it, rd, g175, p4, relp, ind, eq, gap] = await Promise.all([
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
      lerShared(K.giro175, {}),
      lerShared(K.pacotes4, {}),
      lerShared(K.relampago, {}),
      lerShared(K.indicacoes, {}),
      lerShared(K.equipe, {}),
      lerShared(K.gestaoApp, {}),
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
    if (ind !== undefined) setIndicacoes(ind || {});
    if (eq !== undefined) setEquipe(eq || {});
    if (gap !== undefined) setGestaoApp(gap || {});
    if (g175 !== undefined) setGiro175(g175 || {});
    if (p4 !== undefined) setPacotes4(p4 || {});
    if (relp !== undefined) setRelampago(relp || {});
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
          const pinRaw = raw && raw.value;
          const uRaw = pinRaw ? Object.keys(ADMINS).find((u) => ADMINS[u] === pinRaw) : null;
          if (uRaw) {
            setAdmin(true);
            setAdminInfo({ usuario: uRaw, super: uRaw === SUPER_ADMIN, perms: { ...PERMISSOES_LEGADO }, unidade: UNIDADE });
          }
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
      const modoPref = await lerLocal(K_MODO_PAINEL);
      if (modoPref === "web" || modoPref === "mobile") setModoPainelWeb(modoPref);
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

  // 🚻 Gênero: campo do Desafio (não da Comunidade), mas o próprio aluno pode
  // ajustar por aqui — segue o MESMO padrão seguro (leitura fresca + -bak) das
  // demais escritas, mesa se a chave é do Desafio (KEY_DESAFIO), não da Comunidade.
  const salvarMeuGenero = async (genero) => {
    if (!sessao || sessao.staff || (genero !== "M" && genero !== "F")) return;
    const key = KEY_DESAFIO(sessao.track);
    const base = await lerShared(key, { students: [] });
    if (base === undefined) { avisar("⚠️ Sem conexão — o gênero não foi salvo."); return; }
    const novo = JSON.parse(JSON.stringify(base || { students: [] }));
    const s = (novo.students || []).find((x) => x.id === sessao.sid);
    if (!s) { avisar("⚠️ Não encontrei seu cadastro no Desafio."); return; }
    s.genero = genero;
    try {
      await gravarShared(key, novo);
      setAllData((prev) => ({ ...prev, [sessao.track]: novo }));
      avisar("✅ Gênero atualizado.");
    } catch { avisar("⚠️ Falha ao salvar — tenta de novo."); }
  };

  // 👤 Admin: editar cadastro de qualquer aluno (nome, telefone, gênero, senha, aprovação)
  // Mesmo padrão seguro de sempre: leitura fresca da chave do Desafio + escrita pontual.
  const salvarCadastroAluno = async (track, sid, patch) => {
    const key = KEY_DESAFIO(track);
    const base = await lerShared(key, { students: [] });
    if (base === undefined) { avisar("⚠️ Sem conexão — nada foi salvo."); return false; }
    const novo = JSON.parse(JSON.stringify(base || { students: [] }));
    const s = (novo.students || []).find((x) => x.id === sid);
    if (!s) { avisar("⚠️ Cadastro não encontrado."); return false; }
    Object.assign(s, patch);
    try {
      await gravarShared(key, novo);
      setAllData((prev) => ({ ...prev, [track]: novo }));
      avisar("✅ Cadastro atualizado.");
      return true;
    } catch { avisar("⚠️ Falha ao salvar — tenta de novo."); return false; }
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

  // 🎁 Indicar um Amigo: cada indicação confirmada vira 1 ticket na cartela do indicador
  const indicarAmigo = async (nome, telefone) => {
    if (!minhaChave) return;
    const rec = { id: `ind-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, ts: Date.now(), nome: nome.trim(), telefone: telefone.trim() };
    const aplicar = (base) => {
      const novo = JSON.parse(JSON.stringify(base || {}));
      if (!novo[minhaChave]) novo[minhaChave] = [];
      novo[minhaChave].push(rec);
      return novo;
    };
    if (demo) { setIndicacoes(aplicar(indicacoes)); avisar("🎁 Indicação registrada (demonstração)."); return; }
    const base = await lerShared(K.indicacoes, {});
    if (base === undefined) { avisar("⚠️ Sem conexão — a indicação NÃO foi salva."); return; }
    const novo = aplicar(base);
    try {
      await gravarShared(K.indicacoes, novo);
      setIndicacoes(novo);
      avisar("🎁 Indicação registrada! Assim que seu amigo confirmar a primeira aula, o ticket é seu.");
    } catch { avisar("⚠️ Falha ao registrar a indicação."); }
  };

  // 🏅 Giro 175: selo concedido manualmente pelo admin — cartela cheia + 8 amigos
  // (Ilimitados) + 4 pacotes de 10 aulas vendidos. Venda não tem dado no app,
  // então quem confirma é a administração, com um toque, igual ao ◻️ Entregue.
  const alternarGiro175 = async (alvoChave) => {
    const aplicar = (base) => {
      const novo = { ...(base || {}) };
      if (novo[alvoChave]) delete novo[alvoChave];
      else novo[alvoChave] = { ts: Date.now(), por: sessao?.name || "admin" };
      return novo;
    };
    if (demo) { setGiro175(aplicar(giro175)); return; }
    const base = await lerShared(K.giro175, {});
    if (base === undefined) { avisar("⚠️ Sem conexão."); return; }
    const novo = aplicar(base);
    try {
      await gravarShared(K.giro175, novo);
      setGiro175(novo);
      avisar(novo[alvoChave] ? "🏅 Giro 175 concedido!" : "Giro 175 revogado.");
    } catch { avisar("⚠️ Falha ao salvar."); }
  };

  // 📦 4 Pacotes de 10 aulas: mesmo princípio do Giro 175 — venda não tem dado
  // no app, então o selo é concedido manualmente pela administração.
  const alternarPacotes4 = async (alvoChave) => {
    const aplicar = (base) => {
      const novo = { ...(base || {}) };
      if (novo[alvoChave]) delete novo[alvoChave];
      else novo[alvoChave] = { ts: Date.now(), por: sessao?.name || "admin" };
      return novo;
    };
    if (demo) { setPacotes4(aplicar(pacotes4)); return; }
    const base = await lerShared(K.pacotes4, {});
    if (base === undefined) { avisar("⚠️ Sem conexão."); return; }
    const novo = aplicar(base);
    try {
      await gravarShared(K.pacotes4, novo);
      setPacotes4(novo);
      avisar(novo[alvoChave] ? "📦 4 Pacotes concedido!" : "4 Pacotes revogado.");
    } catch { avisar("⚠️ Falha ao salvar."); }
  };

  // 🛡️ Equipe Spincycle: tarja de admin no perfil público, concedida manualmente
  // (mesmo princípio do Giro 175/4 Pacotes — não é um dado que vem do Desafio).
  const alternarEquipe = async (alvoChave) => {
    const aplicar = (base) => {
      const novo = { ...(base || {}) };
      if (novo[alvoChave]) delete novo[alvoChave];
      else novo[alvoChave] = { ts: Date.now(), por: sessao?.name || "admin" };
      return novo;
    };
    if (demo) { setEquipe(aplicar(equipe)); return; }
    const base = await lerShared(K.equipe, {});
    if (base === undefined) { avisar("⚠️ Sem conexão."); return; }
    const novo = aplicar(base);
    try {
      await gravarShared(K.equipe, novo);
      setEquipe(novo);
      avisar(novo[alvoChave] ? "🛡️ Marcado como Equipe Spincycle!" : "Tarja de Equipe Spincycle removida.");
    } catch { avisar("⚠️ Falha ao salvar."); }
  };

  // ✓ Gestão do App: selo verificado, exclusivo de quem administra o app de
  // verdade (hoje: Raquel e Isabelle). Só super-admin concede.
  const alternarGestaoApp = async (alvoChave) => {
    const aplicar = (base) => {
      const novo = { ...(base || {}) };
      if (novo[alvoChave]) delete novo[alvoChave];
      else novo[alvoChave] = { ts: Date.now(), por: sessao?.name || "admin" };
      return novo;
    };
    if (demo) { setGestaoApp(aplicar(gestaoApp)); return; }
    const base = await lerShared(K.gestaoApp, {});
    if (base === undefined) { avisar("⚠️ Sem conexão."); return; }
    const novo = aplicar(base);
    try {
      await gravarShared(K.gestaoApp, novo);
      setGestaoApp(novo);
      avisar(novo[alvoChave] ? "✓ Selo de Gestão do App concedido!" : "Selo de Gestão do App removido.");
    } catch { avisar("⚠️ Falha ao salvar."); }
  };

  // 🥚 Missão Relâmpago: easter egg pra quem ganhou — sem lista de vencedores
  // no app ainda, então também é concessão manual, mesmo padrão dos outros dois.
  const alternarRelampago = async (alvoChave) => {
    const aplicar = (base) => {
      const novo = { ...(base || {}) };
      if (novo[alvoChave]) delete novo[alvoChave];
      else novo[alvoChave] = { ts: Date.now(), por: sessao?.name || "admin" };
      return novo;
    };
    if (demo) { setRelampago(aplicar(relampago)); return; }
    const base = await lerShared(K.relampago, {});
    if (base === undefined) { avisar("⚠️ Sem conexão."); return; }
    const novo = aplicar(base);
    try {
      await gravarShared(K.relampago, novo);
      setRelampago(novo);
      avisar(novo[alvoChave] ? "🥚 Missão Relâmpago concedida!" : "Missão Relâmpago revogada.");
    } catch { avisar("⚠️ Falha ao salvar."); }
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
    gestaoAppAutor: !!(e.autorChave && gestaoApp && gestaoApp[e.autorChave]),
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
      {!semNav && sessao && (
        <div style={{
          position: "sticky", top: 0, zIndex: 40, display: "grid", gridTemplateColumns: "38px 1fr 38px",
          alignItems: "center", gap: 8,
          padding: "calc(env(safe-area-inset-top) + 12px) 16px 0", background: C.bg,
        }}>
          <span />
          <span style={{
            textAlign: "center", color: C.oak, fontWeight: 700, fontSize: 12, letterSpacing: 0.3,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>Você está na <b style={{ fontWeight: 800 }}>Arena Spin</b>.</span>
          <button onClick={() => setMenuAberto(true)} aria-label="Abrir menu" style={{
            width: 38, height: 38, borderRadius: 10, background: C.panelSoft, border: `1px solid ${C.line}`,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
              <span style={{ width: 18, height: 2, borderRadius: 2, background: C.cream }} />
              <span style={{ width: 18, height: 2, borderRadius: 2, background: C.cream }} />
              <span style={{ width: 18, height: 2, borderRadius: 2, background: C.cream }} />
            </div>
          </button>
        </div>
      )}
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
    const uAdmin = (adminInfo && adminInfo.usuario) || "";
    const nomeAdminAtual = NOME_ADMIN[uAdmin] || (uAdmin ? `${uAdmin.charAt(0).toUpperCase()}${uAdmin.slice(1)} (Admin)` : "Administração");
    return shell(
      <TelaLogin allData={allData} carregando={carregando} onEntrar={entrar}
        adminLiberado={admin}
        nomeAdminAtual={nomeAdminAtual}
        entrarStaff={() => {
          entrar({
            track: "staff",
            sid: uAdmin ? `gestao-${uAdmin}` : "gestao",
            name: nomeAdminAtual,
            staff: true,
          });
        }}
        entrarDemo={bancoVazio ? entrarDemo : null} onParceiro={entrarParceiro} />,
      true
    );
  }

  // ---------- Dashboard largo de admin (a pessoa que decide, não a largura da tela) ----------
  if (sessao.staff && mostrarDashboard) {
    const abaBtnLarga = (id, rot, mostra = true) => mostra && (
      <button key={id} onClick={() => setAbaAdminLarga(id)} style={{
        display: "block", width: "100%", textAlign: "left", background: abaAdminLarga === id ? C.panelSoft : "transparent",
        border: "none", borderLeft: `3px solid ${abaAdminLarga === id ? C.teal : "transparent"}`,
        color: abaAdminLarga === id ? C.cream : C.mut, fontWeight: 700, fontSize: 13.5,
        padding: "11px 16px", cursor: "pointer", fontFamily: "inherit",
      }}>{rot}</button>
    );
    const podeVerCadastros = adminSuper || !!adminPerms.verKit || !!adminPerms.editarPerfis || !!adminPerms.resetarSenha || !!adminPerms.trocarFotos;
    let painelAtivo;
    if (abaAdminLarga === "cadastros" && podeVerCadastros) {
      painelAtivo = <PainelCadastrosAlunos allData={allData} fotos={fotos} salvarCadastroAluno={salvarCadastroAluno} avisar={avisar} semCabecalho />;
    } else if (abaAdminLarga === "clube" && clubeAcesso.ver) {
      painelAtivo = <CadastroClube clube={clube} salvarClube={salvarClube} removerParceiro={removerParceiro}
        lancarCampanha={lancarCampanha} metricas={metricas} acesso={clubeAcesso} semCabecalho voltar={() => {}} />;
    } else if (abaAdminLarga === "admins" && adminSuper) {
      painelAtivo = <TelaGestaoAdmins adminsReg={adminsReg} salvarAdmins={salvarAdmins} allData={allData} fotos={fotos} avisar={avisar} semCabecalho voltar={() => {}} />;
    } else if (abaAdminLarga === "missoes") {
      const linhas = TRACKS.map((t) => {
        const alunosTrack = ((allData[t.id] || {}).students || []);
        const comProgresso = alunosTrack.filter((s) => (s.records || []).length > 0 || (s.guests || []).length > 0);
        const cartelaCheia = comProgresso.filter((s) => computeProgress(s, t.targets).full).length;
        const ranking = [...comProgresso]
          .map((s) => ({ nome: s.name, prog: computeProgress(s, t.targets) }))
          .sort((a, b) => b.prog.doneCount - a.prog.doneCount || b.prog.p.maratona - a.prog.p.maratona)
          .slice(0, 8);
        return { t, alunos: alunosTrack.length, comProgresso: comProgresso.length, cartelaCheia, ranking };
      });
      const totCadastrados = linhas.reduce((s, l) => s + l.alunos, 0);
      const totAtivos = linhas.reduce((s, l) => s + l.comProgresso, 0);
      const totCartelas = linhas.reduce((s, l) => s + l.cartelaCheia, 0);
      const taxaParticipacao = totCadastrados ? Math.round((totAtivos / totCadastrados) * 100) : 0;
      const exportarRankingMissoes = () => {
        const linhasCsv = [["Grupo", "Posição", "Aluno", "Missões cumpridas"]];
        linhas.forEach(({ t, ranking }) => ranking.forEach((r, i) => linhasCsv.push([t.label, i + 1, r.nome, `${r.prog.doneCount}/9`])));
        const csv = linhasCsv.map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `ranking-missoes-${UNIDADE}-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
      };
      painelAtivo = (
        <div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: C.mut, fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>PAINEL ADMINISTRATIVO</div>
            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: 0.3 }}>Missões & Arena</div>
            <div style={{ color: C.mut, fontSize: 13, marginTop: 4 }}>Acompanhe participação, avanço e grupos do desafio</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
            {[["CADASTRADOS", totCadastrados, false], ["ATIVOS NO DESAFIO", totAtivos, false], ["TAXA DE PARTICIPAÇÃO", `${taxaParticipacao}%`, false], ["CARTELAS CHEIAS", totCartelas, true]].map(([label, valor, destaque]) => (
              <Painel key={label} style={{ border: destaque ? `1.5px solid ${C.oak}` : undefined, display: "grid", gap: 4 }}>
                <div style={{ color: C.mut, fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4 }}>{label}</div>
                <div style={{ color: C.cream, fontWeight: 800, fontSize: 24 }}>{valor}</div>
              </Painel>
            ))}
          </div>
          <Painel style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14 }}>Acompanhamento por grupo</div>
              <div style={{ color: C.mut, fontSize: 12, marginTop: 3 }}>Edição de missões, prêmios e Missões Relâmpago continua sendo feita no app do Desafio — aqui é só leitura e acompanhamento.</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={exportarRankingMissoes} style={{ ...btnFantasma(), border: `1px solid ${C.line}`, borderRadius: 10, padding: "9px 14px", fontSize: 12 }}>
                ↓ Exportar ranking
              </button>
              <a href={DESAFIO_URL} target="_blank" rel="noreferrer" style={{ ...btnPrimario(), width: "auto", padding: "9px 16px", fontSize: 12, textDecoration: "none", display: "inline-block" }}>
                Abrir app do desafio ↗
              </a>
            </div>
          </Painel>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${linhas.length}, 1fr)`, gap: 14 }}>
            {linhas.map(({ t, alunos: qtdAlunos, comProgresso, cartelaCheia, ranking }) => (
              <Painel key={t.id} style={{ display: "grid", gap: 10 }}>
                <div style={{ fontWeight: 800, fontSize: 13.5 }}>{t.label}</div>
                <div style={{ display: "flex", gap: 14, fontSize: 12, color: C.mut }}>
                  <span><b style={{ color: C.tealSoft }}>{qtdAlunos}</b> cadastrados</span>
                  <span><b style={{ color: C.tealSoft }}>{comProgresso}</b> ativos</span>
                  <span><b style={{ color: C.oak }}>{cartelaCheia}</b> cartela cheia</span>
                </div>
                <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 8, display: "grid", gap: 5 }}>
                  {ranking.map((r, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{i + 1}. {r.nome}</span>
                      <span style={{ color: C.oak, fontWeight: 800, flexShrink: 0, marginLeft: 8 }}>{r.prog.doneCount}/9</span>
                    </div>
                  ))}
                  {ranking.length === 0 && <div style={{ color: C.mut, fontSize: 11.5 }}>Ninguém pontuou ainda.</div>}
                </div>
              </Painel>
            ))}
          </div>
        </div>
      );
    } else {
      painelAtivo = <TelaPainelAdm metricas={metricas} clube={clube} fotos={fotos} allData={allData}
        muralAlunos={muralAlunos} reacts={reacts} comentarios={comentarios}
        profundo={adminSuper || !!adminPerms.painelCompleto} presenca={presenca}
        abrirPerfilAluno={abrirPerfilAluno} irAdmins={null} semCabecalho voltar={() => {}}
        config={config}
        irCadastros={podeVerCadastros ? () => setAbaAdminLarga("cadastros") : null}
        irClube={clubeAcesso.ver ? () => setAbaAdminLarga("clube") : null}
        irMissoes={() => setAbaAdminLarga("missoes")} />;
    }
    const compacta = larguraJanela < 760; // celular ou janela estreita: barra lateral vira topo
    return (
      <div style={{
        minHeight: "100vh", background: C.bg, color: C.cream, fontFamily: "'Montserrat', sans-serif",
        display: "flex", flexDirection: compacta ? "column" : "row",
      }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap'); html,body{margin:0;background:${C.bg};} *{box-sizing:border-box;} button{font-family:inherit;}`}</style>
        <div style={{
          width: compacta ? "100%" : 220, flexShrink: 0, borderRight: compacta ? "none" : `1px solid ${C.line}`,
          borderBottom: compacta ? `1px solid ${C.line}` : "none",
          minHeight: compacta ? "auto" : "100vh", position: compacta ? "static" : "sticky", top: 0,
          alignSelf: "flex-start", display: "flex", flexDirection: compacta ? "column" : "column",
        }}>
          <div style={{ padding: compacta ? "16px 16px 10px" : "22px 16px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: 0.5 }}>ARENA SPIN</div>
              <div style={{ color: C.oak, fontSize: 11, fontWeight: 700, marginTop: 2 }}>{sessao.name}</div>
            </div>
            {compacta && (
              <button onClick={() => escolherModoPainel("mobile")} style={{ ...btnFantasma(), border: `1px solid ${C.line}`, borderRadius: 8, padding: "7px 10px", fontSize: 11 }}>
                📱 App
              </button>
            )}
          </div>
          {(() => {
            const unidades = config.unidades || [];
            const atual = unidades.find((u) => u.id === UNIDADE) || { id: UNIDADE, nome: UNIDADE_NOME, cidade: "" };
            return (
              <div style={{ position: "relative", padding: compacta ? "0 16px 10px" : "0 16px 14px" }}>
                <div onClick={() => setSeletorUnidadeAberto(!seletorUnidadeAberto)} style={{
                  border: `1px solid ${C.line}`, borderRadius: 10, padding: "9px 11px", cursor: "pointer",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: C.mut, fontSize: 9.5, fontWeight: 700, letterSpacing: 0.5 }}>UNIDADE</div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{atual.nome}</div>
                  </div>
                  <span style={{ color: C.mut, fontSize: 11, flexShrink: 0, marginLeft: 6 }}>{seletorUnidadeAberto ? "︿" : "⌄"}</span>
                </div>
                {seletorUnidadeAberto && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 4px)", left: 16, right: 16, zIndex: 50,
                    background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10,
                    boxShadow: "0 12px 32px rgba(0,0,0,.3)", maxHeight: 260, overflowY: "auto", padding: 6,
                  }}>
                    {unidades.map((u) => (
                      <div key={u.id} onClick={() => {
                        setSeletorUnidadeAberto(false);
                        if (u.id !== UNIDADE) avisar("🚧 Essa unidade ainda não tem o Comunidade implantado — os dados aqui continuam sendo só da " + UNIDADE_NOME + ".");
                      }} style={{
                        padding: "8px 9px", borderRadius: 8, cursor: "pointer", fontSize: 12.5,
                        fontWeight: u.id === UNIDADE ? 700 : 600,
                        color: u.id === UNIDADE ? C.cream : C.mut,
                        background: u.id === UNIDADE ? C.panelSoft : "transparent",
                      }}>
                        {u.nome}
                        {u.cidade && <div style={{ fontSize: 10.5, color: C.mut, fontWeight: 500 }}>{u.cidade}</div>}
                      </div>
                    ))}
                    <div style={{ color: C.mut, fontSize: 10, padding: "6px 9px 2px", lineHeight: 1.4 }}>
                      Outras unidades entram aqui conforme forem implantadas.
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
          <nav style={{
            display: "flex", flexDirection: compacta ? "row" : "column", marginTop: 4,
            overflowX: compacta ? "auto" : "visible", WebkitOverflowScrolling: "touch",
          }}>
            {abaBtnLarga("geral", "📊 Visão geral")}
            {abaBtnLarga("cadastros", "👤 Cadastros de alunos", podeVerCadastros)}
            {abaBtnLarga("clube", "🎟️ Clube Spincycle", clubeAcesso.ver)}
            {abaBtnLarga("missoes", "🐻 Missões & Arena")}
            {abaBtnLarga("admins", "🔑 Gestão de admins", adminSuper)}
          </nav>
          {!compacta && (
            <div style={{ marginTop: "auto", padding: 16, display: "grid", gap: 8 }}>
              <div style={{ display: "flex", gap: 6 }}>
                {["escuro", "claro"].map((t) => (
                  <button key={t} onClick={() => mudarTema(t)} style={{
                    flex: 1, background: tema === t ? C.teal : "transparent",
                    color: tema === t ? "#F2F2F2" : C.mut, border: `1px solid ${tema === t ? C.teal : C.line}`,
                    borderRadius: 8, padding: "7px 6px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                  }}>{t === "escuro" ? "🌙 Escuro" : "☀️ Claro"}</button>
                ))}
              </div>
              <button onClick={() => escolherModoPainel("mobile")} style={{ ...btnFantasma(), border: `1px solid ${C.line}`, borderRadius: 8, padding: "8px", fontSize: 11.5 }}>
                📱 Ver versão mobile
              </button>
              <button onClick={sair} style={{ ...btnFantasma(), color: "#E08585", fontSize: 11.5, textAlign: "left", padding: "4px 4px" }}>
                Sair da conta
              </button>
            </div>
          )}
        </div>
        {compacta && (
          <div style={{ display: "flex", gap: 6, padding: "8px 16px", borderBottom: `1px solid ${C.line}` }}>
            {["escuro", "claro"].map((t) => (
              <button key={t} onClick={() => mudarTema(t)} style={{
                flex: 1, background: tema === t ? C.teal : "transparent",
                color: tema === t ? "#F2F2F2" : C.mut, border: `1px solid ${tema === t ? C.teal : C.line}`,
                borderRadius: 8, padding: "7px 6px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}>{t === "escuro" ? "🌙 Escuro" : "☀️ Claro"}</button>
            ))}
            <button onClick={sair} style={{ ...btnFantasma(), color: "#E08585", fontSize: 11, padding: "7px 10px", border: `1px solid ${C.line}`, borderRadius: 8 }}>
              Sair
            </button>
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0, padding: compacta ? "18px 16px" : "28px 36px", maxWidth: compacta ? "100%" : 1200 }}>
          {painelAtivo}
        </div>
        <Toast msg={msg} />
      </div>
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

      {(adminSuper || adminPerms.verUso || adminPerms.painelCompleto || (sessao && sessao.staff)) && (
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
                display: "flex", alignItems: "center", justifyContent: "center", background: C.panelSoft, overflow: "hidden",
              }}>{(fixado.icone || "urso") === "urso"
                ? <img src={ursoLogoDesafioImg} alt={fixado.nome} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <Ic nome={fixado.icone} size={44} stroke={1.4} style={{ color: C.oak }} />}</div>
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
        if (!alunoMeu) return null;
        const meusCarimbos = calcularCarimbos(progMeu, "missoes", { giro175, pacotes4, relampago }, `${sessao.track}:${sessao.sid}`, alunoMeu, trilhaMeu ? trilhaMeu.targets : null);
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
      {abaMural === "novo" && <NovoPost publicar={publicarAluno} admin={admin} podePostarOficial={adminSuper || !!adminPerms.postarFeed} />}
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
      giro175={giro175} alternarGiro175={alternarGiro175}
      pacotes4={pacotes4} alternarPacotes4={alternarPacotes4}
      relampago={relampago} alternarRelampago={alternarRelampago}
      equipe={equipe} alternarEquipe={alternarEquipe} podeMarcarEquipe={adminSuper}
      gestaoApp={gestaoApp} alternarGestaoApp={alternarGestaoApp}
      adminMissoes={adminSuper || !!adminPerms.liberarMissoes}
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
      salvarGenero={salvarMeuGenero}
      irFotos={() => setTela("fotosAlunos")}
      voltar={() => setTela("inicio")}
    />
  );

  // ---------- Fotos dos alunos (adm) ----------
  const telaFotos = (
    <FotosAlunos allData={allData} fotos={fotos} trocarFotoAluno={trocarFotoAluno} voltar={() => setTela("perfil")} />
  );

  const telaPainel = (
    <>
      {(adminSuper || !!adminPerms.painelCompleto) && (
        <button onClick={() => escolherModoPainel("web")} style={{
          ...btnFantasma(), border: `1px solid ${C.oak}66`, borderRadius: 10, padding: "12px 14px",
          fontSize: 12.5, marginBottom: 10, textAlign: "left", display: "flex", alignItems: "center",
          justifyContent: "space-between", width: "100%",
        }}>
          <span>🖥️ Abrir versão completa (dashboard)</span><span style={{ color: C.mut }}>›</span>
        </button>
      )}
      <TelaPainelAdm metricas={metricas} clube={clube} fotos={fotos} allData={allData}
        muralAlunos={muralAlunos} reacts={reacts} comentarios={comentarios}
        profundo={adminSuper || !!adminPerms.painelCompleto} presenca={presenca}
        irAdmins={adminSuper ? () => setTela("gestaoAdmins") : null}
        abrirPerfilAluno={abrirPerfilAluno} voltar={() => setTela("inicio")} />
    </>
  );

  const telaGestaoAdmins = adminSuper ? (
    <TelaGestaoAdmins adminsReg={adminsReg} salvarAdmins={salvarAdmins} allData={allData} fotos={fotos} avisar={avisar} voltar={() => setTela("painel")} />
  ) : null;

  const telaIndicarAmigo = (
    <TelaIndicarAmigo minhasIndicacoes={indicacoes[minhaChave] || []} indicarAmigo={indicarAmigo} avisar={avisar} voltar={() => setTela("inicio")} />
  );

  const conteudo = {
    inicio: telaInicio, mural: telaMural, ranking: telaRanking, agenda: telaAgenda,
    clube: telaClube, cadastroClube: telaCadastroClube, busca: telaBusca, arena: telaArena,
    favoritos: telaFavoritos, painel: telaPainel, gestaoAdmins: telaGestaoAdmins,
    alunoPerfil: telaAlunoPerfil, instantes: telaInstantes,
    global: telaGlobal, perfil: telaPerfil, fotosAlunos: telaFotos,
    indicarAmigo: telaIndicarAmigo,
  }[tela] || telaInicio;

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: SELO_DEFS_HTML }} />
      {shell(conteudo)}
      {menuAberto && (
        <div onClick={() => setMenuAberto(false)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 200, display: "flex", justifyContent: "flex-end",
        }}>
          <div onClick={(ev) => ev.stopPropagation()} style={{
            width: "78%", maxWidth: 320, height: "100%", background: C.panel, borderLeft: `1px solid ${C.line}`,
            padding: "calc(env(safe-area-inset-top) + 20px) 18px 20px", display: "flex", flexDirection: "column",
            gap: 2, overflowY: "auto",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontWeight: 800, fontSize: 14, color: C.oak, letterSpacing: 1 }}>MENU</span>
              <button onClick={() => setMenuAberto(false)} style={{ background: "transparent", border: "none", color: C.mut, fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            {[
              { rot: "Editar meu perfil", onClick: () => setTela("perfil") },
              { rot: "Meu ranking", onClick: () => setTela("ranking") },
              { rot: "Meus desafios", onClick: () => setTela("arena") },
              { rot: "Minhas conquistas", onClick: () => { if (sessao && sessao.staff) setTela("painel"); else if (sessao) abrirPerfilAluno(sessao.track, sessao.sid); } },
              { rot: "Meu clube favorito", onClick: () => setTela("favoritos") },
              { rot: "Indicar um amigo", onClick: () => setTela("indicarAmigo") },
            ].map((item) => (
              <button key={item.rot} onClick={() => { setMenuAberto(false); item.onClick(); }} style={{
                display: "flex", alignItems: "center", gap: 12, background: "transparent", border: "none",
                padding: "13px 4px", cursor: "pointer", color: C.cream, fontSize: 14, fontWeight: 700,
                borderBottom: `1px solid ${C.line}`, textAlign: "left", fontFamily: "inherit",
              }}>
                {item.rot}
              </button>
            ))}
            <button onClick={() => { setMenuAberto(false); sair(); }} style={{
              display: "flex", alignItems: "center", gap: 12, background: "transparent", border: "none",
              padding: "13px 4px", cursor: "pointer", color: "#E08585", fontSize: 14, fontWeight: 700,
              marginTop: 8, fontFamily: "inherit", textAlign: "left",
            }}>
              Sair da conta
            </button>
          </div>
        </div>
      )}
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
      <IconeArena size={64} style={{ color: C.oak, marginBottom: 14 }} />
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
function CadastroClube({ clube, salvarClube, removerParceiro, lancarCampanha, metricas = { parceiros: {} }, acesso = { ver: true, valores: true, editar: true, campanha: true, pagamentos: true }, semCabecalho, voltar }) {
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

  const ativos = parceiros.filter((p) => !p.pagoAte || p.pagoAte >= hoje).length;
  const vencidos = parceiros.filter((p) => p.pagoAte && p.pagoAte < hoje).length;
  const receitaMensal = parceiros
    .filter((p) => !p.pagoAte || p.pagoAte >= hoje)
    .reduce((s, p) => s + (parseFloat(String(p.mensalidade).replace(",", ".")) || 0), 0);
  const aberturasQR = parceiros.reduce((s, p) => s + (((metricas.parceiros || {})[p.id] || {}).aberturas || 0), 0);

  return (
    <>
      {!semCabecalho && <CabecalhoTela titulo="GESTÃO DO CLUBE" sub="Espaço da gestão terceirizada: cadastro, cobrança e vigência dos parceiros. Cada parceiro recebe um código de acesso para gerenciar os próprios vouchers (tela de login → 🏪 Acesso parceiro). Parceiro com mensalidade vencida sai da vitrine automaticamente." voltar={voltar} />}
      {semCabecalho && !form && (
        <>
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: C.mut, fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>PAINEL ADMINISTRATIVO</div>
            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: 0.3 }}>Clube Spincycle</div>
            <div style={{ color: C.mut, fontSize: 13, marginTop: 4 }}>Parceiros, benefícios, vigência e recebimentos</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
            {[["PARCEIROS ATIVOS", ativos], ["VENCIDOS", vencidos], ["RECEITA MENSAL", `R$ ${receitaMensal.toFixed(2).replace(".", ",")}`], ["ABERTURAS DE QR", aberturasQR]].map(([label, valor]) => (
              <Painel key={label} style={{ display: "grid", gap: 4 }}>
                <div style={{ color: C.mut, fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4 }}>{label}</div>
                <div style={{ color: C.cream, fontWeight: 800, fontSize: 22 }}>{valor}</div>
              </Painel>
            ))}
          </div>
        </>
      )}
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
function TelaPerfilAluno({ track, sid, allData, perfis, fotos, muralVisivel, feedRadar, ehMeu, torcida, torcer, minhaChave, recados, deixarRecado, apagarRecado, admin, giro175, alternarGiro175, pacotes4, alternarPacotes4, relampago, alternarRelampago, equipe, alternarEquipe, gestaoApp, alternarGestaoApp, podeMarcarEquipe, adminMissoes, avisar, irEditar, renderPost, voltar }) {
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
  const temGiro175 = !!(giro175 && giro175[chave]);
  const temPacotes4 = !!(pacotes4 && pacotes4[chave]);
  const temRelampago = !!(relampago && relampago[chave]);
  const carimbos = calcularCarimbos(prog, "missoes", { giro175: giro175 || {}, pacotes4: pacotes4 || {}, relampago: relampago || {} }, chave, aluno, trilha ? trilha.targets : null);
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
              {aluno.name}{gestaoApp && gestaoApp[chave] && <span title="Gestão do App" style={{ marginLeft: 6, fontSize: 15, color: C.teal }}>✓</span>}
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
          {equipe && equipe[chave] && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 4, marginTop: 6,
              background: `${C.oak}22`, border: `1px solid ${C.oak}66`, borderRadius: 6,
              padding: "2px 8px", color: C.oak, fontSize: 10.5, fontWeight: 800, letterSpacing: 0.4,
            }}>🛡️ EQUIPE SPINCYCLE</div>
          )}
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
            <img src={ursoCabecaImg} alt="Desafio das Missões" style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover" }} />
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
      {participa && (
        <>
          <div style={{ color: C.oak, fontWeight: 800, fontSize: 12.5, letterSpacing: 1, margin: "18px 0 8px" }}>🎖️ CARIMBOS</div>
          <CarimbosPassaporte carimbos={carimbos} sid={sid} avisar={avisar} />
        </>
      )}

      {/* 4 Pacotes de 10 — admin concede na mão, venda não tem dado no app */}
      {adminMissoes && (
        <Painel onClick={() => alternarPacotes4(chave)} style={{
          display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10,
          border: `1px solid ${temPacotes4 ? C.ok + "88" : C.line}`,
        }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 13 }}>📦 4 Pacotes de 10 Aulas</div>
            <div style={{ color: C.mut, fontSize: 11, marginTop: 2, lineHeight: 1.4 }}>
              Venda confirmada de 4 pacotes de 10 aulas.
            </div>
          </div>
          <span style={{
            fontSize: 11.5, fontWeight: 800, whiteSpace: "nowrap", marginLeft: 10,
            color: temPacotes4 ? C.ok : C.mut, border: `1px solid ${temPacotes4 ? C.ok : C.line}`,
            borderRadius: 8, padding: "4px 8px",
          }}>{temPacotes4 ? "✅ Concedido" : "◻️ Conceder"}</span>
        </Painel>
      )}

      {/* Missão Relâmpago — easter egg, admin concede na mão (sem lista de vencedores no app ainda) */}
      {adminMissoes && (
        <Painel onClick={() => alternarRelampago(chave)} style={{
          display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10,
          border: `1px solid ${temRelampago ? C.ok + "88" : C.line}`,
        }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 13 }}>🥚 Missão Relâmpago</div>
            <div style={{ color: C.mut, fontSize: 11, marginTop: 2, lineHeight: 1.4 }}>
              Ganhou uma Missão Relâmpago — libera o easter egg.
            </div>
          </div>
          <span style={{
            fontSize: 11.5, fontWeight: 800, whiteSpace: "nowrap", marginLeft: 10,
            color: temRelampago ? C.ok : C.mut, border: `1px solid ${temRelampago ? C.ok : C.line}`,
            borderRadius: 8, padding: "4px 8px",
          }}>{temRelampago ? "✅ Concedido" : "◻️ Conceder"}</span>
        </Painel>
      )}


      {/* Giro 175 — admin concede na mão, porque venda de pacote não tem dado no app */}
      {adminMissoes && (
        <Painel onClick={() => alternarGiro175(chave)} style={{
          display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10,
          border: `1px solid ${temGiro175 ? C.ok + "88" : C.line}`,
        }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 13 }}>🏅 Giro 175</div>
            <div style={{ color: C.mut, fontSize: 11, marginTop: 2, lineHeight: 1.4 }}>
              Cartela cheia + 8 amigos (Ilimitados) + 4 pacotes de 10 aulas vendidos.
            </div>
          </div>
          <span style={{
            fontSize: 11.5, fontWeight: 800, whiteSpace: "nowrap", marginLeft: 10,
            color: temGiro175 ? C.ok : C.mut, border: `1px solid ${temGiro175 ? C.ok : C.line}`,
            borderRadius: 8, padding: "4px 8px",
          }}>{temGiro175 ? "✅ Concedido" : "◻️ Conceder"}</span>
        </Painel>
      )}

      {/* 🛡️ Equipe Spincycle — tarja de admin no perfil, concedida na mão pela administração (só super-admin) */}
      {podeMarcarEquipe && alternarEquipe && (
        <Painel onClick={() => alternarEquipe(chave)} style={{
          display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10,
          border: `1px solid ${(equipe && equipe[chave]) ? C.oak + "88" : C.line}`,
        }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 13 }}>🛡️ Equipe Spincycle</div>
            <div style={{ color: C.mut, fontSize: 11, marginTop: 2, lineHeight: 1.4 }}>
              Mostra a tarja de equipe abaixo do nome, no perfil público.
            </div>
          </div>
          <span style={{
            fontSize: 11.5, fontWeight: 800, whiteSpace: "nowrap", marginLeft: 10,
            color: (equipe && equipe[chave]) ? C.oak : C.mut, border: `1px solid ${(equipe && equipe[chave]) ? C.oak : C.line}`,
            borderRadius: 8, padding: "4px 8px",
          }}>{(equipe && equipe[chave]) ? "✅ Marcado" : "◻️ Marcar"}</span>
        </Painel>
      )}

      {/* ✓ Gestão do App — selo verificado exclusivo, aparece junto ao nome (posts e topo do perfil) */}
      {podeMarcarEquipe && alternarGestaoApp && (
        <Painel onClick={() => alternarGestaoApp(chave)} style={{
          display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10,
          border: `1px solid ${(gestaoApp && gestaoApp[chave]) ? C.teal + "88" : C.line}`,
        }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 13 }}>✓ Gestão do App</div>
            <div style={{ color: C.mut, fontSize: 11, marginTop: 2, lineHeight: 1.4 }}>
              Selo verificado ao lado do nome — exclusivo de quem administra o app de verdade.
            </div>
          </div>
          <span style={{
            fontSize: 11.5, fontWeight: 800, whiteSpace: "nowrap", marginLeft: 10,
            color: (gestaoApp && gestaoApp[chave]) ? C.teal : C.mut, border: `1px solid ${(gestaoApp && gestaoApp[chave]) ? C.teal : C.line}`,
            borderRadius: 8, padding: "4px 8px",
          }}>{(gestaoApp && gestaoApp[chave]) ? "✅ Concedido" : "◻️ Conceder"}</span>
        </Painel>
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

function TelaPainelAdm({ metricas, clube, fotos, allData, muralAlunos, reacts, comentarios, abrirPerfilAluno, profundo, presenca = {}, irAdmins, semCabecalho, voltar, config, irCadastros, irClube, irMissoes }) {
  const [ordem, setOrdem] = useState("recentes"); // recentes | az | ativos
  const [verTodosAlunos, setVerTodosAlunos] = useState(false);
  const noDash = !!(irCadastros || irClube || irMissoes); // só true dentro do Painel Web (dashboard)
  const dia = 86400000;
  const alunos = Object.entries(metricas.alunos || {}).map(([chave, a]) => ({ chave, ...a }));
  const hoje = alunos.filter((a) => Date.now() - (a.ultima || 0) < dia).length;
  const semana = alunos.filter((a) => Date.now() - (a.ultima || 0) < 7 * dia).length;
  const mes = alunos.filter((a) => Date.now() - (a.ultima || 0) < 30 * dia).length;
  const pctCadastrados = alunos.length ? Math.round((hoje / alunos.length) * 100) : 0;
  const deltaSemana = semana - hoje;

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

  // ---------- Atenção agora: alertas reais, calculados a partir dos dados acima ----------
  const alunosBaixaAtividade = alunos.filter((a) => (a.entradas || 0) <= 1 && !resumoTelas(a.telas));
  const diferencaDesafio = minDesafio - minFora;
  const parceirosEmpatados = parceiros.length >= 2 && parceiros[0].aberturas > 0 && parceiros[0].aberturas === parceiros[1].aberturas;
  const alertas = [];
  if (profundo && alunosBaixaAtividade.length > 0) {
    alertas.push({
      icone: "⏳", cor: C.oak,
      titulo: `${alunosBaixaAtividade.length} aluno(s) com baixa atividade`,
      desc: alunosBaixaAtividade.length === 1 ? "Acessou apenas a página inicial" : "Acessaram apenas a página inicial",
    });
  }
  if (profundo && diferencaDesafio > 0 && minFora > 0) {
    alertas.push({
      icone: "🐻", cor: C.tealSoft, titulo: "Desafio gera mais retenção",
      desc: `+${diferencaDesafio} min de diferença dentro x fora dele`,
    });
  }
  if (profundo && parceirosEmpatados) {
    alertas.push({ icone: "⭐", cor: C.oak, titulo: "Parceiros empatados", desc: `${parceiros[0].nome} e ${parceiros[1].nome} com o mesmo volume de aberturas` });
  }
  const pctDesafio = (minDesafio + minFora) > 0 ? Math.round((minDesafio / (minDesafio + minFora)) * 1000) / 10 : 0;

  return (
    <>
      {!semCabecalho && <CabecalhoTela titulo={`PAINEL · ${UNIDADE_NOME.toUpperCase()}`}
        sub="Visão da administração desta unidade — cada Spincycle terá o seu painel, separado. Números aproximados, atualizados a cada ~2 minutos de uso."
        voltar={voltar} />}

      {noDash && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap", gap: 14 }}>
          <div>
            <div style={{ color: C.mut, fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>PAINEL ADMINISTRATIVO</div>
            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: 0.3 }}>Visão geral</div>
            <div style={{ color: C.mut, fontSize: 13, marginTop: 4 }}>
              {UNIDADE_NOME} — resumo do uso e pontos que pedem atenção
            </div>
          </div>
        </div>
      )}

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
      <div style={{ display: "grid", gridTemplateColumns: noDash ? "repeat(4, 1fr)" : "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
        {(noDash
          ? [["ATIVOS HOJE", hoje, `${pctCadastrados}% dos cadastrados`], ["ATIVOS 7 DIAS", semana, `${deltaSemana >= 0 ? "+" : ""}${deltaSemana} vs. hoje`], ["ATIVOS 30 DIAS", mes, null], ["COM REGISTRO", alunos.length, "base monitorada"]]
          : [["HOJE", hoje, null], ["7 DIAS", semana, null], ["COM REGISTRO", alunos.length, null]]
        ).map(([r, n, nota]) => (
          <Painel key={r} style={noDash ? { display: "grid", gap: 5 } : { textAlign: "center", padding: "14px 6px" }}>
            {noDash ? (
              <>
                <div style={{ color: C.mut, fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4 }}>{r}</div>
                <div style={{ color: C.cream, fontWeight: 800, fontSize: 26, lineHeight: 1 }}>{n}</div>
                {nota && <div style={{ color: C.mut, fontSize: 11 }}>{nota}</div>}
              </>
            ) : (
              <>
                <div style={{ color: C.tealSoft, fontWeight: 800, fontSize: 20 }}>{n}</div>
                <div style={{ color: C.mut, fontSize: 10, fontWeight: 700, letterSpacing: 0.5, marginTop: 3 }}>{r}</div>
              </>
            )}
          </Painel>
        ))}
      </div>

      {/* Impacto do desafio + Uso do clube (lado a lado no dashboard largo) */}
      {profundo && <>
      <div style={{ display: "grid", gridTemplateColumns: noDash ? "1.3fr 1fr" : "1fr", gap: 16, marginBottom: 16 }}>
        <div>
          <div style={{ color: C.oak, fontWeight: 800, fontSize: 12.5, letterSpacing: 1, marginBottom: 8 }}>
            🏟️ {noDash ? "IMPACTO DO DESAFIO" : "DESAFIO × TEMPO NO APP"}
          </div>
          <Painel style={{ display: "grid", gap: 10 }}>
            {noDash && (
              <div style={{ color: C.oak, fontWeight: 800, fontSize: 19 }}>
                {minDesafio - minFora >= 0 ? "+" : ""}{minDesafio - minFora} min de diferença
              </div>
            )}
            <BarraGraf rotulo="Quem está em desafio" valor={minDesafio} max={Math.max(minDesafio, minFora)} sufixo=" min (média)" cor={C.tealSoft} />
            <BarraGraf rotulo="Quem está fora" valor={minFora} max={Math.max(minDesafio, minFora)} sufixo=" min (média)" cor={`${C.mut}`} />
            <div style={{ color: C.mut, fontSize: 10.5, lineHeight: 1.5 }}>
              Tempo médio acumulado no app por pessoa. Diferença grande = o desafio está segurando a comunidade. 🐻
            </div>
          </Painel>
        </div>

        {/* Clube por categoria */}
        {categorias.length > 0 && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ color: C.oak, fontWeight: 800, fontSize: 12.5, letterSpacing: 1 }}>🎟️ USO DO CLUBE</span>
              {noDash && irClube && (
                <button onClick={irClube} style={{ background: "transparent", border: "none", color: C.tealSoft, fontWeight: 700, fontSize: 11.5, cursor: "pointer", fontFamily: "inherit" }}>Ver detalhes</button>
              )}
            </div>
            <Painel style={{ display: "grid", gap: 10 }}>
              {categorias.map(([cat, v]) => (
                <BarraGraf key={cat} rotulo={`${cat} · ⭐${v.favoritos}`} valor={v.aberturas} max={maxCat} sufixo=" aberturas" />
              ))}
            </Painel>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: noDash && alertas.length > 0 ? "1fr 1.3fr" : "1fr", gap: 16, marginBottom: 16 }}>
        {/* Parceiros */}
        {parceiros.length > 0 && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ color: C.oak, fontWeight: 800, fontSize: 12.5, letterSpacing: 1 }}>🏪 PARCEIROS</span>
              {noDash && irClube && (
                <button onClick={irClube} style={{ background: "transparent", border: "none", color: C.tealSoft, fontWeight: 700, fontSize: 11.5, cursor: "pointer", fontFamily: "inherit" }}>Gerenciar</button>
              )}
            </div>
            <Painel style={{ display: "grid", gap: 6 }}>
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
          </div>
        )}

        {/* Atenção agora — só no dashboard largo, só com dados reais */}
        {noDash && alertas.length > 0 && (
          <div>
            <div style={{ color: C.oak, fontWeight: 800, fontSize: 12.5, letterSpacing: 1, marginBottom: 8 }}>
              ⚠️ ATENÇÃO AGORA <span style={{ color: C.mut, fontWeight: 700 }}>· {alertas.length}</span>
            </div>
            <Painel style={{ display: "grid", gap: 8 }}>
              {alertas.map((a, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: C.panelSoft, borderRadius: 10 }}>
                  <span style={{ color: a.cor, fontSize: 15 }}>{a.icone}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700 }}>{a.titulo}</div>
                    <div style={{ color: C.mut, fontSize: 11.5 }}>{a.desc}</div>
                  </div>
                </div>
              ))}
            </Painel>
          </div>
        )}
      </div>

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

      {/* Ações rápidas + Pulso da comunidade — só no dashboard largo */}
      {noDash && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 16, marginBottom: 16 }}>
          <div>
            <div style={{ color: C.oak, fontWeight: 800, fontSize: 12.5, letterSpacing: 1, marginBottom: 8 }}>＋ AÇÕES RÁPIDAS</div>
            <Painel style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                ["👤", "Cadastrar aluno", irCadastros],
                ["🐻", "Ver missões", irMissoes],
                ["🎟️", "Gerenciar clube", irClube],
                ["↓", "Exportar alunos (CSV)", () => {
                  const linhas = [["Nome", "Entradas", "Minutos", "Última atividade"]];
                  alunos.forEach((a) => linhas.push([a.nome || a.chave, a.entradas || 0, a.min || 0, a.ultima ? new Date(a.ultima).toLocaleDateString("pt-BR") : ""]));
                  const csv = linhas.map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
                  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const a2 = document.createElement("a");
                  a2.href = url; a2.download = `alunos-${UNIDADE}-${new Date().toISOString().slice(0, 10)}.csv`;
                  document.body.appendChild(a2); a2.click(); document.body.removeChild(a2);
                  URL.revokeObjectURL(url);
                }],
              ].filter(([, , fn]) => !!fn).map(([icone, label, fn]) => (
                <button key={label} onClick={fn} style={{
                  background: C.panelSoft, border: `1px solid ${C.line}`, borderRadius: 10, color: C.cream,
                  padding: "12px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                }}>
                  <div style={{ color: C.oak, fontSize: 15, marginBottom: 4 }}>{icone}</div>{label}
                </button>
              ))}
            </Painel>
          </div>
          <div>
            <div style={{ color: C.oak, fontWeight: 800, fontSize: 12.5, letterSpacing: 1, marginBottom: 8 }}>↗ PULSO DA COMUNIDADE</div>
            <Painel>
              <div style={{ background: C.panelSoft, borderRadius: 10, padding: "12px 14px", marginBottom: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>Engajamento concentrado</div>
                <div style={{ color: C.mut, fontSize: 12, marginTop: 3 }}>
                  {(minDesafio + minFora) > 0
                    ? `O desafio responde por ${pctDesafio}% do tempo médio observado no app.`
                    : "Ainda sem dados suficientes de tempo no app pra calcular essa proporção."}
                </div>
              </div>
              {alertas.length === 0
                ? <div style={{ color: C.ok, fontSize: 12.5, fontWeight: 700 }}>✓ Nenhum alerta no momento</div>
                : <div style={{ color: C.oak, fontSize: 12.5, fontWeight: 700 }}>⚠️ {alertas.length} ponto(s) pra olhar — veja "Atenção agora" acima</div>}
            </Painel>
          </div>
        </div>
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
function PainelCadastrosAlunos({ allData, fotos, salvarCadastroAluno, avisar, semCabecalho, voltar }) {
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState("todos"); // todos | semGenero | pendentes | aprovados
  const [editando, setEditando] = useState(null); // { track, id, name, phone, genero, pass, approved }
  const rows = [];
  TRACKS.forEach((t) => {
    const d = allData[t.id];
    if (d) (d.students || []).forEach((s) => rows.push({ t, s }));
  });
  rows.sort((a, b) => norm(a.s.name).localeCompare(norm(b.s.name)));
  const qNorm = norm(q);
  const qNum = q.replace(/\D/g, "");
  const buscados = qNorm
    ? rows.filter(({ s }) => norm(s.name).includes(qNorm) || (qNum.length >= 2 && normPhone(s.phone || "").includes(qNum)))
    : rows;
  const filtrados = buscados.filter(({ s }) => {
    if (filtro === "semGenero") return s.genero !== "M" && s.genero !== "F";
    if (filtro === "pendentes") return s.approved === false;
    if (filtro === "aprovados") return s.approved !== false;
    return true;
  });
  const semGenero = rows.filter(({ s }) => s.genero !== "M" && s.genero !== "F").length;
  const pendentes = rows.filter(({ s }) => s.approved === false).length;
  const aprovados = rows.length - pendentes;

  const abrirEdicao = ({ t, s }) => setEditando({
    track: t.id, id: s.id, name: s.name, phone: s.phone ? normPhone(s.phone) : "",
    genero: s.genero === "M" || s.genero === "F" ? s.genero : "", pass: "", approved: s.approved !== false,
  });

  const salvar = async () => {
    if (!editando) return;
    const nome = editando.name.trim();
    if (!nome) { avisar && avisar("Digite um nome."); return; }
    const patch = { name: nome, approved: editando.approved };
    if (editando.phone.trim()) patch.phone = normPhone(editando.phone);
    if (editando.genero === "M" || editando.genero === "F") patch.genero = editando.genero;
    if (editando.pass.trim()) patch.pass = editando.pass.trim();
    const ok = await salvarCadastroAluno(editando.track, editando.id, patch);
    if (ok) setEditando(null);
  };

  return (
    <>
      {!semCabecalho && <CabecalhoTela titulo="CADASTROS DE ALUNOS" sub="Todos os alunos dos 3 desafios, num lugar só." voltar={voltar} />}
      {semCabecalho && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ color: C.mut, fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>PAINEL ADMINISTRATIVO</div>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: 0.3 }}>Cadastros de alunos</div>
          <div style={{ color: C.mut, fontSize: 13, marginTop: 4 }}>Todos os alunos dos 3 desafios, num lugar só — encontre e edite com rapidez.</div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
        {[["ALUNOS NO TOTAL", rows.length, false], ["SEM GÊNERO INFORMADO", semGenero, true], ["APROVADOS", aprovados, false], ["PENDENTES", pendentes, false]].map(([label, valor, destaque]) => (
          <Painel key={label} style={{ border: destaque ? `1.5px solid ${C.oak}` : undefined, display: "grid", gap: 4 }}>
            <div style={{ color: C.mut, fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4 }}>{label}</div>
            <div style={{ color: C.cream, fontWeight: 800, fontSize: 24 }}>{valor}</div>
          </Painel>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <input style={{ ...inputStyle(), flex: 1, minWidth: 220 }} placeholder="🔎 Buscar por nome ou telefone…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[["todos", "Todos"], ["semGenero", "Sem gênero"], ["pendentes", "Pendentes"], ["aprovados", "Aprovados"]].map(([id, label]) => (
            <button key={id} onClick={() => setFiltro(id)} style={{
              background: filtro === id ? C.teal : "transparent", color: filtro === id ? "#fff" : C.mut,
              border: `1px solid ${filtro === id ? C.teal : C.line}`, borderRadius: 999, padding: "7px 14px",
              fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            }}>{label}</button>
          ))}
        </div>
      </div>

      {editando && (
        <Painel style={{ display: "grid", gap: 8, marginBottom: 14, border: `1px solid ${C.teal}88` }}>
          <div style={{ color: C.oak, fontWeight: 800, fontSize: 12.5 }}>✏️ Editando cadastro</div>
          <input style={inputStyle()} placeholder="Nome" value={editando.name} onChange={(e) => setEditando({ ...editando, name: e.target.value })} />
          <div style={{ display: "flex", gap: 8 }}>
            <input style={{ ...inputStyle(), flex: 1 }} placeholder="WhatsApp" value={editando.phone}
              onChange={(e) => setEditando({ ...editando, phone: e.target.value.replace(/\D/g, "").slice(0, 11) })} />
            <input style={{ ...inputStyle(), flex: 1 }} placeholder="Nova senha (opcional)" value={editando.pass}
              onChange={(e) => setEditando({ ...editando, pass: e.target.value })} />
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {[["F", "Feminino"], ["M", "Masculino"]].map(([v, rot]) => (
              <button key={v} onClick={() => setEditando({ ...editando, genero: v })} style={{
                flex: 1, background: editando.genero === v ? C.teal : C.panelSoft,
                color: editando.genero === v ? "#F2F2F2" : C.cream,
                border: `1px solid ${editando.genero === v ? C.teal : C.line}`,
                borderRadius: 10, padding: "8px 0", fontWeight: 800, cursor: "pointer", fontSize: 12, fontFamily: "inherit",
              }}>{rot}</button>
            ))}
          </div>
          <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12.5, cursor: "pointer" }}>
            <input type="checkbox" checked={editando.approved} onChange={(e) => setEditando({ ...editando, approved: e.target.checked })} />
            Cadastro aprovado (aparece liberado no Desafio)
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ ...btnFantasma(), flex: 1, color: C.mut }} onClick={() => setEditando(null)}>Cancelar</button>
            <button style={{ ...btnPrimario(), flex: 2 }} onClick={salvar}>SALVAR</button>
          </div>
        </Painel>
      )}

      <Painel style={{ padding: 0 }}>
        <div style={{
          display: "grid", gridTemplateColumns: semCabecalho ? "2fr 1.3fr 1fr 1fr 1fr" : undefined, gap: 8,
          padding: semCabecalho ? "12px 16px" : 0, borderBottom: semCabecalho ? `1px solid ${C.line}` : "none",
        }}>
          {semCabecalho && ["ALUNO", "CONTATO", "GÊNERO", "STATUS", ""].map((h) => (
            <div key={h} style={{ color: C.mut, fontSize: 10.5, fontWeight: 800, letterSpacing: 0.5 }}>{h}</div>
          ))}
        </div>
        {filtrados.slice(0, 200).map(({ t, s }) => {
          const chave = `${t.id}:${s.id}`;
          const temGenero = s.genero === "M" || s.genero === "F";
          if (!semCabecalho) {
            return (
              <Painel key={chave} onClick={() => abrirEdicao({ t, s })} style={{
                display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "10px 12px", marginBottom: 6,
              }}>
                <Avatar foto={fotos[chave]} nome={s.name} size={32} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                    {s.name}
                    {s.approved === false && <span style={{ color: C.amberSoft, fontSize: 10 }}>⏳ pendente</span>}
                    {!temGenero && <span style={{ color: C.oak, fontSize: 10 }}>⚧ sem gênero</span>}
                  </div>
                  <div style={{ color: C.mut, fontSize: 11 }}>{t.label}{s.phone ? ` · ${fmtPhone(s.phone)}` : ""}</div>
                </div>
                <span style={{ color: C.tealSoft, fontSize: 11, fontWeight: 800, flexShrink: 0 }}>EDITAR ›</span>
              </Painel>
            );
          }
          return (
            <div key={chave} style={{ display: "grid", gridTemplateColumns: "2fr 1.3fr 1fr 1fr 1fr", gap: 8, padding: "12px 16px", borderBottom: `1px solid ${C.line}`, alignItems: "center", fontSize: 13 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <Avatar foto={fotos[chave]} nome={s.name} size={30} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                  <div style={{ color: C.mut, fontSize: 10.5 }}>{t.label}</div>
                </div>
              </div>
              <div style={{ color: C.mut }}>{s.phone ? fmtPhone(s.phone) : "—"}</div>
              <div>
                <span style={{
                  color: temGenero ? C.ok : C.oak, background: C.panelSoft, borderRadius: 6, padding: "3px 9px",
                  fontSize: 10.5, fontWeight: 800,
                }}>{temGenero ? (s.genero === "F" ? "Feminino" : "Masculino") : "Não informado"}</span>
              </div>
              <div>
                <span style={{
                  color: s.approved === false ? C.oak : C.ok, background: C.panelSoft, borderRadius: 6, padding: "3px 9px",
                  fontSize: 10.5, fontWeight: 800,
                }}>{s.approved === false ? "Pendente" : "Aprovado"}</span>
              </div>
              <div style={{ textAlign: "right" }}>
                <button onClick={() => abrirEdicao({ t, s })} style={{
                  ...btnFantasma(), border: `1px solid ${C.line}`, borderRadius: 8, padding: "6px 12px", fontSize: 11.5,
                }}>Editar</button>
              </div>
            </div>
          );
        })}
        {filtrados.length === 0 && (
          <div style={{ padding: 24, textAlign: "center", color: C.mut, fontSize: 13 }}>Nenhum cadastro encontrado.</div>
        )}
      </Painel>
      {filtrados.length > 200 && (
        <div style={{ color: C.mut, fontSize: 11, textAlign: "center", marginTop: 8 }}>Mostrando os primeiros 200 — refine a busca pra achar mais rápido.</div>
      )}
    </>
  );
}

function TelaGestaoAdmins({ adminsReg, salvarAdmins, allData, fotos, avisar, semCabecalho, voltar }) {
  const vazio = { id: null, nome: "", usuario: "", pin: "", unidade: "prudente", papel: "aluno", permissoes: {} };
  const [form, setForm] = useState(vazio);
  const [confirmar, setConfirmar] = useState(null);
  const [buscaAluno, setBuscaAluno] = useState("");
  const salvar = () => {
    if (!form.nome.trim() || !form.usuario.trim() || !form.pin.trim()) {
      const faltando = [!form.nome.trim() && "nome", !form.usuario.trim() && "usuário", !form.pin.trim() && "PIN"].filter(Boolean).join(", ");
      avisar(`⚠️ Preencha ${faltando} antes de salvar.`);
      return;
    }
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
      {!semCabecalho && <CabecalhoTela titulo="TODOS OS CADASTROS"
        sub="Só você (dona do app) vê esta central. Promova qualquer pessoa, use um papel pronto e ajuste permissão por permissão."
        voltar={voltar} />}
      {semCabecalho && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ color: C.mut, fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>PAINEL ADMINISTRATIVO</div>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: 0.3 }}>Gestão de administradores</div>
          <div style={{ color: C.mut, fontSize: 13, marginTop: 4 }}>Cadastros, papéis e permissões em um só lugar</div>
        </div>
      )}

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
          <button style={{ ...btnPrimario(), flex: 2, opacity: form.nome.trim() && form.usuario.trim() && form.pin.trim() ? 1 : 0.7 }} onClick={salvar}>SALVAR</button>
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
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, overflow: "hidden",
              }}>
                {(d.icone || "urso") === "urso"
                  ? <img src={ursoLogoDesafioImg} alt={d.nome} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <Ic nome={d.icone} size={40} stroke={1.4} style={{ color: C.oak }} />}
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
// ---------- Indicar um Amigo: ticket dourado a cada meta batida ----------
function TicketIndicacao({ n, alcancado, premio }) {
  const cor = alcancado ? "#D4AF37" : C.line;
  return (
    <div title={premio ? (alcancado ? `🎉 ${premio}` : `Prêmio em ${n} indicações: ${premio}`) : `Ticket ${n}`} style={{
      aspectRatio: "1.4", border: `2px dashed ${cor}`, borderRadius: 10,
      display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center",
      padding: 4, background: alcancado && premio ? "rgba(212,175,55,.1)" : "transparent",
      opacity: alcancado ? 1 : 0.5,
    }}>
      {premio ? (
        <span style={{ fontSize: 8.5, fontWeight: 800, color: alcancado ? "#D4AF37" : C.mut, lineHeight: 1.15 }}>
          {alcancado ? premio : `🎟️ ${n}`}
        </span>
      ) : (
        <span style={{ fontSize: 11, fontWeight: 800, color: alcancado ? C.oak : C.mut }}>{alcancado ? "✓" : n}</span>
      )}
    </div>
  );
}

function TelaIndicarAmigo({ minhasIndicacoes = [], indicarAmigo, avisar, voltar }) {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const qtd = minhasIndicacoes.length;
  const proximaMeta = METAS_INDICACAO.find((m) => qtd < m.qtd);

  const enviar = () => {
    const n = nome.trim().replace(/\s+/g, " ");
    if (n.split(" ").filter((w) => w.length >= 2).length < 2) { avisar("Digite nome e sobrenome do seu amigo."); return; }
    const tel = telefone.replace(/\D/g, "");
    if (tel.length < 10 || tel.length > 11) { avisar("WhatsApp com DDD, só números (ex.: 18999342345)."); return; }
    indicarAmigo(n, tel);
    setNome(""); setTelefone("");
  };

  return (
    <>
      <CabecalhoTela titulo="INDICAR UM AMIGO" sub="Você indica, seu amigo ganha, você ganha." voltar={voltar} />

      <Painel style={{ marginBottom: 18 }}>
        <div style={{ color: C.cream, fontSize: 13, lineHeight: 1.5 }}>
          Aqui você indica um amigo, ele ganha e você ganha. Ele ganha{" "}
          <b style={{ color: C.oak }}>2 aulas bônus a cada 10 aulas compradas</b>, e você acumula tickets rumo a esses prêmios:
        </div>
        <div style={{ marginTop: 10, display: "grid", gap: 4 }}>
          {METAS_INDICACAO.map((m) => (
            <div key={m.qtd} style={{ fontSize: 12, color: C.mut }}>
              <b style={{ color: C.oak }}>{m.qtd} indicações</b> — {m.premio}
            </div>
          ))}
        </div>
      </Painel>

      <div style={{ color: C.oak, fontWeight: 800, fontSize: 12.5, letterSpacing: 1, marginBottom: 8 }}>
        🎟️ SEUS TICKETS ({qtd}/{TOTAL_TICKETS_INDICACAO})
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 8 }}>
        {Array.from({ length: TOTAL_TICKETS_INDICACAO }, (_, i) => i + 1).map((n) => {
          const meta = METAS_INDICACAO.find((m) => m.qtd === n);
          return <TicketIndicacao key={n} n={n} alcancado={qtd >= n} premio={meta ? meta.premio : null} />;
        })}
      </div>
      {proximaMeta ? (
        <div style={{ color: C.mut, fontSize: 11.5, marginBottom: 22 }}>
          Faltam <b style={{ color: C.oak }}>{proximaMeta.qtd - qtd}</b> indicaç{proximaMeta.qtd - qtd === 1 ? "ão" : "ões"} pra {proximaMeta.premio}.
        </div>
      ) : (
        <div style={{ color: C.ok, fontSize: 11.5, marginBottom: 22, fontWeight: 700 }}>🏆 Você já desbloqueou todos os prêmios!</div>
      )}

      <div style={{ color: C.oak, fontWeight: 800, fontSize: 12.5, letterSpacing: 1, marginBottom: 8 }}>➕ NOVA INDICAÇÃO</div>
      <Painel style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <input style={inputStyle()} placeholder="Nome do amigo" value={nome} onChange={(e) => setNome(e.target.value)} />
        <input style={inputStyle()} type="tel" inputMode="numeric" placeholder="WhatsApp do amigo — com DDD"
          value={telefone} onChange={(e) => setTelefone(e.target.value.replace(/\D/g, "").slice(0, 11))} />
        <button style={btnPrimario()} onClick={enviar}>Indicar amigo</button>
      </Painel>

      {minhasIndicacoes.length > 0 && (
        <>
          <div style={{ color: C.oak, fontWeight: 800, fontSize: 12.5, letterSpacing: 1, margin: "20px 0 8px" }}>📋 SUAS INDICAÇÕES</div>
          <div style={{ display: "grid", gap: 6 }}>
            {[...minhasIndicacoes].sort((a, b) => b.ts - a.ts).map((r) => (
              <Painel key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px" }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{r.nome}</span>
                <span style={{ fontSize: 11, color: C.mut }}>{agoLabel(r.ts)}</span>
              </Painel>
            ))}
          </div>
        </>
      )}
    </>
  );
}

function TelaPerfil({ sessao, aluno, perfil, foto, salvarPerfil, sair, admin, tema, mudarTema, salvarGenero, irFotos, voltar }) {
  const [bio, setBio] = useState(perfil.bio || "");
  const [editandoBio, setEditandoBio] = useState(false);
  const generoAtual = aluno && (aluno.genero === "M" || aluno.genero === "F") ? aluno.genero : "F"; // legado sem valor = Feminino
  const [extra, setExtra] = useState({
    sapatilha: perfil.sapatilha || "", camiseta: perfil.camiseta || "",
    cpf: perfil.cpf || "", endereco: perfil.endereco || "",
    quemTrouxe: perfil.quemTrouxe || "", instagram: perfil.instagram || "",
  });
  const [editandoExtra, setEditandoExtra] = useState(false);
  useEffect(() => { setBio(perfil.bio || ""); }, [perfil.bio]);

  return (
    <>
      <CabecalhoTela titulo="EDITAR MEU PERFIL" voltar={voltar} />
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
        {aluno && salvarGenero && !sessao.staff && (
          <div style={{ marginTop: 4 }}>
            <div style={{ fontSize: 13, marginBottom: 6 }}>
              <span style={{ color: C.mut }}>Gênero: </span>{generoAtual === "M" ? "Masculino" : "Feminino"}
              <span style={{ color: C.mut, fontSize: 10.5 }}> (usado nas mensagens da Comunidade)</span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {[["F", "Feminino"], ["M", "Masculino"]].map(([v, rot]) => (
                <button key={v} onClick={() => salvarGenero(v)} style={{
                  flex: 1, background: generoAtual === v ? C.teal : C.panelSoft,
                  color: generoAtual === v ? "#F2F2F2" : C.cream,
                  border: `1px solid ${generoAtual === v ? C.teal : C.line}`,
                  borderRadius: 10, padding: "9px 0", fontWeight: 800, cursor: "pointer", fontSize: 12.5, fontFamily: "inherit",
                }}>{rot}</button>
              ))}
            </div>
          </div>
        )}
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
