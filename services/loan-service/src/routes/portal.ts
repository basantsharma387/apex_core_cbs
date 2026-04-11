import { Router } from 'express'
import { LoanApplicationSchema } from '@apex/shared'
import { verifyJWT, checkRole, validateBody, asyncHandler, success } from '@apex/middleware'
import type { LoanService } from '../services/loanService.js'

export function portalRouter(svc: LoanService): Router {
  const r = Router()

  // GET /portal/loans/my — customer views their own loans
  r.get('/loans/my', verifyJWT, checkRole('CUSTOMER'), asyncHandler(async (req, res) => {
    const data = await svc.getCustomerLoans(req.user!.tenantId, req.user!.sub)
    success(res, data, 200, 'OK', req.requestId)
  }))

  // POST /portal/los/apply — customer submits a loan application
  r.post('/los/apply', verifyJWT, checkRole('CUSTOMER'),
    validateBody(LoanApplicationSchema),
    asyncHandler(async (req, res) => {
      const input = { ...req.body, customerId: req.user!.sub }
      const data = await svc.createApplication(req.user!.tenantId, req.user!.sub, '', input)
      success(res, data, 201, 'Application submitted', req.requestId)
    })
  )

  return r
}
