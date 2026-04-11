# MASTER ENGINEERING DOCUMENT
## Data Networks — Enterprise Banking Platform v2.0

> **Issued by:** Chief Technology Officer & Head of Engineering, Data Networks
> **Classification:** Confidential — Engineering Leadership
> **Version:** 2.0.0 | **Date:** April 2026
> **Scope:** End-to-end system design, engineering standards, platform requirements, security, scaling, and long-term support for autonomous and supervised development by Claude and the engineering team.

---

# TABLE OF CONTENTS

```
CHAPTER 01 — Product Perspective & Vision
CHAPTER 02 — System Requirements
CHAPTER 03 — UI/UX Requirements
CHAPTER 04 — Backend Requirements
CHAPTER 05 — Core Concepts
CHAPTER 06 — Depth Concepts
CHAPTER 07 — Objectives
CHAPTER 08 — Exception Management
CHAPTER 09 — Platform Engineering Requirements
CHAPTER 10 — Platform Engineering Principles
CHAPTER 11 — Architecture — Full System Diagram
CHAPTER 12 — System Engineering
CHAPTER 13 — Frontend Engineering
CHAPTER 14 — Backend Engineering
CHAPTER 15 — Microsoft Azure Services
CHAPTER 16 — Apache Kafka — Event Streaming
CHAPTER 17 — Push Notifications
CHAPTER 18 — RUM — Real User Monitoring
CHAPTER 19 — Clickstream & User Behaviour Tracking
CHAPTER 20 — Scaling Strategy
CHAPTER 21 — Long-Term Support (LTS)
CHAPTER 22 — PCI DSS Security
CHAPTER 23 — Banking-Grade Security
CHAPTER 24 — Tech Stack Expectations & Autonomous Deliverables
```

---

# CHAPTER 01 — PRODUCT PERSPECTIVE & VISION

## 1.1 Product Identity

Data Networks Enterprise Banking Platform is a **cloud-native, multi-tenant, AI-augmented financial operations system** designed to serve banks, credit unions, microfinance institutions, and development finance companies across emerging and developing markets.

The platform is not a generic fintech product. It is a purpose-built, domain-specific system engineered for the regulatory, operational, and risk environments of banking institutions in South Asia, East Africa, and South-East Asia. Every architectural decision, security control, and feature prioritisation reflects the realities of banking in these markets — including fragile connectivity, multi-currency operations, complex regulatory obligations, and high-touch customer service models.

## 1.2 Strategic Vision

**Short term (0–12 months):** Replace paper-based, spreadsheet-driven, and legacy-system operations with a unified digital platform. Achieve measurable reductions in NPA, compliance violations, and document processing time.

**Medium term (1–3 years):** Become the data backbone for every participating bank — the single source of truth for all loan, risk, compliance, and customer data. Enable AI-driven decisioning that makes credit and risk teams 3x more productive.

**Long term (3–7 years):** Evolve into a banking intelligence platform. Predictive risk models, real-time regulatory reporting, automated compliance, and eventually embedded banking-as-a-service APIs that allow partner institutions to build on the Data Networks platform.

## 1.3 Value Proposition by Stakeholder

| Stakeholder | Current Pain | Platform Value |
|---|---|---|
| Credit Officer | Manual credit assessment, 3–5 day turnaround | AI-scored decisions in < 24 hours |
| Risk Manager | Reactive NPA management, spreadsheet IFRS 9 | Proactive EWS alerts, automated ECL |
| Compliance Officer | Manual AML review, missed STR deadlines | Rule+ML detection, auto-generated STR/CTR |
| Branch Manager | Paper KYC, manual maker-checker | Digital DMS, OCR-powered instant review |
| Collection Agent | No route optimisation, cash-only collection | GPS-guided field app, QR payments |
| Bank CTO | Multiple vendor systems, poor integration | Single platform, unified APIs |
| Regulator | Delayed, incomplete reports | Real-time regulatory dashboards |

## 1.4 Market Context

- **Target markets:** Bhutan, India, Sri Lanka, Kenya, Cambodia
- **Institution size:** 100–5,000 employees, 50K–2M customers
- **Regulatory bodies:** RMA (Bhutan), RBI (India), CBSL (Sri Lanka), CBK (Kenya), NBC (Cambodia)
- **Connectivity reality:** Intermittent internet, mobile-first agents, low-bandwidth branch environments
- **Currency:** Multi-currency support — BTN/INR, LKR, KES, KHR, USD

---

# CHAPTER 02 — SYSTEM REQUIREMENTS

## 2.1 Functional System Requirements

### SR-001: Multi-Tenancy
- The system MUST support full tenant isolation at the data layer
- Each bank is an independent tenant with its own schema namespace and data partition
- Tenant provisioning must complete within 4 hours of onboarding request
- Cross-tenant data access must be architecturally impossible — not just policy-controlled

### SR-002: Authentication & Session Management
- Support email/password login with bcrypt (cost 12)
- Support SAML 2.0 SSO for enterprise bank integrations
- JWT access tokens: 15 minute expiry
- Refresh tokens: 7 day expiry, httpOnly cookie, single-use with rotation
- Enforce account lockout: 5 failed attempts → 30 minute lockout
- Audit every authentication event (success, failure, lockout, unlock)

### SR-003: Role-Based Access Control (RBAC)
- Minimum 10 platform roles (see Chapter 01)
- Permissions are additive and role-based
- No user can approve their own submitted work (maker-checker enforced at system level)
- Role assignment changes require ADMIN role AND audit log entry
- Permissions checked on every request — not just at login

### SR-004: Core Banking Integration (CBS)
- Integrate with external CBS via REST API adapters
- Support CBS vendors: Temenos T24, Finacle, BankFusion, custom core systems
- CBS data synchronised to Data Networks DWH every 15 minutes (near-real-time)
- Adapter pattern: new CBS vendor integration in < 5 days without platform changes
- CBS failures must NOT block platform operations — graceful degradation required

### SR-005: Data Warehouse
- Ingest 1 million+ records per hour from CBS and all platform modules
- Support batch (scheduled) and streaming (real-time event) ingestion
- Maintain 7 years of transactional history for regulatory compliance
- Query response < 2 seconds for standard BI queries on up to 10M rows
- Support row-level security for multi-tenant analytical queries

### SR-006: Document Management (OCR + Workflow)
- Accept PDF, JPG, PNG, XLSX — max 10MB per file
- OCR confidence ≥ 70% required for auto-extraction
- Duplicate document detection via SHA-256 content hash
- Maker-checker workflow: 4-eyes principle enforced
- KYC document retention: 7 years minimum, immutable once approved
- Document search: full-text via Elasticsearch, < 500ms

### SR-007: AI/ML Requirements
- EWS PD (Probability of Default) model: retrained monthly on new loan performance data
- AML anomaly detection: updated weekly with new typologies
- Collection NBA (Next Best Action): updated on every payment/default event
- Credit scoring: integrated bureau data + internal behavioural model
- All AI decisions must be explainable — model generates reason codes

### SR-008: Real-Time Capabilities
- EWS alerts: pushed within 30 seconds of trigger condition
- AML alerts: pushed within 60 seconds of suspicious transaction
- Push notifications: sub-5 second delivery for critical banking alerts
- CBS transaction events: processed within 5 minutes of posting

### SR-009: Offline & Connectivity Resilience (Mobile PWA)
- Field agent app must function with zero internet connectivity
- Offline data: last 100 assigned collection cases cached locally
- Sync on reconnection: all offline actions queued and synced
- GPS coordinates cached offline, batch-synced when connected
- Payments captured offline with receipt, confirmed on sync

### SR-010: Reporting & Regulatory
- All regulatory reports (IFRS 9, AML CTR/STR, credit risk) generated without manual intervention
- Reports exportable as PDF, XLSX, and structured JSON for regulator APIs
- MIS dashboard data never older than 5 minutes
- Audit trail: every data-changing operation recorded with user, timestamp, before/after values

## 2.2 Non-Functional System Requirements

### Performance NFRs

| Metric | Requirement | Measurement |
|---|---|---|
| API p50 latency | < 100ms | Prometheus |
| API p95 latency | < 300ms | Prometheus |
| API p99 latency | < 1000ms | Prometheus |
| UI Time to Interactive | < 2s on 4G | Lighthouse |
| UI Largest Contentful Paint | < 1.5s | Lighthouse |
| UI Cumulative Layout Shift | < 0.1 | Lighthouse |
| DWH query p95 | < 2000ms | Prometheus |
| Database query p95 | < 50ms | Prisma metrics |
| OCR processing | < 10s async | Job metrics |
| Batch ingest throughput | > 1M records/hr | Job metrics |
| Kafka event processing lag | < 500ms | Kafka metrics |
| Push notification delivery | < 5s | FCM/APNs metrics |

### Availability NFRs

| Requirement | Target |
|---|---|
| Platform SLA | 99.9% (8.7 hrs downtime/year) |
| Database availability | 99.95% with Patroni failover |
| API gateway availability | 99.99% with K8s multi-replica |
| Recovery Time Objective (RTO) | < 4 hours |
| Recovery Point Objective (RPO) | < 1 hour |
| Planned maintenance window | Sundays 02:00–04:00 local time |

### Scalability NFRs

| Dimension | Baseline | Target Scale |
|---|---|---|
| Concurrent users | 500 | 10,000 |
| Tenants | 5 | 100 |
| Transactions/day | 100K | 10M |
| Documents stored | 1M | 100M |
| API requests/minute | 10K | 500K |

---

# CHAPTER 03 — UI/UX REQUIREMENTS

## 3.1 Design Philosophy

The UI is a **professional financial operations tool**, not a consumer product. Every design decision prioritises information density, accuracy, and speed of professional workflows over aesthetic minimalism.

Principles:
- **Data density over simplicity:** Branch officers and analysts process hundreds of records per day. The UI must show maximum relevant information with minimum navigation
- **Progressive disclosure:** Summary → detail flow. Never bury critical risk information in nested menus
- **Colour as signal:** Red/amber/green are reserved strictly for risk and status signals — never decorative
- **Zero ambiguity:** Every number, status, and label has a clear meaning. No creative writing in the UI

## 3.2 Design System

### Design Source
- **Figma file:** `mnz58vWYsPKf7NUXCLLc8w`
- All colors, spacing, and components are defined in `UI_DESIGN_SPEC.md`
- Every UI screen MUST match the Figma design exactly

### Color System (authoritative)

| Token | Hex | Usage |
|---|---|---|
| `brand-navy` | `#0D2B6A` | Sidebar, dark headers |
| `brand-blue` | `#1565C0` | Primary CTAs, active nav, links |
| `brand-sky` | `#2196F3` | Module labels, accents |
| `brand-skyLight` | `#E3EFFF` | Tag bg, hover states, pills |
| `success` | `#1D9E75` | Positive metrics, approved status |
| `success-bg` | `#E0F5EE` | Success badge backgrounds |
| `warning` | `#EF9F27` | Caution states, UAT badges |
| `warning-bg` | `#FAF0DC` | Warning badge backgrounds |
| `danger` | `#E24B4A` | Alerts, high risk, errors |
| `danger-bg` | `#FCEBEB` | Danger badge backgrounds |
| `purple` | `#7F77DD` | Dev status, in-progress |
| `purple-bg` | `#EEEDFE` | Purple badge backgrounds |
| `text-primary` | `#2C2C2A` | All primary text |
| `text-secondary` | `#888780` | Labels, captions, hints |
| `page-bg` | `#F1F4F8` | App background |
| `card-border` | `#F1EFE8` | All card borders |

### Typography Scale

| Name | Size | Weight | Usage |
|---|---|---|---|
| H1 | 28px | Bold (700) | Page titles |
| H2 | 20px | SemiBold (600) | Section headings |
| H3 | 16px | SemiBold | Card titles |
| Body | 14px | Regular (400) | Descriptions, table body |
| Small | 13px | Regular | Form labels, secondary |
| Caption | 12px | Regular | Metadata, timestamps |
| Micro | 11px | Medium (500) | Badges, status pills |
| Mono | 12px | Regular | IDs, API paths, code |

Font family: **Inter** for all UI text. **JetBrains Mono** for code, IDs, API paths.

## 3.3 Layout System

```
App shell:
  ├── Sidebar (220px fixed, brand-navy)
  │   ├── Logo (36x36 brand-blue, initials DN)
  │   ├── Navigation items (10 modules)
  │   └── User profile + logout
  ├── Main content area (calc(100vw - 220px))
  │   ├── Topbar (58px, white, module label + title + user pill)
  │   └── Page content (padding: 24px all sides)
  │       ├── Page header (title + subtitle)
  │       ├── Metric cards row (5-column grid, 12px gap)
  │       ├── Main content sections
  │       └── Data tables
  └── Notification overlay (toast, top-right)
```

