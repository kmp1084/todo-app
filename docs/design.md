# Design — Todos

> **Status:** Draft for review. This translates the requirements into a technical shape.

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

```ts
interface Category {
  id: string;
  name: string;      // unique
  preset: boolean;   // true = built-in (Work/Personal/…), cannot rename/delete
}
```

- A `DEFAULT_CATEGORIES` constant seeds the preset entries (`preset: true`).
- User-defined categories (`preset: false`) are stored alongside them.
- The task form's category dropdown shows presets + user categories, plus "＋ Add new".
- **Rename** (user categories only): update the `Category.name`, then update every task
  whose `category` matches the old name → new name.
- **Delete** (user categories only): allowed **only when no task uses the category**. If
  any task still references it, the delete is blocked and the UI reports the in-use count.
- Preset categories (`preset: true`) are locked — neither rename nor delete is offered.

```ts
interface User {          // Phase 3 (backend)
  id: string;
  email: string;          // login identifier
  // passwordHash lives on the backend only, never sent to the client
}
```
Each `Task` gains a `userId` (owner) once the backend exists.

## 2. Component architecture (Angular)

Standalone components, each with a single clear responsibility:

```
AppComponent                     shell / layout
├── TaskFormComponent            add + edit a task (reactive form)
├── TaskFiltersComponent         filter (state/category/priority), sort, search box
├── TaskListComponent            renders the list, empty state
│   └── TaskItemComponent        one task row: toggle complete, edit, delete
├── CategoryManagerComponent     list/rename/delete user categories (e.g. a dialog)
└── (shared) ConfirmDialog       confirm before delete (task or category)
```

Data flows **down** via inputs, events flow **up** via outputs; a service holds the
single source of truth for tasks.

## 3. Services

- **TaskService** — owns the task list; exposes methods: `getTasks()`, `addTask()`,
  `updateTask()`, `deleteTask()`, `toggleComplete()`. In Phase 1 it holds tasks in
  memory; Phase 2 adds localStorage; Phase 3 swaps to HTTP calls to the backend.
- **CategoryService** — owns the category list (presets + user-defined); exposes
  `getCategories()`, `addCategory()`, `renameCategory()`, `deleteCategory()`. Presets are
  protected (rename/delete refused). `renameCategory()` coordinates with `TaskService` to
  update matching tasks' `category`. `deleteCategory()` first checks `TaskService` for any
  task using the category and refuses (returns an in-use count) if so.
- **(Phase 3) HTTP layer** — Angular `HttpClient` calls to the Spring Boot REST API.

## 4. State & derived views

- The raw task list lives in `TaskService`.
- Filtering, sorting, and search are **derived views** computed from the raw list plus the
  current filter/sort/search state — the raw list is never mutated by a filter.
- Angular **signals** are a good fit for reactive state (matches modern Angular practice).

## 5. Routing

The first version can be a single screen. Optional routes to practice routing:

- `/` — task list (with filters)
- `/tasks/new` — add task
- `/tasks/:id/edit` — edit task

(We'll decide single-page vs. routed together in Phase 1.)

## 6. Backend API sketch (Phase 3, Spring Boot)

REST endpoints the frontend will call:

| Method | Path              | Purpose            |
| ------ | ----------------- | ------------------ |
| GET    | `/api/tasks`      | list all tasks     |
| POST   | `/api/tasks`      | create a task      |
| GET    | `/api/tasks/{id}` | get one task       |
| PUT    | `/api/tasks/{id}` | update a task      |
| DELETE | `/api/tasks/{id}` | delete a task      |

Storage: an embedded DB (H2) to start, swappable for PostgreSQL later.

## 7. Design decisions — CONFIRMED

- **State:** signals-based `TaskService`. ✅
- **UI kit:** Angular Material. ✅
- **Routing:** single screen for the task app (add/edit inline). ✅ A `/login` /
  `/register` view is added when auth arrives.
- **Categories:** hybrid preset + user-defined. ✅

## 8. Authentication & persistence strategy

Two persistence backends behind one `TaskService` interface, chosen at runtime by auth state:

| Auth state   | Storage             | Added in |
| ------------ | ------------------- | -------- |
| Guest        | `localStorage`      | Phase 2  |
| Logged-in    | Backend REST API    | Phase 3  |

- **`AuthService` (Angular)** — tracks the current user as a signal, exposes
  `register()`, `login()`, `logout()`, and an auth token; a route guard protects any
  logged-in-only views.
- **`TaskService`** — reads auth state and delegates to either the localStorage store or
  the HTTP store. Same public methods either way, so components don't change.
- **Token handling** — JWT stored client-side; an HTTP interceptor attaches it to API
  calls.

### Auth approach — DECIDED: roll-our-own Spring Security + JWT

We implement it ourselves (max learning, fits the full-SDLC goal):
- Register/login endpoints; passwords hashed with **BCrypt**.
- **JWT** issued on login; a Spring Security filter validates it on protected endpoints.
- Angular stores the token and attaches it via an HTTP interceptor.

Still built guest-first (Phases 1–2) so we ship a working app before tackling auth in
Phase 4.

### Guest → account migration (v1, FR-11 AC7)

On first successful register/login, if localStorage holds guest data, it is merged into
the account and persisted to the backend, then local storage is cleared/marked so nothing
is re-migrated on the next login.

**Categories are merged by name first (case-insensitive):**
- Guest category whose name already exists in the account (preset or existing user
  category) → **skipped** (no duplicate); tasks using that name map to the existing one.
- Guest category whose name is new to the account → **created** in the backend. Only this
  **delta** is persisted.
- Registering a brand-new account is the simple case: the account has only presets, so all
  custom guest categories are new and all get persisted.

**Then tasks are migrated:** the client bulk-creates the guest tasks under the user.
Because tasks reference their category **by name**, they resolve correctly against the
merged category set — no dangling references.

Order matters: **merge categories, then migrate tasks**, then clear local storage.

### Backend `User`/auth endpoints (Phase 3+)

| Method | Path             | Purpose               |
| ------ | ---------------- | --------------------- |
| POST   | `/api/auth/register` | create an account |
| POST   | `/api/auth/login`    | log in, get a token |
| GET    | `/api/auth/me`       | current user info   |
