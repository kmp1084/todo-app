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

## Phase 0 — Planning & scaffolding  ✅ COMPLETE

- [x] Repo folders (`docs/`, `wireframes/`, `frontend/`, `backend/`)
- [x] Git initialized
- [x] Requirements draft (`docs/requirements.md`)
- [x] Design draft (`docs/design.md`)
- [x] Wireframes (`wireframes/`)
- [x] Review & approve docs
- [x] Create GitHub repo and push first commit

## Phase 1 — Angular frontend (in-memory data)  ✅ COMPLETE

- [x] Create Angular workspace in `frontend/` — plus Angular Material + app shell
- [x] `Task` model + `TaskService` (in-memory, signals)
- [x] Add task (TaskForm, reactive form + validation)
- [x] List + empty state (TaskList) + TaskItem extracted (input()/output())
- [x] Toggle complete
- [x] Edit task (inline edit: Enter saves, Escape cancels)
- [x] Delete task (with confirm dialog)
- [x] Priority, category, due date, description (form fields + row tags)
- [x] `CategoryService` + hybrid category picker (presets + add-new)
- [x] Manage categories: rename user categories; delete only when unused (blocked if in use)
- [x] Filters (state / category / priority)
- [x] Sort + search
- [x] Responsive styling (mobile-first; built with flex-wrap throughout)
- [x] **Tests:** 41 passing — `TaskService`, `CategoryService`, `filterAndSortTasks`,
  and all components (dialogs, form, list, item)

## Phase 2 — Persistence & deploy

- [x] localStorage persistence in `TaskService` (signal loads from storage; `effect` saves on change)
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
