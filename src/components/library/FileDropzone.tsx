import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, Presentation, FileCode, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
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
      setProgressMsg('Extracting slides & lecture content...');
      const { document, segments } = await extractDocumentText(file);

      setProgressMsg('Generating 3-5 min audio chapters...');
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
      }, 800);
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
    <div className="w-full">
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
        className={`w-full p-5 rounded-3xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center ${
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
              Ingest Lecture or Reading
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-[280px]">
              Drop files here or tap to browse. We chunk them into 3-5 min commute audio chapters.
            </p>

            {/* Supported Badges */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3.5">
              <span className="px-2 py-0.5 rounded-md bg-rose-950/60 border border-rose-500/30 text-rose-300 text-[10px] font-mono font-bold flex items-center gap-1">
                <Presentation className="w-3 h-3" /> .PPTX
              </span>
              <span className="px-2 py-0.5 rounded-md bg-red-950/60 border border-red-500/30 text-red-300 text-[10px] font-mono font-bold flex items-center gap-1">
                <FileText className="w-3 h-3" /> .PDF
              </span>
              <span className="px-2 py-0.5 rounded-md bg-blue-950/60 border border-blue-500/30 text-blue-300 text-[10px] font-mono font-bold flex items-center gap-1">
                <FileText className="w-3 h-3" /> .DOCX
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono font-bold flex items-center gap-1">
                <FileCode className="w-3 h-3" /> .TXT / .MD
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
