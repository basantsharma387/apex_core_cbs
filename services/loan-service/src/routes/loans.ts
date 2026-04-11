import { Router } from 'express'
import { verifyJWT, checkRole, asyncHandler, success, paginated } from '@apex/middleware'
import type { LoanService } from '../services/loanService.js'

export function loanRouter(svc: LoanService): Router {
  const r = Router()

  r.get('/', verifyJWT, asyncHandler(async (req, res) => {
    const data = await svc.getLoans(req.user!.tenantId, { status: req.query['status'] as string, page: Number(req.query['page']), limit: Number(req.query['limit']) })
    paginated(res, data.items, data.pagination, req.requestId)
  }))

  r.get('/metrics', verifyJWT, checkRole('ADMIN','RISK_ANALYST','BRANCH_MANAGER','SUPER_ADMIN','CREDIT_ANALYST'), asyncHandler(async (req, res) => {
    const data = await svc.getPortfolioMetrics(req.user!.tenantId)
    success(res, data, 200, 'OK', req.requestId)
  }))

  r.get('/:id', verifyJWT, asyncHandler(async (req, res) => {
    const data = await svc.getLoanById(req.user!.tenantId, req.params['id']!)
    success(res, data, 200, 'OK', req.requestId)
  }))

  r.get('/customer/:customerId', verifyJWT, asyncHandler(async (req, res) => {
    const data = await svc.getCustomerLoans(req.user!.tenantId, req.params['customerId']!)
    success(res, data, 200, 'OK', req.requestId)
  }))

  // Portal: customer fetches their own loans (JWT must have customerId claim)
  r.get('/my', verifyJWT, asyncHandler(async (req, res) => {
    const customerId = req.user!.customerId
    if (!customerId) { res.status(403).json({ header: { status: 'ERROR', code: '403', message: 'Not a portal user' }, body: null }); return }
    const data = await svc.getCustomerLoans(req.user!.tenantId, customerId)
    success(res, data, 200, 'OK', req.requestId)
  }))

  return r
}
