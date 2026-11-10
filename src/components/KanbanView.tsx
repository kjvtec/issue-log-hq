'use client';

import React from 'react';
import { Issue, StatusType } from '@/types';
import { ImageIcon, User, ChevronRight, Layers } from 'lucide-react';

interface KanbanViewProps {
  issues: Issue[];
  onSelectIssue: (issue: Issue) => void;
  onStatusChange: (issueId: string, newStatus: StatusType) => Promise<void>;
}

const COLUMNS: { id: StatusType; label: string; color: string; badge: string }[] = [
  { id: 'Open', label: 'Open', color: 'border-yellow-300 bg-yellow-50/50', badge: 'bg-yellow-100 text-yellow-800' },
  { id: 'In Progress', label: 'In Progress', color: 'border-purple-300 bg-purple-50/50', badge: 'bg-purple-100 text-purple-800' },
  { id: 'Test', label: 'Ready for Test', color: 'border-blue-300 bg-blue-50/50', badge: 'bg-blue-100 text-blue-800' },
  { id: 'Closed', label: 'Closed', color: 'border-emerald-300 bg-emerald-50/50', badge: 'bg-emerald-100 text-emerald-800' },
];

export default function KanbanView({
  issues,
  onSelectIssue,
  onStatusChange,
}: KanbanViewProps) {
  const getNextStatus = (current: StatusType): StatusType | null => {
    if (current === 'Open') return 'In Progress';
    if (current === 'In Progress') return 'Test';
    if (current === 'Test') return 'Closed';
    return null;
  };

  const getPriorityStyle = (priority: string) => {
    if (priority.includes('High')) return 'bg-red-50 text-red-700 border-red-200';
    if (priority.includes('Medium')) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
      {COLUMNS.map((col) => {
        const colIssues = issues.filter((i) => i.status === col.id);

        return (
          <div
            key={col.id}
            className={`rounded-2xl border ${col.color} p-4 flex flex-col max-h-[80vh] bg-white shadow-sm`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-800">
                  {col.label}
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.badge}`}>
                  {colIssues.length}
                </span>
              </div>
            </div>

            {/* Cards List */}
            <div className="overflow-y-auto space-y-3 flex-1 pr-1">
              {colIssues.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  ไม่มีรายการในสถานะนี้
                </div>
              ) : (
                colIssues.map((issue) => {
                  const nextStatus = getNextStatus(issue.status as StatusType);

                  return (
                    <div
                      key={issue.id}
                      onClick={() => onSelectIssue(issue)}
                      className="group bg-white p-3.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                          {issue.log_id}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getPriorityStyle(
                            issue.priority
                          )}`}
                        >
                          {issue.priority}
                        </span>
                      </div>

                      <p className="text-xs text-slate-800 line-clamp-3 leading-relaxed font-medium">
                        {issue.details}
                      </p>

                      {/* Image Thumbnail if attached */}
                      {issue.images && issue.images.length > 0 && (
                        <div className="relative rounded-lg overflow-hidden border border-slate-100 h-20 bg-slate-50 flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={issue.images[0].file_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-1 right-1 text-[10px] bg-black/70 text-white px-1.5 py-0.5 rounded flex items-center gap-1 font-medium">
                            <ImageIcon className="w-2.5 h-2.5" />
                            {issue.images.length}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          {issue.raise_by}
                        </span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <Layers className="w-3 h-3" />
                          {issue.module}
                        </span>
                      </div>

                      {/* Quick Move Next Button */}
                      {nextStatus && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange(issue.id, nextStatus);
                          }}
                          className="w-full mt-1 py-1.5 px-2 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 text-[11px] font-semibold rounded-lg border border-slate-200 hover:border-indigo-200 transition-colors flex items-center justify-center gap-1"
                        >
                          ส่งต่อเป็น {nextStatus} <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
