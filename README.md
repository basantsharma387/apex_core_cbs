# Apex Core CBS — Enterprise Banking Platform

Microservices-based core banking system with staff operations portal and
customer-facing portal. 10 services, 2 frontends, Kafka event streaming,
PostgreSQL, Redis, Prisma ORM.

---

## Quick start

```bash
# 1. Infrastructure (postgres:5433, redis:6379, kafka:9092)
docker compose up -d postgres redis zookeeper kafka

# 2. Install + generate + migrate + seed
pnpm install
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed

# 3. Run everything in parallel
pnpm dev
```

## URLs

| App | URL |
|---|---|
| Staff portal | http://localhost:5173 |
| Customer portal | http://localhost:5174 |
| API Gateway | http://localhost:3000 |
| Prisma Studio | `pnpm prisma:studio` → http://localhost:5555 |
| Kafka UI | http://localhost:8080 |

---

## Demo credentials

All demo users share the password **`Demo@123`**. Tenant code (if prompted): **`DEMO`**.

### Staff portal — http://localhost:5173

| Email | Role | What they can access |
|---|---|---|
| `admin@demo.bank` | `SUPER_ADMIN` | Everything |
| `manager@demo.bank` | `BRANCH_MANAGER` | Loan approvals, portfolio, EWS |
| `officer@demo.bank` | `LOAN_OFFICER` | Loan origination (LOS), applications |
| `analyst@demo.bank` | `CREDIT_ANALYST` | Credit scoring, application review |
| `risk@demo.bank` | `RISK_ANALYST` | EWS, IFRS9, portfolio metrics |
| `compliance@demo.bank` | `COMPLIANCE_OFFICER` | AML, STR/CTR filings |
| `collector@demo.bank` | `COLLECTION_AGENT` | CMS, case management, payments |

### Customer portal — http://localhost:5174

| Email | Password |
|---|---|
| `customer@demo.bank` | `Demo@123` |

Re-seed anytime with `pnpm prisma:seed` — the script is idempotent (upserts).

---

## Architecture

```
┌─────────────────┐        ┌─────────────────┐
│  Staff portal   │        │ Customer portal │
│    :5173        │        │     :5174       │
└────────┬────────┘        └────────┬────────┘
         │                          │
         └────────┬─────────────────┘
                  │
         ┌────────▼────────┐
         │  API Gateway    │  :3000
         └────────┬────────┘
                  │
    ┌─────────────┼─────────────┬────────────┬────────────┐
    ▼             ▼             ▼            ▼            ▼
┌────────┐  ┌──────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
│ auth   │  │ loan     │  │ ews     │  │ aml     │  │ dms     │
│ :3001  │  │ :3002    │  │ :3003   │  │ :3004   │  │ :3005   │
└────────┘  └──────────┘  └─────────┘  └─────────┘  └─────────┘
┌────────┐  ┌──────────┐  ┌─────────┐  ┌─────────┐
│ cms    │  │ ifrs9    │  │ notif   │  │ report  │
│ :3006  │  │ :3007    │  │ :3009   │  │ :3010   │
└────────┘  └──────────┘  └─────────┘  └─────────┘
```

Shared infrastructure: Postgres :5433, Redis :6379, Kafka :9092

---

## Common commands

```bash
pnpm dev               # run everything in parallel
pnpm dev:services      # only microservices
pnpm dev:banking       # only staff portal
pnpm dev:portal        # only customer portal

pnpm prisma:studio     # browse DB
pnpm prisma:migrate    # apply new migrations
pnpm prisma:seed       # reseed demo data

pnpm build             # build all
pnpm typecheck         # typecheck all
```

---

## Environment

Copy `.env.example` to `.env`. Docker postgres is mapped to **:5433** to avoid colliding with a native Postgres on `:5432`. If you want a different port, edit `docker-compose.yml` and `DATABASE_URL` in `.env`.
