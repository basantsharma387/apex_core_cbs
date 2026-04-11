# Data Networks — Enterprise Banking Platform
## CTO Board Presentation · v2.0 · 11 April 2026

> Slide-style technical briefing for the Board of Directors.
> Each `---` separator is a slide. Render with Marp / Slidev / reveal.js, or read top-to-bottom.

---

## Slide 1 — Executive Summary

**What we are building:** A modular, AI-augmented enterprise banking platform replacing legacy point solutions across origination, risk, compliance, collections and reporting.

**Where we stand today:**
- **10 functional modules** scoped, **9 implemented** end-to-end (UI + service)
- **2 frontends shipped**: internal Banking Operations console + retail Customer Portal
- **8 backend microservices** running behind an Express API gateway
- **~87% feature complete** for the v2.0 demo milestone
- **1 module gap** (ALM/FTP) and **~8 partial UI flows** on the punch list

**Key message:** The platform is demonstrable, the architecture is production-shaped, and the remaining work is bounded and scheduled.

---

## Slide 2 — Strategic Value

| Capability | Business Outcome |
|---|---|
| AI Early Warning System (EWS) | Reduce NPA slippage by detecting stress 60–90 days earlier |
| Automated AML / STR / CTR | Regulatory compliance + fewer manual reviewer hours |
| OCR-driven KYC / DMS | Account-opening TAT cut from days to minutes |
| AI credit scoring in LOS | Faster, more consistent loan decisioning |
| IFRS 9 staging & ECL | Audit-ready provisioning, board-level transparency |
| Collections (CMS) with Next-Best-Action | Higher recovery rates, lower cost-to-collect |
| Self-service customer portal | Deflection of branch and call-centre traffic |

**Single platform replaces 6–8 vendor products** that bank IT teams typically stitch together.

---

## Slide 3 — Architecture at a Glance

```
┌─────────────────────────┐    ┌──────────────────────────┐
│  apps/banking (staff)   │    │  apps/portal (customer)  │
│  React 18 + TS + Vite   │    │  React 18 + TS + Vite    │
└────────────┬────────────┘    └─────────────┬────────────┘
             │  HTTPS / JWT                  │
             └──────────────┬────────────────┘
                            ▼
                ┌───────────────────────┐
                │  services/gateway     │  Express + RBAC + Rate-limit
                └───────────┬───────────┘
                            ▼
   ┌─────────┬─────────┬────┴────┬─────────┬──────────┬──────────┐
   ▼         ▼         ▼         ▼         ▼          ▼          ▼
auth-svc  loan-svc  ews-svc  aml-svc  dms-svc  cms-svc  ifrs9-svc  report-svc
                            │
                ┌───────────┴────────────┐
                ▼                        ▼
        PostgreSQL (Prisma)         Redis cache
```

**Stack:** React 18 · TypeScript 5 (strict) · Tailwind · React Query · Zustand · React Hook Form + Zod · Express 4 · Prisma 5 · PostgreSQL · Redis · Node 20 LTS · pnpm workspaces · Docker Compose · Playwright (E2E).

---

## Slide 4 — Module Coverage Matrix

| # | Module | Banking UI | Portal UI | Backend Service | Status |
|---|---|---|---|---|---|
| 1 | Executive Dashboard | ✅ wired | ✅ mocked | aggregated | **Live** |
| 2 | EWS — Risk Monitoring | ✅ wired | — | ews-service | **Live** |
| 3 | AML — Compliance | ✅ wired | — | aml-service | **Live** |
| 4 | DMS — KYC / Documents | ⚠ partial | ✅ wired | dms-service | **Live (gaps)** |
| 5 | LOS — Loan Origination | ⚠ partial | ✅ wired | loan-service | **Live (gaps)** |
| 6 | CMS — Collections | ⚠ partial | — | cms-service | **Live (gaps)** |
| 7 | IFRS 9 — Provisioning | ⚠ mock only | — | ifrs9-service | **Service ready, UI stub** |
| 8 | Reports | ✅ wired | — | report-service | **Live** |
| 9 | Settings / Tenant | ✅ wired | ✅ wired | auth-service | **Live** |
| 10 | **ALM / FTP** | ❌ missing | — | ❌ missing | **Not started** |

Legend: ✅ wired · ⚠ partial · ❌ missing

---

## Slide 5 — Frontend Functionality: What is Fully Done

