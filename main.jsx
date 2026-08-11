import "./storage.js";
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import Comunidade from "./Comunidade.jsx";

// ============================================================
// PORTA SECRETA DA COMUNIDADE
// Para entrar: https://desafio.spincycleprudente.com.br/#/rt-oculto-0813
// (troque o caminho abaixo por um só seu antes de divulgar)
// ============================================================
const CAMINHO_SECRETO = "#/rt-oculto-0813";

const ehComunidade = () =>
  window.location.hash.startsWith(CAMINHO_SECRETO) ||
  window.location.hostname.startsWith("comunidade.");

// Se o endereço mudar com o app já aberto (ex.: colar o link na mesma aba),
// recarrega a página para trocar entre Desafio e Comunidade na hora.
window.addEventListener("hashchange", () => window.location.reload());

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {ehComunidade() ? <Comunidade /> : <App />}
  </React.StrictMode>
);
