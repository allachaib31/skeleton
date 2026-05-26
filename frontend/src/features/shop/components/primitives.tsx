import { ButtonHTMLAttributes, CSSProperties, InputHTMLAttributes, ReactNode, useState } from 'react';
import { clsx } from 'clsx';
import { Icon, IconName } from './Icon';

/* ---------------------------------------------------------------- *
 * Brand mark
 * ---------------------------------------------------------------- */
export function Wordmark({ size = 22, onDark = true }: { size?: number; onDark?: boolean }) {
  const fg = onDark ? '#fff' : '#100E22';
  return (
    <div className="inline-flex items-center gap-2.5">
      <div
        className="relative grid place-items-center"
        style={{
          width: size * 1.45,
          height: size * 1.45,
          borderRadius: size * 0.4,
          background: '#fdf001',
          boxShadow: onDark ? '0 0 0 1px rgba(255,255,255,.06)' : 'none',
        }}
      >
        <span
          className="leading-none"
          style={{
            fontFamily: 'Zain',
            fontWeight: 900,
            fontSize: size * 1.05,
            color: '#100E22',
            letterSpacing: '-0.04em',
          }}
        >
          3
        </span>
        <span
          className="absolute -right-0.5 -bottom-0.5"
          style={{ width: 8, height: 8, borderRadius: 2, background: '#100E22' }}
        />
      </div>
      <span
        style={{
          fontFamily: 'Zain',
          fontWeight: 800,
          fontSize: size,
          color: fg,
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        tafa3ol<span style={{ color: '#fdf001' }}>card</span>
      </span>
    </div>
  );
}

/* ---------------------------------------------------------------- *
 * Brand placeholder tiles (no real logos)
 * ---------------------------------------------------------------- */
const PALETTES: Array<[string, string]> = [
  ['#FF6B6B', '#FFE66D'],
  ['#4ECDC4', '#1A535C'],
  ['#7B5BFF', '#FFB6FF'],
  ['#FF8E3C', '#FFD66B'],
  ['#2EC4B6', '#E6F4F1'],
  ['#3D5A80', '#98C1D9'],
  ['#E63946', '#F1FAEE'],
  ['#7209B7', '#F72585'],
  ['#06D6A0', '#073B4C'],
  ['#FFB627', '#FF9505'],
  ['#118AB2', '#073B4C'],
  ['#EF476F', '#FFD166'],
  ['#5F6CAF', '#A8D8EA'],
  ['#0F4C5C', '#FB8B24'],
  ['#9B5DE5', '#F15BB5'],
  ['#00BBF9', '#00F5D4'],
];

export function brandColor(seed: string): [string, string] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return PALETTES[Math.abs(h) % PALETTES.length];
}

type ProductTileProps = {
  name: string;
  sub?: string;
  size?: 'sm' | 'md' | 'lg';
  glyph?: string;
  denom?: string;
  className?: string;
  style?: CSSProperties;
};

export function ProductTile({ name, sub, size = 'md', glyph, denom, className, style }: ProductTileProps) {
  const [a, b] = brandColor(name);
  const initials = (name || '').split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const pad = size === 'sm' ? 10 : size === 'lg' ? 18 : 14;
  const badgeSize = size === 'sm' ? 22 : 28;
  return (
    <div
      className={clsx('relative flex flex-col justify-between overflow-hidden text-white', className)}
      style={{
        aspectRatio: '1.6 / 1',
        borderRadius: 14,
        background: `linear-gradient(135deg, ${a} 0%, ${b} 100%)`,
        padding: pad,
        ...style,
      }}
    >
      <svg
        viewBox="0 0 100 60"
        className="absolute inset-0 h-full w-full opacity-15"
        preserveAspectRatio="none"
      >
        <circle cx="85" cy="10" r="22" fill="#fff" />
        <circle cx="15" cy="55" r="14" fill="#000" />
      </svg>
      <div className="relative flex items-start justify-between">
        <div
          className="grid place-items-center backdrop-blur-sm"
          style={{
            width: badgeSize,
            height: badgeSize,
            borderRadius: 6,
            background: 'rgba(255,255,255,.22)',
            fontWeight: 800,
            fontSize: size === 'sm' ? 11 : 13,
            fontFamily: 'Zain',
            letterSpacing: '-0.04em',
          }}
        >
          {glyph || initials}
        </div>
        {denom && (
          <div
            className="mono"
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: size === 'sm' ? 10 : 11,
              padding: '3px 7px',
              background: 'rgba(0,0,0,.3)',
              borderRadius: 999,
              fontWeight: 600,
              letterSpacing: 0.4,
            }}
          >
            {denom}
          </div>
        )}
      </div>
      <div className="relative">
        <div
          style={{
            fontWeight: 800,
            fontSize: size === 'sm' ? 14 : size === 'lg' ? 22 : 17,
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
          }}
        >
          {name}
        </div>
        {sub && (
          <div
            style={{
              fontSize: size === 'sm' ? 10 : 12,
              opacity: 0.85,
              marginTop: 2,
              fontWeight: 500,
            }}
          >
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

export function ServiceTile({
  name,
  glyph,
  color,
  size = 56,
}: {
  name?: string;
  glyph: string;
  color?: string;
  size?: number;
}) {
  return (
    <div
      className="grid flex-shrink-0 place-items-center text-white"
      title={name}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: color || '#100E22',
        fontWeight: 800,
        fontFamily: 'Zain',
        fontSize: size * 0.42,
        letterSpacing: '-0.04em',
      }}
    >
      {glyph}
    </div>
  );
}

/* ---------------------------------------------------------------- *
 * Btn
 * ---------------------------------------------------------------- */
type BtnKind =
  | 'primary'
  | 'dark'
  | 'light'
  | 'ghost'
  | 'ghostLight'
  | 'outline'
  | 'outlineLight'
  | 'danger';

type BtnSize = 'sm' | 'md' | 'lg' | 'xl';

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  kind?: BtnKind;
  size?: BtnSize;
  icon?: IconName;
  iconRight?: IconName;
  full?: boolean;
};

