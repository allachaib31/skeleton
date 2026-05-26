import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { validate } from '../../middlewares/validate.middleware';
import { AdminProblemReportController, ProblemReportController } from './problem-report.controller';
import {
  adminProblemReportAssignSchema,
  adminProblemReportMessageSchema,
  adminProblemReportPrioritySchema,
  adminProblemReportStatusSchema,
  createProblemReportMessageSchema,
  createProblemReportSchema,
  problemReportParamsSchema,
  problemReportQuerySchema,
} from './problem-report.validator';

export const problemReportRoutes = Router();
problemReportRoutes.use(authenticate);

problemReportRoutes.get('/', validate(problemReportQuerySchema, 'query'), asyncHandler(ProblemReportController.listMine));
problemReportRoutes.post('/', validate(createProblemReportSchema), asyncHandler(ProblemReportController.create));
problemReportRoutes.get('/:id', validate(problemReportParamsSchema, 'params'), asyncHandler(ProblemReportController.getMine));
problemReportRoutes.post('/:id/messages', validate(problemReportParamsSchema, 'params'), validate(createProblemReportMessageSchema), asyncHandler(ProblemReportController.addClientMessage));
problemReportRoutes.patch('/:id/close', validate(problemReportParamsSchema, 'params'), asyncHandler(ProblemReportController.closeMine));

export const adminProblemReportRoutes = Router();
adminProblemReportRoutes.use(authenticate, requireRole('ADMIN', 'SUPER_ADMIN'));

adminProblemReportRoutes.get('/', validate(problemReportQuerySchema, 'query'), asyncHandler(AdminProblemReportController.list));
adminProblemReportRoutes.get('/:id', validate(problemReportParamsSchema, 'params'), asyncHandler(AdminProblemReportController.get));
adminProblemReportRoutes.patch('/:id/assign', validate(problemReportParamsSchema, 'params'), validate(adminProblemReportAssignSchema), asyncHandler(AdminProblemReportController.assign));
adminProblemReportRoutes.patch('/:id/status', validate(problemReportParamsSchema, 'params'), validate(adminProblemReportStatusSchema), asyncHandler(AdminProblemReportController.updateStatus));
adminProblemReportRoutes.patch('/:id/priority', validate(problemReportParamsSchema, 'params'), validate(adminProblemReportPrioritySchema), asyncHandler(AdminProblemReportController.updatePriority));
adminProblemReportRoutes.post('/:id/messages', validate(problemReportParamsSchema, 'params'), validate(adminProblemReportMessageSchema), asyncHandler(AdminProblemReportController.addAdminMessage));
