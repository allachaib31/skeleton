import { Link } from 'react-router-dom';
import { useUIStore } from '@/app/stores/ui.store';
import { useLanguageStore } from '@/app/stores/language.store';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export function Breadcrumb() {
  const { breadcrumbs } = useUIStore();
  const { direction } = useLanguageStore();
  const SeparatorIcon = direction === 'rtl' ? ChevronLeft : ChevronRight;

  if (breadcrumbs.length === 0) return null;

  return (
    <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6 overflow-x-auto whitespace-nowrap pb-2">
      <Link to="/" className="hover:text-primary transition-colors flex items-center">
        <Home size={16} />
      </Link>
      
      {breadcrumbs.map((crumb, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <SeparatorIcon size={14} className="text-slate-300" />
          {crumb.href ? (
            <Link 
              to={crumb.href} 
              className={cn(
                "hover:text-primary transition-colors",
                idx === breadcrumbs.length - 1 && "text-foreground font-medium"
              )}
            >
              {crumb.label}
            </Link>
          ) : (
            <span className={cn(
              idx === breadcrumbs.length - 1 && "text-foreground font-medium"
            )}>
              {crumb.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
