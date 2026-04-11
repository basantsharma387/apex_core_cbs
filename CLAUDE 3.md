# CLAUDE.md — Data Networks Enterprise Banking Platform
## Autonomous Development Master Document

> **Authority:** This document is issued by the Chief Technology Officer and Head of Engineering.
> It is the single source of truth for all autonomous development by Claude.
> Every file generated, every decision made, every line of code written MUST comply with this document.
> No exceptions. No shortcuts. No approximations.

---

## PART 0 — HOW TO READ THIS DOCUMENT

This document governs all autonomous development work. Before writing a single line of code:

1. Read PART 1 — understand the project completely
2. Read PART 2 — understand the architecture decisions
3. Read PART 3 — memorise the engineering principles
4. Read PART 4 — enforce all quality rules
5. Read PART 5 — follow the exact development workflow
6. Read PART 6 — generate code using the correct patterns
7. Read PART 7 — apply all module specifications
8. Read PART 8 — meet all non-functional requirements

**When in doubt: choose the more defensive, more typed, more tested option. Always.**

---

## PART 1 — PROJECT OVERVIEW & CONTEXT

### 1.1 Company

**Data Networks** — Enterprise software solutions for Banking and Financial Services.
Present in: India, Sri Lanka, Kenya, Cambodia, Bhutan.
Mission: Drive digital transformation for banks, credit unions, and financial institutions.

### 1.2 Product

**Enterprise Banking Platform v2.0**
A full-stack, multi-tenant, AI-powered banking operations platform covering:
- Core Banking integration (CBS)
- Loan lifecycle management (LOS + LMS)
- Regulatory compliance (AML, IFRS 9)
- Risk management (EWS, Rating, ALM)
- Document management (DMS with OCR)
- Collection management (CMS with field agents)
- Data warehouse and BI reporting

### 1.3 Design Source

- **Figma file:** `mnz58vWYsPKf7NUXCLLc8w`
- **URL:** https://www.figma.com/design/mnz58vWYsPKf7NUXCLLc8w
- **Design System:** `CLAUDE.md` + `UI_DESIGN_SPEC.md` in repo root
- All UI MUST match the Figma design pixel-for-pixel using the token system defined

### 1.4 Tech Stack — Non-Negotiable

| Layer | Technology | Version |
|---|---|---|
| UI Framework | React | 18.x |
| Language | TypeScript | 5.x strict |
| Build tool | Vite | 5.x |
| Styling | Tailwind CSS | 3.x |
| Components | Shadcn/ui | latest |
| State (global) | Zustand | 4.x |
| State (server) | React Query | 5.x |
| Forms | React Hook Form + Zod | latest |
| HTTP client | Axios | latest |
| Charts | Recharts | 2.x |
| Icons | Lucide React | latest |
| Backend | Express.js + TypeScript | 4.x |
| ORM | Prisma | 5.x |
| Validation | Zod (shared FE + BE) | 3.x |
| Auth | jsonwebtoken (JWT) | latest |
| Cache | ioredis | latest |
| Testing FE | Vitest + React Testing Library | latest |
| Testing BE | Jest + Supertest | latest |
| E2E | Playwright | latest |
| Logger | Winston (BE) | latest |

### 1.5 Stakeholders & User Roles

| Role | Access Level | Primary Screens |
|---|---|---|
| Branch Officer | Read + Submit | DMS upload, LOS intake |
| Credit Analyst | Read + Assess | LOS, Rating, EWS |
| Risk Analyst | Read + Action | EWS, AML, IFRS 9 |
| Compliance Officer | Full compliance | AML, STR/CTR |
| Collection Agent | Mobile PWA | CMS field app |
| Collection Manager | Manage + Report | CMS dashboard |
| Finance Manager | Read + Report | IFRS 9, ALM, DWH |
| Branch Manager | Read + Approve | DMS maker-checker |
| Admin | Full platform | All modules + Settings |
| Super Admin | Multi-tenant | All orgs + System config |

---

## PART 2 — ARCHITECTURE DECISIONS

### 2.1 Frontend Architecture

**Decision:** React 18 SPA with code-split lazy-loaded modules.
Each banking module loads independently. Users only download what they need.

**Rules Claude MUST follow:**
- Every module directory has its own lazy-loaded route using `React.lazy()` + `Suspense`
- Never import a module's component directly from another module — go through the router
- Global state ONLY in Zustand stores — never prop drill more than 2 levels
- Server state ONLY in React Query — never store API data in Zustand

```typescript
// CORRECT — lazy loaded module
const EWSDashboard = React.lazy(() => import('@/modules/ews/EWSDashboard'))

// WRONG — direct import across modules (NEVER DO THIS)
import EWSDashboard from '../ews/EWSDashboard'
```

### 2.2 Backend Architecture

**Decision:** Express.js modular monolith with domain-separated routers, deployable as microservices.

Each module = Router (HTTP only) → Service (business logic only) → Repository (data only)

**Rules:**
- Routers contain ONLY: middleware chain + request/response handling
- Services contain ONLY: business logic — NO HTTP concepts (no req/res)
- Repositories contain ONLY: database queries via Prisma
- No business logic in routes. No database calls in routes. Ever.

### 2.3 Data Architecture

- PostgreSQL 16: primary ACID-compliant store for all financial data
- Redis 7: cache layer for aggregated metrics (5 min TTL max for sensitive data)
- Elasticsearch 8: full-text search for DMS documents
- Never cache customer PII in Redis — cache only aggregated metrics

