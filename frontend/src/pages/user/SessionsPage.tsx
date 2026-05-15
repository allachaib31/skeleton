import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMySessions } from '../../features/users/hooks/useMySessions';
import { useRevokeSession } from '../../features/users/hooks/useRevokeSession';
import { useUIStore } from '@/app/stores/ui.store';
import { SessionCard } from '../../features/users/components/SessionCard';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { SEO } from '@/shared/components/seo/SEO';
import { Shield, AlertTriangle } from 'lucide-react';

export default function SessionsPage() {
  const { t } = useTranslation();
  const { setPageTitle, setBreadcrumbs } = useUIStore();
  const { data: sessionsResponse, isLoading } = useMySessions();
  const { mutate: revoke, isPending: isRevoking } = useRevokeSession();
  const [sessionToRevoke, setSessionToRevoke] = useState<string | null>(null);

  const sessions = sessionsResponse?.data || [];

  useEffect(() => {
    setPageTitle(t('sessions.title'));
    setBreadcrumbs([{ label: t('settings.security'), href: '/app/settings' }, { label: t('sessions.title') }]);
  }, [setPageTitle, setBreadcrumbs, t]);

  const handleRevoke = () => {
    if (sessionToRevoke) {
      revoke(sessionToRevoke, {
        onSuccess: () => setSessionToRevoke(null),
      });
    }
  };

  return (
    <div className="space-y-6">
      <SEO title={t('sessions.title')} description={t('runtime.deviceManagementDescription')} />

      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{t('runtime.deviceManagement')}</h1>
        <Shield size={24} className="text-primary" />
      </div>

      <p className="text-slate-500 max-w-2xl">
        {t('runtime.deviceManagementDescription')}
      </p>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))
        ) : sessions.length === 0 ? (
          <EmptyState
            icon={<AlertTriangle size={48} />}
            title={t('runtime.noSessionsFound')}
            description={t('runtime.noSessionsDescription')}
          />
        ) : (
          sessions.map((session) => (
            <SessionCard 
              key={session._id} 
              session={session} 
              onRevoke={setSessionToRevoke}
              isRevoking={isRevoking && sessionToRevoke === session._id}
            />
          ))
        )}
      </div>

      <Modal
        isOpen={!!sessionToRevoke}
        onClose={() => setSessionToRevoke(null)}
        title={t('runtime.revokeSession')}
      >
        <div className="space-y-6">
          <p className="text-slate-500">
            {t('runtime.revokeSessionDescription')}
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setSessionToRevoke(null)}>
              {t('common.cancel')}
            </Button>
            <Button 
              variant="danger" 
              onClick={handleRevoke}
              isLoading={isRevoking}
            >
              {t('runtime.confirmRevoke')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
