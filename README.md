# Todos

A feature-rich task manager built as a full-SDLC learning project — an Angular frontend
and a Spring Boot REST API, deployed live.

**🌐 Live demo:** https://scintillating-brioche-62b3c2.netlify.app/
_(frontend auto-deploys from `main` via Netlify on every push; the backend is not yet hosted)_

## Repository structure

| Folder        | Contents                                                        |
| ------------- | --------------------------------------------------------------- |
| `docs/`       | Requirements, design, and roadmap (planning artifacts)          |
| `wireframes/` | Screen mockups                                                  |
| `frontend/`   | Angular application                                             |
| `backend/`    | Spring Boot REST API                                            |

## Tech stack

- **Frontend:** Angular 22 (standalone components, signals), TypeScript, Angular Material,
  Reactive Forms; tests on Vitest
- **Backend:** Spring Boot 4.1, Java 21, Spring Data JPA + Hibernate, H2, Bean Validation;
  tests on JUnit 5 + Mockito + MockMvc
- **Hosting:** Netlify (frontend), TBD (backend)
- **CI/CD:** GitHub Actions (Phase 5)

## Phases

See [docs/roadmap.md](docs/roadmap.md). In short:

0. ✅ Requirements, wireframes, repo scaffolding
1. ✅ Angular frontend, in-memory data
2. ✅ localStorage persistence (guest mode) + polish, deploy live
3. ✅ Spring Boot backend + tasks REST API, wired to the frontend
4. ✅ Authentication (accounts, login, per-user tasks, guest → account migration)
5. 🚧 Full-stack deploy + CI/CD ← _current_

The frontend talks to the API when run locally (`npm start`) and falls back to
localStorage in production builds, since the backend isn't hosted until Phase 5.

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

### API

| Method | Path              | Notes                          |
| ------ | ----------------- | ------------------------------ |
| GET    | `/api/tasks`      | list all                       |
| GET    | `/api/tasks/{id}` | 404 if unknown                 |
| POST   | `/api/tasks`      | 201 + `Location` header        |
| PUT    | `/api/tasks/{id}` | full replacement               |
| DELETE | `/api/tasks/{id}` | 204                            |

Errors are returned as RFC 9457 `application/problem+json`. Validation failures include a
per-field `errors` object.
