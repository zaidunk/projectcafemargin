'use client'

import { useDropzone } from 'react-dropzone'
import { useTranslation } from 'react-i18next'
import { Upload, FileSpreadsheet, X } from 'lucide-react'
import clsx from 'clsx'

export default function UploadZone({ onFile, loading }) {
  const { t } = useTranslation()
  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
    onDrop: (files) => { if (files[0]) onFile(files[0]) },
    disabled: loading,
  })

  return (
    <div
      {...getRootProps()}
      className={clsx(
        'relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 overflow-hidden',
        isDragActive
          ? 'border-brand-500 bg-brand-50 scale-[1.01]'
          : 'border-brand-200 hover:border-brand-400 hover:bg-brand-50/50',
        loading && 'opacity-60 cursor-not-allowed pointer-events-none'
      )}
    >
      <input {...getInputProps()} />

      {/* Background decoration */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="absolute top-2 right-4 text-[80px]">📊</div>
      </div>

      <div className="relative flex flex-col items-center gap-3">
        {loading ? (
          <>
            <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-brand-200 border-t-brand-700 rounded-full animate-spin" />
            <p className="font-semibold text-brand-600 text-sm">{t('transactions.uploading')}</p>
          </>
        ) : isDragActive ? (
          <>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-brand-100 rounded-2xl flex items-center justify-center animate-pulse-soft">
              <FileSpreadsheet className="text-brand-700 icon-md" />
            </div>
            <p className="font-semibold text-brand-700">Lepaskan file di sini</p>
          </>
        ) : (
          <>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-brand-100 rounded-2xl flex items-center justify-center">
              <Upload className="text-brand-500 icon-md" />
            </div>
            <div>
              <p className="font-semibold text-brand-700 text-sm">{t('transactions.upload_hint')}</p>
              <p className="text-xs text-brand-400 mt-1">{t('transactions.upload_formats')}</p>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 mt-1 text-[var(--text-xs)] text-brand-400">
              <span className="flex items-center gap-1">✓ Export Moka POS</span>
              <span className="flex items-center gap-1">✓ Template CafeMargin</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
