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
│   ├── .env                    # ⚠️ Local secrets – NEVER commit (git-ignored)
│   └── .env.example            # ✅ Safe template – commit this instead
│
├── frontend/                   # ⚛️ React 19 + Vite Frontend
│   ├── package.json            # Dependencies (React 19, Lucide icons, React Markdown)
│   ├── vite.config.js          # Dev server + reverse proxy (/api → port 5000)
│   ├── index.html              # Cyber dark theme, Google Fonts, favicon
│   ├── public/                 # Static assets (favicon.png, logo.png)
│   └── src/
│       ├── main.jsx            # React entry point
│       ├── index.css           # Cyber Dark Design System (CSS variables)
│       └── App.jsx             # UI: Chat · Error Debugger · Docs Explorer · Settings
│
├── static/                     # Legacy static HTML UI (fallback if no React build)
│
├── .env                        # ⚠️ Root secrets – NEVER commit (git-ignored)
├── .env.example                # ✅ Environment variable template
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
# Copy the template – never edit .env.example directly
cp .env.example .env
cp backend/.env.example backend/.env   # if exists, otherwise edit backend/.env
```

Edit **`backend/.env`** (and optionally root `.env`):

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

Navigate to **[http://localhost:5173](http://localhost:5173)** — or configure your API key directly from the **Settings** tab in the UI.

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
  - Python Docs · MDN Web Docs · React.dev · GitHub Docs · Node.js Docs

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

This project follows security best practices implemented in the codebase:

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
| **CORS** | Restricted to explicit `ALLOWED_ORIGINS` (no wildcard `*`) |
| **Security Headers** | `X-Frame-Options: DENY` · `X-Content-Type-Options: nosniff` · `X-XSS-Protection` · `Referrer-Policy` · `Cache-Control: no-store` |
| **Input Length Cap** | Chat messages capped at 4000 chars (configurable via `MAX_MESSAGE_LENGTH`) |
| **Body Size Limit** | Max 1 MB per request — prevents DoS via large payloads |
| **Session ID Validation** | UUID format enforced — prevents path traversal / injection |
| **API Key Validation** | Format + length check before persisting a new key |
| **Error Sanitisation** | Internal errors never leak raw stack traces to the client |
| **Host Binding** | Bound to `127.0.0.1` by default; set `FLASK_HOST=0.0.0.0` only behind a reverse proxy |

### .gitignore Coverage
The `.gitignore` protects against committing:
- `.env` files, `*.key`, `*.pem`, `*.secret`, SSH keys, OAuth tokens
- Cloud credentials (AWS, GCP, Azure, Firebase)
- Security scan outputs (Bandit, Semgrep, Snyk, Trivy)
- Docker/Terraform secrets, CI/CD overrides

> **⚠️ If you've ever committed a `.env` file, rotate your API key immediately and run:**
> ```bash
> git rm --cached .env backend/.env
> git commit -m "chore: remove accidentally tracked env files"
> ```

---

## 🔑 Google Gemini API Key

### Getting a Free Key
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click **"Create API Key"**
3. Keys start with `AIzaSy...` (newer keys may use a different prefix)

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
Then restart the backend.

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
| **Frontend** | React + Vite | React 19 / Vite 8 |
| **Icons** | Lucide React | Latest |
| **Markdown** | React Markdown | Latest |
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
| `ALLOWED_ORIGINS` | No | `http://localhost:5173,...` | Comma-separated CORS origins |
| `MAX_MESSAGE_LENGTH` | No | `4000` | Max chat message size (chars) |

---

## 📝 License

MIT — see `LICENSE` for details.


---

## 🌐 Live URLs

