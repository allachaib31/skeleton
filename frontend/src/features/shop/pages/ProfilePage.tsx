import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Icon, IconName } from '../components/Icon';
import { Badge, Btn, Field, Input } from '../components/primitives';
import { useProfile } from '@/features/users/hooks/useProfile';
import { useMyLevels, useMySessions } from '@/features/users/hooks/useMySessions';
import { useRevokeSession } from '@/features/users/hooks/useRevokeSession';
import { useUpdateProfile, useUploadAvatar } from '@/features/users/hooks/useUpdateProfile';
import { useChangePassword } from '@/features/users/hooks/useChangePassword';
import { useDisableTwoFactor, useEnableTwoFactor, useSetupTwoFactor } from '@/features/auth/hooks/useTwoFactorAuth';
import { countries, getCountryByIso, getCountryName } from '@/shared/constants/countries';
import { formatDate, formatRelative } from '@/shared/lib/utils/date';
import { useLanguageStore } from '@/app/stores/language.store';
import { localized } from '../utils/shop-format';
import { Session, User } from '@/shared/types/auth.types';
import { Pagination } from '@/shared/components/ui/Pagination';

type Tab = 'profile' | 'security' | 'levels' | 'sessions';

const TABS: Array<{ id: Tab; labelKey: string; icon: IconName }> = [
  { id: 'profile', labelKey: 'profile.title', icon: 'user' },
  { id: 'security', labelKey: 'shopProfile.securityTab', icon: 'shield' },
  { id: 'levels', labelKey: 'shopProfile.levelsTab', icon: 'star' },
  { id: 'sessions', labelKey: 'sessions.title', icon: 'lock' },
];

type ProfileForm = {
  name: string;
  username: string;
  firstName: string;
  lastName: string;
  countryIso: string;
  countryCode: string;
  countryFlag: string;
  phoneNumber: string;
};

const emptyProfileForm: ProfileForm = {
  name: '',
  username: '',
  firstName: '',
  lastName: '',
  countryIso: '',
  countryCode: '',
  countryFlag: '',
  phoneNumber: '',
};

export default function ProfilePage() {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const { data: profileResponse, isLoading } = useProfile();
  const user = profileResponse?.data;
  const [tab, setTab] = useState<Tab>('profile');
  const initials = getInitials(user);
  const completion = getProfileCompletion(user);

  return (
    <div className="flex flex-col gap-5">
      <section className="relative overflow-hidden rounded-3xl bg-[#100E22] p-6 text-white md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <AvatarBlock user={user} initials={initials} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="break-words text-3xl font-black [overflow-wrap:anywhere]" style={{ letterSpacing: '-0.02em' }}>
                {user?.name || user?.email || t('runtime.user')}
              </h1>
              <Badge kind={user?.isEmailVerified ? 'success' : 'warning'} dot>
                {user?.isEmailVerified ? t('shopProfile.verified') : t('shopProfile.unverified')}
              </Badge>
              {user?.twoFactorEnabled && (
                <Badge kind="primary" dot>{t('shopProfile.twoFactorShort')}</Badge>
              )}
            </div>
            <div className="mt-1 break-words text-sm text-white/65 [overflow-wrap:anywhere]">
              {user?.email || t('profile.email')} · {user?.countryFlag || ''} {user?.countryCode || ''} {user?.phoneNumber || t('shopProfile.noPhone')}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
              <HeaderMetric label={t('shopProfile.balance')} value={formatMoney(user?.balance)} />
              <HeaderMetric label={t('shopProfile.totalExpenses')} value={formatMoney(user?.totalExpenses)} />
              <HeaderMetric label={t('shopProfile.referralWin')} value={formatMoney(user?.totalReferralWin)} />
              <HeaderMetric label={t('shopProfile.memberSince')} value={user?.createdAt ? formatDate(user.createdAt, language) : '-'} />
            </div>
          </div>
          <div className="min-w-[180px] rounded-2xl bg-white/[0.08] p-4">
            <div className="text-xs font-bold uppercase text-white/50">{t('shopProfile.profileComplete')}</div>
            <div className="mt-2 text-3xl font-black">{completion}%</div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-primary" style={{ width: `${completion}%` }} />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[250px_1fr]">
        <nav className="h-fit rounded-2xl border border-gray-200 bg-white p-2">
          {TABS.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={clsx(
                'flex w-full items-center gap-3 rounded-[10px] px-3.5 py-3 text-start text-sm transition',
                tab === item.id
                  ? 'bg-[#F8FAFC] font-extrabold text-[#100E22]'
                  : 'font-semibold text-[#111827] hover:bg-[#F8FAFC]',
              )}
            >
              <Icon name={item.icon} size={16} />
              <span className="min-w-0 flex-1 break-words [overflow-wrap:anywhere]">{t(item.labelKey)}</span>
            </button>
          ))}
        </nav>

        <div>
          {tab === 'profile' && <ProfileTab user={user} isLoading={isLoading} />}
          {tab === 'security' && <SecurityTab user={user} />}
          {tab === 'levels' && <LevelsTab />}
          {tab === 'sessions' && <SessionsTab />}
        </div>
      </div>
    </div>
  );
}