## 3.4 Component Requirements

### UR-001: Navigation
- Active module highlighted in sidebar (brand-blue bg, white text)
- Module label shown in topbar (10px, sky blue, uppercase)
- Breadcrumb for nested pages (detail views, form steps)
- Keyboard navigation: Tab through sidebar items, Enter to activate

### UR-002: Data Tables
- Virtual scrolling for > 50 rows (using @tanstack/react-virtual)
- Column sorting: click header → asc → desc → reset
- Column filtering: filter panel accessible per column
- Row selection: checkbox for bulk actions
- Sticky header when scrolling
- Empty state: illustration + message + action button
- Loading skeleton: matches column layout of real data

### UR-003: Forms
- React Hook Form + Zod resolver on every form
- Inline validation: error shown on blur, not on submit
- Required fields marked with asterisk (*)
- Disabled state: 50% opacity, no interactions
- Success state: green border + checkmark after save
- Auto-save draft every 30 seconds for long forms (LOS, DMS)

### UR-004: Modals & Drawers
- Approval/rejection: modal with mandatory comment field
- Customer risk profile: right-side drawer (380px wide)
- Document viewer: full-screen overlay with metadata panel
- All modals: ESC to close, click outside to close
- Focus trap inside open modal (WCAG 2.1 AA)

### UR-005: Notifications & Alerts
- Toast notifications: top-right, 4s auto-dismiss, manual close
- In-app notification bell: badge count, dropdown list
- Critical banking alerts: full-width banner, dismissible only after read
- EWS push: browser push notification + in-app bell

### UR-006: Mobile PWA (Collection Agent)
- Target device: Android 9+ / iOS 14+, low-end hardware
- Offline-first: full functionality without network
- Touch targets: minimum 44x44px (WCAG AA)
- Font minimum: 16px on mobile (prevents iOS zoom on focus)
- GPS map: React Leaflet, cached tiles for offline
- Camera: document photo capture for proof of visit

### UR-007: Accessibility (WCAG 2.1 AA)
- All interactive elements keyboard-accessible
- ARIA labels on all icon-only buttons
- Colour never the only indicator of status (use icon + colour)
- Focus rings visible on all interactive elements
- Screen reader tested: NVDA on Windows, VoiceOver on macOS
- Minimum contrast: 4.5:1 for normal text, 3:1 for large text

### UR-008: Internationalisation
- All user-facing strings in i18next translation files
- Languages: English, Hindi, Dzongkha, Sinhala, Khmer
- Currency: Intl.NumberFormat with locale
- Dates: date-fns with locale, stored UTC, displayed in tenant timezone
- RTL support: architecture-ready (CSS logical properties used throughout)

### UR-009: Performance Budget
- Initial bundle: < 500KB gzipped
- Per-module chunk: < 100KB gzipped
- Images: WebP, lazy-loaded, responsive srcset
- Fonts: preloaded, font-display: swap
- Core Web Vitals: LCP < 1.5s, CLS < 0.1, FID < 100ms

---

# CHAPTER 04 — BACKEND REQUIREMENTS

## 4.1 API Design Requirements

### BR-001: RESTful Standards
- Resources are nouns, operations are HTTP verbs
- URLs: plural, lowercase, hyphenated (`/loan-applications`, not `/loanApplications`)
- Versioning: `/api/v1/` prefix on all routes
- Filtering: query parameters (`?status=ACTIVE&riskLevel=HIGH`)
- Pagination: `?page=1&limit=20` on all list endpoints
- Sorting: `?sortBy=createdAt&order=desc`
- Response envelope: standard format (see Chapter 14)

### BR-002: Request Validation
- Zod schema validation on every request body, query, and params
- Schema is the contract — reject any extra fields (`.strict()`)
- Validation errors return HTTP 400 with field-level error details
- UUID format enforced on all ID parameters before DB lookup
- Date parameters validated as ISO 8601

### BR-003: Error Handling
- Centralised error middleware — all errors flow to one handler
- AppError class with typed ErrorCode enum
- HTTP status codes strictly followed (400/401/403/404/409/422/500/503)
- Production: never expose stack traces in API responses
- Development: include stack trace in error response
- All errors logged with full context before responding

### BR-004: Authentication Middleware Chain
Every authenticated request passes through:
```
1. Helmet (security headers)
2. CORS validation
3. Rate limiter
4. JWT verify (verifyJWT middleware)
5. Tenant extraction (req.user.tenantId)
6. RBAC check (checkRole middleware)
7. Request validation (validateBody/validateQuery)
8. asyncHandler (catches all async errors)
9. Route handler (pure business delegation)
10. Response formatter
11. Winston audit logger
```

### BR-005: Database Requirements
- PostgreSQL 16 as primary RDBMS
- Prisma 5.x as ORM — type-safe, migration-tracked
- Connection pooling: PgBouncer, min 2, max 10 per service
- All money fields: `Decimal(18,2)` — NEVER Float
- Soft delete: `deletedAt DateTime?` on all financial records
- Audit columns: `createdBy`, `updatedBy` on all write operations
- Row-level tenant isolation: `tenantId` on every table
- Indexes: `tenantId` always indexed, composite indexes for common query patterns
- Transactions: all multi-step financial operations in Prisma `$transaction`

### BR-006: Background Job Requirements
- OCR processing: BullMQ job queue, Redis-backed
- Report generation: async jobs with job ID returned to client
- Monthly IFRS 9 batch: scheduled cron via BullMQ
- Email notifications: queued, not inline
- CBS sync: scheduled pull every 15 minutes
- Job retry: exponential backoff, max 3 attempts
- Dead letter queue: failed jobs after max retries → alert engineering

### BR-007: Caching Requirements
- Redis 7 as cache layer
- Cache keys: `{module}:{operation}:{tenantId}[:{id}]`
- TTLs by data sensitivity:
  - Aggregated metrics: 5 minutes
  - User sessions: 15 minutes (access token lifetime)
  - Lookup tables (branches, products): 1 hour
  - Config: 24 hours
- Cache invalidation: on every write to cached entity
- Never cache: PII, active loan details, compliance data

---

# CHAPTER 05 — CORE CONCEPTS

## 5.1 Multi-Tenancy Model

**Row-Level Tenancy** is the foundation of the entire platform. Every database table carries a `tenantId` column. Every query filters by `tenantId`. The tenancy contract is:

```
Tenant A can NEVER see, access, modify, or be affected by Tenant B's data.
This is enforced at the database query level — not just at the application layer.
```

Implementation:
- `tenantId` injected into `req.user` by JWT middleware on every authenticated request
- `enforceTenant` middleware verifies `tenantId` on every route
- Repository layer always receives `tenantId` as a parameter — never derives it internally
- Prisma middleware automatically appends `WHERE tenantId = ?` as an additional safety net

## 5.2 Event-Driven Architecture

The platform operates on an event-driven spine alongside the request/response API layer. Critical business events are published to Kafka topics and consumed by downstream services independently.

```
Loan created          → kafka: loans.created        → EWS, DWH, Notification
EWS alert HIGH        → kafka: ews.alert.high        → CMS case auto-create, Push notify
AML transaction flag  → kafka: aml.flagged           → Case management, STR queue
Payment received      → kafka: payment.received      → IFRS 9 recalc, LMS update, CMS close
Document approved     → kafka: document.approved     → KYC status update, LOS progression
Stage migration       → kafka: ifrs9.stage.changed   → ECL recalculation, Reporting
```

## 5.3 Domain Model

The platform's core domain is built around five entities and their relationships:

```
Customer (1) ──── (many) Loan
                            ├──── EWSAlert
                            ├──── CollectionCase
                            ├──── IFRSStaging
                            └──── RatingAssessment

Customer (1) ──── (many) Document (KYC, ID, financial)
Customer (1) ──── (many) AMLAlert

Loan        (1) ──── (1)  LoanApplication (origination)
Loan        (1) ──── (many) Transaction (CBS sync)
Loan        (1) ──── (many) RepaymentSchedule
```

## 5.4 Maker-Checker Principle

All critical financial operations require two-person authorisation. The submitter (Maker) and approver (Checker) must be different users. This is enforced system-wide for:
- Document approval (DMS)
- Loan approval (LOS)
- AML case closure
- STR/CTR filing
- User role changes
- Large payment write-offs

Implementation: Every relevant entity has `submittedBy`, `reviewedBy`, and a database constraint that `submittedBy != reviewedBy`.

## 5.5 Audit Immutability

Financial records are never truly deleted. Every change is captured in an audit log with the before-state and after-state. Specifically:
- `deletedAt` timestamp used for soft deletes — record preserved
- `AuditLog` table: `entityType`, `entityId`, `operation`, `before`, `after`, `userId`, `timestamp`
- Audit records are append-only — no updates or deletes on audit tables
- Audit data retained for 7 years (regulatory requirement)

## 5.6 AI/ML Integration Model

AI models are not embedded in the platform code. They are called as internal microservices or external APIs. This decouples model versioning from platform versioning.

```
Platform Service → POST /ai-service/ews/evaluate → AI Service (Python FastAPI)
                                                    ├── Feature extraction
                                                    ├── Model inference
                                                    ├── Reason code generation
                                                    └── Response: {score, riskLevel, reasons}
```

The platform is the orchestrator. AI is a capability. Fallback: if AI service is unavailable, rule-based scoring kicks in automatically.

---

# CHAPTER 06 — DEPTH CONCEPTS

## 6.1 IFRS 9 — Expected Credit Loss Engine

IFRS 9 is a three-stage impairment model. Every loan in the portfolio is classified into one of three stages based on credit risk indicators. The platform calculates Expected Credit Loss (ECL) for each stage.

```
Stage 1 — 12-month ECL
  Trigger: DPD < 30, no significant increase in credit risk
  ECL = PD(12m) × LGD × EAD × Discount factor
  Review frequency: Monthly

Stage 2 — Lifetime ECL (significant credit risk increase)
  Trigger: DPD 30–89, OR material change in creditworthiness
  ECL = PD(lifetime) × LGD × EAD × Discount factor (all remaining cashflows)
  Review frequency: Monthly + on EWS trigger

Stage 3 — Lifetime ECL (credit-impaired)
  Trigger: DPD ≥ 90 (NPA)
  ECL = Best estimate of actual credit loss
  Review frequency: Quarterly + on collection action
```

The batch run calculates ECL for the entire performing portfolio. Intra-month recalculations trigger when a loan payment is received or when a stage migration event fires on Kafka.

Scenario analysis produces three ECL variants: base case, optimistic (+20% recovery assumption), pessimistic (-30% recovery assumption) — reported per IAS 8 requirements.

## 6.2 AML Rule Engine Architecture

The AML engine operates in two layers:

**Layer 1 — Synchronous Rule Engine (< 100ms)**
Runs on every transaction at point of monitoring:
- Threshold rules (large cash, large transfer)
- Velocity rules (frequency within 24h window)
- Geography rules (high-risk country list)
- Structuring detection (multiple sub-threshold transactions)
- Sanction list screening (OFAC, UN, local regulators)

**Layer 2 — Asynchronous ML Anomaly Detection (< 60s)**
Runs in background after initial rule pass:
- Graph network analysis (connected accounts)
- Behavioural anomaly vs customer's 90-day baseline
- Typology matching (known money laundering patterns)
- Updates the alert risk level after initial creation

Outcome: Every transaction gets a risk score, a reason code, and a disposition recommendation. Analysts review HIGH-risk transactions. MEDIUM-risk auto-closes after 5 days without further signals. LOW-risk auto-closes immediately.

## 6.3 EWS — Probability of Default Model

The PD model is a logistic regression ensemble trained on 36 months of loan performance data, incorporating:

```
Behavioural features:
  - DPD trend (30/60/90 day rolling)
  - Payment punctuality score (0–100)
  - EMI-to-income ratio drift
  - Savings balance trend
  - Overdraft frequency

External features:
  - Bureau score delta (current vs 6 months ago)
  - New inquiries count (last 90 days)
  - Existing obligation growth

Macro features:
  - GDP growth (lagged 6 months)
  - Sector-specific stress indicator
  - Employment index for customer's sector
```

Output: `pdScore` (0.0–1.0), `riskLevel`, `primaryDrivers[]` (top 3 reason codes). Confidence interval provided for regulatory explainability.

## 6.4 Collection NBA (Next Best Action)

The NBA engine is a decision tree + reinforcement learning hybrid. It recommends the most effective collection action based on:

