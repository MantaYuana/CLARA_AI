<div align="center">

# ⚖️ CLARA
### Contract & Legal AI Reasoning Assistant
![Software Engineering](Clara.gif)

**🏆 2nd Place — Hackvidia at Arkavidia 10.0**

[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Neo4j](https://img.shields.io/badge/Neo4j-5.18-008CC1?logo=neo4j&logoColor=white)](https://neo4j.com/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![Gemini](https://img.shields.io/badge/Google%20Gemini-2.5%20Flash-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

CLARA is an AI-powered legal assistant purpose-built for Indonesian MSMEs (Micro, Small & Medium Enterprises). It helps business owners understand contracts and employment law, draft legal documents, and detect risky clauses — all without needing a lawyer on retainer.

[Features](#-features) · [Architecture](#-architecture) · [Quick Start](#-quick-start) · [API Docs](#-api-documentation) · [Contributing](#-contributing)

</div>

---

## 📖 Table of Contents

- [About the Project](#-about-the-project)
- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [Environment Variables](#-environment-variables)
- [API Documentation](#-api-documentation)
- [Running Tests](#-running-tests)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [Team](#-team)
- [License](#-license)

---

## 🎯 About the Project

Indonesian MSMEs frequently sign contracts they don't fully understand, often without access to legal counsel. CLARA bridges this gap by combining:

- **Retrieval-Augmented Generation (RAG)** over a curated Indonesian legal knowledge base
- **Self-Consistency Reasoning** with Jensen-Shannon entropy confidence scoring
- **Knowledge Graph** (Neo4j) for symbolic legal reasoning via Cypher traversal
- **AI-powered document drafting** for MoU, LoI, and PKS document types
- **OCR + guardrail** pipeline that automatically flags illegal contract clauses

> CLARA won **2nd Place** at the **Hackvidia competition, Arkavidia 10.0** — a national-level IT competition hosted by HMIF ITB.

---

## ✨ Features

### 📄 Contract Review & Risk Analysis
Upload any contract (PDF or image) and get an instant, structured legal risk report:
- Clause-by-clause explanation in plain language
- Severity-tagged violations: `CRITICAL`, `WARNING`, `INFO`
- Automatic detection of illegal patterns (forced seizure, excessive penalties, illegal wage cuts, etc.)
- Statutory citations (Indonesian Law, Government Regulations, Ministry Decrees)

### 🔍 Legal Q&A (RAG Pipeline)
Ask questions about Indonesian employment law and contract regulation:
- **Hybrid Retrieval**: Dense vector search + BM25 full-text search + symbolic Neo4j graph traversal, fused via Reciprocal Rank Fusion (RRF)
- **Self-Consistency Loop**: Generates multiple reasoning paths, measures divergence (Jensen-Shannon entropy), and maps to a `green / yellow / red` confidence level
- Answers always cite specific articles and laws (`Pasal N UU No. X Tahun YYYY`)

### ✍️ AI Document Drafter
Conversational smart drafter for legal documents:
- Supports **MoU** (Memorandum of Understanding), **LoI** (Letter of Intent), and **PKS** (Cooperation Agreement)
- Multi-turn dialogue: CLARA asks clarifying questions until all required fields are gathered
- Detects legally binding terms and warns before generating
- Outputs a structured Markdown document + downloadable **PDF**
- Post-generation guardrail scan on the produced draft

### 🔐 Authentication & Session Management
- Google OAuth 2.0 login
- JWT-based stateless session
- Per-user chat history persisted in Neo4j

### 📊 User Dashboard
- Aggregated view of all uploaded contract reviews and drafting projects
- File management with source tracing per conversation

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        React (Vite) Frontend                        │
│  Pages: Landing · Login · Chat · Files · Home                       │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ REST / JWT
┌──────────────────────────────▼──────────────────────────────────────┐
│                      Express.js Backend (Node)                      │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │  /auth   │  │/contract │  │  /query  │  │    /drafter      │   │
│  └──────────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘   │
│                     │              │                  │             │
│  ┌──────────────────▼──────────────▼──────────────────▼──────────┐ │
│  │                    Service Layer                               │ │
│  │  OCR Service  →  Guardrail  →  Hybrid Retrieval  →  Reasoning │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌─────────────────┐   ┌─────────────┐   ┌──────────────────────┐  │
│  │  BullMQ Worker  │   │  Neo4j DB   │   │  Google Gemini API   │  │
│  │  (async OCR)    │   │  (KG + RAG) │   │  (LLM + Embeddings)  │  │
│  └────────┬────────┘   └─────────────┘   └──────────────────────┘  │
│           │ Redis Queue                                             │
└───────────▼─────────────────────────────────────────────────────────┘
            │
    ┌───────▼────────┐
    │  Google Cloud  │
    │  Vision (OCR)  │
    └────────────────┘
```

### RAG & Reasoning Pipeline

```
User Query
    │
    ▼
┌────────────────────────────────────────┐
│           Hybrid Retrieval             │
│  ┌──────────┐ ┌────────┐ ┌──────────┐ │
│  │  Dense   │ │  BM25  │ │Symbolic  │ │
│  │  (768d   │ │ (full  │ │(Neo4j    │ │
│  │ vector)  │ │  text) │ │ Cypher)  │ │
│  └──────────┘ └────────┘ └──────────┘ │
│         Reciprocal Rank Fusion         │
└──────────────────┬─────────────────────┘
                   │
                   ▼
         ┌─────────────────┐
         │   Reasoning     │
         │  Service (N=3   │
         │   paths)        │
         │                 │
         │  JS Entropy  →  │
         │  Confidence     │
         │  green/yellow/  │
         │  red            │
         └────────┬────────┘
                  │
                  ▼
           Final Answer
          + Citations
          + Confidence
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite 7, Tailwind CSS 4, Framer Motion, React Router DOM 7 |
| **Backend** | Node.js 22, Express.js 5, TypeScript 5.7 |
| **AI / LLM** | Google Gemini 2.5 Flash, Google Gemini Embeddings (`gemini-embedding-001`, 768d) |
| **OCR** | Google Cloud Vision API |
| **Database** | Neo4j 5.18 Community (APOC + Graph Data Science plugins) |
| **Queue** | BullMQ + Redis 7 |
| **Auth** | Passport.js, Google OAuth 2.0, JSON Web Tokens |
| **PDF Generation** | pdf-lib |
| **API Docs** | Swagger UI (OpenAPI 3.0) |
| **Containerization** | Docker + Docker Compose |
| **Deployment** | Vercel (Frontend), Docker (Backend) |

---

## 📂 Project Structure

```
CLARA_AI/
├── docker-compose.yml          # Orchestrates Neo4j, Redis, and Backend
├── backend/
│   ├── src/
│   │   ├── index.ts            # Express app entry point
│   │   ├── config/             # env, Neo4j, Passport, Redis, Swagger
│   │   ├── middleware/         # JWT auth guard
│   │   ├── routes/             # auth, chat, contract, document, drafter, query
│   │   ├── services/
│   │   │   ├── chat/           # Chat history persistence (Neo4j)
│   │   │   ├── dashboard/      # User project aggregation
│   │   │   ├── drafter/        # Multi-turn document drafting + PDF export
│   │   │   ├── embedding/      # Gemini embedding service
│   │   │   ├── guardrail/      # Statutory limit & clause violation checks
│   │   │   ├── ocr/            # Google Cloud Vision OCR
│   │   │   ├── reasoning/      # Self-consistency loop, JS-entropy, citations
│   │   │   ├── retrieval/      # Dense, BM25, Symbolic, Hybrid (RRF) retrieval
│   │   │   └── user/           # User creation & lookup
│   │   ├── workers/
│   │   │   └── analysisWorker.ts  # BullMQ worker for async OCR jobs
│   │   ├── queues/
│   │   │   └── analysisQueue.ts   # BullMQ queue definition
│   │   ├── scripts/            # DB init, PDF seeding, knowledge seeding
│   │   └── utils/              # Response helpers
│   ├── base_knowledge/         # Curated Indonesian legal PDFs for RAG seeding
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
└── frontend/
    ├── src/
    │   ├── pages/              # Landing, Login, Home, ChatDetail, Files
    │   ├── components/         # ChatBubble, ChatPanel, SourcesPanel, StudioPanel…
    │   ├── hooks/              # useAuth, useChat, useProjects, useSources…
    │   ├── Services/           # Axios service wrappers per domain
    │   └── lib/                # Configured Axios instance
    ├── public/
    ├── vite.config.js
    └── package.json
```

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v20+
- [Docker](https://docs.docker.com/get-docker/) & Docker Compose
- A [Google AI Studio](https://aistudio.google.com/) API key (Gemini)
- A [Google Cloud](https://console.cloud.google.com/) project with **Cloud Vision API** enabled and a service-account JSON key
- A [Google OAuth 2.0](https://console.cloud.google.com/apis/credentials) client (Web application)

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/clara-ai.git
cd clara-ai
```

### 2. Configure Environment Variables

```bash
cp backend/.env.example backend/.env
```

Fill in all required values in `backend/.env` (see [Environment Variables](#-environment-variables)).

Place your Google Cloud Vision service account JSON at:

```
backend/clara-google-cloud-vision.json
```

### 3. Start Infrastructure (Neo4j + Redis)

```bash
docker compose up neo4j redis -d
```

Wait for both services to be healthy:

```bash
docker compose ps   # both should show "(healthy)"
```

### 4. Install Backend Dependencies & Initialize the Database

```bash
cd backend
npm install
npm run init-schema   # creates Neo4j constraints and indexes
npm run seed:pdf      # seeds base Indonesian legal knowledge into Neo4j
```

### 5. Start the Backend

```bash
npm run dev           # runs on http://localhost:3001
```

### 6. Start the Frontend

```bash
cd ../frontend
npm install
npm run dev           # runs on http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

### Docker (Full Stack)

To run all services including the backend in Docker:

```bash
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend (dev) | http://localhost:5173 |
| Backend API | http://localhost:3001 |
| API Docs (Swagger) | http://localhost:3001/api/docs |
| Neo4j Browser | http://localhost:7474 |

---

## 🔧 Environment Variables

Create `backend/.env` based on the table below:

| Variable | Description | Example |
|---|---|---|
| `PORT` | Backend port | `3001` |
| `NODE_ENV` | Environment | `development` |
| `NEO4J_URI` | Neo4j Bolt URI | `bolt://localhost:7687` |
| `NEO4J_USER` | Neo4j username | `neo4j` |
| `NEO4J_PASSWORD` | Neo4j password | `clara_password` |
| `GOOGLE_AI_API_KEY` | Gemini API key | `AIza...` |
| `GEMINI_MODEL` | Gemini model name | `gemini-2.5-flash` |
| `EMBEDDING_MODEL` | Embedding model | `gemini-embedding-001` |
| `EMBEDDING_DIMENSION` | Embedding vector size | `768` |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to GCV service account JSON | `clara-google-cloud-vision.json` |
| `JWT_SECRET` | Secret for signing JWTs | `<long random string>` |
| `OAUTH_GOOGLE_CLIENT_ID` | Google OAuth client ID | `123...apps.googleusercontent.com` |
| `OAUTH_GOOGLE_CLIENT_SECRET` | Google OAuth client secret | `GOCSPX-...` |
| `REASONING_PATHS` | Number of self-consistency paths | `3` |
| `TEMPERATURE_LOW` | Temperature for conservative reasoning | `0.1` |
| `TEMPERATURE_HIGH` | Temperature for exploratory reasoning | `0.7` |
| `MAX_CONTEXT_TOKENS` | Max tokens in Gemini context | `8192` |
| `TOP_K_DENSE` | Top-K for dense retrieval | `5` |
| `TOP_K_BM25` | Top-K for BM25 retrieval | `5` |
| `TOP_K_SYMBOLIC` | Top-K for symbolic/graph retrieval | `5` |
| `HYBRID_DENSE_WEIGHT` | RRF weight for dense leg | `0.5` |
| `HYBRID_BM25_WEIGHT` | RRF weight for BM25 leg | `0.3` |
| `HYBRID_SYMBOLIC_WEIGHT` | RRF weight for symbolic leg | `0.2` |
| `MAX_FILE_SIZE_MB` | Maximum upload file size | `10` |
| `UPLOAD_DIR` | Local upload directory | `./uploads` |
| `VITE_API_URL` | Frontend → Backend base URL | `http://localhost:3001` |

---

## 📚 API Documentation

After starting the backend, interactive Swagger docs are available at:

```
http://localhost:3001/api/docs
```

### Key Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | — | Service health check |
| `GET` | `/api/v1/auth/google` | — | Initiate Google OAuth flow |
| `GET` | `/api/v1/auth/google/callback` | — | OAuth callback, returns JWT |
| `POST` | `/api/v1/document/analyze` | Optional | Upload contract PDF/image for async OCR analysis (returns `202`) |
| `GET` | `/api/v1/document/:id/status` | Optional | Poll OCR job status |
| `POST` | `/api/v1/contract/review` | ✅ JWT | Review an already-analyzed contract; runs guardrail + reasoning |
| `POST` | `/api/v1/query` | ✅ JWT | Ask a legal question via hybrid RAG + self-consistency |
| `POST` | `/api/v1/drafter/chat` | ✅ JWT | Multi-turn document drafting conversation |
| `GET` | `/api/v1/chat/sessions` | ✅ JWT | List user's chat sessions |
| `GET` | `/api/v1/chat/sessions/:id` | ✅ JWT | Get message history for a session |

---

## 🧪 Running Tests

```bash
cd backend
npm test
```

The test suite uses **Jest + ts-jest**. Test files follow the `*.test.ts` convention.

Notable test files:
- `src/services/guardrail/guardrailService.test.ts`
- `src/services/retrieval/hybridRetrieval.test.ts`

---

## 🚢 Deployment

### Backend

The backend is fully containerized. For production, deploy via Docker Compose on any VPS or cloud VM:

```bash
docker compose up --build -d
```

Make sure `NODE_ENV=production` and update `NEO4J_URI` / `REDIS_URL` to point to your managed services.

### Frontend

The frontend is configured for **Vercel** deployment (`vercel.json` is included). All routes are rewired to `index.html` for SPA routing.

```bash
cd frontend
npm run build       # outputs to dist/
vercel --prod       # or connect your GitHub repo in the Vercel dashboard
```

Set `VITE_API_URL` in Vercel's Environment Variables to point to your backend URL.

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

### 1. Fork & Branch

```bash
git fork https://github.com/your-org/clara-ai.git
git checkout -b feat/your-feature-name
```

### 2. Development Workflow

```bash
# Backend
cd backend && npm run dev

# Frontend (separate terminal)
cd frontend && npm run dev
```

### 3. Code Style

- **Backend**: TypeScript strict mode. Follow existing service patterns (service class → route handler separation).
- **Frontend**: React functional components with hooks. Keep service calls in `src/Services/`.
- All new backend endpoints must include a Swagger JSDoc comment block.

### 4. Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add penalty clause detection to guardrail
fix: resolve RRF weight normalization bug
docs: update retrieval architecture section
refactor: extract confidence label mapping to util
```

### 5. Open a Pull Request

- Target the `main` branch
- Include a short description of _what_ and _why_
- Reference any related issues

### 6. Reporting Issues

Use [GitHub Issues](https://github.com/your-org/clara-ai/issues). Include:
- Steps to reproduce
- Expected vs actual behavior
- Relevant logs or screenshots

---

## 👥 Team

CLARA was built with ❤️ by a team of 4 engineers competing at **Arkavidia 10.0 Hackvidia**:

| Name | Role |
|---|---|
| [Manta Yuana](https://github.com/rammm2005) | Backend & Project Manager |
| [Kadek Pindra](https://github.com/KadekPindra) | Frontend & Integration |
| [Rama Dita](https://github.com/rammm2005) | Fullstack & Data Engineering |
| [Dewa Surya](https://github.com/arisuryaa) | Frontend & UI/UX Designer |

---

## 📄 License

This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for details.

---

<div align="center">

Made for Indonesian MSMEs · Built at Arkavidia 10.0 Hackvidia · 🏆 2nd Place

</div>
