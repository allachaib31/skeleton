import { FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, FileJson, Globe2, Upload } from 'lucide-react';
import { useUIStore } from '@/app/stores/ui.store';
import {
  useAdminLanguages,
  useDownloadLanguageTemplate,
  useUploadLanguage,
} from '@/features/i18n/hooks/languages.hooks';
import { Card } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Select } from '@/shared/components/ui/Select';
import { Badge } from '@/shared/components/ui/Badge';
import { SEO } from '@/shared/components/seo/SEO';
import { Spinner } from '@/shared/components/ui/Spinner';

export default function LanguagesPage() {
  const { t } = useTranslation();
  const { setPageTitle, setBreadcrumbs } = useUIStore();
  const { data: languagesResponse, isLoading } = useAdminLanguages();
  const { mutate: downloadTemplate, isPending: isDownloading } = useDownloadLanguageTemplate();
  const { mutate: uploadLanguage, isPending: isUploading } = useUploadLanguage();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr');
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    setPageTitle(t('admin.languages.title'));
    setBreadcrumbs([{ label: t('admin.panel'), href: '/admin/dashboard' }, { label: t('admin.languages.title') }]);
  }, [setPageTitle, setBreadcrumbs, t]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) return;
    const form = event.currentTarget;

    uploadLanguage(
      { code, name, direction, file },
      {
        onSuccess: () => {
          setCode('');
          setName('');
          setDirection('ltr');
          setFile(null);
          form.reset();
        },
      }
    );
  };

  return (
    <div className="space-y-8">
      <SEO title={t('admin.languages.title')} description={t('runtime.languagesInstructions')} />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold">
            <Globe2 className="text-primary" />
            {t('admin.languages.title')}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {t('runtime.languagesInstructions')}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => downloadTemplate()}
          isLoading={isDownloading}
          leftIcon={<Download size={16} />}
        >
          {t('runtime.downloadModelJson')}
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <Card padding="lg" className="lg:col-span-1">
          <h2 className="mb-6 font-bold">{t('runtime.uploadLanguage')}</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label={t('runtime.languageCode')}
              placeholder="es"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              required
              hint={t('runtime.languageIsoHint')}
            />
            <Input
              label={t('runtime.languageName')}
              placeholder="Español"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
            <Select
              label={t('runtime.textDirection')}
              value={direction}
              onChange={(event) => setDirection(event.target.value as 'ltr' | 'rtl')}
              options={[
                { label: t('runtime.leftToRight'), value: 'ltr' },
                { label: t('runtime.rightToLeft'), value: 'rtl' },
              ]}
            />
            <Input
              label={t('runtime.translatedJsonFile')}
              type="file"
              accept="application/json,.json"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              required
            />
            <Button
              type="submit"
              className="w-full"
              isLoading={isUploading}
              leftIcon={<Upload size={16} />}
              disabled={!file}
            >
              {t('runtime.uploadLanguage')}
            </Button>
          </form>
        </Card>

        <Card padding="none" className="overflow-hidden lg:col-span-2">
          <div className="border-b border-slate-100 p-6 dark:border-slate-800">
            <h2 className="font-bold">{t('runtime.availableLanguages')}</h2>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {languagesResponse?.data.map((language) => (
                <div key={language.code} className="flex items-center justify-between gap-4 p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                      <FileJson size={20} className="text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold">{language.name}</h3>
                        <Badge variant={language.isCustom ? 'success' : 'default'}>
                          {language.isCustom ? t('runtime.custom') : t('runtime.builtIn')}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {language.code} · {language.direction.toUpperCase()}
                        {language.updatedAt ? ` · ${t('runtime.updated')} ${new Date(language.updatedAt).toLocaleDateString()}` : ''}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
