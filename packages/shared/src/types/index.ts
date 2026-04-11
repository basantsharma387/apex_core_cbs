// ─────────────────────────────────────────────────────────────────────────────
// Apex Banking Platform — Shared Domain Types
// ─────────────────────────────────────────────────────────────────────────────

// ── API envelope ─────────────────────────────────────────────────────────────

export interface APIResponse<T = unknown> {
  header: {
    status: 'SUCCESS' | 'ERROR'
    code: string
    message: string
    requestId: string
    timestamp: string
  }
  body: T
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface APIError {
  code: string
  message: string
  details?: Record<string, string[]>
}

// ── Auth & Users ──────────────────────────────────────────────────────────────

export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'RISK_ANALYST'
  | 'COMPLIANCE_OFFICER'
  | 'LOAN_OFFICER'
  | 'CREDIT_ANALYST'
  | 'BRANCH_MANAGER'
  | 'COLLECTION_AGENT'
  | 'COLLECTION_MANAGER'
  | 'AUDITOR'
  | 'CUSTOMER'

export interface User {
  id: string
  tenantId: string
  email: string
  name: string
  role: UserRole
  branchId?: string
  isActive: boolean
  createdAt: string
  lastLoginAt?: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface JWTPayload {
  sub: string
  tenantId: string
  role: UserRole
  email: string
  name: string
  customerId?: string   // populated for CUSTOMER portal tokens
  kycStatus?: string    // populated for CUSTOMER portal tokens
  iat: number
  exp: number
}

// ── Tenants ───────────────────────────────────────────────────────────────────

export interface Tenant {
  id: string
  name: string
  code: string
  country: string
  currency: string
  timezone: string
  isActive: boolean
  createdAt: string
}

// ── Customers ─────────────────────────────────────────────────────────────────

export interface Customer {
  id: string
  tenantId: string
  customerId: string
  fullName: string
  email: string
  mobile: string
  nationalId: string
  dateOfBirth: string
  address: string
  city: string
  country: string
  kycStatus: 'PENDING' | 'VERIFIED' | 'EXPIRED' | 'REJECTED'
  riskGrade: 'A' | 'B' | 'C' | 'D' | 'E'
  relationshipManagerId?: string
  branchId: string
  createdAt: string
  updatedAt: string
}

// ── Loans ─────────────────────────────────────────────────────────────────────

export type LoanStatus = 'ACTIVE' | 'DISBURSED' | 'CLOSED' | 'NPA' | 'RESTRUCTURED' | 'WRITTEN_OFF'
export type LoanStage = 1 | 2 | 3 // IFRS 9 stages
export type DPDBucket = '0-30' | '31-60' | '61-90' | '90+'

export interface Loan {
  id: string
  tenantId: string
  loanId: string
  customerId: string
  customerName: string
  productType: string
  amount: string // Decimal as string to avoid float precision
  disbursedAmount: string
  outstandingBalance: string
  interestRate: string
  tenureMonths: number
  dpd: number
  bucket: DPDBucket
  stage: LoanStage
  status: LoanStatus
  branchId: string
  officerId: string
  disbursedAt?: string
  maturityDate?: string
  createdAt: string
  updatedAt: string
}

export interface LoanApplication {
  id: string
  tenantId: string
  applicationId: string
  customerId: string
  customerName: string
  productType: string
  requestedAmount: string
  requestedTenure: number
  purpose: string
  status: 'DRAFT' | 'SUBMITTED' | 'SCORING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'DISBURSED'
  creditScore?: number
  pdScore?: number
  recommendedAmount?: string
  officerId: string
  reviewerId?: string
  branchId: string
  submittedAt?: string
  reviewedAt?: string
  createdAt: string
  updatedAt: string
}

// ── EWS ───────────────────────────────────────────────────────────────────────

export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW'
export type AlertStatus = 'OPEN' | 'ASSIGNED' | 'RESOLVED' | 'ESCALATED'

export interface EWSAlert {
  id: string
  tenantId: string
  alertId: string
  customerId: string
  customerName: string
  loanId: string
  riskLevel: RiskLevel
  pdScore: number
  indicators: string[]
  dpd: number
  outstandingBalance: string
  status: AlertStatus
  assignedTo?: string
  resolvedBy?: string
  resolvedAt?: string
  createdAt: string
  updatedAt: string
}

export interface RiskProfile {
  customerId: string
  customerName: string
  pdScore: number
  riskLevel: RiskLevel
  indicators: RiskIndicator[]
  scenarioResults: ScenarioResult[]
  loanCount: number
  totalExposure: string
  dpdHistory: number[]
}

export interface RiskIndicator {
  name: string
  value: string
  severity: RiskLevel
  description: string
}

export interface ScenarioResult {
  scenario: string
  impact: string
  newPdScore: number
  riskLevel: RiskLevel
}

// ── AML ───────────────────────────────────────────────────────────────────────

export type TransactionType = 'CASH_DEPOSIT' | 'CASH_WITHDRAWAL' | 'TRANSFER' | 'REMITTANCE' | 'CRYPTO' | 'TRADE'
export type AMLStatus = 'OPEN' | 'UNDER_REVIEW' | 'CLEARED' | 'FILED_STR' | 'FILED_CTR'

export interface AMLAlert {
  id: string
  tenantId: string
  alertId: string
  txnId: string
  customerId: string
  customerName: string
  amount: string
  currency: string
  country: string
  txnType: TransactionType
  riskLevel: RiskLevel
  riskScore: number
  reasons: string[]
  status: AMLStatus
  assignedTo?: string
  reviewedBy?: string
  createdAt: string
  updatedAt: string
}

export interface STRReport {
  id: string
  tenantId: string
  reportId: string
  customerId: string
  alertId: string
  amount: string
  description: string
  filedBy: string
  approvedBy?: string
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'FILED' | 'REJECTED'
  filedAt?: string
  createdAt: string
}

// ── DMS ───────────────────────────────────────────────────────────────────────

export type DocType = 'NATIONAL_ID' | 'PASSPORT' | 'DRIVING_LICENSE' | 'ADDRESS_PROOF' | 'INCOME_PROOF' | 'BANK_STATEMENT' | 'LOAN_FORM' | 'PHOTO'
export type DocStatus = 'PENDING_OCR' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'EXPIRED'

export interface Document {
  id: string
  tenantId: string
  docId: string
  customerId: string
  customerName: string
  docType: DocType
  fileName: string
  fileSize: number
  mimeType: string
  storageUrl: string
  ocrConfidence?: number
  ocrExtractedData?: Record<string, string>
  status: DocStatus
  uploadedBy: string
  reviewedBy?: string
  expiresAt?: string
  createdAt: string
  updatedAt: string
}

// ── CMS ───────────────────────────────────────────────────────────────────────

export type NBA = 'FIELD_VISIT' | 'PHONE_CALL' | 'SMS' | 'EMAIL' | 'LEGAL_NOTICE' | 'RESTRUCTURE'
export type CaseStatus = 'OPEN' | 'IN_PROGRESS' | 'PAYMENT_RECEIVED' | 'ESCALATED' | 'CLOSED' | 'WRITTEN_OFF'

export interface CollectionCase {
  id: string
  tenantId: string
  caseId: string
  loanId: string
  customerId: string
  customerName: string
  dpd: number
  bucket: DPDBucket
  outstandingAmount: string
  nba: NBA
  assignedAgentId?: string
  assignedAgentName?: string
  status: CaseStatus
  lastActivityAt?: string
  closedAt?: string
  createdAt: string
  updatedAt: string
}

export interface Payment {
  id: string
  tenantId: string
  paymentId: string
  caseId: string
  loanId: string
  customerId: string
  amount: string
  paymentMode: 'CASH' | 'BANK_TRANSFER' | 'QR' | 'CHEQUE'
  receivedBy: string
  gpsLat?: number
  gpsLng?: number
  receiptUrl?: string
  createdAt: string
}

// ── IFRS 9 ────────────────────────────────────────────────────────────────────

export interface IFRSStaging {
  id: string
  tenantId: string
  loanId: string
  customerId: string
  stage: LoanStage
  pdScore: number
  lgd: number
  ead: string
  ecl: string
  calculatedAt: string
  batchId: string
}

// ── Kafka Events ──────────────────────────────────────────────────────────────

export interface KafkaEvent<T = unknown> {
  eventId: string
  eventType: string
  timestamp: string
  tenantId: string
  payload: T
  headers: {
    correlationId: string
    source: string
    version: string
  }
}

// ── Portal (customer-facing) ──────────────────────────────────────────────────

export interface CustomerPortalUser {
  id: string
  customerId: string
  name: string
  email: string
  mobile: string
  kycStatus: Customer['kycStatus']
}

export interface PortalLoanSummary {
  loanId: string
  productType: string
  outstandingBalance: string
  emiAmount: string
  nextDueDate: string
  dpd: number
  status: LoanStatus
}

export interface PortalAccountSummary {
  customerId: string
  name: string
  loans: PortalLoanSummary[]
  totalExposure: string
  kycStatus: Customer['kycStatus']
  kycExpiresAt?: string
}