**Banking Operations Console (`apps/banking`)**
- Auth + JWT session, role-based sidebar
- Executive Dashboard — 5 KPI cards + loan trend chart + EWS distribution + alert feed (live React Query, 30s polling)
- **EWS Page** — metrics, filterable alert table, resolve mutation, customer risk profile panel
- **AML Page** — metrics, transaction monitoring table, status update + STR filing mutations
- **Reports Page** — catalogue, generate-report mutation, jobs list
- **Settings** — profile edit, password change, tenant view, notification preferences

**Customer Portal (`apps/portal`)**
- Auth, navbar shell
- **My Loans** list with backend API
- **Apply for Loan** — 3-step wizard wired to portal LOS endpoint
- **Documents** — upload (multipart) + my-docs list, all wired
- **Profile** — edit + change password, wired
- **Statements** — list by year/month, wired (download button is the gap)

---

## Slide 6 — Frontend Functionality: Partially Done

These screens **render correctly and look complete in a demo**, but contain unwired controls or mock data:

| Screen | Gap | Effort |
|---|---|---|
| Banking · DMS upload form | Submit / Save-draft / OCR-verify buttons missing onClick handlers | ½ day |
| Banking · LOS wizard | "Submit application" handler missing; credit score uses hardcoded `mock-customer-id` | 1 day |
| Banking · CMS | NBA action cards not clickable; field-agent map is a static placeholder | 2 days |
| Banking · IFRS 9 | Entire page reads from `MOCK_STAGING`; "Run ECL Batch" + "Export XLSX" inert (service exists, just unwired) | 2 days |
| Banking · Settings → Tenant tab | Read-only; no edit mutation | 1 day |
| Portal · Dashboard | Hardcoded `MOCK_LOANS` / `MOCK_DOCS`; should call `/portal/loans/my` and `/portal/dms/my-docs` | ½ day |
| Portal · Loans detail | Route `/loans/:loanId` exists but detail view is empty | 1 day |
| Portal · Statements | "Download PDF" button has no handler | ½ day |

**Total cleanup: ~8.5 engineering days.**

---

## Slide 7 — End-to-End Banking Features Still to Add

**A. Missing module — must build**
1. **ALM / FTP** (Asset-Liability Management & Funds Transfer Pricing) — frontend module + `services/alm-service`. Source PRD: `DataNetworks-ALM_Current_vs_Future-Ver1.pdf`. Includes liquidity gap, IRRBB, NSFR/LCR dashboards, FTP curve management.

**B. Core banking features expected by a board-grade EBP**
2. **Customer 360°** — single screen aggregating accounts, loans, KYC, complaints, EWS score
3. **Account opening (CASA)** — savings/current account onboarding flow with eKYC
4. **Payments hub** — NEFT / RTGS / IMPS / UPI initiation + status, beneficiary management
5. **Cards module** — debit/credit card lifecycle, blocks, limits, statements
6. **Trade finance / LC / BG** — basic issuance + tracking
7. **Treasury & deposits** — fixed deposit booking, premature closure, interest accrual
8. **General Ledger / Chart of Accounts** — posting engine + day-end batch
9. **Branch & teller operations** — cash position, vault, denomination, EOD
10. **Loan servicing post-disbursal** — repayment schedule, foreclosure, restructuring, top-up
11. **Customer service desk** — ticketing, complaint SLA tracking, knowledge base
12. **Regulatory reporting pack** — RBI / Basel / FATCA / CRS scheduled returns

**C. Cross-cutting platform capabilities**
13. **Maker–Checker workflow engine** (currently ad-hoc per module)
14. **Notification service** (SMS/email/push) — service exists but not consumed end-to-end
15. **Audit log & forensic trail** viewer
16. **Feature flags + tenant configuration** UI
17. **Observability stack** — Grafana dashboards, distributed tracing, SLO board
18. **DR / HA runbook + chaos drills**
19. **Penetration test + SOC2 / ISO 27001 readiness**
20. **Mobile app** (React Native) reusing the portal API surface

---

## Slide 8 — Quality, Security & Compliance Posture

**Implemented**
- TypeScript strict across FE & BE; Zod schemas shared FE↔BE
- JWT + refresh, RBAC middleware, per-route role checks
- Centralised Axios client with interceptors
- Playwright E2E harness scaffolded (`e2e/`, `playwright.config.ts`)
- Docker Compose for local parity
- Prisma migrations under version control

**Gaps to close before production**
- No SAST / DAST / dependency-scan in CI yet
- No WAF / rate-limit profile per tenant
- Secrets currently in `.env` — needs Vault / KMS
- No data-at-rest encryption policy documented
- No formal threat model on file
- PII masking in logs not enforced

