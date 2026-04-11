import { PrismaClient, Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'node:crypto'

const prisma = new PrismaClient()

// ── helpers ───────────────────────────────────────────────────────────────
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000)
const daysAhead = (n: number) => new Date(Date.now() + n * 86400000)
const dec = (n: number | string) => new Prisma.Decimal(n)
const pick = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]!
const randomBetween = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min

function bucketFromDpd(dpd: number): 'BUCKET_0_30' | 'BUCKET_31_60' | 'BUCKET_61_90' | 'BUCKET_90_PLUS' {
  if (dpd <= 30) return 'BUCKET_0_30'
  if (dpd <= 60) return 'BUCKET_31_60'
  if (dpd <= 90) return 'BUCKET_61_90'
  return 'BUCKET_90_PLUS'
}

function stageFromDpd(dpd: number): number {
  if (dpd <= 30) return 1
  if (dpd <= 90) return 2
  return 3
}

function statusFromDpd(dpd: number): 'ACTIVE' | 'NPA' {
  return dpd > 90 ? 'NPA' : 'ACTIVE'
}

function pdFromDpd(dpd: number): number {
  if (dpd > 90) return 0.75
  if (dpd > 60) return 0.45
  if (dpd > 30) return 0.20
  return 0.05
}

function riskLevel(pd: number): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (pd >= 0.7) return 'HIGH'
  if (pd >= 0.45) return 'MEDIUM'
  return 'LOW'
}