### 2.4 Authentication Architecture

- Access token: JWT, 15 min expiry, in `Authorization: Bearer` header
- Refresh token: JWT, 7 day expiry, httpOnly cookie, `/auth/refresh` only
- Token rotation on every refresh call
- Blacklist invalidated tokens in Redis on logout
- NEVER store tokens in localStorage — security violation

### 2.5 Multi-Tenancy

- Row-level tenancy: `tenantId` column on EVERY database table
- Middleware `enforceTenant` runs on every authenticated route
- Every Prisma query MUST include `where: { tenantId: req.user.tenantId }`
- Tenant isolation failure = P0 security incident, automatic alert

---

## PART 3 — ENGINEERING PRINCIPLES (ALL NON-NEGOTIABLE)

### PRINCIPLE 1: TypeScript Strictness

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

If TypeScript accepts it but it feels unsafe — it IS unsafe. Add runtime Zod validation.

### PRINCIPLE 2: Single Source of Truth

- Types: ONCE in `packages/shared/types/` — imported everywhere
- Zod schemas: ONCE in `packages/shared/zod-schemas/` — used on both FE (form validation) and BE (request validation)
- Constants/enums: ONCE in `packages/shared/constants/`
- Design tokens: ONCE in `src/styles/tokens.ts` — never hardcode hex values

### PRINCIPLE 3: Explicit Over Implicit

```typescript
// WRONG
const processLoan = (data) => {
  db.save(data)
  return data.id
}

// CORRECT
async function processLoanApplication(
  input: CreateLoanInput,
  ctx: RequestContext
): Promise<Result<LoanApplicationResponse, LoanError>> {
  const saved = await loanRepository.create(input, ctx.tenantId)
  logger.info('Loan application created', { loanId: saved.id, tenantId: ctx.tenantId })
  return ok(toLoanApplicationResponse(saved))
}
```

### PRINCIPLE 4: Fail Fast, Fail Loudly

- Validate ALL inputs at the HTTP boundary before any business logic
- Throw specific, typed errors — never generic `new Error('something went wrong')`
- Never swallow exceptions with empty catch blocks
- Log every error with full context (requestId, userId, tenantId, module, operation)

### PRINCIPLE 5: Zero Trust Security

- Every route is authenticated unless explicitly marked public
- Every authenticated route checks RBAC role
- Every database query includes tenantId filter
- Every file upload validates type, size, and content
- Every external API call has timeout and retry limits

### PRINCIPLE 6: Observability First

- Every function calling external services logs at entry and exit
- Every error includes: requestId, userId, tenantId, module, operation, error, stack
- Every operation >200ms logs a warning with duration
- Every background job logs: start, milestones, completion

### PRINCIPLE 7: SOLID Applied

**Single Responsibility:**
Each service, component, and hook does exactly one thing.
- `LoanService` — loan business logic only
- `NotificationService` — all notifications
- `StorageService` — all file operations
- `CreditScoringService` — credit model only

**Open/Closed:**
Adding new collection strategies, report formats, or notification channels never modifies existing code. Use strategy/plugin patterns.

**Liskov Substitution:**
All repository implementations must satisfy their interface. All notification providers (email/SMS/push) must be substitutable.

**Interface Segregation:**
Split fat interfaces into focused ones. `UserAuthRepository` has only `findByEmail`. `UserProfileRepository` has only profile methods.

**Dependency Inversion:**
Services depend on interfaces, not implementations. All external dependencies injected — enables testing without real infrastructure.

---

## PART 4 — QUALITY RULES (ALL ENFORCED IN CI)

### Q1: No `any` Type

```typescript
// FORBIDDEN
const data: any = response.body
function process(input: any): any {}
(error as any).message

// CORRECT
const data: unknown = response.body
if (isApiResponse(data)) { data.body }
const error = err instanceof AppError ? err : new AppError('DATABASE_ERROR', String(err))
```

### Q2: No Non-null Assertions Without Guard

```typescript
// FORBIDDEN
const name = user!.name
const loan = loans[0]!

// CORRECT
const name = user?.name ?? 'Unknown'
const loan = loans[0]
if (!loan) throw new AppError('NOT_FOUND', 'No loans found', 404)
```

### Q3: No Magic Numbers or Strings

```typescript
// FORBIDDEN
if (dpd > 30) { }
if (status === 'ACTIVE') { }
const ttl = 300

// CORRECT
import { DPD_THRESHOLDS, LoanStatus, CACHE_TTL } from '@shared/constants'
if (dpd > DPD_THRESHOLDS.STAGE_2) { }
if (status === LoanStatus.ACTIVE) { }
const ttl = CACHE_TTL.SHORT_SENSITIVE
```

### Q4: No Console Logs — Use Winston

```typescript
// FORBIDDEN anywhere
console.log('User logged in', user)
console.error('Error:', err)

// CORRECT
logger.info('User authenticated', { userId: user.id, tenantId: user.tenantId, requestId })
logger.error('Authentication failed', { email, error: err.message, requestId })
```

### Q5: Exhaustive Switch on Union Types

```typescript
function getRiskColor(level: RiskLevel): string {
  switch (level) {
    case 'HIGH':   return '#E24B4A'
    case 'MEDIUM': return '#EF9F27'
    case 'LOW':    return '#1D9E75'
    default:
      const _exhaustive: never = level
      throw new Error(`Unhandled risk level: ${_exhaustive}`)
  }
}
```

