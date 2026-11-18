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
    if (!configured) {
      setError('ต้องตั้งค่า GOOGLE_* ใน Environment Variables บน Vercel ของโปรเจกต์นี้ก่อนจึงจะอัปโหลดได้');
      return;
    }
    if (!uploader) {
      setError('กรุณาเลือกชื่อ Dev ผู้แนบไฟล์ก่อน');
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
      {/* Title Header matching Requirement Tracker */}
      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
        <span className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 text-white flex items-center justify-center">
          <HardDrive className="w-4 h-4" aria-hidden />
        </span>
        ไฟล์แนบจาก Dev (เก็บใน Google Drive)
        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
          {files.length} ไฟล์
        </span>
      </h4>

      {/* Files List */}
      {files.length > 0 && (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
          {files.map((f) => {
            const { icon: Icon, tone } = iconFor(f);
            return (
              <li key={f.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors">
                <span className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${tone}`}>
                  <Icon className="w-5 h-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <a
                    href={f.web_view_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm font-semibold text-[#0C2553] hover:text-[#0086FF] truncate"
                    title={f.file_name}
                  >
                    {f.file_name}
                  </a>
                  <div className="text-xs text-slate-500">
                    {[
                      formatSize(f.file_size),
                      f.uploaded_by && `โดย ${f.uploaded_by}`,
                      formatDateTime(f.created_at),
                      f.source_system && `(${f.source_system})`,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </div>
                </div>
                <a
                  href={f.web_view_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg text-[#0086FF] hover:bg-blue-50"
                  title="เปิดใน Google Drive"
                  aria-label={`เปิด ${f.file_name} ใน Google Drive`}
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`ลบลิงก์ไฟล์ "${f.file_name}" ออกจาก Issue นี้?\n(ตัวไฟล์ยังอยู่ใน Google Drive)`)) {
                      void onDelete(f.id).catch((e) => setError(e instanceof Error ? e.message : String(e)));
                    }
                  }}
                  className="p-2 rounded-lg text-red-500 hover:bg-red-50"
                  title="ลบลิงก์ไฟล์"
                  aria-label={`ลบ ${f.file_name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Compact Upload Box exactly matching Image 2 */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void handleFiles(e.dataTransfer.files);
        }}
        className={`rounded-xl border-2 border-dashed p-4 transition-colors ${
          dragOver ? 'border-[#0086FF] bg-blue-50/50' : 'border-slate-300 bg-slate-50/60'
        }`}
      >
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
            แนบโดย
            <select
              value={uploader}
              onChange={(e) => setUploader(e.target.value)}
              className="px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg outline-none bg-white font-semibold text-slate-800"
              aria-label="ผู้แนบไฟล์"
            >
              <option value="">-- เลือก Dev --</option>
              {uploaders.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && void handleFiles(e.target.files)}
          />
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={() => {
              if (!configured) {
                setError('ยังไม่ได้ตั้งค่า GOOGLE_* ใน Environment Variables ของ Vercel (โปรเจกต์ issue-log-hq) จึงยังอัปโหลดไม่ได้');
                return;
              }
              if (!uploader) {
                setError('กรุณาเลือกชื่อ Dev ในช่อง "แนบโดย" ก่อนเลือกไฟล์');
                return;
              }
              inputRef.current?.click();
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#044492] hover:bg-[#0C2553] text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <CloudUpload className="w-4 h-4" aria-hidden />}
            {busy ? 'กำลังอัปโหลด...' : 'เลือกไฟล์เพื่ออัปโหลด'}
          </button>
          <span className="text-xs text-slate-500">
            หรือลากไฟล์มาวางที่นี่ (ไฟล์โปรแกรม/สคริปต์ เช่น .exe จะถูกบีบเป็น .zip ให้อัตโนมัติ)
            {status?.maxBytes ? ` (ไฟล์ละไม่เกิน ${Math.round(status.maxBytes / 1024 / 1024)} MB)` : ' (ไฟล์ละไม่เกิน 100 MB)'}
          </span>
        </div>

        {busy && (
          <div className="mt-3">
            <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
              <span className="truncate pr-2">{busy.name}</span>
              <span>{busy.percent}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all"
                style={{ width: `${busy.percent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {notice && (
        <p className="text-xs font-medium text-sky-800 bg-sky-50 border border-sky-200 rounded-lg px-3 py-2">
          {notice}
        </p>
      )}

      {error && (
        <p role="alert" className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          ⚠️ {error}
        </p>
      )}
    </div>
  );
}