// ── main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log('🌱 Seeding demo data…')

  const passwordHash = await bcrypt.hash('Demo@123', 10)

  // 1. Tenant ──────────────────────────────────────────────────────────────
  const tenant = await prisma.tenant.upsert({
    where: { code: 'DEMO' },
    update: {},
    create: {
      name: 'Demo Bank',
      code: 'DEMO',
      country: 'IN',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
    },
  })
  console.log(`  ✓ Tenant: ${tenant.name}`)

  // 2. Staff users ─────────────────────────────────────────────────────────
  const staffUsers = [
    { email: 'admin@demo.bank',      name: 'Demo Admin',         role: 'SUPER_ADMIN'        as const },
    { email: 'manager@demo.bank',    name: 'Branch Manager',     role: 'BRANCH_MANAGER'     as const },
    { email: 'officer@demo.bank',    name: 'Loan Officer',       role: 'LOAN_OFFICER'       as const },
    { email: 'analyst@demo.bank',    name: 'Credit Analyst',     role: 'CREDIT_ANALYST'     as const },
    { email: 'risk@demo.bank',       name: 'Risk Analyst',       role: 'RISK_ANALYST'       as const },
    { email: 'compliance@demo.bank', name: 'Compliance Officer', role: 'COMPLIANCE_OFFICER' as const },
    { email: 'collector@demo.bank',  name: 'Collection Agent',   role: 'COLLECTION_AGENT'   as const },
  ]
  const staffMap: Record<string, string> = {}
  for (const u of staffUsers) {
    const created = await prisma.user.upsert({
      where: { tenantId_email: { tenantId: tenant.id, email: u.email } },
      update: {},
      create: { tenantId: tenant.id, email: u.email, passwordHash, name: u.name, role: u.role, branchId: 'BR-BLR-001', isActive: true },
    })
    staffMap[u.role] = created.id
  }
  console.log(`  ✓ Staff users: ${staffUsers.length}`)

  const officerId    = staffMap['LOAN_OFFICER']!
  const analystId    = staffMap['CREDIT_ANALYST']!
  const managerId    = staffMap['BRANCH_MANAGER']!
  const collectorId  = staffMap['COLLECTION_AGENT']!
  const complianceId = staffMap['COMPLIANCE_OFFICER']!

  // 3. Customers ───────────────────────────────────────────────────────────
  const customerSeeds = [
    { customerId: 'CUS-0001', fullName: 'Asha Verma',       email: 'customer@demo.bank', mobile: '+919876543210', grade: 'A', city: 'Bengaluru' },
    { customerId: 'CUS-0002', fullName: 'Rahul Mehta',      email: 'rahul@example.com',  mobile: '+919876500001', grade: 'B', city: 'Mumbai'    },
    { customerId: 'CUS-0003', fullName: 'Priya Nair',       email: 'priya@example.com',  mobile: '+919876500002', grade: 'A', city: 'Chennai'   },
    { customerId: 'CUS-0004', fullName: 'Vikram Singh',     email: 'vikram@example.com', mobile: '+919876500003', grade: 'C', city: 'Delhi'     },
    { customerId: 'CUS-0005', fullName: 'Neha Kapoor',      email: 'neha@example.com',   mobile: '+919876500004', grade: 'B', city: 'Pune'      },
    { customerId: 'CUS-0006', fullName: 'Arjun Reddy',      email: 'arjun@example.com',  mobile: '+919876500005', grade: 'D', city: 'Hyderabad' },
    { customerId: 'CUS-0007', fullName: 'Sanjay Gupta',     email: 'sanjay@example.com', mobile: '+919876500006', grade: 'C', city: 'Kolkata'   },
    { customerId: 'CUS-0008', fullName: 'Divya Iyer',       email: 'divya@example.com',  mobile: '+919876500007', grade: 'A', city: 'Ahmedabad' },
    { customerId: 'CUS-0009', fullName: 'Karthik Raman',    email: 'karthik@example.com',mobile: '+919876500008', grade: 'B', city: 'Jaipur'    },
    { customerId: 'CUS-0010', fullName: 'Meera Joshi',      email: 'meera@example.com',  mobile: '+919876500009', grade: 'D', city: 'Lucknow'   },
  ]

  const customers: Awaited<ReturnType<typeof prisma.customer.upsert>>[] = []
  for (const c of customerSeeds) {
    const created = await prisma.customer.upsert({
      where: { tenantId_customerId: { tenantId: tenant.id, customerId: c.customerId } },
      update: {},
      create: {
        tenantId: tenant.id,
        customerId: c.customerId,
        fullName: c.fullName,
        email: c.email,
        mobile: c.mobile,
        nationalId: `AADHAAR-${c.customerId}`,
        dateOfBirth: new Date(`19${randomBetween(70, 95)}-${String(randomBetween(1, 12)).padStart(2, '0')}-${String(randomBetween(1, 28)).padStart(2, '0')}`),
        address: `${randomBetween(1, 999)} Main Road`,
        city: c.city,
        country: 'IN',
        kycStatus: 'VERIFIED',
        kycVerifiedAt: daysAgo(randomBetween(30, 365)),
        kycExpiresAt: daysAhead(randomBetween(60, 700)),
        riskGrade: c.grade,
        branchId: 'BR-BLR-001',
        createdBy: 'SEED',
      },
    })
    customers.push(created)
  }
  console.log(`  ✓ Customers: ${customers.length}`)

  // 4. Portal user (first customer) ────────────────────────────────────────
  await prisma.portalUser.upsert({
    where: { customerId: customers[0]!.id },
    update: {},
    create: {
      tenantId: tenant.id,
      customerId: customers[0]!.id,
      email: 'customer@demo.bank',
      passwordHash,
      isActive: true,
    },
  })
  console.log(`  ✓ Portal user: customer@demo.bank`)

  // 5. Loans + repayment schedules ─────────────────────────────────────────
  const products = ['PERSONAL', 'HOME', 'VEHICLE', 'BUSINESS', 'AGRICULTURE']
  const loanSeeds = customers.map((cust, i) => {
    const dpd = i === 0 ? 0 : i === 1 ? 15 : i === 2 ? 0 : i === 3 ? 45 : i === 4 ? 10
             : i === 5 ? 120 : i === 6 ? 75 : i === 7 ? 5 : i === 8 ? 35 : 95
    const amount = randomBetween(100_000, 5_000_000)
    const outstanding = Math.round(amount * (0.4 + Math.random() * 0.5))
    return {
      customerId: cust.id,
      customerCode: cust.customerId,
      loanId: `LN-${String(i + 1).padStart(4, '0')}`,
      productType: pick(products),
      amount,
      outstandingBalance: outstanding,
      interestRate: 0.085 + Math.random() * 0.08,
      tenureMonths: pick([12, 24, 36, 48, 60, 120, 180, 240]),
      dpd,
    }
  })

  const loans: Awaited<ReturnType<typeof prisma.loan.upsert>>[] = []
  for (const l of loanSeeds) {
    const loan = await prisma.loan.upsert({
      where: { tenantId_loanId: { tenantId: tenant.id, loanId: l.loanId } },
      update: {},
      create: {
        tenantId: tenant.id,
        loanId: l.loanId,
        customerId: l.customerId,
        productType: l.productType,
        amount: dec(l.amount),
        disbursedAmount: dec(l.amount),
        outstandingBalance: dec(l.outstandingBalance),
        interestRate: dec(l.interestRate.toFixed(4)),
        tenureMonths: l.tenureMonths,
        dpd: l.dpd,
        bucket: bucketFromDpd(l.dpd),
        stage: stageFromDpd(l.dpd),
        status: statusFromDpd(l.dpd),
        branchId: 'BR-BLR-001',
        officerId,
        disbursedAt: daysAgo(randomBetween(90, 720)),
        maturityDate: daysAhead(l.tenureMonths * 30),
        createdBy: officerId,
      },
    })
    loans.push(loan)

    // Repayment schedule — next 6 installments
    const emi = Math.round(l.amount / l.tenureMonths * 1.15)
    for (let k = 1; k <= 6; k++) {
      const due = daysAhead(k * 30 - 15)
      const already = await prisma.repaymentSchedule.findFirst({ where: { loanId: loan.id, installment: k } })
      if (already) continue
      await prisma.repaymentSchedule.create({
        data: {
          tenantId: tenant.id,
          loanId: loan.id,
          installment: k,
          dueDate: due,
          principal: dec(Math.round(emi * 0.7)),
          interest: dec(Math.round(emi * 0.3)),
          totalDue: dec(emi),
          status: 'PENDING',
        },
      })
    }
  }
  console.log(`  ✓ Loans: ${loans.length} (+ ${loans.length * 6} repayments)`)

  // 6. Loan Applications ──────────────────────────────────────────────────
  const appStatuses = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'DISBURSED'] as const
  for (let i = 0; i < 8; i++) {
    const cust = customers[i % customers.length]!
    const status = appStatuses[i % appStatuses.length]!
    const appId = `APP-${String(i + 1).padStart(4, '0')}`
    const amount = randomBetween(50_000, 2_000_000)
    await prisma.loanApplication.upsert({
      where: { tenantId_applicationId: { tenantId: tenant.id, applicationId: appId } },
      update: {},
      create: {
        tenantId: tenant.id,
        applicationId: appId,
        customerId: cust.id,
        productType: pick(products),
        purpose: pick(['Home renovation', 'Business expansion', 'Vehicle purchase', 'Education', 'Medical']),
        requestedAmount: dec(amount),
        requestedTenure: pick([12, 24, 36, 60]),
        approvedAmount: status === 'APPROVED' || status === 'DISBURSED' ? dec(Math.round(amount * 0.9)) : null,
        creditScore: randomBetween(600, 820),
        pdScore: dec((0.05 + Math.random() * 0.4).toFixed(3)),
        status,
        officerId,
        reviewerId: status !== 'SUBMITTED' ? analystId : null,
        branchId: 'BR-BLR-001',
        submittedAt: daysAgo(randomBetween(1, 30)),
        reviewedAt: status !== 'SUBMITTED' ? daysAgo(randomBetween(0, 20)) : null,
        comments: status === 'REJECTED' ? 'FOIR exceeds 50%' : 'Standard review',
        createdBy: officerId,
      },
    })
  }
  console.log(`  ✓ Loan applications: 8`)

  // 7. EWS Alerts — for loans with DPD > 30 ────────────────────────────────
  const ewsIndicators = [
    ['high_dpd', 'balance_drop'],
    ['cheque_return', 'utilization_high'],
    ['dpd_breach', 'income_drop'],
    ['balance_drop', 'salary_delay'],
    ['high_utilization', 'cheque_return', 'dpd_breach'],
  ]
  let ewsCount = 0
  for (const loan of loans) {
    if (loan.dpd < 15) continue
    const pd = pdFromDpd(loan.dpd)
    const alertId = `EWS-${String(ewsCount + 1).padStart(4, '0')}`
    await prisma.eWSAlert.upsert({
      where: { tenantId_alertId: { tenantId: tenant.id, alertId } },
      update: {},
      create: {
        tenantId: tenant.id,
        alertId,
        customerId: loan.customerId,
        loanId: loan.id,
        riskLevel: riskLevel(pd),
        pdScore: dec(pd.toFixed(3)),
        indicators: pick(ewsIndicators),
        dpd: loan.dpd,
        outstandingBalance: loan.outstandingBalance,
        status: ewsCount % 4 === 0 ? 'RESOLVED' : ewsCount % 3 === 0 ? 'ASSIGNED' : 'OPEN',
        assignedTo: ewsCount % 3 === 0 ? staffMap['RISK_ANALYST']! : null,
        createdBy: 'SEED',
      },
    })
    ewsCount++
  }
  console.log(`  ✓ EWS alerts: ${ewsCount}`)

  // 8. AML Alerts ──────────────────────────────────────────────────────────
  const txnTypes = ['CASH', 'TRANSFER', 'REMITTANCE', 'CRYPTO']
  const countries = ['IN', 'AE', 'US', 'SG', 'CH', 'PK', 'IR', 'BD']
  const reasonsPool = [
    ['high_risk_country', 'large_amount'],
    ['structuring_pattern', 'frequent_txns'],
    ['crypto_conversion', 'new_beneficiary'],
    ['large_cash_deposit'],
    ['sanctioned_country', 'pep_related'],
  ]
  for (let i = 0; i < 12; i++) {
    const amount = randomBetween(5_000, 500_000)
    const riskScore = randomBetween(40, 95)
    const level = riskScore > 75 ? 'HIGH' : riskScore > 50 ? 'MEDIUM' : 'LOW'
    const alertId = `AML-${String(i + 1).padStart(4, '0')}`
    await prisma.aMLAlert.upsert({
      where: { tenantId_alertId: { tenantId: tenant.id, alertId } },
      update: {},
      create: {
        tenantId: tenant.id,
        alertId,
        txnId: `TXN-${randomUUID().slice(0, 8).toUpperCase()}`,
        customerId: customers[i % customers.length]!.id,
        amount: dec(amount),
        currency: 'INR',
        country: pick(countries),
        txnType: pick(txnTypes),
        riskLevel: level as 'HIGH' | 'MEDIUM' | 'LOW',
        riskScore,
        reasons: pick(reasonsPool),
        status: i % 5 === 0 ? 'FILED_STR' : i % 4 === 0 ? 'CLEARED' : i % 3 === 0 ? 'UNDER_REVIEW' : 'OPEN',
        assignedTo: complianceId,
      },
    })
  }
  console.log(`  ✓ AML alerts: 12`)

  // 9. STR Reports — for HIGH risk AML ─────────────────────────────────────
  const highRiskAmls = await prisma.aMLAlert.findMany({
    where: { tenantId: tenant.id, status: 'FILED_STR' },
    take: 5,
  })
  for (let i = 0; i < highRiskAmls.length; i++) {
    const alert = highRiskAmls[i]!
    const reportId = `STR-${String(i + 1).padStart(4, '0')}`
    const existing = await prisma.sTRReport.findUnique({ where: { alertId: alert.id } })
    if (existing) continue
    await prisma.sTRReport.create({
      data: {
        tenantId: tenant.id,
        reportId,
        customerId: alert.customerId,
        alertId: alert.id,
        amount: alert.amount,
        description: `Suspicious transaction pattern flagged by AML engine. Risk score: ${alert.riskScore}. Reasons: ${alert.reasons.join(', ')}`,
        filedBy: complianceId,
        approvedBy: managerId,
        status: 'FILED',
        filedAt: daysAgo(randomBetween(1, 30)),
      },
    })
  }
  console.log(`  ✓ STR reports: ${highRiskAmls.length}`)

  // 10. Documents ──────────────────────────────────────────────────────────
  const docTypes = ['NATIONAL_ID', 'ADDRESS_PROOF', 'INCOME_PROOF', 'BANK_STATEMENT', 'PHOTO'] as const
  const docStatuses = ['APPROVED', 'PENDING_REVIEW', 'PENDING_OCR', 'APPROVED', 'APPROVED'] as const
  let docCount = 0
  for (const cust of customers.slice(0, 6)) {
    for (const dt of docTypes) {
      const docId = `DOC-${String(docCount + 1).padStart(5, '0')}`
      const hash = `sha256-${randomUUID().replace(/-/g, '')}`
      await prisma.document.upsert({
        where: { tenantId_docId: { tenantId: tenant.id, docId } },
        update: {},
        create: {
          tenantId: tenant.id,
          docId,
          customerId: cust.id,
          docType: dt,
          fileName: `${cust.customerId}_${dt.toLowerCase()}.pdf`,
          fileSize: randomBetween(50_000, 2_000_000),
          mimeType: 'application/pdf',
          storageUrl: `s3://demo-bucket/${docId}.pdf`,
          sha256Hash: hash,
          ocrConfidence: dec((0.85 + Math.random() * 0.14).toFixed(3)),
          ocrData: { name: cust.fullName, customerId: cust.customerId } as Prisma.InputJsonValue,
          status: docStatuses[docCount % docStatuses.length]!,
          uploadedBy: officerId,
          reviewedBy: docCount % 2 === 0 ? managerId : null,
          reviewedAt: docCount % 2 === 0 ? daysAgo(randomBetween(1, 30)) : null,
          expiresAt: daysAhead(randomBetween(180, 720)),
        },
      })
      docCount++
    }
  }
  console.log(`  ✓ Documents: ${docCount}`)

  // 11. Collection cases — for loans with DPD > 30 ─────────────────────────
  const nbaPool = ['FIELD_VISIT', 'PHONE_CALL', 'SMS', 'EMAIL', 'LEGAL_NOTICE'] as const
  let caseCount = 0
  for (const loan of loans) {
    if (loan.dpd < 30) continue
    const caseId = `CASE-${String(caseCount + 1).padStart(4, '0')}`
    const collCase = await prisma.collectionCase.upsert({
      where: { tenantId_caseId: { tenantId: tenant.id, caseId } },
      update: {},
      create: {
        tenantId: tenant.id,
        caseId,
        loanId: loan.id,
        customerId: loan.customerId,
        dpd: loan.dpd,
        bucket: loan.bucket,
        outstandingAmount: loan.outstandingBalance,
        nba: loan.dpd > 90 ? 'LEGAL_NOTICE' : loan.dpd > 60 ? 'FIELD_VISIT' : pick(nbaPool),
        assignedAgentId: collectorId,
        status: caseCount % 4 === 0 ? 'PAYMENT_RECEIVED' : caseCount % 3 === 0 ? 'IN_PROGRESS' : 'OPEN',
        lastActivityAt: daysAgo(randomBetween(0, 15)),
        createdBy: 'SEED',
      },
    })
    caseCount++

    // Add a payment for PAYMENT_RECEIVED cases
    if (collCase.status === 'PAYMENT_RECEIVED') {
      const payId = `PAY-${String(caseCount).padStart(4, '0')}`
      const existingPay = await prisma.payment.findUnique({
        where: { tenantId_paymentId: { tenantId: tenant.id, paymentId: payId } },
      })
      if (!existingPay) {
        await prisma.payment.create({
          data: {
            tenantId: tenant.id,
            paymentId: payId,
            caseId: collCase.id,
            loanId: loan.id,
            customerId: loan.customerId,
            amount: dec(Math.round(Number(loan.outstandingBalance) * 0.1)),
            paymentMode: pick(['CASH', 'UPI', 'NEFT', 'CHEQUE']),
            receivedBy: collectorId,
            gpsLat: dec((12.9 + Math.random() * 0.2).toFixed(6)),
            gpsLng: dec((77.5 + Math.random() * 0.2).toFixed(6)),
          },
        })
      }
    }
  }
  console.log(`  ✓ Collection cases: ${caseCount}`)

  // 12. IFRS 9 staging ─────────────────────────────────────────────────────
  const batchId = `BATCH-${new Date().toISOString().slice(0, 10)}`
  let ifrsCount = 0
  for (const loan of loans) {
    const pd = pdFromDpd(loan.dpd)
    const lgd = 0.45
    const ead = Number(loan.outstandingBalance)
    const ecl = pd * lgd * ead
    const existing = await prisma.iFRSStaging.findFirst({
      where: { tenantId: tenant.id, loanId: loan.id, batchId },
    })
    if (existing) continue
    await prisma.iFRSStaging.create({
      data: {
        tenantId: tenant.id,
        loanId: loan.id,
        customerId: loan.customerId,
        stage: loan.stage,
        pdScore: dec(pd.toFixed(3)),
        lgd: dec(lgd.toFixed(3)),
        ead: dec(ead.toFixed(2)),
        ecl: dec(ecl.toFixed(2)),
        batchId,
      },
    })
    ifrsCount++
  }
  console.log(`  ✓ IFRS9 staging rows: ${ifrsCount}`)

  // ── summary ─────────────────────────────────────────────────────────────
  console.log('\n✅ Seed complete\n')
  console.log('┌─────────────────────────────────────────────────────┐')
  console.log('│  Staff portal → http://localhost:5173               │')
  console.log('│    admin@demo.bank        / Demo@123 (SUPER_ADMIN)  │')
  console.log('│    manager@demo.bank      / Demo@123 (BRANCH_MGR)   │')
  console.log('│    officer@demo.bank      / Demo@123 (LOAN_OFFICER) │')
  console.log('│    analyst@demo.bank      / Demo@123 (CREDIT)       │')
  console.log('│    risk@demo.bank         / Demo@123 (RISK)         │')
  console.log('│    compliance@demo.bank   / Demo@123                │')
  console.log('│    collector@demo.bank    / Demo@123 (COLLECTION)   │')
  console.log('│                                                     │')
  console.log('│  Customer portal → http://localhost:5174            │')
  console.log('│    customer@demo.bank     / Demo@123                │')
  console.log('│                                                     │')
  console.log('│  Tenant code (if prompted): DEMO                    │')
  console.log('└─────────────────────────────────────────────────────┘\n')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
