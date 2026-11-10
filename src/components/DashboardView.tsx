'use client';

import React, { useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  TrendingUp,
  User,
  ArrowRight,
  ShieldAlert,
  Flame,
  ImageIcon,
} from 'lucide-react';
import { Issue, TeamMember, SystemModule } from '@/types';

interface DashboardViewProps {
  issues: Issue[];
  teamMembers: TeamMember[];
  modules: SystemModule[];
  onSelectIssue: (issue: Issue) => void;
  onFilterByModule: (moduleName: string) => void;
  onFilterByStatus: (statusName: string) => void;
  onFilterByPriority: (priorityName: string) => void;
  onFilterByReporter: (reporterName: string) => void;
  onGoToTable: () => void;
}

export default function DashboardView({
  issues,
  teamMembers,
  modules,
  onSelectIssue,
  onFilterByModule,
  onFilterByStatus,
  onFilterByPriority,
  onFilterByReporter,
  onGoToTable,
}: DashboardViewProps) {
  // Statistics Calculations
  const stats = useMemo(() => {
    const total = issues.length;
    const open = issues.filter((i) => i.status === 'Open').length;
    const inProgress = issues.filter((i) => i.status === 'In Progress').length;
    const test = issues.filter((i) => i.status === 'Test').length;
    const closed = issues.filter((i) => i.status === 'Closed').length;
    const high = issues.filter((i) => i.priority.includes('High')).length;
    const medium = issues.filter((i) => i.priority.includes('Medium')).length;
    const low = issues.filter((i) => i.priority.includes('Low')).length;
    const withImages = issues.filter((i) => i.images && i.images.length > 0).length;

    const resolutionRate = total > 0 ? Math.round((closed / total) * 100) : 0;
    const activeRate = total > 0 ? Math.round(((open + inProgress + test) / total) * 100) : 0;

    return {
      total,
      open,
      inProgress,
      test,
      closed,
      high,
      medium,
      low,
      withImages,
      resolutionRate,
      activeRate,
    };
  }, [issues]);

  // Breakdown by Module
  const moduleBreakdown = useMemo(() => {
    const map: Record<string, { total: number; closed: number; open: number }> = {};

    issues.forEach((item) => {
      const mod = item.module || 'Other';
      if (!map[mod]) {
        map[mod] = { total: 0, closed: 0, open: 0 };
      }
      map[mod].total++;
      if (item.status === 'Closed') {
        map[mod].closed++;
      } else {
        map[mod].open++;
      }
    });

    return Object.entries(map)
      .map(([name, data]) => ({
        name,
        total: data.total,
        closed: data.closed,
        open: data.open,
        percentClosed: Math.round((data.closed / data.total) * 100),
      }))
      .sort((a, b) => b.total - a.total);
  }, [issues]);

  // Breakdown by Team Member
  const teamBreakdown = useMemo(() => {
    const map: Record<string, { raised: number; closed: number }> = {};

    // Ensure all defined team members are listed
    teamMembers.forEach((tm) => {
      map[tm.name] = { raised: 0, closed: 0 };
    });

    issues.forEach((item) => {
      if (item.raise_by) {
        if (!map[item.raise_by]) map[item.raise_by] = { raised: 0, closed: 0 };
        map[item.raise_by].raised++;
      }
      if (item.closed_by) {
        if (!map[item.closed_by]) map[item.closed_by] = { raised: 0, closed: 0 };
        map[item.closed_by].closed++;
      }
    });

    return Object.entries(map)
      .map(([name, data]) => ({
        name,
        raised: data.raised,
        closed: data.closed,
      }))
      .sort((a, b) => b.raised - a.raised);
  }, [issues, teamMembers]);

  // Top High Priority Issues
  const urgentIssues = useMemo(() => {
    return issues
      .filter((i) => i.priority.includes('High') && i.status !== 'Closed')
      .slice(0, 5);
  }, [issues]);

  // Recent 5 issues
  const recentIssues = useMemo(() => {
    return [...issues].slice(0, 5);
  }, [issues]);

  return (
    <div className="space-y-6">
      {/* Hero Overview Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 shadow-xl border border-indigo-800/40">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-10 h-48 w-48 rounded-full bg-violet-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* Left Title & Status */}
          <div className="lg:col-span-2 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
              ภาพรวมโครงการ • VTec Cloud HQ Issue Tracker
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Executive Issue Analytics Dashboard
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
              ติดตามความคืบหน้าการแก้ปัญหา ปริมาณ Issue คงค้าง และการกระจายตัวของปัญหาตาม Module 
              เพื่อวางแผนแก้ไขและทดสอบระบบได้อย่างแม่นยำ
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              <button
                onClick={onGoToTable}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
              >
                ดูตาราง Issue Log ทั้งหมด
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onFilterByPriority('1.High')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/40 rounded-xl text-xs sm:text-sm font-semibold transition-colors"
              >
                <Flame className="w-4 h-4 text-red-400" />
                กรองดูเฉพาะ High Priority ({stats.high})
              </button>
            </div>
          </div>

          {/* Right Progress Dial */}
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 flex items-center justify-around">
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-28 h-28 transform -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r="46"
                    stroke="currentColor"
                    strokeWidth="10"
                    className="text-slate-700/60"
                    fill="transparent"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r="46"
                    stroke="currentColor"
                    strokeWidth="10"
                    className="text-emerald-400 transition-all duration-1000 ease-out"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 46}
                    strokeDashoffset={
                      2 * Math.PI * 46 - (stats.resolutionRate / 100) * (2 * Math.PI * 46)
                    }
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-black text-white">{stats.resolutionRate}%</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">สำเร็จ</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block shadow-sm shadow-emerald-400/50" />
                <span className="text-slate-300">ปิดแล้ว:</span>
                <span className="font-bold text-white text-sm">{stats.closed}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block shadow-sm shadow-yellow-400/50" />
                <span className="text-slate-300">รอดำเนินการ:</span>
                <span className="font-bold text-white text-sm">{stats.open + stats.inProgress + stats.test}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-indigo-400 inline-block" />
                <span className="text-slate-300">รวมทั้งหมด:</span>
                <span className="font-bold text-white text-sm">{stats.total}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Primary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Open Issues */}
        <div
          onClick={() => onFilterByStatus('Open')}
          className="group relative bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-yellow-300 transition-all cursor-pointer overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-yellow-700">Open Issues</span>
            <div className="p-2.5 rounded-xl bg-yellow-50 text-yellow-600 group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{stats.open}</span>
            <span className="text-xs text-slate-500 font-medium">รายการ</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">ปัญหาที่รอเข้าคิวแก้ไข</p>
          <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-yellow-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${stats.total > 0 ? (stats.open / stats.total) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* In Progress & Test */}
        <div
          onClick={() => onFilterByStatus('Test')}
          className="group relative bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">In Test / Progress</span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{stats.inProgress + stats.test}</span>
            <span className="text-xs text-slate-500 font-medium">รายการ</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">กำลังแก้ไขหรือพร้อมให้ QA ทดสอบ</p>
          <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
              style={{
                width: `${stats.total > 0 ? ((stats.inProgress + stats.test) / stats.total) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        {/* Closed Issues */}
        <div
          onClick={() => onFilterByStatus('Closed')}
          className="group relative bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Closed / Resolved</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{stats.closed}</span>
            <span className="text-xs text-slate-500 font-medium">รายการ</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">ทดสอบผ่านและปิดงานสำเร็จ</p>
          <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${stats.resolutionRate}%` }}
            />
          </div>
        </div>

        {/* High Priority Alerts */}
        <div
          onClick={() => onFilterByPriority('1.High')}
          className="group relative bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-red-300 transition-all cursor-pointer overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-red-700">High Priority</span>
            <div className="p-2.5 rounded-xl bg-red-50 text-red-600 group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-red-600">{stats.high}</span>
            <span className="text-xs text-slate-500 font-medium">รายการ</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">ความสำคัญระดับสูง ต้องเร่งแก้</p>
          <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-red-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${stats.total > 0 ? (stats.high / stats.total) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Module Breakdown & Team Collaboration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Module Breakdown (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                การกระจายของปัญหาตามโมดูล (Issues by Module)
              </h3>
              <p className="text-xs text-slate-500">คลิกที่โมดูลเพื่อดูรายการในระบบ</p>
            </div>
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
              {moduleBreakdown.length} โมดูล
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {moduleBreakdown.map((item) => (
              <div
                key={item.name}
                onClick={() => onFilterByModule(item.name)}
                className="group p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                  <span className="text-slate-800 font-medium group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    {item.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">
                      ปิดแล้ว {item.closed}/{item.total}
                    </span>
                    <span className="font-bold text-slate-800">{item.total} รายการ</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-2 transition-all duration-300"
                    style={{ width: `${(item.closed / item.total) * 100}%` }}
                    title={`ปิดแล้ว: ${item.closed}`}
                  />
                  <div
                    className="bg-yellow-400 h-2 transition-all duration-300"
                    style={{ width: `${(item.open / item.total) * 100}%` }}
                    title={`คงค้าง: ${item.open}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Collaboration & Kampon Spotlight */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600" />
              ทีมงาน & ผู้รับผิดชอบ (Team)
            </h3>
            <span className="text-xs text-slate-400 font-medium">{teamMembers.length} คน</span>
          </div>

          <p className="text-xs text-slate-500">
            จำนวน Issue ที่แจ้งและปิดงานโดยสมาชิกทีมแต่ละท่าน
          </p>

          <div className="space-y-3 pt-1">
            {teamBreakdown.map((tm) => (
              <div
                key={tm.name}
                onClick={() => onFilterByReporter(tm.name)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  tm.name === 'Kampon'
                    ? 'bg-gradient-to-r from-indigo-50/70 to-purple-50/70 border-indigo-200 shadow-sm'
                    : 'bg-slate-50/60 hover:bg-slate-100/60 border-slate-200/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs ${
                        tm.name === 'Kampon'
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-300'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {tm.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        {tm.name}
                        {tm.name === 'Kampon' && (
                          <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-semibold">
                            Lead
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {teamMembers.find((m) => m.name === tm.name)?.role || 'Team Member'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right text-xs">
                    <div className="font-bold text-indigo-600">{tm.raised} แจ้ง</div>
                    <div className="text-[11px] text-emerald-600">{tm.closed} ปิด</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 text-center">
            <button
              onClick={onGoToTable}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1"
            >
              ดูรายละเอียดในตาราง <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Urgent / High Priority Section */}
      {urgentIssues.length > 0 && (
        <div className="bg-red-50/40 rounded-2xl p-6 border border-red-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-red-900 flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-600" />
              High Priority Issues ที่ยังเปิดอยู่ (ต้องการความสนใจด่วน)
            </h3>
            <span className="text-xs text-red-600 font-semibold">{urgentIssues.length} รายการ</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {urgentIssues.map((issue) => (
              <div
                key={issue.id}
                onClick={() => onSelectIssue(issue)}
                className="bg-white p-4 rounded-xl border border-red-200 hover:border-red-400 shadow-sm hover:shadow transition-all cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                    {issue.log_id}
                  </span>
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {issue.module}
                  </span>
                </div>
                <p className="text-xs text-slate-800 line-clamp-2 leading-relaxed font-medium">
                  {issue.details}
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                  <span>โดย: {issue.raise_by}</span>
                  <span className="text-amber-600 font-medium">{issue.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
