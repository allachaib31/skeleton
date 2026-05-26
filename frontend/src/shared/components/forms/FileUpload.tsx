import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, X, File as FileIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { formatBytes } from '@/shared/lib/utils/format';
import { toast } from 'sonner';

interface FileUploadProps {
  accept?: string;
  maxSize?: number; // in bytes
  onFile: (file: File) => void;
  onClear?: () => void;
  preview?: boolean;
}

export function FileUpload({ accept, maxSize, onFile, onClear, preview = true }: FileUploadProps) {
  const { t } = useTranslation();
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (newFile: File) => {
    if (maxSize && newFile.size > maxSize) {
      toast.error(t('runtime.fileTooLarge', { size: formatBytes(maxSize) }));
      return;
    }
    setFile(newFile);
    onFile(newFile);
    if (preview && newFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(newFile);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const onDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-4">
      {!file ? (
        <div
          className={cn(
            "relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl transition-colors",
            dragActive 
              ? "border-primary bg-primary/5" 
              : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900"
          )}
          onDragEnter={onDrag}
          onDragLeave={onDrag}
          onDragOver={onDrag}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept={accept}
            onChange={onChange}
          />
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-10 h-10 mb-3 text-slate-400" />
            <p className="mb-2 text-sm text-slate-500 font-semibold">
              {t('runtime.clickToUpload')} {t('runtime.orDragAndDrop')}
            </p>
            <p className="text-xs text-slate-400">
              {accept || t('runtime.allFiles')} ({t('runtime.max')}: {maxSize ? formatBytes(maxSize) : t('runtime.unlimited')})
            </p>
          </div>
        </div>
      ) : (
        <div className="relative flex items-center gap-4 p-4 border border-white/10 rounded-xl bg-secondary">
          {previewUrl ? (
            <img src={previewUrl} alt={t('runtime.preview')} className="w-16 h-16 rounded object-cover" />
          ) : (
            <div className="w-16 h-16 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <FileIcon className="text-slate-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
          </div>
          <button 
            type="button"
            onClick={() => { setFile(null); setPreviewUrl(null); onClear?.(); }}
            className="text-slate-400 hover:text-red-500"
          >
            <X size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
