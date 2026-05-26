import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '../components/Icon';
import { Badge, ProductTile, Wordmark } from '../components/primitives';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';

type Tab = 'login' | 'register';

export default function AuthPage({ initial = 'login' }: { initial?: Tab }) {
  const { t } = useTranslation();
  const isLogin = initial === 'login';

  return (
    <div className="shop-page shop-auth-page flex min-h-screen bg-white text-[#111827]">
      <div className="flex flex-1 flex-col px-6 py-8 md:px-20 md:py-10">
        <div className="flex items-center justify-between gap-4">
          <Link to="/">
            <Wordmark size={22} onDark={false} />
          </Link>
          <div className="text-[13px] text-gray-500">
            {isLogin ? (
              <>
                {t('auth.noAccount')}{' '}
                <Link to="/register" className="font-bold text-[#100E22]">
                  {t('auth.createAccount')}
                </Link>
              </>
            ) : (
              <>
                {t('auth.hasAccount')}{' '}
                <Link to="/login" className="font-bold text-[#100E22]">
                  {t('runtime.signIn')}
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="my-auto w-full max-w-[460px] self-center py-10">
          {isLogin ? <LoginPage /> : <RegisterPage />}
        </div>

        <div className="mt-auto flex justify-between text-xs text-gray-500">
          <div>© 2026 tafa3olcard</div>
          <div className="flex gap-4">
            <span>{t('runtime.termsOfService')}</span>
            <span>{t('runtime.privacyPolicy')}</span>
            <span>{t('runtime.contactSupport')}</span>
          </div>
        </div>
      </div>

      <div className="relative hidden w-[580px] flex-col overflow-hidden bg-[#100E22] p-12 text-white md:flex">
        <svg
          viewBox="0 0 400 400"
          className="absolute -right-24 -top-24 h-[600px] w-[600px] opacity-[0.05]"
        >
          <circle cx="200" cy="200" r="180" stroke="#fdf001" strokeWidth="30" fill="none" />
          <circle cx="200" cy="200" r="120" stroke="#fdf001" strokeWidth="20" fill="none" />
        </svg>
        <div className="relative">
          <Badge kind="primary" className="mb-6">{t('shopAuth.badge')}</Badge>
          <div className="mb-4 text-[44px] font-black" style={{ lineHeight: 1, letterSpacing: '-0.03em' }}>
            {t('shopAuth.titleLine1')}
            <br />
            {t('shopAuth.titleLine2')} <span className="text-primary">{t('shopAuth.titleAccent')}</span>.
          </div>
          <div className="max-w-[380px] text-base text-white/65" style={{ lineHeight: 1.5 }}>
            {t('shopAuth.description')}
          </div>
        </div>

        <div className="relative mt-auto flex flex-col gap-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <ProductTile name={t('shopAuth.cardOneName')} sub={t('shopAuth.cardOneSub')} denom="$50" />
            </div>
            <div className="flex-1">
              <ProductTile name={t('shopAuth.cardTwoName')} sub={t('shopAuth.cardTwoSub')} denom="$30" />
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.05] p-3.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/[0.15] text-primary">
              <Icon name="bolt" size={18} />
            </div>
            <div className="flex-1 text-[13px]">
              <div className="font-bold">{t('shopAuth.instantTitle')}</div>
              <div className="text-xs text-white/55">{t('shopAuth.instantDescription')}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