| Interface | URL | Description |
|-----------|-----|-------------|
| **React Frontend** | [http://localhost:5173](http://localhost:5173) | Modern React 19 UI with Vite HMR (development) |
| **Flask Backend** | [http://localhost:5000](http://localhost:5000) | Python API server (also serves production build) |

---

## 🏗️ Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                        React 19 + Vite (Port 5173)                  │
│                                                                      │
│  ┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌──────────────┐    │
│  │ Chat     │  │ Error        │  │ Docs     │  │ API Settings │    │
│  │ Agent    │  │ Debugger     │  │ Explorer │  │ Panel        │    │
│  └────┬─────┘  └──────┬───────┘  └────┬─────┘  └──────┬───────┘    │
│       │               │               │               │            │
│       └───────────────┴───────────────┴───────────────┘            │
│                               │                                     │
│                    Vite Proxy (/api → :5000)                       │
└───────────────────────────────┼─────────────────────────────────────┘
                                │
┌───────────────────────────────┼─────────────────────────────────────┐
│                    Flask REST API (Port 5000)                       │
│                                                                      │
│  POST /api/chat        → Agent conversation with memory             │
│  POST /api/session     → Create new session                         │
│  GET  /api/history/:id → Retrieve conversation history              │
│  DELETE /api/clear/:id → Wipe session memory                        │
│  GET  /api/tools       → List available agent tools                 │
│  POST /api/tool-direct → Execute a tool directly                    │
│  GET  /api/config      → Agent status & API key info                │
│  POST /api/config      → Update API key (persists to .env)          │
│  POST /api/test-key    → Validate API key against Google Gemini     │
│  GET  /api/health      → Health check                               │
│                                                                      │
└───────────────────────────────┼─────────────────────────────────────┘
                                │
┌───────────────────────────────┼─────────────────────────────────────┐
│              LangChain 1.4 Agent + LangGraph StateGraph             │
│                                                                      │
│  ┌─────────────────┐   ┌──────────────────────────────────────┐     │
│  │ Google Gemini    │   │ MemorySaver (Thread-Scoped)          │     │
│  │ (gemini-3.8-     │   │ Per-session conversation checkpoint  │     │
│  │  flash)          │   │ via LangGraph thread_id              │     │
│  └─────────────────┘   └──────────────────────────────────────┘     │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │ Agent Tool Suite                                             │     │
│  │                                                               │     │
│  │ 📚 search_official_docs  → Python, MDN, React, GitHub, Node │     │
│  │ 🌐 search_web            → DuckDuckGo technical search      │     │
│  │ 📖 search_wikipedia      → CS concepts & architecture       │     │
│  │ 🐛 explain_error         → Stack trace root-cause analysis  │     │
│  │ ⚖️  compare_technologies  → Framework/tool comparison       │     │
│  └─────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │ Fallback: If Gemini returns PERMISSION_DENIED, tools are     │     │
│  │ executed directly to still provide documentation results.    │     │
│  └─────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Project Structure

```
d:/Agentic AI/
│
├── backend/                   # 🐍 Python Backend
│   ├── app.py                 # Flask REST API (CORS, session, chat, config, tools)
│   ├── agent.py               # LangChain 1.4 Agent (create_agent + MemorySaver + 5 tools)
│   ├── requirements.txt       # Python dependencies
│   └── .env                   # Google Gemini API key
│
├── frontend/                  # ⚛️ React 19 + Vite Frontend
│   ├── package.json           # Dependencies (React 19, Lucide icons, React Markdown)
│   ├── vite.config.js         # Dev server + reverse proxy (/api → port 5000)
│   ├── index.html             # Cyber dark theme, Google Fonts, favicon
│   ├── public/                # Static assets (favicon.png, logo.png)
│   └── src/
│       ├── main.jsx           # React entry point
│       ├── index.css          # Cyber Dark Modern Design System (CSS variables)
│       └── App.jsx            # Full UI: Chat, Error Debugger, Docs Explorer, Settings
│
├── static/                    # Legacy static HTML UI (fallback)
│
├── .env                       # Root API key (synced with backend/.env)
└── README.md                  # This documentation
```

---

## 🚀 How to Run

### Prerequisites
- **Python 3.10+** with pip
- **Node.js 18+** with npm

### 1. Install Python Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Set Your Google Gemini API Key
Edit `backend/.env`:
```env
GOOGLE_API_KEY="your_gemini_api_key_here"
```
Or configure it from the web UI after launching (click **Configure Key** in the top bar).

### 3. Start the Flask Backend (Terminal 1)
```bash
cd backend
python app.py
```
Runs at `http://localhost:5000`

### 4. Start the React Frontend (Terminal 2)
```bash
cd frontend
npm install    # first time only
npm run dev
```
Runs at `http://localhost:5173`

### 5. Open the App
Navigate to **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 🎨 Frontend Features

### 💬 Chat Agent Tab
- **Multi-turn conversation** with full LangGraph memory (remembers prior context)
- **Markdown rendering** with syntax-highlighted code blocks and one-click copy
- **Tool execution badges** showing which tools the agent used (Docs Search, Web Search, etc.)
- **Quick prompt chips** for common technical questions
- **Multiple sessions** with browser-persisted history and session switching

### 🐛 Error Debugger Tab
- Paste any **stack trace, compiler error, or runtime exception**
- Instantly searches StackOverflow and GitHub Issues for root-cause analysis and fixes
- Provides: **(a)** Root Cause, **(b)** Quick Fix code snippet, **(c)** Prevention tips

### 📚 Docs Explorer Tab
- Directly query **verified official documentation**:
  - Python Docs (`docs.python.org`)
  - MDN Web Docs (`developer.mozilla.org`)
  - React Docs (`react.dev`)
  - GitHub Documentation (`docs.github.com`)
  - Node.js Documentation (`nodejs.org`)

### ⚙️ API Settings Tab
- View agent architecture details (model, framework, memory engine)
- **Manage Gemini API Key**: Test connection, save, and reload without restarting the server

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
| `POST` | `/api/test-key` | `{api_key}` | Validate a key against Google |
| `GET` | `/api/health` | — | Health check |

---

## 🧠 Agent Tools Detail

| Tool | ID | Description | Data Sources |
|------|----|-------------|--------------|
| **Official Docs Search** | `search_official_docs` | Queries verified official technical documentation | Python Docs, MDN, React.dev, GitHub Docs, Node.js, Microsoft Docs |
| **Technical Web Search** | `search_web` | Broad technical search for tutorials and community answers | DuckDuckGo (StackOverflow, GitHub, blogs) |
| **Wikipedia Reference** | `search_wikipedia` | CS concepts, algorithms, architecture patterns | Wikipedia API |
| **Error Solver** | `explain_error` | Diagnoses stack traces and runtime errors | DuckDuckGo (StackOverflow, GitHub Issues) |
| **Tech Comparison** | `compare_technologies` | Side-by-side framework/tool comparison | DuckDuckGo (comparison articles, benchmarks) |

---

## 🔑 Google Gemini API Key

### Getting a Free Key
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click **"Create API Key"**
3. Keys typically start with `AIzaSy...`

### Configuring the Key
**Option A** — From the Web UI:
1. Click **"Configure Key"** in the top navigation bar
2. Paste your key
3. Click **"Test Connection"** to verify
4. Click **"Save & Apply"**

**Option B** — Edit `.env` manually:
```env
GOOGLE_API_KEY="AIzaSy...your_key_here"
```

### PERMISSION_DENIED Fallback
If your API key has restricted project permissions (e.g., `403 PERMISSION_DENIED`), the agent automatically falls back to executing documentation tools directly so you still get useful technical answers from official docs — just without generative AI reasoning.

---

## 📦 Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **LLM** | Google Gemini (gemini-3.8-flash) | Latest |
| **Orchestration** | LangChain + LangGraph | 1.4.x |
| **Memory** | MemorySaver (Thread-scoped Checkpointer) | LangGraph built-in |
| **Backend** | Flask + Flask-CORS | 3.x |
| **Frontend** | React + Vite | React 19 / Vite 8 |
| **Icons** | Lucide React | Latest |
| **Markdown** | React Markdown | Latest |
| **Search** | DuckDuckGo (ddgs) + Wikipedia API | Latest |
| **Language** | Python 3.14, JavaScript ES2024 | Latest |
