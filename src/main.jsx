import "./storage.js";
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import Comunidade from "./Comunidade.jsx";

// ── Portas do prédio ─────────────────────────────────────────────
// 1) arenaspin.com.br (e www)             → COMUNIDADE (casa nova)
// 2) comunidade.spincycleprudente.com.br  → COMUNIDADE (se um dia criar)
// 3) caminho secreto no domínio do Desafio → COMUNIDADE (preview antigo)
// 4) qualquer outro endereço              → DESAFIO, como sempre
// Futuro (fase 3): desafio.arenaspin.com → Desafio (já previsto abaixo)

const CAMINHO_SECRETO = "#/rt-oculto-0813"; // TROQUE pelo seu

const h = window.location.hostname;
const ehArenaSpin = h === "arenaspin.com.br" || h === "www.arenaspin.com.br";
const ehDesafioNaArena = h.startsWith("desafio.") || h.startsWith("missoes.");

const ehComunidade =
  (ehArenaSpin && !ehDesafioNaArena) ||
  h.startsWith("comunidade.") ||
  window.location.hash.startsWith(CAMINHO_SECRETO);

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {ehComunidade ? <Comunidade /> : <App />}
  </React.StrictMode>
);
