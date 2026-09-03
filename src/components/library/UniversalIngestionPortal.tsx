import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Camera,
  Cloud,
  Link,
  Loader2,
  Check,
  Play,
  Clock,
  Layers,
  Sparkles,
  ArrowRight,
  FolderOpen
} from 'lucide-react';
import { extractDocumentText, IngestionInput } from '../../services/parsers/documentParser';
import { db } from '../../db/database';
import { LectureDocument, LectureSegment } from '../../types';

interface UniversalIngestionPortalProps {
  onDocumentAdded: (doc: LectureDocument, startChapterIndex?: number) => void;
}

type PortalMode = 'files-ocr' | 'google-doc' | 'onedrive' | 'paste';

export const UniversalIngestionPortal: React.FC<UniversalIngestionPortalProps> = ({
  onDocumentAdded,
}) => {
  const [activeMode, setActiveMode] = useState<PortalMode>('files-ocr');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);

  // Cloud/Paste Form States
  const [docTitle, setDocTitle] = useState('');
  const [cloudUrl, setCloudUrl] = useState('');
  const [pasteContent, setPasteContent] = useState('');

  // Post-parsing Chapter & Start Point selection state
  const [parsedResult, setParsedResult] = useState<{
    document: Omit<LectureDocument, 'id'>;
    segments: LectureSegment[];
    skippedSectionsCount: number;
  } | null>(null);

  const [selectedStartChapter, setSelectedStartChapter] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const handleProcessInput = async (input: IngestionInput | File) => {
    setIsProcessing(true);
    setProgressPercent(10);
    setProgressMsg('Analyzing content structure...');

    try {
      const result = await extractDocumentText(input, undefined, (p, msg) => {
        setProgressPercent(p);
        setProgressMsg(msg);
      });

      setParsedResult(result);
      setSelectedStartChapter(0);
      setIsProcessing(false);
      setProgressMsg('');
    } catch (err: any) {
      console.error('Ingestion error:', err);
      alert(`Error reading content: ${err.message || 'Unsupported format'}`);
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    handleProcessInput(files[0]);
  };

  const handleCloudSubmit = () => {
    if (!pasteContent.trim()) {
      alert('Please enter or paste document text or shared document outline.');
      return;
    }

    const title =
      docTitle.trim() ||
      (activeMode === 'google-doc'
        ? 'Google Docs Lecture'
        : activeMode === 'onedrive'
        ? 'OneDrive Lecture'
        : 'Pasted Reading');

    handleProcessInput({
      rawTextContent: pasteContent,
      customTitle: title,
      sourceType: activeMode === 'files-ocr' ? 'file' : activeMode,
    });
  };

  const handleSaveAndLaunch = async () => {
    if (!parsedResult) return;

    const newDoc: LectureDocument = {
      ...parsedResult.document,
      id: `doc-${Date.now()}`,
    };

    await db.documents.add(newDoc);
    onDocumentAdded(newDoc, selectedStartChapter);

    // Reset portal state
    setParsedResult(null);
    setPasteContent('');
    setDocTitle('');
    setCloudUrl('');
  };

  return (
    <div className="w-full rounded-3xl bg-[#0E1426]/90 border border-cyan-400/30 shadow-2xl p-5 flex flex-col space-y-4 backdrop-blur-xl">
      {/* Portal Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-400/40 text-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.25)]">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Universal Ingestion Portal</h3>
            <p className="text-[10px] text-slate-400 font-mono">
              PDF • Google Docs • OneDrive • Scans & OCR • Word
            </p>
          </div>
        </div>
      </div>

      {/* Hidden File Inputs - All Formats Allowed */}
      <input
        ref={fileInputRef}
        type="file"
        accept="*/*"
        className="hidden"
        onChange={(e) => handleFileUpload(e.target.files)}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFileUpload(e.target.files)}
      />

      {/* State A: Loading / Processing Progress */}
      {isProcessing && (
        <div className="py-8 flex flex-col items-center justify-center space-y-3 text-center">
          <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
          <div>
            <p className="text-sm font-bold text-slate-100">{progressMsg}</p>
            <p className="text-xs text-cyan-400 font-mono mt-0.5">
              Recognizing chapter structure & sanitizing noise...
            </p>
          </div>
          <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-400 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* State B: Chapter Recognition & Start Point Selector */}
      {!isProcessing && parsedResult && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-400/40 space-y-1">
            <span className="text-[10px] font-mono text-cyan-300 uppercase tracking-wider font-bold">
              CONTENT RECOGNIZED • {parsedResult.segments.length} CHAPTERS
            </span>
            <h4 className="text-sm font-bold text-slate-100 line-clamp-1">
              {parsedResult.document.title}
            </h4>
            <p className="text-[11px] text-slate-400 font-mono">
              Total Duration: ~{parsedResult.document.durationMinutes} min • Choose where to begin reading:
            </p>
          </div>

          {/* Chapter Start Point Radio List */}
          <div className="max-h-[190px] overflow-y-auto overscroll-contain space-y-2 pr-1">
            {parsedResult.segments.map((seg, idx) => {
              const isSelected = selectedStartChapter === idx;
              const durationMin = Math.max(1, Math.round(seg.estimatedSeconds / 60));

              return (
                <div
                  key={seg.id}
                  onClick={() => setSelectedStartChapter(idx)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-cyan-950 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.2)]'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-400 text-obsidian-950'
                          : 'border-slate-600'
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-obsidian-950" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                        <span>Ch {idx + 1}:</span>
                        <span className="truncate max-w-[170px]">{seg.title}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono">~{durationMin} min audio</p>
                    </div>
                  </div>

                  {idx === 0 && (
                    <span className="text-[10px] font-mono text-slate-500">Beginning</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action Triggers */}
          <div className="flex items-center space-x-2 pt-1">
            <button
              onClick={() => setParsedResult(null)}
              className="flex-1 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAndLaunch}
              className="flex-[2] py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-obsidian-950 font-bold text-xs flex items-center justify-center space-x-1.5 shadow-[0_0_18px_rgba(34,211,238,0.5)] transition-all"
            >
              <Play className="w-4 h-4 fill-current ml-0.5" />
              <span>Start from Ch {selectedStartChapter + 1}</span>
            </button>
          </div>
        </div>
      )}

      {/* State C: Normal Ingestion Portal Mode Switcher */}
      {!isProcessing && !parsedResult && (
        <div className="space-y-3">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-slate-900/90 border border-white/5 text-[11px] font-mono">
            <button
              onClick={() => setActiveMode('files-ocr')}
              className={`py-1.5 rounded-xl transition-all font-semibold ${
                activeMode === 'files-ocr'
                  ? 'bg-cyan-400 text-obsidian-950 shadow-[0_0_10px_rgba(34,211,238,0.4)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Upload
            </button>
            <button
              onClick={() => setActiveMode('google-doc')}
              className={`py-1.5 rounded-xl transition-all font-semibold ${
                activeMode === 'google-doc'
                  ? 'bg-cyan-400 text-obsidian-950 shadow-[0_0_10px_rgba(34,211,238,0.4)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Google
            </button>
            <button
              onClick={() => setActiveMode('onedrive')}
              className={`py-1.5 rounded-xl transition-all font-semibold ${
                activeMode === 'onedrive'
                  ? 'bg-cyan-400 text-obsidian-950 shadow-[0_0_10px_rgba(34,211,238,0.4)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              OneDrive
            </button>
            <button
              onClick={() => setActiveMode('paste')}
              className={`py-1.5 rounded-xl transition-all font-semibold ${
                activeMode === 'paste'
                  ? 'bg-cyan-400 text-obsidian-950 shadow-[0_0_10px_rgba(34,211,238,0.4)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Paste
            </button>
          </div>

          {/* Mode 1: File Dropzone & Camera OCR Scan */}
          {activeMode === 'files-ocr' && (
            <div className="space-y-2">
              <label
                htmlFor="universal-file-input"
                className="w-full p-5 rounded-2xl border-2 border-dashed border-slate-700/80 hover:border-cyan-400/60 bg-[#0A0F1D]/60 hover:bg-[#0A0F1D]/90 transition-all cursor-pointer flex flex-col items-center justify-center text-center group active:scale-[0.99] touch-manipulation select-none"
              >
                <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 mb-2 group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-100">
                  Select Document or Photo Scan
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Tap to open phone's file manager (PDF, Word, PPTX, Images)
                </p>
              </label>

              {/* Instant Camera Scan Button for OCR */}
              <label
                htmlFor="universal-camera-input"
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-700 hover:border-amber-400 text-slate-300 hover:text-amber-300 text-xs font-mono flex items-center justify-center space-x-2 transition-colors cursor-pointer active:scale-[0.99] touch-manipulation select-none"
              >
                <Camera className="w-4 h-4 text-amber-400" />
                <span>Take Photo / OCR Scan Book Page</span>
              </label>
            </div>
          )}

          {/* Mode 2: Google Docs / Drive Sync */}
          {activeMode === 'google-doc' && (
            <div className="space-y-2.5">
              <input
                type="text"
                placeholder="Lecture Title (e.g. Bio 101 Notes)"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-cyan-400 font-sora"
              />
              <textarea
                rows={3}
                placeholder="Paste shared Google Doc text or lecture outline..."
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-cyan-400 font-sora resize-none"
              />
              <button
                onClick={handleCloudSubmit}
                className="w-full py-2.5 rounded-xl bg-cyan-400 text-obsidian-950 font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-[0_0_12px_rgba(34,211,238,0.3)]"
              >
                <Cloud className="w-4 h-4" />
                <span>Import from Google Docs</span>
              </button>
            </div>
          )}

          {/* Mode 3: Microsoft OneDrive / SharePoint */}
          {activeMode === 'onedrive' && (
            <div className="space-y-2.5">
              <input
                type="text"
                placeholder="Document Title (e.g. ECON 201 Chapter 4)"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-cyan-400 font-sora"
              />
              <textarea
                rows={3}
                placeholder="Paste OneDrive or SharePoint shared reading text..."
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-cyan-400 font-sora resize-none"
              />
              <button
                onClick={handleCloudSubmit}
                className="w-full py-2.5 rounded-xl bg-cyan-400 text-obsidian-950 font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-[0_0_12px_rgba(34,211,238,0.3)]"
              >
                <Cloud className="w-4 h-4" />
                <span>Import from OneDrive</span>
              </button>
            </div>
          )}

          {/* Mode 4: Paste Outline / Web Article */}
          {activeMode === 'paste' && (
            <div className="space-y-2.5">
              <input
                type="text"
                placeholder="Article or Reading Title"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-cyan-400 font-sora"
              />
              <textarea
                rows={3}
                placeholder="Paste web article, Notion note, or syllabus..."
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-cyan-400 font-sora resize-none"
              />
              <button
                onClick={handleCloudSubmit}
                className="w-full py-2.5 rounded-xl bg-cyan-400 text-obsidian-950 font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-[0_0_12px_rgba(34,211,238,0.3)]"
              >
                <FileText className="w-4 h-4" />
                <span>Generate Audio Chapters</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Native Mobile / Desktop File Manager Input */}
      <input
        id="universal-file-input"
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.pptx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,text/markdown,image/*"
        onChange={(e) => {
          handleFileUpload(e.target.files);
          e.target.value = '';
        }}
        className="sr-only"
      />

      {/* Native Camera Capture Input for Book Page Photo OCR */}
      <input
        id="universal-camera-input"
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          handleFileUpload(e.target.files);
          e.target.value = '';
        }}
        className="sr-only"
      />
    </div>
  );
};
