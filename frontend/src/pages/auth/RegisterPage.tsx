import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { registerSchema, RegisterFormValues } from '../../features/auth/schemas/auth.schema';
import { useRegister } from '../../features/auth/hooks/useRegister';
import { Input } from '@/shared/components/ui/Input';
import { PasswordInput } from '@/shared/components/ui/PasswordInput';
import { Button } from '@/shared/components/ui/Button';
import { SEO } from '@/shared/components/seo/SEO';

export default function RegisterPage() {
  const { mutate: registerUser, isPending, isSuccess } = useRegister();
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch('password', '');

  const getPasswordStrength = (pass: string) => {
    if (!pass) return null;
    let score = 0;
    if (pass.length > 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score < 3) return { label: t('auth.weakPassword'), level: 'weak', color: 'bg-red-500' };
    if (score < 5) return { label: t('auth.mediumPassword'), level: 'medium', color: 'bg-yellow-500' };
    return { label: t('auth.strongPassword'), level: 'strong', color: 'bg-green-500' };
  };

  const strength = getPasswordStrength(password);

  const onSubmit = (data: RegisterFormValues) => {
    const { confirmPassword, ...requestData } = data;
    registerUser(requestData);
  };

  if (isSuccess) {
    return (
      <div className="text-center space-y-4 py-8">
        <SEO title={t('runtime.verifyYourEmail')} description={t('runtime.verifyEmailSuccessDescription')} />
        <h1 className="text-2xl font-bold text-green-600">{t('runtime.checkYourEmail')}</h1>
        <p className="text-slate-500">
          {t('runtime.verifyEmailSuccessDescription')}
        </p>
        <Link to="/login">
          <Button variant="outline" className="mt-4">{t('runtime.backToLogin')}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SEO title={t('runtime.createAccountTitle')} description={t('auth.createAccount')} />
      
      <div className="text-center">
        <h1 className="text-2xl font-bold">{t('runtime.createAccountTitle')}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label={t('auth.name')}
          placeholder="John Doe"
          {...register('name')}
          error={errors.name?.message}
        />
        <Input
          label={t('auth.email')}
          type="email"
          placeholder="name@example.com"
          {...register('email')}
          error={errors.email?.message}
        />
        
        <div className="space-y-1.5">
          <PasswordInput
            label={t('auth.password')}
            {...register('password')}
            error={errors.password?.message}
          />
          {strength && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-300 ${strength.color}`} style={{ width: `${(strength.level === 'strong' ? 100 : strength.level === 'medium' ? 60 : 30)}%` }} />
              </div>
              <span className="text-xs font-medium text-slate-500">{strength.label}</span>
            </div>
          )}
        </div>

        <PasswordInput
          label={t('auth.confirmPassword')}
          {...register('confirmPassword')}
          error={errors.confirmPassword?.message}
        />

        <Button type="submit" className="w-full" isLoading={isPending}>
          {t('runtime.createAccountTitle')}
        </Button>
      </form>

      <p className="text-center text-sm text-slate-500">
        {t('auth.hasAccount')}{' '}
        <Link to="/login" className="text-primary hover:underline font-medium">
          {t('runtime.signIn')}
        </Link>
      </p>
    </div>
  );
}
