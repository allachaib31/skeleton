import { Request, Response } from 'express';
import { sendSuccess } from '../../common/responses/api.response';
import { translate } from '../../config/i18n.config';
import { ProblemReportService } from './problem-report.service';

export class ProblemReportController {
  static async listMine(req: Request, res: Response) {
    const result = await ProblemReportService.listForClient(req.user!.id, req.query);
    sendSuccess(res, result.data, translate('problemReports.retrieved', req.language), { ...result.meta });
  }

  static async create(req: Request, res: Response) {
    const result = await ProblemReportService.createForClient(req.user!.id, req.body, req.ip, req.headers['user-agent']);
    sendSuccess(res, result, translate('problemReports.created', req.language), null, 201);
  }

  static async getMine(req: Request, res: Response) {
    const result = await ProblemReportService.getForClient(req.params.id as string, req.user!.id);
    sendSuccess(res, result, translate('problemReports.retrieved', req.language));
  }

  static async addClientMessage(req: Request, res: Response) {
    const result = await ProblemReportService.addClientMessage(req.params.id as string, req.user!.id, req.body.message, req.ip, req.headers['user-agent']);
    sendSuccess(res, result, translate('problemReports.message_created', req.language));
  }

  static async closeMine(req: Request, res: Response) {
    const result = await ProblemReportService.closeForClient(req.params.id as string, req.user!.id, req.ip, req.headers['user-agent']);
    sendSuccess(res, result, translate('problemReports.closed', req.language));
  }
}

export class AdminProblemReportController {
  static async list(req: Request, res: Response) {
    const result = await ProblemReportService.listForAdmin(req.query);
    sendSuccess(res, result.data, translate('problemReports.retrieved', req.language), { ...result.meta });
  }

  static async get(req: Request, res: Response) {
    const result = await ProblemReportService.getForAdmin(req.params.id as string);
    sendSuccess(res, result, translate('problemReports.retrieved', req.language));
  }

  static async assign(req: Request, res: Response) {
    const result = await ProblemReportService.assign(req.params.id as string, req.user!.id, req.body.assignedAdminId, req.ip, req.headers['user-agent']);
    sendSuccess(res, result, translate('problemReports.assigned', req.language));
  }

  static async updateStatus(req: Request, res: Response) {
    const result = await ProblemReportService.updateStatus(req.params.id as string, req.user!.id, req.body.status, req.body.resolutionNote, req.ip, req.headers['user-agent']);
    sendSuccess(res, result, translate('problemReports.status_updated', req.language));
  }

  static async updatePriority(req: Request, res: Response) {
    const result = await ProblemReportService.updatePriority(req.params.id as string, req.user!.id, req.body.priority, req.ip, req.headers['user-agent']);
    sendSuccess(res, result, translate('problemReports.priority_updated', req.language));
  }

  static async addAdminMessage(req: Request, res: Response) {
    const result = await ProblemReportService.addAdminMessage(req.params.id as string, req.user!.id, req.body, req.ip, req.headers['user-agent']);
    sendSuccess(res, result, translate('problemReports.message_created', req.language));
  }
}
