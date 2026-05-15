import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdminUsers, useUpdateUserStatus, useDeleteUser } from '../../features/admin/hooks/useAdminUsers';
import { useRoles } from '../../features/admin/hooks/useRoles';
import { useUIStore } from '@/app/stores/ui.store';
import { Table } from '@/shared/components/ui/Table';
import { Card } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Select } from '@/shared/components/ui/Select';
import { Modal } from '@/shared/components/ui/Modal';
import { StatusBadge, RoleBadge } from '../../features/admin/components/StatusBadge';
import { Avatar } from '@/shared/components/ui/Avatar';
import { SEO } from '@/shared/components/seo/SEO';
import { Search, Eye, UserCog, Trash2, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function UsersPage() {
  const { t } = useTranslation();
  const { setPageTitle, setBreadcrumbs } = useUIStore();
  const [params, setParams] = useState({ page: 1, limit: 10, search: '', status: '', role: '' });
  const { data: usersResponse, isLoading } = useAdminUsers(params);
  const { data: rolesResponse } = useRoles();
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateUserStatus();
  const { mutate: deleteUser, isPending: isDeleting } = useDeleteUser();

  const [statusModal, setStatusModal] = useState<{ id: string; status: string } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setPageTitle(t('runtime.userManagement'));
    setBreadcrumbs([{ label: t('admin.panel'), href: '/admin/dashboard' }, { label: t('admin.users') }]);
  }, [setPageTitle, setBreadcrumbs, t]);

  const columns = [
    { 
      key: 'user', 
      header: t('runtime.user'), 
      render: (u: any) => (
        <div className="flex items-center gap-3">
          <Avatar src={u.avatar} name={u.name} size="sm" />
          <div>
            <div className="font-bold text-sm">{u.name}</div>
            <div className="text-xs text-slate-500">{u.email}</div>
          </div>
        </div>
      )
    },
    { key: 'role', header: t('runtime.role'), render: (u: any) => <RoleBadge role={u.role?.name} /> },
    { key: 'status', header: t('runtime.status'), render: (u: any) => <StatusBadge status={u.status} /> },
    { key: 'createdAt', header: t('runtime.joined'), render: (u: any) => new Date(u.createdAt).toLocaleDateString() },
    { 
      key: 'actions', 
      header: t('runtime.actions'), 
      render: (u: any) => (
        <div className="flex items-center gap-2">
          <Link to={`/admin/users/${u._id}`}>
            <Button variant="ghost" size="sm"><Eye size={16} /></Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={() => setStatusModal({ id: u._id, status: u.status })}>
            <UserCog size={16} />
          </Button>
          <Button variant="ghost" size="sm" className="text-red-500" onClick={() => setDeleteId(u._id)}>
            <Trash2 size={16} />
          </Button>
        </div>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <SEO title={t('runtime.userManagement')} description={t('runtime.userManagementDescription')} />
      
      <Card padding="lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <Input 
              placeholder={t('runtime.searchUsers')} 
              leftIcon={<Search size={18} />}
              value={params.search}
              onChange={(e: any) => setParams({ ...params, search: e.target.value, page: 1 })}
            />
          </div>
          <Select 
            options={[
              { label: t('runtime.allStatuses'), value: '' },
              { label: t('runtime.active'), value: 'ACTIVE' },
              { label: t('runtime.inactive'), value: 'INACTIVE' },
              { label: t('runtime.banned'), value: 'BANNED' },
            ]}
            value={params.status}
            onChange={(e: any) => setParams({ ...params, status: e.target.value, page: 1 })}
          />
          <Select 
            options={[
              { label: t('runtime.allRoles'), value: '' },
              ...(rolesResponse?.data.map(r => ({ label: r.name, value: r._id })) || []),
            ]}
            value={params.role}
            onChange={(e: any) => setParams({ ...params, role: e.target.value, page: 1 })}
          />
        </div>
      </Card>

      <Table 
        columns={columns} 
        data={usersResponse?.data || []} 
        isLoading={isLoading} 
      />

      {/* Status Modal */}
      <Modal
        isOpen={!!statusModal}
        onClose={() => setStatusModal(null)}
        title={t('runtime.changeUserStatus')}
      >
        <div className="space-y-6">
          <Select 
            label={t('runtime.accountStatusLabel')}
            options={[
              { label: t('runtime.active'), value: 'ACTIVE' },
              { label: t('runtime.inactive'), value: 'INACTIVE' },
              { label: t('runtime.banned'), value: 'BANNED' },
            ]}
            value={statusModal?.status}
            onChange={(e: any) => setStatusModal(prev => prev ? { ...prev, status: e.target.value } : null)}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setStatusModal(null)}>{t('common.cancel')}</Button>
            <Button 
              onClick={() => updateStatus({ id: statusModal!.id, status: statusModal!.status as any }, { onSuccess: () => setStatusModal(null) })}
              isLoading={isUpdating}
            >
              {t('runtime.updateStatus')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title={t('runtime.deleteUser')}
      >
        <div className="space-y-6">
          <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-600 rounded-lg flex items-start gap-3">
            <AlertTriangle size={20} className="shrink-0 mt-0.5" />
            <p className="text-sm font-medium">
              {t('runtime.deleteUserDescription')}
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeleteId(null)}>{t('common.cancel')}</Button>
            <Button 
              variant="danger" 
              onClick={() => deleteUser(deleteId!, { onSuccess: () => setDeleteId(null) })}
              isLoading={isDeleting}
            >
              {t('runtime.confirmDelete')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
