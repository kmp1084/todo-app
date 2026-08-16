# Todos

![CI](https://github.com/kmp1084/todo-app/actions/workflows/ci.yml/badge.svg)

A feature-rich task manager built as a full-SDLC learning project — an Angular frontend
and a Spring Boot REST API, deployed live.

**🌐 Live demo:** https://pawan-todos.netlify.app/
_(frontend auto-deploys from `main` via Netlify; API on Google Cloud Run — see
[docs/deploy.md](docs/deploy.md))_

> Browse it as a guest and everything works instantly — tasks live in `localStorage` and no
> API call is made. **Signing in is the first request to the API, and it can take ~15
> seconds**: both Cloud Run and the Neon database scale to zero on their free tiers, so the
> first request after an idle period wakes them. It's fast after that.

## Features

- **Tasks** — create, edit, complete, delete; description, priority, category, due date
- **Categories** — preset plus user-defined; rename cascades to tasks, delete blocked while
  in use; scoped per account
- **Find** — filter by status, category and priority; search title and description; sort
- **Guest mode** — fully usable without an account, backed by `localStorage`
- **Accounts** — register and sign in; tasks are private to their owner
- **Guest → account migration** — sign in and you're offered your guest tasks, moved one at
  a time so an interruption loses nothing
- **Responsive** and keyboard/screen-reader accessible

## Repository structure

| Folder        | Contents                                                        |
| ------------- | --------------------------------------------------------------- |
| `docs/`       | Requirements, design, roadmap, and [deployment](docs/deploy.md)  |
| `wireframes/` | Screen mockups                                                  |
| `frontend/`   | Angular application                                             |
| `backend/`    | Spring Boot REST API                                            |

## Tech stack

- **Frontend:** Angular 22 (standalone components, signals), TypeScript, Angular Material,
  Reactive Forms
- **Backend:** Spring Boot 4.1, Java 21, Spring Data JPA + Hibernate, Bean Validation,
  Flyway migrations, RFC 9457 problem details
- **Auth:** Spring Security 7, BCrypt, HMAC-signed JWTs
- **Database:** PostgreSQL 17 — Docker locally, [Neon](https://neon.tech) in production
  (H2 for fast local dev and tests)
- **Hosting:** Netlify (frontend), Google Cloud Run (API), both HTTPS
- **CI/CD:** GitHub Actions — tests both halves on every push, deploys the API on `main`
  via Workload Identity Federation (no stored credentials)

The frontend talks to a `TaskStore` interface with two implementations — `localStorage` for
guests, the REST API once signed in — so switching between them is a provider change rather
than a rewrite.

## Phases

See [docs/roadmap.md](docs/roadmap.md). In short:

0. ✅ Requirements, wireframes, repo scaffolding
1. ✅ Angular frontend, in-memory data
2. ✅ localStorage persistence (guest mode) + polish, deploy live
3. ✅ Spring Boot backend + tasks REST API, wired to the frontend
4. ✅ Authentication (accounts, login, per-user tasks, guest → account migration)
5. ✅ Full-stack deploy + CI/CD (Postgres, Flyway, Docker, Cloud Run, Secret Manager)

Built module by module, committing each step — the roadmap records what was done and why,
including the trade-offs taken deliberately.

## Getting started

**Prerequisites:** Node 22+ and JDK 21.

### Frontend

```bash
cd frontend
npm install
npm start          # http://localhost:4200
npm test           # Vitest
npm run build
```

### Backend

```bash
cd backend
./mvnw spring-boot:run   # http://localhost:8080
./mvnw test
```

No system Maven needed — `mvnw` downloads the right version. The H2 console is at
`http://localhost:8080/h2-console` (JDBC URL `jdbc:h2:file:./data/todos`, user `sa`, no
password).

> The embedded H2 file database is locked to a single JVM, so stop the running app before
> connecting an external database client.

To run against **PostgreSQL** locally — the same engine as production, and where Flyway
migrations actually apply:

```bash
cd backend
docker-compose up -d                          # Postgres 17 on :5432
SPRING_PROFILES_ACTIVE=pg ./mvnw spring-boot:run
```

Three profiles: `dev` (H2, the default), `pg` (local Postgres), `prod` (every value from an
environment variable, no defaults — see [docs/deploy.md](docs/deploy.md)).

### API

| Method | Path                  | Auth | Notes                                    |
| ------ | --------------------- | ---- | ---------------------------------------- |
| POST   | `/api/auth/register`  | —    | 201; 409 if the email is taken           |
| POST   | `/api/auth/login`     | —    | returns a JWT; 401 on bad credentials    |
| GET    | `/api/tasks`          | ✓    | the caller's tasks only                  |
| GET    | `/api/tasks/{id}`     | ✓    | 404 if unknown **or not yours**          |
| POST   | `/api/tasks`          | ✓    | 201 + `Location` header                  |
| PUT    | `/api/tasks/{id}`     | ✓    | full replacement                         |
| DELETE | `/api/tasks/{id}`     | ✓    | 204                                      |

Authenticated routes expect `Authorization: Bearer <token>`. Another user's task returns
**404, never 403** — the API doesn't reveal that a resource exists to someone who can't
have it. Both login failure modes return an identical 401 for the same reason.

Errors are RFC 9457 `application/problem+json`; validation failures include a per-field
`errors` object.

## Testing

```bash
cd backend  && ./mvnw test              # 24 tests
cd frontend && ng test --watch=false    # 19 spec files
```

Backend coverage spans plain unit tests, a `@DataJpaTest` repository slice, a `@WebMvcTest`
web slice, and a full-context `@SpringBootTest` exercising the real security filter chain.
Frontend specs cover services, stores, the HTTP layer via `HttpTestingController`, the auth
interceptor, the route guard, and components. CI runs both on every push.
