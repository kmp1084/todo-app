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
- [x] Edit task — full Edit dialog (title, description, priority, category, due date;
  replaced the earlier title-only inline edit)
- [x] Delete task (with confirm dialog)
- [x] Priority, category, due date, description (form fields + row tags)
- [x] `CategoryService` + hybrid category picker (presets + add-new)
- [x] Manage categories: rename user categories; delete only when unused (blocked if in use)
- [x] Filters (state / category / priority)
- [x] Sort + search
- [x] Responsive styling (mobile-first; built with flex-wrap throughout)
- [x] **Tests:** 41 passing — `TaskService`, `CategoryService`, `filterAndSortTasks`,
  and all components (dialogs, form, list, item)

## Phase 2 — Persistence & deploy  ✅ COMPLETE

- [x] localStorage persistence in `TaskService` (signal loads from storage; `effect` saves on change)
- [x] Polish + accessibility pass (h1 page heading, banner landmark; probe-verified)
- [x] **Tests:** localStorage save/load covered (`TestBed.tick()` to flush the effect)
- [x] Deploy frontend to Netlify (auto-deploy from `main`; netlify.toml, Node 22 pinned)
- [x] Live URL in README — https://scintillating-brioche-62b3c2.netlify.app/

## Phase 3 — Backend (tasks API)  ✅ COMPLETE

- [x] Spring Boot project in `backend/` (Boot 4.1, Java 21 / Temurin, Maven wrapper — no
  system Maven needed)
- [x] `Task` entity + `TaskRepository` + `TaskController`
  - UUID primary key, `@Enumerated(STRING)` priority, `@PrePersist`/`@PreUpdate` timestamps
  - Spring Data derived queries (`findByCompleted`, `findByTitleContainingIgnoreCase`, …)
  - Full CRUD — `GET`, `POST` (201 + `Location`), `PUT`, `DELETE` (204)
- [x] H2 database (file-backed under `backend/data/`, `ddl-auto=update`, console enabled)
- [x] DTOs (`TaskRequest` / `TaskResponse` records) kept separate from the entity
- [x] Validation + error handling
  - Bean Validation on the DTO (`@NotBlank` / `@NotNull` / `@Size` + `@Valid`)
  - RFC 9457 problem-detail responses via `ApiExceptionHandler`
  - `@Transactional` service layer (dirty checking instead of an explicit `save()`)
- [x] CORS for the Angular dev origin (origins externalised to `app.cors.allowed-origins`)
- [x] **Tests (backend):** 9 passing — plain unit (Mockito), `@DataJpaTest` repository slice,
  `@WebMvcTest` controller slice, `@SpringBootTest` context check
- [x] Frontend store split — a `TaskStore` interface with two implementations
  - `LocalTaskStore` (localStorage, guest mode) and `HttpTaskStore` (the REST API)
  - Chosen per build via `environment.useBackend`, so `npm start` uses the API while the
    Netlify production build stays on localStorage until the backend is hosted (Phase 5)
  - `TaskService` became a thin facade, so no component needed changing
  - Errors from either store surface as an app-level banner; HTTP failures show the
    backend's own RFC 9457 `detail` text
- [x] **Tests (frontend):** `HttpTaskStore` covered with `HttpTestingController`

> **Note — Spring Boot 4 is very new, and most tutorials target Boot 3.** Differences hit
> during this phase: starters renamed (`spring-boot-starter-web` → `-webmvc`; the single
> `-test` starter split into `-webmvc-test` / `-data-jpa-test` / `-validation-test`); Boot 4
> ships **Jackson 3**, which is stricter — a primitive `boolean` in a DTO fails to
> deserialise when the JSON omits it, so use `Boolean`; `@MockBean` is gone, replaced by
> `@MockitoBean`; and `@WebMvcTest` / `@DataJpaTest` moved packages.

## Phase 4 — Authentication  ✅ COMPLETE

- [x] `User` entity, register/login endpoints, BCrypt password hashing
  - email normalised and unique; only a 60-char hash is ever stored
  - duplicate registration → 409; both login failures return an identical 401
- [x] JWT issuing + Spring Security filter for protected endpoints
  - Spring Security 7 with `oauth2ResourceServer`, HMAC-signed tokens, 60-minute expiry
  - signature, `exp`, `nbf` and `iss` all validated on every request
- [x] Scope tasks to the owning user
  - `Task` gained a `@ManyToOne` owner; **every** repository query is owner-scoped
  - another user's task returns 404, never 403 — no resource enumeration
- [x] Angular `AuthService` (signals) + login/register views + route guard
  - session survives a refresh and is discarded when expired
  - guard is the inverse of the usual one: `/` stays open for guests, signed-in
    users are kept off `/login` and `/register`
- [x] JWT HTTP interceptor
  - attaches the token to API requests only; a 401 signs you out **only if a token
    was actually sent**, so guest mode is unaffected
- [x] Guest → account task migration on sign-in
  - confirmed via a dialog; categories merged first, then tasks posted one at a time,
    each removed from localStorage only after its POST succeeds
- [x] Task store follows auth state — guests use localStorage, signed-in users the API
- [x] Categories are per-account, and a user's list carries into guest mode on sign-out
- [x] **Tests:** 24 backend (unit, JPA slice, web slice, full security chain) and
  19 frontend spec files — auth service, interceptor, guard, migration, stores

> **Known limitation:** categories live in `localStorage` per account, not on the server.
> A custom category with no tasks won't appear on a machine the user has never signed in
> on. Closing that needs a `/api/categories` endpoint.

## Phase 5 — Full-stack deploy & CI/CD

- [ ] Deploy backend (AWS / Render / Railway)
- [ ] Connect frontend to hosted backend
- [ ] GitHub Actions pipeline: **lint → test → build → deploy** (deploy only if tests pass)
- [ ] (Optional) end-to-end (e2e) smoke test of the deployed app
- [ ] (Optional) PostgreSQL
