# Tenari — Local Development Setup

**Target environment:** macOS, Docker Desktop, VS Code with Claude Code extension.

This bootstraps the entire Tenari stack on your Mac. End state: `docker compose up`, then `pnpm dev`, then open `http://localhost:3000` and you're logged in.

---

## 1. Prerequisites

Install in this order. If you already have a tool, check the version.

| Tool | Version | Install |
|---|---|---|
| **Homebrew** | latest | `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"` |
| **Git** | 2.40+ | `brew install git` |
| **Docker Desktop** | 4.30+ | https://docs.docker.com/desktop/install/mac-install/ |
| **Node.js** | 22 LTS | `brew install node@22` then `brew link node@22 --force` |
| **pnpm** | 9+ | `corepack enable && corepack prepare pnpm@latest --activate` |
| **VS Code** | latest | https://code.visualstudio.com/ |
| **Claude Code** | latest | VS Code extension marketplace, search "Claude Code" |
| **Azure CLI** | 2.60+ | `brew install azure-cli` |
| **Bicep CLI** | latest | `az bicep install` |
| **GitHub CLI** | 2.50+ | `brew install gh` (optional but useful) |

Verify:

```bash
node --version          # v22.x
pnpm --version          # 9.x
docker --version        # 27.x
az --version            # 2.60+
az bicep version
```

Allocate Docker Desktop **at least 8 GB RAM and 6 CPUs** (Settings → Resources). The Bicep validation sandbox is hungry.

---

## 2. Clone the repo

```bash
gh auth login          # one time
gh repo clone timothyoelkers-cloud/tenari
cd tenari
```

If the repo doesn't exist yet, create it from this prototype project — see `MILESTONES.md` Phase 0.

---

## 3. Azure prerequisites

You need three things from Azure before the app will work end-to-end.

### 3a. A dev Entra tenant

