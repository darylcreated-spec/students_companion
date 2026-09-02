import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, Presentation, FileCode, Loader2, Filter } from 'lucide-react';
import { extractDocumentText } from '../../services/parsers/documentParser';
import { db } from '../../db/database';
import { LectureDocument } from '../../types';

interface FileDropzoneProps {
  onDocumentAdded: (doc: LectureDocument) => void;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({ onDocumentAdded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    setIsProcessing(true);
    setProgressMsg(`Reading ${file.name}...`);

    try {
      setProgressMsg('Extracting text & filtering non-essential content...');
      const { document, segments, skippedSectionsCount } = await extractDocumentText(file);

      setProgressMsg(
        skippedSectionsCount > 0
          ? `Skipped ${skippedSectionsCount} TOC/Index/Blank pages • Generating audio chapters...`
          : 'Generating 3-5 min audio chapters...'
      );
      
      const newDoc: LectureDocument = {
        ...document,
        id: `doc-${Date.now()}`
      };

      // Store in Dexie IndexedDB
      await db.documents.add(newDoc);
      onDocumentAdded(newDoc);
      setProgressMsg('Done! Ready for commute.');
    } catch (err: any) {
      console.error('File parsing error:', err);
      alert(`Error parsing file: ${err.message || 'Unsupported format'}`);
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        setProgressMsg('');
      }, 900);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="w-full space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.pptx,.txt,.md"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`w-full p-6 rounded-3xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center ${
          isDragging
            ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_25px_rgba(34,211,238,0.3)]'
            : 'border-slate-700/80 hover:border-cyan-400/60 bg-[#0E1426]/60 hover:bg-[#0E1426]/90'
        }`}
      >
        {isProcessing ? (
          <div className="py-4 flex flex-col items-center space-y-3">
            <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
            <p className="text-sm font-semibold text-cyan-300 font-mono animate-pulse">
              {progressMsg}
            </p>
          </div>
        ) : (
          <>
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 mb-3 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
              <UploadCloud className="w-7 h-7" />
            </div>

            <h3 className="text-base font-bold text-slate-100 tracking-tight">
              Ingest Books, Articles & Lectures
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-[280px]">
              Drop files here or tap to browse. Automatically chunked into 3-5 min commute audio chapters.
            </p>

            {/* Smart Content Filter Notice */}
            <div className="flex items-center space-x-1.5 mt-3 text-[11px] font-mono text-cyan-400/90">
              <Filter className="w-3 h-3" />
              <span>Auto-filters Table of Contents, Index, Blank Pages & Captions</span>
            </div>

            {/* Supported Formats */}
            <div className="flex items-center justify-center space-x-3 mt-2 text-[10px] font-mono text-slate-500">
              <span>PPTX</span>
              <span>•</span>
              <span>PDF</span>
              <span>•</span>
              <span>DOCX</span>
              <span>•</span>
              <span>TXT / MD</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
