import { useTranslation } from 'react-i18next';
import { Session } from '@/shared/types/auth.types';
import { Card } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { formatRelative } from '@/shared/lib/utils/date';
import { Laptop, Smartphone, Monitor, Trash2 } from 'lucide-react';
import { useLanguageStore } from '@/app/stores/language.store';

interface SessionCardProps {
  session: Session;
  onRevoke: (id: string) => void;
  isRevoking?: boolean;
}

export function SessionCard({ session, onRevoke, isRevoking }: SessionCardProps) {
  const { language } = useLanguageStore();
  const { t } = useTranslation();
  const { deviceInfo, createdAt, isCurrent, _id } = session;

  const getIcon = () => {
    const ua = deviceInfo.userAgent.toLowerCase();
    if (ua.includes('mobi')) return <Smartphone size={24} />;
    if (ua.includes('electron')) return <Laptop size={24} />;
    return <Monitor size={24} />;
  };

  return (
    <Card className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500">
          {getIcon()}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-sm">
              {deviceInfo.browser || t('runtime.unknownBrowser')} {t('runtime.onDevice')} {deviceInfo.os || t('runtime.unknownOs')}
            </h4>
            {isCurrent && <Badge variant="success">{t('runtime.currentSession')}</Badge>}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {t('runtime.ipAddress')}: {deviceInfo.ip} • {t('runtime.lastActive')}: {formatRelative(createdAt, language)}
          </p>
        </div>
      </div>

      {!isCurrent && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
          onClick={() => onRevoke(_id)}
          isLoading={isRevoking}
        >
          <Trash2 size={18} />
        </Button>
      )}
    </Card>
  );
}
