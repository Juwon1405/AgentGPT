# CLAUDE.md - AgentGPT Codebase Guide

## Project Overview

AgentGPT is a full-stack AI agent platform that lets users configure and deploy autonomous AI agents in the browser. It consists of a Next.js frontend, a FastAPI backend, and a MySQL database, orchestrated via Docker Compose.

## Repository Structure

```
AgentGPT/
├── next/                # Frontend (Next.js 13 + TypeScript)
├── platform/            # Backend (FastAPI + Python 3.11)
├── cli/                 # Setup CLI tool (Node.js)
├── db/                  # Database initialization (MySQL 8.0)
├── docs/                # Documentation (Mintlify)
├── scripts/             # Utility scripts
├── .github/             # CI workflows & contributing guide
├── docker-compose.yml   # Multi-container orchestration
└── setup.sh / setup.bat # Automated setup scripts
```

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 13.5, React 18, TypeScript, TailwindCSS |
| Backend | FastAPI 0.98, Python 3.11, Poetry |
| Database | MySQL 8.0, Prisma (frontend ORM), SQLAlchemy (backend ORM) |
| State Management | Zustand |
| API Layer | tRPC (frontend-to-Next API), REST (frontend-to-FastAPI) |
| Auth | NextAuth (Google, GitHub, Discord OAuth) |
| LLM Integration | LangChain, OpenAI SDK |
| Container | Docker Compose (3 services) |

## Quick Commands

### Frontend (`next/` directory)

```bash
npm run dev          # Start dev server (port 3000)
npm run build        # Production build (no lint)
npm run lint         # ESLint with auto-fix (SKIP_ENV_VALIDATION=1)
npm test             # Jest tests (SKIP_ENV_VALIDATION=1)
npx prisma generate  # Regenerate Prisma client (also runs on postinstall)
```

### Backend (`platform/` directory)

```bash
poetry install                                    # Install dependencies
poetry run python -m reworkd_platform             # Start server (port 8000)
poetry run pytest -vv --cov="reworkd_platform" .  # Run tests with coverage
poetry run black .                                # Format code
poetry run isort .                                # Sort imports
poetry run autoflake --in-place --remove-all-unused-imports -r .  # Remove unused imports
poetry run flake8                                 # Lint
poetry run mypy .                                 # Type check
```

### Docker

```bash
docker-compose up        # Start all services (frontend:3000, backend:8000, db:3308)
docker-compose up -d     # Start detached
docker-compose down      # Stop all services
```

## Frontend Architecture (`next/src/`)

### Directory Layout

```
src/
├── pages/           # Next.js pages & API routes
│   ├── api/auth/    # NextAuth endpoints
│   └── api/trpc/    # tRPC endpoint
├── components/      # React components (feature-organized)
│   ├── console/     # Agent console UI
│   ├── dialog/      # Modal dialogs
│   ├── sidebar/     # Navigation sidebar
│   ├── landing/     # Landing page
│   └── templates/   # Agent templates
├── server/          # Server-side code
│   ├── api/routers/ # tRPC route definitions
│   ├── auth/        # NextAuth config
│   └── db.ts        # Prisma client singleton
├── services/        # Business logic
│   └── agent/       # Agent orchestration (autonomous-agent.ts)
├── stores/          # Zustand state stores
├── hooks/           # Custom React hooks
├── lib/             # Shared utilities
├── env/             # Environment variable validation (Zod schemas)
├── ui/              # Base UI components
└── styles/          # CSS files
```

### Key Patterns

- **State management**: Zustand stores in `src/stores/` (agentStore, messageStore, taskStore, configStore, modelSettingsStore, agentInputStore)
- **API communication**: tRPC for type-safe Next.js API routes; Axios for FastAPI backend calls
- **Environment validation**: Zod schemas in `src/env/schema.mjs` validate env vars at build time
- **i18n**: Use `useTranslation` from `next-i18next` (NOT from `react-i18next` — enforced by ESLint)
- **Imports**: Ordered by group (builtin, external, internal, relative, index) with alphabetical sorting — enforced by `eslint-plugin-import`
- **Type imports**: Use `import type` for type-only imports (`@typescript-eslint/consistent-type-imports: warn`)

## Backend Architecture (`platform/reworkd_platform/`)

### Directory Layout

```
reworkd_platform/
├── __main__.py          # Entry point (uvicorn)
├── settings.py          # Pydantic settings (env config)
├── web/
│   ├── application.py   # FastAPI app factory
│   ├── lifetime.py      # Startup/shutdown events
│   └── api/
│       ├── router.py    # Main router
│       ├── agent/       # Agent endpoints & services
│       │   ├── views.py
│       │   ├── agent_service/  # LLM service layer
│       │   ├── tools/          # External tool integrations
│       │   └── prompts.py
│       ├── auth/        # Authentication
│       └── monitoring/  # Health checks
├── db/
│   ├── models/          # SQLAlchemy ORM models
│   ├── crud/            # Data access objects (DAO pattern)
│   └── dependencies.py  # DB session injection
├── schemas/             # Pydantic request/response schemas
├── services/            # External integrations (AWS, Pinecone, etc.)
└── tests/               # Pytest test suite
```