function ProfileTab({ user, isLoading }: { user?: User; isLoading: boolean }) {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const { mutate: updateProfile, isPending: isUpdating } = useUpdateProfile();
  const { mutate: uploadAvatar, isPending: isUploading } = useUploadAvatar();
  const [form, setForm] = useState<ProfileForm>(emptyProfileForm);

  useEffect(() => {
    if (!user) return;
    const country = user.countryIso ? getCountryByIso(user.countryIso) : undefined;
    setForm({
      name: user.name || '',
      username: user.username || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      countryIso: user.countryIso || '',
      countryCode: user.countryCode || country?.callingCode || '',
      countryFlag: user.countryFlag || country?.flag || '',
      phoneNumber: user.phoneNumber || '',
    });
  }, [user]);

  const updateField = (key: keyof ProfileForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleCountryChange = (iso: string) => {
    const country = getCountryByIso(iso);
    setForm((current) => ({
      ...current,
      countryIso: iso,
      countryCode: country?.callingCode || '',
      countryFlag: country?.flag || '',
    }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    updateProfile(cleanProfilePayload(form));
  };

  const handleAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) uploadAvatar(file);
    event.target.value = '';
  };

  const copyInvitation = async () => {
    if (!user?.invitationCode) return;
    await navigator.clipboard.writeText(user.invitationCode);
    toast.success(t('shopProfile.copied'));
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-white p-6 md:p-7">
      <SectionTitle title={t('shopProfile.personalInformation')} description={t('shopProfile.personalInformationDescription')} />

      <div className="mt-5 flex flex-col gap-4 border-b border-gray-100 pb-5 sm:flex-row sm:items-center">
        <AvatarBlock user={user} initials={getInitials(user)} size="md" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-black text-[#100E22]">{t('profile.uploadAvatar')}</div>
          <div className="mt-1 text-xs font-semibold text-gray-500">{t('shopProfile.avatarDescription')}</div>
        </div>
        <label className="inline-flex">
          <input type="file" accept="image/*" className="sr-only" onChange={handleAvatar} disabled={isUploading} />
          <span className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 text-sm font-bold text-[#100E22] transition hover:bg-gray-50">
            <Icon name="upload" size={16} />
            {isUploading ? t('common.loading') : t('profile.uploadAvatar')}
          </span>
        </label>
      </div>

      <div className="mt-5 grid gap-3.5 md:grid-cols-2">
        <Field label={t('profile.name')}>
          <Input value={form.name} onChange={(event) => updateField('name', event.target.value)} disabled={isLoading} />
        </Field>
        <Field label={t('shopProfile.username')}>
          <Input value={form.username} onChange={(event) => updateField('username', event.target.value)} disabled={isLoading} />
        </Field>
        <Field label={t('shopProfile.firstName')}>
          <Input value={form.firstName} onChange={(event) => updateField('firstName', event.target.value)} disabled={isLoading} />
        </Field>
        <Field label={t('shopProfile.lastName')}>
          <Input value={form.lastName} onChange={(event) => updateField('lastName', event.target.value)} disabled={isLoading} />
        </Field>
        <Field label={t('profile.email')} action={<Badge kind={user?.isEmailVerified ? 'success' : 'warning'}>{user?.isEmailVerified ? t('shopProfile.verified') : t('shopProfile.unverified')}</Badge>}>
          <Input value={user?.email || ''} disabled type="email" />
        </Field>
        <Field label={t('shopProfile.country')}>
          <select
            value={form.countryIso}
            onChange={(event) => handleCountryChange(event.target.value)}
            className="h-11 rounded-[10px] border border-gray-200 bg-white px-3 text-[15px] font-medium text-[#111827] outline-none transition focus:border-[#100E22] focus:ring-2 focus:ring-[#100E22]/10"
            disabled={isLoading}
          >
            <option value="">{t('shopProfile.selectCountry')}</option>
            {countries.map((country) => (
              <option key={country.iso} value={country.iso}>
                {country.flag} {getCountryName(country.iso, language)} ({country.callingCode})
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('shopProfile.countryCode')}>
          <Input value={form.countryCode} onChange={(event) => updateField('countryCode', event.target.value)} disabled={isLoading} />
        </Field>
        <Field label={t('profile.phone')}>
          <Input value={form.phoneNumber} onChange={(event) => updateField('phoneNumber', event.target.value)} icon="phone" disabled={isLoading} />
        </Field>
        <Field label={t('shopProfile.invitationCode')} hint={t('shopProfile.invitationHint')} className="md:col-span-2">
          <Input
            value={user?.invitationCode || ''}
            disabled
            suffix={user?.invitationCode ? (
              <Btn kind="ghost" size="sm" icon="copy" onClick={copyInvitation}>{t('common.copy')}</Btn>
            ) : undefined}
          />
        </Field>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Btn kind="dark" type="submit" disabled={isUpdating || isLoading}>
          {isUpdating ? t('common.loading') : t('profile.saveChanges')}
        </Btn>
      </div>
    </form>
  );
}

function SecurityTab({ user }: { user?: User }) {
  const { t } = useTranslation();
  const { mutate: setupTwoFactor, data: setupResponse, isPending: isSettingUp } = useSetupTwoFactor();
  const { mutate: enableTwoFactor, isPending: isEnabling } = useEnableTwoFactor();
  const { mutate: disableTwoFactor, isPending: isDisabling } = useDisableTwoFactor();
  const { mutate: changePassword, isPending: isChangingPassword } = useChangePassword();
  const [enableCode, setEnableCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const submitPassword = (event: FormEvent) => {
    event.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error(t('shopProfile.passwordMismatch'));
      return;
    }
    changePassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <SectionTitle title={t('settings.twoFactorTitle')} description={t('settings.twoFactorDescription')} />
          <Badge kind={user?.twoFactorEnabled ? 'success' : 'warning'} dot>
            {user?.twoFactorEnabled ? t('settings.twoFactorEnabledStatus') : t('shopProfile.twoFactorDisabledStatus')}
          </Badge>
        </div>

        {!user?.twoFactorEnabled ? (
          <div className="mt-5 grid gap-5 lg:grid-cols-[280px_1fr]">
            <div className="rounded-2xl bg-[#F8FAFC] p-4">
              {setupResponse?.data?.qrCodeDataUrl ? (
                <img src={setupResponse.data.qrCodeDataUrl} alt={t('settings.twoFactorQrAlt')} className="mx-auto h-48 w-48 rounded-xl bg-white p-2" />
              ) : (
                <div className="grid h-48 place-items-center rounded-xl bg-white text-center text-sm font-bold text-gray-500">
                  {t('shopProfile.qrWaiting')}
                </div>
              )}
              {setupResponse?.data?.secret && (
                <div className="mt-3 break-all rounded-xl bg-white p-3 text-center text-xs font-bold text-gray-500">
                  {setupResponse.data.secret}
                </div>
              )}
            </div>
            <div className="flex flex-col justify-center gap-3">
              <Btn kind="dark" icon="shield" onClick={() => setupTwoFactor()} disabled={isSettingUp}>
                {isSettingUp ? t('common.loading') : t('settings.setupTwoFactor')}
              </Btn>
              <Field label={t('settings.twoFactorCode')} hint={t('shopProfile.twoFactorEnableHint')}>
                <Input value={enableCode} onChange={(event) => setEnableCode(event.target.value)} inputMode="numeric" />
              </Field>
              <Btn kind="primary" onClick={() => enableTwoFactor(enableCode)} disabled={!setupResponse?.data || enableCode.length < 6 || isEnabling}>
                {isEnabling ? t('common.loading') : t('settings.enableTwoFactor')}
              </Btn>
            </div>
          </div>
        ) : (
          <div className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <Field label={t('auth.password')}>
              <Input type="password" value={disablePassword} onChange={(event) => setDisablePassword(event.target.value)} />
            </Field>
            <Field label={t('settings.twoFactorCode')}>
              <Input value={disableCode} onChange={(event) => setDisableCode(event.target.value)} inputMode="numeric" />
            </Field>
            <Btn
              kind="danger"
              onClick={() => disableTwoFactor({ currentPassword: disablePassword, code: disableCode })}
              disabled={disablePassword.length === 0 || disableCode.length < 6 || isDisabling}
            >
              {isDisabling ? t('common.loading') : t('settings.disableTwoFactor')}
            </Btn>
          </div>
        )}
      </section>

      <form onSubmit={submitPassword} className="rounded-2xl border border-gray-200 bg-white p-6">
        <SectionTitle title={t('profile.changePassword')} description={t('shopProfile.changePasswordDescription')} />
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <Field label={t('shopProfile.currentPassword')}>
            <Input type="password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))} />
          </Field>
          <Field label={t('shopProfile.newPassword')}>
            <Input type="password" value={passwordForm.newPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))} />
          </Field>
          <Field label={t('shopProfile.confirmPassword')}>
            <Input type="password" value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))} />
          </Field>
        </div>
        <div className="mt-4">
          <Btn kind="dark" type="submit" disabled={isChangingPassword}>
            {isChangingPassword ? t('common.loading') : t('profile.changePassword')}
          </Btn>
        </div>
      </form>
    </div>
  );
}