### Q6: Result Pattern for Expected Failures

```typescript
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E }

async function calculateCreditScore(customerId: string): Promise<Result<CreditScore, CreditError>> {
  try {
    const score = await bureauApi.getScore(customerId)
    return { ok: true, value: score }
  } catch (err) {
    if (err instanceof BureauTimeoutError) {
      return { ok: false, error: { code: 'BUREAU_TIMEOUT', retryAfter: 30 } }
    }
    return { ok: false, error: { code: 'BUREAU_UNAVAILABLE' } }
  }
}
```

### Q7: File Size Limits

```
Component file:   max 200 lines — split if larger
Custom hook:      max 100 lines — split if larger
Service file:     max 300 lines — split by domain if larger
Route file:       max 150 lines — split by resource if larger
Test file:        max 400 lines — split by scenario if larger
```

### Q8: Import Order (enforced by ESLint)

```typescript
// 1. Node built-ins
import path from 'path'

// 2. External packages
import { Router } from 'express'
import { z } from 'zod'

// 3. Internal shared packages
import type { EWSAlert } from '@shared/types'
import { evaluateSchema } from '@shared/zod-schemas'

// 4. Internal app imports (absolute @/ alias)
import { verifyJWT } from '@/middleware/auth'

// 5. Relative imports
import { EWSAlertTable } from './components/EWSAlertTable'
```

---

## PART 5 — TESTING RULES

### Coverage Requirements (enforced in CI — hard block on merge)

```
Unit tests:        minimum 80% coverage across all modules
Integration tests: minimum 70% coverage for all Express routes
E2E tests:         100% coverage for critical user flows
```

### Critical User Flows — 100% E2E Coverage Required

1. User login → JWT issued → protected route access
2. LOS: Create application → credit score → approval → disbursement notification
3. DMS: Upload document → OCR → maker-checker approval
4. EWS: Trigger evaluation → HIGH alert → auto CMS case creation
5. AML: Monitor transaction → flag → STR generated → filed
6. CMS: Case assigned → agent action logged → payment recorded

### Test Structure

```
src/modules/ews/
  __tests__/
    unit/
      ewsService.test.ts        # Service layer, mock all repositories
    integration/
      ewsRoutes.test.ts         # Full HTTP, real test DB schema
    e2e/
      ewsWorkflow.spec.ts       # Playwright end-to-end
```

### Test Writing Rules

```typescript
// Rule: Test behaviour, not implementation
// Rule: One assertion per test (where practical)
// Rule: Test name: "should [do X] when [condition Y]"
// Rule: No shared mutable state between tests
// Rule: Reset DB in beforeEach for integration tests

describe('EWSService.evaluate', () => {
  describe('when DPD > 30 AND balanceDrop > 20%', () => {
    it('should return HIGH risk level', async () => {
      const result = await ewsService.evaluate(
        { customerId: 'C001', dpd: 45, balanceDrop: 35 },
        mockUser
      )
      expect(result.riskLevel).toBe('HIGH')
    })

    it('should create an EWS alert in the database', async () => {
      await ewsService.evaluate({ customerId: 'C001', dpd: 45, balanceDrop: 35 }, mockUser)
      const alert = await alertRepo.findByCustomer('C001', TEST_TENANT_ID)
      expect(alert).not.toBeNull()
    })

    it('should auto-create a CMS collection case', async () => {
      await ewsService.evaluate({ customerId: 'C001', dpd: 45, balanceDrop: 35 }, mockUser)
      const cases = await cmsRepo.findByCustomer('C001', TEST_TENANT_ID)
      expect(cases).toHaveLength(1)
      expect(cases[0]?.status).toBe('OPEN')
    })
  })
})
```

---

## PART 6 — SECURITY RULES

### SEC-1: Input Validation

- ALL request bodies validated with Zod schemas before any business logic
- ALL file uploads: type whitelist (PDF, JPG, PNG, XLSX only), 10MB size limit, content-type verification
- ALL database queries use Prisma parameterised queries — zero raw SQL with user input
- ALL external IDs validated as UUID format before database lookup

### SEC-2: Route Authorization

```typescript
// Every route has explicit middleware chain
router.post('/evaluate',   verifyJWT, checkRole(['RISK_ANALYST']), validateBody(schema), handler)
router.get('/metrics',     verifyJWT, checkRole(['RISK_ANALYST', 'MANAGER', 'ADMIN']), handler)
router.delete('/:id',      verifyJWT, checkRole(['ADMIN']), handler)
router.get('/health',      /* intentionally public */ handler)

// checkRole always verifies BOTH role AND tenant
function checkRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError('FORBIDDEN', 'Insufficient permissions', 403, {
        required: allowedRoles,
        actual: req.user.role,
        userId: req.user.id,
      })
    }
    next()
  }
}
```

### SEC-3: Data Exposure Prevention

- NEVER return password hashes in any API response
- NEVER return full bank account numbers — mask to last 4 digits
- NEVER return JWT secrets or infrastructure details in error messages
- NEVER log PII (Aadhaar, PAN, account numbers) — log customer IDs only

### SEC-4: Rate Limiting

```typescript
// Public routes (login, forgot password)
rateLimit({ windowMs: 15 * 60 * 1000, max: 10 })    // 10/15min

// Authenticated API routes
rateLimit({ windowMs: 60 * 1000, max: 200 })          // 200/min

// File upload
rateLimit({ windowMs: 60 * 60 * 1000, max: 50 })      // 50/hour

// OCR / AI routes (expensive)
rateLimit({ windowMs: 60 * 1000, max: 20 })            // 20/min
```

