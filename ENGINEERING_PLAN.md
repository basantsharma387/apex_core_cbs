# Engineering Plan — Data Networks Enterprise Banking Platform v2.0
> Generated: April 2026 | Status: Greenfield — Phase 0 (Documentation complete, zero code)

---

## PROJECT STATUS SNAPSHOT

| Item | Status |
|---|---|
| Documentation | Complete (CLAUDE.md, MASTER_ENGINEERING_DOCUMENT.md, UI_DESIGN_SPEC.md) |
| Source code | 0% — not started |
| Monorepo setup | Missing |
| Dependencies | Not installed |
| Database schema | Not created |
| CI/CD | Not configured |
| Tests | None |

---

## PHASE 0 — Monorepo Foundation (Week 1)

**Goal:** Working dev environment, all engineers can run `pnpm dev`

### Tasks
- [ ] Init pnpm workspace monorepo at root
- [ ] Create `apps/frontend` — Vite + React 18 + TypeScript 5 strict
- [ ] Create `apps/backend` — Express.js + TypeScript 5
- [ ] Create `packages/shared` — Zod schemas + TypeScript types
- [ ] Configure Tailwind 3 + Inter + JetBrains Mono fonts
- [ ] Configure `tsconfig.json` (strict, path aliases `@/`)
- [ ] Add ESLint + Prettier + Husky pre-commit hooks
- [ ] Add `.env.example` with all required variables
- [ ] Configure Vite with proxy to backend `:3000`
- [ ] Verify `pnpm dev` starts both apps concurrently

### Deliverables
```
apex_core_cbs/
  apps/
    frontend/   (Vite :5173)
    backend/    (ts-node-dev :3000)
  packages/
    shared/     (types + zod schemas)
  package.json  (pnpm workspace)
  pnpm-workspace.yaml
```

---

## PHASE 1 — Design System & Auth Shell (Week 2)

**Goal:** Pixel-perfect shell running with login, sidebar, and topbar

### Frontend Tasks
- [ ] `src/styles/tokens.ts` — all color tokens from CLAUDE.md
- [ ] `tailwind.config.ts` — map tokens to Tailwind theme
- [ ] `src/components/layout/Sidebar.tsx` — navy bg, 10 nav items, active state
- [ ] `src/components/layout/Topbar.tsx` — 58px, module label + user pill
- [ ] `src/components/layout/AppLayout.tsx` — shell wrapper
- [ ] `src/components/ui/MetricCard.tsx` — 5 variants
- [ ] `src/components/ui/DataTable.tsx` — virtual scroll, sortable, filterable
- [ ] `src/components/ui/RiskBadge.tsx` — HIGH/MEDIUM/LOW/LIVE/UAT/DEV
- [ ] `src/components/ui/SectionCard.tsx`
- [ ] `src/components/ui/ProgressBar.tsx`
- [ ] `src/components/ui/ActionButton.tsx` — primary/secondary/danger
- [ ] `src/components/ui/FormInput.tsx` + FormSelect
- [ ] `src/components/ui/LoadingSpinner.tsx` + SkeletonRow
- [ ] `src/components/ui/Toast.tsx` — top-right, 4s auto-dismiss
- [ ] Login page — `src/pages/LoginPage.tsx`
- [ ] `src/store/authStore.ts` — Zustand with JWT + user
- [ ] React Router v6 setup with protected routes
- [ ] `src/api/client.ts` — Axios + JWT interceptor + 401 refresh

### Backend Tasks
- [ ] Express app entry `apps/backend/src/index.ts`
- [ ] Helmet + CORS + Morgan middleware
- [ ] JWT auth middleware `src/middleware/auth.ts`
- [ ] RBAC middleware `src/middleware/rbac.ts` (10 roles)
- [ ] Zod validate middleware `src/middleware/validate.ts`
- [ ] Central error handler `src/middleware/errorHandler.ts`
- [ ] `POST /api/v1/auth/login` — bcrypt verify + JWT sign
- [ ] `POST /api/v1/auth/refresh` — rotate refresh token
- [ ] `POST /api/v1/auth/logout`
- [ ] Winston logger setup
- [ ] Prisma client init

### Database Tasks
- [ ] `prisma/schema.prisma` — User, Tenant, Role, RefreshToken models
- [ ] First migration: `npx prisma migrate dev --name init`
- [ ] Seed script with admin user + demo tenant

---

## PHASE 2 — Executive Dashboard (Week 3)