```
Input: customerSegment + dpd + outstandingAmount + paymentHistory + agentCapacity + dayOfWeek

Decision tree outcomes:
  Willing but unable → Restructuring offer + partial payment acceptance
  Able but unwilling → Legal notice + field visit + guarantor contact
  Contact difficulty → Location verification + alternative contact search
  High recovery probability → Soft touch: SMS reminder + self-cure window
  Low recovery probability → Direct field visit + payment facilitation

Reinforcement learning: action outcomes feed back into model weekly
The model learns which actions recover money for which customer segments
```

## 6.5 Document OCR Pipeline

```
Upload → Virus scan → Format validation → Storage (Azure Blob)
       → OCR job queued (BullMQ)
       → OCR service (Azure Document Intelligence or Tesseract)
       → Field extraction + confidence scoring
       → Duplicate hash check (SHA-256 vs existing docs for tenant)
       → Results stored in PostgreSQL
       → Event published: kafka: document.ocr.completed
       → Frontend updated via WebSocket (OCR ready notification)
```

Fallback: If AI OCR confidence < 70%, the document is flagged for manual data entry. The maker-checker workflow still applies to manually entered data.

---

# CHAPTER 07 — OBJECTIVES

## 7.1 Business Objectives

| OBJ-001 | NPA Reduction | Reduce NPA ratio by 20–30% within 12 months via EWS proactive intervention |
| OBJ-002 | Compliance | Zero missed STR/CTR filing deadlines within 6 months of AML module go-live |
| OBJ-003 | Efficiency | Reduce loan processing time from 5 days to < 24 hours |
| OBJ-004 | Document | Eliminate all paper-based KYC processing within 3 months of DMS go-live |
| OBJ-005 | Collection | Increase collection recovery rate from baseline by minimum 15% |
| OBJ-006 | IFRS 9 | Reduce monthly provisioning calculation time from 3 days to 4 hours |
| OBJ-007 | Data | Achieve single source of truth for all bank data — eliminate siloed spreadsheets |

## 7.2 Technical Objectives

| TOBJ-001 | SLA | Maintain 99.9% uptime across all production tenants |
| TOBJ-002 | Performance | Meet all API p95 latency targets (< 300ms) |
| TOBJ-003 | Security | Zero PCI DSS violations, zero data breaches |
| TOBJ-004 | Quality | Maintain > 80% test coverage across all modules |
| TOBJ-005 | Observability | 100% of production errors captured and alerted within 60 seconds |
| TOBJ-006 | Scalability | Platform handles 10x current load with horizontal scaling only |
| TOBJ-007 | Deployability | Zero-downtime deployments on every release |

## 7.3 Product Objectives

| POBJ-001 | Modularity | Each banking module deployable and licensable independently |
| POBJ-002 | Configurability | All business rules (thresholds, limits, workflows) configurable per tenant |
| POBJ-003 | Integration | Open API catalogue with Swagger documentation for all 40+ endpoints |
| POBJ-004 | Reporting | All regulatory reports auto-generated — zero manual compilation |
| POBJ-005 | Mobile | 100% offline functionality for field collection agents |

---

# CHAPTER 08 — EXCEPTION MANAGEMENT

## 8.1 Exception Taxonomy

### EX-001: Validation Exceptions (HTTP 400)
- Request body fails Zod schema validation
- UUID format invalid on path parameters
- Required field missing
- Field value out of permitted range
- Response: HTTP 400 + field-level error array

### EX-002: Authentication Exceptions (HTTP 401)
- JWT missing from request
- JWT signature invalid
- JWT expired
- Refresh token used twice (replay attack — blacklist and alert)
- Response: HTTP 401 + re-authentication instruction

### EX-003: Authorization Exceptions (HTTP 403)
- User lacks required role for operation
- Tenant isolation violation attempt (logged as security event)
- Maker-checker violation (user approving own submission)
- Response: HTTP 403 + reason code

### EX-004: Resource Not Found (HTTP 404)
- Entity ID not found within tenant's data
- Route does not exist
- Response: HTTP 404 + resource type + ID

### EX-005: Business Rule Violations (HTTP 422)
- Loan amount exceeds product maximum
- Document type not permitted for customer category
- OCR confidence below minimum threshold
- DPD classification inconsistency
- Response: HTTP 422 + business rule code + message

### EX-006: Conflict Exceptions (HTTP 409)
- Duplicate document detected (hash match)
- Concurrent modification of same record
- Duplicate loan application in progress
- Response: HTTP 409 + existing record reference

### EX-007: External Service Failures (HTTP 503)
- CBS API timeout or unavailable
- OCR service unavailable
- Bureau API unavailable
- AI/ML service unavailable
- Response: HTTP 503 + service name + retry-after seconds + fallback behaviour

### EX-008: Internal Server Errors (HTTP 500)
- Unhandled exception in service layer
- Database connection failure
- Kafka producer failure
- Response: HTTP 500 + requestId (for log correlation) — NO stack trace in production

## 8.2 Exception Handling Rules

```typescript
// RULE 1: Never expose infrastructure details in error responses
// RULE 2: Always include requestId for log correlation
// RULE 3: Log BEFORE responding — never lose the error details
// RULE 4: External service failures: circuit breaker pattern (see 8.3)
// RULE 5: Validation errors: aggregate ALL field errors in one response
// RULE 6: Security events (auth failures, tenant violations): alert immediately
// RULE 7: Never catch and swallow — if you catch, you must re-throw or handle fully
```

## 8.3 Circuit Breaker Pattern

Applied to all external dependencies: CBS, OCR, Bureau, AI service, Azure Blob.

```
States:
  CLOSED (normal)   → requests flow through
  OPEN (failed)     → requests immediately rejected, fallback used
  HALF-OPEN (testing recovery) → limited requests, monitoring

Transitions:
  CLOSED → OPEN: 5 consecutive failures in 30 seconds
  OPEN → HALF-OPEN: after 60 second timeout
  HALF-OPEN → CLOSED: 3 consecutive successes
  HALF-OPEN → OPEN: any failure

Fallback per service:
  CBS unavailable:    use last known DWH snapshot (with staleness warning)
  OCR unavailable:    manual entry workflow, alert admin
  Bureau unavailable: internal-only scoring, flag application for manual review
  AI unavailable:     rule-based fallback scoring
```

## 8.4 Frontend Error Handling

```
Levels:
  1. Field validation: Zod + React Hook Form — inline, real-time
  2. Form submission error: API error → toast notification + field highlighting
  3. Page-level data error: ErrorBoundary component → error state UI + retry button
  4. App-level error: global ErrorBoundary → fallback page + support reference code
  5. Network offline: service worker detects → offline banner + queue for retry

React Query error handling:
  - retry: 2 times with exponential backoff for network errors
  - retry: 0 for 4xx errors (client errors should not retry)
  - onError: propagate to error boundary for rendering
  - isError: show error state in every data-fetching component
```

---

# CHAPTER 09 — PLATFORM ENGINEERING REQUIREMENTS

## 9.1 Infrastructure Requirements

### PER-001: Container Strategy
- All services containerised via Docker with multi-stage builds
- Base image: `node:20-alpine` for minimal attack surface
- Images: non-root user execution, read-only filesystem where possible
- Image scanning: Trivy on every build — block on HIGH/CRITICAL CVEs
- Registry: Azure Container Registry (ACR) with geo-replication

### PER-002: Orchestration
- Kubernetes 1.29+ on Azure Kubernetes Service (AKS)
- Minimum 3 nodes across 3 availability zones (production)
- Node autoscaling: min 3, max 20 nodes
- Pod autoscaling (HPA): CPU > 70% or Memory > 80% triggers scale-out
- Vertical Pod Autoscaling (VPA): right-size resource requests automatically
- Pod disruption budgets: minimum 2 replicas always available during updates

### PER-003: Service Mesh
- Istio service mesh for inter-service communication
- mTLS between all internal services — encrypted by default
- Traffic management: canary deployments (5% → 25% → 50% → 100%)
- Circuit breaking and retries managed at mesh level
- Distributed tracing: Jaeger via Istio sidecar

### PER-004: Secrets Management
- Azure Key Vault for all secrets, certificates, and connection strings
- No secrets in code, environment files, or Docker images
- Kubernetes ExternalSecrets operator syncs Key Vault → K8s secrets
- Secret rotation: automated via Key Vault rotation policies
- Access: managed identities, not service principal passwords

### PER-005: Configuration Management
- Non-secret config: Kubernetes ConfigMaps
- Per-tenant business rules: PostgreSQL `tenant_config` table (encrypted at rest)
- Feature flags: Azure App Configuration with staged rollout
- Environment promotion: dev → staging → production with immutable artefacts

## 9.2 Observability Requirements

### PER-006: Metrics
- Prometheus: all services expose `/metrics` endpoint
- Custom business metrics: loan applications/hr, AML alerts/day, OCR jobs queued
- Grafana dashboards: one per module + platform overview
- Alert rules: Prometheus Alertmanager → PagerDuty (P0/P1) or Slack (P2/P3)
- SLO tracking: error budget dashboards per module

### PER-007: Logging
- Winston structured JSON logs from all backend services
- Log aggregation: Azure Monitor Logs (Log Analytics workspace)
- Log retention: 30 days hot, 1 year cold (Azure Storage)
- Log access: restricted to ADMIN and SRE roles
- Sensitive data: redacted at logger level before transmission

### PER-008: Distributed Tracing
- OpenTelemetry instrumentation on all services
- Trace context propagated via W3C Trace Context headers
- Jaeger for trace storage and visualisation
- Sampling: 100% for errors, 10% for normal traffic in production
- Trace ID included in every API error response (for support correlation)

### PER-009: Alerting Escalation

| Severity | Response Time | Channel | Who |
|---|---|---|---|
| P0 — Platform down | 15 minutes | PagerDuty + Phone | On-call engineer |
| P1 — Module down | 30 minutes | PagerDuty | On-call engineer |
| P2 — Degraded performance | 2 hours | Slack #alerts | Engineering team |
| P3 — Non-critical anomaly | Next business day | Slack #monitoring | Module owner |

## 9.3 CI/CD Pipeline Requirements

### PER-010: Pipeline Stages (All mandatory — no merge without passing)

```
Stage 1: Code Quality      < 2 minutes
  TypeScript compile (zero errors)
  ESLint (zero errors)
  Prettier format check
  Commitlint message format

Stage 2: Security          < 3 minutes
  pnpm audit (no HIGH/CRITICAL)
  Trivy image scan
  secretlint (no secrets in code)
  OWASP dependency check

Stage 3: Tests             < 10 minutes
  Unit tests — 80% coverage gate
  Integration tests — 70% coverage gate
  E2E critical flows (Playwright)

Stage 4: Build & Artefact  < 5 minutes
  Vite production build
  Backend TypeScript compile
  Bundle size check (< 500KB initial)
  Docker image build + push to ACR

Stage 5: Deploy (main only)
  K8s rolling deployment (AKS)
  Istio canary: 5% traffic
  Automated smoke tests
  If pass: 25% → 50% → 100%
  If fail: automatic rollback
```

---

# CHAPTER 10 — PLATFORM ENGINEERING PRINCIPLES

## PE-PRINCIPLE-1: Everything as Code
Infrastructure, configuration, deployment manifests, security policies, monitoring rules — all in Git. Nothing is manually configured in production. This creates an auditable, reproducible, rollback-capable platform.

## PE-PRINCIPLE-2: Immutable Infrastructure
No patching running containers. When a change is required: build new image → test → replace. This eliminates configuration drift and makes every environment identical.

## PE-PRINCIPLE-3: Defence in Depth
Security is applied at every layer: network (VNET/NSG), service mesh (mTLS), API gateway (auth/rate-limit), application (RBAC/validation), database (RLS/encryption at rest), storage (SAS tokens with expiry). No single security control is relied upon.

## PE-PRINCIPLE-4: Least Privilege
Every service, every user, every process has the minimum permissions required. Kubernetes service accounts with scoped RBAC. Azure managed identities with minimal IAM roles. Database users scoped to specific schemas.

## PE-PRINCIPLE-5: Fail Safe
When a system component fails: degrade gracefully, not catastrophically. CBS down → DWH snapshot serves data. OCR down → manual entry workflow activates. AI service down → rule-based fallback runs. The platform continues operating in a reduced but functional state.

## PE-PRINCIPLE-6: Automation Over Process
Manual steps in any production workflow are risks. Deployment, scaling, certificate renewal, secret rotation, database backups — all automated. Human intervention reserved for decisions, not procedures.

## PE-PRINCIPLE-7: Observability is Not Optional
A system you cannot observe is a system you cannot maintain. Every service emits structured logs, metrics, and traces from Day 1. Observability is built into service templates — it is not added later.

