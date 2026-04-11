/**
 * ALM calculation engine — reference implementations of
 * liquidity gap, IRRBB, LCR, NSFR and FTP curve.
 *
 * Figures seeded from the `DataNetworks-ALM_Current_vs_Future-Ver1.pdf` PRD.
 * In production these would come from Prisma models sourced from the DWH.
 */

export type TimeBucket =
  | 'SIGHT'
  | '1M'
  | '3M'
  | '6M'
  | '1Y'
  | '3Y'
  | '5Y'
  | '5Y+'

export const DEFAULT_BUCKETS: TimeBucket[] = ['SIGHT', '1M', '3M', '6M', '1Y', '3Y', '5Y', '5Y+']

export interface ALMItem {
  name: string
  amount: number            // ₹ in absolute rupees
  bucket: TimeBucket
  rate: number              // annualised interest rate
  rateSensitive: boolean    // re-prices within 1Y?
}

// Seed portfolio — representative ₹1,500 Cr balance sheet
export const DEFAULT_ASSETS: ALMItem[] = [
  { name: 'Cash & reserves',        amount: 1_200_000_000, bucket: 'SIGHT', rate: 0.00,  rateSensitive: true  },
  { name: 'Gov securities',         amount: 2_300_000_000, bucket: '1Y',    rate: 0.068, rateSensitive: true  },
  { name: 'Corporate bonds',        amount: 1_800_000_000, bucket: '3Y',    rate: 0.085, rateSensitive: false },
  { name: 'Retail loans (float)',   amount: 4_200_000_000, bucket: '1Y',    rate: 0.105, rateSensitive: true  },
  { name: 'Retail loans (fixed)',   amount: 3_100_000_000, bucket: '5Y',    rate: 0.092, rateSensitive: false },
  { name: 'Corporate loans',        amount: 2_800_000_000, bucket: '3Y',    rate: 0.096, rateSensitive: true  },
  { name: 'Mortgages',              amount: 1_600_000_000, bucket: '5Y+',   rate: 0.082, rateSensitive: false },
]

export const DEFAULT_LIABILITIES: ALMItem[] = [
  { name: 'Demand deposits',        amount: 3_400_000_000, bucket: 'SIGHT', rate: 0.020, rateSensitive: true  },
  { name: 'Savings deposits',       amount: 4_800_000_000, bucket: '3M',    rate: 0.035, rateSensitive: true  },
  { name: 'Term deposits (short)',  amount: 2_200_000_000, bucket: '1Y',    rate: 0.065, rateSensitive: true  },
  { name: 'Term deposits (long)',   amount: 1_900_000_000, bucket: '3Y',    rate: 0.072, rateSensitive: false },
  { name: 'Inter-bank borrowings',  amount:   900_000_000, bucket: '1M',    rate: 0.058, rateSensitive: true  },
  { name: 'Subordinated debt',      amount:   700_000_000, bucket: '5Y+',   rate: 0.090, rateSensitive: false },
]

export interface LiquidityGapRow {
  bucket: TimeBucket
  inflows: number
  outflows: number
  gap: number
  cumulativeGap: number
}

export function computeLiquidityGap(
  buckets: TimeBucket[],
  assets: ALMItem[],
  liabilities: ALMItem[],
): LiquidityGapRow[] {
  let cumulative = 0
  return buckets.map(b => {
    const inflows = assets.filter(a => a.bucket === b).reduce((s, a) => s + a.amount, 0)
    const outflows = liabilities.filter(l => l.bucket === b).reduce((s, l) => s + l.amount, 0)
    const gap = inflows - outflows
    cumulative += gap
    return { bucket: b, inflows, outflows, gap, cumulativeGap: cumulative }
  })
}

export interface IRRBBScenario {
  shockBps: number
  shockLabel: string
  baselineNII: number
  shockedNII: number
  deltaNII: number
  deltaEVE: number           // Economic Value of Equity change
  pctOfCapital: number       // sensitivity as % of capital
}

/**
 * Earnings-at-risk style re-pricing shock.
 * ΔNII ≈ Σ rate-sensitive gap × shock × horizon.
 */
