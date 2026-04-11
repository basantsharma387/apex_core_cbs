# CLAUDE.md — Data Networks Enterprise Banking Platform

> This file is automatically read by Claude Code and the VS Code Claude extension.
> It contains the full design system, component specs, and UI generation rules for this project.
> When generating any UI component or screen, ALWAYS follow the specs in this file exactly.

---

## Project Overview

**Product:** Data Networks — Enterprise Banking Platform  
**Version:** v2.0 · 2026  
**Stack:** React 18 + TypeScript 5 · Express.js · Node 20 LTS · PostgreSQL · Redis  
**Design source:** Figma file `mnz58vWYsPKf7NUXCLLc8w`  
**Figma URL:** https://www.figma.com/design/mnz58vWYsPKf7NUXCLLc8w

---

## Tech Stack — Always Use These

| Layer | Technology | Version |
|---|---|---|
| UI Framework | React | 18.x |
| Language | TypeScript | 5.x (strict mode) |
| Build tool | Vite | 5.x |
| Styling | Tailwind CSS | 3.x |
| Components | Shadcn/ui | latest |
| State (global) | Zustand | 4.x |
| State (server) | React Query (@tanstack/react-query) | 5.x |
| Forms | React Hook Form + Zod | latest |
| HTTP client | Axios | latest |
| Charts | Recharts | 2.x |
| Icons | Lucide React | latest |
| Backend | Express.js + TypeScript | 4.x |
| ORM | Prisma | 5.x |
| Validation | Zod (shared FE + BE) | 3.x |
| Auth | jsonwebtoken (JWT) | latest |
| Cache | ioredis | latest |

---

## Design Tokens — ALWAYS Use These Exact Values

### Color Palette

```typescript
// src/styles/tokens.ts  — import these everywhere, never hardcode hex
export const colors = {
  // Brand
  navy:        '#0D2B6A',   // Primary dark — sidebar, headers
  blue:        '#1565C0',   // Primary action — buttons, links, active nav
  sky:         '#2196F3',   // Accent — module labels, highlights
  skyLight:    '#E3EFFF',   // Light accent bg — pills, tags, hover states

  // Semantic
  success:     '#1D9E75',
  successBg:   '#E0F5EE',
  warning:     '#EF9F27',
  warningBg:   '#FAF0DC',
  danger:      '#E24B4A',
  dangerBg:    '#FCEBEB',
  purple:      '#7F77DD',
  purpleBg:    '#EEEDFE',

  // Neutrals
  gray900:     '#2C2C2A',   // Primary text
  gray700:     '#5F5E5A',   // Secondary text
  gray500:     '#888780',   // Placeholder, captions
  gray200:     '#D3D1C7',   // Borders
  gray100:     '#F1EFE8',   // Table alt rows, dividers
  gray50:      '#F7F6F2',   // Surface backgrounds
  white:       '#FFFFFF',
  pageBg:      '#F1F4F8',   // App background
} as const
```

### Tailwind Config — Map tokens to Tailwind

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          navy:    '#0D2B6A',
          blue:    '#1565C0',
          sky:     '#2196F3',
          skyLight:'#E3EFFF',
        },
        success: { DEFAULT: '#1D9E75', bg: '#E0F5EE' },
        warning: { DEFAULT: '#EF9F27', bg: '#FAF0DC' },
        danger:  { DEFAULT: '#E24B4A', bg: '#FCEBEB' },
        purple:  { DEFAULT: '#7F77DD', bg: '#EEEDFE' },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        card: '12px',
        badge: '11px',
        input: '8px',
      },
    },
  },
  plugins: [],
}
export default config
```

### Typography Scale

```
H1 — 28px / Inter Bold       — Dashboard page titles
H2 — 20px / Inter SemiBold   — Section headings
H3 — 16px / Inter SemiBold   — Card titles
Body — 14px / Inter Regular  — Descriptions, table body
Small — 13px / Inter Regular — Form labels, secondary info
Caption — 12px / Inter Regular — Metadata, timestamps
Micro — 11px / Inter Medium  — Badges, tags, status pills
Mono — 12px / JetBrains Mono — Code, IDs, API endpoints
```

### Spacing

```
Page padding:  48px sides, 24px top
Card padding:  16px (1rem) all sides
Section gap:   24px between major sections
Card gap:      12px between cards in grid
Form gap:      24px between field groups, 16px between fields
Table row h:   40px (body), 32px (header)
Sidebar width: 220px (fixed)
Topbar height: 58px (fixed)
```

---

## Component Library — Generate These Exactly

### 1. AppLayout (every authenticated page)

```tsx
// src/components/layout/AppLayout.tsx
import Sidebar from './Sidebar'
import Topbar from './Topbar'