## PE-PRINCIPLE-8: Treat Data as the Product
The platform's ultimate value is the data it manages on behalf of banks. Data quality, data consistency, data durability, and data security are treated with the same engineering rigour as feature delivery.

## PE-PRINCIPLE-9: Platform Serves the Developer
Internal developer experience matters. A developer should be able to: clone the repo, run one command (`pnpm dev`), and have a fully functional local environment in under 5 minutes. The platform team serves the product team.

## PE-PRINCIPLE-10: Continuous Improvement
Post-incident reviews are blameless and mandatory. Every P0/P1 produces a written RCA with action items tracked to completion. Performance baselines are reviewed quarterly. Technical debt is a first-class backlog item.

---

# CHAPTER 11 — ARCHITECTURE — FULL SYSTEM DIAGRAM

## 11.1 Physical Architecture

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                        AZURE CLOUD — EAST ASIA REGION                        ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────────┐  ║
║  │                    AZURE VIRTUAL NETWORK (VNET)                         │  ║
║  │  ┌────────────────┐   ┌────────────────┐   ┌────────────────────────┐  │  ║
║  │  │ Public Subnet  │   │ App Subnet     │   │  Data Subnet           │  │  ║
║  │  │                │   │                │   │                        │  │  ║
║  │  │ Azure Front    │   │ AKS Cluster    │   │ PostgreSQL Flex Server  │  │  ║
║  │  │ Door (CDN)     │   │ ┌────────────┐ │   │ (HA + read replicas)   │  │  ║
║  │  │                │   │ │ Ingress    │ │   │                        │  │  ║
║  │  │ Azure App      │   │ │ (NGINX)    │ │   │ Redis Cache (Premium)  │  │  ║
║  │  │ Gateway (WAF)  │   │ └────────────┘ │   │ (Zone redundant)       │  │  ║
║  │  └───────┬────────┘   │ ┌────────────┐ │   │                        │  │  ║
║  │          │             │ │ API Pods   │ │   │ Elasticsearch          │  │  ║
║  │          │             │ │ (Express)  │ │   │ (Azure Elastic Cloud)  │  │  ║
║  │          ▼             │ └────────────┘ │   │                        │  │  ║
║  │  ┌──────────────┐     │ ┌────────────┐ │   │ Azure Blob Storage     │  │  ║
║  │  │  React SPA   │     │ │ Worker Pods│ │   │ (Documents + Media)    │  │  ║
║  │  │  (Azure CDN  │     │ │ (BullMQ)   │ │   │                        │  │  ║
║  │  │   Static Web)│     │ └────────────┘ │   │ Azure Key Vault        │  │  ║
║  │  └──────────────┘     │ ┌────────────┐ │   │ (Secrets)              │  │  ║
║  │                        │ │ Kafka Pods │ │   └────────────────────────┘  │  ║
║  │                        │ │ (Confluent)│ │                               │  ║
║  │                        │ └────────────┘ │   ┌────────────────────────┐  │  ║
║  │                        │ ┌────────────┐ │   │  Azure Monitor         │  │  ║
║  │                        │ │ AI Service │ │   │  Log Analytics         │  │  ║
║  │                        │ │ (FastAPI)  │ │   │  Application Insights  │  │  ║
║  │                        │ └────────────┘ │   │  Prometheus + Grafana  │  │  ║
║  │                        └────────────────┘   └────────────────────────┘  │  ║
║  └─────────────────────────────────────────────────────────────────────────┘  ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

## 11.2 Logical Application Architecture

```
CLIENTS
  Browser (React SPA) ────────────────────────────────────┐
  Mobile PWA (Collection Agent) ──────────────────────────┤
  3rd Party (CBS, Bureau, Regulator APIs) ─────────────────┤
                                                           ▼
                                          ┌─────────────────────────┐
                                          │   Azure Front Door       │
                                          │   + WAF (DDoS, OWASP)   │
                                          └──────────┬──────────────┘
                                                     ▼
                                          ┌─────────────────────────┐
                                          │   NGINX Ingress          │
                                          │   + TLS Termination      │
                                          │   + Rate Limiting        │
                                          └──────────┬──────────────┘
                                                     ▼
                              ┌──────────────────────────────────────────────┐
                              │              EXPRESS.JS API GATEWAY           │
                              │                                               │
                              │  Middleware: Helmet→CORS→JWT→RBAC→Zod→Log   │
                              │                                               │
                              │  Routers:                                     │
                              │  /auth   /ews  /aml  /dms  /los              │
                              │  /cms    /ifrs9 /alm /rating /dwh /reports   │
                              └──────────┬───────────────────────────────────┘
                                         ▼
                    ┌─────────────────────────────────────────────────────┐
                    │                SERVICE LAYER                         │
                    │                                                       │
                    │  AuthService    EWSService    AMLService             │
                    │  DMSService     LOSService    CMSService             │
                    │  IFRS9Service   ALMService    RatingService          │
                    │  DWHService     ReportService NotificationService    │
                    └────────┬──────────────────────────────┬─────────────┘
                             ▼                              ▼
                ┌────────────────────┐         ┌─────────────────────────┐
                │   REPOSITORY LAYER │         │   EVENT PUBLISHER        │
                │                    │         │                           │
                │  Prisma ORM        │         │  Kafka Producer           │
                │  PostgreSQL 16     │         │  Topics: loans, ews,     │
                │  Redis Cache       │         │  aml, documents, payments │
                └────────────────────┘         └─────────────────────────┘
                                                          ▼
                              ┌─────────────────────────────────────────────┐
                              │            KAFKA EVENT CONSUMERS             │
                              │                                               │
                              │  DWH Ingestion Consumer                     │
                              │  EWS Alert Consumer (auto-case creation)     │
                              │  IFRS9 Recalculation Consumer                │
                              │  Notification Consumer (push + email)        │
                              │  Clickstream Consumer (user behaviour)       │
                              │  Audit Log Consumer                          │
                              └─────────────────────────────────────────────┘
```

## 11.3 Data Flow — Loan Lifecycle

```
Customer applies (React Form)
  → POST /api/v1/los/application (Express + Zod validate)
  → LOSService.create() → LoanAppRepository.create() → PostgreSQL
  → Kafka publish: loans.application.created
  → BullMQ job: credit scoring (async)
  → [Consumer] DWH ingests application record
  → [Consumer] EWS enriches customer risk profile
  → Credit scoring job completes → rating stored → event: loans.scored
  → Analyst approves → POST /api/v1/los/approve
  → Kafka publish: loans.approved
  → [Consumer] LMS creates repayment schedule
  → [Consumer] Notification sends approval push + email
  → Loan funded → CBS posts transaction
  → [Kafka consumer] CBS sync → DWH updates → EWS monitors
  → If DPD > 30 days → EWS HIGH alert → Kafka: ews.alert.high
  → [Consumer] CMS auto-creates collection case
  → Push notification → collection manager
  → Agent assigned → field visit → payment captured
  → Kafka publish: payment.received
  → [Consumer] LMS updates → IFRS9 recalculates → ECL updated
```

---

# CHAPTER 12 — SYSTEM ENGINEERING

## 12.1 Database Engineering

### Schema Design Principles
```sql
-- Every table follows this pattern
CREATE TABLE loans (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  customer_id  UUID NOT NULL REFERENCES customers(id),
  amount       DECIMAL(18,2) NOT NULL,     -- NEVER FLOAT for money
  dpd          INTEGER NOT NULL DEFAULT 0,
  stage        SMALLINT NOT NULL DEFAULT 1,
  status       loan_status NOT NULL DEFAULT 'ACTIVE',
  created_by   UUID NOT NULL REFERENCES users(id),
  updated_by   UUID REFERENCES users(id),
  deleted_at   TIMESTAMPTZ,               -- Soft delete
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Mandatory indexes
CREATE INDEX idx_loans_tenant_id      ON loans(tenant_id);
CREATE INDEX idx_loans_tenant_status  ON loans(tenant_id, status);
CREATE INDEX idx_loans_tenant_customer ON loans(tenant_id, customer_id);
CREATE INDEX idx_loans_deleted_at     ON loans(deleted_at) WHERE deleted_at IS NULL;
```

### Connection Pooling
- PgBouncer in transaction pooling mode
- Pool size: `(2 × CPU cores) + storage IO capacity`
- Backend service: max 10 connections per replica
- Connection timeout: 5 seconds
- Statement timeout: 30 seconds (prevents long-running query DoS)

### Backup Strategy
- Full backup: daily, 03:00 UTC (Azure Database for PostgreSQL automated)
- Incremental: every hour (WAL archiving to Azure Blob)
- Point-in-time recovery: up to 35 days
- Cross-region backup replication: secondary region enabled
- Backup test: monthly restore drill to verify recovery

### Read Replica Strategy
- 1 read replica for DWH/reporting queries
- Application-level read/write splitting: writes → primary, analytics → replica
- Replica lag alert: Prometheus alert if lag > 30 seconds

## 12.2 Message Queue Engineering (BullMQ)

```
Queue: ocr-processing     Priority: LOW    Concurrency: 5   Retry: 3 (exp backoff)
Queue: credit-scoring     Priority: MEDIUM Concurrency: 10  Retry: 3
Queue: report-generation  Priority: LOW    Concurrency: 3   Retry: 2
Queue: email-notifications Priority: MEDIUM Concurrency: 20  Retry: 5
Queue: ifrs9-batch        Priority: LOW    Concurrency: 2   Retry: 1 (manual alert)
Queue: cbs-sync           Priority: HIGH   Concurrency: 5   Retry: 5

Dead letter queue: All failed jobs after max retries
Alert: Slack + PagerDuty on dead letter queue > 10 items
Dashboard: Bull Board UI (admin only, auth-protected)
```

## 12.3 API Gateway Engineering

```
Express app.ts composition:
  app.use(helmet())
  app.use(cors({ origin: CORS_ORIGIN, credentials: true }))
  app.use(express.json({ limit: '1mb' }))
  app.use(express.urlencoded({ extended: true }))
  app.use(morgan('combined', { stream: winstonStream }))
  app.use(requestIdMiddleware)           // generates UUID, adds to res + logger context
  app.use(rateLimiter)                  // per-IP + per-tenant rate limiting
  app.use('/api/v1/auth', authRouter)   // Public routes
  app.use('/api/v1', verifyJWT)         // JWT guard for all below
  app.use('/api/v1', enforceTenant)     // Tenant guard
  app.use('/api/v1/ews', ewsRouter)
  // ... all module routers
  app.use(notFoundHandler)
  app.use(errorHandler)                 // Central error handler
```

---

# CHAPTER 13 — FRONTEND ENGINEERING

## 13.1 React Application Architecture

```
apps/frontend/src/
  main.tsx                    Entry: QueryClientProvider + Router + GlobalErrorBoundary
  App.tsx                     Root routes + auth guard + lazy module loading
  router/
    AppRouter.tsx             All routes with React.lazy() + Suspense
    PrivateRoute.tsx          JWT-protected route wrapper
    RoleRoute.tsx             Role-checked route wrapper
  modules/
    auth/                     Login, forgot password, reset password
    dashboard/                Executive dashboard
    ews/                      EWS alert management
    aml/                      AML compliance
    dms/                      Document management
    los/                      Loan origination
    cms/                      Collection management
    ifrs9/                    IFRS 9 provisioning
    alm/                      ALM/FTP
    reports/                  Report generation
  components/
    layout/                   AppLayout, Sidebar, Topbar
    ui/                       MetricCard, DataTable, RiskBadge, SectionCard...
    forms/                    FormInput, FormSelect, FormDropzone...
    charts/                   BarChart, LineChart, GaugeBar (Recharts wrappers)
  store/
    authStore.ts              Zustand: user, token, permissions
    alertStore.ts             Zustand: notification counts, toast queue
    tenantStore.ts            Zustand: tenant config, branding
  api/
    client.ts                 Axios instance + JWT interceptor + refresh logic
    queryClient.ts            React Query client config (retry, staleTime, gcTime)
  hooks/
    useDebounce.ts            Debounce for search inputs
    useLocalStorage.ts        Type-safe localStorage
    useWebSocket.ts           Real-time EWS alert subscription
  utils/
    formatters.ts             Currency, date, percentage formatters
    validators.ts             Custom validation utilities
    constants.ts              App-wide constants
  styles/
    tokens.ts                 Design token definitions (all colors, spacing)
    globals.css               Tailwind base + Inter font import
  types/
    global.d.ts               Global TypeScript declarations
```

## 13.2 State Management Strategy

