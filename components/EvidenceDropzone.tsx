"use client";

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, X, File as FileIcon, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface EvidenceDropzoneProps {
  onUploadComplete: (attachments: { url: string; publicId: string; fileName: string; fileType: string }[]) => void;
}

export function EvidenceDropzone({ onUploadComplete }: EvidenceDropzoneProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedAttachments, setUploadedAttachments] = useState<any[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
      'application/pdf': ['.pdf'],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;
    setUploading(true);

    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error('Upload failed');
        return response.json();
      });

      const results = await Promise.all(uploadPromises);
      const newAttachments = results.map(res => ({
        url: res.url,
        publicId: res.publicId,
        fileName: res.fileName,
        fileType: res.fileType
      }));
      
      setUploadedAttachments([...uploadedAttachments, ...newAttachments]);
      onUploadComplete([...uploadedAttachments, ...newAttachments]);
      setFiles([]); // clear queue
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Failed to upload files. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Dropzone */}
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 bg-slate-50'}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center">
            <UploadCloud className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">
              {isDragActive ? 'Drop files here' : 'Drag & drop evidence files here'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Supports PDF, PNG, JPG up to 5MB
            </p>
          </div>
        </div>
      </div>

      {/* File Queue */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-slate-700">Ready to upload</h4>
          <div className="space-y-2">
            {files.map((file, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                    <FileIcon className="w-4 h-4" />
                  </div>
                  <span className="text-sm text-slate-700 truncate">{file.name}</span>
                </div>
                <button 
                  onClick={() => removeFile(i)}
                  disabled={uploading}
                  className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          
          <button 
            onClick={uploadFiles}
            disabled={uploading}
            className="w-full py-2.5 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
              </>
            ) : (
              'Upload Files'
            )}
          </button>
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedAttachments.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h4 className="text-sm font-bold text-emerald-700 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            Uploaded Evidence
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {uploadedAttachments.map((att, i) => (
              <div key={i} className="relative group rounded-lg overflow-hidden border border-slate-200 aspect-video bg-slate-100 flex items-center justify-center">
                {att.fileType.startsWith('image/') ? (
                  <Image src={att.url} alt={att.fileName} fill className="object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <FileIcon className="w-8 h-8 mb-2" />
                    <span className="text-xs truncate w-full px-2 text-center">{att.fileName}</span>
                  </div>
                )}
                {/* Overlay */}
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-xs font-medium">Uploaded</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
