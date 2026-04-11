import { z } from 'zod'

// ── Auth ──────────────────────────────────────────────────────────────────────

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  tenantCode: z.string().min(1, 'Tenant code is required'),
})

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
})

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8).max(128),
}).refine(d => d.currentPassword !== d.newPassword, {
  message: 'New password must differ from current password',
  path: ['newPassword'],
})

// ── Loan Application ──────────────────────────────────────────────────────────

export const LoanApplicationSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID'),
  productType: z.enum(['PERSONAL', 'HOME', 'VEHICLE', 'BUSINESS', 'AGRICULTURE', 'MICRO']),
  purpose: z.string().min(5).max(500),
  requestedAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount format'),
  requestedTenure: z.number().int().min(1).max(360),
  branchId: z.string().uuid(),
  monthlyIncome: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  existingEmi: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
})

export const LoanApprovalSchema = z.object({
  applicationId: z.string().uuid(),
  decision: z.enum(['APPROVE', 'REJECT']),
  approvedAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  comments: z.string().min(10, 'Approval comments must be at least 10 characters'),
})

// ── EWS ───────────────────────────────────────────────────────────────────────

export const EWSEvaluateSchema = z.object({
  customerId: z.string().uuid(),
  dpd: z.number().int().min(0),
  balanceDrop: z.number().min(0).max(100),
  chequeReturns: z.number().int().min(0).optional(),
  utilizationRate: z.number().min(0).max(100).optional(),
})

export const EWSAlertFilterSchema = z.object({
  riskLevel: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
  status: z.enum(['OPEN', 'ASSIGNED', 'RESOLVED', 'ESCALATED']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'pdScore', 'dpd']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
})

export const EWSResolveSchema = z.object({
  alertId: z.string().uuid(),
  resolution: z.string().min(10, 'Resolution notes must be at least 10 characters'),
})

// ── AML ───────────────────────────────────────────────────────────────────────

export const AMLMonitorSchema = z.object({
  txnId: z.string().min(1),
  customerId: z.string().uuid(),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
  currency: z.string().length(3),
  country: z.string().length(2),
  txnType: z.enum(['CASH_DEPOSIT', 'CASH_WITHDRAWAL', 'TRANSFER', 'REMITTANCE', 'CRYPTO', 'TRADE']),
})

export const STRCreateSchema = z.object({
  customerId: z.string().uuid(),
  alertId: z.string().uuid(),
  amount: z.string(),
  description: z.string().min(50, 'Description must be at least 50 characters'),
})

// ── DMS ───────────────────────────────────────────────────────────────────────

export const DocumentUploadSchema = z.object({
  customerId: z.string().uuid(),
  docType: z.enum(['NATIONAL_ID', 'PASSPORT', 'DRIVING_LICENSE', 'ADDRESS_PROOF', 'INCOME_PROOF', 'BANK_STATEMENT', 'LOAN_FORM', 'PHOTO']),
  branchId: z.string().uuid(),
  expiresAt: z.string().datetime().optional(),
})

export const DocumentApprovalSchema = z.object({
  docId: z.string().uuid(),
  decision: z.enum(['APPROVE', 'REJECT']),
  comments: z.string().min(5, 'Comments are required'),
})

// ── CMS ───────────────────────────────────────────────────────────────────────

export const CaseAssignSchema = z.object({
  loanId: z.string().uuid(),
  agentId: z.string().uuid(),
  nba: z.enum(['FIELD_VISIT', 'PHONE_CALL', 'SMS', 'EMAIL', 'LEGAL_NOTICE', 'RESTRUCTURE']),
  notes: z.string().max(500).optional(),
})

export const PaymentRecordSchema = z.object({
  caseId: z.string().uuid(),
  loanId: z.string().uuid(),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
  paymentMode: z.enum(['CASH', 'BANK_TRANSFER', 'QR', 'CHEQUE']),
  gpsLat: z.number().min(-90).max(90).optional(),
  gpsLng: z.number().min(-180).max(180).optional(),
})

// ── Pagination ────────────────────────────────────────────────────────────────

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
})

export const UUIDParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
})

// ── Portal ────────────────────────────────────────────────────────────────────

export const PortalLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const PortalLoanApplicationSchema = z.object({
  productType: z.enum(['PERSONAL', 'HOME', 'VEHICLE', 'BUSINESS', 'AGRICULTURE']),
  requestedAmount: z.string().regex(/^\d+(\.\d{1,2})?$/),
  requestedTenure: z.number().int().min(3).max(360),
  purpose: z.string().min(10).max(500),
  monthlyIncome: z.string().regex(/^\d+(\.\d{1,2})?$/),
})

export type LoginInput = z.infer<typeof LoginSchema>
export type LoanApplicationInput = z.infer<typeof LoanApplicationSchema>
export type EWSEvaluateInput = z.infer<typeof EWSEvaluateSchema>
export type AMLMonitorInput = z.infer<typeof AMLMonitorSchema>
export type DocumentUploadInput = z.infer<typeof DocumentUploadSchema>
export type CaseAssignInput = z.infer<typeof CaseAssignSchema>
export type PaymentRecordInput = z.infer<typeof PaymentRecordSchema>
