import { useTranslation } from 'react-i18next';
import { Badge } from '@/shared/components/ui/Badge';
import { UserStatus } from '../types/admin.types';

export function StatusBadge({ status }: { status: UserStatus }) {
  const { t } = useTranslation();
  const variants: Record<UserStatus, any> = {
    active: 'success',
    inactive: 'default',
    banned: 'danger',
    pending_verification: 'warning',
  };

  return <Badge variant={variants[status] || 'default'}>{t(`runtime.statusLabels.${status}`, status.replace('_', ' '))}</Badge>;
}

export function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    SUPER_ADMIN: 'bg-primary/15 text-primary dark:bg-primary/20 dark:text-primary',
    ADMIN: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    USER: 'bg-accent/10 text-accent dark:bg-accent/15 dark:text-accent',
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${colors[role] || 'bg-slate-100 text-slate-800'}`}>
      {role}
    </span>
  );
}

export function ActionBadge({ action }: { action: string }) {
  const { t } = useTranslation();
  const isCreate = action.toLowerCase().includes('create');
  const isUpdate = action.toLowerCase().includes('update');
  const isDelete = action.toLowerCase().includes('delete');

  return (
    <Badge variant={isCreate ? 'success' : isDelete ? 'danger' : isUpdate ? 'info' : 'default'}>
      {t(`runtime.actionsMap.${action}`, action)}
    </Badge>
  );
}
