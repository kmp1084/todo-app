# Deployment

How this app is hosted, and how to deploy a change.

> **Secrets are never in this file or in the repo.** Real values live in the Cloud Run
> service configuration and the Neon console. Everything below uses placeholders.

## Architecture

| Piece | Where | Notes |
|-------|-------|-------|
| Frontend (Angular) | **Netlify** — https://scintillating-brioche-62b3c2.netlify.app | auto-deploys on push to `main` |
| Backend (Spring Boot) | **Google Cloud Run** — https://todos-api-304973076484.us-west1.run.app | deployed manually (see below) |
| Database (PostgreSQL 17) | **Neon** — `<neon-endpoint>.us-west-2.aws.neon.tech`, database `neondb` | free tier |

Cloud Run is in `us-west1` (Oregon) and Neon in AWS `us-west-2` (Oregon) so the app and
database are physically close — every query pays that round trip.

Both the backend and the database **scale to zero**, so a request after ~15 minutes of
inactivity takes roughly **13 seconds** while both wake up. Subsequent requests are ~80 ms.
Guest mode uses `localStorage` and makes no API calls, so visitors who don't sign in never
see this.

## Google Cloud

```
Project    todo-app-kmp1084   (number 304973076484)
Region     us-west1
Service    todos-api
```

## One-time setup

Install the CLI (Intel macOS):

```bash
cd ~ && curl -O https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-cli-darwin-x86_64.tar.gz
tar -xf google-cloud-cli-darwin-x86_64.tar.gz && ./google-cloud-sdk/install.sh
```

Authenticate and configure:

```bash
gcloud init
gcloud config set run/region us-west1
```

Link billing (a card on the account is **not** the same as billing attached to a project):

```bash
gcloud billing accounts list
gcloud billing projects link todo-app-kmp1084 --billing-account=BILLING_ACCOUNT_ID
gcloud billing projects describe todo-app-kmp1084     # expect billingEnabled: true
```

Enable the required APIs:

```bash
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
```

## Environment variables

Set on the Cloud Run service, read by the `prod` Spring profile. None have defaults —
a missing value fails startup rather than silently using a development fallback.

| Variable | Value |
|----------|-------|
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `DATABASE_URL` | `jdbc:postgresql://<neon-host>/neondb?sslmode=require` |
| `DATABASE_USERNAME` | `neondb_owner` |
| `DATABASE_PASSWORD` | *(Neon console → Roles)* |
| `CORS_ALLOWED_ORIGINS` | `https://scintillating-brioche-62b3c2.netlify.app` |
| `JWT_SECRET` | *(generate with `openssl rand -base64 48`)* |

Notes on `DATABASE_URL`:

- prefix with `jdbc:` and remove the credentials from the URL Neon shows
- keep `sslmode=require` — Neon refuses unencrypted connections
- drop `channel_binding=require` — that's a libpq parameter, not JDBC
- use the **direct** endpoint (host *without* `-pooler`); the pooler interferes with Flyway

## First deploy

```bash
cd backend && gcloud run deploy todos-api \
  --source . \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu-boost \
  --max-instances 3 \
  --set-env-vars "SPRING_PROFILES_ACTIVE=prod" \
  --set-env-vars "DATABASE_URL=jdbc:postgresql://<neon-host>/neondb?sslmode=require" \
  --set-env-vars "DATABASE_USERNAME=neondb_owner" \
  --set-env-vars "DATABASE_PASSWORD=<password>" \
  --set-env-vars "CORS_ALLOWED_ORIGINS=https://scintillating-brioche-62b3c2.netlify.app" \
  --set-env-vars "JWT_SECRET=<generated-secret>"
```

Why these flags:

- `--source .` — Cloud Build uses `backend/Dockerfile`, pushes to Artifact Registry, deploys
- `--allow-unauthenticated` — the app does its own JWT auth; without this Google rejects
  requests before the app sees them
- `--memory 1Gi` — 512 MiB is tight for Spring Boot + Hibernate
- `--cpu-boost` — extra CPU during startup, which helps JVM cold starts
- `--max-instances 3` — with `hikari.maximum-pool-size=3`, caps the app at 9 database
  connections, safely inside Neon's free-tier limit

## Redeploying a code or config change

Anything under `src/main/resources` (including `application-*.properties` and Flyway
migrations) is **baked into the jar at build time**, so a change there needs a rebuild.
Environment variables are read at runtime and do not.

```bash
cd backend && gcloud run deploy todos-api --source .
```

No `--set-env-vars` — unspecified settings are inherited from the current revision.

> **Careful:** `--set-env-vars` **replaces the entire set**; anything not listed is deleted.
> To change one value use `--update-env-vars "KEY=value"`.

## Verifying a deploy

```bash
API=https://todos-api-304973076484.us-west1.run.app

curl -s -o /dev/null -w "ping  -> %{http_code}\n" $API/api/ping        # 200
curl -s -o /dev/null -w "tasks -> %{http_code}\n" $API/api/tasks       # 401

curl -s -i -X OPTIONS $API/api/tasks \
  -H "Origin: https://scintillating-brioche-62b3c2.netlify.app" \
  -H "Access-Control-Request-Method: GET" | head -8                    # 200 + CORS headers
```

## Rolling back

Every deploy creates an immutable revision; the previous one still exists.

```bash
gcloud run revisions list --service todos-api
gcloud run services update-traffic todos-api --to-revisions REVISION_NAME=100
```

## Logs

```bash
gcloud run services logs read todos-api --limit 50
```

Or the console:
https://console.cloud.google.com/run/detail/us-west1/todos-api/logs?project=todo-app-kmp1084

## Known limitations

- **Secrets are plain environment variables**, visible to anyone with console access to the
  project. The production-correct approach is Secret Manager with `--set-secrets`.
- **~13 second cold start** after idle (Cloud Run JVM start + Neon wake). Removable with
  `--min-instances=1`, at roughly $10–15/month.
- **Neon free tier** autoscales `0.25 ↔ 2 CU`; the ceiling is capped at 0.25 CU so the
  monthly 100 CU-hour allowance can't be exhausted by an unexpected scale-up.
