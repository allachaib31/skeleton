import { useEffect, useState } from 'react';
import { Icon, IconName } from '../components/Icon';
import {
  Badge,
  Btn,
  Field,
  Input,
  SectionHead,
} from '../components/primitives';
import { INSTITUTIONS, Institution } from '../data/catalog';

const SAVED_BILLERS: Array<{ i: IconName; n: string; ref: string; last: string; color: string }> = [
  { i: 'bolt', n: 'National Power Grid', ref: 'PWR-849210', last: 'paid May 12', color: '#F59E0B' },
  { i: 'globe', n: 'FiberOne ISP', ref: 'NET-027431', last: 'paid May 4', color: '#9B5DE5' },
  { i: 'tv', n: 'CableTV Plus', ref: 'TV-118832', last: 'paid Apr 28', color: '#EF476F' },
];

export default function BillsPage() {
  const [inst, setInst] = useState<Institution | null>(null);
  const [bill, setBill] = useState<{ amount: string; due: string; label: string } | null>(null);

  useEffect(() => {
    if (inst) {
      setBill({
        amount: (Math.random() * 80 + 35).toFixed(2),
        due: 'Jun 12, 2026',
        label: 'May 2026 invoice',
      });
    } else {
      setBill(null);
    }
  }, [inst]);

  return (
    <div className="flex flex-col gap-5">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-[#100E22] p-6 text-white md:p-8">
        <Badge kind="primary" className="mb-3.5">· 38 institutions ·</Badge>
        <div className="text-3xl font-black md:text-[40px]" style={{ letterSpacing: '-0.03em', lineHeight: 1 }}>
          Pay your bills
        </div>
        <div className="mt-2.5 max-w-[540px] text-sm text-white/65">
          Utilities, telecom, government, education, insurance — paid from your wallet, settled directly with the institution. No queues, no transfer slips.
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="mb-3.5 flex items-center justify-between gap-3">
            <SectionHead title="Pick an institution" />
            <div className="w-60">
              <Input icon="search" placeholder="Search…" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {INSTITUTIONS.map((i) => (
              <button
                key={i.id}
                onClick={() => setInst(i)}
                className={`flex items-center gap-3.5 rounded-2xl border-[1.5px] ${
                  inst?.id === i.id ? 'border-[#100E22]' : 'border-gray-200'
                } bg-white p-4 text-left`}
              >
                <div
                  className="grid h-12 w-12 place-items-center rounded-xl"
                  style={{ background: i.color + '22', color: i.color }}
                >
                  <Icon name={i.icon as IconName} size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-extrabold" style={{ letterSpacing: '-0.01em' }}>
                    {i.name}
                  </div>
                  <div className="text-[11px] text-gray-500">{i.cat}</div>
                </div>
                <Icon name="chevronR" size={16} className="text-gray-500" />
              </button>
            ))}
          </div>

          {/* Saved billers */}
          <div className="mt-6">
            <SectionHead title="Saved billers" sub="Pay your recurring bills in one tap" />
            <div className="rounded-2xl border border-gray-200 bg-white">
              {SAVED_BILLERS.map((s, idx) => (
                <div
                  key={s.ref}
                  className={`grid grid-cols-[40px_1fr_110px_70px] items-center gap-3.5 p-3.5 md:grid-cols-[40px_1fr_130px_80px] ${
                    idx ? 'border-t border-gray-200' : ''
                  }`}
                >
                  <div
                    className="grid h-9 w-9 place-items-center rounded-lg"
                    style={{ background: s.color + '22', color: s.color }}
                  >
                    <Icon name={s.i} size={16} />
                  </div>
                  <div>
                    <div className="text-[13px] font-bold">{s.n}</div>
                    <div className="mono text-[11px] text-gray-500">{s.ref}</div>
                  </div>
                  <div className="mono text-[11px] text-gray-500">{s.last}</div>
                  <Btn kind="outline" size="sm">Pay</Btn>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Payment panel */}
        <div className="h-fit rounded-2xl border border-gray-200 bg-white p-6 lg:sticky lg:top-4">
          {!inst ? (
            <div className="px-5 py-10 text-center">
              <div className="mx-auto mb-3.5 grid h-14 w-14 place-items-center rounded-2xl bg-[#F8FAFC] text-gray-500">
                <Icon name="receipt" size={24} />
              </div>
              <div className="mb-1 text-base font-bold">Pick an institution</div>
              <div className="text-[13px] text-gray-500">
                Then we'll fetch the bill total and let you confirm with one tap.
              </div>
            </div>
          ) : (
            <BillPaymentForm inst={inst} bill={bill} />
          )}
        </div>
      </div>
    </div>
  );
}

function BillPaymentForm({
  inst,
  bill,
}: {
  inst: Institution;
  bill: { amount: string; due: string; label: string } | null;
}) {
  const [ref, setRef] = useState(inst.ref + Math.floor(100000 + Math.random() * 900000));
  const [phase, setPhase] = useState<'lookup' | 'confirm' | 'paid'>('lookup');

  useEffect(() => {
    setRef(inst.ref + Math.floor(100000 + Math.random() * 900000));
    setPhase('lookup');
  }, [inst]);

  return (
    <div className="tc-slideup">
      <div className="mb-4.5 flex items-center gap-3">
        <div
          className="grid h-11 w-11 place-items-center rounded-xl"
          style={{ background: inst.color + '22', color: inst.color }}
        >
          <Icon name={inst.icon as IconName} size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-base font-extrabold">{inst.name}</div>
          <div className="text-[11px] text-gray-500">{inst.cat}</div>
        </div>
      </div>

      {phase === 'lookup' && (
        <>
          <Field label="Reference / account number" hint="Found on your latest bill">
            <Input icon="qr" value={ref} onChange={(e) => setRef(e.target.value)} />
          </Field>
          <Btn kind="dark" size="lg" full icon="search" className="mt-3" onClick={() => setPhase('confirm')}>
            Look up bill
          </Btn>
        </>
      )}

      {phase === 'confirm' && bill && (
        <>
          <div className="mb-3.5 mt-1 rounded-2xl border border-gray-200 bg-[#F8FAFC] p-4.5">
            <div className="mono mb-1 text-[11px] text-gray-500" style={{ letterSpacing: 0.4 }}>
              BILL FOUND
            </div>
            <div className="text-sm font-bold">{bill.label}</div>
            <div className="mono mt-1 text-[11px] text-gray-500">Ref · {ref}</div>
            <div className="mt-3.5 flex items-end justify-between">
              <div>
                <div className="text-[11px] font-semibold text-gray-500">AMOUNT DUE</div>
                <div className="text-3xl font-extrabold" style={{ letterSpacing: '-0.02em' }}>
                  ${bill.amount}
                </div>
              </div>
              <Badge kind="warning" dot>due {bill.due}</Badge>
            </div>
          </div>

          <div className="flex gap-2">
            <Btn kind="outline" size="lg" onClick={() => setPhase('lookup')}>
              Back
            </Btn>
            <Btn size="lg" full icon="bolt" onClick={() => setPhase('paid')}>
              Pay ${bill.amount}
            </Btn>
          </div>
        </>
      )}

      {phase === 'paid' && bill && (
        <div className="tc-slideup">
          <div className="mb-3.5 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-green-100 text-green-600">
              <Icon name="check" size={26} stroke={2.5} />
            </div>
            <div>
              <div className="text-lg font-extrabold">Bill paid</div>
              <div className="mono text-[11px] text-gray-500">Order #TC-48-0294 · in 3.1s</div>
            </div>
          </div>
          <div className="rounded-xl bg-[#F8FAFC] p-3.5 text-[13px]" style={{ lineHeight: 1.5 }}>
            <div className="mb-1.5 flex justify-between">
              <span className="text-gray-500">Institution</span>
              <span className="font-bold">{inst.name}</span>
            </div>
            <div className="mb-1.5 flex justify-between">
              <span className="text-gray-500">Reference</span>
              <span className="mono font-bold">{ref}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Amount paid</span>
              <span className="font-extrabold">${bill.amount}</span>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Btn kind="outline" size="md" full icon="receipt">Receipt</Btn>
            <Btn kind="dark" size="md" full icon="refresh" onClick={() => setPhase('lookup')}>
              Pay another
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}
