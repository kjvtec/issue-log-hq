'use client';

import React, { useState } from 'react';
import { X, Edit, Trash2, Calendar, User, CheckCircle2, AlertTriangle, Layers, Clock, ExternalLink } from 'lucide-react';
import { Issue, StatusType } from '@/types';
import LightboxModal from './LightboxModal';

interface IssueDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  issue: Issue | null;
  onEdit: (issue: Issue) => void;
  onDelete: (issueId: string) => Promise<void>;
  onStatusChange: (issueId: string, newStatus: StatusType) => Promise<void>;
}

export default function IssueDetailModal({
  isOpen,
  onClose,
  issue,
  onEdit,
  onDelete,
  onStatusChange,
}: IssueDetailModalProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

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

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-base font-bold text-white bg-indigo-600 px-3 py-1 rounded-lg shadow-sm">
                {issue.log_id}
              </span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${getPriorityBadge(issue.priority)}`}>
                {issue.priority}
              </span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${getStatusBadge(issue.status)}`}>
                {issue.status}
              </span>
              <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                {issue.module}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onEdit(issue)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg transition-colors shadow-sm"
              >
                <Edit className="w-3.5 h-3.5 text-indigo-600" />
                แก้ไข
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

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Meta info row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
              <div>
                <span className="text-slate-400 block mb-1">ผู้แจ้ง (Raise By):</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
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
                  {issue.closed_by || '-'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Closed Version:</span>
                <span className="font-semibold text-slate-800">
                  {issue.closed_version || '-'}
                </span>
              </div>
            </div>

            {/* Details Section */}
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                รายละเอียดปัญหา (Details)
              </h3>
              <div className="p-4 rounded-xl bg-slate-50/50 border border-slate-200 text-sm leading-relaxed text-slate-800 whitespace-pre-wrap font-sans">
                {issue.details}
              </div>
            </div>

            {/* Images Gallery */}
            {issue.images && issue.images.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                  <span>รูปภาพหลักฐาน ({issue.images.length} รูป)</span>
                  <span className="text-[11px] text-indigo-600 font-normal">คลิกรูปเพื่อดูขนาดใหญ่</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {issue.images.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleOpenLightbox(idx)}
                      className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-slate-100 aspect-video flex items-center justify-center hover:border-indigo-400 transition-all shadow-sm"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.file_url}
                        alt={img.file_name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <ExternalLink className="w-5 h-5 drop-shadow" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resolution Note */}
            {issue.resolution && (
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-sm space-y-1">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                  แนวทางการแก้ไข (Resolution)
                </span>
                <p className="text-emerald-900 whitespace-pre-wrap">{issue.resolution}</p>
              </div>
            )}

            {/* Remark */}
            {issue.remark && (
              <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200 text-xs text-amber-900">
                <span className="font-bold">หมายเหตุ (Remark):</span> {issue.remark}
              </div>
            )}
          </div>

          {/* Quick status bar footer */}
          <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">เปลี่ยนสถานะด่วน:</span>
              <button
                disabled={isUpdatingStatus || issue.status === 'Open'}
                onClick={() => handleQuickStatus('Open')}
                className="px-2.5 py-1 text-xs font-medium rounded-md border border-yellow-300 bg-yellow-50 text-yellow-800 hover:bg-yellow-100 disabled:opacity-50 transition-colors"
              >
                Open
              </button>
              <button
                disabled={isUpdatingStatus || issue.status === 'In Progress'}
                onClick={() => handleQuickStatus('In Progress')}
                className="px-2.5 py-1 text-xs font-medium rounded-md border border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100 disabled:opacity-50 transition-colors"
              >
                In Progress
              </button>
              <button
                disabled={isUpdatingStatus || issue.status === 'Test'}
                onClick={() => handleQuickStatus('Test')}
                className="px-2.5 py-1 text-xs font-medium rounded-md border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50 transition-colors"
              >
                Ready for Test
              </button>
              <button
                disabled={isUpdatingStatus || issue.status === 'Closed'}
                onClick={() => handleQuickStatus('Closed')}
                className="px-2.5 py-1 text-xs font-medium rounded-md border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 transition-colors"
              >
                Close Issue
              </button>
            </div>

            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox for full size photo zoom */}
      {issue.images && (
        <LightboxModal
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          images={issue.images}
          currentIndex={activeImageIndex}
          onNavigate={setActiveImageIndex}
        />
      )}
    </>
  );
}
