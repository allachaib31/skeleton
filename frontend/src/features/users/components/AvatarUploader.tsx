import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/shared/components/ui/Avatar';
import { Button } from '@/shared/components/ui/Button';
import { FileUpload } from '@/shared/components/forms/FileUpload';
import { useUploadAvatar } from '../hooks/useUploadAvatar';
import { Camera } from 'lucide-react';

interface AvatarUploaderProps {
  currentAvatar?: string;
  name: string;
}

export function AvatarUploader({ currentAvatar, name }: AvatarUploaderProps) {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const { mutate: upload, isPending } = useUploadAvatar();

  const handleUpload = () => {
    if (file) {
      upload(file, {
        onSuccess: () => setFile(null),
      });
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <Avatar 
          src={currentAvatar} 
          name={name} 
          size="xl" 
          className="ring-4 ring-white dark:ring-slate-900 shadow-xl"
        />
        <div className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full border-4 border-white dark:border-slate-900 shadow-lg">
          <Camera size={20} />
        </div>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <FileUpload 
          onFile={setFile} 
          accept="image/*" 
          maxSize={2 * 1024 * 1024} 
        />
        {file && (
          <Button 
            className="w-full" 
            onClick={handleUpload} 
            isLoading={isPending}
          >
            {t('runtime.updatePhoto')}
          </Button>
        )}
      </div>
    </div>
  );
}
