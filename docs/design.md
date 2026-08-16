# Design — Todos

> **Status:** As built. Originally a Phase 0 sketch; updated to describe what was actually
> implemented, with notes where the design deliberately changed and why.

## 1. Data model

The core entity is a **Task**.

```ts
type Priority = 'low' | 'medium' | 'high';

interface Task {
  id: string;            // unique id (uuid or timestamp-based)
  title: string;         // required, non-empty
  description?: string;  // optional longer text
  completed: boolean;    // completion state
  priority: Priority;    // low | medium | high
  category: string;      // preset or user-defined category name
  dueDate?: string;      // ISO date string, optional
  createdAt: string;     // ISO datetime, set on creation
  updatedAt: string;     // ISO datetime, set on each edit
}
```

**Categories (hybrid + managed):** because user-defined categories can be renamed and
deleted independently of tasks (FR-12), they are a **first-class stored list**, not just
values derived from tasks.

> **Implemented as plain strings, not objects.** During Phase 1 (Module 8) we chose to
> represent a category as just its **name** (a `string`), not a `{ id, name, preset }`
> object. Tasks already store `category` as a string, so this avoids id↔name mapping and
> is enough for every rule below. The object shape above is kept only as a possible future
> option (e.g. if categories move to the backend with stable ids).

- A `DEFAULT_CATEGORIES: string[]` constant (in `models/task.ts`) seeds the presets.
- `CategoryService` holds `signal<string[]>` (presets + user-defined) and exposes
  `categories`, `isPreset`, `addCategory`, `renameCategory`, `deleteCategory`.
- Names are unique **case-insensitively** (`'work'` == `'Work'`).
- The task form's category dropdown shows presets + user categories, plus a "＋ Add new
  category…" option that opens a reusable `PromptDialog`.
- **Rename** (user categories only): update the name in the list, then cascade to every
  task whose `category` matches (via `TaskService.reassignCategory`).
- **Delete** (user categories only): allowed **only when no task uses the category**;
  otherwise blocked, and `deleteCategory` returns `{ deleted: false, inUse: n }` so the
  Manage-categories dialog shows an inline "can't delete" message.
- Presets are detected via `isPreset(name)` and locked — the UI offers no rename/delete for
  them, and the service refuses too (defense in depth).

> **Categories are per account, stored client-side.** There is no `/api/categories`
> endpoint — the backend only knows category *names* as a string on each task.
> `CategoryService` keeps one list per identity in `localStorage`
> (`todos.categories` for guests, `todos.categories.<email>` per account), signing out
> copies the current list into the guest slot, and any category surfaced by a loaded task is
> absorbed into the list so it survives on a new machine. **Limitation:** a custom category
> with no tasks won't appear on a device the user has never signed in on.

```java
@Entity @Table(name = "users")     // "user" is reserved in Postgres
class User {
  UUID id;
  String email;          // unique, normalised to lowercase
  String passwordHash;   // BCrypt, 60 chars, never leaves the server
  Instant createdAt;
}
```

`Task` gained `@ManyToOne(fetch = LAZY) User owner` with a non-updatable `owner_id` column.
The DTOs (`TaskResponse`, `UserResponse`) have no owner or hash components, so neither can
be serialised out by accident.

## 2. Component architecture (Angular)

Standalone components, each with a single clear responsibility:

```
App                          shell: toolbar, auth controls, error banner, <router-outlet>
pages/
├── TasksPage                composes the form and the list
│   ├── TaskForm             add a task (reactive form)
│   └── TaskList             filter/sort/search bar, list, empty states
│       └── TaskItem         one row: toggle, edit, delete — inputs/outputs only
├── LoginPage
└── RegisterPage
components/
├── EditTaskDialog           edit every field of an existing task
├── ManageCategoriesDialog   rename/delete user categories
├── ConfirmDialog            reusable confirm (delete task, guest migration)
└── PromptDialog             reusable single-field prompt (add category)
```

Data flows **down** via inputs, events flow **up** via outputs; services hold the single
source of truth.