```typescript
// Zustand — global client state
interface AuthStore {
  user: User | null
  token: string | null
  permissions: Permission[]
  login: (credentials: LoginInput) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
}

// React Query — all server state
// Key conventions:
const queryKeys = {
  ews: {
    all:     () => ['ews'] as const,
    alerts:  (f: AlertFilters) => ['ews', 'alerts', f] as const,
    metrics: () => ['ews', 'metrics'] as const,
  },
  aml: { /* same pattern */ },
}
```

## 13.3 WebSocket Integration (Real-Time EWS + AML Alerts)

```typescript
// src/hooks/useWebSocket.ts
// Server sends events via Socket.io when HIGH alerts trigger
// Client receives and:
// 1. Updates React Query cache for ews.alerts
// 2. Increments alertStore notification count
// 3. Shows toast notification
// 4. Triggers browser push notification via FCM

import { useEffect } from 'react'
import { io, Socket } from 'socket.io-client'
import { useQueryClient } from '@tanstack/react-query'
import { useAlertStore } from '@/store/alertStore'

export function useRealtimeAlerts() {
  const queryClient = useQueryClient()
  const addNotification = useAlertStore(s => s.addNotification)

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_BASE_URL, {
      auth: { token: useAuthStore.getState().token }
    })

    socket.on('ews:alert:high', (alert: EWSAlert) => {
      queryClient.invalidateQueries({ queryKey: ['ews', 'alerts'] })
      addNotification({ type: 'danger', message: `HIGH risk alert: ${alert.customerId}` })
    })

    return () => { socket.disconnect() }
  }, [])
}
```

## 13.4 Progressive Web App (PWA) Configuration

```typescript
// vite.config.ts — PWA plugin for CMS mobile
VitePWA({
  registerType: 'autoUpdate',
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/api\..*\/api\/v1\/collection\/cases/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'collection-cases',
          expiration: { maxEntries: 200, maxAgeSeconds: 86400 },
        },
      },
    ],
  },
  manifest: {
    name: 'Data Networks — Field Agent',
    short_name: 'DN Field',
    theme_color: '#0D2B6A',
    display: 'standalone',
    orientation: 'portrait',
  },
})
```

---

# CHAPTER 14 — BACKEND ENGINEERING

## 14.1 Express Application Structure

```
apps/backend/src/
  index.ts               App entry: creates server, registers middleware/routes
  app.ts                 Express app factory (testable, no side effects)
  config/
    env.ts               Validated env vars (Zod schema for process.env)
    prisma.ts            Prisma client singleton + logging
    redis.ts             ioredis client singleton
    kafka.ts             Kafka producer + consumer setup
    logger.ts            Winston instance with transports
  routes/
    index.ts             Master router: registers all module routers
    auth.ts              Authentication routes
    ews.ts               EWS routes
    aml.ts               AML routes
    dms.ts               DMS routes
    los.ts               LOS routes
    cms.ts               CMS routes
    ifrs9.ts             IFRS 9 routes
    alm.ts               ALM/FTP routes
    dwh.ts               Data warehouse query routes
    reports.ts           Report generation routes
  services/
    authService.ts
    ewsService.ts
    amlService.ts        # Each service: pure business logic
    dmsService.ts        # No req/res. No direct DB calls.
    losService.ts        # Only calls repositories + external APIs
    cmsService.ts
  repositories/
    loanRepository.ts
    customerRepository.ts   # Each repository: only Prisma queries
    ewsRepository.ts        # Always receives tenantId as param
    amlRepository.ts        # Uses transactions for multi-step writes
    documentRepository.ts
  middleware/
    auth.ts              verifyJWT: extract + verify JWT, populate req.user
    rbac.ts              checkRole: validate user role against allowed list
    validate.ts          validateBody, validateQuery, validateParams (Zod)
    rateLimiter.ts       Per-IP + per-tenant rate limiting config
    asyncHandler.ts      Wraps async route handlers in try/catch
    requestId.ts         Generate UUID requestId, attach to logger context
    errorHandler.ts      Central error handler, AppError class, ErrorCode enum
    tenant.ts            enforceTenant: validate tenantId on every auth request
  workers/
    ocrWorker.ts         BullMQ worker: OCR job processing
    creditWorker.ts      BullMQ worker: credit scoring
    reportWorker.ts      BullMQ worker: report generation
    emailWorker.ts       BullMQ worker: email dispatch
  consumers/
    dwhConsumer.ts       Kafka consumer: DWH ingestion
    ewsConsumer.ts       Kafka consumer: auto case creation on HIGH alert
    ifrs9Consumer.ts     Kafka consumer: ECL recalculation on payment
    notificationConsumer.ts  Kafka consumer: push + email on events
    clickstreamConsumer.ts   Kafka consumer: user behaviour to analytics DB
  utils/
    response.ts          success(), paginated(), error() response helpers
    crypto.ts            Hash, encrypt, decrypt utilities
    pagination.ts        Standard pagination helpers
  types/
    auth.ts              AuthenticatedRequest, AuthenticatedUser types
    api.ts               APIResponse, PaginatedResponse types
```

## 14.2 Standard Response Helpers

```typescript
// apps/backend/src/utils/response.ts

export function success<T>(data: T, message = 'Processed successfully') {
  return {
    header: { status: 'SUCCESS', code: '200', message, requestId: getRequestId(), timestamp: new Date().toISOString() },
    body: data,
  }
}

export function paginated<T>(result: PaginatedResult<T>) {
  return {
    header: { status: 'SUCCESS', code: '200', message: 'Processed successfully', requestId: getRequestId(), timestamp: new Date().toISOString() },
    body: { items: result.items, total: result.total, page: result.page, limit: result.limit, hasNext: result.hasNext },
  }
}
```

## 14.3 Prisma Middleware for Tenant Isolation

```typescript
// Additional safety net — NEVER rely on this as primary control
prisma.$use(async (params, next) => {
  if (['findFirst', 'findMany', 'update', 'delete'].includes(params.action)) {
    const tenantId = AsyncLocalStorage.getStore()?.tenantId
    if (!tenantId) throw new AppError('TENANT_ISOLATION', 'No tenant context', 403)
    if (params.args.where) {
      params.args.where.tenantId = tenantId
    } else {
      params.args.where = { tenantId }
    }
  }
  return next(params)
})
```

---

# CHAPTER 15 — MICROSOFT AZURE SERVICES

## 15.1 Service Catalogue

| Service | Tier | Purpose |
|---|---|---|
| Azure Kubernetes Service (AKS) | Standard B, 3–20 nodes | Application orchestration |
| Azure Database for PostgreSQL Flex | Business Critical, Zone HA | Primary database |
| Azure Cache for Redis | Premium P1, Zone redundant | Cache + session + pub/sub |
| Azure Blob Storage | LRS (hot + cool + archive) | Documents, media, reports |
| Azure Front Door | Premium | Global CDN + WAF + DDoS |
| Azure Application Gateway | WAF v2 | Regional WAF + load balancer |
| Azure Container Registry | Premium | Container image storage |
| Azure Key Vault | Standard | Secrets, certificates |
| Azure Monitor + Log Analytics | Per GB pricing | Logs + metrics + tracing |
| Application Insights | Per GB | Frontend RUM + backend APM |
| Azure Service Bus | Premium | Dead letter queue + sessions |
| Azure Cognitive Services / Doc Intelligence | S1 | OCR document processing |
| Azure Notification Hubs | Standard | Push notification routing |
| Azure Active Directory B2C | P1 | External identity (SAML SSO) |
| Azure App Configuration | Standard | Feature flags + config |
| Azure Functions | Consumption | Scheduled jobs + lightweight workers |

## 15.2 Azure Blob Storage — Document Management

```typescript
// Storage tier strategy
Hot tier:    Documents < 30 days old (frequent access)
Cool tier:   Documents 30–365 days (occasional access)
Archive tier: Documents > 1 year (regulatory retention, rarely accessed)

// Container structure
container: tenant-{tenantId}-documents
  kyc/
    {customerId}/
      {docType}/
        {docId}-{timestamp}.pdf
  loan-documents/
    {loanId}/
      {docType}/
        {docId}-{timestamp}.pdf

// Access control
SAS tokens: generated per-request, 1 hour expiry, read-only for viewing
Managed Identity: backend service reads/writes directly (no SAS for service)
Public access: DISABLED on all containers
Encryption: Azure Storage Service Encryption (SSE) with customer-managed keys
```

## 15.3 Azure Document Intelligence (OCR)

```typescript
// Replaces or supplements Tesseract for high-accuracy banking docs
import { DocumentAnalysisClient } from '@azure/ai-form-recognizer'

const client = new DocumentAnalysisClient(
  process.env.AZURE_DOC_INTELLIGENCE_ENDPOINT!,
  new AzureKeyCredential(process.env.AZURE_DOC_INTELLIGENCE_KEY!)
)

// Pre-built models: 'prebuilt-idDocument', 'prebuilt-invoice', 'prebuilt-receipt'
// Custom model: trained on Bhutan CID cards, Indian Aadhaar, Sri Lankan NIC
const poller = await client.beginAnalyzeDocument('prebuilt-idDocument', documentBuffer)
const result = await poller.pollUntilDone()
// Returns: name, DOB, ID number, expiry, confidence scores per field
```

## 15.4 Azure Notification Hubs

```typescript
// Abstraction layer — single API, routes to FCM (Android) + APNs (iOS)
import { NotificationHubsClient, createFcmV1Notification } from '@azure/notification-hubs'

const client = new NotificationHubsClient(
  process.env.AZURE_NOTIFICATION_HUB_CONNECTION_STRING!,
  process.env.AZURE_NOTIFICATION_HUB_NAME!
)

async function sendAlertPush(userId: string, alert: EWSAlert) {
  const deviceToken = await getDeviceToken(userId)  // from user_devices table
  const notification = createFcmV1Notification({
    message: {
      notification: {
        title: `⚠️ HIGH Risk Alert`,
        body: `Customer ${alert.customerId} — PD Score ${alert.pdScore}`,
      },
      data: {
        alertId: alert.id,
        module: 'EWS',
        riskLevel: alert.riskLevel,
      },
    },
  })
  await client.sendNotification(notification, { deviceHandle: deviceToken })
}
```

## 15.5 Azure Application Insights (RUM + APM)

```typescript
// Frontend — src/main.tsx
import { ApplicationInsights } from '@microsoft/applicationinsights-web'

const appInsights = new ApplicationInsights({
  config: {
    connectionString: import.meta.env.VITE_APPINSIGHTS_CONNECTION_STRING,
    enableAutoRouteTracking: true,      // Track SPA route changes
    enableCorsCorrelation: true,        // Correlate FE + BE traces
    enableRequestHeaderTracking: true,
    enableResponseHeaderTracking: true,
  },
})
appInsights.loadAppInsights()
appInsights.trackPageView()

// Custom events for business tracking
appInsights.trackEvent({ name: 'LoanApplicationSubmitted', properties: { loanAmount, product } })
appInsights.trackEvent({ name: 'DocumentUploaded', properties: { docType, ocrConfidence } })

// Backend — express middleware
import { setup, defaultClient } from 'applicationinsights'
setup(process.env.APPINSIGHTS_CONNECTION_STRING).start()
```

---

# CHAPTER 16 — APACHE KAFKA — EVENT STREAMING

## 16.1 Kafka Architecture

**Deployment:** Confluent Cloud (managed) or self-hosted on AKS.
**Replication factor:** 3 (all topics, production).
**Retention:** 7 days (operational topics), 90 days (audit topics), indefinite (regulatory events).

## 16.2 Topic Catalogue

```
TOPIC NAMING: {domain}.{entity}.{event}

Loan lifecycle:
  loans.application.created       ← LOS service
  loans.application.approved      ← LOS service
  loans.application.rejected      ← LOS service
  loans.disbursed                  ← CBS sync
  loans.repayment.received         ← CBS sync / CMS
  loans.dpd.changed                ← LMS service (daily batch)
  loans.stage.migrated             ← IFRS 9 service

Risk events:
  ews.alert.created                ← EWS service
  ews.alert.high                   ← EWS service (HIGH risk only)
  ews.alert.resolved               ← EWS / CMS service

AML events:
  aml.transaction.flagged          ← AML service
  aml.case.created                 ← AML service
  aml.str.filed                    ← AML service

Document events:
  documents.uploaded               ← DMS service
  documents.ocr.completed          ← OCR worker
  documents.approved               ← DMS service
  documents.kyc.expired            ← Scheduled job

Collection events:
  collection.case.created          ← CMS service
  collection.payment.recorded      ← CMS service
  collection.case.closed           ← CMS service

IFRS 9 events:
  ifrs9.ecl.recalculated           ← IFRS 9 service
  ifrs9.stage.changed              ← IFRS 9 service

User behaviour (clickstream):
  analytics.pageview               ← Frontend SDK
  analytics.click                  ← Frontend SDK
  analytics.form.submit            ← Frontend SDK
  analytics.error                  ← Frontend SDK

Audit:
  audit.data.changed               ← All services (every mutation)
  audit.auth.event                 ← Auth service
  audit.access.denied              ← RBAC middleware
```