const BTN_SIZE: Record<BtnSize, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-[22px] text-base gap-2.5',
  xl: 'h-14 px-7 text-lg gap-3',
};

const BTN_ICON: Record<BtnSize, number> = { sm: 14, md: 16, lg: 18, xl: 20 };

const BTN_KIND: Record<BtnKind, string> = {
  primary:
    'bg-primary text-primary-foreground border-transparent hover:bg-[#fff100] disabled:bg-gray-200 disabled:text-gray-400',
  dark: 'bg-[#100E22] text-white border-[#100E22] hover:bg-black',
  light: 'bg-white text-[#100E22] border-gray-200 hover:bg-gray-50',
  ghost: 'bg-transparent text-[#100E22] border-transparent hover:bg-black/5',
  ghostLight: 'bg-transparent text-white border-transparent hover:bg-white/10',
  outline: 'bg-transparent text-[#100E22] border-gray-300 hover:bg-gray-50',
  outlineLight: 'bg-transparent text-white border-white/20 hover:bg-white/10',
  danger: 'bg-red-600 text-white border-red-600 hover:bg-red-700',
};

export function Btn({
  kind = 'primary',
  size = 'md',
  icon,
  iconRight,
  full,
  className,
  children,
  type = 'button',
  ...rest
}: BtnProps) {
  return (
    <button
      type={type}
      className={clsx(
        'inline-flex select-none items-center justify-center rounded-xl border font-bold transition disabled:cursor-not-allowed',
        BTN_SIZE[size],
        BTN_KIND[kind],
        full && 'w-full',
        'whitespace-nowrap font-[Zain]',
        className,
      )}
      style={{ letterSpacing: '-0.01em' }}
      {...rest}
    >
      {icon && <Icon name={icon} size={BTN_ICON[size]} />}
      {children}
      {iconRight && <Icon name={iconRight} size={BTN_ICON[size]} />}
    </button>
  );
}

/* ---------------------------------------------------------------- *
 * Badge
 * ---------------------------------------------------------------- */
type BadgeKind =
  | 'soft'
  | 'softInv'
  | 'primary'
  | 'dark'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'outline';

const BADGE_KIND: Record<BadgeKind, string> = {
  soft: 'bg-gray-100 text-gray-700',
  softInv: 'bg-white/10 text-white',
  primary: 'bg-primary text-primary-foreground',
  dark: 'bg-[#100E22] text-white',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  outline: 'bg-transparent text-gray-500 border border-gray-200',
};

const BADGE_DOT: Record<BadgeKind, string> = {
  soft: 'bg-gray-700',
  softInv: 'bg-white',
  primary: 'bg-[#100E22]',
  dark: 'bg-white',
  success: 'bg-green-700',
  warning: 'bg-amber-700',
  danger: 'bg-red-700',
  info: 'bg-blue-700',
  outline: 'bg-gray-400',
};

export function Badge({
  kind = 'soft',
  dot,
  children,
  className,
  style,
}: {
  kind?: BadgeKind;
  dot?: boolean;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-[3px] text-[11px] font-bold uppercase',
        BADGE_KIND[kind],
        className,
      )}
      style={{ letterSpacing: '0.02em', ...style }}
    >
      {dot && (
        <span className={clsx('inline-block h-1.5 w-1.5 rounded-full opacity-80', BADGE_DOT[kind])} />
      )}
      {children}
    </span>
  );
}

