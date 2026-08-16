# Deployment

How this app is hosted, and how to deploy a change.

> **Secrets are never in this file or in the repo.** Real values live in the Cloud Run
> service configuration and the Neon console. Everything below uses placeholders.

## Architecture

| Piece | Where | Notes |
|-------|-------|-------|
| Frontend (Angular) | **Netlify** — https://pawan-todos.netlify.app | auto-deploys on push to `main` |
| Backend (Spring Boot) | **Google Cloud Run** — https://todos-api-304973076484.us-west1.run.app | auto-deploys from CI after tests pass |
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
gcloud services enable run.googleapis.com cloudbuild.googleapis.com \
  artifactregistry.googleapis.com secretmanager.googleapis.com \
  iamcredentials.googleapis.com sts.googleapis.com
```

### Workload Identity Federation (for CI deploys)

Lets GitHub Actions authenticate to Google **without a stored service account key**. GitHub
issues each workflow run a short-lived OIDC token asserting which repository it came from;
Google verifies that claim and exchanges it for an access token valid about an hour.

```bash
# A deploy identity, separate from the runtime service account the app uses
gcloud iam service-accounts create github-deployer --display-name="GitHub Actions deployer"

DEPLOYER=github-deployer@todo-app-kmp1084.iam.gserviceaccount.com

for ROLE in roles/run.admin roles/iam.serviceAccountUser \
            roles/cloudbuild.builds.editor roles/artifactregistry.writer roles/storage.admin
do
  gcloud projects add-iam-policy-binding todo-app-kmp1084 \
    --member="serviceAccount:$DEPLOYER" --role="$ROLE" --condition=None
done

# Pool and GitHub OIDC provider
gcloud iam workload-identity-pools create github --location=global --display-name="GitHub Actions"

gcloud iam workload-identity-pools providers create-oidc github-provider \
  --location=global --workload-identity-pool=github --display-name="GitHub" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --attribute-condition="assertion.repository=='kmp1084/todo-app'"

# Only this repository may impersonate the deployer
gcloud iam service-accounts add-iam-policy-binding $DEPLOYER \
  --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/304973076484/locations/global/workloadIdentityPools/github/attribute.repository/kmp1084/todo-app"
```

The `--attribute-condition` is the security boundary — without it the provider would trust
tokens from *any* GitHub repository. Google refuses to create a provider without one.

The workflow needs `permissions: id-token: write` on the deploy job, or the runner can't
request the OIDC token. That omission is the most common cause of a confusing auth failure.

Two distinct identities are in play, deliberately:

| Identity | Used by | Can |
|----------|---------|-----|
| `github-deployer@…` | GitHub Actions | build and deploy; **cannot read secrets** |
| `304973076484-compute@…` | the running app | read `jwt-secret` and `db-password` only |

## Environment variables

Set on the Cloud Run service, read by the `prod` Spring profile. None have defaults —
a missing value fails startup rather than silently using a development fallback.

| Variable | Source | Value |
|----------|--------|-------|
| `SPRING_PROFILES_ACTIVE` | plain | `prod` |
| `DATABASE_URL` | plain | `jdbc:postgresql://<neon-host>/neondb?sslmode=require` |
| `DATABASE_USERNAME` | plain | `neondb_owner` |
| `CORS_ALLOWED_ORIGINS` | plain | `https://pawan-todos.netlify.app` |
| `DATABASE_PASSWORD` | **Secret Manager** | `db-password:latest` |
| `JWT_SECRET` | **Secret Manager** | `jwt-secret:latest` |

The two credentials are Secret Manager references, not literals — the service
configuration names a secret and the secret's own IAM policy controls who may read it.
`DATABASE_URL` stays a plain variable: a hostname is not a credential.

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
  --set-env-vars "CORS_ALLOWED_ORIGINS=https://pawan-todos.netlify.app" \
  --set-secrets "JWT_SECRET=jwt-secret:latest,DATABASE_PASSWORD=db-password:latest"
