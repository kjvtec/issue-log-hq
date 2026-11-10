'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, PlusCircle, Lock } from 'lucide-react';
import { Issue, IssueImage, PriorityType, StatusType, TeamMember, SystemModule } from '@/types';
import ImageUploader from './ImageUploader';

interface IssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (issueData: Partial<Issue>, images: IssueImage[]) => Promise<void>;
  initialData?: Issue | null;
  suggestedLogId?: string;
  modules: SystemModule[];
  teamMembers: TeamMember[];
  onAddModule?: (name: string) => Promise<void>;
  onAddTeamMember?: (name: string) => Promise<void>;
}

export default function IssueModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  suggestedLogId = 'ISSUE_1',
  modules,
  teamMembers,
  onAddModule,
  onAddTeamMember,
}: IssueModalProps) {
  const [logId, setLogId] = useState('');
  const [priority, setPriority] = useState<PriorityType>('2.Medium');
  const [type, setType] = useState('Issue');
  const [module, setModule] = useState('');
  const [details, setDetails] = useState('');
  const [raiseBy, setRaiseBy] = useState('');
  const [status, setStatus] = useState<StatusType>('Open');
  const [resolution, setResolution] = useState('');
  const [closedBy, setClosedBy] = useState('');
  const [closedVersion, setClosedVersion] = useState('');
  const [remark, setRemark] = useState('');
  const [images, setImages] = useState<IssueImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newModuleName, setNewModuleName] = useState('');
  const [showAddModule, setShowAddModule] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);

  useEffect(() => {
    if (initialData) {
      setLogId(initialData.log_id || '');
      setPriority((initialData.priority as PriorityType) || '2.Medium');
      setType(initialData.type || 'Issue');
      setModule(initialData.module || '');
      setDetails(initialData.details || '');
      setRaiseBy(initialData.raise_by || '');
      setStatus((initialData.status as StatusType) || 'Open');
      setResolution(initialData.resolution || '');
      setClosedBy(initialData.closed_by || '');
      setClosedVersion(initialData.closed_version || '');
      setRemark(initialData.remark || '');
      setImages(initialData.images || []);
    } else {
      setLogId(suggestedLogId);
      setPriority('2.Medium');
      setType('Issue');
      setModule(modules[0]?.name || 'Shop');
      setDetails('');
      setRaiseBy(teamMembers[0]?.name || 'Nat');
      setStatus('Open');
      setResolution('');
      setClosedBy('');
      setClosedVersion('');
      setRemark('');
      setImages([]);
    }
  }, [initialData, suggestedLogId, modules, teamMembers, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim()) {
      alert('กรุณากรอกรายละเอียดปัญหา (Details)');
      return;
    }
    if (!module) {
      alert('กรุณาเลือกโมดูล');
      return;
    }
    if (!raiseBy) {
      alert('กรุณาระบุชื่อผู้แจ้ง');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(
        {
          id: initialData?.id,
          log_id: logId,
          priority,
          type,
          module,
          details,
          raise_by: raiseBy,
          status,
          resolution,
          closed_by: closedBy,
          closed_version: closedVersion,
          remark,
        },
        images
      );
      onClose();
    } catch (err) {
      console.error('Save issue failed:', err);
      alert('บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateModule = async () => {
    if (!newModuleName.trim() || !onAddModule) return;
    await onAddModule(newModuleName.trim());
    setModule(newModuleName.trim());
    setNewModuleName('');
    setShowAddModule(false);
  };

  const handleCreateMember = async () => {
    if (!newMemberName.trim() || !onAddTeamMember) return;
    await onAddTeamMember(newMemberName.trim());
    setRaiseBy(newMemberName.trim());
    setNewMemberName('');
    setShowAddMember(false);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold bg-indigo-600 text-white px-2.5 py-1 rounded-md shadow-sm">
              {logId || 'NEW ISSUE'}
            </span>
            <h2 className="text-lg font-bold text-slate-800">
              {initialData ? 'แก้ไขรายการ Issue' : 'แจ้งปัญหาใหม่ (Create Issue Log)'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Log ID - Locked / Auto-generated by System */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  Log ID *
                </label>
                <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium border border-slate-200">
                  ระบบกำหนดอัตโนมัติ (ห้ามแก้)
                </span>
              </div>
              <input
                type="text"
                value={logId}
                readOnly
                disabled
                required
                className="w-full px-3 py-2 text-sm bg-slate-100/90 border border-slate-200 rounded-lg font-mono font-bold text-indigo-700 cursor-not-allowed select-none outline-none shadow-inner"
                title="รหัส Issue ID สร้างโดยระบบอัตโนมัติตามลำดับ ไม่สามารถแก้ไขได้"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Priority (ระดับความสำคัญ) *
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityType)}
                className={`w-full px-3 py-2 text-sm font-semibold rounded-lg border outline-none ${
                  priority === '1.High'
                    ? 'border-red-300 bg-red-50 text-red-700'
                    : priority === '2.Medium'
                    ? 'border-amber-300 bg-amber-50 text-amber-700'
                    : 'border-blue-300 bg-blue-50 text-blue-700'
                }`}
              >
                <option value="1.High">1. High (ด่วนมาก/สำคัญ)</option>
                <option value="2.Medium">2. Medium (ปานกลาง)</option>
                <option value="3.Low">3. Low (เล็กน้อย/ไม่รีบ)</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Status (สถานะ) *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusType)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-medium"
              >
                <option value="Open">Open (เปิดแจ้ง)</option>
                <option value="In Progress">In Progress (กำลังแก้ไข)</option>
                <option value="Test">Test (พร้อมทดสอบ)</option>
                <option value="Closed">Closed (ปิดงานแล้ว)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Module */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-600">
                  Module (ระบบย่อย) *
                </label>
                {onAddModule && (
                  <button
                    type="button"
                    onClick={() => setShowAddModule(!showAddModule)}
                    className="text-[11px] text-indigo-600 hover:underline flex items-center gap-0.5"
                  >
                    <PlusCircle className="w-3 h-3" /> เพิ่มใหม่
                  </button>
                )}
              </div>
              {showAddModule ? (
                <div className="flex gap-1">
                  <input
                    type="text"
                    placeholder="พิมพ์ชื่อ Module..."
                    value={newModuleName}
                    onChange={(e) => setNewModuleName(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 text-xs border border-indigo-300 rounded-lg outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCreateModule}
                    className="px-2.5 py-1 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    เพิ่ม
                  </button>
                </div>
              ) : (
                <select
                  value={module}
                  onChange={(e) => setModule(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                >
                  {modules.map((m) => (
                    <option key={m.id} value={m.name}>
                      {m.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Raise By */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-600">
                  Raise By (ผู้แจ้ง) *
                </label>
                {onAddTeamMember && (
                  <button
                    type="button"
                    onClick={() => setShowAddMember(!showAddMember)}
                    className="text-[11px] text-indigo-600 hover:underline flex items-center gap-0.5"
                  >
                    <PlusCircle className="w-3 h-3" /> เพิ่มคน
                  </button>
                )}
              </div>
              {showAddMember ? (
                <div className="flex gap-1">
                  <input
                    type="text"
                    placeholder="ชื่อผู้แจ้ง..."
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 text-xs border border-indigo-300 rounded-lg outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCreateMember}
                    className="px-2.5 py-1 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    เพิ่ม
                  </button>
                </div>
              ) : (
                <select
                  value={raiseBy}
                  onChange={(e) => setRaiseBy(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                >
                  {teamMembers.map((tm) => (
                    <option key={tm.id} value={tm.name}>
                      {tm.name} {tm.role ? `(${tm.role})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Type (ประเภท)
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              >
                <option value="Issue">Issue (ปัญหาการใช้งาน)</option>
                <option value="Bug">Bug (ข้อผิดพลาดของระบบ)</option>
                <option value="Enhancement">Enhancement (ขอเพิ่มฟีเจอร์)</option>
                <option value="Question">Question (ข้อสอบถาม)</option>
              </select>
            </div>
          </div>

          {/* Details */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Details (รายละเอียดปัญหา / อาการที่พบ) *
            </label>
            <textarea
              rows={4}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              required
              placeholder="อธิบายขั้นตอนที่ทำให้เกิดปัญหา หรือข้อความ Error ที่แสดง..."
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none leading-relaxed"
            />
          </div>

          {/* Image Uploader */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200">
            <ImageUploader
              images={images}
              onChange={setImages}
              issueLogId={logId}
            />
          </div>

          {/* Resolution & Closing Information (collapsible or displayed) */}
          <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              ข้อมูลการแก้ไข & การปิดงาน (Developer / Resolution Note)
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Resolution (แนวทาง/ขั้นตอนการแก้ไขปัญหา)
              </label>
              <textarea
                rows={2}
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="ระบุสิ่งที่แก้ไข เช่น ปรับแก้ API, แก้ไข Validation, แก้ไขหน้าบ้าน..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Closed By (ผู้ปิดงาน)
                </label>
                <select
                  value={closedBy}
                  onChange={(e) => setClosedBy(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none"
                >
                  <option value="">-- ยังไม่ปิดงาน --</option>
                  {teamMembers.map((tm) => (
                    <option key={tm.id} value={tm.name}>
                      {tm.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Closed Version (เวอร์ชันที่แก้)
                </label>
                <input
                  type="text"
                  placeholder="เช่น v1.2.0 หรือ Hotfix-1"
                  value={closedVersion}
                  onChange={(e) => setClosedVersion(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Remark (หมายเหตุเพิ่มเติม)
                </label>
                <input
                  type="text"
                  placeholder="หมายเหตุ..."
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none"
                />
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg font-medium transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-sm transition-all hover:shadow"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'กำลังบันทึก...' : initialData ? 'บันทึกการแก้ไข' : 'สร้าง Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