## 16.3 Consumer Groups

```
dwh-ingestion-group         Consumes: loans.*, aml.*, ews.*, documents.*, collection.*
                            Action: writes to DWH PostgreSQL schema

ifrs9-recalc-group          Consumes: loans.repayment.received, loans.stage.migrated
                            Action: triggers ECL recalculation for affected portfolio

notification-group          Consumes: ews.alert.high, aml.transaction.flagged,
                                      loans.application.approved, documents.approved
                            Action: push notifications + email + in-app bell

cms-automation-group        Consumes: ews.alert.high
                            Action: auto-create collection case

clickstream-analytics-group Consumes: analytics.*
                            Action: writes to Azure Data Explorer / Synapse Analytics

audit-persistence-group     Consumes: audit.*
                            Action: writes to immutable audit_logs table
```

## 16.4 Kafka Producer Pattern

```typescript
// apps/backend/src/config/kafka.ts
import { Kafka, Producer, Partitioners } from 'kafkajs'

const kafka = new Kafka({
  clientId: 'banking-platform-api',
  brokers: process.env.KAFKA_BROKERS!.split(','),
  ssl: true,
  sasl: { mechanism: 'plain', username: process.env.KAFKA_API_KEY!, password: process.env.KAFKA_API_SECRET! },
})

export const producer = kafka.producer({
  createPartitioner: Partitioners.LegacyPartitioner,
  transactionTimeout: 30000,
})

// Event publishing utility
export async function publishEvent<T extends object>(
  topic: string,
  key: string,      // Use tenantId:entityId for co-partitioning
  payload: T,
  headers?: Record<string, string>
): Promise<void> {
  await producer.send({
    topic,
    messages: [{
      key,
      value: JSON.stringify({
        eventId: crypto.randomUUID(),
        eventType: topic,
        timestamp: new Date().toISOString(),
        tenantId: key.split(':')[0],
        payload,
      }),
      headers: {
        'content-type': 'application/json',
        'correlation-id': getCurrentRequestId(),
        ...headers,
      },
    }],
  })
}

// Usage in service layer
await publishEvent('ews.alert.high', `${user.tenantId}:${alert.id}`, alert)
```

## 16.5 Kafka Consumer Pattern

```typescript
// apps/backend/src/consumers/ewsConsumer.ts
import { kafka } from '@/config/kafka'
import { cmsService } from '@/services/cmsService'
import { logger } from '@/config/logger'

const consumer = kafka.consumer({ groupId: 'cms-automation-group' })

export async function startEWSConsumer() {
  await consumer.connect()
  await consumer.subscribe({ topic: 'ews.alert.high', fromBeginning: false })

  await consumer.run({
    eachMessage: async ({ message }) => {
      const event = JSON.parse(message.value!.toString())
      logger.info('EWS HIGH alert received', {
        module: 'CONSUMER', operation: 'ews-auto-case',
        alertId: event.payload.id, tenantId: event.tenantId,
      })

      try {
        await cmsService.autoCreateCase(event.payload, event.tenantId)
      } catch (err) {
        logger.error('Failed to auto-create CMS case', {
          alertId: event.payload.id, error: (err as Error).message
        })
        // Kafka will retry — do NOT commit offset on failure
        throw err
      }
    },
  })
}
```

---

# CHAPTER 17 — PUSH NOTIFICATIONS

## 17.1 Push Architecture

```
Event occurs (EWS HIGH alert)
  → Service publishes to Kafka: ews.alert.high
  → Notification Consumer receives event
  → Resolves target users (risk analysts, managers for that tenant)
  → For each user:
      → Fetch registered device tokens from user_devices table
      → Route to Azure Notification Hubs
      → Notification Hubs routes to:
          Android → FCM v1 (Firebase Cloud Messaging)
          iOS → APNs (Apple Push Notification service)
          Web → Web Push (VAPID)
  → Store notification in notifications table (for bell icon)
  → Emit Socket.io event to active browser sessions
```

## 17.2 Notification Types by Criticality

| Type | Channel | Urgency | Content |
|---|---|---|---|
| EWS HIGH alert | Push + Socket + Bell | Immediate | Customer ID, PD score, risk level |
| AML suspicious txn | Push + Socket + Bell | Immediate | Txn ID, amount, country, reason |
| Loan approved | Push + Email | Normal | Loan ID, amount, customer |
| Document expiring | Email + Bell | 30-day notice | Document type, expiry date |
| KYC rejected | Push + Bell | Same day | Document type, rejection reason |
| Collection payment received | Bell | End of day | Amount, customer, agent |
| Report ready | Email + Bell | Normal | Report type, download link |
| System maintenance | Email + Bell | 48h notice | Scheduled window details |

## 17.3 Device Registration

```typescript
// Frontend: register device on login
async function registerPushDevice(userId: string, token: string, platform: 'web' | 'android' | 'ios') {
  await apiClient.post('/notifications/register-device', {
    deviceToken: token,
    platform,
    deviceName: navigator.userAgent.substring(0, 100),
  })
}

// Backend: user_devices table
model UserDevice {
  id           String   @id @default(uuid())
  userId       String
  tenantId     String
  deviceToken  String   @unique
  platform     DevicePlatform  // WEB | ANDROID | IOS
  isActive     Boolean  @default(true)
  lastSeenAt   DateTime @default(now())
  createdAt    DateTime @default(now())
  @@index([userId, isActive])
}
```

## 17.4 Notification Delivery Guarantee

- At-least-once delivery via Kafka + consumer offset management
- Idempotency key on every notification (prevents duplicates on retry)
- Delivery receipt tracked in `notification_deliveries` table
- Undelivered notifications (device offline): TTL 24 hours for critical, 72 for normal
- In-app notification bell: always populated from DB (not dependent on push)

---

# CHAPTER 18 — RUM — REAL USER MONITORING

## 18.1 RUM Strategy

Real User Monitoring captures the actual experience of every user on every page, on every device, in every location. This is critical for a platform deployed in low-bandwidth markets across Asia and Africa.

**Tooling:** Azure Application Insights SDK + OpenTelemetry Web.

## 18.2 Core Web Vitals Tracking

```typescript
// src/utils/rum.ts — Web Vitals reporting
import { onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals'
import { appInsights } from '@/config/appInsights'

function reportVital(metric: Metric) {
  appInsights.trackMetric({
    name: metric.name,
    average: metric.value,
    properties: {
      page: window.location.pathname,
      module: deriveModuleFromPath(window.location.pathname),
      rating: metric.rating,  // 'good' | 'needs-improvement' | 'poor'
      tenantId: useAuthStore.getState().user?.tenantId,
    },
  })
}

onCLS(reportVital)    // Cumulative Layout Shift
onFID(reportVital)    // First Input Delay
onFCP(reportVital)    // First Contentful Paint
onLCP(reportVital)    // Largest Contentful Paint
onTTFB(reportVital)   // Time to First Byte
```

## 18.3 Custom Performance Marks

```typescript
// Track banking-specific performance metrics
performance.mark('loan-form-start')
// ... user fills form ...
performance.mark('loan-form-submit')
performance.measure('loan-form-time', 'loan-form-start', 'loan-form-submit')

appInsights.trackMetric({
  name: 'LoanFormCompletionTime',
  average: performance.getEntriesByName('loan-form-time')[0].duration,
  properties: { formType: 'HomeLoan', stepCount: 5 },
})
```

## 18.4 Error Tracking in RUM

```typescript
// Global error boundary reports to Application Insights
class GlobalErrorBoundary extends React.Component {
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    appInsights.trackException({
      exception: error,
      properties: {
        componentStack: info.componentStack,
        module: deriveModuleFromPath(window.location.pathname),
        userId: useAuthStore.getState().user?.id,
        tenantId: useAuthStore.getState().user?.tenantId,
      },
    })
  }
}

// Unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  appInsights.trackException({
    exception: new Error(event.reason),
    properties: { type: 'unhandledRejection' },
  })
})
```

## 18.5 Session Recording (Privacy-Aware)

- Session recording via Application Insights Session Replays
- PII masking: all input fields containing financial data masked before recording
- Consent: recording enabled only after explicit user consent (settings page)
- Data residency: session data stored in same Azure region as tenant's data
- Retention: 30 days maximum

## 18.6 RUM Dashboards

```
Dashboard: User Experience
  - Core Web Vitals by page/module (P75 threshold alerts)
  - API response time from browser perspective (vs server-side)
  - Error rate by module and user role
  - Page load time by geography (Asia, Africa breakdown)
  - Slow pages: top 10 pages by LCP

Dashboard: Availability
  - Synthetic monitors: login flow, LOS form, DMS upload
  - Availability percentage over 30 days
  - Apdex score per module
```

---

# CHAPTER 19 — CLICKSTREAM & USER BEHAVIOUR TRACKING

## 19.1 Clickstream Strategy

Clickstream data enables data-driven product decisions and identifies workflow inefficiencies in banking operations. For a banking platform, behaviour tracking is also a security input — unusual behaviour patterns can indicate compromised accounts.

**Privacy first:** No clickstream data is sold or shared. All data stored in tenant's Azure region. PII never included in event properties.

## 19.2 Event Schema

```typescript
// Every clickstream event follows this schema
interface ClickstreamEvent {
  eventId:      string        // UUID v4
  eventType:    ClickEventType
  timestamp:    string        // ISO 8601
  sessionId:    string        // Random UUID per browser session
  userId:       string        // Hashed user ID (not raw UUID)
  tenantId:     string        // Tenant identifier
  module:       string        // 'EWS' | 'AML' | 'DMS' | etc.
  page:         string        // Current URL path (no query params)
  componentId?: string        // React component name
  elementType?: string        // 'button' | 'link' | 'table-row' | 'form'
  elementLabel?: string       // Human-readable label (no PII)
  properties?:  Record<string, string | number | boolean>  // Event-specific
  deviceType:   'desktop' | 'tablet' | 'mobile'
  browserName:  string
  connectionType: string      // '4g' | '3g' | 'wifi' | 'offline'
}

type ClickEventType =
  | 'pageview'
  | 'module_open'
  | 'button_click'
  | 'table_row_click'
  | 'form_start'
  | 'form_step_complete'
  | 'form_submit'
  | 'form_abandon'
  | 'search_performed'
  | 'filter_applied'
  | 'export_triggered'
  | 'alert_dismissed'
  | 'document_viewed'
  | 'error_encountered'
  | 'feature_first_use'
```

## 19.3 React Tracking Implementation

```typescript
// src/utils/analytics.ts — Tracking SDK
class BankingAnalytics {
  private queue: ClickstreamEvent[] = []
  private flushInterval = 5000  // Flush every 5 seconds

  track(eventType: ClickEventType, properties?: Partial<ClickstreamEvent>) {
    const event: ClickstreamEvent = {
      eventId:    crypto.randomUUID(),
      eventType,
      timestamp:  new Date().toISOString(),
      sessionId:  this.getSessionId(),
      userId:     this.hashUserId(useAuthStore.getState().user?.id ?? ''),
      tenantId:   useAuthStore.getState().user?.tenantId ?? '',
      module:     deriveModule(window.location.pathname),
      page:       window.location.pathname,
      deviceType: this.getDeviceType(),
      browserName: this.getBrowserName(),
      connectionType: this.getConnectionType(),
      ...properties,
    }
    this.queue.push(event)
    if (this.queue.length >= 10) this.flush()  // Flush on 10 events
  }

  async flush() {
    if (this.queue.length === 0) return
    const batch = [...this.queue]
    this.queue = []
    // Send to Kafka via backend proxy (never directly to Kafka from browser)
    await fetch('/api/v1/analytics/events', {
      method: 'POST',
      body: JSON.stringify({ events: batch }),
      keepalive: true,  // Ensures flush on page unload
    })
  }
}

export const analytics = new BankingAnalytics()

// React hook for declarative tracking
export function useTrackPageView(module: string) {
  useEffect(() => {
    analytics.track('pageview', { module })
  }, [module])
}

export function useTrackClick(elementLabel: string, componentId?: string) {
  return useCallback(() => {
    analytics.track('button_click', { elementLabel, componentId })
  }, [elementLabel, componentId])
}
```

## 19.4 Form Behaviour Analytics

