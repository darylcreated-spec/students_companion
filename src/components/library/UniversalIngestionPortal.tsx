import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Camera,
  Cloud,
  Link,
  Headphones,
  Check,
  Play,
  Clock,
  Layers,
  Sparkles,
  ArrowRight,
  FolderOpen,
  Plus,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react';
import { extractDocumentText, IngestionInput } from '../../services/parsers/documentParser';
import { parseImageOcr } from '../../services/parsers/ocrParser';
import { db } from '../../db/database';
import { LectureDocument, LectureSegment } from '../../types';
import { HapticFeedback } from '../../services/device/deviceDetector';

interface UniversalIngestionPortalProps {
  onDocumentAdded: (doc: LectureDocument, startChapterIndex?: number) => void;
}

type PortalMode = 'files-ocr' | 'google-doc' | 'onedrive' | 'paste';

interface QueuedPage {
  id: string;
  file: File;
  previewUrl: string;
  pageNumber: number;
}

export const UniversalIngestionPortal: React.FC<UniversalIngestionPortalProps> = ({
  onDocumentAdded,
}) => {
  const [activeMode, setActiveMode] = useState<PortalMode>('files-ocr');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);

  // Multi-Page Batch Camera Scanner Queue
  const [pageQueue, setPageQueue] = useState<QueuedPage[]>([]);

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
      HapticFeedback.trigger('success');
    } catch (err: any) {
      console.error('Ingestion error:', err);
      alert(`Error reading content: ${err.message || 'Unsupported format'}`);
      setIsProcessing(false);
      setProgressMsg('');
      HapticFeedback.trigger('warning');
    }
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    handleProcessInput(files[0]);
  };

  // Add photo scan to batch queue
  const handleCameraSnap = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const previewUrl = URL.createObjectURL(file);
    HapticFeedback.trigger('light');

    setPageQueue((prev) => [
      ...prev,
      {
        id: `page-${Date.now()}-${prev.length + 1}`,
        file,
        previewUrl,
        pageNumber: prev.length + 1,
      },
    ]);
  };

  const handleRemoveQueuedPage = (id: string) => {
    HapticFeedback.trigger('light');
    setPageQueue((prev) => {
      const filtered = prev.filter((p) => p.id !== id);
      return filtered.map((p, i) => ({ ...p, pageNumber: i + 1 }));
    });
  };

  // Compile batch of scanned pages into one multi-chapter lecture
  const handleCompileBatchOcr = async () => {
    if (pageQueue.length === 0) return;

    setIsProcessing(true);
    setProgressPercent(10);
    setProgressMsg(`Starting OCR on ${pageQueue.length} pages...`);
    HapticFeedback.trigger('medium');

    try {
      const combinedTexts: string[] = [];
      for (let i = 0; i < pageQueue.length; i++) {
        const page = pageQueue[i];
        const pct = Math.round(10 + ((i + 1) / pageQueue.length) * 80);
        setProgressPercent(pct);
        setProgressMsg(`OCR scanning Page ${i + 1} of ${pageQueue.length}...`);

        const result = await parseImageOcr(page.file, (_, status) => {
          setProgressMsg(`Page ${i + 1}/${pageQueue.length}: ${status}`);
        });

        if (result.text.trim()) {
          combinedTexts.push(`## Chapter ${i + 1}: Page ${i + 1} Reading\n\n${result.text.trim()}`);
        }
      }

      if (combinedTexts.length === 0) {
        throw new Error('No legible text could be recognized from the captured pages.');
      }

      const mergedRawText = combinedTexts.join('\n\n---\n\n');
      const defaultTitle = `Textbook Scan (${pageQueue.length} Pages)`;

      await handleProcessInput({
        rawTextContent: mergedRawText,
        customTitle: defaultTitle,
        sourceType: 'image-ocr',
      });

      // Clear queue once built
      setPageQueue([]);
    } catch (err: any) {
      console.error('Batch OCR error:', err);
      alert(`Error compiling pages: ${err.message || 'Unknown error'}`);
      setIsProcessing(false);
      setProgressMsg('');
    }
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
    <div className="w-full rounded-3xl bg-[#0E1426]/90 border border-cyan-400/30 shadow-2xl p-4 flex flex-col space-y-3.5 backdrop-blur-xl">
      {/* Portal Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-xl bg-cyan-950/80 border border-cyan-400/40 text-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.25)]">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
              Universal Ingestion Portal
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">
              PDF • Batch Camera OCR • Word • Google Docs • PPTX
            </p>
          </div>
        </div>
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        id="universal-file-input"
        type="file"
        accept="*/*"
        className="hidden"
        onChange={(e) => handleFileUpload(e.target.files)}
      />
      <input
        ref={cameraInputRef}
        id="universal-camera-input"
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleCameraSnap(e.target.files)}
      />

      {/* State A: Loading / Processing Progress */}
      {isProcessing && (
        <div className="py-8 flex flex-col items-center justify-center space-y-4 text-center">
          {/* Branded Themed Hero Icon Container */}
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-[#0A0F1D] border border-cyan-400/40 flex items-center justify-center shadow-[0_0_25px_rgba(34,211,238,0.35)] animate-pulse">
              <Headphones className="w-8 h-8 text-cyan-400" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-400"></span>
            </span>
          </div>

          <div>
            <p className="text-sm font-bold text-slate-100">{progressMsg}</p>
            <p className="text-xs text-cyan-400 font-mono mt-0.5">
              Structuring audio chapters & sanitizing formulas...
            </p>
          </div>

          <div className="w-52 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-amber-400 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* State B: Chapter Recognition & Start Point Selector */}
      {!isProcessing && parsedResult && (
        <div className="space-y-3.5 animate-in fade-in slide-in-from-bottom-2">
          <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-400/40 space-y-1">
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
              className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAndLaunch}
              className="flex-[2] py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-obsidian-950 font-bold text-xs flex items-center justify-center space-x-1.5 shadow-[0_0_18px_rgba(34,211,238,0.5)] transition-all"
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

          {/* Mode 1: File Dropzone & Multi-Page Camera Scanner */}
          {activeMode === 'files-ocr' && (
            <div className="space-y-2.5">
              {/* If Multi-Page Camera Queue Has Items */}
              {pageQueue.length > 0 ? (
                <div className="p-3 rounded-2xl bg-slate-900/90 border border-amber-400/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 font-mono flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5" />
                      <span>{pageQueue.length} Pages Captured</span>
                    </span>
                    <button
                      onClick={() => setPageQueue([])}
                      className="text-[10px] font-mono text-slate-400 hover:text-rose-400 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>

                  {/* Scanned Page Thumbnails Strip */}
                  <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
                    {pageQueue.map((item) => (
                      <div
                        key={item.id}
                        className="relative w-16 h-20 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-black group"
                      >
                        <img
                          src={item.previewUrl}
                          alt={`Page ${item.pageNumber}`}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-1 left-1 px-1 py-0.5 rounded bg-black/80 text-[9px] font-mono text-cyan-300">
                          P.{item.pageNumber}
                        </span>
                        <button
                          onClick={() => handleRemoveQueuedPage(item.id)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-rose-500 text-white text-[9px] opacity-90 hover:opacity-100"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}

                    {/* Snap Next Page Card */}
                    <button
                      onClick={() => cameraInputRef.current?.click()}
                      className="w-16 h-20 rounded-xl border-2 border-dashed border-cyan-400/50 hover:border-cyan-400 flex flex-col items-center justify-center text-cyan-400 text-center shrink-0 hover:bg-cyan-950/20 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="text-[9px] font-mono mt-1">+ Page</span>
                    </button>
                  </div>

                  {/* Batch Actions */}
                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      onClick={() => cameraInputRef.current?.click()}
                      className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-semibold flex items-center justify-center gap-1.5"
                    >
                      <Camera className="w-3.5 h-3.5 text-amber-400" />
                      <span>Snap Next Page</span>
                    </button>

                    <button
                      onClick={handleCompileBatchOcr}
                      className="flex-[1.4] py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-amber-400 text-obsidian-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(34,211,238,0.4)] active:scale-95 transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Compile {pageQueue.length} Pages</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <label
                    htmlFor="universal-file-input"
                    className="w-full p-4 rounded-2xl border-2 border-dashed border-slate-700/80 hover:border-cyan-400/60 bg-[#0A0F1D]/60 hover:bg-[#0A0F1D]/90 transition-all cursor-pointer flex flex-col items-center justify-center text-center group active:scale-[0.99] touch-manipulation select-none"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 mb-1.5 group-hover:scale-105 transition-transform">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-100">
                      Select Document or Photo Scan
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      PDF, Word, PPTX, or Image files
                    </p>
                  </label>

                  {/* Camera Scan Button with Multi-Page capability */}
                  <label
                    htmlFor="universal-camera-input"
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-700 hover:border-amber-400 text-slate-300 hover:text-amber-300 text-xs font-mono flex items-center justify-center space-x-2 transition-colors cursor-pointer active:scale-[0.99] touch-manipulation select-none shadow-sm"
                  >
                    <Camera className="w-4 h-4 text-amber-400" />
                    <span>Take Photo / Multi-Page Scan Book</span>
                  </label>
                </>
              )}
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

          {/* Mode 3: OneDrive Sync */}
          {activeMode === 'onedrive' && (
            <div className="space-y-2.5">
              <input
                type="text"
                placeholder="Lecture Title (e.g. Chemistry Review)"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-cyan-400 font-sora"
              />
              <textarea
                rows={3}
                placeholder="Paste OneDrive shared document text or notes..."
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

          {/* Mode 4: Direct Paste */}
          {activeMode === 'paste' && (
            <div className="space-y-2.5">
              <input
                type="text"
                placeholder="Reading Title (e.g. History Reading Week 3)"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-cyan-400 font-sora"
              />
              <textarea
                rows={4}
                placeholder="Paste article, textbook excerpts, or reading notes here..."
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-cyan-400 font-sora resize-none"
              />
              <button
                onClick={handleCloudSubmit}
                className="w-full py-2.5 rounded-xl bg-cyan-400 text-obsidian-950 font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-[0_0_12px_rgba(34,211,238,0.3)]"
              >
                <ArrowRight className="w-4 h-4" />
                <span>Format & Generate Chapters</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