### SEC-5: HTTP Security Headers (via Helmet.js)

```typescript
helmet({
  contentSecurityPolicy: {
    directives: { defaultSrc: ["'self'"], scriptSrc: ["'self'"] }
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  noSniff: true,
  frameguard: { action: 'deny' },
})
```

---

## PART 7 — PERFORMANCE RULES

### PERF-1: Database Query Rules

```typescript
// RULE 1: Select only needed columns
await prisma.loan.findMany({
  select: { id: true, status: true, dpd: true }  // CORRECT
})
await prisma.loan.findMany()  // WRONG — fetches all columns

// RULE 2: Always paginate
const loans = await prisma.loan.findMany({
  where: { tenantId, status: 'ACTIVE' },
  take: limit,
  skip: (page - 1) * limit,
  orderBy: { createdAt: 'desc' },
})

// RULE 3: Use DB-level aggregations
const stats = await prisma.loan.aggregate({
  _count: { id: true },
  _avg: { dpd: true },
  where: { tenantId, status: 'NPA' },
})

// RULE 4: Use transactions for multi-step operations
await prisma.$transaction([
  prisma.loan.update({ where: { id }, data: { stage: 2 } }),
  prisma.ewsAlert.create({ data: alertData }),
  prisma.auditLog.create({ data: auditData }),
])
```

### PERF-2: Caching Rules

```typescript
// Cache key MUST include tenantId to prevent cross-tenant leaks
const cacheKey = `ews:metrics:${tenantId}`
const cached = await redis.get(cacheKey)
if (cached) return JSON.parse(cached) as EWSMetrics

const data = await ewsRepository.getMetrics(tenantId)
await redis.setex(cacheKey, CACHE_TTL.METRICS_5MIN, JSON.stringify(data))
return data
```

### PERF-3: React Performance

```typescript
// Memoize expensive computations
const sorted = useMemo(
  () => alerts.filter(a => a.riskLevel === filter).sort(byPDScore),
  [alerts, filter]
)

// Memoize callbacks to children
const handleApprove = useCallback(
  async (id: string) => approveMutation.mutateAsync(id),
  [approveMutation]
)

// Virtualize lists > 50 rows
// Use @tanstack/react-virtual for DWH tables

// Named imports only — never import entire libraries
import { format } from 'date-fns'    // CORRECT
import dateFns from 'date-fns'        // WRONG
```

### PERF-4: API Response SLA

| Endpoint type | SLA p95 |
|---|---|
| Standard API | < 300ms |
| DWH query | < 2000ms |
| OCR processing | Async, job queue |
| Report generation | Async, return job ID |

---

## PART 8 — LOGGING RULES

### Structured Log Format

```typescript
interface LogEntry {
  timestamp: string         // ISO 8601
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  requestId: string         // UUID, from header or generated
  tenantId: string
  userId?: string
  module: string            // 'EWS' | 'AML' | 'DMS' etc.
  operation: string         // 'evaluate' | 'upload' | 'approve'
  durationMs?: number
  error?: { code: string; message: string; stack?: string }
}
```

### What to Log

```typescript
// INFO: Every significant business event
logger.info('Loan application submitted', { loanId, customerId, amount, tenantId })
logger.info('EWS alert created', { alertId, riskLevel, pdScore, tenantId })

// WARN: Unexpected but recoverable
logger.warn('Bureau API slow', { durationMs: 4500, customerId, requestId })

// ERROR: All failures
logger.error('Prisma transaction failed', { operation, loanId, error: err.message, requestId })

// DEBUG: Development troubleshooting only
logger.debug('Cache miss', { cacheKey, module: 'EWS' })
```

---

## PART 9 — GIT & COMMIT RULES

### Branch Naming

```
feature/[module]-[description]     feature/ews-alert-dashboard
fix/[module]-[description]         fix/aml-false-positive-rate
chore/[description]                chore/upgrade-prisma-v6
security/[description]             security/jwt-secret-rotation
test/[module]-[description]        test/los-e2e-approval-flow
```

### Commit Messages (Conventional Commits — enforced by commitlint)

```
feat(ews): add React Query 30s polling for live alert feed
fix(dms): resolve OCR confidence score rounding error
security(auth): rotate JWT secret and blacklist active sessions
perf(dwh): add Redis cache for EWS metrics (5min TTL)
test(los): add Playwright E2E for full loan approval workflow
chore(deps): upgrade Prisma to v6.0.0
docs(api): add Swagger spec for AML monitor endpoint
```

### PR Rules

- All CI checks must pass — no exceptions
- PR description: What changed, Why, How to test, UI screenshots
- No force push to `main` or `develop`
- Squash merge to keep history clean

---

## PART 10 — DEVELOPMENT WORKFLOW (Follow This Order Every Time)

### Before Writing Any Code — Checklist

```
[ ] Read this CLAUDE.md fully
[ ] Check if shared types exist in packages/shared/types/
[ ] Check if Zod schemas exist in packages/shared/zod-schemas/
[ ] Check if Prisma models exist for required entities
[ ] Check if the route already exists in any router file
[ ] Identify all dependencies needed
[ ] Plan file structure before writing
```

### File Generation Order (ALWAYS follow for each module)

