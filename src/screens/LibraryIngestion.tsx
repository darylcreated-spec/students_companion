import React from 'react';
import { LectureDocument } from '../types';
import { UniversalIngestionPortal } from '../components/library/UniversalIngestionPortal';
import { LectureCard } from '../components/library/LectureCard';
import { HardDrive, FolderOpen } from 'lucide-react';

interface LibraryIngestionProps {
  documents: LectureDocument[];
  activeDocumentId: string | null;
  isPlaying: boolean;
  onSelectDocument: (doc: LectureDocument, startChapterIndex?: number) => void;
  onPlayToggle: (doc: LectureDocument) => void;
  onDocumentAdded: (doc: LectureDocument, startChapterIndex?: number) => void;
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
  const totalDurationMin = documents.reduce((acc, d) => acc + d.durationMinutes, 0);

  return (
    <div className="flex-1 flex flex-col p-4 pb-12 space-y-4 overflow-y-auto overscroll-contain">
      {/* Top Storage Status Bar */}
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

      {/* Single Unified Ingestion Portal: PDF, Google Docs, OneDrive, Uploads & OCR Scans */}
      <UniversalIngestionPortal onDocumentAdded={onDocumentAdded} />

      {/* Cached Lecture Queue List */}
      <div className="space-y-2.5 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>Cached Audio Lectures</span>
          </h3>
        </div>

        {documents.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              No lectures uploaded yet. Use the portal above to ingest PDF, Google Docs, OneDrive, or book photos.
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
    </div>
  );
};
