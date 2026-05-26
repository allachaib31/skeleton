import { useForm } from 'react-hook-form';
import { FormEvent, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { loginSchema, LoginFormValues } from '../../features/auth/schemas/auth.schema';
import { useLogin } from '../../features/auth/hooks/useLogin';
import { useVerifyTwoFactorLogin } from '../../features/auth/hooks/useTwoFactorAuth';
import { Input } from '@/shared/components/ui/Input';
import { PasswordInput } from '@/shared/components/ui/PasswordInput';
import { Checkbox } from '@/shared/components/ui/Checkbox';
import { Button } from '@/shared/components/ui/Button';
import { SEO } from '@/shared/components/seo/SEO';

export default function LoginPage() {
  const { t } = useTranslation();
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const { mutate: login, isPending } = useLogin({ onTwoFactorRequired: setTwoFactorToken });
  const { mutate: verifyTwoFactor, isPending: isVerifyingTwoFactor } = useVerifyTwoFactorLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormValues) => {
    login(data);
  };

  const submitTwoFactor = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    verifyTwoFactor({ twoFactorToken, code: twoFactorCode });
  };

  return (
    <div className="space-y-6">
      <SEO title={t('auth.login')} description={t('auth.loginDescription')} />
      
      <div className="text-center">
        <h1 className="text-2xl font-bold">{t('auth.login')}</h1>
      </div>

      {twoFactorToken ? (
      <form onSubmit={submitTwoFactor} className="space-y-4">
        <Input
          label={t('auth.twoFactorCode')}
          inputMode="numeric"
          maxLength={6}
          value={twoFactorCode}
          onChange={(event) => setTwoFactorCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
          required
        />
        <Button type="submit" className="w-full" isLoading={isVerifyingTwoFactor} disabled={twoFactorCode.length !== 6}>
          {t('auth.verifyTwoFactor')}
        </Button>
        <Button type="button" variant="ghost" className="w-full" onClick={() => setTwoFactorToken('')}>
          {t('auth.backToLogin')}
        </Button>
      </form>
      ) : (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label={t('auth.email')}
          type="email"
          placeholder="name@example.com"
          {...register('email')}
          error={errors.email?.message}
        />
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label htmlFor="login-password" className="text-sm font-medium">{t('auth.password')}</label>
            <Link 
              to="/forgot-password" 
              className="text-sm text-primary hover:underline font-medium"
            >
              {t('auth.forgotPassword')}
            </Link>
          </div>
          <PasswordInput
            id="login-password"
            {...register('password')}
            error={errors.password?.message}
          />
        </div>

        <Checkbox
          label={t('auth.rememberMe')}
          {...register('remember')}
        />

        <Button type="submit" className="w-full" isLoading={isPending}>
          {t('auth.login')}
        </Button>
      </form>
      )}

      <p className="text-center text-sm text-slate-500">
        {t('auth.noAccount')}{' '}
        <Link to="/register" className="text-primary hover:underline font-medium">
          {t('auth.createAccount')}
        </Link>
      </p>
    </div>
  );
}