```
1.  packages/shared/types/[module].ts           TypeScript interfaces
2.  packages/shared/zod-schemas/[module].ts     Zod validation schemas
3.  packages/shared/constants/[module].ts       Enums and constants
4.  apps/backend/src/prisma/schema.prisma       Add/update Prisma models
5.  npx prisma migrate dev --name [desc]        Apply migration
6.  apps/backend/src/repositories/[module].ts  Database layer
7.  apps/backend/src/services/[module].ts       Business logic
8.  apps/backend/src/routes/[module].ts         Express router
9.  apps/backend/src/routes/index.ts            Register router
10. apps/frontend/src/modules/[module]/         React module folder
      hooks/use[Module].ts                        React Query hooks
      components/                                 Module components
      [Module]Dashboard.tsx                       Page component
11. apps/frontend/src/router/AppRouter.tsx      Add lazy route
12. __tests__/unit/[module]Service.test.ts      Unit tests
13. __tests__/integration/[module]Routes.test.ts Route tests
```

---

## PART 11 — CODE TEMPLATES

### Template: Shared Types

```typescript
// packages/shared/types/[module].ts

export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW'

export interface [Entity] {
  readonly id: string
  readonly tenantId: string
  // ...domain fields
  readonly createdAt: string   // ISO 8601
  readonly updatedAt: string
}

export interface Create[Entity]Input {
  // Required creation fields (no id/tenantId/timestamps — server-generated)
}

export interface [Entity]ListResponse {
  items: [Entity][]
  total: number
  page: number
  limit: number
  hasNext: boolean
}
```

### Template: Zod Schema

```typescript
// packages/shared/zod-schemas/[module].ts
import { z } from 'zod'

export const create[Entity]Schema = z.object({
  customerId: z.string().uuid('Invalid customer ID format'),
  amount:     z.number().positive('Amount must be positive').max(100_000_000),
}).strict()  // Reject extra fields — always use strict()

export const [entity]QuerySchema = z.object({
  page:      z.coerce.number().int().positive().default(1),
  limit:     z.coerce.number().int().min(1).max(100).default(20),
  riskLevel: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
  fromDate:  z.string().datetime().optional(),
})

export type Create[Entity]Input = z.infer<typeof create[Entity]Schema>
export type [Entity]QueryInput  = z.infer<typeof [entity]QuerySchema>
```

### Template: Prisma Model

```prisma
model [Entity] {
  id         String      @id @default(uuid())
  tenantId   String                              // MANDATORY
  //
  // Domain fields — use Decimal for money, NEVER Float
  amount     Decimal     @db.Decimal(18, 2)
  status     [Entity]Status @default(ACTIVE)
  //
  // Audit fields
  createdBy  String
  updatedBy  String?
  deletedAt  DateTime?                           // Soft delete
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt

  @@index([tenantId])
  @@index([tenantId, status])
  @@map("[entities]")
}
```

### Template: Repository

```typescript
// apps/backend/src/repositories/[module]Repository.ts
import { prisma } from '@/config/prisma'
import type { Create[Entity]Input } from '@shared/types'

export const [module]Repository = {
  async findById(id: string, tenantId: string) {
    return prisma.[entity].findFirst({
      where: { id, tenantId },   // tenantId ALWAYS required
    })
  },

  async findMany(params: { tenantId: string; page: number; limit: number }) {
    const { tenantId, page, limit } = params
    const [items, total] = await prisma.$transaction([
      prisma.[entity].findMany({
        where: { tenantId, deletedAt: null },
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.[entity].count({ where: { tenantId, deletedAt: null } }),
    ])
    return { items, total, page, limit, hasNext: total > page * limit }
  },

  async create(data: Create[Entity]Input & { tenantId: string; createdBy: string }) {
    return prisma.[entity].create({ data })
  },
}
```

### Template: Service

```typescript
// apps/backend/src/services/[module]Service.ts
import { [module]Repository } from '@/repositories/[module]Repository'
import { AppError, ErrorCode } from '@/middleware/errorHandler'
import { logger } from '@/config/logger'
import type { AuthenticatedUser } from '@/types/auth'
import type { Create[Entity]Input } from '@shared/types'

export const [module]Service = {
  async getById(id: string, user: AuthenticatedUser) {
    const item = await [module]Repository.findById(id, user.tenantId)
    if (!item) {
      throw new AppError(ErrorCode.NOT_FOUND, `[Entity] ${id} not found`, 404)
    }
    return item
  },

  async create(input: Create[Entity]Input, user: AuthenticatedUser) {
    logger.info('[Entity] creation started', {
      module: '[MODULE]',
      operation: 'create',
      userId: user.id,
      tenantId: user.tenantId,
    })

    const result = await [module]Repository.create({
      ...input,
      tenantId:  user.tenantId,
      createdBy: user.id,
    })

    logger.info('[Entity] created', {
      module: '[MODULE]',
      operation: 'create',
      [entity]Id: result.id,
      tenantId: user.tenantId,
    })

    return result
  },
}
```

### Template: Express Router