Use your **personal** Microsoft 365 dev tenant (free at https://developer.microsoft.com/microsoft-365/dev-program), NOT a customer tenant. You'll register Tenari as a multi-tenant app here.

### 3b. Register Tenari as a multi-tenant app

```bash
az login --tenant <YOUR-DEV-TENANT-ID>

az ad app create \
  --display-name "Tenari (dev)" \
  --sign-in-audience AzureADMultipleOrgs \
  --web-redirect-uris http://localhost:3000/api/auth/callback/azure-ad

# capture the appId from the output
TENARI_APP_ID="<paste-here>"

# create a client secret (1 year)
az ad app credential reset --id $TENARI_APP_ID --years 1
# capture .password as TENARI_CLIENT_SECRET

# add the API permissions (delegated, requires admin consent at customer tenants)
az ad app permission add --id $TENARI_APP_ID \
  --api 00000003-0000-0000-c000-000000000000 \
  --api-permissions \
    e1fe6dd8-ba31-4d61-89e7-88639da4683d=Scope \  # User.Read
    7b9103a5-4610-446b-9670-80643382c1fa=Scope    # Directory.Read.All

# Cost Management + ARM permissions (delegated user_impersonation)
az ad app permission add --id $TENARI_APP_ID \
  --api 797f4846-ba00-4fd7-ba43-dac1f8f63013 \
  --api-permissions 41094075-9dad-400e-a0bd-54e686782033=Scope
```

See `AZURE_INTEGRATION.md` for the full required permission set. The above is enough for first-light auth.

### 3c. Test customer tenants

You said you have 2–3 to test with. For each, an admin needs to accept the Tenari consent screen once. The app handles this — operator clicks "Add managed tenant" and is redirected to admin consent. Don't pre-configure anything.

---

## 4. Environment variables

```bash
cp .env.example .env.local
```

Fill these in:

```bash
# Tenari own
DATABASE_URL=postgresql://tenari:tenari@localhost:5432/tenari
REDIS_URL=redis://localhost:6379
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Entra (your dev tenant — see 3b)
AZURE_AD_CLIENT_ID=<TENARI_APP_ID>
AZURE_AD_CLIENT_SECRET=<TENARI_CLIENT_SECRET>
AZURE_AD_TENANT_ID=common  # 'common' = multi-tenant; do NOT pin to a single tenant

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Storage (local: MinIO; prod: Azure Blob)
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=tenari
S3_SECRET_KEY=tenari-local-secret
S3_BUCKET=tenari-dev

# Email (local: mailhog catches everything)
SMTP_HOST=localhost
SMTP_PORT=1025
EMAIL_FROM="Tenari <noreply@tenari.local>"

# KEK for encrypting customer Azure tokens at rest
# Local: generate one. Prod: pull from Key Vault.
TOKEN_ENCRYPTION_KEK=$(openssl rand -base64 32)
```

`.env.local` is gitignored. Never commit it.

---

## 5. Start the supporting services

```bash
docker compose up -d
```

This brings up:

| Service | Port | Purpose |
|---|---|---|
| `postgres` | 5432 | App database |
| `redis` | 6379 | Cache + queues |
| `minio` | 9000 (api), 9001 (console) | S3-compatible object storage |
| `mailhog` | 1025 (smtp), 8025 (web) | Catches outbound email |
| `grafana` | 3001 | OTel dashboard |
| `tempo` | 4317 | OTel traces |
| `loki` | 3100 | OTel logs |
| `bicep-sandbox` | (no exposed port) | Validation runner — built on first use |

Verify Postgres:

```bash
docker compose exec postgres psql -U tenari -d tenari -c "SELECT version();"
```

---

## 6. Install + migrate + seed

```bash
pnpm install
pnpm db:migrate          # drizzle-kit migrate
pnpm db:seed             # creates demo org, demo user, 3 fake managed tenants
```

The seed gives you a demo MSP org ("Acme MSP") with sample data shaped like the prototype. Replace with real Azure connections when you're ready.

---

## 7. Run

In two terminals (or one with `pnpm dev:all`):

```bash
# terminal 1
pnpm dev                 # Next.js on :3000

# terminal 2
pnpm worker              # BullMQ workers
```

Open http://localhost:3000.

You'll be redirected to Microsoft login. Sign in with an account in your dev Entra tenant. First sign-in creates a Tenari user; you'll then be prompted to create or join an org.

---

## 8. VS Code + Claude Code

Open the repo: `code .`

Install the recommended extensions when prompted (`.vscode/extensions.json`):
- Claude Code
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Drizzle Studio (DB browser)
- Bicep
- Azure Tools
- Docker

Open Claude Code's settings and load the system prompt:
```
.claude/system.md  →  configured automatically via .claude/config.json
```

(See `prompts/claude-code-system.md` — that file gets copied to `.claude/system.md` during repo bootstrap.)

**Workflow with Claude Code:**
1. Describe the next milestone from `MILESTONES.md`
2. Reference the prototype path and the relevant handoff doc
3. Let Claude write the code; review every diff before accepting
4. Run tests; commit per logical change

---

## 9. Common issues

**"Database does not exist"** — run `pnpm db:migrate` after starting Postgres.

**Auth redirects to wrong port** — `NEXTAUTH_URL` must match what the browser sees. Don't mix `localhost` and `127.0.0.1`.

**Bicep sandbox build fails** — first invocation builds the Docker image (`docker/bicep-sandbox/Dockerfile`); takes ~3 min. Subsequent runs reuse the image.

**429 from Azure during cost ingest** — expected for new tenants. Workers respect `Retry-After`; check logs in Grafana for backoff timing.

**Customer admin consent fails** — the customer tenant's admin must approve the app's permissions. Tenant-restriction policies on the customer side can also block; see `AZURE_INTEGRATION.md` § "Consent failures."

---

## 10. Next steps

1. Read `MILESTONES.md` and pick Phase 0 task #1
2. Read `SECURITY.md` end-to-end before writing any code that touches customer data
3. Read `AZURE_INTEGRATION.md` § "Token storage" before touching the auth flow
