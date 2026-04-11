# UI_DESIGN_SPEC.md — Data Networks Banking Platform

> Pixel-perfect UI specification. Every component here maps directly to the Figma design.
> Use this alongside CLAUDE.md in Claude Code to generate exact replicas of the designed screens.
> Figma file: https://www.figma.com/design/mnz58vWYsPKf7NUXCLLc8w

---

## Design System Quick Reference

| Token | Value | Tailwind class |
|---|---|---|
| Page background | `#F1F4F8` | `bg-[#F1F4F8]` |
| Card background | `#FFFFFF` | `bg-white` |
| Card border | `1px solid #F1EFE8` | `border border-[#F1EFE8]` |
| Card radius | `12px` | `rounded-xl` |
| Sidebar bg | `#0D2B6A` | `bg-[#0D2B6A]` |
| Primary blue | `#1565C0` | `bg-[#1565C0]` |
| Sky accent | `#2196F3` | `text-[#2196F3]` |
| Sky light | `#E3EFFF` | `bg-[#E3EFFF]` |
| Text primary | `#2C2C2A` | `text-[#2C2C2A]` |
| Text secondary | `#888780` | `text-[#888780]` |
| Table header bg | `#F1EFE8` | `bg-[#F1EFE8]` |
| Table alt row | `#F1F4F8` | `bg-[#F1F4F8]` |

---

## Component: Sidebar

```tsx
// Exact implementation from Figma
export function Sidebar() {
  const location = useLocation()

  return (
    <aside className="w-[220px] h-screen bg-[#0D2B6A] flex-shrink-0 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="w-9 h-9 bg-[#1565C0] rounded-lg flex items-center justify-center">
          <span className="text-white text-sm font-bold">DN</span>
        </div>
        <div>
          <p className="text-white text-[12px] font-bold leading-tight">Data Networks</p>
          <p className="text-[#8DB3E8] text-[9px] leading-tight">Banking Suite</p>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-0 border-t border-white/10 mb-2" />

      {/* Nav */}
      <nav className="flex-1 px-2">
        {navItems.map((item) => {
          const active = location.pathname === item.path
          const Icon = item.icon
          return (
            <Link key={item.path} to={item.path}>
              <div className={`flex items-center gap-3 px-3 py-[7px] rounded-lg mb-1 ${
                active
                  ? 'bg-[#1565C0] text-white font-semibold'
                  : 'text-[#A5C3EB] hover:bg-white/10'
              }`}>
                <Icon size={15} />
                <span className="text-[13px]">{item.label}</span>
              </div>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
```

---

## Component: Topbar

```tsx
export function Topbar({ title, module }: { title: string; module: string }) {
  const user = useAuthStore(s => s.user)

  return (
    <header className="h-[58px] bg-white border-b border-[#F1EFE8] flex items-center justify-between px-6 flex-shrink-0">
      <div>
        <p className="text-[10px] font-semibold text-[#2196F3] uppercase tracking-wide">{module}</p>
        <h1 className="text-[16px] font-semibold text-[#2C2C2A]">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <button className="w-8 h-8 rounded-full bg-[#F1EFE8] flex items-center justify-center">
          <Bell size={15} className="text-[#888780]" />
        </button>
        <div className="h-8 px-3 bg-[#E3EFFF] rounded-full flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-[#1565C0] flex items-center justify-center">
            <span className="text-white text-[9px] font-bold">
              {user?.name?.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <span className="text-[12px] font-medium text-[#1565C0]">{user?.name}</span>
        </div>
      </div>
    </header>
  )
}
```

---

## Component: MetricCard

```tsx
interface MetricCardProps {
  label: string
  value: string
  sub?: string
  variant?: 'success' | 'warning' | 'danger' | 'blue' | 'default'
}

const variantStyles = {
  success: { text: 'text-[#1D9E75]', bg: 'bg-[#E0F5EE]' },
  warning: { text: 'text-[#EF9F27]', bg: 'bg-[#FAF0DC]' },
  danger:  { text: 'text-[#E24B4A]', bg: 'bg-[#FCEBEB]' },
  blue:    { text: 'text-[#1565C0]', bg: 'bg-[#E3EFFF]' },
  default: { text: 'text-[#888780]', bg: 'bg-[#F1EFE8]' },
}

export function MetricCard({ label, value, sub, variant = 'default' }: MetricCardProps) {
  const s = variantStyles[variant]
  return (
    <div className="bg-white border border-[#F1EFE8] rounded-xl p-4 min-h-[96px]">
      <p className="text-[12px] text-[#888780] mb-2">{label}</p>
      <p className="text-[24px] font-bold text-[#2C2C2A] leading-tight">{value}</p>
      {sub && (
        <span className={`inline-block mt-2 text-[10px] font-medium px-2 py-[3px] rounded-[10px] ${s.bg} ${s.text}`}>
          {sub}
        </span>
      )}
    </div>
  )
}
```