**Goal:** `/dashboard` — fully working with mock + live data

### Tasks
- [ ] `src/modules/dashboard/ExecutiveDashboard.tsx`
- [ ] `src/modules/dashboard/components/LoanTrendChart.tsx` — Recharts BarChart
- [ ] `src/modules/dashboard/components/EWSRiskSummary.tsx` — 3 risk tiers
- [ ] `src/modules/dashboard/components/ModuleStatusList.tsx` — LIVE/UAT/DEV badges
- [ ] `src/modules/dashboard/components/AlertFeedTable.tsx`
- [ ] `src/modules/dashboard/hooks/useDashboardMetrics.ts` — React Query
- [ ] `GET /api/v1/dashboard/metrics` — aggregated KPIs
- [ ] `GET /api/v1/dashboard/alerts` — recent alerts feed
- [ ] Redis cache for metrics (5-min TTL)

---

## PHASE 3 — EWS Module (Week 4)

**Goal:** `/ews` — live alert monitoring + risk profile panel

### Tasks
- [ ] `src/modules/ews/EWSDashboard.tsx`
- [ ] `src/modules/ews/components/EWSAlertTable.tsx` — PD score coloring
- [ ] `src/modules/ews/components/CustomerRiskProfile.tsx` — right panel
- [ ] `src/modules/ews/components/PDScoreGauge.tsx`
- [ ] `src/modules/ews/components/ScenarioSimulator.tsx`
- [ ] `src/modules/ews/hooks/useEWSAlerts.ts` — 30s polling
- [ ] `src/modules/ews/hooks/useRiskProfile.ts`
- [ ] Prisma models: EWSAlert, RiskIndicator
- [ ] `POST /api/v1/ews/evaluate` — verifyJWT + RISK_ANALYST role + Zod
- [ ] `GET /api/v1/ews/alerts` — paginated, filterable
- [ ] `PUT /api/v1/ews/alerts/:id/resolve`
- [ ] AI stub service call (rule-based fallback)

---

## PHASE 4 — AML Module (Week 5)

**Goal:** `/aml` — transaction monitoring + STR/CTR workflow

### Tasks
- [ ] `src/modules/aml/AMLDashboard.tsx`
- [ ] `src/modules/aml/components/TransactionTable.tsx`
- [ ] `src/modules/aml/components/CaseStatisticsPanel.tsx`
- [ ] `src/modules/aml/components/STRReportsTable.tsx`
- [ ] Prisma models: AMLAlert, AMLCase, STRReport, CTRReport
- [ ] `POST /api/v1/aml/monitor` — flag transaction
- [ ] `GET /api/v1/aml/alerts` — COMPLIANCE_OFFICER role
- [ ] `POST /api/v1/aml/str` — create STR report
- [ ] `POST /api/v1/aml/ctr` — auto-generate CTR

---

## PHASE 5 — DMS Module (Week 6)

**Goal:** `/dms` — document upload + OCR + maker-checker approval

### Tasks
- [ ] `src/modules/dms/DMSDashboard.tsx`
- [ ] `src/modules/dms/components/DocumentUploadForm.tsx` — RHF + Zod + dropzone
- [ ] `src/modules/dms/components/OCRPreviewPanel.tsx`
- [ ] `src/modules/dms/components/RecentUploadsPanel.tsx`
- [ ] `src/modules/dms/components/ApprovalQueueTable.tsx` — maker-checker
- [ ] Prisma models: Document, DocumentVersion, ApprovalWorkflow
- [ ] Multer file upload middleware (10MB limit, PDF/JPG/PNG/XLSX)
- [ ] `POST /api/v1/dms/upload` — multipart, async OCR job
- [ ] `GET /api/v1/dms/documents` — paginated
- [ ] `POST /api/v1/dms/approve/:id` — checker role only
- [ ] BullMQ OCR job queue setup

---

## PHASE 6 — LOS Module (Week 7)

**Goal:** `/los` — multi-step loan application with AI credit score

### Tasks
- [ ] `src/modules/los/LOSDashboard.tsx`
- [ ] `src/modules/los/components/ApplicationStepper.tsx` — 5-step progress
- [ ] `src/modules/los/components/LoanApplicationForm.tsx` — RHF + Zod
- [ ] `src/modules/los/components/AICreditScorePanel.tsx` — CIBIL gauge
- [ ] `src/modules/los/components/FinancialInfoForm.tsx`
- [ ] `src/modules/los/components/DocumentsStep.tsx`
- [ ] Prisma models: LoanApplication, CreditScore, RatingAssessment
- [ ] `POST /api/v1/los/application` — create
- [ ] `PUT /api/v1/los/application/:id` — update step
- [ ] `POST /api/v1/rating/calculate` — AI credit score (rule-based)

