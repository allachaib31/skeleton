import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdminUploads, useDeleteUpload } from '../../features/admin/hooks/useAdminUploads';
import { useUIStore } from '@/app/stores/ui.store';
import { Table } from '@/shared/components/ui/Table';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Modal } from '@/shared/components/ui/Modal';
import { SEO } from '@/shared/components/seo/SEO';
import { HardDrive, Trash2, ExternalLink, AlertTriangle, FileIcon } from 'lucide-react';
import { formatBytes } from '@/shared/lib/utils/format';

export default function UploadsPage() {
  const { t } = useTranslation();
  const { setPageTitle, setBreadcrumbs } = useUIStore();
  const [params] = useState({ page: 1, limit: 15 });
  const { data: uploadsResponse, isLoading } = useAdminUploads(params);
  const { mutate: deleteUpload, isPending: isDeleting } = useDeleteUpload();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setPageTitle(t('runtime.storageManagement'));
    setBreadcrumbs([{ label: t('admin.panel'), href: '/admin/dashboard' }, { label: t('admin.uploads') }]);
  }, [setPageTitle, setBreadcrumbs, t]);

  const columns = [
    { 
      key: 'file', 
      header: t('runtime.file'), 
      render: (u: any) => (
        <div className="flex items-center gap-3">
          {u.format.match(/jpg|jpeg|png|gif|webp/i) ? (
            <img src={u.secureUrl} className="h-10 w-10 rounded object-cover shadow-sm" alt={t('runtime.thumbnail')} />
          ) : (
            <div className="h-10 w-10 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <FileIcon size={20} className="text-slate-400" />
            </div>
          )}
          <div className="text-xs font-mono max-w-[200px] truncate">{u.secureUrl.split('/').pop()}</div>
        </div>
      )
    },
    { key: 'owner', header: t('runtime.owner'), render: (u: any) => (
      <div>
        <div className="text-sm font-medium">{u.ownerId.name}</div>
        <div className="text-[10px] text-slate-400">{u.ownerId.email}</div>
      </div>
    )},
    { key: 'size', header: t('runtime.size'), render: (u: any) => formatBytes(u.size) },
    { key: 'format', header: t('runtime.format'), render: (u: any) => <Badge variant="outline">{u.format.toUpperCase()}</Badge> },
    { key: 'createdAt', header: t('runtime.uploaded'), render: (u: any) => new Date(u.createdAt).toLocaleDateString() },
    { 
      key: 'actions', 
      header: t('runtime.actions'), 
      render: (u: any) => (
        <div className="flex items-center gap-2">
          <a href={u.secureUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="sm"><ExternalLink size={16} /></Button>
          </a>
          <Button variant="ghost" size="sm" className="text-red-500" onClick={() => setDeleteId(u._id)}>
            <Trash2 size={16} />
          </Button>
        </div>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <SEO title={t('runtime.storageManagement')} description={t('runtime.storageManagementDescription')} />

      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-2xl font-bold">{t('runtime.cloudStorage')}</h1>
        <HardDrive size={24} className="text-primary" />
      </div>

      <Table 
        columns={columns} 
        data={uploadsResponse?.data || []} 
        isLoading={isLoading} 
      />

      {/* Delete Modal */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title={t('runtime.deleteUpload')}
      >
        <div className="space-y-6">
          <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-600 rounded-lg flex items-start gap-3">
            <AlertTriangle size={20} className="shrink-0 mt-0.5" />
            <p className="text-sm font-medium">
              {t('runtime.deleteUploadDescription')}
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeleteId(null)}>{t('common.cancel')}</Button>
            <Button 
              variant="danger" 
              onClick={() => deleteUpload(deleteId!, { onSuccess: () => setDeleteId(null) })}
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