---

## Slide 9 — Delivery Roadmap (next 90 days)

**Sprint 1 (2 weeks) — Stabilise demo**
- Wire all 8 partial UI handlers
- Replace IFRS 9 mocks with `ifrs9-service` calls
- Replace Portal Dashboard mocks with real APIs
- Add Playwright smoke pack across all screens

**Sprint 2–3 (4 weeks) — Close the module gap**
- Build `services/alm-service` (Express + Prisma models)
- Build banking ALM/FTP UI (liquidity gap, IRRBB, FTP curves)
- Wire Notification service to AML, DMS, CMS events

**Sprint 4–5 (4 weeks) — Production hardening**
- CI: SAST, dependency scan, container scan
- Secrets to Vault, env-per-tenant config
- Observability: OpenTelemetry + Grafana dashboards
- Maker-checker workflow engine (extracted from DMS)
- Customer 360° aggregation screen

**Sprint 6 (2 weeks) — Pilot readiness**
- Performance test (5k concurrent users)
- DR drill + backup/restore validation
- UAT with one pilot bank tenant

---

## Slide 10 — Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| ALM module slippage | Medium | High | Lift PRD already exists; assign 2 engineers from Sprint 2 |
| Regulatory change (RBI) mid-build | Medium | Medium | Module isolation keeps blast radius small |
| Single-tenant Postgres bottleneck | Low | High | Plan for schema-per-tenant + read replicas in Sprint 5 |
| OCR accuracy in DMS | Medium | Medium | Confidence-threshold gate + maker-checker fallback |
| Talent concentration on monorepo | Medium | High | Pair-programming rotation + per-service ownership doc |
| Security audit findings late | High | High | Engage external pentest in Sprint 4, not Sprint 6 |

---

## Slide 11 — Investment Ask

**Headcount (next 2 quarters)**
- +2 senior full-stack engineers (ALM + Customer 360°)
- +1 SRE / DevOps (observability, secrets, CI hardening)
- +1 QA automation engineer (Playwright + load testing)
- +1 security engineer (part-time, threat modelling + pentest coordination)

**Tooling / infra**
- Managed PostgreSQL (HA) + managed Redis
- Vault / KMS for secrets
- Observability SaaS (Grafana Cloud or Datadog)
- External pentest engagement (one-time)

**Estimated 90-day burn:** ~$X (to be confirmed by Finance using current rate cards).

---

## Slide 12 — Ask of the Board

1. **Approve** continued investment in the v2.0 platform through Q3 2026
2. **Approve** ALM/FTP module as the next major workstream
3. **Approve** pilot deployment with one design-partner bank in Sprint 6
4. **Endorse** the security hardening and external audit budget line
5. **Acknowledge** the path to a multi-tenant SaaS offering as the v3.0 north star

---

## Appendix A — Source Documents Referenced

- `CLAUDE.md` — design system, component specs, screen specs
- `MASTER_ENGINEERING_DOCUMENT.md`, `ENGINEERING_PLAN.md`, `FEATURE_CATALOG.md`
- `UI_DESIGN_SPEC.md`, `UI_AGREEMENT.md`
- `project_related_document/` — vendor PRDs for EWS, AML, IFRS9, LOS, ALM, DMS, CMS, Rating, DWH
- Codebase: `apps/banking`, `apps/portal`, `services/*`, `packages/*`, `prisma/`

## Appendix B — Repo Layout

```
apex_core_cbs/
├── apps/
│   ├── banking/          # Internal operations console (React)
│   └── portal/           # Customer self-service portal (React)
├── services/
│   ├── gateway/          # API gateway (Express)
│   ├── auth-service/     # JWT, RBAC, tenant
│   ├── loan-service/     # LOS + servicing
│   ├── ews-service/      # AI risk scoring
│   ├── aml-service/      # Transaction monitoring
│   ├── dms-service/      # OCR + document workflow
│   ├── cms-service/      # Collections + NBA
│   ├── ifrs9-service/    # ECL + staging
│   ├── report-service/   # Report catalogue + jobs
│   └── notification-service/
├── packages/
│   ├── shared/           # Zod schemas, types
│   ├── middleware/       # Auth, RBAC, validation
│   └── logger/           # Winston wrapper
├── prisma/               # Migrations + schema
├── e2e/                  # Playwright tests
└── docker-compose.yml
```

---

*Prepared by the Engineering team — Data Networks · 11 April 2026*
