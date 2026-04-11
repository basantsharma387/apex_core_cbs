import { PrismaClient } from '@prisma/client'
import type { Redis } from 'ioredis'
import type { Producer } from 'kafkajs'
import { v4 as uuidv4 } from 'uuid'
import type { EWSEvaluateInput } from '@apex/shared'
import { createLogger } from '@apex/logger'

const logger = createLogger('ews-service')

const CACHE_TTL = 300 // 5 minutes

export class EWSService {
  constructor(
    private prisma: PrismaClient,
    private redis: Redis,
    private kafka: Producer,
  ) {}

  // ── PD Score calculation (rule-based + AI stub) ────────────────────────────
  private computePDScore(input: EWSEvaluateInput): number {
    let score = 0.1 // base

    // DPD contribution (primary indicator)
    if (input.dpd >= 90) score += 0.55
    else if (input.dpd >= 60) score += 0.35
    else if (input.dpd >= 30) score += 0.20
    else if (input.dpd >= 10) score += 0.10
    else if (input.dpd >= 1) score += 0.05

    // Balance drop
    if (input.balanceDrop >= 50) score += 0.20
    else if (input.balanceDrop >= 25) score += 0.10
    else if (input.balanceDrop >= 10) score += 0.05

    // Cheque returns
    if ((input.chequeReturns ?? 0) >= 3) score += 0.15
    else if ((input.chequeReturns ?? 0) >= 1) score += 0.07

    // Utilization (high credit utilization = risk)
    if ((input.utilizationRate ?? 0) >= 90) score += 0.10
    else if ((input.utilizationRate ?? 0) >= 70) score += 0.05

    return Math.min(score, 0.99)
  }

  private pdToRiskLevel(pd: number): 'HIGH' | 'MEDIUM' | 'LOW' {
    if (pd >= 0.7) return 'HIGH'
    if (pd >= 0.45) return 'MEDIUM'
    return 'LOW'
  }

  private generateIndicators(input: EWSEvaluateInput, pdScore: number): string[] {
    const indicators: string[] = []
    if (input.dpd >= 30) indicators.push(`DPD ${input.dpd} days`)
    if (input.balanceDrop >= 25) indicators.push(`Balance drop ${input.balanceDrop}%`)
    if ((input.chequeReturns ?? 0) > 0) indicators.push(`${input.chequeReturns} cheque return(s)`)
    if ((input.utilizationRate ?? 0) >= 70) indicators.push(`${input.utilizationRate}% credit utilization`)
    if (pdScore >= 0.7) indicators.push('High default probability')
    return indicators
  }

  async evaluate(tenantId: string, userId: string, input: EWSEvaluateInput) {
    const pdScore = this.computePDScore(input)
    const riskLevel = this.pdToRiskLevel(pdScore)
    const indicators = this.generateIndicators(input, pdScore)

    // Get customer's open loans
    const customer = await this.prisma.customer.findFirst({
      where: { id: input.customerId, tenantId },
      include: {
        loans: { where: { deletedAt: null, status: { in: ['ACTIVE', 'DISBURSED', 'NPA'] } } },
      },
    })
    if (!customer) throw new Error('CUSTOMER_NOT_FOUND')

    const loan = customer.loans[0]
    if (!loan) throw new Error('NO_ACTIVE_LOAN')

    // Create or update alert
    const existingAlert = await this.prisma.eWSAlert.findFirst({
      where: { tenantId, customerId: input.customerId, loanId: loan.id, status: { in: ['OPEN', 'ASSIGNED'] } },
    })

    let alert
    if (existingAlert) {
      alert = await this.prisma.eWSAlert.update({
        where: { id: existingAlert.id },
        data: { pdScore, riskLevel, indicators, dpd: input.dpd, updatedAt: new Date() },
      })
    } else {
      alert = await this.prisma.eWSAlert.create({
        data: {
          tenantId,
          alertId: `EWS-${Date.now()}`,
          customerId: input.customerId,
          loanId: loan.id,
          riskLevel,
          pdScore,
          indicators,
          dpd: input.dpd,
          outstandingBalance: loan.outstandingBalance,
          status: 'OPEN',
          createdBy: userId,
        },
      })
    }

    // Publish Kafka event
    await this.publishEvent('ews.alert.created', tenantId, {
      alertId: alert.id,
      customerId: input.customerId,
      riskLevel,
      pdScore,
    })

    if (riskLevel === 'HIGH') {
      await this.publishEvent('ews.alert.high', tenantId, {
        alertId: alert.id,
        customerId: input.customerId,
        loanId: loan.id,
        pdScore,
      })
    }

    logger.info('EWS evaluation complete', { alertId: alert.id, riskLevel, pdScore })
    return { alert, pdScore, riskLevel, indicators }
  }

