import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/utils';

interface RadioProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ label, error, className, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center space-x-2">
          <input
            type="radio"
            id={id}
            ref={ref}
            className={cn(
              'h-4 w-4 border-slate-200 text-primary focus:ring-primary dark:border-slate-800 dark:bg-slate-950',
              className
            )}
            {...props}
          />
          {label && (
            <label
              htmlFor={id}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {label}
            </label>
          )}
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

Radio.displayName = 'Radio';