```

Why these flags:

- `--source .` — Cloud Build uses `backend/Dockerfile`, pushes to Artifact Registry, deploys
- `--allow-unauthenticated` — the app does its own JWT auth; without this Google rejects
  requests before the app sees them
- `--memory 1Gi` — 512 MiB is tight for Spring Boot + Hibernate
- `--cpu-boost` — extra CPU during startup, which helps JVM cold starts
- `--max-instances 3` — with `hikari.maximum-pool-size=3`, caps the app at 9 database
  connections, safely inside Neon's free-tier limit

## Deploying a change

**Pushes to `main` deploy automatically.** `.github/workflows/ci.yml` runs the backend and
frontend test suites, and only if both pass does the `deploy` job run
`gcloud run deploy todos-api --source .`. Pull requests run the tests but never deploy.

GitHub authenticates to Google with **Workload Identity Federation** — no service account
key is stored anywhere. See the one-time setup above.

Anything under `src/main/resources` (including `application-*.properties` and Flyway
migrations) is **baked into the jar at build time**, so a change there needs a rebuild —
which a push gives you. Environment variables and secrets are read at runtime and don't.

To deploy by hand (first-time setup, or if CI is unavailable):

```bash
cd backend && gcloud run deploy todos-api --source . --region us-west1
```

No `--set-env-vars` — unspecified settings are inherited from the current revision.

> **Careful:** `--set-env-vars` **replaces the entire set**; anything not listed is deleted.
> To change one value use `--update-env-vars "KEY=value"`.

## Image cleanup

Every deploy pushes a new image to Artifact Registry, so a cleanup policy caps the growth:

```bash
gcloud artifacts repositories set-cleanup-policies cloud-run-source-deploy \
  --location=us-west1 --policy=backend/cleanup-policy.json
```

`backend/cleanup-policy.json` keeps the 3 most recent versions and deletes untagged images
older than 7 days. Check what's stored with:

```bash
gcloud artifacts repositories describe cloud-run-source-deploy --location=us-west1
gcloud artifacts docker images list \
  us-west1-docker.pkg.dev/todo-app-kmp1084/cloud-run-source-deploy --include-tags
```

Sizes reported by the registry are **compressed**, and layers are shared between images —
so a second deploy adds roughly the size of the jar, not a whole image. The free tier is
0.5 GB.

## Verifying a deploy

```bash
API=https://todos-api-304973076484.us-west1.run.app

curl -s -o /dev/null -w "ping  -> %{http_code}\n" $API/api/ping        # 200
curl -s -o /dev/null -w "tasks -> %{http_code}\n" $API/api/tasks       # 401

curl -s -i -X OPTIONS $API/api/tasks \
  -H "Origin: https://pawan-todos.netlify.app" \
  -H "Access-Control-Request-Method: GET" | head -8                    # 200 + CORS headers
```

## Secrets

Stored in Secret Manager; the Cloud Run runtime service account is granted
`roles/secretmanager.secretAccessor` on each one individually.

Creating a secret — **use `printf`, never `echo`**. `echo` appends a newline, which is
stored as part of the value and makes a database password fail to authenticate with a
message that says nothing about whitespace:

```bash
printf '%s' 'THE-VALUE' | gcloud secrets create SECRET_NAME --data-file=-

gcloud secrets add-iam-policy-binding SECRET_NAME \
  --member="serviceAccount:304973076484-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

`--data-file=-` reads stdin so the value never appears as a command argument, where it
would land in shell history and process listings.

Rotating a value — add a version; `:latest` resolves at instance startup, so the next
cold start picks it up with no redeploy:

```bash
printf '%s' 'NEW-VALUE' | gcloud secrets versions add SECRET_NAME --data-file=-
```

Existing warm instances keep the old value until they're replaced. Force it with
`gcloud run services update todos-api --update-env-vars "ROTATED_AT=$(date +%s)"`, which
creates a new revision.

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

- **Older Cloud Run revisions still hold the pre-Secret-Manager values** as plaintext
  environment variables. Deleting those revisions, or rotating both credentials, is what
  actually removes the exposure — switching to Secret Manager only protects values from
  that point forward.
- **Every push to `main` deploys**, including docs-only and frontend-only commits. Harmless
  but wasteful — a Cloud Build run and a pointless revision each time. Fixable with a paths
  filter on the `deploy` job (the same problem `netlify.toml`'s `ignore` command solves for
  the frontend).
- **No lint step** in CI — no linter is configured for either half of the project.
- **~13 second cold start** after idle (Cloud Run JVM start + Neon wake). Removable with
  `--min-instances=1`, at roughly $10–15/month.
- **Neon free tier** autoscales `0.25 ↔ 2 CU`; the ceiling is capped at 0.25 CU so the
  monthly 100 CU-hour allowance can't be exhausted by an unexpected scale-up.
