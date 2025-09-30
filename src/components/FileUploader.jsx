// @ts-ignore;
import React, { useCallback, useState } from 'react';
// @ts-ignore;
import { useToast } from '@/components/ui';
// @ts-ignore;
import { Upload, Camera, FileText, CheckCircle, XCircle, Loader } from 'lucide-react';

export function FileUploader({
  onFileSelect,
  accept = '.xlsx,.xls',
  title,
  description,
  icon
}) {
  const [isDragging, setIsDragging] = useState(false);
  const {
    toast
  } = useToast();
  const handleDragOver = useCallback(e => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  const handleDragLeave = useCallback(e => {
    e.preventDefault();
    setIsDragging(false);
  }, []);
  const handleDrop = useCallback(e => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [onFileSelect]);
  const handleFileInput = useCallback(e => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [onFileSelect]);
  const handleFile = useCallback(file => {
    if (file) {
      const extension = file.name.split('.').pop().toLowerCase();
      if (['xlsx', 'xls'].includes(extension)) {
        onFileSelect(file);
      } else {
        toast({
          title: '文件格式错误',
          description: '请选择Excel文件(.xlsx或.xls格式)',
          variant: 'destructive'
        });
      }
    }
  }, [onFileSelect, toast]);
  return <div className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => document.getElementById('file-input')?.click()}>
      <input id="file-input" type="file" accept={accept} onChange={handleFileInput} className="hidden" />
      <div className="flex flex-col items-center justify-center space-y-3">
        {icon || <Upload className="w-8 h-8 text-gray-400" />}
        <div>
          <p className="font-medium text-gray-900">{title}</p>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
          选择文件
        </button>
      </div>
    </div>;
}