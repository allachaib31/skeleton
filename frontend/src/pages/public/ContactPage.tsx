import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { SEO } from '@/shared/components/seo/SEO';
import { Card } from '@/shared/components/ui/Card';
import { Input } from '@/shared/components/ui/Input';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Button } from '@/shared/components/ui/Button';
import { Mail, MessageSquare, Send, CheckCircle } from 'lucide-react';

export default function ContactPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { t } = useTranslation();
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const onSubmit = (data: any) => {
    console.log('Contact form submitted:', data);
    setIsSubmitted(true);
    reset();
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 space-y-12">
      <SEO title={t('runtime.contactSeoTitle')} description={t('runtime.contactDescription')} />

      <section className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">{t('runtime.getInTouch')}</h1>
        <p className="text-xl text-slate-500 max-w-lg mx-auto">
          {t('runtime.contactDescription')}
        </p>
      </section>

      <Card padding="lg">
        {isSubmitted ? (
          <div className="py-10 text-center space-y-6">
            <div className="mx-auto w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
              <CheckCircle size={40} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('runtime.messageSent')}</h2>
              <p className="text-slate-500">{t('runtime.messageSentDescription')}</p>
            </div>
            <Button variant="outline" onClick={() => setIsSubmitted(false)}>
              {t('runtime.sendAnotherMessage')}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input 
              label={t('auth.name')} 
              placeholder="John Doe"
              leftIcon={<Send size={18} />}
              {...register('name', { required: t('runtime.nameRequired') })}
              error={errors.name?.message as string}
            />
            <Input 
              label={t('auth.email')} 
              type="email"
              placeholder="john@example.com"
              leftIcon={<Mail size={18} />}
              {...register('email', { required: t('runtime.emailRequired') })}
              error={errors.email?.message as string}
            />
            <Textarea 
              label={t('runtime.yourMessage')} 
              rows={5}
              placeholder={t('runtime.messagePlaceholder')}
              {...register('message', { required: t('runtime.messageRequired') })}
              error={errors.message?.message as string}
            />
            <Button type="submit" className="w-full" rightIcon={<Send size={18} />}>
              {t('runtime.sendMessage')}
            </Button>
          </form>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-500">
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
          <Mail size={18} className="text-primary" />
          <span>support@appname.io</span>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
          <MessageSquare size={18} className="text-primary" />
          <span>{t('runtime.liveChatHours')}</span>
        </div>
      </div>
    </div>
  );
}
