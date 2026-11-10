'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  Plus,
  Download,
  Filter,
  Layers,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  Image as ImageIcon,
  ArrowUpDown,
  RefreshCw,
  Database,
  ExternalLink,
  Trash2,
  Edit,
  Eye,
  X,
} from 'lucide-react';
import { Issue, IssueImage, PriorityType, StatusType, TeamMember, SystemModule, IssueFilter } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { exportIssuesToExcel } from '@/lib/excel';
import IssueModal from '@/components/IssueModal';
import IssueDetailModal from '@/components/IssueDetailModal';
import initialIssuesData from '@/data/initialIssues.json';

const DEFAULT_MODULES: SystemModule[] = [
  { id: 1, name: 'Cash In/Cash Out' },
  { id: 2, name: 'Global Setting' },
  { id: 3, name: 'Login' },
  { id: 4, name: 'Payment' },
  { id: 5, name: 'Price' },
  { id: 6, name: 'Product' },
  { id: 7, name: 'Reason code' },
  { id: 8, name: 'Salemode' },
  { id: 9, name: 'Shop' },
  { id: 10, name: 'Staff' },
];

const DEFAULT_TEAM: TeamMember[] = [
  { id: 1, name: 'Nat', role: 'QA / Tester' },
  { id: 2, name: 'Tukta', role: 'QA / Tester' },
  { id: 3, name: 'Kampon', role: 'Developer' },
];

