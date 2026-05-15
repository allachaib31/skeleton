import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuditLogs } from '../../features/admin/hooks/useAuditLogs';
import { useUIStore } from '@/app/stores/ui.store';
import { Table } from '@/shared/components/ui/Table';
import { Card } from '@/shared/components/ui/Card';
import { Input } from '@/shared/components/ui/Input';
import { Select } from '@/shared/components/ui/Select';
import { ActionBadge } from '../../features/admin/components/StatusBadge';
import { JsonDiff } from '../../features/admin/components/JsonDiff';
import { SEO } from '@/shared/components/seo/SEO';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { formatRelative } from '@/shared/lib/utils/date';
import { useLanguageStore } from '@/app/stores/language.store';

export default function AuditLogsPage() {
  const { t } = useTranslation();
  const { setPageTitle, setBreadcrumbs } = useUIStore();
  const { language } = useLanguageStore();
  const [params, setParams] = useState({ page: 1, limit: 20, action: '', entity: '', search: '' });
  const { data: logsResponse, isLoading } = useAuditLogs(params);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  useEffect(() => {
    setPageTitle(t('runtime.auditLogs'));
    setBreadcrumbs([{ label: t('admin.panel'), href: '/admin/dashboard' }, { label: t('runtime.auditLogs') }]);
  }, [setPageTitle, setBreadcrumbs, t]);

  const columns = [
    { key: 'actor', header: t('runtime.actor'), render: (l: any) => (
      <div>
        <div className="font-bold text-sm">{l.actorId.name}</div>
        <div className="text-[10px] text-slate-400 truncate">{l.actorId.email}</div>
      </div>
    )},
    { key: 'action', header: t('runtime.action'), render: (l: any) => <ActionBadge action={l.action} /> },
    { key: 'entity', header: t('runtime.entity') },
    { key: 'ip', header: t('runtime.ipAddress'), render: (l: any) => <span className="text-xs font-mono">{l.ip}</span> },
    { key: 'createdAt', header: t('runtime.time'), render: (l: any) => formatRelative(l.createdAt, language) },
    { 
      key: 'expand', 
      header: '', 
      render: (l: any) => (
        <button 
          onClick={(e) => { e.stopPropagation(); setExpandedLogId(expandedLogId === l._id ? null : l._id); }}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
        >
          {expandedLogId === l._id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <SEO title={t('runtime.auditLogs')} description={t('runtime.auditLogsDescription')} />
      
      <Card padding="lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <Input 
              placeholder={t('runtime.filterActorIp')} 
              leftIcon={<Search size={18} />}
              value={params.search}
              onChange={(e: any) => setParams({ ...params, search: e.target.value, page: 1 })}
            />
          </div>
          <Select 
            options={[
              { label: t('runtime.allActions'), value: '' },
              { label: t('runtime.create'), value: 'CREATE' },
              { label: t('runtime.update'), value: 'UPDATE' },
              { label: t('common.delete'), value: 'DELETE' },
              { label: t('runtime.auth'), value: 'AUTH' },
            ]}
            value={params.action}
            onChange={(e: any) => setParams({ ...params, action: e.target.value, page: 1 })}
          />
          <Input 
            placeholder={t('runtime.entityPlaceholder')} 
            value={params.entity}
            onChange={(e: any) => setParams({ ...params, entity: e.target.value, page: 1 })}
          />
        </div>
      </Card>

      <div className="space-y-4">
        {isLoading ? (
          <Card padding="none"><Table columns={columns} data={[]} isLoading={true} /></Card>
        ) : (
          logsResponse?.data.map((log) => (
            <div key={log._id} className="space-y-2">
              <Card 
                padding="none" 
                className={`transition-all ${expandedLogId === log._id ? 'ring-2 ring-primary/20 border-primary/50' : ''}`}
                onClick={() => setExpandedLogId(expandedLogId === log._id ? null : log._id)}
              >
                <div className="p-4 grid grid-cols-6 items-center gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50">
                  <div className="col-span-1">
                    <div className="font-bold text-sm truncate">{log.actorId.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{log.actorId.email}</div>
                  </div>
                  <div className="col-span-1"><ActionBadge action={log.action} /></div>
                  <div className="col-span-1 text-sm font-medium">{log.entity}</div>
                  <div className="col-span-1 text-xs font-mono text-slate-400">{log.ip}</div>
                  <div className="col-span-1 text-xs text-slate-500">{formatRelative(log.createdAt, language)}</div>
                  <div className="col-span-1 flex justify-end">
                    {expandedLogId === log._id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>
                
                {expandedLogId === log._id && (
                  <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                    <JsonDiff before={log.before} after={log.after} />
                  </div>
                )}
              </Card>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
