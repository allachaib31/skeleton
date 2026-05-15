import { useTranslation } from 'react-i18next';

interface JsonDiffProps {
  before?: any;
  after?: any;
}

export function JsonDiff({ before, after }: JsonDiffProps) {
  const { t } = useTranslation();
  const format = (val: any) => JSON.stringify(val, null, 2);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{t('runtime.before')}</span>
        <pre className="p-3 bg-slate-100 dark:bg-slate-900 rounded-lg text-xs overflow-auto max-h-60 border border-slate-200 dark:border-slate-800">
          {before ? format(before) : t('runtime.none')}
        </pre>
      </div>
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{t('runtime.after')}</span>
        <pre className="p-3 bg-primary/5 dark:bg-primary/10 rounded-lg text-xs overflow-auto max-h-60 border border-primary/20">
          {after ? format(after) : t('runtime.none')}
        </pre>
      </div>
    </div>
  );
}
