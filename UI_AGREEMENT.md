# UI Agreement — Data Networks Enterprise Banking Platform v2.0
> This is the binding UI contract between design, frontend engineering, and product.
> No screen ships unless it satisfies every rule in this document.

---

## 1. DESIGN SOURCE OF TRUTH

| Item | Value |
|---|---|
| Figma file | `mnz58vWYsPKf7NUXCLLc8w` |
| Token file | `src/styles/tokens.ts` |
| Tailwind config | `tailwind.config.ts` |
| Component spec | `UI_DESIGN_SPEC.md` |

**Rule:** If Figma disagrees with CLAUDE.md, Figma wins. If code disagrees with either, code loses.

---

## 2. COLOR CONTRACT — NEVER DEVIATE

| Purpose | Hex | Token | Tailwind |
|---|---|---|---|
| Sidebar background | `#0D2B6A` | `navy` | `bg-[#0D2B6A]` |
| Primary action | `#1565C0` | `blue` | `bg-[#1565C0]` |
| Sky accent | `#2196F3` | `sky` | `text-[#2196F3]` |
| Sky light bg | `#E3EFFF` | `skyLight` | `bg-[#E3EFFF]` |
| Success | `#1D9E75` | `success` | `text-[#1D9E75]` |
| Success bg | `#E0F5EE` | `successBg` | `bg-[#E0F5EE]` |
| Warning | `#EF9F27` | `warning` | `text-[#EF9F27]` |
| Warning bg | `#FAF0DC` | `warningBg` | `bg-[#FAF0DC]` |
| Danger | `#E24B4A` | `danger` | `text-[#E24B4A]` |
| Danger bg | `#FCEBEB` | `dangerBg` | `bg-[#FCEBEB]` |
| Purple | `#7F77DD` | `purple` | `text-[#7F77DD]` |
| Purple bg | `#EEEDFE` | `purpleBg` | `bg-[#EEEDFE]` |
| Primary text | `#2C2C2A` | `gray900` | `text-[#2C2C2A]` |
| Secondary text | `#888780` | `gray500` | `text-[#888780]` |
| Borders | `#D3D1C7` | `gray200` | `border-[#D3D1C7]` |
| Card border | `#F1EFE8` | `gray100` | `border-[#F1EFE8]` |
| Table header bg | `#F1EFE8` | `gray100` | `bg-[#F1EFE8]` |
| Page background | `#F1F4F8` | `pageBg` | `bg-[#F1F4F8]` |
| Card background | `#FFFFFF` | `white` | `bg-white` |

**Enforcement:**
- No raw hex in TSX files — always use Tailwind arbitrary values mapped to tokens
- No `bg-blue-500` or `text-red-600` — only design token values
- PR reviewers MUST reject any color not in this table

---

## 3. TYPOGRAPHY CONTRACT

| Name | Size | Weight | Font | Usage |
|---|---|---|---|---|
| H1 | 28px | 700 Bold | Inter | Page titles (rare, top-level only) |
| H2 | 20px | 600 SemiBold | Inter | Section headings, greeting text |
| H3 | 16px | 600 SemiBold | Inter | Card titles, topbar title |
| Body | 14px | 400 Regular | Inter | Descriptions, table body text |
| Small | 13px | 400 Regular | Inter | Form labels, secondary text, nav items |
| Caption | 12px | 400 Regular | Inter | Metadata, timestamps, subtitles |
| Micro | 11px | 500 Medium | Inter | Badges, status pills, table headers |
| Mono | 12px | 400 Regular | JetBrains Mono | Customer IDs, API paths, code |

**Rules:**
- Only Inter and JetBrains Mono — no system fonts, no Google Fonts alternatives
- Module labels in Topbar: 10px SemiBold, sky blue, uppercase, letter-spacing wide
- Never go below 11px except for internal dev labels

---

## 4. LAYOUT CONTRACT

### App Shell (non-negotiable)
```
Sidebar:    220px fixed width, full height, bg #0D2B6A
Topbar:     58px fixed height, bg white, 1px bottom border #F1EFE8
Main:       calc(100vw - 220px), flex-col, overflow-y-auto
Page:       padding 24px all sides (p-6)
```

### Grid System
```
Metric cards:  grid-cols-5, gap-3 (12px), 5 always on desktop
Mid sections:  grid-cols-12 with col-span assignments per screen
Mobile:        grid-cols-2 for metric cards, grid-cols-1 for content
```

### Spacing Rules
```
Section gap:      mb-5 (20px) between major sections
Card gap:         gap-3 (12px) between cards in grid
Form group gap:   gap-6 (24px) between field groups
Form field gap:   gap-4 (16px) between fields within a group
Table row height: h-10 (40px) body rows, py-2 (8px) header rows
```

---

## 5. COMPONENT CONTRACT

### MetricCard
- Always 5 per row on desktop
- White bg, `border border-[#F1EFE8]`, `rounded-xl`, `p-4`
- Value: 24px Bold `text-[#2C2C2A]`
- Sub pill: 10px Medium, colored by variant, `rounded-[10px]`
- Never use this component outside the top metric row

