import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { forgotPasswordSchema, ForgotPasswordFormValues } from '../../features/auth/schemas/auth.schema';
import { useForgotPassword } from '../../features/auth/hooks/useForgotPassword';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { SEO } from '@/shared/components/seo/SEO';

export default function ForgotPasswordPage() {
  const { mutate: forgotPass, isPending, isSuccess } = useForgotPassword();
  const [countdown, setCountdown] = useState(0);
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const onSubmit = (data: ForgotPasswordFormValues) => {
    forgotPass(data);
    setCountdown(60);
  };

  if (isSuccess) {
    return (
      <div className="text-center space-y-4 py-8">
        <SEO title={t('runtime.resetLinkSent')} description={t('runtime.resetLinkSentDescription')} />
        <h1 className="text-2xl font-bold">{t('runtime.checkYourEmail')}</h1>
        <p className="text-slate-500">
          {t('runtime.resetLinkSentDescription')}
        </p>
        <Link to="/login">
          <Button variant="outline" className="mt-4">{t('runtime.backToLogin')}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SEO title={t('runtime.forgotPasswordTitle')} description={t('runtime.forgotPasswordDescription')} />
      
      <div className="text-center">
        <h1 className="text-2xl font-bold">{t('runtime.forgotPasswordTitle')}</h1>
        <p className="text-slate-500 text-sm mt-2">
          {t('runtime.forgotPasswordDescription')}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label={t('auth.email')}
          type="email"
          placeholder="name@example.com"
          {...register('email')}
          error={errors.email?.message}
        />

        <Button 
          type="submit" 
          className="w-full" 
          isLoading={isPending}
          disabled={countdown > 0}
        >
          {countdown > 0 ? t('runtime.retryInSeconds', { count: countdown }) : t('runtime.sendResetLink')}
        </Button>
      </form>

      <p className="text-center text-sm text-slate-500">
        {t('runtime.rememberedPassword')}{' '}
        <Link to="/login" className="text-primary hover:underline font-medium">
          {t('runtime.signIn')}
        </Link>
      </p>
    </div>
  );
}