export default function HomePage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [modules, setModules] = useState<SystemModule[]>(DEFAULT_MODULES);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(DEFAULT_TEAM);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  // Filters state
  const [filter, setFilter] = useState<IssueFilter>({
    search: '',
    status: '',
    priority: '',
    module: '',
    raise_by: '',
  });

  // Sorting state
  const [sortField, setSortField] = useState<keyof Issue>('log_id');
  const [sortAsc, setSortAsc] = useState(false);

  // Load data
  const fetchData = useCallback(async () => {
    setLoading(true);

    if (!isSupabaseConfigured) {
      // Load fallback data from initial JSON
      setIssues(initialIssuesData as Issue[]);
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch modules & team members
      const [modulesRes, teamRes, issuesRes] = await Promise.all([
        supabase.from('modules').select('*').order('name'),
        supabase.from('team_members').select('*').order('name'),
        supabase
          .from('issues')
          .select('*, images:issue_images(*)')
          .order('created_at', { ascending: false }),
      ]);

      if (modulesRes.data && modulesRes.data.length > 0) {
        setModules(modulesRes.data);
      }
      if (teamRes.data && teamRes.data.length > 0) {
        setTeamMembers(teamRes.data);
      }

      if (issuesRes.data) {
        setIssues(issuesRes.data as Issue[]);
      } else {
        // If DB table is empty, display initial data
        setIssues(initialIssuesData as Issue[]);
      }
    } catch (err) {
      console.error('Error fetching Supabase data:', err);
      setIssues(initialIssuesData as Issue[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate Next Log ID
  const nextLogId = useMemo(() => {
    let maxNum = 0;
    issues.forEach((item) => {
      const match = item.log_id.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    return `ISSUE_${maxNum + 1}`;
  }, [issues]);

  // Handle Save (Create or Update)
  const handleSaveIssue = async (issueData: Partial<Issue>, newImages: IssueImage[]) => {
    if (isSupabaseConfigured) {
      if (issueData.id && !issueData.id.startsWith('legacy-')) {
        // Update existing issue in Supabase
        const { error: updateErr } = await supabase
          .from('issues')
          .update({
            log_id: issueData.log_id,
            priority: issueData.priority,
            type: issueData.type,
            module: issueData.module,
            details: issueData.details,
            raise_by: issueData.raise_by,
            status: issueData.status,
            resolution: issueData.resolution,
            closed_by: issueData.closed_by,
            closed_version: issueData.closed_version,
            remark: issueData.remark,
          })
          .eq('id', issueData.id);

        if (updateErr) throw updateErr;

        // Sync images: delete old and insert new ones
        await supabase.from('issue_images').delete().eq('issue_id', issueData.id);
        if (newImages.length > 0) {
          const imagesToInsert = newImages.map((img) => ({
            issue_id: issueData.id,
            file_url: img.file_url,
            file_name: img.file_name,
            file_size: img.file_size || 0,
          }));
          await supabase.from('issue_images').insert(imagesToInsert);
        }
      } else {
        // Insert new issue to Supabase
        const { data: newRow, error: insertErr } = await supabase
          .from('issues')
          .insert({
            log_id: issueData.log_id,
            priority: issueData.priority,
            type: issueData.type,
            module: issueData.module,
            details: issueData.details,
            raise_by: issueData.raise_by,
            status: issueData.status || 'Open',
            resolution: issueData.resolution,
            closed_by: issueData.closed_by,
            closed_version: issueData.closed_version,
            remark: issueData.remark,
          })
          .select('id')
          .single();

        if (insertErr) throw insertErr;

        // Insert images
        if (newImages.length > 0 && newRow?.id) {
          const imagesToInsert = newImages.map((img) => ({
            issue_id: newRow.id,
            file_url: img.file_url,
            file_name: img.file_name,
            file_size: img.file_size || 0,
          }));
          await supabase.from('issue_images').insert(imagesToInsert);
        }
      }
      await fetchData();
    } else {
      // Local demo mode state update
      if (issueData.id) {
        setIssues((prev) =>
          prev.map((item) =>
            item.id === issueData.id
              ? ({ ...item, ...issueData, images: newImages } as Issue)
              : item
          )
        );
      } else {
        const newRecord: Issue = {
          id: `local-${Date.now()}`,
          log_id: issueData.log_id || nextLogId,
          priority: issueData.priority || '2.Medium',
          type: issueData.type || 'Issue',
          module: issueData.module || 'General',
          details: issueData.details || '',
          raise_by: issueData.raise_by || 'Tester',
          raise_date: new Date().toISOString(),
          status: issueData.status || 'Open',
          resolution: issueData.resolution,
          closed_by: issueData.closed_by,
          closed_version: issueData.closed_version,
          remark: issueData.remark,
          created_at: new Date().toISOString(),
          images: newImages,
        };
        setIssues((prev) => [newRecord, ...prev]);
      }
    }
  };

  // Quick Status Change
  const handleStatusChange = async (issueId: string, newStatus: StatusType) => {
    if (isSupabaseConfigured && !issueId.startsWith('legacy-') && !issueId.startsWith('local-')) {
      const updates: Record<string, unknown> = { status: newStatus };
      if (newStatus === 'Closed') {
        updates.closed_date = new Date().toISOString();
      }
      await supabase.from('issues').update(updates).eq('id', issueId);
      await fetchData();
    } else {
      setIssues((prev) =>
        prev.map((i) =>
          i.id === issueId
            ? {
                ...i,
                status: newStatus,
                closed_date: newStatus === 'Closed' ? new Date().toISOString() : i.closed_date,
              }
            : i
        )
      );
    }

    if (selectedIssue && selectedIssue.id === issueId) {
      setSelectedIssue((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  // Delete Issue
  const handleDeleteIssue = async (issueId: string) => {
    if (isSupabaseConfigured && !issueId.startsWith('legacy-') && !issueId.startsWith('local-')) {
      await supabase.from('issues').delete().eq('id', issueId);
      await fetchData();
    } else {
      setIssues((prev) => prev.filter((i) => i.id !== issueId));
    }
  };

  // Add Module
  const handleAddModule = async (name: string) => {
    if (isSupabaseConfigured) {
      await supabase.from('modules').insert({ name });
      const { data } = await supabase.from('modules').select('*').order('name');
      if (data) setModules(data);
    } else {
      setModules((prev) => [...prev, { id: Date.now(), name }]);
    }
  };

  // Add Team Member
  const handleAddTeamMember = async (name: string) => {
    if (isSupabaseConfigured) {
      await supabase.from('team_members').insert({ name, role: 'Member' });
      const { data } = await supabase.from('team_members').select('*').order('name');
      if (data) setTeamMembers(data);
    } else {
      setTeamMembers((prev) => [...prev, { id: Date.now(), name, role: 'Member' }]);
    }
  };

  // Filter and Sort Issues
  const filteredIssues = useMemo(() => {
    return issues
      .filter((item) => {
        // Search
        if (filter.search) {
          const q = filter.search.toLowerCase();
          const matchLogId = item.log_id.toLowerCase().includes(q);
          const matchDetails = item.details.toLowerCase().includes(q);
          const matchResolution = item.resolution?.toLowerCase().includes(q);
          const matchRemark = item.remark?.toLowerCase().includes(q);
          if (!matchLogId && !matchDetails && !matchResolution && !matchRemark) {
            return false;
          }
        }
        // Status
        if (filter.status && item.status !== filter.status) return false;
        // Priority
        if (filter.priority && item.priority !== filter.priority) return false;
        // Module
        if (filter.module && item.module !== filter.module) return false;
        // Raise By
        if (filter.raise_by && item.raise_by !== filter.raise_by) return false;

        return true;
      })
      .sort((a, b) => {
        let valA: unknown = a[sortField];
        let valB: unknown = b[sortField];

        // Specific numerical sort for Log ID (e.g. ISSUE_1, ISSUE_2, ISSUE_10)
        if (sortField === 'log_id') {
          const numA = parseInt(a.log_id.replace(/\D/g, '') || '0', 10);
          const numB = parseInt(b.log_id.replace(/\D/g, '') || '0', 10);
          return sortAsc ? numA - numB : numB - numA;
        }

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA! < valB!) return sortAsc ? -1 : 1;
        if (valA! > valB!) return sortAsc ? 1 : -1;
        return 0;
      });
  }, [issues, filter, sortField, sortAsc]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: issues.length,
      open: issues.filter((i) => i.status === 'Open').length,
      test: issues.filter((i) => i.status === 'Test' || i.status === 'In Progress').length,
      closed: issues.filter((i) => i.status === 'Closed').length,
      highPriority: issues.filter((i) => i.priority === '1.High').length,
    };
  }, [issues]);

  const handleSort = (field: keyof Issue) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const getPriorityStyle = (priority: string) => {
    if (priority.includes('High')) return 'bg-red-50 text-red-700 border-red-200';
    if (priority.includes('Medium')) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  const getStatusStyle = (status: string) => {
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
    <div className="min-h-screen bg-slate-50/80 pb-16">
      {/* Top Banner if Supabase not configured */}
      {!isSupabaseConfigured && (
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 text-white px-4 py-2.5 shadow-md">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-300" />
              <span>
                <b>โหมดพรีวิวข้อมูล (31 Issues จาก Excel):</b> นำ Supabase URL & Anon Key มาใส่ใน{' '}
                <code className="bg-black/20 px-1.5 py-0.5 rounded font-mono text-amber-200">
                  .env.local
                </code>{' '}
                เพื่อเชื่อมต่อ Cloud Database & Storage สมบูรณ์แบบ
              </span>
            </div>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 font-semibold text-amber-200 hover:text-white underline text-xs"
            >
              เปิด Supabase Dashboard <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* Main Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-200">
                  IL
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                    Issue Log HQ
                  </h1>
                  <p className="text-xs text-slate-500 font-medium">
                    VTec Cloud HQ Tracking System • Jiffy
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center flex-wrap gap-2.5">
              <button
                onClick={fetchData}
                disabled={loading}
                className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                title="รีเฟรชข้อมูล"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={() => exportIssuesToExcel(filteredIssues)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-sm transition-all"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                Export Excel ({filteredIssues.length})
              </button>

              <button
                onClick={() => {
                  setEditingIssue(null);
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md shadow-indigo-100 transition-all hover:shadow"
              >
                <Plus className="w-4 h-4" />
                แจ้งปัญหาใหม่ (+ Issue)
              </button>
            </div>
          </div>

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="text-slate-500 font-medium block">ทั้งหมด (Total)</span>
                <span className="text-lg font-bold text-slate-800">{stats.total}</span>
              </div>
              <Layers className="w-5 h-5 text-slate-400" />
            </div>

            <div className="bg-yellow-50/70 p-3 rounded-xl border border-yellow-200/70 flex items-center justify-between">
              <div>
                <span className="text-yellow-800 font-medium block">Open (เปิดอยู่)</span>
                <span className="text-lg font-bold text-yellow-900">{stats.open}</span>
              </div>
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            </div>

            <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200/70 flex items-center justify-between">
              <div>
                <span className="text-blue-800 font-medium block">In Progress / Test</span>
                <span className="text-lg font-bold text-blue-900">{stats.test}</span>
              </div>
              <Clock className="w-5 h-5 text-blue-600" />
            </div>

            <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200/70 flex items-center justify-between">
              <div>
                <span className="text-emerald-800 font-medium block">Closed (ปิดแล้ว)</span>
                <span className="text-lg font-bold text-emerald-900">{stats.closed}</span>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>

            <div className="bg-red-50/70 p-3 rounded-xl border border-red-200/70 flex items-center justify-between col-span-2 sm:col-span-1">
              <div>
                <span className="text-red-800 font-medium block">High Priority</span>
                <span className="text-lg font-bold text-red-900">{stats.highPriority}</span>
              </div>
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-4">
        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหา Log ID, รายละเอียด, คำอธิบาย, หรือ Remark..."
                value={filter.search}
                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none placeholder:text-slate-400"
              />
              {filter.search && (
                <button
                  onClick={() => setFilter({ ...filter, search: '' })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {/* Status Filter */}
              <select
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                className="px-3 py-2 border border-slate-300 rounded-lg outline-none bg-white font-medium text-slate-700"
              >
                <option value="">สถานะทั้งหมด</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Test">Test</option>
                <option value="Closed">Closed</option>
              </select>

              {/* Priority Filter */}
              <select
                value={filter.priority}
                onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
                className="px-3 py-2 border border-slate-300 rounded-lg outline-none bg-white font-medium text-slate-700"
              >
                <option value="">Priority ทั้งหมด</option>
                <option value="1.High">1. High</option>
                <option value="2.Medium">2. Medium</option>
                <option value="3.Low">3. Low</option>
              </select>

              {/* Module Filter */}
              <select
                value={filter.module}
                onChange={(e) => setFilter({ ...filter, module: e.target.value })}
                className="px-3 py-2 border border-slate-300 rounded-lg outline-none bg-white font-medium text-slate-700"
              >
                <option value="">Module ทั้งหมด</option>
                {modules.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>

              {/* Raise By Filter */}
              <select
                value={filter.raise_by}
                onChange={(e) => setFilter({ ...filter, raise_by: e.target.value })}
                className="px-3 py-2 border border-slate-300 rounded-lg outline-none bg-white font-medium text-slate-700"
              >
                <option value="">ผู้แจ้งทั้งหมด</option>
                {teamMembers.map((tm) => (
                  <option key={tm.id} value={tm.name}>
                    {tm.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filter Pills */}
          {(filter.search || filter.status || filter.priority || filter.module || filter.raise_by) && (
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
              <span className="font-medium">ตัวกรองที่ใช้อยู่:</span>
              <button
                onClick={() =>
                  setFilter({ search: '', status: '', priority: '', module: '', raise_by: '' })
                }
                className="text-indigo-600 hover:underline font-semibold ml-auto"
              >
                ล้างตัวกรองทั้งหมด
              </button>
            </div>
          )}
        </div>

        {/* Data Grid Table View */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs tracking-wider">
                  <th
                    onClick={() => handleSort('log_id')}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors w-28"
                  >
                    <div className="flex items-center gap-1">
                      Log ID <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('priority')}
                    className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors w-24"
                  >
                    <div className="flex items-center gap-1">
                      Priority <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('module')}
                    className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors w-32"
                  >
                    <div className="flex items-center gap-1">
                      Module <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-4 min-w-[280px]">รายละเอียด (Details)</th>
                  <th className="py-3 px-2 text-center w-20">รูปภาพ</th>
                  <th
                    onClick={() => handleSort('raise_by')}
                    className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors w-28"
                  >
                    <div className="flex items-center gap-1">
                      ผู้แจ้ง <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('status')}
                    className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors w-28 text-center"
                  >
                    <div className="flex items-center justify-center gap-1">
                      สถานะ <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-3 w-28">ผู้ปิดงาน</th>
                  <th className="py-3 px-4 text-right w-24">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      กำลังโหลดข้อมูล...
                    </td>
                  </tr>
                ) : filteredIssues.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      <div className="max-w-xs mx-auto space-y-2">
                        <HelpCircle className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="font-medium text-slate-700">ไม่พบรายการ Issue ที่ตรงกับเงื่อนไข</p>
                        <p className="text-xs text-slate-400">ลองปรับเปลี่ยนคำค้นหาหรือตัวกรองด้านบน</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredIssues.map((issue) => (
                    <tr
                      key={issue.id}
                      onClick={() => {
                        setSelectedIssue(issue);
                        setDetailModalOpen(true);
                      }}
                      className="hover:bg-indigo-50/30 transition-colors cursor-pointer group"
                    >
                      {/* Log ID */}
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700 whitespace-nowrap">
                        {issue.log_id}
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${getPriorityStyle(
                            issue.priority
                          )}`}
                        >
                          {issue.priority}
                        </span>
                      </td>

                      {/* Module */}
                      <td className="py-3 px-3 font-medium text-slate-800 whitespace-nowrap">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs border border-slate-200">
                          {issue.module}
                        </span>
                      </td>

                      {/* Details */}
                      <td className="py-3 px-4 max-w-md">
                        <p className="line-clamp-2 text-xs leading-relaxed text-slate-800" title={issue.details}>
                          {issue.details}
                        </p>
                      </td>

                      {/* Images count badge */}
                      <td className="py-3 px-2 text-center whitespace-nowrap">
                        {issue.images && issue.images.length > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <ImageIcon className="w-3 h-3" />
                            {issue.images.length}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Raise By */}
                      <td className="py-3 px-3 whitespace-nowrap text-xs">
                        <div className="font-medium text-slate-800">{issue.raise_by}</div>
                        <div className="text-[10px] text-slate-400">
                          {issue.raise_date ? new Date(issue.raise_date).toLocaleDateString('th-TH') : ''}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusStyle(
                            issue.status
                          )}`}
                        >
                          {issue.status}
                        </span>
                      </td>

                      {/* Closed info */}
                      <td className="py-3 px-3 whitespace-nowrap text-xs">
                        {issue.closed_by ? (
                          <div>
                            <span className="font-medium text-emerald-800">{issue.closed_by}</span>
                            {issue.closed_version && (
                              <span className="block text-[10px] text-slate-400">
                                {issue.closed_version}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div
                          className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => {
                              setSelectedIssue(issue);
                              setDetailModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                            title="ดูรายละเอียด"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingIssue(issue);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                            title="แก้ไข"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Table Info */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>
              แสดง <b>{filteredIssues.length}</b> จากทั้งหมด <b>{issues.length}</b> รายการ
            </span>
            <span>คลิกที่แต่ละแถวเพื่อเปิดดูรายละเอียดฉบับเต็มและรูปภาพ</span>
          </div>
        </div>
      </main>

      {/* Modals */}
      <IssueModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingIssue(null);
        }}
        onSave={handleSaveIssue}
        initialData={editingIssue}
        suggestedLogId={nextLogId}
        modules={modules}
        teamMembers={teamMembers}
        onAddModule={handleAddModule}
        onAddTeamMember={handleAddTeamMember}
      />

      <IssueDetailModal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedIssue(null);
        }}
        issue={selectedIssue}
        onEdit={(issueToEdit) => {
          setDetailModalOpen(false);
          setEditingIssue(issueToEdit);
          setIsModalOpen(true);
        }}
        onDelete={handleDeleteIssue}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
