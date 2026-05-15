import { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

interface FormFieldProps {
  label?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function FormField({ label, error, required, children, className }: FormFieldProps) {
  return (
    <div className={cn("w-full space-y-1.5", className)}>
      {label && (
        <label className="text-sm font-medium leading-none">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
