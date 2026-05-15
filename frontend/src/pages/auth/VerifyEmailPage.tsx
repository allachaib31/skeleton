import { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useVerifyEmail } from '../../features/auth/hooks/useVerifyEmail';
import { Spinner } from '@/shared/components/ui/Spinner';
import { Button } from '@/shared/components/ui/Button';
import { SEO } from '@/shared/components/seo/SEO';
import { CheckCircle, XCircle } from 'lucide-react';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { mutate: verify, isPending, isSuccess, isError } = useVerifyEmail();
  const { t } = useTranslation();

  useEffect(() => {
    if (token) {
      verify(token);
    }
  }, [token, verify]);

  return (
    <div className="text-center space-y-6 py-8">
      <SEO title={t('auth.verifyEmail')} description={t('runtime.verifyingEmailDescription')} />

      {isPending && (
        <>
          <Spinner size="lg" className="mx-auto" />
          <h1 className="text-xl font-medium">{t('runtime.verifyingEmail')}</h1>
          <p className="text-slate-500 text-sm">{t('runtime.verifyingEmailDescription')}</p>
        </>
      )}

      {isSuccess && (
        <>
          <CheckCircle className="mx-auto text-green-500 w-16 h-16" />
          <h1 className="text-2xl font-bold">{t('runtime.emailVerified')}</h1>
          <p className="text-slate-500">
            {t('runtime.emailVerifiedDescription')}
          </p>
          <Link to="/login">
            <Button className="mt-4">{t('runtime.goToLogin')}</Button>
          </Link>
        </>
      )}

      {isError && (
        <>
          <XCircle className="mx-auto text-red-500 w-16 h-16" />
          <h1 className="text-2xl font-bold">{t('runtime.verificationFailed')}</h1>
          <p className="text-slate-500">
            {t('runtime.verificationFailedDescription')}
          </p>
          <div className="flex flex-col gap-2 mt-4">
            <Link to="/login">
              <Button variant="outline" className="w-full">{t('runtime.backToLogin')}</Button>
            </Link>
          </div>
        </>
      )}

      {!token && (
        <div className="space-y-4">
          <h1 className="text-xl font-bold">{t('runtime.missingToken')}</h1>
          <p className="text-slate-500">{t('runtime.missingTokenDescription')}</p>
          <Link to="/login">
            <Button variant="outline">{t('runtime.backToLogin')}</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
