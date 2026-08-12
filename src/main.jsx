import "./storage.js";
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import Comunidade from "./Comunidade.jsx";

// ============================================================
// UM PRÉDIO, DUAS PORTAS OFICIAIS
//   arenaspin.com.br                      → Comunidade (Arena)
//   desafio.spincycleprudente.com.br      → Desafio das Missões
// A porta secreta (#/rt-oculto-...) foi aposentada: a Arena
// tem endereço próprio, entrada provisória não se usa mais.
// ============================================================
const h = window.location.hostname;
const ehComunidade =
  h === "arenaspin.com.br" ||
  h.endsWith(".arenaspin.com.br") ||
  h.startsWith("comunidade.");

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {ehComunidade ? <Comunidade /> : <App />}
  </React.StrictMode>
);
