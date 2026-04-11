import { Router } from 'express'
import { EWSEvaluateSchema, EWSAlertFilterSchema, EWSResolveSchema, PaginationSchema } from '@apex/shared'
import type { EWSService } from '../services/ewsService.js'
import { verifyJWT, checkRole, asyncHandler } from '@apex/middleware'

export function ewsRouter(ewsService: EWSService): Router {
  const router = Router()

  // GET /api/v1/ews/metrics
  router.get('/metrics', verifyJWT,
    checkRole('RISK_ANALYST', 'CREDIT_ANALYST', 'ADMIN', 'BRANCH_MANAGER', 'SUPER_ADMIN'),
    asyncHandler(async (req, res) => {
      const metrics = await ewsService.getDashboardMetrics(req.user!.tenantId)
      res.json({ header: { status: 'SUCCESS', code: '200', message: 'OK', requestId: req.headers['x-request-id'], timestamp: new Date().toISOString() }, body: metrics })
    })
  )

  // GET /api/v1/ews/alerts
  router.get('/alerts', verifyJWT,
    checkRole('RISK_ANALYST', 'CREDIT_ANALYST', 'ADMIN', 'BRANCH_MANAGER', 'SUPER_ADMIN', 'COLLECTION_MANAGER'),
    asyncHandler(async (req, res) => {
      const filters = EWSAlertFilterSchema.parse(req.query)
      const data = await ewsService.getAlerts(req.user!.tenantId, filters)
      res.json({ header: { status: 'SUCCESS', code: '200', message: 'OK', requestId: req.headers['x-request-id'], timestamp: new Date().toISOString() }, body: data })
    })
  )

  // POST /api/v1/ews/evaluate
  router.post('/evaluate', verifyJWT,
    checkRole('RISK_ANALYST', 'CREDIT_ANALYST', 'ADMIN', 'SUPER_ADMIN'),
    asyncHandler(async (req, res) => {
      const input = EWSEvaluateSchema.parse(req.body)
      const result = await ewsService.evaluate(req.user!.tenantId, req.user!.sub, input)
      res.status(201).json({ header: { status: 'SUCCESS', code: '201', message: 'EWS evaluation complete', requestId: req.headers['x-request-id'], timestamp: new Date().toISOString() }, body: result })
    })
  )

  // PUT /api/v1/ews/alerts/:id/resolve
  router.put('/alerts/:id/resolve', verifyJWT,
    checkRole('RISK_ANALYST', 'ADMIN', 'SUPER_ADMIN'),
    asyncHandler(async (req, res) => {
      const { resolution } = EWSResolveSchema.omit({ alertId: true }).parse(req.body)
      const alert = await ewsService.resolveAlert(req.user!.tenantId, req.params['id']!, req.user!.sub, resolution)
      res.json({ header: { status: 'SUCCESS', code: '200', message: 'Alert resolved', requestId: req.headers['x-request-id'], timestamp: new Date().toISOString() }, body: alert })
    })
  )

  return router
}