---

## PHASE 7 — CMS Module (Week 8)

**Goal:** `/cms` — collection cases + AI NBA + GPS field tracking

### Tasks
- [ ] `src/modules/cms/CMSDashboard.tsx`
- [ ] `src/modules/cms/components/DPDBucketChart.tsx` — Recharts
- [ ] `src/modules/cms/components/CaseListTable.tsx` — NBA column
- [ ] `src/modules/cms/components/AINextBestActionPanel.tsx`
- [ ] `src/modules/cms/components/MapViewPlaceholder.tsx`
- [ ] Prisma models: CollectionCase, Agent, Payment
- [ ] `GET /api/v1/collection/cases` — by DPD bucket
- [ ] `POST /api/v1/collection/case` — assign case
- [ ] `POST /api/v1/collection/payment` — record payment
- [ ] `GET /api/v1/collection/agent/:id/location` — GPS

---

## PHASE 8 — IFRS 9 & ALM Modules (Week 9)

### IFRS 9 Tasks
- [ ] `/ifrs9` — ECL calculation dashboard
- [ ] Stage 1/2/3 migration logic
- [ ] Monthly batch job (BullMQ)
- [ ] ECL report generation (PDF export)

### ALM/FTP Tasks
- [ ] `/alm` — Asset Liability Management dashboard
- [ ] Liquidity gap charts (Recharts)
- [ ] Fund Transfer Pricing tables

---

## PHASE 9 — Reports & Settings (Week 10)

### Reports
- [ ] `/reports` — regulatory report list
- [ ] PDF export (Puppeteer or react-pdf)
- [ ] XLSX export (exceljs)
- [ ] Scheduled report generation (BullMQ cron)

### Settings
- [ ] `/settings` — user management
- [ ] Role assignment (ADMIN only)
- [ ] Tenant configuration
- [ ] Audit log viewer

---

## PHASE 10 — Kafka, PWA & Notifications (Week 11)

- [ ] Apache Kafka setup (Docker for dev)
- [ ] Kafka topics: loans.created, ews.alert.high, aml.flagged, payment.received
- [ ] Push notifications (FCM) for critical alerts
- [ ] Mobile PWA for collection agents (offline-first)
- [ ] Service Worker + IndexedDB for offline cache
- [ ] GPS tracking with React Leaflet

---

## PHASE 11 — CBS Integration & Data Warehouse (Week 12)

- [ ] CBS adapter pattern (Temenos T24, Finacle stubs)
- [ ] CBS sync job every 15 minutes (BullMQ)
- [ ] Data Warehouse query layer (`/api/v1/dwh/query`)
- [ ] 1M records/hr ingestion pipeline
- [ ] Row-level security for multi-tenant analytics

---

## PHASE 12 — Security, Testing & Production (Week 13–14)

### Security
- [ ] PCI DSS controls audit
- [ ] SAML 2.0 SSO integration
- [ ] Account lockout (5 attempts → 30 min)
- [ ] Rate limiting per tenant/IP
- [ ] Penetration test checklist

### Testing
- [ ] Vitest unit tests (80% coverage on services)
- [ ] Integration tests (real Postgres + Redis, no mocks)
- [ ] Playwright E2E tests for critical flows
- [ ] Lighthouse CI performance budget

### Production
- [ ] Docker Compose (dev) + Kubernetes manifests (prod)
- [ ] GitHub Actions CI/CD pipeline
- [ ] Prometheus + Grafana monitoring
- [ ] Azure Blob Storage for documents
- [ ] Patroni for PostgreSQL HA

---

## TEAM STRUCTURE (Recommended)

| Role | Count | Responsibility |
|---|---|---|
| Frontend Lead | 1 | Design system, component library, 6 modules |
| Frontend Dev | 2 | Module screens, React Query hooks |
| Backend Lead | 1 | Architecture, auth, middleware, DB schema |
| Backend Dev | 2 | Module routes, services, Prisma queries |
| AI/ML Engineer | 1 | EWS PD model, AML detection, NBA |
| DevOps Engineer | 1 | K8s, CI/CD, Kafka, monitoring |
| QA Engineer | 1 | Integration tests, E2E, performance |

---

*Data Networks Engineering — April 2026*