interface AppLayoutProps {
  children: React.ReactNode
  title: string
  module: string   // e.g. "EWS — Risk Monitoring"
}

export default function AppLayout({ children, title, module }: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-[#F1F4F8] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title={title} module={module} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

### 2. Sidebar

```tsx
// src/components/layout/Sidebar.tsx
// Background: brand-navy (#0D2B6A)
// Width: 220px fixed
// Logo: 36x36 rounded-lg bg-brand-blue, white text "DN"
// Nav items: 13px Inter Regular, color rgba(165,195,235,1) inactive
// Active item: bg-brand-blue, rounded-md (8px), white text SemiBold, padding 8px 12px
// All items height: 32px, margin: 4px 8px

const navItems = [
  { label: 'Dashboard',    path: '/dashboard',   icon: LayoutDashboard },
  { label: 'EWS Alerts',   path: '/ews',          icon: AlertTriangle },
  { label: 'AML Monitor',  path: '/aml',          icon: Shield },
  { label: 'Documents',    path: '/dms',          icon: FileText },
  { label: 'LOS',          path: '/los',          icon: Briefcase },
  { label: 'Collections',  path: '/cms',          icon: Package },
  { label: 'IFRS 9',       path: '/ifrs9',        icon: BarChart2 },
  { label: 'ALM / FTP',    path: '/alm',          icon: TrendingUp },
  { label: 'Reports',      path: '/reports',      icon: FileBarChart },
  { label: 'Settings',     path: '/settings',     icon: Settings },
]
```

### 3. Topbar

```tsx
// src/components/layout/Topbar.tsx
// Height: 58px, bg white, border-bottom: 1px solid #F1EFE8
// Left: module label (10px SemiBold sky blue) above title (16px SemiBold gray900)
// Right: user pill — bg skyLight (#E3EFFF), rounded-full, 32px height, 12px Medium blue text
```

### 4. MetricCard

```tsx
// src/components/ui/MetricCard.tsx
interface MetricCardProps {
  label: string
  value: string
  sub?: string
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'blue'
}

// Card: white bg, 1px solid #F1EFE8, border-radius 12px, padding 16px
// Label: 12px Regular gray500, margin-bottom 8px
// Value: 24px Bold gray900
// Sub pill: 10px Medium, colored bg + text matching variant, border-radius 10px, padding 3px 8px
// Grid: always 5 columns on desktop, 2 on mobile, gap 12px
```

### 5. DataTable

```tsx
// src/components/ui/DataTable.tsx
// Header row: bg gray100 (#F1EFE8), 32px height, 11px SemiBold gray700
// Body row: 40px height, alternating white / pageBg (#F1F4F8)
// Cell padding: 12px horizontal, text 12px Regular gray900
// First column: 12px Medium gray900 (ID columns)
// Risk badge inline: see RiskBadge component
// Action button: 68x24px, bg skyLight, border-radius 6px, "View →" 11px Medium blue
```

### 6. RiskBadge

```tsx
// src/components/ui/RiskBadge.tsx
// HIGH:   bg #FCEBEB, text #E24B4A, border-radius 11px
// MEDIUM: bg #FAF0DC, text #EF9F27
// LOW:    bg #E0F5EE, text #1D9E75
// LIVE:   bg #E3EFFF, text #1565C0
// UAT:    bg #FAF0DC, text #EF9F27
// DEV:    bg #EEEDFE, text #7F77DD
// Padding: 3px 9px, font: 11px Medium
```

### 7. PageHeader

```tsx
// src/components/ui/PageHeader.tsx
// Title: 20px SemiBold gray900
// Subtitle: 12px Regular gray500, margin-top 4px
// Includes React Query / Express route info in subtitle for dev reference
```

### 8. SectionCard

```tsx
// src/components/ui/SectionCard.tsx
// bg white, border 1px solid #F1EFE8, border-radius 12px
// padding: 16px 20px
// Card title: 14px SemiBold gray900
// Card subtitle: 11px Regular gray500
```

---

## Screen Specifications

### Screen 1: Executive Dashboard (`/dashboard`)

```
Layout: AppLayout
Title: "Executive Dashboard"
Module: "Data Networks Banking Platform"

Greeting: "Good morning, {user}" — 20px SemiBold gray900
Subtitle: "Platform overview · {date} · React 18 + Express.js" — 12px gray500

Metric Cards (row of 5, gap 12px):
  1. label="Active Loans"    value="12,480"  sub="▲ 8% MoM"         variant=success
  2. label="NPA Portfolio"   value="₹4.2 Cr" sub="▼ 3% via EWS"     variant=success
  3. label="AML Alerts"      value="47"      sub="▲ 12 new today"    variant=danger
  4. label="KYC Compliance"  value="94.2%"   sub="2 docs expiring"   variant=warning
  5. label="Pending DMS"     value="23"      sub="Maker-checker"     variant=warning

Row 2 (3 columns):
  Col 1 (width ~55%): LoanTrendChart
    - Title: "Loan portfolio trend — CBS data"
    - Subtitle: "Express GET /api/v1/dwh/query · Recharts"
    - Recharts BarChart, fill #1565C0, rounded bars
    - Data: Jan–Aug, values 8.2k–12.5k
    - X axis: month labels, no grid lines, clean

  Col 2 (width ~25%): EWSRiskPanel
    - Title: "EWS risk distribution"
    - 3 rows: High Risk 32, Medium 89, Low 214
    - Each row: colored bg card, bold count, progress bar

  Col 3 (width ~20%): ModuleStatusPanel
    - Title: "Module status"
    - 8 rows: CBS Live, LOS Dev, AML Live, EWS UAT, DMS UAT, CMS Dev, IFRS9 UAT, ALM Dev

Row 3: AlertFeedTable (full width)
  - Title: "Recent platform alerts"
  - Subtitle: "React Query · Express /api/v1/ews/alerts"
  - Columns: Customer | Module | Risk | Indicator | Amount | Time | Action
  - 5 rows of mock data
```

### Screen 2: EWS Dashboard (`/ews`)

```
Layout: AppLayout
Title: "Early Warning System"
Module: "EWS — AI Risk Monitoring"

Metric Cards (row of 5):
  1. Total Alerts: 335 / Active / danger
  2. High Risk: 32 / Customers / danger
  3. Avg PD Score: 0.68 / Risk index / warning
  4. Auto Cases: 28 / Linked to CMS / success
  5. Resolved: 14 / Today / success

Main content (2 columns):
  Left (width ~55%): EWSAlertTable
    - GET /api/v1/ews/alerts
    - React Query, refetchInterval: 30_000
    - Columns: Customer | PD Score | Indicator | Severity | DPD | Action
    - PD Score colored: >0.7 danger, >0.45 warning, else success

  Right (width ~45%): CustomerRiskProfile
    - Avatar: 48x48 rounded-full, bg skyLight, initials
    - Name, customer ID, role, HIGH RISK badge
    - Risk indicators list (5 items): colored bg cards
    - PD Score gauge bar: track + colored fill
    - Scenario simulation: 3 rows (GDP drop, Rate change, Recovery)
    - Actions: "Assign to collection" (danger btn) + "Add to watchlist" (skyLight btn)
```

### Screen 3: AML Dashboard (`/aml`)

```
Layout: AppLayout
Title: "AML Compliance Monitor"
Module: "AML — Anti-Money Laundering"

Metric Cards (5):
  Txn Monitored: 8,420 / Today / blue
  Suspicious: 47 / Unreviewed / danger
  STR Filed: 3 / This month / warning
  CTR Generated: 12 / Auto-filed / success
  Cases Open: 18 / Pending review / warning

Main (2 columns):
  Left (~75%): TransactionTable — POST /api/v1/aml/monitor
    Columns: Txn ID | Amount | Country | Type | Risk | Reason
  Right (~25%): CaseStatisticsPanel
    Vertical bars: Open, Under Review, SAR, Closed Clear, STR

Bottom: STR/CTR Reports table
    Columns: Report ID | Customer | Type | Amount | Filed By | Status | Date
```

### Screen 4: DMS (`/dms`)

```
Layout: AppLayout
Title: "Document Management System"
Module: "DMS — KYC & Document Workflow"

Metric Cards (4):
  Total Docs: 8,250 / blue
  Pending Approvals: 24 / warning
  KYC Expiring: 8 / danger
  Uploaded Today: 150 / success

Main (3 columns):
  Col 1 (~36%): DocumentUploadForm
    - React Hook Form + Zod validation
    - Fields: Customer ID (select), Document Type (select), Branch (select)
    - Drop zone: dashed border sky blue, "Drop file here or click to browse"
    - Buttons: "Submit document" (blue) + "Save as draft" (skyLight)
    - POST /api/v1/dms/upload (multipart/form-data via Multer)

  Col 2 (~36%): OCRPreviewPanel
    - Document thumbnail placeholder
    - Auto-extracted fields: Name, CID, DOB, Validity, Confidence
    - Green dot = verified, red dot = needs review
    - Buttons: "Verify & send to approval" (success) + "Re-scan OCR" (danger outline)

  Col 3 (~28%): RecentUploadsPanel
    - Scrollable list of recent docs
    - Each item: doc type, customer ID, status badge, timestamp

Bottom: ApprovalQueueTable (maker-checker)
  Columns: Doc ID | Customer | Type | Uploaded By | At | Checker | Action
```

### Screen 5: LOS (`/los`)

```
Layout: AppLayout
Title: "Loan Origination System"
Module: "LOS — New Loan Application"

Progress Steps (5 steps horizontal):
  1. Customer Details (active)
  2. Financial Info
  3. Documents
  4. Credit Score
  5. Review & Submit
  Active step: bg brand-blue circle, SemiBold label
  Inactive: gray circle, gray label
  Connector line: gray100

Main (2 columns):
  Left (~55%): LoanApplicationForm (React Hook Form)
    Fields grid (2 cols):
      Full Name, Customer ID
      Mobile Number, Email
      Loan Product (select), Loan Purpose (select)
      Loan Amount (₹), Tenure (months)
      Branch (select), Relationship Manager (select)
    Buttons: "Next: Financial Info →" (blue) + "Save Draft" (skyLight)
    POST /api/v1/los/application

  Right (~45%): AICreditScorePanel
    - CIBIL Score gauge: large number 780/900, progress bar green
    - Metrics list: PD Score, LTV Ratio, FOIR, Loan to Income, Liabilities, Rating
    - Each metric: label + colored value
    - POST /api/v1/rating/calculate
    - Buttons: "Recommend Approval" (success) + "Send for Review" (warning)
```

### Screen 6: CMS (`/cms`)

```
Layout: AppLayout
Title: "Collection Management System"
Module: "CMS — Loan Recovery & NPA Control"

Metric Cards (5):
  Total Overdue: ₹18.4 Cr / danger
  NPA %: 3.2% / success
  Recovery Rate: 68% / success
  Field Agents: 24 / blue
  Cases Assigned: 156 / warning

Main (3 columns):
  Col 1 (~35%): DPDBucketChart
    - Recharts BarChart
    - Buckets: 0-30 (green), 31-60 (warning), 61-90 (danger), 90+ NPA (danger)
    - POST /api/v1/collection/case

  Col 2 (~55%): CaseListTable
    - Columns: Customer | Loan ID | DPD | Amount | NBA | Agent
    - NBA = AI Next Best Action (Field Visit / Call / SMS / Email)
    - React Query polling

  Col 3 (~10%): AINextBestActionPanel
    - 4 cards stacked: Field visit (danger), Call (warning), SMS (success), Legal (danger)

Bottom: MapView placeholder
    - "GPS field tracking — React Leaflet + Express /api/v1/collection/agent"
    - Agent pins with name + status
```

---

## API Integration Pattern

### Axios client setup

```typescript
// src/api/client.ts
import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // http://localhost:3000/api/v1
  headers: { 'Content-Type': 'application/json' },
})

// JWT interceptor
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Refresh on 401
apiClient.interceptors.response.use(
  (res) => res.data,
  async (err) => {
    if (err.response?.status === 401) {
      // refresh token logic
    }
    return Promise.reject(err)
  }
)
```

### React Query hook pattern

```typescript
// src/modules/ews/hooks/useEWSAlerts.ts
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import type { EWSAlert } from '@shared/types'

export function useEWSAlerts(riskLevel?: string) {
  return useQuery<EWSAlert[]>({
    queryKey: ['ews-alerts', riskLevel],
    queryFn: () => apiClient.get(`/ews/alerts${riskLevel ? `?riskLevel=${riskLevel}` : ''}`),
    refetchInterval: 30_000,   // 30 second polling for live alerts
    staleTime: 20_000,
  })
}
```

### Express route pattern

```typescript
// apps/backend/src/routes/ews.ts
import { Router } from 'express'
import { z } from 'zod'
import { verifyJWT } from '../middleware/auth'
import { checkRole } from '../middleware/rbac'
import { validateBody } from '../middleware/validate'
import { ewsService } from '../services/ewsService'

const router = Router()

const evaluateSchema = z.object({
  customerId: z.string().min(1),
  dpd: z.number().int().min(0),
  balanceDrop: z.number().min(0).max(100),
})

router.post('/evaluate',
  verifyJWT,
  checkRole(['RISK_ANALYST', 'ADMIN']),
  validateBody(evaluateSchema),
  async (req, res, next) => {
    try {
      const result = await ewsService.evaluate(req.body)
      res.json({ header: { status: 'SUCCESS', code: '200' }, body: result })
    } catch (err) { next(err) }
  }
)

router.get('/alerts', verifyJWT, async (req, res, next) => {
  try {
    const { riskLevel, page = '1', limit = '20' } = req.query
    const alerts = await ewsService.getAlerts({ riskLevel as string, page: +page, limit: +limit })
    res.json({ header: { status: 'SUCCESS', code: '200' }, body: alerts })
  } catch (err) { next(err) }
})

export default router
```

---

## Shared TypeScript Types

```typescript
// packages/shared/types/index.ts

export interface Loan {
  loanId: string
  customerId: string
  amount: number
  tenure: number
  dpd: number
  stage: 1 | 2 | 3        // IFRS 9 stages
  status: 'ACTIVE' | 'NPA' | 'CLOSED' | 'RESTRUCTURED'
  bucket: '0-30' | '31-60' | '61-90' | '90+'
  createdAt: string
}

export interface EWSAlert {
  alertId: string
  customerId: string
  customerName: string
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW'
  pdScore: number           // 0–1
  indicators: string[]
  dpd: number
  status: 'OPEN' | 'ASSIGNED' | 'RESOLVED'
  createdAt: string
}

export interface AMLAlert {
  txnId: string
  customerId: string
  amount: number
  country: string
  type: 'CASH' | 'TRANSFER' | 'CRYPTO' | 'REMITTANCE'
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW'
  reason: string
  status: 'OPEN' | 'REVIEWED' | 'FILED'
}

export interface Document {
  docId: string
  customerId: string
  customerName: string
  docType: 'KYC' | 'LOAN_FORM' | 'INCOME_PROOF' | 'ADDRESS_PROOF' | 'PHOTO'
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED'
  ocrConfidence: number
  uploadedAt: string
  approvedBy?: string
}

export interface CollectionCase {
  caseId: string
  loanId: string
  customerId: string
  customerName: string
  dpd: number
  bucket: string
  outstandingAmount: number
  nba: 'FIELD_VISIT' | 'CALL' | 'SMS' | 'EMAIL' | 'LEGAL'
  assignedAgent?: string
  status: 'OPEN' | 'IN_PROGRESS' | 'PAYMENT_RECEIVED' | 'CLOSED'
}

export interface APIResponse<T> {
  header: {
    status: 'SUCCESS' | 'ERROR'
    code: string
    message: string
    requestId?: string
  }
  body: T
}
```

---

## Claude Code — Prompt Templates

Use these exact prompts in Claude Code / VS Code extension to generate screens:

### Generate a full screen

```
Generate the complete React TypeScript component for the [SCREEN NAME] screen
following CLAUDE.md specs exactly:
- Use AppLayout wrapper with title="[TITLE]" module="[MODULE]"
- Use exact colors from tokens.ts
- Use MetricCard, DataTable, RiskBadge, SectionCard components
- Wire React Query hooks to Express /api/v1/[module] endpoints
- Include Zod-validated forms with React Hook Form
- Match the Figma layout: figma.com/design/mnz58vWYsPKf7NUXCLLc8w
```

### Generate a component

```
Generate the [COMPONENT NAME] React TypeScript component from CLAUDE.md.
Props: [list props]
Use Tailwind classes matching the exact hex values in tokens.ts.
Export as default, include TypeScript interface for props.
```

### Generate an Express route

```
Generate the Express TypeScript route for /api/v1/[module] from CLAUDE.md.
Include: verifyJWT middleware, RBAC checkRole, Zod validation, Prisma query,
Winston logging, standard APIResponse envelope, error handling.
```

### Generate Prisma model

```
Generate the Prisma model for [entity] following CLAUDE.md shared types.
Include: all fields from the TypeScript interface, proper relations,
indexes on frequently queried fields, createdAt/updatedAt timestamps.
```

---

## File Naming Conventions

```
src/
  modules/
    ews/
      EWSDashboard.tsx          # Page component
      components/
        EWSAlertTable.tsx       # Module-specific component
        CustomerRiskProfile.tsx
      hooks/
        useEWSAlerts.ts         # React Query hook
        useRiskProfile.ts
      types.ts                  # Module-specific types (extends shared)
      ewsApi.ts                 # API calls for this module
```

---

## Environment Variables

```bash
# apps/frontend/.env.local
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_APP_NAME=Data Networks Banking Platform
VITE_FIGMA_FILE_KEY=mnz58vWYsPKf7NUXCLLc8w

# apps/backend/.env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:password@localhost:5432/banking_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=replace-with-64-char-random-string
JWT_EXPIRES_IN=7d
AZURE_STORAGE_CONNECTION_STRING=
CORS_ORIGIN=http://localhost:5173
```

---

## Development Commands

```bash
# Root — run everything in parallel
pnpm dev

# Individual
pnpm --filter frontend dev     # Vite on :5173
pnpm --filter backend dev      # ts-node-dev on :3000

# Database
pnpm --filter backend prisma:migrate   # npx prisma migrate dev
pnpm --filter backend prisma:studio    # npx prisma studio

# Type check all workspaces
pnpm typecheck

# Lint all
pnpm lint

# Test all
pnpm test
```

---

*Last updated: April 10, 2026 — Data Networks Engineering Team*
