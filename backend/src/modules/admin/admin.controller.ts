import { Request, Response } from 'express';
import { AdminService } from './admin.service';
import { sendSuccess } from '../../common/responses/api.response';
import { translate } from '../../config/i18n.config';

const firstHeader = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

export class AdminController {
  static async getDashboard(req: Request, res: Response) {
    const data = await AdminService.getDashboard();
    sendSuccess(res, data, translate('common.operation_successful', req.language));
  }

  static async getUsers(req: Request, res: Response) {
    const data = await AdminService.getUsers(req.query);
    sendSuccess(res, data, translate('common.operation_successful', req.language));
  }

  static async getUser(req: Request, res: Response) {
    const data = await AdminService.getUser(req.params.id as string);
    sendSuccess(res, data, translate('common.operation_successful', req.language));
  }

  static async updateUserStatus(req: Request, res: Response) {
    const data = await AdminService.updateUserStatus(req.params.id as string, req.body.status, req.user!.id, req.ip, firstHeader(req.headers['user-agent']));
    sendSuccess(res, data, translate('admin.user_status_updated', req.language));
  }

  static async updateUserRole(req: Request, res: Response) {
    const data = await AdminService.updateUserRole(req.params.id as string, req.body.roleId, req.user!.id, req.ip, firstHeader(req.headers['user-agent']));
    sendSuccess(res, data, translate('admin.user_role_updated', req.language));
  }

  static async deleteUser(req: Request, res: Response) {
    await AdminService.deleteUser(req.params.id as string, req.user!.id, req.ip, firstHeader(req.headers['user-agent']));
    sendSuccess(res, null, translate('admin.user_deleted', req.language));
  }

  static async getAuditLogs(req: Request, res: Response) {
    const data = await AdminService.getAuditLogs(req.query);
    sendSuccess(res, data, translate('common.operation_successful', req.language));
  }

  static async getSessions(req: Request, res: Response) {
    const data = await AdminService.getSessions(req.query);
    sendSuccess(res, data, translate('common.operation_successful', req.language));
  }

  static async deleteSession(req: Request, res: Response) {
    await AdminService.deleteSession(req.params.id as string, req.user!.id, req.ip, firstHeader(req.headers['user-agent']));
    sendSuccess(res, null, translate('admin.session_revoked', req.language));
  }

  static async getUploads(req: Request, res: Response) {
    const data = await AdminService.getUploads(req.query);
    sendSuccess(res, data, translate('common.operation_successful', req.language));
  }

  static async deleteUpload(req: Request, res: Response) {
    await AdminService.deleteUpload(req.params.id as string, req.user!.id, req.ip, firstHeader(req.headers['user-agent']));
    sendSuccess(res, null, translate('admin.upload_deleted', req.language));
  }

  static async getSystemHealth(req: Request, res: Response) {
    const data = await AdminService.getSystemHealth();
    sendSuccess(res, data, translate('common.operation_successful', req.language));
  }

  static async getSystemMetrics(req: Request, res: Response) {
    const data = await AdminService.getSystemMetrics();
    sendSuccess(res, data, translate('common.operation_successful', req.language));
  }
}
