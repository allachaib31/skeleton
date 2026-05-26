import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SEO } from '@/shared/components/seo/SEO';
import { useLanguageStore } from '@/app/stores/language.store';
import { useUIStore } from '@/app/stores/ui.store';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Select } from '@/shared/components/ui/Select';
import { Table } from '@/shared/components/ui/Table';
import { useAdminClient, useClientLevels, useGenerateClientLevels, useUpdateClientLevel } from '@/features/clients/hooks/clients.hooks';
import { ClientLevelGroup, ClientServiceLevel } from '@/features/clients/types/client.types';

export default function ClientLevelsPage() {
  const { id = '' } = useParams();
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const { setPageTitle, setBreadcrumbs } = useUIStore();
  const { data: clientResponse } = useAdminClient(id, { page: 1, limit: 10 });
  const { data: levelsResponse, isLoading } = useClientLevels(id);
  const { mutate: updateLevel, isPending } = useUpdateClientLevel(id);
  const { mutate: generateLevels, isPending: isGeneratingLevels } = useGenerateClientLevels(id);
  const client = clientResponse?.data.client;
  const levelData = levelsResponse?.data;
  const levels = levelData?.levels || [];

  useEffect(() => {
    setPageTitle(t('clients.levels'));
    setBreadcrumbs([
      { label: t('admin.panel'), href: '/admin/dashboard' },
      { label: t('clients.title'), href: '/admin/clients' },
      { label: client ? client.name : t('clients.details'), href: `/admin/clients/${id}` },
      { label: t('clients.levels') },
    ]);
  }, [client, id, setPageTitle, setBreadcrumbs, t]);

  const getLocalizedName = (value: { en: string; fr: string; ar: string }) => {
    const key = language.split('-')[0] as 'en' | 'fr' | 'ar';
    return value[key] || value.en;
  };

  const groupsForLevel = (level: ClientServiceLevel) =>
    [...(level.availableGroups || [])].sort((a, b) => a.entitlementValue - b.entitlementValue);

  const changeLevel = (level: ClientServiceLevel, group: ClientLevelGroup) => {
    updateLevel({ levelId: level._id, groupId: group._id });
  };

  const moveByStep = (level: ClientServiceLevel, direction: 1 | -1) => {
    const currentGroup = level.groupId;
    if (!currentGroup) return;
    const serviceGroups = groupsForLevel(level);
    const currentIndex = serviceGroups.findIndex((group) => group._id === currentGroup._id);
    const next = serviceGroups[currentIndex + direction];
    if (next) changeLevel(level, next);
  };

  const columns = [
    {
      key: 'service',
      header: t('clients.service'),
      render: (level: ClientServiceLevel) => (
        <div className="flex items-center gap-3">
          {level.serviceId.image?.secureUrl && <img src={level.serviceId.image.secureUrl} alt={getLocalizedName(level.serviceId.name)} className="h-10 w-10 rounded object-cover" />}
          <div>
            <div className="font-bold">{getLocalizedName(level.serviceId.name)}</div>
            <div className="text-xs text-slate-500">{t(`stocks.serviceTypes.${level.serviceId.type}`)}</div>
          </div>
        </div>
      ),
    },
    { key: 'level', header: t('clients.currentLevel'), render: (level: ClientServiceLevel) => (
      level.groupId ? <Badge variant="info">{level.groupId.name}</Badge> : <Badge variant="danger">{t('clients.invalidLevel')}</Badge>
    ) },
    { key: 'points', header: t('clients.points'), render: (level: ClientServiceLevel) => level.points },
    { key: 'entitlement', header: t('clients.entitlementValue'), render: (level: ClientServiceLevel) => level.groupId?.entitlementValue ?? '-' },
    {
      key: 'select',
      header: t('clients.changeLevel'),
      render: (level: ClientServiceLevel) => (
        <Select
          value={level.groupId?._id || ''}
          options={groupsForLevel(level).map((group) => ({ value: group._id, label: `${group.name} (${group.entitlementValue})` }))}
          onChange={(event) => updateLevel({ levelId: level._id, groupId: event.target.value })}
          disabled={isPending}
        />
      ),
    },
    {
      key: 'actions',
      header: t('runtime.actions'),
      render: (level: ClientServiceLevel) => {
        const serviceGroups = groupsForLevel(level);
        const currentIndex = level.groupId ? serviceGroups.findIndex((group) => group._id === level.groupId?._id) : -1;
        return (
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" disabled={isPending || currentIndex <= 0} onClick={() => moveByStep(level, -1)}><TrendingDown size={16} /></Button>
            <Button type="button" variant="ghost" size="sm" disabled={isPending || currentIndex < 0 || currentIndex >= serviceGroups.length - 1} onClick={() => moveByStep(level, 1)}><TrendingUp size={16} /></Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <SEO title={t('clients.levels')} description={t('clients.levelsDescription')} />
      <Link to={`/admin/clients/${id}`} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary">
        <ArrowLeft size={16} /> {t('clients.backToClient')}
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('clients.levels')}</h1>
          <p className="text-sm text-slate-500">{client?.name}</p>
          {levelData?.canGenerateLevels && (
            <p className="mt-1 text-sm text-amber-500">
              {t('clients.levelsNeedGeneration', {
                missing: levelData.missingLevelCount,
                invalid: levelData.invalidLevelCount,
              })}
            </p>
          )}
          {Boolean(levelData?.skippedNoGroupCount) && (
            <p className="mt-1 text-sm text-slate-500">
              {t('clients.levelsSkippedNoGroup', { count: levelData?.skippedNoGroupCount })}
            </p>
          )}
        </div>
        {levelData?.canGenerateLevels && (
          <Button
            type="button"
            onClick={() => generateLevels()}
            isLoading={isGeneratingLevels}
            leftIcon={<RefreshCw size={16} />}
          >
            {t('clients.generateLevels')}
          </Button>
        )}
      </div>
      <Table columns={columns} data={levels} isLoading={isLoading} getRowKey={(level) => level._id} />
    </div>
  );
}