### DataTable
- Always wrapped in `rounded-xl border border-[#F1EFE8] bg-white overflow-hidden`
- Header: `bg-[#F1EFE8]` with 11px SemiBold `text-[#5F5E5A]`
- Body rows: alternating white / `#F1F4F8`, height `h-10`
- Action button: `bg-[#E3EFFF] text-[#1565C0]` "View →" 11px Medium
- Virtual scroll required for >50 rows (@tanstack/react-virtual)

### RiskBadge
```
HIGH:    bg #FCEBEB  text #E24B4A
MEDIUM:  bg #FAF0DC  text #EF9F27
LOW:     bg #E0F5EE  text #1D9E75
LIVE:    bg #E0F5EE  text #1D9E75
UAT:     bg #FAF0DC  text #EF9F27
DEV:     bg #EEEDFE  text #7F77DD
PENDING: bg #FAF0DC  text #EF9F27
FILED:   bg #E0F5EE  text #1D9E75
```
- Padding: `px-[9px] py-[3px]`
- Font: 11px Medium
- Border-radius: `rounded-[11px]`

### Buttons
```
Primary:   bg-[#1565C0] text-white          hover:bg-[#0D4FA0]
Secondary: bg-[#E3EFFF] text-[#1565C0]     hover:bg-[#C8DEFF]
Danger:    bg-[#E24B4A] text-white          hover:bg-[#C73534]
Success:   bg-[#1D9E75] text-white          hover:bg-[#167A5C]
```
- All: `text-[13px] font-medium rounded-lg px-4 py-2 transition-colors`

### FormInput
- Height: `h-9` (36px)
- Border: `border border-[#D3D1C7] rounded-lg`
- Focus: `focus:ring-2 focus:ring-[#2196F3]/30 focus:border-[#2196F3]`
- Error: `border-[#E24B4A]` + 11px error text below

### SectionCard
- `bg-white border border-[#F1EFE8] rounded-xl p-4`
- Title: 14px SemiBold `text-[#2C2C2A]`
- Subtitle: 11px Regular `text-[#888780]` font-mono

---

## 6. INTERACTION CONTRACT

### States Required on Every Interactive Element
- **Default** — resting state
- **Hover** — `transition-colors` 150ms, color shift per variant
- **Focus** — visible focus ring (`focus:ring-2 focus:ring-[#2196F3]/30`)
- **Active** — pressed state (scale-down optional)
- **Disabled** — 50% opacity, `cursor-not-allowed`, no interactions
- **Loading** — spinner replaces label, button disabled

### Form Validation Rules
- Errors shown on **blur** (not on submit)
- Error message: 11px `text-[#E24B4A]`, shown below field
- Required fields: asterisk (*) in label
- Success: green border `border-[#1D9E75]` after successful save
- Auto-save draft: every 30 seconds for LOS and DMS forms

### Table Interactions
- Row hover: `bg-[#E3EFFF]/30`
- Row click: opens right-panel or modal (never full-page navigate)
- Sorting: click header → asc → desc → unsorted (icon indicator)

---

## 7. ACCESSIBILITY CONTRACT (WCAG 2.1 AA)

- All interactive elements keyboard-accessible (Tab + Enter/Space)
- ARIA labels on all icon-only buttons
- Color never the only status indicator (always pair with icon or text)
- Focus rings visible at all times (never `outline-none` without `focus:ring`)
- Minimum contrast: 4.5:1 for normal text, 3:1 for large text
- Touch targets: minimum 44×44px on mobile
- Screen reader tested: VoiceOver (macOS), NVDA (Windows)

---

## 8. RESPONSIVE CONTRACT

| Breakpoint | Sidebar | Grid | Notes |
|---|---|---|---|
| Desktop ≥1280px | 220px fixed | Full layout per spec | Primary target |
| Tablet 768–1279px | Collapsible (icon-only) | Simplified grid | Metric cards 2-col |
| Mobile <768px | Hidden (hamburger) | Single column | Collection PWA only |

**Rule:** The platform is primarily a desktop application. Mobile is only required for the Collection Agent PWA (`/cms/mobile`).

---

## 9. PERFORMANCE BUDGET

| Metric | Target | Tool |
|---|---|---|
| LCP | < 1.5s | Lighthouse CI |
| CLS | < 0.1 | Lighthouse CI |
| FID | < 100ms | Lighthouse CI |
| Initial bundle | < 500KB gzip | vite-bundle-analyzer |
| Per-module chunk | < 100KB gzip | vite-bundle-analyzer |
| Fonts loaded | Preloaded, swap | Chrome DevTools |

---

## 10. SCREEN CHECKLIST — SIGN-OFF REQUIRED

Every screen must pass all checks before merging:

- [ ] Colors match design tokens exactly (no rogue hex values)
- [ ] Typography uses correct size/weight per scale
- [ ] Layout uses correct grid and spacing values
- [ ] All 5 metric cards present on module dashboards
- [ ] DataTable has correct header/row styling
- [ ] RiskBadge colors match contract
- [ ] Hover and focus states present on all interactive elements
- [ ] Form validation shows errors on blur with correct style
- [ ] Loading skeleton shown while React Query fetches
- [ ] Empty state shown when data is null or empty array
- [ ] Module label and title in Topbar are correct
- [ ] Active nav item in Sidebar matches current route
- [ ] No console errors or TypeScript type errors
- [ ] Passes Lighthouse CI performance budget

---

*UI Agreement — Data Networks Engineering · April 2026*
