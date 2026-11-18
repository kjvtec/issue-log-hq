'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  CloudUpload,
  ExternalLink,
  File as FileIcon,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  HardDrive,
  Loader2,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import { zipSync } from 'fflate';
import type { IssueFile, NewFile } from '@/types';
import { fetchDriveStatus, uploadToDrive, type DriveStatus } from '@/lib/driveClient';

interface DriveFilesPanelProps {
  files: IssueFile[];
  uploaders: string[];
  defaultUploader: string;
  issueLogId?: string;
  sourceSystem?: string;
  onAdd: (file: NewFile) => Promise<void>;
  onDelete: (fileId: string) => Promise<void>;
}

function iconFor(file: IssueFile): { icon: LucideIcon; tone: string } {
  const name = file.file_name.toLowerCase();
  const mime = file.mime_type || '';
  if (mime.startsWith('image/')) return { icon: FileImage, tone: 'bg-violet-100 text-violet-700' };
  if (/\.(xlsx?|csv)$/.test(name)) return { icon: FileSpreadsheet, tone: 'bg-emerald-100 text-emerald-700' };
  if (/\.(zip|rar|7z|tar|gz)$/.test(name)) return { icon: FileArchive, tone: 'bg-amber-100 text-amber-700' };
  if (/\.(pdf|docx?|txt|md|pptx?)$/.test(name)) return { icon: FileText, tone: 'bg-sky-100 text-sky-700' };
  return { icon: FileIcon, tone: 'bg-slate-100 text-slate-600' };
}

const ZIP_REQUIRED = new Set(['exe', 'bat', 'cmd', 'com', 'msi', 'scr', 'vbs', 'ps1', 'sh', 'jar', 'js', 'dll', 'apk']);

/** Program/script files are not accepted as-is: wrap them in a .zip automatically. */
async function zipIfNeeded(file: File): Promise<{ file: File; zipped: boolean }> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (!ZIP_REQUIRED.has(ext)) return { file, zipped: false };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const zipped = zipSync({ [file.name]: bytes }, { level: 6 });
  return {
    file: new File([zipped.buffer as ArrayBuffer], `${file.name}.zip`, { type: 'application/zip' }),
    zipped: true,
  };
}

