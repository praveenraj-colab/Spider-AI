# Spider AI

Your Intelligent AI Workspace

Spider AI Phase 1 is a production-oriented SaaS foundation with a Next.js frontend, FastAPI backend, PostgreSQL database, Alembic migrations, JWT authentication, refresh-token rotation, and a modern chat workspace UI.

## Phase 1 Scope

Included:

- Landing page with hero, features, pricing placeholder, and footer
- Register, login, logout, refresh token, and forgot-password placeholder
- Dashboard shell with sidebar, top navigation, profile, and settings placeholder
- Chat UI with conversation CRUD, markdown rendering, code highlighting, typing/streaming interface, copy, regenerate, stop, auto-scroll, and dark mode
- Backend APIs for authentication, users, chats, health, and version
- PostgreSQL models for users, chats, messages, sessions, and refresh tokens
- Docker and Docker Compose runtime

Excluded by design:

- AI providers, RAG, vector database, agents, memory, file upload, voice, image generation, search, payments, and team workspaces

## Repository Structure

```text
backend/
  app/
    api/v1/endpoints/      FastAPI route handlers
    core/                  settings, security, logging, exceptions
    db/                    SQLAlchemy session and metadata
    dependencies/          FastAPI dependency injection
    middlewares/           request ID and rate limiting middleware
    models/                SQLAlchemy ORM models
    repositories/          data access layer
    schemas/               Pydantic v2 schemas
    services/              application business logic
    static/                backend static assets
    utils/                 shared utility functions
  alembic/                 database migrations
frontend/
  app/                     Next.js App Router routes
  components/              UI, layout, auth, profile, and chat components
  hooks/                   React hooks
  lib/                     typed API clients, server proxy helpers, utilities
  public/images/           static image assets
  styles/                  global Tailwind CSS
database/
  postgres/                PostgreSQL configuration and init scripts
```

## Local Development

1. Copy environment templates:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

2. Start the full stack:

```bash
docker compose up --build
```

3. Open the applications:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API docs: http://localhost:8000/docs
- Health: http://localhost:8000/api/v1/health

## Backend Without Docker

```bash
cd backend
python -m venv .venv
. .venv/Scripts/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

Set `DATABASE_URL` in `backend/.env` to a running PostgreSQL instance before applying migrations.

## Frontend Without Docker

```bash
cd frontend
npm install
npm run dev
```

Set `BACKEND_INTERNAL_URL=http://localhost:8000` in `frontend/.env.local`.

## Security Notes

- Replace every sample secret before production deployment.
- Access tokens are short-lived JWTs.
- Refresh tokens are random secrets stored only as SHA-256 hashes in PostgreSQL.
- The frontend uses HttpOnly cookies through Next.js route handlers instead of browser local storage.
- CORS origins are configured through `BACKEND_CORS_ORIGINS`.
- In-memory rate limiting is included for Phase 1 local readiness; use a distributed limiter for multi-instance production.
