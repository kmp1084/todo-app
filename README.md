# Todos

A feature-rich task manager built as a full-SDLC learning project — Angular frontend
first, Spring Boot backend later, deployed live.

**🌐 Live demo:** https://scintillating-brioche-62b3c2.netlify.app/
_(auto-deploys from `main` via Netlify on every push)_

## Repository structure

| Folder        | Contents                                                        |
| ------------- | --------------------------------------------------------------- |
| `docs/`       | Requirements, design, and roadmap (planning artifacts)          |
| `wireframes/` | Screen mockups                                                  |
| `frontend/`   | Angular application                                             |
| `backend/`    | Spring Boot REST API (added in a later phase)                   |

## Tech stack

- **Frontend:** Angular (standalone components, latest version), TypeScript
- **Backend (later):** Spring Boot, Java, REST API
- **Hosting:** Netlify / Cloudflare Pages (frontend), TBD (backend)
- **CI/CD:** GitHub Actions (later phase)

## Phases

See [docs/roadmap.md](docs/roadmap.md). In short:

0. Requirements, wireframes, repo scaffolding ← _current_
1. Angular frontend, in-memory data
2. localStorage persistence (guest mode) + polish, deploy live
3. Spring Boot backend + tasks REST API
4. Authentication (accounts, login, per-user tasks)
5. Full-stack deploy + CI/CD

## Getting started

_Frontend setup instructions will be added in Phase 1._