function LevelsTab() {
  const { t, i18n } = useTranslation();
  const { data: levelsResponse, isLoading } = useMyLevels();
  const levels = levelsResponse?.data?.levels || [];

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 md:p-7">
      <SectionTitle title={t('shopProfile.levelsTitle')} description={t('shopProfile.levelsDescription')} />
      <div className="mt-5 flex flex-col gap-3">
        {isLoading ? (
          <LoadingRows />
        ) : levels.length === 0 ? (
          <EmptyState icon="star" title={t('shopProfile.noLevels')} description={t('shopProfile.noLevelsDescription')} />
        ) : (
          levels.map((level) => {
            const current = level.groupId;
            const next = level.availableGroups.find((group) => group.entitlementValue > (current?.entitlementValue ?? 0));
            const target = next?.entitlementValue || current?.entitlementValue || Math.max(level.points, 1);
            const progress = Math.min(100, Math.round((level.points / Math.max(target, 1)) * 100));

            return (
              <div key={level._id} className="flex flex-col gap-4 rounded-2xl bg-[#F8FAFC] p-4 md:flex-row md:items-center">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#100E22] text-primary">
                  <Icon name="star" size={22} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <div className="break-words text-base font-black text-[#100E22] [overflow-wrap:anywhere]">
                        {localized(level.serviceId.name, i18n.language, t('shopProfile.service'))}
                      </div>
                      <div className="text-xs font-semibold text-gray-500">
                        {current?.name || t('shopProfile.noLevelGroup')}
                      </div>
                    </div>
                    <Badge kind={current?.isDefault ? 'soft' : 'primary'}>
                      {current?.isDefault ? t('shopProfile.defaultLevel') : t('shopProfile.customLevel')}
                    </Badge>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                    <div className="h-full rounded-full bg-[#100E22]" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs font-bold text-gray-500">
                    <span>{t('shopProfile.pointsValue', { points: level.points })}</span>
                    <span>{next ? t('shopProfile.nextLevelAt', { points: next.entitlementValue, name: next.name }) : t('shopProfile.highestLevel')}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function SessionsTab() {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const { data: sessionsResponse, isLoading } = useMySessions();
  const { mutate: revokeSession, isPending } = useRevokeSession();
  const sessions = sessionsResponse?.data || [];
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const totalPages = Math.max(1, Math.ceil(sessions.length / limit));
  const startIndex = (page - 1) * limit;
  const visibleSessions = sessions.slice(startIndex, startIndex + limit);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 md:p-7">
      <SectionTitle title={t('sessions.title')} description={t('shopProfile.sessionsDescription')} />
      <div className="mt-5 flex flex-col gap-2">
        {isLoading ? (
          <LoadingRows />
        ) : sessions.length === 0 ? (
          <EmptyState icon="lock" title={t('runtime.noActiveSessions')} description={t('runtime.noSessionsDescription')} />
        ) : (
          visibleSessions.map((session) => (
            <SessionRow
              key={session._id || session.id}
              session={session}
              language={language}
              isRevoking={isPending}
              onRevoke={() => revokeSession(session._id || session.id || '')}
            />
          ))
        )}
      </div>
      {sessions.length > 0 && (
        <div className="mt-5 flex flex-col gap-4 border-t border-gray-100 pt-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-bold text-gray-500">{t('runtime.rowsPerPage')}</span>
            <select
              value={limit}
              onChange={(event) => {
                setLimit(Number(event.target.value));
                setPage(1);
              }}
              className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm font-bold text-[#100E22] outline-none transition focus:border-[#100E22] focus:ring-2 focus:ring-[#100E22]/10"
            >
              {[5, 10, 20, 50].map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <span className="text-sm font-semibold text-gray-500">
              {t('shopProfile.sessionsRange', {
                start: sessions.length === 0 ? 0 : startIndex + 1,
                end: Math.min(startIndex + limit, sessions.length),
                total: sessions.length,
              })}
            </span>
          </div>
          <Pagination total={sessions.length} page={page} limit={limit} onChange={setPage} className="justify-start md:justify-end" />
        </div>
      )}
    </section>
  );
}

function SessionRow({
  session,
  language,
  isRevoking,
  onRevoke,
}: {
  session: Session;
  language: string;
  isRevoking: boolean;
  onRevoke: () => void;
}) {
  const { t } = useTranslation();
  const device = session.deviceInfo?.device || session.deviceInfo?.browser || t('sessions.device');
  const browser = session.deviceInfo?.browser;
  const os = session.deviceInfo?.os;

  return (
    <div className="grid gap-3 rounded-2xl bg-[#F8FAFC] p-4 md:grid-cols-[44px_1fr_auto] md:items-center">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-white text-[#100E22]">
        <Icon name="lock" size={17} />
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <div className="break-words text-sm font-black text-[#100E22] [overflow-wrap:anywhere]">
            {[device, browser, os].filter(Boolean).join(' · ')}
          </div>
          {session.isCurrent && <Badge kind="success">{t('sessions.currentSession')}</Badge>}
        </div>
        <div className="mt-1 break-words text-xs font-semibold text-gray-500 [overflow-wrap:anywhere]">
          {t('sessions.ip')}: {session.deviceInfo?.ip || '-'} · {t('sessions.lastActive')}: {formatRelative(session.createdAt, language)}
        </div>
      </div>
      {session.isCurrent ? (
        <Badge kind="outline">{t('sessions.currentSession')}</Badge>
      ) : (
        <Btn kind="danger" size="sm" onClick={onRevoke} disabled={isRevoking}>
          {t('sessions.revokeSession')}
        </Btn>
      )}
    </div>
  );
}

function AvatarBlock({ user, initials, size }: { user?: User; initials: string; size: 'md' | 'lg' }) {
  const box = size === 'lg' ? 'h-24 w-24 rounded-3xl text-4xl' : 'h-16 w-16 rounded-2xl text-2xl';
  if (user?.avatar) {
    return <img src={user.avatar} alt="" className={clsx('shrink-0 object-cover', box)} />;
  }

  return (
    <div
      className={clsx('grid shrink-0 place-items-center font-extrabold text-[#100E22]', box)}
      style={{ background: 'linear-gradient(135deg, #fdf001 0%, #ff8e3c 100%)' }}
    >
      {initials}
    </div>
  );
}

function HeaderMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] font-bold uppercase text-white/50">{label}</div>
      <div className="break-words text-xl font-extrabold [overflow-wrap:anywhere]" style={{ letterSpacing: '-0.02em' }}>
        {value}
      </div>
    </div>
  );
}

function SectionTitle({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-xl font-extrabold text-[#100E22]" style={{ letterSpacing: '-0.02em' }}>{title}</h2>
      <p className="mt-1 text-sm font-semibold text-gray-500">{description}</p>
    </div>
  );
}

function LoadingRows() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="h-20 animate-pulse rounded-2xl bg-[#F8FAFC]" />
      ))}
    </>
  );
}

function EmptyState({ icon, title, description }: { icon: IconName; title: string; description: string }) {
  return (
    <div className="grid place-items-center rounded-2xl bg-[#F8FAFC] px-6 py-10 text-center">
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-white text-gray-400">
        <Icon name={icon} size={22} />
      </div>
      <div className="text-sm font-black text-[#100E22]">{title}</div>
      <div className="mt-1 max-w-md text-xs font-semibold text-gray-500">{description}</div>
    </div>
  );
}

function getInitials(user?: User) {
  return (user?.name || user?.email || 'U')
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function getProfileCompletion(user?: User) {
  if (!user) return 0;
  const fields = [
    user.name,
    user.username,
    user.firstName,
    user.lastName,
    user.phoneNumber,
    user.countryIso,
    user.countryCode,
    user.avatar,
    user.isEmailVerified,
    user.twoFactorEnabled,
  ];
  const completed = fields.filter(Boolean).length;
  return Math.round((completed / fields.length) * 100);
}

function formatMoney(value?: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
}

function cleanProfilePayload(form: ProfileForm) {
  return Object.fromEntries(
    Object.entries(form).map(([key, value]) => [key, value.trim() || undefined]),
  );
}
