import { Request, Response } from 'express';
import { RolesService } from './roles.service';
import { sendSuccess } from '../../common/responses/api.response';
import { translate } from '../../config/i18n.config';

export class RolesController {
  static async getRoles(req: Request, res: Response) {
    const roles = await RolesService.getRoles();
    sendSuccess(res, roles, translate('roles.retrieved', req.language));
  }

  static async createRole(req: Request, res: Response) {
    const role = await RolesService.createRole(req.body, req.user!.id, req.ip, req.headers['user-agent']);
    sendSuccess(res, role, translate('roles.created', req.language), null, 201);
  }

  static async updateRole(req: Request, res: Response) {
    const role = await RolesService.updateRole(req.params.id as string, req.body, req.user!.id, req.ip, req.headers['user-agent']);
    sendSuccess(res, role, translate('roles.updated', req.language));
  }

  static async deleteRole(req: Request, res: Response) {
    await RolesService.deleteRole(req.params.id as string, req.user!.id, req.ip, req.headers['user-agent']);
    sendSuccess(res, null, translate('roles.deleted', req.language));
  }
}