---

## Component: RiskBadge

```tsx
const riskStyles = {
  HIGH:    { bg: 'bg-[#FCEBEB]', text: 'text-[#E24B4A]' },
  MEDIUM:  { bg: 'bg-[#FAF0DC]', text: 'text-[#EF9F27]' },
  LOW:     { bg: 'bg-[#E0F5EE]', text: 'text-[#1D9E75]' },
  LIVE:    { bg: 'bg-[#E0F5EE]', text: 'text-[#1D9E75]' },
  UAT:     { bg: 'bg-[#FAF0DC]', text: 'text-[#EF9F27]' },
  DEV:     { bg: 'bg-[#EEEDFE]', text: 'text-[#7F77DD]' },
  PENDING: { bg: 'bg-[#FAF0DC]', text: 'text-[#EF9F27]' },
  FILED:   { bg: 'bg-[#E0F5EE]', text: 'text-[#1D9E75]' },
}

export function RiskBadge({ level }: { level: keyof typeof riskStyles }) {
  const s = riskStyles[level] ?? riskStyles.LOW
  return (
    <span className={`inline-block text-[11px] font-medium px-[9px] py-[3px] rounded-[11px] ${s.bg} ${s.text}`}>
      {level}
    </span>
  )
}
```

---

## Component: DataTable

```tsx
interface Column<T> {
  key: keyof T | string
  header: string
  width?: number
  render?: (row: T) => React.ReactNode
}

export function DataTable<T extends Record<string, unknown>>({
  columns, data, onRowClick,
}: {
  columns: Column<T>[]
  data: T[]
  onRowClick?: (row: T) => void
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#F1EFE8] bg-white">
      <table className="w-full">
        <thead>
          <tr className="bg-[#F1EFE8]">
            {columns.map(col => (
              <th key={col.key as string}
                  className="px-3 py-2 text-left text-[11px] font-semibold text-[#5F5E5A]"
                  style={col.width ? { width: col.width } : {}}>
                {col.header}
              </th>
            ))}
            <th className="px-3 py-2 w-20" />
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}
                className={`${i % 2 === 0 ? 'bg-white' : 'bg-[#F1F4F8]'} hover:bg-[#E3EFFF]/30 cursor-pointer`}
                onClick={() => onRowClick?.(row)}>
              {columns.map((col, ci) => (
                <td key={col.key as string} className="px-3 h-10 text-[12px] text-[#2C2C2A]">
                  {col.render ? col.render(row) : String(row[col.key] ?? '')}
                </td>
              ))}
              <td className="px-3 h-10">
                <button className="text-[11px] font-medium text-[#1565C0] bg-[#E3EFFF] px-2 py-1 rounded-md hover:bg-[#1565C0] hover:text-white transition-colors">
                  View →
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

---

## Component: SectionCard

```tsx
export function SectionCard({
  title, subtitle, children, className = '',
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`bg-white border border-[#F1EFE8] rounded-xl p-4 ${className}`}>
      <h3 className="text-[14px] font-semibold text-[#2C2C2A]">{title}</h3>
      {subtitle && (
        <p className="text-[11px] text-[#888780] mt-0.5 mb-3 font-mono">{subtitle}</p>
      )}
      {children}
    </div>
  )
}
```

---

## Component: ProgressBar (PD Score gauge)

```tsx
export function ProgressBar({
  value, max = 1, variant = 'danger',
}: {
  value: number
  max?: number
  variant?: 'success' | 'warning' | 'danger'
}) {
  const pct = Math.round((value / max) * 100)
  const barColors = {
    success: 'bg-[#1D9E75]',
    warning: 'bg-[#EF9F27]',
    danger:  'bg-[#E24B4A]',
  }
  return (
    <div className="w-full h-1.5 bg-[#F1EFE8] rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${barColors[variant]}`} style={{ width: `${pct}%` }} />
    </div>
  )
}
```

---

## Component: ActionButton

```tsx
// Primary blue button
<button className="px-4 py-2 bg-[#1565C0] text-white text-[13px] font-medium rounded-lg hover:bg-[#0D4FA0] transition-colors">
  Submit document
