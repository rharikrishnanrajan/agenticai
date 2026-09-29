# 🤖 TechDesk AI – Intelligent Technical Documentation Agent

A production-ready full-stack AI Technical Support Agent built with **Google Gemini** · **LangChain 1.4** · **LangGraph Memory** · **Flask REST API** · **React 19 + Vite**.

> **Security-hardened** — CORS restrictions, security headers, input validation, secret management, and environment isolation are all baked in.

---

## 🌐 Live URLs

| Interface | URL | Description |
|-----------|-----|-------------|
| **React Frontend** | [http://localhost:5173](http://localhost:5173) | React 19 UI with Vite HMR (development) |
| **Flask Backend** | [http://localhost:5000](http://localhost:5000) | Python REST API server |

---

## 🏗️ Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                     React 19 + Vite  (Port 5173)                    │
│                                                                      │
│  ┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌──────────────┐    │
│  │  Chat    │  │    Error     │  │  Docs    │  │ API Settings │    │
│  │  Agent   │  │  Debugger    │  │ Explorer │  │    Panel     │    │
│  └────┬─────┘  └──────┬───────┘  └────┬─────┘  └──────┬───────┘    │
│       └───────────────┴───────────────┴───────────────┘            │
│                               │                                     │
│               Vite Dev Proxy  (/api → :5000)                        │
└───────────────────────────────┼─────────────────────────────────────┘
                                │
┌───────────────────────────────┼─────────────────────────────────────┐
│                  Flask REST API  (Port 5000)                        │
│                                                                      │
│  POST   /api/chat          → Agent conversation with memory         │
│  POST   /api/session       → Create new session                     │
│  GET    /api/history/:id   → Retrieve conversation history          │
│  DELETE /api/clear/:id     → Wipe session memory                    │
│  GET    /api/tools         → List available agent tools             │
│  POST   /api/tool-direct   → Execute a tool directly                │
│  GET    /api/config        → Agent status & API key info            │
│  POST   /api/config        → Update API key (persists to .env)      │
│  POST   /api/test-key      → Validate API key against Google Gemini │
│  GET    /api/health        → Health check                           │
│                                                                      │
│  Security: CORS whitelist · Security headers · UUID validation      │
│            Input length cap · 1 MB body limit · Key sanitisation    │
└───────────────────────────────┼─────────────────────────────────────┘
                                │
┌───────────────────────────────┼─────────────────────────────────────┐
│           LangChain 1.4 Agent + LangGraph StateGraph                │
│                                                                      │
│  ┌──────────────────┐  ┌─────────────────────────────────────────┐  │
│  │  Google Gemini   │  │  MemorySaver (Thread-Scoped)            │  │
│  │  gemini-3.8-flash│  │  Per-session conversation checkpoints   │  │
│  └──────────────────┘  └─────────────────────────────────────────┘  │
│                                                                      │
│  📚 search_official_docs  → Python · MDN · React · GitHub · Node   │
│  🌐 search_web            → DuckDuckGo technical search            │
│  📖 search_wikipedia      → CS concepts & architecture patterns    │
│  🐛 explain_error         → Stack trace root-cause analysis        │
│  ⚖️  compare_technologies  → Framework / tool comparison           │
│                                                                      │
│  Fallback: If Gemini returns PERMISSION_DENIED, tools execute       │
│  directly to still deliver documentation results.                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Project Structure

```
Agentic AI/
│
├── backend/                    # 🐍 Python Backend
│   ├── app.py                  # Flask REST API – CORS, security headers, chat, config
│   ├── agent.py                # LangChain 1.4 Agent – MemorySaver + 5 tools
│   ├── requirements.txt        # Python dependencies
│   └── .env                    # ⚠️ Local secrets – NEVER commit (git-ignored)
│
├── frontend/                   # ⚛️ React 19 + Vite Frontend
│   ├── package.json            # Dependencies (React 19, Lucide React, React Markdown)
│   ├── vite.config.js          # Dev server + reverse proxy (/api → port 5000)
│   ├── index.html              # App shell – Google Fonts, meta tags
│   ├── public/                 # Static assets (favicon, logo)
│   └── src/
│       ├── main.jsx            # React entry point
│       ├── index.css           # Cyber Dark Design System (CSS variables, animations)
│       ├── App.css             # Component-level styles
│       └── App.jsx             # Full UI: Chat · Error Debugger · Docs Explorer · Settings
│
├── static/                     # Static HTML fallback UI (used if no React build)
│   ├── index.html              # Vanilla HTML frontend
│   ├── app.js                  # Vanilla JS logic
│   ├── style.css               # Vanilla CSS styles
│   └── favicon.png / logo.png  # Shared assets
│
├── .env                        # ⚠️ Root secrets – NEVER commit (git-ignored)
├── .env.example                # ✅ Environment variable template – safe to commit
├── .gitignore                  # Security-hardened – covers keys, certs, cloud creds, CI
└── README.md                   # This file
```

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.10+** with `pip`
- **Node.js 18+** with `npm`
- A **Google Gemini API key** → [Get one free](https://aistudio.google.com/app/apikey)

---

### 1. Clone & Set Up Environment

```bash
git clone https://github.com/rharikrishnanrajan/agenticai.git
cd agenticai
```

Copy the environment template and fill in your key:

```bash
# Windows
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

Edit **`.env`** (and `backend/.env` with the same key):

```env
GOOGLE_API_KEY=AIzaSy...your_key_here
FLASK_ENV=development
FLASK_SECRET_KEY=your_random_secret_here
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

> **Generate a secure secret key:**
> ```bash
> python -c "import secrets; print(secrets.token_hex(32))"
> ```

---

### 2. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

---

### 3. Start the Flask Backend (Terminal 1)

```bash
cd backend
python app.py
```

Server starts at `http://127.0.0.1:5000`

---

### 4. Install & Start the React Frontend (Terminal 2)

```bash
cd frontend
npm install        # first time only
npm run dev
```

UI available at `http://localhost:5173`

---

### 5. Open the App

Navigate to **[http://localhost:5173](http://localhost:5173)** in your browser.

> You can also configure your API key directly from the **Settings** tab in the UI — no restart needed.

---

## 🎨 Frontend Features

### 💬 Chat Agent
- **Multi-turn conversation** with full LangGraph memory across the session
- **Markdown rendering** with syntax-highlighted code blocks and one-click copy
- **Tool badges** showing which tools the agent invoked
- **Quick prompt chips** for common technical questions
- **Multiple sessions** with browser-persisted history and session switching

### 🐛 Error Debugger
- Paste any **stack trace, compiler error, or runtime exception**
- Instantly searches StackOverflow & GitHub Issues for root-cause analysis
- Returns: **(a)** Root Cause · **(b)** Quick Fix snippet · **(c)** Prevention tips

### 📚 Docs Explorer
- Query verified **official documentation** directly:
  - Python Docs (`docs.python.org`) · MDN Web Docs · React.dev · GitHub Docs · Node.js Docs

### ⚙️ API Settings
- View agent architecture (model, framework, memory engine)
- **Manage Gemini API Key**: test connection, save, and reload live — no server restart needed

---

## 🔌 REST API Reference

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `POST` | `/api/session` | — | Create new conversation session |
| `POST` | `/api/chat` | `{session_id, message}` | Send message to agent |
| `GET` | `/api/history/:id` | — | Get conversation history |
| `DELETE` | `/api/clear/:id` | — | Wipe session memory |
| `GET` | `/api/tools` | — | List available tools with metadata |
| `POST` | `/api/tool-direct` | `{tool_id, query}` | Execute a tool directly |
| `GET` | `/api/config` | — | Get agent config & API key status |
| `POST` | `/api/config` | `{api_key}` | Update API key |
| `POST` | `/api/test-key` | `{api_key}` | Validate key against Google |
| `GET` | `/api/health` | — | Health check |

---

## 🧠 Agent Tools

| Tool | ID | Description | Sources |
|------|----|-------------|---------|
| **Official Docs Search** | `search_official_docs` | Queries verified technical documentation | Python Docs · MDN · React.dev · GitHub Docs · Node.js |
| **Technical Web Search** | `search_web` | Broad technical search | DuckDuckGo (StackOverflow, GitHub, blogs) |
| **Wikipedia Reference** | `search_wikipedia` | CS concepts, algorithms, architecture patterns | Wikipedia API |
| **Error Solver** | `explain_error` | Diagnoses stack traces & runtime errors | DuckDuckGo (StackOverflow, GitHub Issues) |
| **Tech Comparison** | `compare_technologies` | Side-by-side framework/tool comparison | DuckDuckGo (benchmarks, articles) |

---

## 🔐 Security

### Secrets Management
| Practice | Status |
|----------|--------|
| `.env` files git-ignored | ✅ |
| `.env.example` template committed (no real secrets) | ✅ |
| API key masked in all API responses | ✅ |
| Key sanitised before use (strip quotes/whitespace) | ✅ |

### API Security
| Control | Detail |
|---------|--------|
| **CORS** | Restricted to explicit `ALLOWED_ORIGINS` — no wildcard `*` |
| **Security Headers** | `X-Frame-Options: DENY` · `X-Content-Type-Options: nosniff` · `X-XSS-Protection` · `Referrer-Policy` · `Cache-Control: no-store` |
| **Input Length Cap** | Chat messages capped at 4000 chars (configurable via `MAX_MESSAGE_LENGTH`) |
| **Body Size Limit** | Max 1 MB per request — prevents DoS via large payloads |
| **Session ID Validation** | UUID format enforced — prevents path traversal / injection |
| **API Key Validation** | Format + length check before persisting a new key |
| **Error Sanitisation** | Internal errors never leak raw stack traces to the client |
| **Host Binding** | Bound to `127.0.0.1` by default; set `FLASK_HOST=0.0.0.0` only behind a reverse proxy |

### .gitignore Coverage
Protects against committing: `.env` files · private keys (`*.pem`, `*.key`) · SSH keys · OAuth tokens · cloud credentials (AWS, GCP, Azure, Firebase) · security scan outputs (Bandit, Semgrep, Snyk, Trivy) · Docker/Terraform secrets · CI/CD overrides.

> **⚠️ If you have accidentally committed a `.env` file, rotate your API key immediately then run:**
> ```bash
> git rm --cached .env backend/.env
> git commit -m "chore: remove accidentally tracked env files"
> ```

---

## 🔑 Google Gemini API Key

### Getting a Free Key
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click **"Create API Key"**
3. Keys typically start with `AIzaSy...`

### Configuring the Key

**Option A – Web UI (recommended):**
1. Open the app → click **Settings** tab
2. Click **"Configure Key"**
3. Paste your key → click **"Test Connection"**
4. Click **"Save & Apply"** — no restart needed

**Option B – Edit `.env` directly:**
```env
GOOGLE_API_KEY=AIzaSy...your_key_here
```
Then restart the backend with `python app.py`.

### PERMISSION_DENIED Fallback
If your key has restricted project permissions (`403 PERMISSION_DENIED`), the agent automatically falls back to executing documentation tools directly — you still get useful technical answers from official docs, just without generative AI reasoning.

---

## 📦 Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **LLM** | Google Gemini (`gemini-3.8-flash`) | Latest |
| **Orchestration** | LangChain + LangGraph | 1.4.x |
| **Memory** | MemorySaver (Thread-scoped Checkpointer) | LangGraph built-in |
| **Backend** | Flask + Flask-CORS | 3.x |
| **Frontend** | React + Vite | React 19 / Vite 8.x |
| **Icons** | Lucide React | 1.48.x |
| **Markdown** | React Markdown | 10.x |
| **Linting** | oxlint | 1.x |
| **Search** | DuckDuckGo Search + Wikipedia API | Latest |
| **Language** | Python 3.10+, JavaScript ES2024 | — |

---

## 🧪 Environment Variables Reference

All variables are documented in [`.env.example`](.env.example):

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GOOGLE_API_KEY` | ✅ Yes | — | Google Gemini API key |
| `FLASK_ENV` | No | `development` | `development` enables debug mode |
| `FLASK_SECRET_KEY` | Recommended | — | Flask session signing key |
| `FLASK_HOST` | No | `127.0.0.1` | Bind address (`0.0.0.0` for production behind proxy) |
| `FLASK_PORT` | No | `5000` | Backend port |
| `ALLOWED_ORIGINS` | No | `http://localhost:5173,...` | Comma-separated CORS allowed origins |
| `MAX_MESSAGE_LENGTH` | No | `4000` | Max chat message size (characters) |
