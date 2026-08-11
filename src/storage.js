// Adaptador de armazenamento do Desafio das Missões.
// Dados COMPARTILHADOS (alunos, aulas, vencedores) -> Firebase Realtime Database (REST).
// Dados PESSOAIS (senhas lembradas neste aparelho, desafio escolhido) -> localStorage.
const DB = (import.meta.env.VITE_FIREBASE_DB_URL || "").replace(/\/+$/, "");
const esc = (k) => encodeURIComponent(k);

window.storage = {
  async get(key, shared) {
    if (shared && DB) {
      const r = await fetch(`${DB}/shared/${esc(key)}.json`);
      if (!r.ok) throw new Error(`storage.get ${r.status}`);
      const v = await r.json();
      return v === null || v === undefined ? null : { key, value: v, shared: true };
    }
    const v = localStorage.getItem(key);
    return v === null ? null : { key, value: v, shared: false };
  },
  async set(key, value, shared) {
    if (shared && DB) {
      const r = await fetch(`${DB}/shared/${esc(key)}.json`, { method: "PUT", body: JSON.stringify(value) });
      if (!r.ok) throw new Error(`storage.set ${r.status}`);
      return { key, value, shared: true };
    }
    localStorage.setItem(key, value);
    return { key, value, shared: false };
  },
  async delete(key, shared) {
    if (shared && DB) {
      await fetch(`${DB}/shared/${esc(key)}.json`, { method: "DELETE" });
      return { key, deleted: true, shared: true };
    }
    localStorage.removeItem(key);
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