/* ---------------------------------------------------------------- *
 * Field + Input
 * ---------------------------------------------------------------- */
export function Field({
  label,
  hint,
  error,
  action,
  className,
  children,
}: {
  label?: string;
  hint?: string;
  error?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={clsx('flex flex-col gap-1.5', className)}>
      {label && (
        <div className="flex items-baseline justify-between">
          <label className="text-[13px] font-semibold text-[#111827]" style={{ letterSpacing: '-0.01em' }}>
            {label}
          </label>
          {action}
        </div>
      )}
      {children}
      {hint && !error && <div className="text-xs text-gray-500">{hint}</div>}
      {error && (
        <div className="flex items-center gap-1 text-xs text-red-600">
          <Icon name="warning" size={12} /> {error}
        </div>
      )}
    </div>
  );
}

type InputSize = 'sm' | 'md' | 'lg';

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  icon?: IconName;
  suffix?: ReactNode;
  size?: InputSize;
};

const INPUT_H: Record<InputSize, string> = {
  sm: 'h-9',
  md: 'h-11',
  lg: 'h-[52px]',
};

export function Input({ icon, suffix, size = 'md', className, ...rest }: InputProps) {
  const [focus, setFocus] = useState(false);
  return (
    <div
      className={clsx(
        'flex items-center gap-2 rounded-[10px] border bg-white px-3 transition',
        INPUT_H[size],
        focus ? 'border-[#100E22] ring-2 ring-[#100E22]/10' : 'border-gray-200',
        className,
      )}
    >
      {icon && <Icon name={icon} size={16} className="text-gray-500" />}
      <input
        {...rest}
        onFocus={(e) => {
          setFocus(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocus(false);
          rest.onBlur?.(e);
        }}
        className="min-w-0 flex-1 border-none bg-transparent text-[15px] font-medium text-[#111827] outline-none"
        style={{ fontFamily: 'Zain' }}
      />
      {suffix}
    </div>
  );
}

/* ---------------------------------------------------------------- *
 * Dot (with pulse)
 * ---------------------------------------------------------------- */
export function Dot({ color, pulse }: { color: string; pulse?: boolean }) {
  return (
    <span className="relative inline-flex h-2 w-2">
      {pulse && (
        <span
          className="absolute -inset-[3px] rounded-full"
          style={{ background: color, opacity: 0.35, animation: 'tcPulse 1.6s ease-out infinite' }}
        />
      )}
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
    </span>
  );
}

/* ---------------------------------------------------------------- *
 * Placeholder
 * ---------------------------------------------------------------- */
export function Placeholder({
  label = 'image',
  height = 120,
  className,
}: {
  label?: string;
  height?: number;
  className?: string;
}) {
  return (
    <div
      className={clsx('grid place-items-center text-[11px] font-medium text-gray-500', className)}
      style={{
        height,
        borderRadius: 10,
        background: 'repeating-linear-gradient(135deg, #f4f4f8 0 10px, #ececf3 10px 20px)',
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        letterSpacing: 0.4,
      }}
    >
      {label}
    </div>
  );
}

/* ---------------------------------------------------------------- *
 * Section head
 * ---------------------------------------------------------------- */
export function SectionHead({
  title,
  sub,
  cta,
  onCta,
}: {
  title: string;
  sub?: string;
  cta?: string;
  onCta?: () => void;
}) {
  return (
    <div className="mb-3.5 flex items-end justify-between">
      <div>
        <div className="text-[22px] font-extrabold" style={{ letterSpacing: '-0.02em' }}>
          {title}
        </div>
        {sub && <div className="mt-0.5 text-[13px] text-gray-500">{sub}</div>}
      </div>
      {cta && (
        <Btn kind="ghost" size="sm" icon="arrowR" onClick={onCta}>
          {cta}
        </Btn>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- *
 * Order status badge
 * ---------------------------------------------------------------- */
export type OrderStatus =
  | 'completed'
  | 'processing'
  | 'pending'
  | 'cancelled'
  | 'refunded'
  | 'failed';

const STATUS_MAP: Record<OrderStatus, { kind: BadgeKind; label: string }> = {
  completed: { kind: 'success', label: 'Delivered' },
  processing: { kind: 'info', label: 'Processing' },
  pending: { kind: 'warning', label: 'Pending' },
  cancelled: { kind: 'danger', label: 'Cancelled' },
  refunded: { kind: 'soft', label: 'Refunded' },
  failed: { kind: 'danger', label: 'Failed' },
};

export function OrderStatusBadge({ status }: { status: OrderStatus | string }) {
  const m = STATUS_MAP[status as OrderStatus] || { kind: 'soft' as BadgeKind, label: status };
  return (
    <Badge kind={m.kind} dot>
      {m.label}
    </Badge>
  );
}
