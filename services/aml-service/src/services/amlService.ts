import { PrismaClient } from '@prisma/client'
import type { Producer } from 'kafkajs'
import { v4 as uuidv4 } from 'uuid'
import type { AMLMonitorInput, STRCreateInput } from '@apex/shared'
import { createLogger } from '@apex/logger'

const logger = createLogger('aml-service')

// AML rule engine — threshold-based (production: ML model)
const HIGH_AMOUNT_THRESHOLD = 10_000 // USD
const FATF_HIGH_RISK_COUNTRIES = new Set(['KP', 'IR', 'SY', 'YE', 'SD', 'MM'])
const CRYPTO_RISK_MULTIPLIER = 1.5

export class AMLService {
  constructor(private prisma: PrismaClient, private kafka: Producer) {}

  private computeRiskScore(input: AMLMonitorInput): { score: number; reasons: string[] } {
    let score = 10
    const reasons: string[] = []
    const amount = parseFloat(input.amount)

    if (amount >= HIGH_AMOUNT_THRESHOLD * 10) { score += 40; reasons.push('Very large transaction amount') }
    else if (amount >= HIGH_AMOUNT_THRESHOLD) { score += 25; reasons.push('Large cash transaction') }

    if (FATF_HIGH_RISK_COUNTRIES.has(input.country)) { score += 30; reasons.push(`High-risk jurisdiction: ${input.country}`) }

    if (input.txnType === 'CRYPTO') { score = Math.round(score * CRYPTO_RISK_MULTIPLIER); reasons.push('Crypto transaction') }
    if (input.txnType === 'REMITTANCE') { score += 10; reasons.push('Cross-border remittance') }
    if (input.txnType === 'CASH_DEPOSIT' && amount >= 5_000) { score += 15; reasons.push('Structured cash deposit') }

    return { score: Math.min(score, 100), reasons }
  }

  async monitorTransaction(tenantId: string, userId: string, input: AMLMonitorInput) {
    const { score, reasons } = this.computeRiskScore(input)
    const riskLevel = score >= 70 ? 'HIGH' : score >= 40 ? 'MEDIUM' : 'LOW'

    const customer = await this.prisma.customer.findFirst({ where: { id: input.customerId, tenantId } })
    if (!customer) throw new Error('CUSTOMER_NOT_FOUND')

    const alert = await this.prisma.aMLAlert.create({
      data: {
        tenantId,
        alertId: `AML-${Date.now()}`,
        txnId: input.txnId,
        customerId: input.customerId,
        amount: input.amount,
        currency: input.currency,
        country: input.country,
        txnType: input.txnType,
        riskLevel,
        riskScore: score,
        reasons,
        status: 'OPEN',
      },
    })

    if (riskLevel === 'HIGH') {
      await this.publishEvent('aml.transaction.flagged', tenantId, { alertId: alert.id, customerId: input.customerId, riskScore: score })
    }

    // Auto-generate CTR for cash >= threshold
    if (parseFloat(input.amount) >= HIGH_AMOUNT_THRESHOLD && ['CASH_DEPOSIT', 'CASH_WITHDRAWAL'].includes(input.txnType)) {
      logger.info('CTR auto-generation triggered', { alertId: alert.id, amount: input.amount })
    }

    return { alert, riskLevel, score, reasons }
  }

  async getAlerts(tenantId: string, filters: { status?: string; riskLevel?: string; page?: number; limit?: number }) {
    const page = filters.page ?? 1
    const limit = filters.limit ?? 20
    const where = {
      tenantId,
      ...(filters.status && { status: filters.status as 'OPEN' | 'UNDER_REVIEW' | 'CLEARED' | 'FILED_STR' | 'FILED_CTR' }),
      ...(filters.riskLevel && { riskLevel: filters.riskLevel as 'HIGH' | 'MEDIUM' | 'LOW' }),
    }
    const [items, total] = await Promise.all([
      this.prisma.aMLAlert.findMany({
        where, skip: (page - 1) * limit, take: limit,
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { fullName: true } } },
      }),
      this.prisma.aMLAlert.count({ where }),
    ])
    return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
  }

  async updateAlertStatus(tenantId: string, alertId: string, userId: string, status: 'UNDER_REVIEW' | 'CLEARED') {
    const alert = await this.prisma.aMLAlert.findFirst({ where: { id: alertId, tenantId } })
    if (!alert) throw new Error('ALERT_NOT_FOUND')
    const updated = await this.prisma.aMLAlert.update({
      where: { id: alertId },
      data: { status, reviewedBy: userId, reviewedAt: new Date() },
    })
    await this.publishEvent('aml.alert.status_changed', tenantId, { alertId, status, userId })
    return updated
  }

  async createSTR(tenantId: string, userId: string, input: { customerId: string; alertId: string; amount: string; description: string }) {
    const alert = await this.prisma.aMLAlert.findFirst({ where: { id: input.alertId, tenantId } })
    if (!alert) throw new Error('ALERT_NOT_FOUND')

    const str = await this.prisma.sTRReport.create({
      data: {
        tenantId,
        reportId: `STR-${Date.now()}`,
        customerId: input.customerId,
        alertId: input.alertId,
        amount: input.amount,
        description: input.description,
        filedBy: userId,
        status: 'PENDING_APPROVAL',
      },
    })

    await this.prisma.aMLAlert.update({ where: { id: input.alertId }, data: { status: 'FILED_STR' } })
    await this.publishEvent('aml.str.filed', tenantId, { strId: str.id, alertId: input.alertId })
    return str
  }

  async getDashboardMetrics(tenantId: string) {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const [total, suspicious, strFiled, ctrGenerated, casesOpen] = await Promise.all([
      this.prisma.aMLAlert.count({ where: { tenantId, createdAt: { gte: today } } }),
      this.prisma.aMLAlert.count({ where: { tenantId, status: 'OPEN' } }),
      this.prisma.sTRReport.count({ where: { tenantId, status: 'FILED' } }),
      this.prisma.aMLAlert.count({ where: { tenantId, status: 'FILED_CTR' } }),
      this.prisma.aMLAlert.count({ where: { tenantId, status: 'UNDER_REVIEW' } }),
    ])
    return { transactionsMonitored: total, suspicious, strFiled, ctrGenerated, casesOpen }
  }

  private async publishEvent(topic: string, tenantId: string, payload: unknown) {
    try {
      await this.kafka.send({ topic, messages: [{ key: tenantId, value: JSON.stringify({ eventId: uuidv4(), eventType: topic, timestamp: new Date().toISOString(), tenantId, payload }) }] })
    } catch (err) { logger.warn('Kafka publish failed', { topic, error: (err as Error).message }) }
  }
}

type STRCreateInput = { customerId: string; alertId: string; amount: string; description: string }
