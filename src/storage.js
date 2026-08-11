// Adaptador de armazenamento do Desafio das Missões.
// Dados COMPARTILHADOS (alunos, aulas, vencedores) -> Firebase Realtime Database (REST).
// Dados PESSOAIS (senhas lembradas neste aparelho, desafio escolhido) -> localStorage.
//
// Regra de ouro: NENHUMA chamada pode ficar pendurada para sempre.
// Toda requisição tem prazo máximo; se estourar, falha de forma limpa
// para o app tratar — em vez de travar na tela de "Carregando…".
const DB = (import.meta.env.VITE_FIREBASE_DB_URL || "").replace(/\/+$/, "");
const esc = (k) => encodeURIComponent(k);

const PRAZO_LEITURA = 12000;   // 12s
const PRAZO_ESCRITA = 15000;   // 15s
const TENTATIVAS = 3;

// fetch com prazo máximo — cancela sozinho se demorar demais
async function fetchComPrazo(url, opcoes, prazo) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), prazo);
  try {
    return await fetch(url, { ...(opcoes || {}), signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

// tenta algumas vezes antes de desistir (rede instável é comum no celular)
async function comRetentativa(fn, quantas = TENTATIVAS) {
  let ultimoErro = null;
  for (let i = 1; i <= quantas; i++) {
    try {
      return await fn();
    } catch (e) {
      ultimoErro = e;
      const abortou = e && (e.name === "AbortError" || /aborted/i.test(e.message || ""));
      if (abortou) console.warn(`[storage] tentativa ${i}/${quantas} estourou o prazo`);
      if (i < quantas) await new Promise((r) => setTimeout(r, 400 * i));
    }
  }
  throw ultimoErro || new Error("storage: falha desconhecida");
}

window.storage = {
  async get(key, shared) {
    if (shared && DB) {
      return comRetentativa(async () => {
        const r = await fetchComPrazo(`${DB}/shared/${esc(key)}.json`, { cache: "no-store" }, PRAZO_LEITURA);
        if (!r.ok) throw new Error(`storage.get ${r.status}`);
        const v = await r.json();
        return v === null || v === undefined ? null : { key, value: v, shared: true };
      });
    }
    try {
      const v = localStorage.getItem(key);
      return v === null ? null : { key, value: v, shared: false };
    } catch {
      return null; // navegador com armazenamento bloqueado
    }
  },

  async set(key, value, shared) {
    if (shared && DB) {
      return comRetentativa(async () => {
        const r = await fetchComPrazo(
          `${DB}/shared/${esc(key)}.json`,
          { method: "PUT", body: JSON.stringify(value) },
          PRAZO_ESCRITA
        );
        if (!r.ok) throw new Error(`storage.set ${r.status}`);
        return { key, value, shared: true };
      });
    }
    try {
      localStorage.setItem(key, value);
      return { key, value, shared: false };
    } catch (e) {
      throw new Error("Não foi possível salvar neste aparelho: " + (e.message || ""));
    }
  },

  async delete(key, shared) {
    if (shared && DB) {
      return comRetentativa(async () => {
        const r = await fetchComPrazo(`${DB}/shared/${esc(key)}.json`, { method: "DELETE" }, PRAZO_ESCRITA);
        if (!r.ok) throw new Error(`storage.delete ${r.status}`);
        return { key, deleted: true, shared: true };
      });
    }
    try { localStorage.removeItem(key); } catch { /* ok */ }
    return { key, deleted: true, shared: false };
  },

  async list(prefix, shared) {
    return { keys: [], prefix, shared: !!shared };
  },
};

if (!DB) {
  console.warn(
    "[Desafio] VITE_FIREBASE_DB_URL não configurada — os dados ficarão salvos SÓ neste aparelho (modo demonstração)."
  );
}
