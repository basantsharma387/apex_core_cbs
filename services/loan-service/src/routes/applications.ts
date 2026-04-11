import { Router } from 'express'
import { LoanApplicationSchema, LoanApprovalSchema } from '@apex/shared'
import { verifyJWT, checkRole, validateBody, asyncHandler, success, paginated } from '@apex/middleware'
import type { LoanService } from '../services/loanService.js'

export function applicationRouter(svc: LoanService): Router {
  const r = Router()

  r.get('/applications', verifyJWT, asyncHandler(async (req, res) => {
    const data = await svc.getApplications(req.user!.tenantId, { status: req.query['status'] as string, page: Number(req.query['page']), limit: Number(req.query['limit']) })
    paginated(res, data.items, data.pagination, req.requestId)
  }))

  r.post('/application', verifyJWT, checkRole('LOAN_OFFICER','BRANCH_MANAGER','ADMIN','SUPER_ADMIN'),
    validateBody(LoanApplicationSchema),
    asyncHandler(async (req, res) => {
      const data = await svc.createApplication(req.user!.tenantId, req.user!.sub, req.user!['branchId'] as string ?? '', req.body)
      success(res, data, 201, 'Application submitted', req.requestId)
    })
  )

  r.post('/application/:id/approve', verifyJWT, checkRole('CREDIT_ANALYST','BRANCH_MANAGER','ADMIN','SUPER_ADMIN'),
    validateBody(LoanApprovalSchema),
    asyncHandler(async (req, res) => {
      const data = await svc.approveApplication(req.user!.tenantId, req.user!.sub, req.params['id']!, req.body.decision, req.body.approvedAmount, req.body.comments)
      success(res, data, 200, 'Decision recorded', req.requestId)
    })
  )

  r.post('/credit-score', verifyJWT, checkRole('CREDIT_ANALYST','LOAN_OFFICER','ADMIN','SUPER_ADMIN'), asyncHandler(async (req, res) => {
    const data = await svc.calculateCreditScore(req.user!.tenantId, req.body.customerId as string)
    success(res, data, 200, 'OK', req.requestId)
  }))

  return r
}
