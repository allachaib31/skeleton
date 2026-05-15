import { Permission } from './permission.model';

export class PermissionsService {
  static async getPermissions() {
    const permissions = await Permission.find();
    
    // Group by module
    const grouped = permissions.reduce((acc: any, perm) => {
      const mod = perm.module;
      if (!acc[mod]) acc[mod] = [];
      acc[mod].push(perm);
      return acc;
    }, {});

    return grouped;
  }
}