</button>

// Secondary skyLight button
<button className="px-4 py-2 bg-[#E3EFFF] text-[#1565C0] text-[13px] font-medium rounded-lg hover:bg-[#C8DEFF] transition-colors">
  Save Draft
</button>

// Danger button
<button className="px-4 py-2 bg-[#E24B4A] text-white text-[13px] font-medium rounded-lg hover:bg-[#C73534] transition-colors">
  Assign to collection
</button>
```

---

## Component: FormInput

```tsx
// Standard text input
<div className="flex flex-col gap-1">
  <label className="text-[12px] font-medium text-[#5F5E5A]">{label}</label>
  <input
    {...register(name)}
    placeholder={placeholder}
    className="h-9 px-3 text-[13px] bg-white border border-[#D3D1C7] rounded-lg
               focus:outline-none focus:ring-2 focus:ring-[#2196F3]/30 focus:border-[#2196F3]
               placeholder:text-[#888780]"
  />
  {errors[name] && (
    <span className="text-[11px] text-[#E24B4A]">{errors[name]?.message}</span>
  )}
</div>

// Select dropdown
<div className="flex flex-col gap-1">
  <label className="text-[12px] font-medium text-[#5F5E5A]">{label}</label>
  <select className="h-9 px-3 text-[13px] bg-[#F1F4F8] border border-[#D3D1C7] rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-[#2196F3]/30 appearance-none">
    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
</div>
```

---

## Screen: Executive Dashboard — Full Layout Code

```tsx
// src/modules/dashboard/ExecutiveDashboard.tsx
export default function ExecutiveDashboard() {
  const { data: alerts } = useQuery({ queryKey: ['alerts'], queryFn: () => apiClient.get('/ews/alerts') })
  const today = new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })

  return (
    <AppLayout title="Executive Dashboard" module="Data Networks Banking Platform">
      {/* Greeting */}
      <div className="mb-5">
        <h2 className="text-[20px] font-semibold text-[#2C2C2A]">Good morning, Basant</h2>
        <p className="text-[12px] text-[#888780] mt-1">Platform overview · {today} · React 18 + Express.js</p>
      </div>

      {/* Metric cards — 5 columns */}
      <div className="grid grid-cols-5 gap-3 mb-5">
        <MetricCard label="Active Loans"    value="12,480"  sub="▲ 8% MoM"         variant="success" />
        <MetricCard label="NPA Portfolio"   value="₹4.2 Cr" sub="▼ 3% via EWS"     variant="success" />
        <MetricCard label="AML Alerts"      value="47"      sub="▲ 12 new today"    variant="danger"  />
        <MetricCard label="KYC Compliance"  value="94.2%"   sub="2 docs expiring"   variant="warning" />
        <MetricCard label="Pending DMS"     value="23"      sub="Maker-checker"     variant="warning" />
      </div>

      {/* Mid section — 3 columns */}
      <div className="grid grid-cols-12 gap-3 mb-5">
        {/* Loan chart */}
        <div className="col-span-7">
          <SectionCard title="Loan portfolio trend" subtitle="GET /api/v1/dwh/query · Recharts">
            <LoanTrendChart />
          </SectionCard>
        </div>
        {/* EWS risk */}
        <div className="col-span-3">
          <SectionCard title="EWS risk distribution" subtitle="AI PD model · 30s poll">
            <EWSRiskSummary />
          </SectionCard>
        </div>
        {/* Module status */}
        <div className="col-span-2">
          <SectionCard title="Module status">
            <ModuleStatusList />
          </SectionCard>
        </div>
      </div>

      {/* Alert feed */}
      <SectionCard title="Recent platform alerts" subtitle="React Query · GET /api/v1/ews/alerts">
        <DataTable
          columns={alertColumns}
          data={alerts?.body ?? []}
        />
      </SectionCard>
    </AppLayout>
  )
}
```

---

## Screen: EWS Dashboard — Full Layout Code

```tsx
// src/modules/ews/EWSDashboard.tsx
export default function EWSDashboard() {
  const { data: alerts, isLoading } = useEWSAlerts()
  const [selected, setSelected] = useState<EWSAlert | null>(null)

  return (
    <AppLayout title="Early Warning System" module="EWS — AI Risk Monitoring">
      <PageHeader
        title="EWS alert monitor"
        subtitle="React Query 30s refresh · Express /api/v1/ews/evaluate · AI PD model"
      />

      {/* Metrics */}
      <div className="grid grid-cols-5 gap-3 mb-5">
        <MetricCard label="Total Alerts"  value="335"  sub="Active"          variant="danger"  />
        <MetricCard label="High Risk"     value="32"   sub="Customers"       variant="danger"  />
        <MetricCard label="Avg PD Score"  value="0.68" sub="Risk index"      variant="warning" />
        <MetricCard label="Auto Cases"    value="28"   sub="Linked to CMS"   variant="success" />
        <MetricCard label="Resolved"      value="14"   sub="Today"           variant="success" />
      </div>

      {/* Main two-column layout */}
      <div className="grid grid-cols-12 gap-3">
        {/* Alert list */}
        <div className="col-span-7">
          <SectionCard title="Alert list — sorted by severity" subtitle="GET /api/v1/ews/alerts · Zod validated">
            {isLoading ? <LoadingSpinner /> : (
              <DataTable
                columns={ewsAlertColumns}
                data={alerts?.body ?? []}
                onRowClick={setSelected}
              />
            )}
          </SectionCard>
        </div>

        {/* Risk profile panel */}
        <div className="col-span-5">
          {selected ? (
            <CustomerRiskProfile alert={selected} />
          ) : (
            <div className="bg-white border border-[#F1EFE8] rounded-xl p-6 h-full flex items-center justify-center">
              <p className="text-[13px] text-[#888780]">Select a customer to view risk profile</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
```

---

## Claude Code — Copy-Paste Prompts

Save these in your repo as `prompts/` folder and use them in Claude Code:

### `prompts/generate-module.md`

```
Read CLAUDE.md and UI_DESIGN_SPEC.md first.

Generate the complete [MODULE_NAME] module with:
1. Page component at src/modules/[module]/[Module]Dashboard.tsx
   - Use AppLayout, MetricCard, DataTable, SectionCard, RiskBadge from spec
   - Match exact Figma layout: [SCREEN_NUMBER] in UI_DESIGN_SPEC.md
   - Use exact Tailwind colors from design tokens
2. React Query hooks at src/modules/[module]/hooks/use[Module].ts
   - Endpoint: GET/POST /api/v1/[module]
   - refetchInterval: 30_000 for live data
3. Express route at apps/backend/src/routes/[module].ts
   - verifyJWT + checkRole middleware
   - Zod validation from shared schema
   - Prisma query + Winston logging
4. Shared Zod schema at packages/shared/zod-schemas/[module].ts
5. TypeScript types at packages/shared/types/[module].ts

Ensure pixel-perfect match to the Figma design system colors.
```

### `prompts/generate-component.md`

```
Read CLAUDE.md design tokens section.

Generate the [COMPONENT_NAME] React TypeScript component:
- Use exact Tailwind classes: bg-[#1565C0], text-[#2C2C2A], border-[#F1EFE8], rounded-xl
- Props: [LIST PROPS WITH TYPES]
- Match component spec in UI_DESIGN_SPEC.md
- Export as default with named TypeScript interface
- Include hover states and transitions
```

---

## Quick Reference: Figma → Tailwind Color Map

| Figma color | Hex | Tailwind |
|---|---|---|
| Navy (sidebar) | `#0D2B6A` | `bg-[#0D2B6A]` |
| Blue (primary) | `#1565C0` | `bg-[#1565C0]` |
| Sky (accent) | `#2196F3` | `text-[#2196F3]` |
| Sky Light | `#E3EFFF` | `bg-[#E3EFFF]` |
| Success | `#1D9E75` | `text-[#1D9E75]` |
| Success bg | `#E0F5EE` | `bg-[#E0F5EE]` |
| Warning | `#EF9F27` | `text-[#EF9F27]` |
| Warning bg | `#FAF0DC` | `bg-[#FAF0DC]` |
| Danger | `#E24B4A` | `text-[#E24B4A]` |
| Danger bg | `#FCEBEB` | `bg-[#FCEBEB]` |
| Purple | `#7F77DD` | `text-[#7F77DD]` |
| Purple bg | `#EEEDFE` | `bg-[#EEEDFE]` |
| Page bg | `#F1F4F8` | `bg-[#F1F4F8]` |
| Card border | `#F1EFE8` | `border-[#F1EFE8]` |
| Text primary | `#2C2C2A` | `text-[#2C2C2A]` |
| Text secondary | `#888780` | `text-[#888780]` |
| Table header | `#F1EFE8` | `bg-[#F1EFE8]` |

---

*UI_DESIGN_SPEC.md — Data Networks Engineering · April 2026*
