import { PrismaClient } from '@prisma/client'
import type { Producer } from 'kafkajs'
import { v4 as uuidv4 } from 'uuid'
import type { LoanApplicationInput } from '@apex/shared'
import { createLogger } from '@apex/logger'

const logger = createLogger('loan-service')

export class LoanService {
  constructor(private prisma: PrismaClient, private kafka: Producer) {}

  async getLoans(tenantId: string, filters: { status?: string; page?: number; limit?: number }) {
    const page = Number.isFinite(filters.page) && filters.page! > 0 ? filters.page! : 1
    const limit = Number.isFinite(filters.limit) && filters.limit! > 0 ? filters.limit! : 20
    const [items, total] = await Promise.all([
      this.prisma.loan.findMany({
        where: { tenantId, deletedAt: null, ...(filters.status ? { status: filters.status as never } : {}) },
        include: { customer: { select: { fullName: true, customerId: true } } },
        orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit,
      }),
      this.prisma.loan.count({ where: { tenantId, deletedAt: null } }),
    ])
    return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
  }

  async getLoanById(tenantId: string, id: string) {
    const loan = await this.prisma.loan.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        customer: true,
        repayments: { orderBy: { installment: 'asc' } },
        ewsAlerts: { where: { status: { in: ['OPEN', 'ASSIGNED'] } }, take: 3 },
      },
    })
    if (!loan) throw new Error('NOT_FOUND')
    return loan
  }

  async getPortfolioMetrics(tenantId: string) {
    const [active, npa, totalLoans, buckets] = await Promise.all([
      this.prisma.loan.count({ where: { tenantId, status: 'ACTIVE', deletedAt: null } }),
      this.prisma.loan.count({ where: { tenantId, status: 'NPA', deletedAt: null } }),
      this.prisma.loan.aggregate({ where: { tenantId, deletedAt: null, status: { in: ['ACTIVE', 'DISBURSED'] } }, _sum: { outstandingBalance: true } }),
      this.prisma.loan.groupBy({ by: ['bucket'], where: { tenantId, deletedAt: null }, _count: true }),
    ])
    return { active, npa, totalOutstanding: totalLoans._sum.outstandingBalance ?? 0, buckets }
  }

  async createApplication(tenantId: string, userId: string, branchId: string, input: LoanApplicationInput) {
    const app = await this.prisma.loanApplication.create({
      data: {
        tenantId, applicationId: `APP-${Date.now()}`,
        customerId: input.customerId, productType: input.productType,
        purpose: input.purpose, requestedAmount: parseFloat(input.requestedAmount),
        requestedTenure: input.requestedTenure, status: 'SUBMITTED',
        officerId: userId, branchId, createdBy: userId, submittedAt: new Date(),
      },
    })
    await this.publish('loans.application.created', tenantId, { applicationId: app.id, customerId: input.customerId })
    return app
  }

  async getApplications(tenantId: string, filters: { status?: string; page?: number; limit?: number }) {
    const page = Number.isFinite(filters.page) && filters.page! > 0 ? filters.page! : 1
    const limit = Number.isFinite(filters.limit) && filters.limit! > 0 ? filters.limit! : 20
    const [items, total] = await Promise.all([
      this.prisma.loanApplication.findMany({
        where: { tenantId, deletedAt: null, ...(filters.status ? { status: filters.status as never } : {}) },
        include: { customer: { select: { fullName: true, customerId: true } } },
        orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit,
      }),
      this.prisma.loanApplication.count({ where: { tenantId, deletedAt: null } }),
    ])
    return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
  }

  async approveApplication(tenantId: string, reviewerId: string, applicationId: string, decision: 'APPROVE' | 'REJECT', approvedAmount: string | undefined, comments: string) {
    const app = await this.prisma.loanApplication.findFirst({ where: { id: applicationId, tenantId } })
    if (!app) throw new Error('NOT_FOUND')
    if (app.reviewerId === reviewerId) throw new Error('UNPROCESSABLE') // maker-checker
    const status = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED'
    const updated = await this.prisma.loanApplication.update({
      where: { id: applicationId },
      data: { status: status as never, reviewerId, reviewedAt: new Date(), comments, ...(approvedAmount ? { approvedAmount: parseFloat(approvedAmount) } : {}) },
    })
    await this.publish(`loans.application.${status.toLowerCase()}`, tenantId, { applicationId, reviewerId, decision })
    return updated
  }

  async calculateCreditScore(tenantId: string, customerId: string) {
    const customer = await this.prisma.customer.findFirst({ where: { id: customerId, tenantId } })
    if (!customer) throw new Error('NOT_FOUND')
    // Rule-based credit scoring (AI service stub)
    const score = customer.riskGrade === 'A' ? 820 : customer.riskGrade === 'B' ? 740 : customer.riskGrade === 'C' ? 650 : 550
    const pdScore = customer.riskGrade === 'A' ? 0.05 : customer.riskGrade === 'B' ? 0.15 : customer.riskGrade === 'C' ? 0.35 : 0.65
    return { creditScore: score, pdScore, ltv: 0.75, foir: 0.42, rating: customer.riskGrade, recommendation: score >= 700 ? 'APPROVE' : 'REVIEW' }
  }

  async getCustomerLoans(tenantId: string, customerId: string) {
    return this.prisma.loan.findMany({
      where: { tenantId, customerId, deletedAt: null },
      include: { repayments: { where: { status: 'PENDING' }, orderBy: { dueDate: 'asc' }, take: 3 } },
    })
  }

  private async publish(topic: string, tenantId: string, payload: unknown) {
    try {
      await this.kafka.send({ topic, messages: [{ key: tenantId, value: JSON.stringify({ eventId: uuidv4(), eventType: topic, timestamp: new Date().toISOString(), tenantId, payload }) }] })
    } catch (e) { logger.warn('Kafka publish failed', { topic, error: (e as Error).message }) }
  }
}