### Key Patterns

- **Dependency injection**: FastAPI `Depends()` for DB sessions, auth, services
- **Agent service**: Abstract `AgentService` base with `OpenAIAgentService` (prod) and `MockAgentService` (test) — provider pattern in `agent_service_provider.py`
- **Settings**: All config via Pydantic `BaseSettings` with `REWORKD_PLATFORM_` prefix
- **Streaming**: `StreamingResponse` for real-time LLM output during task execution
- **Formatting**: Black for code style, isort for imports (profile: black)
- **Type checking**: MyPy in strict mode (configured in `pyproject.toml`)

### API Endpoints

```
POST /api/agent/start      # Initialize agent with goal
POST /api/agent/create     # Create new tasks
POST /api/agent/execute    # Execute task (streaming)
POST /api/agent/analyze    # Analyze task feasibility
POST /api/agent/summarize  # Summarize results (streaming)
POST /api/agent/chat       # Chat with agent
```

## Database

- **Provider**: MySQL 8.0 (UTF-8MB4, port 3307 internal / 3308 host)
- **Frontend ORM**: Prisma — schema at `next/prisma/schema.prisma`
- **Backend ORM**: SQLAlchemy 2.0 (async with aiomysql)
- **Key models**: User, Account, Session, Organization, Agent, AgentTask, Run, NewRun, Task, OAuthCredentials

## Environment Variables

### Naming Conventions

- Frontend browser-exposed: `NEXT_PUBLIC_*` prefix
- Frontend server-only: no prefix (e.g., `NEXTAUTH_SECRET`)
- Backend: `REWORKD_PLATFORM_*` prefix
- Database: `DATABASE_URL` (Prisma connection string)

### Required Variables (see `.env.example`)

```
# Core
NODE_ENV=development
NEXTAUTH_SECRET=changeme
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# Database
DATABASE_URL=mysql://reworkd_platform:reworkd_platform@localhost:3308/reworkd_platform

# LLM
REWORKD_PLATFORM_OPENAI_API_KEY=<your-key>

# Optional: OAuth, Serper, Replicate, Stripe, Sentry, Kafka, Pinecone, Pusher
```

## Linting & Formatting

### Frontend

- **ESLint**: `next/core-web-vitals` + `@typescript-eslint/recommended` with strict type checking for `.ts/.tsx`
- **Prettier**: Print width 100, TailwindCSS class sorting plugin
- **Husky + lint-staged**: Auto-fixes JS on commit, formats JS/CSS/MD

### Backend

- **Black**: Code formatting
- **isort**: Import sorting (black profile)
- **autoflake**: Unused import removal
- **Flake8**: Linting with wemake-python-styleguide
- **MyPy**: Strict type checking
- **Pre-commit hooks**: Configured in `.pre-commit-config.yaml` — runs all of the above

## CI/CD (GitHub Actions)

### Node.js CI (`.github/workflows/node.js.yml`)
- Triggers on push/PR to `main` when `next/` files change
- Runs: `npm ci` → `npm test` → Prisma SQLite setup
- Node.js 18.x

### Python Testing (`.github/workflows/python.yml`)
- Triggers on PR to `main` when `platform/` files change
- Three parallel jobs:
  - **black**: Formatting check (`poetry run black --check .`)
  - **mypy**: Type checking (`poetry run mypy .`)
  - **pytest**: Tests with coverage + MySQL service container
- Python 3.11

## Conventions for AI Assistants

1. **Node version**: Must be >= 18 and < 19
2. **Python version**: 3.11
3. **Import ordering**: Follow ESLint import/order config (frontend) and isort black profile (backend)
4. **Type imports**: Use `import type { X }` in TypeScript for type-only imports
5. **i18n**: Always import `useTranslation` from `next-i18next`, never from `react-i18next`
6. **Environment variables**: Never hardcode secrets; use appropriate prefix conventions
7. **Frontend state**: Use Zustand stores, not React Context or Redux
8. **Backend config**: Use `settings.py` Pydantic BaseSettings, never read env vars directly
9. **Database changes**: Update both Prisma schema (`next/prisma/schema.prisma`) and SQLAlchemy models (`platform/reworkd_platform/db/models/`) to keep them in sync
10. **Testing**: Run `npm test` for frontend, `poetry run pytest` for backend before submitting changes
11. **Formatting**: Run `npm run lint` (frontend) and `poetry run black . && poetry run isort .` (backend) before committing
12. **Docker**: Use `docker-compose.yml` for local full-stack development; services communicate via Docker networking
