# Roadmap — Todos

Guided, module-by-module build across SDLC phases. We complete and commit each module
before moving on.

## Testing strategy

Testing is **not** a single phase between build and deploy — it happens in two places:

1. **During each build phase:** we write unit tests (`*.spec.ts`) alongside the code —
   `TaskService` logic, components, guards, the auth flow. Run continuously while building.
2. **As a CI gate before deploy (Phase 5):** GitHub Actions runs `lint → test → build`,
   and only deploys if everything is green.

Each phase below has a **Tests** line to keep this visible.

## Phase 0 — Planning & scaffolding  ← current

- [x] Repo folders (`docs/`, `wireframes/`, `frontend/`, `backend/`)
- [x] Git initialized
- [x] Requirements draft (`docs/requirements.md`)
- [x] Design draft (`docs/design.md`)
- [ ] Wireframes (`wireframes/`)
- [ ] Review & approve docs
- [ ] Create GitHub repo and push first commit

## Phase 1 — Angular frontend (in-memory data)

- [x] Create Angular workspace in `frontend/` — plus Angular Material + app shell
- [x] `Task` model + `TaskService` (in-memory, signals)
- [x] Add task (TaskForm, reactive form + validation)
- [x] List + empty state (TaskList) + TaskItem extracted (input()/output())
- [x] Toggle complete
- [x] Edit task (inline edit: Enter saves, Escape cancels)
- [x] Delete task (with confirm dialog)
- [ ] Priority, category, due date, description
- [ ] `CategoryService` + hybrid category picker (presets + add-new)
- [ ] Manage categories: rename user categories; delete only when unused (blocked if in use)
- [ ] Filters (state / category / priority)
- [ ] Sort + search
- [ ] Responsive styling
- [ ] **Tests:** unit tests for `TaskService` (add/edit/delete/toggle), `CategoryService`
  (rename updates tasks, delete blocked when in use, presets protected), key components

## Phase 2 — Persistence & deploy

- [ ] localStorage persistence in `TaskService`
- [ ] Polish + accessibility pass
- [ ] **Tests:** unit tests for the localStorage store (save/load/round-trip)
- [ ] Deploy frontend to Netlify / Cloudflare Pages
- [ ] Live URL in README

## Phase 3 — Backend (tasks API)

- [ ] Spring Boot project in `backend/`
- [ ] `Task` entity + repository + REST controller
- [ ] H2 database
- [ ] `TaskService` gains an HTTP store; used when logged in
- [ ] CORS + error handling
- [ ] **Tests:** backend unit/integration tests (controller + repository); frontend HTTP store tests (mocked)

## Phase 4 — Authentication

- [ ] `User` entity, register/login endpoints, BCrypt password hashing
- [ ] JWT issuing + Spring Security filter for protected endpoints
- [ ] Scope tasks to the owning user
- [ ] Angular `AuthService` (signals) + login/register views + route guard
- [ ] JWT HTTP interceptor
- [ ] Guest → account task migration on first login (in scope for v1)
- [ ] **Tests:** auth endpoints (register/login, bad credentials), migration flow, route guard

## Phase 5 — Full-stack deploy & CI/CD

- [ ] Deploy backend (AWS / Render / Railway)
- [ ] Connect frontend to hosted backend
- [ ] GitHub Actions pipeline: **lint → test → build → deploy** (deploy only if tests pass)
- [ ] (Optional) end-to-end (e2e) smoke test of the deployed app
- [ ] (Optional) PostgreSQL