**Changed from the sketch:** there's no separate filters component — the filter bar lives in
`TaskList`, because the filter state and the list derived from it belong together; splitting
them meant threading five signals down and five events back up for no benefit. Routed
components sit under `pages/` and composed pieces under `components/`, so guards apply to
pages rather than fragments.

## 3. Services and the store abstraction

The most significant departure from the sketch. Rather than `TaskService` *becoming* an HTTP
client, a `TaskStore` **interface** was extracted with interchangeable implementations:

```
Components → TaskService (facade: counts, delegation)
                  ↓ injects TASK_STORE
             RoutingTaskStore ── computed on auth state ──┬── LocalTaskStore (localStorage)
                                                          └── HttpTaskStore  (REST API)
```

- **`TaskStore`** — the interface: a `tasks` signal, an `error` signal, and the mutations.
  Because a TypeScript interface is erased at runtime, injection goes through an
  `InjectionToken<TaskStore>`.
- **`LocalTaskStore`** — `localStorage`, synchronous, guests.
- **`HttpTaskStore`** — `HttpClient`, pessimistic (the signal updates only on success), and
  an `effect` on `isLoggedIn()` reloads on sign-in and clears on sign-out.
- **`RoutingTaskStore`** — implements `TaskStore` and `computed`s between the two by auth
  state (the Strategy pattern).
- **`TaskService`** — a thin facade over whichever store is active, exposing the same API it
  always had, plus `totalCount` / `completedCount` / `countByCategory`.

**Why it matters:** adding the backend in Phase 3 and switching stores by auth state in
Phase 4 required **no changes to any component**. The abstraction absorbed both.

- **`CategoryService`** — the category list per identity (see §1), with preset protection,
  rename cascading through `TaskService.reassignCategory`, and delete refused with an in-use
  count.
- **`AuthService`** — `token`/`email` signals and an `isLoggedIn` computed; session restored
  from `localStorage` on construction and discarded if expired.
- **`GuestMigrationService`** — see §8.

## 4. State & derived views

- The raw task list lives in `TaskService`.
- Filtering, sorting, and search are **derived views** computed from the raw list plus the
  current filter/sort/search state — the raw list is never mutated by a filter.
- Angular **signals** are a good fit for reactive state (matches modern Angular practice).

## 5. Routing

| Route | Component | Guard |
| ----- | --------- | ----- |
| `/` | `TasksPage` | none — **open to guests** |
| `/login` | `LoginPage` | `guestOnlyGuard` |
| `/register` | `RegisterPage` | `guestOnlyGuard` |
| `**` | redirect to `/` | |

Adding and editing happen inline and in a dialog, so `/tasks/new` and `/tasks/:id/edit`
were never needed.

**The guard is the inverse of the usual one.** Guest mode is a requirement, so `/` must stay
open to everyone; what's worth preventing is an already-signed-in user landing on a sign-in
form. It returns a `UrlTree` to redirect rather than `false`, which would block with nowhere
to go.

## 6. Backend API (Spring Boot 4.1)

| Method | Path | Auth | Notes |
| ------ | ---- | ---- | ----- |
| POST | `/api/auth/register` | — | 201; **409** if the email is taken |
| POST | `/api/auth/login` | — | returns a JWT; **401** on bad credentials |
| GET | `/api/tasks` | ✓ | the caller's tasks only |
| GET | `/api/tasks/{id}` | ✓ | **404** if unknown *or not yours* |
| POST | `/api/tasks` | ✓ | 201 + `Location` |
| PUT | `/api/tasks/{id}` | ✓ | full replacement |
| DELETE | `/api/tasks/{id}` | ✓ | 204 |

`GET /api/auth/me` was sketched but never built — the JWT carries the user's id in `sub` and
their email as a claim, so the client already has what that endpoint would return.

**Deliberate response choices:**

- **404, never 403,** for another user's task. `findByIdAndOwnerId` collapses "not yours" and
  "doesn't exist" into one answer, so the API can't be used to discover which ids exist.
- **Identical 401s** for an unknown email and a wrong password, so login can't be used to
  enumerate accounts. (Registration's 409 does reveal existence — unavoidable if signup is
  to be usable, and a conscious trade.)
- Errors are RFC 9457 `application/problem+json`; validation failures carry a per-field
  `errors` object.

