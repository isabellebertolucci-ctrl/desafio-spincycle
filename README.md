# Desafio das Missões · Spincycle Prudente 🚴

App do desafio de gamificação do estúdio Spincycle Prudente (5/ago a 20/set de 2026):
cartela de 9 missões, 3 desafios separados (Ilimitados, Pacotes e Híbridos), ranking com
senha individual, validação pela recepção e premiação automática.

## Ficha técnica (para a Vercel)

| Item | Valor |
|---|---|
| **Framework** | Vite + React (a Vercel detecta sozinha) |
| **Comando de instalação** | `npm install` |
| **Comando de build** | `npm run build` |
| **Pasta de saída** | `dist` |
| **Variável de ambiente** | `VITE_FIREBASE_DB_URL` (URL do Realtime Database do Firebase) |

Sem a variável configurada, o app entra em **modo demonstração**: funciona, mas salva os
dados apenas no aparelho de quem abriu (nada é compartilhado). Com a variável, todos os
usuários leem e gravam no mesmo banco.

---

## Passo 1 — Criar o banco de dados (Firebase, grátis, ~10 min)

1. Acesse https://console.firebase.google.com e entre com sua conta Google.
2. **Adicionar projeto** → nome `desafio-spincycle` → pode desativar o Analytics → **Criar projeto**.
3. Menu lateral: **Criação (Build) → Realtime Database → Criar banco de dados** →
   local `United States` → **Modo bloqueado** → Ativar.
4. Aba **Regras** → substitua tudo por:

```json
{
  "rules": {
    "shared": {
      ".read": true,
      ".write": true
    }
  }
}
```

   → **Publicar**.
5. Aba **Dados** → copie a **URL do banco**
   (ex.: `https://desafio-spincycle-default-rtdb.firebaseio.com`).

## Passo 2 — Subir no GitHub

1. Crie o repositório em https://github.com → **New repository** → `desafio-spincycle` → **Private**.
2. Na página do repositório → **uploading an existing file** → arraste todos os arquivos
   desta pasta (NUNCA envie `node_modules`, `dist` ou `.env` — o `.gitignore` já cuida disso
   se você usar git) → **Commit changes**.

## Passo 3 — Publicar na Vercel

1. https://vercel.com → entrar **com o GitHub**.
2. **Add New → Project** → importe `desafio-spincycle` (framework **Vite** detectado sozinho).
3. Em **Environment Variables**, adicione:
   - Name: `VITE_FIREBASE_DB_URL`
   - Value: a URL copiada no Passo 1.5
4. **Deploy** → em ~1 min o app está no ar. Personalize o endereço em *Settings → Domains*.

## Atualizações futuras

Troque o conteúdo de `src/App.jsx` no GitHub (botão de lápis → colar → Commit).
A Vercel republica sozinha. **Os dados nunca são afetados** — moram no Firebase,
separados do código.

## Rodar no computador (opcional)

```bash
npm install
cp .env.example .env    # preencha a VITE_FIREBASE_DB_URL
npm run dev
```

## Segurança — leia antes de divulgar

- As **senhas da administração** ficam no código do app (arquivo `src/App.jsx`, constante
  `ADMINS`). Isso barra o uso casual, mas alguém com conhecimento técnico consegue
  encontrá-las inspecionando o site. Para o porte deste desafio é um risco aceitável,
  mas **não use nelas nenhuma senha que você utilize em outros serviços**.
- O banco Firebase fica com o nó `shared` público (leitura/escrita) — mesmo nível de
  confiança do restante do app. Se um dia precisar de segurança de verdade (pagamentos,
  dados sensíveis), o caminho é adicionar autenticação — fora do escopo deste projeto.
- As senhas dos alunos protegem as cartelas dentro da dinâmica do jogo; não são
  criptografadas. Oriente os alunos a criarem uma senha simples, exclusiva do desafio.

## Estrutura

```
├── index.html          # página base (PWA: manifest, ícones, Tailwind via CDN)
├── package.json        # dependências e scripts
├── vite.config.js      # configuração do build (Vite + React)
├── vercel.json         # fallback de rotas para SPA (refresh nunca dá 404)
├── .env.example        # modelo das variáveis de ambiente
├── .gitignore          # node_modules, dist, .env fora do repositório
├── public/             # manifest PWA + ícones do ursinho (192/512/apple)
└── src/
    ├── App.jsx         # o Desafio das Missões completo
    ├── storage.js      # dados: Firebase (compartilhado) + localStorage (aparelho)
    └── main.jsx        # ponto de entrada React
```

Feito com carinho pela Raquel 🩵 (com uma ajudinha do Claude).
