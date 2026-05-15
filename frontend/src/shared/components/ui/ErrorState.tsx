import { useTranslation } from 'react-i18next';
import { Button } from './Button';
import { AlertCircle } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({ 
  title, 
  description,
  onRetry 
}: ErrorStateProps) {
  const { t } = useTranslation();
  const resolvedTitle = title ?? t('runtime.serverErrorTitle');
  const resolvedDescription = description ?? t('runtime.dataLoadErrorDescription');

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="mb-4 text-red-500">
        <AlertCircle size={48} />
      </div>
      <h3 className="text-lg font-semibold mb-2">{resolvedTitle}</h3>
      <p className="text-slate-500 max-w-sm mb-6">{resolvedDescription}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          {t('runtime.tryAgain')}
        </Button>
      )}
    </div>
  );
}
