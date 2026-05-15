import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { usePermissionsAdmin } from '../../features/admin/hooks/useRoles';
import { useUIStore } from '@/app/stores/ui.store';
import { Card } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { SEO } from '@/shared/components/seo/SEO';
import { Key, Lock } from 'lucide-react';
import { Spinner } from '@/shared/components/ui/Spinner';

export default function PermissionsPage() {
  const { t } = useTranslation();
  const { setPageTitle, setBreadcrumbs } = useUIStore();
  const { data: permsResponse, isLoading } = usePermissionsAdmin();

  useEffect(() => {
    setPageTitle(t('runtime.systemPermissions'));
    setBreadcrumbs([{ label: t('admin.panel'), href: '/admin/dashboard' }, { label: t('admin.permissions') }]);
  }, [setPageTitle, setBreadcrumbs, t]);

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <SEO title={t('runtime.systemPermissions')} description={t('runtime.systemPermissionsDescription')} />
      
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{t('runtime.permissionDictionary')}</h1>
        <Key size={24} className="text-primary" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {permsResponse?.data.map((group) => (
          <Card key={group.module} padding="lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <Lock size={18} className="text-slate-500" />
              </div>
              <h3 className="font-bold text-lg uppercase tracking-wider">{group.module}</h3>
            </div>
            <div className="space-y-4">
              {group.permissions.map((p: any) => (
                <div key={p._id} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold font-mono text-primary">{p.name}</span>
                    <Badge variant="outline" size="sm">{t('runtime.active')}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {p.description || t('runtime.permissionFallback', { name: p.name.toLowerCase().replace(/:/g, ' ') })}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
