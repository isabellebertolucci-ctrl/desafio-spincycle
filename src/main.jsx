import "./storage.js";
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import Comunidade from "./Comunidade.jsx";

// Caminho secreto da Comunidade — TROQUE por um só seu antes de salvar!
// Para entrar: https://desafio.spincycleprudente.com.br/#/rt-oculto-0813
const CAMINHO_SECRETO = "#/rt-oculto-0813";

const ehComunidade =
  window.location.hash.startsWith(CAMINHO_SECRETO) ||
  window.location.hostname.startsWith("comunidade.");

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {ehComunidade ? <Comunidade /> : <App />}
  </React.StrictMode>
);