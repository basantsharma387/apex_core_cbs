# Skills Catalog — Data Networks Enterprise Banking Platform v2.0
> Technical skills and domain knowledge required to build this platform
> April 2026 | Greenfield — full-stack banking system

---

## TIER 1 — CORE SKILLS (Must Have — All Engineers)

### TypeScript (Advanced)
- Strict mode (`"strict": true`, `noUncheckedIndexedAccess`)
- Generics, discriminated unions, conditional types
- Zod for runtime validation + type inference
- Shared types across monorepo workspaces
- Path aliases (`@/`, `@shared/`)

### React 18 (Advanced)
- Hooks: useState, useEffect, useCallback, useMemo, useRef, useContext
- Custom hooks pattern (logic extraction from components)
- React 18 concurrent features: Suspense boundaries, startTransition
- Code splitting: `React.lazy()` + dynamic imports per module
- React Hook Form — controlled + uncontrolled with Zod resolver
- React Router v6 — nested routes, loaders, protected routes

### Tailwind CSS 3 (Proficient)
- Arbitrary values: `bg-[#1565C0]`, `text-[11px]`, `rounded-[11px]`
- Responsive variants: `md:`, `lg:`, `xl:`
- State variants: `hover:`, `focus:`, `disabled:`, `group-hover:`
- Dark mode prep (class strategy)
- `@layer` for component overrides
- Understanding why NOT to use `bg-blue-500` (non-design-system colors)

### React Query (@tanstack/react-query v5) (Proficient)
- `useQuery`, `useMutation`, `useInfiniteQuery`
- Query keys — stable, hierarchical: `['ews-alerts', riskLevel]`
- `staleTime` vs `gcTime` — avoid over-fetching
- `refetchInterval` for live banking data (30s EWS, 60s AML)
- Optimistic updates for mutations
- `queryClient.invalidateQueries` after mutations
- React Query DevTools usage

### Zustand (Proficient)
- Store slices pattern
- Selector optimization (avoid re-renders)
- `persist` middleware for auth token
- `devtools` middleware for debugging
- Auth store: `{ user, token, setUser, logout }`

---

## TIER 2 — FRONTEND SKILLS

### Recharts 2 (Proficient)
- `BarChart`, `LineChart`, `AreaChart`, `PieChart`
- Custom tooltips and legends
- Responsive container wrapping
- Color tokens in `fill` and `stroke` props
- `CartesianGrid`, `XAxis`, `YAxis` styling
- Referencing banking data formats (₹ currency, % rates)

### Lucide React (Basic)
- Tree-shaking — import only used icons
- `size` prop, `strokeWidth` override
- Use with ARIA labels for accessibility

### @tanstack/react-virtual (Proficient)
- `useVirtualizer` for DataTable rows > 50
- Estimated row height and dynamic measurement
- Required for loan portfolio tables (10K+ rows)

### React Leaflet (Basic)
- Map setup with tile layer
- Custom markers for collection agents
- Offline tile caching for PWA
- GPS coordinate display

### Axios (Proficient)
- Instance creation with `baseURL`
- Request interceptors (JWT injection)
- Response interceptors (401 → refresh → retry)
- Error handling with typed errors
- Multipart/form-data for DMS uploads

### PWA / Service Worker (Intermediate)
- Workbox for caching strategies
- Background sync for offline payment capture
- IndexedDB for collection case storage
- Push notification subscription (FCM)
- App manifest for install prompt

### Vite 5 (Proficient)
- Manual chunk splitting per module
- Environment variables (`VITE_*` prefix)
- Proxy configuration (`/api` → `:3000`)
- Build analysis (`vite-bundle-analyzer`)
- Path alias configuration

---

## TIER 3 — BACKEND SKILLS

### Express.js + TypeScript (Advanced)
- Typed `Request`, `Response`, `NextFunction`
- Middleware composition (Helmet, CORS, Morgan, rate-limit)
- Async error handling pattern (`asyncHandler` wrapper)
- Centralised error middleware
- Route modularisation (`Router()` per module)
- Response envelope pattern `{ header, body }`

### Prisma 5 (Advanced)
- Schema definition — all financial fields as `Decimal(18,2)`
- Migrations: `migrate dev`, `migrate deploy`
- Relations: 1:1, 1:many, many:many
- `$transaction` for multi-step financial operations
- Soft deletes (`deletedAt DateTime?`)
- `tenantId` on every table — multi-tenancy at DB level
- Composite indexes for query performance
- Middleware for automatic `tenantId` injection

### PostgreSQL 16 (Intermediate)
- Index design (B-tree for equality, partial indexes)
- JSON/JSONB columns for flexible schema (AML typologies)
- Row-level security understanding
- Connection pooling via PgBouncer
- Patroni for HA failover
- EXPLAIN ANALYZE for query optimization
- Decimal(18,2) for all monetary fields — NEVER Float

### Redis / ioredis (Intermediate)
- String caching with TTL (`SET key value EX 300`)
- Cache key naming: `{module}:{operation}:{tenantId}`
- BullMQ job queues (OCR, reports, CBS sync)
- Pub/Sub for real-time event distribution
- Cache invalidation on writes
- What NOT to cache: PII, compliance data, active loan details

### Zod (Advanced)
- Schema definition with all validators
- `.strict()` to reject extra fields
- `.superRefine()` for cross-field validation
- Sharing schemas between FE and BE (monorepo package)
- `z.infer<typeof schema>` for type derivation
- `.parse()` vs `.safeParse()` — when to use each

### JWT / jsonwebtoken (Intermediate)
- Sign/verify with typed payload
- Access token (15min) vs refresh token (7d)
- httpOnly cookie for refresh token storage
- Token rotation on refresh
- `req.user` injection pattern in middleware