function formatSize(bytes: number): string {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDateTime(iso?: string): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

export default function DriveFilesPanel({
  files,
  uploaders,
  defaultUploader,
  issueLogId,
  sourceSystem = 'Issue Tracker',
  onAdd,
  onDelete,
}: DriveFilesPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<DriveStatus | null>(null);
  const [uploader, setUploader] = useState(defaultUploader);
  const [busy, setBusy] = useState<{ name: string; percent: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    let alive = true;
    void fetchDriveStatus().then((s) => alive && setStatus(s));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!uploader && defaultUploader) setUploader(defaultUploader);
  }, [defaultUploader, uploader]);

  const configured = status?.configured === true;

  const handleFiles = async (list: FileList | File[]) => {
    const picked = Array.from(list);
    if (picked.length === 0) return;
    if (!uploader) {
      setError('กรุณาเลือกชื่อผู้แนบไฟล์ก่อน');
      return;
    }
    setError(null);
    setNotice(null);
    for (const original of picked) {
      let file = original;
      try {
        setBusy({ name: original.name, percent: 0 });
        const prepared = await zipIfNeeded(original);
        file = prepared.file;
        if (prepared.zipped) setNotice(`แปลง ${original.name} เป็น ${file.name} ให้อัตโนมัติ`);
        
        // Pass sourceSystem indicator
        const uploaded = await uploadToDrive(
          file,
          (percent) => setBusy({ name: file.name, percent }),
          sourceSystem
        );
        await onAdd({
          file_name: uploaded.name,
          file_size: uploaded.size,
          mime_type: uploaded.mimeType,
          drive_file_id: uploaded.id,
          web_view_link: uploaded.webViewLink,
          uploaded_by: uploader,
          source_system: sourceSystem,
        });
      } catch (e) {
        setError(`${file.name}: ${e instanceof Error ? e.message : String(e)}`);
        break;
      }
    }
    setBusy(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
          <span className="h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center shadow-xs">
            <HardDrive className="w-4 h-4" aria-hidden />
          </span>
          <span>ไฟล์แนบเอกสาร / หลักฐาน (เก็บใน Google Drive)</span>
          <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full px-2 py-0.5">
            {files.length} ไฟล์
          </span>
        </h4>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
          ระบบ: {sourceSystem}
        </span>
      </div>

      {files.length > 0 && (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
          {files.map((f) => {
            const { icon: Icon, tone } = iconFor(f);
            return (
              <li key={f.id} className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-slate-50/70 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${tone}`}>
                    <Icon className="w-4 h-4" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <a
                      href={f.web_view_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-slate-800 hover:text-indigo-600 hover:underline truncate block text-xs sm:text-sm"
                      title={f.file_name}
                    >
                      {f.file_name}
                    </a>
                    <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2 mt-0.5">
                      <span>{formatSize(f.file_size)}</span>
                      <span>•</span>
                      <span>แนบโดย {f.uploaded_by || 'ไม่ระบุ'}</span>
                      {f.created_at && (
                        <>
                          <span>•</span>
                          <span>{formatDateTime(f.created_at)}</span>
                        </>
                      )}
                      {f.source_system && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                          {f.source_system}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={f.web_view_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                    title="เปิดดูไฟล์ใน Google Drive"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!confirm(`ต้องการลบไฟล์ "${f.file_name}" ใช่หรือไม่?`)) return;
                      await onDelete(f.id);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="ลบรายการไฟล์นี้"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Upload area */}
      <div className="p-3.5 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/30 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <label className="font-bold text-slate-700">ผู้แนบไฟล์:</label>
            <input
              type="text"
              value={uploader}
              onChange={(e) => setUploader(e.target.value)}
              placeholder="ระบุชื่อผู้แนบ"
              className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white font-semibold outline-none focus:ring-1 focus:ring-indigo-500 w-36"
            />
            {uploaders.length > 0 && (
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) setUploader(e.target.value);
                }}
                className="px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white text-slate-600 outline-none"
              >
                <option value="">เลือกด่วน...</option>
                {uploaders.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            )}
          </div>
          <span className="text-[11px] text-slate-400">
            {configured
              ? `ความจุสูงสุด ${Math.round((status?.maxBytes || 0) / 1024 / 1024)} MB / ไฟล์`
              : 'ต้องตั้งค่า GOOGLE_* บนระบบก่อนจึงจะอัปโหลดได้'}
          </span>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (configured && !busy) void handleFiles(e.dataTransfer.files);
          }}
          onClick={() => {
            if (configured && !busy) inputRef.current?.click();
          }}
          className={`rounded-xl border-2 border-dashed p-4 text-center cursor-pointer transition-all ${
            !configured
              ? 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-60'
              : dragOver
                ? 'border-indigo-500 bg-indigo-50/80 scale-[1.01]'
                : 'border-indigo-300/80 bg-white hover:border-indigo-500 hover:bg-indigo-50/40'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && void handleFiles(e.target.files)}
            disabled={!configured || !!busy}
          />

          {busy ? (
            <div className="space-y-2 py-1">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-indigo-700">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                <span>กำลังอัปโหลด {busy.name} ({busy.percent}%)</span>
              </div>
              <div className="w-full max-w-xs mx-auto h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-150"
                  style={{ width: `${busy.percent}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <CloudUpload className="w-6 h-6 text-indigo-500 mx-auto" />
              <div className="text-xs font-bold text-slate-700">
                คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่
              </div>
              <p className="text-[11px] text-slate-400">
                รองรับ PDF, Excel, Word, ภาพ, Zip ฯลฯ (ไฟล์โปรแกรม .exe/.bat จะถูก Zip อัตโนมัติ)
              </p>
            </div>
          )}
        </div>

        {notice && (
          <p className="text-xs font-medium text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
            ℹ️ {notice}
          </p>
        )}
        {error && (
          <p className="text-xs font-medium text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200">
            ⚠️ {error}
          </p>
        )}
      </div>
    </div>
  );
}
