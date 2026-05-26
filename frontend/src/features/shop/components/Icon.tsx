import { CSSProperties } from 'react';

type IconName =
  | 'search' | 'cart' | 'user' | 'wallet' | 'bell' | 'chevronR' | 'chevronL'
  | 'chevronD' | 'chevronU' | 'plus' | 'minus' | 'close' | 'check' | 'home'
  | 'grid' | 'list' | 'refresh' | 'bolt' | 'clock' | 'shield' | 'gift' | 'game'
  | 'tv' | 'heart' | 'phone' | 'sms' | 'receipt' | 'upload' | 'qr' | 'eye'
  | 'eyeOff' | 'lock' | 'settings' | 'star' | 'sparkle' | 'flame' | 'arrowR'
  | 'arrowL' | 'globe' | 'info' | 'warning' | 'menu' | 'filter' | 'copy'
  | 'package' | 'headphones' | 'download';

type IconProps = {
  name: IconName;
  size?: number;
  stroke?: number;
  className?: string;
  style?: CSSProperties;
};

const PATHS: Record<IconName, React.ReactNode> = {
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  cart: <><path d="M3 4h2l2.5 12.5a2 2 0 0 0 2 1.5h8a2 2 0 0 0 2-1.5L21 8H6" /><circle cx="10" cy="20" r="1.2" /><circle cx="17" cy="20" r="1.2" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  wallet: <><rect x="3" y="6" width="18" height="13" rx="3" /><path d="M3 10h18" /><circle cx="16" cy="14.5" r="1.2" fill="currentColor" /></>,
  bell: <><path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" /><path d="M10 19a2 2 0 0 0 4 0" /></>,
  chevronR: <path d="m9 6 6 6-6 6" />,
  chevronL: <path d="m15 6-6 6 6 6" />,
  chevronD: <path d="m6 9 6 6 6-6" />,
  chevronU: <path d="m18 15-6-6-6 6" />,
  plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  minus: <path d="M5 12h14" />,
  close: <><path d="m6 6 12 12" /><path d="m18 6-12 12" /></>,
  check: <path d="m5 12 5 5L20 7" />,
  home: <><path d="M3 11 12 4l9 7" /><path d="M5 10v10h14V10" /></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  list: <><path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" /><circle cx="4" cy="6" r="1" fill="currentColor" stroke="none" /><circle cx="4" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="4" cy="18" r="1" fill="currentColor" stroke="none" /></>,
  refresh: <><path d="M3 12a9 9 0 0 1 15.5-6.3L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15.5 6.3L3 16" /><path d="M3 21v-5h5" /></>,
  bolt: <path d="M13 3 4 14h7l-1 7 9-11h-7l1-7Z" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  shield: <path d="M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6l-8-3Z" />,
  gift: <><rect x="3" y="8" width="18" height="13" rx="2" /><path d="M3 12h18" /><path d="M12 8v13" /><path d="M8 8a3 3 0 1 1 0-6c2 0 4 3 4 6" /><path d="M16 8a3 3 0 1 0 0-6c-2 0-4 3-4 6" /></>,
  game: <><rect x="2" y="7" width="20" height="11" rx="4" /><path d="M7 12h3M8.5 10.5v3" /><circle cx="15.5" cy="11" r="1" fill="currentColor" stroke="none" /><circle cx="17.5" cy="13.5" r="1" fill="currentColor" stroke="none" /></>,
  tv: <><rect x="3" y="5" width="18" height="12" rx="2" /><path d="M8 21h8" /><path d="M12 17v4" /></>,
  heart: <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z" />,
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2Z" />,
  sms: <path d="M21 12a8 8 0 1 1-3-6.3L21 4v6h-6" />,
  receipt: <><path d="M5 3h14v18l-3-2-3 2-3-2-3 2-2-1.5V3Z" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
  upload: <><path d="M12 16V4" /><path d="m6 10 6-6 6 6" /><path d="M4 20h16" /></>,
  qr: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="15" y="15" width="3" height="3" /><path d="M14 19h2M19 14v2M19 21v-2" /></>,
  eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>,
  eyeOff: <><path d="M3 3l18 18" /><path d="M10.6 6.2A10 10 0 0 1 12 6c6 0 10 6 10 6a18 18 0 0 1-3 3.5M6 7.5C3 9.5 2 12 2 12s4 6 10 6c1.6 0 3-.3 4.2-.9" /></>,
  lock: <><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></>,
  star: <path d="m12 3 2.6 5.4L20 9.3l-4 3.9.9 5.5L12 16l-4.9 2.7L8 13.2l-4-3.9 5.4-.9L12 3Z" />,
  sparkle: <><path d="M12 3v6M12 15v6M3 12h6M15 12h6" /><path d="m5.6 5.6 4.2 4.2M14.2 14.2l4.2 4.2M5.6 18.4l4.2-4.2M14.2 9.8l4.2-4.2" /></>,
  flame: <path d="M12 3s5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 1-3s-1 4 2 4c2 0 3-2 2-5 0 0 0-3 0-6Z" />,
  arrowR: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
  arrowL: <><path d="M19 12H5" /><path d="m11 6-6 6 6 6" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v5h1" /></>,
  warning: <><path d="M12 3 2 21h20L12 3Z" /><path d="M12 10v5M12 18h.01" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  filter: <path d="M3 5h18l-7 9v6l-4-2v-4L3 5Z" />,
  copy: <><rect x="8" y="8" width="13" height="13" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></>,
  package: <><path d="m21 8-9-5-9 5 9 5 9-5Z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></>,
  headphones: <path d="M3 16v-4a9 9 0 0 1 18 0v4a3 3 0 0 1-3 3h-1v-7h4M3 16a3 3 0 0 0 3 3h1v-7H3" />,
  download: <><path d="M12 4v12" /><path d="m6 10 6 6 6-6" /><path d="M4 20h16" /></>,
};

export function Icon({ name, size = 18, stroke = 1.6, className, style }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      {PATHS[name]}
    </svg>
  );
}

export type { IconName };
