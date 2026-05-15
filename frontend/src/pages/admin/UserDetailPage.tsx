import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAdminUserById, useUpdateUserRole, useUpdateUserStatus } from '../../features/admin/hooks/useAdminUsers';
import { useRoles } from '../../features/admin/hooks/useRoles';
import { useUIStore } from '@/app/stores/ui.store';
import { Card } from '@/shared/components/ui/Card';
import { Tabs } from '@/shared/components/ui/Tabs';
import { Button } from '@/shared/components/ui/Button';
import { Select } from '@/shared/components/ui/Select';
import { Avatar } from '@/shared/components/ui/Avatar';
import { Table } from '@/shared/components/ui/Table';
import { StatusBadge, RoleBadge } from '../../features/admin/components/StatusBadge';
import { SEO } from '@/shared/components/seo/SEO';
import { Spinner } from '@/shared/components/ui/Spinner';
import { ArrowLeft, Calendar, Shield, Activity } from 'lucide-react';

export default function UserDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { setPageTitle, setBreadcrumbs } = useUIStore();
  const { data: userResponse, isLoading } = useAdminUserById(id || '');
  const { data: rolesResponse } = useRoles();
  const { mutate: updateRole, isPending: isUpdatingRole } = useUpdateUserRole();
  const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateUserStatus();
  const [activeTab, setActiveTab] = useState('sessions');

  const user = userResponse?.data;

  useEffect(() => {
    if (user) {
      setPageTitle(`User: ${user.name}`);
      setBreadcrumbs([
        { label: t('admin.panel'), href: '/admin/dashboard' },
        { label: t('admin.users'), href: '/admin/users' },
        { label: user.name }
      ]);
    }
  }, [user, setPageTitle, setBreadcrumbs, t]);

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!user) return <div className="text-center py-20">{t('runtime.userNotFound')}</div>;

  const tabs = [
    { label: t('sessions.title'), value: 'sessions', icon: <Activity size={18} /> },
    { label: t('runtime.auditHistory'), value: 'audit', icon: <Shield size={18} /> },
  ];

  return (
    <div className="space-y-8">
      <SEO title={t('runtime.userDetailsTitle', { name: user.name })} description={t('runtime.manageUserDescription', { name: user.name })} />
      
      <Link to="/admin/users" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary transition-colors">
        <ArrowLeft size={16} /> {t('runtime.backToUsers')}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Info Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card padding="lg" className="flex flex-col items-center">
            <Avatar src={user.avatar} name={user.name} size="xl" />
            <div className="mt-6 text-center">
              <h2 className="text-xl font-bold">{user.name}</h2>
              <p className="text-slate-500 text-sm">{user.email}</p>
            </div>
            <div className="w-full mt-8 space-y-4 pt-8 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 flex items-center gap-2"><Shield size={14} /> {t('runtime.role')}</span>
                <RoleBadge role={user.role?.name} />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 flex items-center gap-2"><Activity size={14} /> {t('runtime.status')}</span>
                <StatusBadge status={user.status} />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 flex items-center gap-2"><Calendar size={14} /> {t('runtime.joined')}</span>
                <span className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </Card>

          <Card padding="lg">
            <h3 className="font-bold mb-6">{t('runtime.quickActionsAdmin')}</h3>
            <div className="space-y-6">
              <Select 
                label={t('runtime.changeRole')}
                options={rolesResponse?.data.map(r => ({ label: r.name, value: r._id })) || []}
                value={user.role?._id}
                onChange={(e: any) => updateRole({ id: user._id, roleId: e.target.value })}
                disabled={isUpdatingRole || user.role?.name === 'SUPER_ADMIN'}
              />
              <div className="flex gap-2">
                <Button 
                  className="flex-1" 
                  variant={user.status === 'active' ? 'outline' : 'primary'}
                  onClick={() => updateStatus({ id: user._id, status: user.status === 'active' ? 'inactive' : 'active' })}
                  isLoading={isUpdatingStatus}
                >
                  {user.status === 'active' ? t('runtime.suspendAccount') : t('runtime.activateAccount')}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Details Tabs */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
          
          <Card padding="none">
            {activeTab === 'sessions' && (
              <Table 
                columns={[
                  { key: 'ip', header: t('runtime.ipAddress'), render: (s: any) => s.deviceInfo.ip },
                  { key: 'browser', header: t('runtime.browser'), render: (s: any) => s.deviceInfo.browser },
                  { key: 'os', header: t('runtime.operatingSystem'), render: (s: any) => s.deviceInfo.os },
                  { key: 'createdAt', header: t('runtime.created'), render: (s: any) => new Date(s.createdAt).toLocaleString() },
                ]}
                data={user.sessions || []}
                emptyMessage={t('runtime.noActiveSessions')}
              />
            )}
            {activeTab === 'audit' && (
              <div className="p-12 text-center text-slate-500">
                {t('runtime.auditHistoryPlaceholder')}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