  async getAlerts(tenantId: string, filters: {
    riskLevel?: string
    status?: string
    page?: number
    limit?: number
    sortBy?: string
    order?: string
  }) {
    const cacheKey = `ews:alerts:${tenantId}:${JSON.stringify(filters)}`
    const cached = await this.redis.get(cacheKey)
    if (cached) return JSON.parse(cached) as unknown

    const page = filters.page ?? 1
    const limit = filters.limit ?? 20
    const skip = (page - 1) * limit

    const where = {
      tenantId,
      ...(filters.riskLevel && { riskLevel: filters.riskLevel as 'HIGH' | 'MEDIUM' | 'LOW' }),
      ...(filters.status && { status: filters.status as 'OPEN' | 'ASSIGNED' | 'RESOLVED' | 'ESCALATED' }),
    }

    const [alerts, total] = await Promise.all([
      this.prisma.eWSAlert.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [filters.sortBy ?? 'createdAt']: filters.order ?? 'desc' },
        include: {
          customer: { select: { fullName: true, customerId: true } },
          loan: { select: { loanId: true, productType: true } },
        },
      }),
      this.prisma.eWSAlert.count({ where }),
    ])

    const result = { items: alerts, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
    await this.redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result))
    return result
  }

  async resolveAlert(tenantId: string, alertId: string, userId: string, resolution: string) {
    const alert = await this.prisma.eWSAlert.findFirst({ where: { id: alertId, tenantId } })
    if (!alert) throw new Error('ALERT_NOT_FOUND')

    const updated = await this.prisma.eWSAlert.update({
      where: { id: alertId },
      data: { status: 'RESOLVED', resolvedBy: userId, resolvedAt: new Date(), resolution },
    })

    await this.invalidateCache(tenantId)
    await this.publishEvent('ews.alert.resolved', tenantId, { alertId, userId })
    return updated
  }

  async getDashboardMetrics(tenantId: string) {
    const cacheKey = `ews:metrics:${tenantId}`
    const cached = await this.redis.get(cacheKey)
    if (cached) return JSON.parse(cached) as unknown

    const [total, high, medium, low, resolved, avgPD] = await Promise.all([
      this.prisma.eWSAlert.count({ where: { tenantId, status: { in: ['OPEN', 'ASSIGNED'] } } }),
      this.prisma.eWSAlert.count({ where: { tenantId, riskLevel: 'HIGH', status: { in: ['OPEN', 'ASSIGNED'] } } }),
      this.prisma.eWSAlert.count({ where: { tenantId, riskLevel: 'MEDIUM', status: { in: ['OPEN', 'ASSIGNED'] } } }),
      this.prisma.eWSAlert.count({ where: { tenantId, riskLevel: 'LOW', status: { in: ['OPEN', 'ASSIGNED'] } } }),
      this.prisma.eWSAlert.count({ where: { tenantId, status: 'RESOLVED', resolvedAt: { gte: new Date(Date.now() - 86400000) } } }),
      this.prisma.eWSAlert.aggregate({ where: { tenantId, status: { in: ['OPEN', 'ASSIGNED'] } }, _avg: { pdScore: true } }),
    ])

    const metrics = {
      totalActive: total,
      highRisk: high,
      mediumRisk: medium,
      lowRisk: low,
      resolvedToday: resolved,
      avgPDScore: Number(avgPD._avg.pdScore ?? 0).toFixed(2),
    }

    await this.redis.setex(cacheKey, 120, JSON.stringify(metrics))
    return metrics
  }

  private async publishEvent(topic: string, tenantId: string, payload: unknown) {
    try {
      await this.kafka.send({
        topic,
        messages: [{
          key: tenantId,
          value: JSON.stringify({
            eventId: uuidv4(),
            eventType: topic,
            timestamp: new Date().toISOString(),
            tenantId,
            payload,
            headers: { source: 'ews-service', version: '2.0' },
          }),
        }],
      })
    } catch (err) {
      logger.warn('Kafka publish failed', { topic, error: (err as Error).message })
    }
  }

  private async invalidateCache(tenantId: string) {
    const keys = await this.redis.keys(`ews:*:${tenantId}:*`)
    if (keys.length) await this.redis.del(...keys)
    await this.redis.del(`ews:metrics:${tenantId}`)
  }
}
