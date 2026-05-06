# Tenari — Developer Setup

## Prerequisites

- **Node.js** 20+ (`node -v`)
- **Docker Desktop** (or Docker + Compose plugin)
- **Git**
- An **Azure subscription** with permissions to register an app in Entra ID (optional for mock-data mode)
- An **Anthropic API key** (optional — required for AI Bicep generation)

---

## Quick start (mock data mode)

```bash
# 1. Clone and install
git clone https://github.com/timothyoelkers-cloud/tenari.git
cd tenari
npm install

# 2. Configure environment
cp .env.example .env.local
# Open .env.local — the defaults work as-is for mock data mode.
# NEXT_PUBLIC_MOCK_DATA="true" is set by default.

# 3. Start infrastructure
docker compose up -d

# 4. Run database migrations
npm run db:push        # pushes schema directly (dev only)

# 5. Start dev server
npm run dev
# → http://localhost:3000
```

The app runs with fully mocked data. No Azure credentials or database records needed.

---

## Full setup (real Azure data)

### 1. Azure Entra ID app registration

1. Go to [portal.azure.com](https://portal.azure.com) → **Microsoft Entra ID** → **App registrations** → **New registration**
2. Name: `Tenari MSP Platform`
3. Supported account types: **Accounts in any organizational directory (Multi-tenant)**
4. Redirect URI: `http://localhost:3000/api/auth/callback/microsoft-entra-id`
5. After creation, note the **Application (client) ID** → set as `AZURE_AD_CLIENT_ID`
6. **Certificates & secrets** → New client secret → copy value → set as `AZURE_AD_CLIENT_SECRET`
7. **API permissions** → Add:
   - `Microsoft Graph` → `User.Read` (delegated)
   - `Azure Cost Management` → `Cost Management Reader` (application, per tenant subscription)
   - `Azure Resource Manager` → `Reader` (application, per tenant subscription)
8. Grant admin consent for your directory

Set `AZURE_AD_TENANT_ID="common"` to accept logins from any Entra tenant.

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
AUTH_SECRET="$(openssl rand -base64 32)"
AZURE_AD_CLIENT_ID="your-app-client-id"
AZURE_AD_CLIENT_SECRET="your-client-secret"
AZURE_AD_TENANT_ID="common"
ANTHROPIC_API_KEY="sk-ant-..."   # for AI Bicep generation
NEXT_PUBLIC_MOCK_DATA="false"    # switch off mock data
```

### 3. Start infrastructure

```bash
docker compose up -d
```

Services started:
| Service | Port | Purpose |
|---------|------|---------|
| PostgreSQL 16 | 5432 | Primary database |
| Redis 7 | 6379 | Job queues + caching |
| MinIO | 9000/9001 | Object storage (PDFs, logs) |
| Mailhog | 1025/8025 | Email capture in dev |

MinIO console: http://localhost:9001 (user: `minioadmin`, pass: `minioadmin`)

### 4. Database setup

```bash
# Generate and run migrations
npm run db:generate
npm run db:migrate

# Or for dev: push schema directly (no migration files)
npm run db:push

# Open Drizzle Studio to inspect data
npm run db:studio
```

### 5. Start the dev server

```bash
npm run dev
```

---

## Project structure

```
tenari/
├── app/
│   ├── (dashboard)/          # All authenticated pages
│   │   ├── page.tsx          # Overview / home
│   │   ├── tenants/          # Tenant list + [id] detail
│   │   ├── policies/         # Policy management
│   │   ├── savings/          # Cost & savings
│   │   ├── alerts/           # Alert centre
│   │   ├── bicep/            # AI Bicep generator
│   │   ├── reports/          # Reporting
│   │   ├── billing/          # Billing / invoices
│   │   ├── audit/            # Audit log
│   │   ├── rbac/             # Users & RBAC
│   │   ├── portal/           # Customer portal preview
│   │   ├── mobile/           # Mobile companion preview
│   │   └── settings/         # Workspace settings
│   ├── api/
│   │   ├── auth/[...nextauth]/  # NextAuth handlers
│   │   └── bicep/chat/          # Claude streaming endpoint
│   └── globals.css           # Design system CSS
├── components/
│   ├── charts/               # Donut, SpendChart, Sparkline, Bars
│   ├── shell/                # Sidebar, Topbar, TenantSwitcher
│   ├── icons.tsx             # SVG icon component
│   ├── kpi-card.tsx          # KPI metric card
│   └── providers.tsx         # Theme + Toast context
├── db/
│   ├── schema.ts             # Drizzle ORM schema
│   ├── index.ts              # DB connection
│   └── migrations/           # Generated SQL migrations
├── lib/
│   ├── auth.ts               # NextAuth config
│   └── data/
│       ├── mock.ts           # Mock data (60 tenants, policies, alerts…)
│       └── types.ts          # Shared TypeScript types
├── docker-compose.yml
├── drizzle.config.ts
└── .env.example
```

---

## Replacing mock data with real Azure APIs

The app reads from `NEXT_PUBLIC_MOCK_DATA`. When `"true"`, pages import directly from `lib/data/mock.ts`. When `"false"`, they should call your real API routes.

The intended migration path:
1. Build API routes under `app/api/` that call Azure Cost Management / Resource Manager
2. Replace `import { TENANTS } from '@/lib/data/mock'` in each page with a `useSWR` or Server Component fetch
3. Flip `NEXT_PUBLIC_MOCK_DATA="false"` in `.env.local`

---

## Useful commands

```bash
npm run dev          # Dev server with hot reload
npm run build        # Production build
npm run lint         # ESLint
npm run db:push      # Push schema changes (dev)
npm run db:generate  # Generate migration files
npm run db:migrate   # Run pending migrations
npm run db:studio    # Open Drizzle Studio at :4983
docker compose logs -f app    # Tail Next.js logs
docker compose down           # Stop all services
docker compose down -v        # Stop + delete volumes (wipes DB)
```

---

## Docker Compose production notes

The `docker-compose.yml` mounts the source directory for hot reload in development. For production deployment:
- Remove the volume mount
- Set `NODE_ENV=production`
- Use a proper secret manager (Azure Key Vault) instead of `.env` files
- Replace MinIO with Azure Blob Storage (`STORAGE_ENDPOINT=https://<account>.blob.core.windows.net`)
- Replace Mailhog with a real email provider (Resend configured via `RESEND_API_KEY`)
