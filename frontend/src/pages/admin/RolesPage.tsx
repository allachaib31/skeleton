import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRoles, useCreateRole, useUpdateRole, useDeleteRole, usePermissionsAdmin } from '../../features/admin/hooks/useRoles';
import { useUIStore } from '@/app/stores/ui.store';
import { Table } from '@/shared/components/ui/Table';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Modal } from '@/shared/components/ui/Modal';
import { Badge } from '@/shared/components/ui/Badge';
import { SEO } from '@/shared/components/seo/SEO';
import { Shield, Plus, Edit2, Trash2, AlertTriangle, CheckSquare, Square } from 'lucide-react';

export default function RolesPage() {
  const { t } = useTranslation();
  const { setPageTitle, setBreadcrumbs } = useUIStore();
  const { data: rolesResponse, isLoading } = useRoles();
  const { data: permsResponse } = usePermissionsAdmin();
  const { mutate: create, isPending: isCreating } = useCreateRole();
  const { mutate: update, isPending: isUpdating } = useUpdateRole();
  const { mutate: deleteRole, isPending: isDeleting } = useDeleteRole();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', permissions: [] as string[] });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setPageTitle(t('runtime.rolesAndPermissions'));
    setBreadcrumbs([{ label: t('admin.panel'), href: '/admin/dashboard' }, { label: t('admin.roles') }]);
  }, [setPageTitle, setBreadcrumbs, t]);

  const handleOpenModal = (role?: any) => {
    if (role) {
      setEditingRole(role);
      setFormData({ name: role.name, description: role.description || '', permissions: role.permissions.map((p: any) => p._id) });
    } else {
      setEditingRole(null);
      setFormData({ name: '', description: '', permissions: [] });
    }
    setIsModalOpen(true);
  };

  const togglePermission = (id: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(id) 
        ? prev.permissions.filter(p => p !== id) 
        : [...prev.permissions, id]
    }));
  };

  const handleSubmit = () => {
    if (editingRole) {
      update({ id: editingRole._id, data: formData }, { onSuccess: () => setIsModalOpen(false) });
    } else {
      create(formData, { onSuccess: () => setIsModalOpen(false) });
    }
  };

  const columns = [
    { key: 'name', header: t('runtime.roleName'), render: (r: any) => <span className="font-bold">{r.name}</span> },
    { key: 'description', header: t('runtime.description') },
    { key: 'permissions', header: t('admin.permissions'), render: (r: any) => <Badge variant="info">{t('runtime.enabledCount', { count: r.permissions.length })}</Badge> },
    { 
      key: 'actions', 
      header: t('runtime.actions'), 
      render: (r: any) => (
        <div className="flex items-center gap-2">
          {!r.isSystem && (
            <>
              <Button variant="ghost" size="sm" onClick={() => handleOpenModal(r)}><Edit2 size={16} /></Button>
              <Button variant="ghost" size="sm" className="text-red-500" onClick={() => setDeleteId(r._id)}><Trash2 size={16} /></Button>
            </>
          )}
          {r.isSystem && <Badge>{t('runtime.systemRole')}</Badge>}
        </div>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <SEO title={t('runtime.rolesAndPermissions')} description={t('runtime.rolesDescription')} />

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t('runtime.accessControl')}</h1>
        <Button onClick={() => handleOpenModal()} leftIcon={<Plus size={18} />}>
          {t('runtime.createRole')}
        </Button>
      </div>

      <Table 
        columns={columns} 
        data={rolesResponse?.data || []} 
        isLoading={isLoading} 
      />

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRole ? t('runtime.editRole') : t('runtime.createNewRole')}
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input 
              label={t('runtime.roleName')}
              placeholder={t('runtime.roleNamePlaceholder')}
              value={formData.name}
              onChange={(e: any) => setFormData({ ...formData, name: e.target.value })}
            />
            <Input 
              label={t('runtime.description')}
              placeholder={t('runtime.roleDescriptionPlaceholder')}
              value={formData.description}
              onChange={(e: any) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-sm flex items-center gap-2">
              <Shield size={16} className="text-primary" />
              {t('runtime.assignPermissions')}
            </h4>
            <div className="max-h-[400px] overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              {permsResponse?.data.map((group) => (
                <div key={group.module} className="space-y-2">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
                    {group.module}
                  </h5>
                  <div className="space-y-2">
                    {group.permissions.map((p: any) => (
                      <button
                        key={p._id}
                        onClick={() => togglePermission(p._id)}
                        className={`flex items-center justify-between w-full p-2 rounded-lg text-sm transition-colors ${formData.permissions.includes(p._id) ? 'bg-primary/5 text-primary' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                      >
                        <div className="flex items-center gap-3">
                          {formData.permissions.includes(p._id) ? <CheckSquare size={16} /> : <Square size={16} className="text-slate-300" />}
                          <span>{p.displayName || p.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>{t('common.cancel')}</Button>
            <Button 
              onClick={handleSubmit}
              isLoading={isCreating || isUpdating}
              disabled={!formData.name}
            >
              {editingRole ? t('profile.saveChanges') : t('runtime.createRole')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title={t('runtime.deleteRole')}
      >
        <div className="space-y-6">
          <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-600 rounded-lg flex items-start gap-3">
            <AlertTriangle size={20} className="shrink-0 mt-0.5" />
            <p className="text-sm font-medium">
              {t('runtime.deleteRoleDescription')}
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeleteId(null)}>{t('common.cancel')}</Button>
            <Button 
              variant="danger" 
              onClick={() => deleteRole(deleteId!, { onSuccess: () => setDeleteId(null) })}
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
