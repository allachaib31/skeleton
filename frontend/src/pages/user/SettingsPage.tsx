import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { changePasswordSchema, ChangePasswordFormValues } from '../../features/auth/schemas/auth.schema';
import { useChangePassword } from '../../features/users/hooks/useChangePassword';
import { useDeleteAccount } from '../../features/users/hooks/useDeleteAccount';
import { useUIStore } from '@/app/stores/ui.store';
import { useThemeStore } from '@/app/stores/theme.store';
import { useLanguageStore } from '@/app/stores/language.store';
import { Card } from '@/shared/components/ui/Card';
import { Tabs } from '@/shared/components/ui/Tabs';
import { PasswordInput } from '@/shared/components/ui/PasswordInput';
import { Button } from '@/shared/components/ui/Button';
import { Modal } from '@/shared/components/ui/Modal';
import { SEO } from '@/shared/components/seo/SEO';
import { Sun, Moon, Laptop, Globe, Shield, Trash2 } from 'lucide-react';

export default function SettingsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('security');
  const { setPageTitle, setBreadcrumbs } = useUIStore();
  const { theme, setTheme } = useThemeStore();
  const { language, setLanguage } = useLanguageStore();
  const { mutate: changePass, isPending: isChanging } = useChangePassword();
  const { mutate: deleteAcc, isPending: isDeleting } = useDeleteAccount();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  useEffect(() => {
    setPageTitle(t('settings.title'));
    setBreadcrumbs([{ label: t('settings.title') }]);
  }, [setPageTitle, setBreadcrumbs, t]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmitPassword = (data: ChangePasswordFormValues) => {
    const { confirmPassword, ...requestData } = data;
    changePass(requestData, {
      onSuccess: () => reset(),
    });
  };

  const tabs = [
    { label: t('settings.security'), value: 'security', icon: <Shield size={18} /> },
    { label: t('settings.preferences'), value: 'preferences', icon: <Globe size={18} /> },
  ];

  return (
    <div className="space-y-8">
      <SEO title={t('settings.title')} description={t('runtime.settingsDescription')} />
      
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'security' && (
        <div className="space-y-8">
          <Card padding="lg">
            <h3 className="text-lg font-bold mb-6">{t('runtime.changePassword')}</h3>
            <form onSubmit={handleSubmit(onSubmitPassword)} className="max-w-md space-y-6">
              <PasswordInput
                label={t('runtime.currentPassword')}
                {...register('currentPassword')}
                error={errors.currentPassword?.message}
              />
              <PasswordInput
                label={t('runtime.newPassword')}
                {...register('newPassword')}
                error={errors.newPassword?.message}
              />
              <PasswordInput
                label={t('runtime.confirmNewPassword')}
                {...register('confirmPassword')}
                error={errors.confirmPassword?.message}
              />
              <Button type="submit" isLoading={isChanging}>
                {t('runtime.updatePassword')}
              </Button>
            </form>
          </Card>

          <Card padding="lg" className="border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-950/10">
            <h3 className="text-lg font-bold text-red-600 mb-2">{t('runtime.dangerZone')}</h3>
            <p className="text-slate-500 text-sm mb-6">
              {t('runtime.dangerZoneDescription')}
            </p>
            <Button variant="danger" onClick={() => setIsDeleteModalOpen(true)}>
              {t('profile.deleteAccount')}
            </Button>
          </Card>
        </div>
      )}

      {activeTab === 'preferences' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card padding="lg">
            <h3 className="text-lg font-bold mb-6">{t('runtime.themePreference')}</h3>
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => setTheme('light')}
                className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all ${theme === 'light' ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20' : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                <Sun size={24} />
                <span className="text-sm font-medium">{t('settings.light')}</span>
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all ${theme === 'dark' ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20' : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                <Moon size={24} />
                <span className="text-sm font-medium">{t('settings.dark')}</span>
              </button>
              <button
                onClick={() => setTheme('system')}
                className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all ${theme === 'system' ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20' : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                <Laptop size={24} />
                <span className="text-sm font-medium">{t('settings.system')}</span>
              </button>
            </div>
          </Card>

          <Card padding="lg">
            <h3 className="text-lg font-bold mb-6">{t('runtime.languageSettings')}</h3>
            <div className="space-y-4">
              {['en', 'fr', 'ar'].map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang as any)}
                  className={`flex w-full items-center justify-between p-4 rounded-xl border transition-all ${language === lang ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20' : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                  <span className="font-medium">
                    {lang === 'en' ? 'English' : lang === 'fr' ? 'Français' : 'العربية'}
                  </span>
                  {language === lang && <div className="h-2 w-2 rounded-full bg-primary" />}
                </button>
              ))}
            </div>
          </Card>
        </div>
      )}

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={t('profile.deleteAccount')}
      >
        <div className="space-y-6">
          <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-600 rounded-lg flex items-start gap-3">
            <Trash2 size={20} className="shrink-0 mt-0.5" />
            <p className="text-sm font-medium">
              {t('runtime.deleteAccountWarning')}
            </p>
          </div>
          <div className="space-y-4">
            <PasswordInput
              label={t('runtime.confirmWithPassword')}
              placeholder={t('runtime.enterCurrentPassword')}
              value={deletePassword}
              onChange={(e: any) => setDeletePassword(e.target.value)}
            />
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button 
                variant="danger" 
                onClick={() => deleteAcc(deletePassword)}
                isLoading={isDeleting}
                disabled={!deletePassword}
              >
                {t('runtime.permanentlyDelete')}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