### BullMQ (Intermediate)
- Queue definition and worker setup
- Job retry with exponential backoff (max 3)
- Scheduled/recurring jobs (IFRS 9 monthly, CBS sync 15min)
- Dead letter queue handling
- Job progress reporting

---

## TIER 4 — INFRASTRUCTURE & DEVOPS

### Docker + Docker Compose (Intermediate)
- Multi-service compose (frontend, backend, PostgreSQL, Redis, Kafka)
- Healthchecks for DB readiness
- Volume mounts for persistent data
- Environment variable injection

### Apache Kafka (Intermediate)
- Topic design: `{domain}.{event}` (e.g. `ews.alert.high`)
- Producer/consumer in Node.js (kafkajs)
- Consumer groups for parallel processing
- Message schema with JSON + type safety
- Retry and dead-letter topic patterns

### Kubernetes (Basic)
- Deployment + Service + ConfigMap + Secret
- Horizontal Pod Autoscaler for API pods
- Ingress with SSL termination
- Health/readiness probes

### GitHub Actions (Intermediate)
- CI pipeline: install → typecheck → lint → test → build
- Environment secrets management
- Docker build and push to registry
- Deploy to staging on merge to main

### Prometheus + Grafana (Basic)
- Express metrics middleware (prom-client)
- API latency histograms (p50/p95/p99)
- Dashboard setup for: latency, error rate, throughput

---

## TIER 5 — DOMAIN SKILLS (Banking)

### Loan Lifecycle (Required)
- Origination → Disbursement → Repayment → NPA
- DPD (Days Past Due) buckets: 0-30, 31-60, 61-90, 90+
- LTV (Loan-to-Value), FOIR (Fixed Obligation to Income Ratio)
- CIBIL score and credit bureau integration
- Maker-checker approval for loan sanction

### Risk Management (Required for EWS/IFRS)
- PD (Probability of Default) — 0 to 1 score
- LGD (Loss Given Default), EAD (Exposure at Default)
- IFRS 9 Stage 1/2/3 classification rules
- ECL (Expected Credit Loss) calculation
- Early warning indicators (balance drop, cheque bounce, DPD)

### AML/KYC Compliance (Required for AML/DMS)
- KYC document types (national ID, passport, address proof)
- STR (Suspicious Transaction Report) — regulatory obligation
- CTR (Currency Transaction Report) — threshold-based auto-gen
- FATF grey/blacklist countries
- Beneficial ownership rules

### Collections (Required for CMS)
- NBA (Next Best Action) logic by DPD bucket
- NPA provisioning (90+ DPD = Non-Performing Asset)
- Recovery rate calculation
- Write-off vs restructure decision logic

### Regulatory Context (Awareness)
- RMA (Royal Monetary Authority — Bhutan)
- RBI (Reserve Bank of India)
- CBSL (Central Bank of Sri Lanka)
- CBK (Central Bank of Kenya)
- NBC (National Bank of Cambodia)
- PCI DSS for card data security

---

## TIER 6 — AI/ML SKILLS (AI Engineer)

### Python + FastAPI (Advanced)
- REST API service for model serving
- Async endpoints for batch inference
- Pydantic for request/response validation

### ML Fundamentals (Intermediate)
- Logistic regression, gradient boosting (XGBoost/LightGBM)
- Feature engineering for credit data
- Model evaluation (AUC-ROC, precision-recall)
- Explainability: SHAP values, reason codes

### Scikit-learn / XGBoost (Proficient)
- PD model training pipeline
- Monthly retraining on new loan performance data
- Model serialisation (joblib/pickle)
- A/B testing between model versions

### Rule-Based Fallback (Required)
- When AI service is unavailable → rule-based fallback
- Score thresholds: DPD > 30 = 0.5 PD, DPD > 60 = 0.7 PD
- AML rules: amount > threshold, country risk, velocity

---

## SKILL ASSESSMENT MATRIX

| Skill | Junior Dev | Mid Dev | Senior Dev |
|---|---|---|---|
| TypeScript | Basic types | Generics, Zod | Advanced patterns |
| React | useState/useEffect | Custom hooks | Performance, concurrent |
| React Query | useQuery | Mutations, cache | Optimistic updates |
| Tailwind | Utility classes | Design system | Custom config |
| Express | CRUD routes | Middleware | Auth, error handling |
| Prisma | Basic queries | Relations, migrations | Performance, transactions |
| PostgreSQL | Basic SQL | Indexes, joins | Query optimization |
| Redis | Basic get/set | TTL, queues | Pub/Sub, BullMQ |
| Banking Domain | None required | Loan lifecycle | Risk + compliance |

---

## ONBOARDING CHECKLIST (New Engineer)

### Day 1
- [ ] Read CLAUDE.md (design system + tech stack)
- [ ] Read MASTER_ENGINEERING_DOCUMENT.md (architecture)
- [ ] Read UI_DESIGN_SPEC.md (component specs)
- [ ] Set up local dev environment
- [ ] Access Figma file `mnz58vWYsPKf7NUXCLLc8w`
- [ ] Run `pnpm dev` successfully

### Day 2–3
- [ ] Read FEATURE_CATALOG.md (understand what you're building)
- [ ] Read ENGINEERING_PLAN.md (understand phase and current sprint)
- [ ] Read UI_AGREEMENT.md (commit to design contract)
- [ ] Review existing component library
- [ ] Build one MetricCard variant to verify setup

### Week 1
- [ ] Complete your first assigned module screen
- [ ] Submit PR with all UI_AGREEMENT checklist items checked
- [ ] Write at least one React Query hook test

---

*Skills Catalog — Data Networks Engineering · April 2026*