```typescript
// Track loan application funnel specifically
function LoanApplicationForm() {
  useEffect(() => {
    analytics.track('form_start', { componentId: 'LoanApplicationForm' })
    return () => {
      if (!submitted) analytics.track('form_abandon', {
        componentId: 'LoanApplicationForm',
        properties: { lastCompletedStep: currentStep },
      })
    }
  }, [])

  const handleStepComplete = (step: number) => {
    analytics.track('form_step_complete', {
      componentId: 'LoanApplicationForm',
      properties: { step, stepName: STEP_NAMES[step] },
    })
  }
}
```

## 19.5 Kafka Clickstream Pipeline

```
Browser → POST /api/v1/analytics/events (batched, max 100 events)
        → Express validates + publishes to Kafka: analytics.*
        → Clickstream Consumer reads
        → Transforms + writes to Azure Synapse Analytics (OLAP)
        → Power BI / Grafana dashboards consume Synapse
```

## 19.6 User Behaviour Dashboards

```
Dashboard: Product Usage
  - Module adoption: % of users who visited each module in last 30 days
  - Feature usage funnel: loan application steps drop-off analysis
  - Search query patterns (anonymised)
  - Most-used filter combinations in alert tables

Dashboard: Efficiency Metrics
  - Average time to complete loan application (by branch, by product)
  - Document upload-to-approval cycle time
  - AML case review time by analyst
  - Collection agent cases per day

Dashboard: Security Signals
  - Users with unusual access patterns (time-of-day anomaly)
  - Unusual bulk data export events
  - Failed action attempts by module
  - Geographic access anomalies (same user, different country within 1 hour)
```

---

# CHAPTER 20 — SCALING STRATEGY

## 20.1 Horizontal Scaling (Primary Strategy)

All services are stateless — session state in Redis, data in PostgreSQL. This enables unlimited horizontal scaling.

```
Scale trigger:     CPU > 70% for 3 minutes (HPA)
Scale-out:         +2 replicas per trigger
Scale-in:          CPU < 30% for 10 minutes
Min replicas:      2 (high availability, never scale to 1)
Max replicas:      20 per service

Per-service maximums:
  API pods:          20 replicas (handles 50K concurrent users)
  Worker pods:        10 replicas (OCR + report generation)
  Notification:       5 replicas (async, not latency-critical)
  Kafka consumers:    1 per partition (see Kafka scaling below)
```

## 20.2 Database Scaling

```
Phase 1 (current): Single primary + 1 read replica
  Reads:  DWH queries → read replica
  Writes: All transactional → primary
  Capacity: ~500 concurrent connections via PgBouncer

Phase 2 (10x scale): Add read replicas
  Reads: load-balanced across 3 read replicas
  Write primary: scale CPU/RAM vertically
  Capacity: ~2000 concurrent connections

Phase 3 (100x scale): Sharding by tenantId
  Tenant shards: tenant groups distributed across shard nodes
  Routing: application-level shard mapping (consistent hashing)
  Cross-tenant queries: Citus distributed tables for DWH schema
```

## 20.3 Kafka Scaling

```
Partitions per topic:    6 (allows 6 concurrent consumers)
Consumer group replicas: 1 per partition (auto-assigned by Kafka)
Scale trigger:           Consumer lag > 10,000 messages for 5 minutes
Scale action:            Add partitions + consumer replicas together
Maximum lag tolerance:   30 seconds for ews.alert.high
                         5 minutes for analytics.*
                         1 hour for audit.*
```

## 20.4 Cache Scaling

```
Redis cluster: 3 shards × 3 replicas (Azure Cache for Redis Premium)
Eviction policy: allkeys-lru (LRU eviction when full)
Memory alert: > 80% → add shard
Cache miss alert: miss rate > 40% → investigate cache key strategy
Hot key detection: Azure Redis insights + Prometheus redis_keyspace_hits_total
```

## 20.5 CDN & Frontend Scaling

```
Azure Front Door:
  - Global CDN: React SPA assets served from nearest edge (< 50ms)
  - Origin: Azure Static Web Apps (auto-scaled)
  - WAF: OWASP ruleset + custom banking rules
  - DDoS: Standard protection enabled
  - Compression: Brotli > gzip for all static assets

Cache control:
  index.html:        no-cache (always fresh for deploy updates)
  JS/CSS chunks:     1 year (content-hashed filenames)
  Images/fonts:      1 year (content-hashed)
```

## 20.6 Multi-Region Strategy

```
Active region:    Azure East Asia (Singapore)
Passive region:   Azure South India (Chennai)

Replication:
  PostgreSQL:     Async replication to DR region (< 5 min RPO)
  Redis:          Azure Cache geo-replication (active-passive)
  Blob storage:   GRS (Geo-Redundant Storage) — automatic failover
  Kafka:          Confluent Cloud geo-replication (MirrorMaker 2)

Failover:
  RTO: 4 hours (manual failover with runbook)
  Future: Azure Traffic Manager for < 5 min automated failover
```

---

# CHAPTER 21 — LONG-TERM SUPPORT (LTS)

## 21.1 LTS Policy

The platform follows a **2-year LTS cycle** for major versions. This means:
- Major version (v2.x): supported with security patches + critical fixes for 24 months
- Minor versions (v2.1, v2.2): released quarterly with new features
- Patch releases (v2.1.1): released as needed for security fixes

## 21.2 Dependency Management

```
Node.js:   LTS version only (currently 20 LTS, upgrade to 22 LTS by Q1 2026)
React:     LTS policy: upgrade within 12 months of new major release
TypeScript: Latest stable, upgrade within 3 months
Prisma:    Latest stable, tested before upgrade
Express:   v4.x LTS — migrate to v5 when stable

Automation:
  Renovate bot:   Weekly PRs for dependency updates
  Security:       Dependabot alerts → immediate patch PR
  Review cadence: Quarterly review of all major dependencies
```

## 21.3 Database LTS

```
PostgreSQL 16: LTS until November 2028
  Upgrade plan: Major version upgrade annually in staging, production annually
  Migration strategy: pg_upgrade with 48h maintenance window

Prisma schema versioning:
  Every migration is numbered sequentially and immutable
  Migration rollback: available for 30 days post-deployment
  Breaking schema changes require deprecation notice in release notes
```

## 21.4 API Versioning Strategy

```
Versioning format: /api/v{major}/
Current: /api/v1/

Version lifecycle:
  Active:     Receives new features + fixes
  Deprecated: 6 months notice before end-of-life
  Retired:    Returns HTTP 410 Gone + migration guide URL

Backward compatibility:
  New fields: always additive, never remove existing fields in active version
  Field removal: only in new major version with 6 months notice
  Breaking changes: require new version

Multiple version support: v1 + v2 can run concurrently for transition period
```

## 21.5 Module Deprecation Policy

```
Step 1: Announce deprecation in release notes + in-app notification
Step 2: In-API deprecation header: Deprecation: Sat, 01 Apr 2027 00:00:00 GMT
Step 3: 6-month transition period with migration guide
Step 4: End-of-life: feature removed in next major version
```

## 21.6 Data Retention & Archival

```
Active data (hot PostgreSQL):    2 years rolling
Archived data (cool Blob):       2–7 years (structured JSON export)
Regulatory minimum:              7 years (all transaction records)
Post-retention destruction:      Cryptographic erasure of encryption keys
                                 (renders data unreadable without physical deletion)

Tenant offboarding:
  Data export: provided in structured JSON + CSV format within 30 days
  Data deletion: confirmed cryptographic erasure + certificate within 60 days
  Audit logs: retained 7 years regardless of tenant status (regulatory)
```

## 21.7 Operational Run Book

Every module has a maintained run book covering:
- Deployment procedure + rollback procedure
- Common failure scenarios + remediation steps
- Escalation contacts (module owner, on-call, CTO)
- SLO definitions + alert thresholds
- Disaster recovery procedure specific to the module

---

# CHAPTER 22 — PCI DSS SECURITY

## 22.1 PCI DSS Scope

While the platform primarily handles loan and risk data (not card payment data), certain modules interact with payment systems and must be designed for PCI DSS Level 2 compliance to enable future payment features and card integration.

## 22.2 PCI DSS Requirements — Applied

### Requirement 1: Network Security Controls
```
✅ Azure VNET with NSG rules — deny all, allow specific ports
✅ Private endpoints for PostgreSQL, Redis, Blob (no public internet access)
✅ WAF (Azure Application Gateway) — inspects all ingress traffic
✅ Network segmentation: application subnet, data subnet, management subnet separated
✅ Egress filtering: services cannot initiate arbitrary outbound connections
```

### Requirement 2: Secure Configurations
```
✅ No default credentials anywhere
✅ All default accounts disabled (database, OS, Kubernetes)
✅ Minimal services running on each container (distroless base images where possible)
✅ Kubernetes Pod Security Standards enforced (restricted profile)
✅ Non-root container execution enforced
```

### Requirement 3: Data Protection
```
✅ Cardholder data: if stored, encrypted with AES-256
✅ Account numbers: masked to last 4 digits in all UI and logs
✅ Encryption at rest: Azure SSE with customer-managed keys (Azure Key Vault)
✅ Encryption in transit: TLS 1.2+ enforced, TLS 1.0/1.1 disabled
✅ Key management: Azure Key Vault, rotation every 12 months
✅ No sensitive data in logs (enforced by logger middleware)
```

### Requirement 4: Transmission Encryption
```
✅ TLS 1.2+ on all external connections
✅ HSTS with preload: max-age=31536000
✅ Certificate management: Azure-managed certificates, auto-renewal
✅ Internal service communication: mTLS via Istio service mesh
✅ Kafka: TLS + SASL authentication
```

### Requirement 5: Malware Protection
```
✅ Container image scanning: Trivy — blocks on HIGH/CRITICAL CVEs
✅ File upload scanning: Azure Defender for Storage (antivirus on all uploads)
✅ Dependency scanning: OWASP Dependency-Check in CI pipeline
✅ Node.js package audit: pnpm audit in CI — blocks on HIGH/CRITICAL
```

### Requirement 6: Secure Development
```
✅ Secure coding standards: this CLAUDE.md document
✅ Code review: all PRs reviewed before merge
✅ Static analysis: ESLint security plugin (eslint-plugin-security)
✅ SAST: Snyk Code scanning in CI
✅ Dependency management: Renovate bot + Dependabot
✅ Penetration testing: annual third-party pentest
```

### Requirement 7–8: Access Control
```
✅ Need-to-know: RBAC with minimum-privilege principle
✅ No shared accounts: every user has unique credentials
✅ MFA: enforced for all admin users and remote access
✅ Session management: 15-minute JWT expiry + activity timeout
✅ Privileged access: just-in-time (JIT) access for production database
✅ Access logs: every access event logged and retained 12 months
```

### Requirement 10: Logging & Monitoring
```
✅ All access to cardholder data environment: logged
✅ All admin actions: logged with user identity
✅ All authentication events: logged (success + failure)
✅ Log integrity: logs shipped to immutable Azure Monitor storage
✅ Log review: automated anomaly detection via Azure Sentinel
✅ Retention: 12 months accessible, 12 months archived
```

### Requirement 11: Security Testing
```
✅ Vulnerability scans: monthly automated (Qualys / Tenable)
✅ Penetration testing: annual (external qualified assessor)
✅ Intrusion detection: Azure Defender for Kubernetes + Azure Sentinel
✅ Network monitoring: Azure Network Watcher flow logs
```

---

# CHAPTER 23 — BANKING-GRADE SECURITY

## 23.1 Authentication Security

```typescript
// Argon2id for password hashing (recommended over bcrypt for new systems)
// If bcrypt: cost factor minimum 12
import argon2 from 'argon2'

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 2 ** 16,    // 64MB memory
  timeCost: 3,             // 3 iterations
  parallelism: 1,
}

async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, ARGON2_OPTIONS)
}

async function verifyPassword(hash: string, password: string): Promise<boolean> {
  return argon2.verify(hash, password)
}
```

## 23.2 JWT Security

```typescript
// JWT configuration
const JWT_CONFIG = {
  accessToken: {
    secret:     process.env.JWT_SECRET!,   // 256-bit minimum (64 hex chars)
    expiresIn:  '15m',
    algorithm:  'HS256' as const,
  },
  refreshToken: {
    secret:     process.env.JWT_REFRESH_SECRET!,  // Different secret
    expiresIn:  '7d',
    algorithm:  'HS256' as const,
  },
}

// Refresh token rotation + blacklisting
async function rotateRefreshToken(oldToken: string, userId: string): Promise<string> {
  // Check blacklist
  const isBlacklisted = await redis.get(`blacklist:refresh:${oldToken}`)
  if (isBlacklisted) {
    // Possible token theft — invalidate ALL sessions for user
    await invalidateAllUserSessions(userId)
    throw new AppError('UNAUTHORIZED', 'Token reuse detected — all sessions terminated', 401)
  }
  // Blacklist old token
  await redis.setex(`blacklist:refresh:${oldToken}`, 7 * 24 * 3600, '1')
  // Issue new token
  return issueRefreshToken(userId)
}
```