```typescript
// apps/backend/src/routes/[module].ts
import { Router } from 'express'
import { verifyJWT } from '@/middleware/auth'
import { checkRole } from '@/middleware/rbac'
import { validateBody, validateQuery } from '@/middleware/validate'
import { asyncHandler } from '@/middleware/asyncHandler'
import { success, paginated } from '@/utils/response'
import { [module]Service } from '@/services/[module]Service'
import { create[Entity]Schema, [entity]QuerySchema } from '@shared/zod-schemas'

const router = Router()

router.get('/',
  verifyJWT,
  checkRole(['ANALYST', 'MANAGER', 'ADMIN']),
  validateQuery([entity]QuerySchema),
  asyncHandler(async (req, res) => {
    const result = await [module]Service.findMany(req.query, req.user)
    res.json(paginated(result))
  })
)

router.post('/',
  verifyJWT,
  checkRole(['ANALYST', 'ADMIN']),
  validateBody(create[Entity]Schema),
  asyncHandler(async (req, res) => {
    const item = await [module]Service.create(req.body, req.user)
    res.status(201).json(success(item))
  })
)

export default router
```

### Template: React Query Hook

```typescript
// src/modules/[module]/hooks/use[Module].ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import type { [Entity], Create[Entity]Input, [Entity]ListResponse } from '@shared/types'

const QUERY_KEY = {
  all:    ['[module]'] as const,
  list:   (p: Record<string, unknown>) => ['[module]', 'list', p] as const,
  detail: (id: string) => ['[module]', 'detail', id] as const,
}

export function use[Entity]List(params: { page?: number; limit?: number } = {}) {
  return useQuery<[Entity]ListResponse>({
    queryKey: QUERY_KEY.list(params),
    queryFn:  () => apiClient.get('/[module]', { params }),
    staleTime: 30_000,
    // Add refetchInterval: 30_000 for live modules (EWS, AML)
  })
}

export function useCreate[Entity]() {
  const queryClient = useQueryClient()
  return useMutation<[Entity], Error, Create[Entity]Input>({
    mutationFn: (data) => apiClient.post('/[module]', data),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: QUERY_KEY.all }),
  })
}
```

### Template: React Page Component

```typescript
// src/modules/[module]/[Module]Dashboard.tsx
import { useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { MetricCard } from '@/components/ui/MetricCard'
import { DataTable } from '@/components/ui/DataTable'
import { SectionCard } from '@/components/ui/SectionCard'
import { RiskBadge } from '@/components/ui/RiskBadge'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { use[Entity]List } from './hooks/use[Module]'
import type { Column } from '@/components/ui/DataTable'
import type { [Entity] } from '@shared/types'

const columns: Column<[Entity]>[] = [
  { key: 'id', header: 'ID', width: 140 },
  // ...define columns
]

export default function [Module]Dashboard() {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError } = use[Entity]List({ page, limit: 20 })

  return (
    <AppLayout title="[Screen Title]" module="[Module Label]">
      <PageHeader
        title="[Page heading]"
        subtitle="[Subtitle with API endpoint for dev reference]"
      />

      <div className="grid grid-cols-5 gap-3 mb-5">
        {/* MetricCard components with exact variants from UI_DESIGN_SPEC.md */}
      </div>

      <SectionCard title="[Section title]" subtitle="[API route]">
        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState message="Failed to load [module] data" />
        ) : (
          <DataTable
            columns={columns}
            data={data?.items ?? []}
            onRowClick={(row) => navigate(`/[module]/${row.id}`)}
          />
        )}
      </SectionCard>
    </AppLayout>
  )
}
```

---

## PART 12 — MODULE SPECIFICATIONS

### AUTH — `/api/v1/auth`

```
POST /login             → email + password → access_token + refresh cookie
POST /refresh           → refresh cookie → new access_token (rotation)
POST /logout            → blacklist token in Redis
POST /forgot-password   → send reset email (rate limited: 3/hour)
POST /reset-password    → validate token + bcrypt update

Security rules:
  - Password: bcrypt cost 12
  - Failed login lock: 5 attempts → 30 min lockout
  - Single session per user+device (invalidate old on new login)
  - All login attempts audited (success and failure)
```

### EWS — `/api/v1/ews`

```
POST /evaluate                       → risk assessment with PD score
GET  /alerts?riskLevel&page&limit    → paginated alert list
GET  /alerts/:id                     → full alert + customer risk breakdown
POST /alerts/:id/action              → assign/watchlist/dismiss
GET  /metrics                        → dashboard KPIs (Redis cache 5min)

React screen: /ews — EWSDashboard
  - 5 metric cards (Total/High/PD Score/Cases/Resolved)
  - Alert table with React Query refetchInterval: 30_000
  - Customer risk profile panel (right side)
  - Scenario simulation panel

Risk thresholds:
  HIGH:   PD > 0.7 OR (DPD > 30 AND balanceDrop > 20%)
  MEDIUM: PD > 0.4 OR (DPD > 15 AND balanceDrop > 10%)
  LOW:    below MEDIUM

Business rules:
  - React Query polling: 30 second interval
  - HIGH alert → auto-create CMS collection case
  - Alert resolution: record action + outcome mandatory
```

### AML — `/api/v1/aml`

```
POST /monitor             → transaction assessment (rule engine + ML)
GET  /alerts              → suspicious transaction list
POST /alerts/:id/case     → create AML case
POST /cases/:id/report    → generate STR or CTR
GET  /reports             → filed reports history

React screen: /aml — AMLDashboard
  - Transaction alert table (Txn ID | Amount | Country | Type | Risk | Reason)
  - Case statistics panel (5 bars)
  - STR/CTR report table

Business rules:
  - 15+ rule categories: large cash, structuring, geo-anomaly, rapid movement
  - ML runs async, updates risk level after initial rule pass
  - STR threshold: > ₹10 Lakh
  - CTR threshold: cash > ₹5 Lakh
  - Unreviewed HIGH alert after 24h → auto-escalate
  - All STR/CTR filings: immutable audit records
```

