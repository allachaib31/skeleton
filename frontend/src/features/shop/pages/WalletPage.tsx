import { ReactNode, useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
import { Icon, IconName } from '../components/Icon';
import {
  Badge,
  Btn,
  Field,
  Input,
} from '../components/primitives';
import { useCreatePaymentRequest, useMyPaymentRequests, usePaymentBanks } from '@/features/payments/payments.hooks';
import { useLanguageStore } from '@/app/stores/language.store';
import { localized } from '../utils/shop-format';
import { useProfile } from '@/features/users/hooks/useProfile';
import { useMyFinancialMovements } from '@/features/users/hooks/useMySessions';
import { useRedeemPaymentCode } from '@/features/users/hooks/useRedeemPaymentCode';
import { formatDate } from '@/shared/lib/utils/date';
import { ClientFinancialMovement } from '@/features/clients/types/client.types';
import { PaymentRequest } from '@/features/payments/payments.types';
import { Pagination } from '@/shared/components/ui/Pagination';

type WalletMethodId = 'bank' | 'code';

type WalletMethod = {
  id: WalletMethodId;
  label: string;
  sub: string;
  icon: IconName;
  color: string;
  disabled?: boolean;
};

export default function WalletPage() {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const { data: profileResponse } = useProfile();
  const [method, setMethod] = useState<WalletMethodId>('bank');
  const [amount, setAmount] = useState(100);
  const [bankId, setBankId] = useState('');
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [serialNumber, setSerialNumber] = useState('');
  const [clientComment, setClientComment] = useState('');
  const [paymentCode, setPaymentCode] = useState('');
  const [historyPage, setHistoryPage] = useState(1);
  const historyLimit = 5;

  const { data: banksResponse } = usePaymentBanks();
  const { data: paymentRequestsResponse } = useMyPaymentRequests({ page: 1, limit: 5 });
  const { data: movementsResponse } = useMyFinancialMovements({ page: historyPage, limit: historyLimit, excludeSource: 'ORDER' });
  const createPaymentRequest = useCreatePaymentRequest();
  const redeemPaymentCode = useRedeemPaymentCode();

  const profile = profileResponse?.data;
  const banks = banksResponse?.data || [];
  const selectedBank = banks.find((bank) => bank._id === bankId) || banks[0];
  const currency = selectedBank?.currencyId && typeof selectedBank.currencyId !== 'string' ? selectedBank.currencyId : undefined;
  const safeAmount = Number.isFinite(amount) && amount > 0 ? amount : 0;
  const taxAmount = selectedBank?.taxType === 'PERCENT' ? safeAmount * (selectedBank.taxValue / 100) : selectedBank?.taxValue || 0;
  const payableAmount = safeAmount + taxAmount;
  const pendingBankRequests = (paymentRequestsResponse?.data || []).filter((request) => request.status !== 'APPROVED');
  const movements = movementsResponse?.data || [];

  const methods = useMemo<WalletMethod[]>(() => [
    {
      id: 'bank',
      label: t('payments.bankPayment'),
      sub: banks.length ? t('payments.bankPaymentDescription') : t('payments.noBanks'),
      icon: 'receipt',
      color: '#16A34A',
      disabled: banks.length === 0,
    },
    {
      id: 'code',
      label: t('payments.paymentCode'),
      sub: t('payments.paymentCodeDescription'),
      icon: 'qr',
      color: '#100E22',
    },
  ], [banks.length, t]);

  const submitBankPayment = () => {
    if (!selectedBank || safeAmount <= 0) return;
    createPaymentRequest.mutate({
      paymentGatewayId: selectedBank._id,
      amount: safeAmount,
      serialNumber,
      clientComment,
      proofImage,
    }, {
      onSuccess: () => {
        setProofImage(null);
        setSerialNumber('');
        setClientComment('');
      },
    });
  };

  const submitPaymentCode = () => {
    const code = paymentCode.trim();
    if (!code) return;
    redeemPaymentCode.mutate(code, {
      onSuccess: () => setPaymentCode(''),
    });
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
      <div className="flex flex-col gap-4">
        <div className="relative overflow-hidden rounded-3xl bg-[#100E22] p-7 text-white">
          <svg
            viewBox="0 0 200 200"
            className="absolute -right-10 -top-10 h-[320px] w-[320px] opacity-[0.07]"
          >
            <circle cx="100" cy="100" r="80" stroke="#fdf001" strokeWidth="25" fill="none" />
          </svg>
          <div className="relative">
            <div className="text-sm font-semibold text-white/55">{t('payments.walletBalance')}</div>
            <div className="text-5xl font-black md:text-[56px]" style={{ lineHeight: 1 }}>
              {formatMoney(profile?.balance)}
            </div>
            <div className="mt-4 flex flex-wrap gap-6 text-[13px]">
              <WalletMetric label={t('payments.openCredit')} value={formatMoney(profile?.openCredit)} />
              <WalletMetric label={t('payments.totalExpenses')} value={formatMoney(profile?.totalExpenses)} />
              <WalletMetric label={t('payments.totalReferralWin')} value={formatMoney(profile?.totalReferralWin)} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="mb-4">
            <div className="text-lg font-extrabold">
              {t('payments.history')}
            </div>
            <div className="text-xs text-gray-500">{t('payments.historyDescription')}</div>
          </div>

          <div>
            {pendingBankRequests.map((request) => (
              <PaymentRequestRow key={request._id} request={request} language={language} t={t} />
            ))}
            {movements.map((movement) => (
              <MovementRow key={movement._id} movement={movement} language={language} t={t} />
            ))}
            {!pendingBankRequests.length && !movements.length && (
              <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm font-semibold text-gray-500">
                {t('payments.emptyHistory')}
              </div>
            )}
            {movementsResponse?.meta && movementsResponse.meta.total > historyLimit && (
              <Pagination
                total={movementsResponse.meta.total}
                page={historyPage}
                limit={historyLimit}
                onChange={setHistoryPage}
                className="mt-4 justify-start"
              />
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="text-lg font-extrabold">{t('payments.addBalance')}</div>
          <div className="mb-4.5 mt-1 text-xs text-gray-500">{t('payments.addBalanceDescription')}</div>

          {method === 'bank' && (
            <>
              <Field label={t('payments.amount')} hint={t('payments.amountHint')}>
                <div className="flex h-16 items-center gap-1 rounded-xl border border-gray-200 bg-white px-4">
                  <span className="text-3xl font-extrabold text-gray-500">$</span>
                  <input
                    type="number"
                    min={1}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="min-w-0 flex-1 border-none bg-transparent text-3xl font-extrabold outline-none"
                    style={{ fontFamily: 'Zain' }}
                  />
                </div>
              </Field>
              <div className="mt-2 grid grid-cols-4 gap-1.5">
                {[25, 50, 100, 200].map((value) => (
                  <button
                    key={value}
                    onClick={() => setAmount(value)}
                    className={clsx(
                      'rounded-lg border py-2 text-[13px] font-bold',
                      amount === value ? 'border-[#100E22] bg-[#100E22] text-white' : 'border-gray-200 bg-white text-[#111827]',
                    )}
                  >
                    {formatMoney(value)}
                  </button>
                ))}
              </div>
            </>
          )}

          <Field label={t('payments.method')} className="mt-4.5">
            <div className="grid gap-2">
              {methods.map((item) => (
                <PaymentMethodRow
                  key={item.id}
                  method={item}
                  selected={method === item.id}
                  onClick={() => {
                    if (!item.disabled) setMethod(item.id);
                  }}
                />
              ))}
            </div>
          </Field>

          {method === 'bank' && (
            <div className="tc-slideup mt-3.5 rounded-xl border border-gray-200 bg-[#F8FAFC] p-4">
              <div className="mb-2.5 text-[13px] font-bold">{t('payments.bankInstructions')}</div>
              {banks.length > 1 && (
                <select
                  value={selectedBank?._id || ''}
                  onChange={(event) => setBankId(event.target.value)}
                  className="mb-3 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm font-bold outline-none"
                >
                  {banks.map((bank) => (
                    <option key={bank._id} value={bank._id}>{localized(bank.name, language, bank._id)}</option>
                  ))}
                </select>
              )}
              {selectedBank ? (
                <>
                  <div className="text-sm font-extrabold">{localized(selectedBank.name, language, selectedBank._id)}</div>
                  {selectedBank.description && (
                    <div className="mt-1 text-xs text-gray-500">{localized(selectedBank.description, language, '')}</div>
                  )}
                  <div className="mt-3 grid gap-2.5 text-xs sm:grid-cols-2">
                    {selectedBank.infoFields.map((field, index) => (
                      <div key={`${field.type}-${index}`} className="rounded-lg bg-white p-2.5">
                        <div className="font-semibold text-gray-500">{localized(field.label, language, field.type)}</div>
                        {field.type === 'IMAGE' || field.type === 'QR_CODE' ? (
                          <img src={field.value} alt="" className="mt-2 max-h-32 rounded-lg object-contain" />
                        ) : (
                          <div className="mono break-words font-semibold">{field.value}</div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 rounded-lg border border-dashed border-gray-200 bg-white p-2.5">
                    <div className="mb-1 text-xs text-gray-500">{t('payments.payable')}</div>
                    <div className="mono text-sm font-extrabold">
                      {payableAmount.toFixed(2)} {currency?.shortName || 'USD'}
                    </div>
                    {taxAmount > 0 && (
                      <div className="mt-1 text-[11px] text-gray-500">
                        {t('payments.tax')}: {taxAmount.toFixed(2)} {currency?.shortName || 'USD'}
                      </div>
                    )}
                  </div>
                  {selectedBank.requiresSerialNumber && (
                    <Field label={t('payments.serialNumber')} className="mt-3">
                      <Input value={serialNumber} onChange={(event) => setSerialNumber(event.target.value)} />
                    </Field>
                  )}
                  <Field label={t('payments.clientComment')} className="mt-3">
                    <Input value={clientComment} onChange={(event) => setClientComment(event.target.value)} />
                  </Field>
                  {selectedBank.requiresImage && (
                    <Field label={t('payments.proofImage')} className="mt-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => setProofImage(event.target.files?.[0] || null)}
                        className="w-full rounded-lg border border-gray-200 bg-white p-2 text-xs"
                      />
                    </Field>
                  )}
                  <Btn
                    kind="outline"
                    size="md"
                    full
                    icon="upload"
                    className="mt-3"
                    onClick={submitBankPayment}
                    disabled={createPaymentRequest.isPending || safeAmount <= 0 || (selectedBank.requiresImage && !proofImage)}
                  >
                    {createPaymentRequest.isPending ? t('common.loading') : t('payments.submitBankPayment')}
                  </Btn>
                </>
              ) : (
                <div className="text-xs text-gray-500">{t('payments.noBanks')}</div>
              )}
            </div>
          )}

          {method === 'code' && (
            <div className="tc-slideup mt-3.5 rounded-xl border border-gray-200 bg-[#F8FAFC] p-4">
              <div className="mb-2.5 text-[13px] font-bold">{t('payments.redeemPaymentCode')}</div>
              <Input
                icon="qr"
                value={paymentCode}
                onChange={(event) => setPaymentCode(event.target.value)}
                placeholder={t('payments.paymentCodePlaceholder')}
              />
              <Btn
                kind="primary"
                size="md"
                full
                icon="bolt"
                className="mt-2.5"
                onClick={submitPaymentCode}
                disabled={redeemPaymentCode.isPending || !paymentCode.trim()}
              >
                {redeemPaymentCode.isPending ? t('common.loading') : t('payments.redeemPaymentCode')}
              </Btn>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-green-100 text-green-600">
            <Icon name="shield" size={20} />
          </div>
          <div className="flex-1 text-xs text-gray-500">
            {t('payments.securityNote')}
          </div>
        </div>
      </div>
    </div>
  );
}

function WalletMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-white/50">{label} </span>
      <strong>{value}</strong>
    </div>
  );
}

function PaymentRequestRow({ request, language, t }: { request: PaymentRequest; language: string; t: (key: string) => string }) {
  return (
    <HistoryRow
      icon="receipt"
      iconColor="#16A34A"
      title={t('payments.bankPayment')}
      reference={request._id}
      date={formatDate(request.createdAt, language)}
      amount={`+${formatMoney(request.creditedAmount)}`}
      amountClass="text-green-600"
      badge={<Badge kind={request.status === 'REJECTED' ? 'danger' : 'warning'}>{t(`payments.statuses.${request.status}`)}</Badge>}
    />
  );
}

function MovementRow({ movement, language, t }: { movement: ClientFinancialMovement; language: string; t: (key: string) => string }) {
  const isDeposit = movement.type === 'DEPOSIT';
  const source = movement.source || 'ADMIN';
  return (
    <HistoryRow
      icon={movementIcon(source)}
      iconColor={movementColor(source)}
      title={t(`payments.movementSources.${source}`)}
      reference={movement.comment || movement.referenceId || movement._id}
      date={formatDate(movement.createdAt, language)}
      amount={`${isDeposit ? '+' : '-'}${formatMoney(Math.abs(movement.amount))}`}
      amountClass={isDeposit ? 'text-green-600' : 'text-red-600'}
      badge={<Badge kind={isDeposit ? 'success' : 'soft'}>{t(`payments.movementTypes.${movement.type}`)}</Badge>}
    />
  );
}

function HistoryRow({
  icon,
  iconColor,
  title,
  reference,
  date,
  amount,
  amountClass,
  badge,
}: {
  icon: IconName;
  iconColor: string;
  title: string;
  reference: string;
  date: string;
  amount: string;
  amountClass: string;
  badge: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3.5 border-t border-gray-200 py-3 md:grid-cols-[36px_minmax(0,1.2fr)_minmax(100px,0.7fr)_auto_auto]">
      <div
        className="grid h-8 w-8 place-items-center rounded-lg"
        style={{ background: `${iconColor}22`, color: iconColor }}
      >
        <Icon name={icon} size={16} />
      </div>
      <div className="min-w-0">
        <div className="truncate text-[13px] font-bold">{title}</div>
        <div className="mono truncate text-[11px] text-gray-500">{reference}</div>
      </div>
      <div className="mono hidden text-[11px] text-gray-500 md:block">{date}</div>
      <div className={clsx('text-sm font-bold', amountClass)}>{amount}</div>
      <div className="hidden justify-self-end sm:block">{badge}</div>
    </div>
  );
}

function PaymentMethodRow({
  method,
  selected,
  onClick,
}: {
  method: WalletMethod;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={method.disabled}
      className={clsx(
        'flex items-center gap-3.5 rounded-xl border-[1.5px] p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-55',
        selected ? 'border-[#100E22] bg-[#F8FAFC]' : 'border-gray-200 bg-white hover:border-gray-300',
      )}
    >
      <div
        className="grid h-9 w-9 place-items-center rounded-lg text-white"
        style={{ background: method.color }}
      >
        <Icon name={method.icon} size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="text-sm font-bold">{method.label}</div>
        </div>
        <div className="text-[11px] text-gray-500">{method.sub}</div>
      </div>
      <div
        className={clsx(
          'grid h-[18px] w-[18px] place-items-center rounded-full border-[1.5px]',
          selected ? 'border-[#100E22] bg-[#100E22]' : 'border-gray-300 bg-white',
        )}
      >
        {selected && <div className="h-2 w-2 rounded-full bg-white" />}
      </div>
    </button>
  );
}

function movementIcon(source: string): IconName {
  if (source === 'PAYMENT_CODE') return 'qr';
  if (source === 'BANK' || source === 'PAYMENT_GATEWAY') return 'receipt';
  if (source === 'ORDER') return 'cart';
  return 'wallet';
}

function movementColor(source: string) {
  if (source === 'PAYMENT_CODE') return '#100E22';
  if (source === 'BANK') return '#16A34A';
  if (source === 'PAYMENT_GATEWAY') return '#2563EB';
  if (source === 'ORDER') return '#DC2626';
  return '#6B7280';
}

function formatMoney(value?: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
}
