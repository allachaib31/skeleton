import { CSSProperties, ReactNode, useState, useRef, useEffect, useLayoutEffect } from 'react';
import { cn } from '@/shared/lib/utils';

interface DropdownItem {
  label: ReactNode;
  icon?: ReactNode;
  onClick: () => void;
  danger?: boolean;
}

interface DropdownProps {
  trigger: ReactNode;
  items?: DropdownItem[];
  children?: ReactNode;
  align?: 'left' | 'right';
  contentClassName?: string;
}

export function Dropdown({ trigger, items = [], children, align = 'right', contentClassName }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    const triggerElement = containerRef.current;
    const contentElement = contentRef.current;
    if (!triggerElement || !contentElement) return;

    const triggerRect = triggerElement.getBoundingClientRect();
    const contentRect = contentElement.getBoundingClientRect();
    const viewportPadding = 16;
    const desiredLeft = align === 'right'
      ? triggerRect.right - contentRect.width
      : triggerRect.left;
    const maxLeft = window.innerWidth - contentRect.width - viewportPadding;
    const left = Math.min(Math.max(desiredLeft, viewportPadding), Math.max(viewportPadding, maxLeft));
    const top = Math.min(triggerRect.bottom + 8, window.innerHeight - viewportPadding);

    setMenuStyle({
      position: 'fixed',
      left,
      top,
      visibility: 'visible',
    });
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const handleLayoutChange = () => updatePosition();
    window.addEventListener('resize', handleLayoutChange);
    window.addEventListener('scroll', handleLayoutChange, true);
    return () => {
      window.removeEventListener('resize', handleLayoutChange);
      window.removeEventListener('scroll', handleLayoutChange, true);
    };
  }, [isOpen, align, children, items.length]);

  return (
    <div className="relative inline-block text-start" ref={containerRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>
      
      {isOpen && (
        <div
          ref={contentRef}
          style={{ visibility: 'hidden', ...menuStyle }}
          className={cn(
          "z-50 rounded-md bg-secondary shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-white/10",
          children ? "w-auto" : "w-56 py-1",
          contentClassName
        )}>
          {children || items.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
              className={cn(
                "flex w-full min-w-0 items-center gap-3 px-4 py-2 text-start text-sm transition-colors",
                item.danger 
                  ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-950" 
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              {item.icon && <span>{item.icon}</span>}
              <span className="min-w-0 flex-1">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
