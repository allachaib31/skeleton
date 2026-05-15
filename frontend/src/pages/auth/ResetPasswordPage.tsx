import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { resetPasswordSchema, ResetPasswordFormValues } from '../../features/auth/schemas/auth.schema';
import { useResetPassword } from '../../features/auth/hooks/useResetPassword';
import { PasswordInput } from '@/shared/components/ui/PasswordInput';
import { Button } from '@/shared/components/ui/Button';
import { SEO } from '@/shared/components/seo/SEO';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { mutate: reset, isPending } = useResetPassword(token || '');
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const onSubmit = (data: ResetPasswordFormValues) => {
    const { confirmPassword, ...requestData } = data;
    reset(requestData);
  };

  return (
    <div className="space-y-6">
      <SEO title={t('auth.resetPassword')} description={t('runtime.resetPasswordDescription')} />
      
      <div className="text-center">
        <h1 className="text-2xl font-bold">{t('auth.resetPassword')}</h1>
        <p className="text-slate-500 text-sm mt-2">
          {t('runtime.resetPasswordDescription')}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <PasswordInput
          label={t('runtime.newPassword')}
          {...register('password')}
          error={errors.password?.message}
        />
        <PasswordInput
          label={t('runtime.confirmNewPassword')}
          {...register('confirmPassword')}
          error={errors.confirmPassword?.message}
        />

        <Button type="submit" className="w-full" isLoading={isPending}>
          {t('auth.resetPassword')}
        </Button>
      </form>
    </div>
  );
}
