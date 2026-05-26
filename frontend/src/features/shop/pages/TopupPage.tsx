import { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { Icon } from '../components/Icon';
import {
  Badge,
  Btn,
  Field,
  SectionHead,
} from '../components/primitives';
import { OPERATORS, Operator } from '../data/catalog';

export default function TopupPage() {
  const [op, setOp] = useState<Operator>(OPERATORS[0]);
  const [amount, setAmount] = useState<number>(op.amounts[2]);
  const [phone, setPhone] = useState('612 345 678');
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    setAmount(op.amounts[Math.min(2, op.amounts.length - 1)]);
  }, [op]);

  return (
    <div className="flex flex-col gap-5">
      {/* Hero */}
      <div className="relative flex flex-col gap-4 overflow-hidden rounded-3xl bg-[#100E22] p-6 text-white md:flex-row md:items-center md:justify-between md:p-8">
        <div className="relative max-w-[540px]">
          <Badge kind="primary" className="mb-3.5">· 142 operators · 78 countries ·</Badge>
          <div className="text-3xl font-black md:text-[40px]" style={{ letterSpacing: '-0.03em', lineHeight: 1 }}>
            Mobile top-up
          </div>
          <div className="mt-2.5 max-w-[460px] text-sm text-white/65">
            Recharge any prepaid line in seconds. We support 142 carriers across 78 countries — your wallet pays, the operator delivers.
          </div>
        </div>
        <div className="min-w-[240px] rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
          <div className="mono mb-1 text-[11px] text-white/50" style={{ letterSpacing: 0.5 }}>
            RELIABILITY
          </div>
          <div className="flex gap-6">
            <div>
              <div className="text-2xl font-extrabold">98.7%</div>
              <div className="text-[11px] text-white/55">success rate</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold">3.4s</div>
              <div className="text-[11px] text-white/55">avg delivery</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        {/* Operator picker */}
        <div>
          <SectionHead
            title="Pick an operator"
            sub="We auto-detect the country from your phone number"
          />
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {OPERATORS.map((o) => (
              <button
                key={o.id}
                onClick={() => {
                  setOp(o);
                  setConfirmed(false);
                }}
                className={clsx(
                  'flex items-center gap-3.5 rounded-2xl border-[1.5px] bg-white p-4 text-left transition',
                  op.id === o.id ? 'border-[#100E22]' : 'border-gray-200 hover:-translate-y-0.5',
                )}
              >
                <div
                  className="grid h-13 w-13 place-items-center rounded-xl text-white"
                  style={{
                    background: o.color,
                    width: 52,
                    height: 52,
                    fontWeight: 800,
                    fontSize: 22,
                    fontFamily: 'Zain',
                  }}
                >
                  {o.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <div className="text-[15px] font-extrabold" style={{ letterSpacing: '-0.01em' }}>
                      {o.name}
                    </div>
                    <span className="text-sm">{o.flag}</span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-gray-500">
                    {o.tag} · {o.amounts.length} denoms
                  </div>
                </div>
                <Icon name="chevronR" size={16} className="flex-shrink-0 text-gray-500" />
              </button>
            ))}
          </div>
        </div>

        {/* Order form */}
        <div className="h-fit rounded-2xl border border-gray-200 bg-white p-6 lg:sticky lg:top-4">
          {confirmed ? (
            <TopupSuccess op={op} amount={amount} phone={phone} onAgain={() => setConfirmed(false)} />
          ) : (
            <>
              <div className="mb-4.5 flex items-center gap-3">
                <div
                  className="grid h-11 w-11 place-items-center rounded-xl text-white"
                  style={{ background: op.color, fontWeight: 800, fontFamily: 'Zain' }}
                >
                  {op.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-base font-extrabold">{op.name} {op.flag}</div>
                  <div className="text-[11px] text-gray-500">Prepaid recharge · instant</div>
                </div>
              </div>

              <Field label="Phone number" hint="Without country code">
                <div className="flex h-13 items-center gap-2 rounded-xl border border-gray-200 bg-white pl-3 pr-1" style={{ height: 52 }}>
                  <div className="flex items-center gap-1.5 border-r border-gray-200 pr-2.5 text-[15px] font-semibold">
                    {op.flag} +212 <Icon name="chevronD" size={14} />
                  </div>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="min-w-0 flex-1 border-none bg-transparent text-lg font-semibold outline-none"
                    style={{ fontFamily: 'Zain', letterSpacing: '0.04em' }}
                  />
                </div>
              </Field>

              <Field label="Amount" className="mt-4">
                <div className="grid grid-cols-3 gap-1.5">
                  {op.amounts.map((a) => (
                    <button
                      key={a}
                      onClick={() => setAmount(a)}
                      className={clsx(
                        'rounded-[10px] border-[1.5px] py-3.5 text-base font-extrabold',
                        amount === a ? 'border-[#100E22] bg-[#100E22] text-white' : 'border-gray-200 bg-white text-[#111827]',
                      )}
                      style={{ letterSpacing: '-0.02em' }}
                    >
                      ${a}
                    </button>
                  ))}
                </div>
              </Field>

              <div className="mt-4 rounded-xl bg-[#F8FAFC] p-3.5">
                <div className="mb-1 flex justify-between text-[13px]">
                  <span className="text-gray-500">Top-up amount</span>
                  <span className="mono">${amount.toFixed(2)}</span>
                </div>
                <div className="mb-1 flex justify-between text-[13px]">
                  <span className="text-gray-500">Service fee</span>
                  <span className="mono">$0.00</span>
                </div>
                <div className="flex justify-between text-[13px] text-green-600">
                  <span>Level 3 discount</span>
                  <span className="mono">−${(amount * 0.04).toFixed(2)}</span>
                </div>
                <div className="mt-2.5 flex justify-between border-t border-gray-200 pt-2.5">
                  <span className="text-sm font-bold">Total</span>
                  <span className="text-[22px] font-extrabold" style={{ letterSpacing: '-0.02em' }}>
                    ${(amount * 0.96).toFixed(2)}
                  </span>
                </div>
              </div>

              <Btn size="lg" full icon="bolt" className="mt-3.5" onClick={() => setConfirmed(true)}>
                Recharge {op.flag} {phone.slice(-4)} · ${(amount * 0.96).toFixed(2)}
              </Btn>
              <div className="mt-2 text-center text-[11px] text-gray-500">
                Refunded automatically if the operator declines.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TopupSuccess({
  op,
  amount,
  phone,
  onAgain,
}: {
  op: Operator;
  amount: number;
  phone: string;
  onAgain: () => void;
}) {
  return (
    <div className="tc-slideup">
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-green-100 text-green-600">
          <Icon name="check" size={26} stroke={2.5} />
        </div>
        <div>
          <div className="text-lg font-extrabold">Top-up sent</div>
          <div className="mono text-[11px] text-gray-500">Order #TC-48-0293 · in 2.4s</div>
        </div>
      </div>
      <div className="rounded-xl bg-[#F8FAFC] p-3.5 text-[13px]" style={{ lineHeight: 1.5 }}>
        <div className="mb-1.5 flex justify-between">
          <span className="text-gray-500">Operator</span>
          <span className="font-bold">
            {op.name} {op.flag}
          </span>
        </div>
        <div className="mb-1.5 flex justify-between">
          <span className="text-gray-500">To</span>
          <span className="mono font-bold">+212 {phone}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Credited</span>
          <span className="font-extrabold">${amount}.00</span>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-[10px] border border-green-200 bg-green-50 p-3 text-xs font-semibold text-green-700">
        <Icon name="info" size={14} /> Operator confirmation:
        <span className="mono ml-auto">TX-9F8D-2E11</span>
      </div>
      <div className="mt-4 flex gap-2">
        <Btn kind="outline" size="md" full icon="receipt">Receipt</Btn>
        <Btn kind="dark" size="md" full icon="refresh" onClick={onAgain}>
          Recharge again
        </Btn>
      </div>
    </div>
  );
}