export function computeIRRBB(
  shockBps: number,
  assets: ALMItem[],
  liabilities: ALMItem[],
): IRRBBScenario {
  const shock = shockBps / 10_000
  const rsa = assets.filter(a => a.rateSensitive).reduce((s, a) => s + a.amount, 0)
  const rsl = liabilities.filter(l => l.rateSensitive).reduce((s, l) => s + l.amount, 0)
  const baselineNII = assets.reduce((s, a) => s + a.amount * a.rate, 0)
                    - liabilities.reduce((s, l) => s + l.amount * l.rate, 0)
  const deltaNII = (rsa - rsl) * shock
  const shockedNII = baselineNII + deltaNII

  // Duration-based EVE approximation
  const durationA = 2.4
  const durationL = 1.6
  const modifiedDurA = durationA / (1 + 0.07)
  const modifiedDurL = durationL / (1 + 0.05)
  const deltaEVE =
    -modifiedDurA * rsa * shock + modifiedDurL * rsl * shock

  const capital = 3_500_000_000
  const pctOfCapital = (deltaEVE / capital) * 100

  return {
    shockBps,
    shockLabel: shockBps === 0 ? 'Base' : `${shockBps > 0 ? '+' : ''}${shockBps} bps`,
    baselineNII: Math.round(baselineNII),
    shockedNII: Math.round(shockedNII),
    deltaNII: Math.round(deltaNII),
    deltaEVE: Math.round(deltaEVE),
    pctOfCapital: Number(pctOfCapital.toFixed(2)),
  }
}

export interface FTPPoint {
  tenor: string
  tenorMonths: number
  baseRate: number      // risk-free
  liquiditySpread: number
  creditSpread: number
  ftpRate: number       // total transfer rate
}

export function computeFTPCurve(): FTPPoint[] {
  const points: { tenor: string; months: number; base: number }[] = [
    { tenor: '1M',  months: 1,   base: 0.0550 },
    { tenor: '3M',  months: 3,   base: 0.0580 },
    { tenor: '6M',  months: 6,   base: 0.0615 },
    { tenor: '1Y',  months: 12,  base: 0.0660 },
    { tenor: '2Y',  months: 24,  base: 0.0705 },
    { tenor: '3Y',  months: 36,  base: 0.0740 },
    { tenor: '5Y',  months: 60,  base: 0.0780 },
    { tenor: '7Y',  months: 84,  base: 0.0805 },
    { tenor: '10Y', months: 120, base: 0.0830 },
  ]
  return points.map(p => {
    const liquiditySpread = 0.0020 + (p.months / 120) * 0.0060
    const creditSpread = 0.0050 + (p.months / 120) * 0.0080
    return {
      tenor: p.tenor,
      tenorMonths: p.months,
      baseRate: Number((p.base * 100).toFixed(3)),
      liquiditySpread: Number((liquiditySpread * 100).toFixed(3)),
      creditSpread: Number((creditSpread * 100).toFixed(3)),
      ftpRate: Number(((p.base + liquiditySpread + creditSpread) * 100).toFixed(3)),
    }
  })
}

export interface LCRResult {
  ratio: number           // percent
  hqla: number
  netCashOutflows: number
  regulatoryMinimum: number
  compliant: boolean
}

export function computeLCR(): LCRResult {
  const hqla = 3_500_000_000
  const netCashOutflows = 2_700_000_000
  const ratio = (hqla / netCashOutflows) * 100
  return {
    ratio,
    hqla,
    netCashOutflows,
    regulatoryMinimum: 100,
    compliant: ratio >= 100,
  }
}

export interface NSFRResult {
  ratio: number
  availableStableFunding: number
  requiredStableFunding: number
  regulatoryMinimum: number
  compliant: boolean
}

export function computeNSFR(): NSFRResult {
  const asf = 10_800_000_000
  const rsf = 9_200_000_000
  const ratio = (asf / rsf) * 100
  return {
    ratio,
    availableStableFunding: asf,
    requiredStableFunding: rsf,
    regulatoryMinimum: 100,
    compliant: ratio >= 100,
  }
}