**Layering:** DTO records (`TaskRequest`/`TaskResponse`) are separate from entities, so the
storage shape can change without breaking the API and server-owned fields (`id`,
`createdAt`, `owner`) simply have no place a client could set them — mass assignment is
impossible by construction rather than by validation.

**Storage:** H2 (file-backed) for local development and tests; **PostgreSQL** for the `pg`
profile locally and in production on Neon. **Flyway** owns the schema — Hibernate runs
`validate`, so an entity change without a matching migration is a startup failure rather
than a silent `ALTER TABLE`.

## 7. Design decisions — CONFIRMED

- **State:** signals-based `TaskService`. ✅
- **UI kit:** Angular Material. ✅
- **Routing:** single screen for the task app (add/edit inline). ✅ A `/login` /
  `/register` view is added when auth arrives.
- **Categories:** hybrid preset + user-defined. ✅

## 8. Authentication & persistence strategy

Two persistence backends behind one `TaskStore` interface, chosen at runtime by auth state
(§3):

| Auth state | Storage | Added in |
| ---------- | ------- | -------- |
| Guest | `localStorage` | Phase 2 |
| Signed in | Backend REST API | Phase 3–4 |

- **`AuthService`** — `token` and `email` signals plus an `isLoggedIn` computed; session
  persisted to `localStorage` with its expiry and discarded on restore if stale.
  `register()` chains into `login()` via `switchMap`, so signing up signs you in.
- **`authInterceptor`** — a functional `HttpInterceptorFn` that attaches
  `Authorization: Bearer …` **only to this API's URLs** (so a token can never leak to a
  third-party host), and on a 401 signs out and redirects — but **only if a token was
  actually sent**. Without that condition a guest's expected 401 would bounce them to
  `/login`, breaking guest mode.
- **Token storage:** `localStorage`, sent as a bearer header. Chosen over an httpOnly
  cookie deliberately: a bearer token isn't attached automatically by the browser, so CSRF
  has nothing to exploit and `csrf().disable()` is safe. The trade is XSS exposure, accepted
  here and mitigated by a 60-minute expiry.
- **No refresh token.** The token expires after an hour and the user signs in again. Logout
  is client-side only — a JWT stays valid until it expires, so there is no server-side
  revocation. A known limitation, not an oversight.

### Auth approach — DECIDED: roll-our-own Spring Security + JWT

We implement it ourselves (max learning, fits the full-SDLC goal):
- Register/login endpoints; passwords hashed with **BCrypt**.
- **JWT** issued on login; a Spring Security filter validates it on protected endpoints.
- Angular stores the token and attaches it via an HTTP interceptor.

Still built guest-first (Phases 1–2) so we ship a working app before tackling auth in
Phase 4.

### Guest → account migration (v1, FR-11 AC7)

`GuestMigrationService.run()` is called after a successful sign-in or registration. If
`localStorage` holds guest tasks it **asks first**, via the existing `ConfirmDialog`.

1. **Categories are merged by name** (case-insensitive) into the account's list — existing
   names skipped, new ones added. This happens first because tasks reference categories by
   name, so the names must exist before the tasks land.
2. **Tasks are posted one at a time** (`concatMap`, not `mergeMap` — sequential, not a
   burst), and **each is removed from `localStorage` only after its POST succeeds**.
3. The HTTP store reloads.

**Two changes from the sketch, both deliberate:**

**It asks rather than migrating silently.** On a shared machine, absorbing whatever guest
tasks happen to be present into the account you just signed into is surprising. Cancel is
non-destructive — the tasks stay in `localStorage` and you're asked again next time — so no
dialog answer can lose data.

**It runs whenever guest tasks exist, not only on the first sign-in.** Simpler and more
predictable than tracking a "migrated" flag, and it means tasks created during a later guest
session aren't stranded.

**Failure handling:** removing each task only after its own POST succeeds means an
interruption partway through leaves the remainder safely on the client. Nothing is lost, and
nothing is duplicated on the next attempt — the property that made per-item removal worth
the extra code over a bulk create.

**Categories are not migrated to a server** — there is no category endpoint (§1). They're
merged into the account's client-side list.
