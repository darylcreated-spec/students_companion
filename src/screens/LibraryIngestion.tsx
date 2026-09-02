import React, { useState } from 'react';
import { LectureDocument } from '../types';
import { FileDropzone } from '../components/library/FileDropzone';
import { LectureCard } from '../components/library/LectureCard';
import { GoogleDocsModal } from '../components/library/GoogleDocsModal';
import { HardDrive, Cloud, Plus, Sparkles, FolderOpen } from 'lucide-react';
import { db } from '../db/database';

interface LibraryIngestionProps {
  documents: LectureDocument[];
  activeDocumentId: string | null;
  isPlaying: boolean;
  onSelectDocument: (doc: LectureDocument) => void;
  onPlayToggle: (doc: LectureDocument) => void;
  onDocumentAdded: (doc: LectureDocument) => void;
  onDeleteDocument: (id: string) => void;
}

export const LibraryIngestion: React.FC<LibraryIngestionProps> = ({
  documents,
  activeDocumentId,
  isPlaying,
  onSelectDocument,
  onPlayToggle,
  onDocumentAdded,
  onDeleteDocument,
}) => {
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  const totalDurationMin = documents.reduce((acc, d) => acc + d.durationMinutes, 0);

  return (
    <div className="flex-1 flex flex-col p-4 pb-12 space-y-4 overflow-y-auto overscroll-contain">
      {/* Top Storage & Offline Status Pill */}
      <div className="p-3.5 rounded-2xl bg-[#0E1426]/70 border border-white/5 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <HardDrive className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-slate-200">
            {documents.length} Lectures Cached
          </span>
        </div>
        <span className="text-[11px] font-mono text-amber-300 font-semibold">
          ~{totalDurationMin} Min Audio Total
        </span>
      </div>

      {/* File Ingestion Dropzone */}
      <FileDropzone onDocumentAdded={onDocumentAdded} />

      {/* Google Docs Integration Quick Trigger */}
      <button
        onClick={() => setIsGoogleModalOpen(true)}
        className="w-full py-3 px-4 rounded-2xl bg-[#0E1426]/80 hover:bg-[#0E1426] border border-cyan-400/30 hover:border-cyan-400 text-cyan-300 flex items-center justify-between text-xs font-semibold shadow-[0_0_15px_rgba(34,211,238,0.15)] transition-all"
      >
        <div className="flex items-center space-x-2">
          <Cloud className="w-4 h-4 text-cyan-400" />
          <span>Sync Google Docs / Paste Outline</span>
        </div>
        <Plus className="w-4 h-4" />
      </button>

      {/* Cached Lecture Queue List */}
      <div className="space-y-2.5 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>Cached Audio Lectures</span>
          </h3>
          <span className="text-[10px] font-mono text-emerald-400 font-semibold">
            100% OFFLINE READY
          </span>
        </div>

        {documents.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              No lectures uploaded yet. Drop a slide deck or PDF above to start.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {documents.map((doc) => (
              <LectureCard
                key={doc.id}
                document={doc}
                isActive={activeDocumentId === doc.id}
                isPlaying={isPlaying && activeDocumentId === doc.id}
                onSelect={() => onSelectDocument(doc)}
                onPlayToggle={(e) => {
                  e.stopPropagation();
                  onPlayToggle(doc);
                }}
                onDelete={(e) => {
                  e.stopPropagation();
                  onDeleteDocument(doc.id);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Google Docs Modal */}
      <GoogleDocsModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        onDocumentAdded={onDocumentAdded}
      />
    </div>
  );
};
