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

    const teamHierarchy: Record<string, number> = {
      'Aoy': 1,
      'Kampon': 2,
      'Kraijate': 3,
      'Tukta': 4,
      'Nat': 5,
    };

    return Object.entries(map)
      .map(([name, data]) => ({
        name,
        raised: data.raised,
        closed: data.closed,
      }))
      .sort((a, b) => {
        const rankA = teamHierarchy[a.name] || 99;
        const rankB = teamHierarchy[b.name] || 99;
        if (rankA !== rankB) return rankA - rankB;
        return b.raised - a.raised;
      });
  }, [issues, teamMembers]);

  // All High Priority Issues (Ordered by Issue No ascending)
  const urgentIssues = useMemo(() => {
    return issues
      .filter((i) => i.priority.includes('High') && i.status !== 'Closed')
      .sort((a, b) => {
        const numA = parseInt(a.log_id.replace(/\D/g, '') || '0', 10);
        const numB = parseInt(b.log_id.replace(/\D/g, '') || '0', 10);
        return numA - numB;
      });
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

          {/* Right Progress Gauge & Workflow Bar */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/15 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-around gap-4">
              <div className="text-center">
                <div className="relative inline-flex items-center justify-center">
                  <svg className="w-28 h-28 transform -rotate-90">
                    <defs>
                      <linearGradient id="heroEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#34d399" />
                        <stop offset="100%" stopColor="#059669" />
                      </linearGradient>
                    </defs>
                    <circle
                      cx="56"
                      cy="56"
                      r="46"
                      stroke="currentColor"
                      strokeWidth="10"
                      className="text-slate-800/80"
                      fill="transparent"
                    />
                    <circle
                      cx="56"
                      cy="56"
                      r="46"
                      stroke="url(#heroEmerald)"
                      strokeWidth="10"
                      className="transition-all duration-1000 ease-out"
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
                    <span className="text-[10px] text-slate-300 font-semibold uppercase tracking-wider">สำเร็จ</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 inline-block shadow-sm shadow-emerald-400/50" />
                  <span className="text-slate-300">ปิดงานแล้ว:</span>
                  <span className="font-extrabold text-white text-sm">{stats.closed}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 inline-block shadow-sm shadow-amber-400/50" />
                  <span className="text-slate-300">คงค้างทั้งหมด:</span>
                  <span className="font-extrabold text-white text-sm">{stats.open + stats.inProgress + stats.test}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-indigo-400 inline-block" />
                  <span className="text-slate-300">รวมในระบบ:</span>
                  <span className="font-extrabold text-white text-sm">{stats.total}</span>
                </div>
              </div>
            </div>

            {/* Workflow Progress Track */}
            <div className="space-y-1.5 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between text-[11px] text-slate-300">
                <span>อัตราความคืบหน้ารวม</span>
                <span className="font-bold text-emerald-400">{stats.closed} / {stats.total} Issues</span>
              </div>
              <div className="w-full bg-slate-950/60 rounded-full h-3 p-0.5 overflow-hidden flex shadow-inner border border-white/10">
                <div
                  className="bg-gradient-to-r from-emerald-400 to-teal-400 h-full rounded-full transition-all duration-700 shadow-sm"
                  style={{ width: `${stats.resolutionRate}%` }}
                />
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

          <div className="space-y-3.5 pt-2">
            {moduleBreakdown.map((item) => {
              const closedPercent = Math.round((item.closed / item.total) * 100);
              const openPercent = 100 - closedPercent;

              return (
                <div
                  key={item.name}
                  onClick={() => onFilterByModule(item.name)}
                  className="group p-3.5 rounded-2xl bg-slate-50/60 hover:bg-indigo-50/40 border border-slate-200/90 hover:border-indigo-300 transition-all cursor-pointer shadow-sm hover:shadow"
                >
                  <div className="flex items-center justify-between text-xs font-semibold mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shadow-sm shadow-indigo-300" />
                      <span className="text-slate-900 font-bold group-hover:text-indigo-600 transition-colors">
                        {item.name}
                      </span>
                      {closedPercent === 100 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          ✓ ปิดครบ 100%
                        </span>
                      ) : closedPercent > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
                          สำเร็จ {closedPercent}%
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          รอแก้ไข {item.open}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-slate-500 font-medium">
                        <b className="text-emerald-600 font-bold">{item.closed}</b> ปิด / <b className="text-amber-600 font-bold">{item.open}</b> ค้าง
                      </span>
                      <span className="font-extrabold text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                        {item.total} ทั้งหมด
                      </span>
                    </div>
                  </div>

                  {/* Modern High-Impact Progress Bar */}
                  <div className="relative w-full bg-slate-200/80 rounded-full h-3.5 p-0.5 overflow-hidden flex shadow-inner">
                    {item.closed > 0 && (
                      <div
                        className="bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 h-full rounded-l-full transition-all duration-700 shadow-sm relative group-hover:brightness-105"
                        style={{ width: `${closedPercent}%` }}
                        title={`ปิดแล้ว: ${item.closed} (${closedPercent}%)`}
                      />
                    )}
                    {item.open > 0 && (
                      <div
                        className={`bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 h-full transition-all duration-700 shadow-sm relative group-hover:brightness-105 ${
                          item.closed === 0 ? 'rounded-full' : 'rounded-r-full'
                        }`}
                        style={{ width: `${openPercent}%` }}
                        title={`ค้าง: ${item.open} (${openPercent}%)`}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Team Collaboration */}
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
                  tm.name === 'Aoy' || tm.name === 'Kampon'
                    ? 'bg-gradient-to-r from-indigo-50/70 to-purple-50/70 border-indigo-200 shadow-sm'
                    : 'bg-slate-50/60 hover:bg-slate-100/60 border-slate-200/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs ${
                        tm.name === 'Aoy'
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-300'
                          : tm.name === 'Kampon'
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-300'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {tm.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        {tm.name}
                        {tm.name === 'Aoy' && (
                          <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-semibold">
                            Project Lead
                          </span>
                        )}
                        {tm.name === 'Kampon' && (
                          <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-semibold">
                            QA Lead
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

      {/* Urgent / High Priority Section - ALL High Priority Issues Ordered by Issue No */}
      {urgentIssues.length > 0 && (
        <div className="bg-red-50/50 rounded-2xl p-6 border-2 border-red-200/90 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-red-950 flex items-center gap-2">
                <Flame className="w-5 h-5 text-red-600 animate-pulse" />
                High Priority Issues ที่ยังเปิดอยู่ (แสดงทั้งหมด เรียงตาม Issue No)
              </h3>
              <p className="text-xs text-red-700/90">
                รายการปัญหาสำคัญระดับสูงที่รอการแก้ไข เรียงลำดับจากรหัสเริ่มต้นถึงล่าสุด
              </p>
            </div>
            <span className="text-xs font-bold text-red-700 bg-red-100/90 border border-red-300 px-3 py-1 rounded-full self-start sm:self-auto shadow-2xs">
              พบ {urgentIssues.length} รายการ
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {urgentIssues.map((issue) => (
              <div
                key={issue.id}
                onClick={() => onSelectIssue(issue)}
                className="bg-white p-4 rounded-xl border border-red-200 hover:border-red-400 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-2.5 group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-extrabold text-red-700 bg-red-50 px-2.5 py-0.5 rounded-lg border border-red-200 group-hover:bg-red-600 group-hover:text-white transition-colors">
                    {issue.log_id}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {issue.images && issue.images.length > 0 && (
                      <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <ImageIcon className="w-2.5 h-2.5 text-indigo-500" />
                        {issue.images.length}
                      </span>
                    )}
                    <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                      {issue.module}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-800 line-clamp-2 leading-relaxed font-semibold">
                  {issue.details}
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" />
                    โดย: {issue.raise_by}
                  </span>
                  <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {issue.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
