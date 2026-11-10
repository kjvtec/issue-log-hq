'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Edit,
  Trash2,
  Calendar,
  User,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Clock,
  ExternalLink,
  Save,
  PlusCircle,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Issue, IssueImage, StatusType, TeamMember } from '@/types';
import LightboxModal from './LightboxModal';
import ImageUploader from './ImageUploader';

interface IssueDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  issue: Issue | null;
  onEdit: (issue: Issue) => void;
  onDelete: (issueId: string) => Promise<void>;
  onStatusChange: (issueId: string, newStatus: StatusType) => Promise<void>;
  onUpdateIssue: (issueId: string, updates: Partial<Issue>, images: IssueImage[]) => Promise<void>;
  teamMembers: TeamMember[];
}

export default function IssueDetailModal({
  isOpen,
  onClose,
  issue,
  onEdit,
  onDelete,
  onStatusChange,
  onUpdateIssue,
  teamMembers,
}: IssueDetailModalProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedPreviewIndex, setSelectedPreviewIndex] = useState(0);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Editable fields directly on this modal
  const [resolution, setResolution] = useState('');
  const [closedBy, setClosedBy] = useState('');
  const [closedVersion, setClosedVersion] = useState('');
  const [remark, setRemark] = useState('');
  const [images, setImages] = useState<IssueImage[]>([]);

  // Sync state when issue changes
  useEffect(() => {
    if (issue) {
      setResolution(issue.resolution || '');
      setClosedBy(issue.closed_by || '');
      setClosedVersion(issue.closed_version || '');
      setRemark(issue.remark || '');
      setImages(issue.images || []);
      setSelectedPreviewIndex(0);
      setSaveSuccess(false);
    }
  }, [issue]);

  if (!isOpen || !issue) return null;

  const handleOpenLightbox = (index: number) => {
    setActiveImageIndex(index);
    setLightboxOpen(true);
  };

  const handleQuickStatus = async (status: StatusType) => {
    setIsUpdatingStatus(true);
    try {
      await onStatusChange(issue.id, status);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Direct Inline Update Handler
  const handleSaveInline = async () => {
    setIsSaving(true);
    try {
      await onUpdateIssue(
        issue.id,
        {
          resolution,
          closed_by: closedBy,
          closed_version: closedVersion,
          remark,
        },
        images
      );
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update issue inline:', err);
      alert('บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSaving(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    if (priority.includes('High')) {
      return 'bg-red-50 text-red-700 border-red-200';
    }
    if (priority.includes('Medium')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Open':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'In Progress':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Test':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Closed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const currentPreviewImage = images[selectedPreviewIndex] || images[0];

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[94vh] flex flex-col overflow-hidden border border-slate-200">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/90 flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-base font-bold text-white bg-indigo-600 px-3.5 py-1 rounded-xl shadow-sm">
                {issue.log_id}
              </span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${getPriorityBadge(issue.priority)}`}>
                {issue.priority}
              </span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${getStatusBadge(issue.status)}`}>
                {issue.status}
              </span>
              <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-1 font-medium">
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                {issue.module}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onEdit(issue)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg transition-colors shadow-sm"
              >
                <Edit className="w-3.5 h-3.5 text-indigo-600" />
                แก้ไขทุกช่อง
              </button>
              <button
                onClick={() => {
                  if (confirm(`ยืนยันการลบรายการ ${issue.log_id} หรือไม่?`)) {
                    onDelete(issue.id);
                    onClose();
                  }
                }}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="ลบรายการนี้"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors ml-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Meta info row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
              <div>
                <span className="text-slate-400 block mb-1">ผู้แจ้ง (Raise By):</span>
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-500" />
                  {issue.raise_by}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">วันที่แจ้ง:</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  {issue.raise_date ? new Date(issue.raise_date).toLocaleDateString('th-TH') : '-'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">ผู้ปิดงาน (Closed By):</span>
                <span className="font-semibold text-slate-800">
                  {closedBy || issue.closed_by || '-'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Closed Version:</span>
                <span className="font-semibold text-slate-800">
                  {closedVersion || issue.closed_version || '-'}
                </span>
              </div>
            </div>

            {/* Details Section */}
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                รายละเอียดปัญหา (Details)
              </h3>
              <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 text-sm leading-relaxed text-slate-800 whitespace-pre-wrap font-sans">
                {issue.details}
              </div>
            </div>

            {/* LARGE IMAGE PREVIEW SECTION (รูปตัวอย่างขนาดใหญ่ คมชัด อ่านง่าย) */}
            {images.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <span>รูปภาพหลักฐาน ({images.length} รูป)</span>
                    <span className="text-xs font-normal text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                      รูปที่ {selectedPreviewIndex + 1} จาก {images.length}
                    </span>
                  </h3>
                  <button
                    onClick={() => handleOpenLightbox(selectedPreviewIndex)}
                    className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    <ZoomIn className="w-3.5 h-3.5" /> ขยายดูภาพเต็มจอ
                  </button>
                </div>

                {/* Big Image Viewer Container */}
                <div className="relative rounded-2xl border-2 border-slate-200 bg-slate-900/5 overflow-hidden flex flex-col items-center justify-center p-2 sm:p-4 group">
                  <div
                    onClick={() => handleOpenLightbox(selectedPreviewIndex)}
                    className="cursor-pointer max-h-[500px] w-full flex items-center justify-center overflow-hidden rounded-xl bg-slate-100"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentPreviewImage.file_url}
                      alt={currentPreviewImage.file_name}
                      className="max-h-[480px] w-auto max-w-full object-contain rounded-lg shadow-sm group-hover:scale-[1.01] transition-transform duration-200"
                    />
                  </div>

                  {/* Navigation Arrows for Big Viewer */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() =>
                          setSelectedPreviewIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
                        }
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white shadow-lg transition-transform hover:scale-110"
                        title="รูปก่อนหน้า"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() =>
                          setSelectedPreviewIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white shadow-lg transition-transform hover:scale-110"
                        title="รูปถัดไป"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  {/* Overlay Click Hint */}
                  <div
                    onClick={() => handleOpenLightbox(selectedPreviewIndex)}
                    className="mt-2 text-xs text-slate-500 flex items-center gap-1 cursor-pointer hover:text-indigo-600 font-medium"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> คลิกที่รูปเพื่อซูมขนาดใหญ่พิเศษ
                  </div>
                </div>

                {/* Multiple Images Thumbnail Strip */}
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2 pt-1">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedPreviewIndex(idx)}
                        className={`relative rounded-xl overflow-hidden border-2 flex-shrink-0 w-24 h-16 bg-slate-100 transition-all ${
                          selectedPreviewIndex === idx
                            ? 'border-indigo-600 ring-2 ring-indigo-300 scale-105'
                            : 'border-slate-200 opacity-70 hover:opacity-100'
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.file_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-0.5 right-1 text-[9px] bg-black/70 text-white px-1 rounded font-bold">
                          {idx + 1}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* INLINE UPDATE SECTION (อัปเดตข้อมูลและแนบรูปภาพเพิ่มได้ทันทีจากหน้านี้) */}
            <div className="rounded-2xl border-2 border-indigo-100 bg-gradient-to-b from-indigo-50/50 to-white p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      อัปเดตข้อมูล / บันทึกผลการแก้ไข (Inline Update)
                    </h3>
                    <p className="text-xs text-slate-500">
                      พิมพ์แนวทางแก้ไข แนบภาพหลักฐานเพิ่มเติม หรือปิดงานได้โดยตรงจากหน้านี้
                    </p>
                  </div>
                </div>

                {saveSuccess && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full animate-bounce">
                    <CheckCircle2 className="w-3.5 h-3.5" /> บันทึกสำเร็จแล้ว!
                  </span>
                )}
              </div>

              {/* Resolution Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Resolution (แนวทาง/ขั้นตอนการแก้ไขปัญหา หรือข้อความตอบกลับ):
                </label>
                <textarea
                  rows={3}
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="ระบุสิ่งที่แก้ไข เช่น แก้ไข Validation, Deploy Hotfix, ปรับปรุง Logic..."
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white leading-relaxed"
                />
              </div>

              {/* Add More Images (ImageUploader with Ctrl+V) */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                <ImageUploader
                  images={images}
                  onChange={setImages}
                  issueLogId={issue.log_id}
                />
              </div>

              {/* Closed details & Remark */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Closed By (ผู้ปิดงาน):
                  </label>
                  <select
                    value={closedBy}
                    onChange={(e) => setClosedBy(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl outline-none bg-white font-medium"
                  >
                    <option value="">-- ยังไม่ระบุ --</option>
                    {teamMembers.map((tm) => (
                      <option key={tm.id} value={tm.name}>
                        {tm.name} {tm.name === 'Kampon' ? '⭐ (Lead)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Closed Version:
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น v1.0.1, Hotfix-1"
                    value={closedVersion}
                    onChange={(e) => setClosedVersion(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Remark (หมายเหตุ):
                  </label>
                  <input
                    type="text"
                    placeholder="หมายเหตุเพิ่มเติม..."
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl outline-none bg-white"
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="flex items-center justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSaveInline}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-200 transition-all hover:scale-105 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'กำลังบันทึก...' : 'บันทึกการอัปเดต (Save Updates)'}
                </button>
              </div>
            </div>
          </div>

          {/* Quick status bar footer */}
          <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/90 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 font-bold">เปลี่ยนสถานะด่วน:</span>
              <button
                disabled={isUpdatingStatus || issue.status === 'Open'}
                onClick={() => handleQuickStatus('Open')}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-yellow-300 bg-yellow-50 text-yellow-800 hover:bg-yellow-100 disabled:opacity-50 transition-colors"
              >
                Open
              </button>
              <button
                disabled={isUpdatingStatus || issue.status === 'In Progress'}
                onClick={() => handleQuickStatus('In Progress')}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100 disabled:opacity-50 transition-colors"
              >
                In Progress
              </button>
              <button
                disabled={isUpdatingStatus || issue.status === 'Test'}
                onClick={() => handleQuickStatus('Test')}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50 transition-colors"
              >
                Ready for Test
              </button>
              <button
                disabled={isUpdatingStatus || issue.status === 'Closed'}
                onClick={() => {
                  if (!closedBy) setClosedBy('Kampon');
                  handleQuickStatus('Closed');
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 transition-colors"
              >
                Close Issue
              </button>
            </div>

            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 shadow-sm"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox for full size photo zoom */}
      {images.length > 0 && (
        <LightboxModal
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          images={images}
          currentIndex={activeImageIndex}
          onNavigate={setActiveImageIndex}
        />
      )}
    </>
  );
}