### DMS — `/api/v1/dms`

```
POST /upload              → multipart/form-data → docId (OCR async)
GET  /documents           → paginated list with filters
POST /documents/:id/approve → maker-checker approval
POST /documents/:id/reject  → with mandatory reason field
GET  /customer/:id/kyc-status → KYC completeness
GET  /expiring            → docs expiring in next N days

React screen: /dms — DMSDashboard
  - Upload form (React Dropzone + React Hook Form)
  - OCR preview panel (auto-extracted fields + confidence)
  - Recent uploads sidebar
  - Approval queue table (maker-checker)

Business rules:
  - Allowed types: PDF, JPG, PNG, XLSX only
  - Max size: 10MB per file
  - OCR < 70% confidence → flag for manual review
  - Duplicate detection: SHA-256 hash comparison
  - Maker-checker: uploader CANNOT approve own document
  - KYC expiry: alert 30 days before
  - Retention: 7 years minimum
```

### LOS — `/api/v1/los`

```
POST /application               → create (step 1: customer details)
PUT  /application/:id/financial → submit financials (step 2)
POST /application/:id/documents → link KYC documents (step 3)
GET  /application/:id/score     → trigger credit scoring (step 4)
POST /application/:id/submit    → final submission (step 5)
POST /application/:id/approve   → credit analyst decision
POST /application/:id/reject    → with mandatory reason

React screens:
  /los               → Application list with status filter
  /los/new           → 5-step wizard (React Hook Form)
  /los/:id           → Application detail with timeline

Business rules:
  - 5-step wizard: Customer → Financial → Documents → Score → Submit
  - Auto-reject: PD > 0.8
  - Auto-approve: PD < 0.2 AND all KYC complete AND FOIR < 50%
  - All other: route to credit analyst
  - Decision SLA: 24 hours from submission
```

### CMS — `/api/v1/collection`

```
GET  /cases               → case list with DPD bucket filter
POST /cases               → create case (auto-triggered by EWS HIGH)
POST /cases/:id/action    → log call/visit/SMS/email action
POST /cases/:id/payment   → record payment received
GET  /agents              → field agent list with GPS
POST /agents/:id/assign   → assign case to agent
GET  /nba/:customerId     → AI next-best-action

React screens:
  /cms              → CMS Dashboard (bucket chart + list + map)
  /cms/mobile       → Field agent PWA

Business rules:
  - DPD buckets: 0-30, 31-60, 61-90, 90+ (NPA)
  - NBA: HIGH → Field visit | MEDIUM → Call | LOW → SMS/Email
  - NPA at 90+ DPD → auto flag + IFRS 9 Stage 3 trigger
  - Payment → update LMS + recalculate IFRS 9 ECL
  - Agent GPS: tracked every 5 min during active visit
```

### IFRS 9 — `/api/v1/ifrs9`

```
POST /ecl              → calculate ECL for loan/portfolio
GET  /staging          → stage distribution report
POST /batch-run        → monthly batch ECL calculation
GET  /reports          → ECL trend and scenario reports

Stages:
  Stage 1: DPD < 30 — performing
  Stage 2: DPD 30–89 — significant credit risk increase
  Stage 3: DPD 90+ — credit-impaired
ECL = PD × LGD × EAD × Discount factor
```

---

## PART 13 — DESIGN SYSTEM ENFORCEMENT

### Color Tokens (NEVER hardcode hex — import from tokens.ts)

```typescript
export const colors = {
  navy:       '#0D2B6A',   // sidebar, dark headers
  blue:       '#1565C0',   // primary actions, active nav, buttons
  sky:        '#2196F3',   // module labels, accents
  skyLight:   '#E3EFFF',   // pills, tags, hover states
  success:    '#1D9E75',
  successBg:  '#E0F5EE',
  warning:    '#EF9F27',
  warningBg:  '#FAF0DC',
  danger:     '#E24B4A',
  dangerBg:   '#FCEBEB',
  purple:     '#7F77DD',
  purpleBg:   '#EEEDFE',
  gray900:    '#2C2C2A',   // primary text
  gray700:    '#5F5E5A',   // secondary text
  gray500:    '#888780',   // placeholders
  gray100:    '#F1EFE8',   // borders, table headers
  pageBg:     '#F1F4F8',   // app background
  white:      '#FFFFFF',
} as const
```

### Tailwind Class Rules

```
Page background:  bg-[#F1F4F8]
Card:             bg-white border border-[#F1EFE8] rounded-xl p-4
Sidebar:          bg-[#0D2B6A] w-[220px]
Topbar:           bg-white border-b border-[#F1EFE8] h-[58px]
Primary button:   bg-[#1565C0] text-white rounded-lg px-4 py-2 text-[13px] font-medium
Secondary button: bg-[#E3EFFF] text-[#1565C0] rounded-lg px-4 py-2
Danger button:    bg-[#E24B4A] text-white rounded-lg px-4 py-2
Table header:     bg-[#F1EFE8] h-8 text-[11px] font-semibold text-[#5F5E5A]
Table row body:   h-10 text-[12px] text-[#2C2C2A] alternating white/[#F1F4F8]
Badge HIGH:       bg-[#FCEBEB] text-[#E24B4A] rounded-[11px] text-[11px] font-medium px-2
Badge MEDIUM:     bg-[#FAF0DC] text-[#EF9F27]
Badge LOW:        bg-[#E0F5EE] text-[#1D9E75]
```