## 23.3 SQL Injection Prevention

```typescript
// Prisma ORM: parameterised queries by default — never write raw SQL with user input

// WRONG — SQL injection vulnerability
await prisma.$queryRawUnsafe(`SELECT * FROM loans WHERE customer_id = '${customerId}'`)

// CORRECT — parameterised via Prisma
await prisma.loan.findMany({ where: { customerId, tenantId } })

// CORRECT — parameterised raw query if absolutely necessary
await prisma.$queryRaw`SELECT * FROM loans WHERE customer_id = ${customerId} AND tenant_id = ${tenantId}`
```

## 23.4 XSS Prevention

```typescript
// Content Security Policy — no inline scripts
helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc:  ["'self'"],  // NO 'unsafe-inline', NO 'unsafe-eval'
    styleSrc:   ["'self'", "'unsafe-inline'"],  // Tailwind requires inline
    imgSrc:     ["'self'", 'data:', 'blob:', '*.azureedge.net'],
    connectSrc: ["'self'", '*.applicationinsights.azure.com'],
    fontSrc:    ["'self'", 'fonts.gstatic.com'],
    objectSrc:  ["'none'"],
    frameAncestors: ["'none'"],  // Prevents clickjacking
  },
})

// React: JSX auto-escapes all output — never use dangerouslySetInnerHTML
// If rich text needed: DOMPurify sanitisation before render
import DOMPurify from 'dompurify'
const clean = DOMPurify.sanitize(userInput)
```

## 23.5 CSRF Protection

```typescript
// For state-changing operations from browser (non-API clients)
// SameSite=Strict cookies prevent CSRF for JWT refresh cookie
// For API clients: JWT in Authorization header is inherently CSRF-resistant

// Refresh token cookie
res.cookie('refreshToken', token, {
  httpOnly: true,           // JS cannot access
  secure: true,             // HTTPS only
  sameSite: 'strict',       // No cross-site sending
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/api/v1/auth',     // Scoped to auth routes only
})
```

## 23.6 Data Encryption

```typescript
// Field-level encryption for highly sensitive data
// Using Node.js crypto with AES-256-GCM

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ENCRYPTION_KEY = Buffer.from(process.env.FIELD_ENCRYPTION_KEY!, 'hex')  // 32 bytes from Key Vault

function encryptField(plaintext: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${encrypted.toString('hex')}:${tag.toString('hex')}`
}

function decryptField(ciphertext: string): string {
  const [ivHex, encryptedHex, tagHex] = ciphertext.split(':')
  const decipher = createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, Buffer.from(ivHex, 'hex'))
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
  return decipher.update(Buffer.from(encryptedHex, 'hex')) + decipher.final('utf8')
}

// Applied to: account numbers, PAN numbers, Aadhaar numbers stored in DB
```

## 23.7 Fraud Detection Signals

Behavioural signals fed into the anomaly detection layer:

```
Account takeover signals:
  - Login from new IP + country within 24h of last login from different location
  - Password reset followed immediately by large transaction
  - Unusual access time (3 AM for user who always logs in 9–5)
  - Bulk data export by user who never exported before
  - Multiple failed approval attempts on high-value items

Data exfiltration signals:
  - Unusual number of document downloads in single session
  - Queries returning abnormally large result sets
  - Accessing data outside user's normal branch/region scope
  - API key used from new IP for service accounts

All signals: published to Kafka analytics topic → Azure Sentinel SIEM → alert on high-confidence
```

## 23.8 Security Incident Response

```
P0 — Active breach:           Isolate affected tenants (circuit breaker), 
                               invalidate all sessions, page CTO + Security team
P1 — Suspected compromise:    Force re-authentication for affected users, 
                               preserve audit logs, investigate within 1 hour
P2 — Vulnerability found:     Assess exploitability, patch within 48h for CRITICAL,
                               7 days for HIGH, next sprint for MEDIUM
P3 — Security misconfiguration: Remediate in next deployment cycle

Breach notification:
  Regulatory: within 72 hours (GDPR / local banking law)
  Tenants: within 24 hours of confirmed breach
  Users: within 72 hours if personal data compromised
```

---

# CHAPTER 24 — TECH STACK EXPECTATIONS & AUTONOMOUS DELIVERABLES

## 24.1 What Each Technology Delivers

### React 18 + TypeScript

**Expects from Claude:**
- Functional components with explicit TypeScript interfaces for every prop
- No class components
- Hooks for all stateful and side-effect logic
- `React.lazy()` + `Suspense` wrapping every page component
- `useCallback` on every function passed to child components
- `useMemo` on every expensive computation
- Loading + error states on every `useQuery` result
- `ErrorBoundary` wrapping every significant UI section

**Delivers:**
- Component files: `src/modules/{module}/{Module}Dashboard.tsx`
- Exact Tailwind class implementation from `UI_DESIGN_SPEC.md`
- Pixel-perfect match to Figma design `mnz58vWYsPKf7NUXCLLc8w`
- WCAG 2.1 AA accessible markup
- Mobile-responsive layout using Tailwind responsive prefixes

### Vite 5

**Expects from Claude:**
- Path alias `@/` configured and used consistently
- Shared package alias `@shared/` for monorepo types
- Environment variables accessed only via `import.meta.env.VITE_*`
- Dynamic imports via `React.lazy(() => import('@/modules/...'))`
- No direct Node.js API usage in frontend code

**Delivers:**
- `vite.config.ts` with aliases, PWA plugin, bundle analyser
- Production build with tree-shaking and code splitting
- Hot Module Replacement in development

### Zustand 4

**Expects from Claude:**
- One store per concern: `authStore`, `alertStore`, `tenantStore`
- Actions defined inside the store (not outside)
- Selectors used for all state reads (prevents over-rendering)
- Persist middleware only for auth state (localStorage, not PII)

**Delivers:**
- Global state slices for auth, alerts, tenant config
- No prop drilling beyond 2 levels anywhere

### React Query 5 (@tanstack/react-query)

**Expects from Claude:**
- `queryKey` factory pattern per module
- `refetchInterval: 30_000` on all live-data queries (EWS, AML)
- `staleTime` configured to reduce unnecessary re-fetches
- `useMutation` for all POST/PUT/DELETE with `onSuccess` cache invalidation
- `enabled: !!id` guard on detail queries

**Delivers:**
- Automatic background refresh for live banking alerts
- Optimistic updates for approval/rejection actions
- Automatic retry with exponential backoff
- Cache deduplication of identical requests

### React Hook Form + Zod

**Expects from Claude:**
- `zodResolver(schema)` on every `useForm()`
- Inline error messages: `{errors.fieldName?.message}`
- `register(fieldName)` spread on all inputs
- Form watch for conditional field visibility
- Auto-save draft logic on long forms (LOS, DMS)

**Delivers:**
- Zero-overhead form validation (no re-render on every keystroke)
- Shared validation schemas between FE and BE
- Consistent error message format across all forms

### Express.js 4 + TypeScript

**Expects from Claude:**
- `asyncHandler` wrapper on ALL async route handlers
- Middleware chain: `verifyJWT → checkRole → validateBody → handler`
- `AppError` thrown for all expected failures (never generic `Error`)
- `req.user` typed as `AuthenticatedUser` (never `any`)
- No `res.send()` — always `res.json()` with standard envelope

**Delivers:**
- Express route files: `apps/backend/src/routes/{module}.ts`
- Complete middleware chain per route
- HTTP error codes correctly mapped to AppError types

### Prisma 5

**Expects from Claude:**
- `tenantId` in EVERY `where` clause — no exceptions
- `select` on `findMany` — never fetch unbounded columns
- `$transaction` for any multi-table write
- `Decimal` type for all money fields — never `Float`
- `deletedAt: null` filter included in all non-archive queries

**Delivers:**
- Type-safe database access with zero raw SQL
- Auto-generated migration files
- Prisma Studio for visual database exploration in development

### BullMQ (Job Queues)

**Expects from Claude:**
- Separate queue per job type (OCR, email, report, credit score)
- Idempotency key on all jobs (prevent duplicates on retry)
- Job completion + failure events logged via Winston
- Dead letter queue handling: alert on > 10 failed jobs

**Delivers:**
- Async processing for OCR, reports, credit scoring
- Retry with exponential backoff
- Redis-backed job persistence

### Kafka (Confluent)

**Expects from Claude:**
- `tenantId:entityId` as Kafka message key (co-partitioning)
- Full event envelope: `{ eventId, eventType, timestamp, tenantId, payload }`
- Consumer group per logical consumer (not per service instance)
- Offset committed ONLY after successful processing
- Circuit breaker pattern: if consumer fails 3 times, pause + alert

**Delivers:**
- Decoupled event-driven processing
- EWS alerts trigger CMS cases automatically
- Payments trigger IFRS 9 recalculations
- All events ingested to DWH

### Azure Notification Hubs

**Expects from Claude:**
- Device token registration on login (stored in `user_devices` table)
- Notification published via Kafka consumer (not inline in request path)
- Idempotency key to prevent duplicate pushes
- Delivery tracking in `notification_deliveries` table

**Delivers:**
- Sub-5 second push delivery to Android (FCM) + iOS (APNs) + Web Push
- Single API for all device types

### Application Insights (RUM)

**Expects from Claude:**
- SDK initialised in `src/main.tsx` before any other code
- `trackPageView()` on every route change
- `trackEvent()` for all significant business actions
- `trackException()` in global error boundary + unhandled rejection handler
- All PII masked before tracking

**Delivers:**
- Core Web Vitals per page, per module, per geography
- User funnel analysis for LOS, DMS workflows
- Real error rates from real users (not synthetic monitoring)

### Clickstream Analytics

**Expects from Claude:**
- `analytics.track()` calls on all interactive elements
- Batch flush every 5 seconds (not per event)
- `keepalive: true` on final flush for page unload
- No PII in event properties — user IDs hashed

**Delivers:**
- Product usage heatmap by module
- Form abandonment analysis
- Security anomaly signals

---

## 24.2 Autonomous Deliverable Standards

When Claude operates autonomously (via Claude Code or VS Code extension), every task output MUST meet these standards:

### Code Deliverable Checklist

```
BEFORE generating any file:
  □ Check packages/shared/types/ for existing types
  □ Check packages/shared/zod-schemas/ for existing schemas
  □ Check if Prisma model already exists
  □ Check if route already registered in routes/index.ts

AFTER generating any file:
  □ Zero TypeScript compiler errors (strict mode)
  □ Zero ESLint errors
  □ No any types anywhere
  □ No console.log anywhere
  □ No magic numbers or hardcoded strings
  □ No hardcoded hex colour values (use tokens.ts)
  □ All routes have verifyJWT + checkRole
  □ All DB queries include tenantId
  □ All async functions have error handling
  □ Loading + error state in every React Query consumer
  □ File header comment present
  □ New env vars added to .env.example
```

### UI Deliverable Checklist

```
  □ All colors use design token values from tokens.ts
  □ All cards: bg-white border border-[#F1EFE8] rounded-xl
  □ All tables match DataTable component specification
  □ All risk labels use RiskBadge component
  □ All forms use React Hook Form + Zod resolver
  □ Mobile responsive (min 320px)
  □ Pixel-matches Figma: figma.com/design/mnz58vWYsPKf7NUXCLLc8w
  □ Loading skeleton shown while data fetches
  □ Error state shown when API fails
  □ Empty state shown when data is empty
```

### Test Deliverable Checklist

```
  □ Unit tests for all new service functions
  □ Integration test for all new API routes
  □ E2E test if this is a critical user flow
  □ All tests pass locally
  □ Coverage >= 80% across affected modules
```

### Security Deliverable Checklist

```
  □ No hardcoded secrets or API keys
  □ File upload validation present (if applicable)
  □ Rate limiting applied (if applicable)
  □ RBAC roles correctly assigned to all routes
  □ Tenant isolation verified in all DB queries
  □ Audit log entry for all sensitive operations
```

---

*Document Version: 2.0.0*
*Issued by: Chief Technology Officer & Head of Engineering*
*Company: Data Networks*
*Date: April 2026*
*Classification: Confidential — Engineering Leadership*

> **This document is the engineering constitution of the Data Networks Banking Platform.**
> **Every autonomous and supervised engineering action must be traceable to a requirement,**
> **principle, or rule defined in this document.**
> **Build with precision. Build with security. Build for scale. Build for the long term.**
