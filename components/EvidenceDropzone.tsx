"use client";

import React, { useCallback, useState } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { UploadCloud, X, File as FileIcon, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';

interface EvidenceDropzoneProps {
  onUploadComplete: (attachments: { url: string; publicId: string; fileName: string; fileType: string }[]) => void;
}

export function EvidenceDropzone({ onUploadComplete }: EvidenceDropzoneProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedAttachments, setUploadedAttachments] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    setErrorMsg(null);
    if (fileRejections.length > 0) {
      setErrorMsg(`Some files were rejected. Ensure they are images or PDFs under 5MB.`);
    }
    setFiles((prev) => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
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
    setErrorMsg(null);

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
      setErrorMsg('Failed to upload files. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Dropzone */}
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 relative overflow-hidden group
          ${isDragReject ? 'border-red-400 bg-red-50' : isDragAccept ? 'border-emerald-400 bg-emerald-50' : isDragActive ? 'border-indigo-500 bg-indigo-50/80 scale-[1.02] shadow-lg' : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/30'}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-4 relative z-10">
          <div className={`w-16 h-16 rounded-full shadow-sm flex items-center justify-center transition-colors duration-300 ${isDragReject ? 'bg-red-100 text-red-500' : isDragAccept ? 'bg-emerald-100 text-emerald-500' : 'bg-white text-indigo-500 group-hover:scale-110 group-hover:shadow-md'}`}>
            {isDragReject ? <AlertCircle className="w-8 h-8" /> : <UploadCloud className="w-8 h-8" />}
          </div>
          <div>
            <p className="text-base font-bold text-slate-800">
              {isDragReject ? 'File type not supported' : isDragAccept ? 'Drop to upload' : 'Drag & drop evidence files here'}
            </p>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              Supports PDF, PNG, JPG up to 5MB
            </p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-red-50 text-red-700 text-sm font-medium rounded-xl border border-red-100 flex items-center gap-3 shadow-sm"
          >
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
            {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* File Queue */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            <h4 className="text-sm font-bold text-slate-800 flex items-center justify-between">
              Ready to upload
              <span className="bg-slate-200 text-slate-700 py-0.5 px-2 rounded-full text-xs">{files.length}</span>
            </h4>
            <div className="space-y-3">
              {files.map((file, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  key={`${file.name}-${i}`} 
                  className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] group hover:border-indigo-200 transition-colors"
                >
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className="p-2.5 bg-indigo-50/80 text-indigo-600 rounded-lg shrink-0">
                      <FileIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-slate-800 block truncate max-w-[200px] sm:max-w-[300px]">{file.name}</span>
                      <span className="text-xs text-slate-500 font-medium">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => removeFile(i)}
                    disabled={uploading}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all focus:outline-none"
                    aria-label="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>
            
            <button 
              onClick={uploadFiles}
              disabled={uploading}
              className="w-full py-3.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 focus:ring-4 focus:ring-slate-900/20 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> 
                  <span>Uploading securely...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-5 h-5" />
                  <span>Upload {files.length} {files.length === 1 ? 'File' : 'Files'}</span>
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Uploaded Files */}
      {uploadedAttachments.length > 0 && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="space-y-4 pt-6 border-t border-slate-100"
        >
          <h4 className="text-sm font-bold text-slate-800 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              Uploaded Evidence
            </span>
            <span className="bg-emerald-100 text-emerald-800 py-0.5 px-2 rounded-full text-xs">{uploadedAttachments.length}</span>
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {uploadedAttachments.map((att, i) => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                key={i} 
                className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-50 flex items-center justify-center shadow-sm"
              >
                {att.fileType.startsWith('image/') ? (
                  <Image src={att.url} alt={att.fileName} fill className="object-cover transition-transform duration-500 group-hover:scale-105" referrerPolicy="no-referrer" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 group-hover:text-indigo-500 transition-colors duration-300">
                    <FileIcon className="w-8 h-8 mb-2" />
                    <span className="text-xs font-medium truncate w-full px-4 text-center">{att.fileName}</span>
                  </div>
                )}
                {/* Overlay */}
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-[2px]">
                  <CheckCircle2 className="w-6 h-6 text-white mb-1" />
                  <span className="text-white text-xs font-bold tracking-wide uppercase">Uploaded</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

