import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { updateProfileSchema, UpdateProfileFormValues } from '../../features/users/schemas/users.schema';
import { useProfile } from '../../features/users/hooks/useProfile';
import { useUpdateProfile } from '../../features/users/hooks/useUpdateProfile';
import { useUIStore } from '@/app/stores/ui.store';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { AvatarUploader } from '../../features/users/components/AvatarUploader';
import { SEO } from '@/shared/components/seo/SEO';
import { Spinner } from '@/shared/components/ui/Spinner';

export default function ProfilePage() {
  const { t } = useTranslation();
  const { data: profileResponse, isLoading: isProfileLoading } = useProfile();
  const { mutate: update, isPending: isUpdating } = useUpdateProfile();
  const { setPageTitle, setBreadcrumbs } = useUIStore();

  const user = profileResponse?.data;

  useEffect(() => {
    setPageTitle(t('profile.title'));
    setBreadcrumbs([{ label: t('profile.title') }]);
  }, [setPageTitle, setBreadcrumbs, t]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
  });

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
      phone: '', // Assume phone might be part of User type or added later
      });
    }
  }, [user, reset]);

  const onSubmit = (data: UpdateProfileFormValues) => {
    update(data);
  };

  if (isProfileLoading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <SEO title={t('profile.title')} description={t('runtime.manageProfileDescription')} />
      
      <div className="lg:col-span-1">
        <Card padding="lg" className="flex flex-col items-center">
          <AvatarUploader currentAvatar={user?.avatar} name={user?.name || ''} />
          <div className="mt-6 text-center">
            <h2 className="text-xl font-bold">{user?.name}</h2>
            <p className="text-slate-500 text-sm">{user?.email}</p>
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase">
              {user?.role?.name}
            </div>
          </div>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card padding="lg">
          <h3 className="text-lg font-bold mb-6">{t('runtime.personalInformation')}</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label={t('auth.name')}
                {...register('name')}
                error={errors.name?.message}
              />
              <Input
                label={t('auth.email')}
                value={user?.email}
                disabled
                hint={t('runtime.emailCannotChange')}
              />
              <Input
                label={t('profile.phone')}
                placeholder="+1 234 567 890"
                {...register('phone')}
                error={errors.phone?.message}
              />
              <Input
                label={t('runtime.role')}
                value={user?.role?.name}
                disabled
              />
            </div>

            <div className="flex justify-end border-t border-slate-100 dark:border-slate-800 pt-6">
              <Button type="submit" isLoading={isUpdating}>
                {t('profile.saveChanges')}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