---

## PART 14 — API RESPONSE ENVELOPES

### Success

```typescript
// Single item
{ header: { status: 'SUCCESS', code: '200', message: '...', requestId, timestamp }, body: item }

// List
{ header: {...}, body: { items: [], total: 0, page: 1, limit: 20, hasNext: false } }
```

### Error

```typescript
{
  header: { status: 'ERROR', code: 'VALIDATION_ERROR', message: '...', requestId, timestamp },
  errors: [{ field: 'amount', message: 'Must be positive', code: 'too_small' }]
}
```

---

## PART 15 — ENVIRONMENT VARIABLES

```bash
# apps/backend/.env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:password@localhost:5432/banking_dev
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
REDIS_URL=redis://localhost:6379
JWT_SECRET=minimum-64-character-random-string-replace-this-immediately
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
AZURE_STORAGE_CONNECTION_STRING=
AZURE_STORAGE_CONTAINER=banking-documents
OCR_SERVICE_URL=
OCR_API_KEY=
BUREAU_API_URL=
BUREAU_API_KEY=
CBS_API_BASE_URL=
CBS_API_KEY=
LOG_LEVEL=debug
LOG_FORMAT=pretty
CORS_ORIGIN=http://localhost:5173
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=noreply@datanetworks.com

# apps/frontend/.env.local
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_APP_NAME=Data Networks Banking Platform
VITE_APP_VERSION=2.0.0
VITE_FIGMA_FILE_KEY=mnz58vWYsPKf7NUXCLLc8w
VITE_ENABLE_MOCK_API=false
```

---

## PART 16 — CI/CD PIPELINE

```yaml
# All 5 stages must pass before ANY merge to develop or main

Stage 1: Code Quality       (< 2 min)
  - TypeScript: pnpm typecheck       → zero errors
  - Linting:    pnpm lint            → zero errors
  - Format:     pnpm format:check    → zero diff

Stage 2: Tests              (< 10 min)
  - Unit:         pnpm test:unit      → 80% coverage gate
  - Integration:  pnpm test:int       → all routes tested
  - E2E:          pnpm test:e2e       → critical flows pass

Stage 3: Security           (< 3 min)
  - pnpm audit                        → no high/critical
  - npx secretlint                    → no secrets in code

Stage 4: Build              (< 5 min)
  - pnpm build                        → clean build, no errors
  - Bundle size check                 → initial JS < 500KB

Stage 5: Deploy (main only)
  - Build + push Docker images
  - Apply K8s rolling deployment
  - Smoke tests against staging
```

---

## PART 17 — COMMANDS

```bash
pnpm dev                                # Start all (React :5173, Express :3000)
pnpm --filter frontend dev              # Frontend only
pnpm --filter backend dev               # Backend only

pnpm --filter backend prisma:migrate    # Run DB migrations
pnpm --filter backend prisma:generate   # Regenerate Prisma client
pnpm --filter backend prisma:studio     # Visual DB editor
pnpm --filter backend prisma:seed       # Seed dev data

pnpm test                               # All tests
pnpm test:unit                          # Unit only (Vitest)
pnpm test:integration                   # Integration (Jest + Supertest)
pnpm test:e2e                           # Playwright E2E
pnpm test:coverage                      # Coverage report

pnpm typecheck                          # TypeScript
pnpm lint && pnpm lint:fix              # ESLint
pnpm format                             # Prettier

pnpm build                              # Production build

docker-compose up -d postgres redis     # Infrastructure only
docker-compose up                       # Everything
```

---

## PART 18 — AUTONOMOUS DEVELOPMENT COMPLETION CHECKLIST

Before marking ANY task complete, verify every item:

**Code**
```
[ ] Zero TypeScript errors (strict mode)
[ ] Zero ESLint errors
[ ] No any types
[ ] No magic numbers or strings
[ ] No console.log
[ ] All errors use AppError with ErrorCode
[ ] All async functions have error handling
[ ] All routes have verifyJWT + checkRole
[ ] All DB queries include tenantId
[ ] All responses use standard envelope
[ ] All sensitive operations have audit log
```

**UI**
```
[ ] All colors use tokens.ts values
[ ] All cards: bg-white border-[#F1EFE8] rounded-xl
[ ] All metric cards match MetricCard spec
[ ] All tables match DataTable spec
[ ] All risk labels use RiskBadge component
[ ] All forms use React Hook Form + Zod resolver
[ ] All data fetching uses React Query
[ ] Loading state implemented
[ ] Error state implemented
[ ] Mobile responsive (320px min)
```

**Tests**
```
[ ] Unit tests for all service functions
[ ] Integration tests for all new routes
[ ] E2E test for critical flows
[ ] All tests pass
[ ] Coverage >= 80%
```

**Security**
```
[ ] No hardcoded secrets
[ ] No console.log
[ ] No any types
[ ] File upload validation (if applicable)
[ ] Rate limiting (if applicable)
[ ] RBAC roles correctly assigned
```

---

*Document Version: 2.0.0*
*Issued by: Chief Technology Officer & Head of Engineering, Data Networks*
*Date: April 10, 2026*
*Classification: Internal Engineering*

> **This document is the engineering law of this project.**
> **Follow it completely, precisely, and without deviation.**
> **Every decision must be traceable back to a rule in this document.**
