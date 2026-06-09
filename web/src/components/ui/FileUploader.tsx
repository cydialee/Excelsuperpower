import { useState, useRef, type DragEvent, type ChangeEvent } from 'react';
import { Upload, FileSpreadsheet, X } from 'lucide-react';
import { formatFileSize } from '@/lib/utils';

interface FileUploaderProps {
  onFile: (file: File) => void;
  disabled?: boolean;
  accept?: string;
  maxSize?: number; // bytes
}

export default function FileUploader({
  onFile,
  disabled = false,
  accept = '.xlsx,.xlsm',
  maxSize = 20 * 1024 * 1024,
}: FileUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndSet = (file: File) => {
    setError(null);

    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    const allowed = accept.split(',').map((s) => s.trim().toLowerCase());
    if (!allowed.includes(ext)) {
      setError(`仅支持 ${accept} 格式的文件`);
      return;
    }

    if (file.size > maxSize) {
      setError(`文件大小不能超过 ${formatFileSize(maxSize)}`);
      return;
    }

    setSelectedFile(file);
    onFile(file);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) validateAndSet(file);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSet(file);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`
          relative rounded-panel border-2 border-dashed p-10 text-center cursor-pointer
          transition-all duration-200
          ${dragOver
            ? 'border-primary-400 bg-primary-50/50'
            : disabled
              ? 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-60'
              : 'border-border bg-white/60 hover:border-primary-300 hover:bg-primary-50/20'
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
          disabled={disabled}
        />

        {selectedFile ? (
          <div className="flex items-center justify-center gap-3">
            <FileSpreadsheet size={28} className="text-emerald-500" />
            <div className="text-left">
              <div className="text-sm font-semibold text-slate-700">{selectedFile.name}</div>
              <div className="text-xs text-slate-400">{formatFileSize(selectedFile.size)}</div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearFile();
              }}
              className="ml-2 p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div>
            <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-3">
              <Upload size={26} className="text-primary-500" />
            </div>
            <div className="text-sm font-semibold text-slate-700 mb-1">
              拖拽文件到此处，或点击选择
            </div>
            <div className="text-xs text-slate-400">支持 .xlsx / .xlsm 格式，最大 {formatFileSize(maxSize)}</div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
          <X size={12} />
          {error}
        </p>
      )}
    </div>
  );
}
