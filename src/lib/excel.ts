import * as XLSX from 'xlsx';
import { Issue } from '@/types';

export function exportIssuesToExcel(issues: Issue[], filename = 'Issue_Log_Export.xlsx') {
  // Format rows to match the original Excel structure
  const rows = issues.map((item) => ({
    'Log ID': item.log_id,
    'Priority': item.priority,
    'Type': item.type,
    'Module': item.module,
    'Details': item.details,
    'Raise By': item.raise_by,
    'Raise Date': item.raise_date ? new Date(item.raise_date).toLocaleDateString('en-GB') : '',
    'Resolution': item.resolution || '',
    'Status': item.status,
    'Closed by': item.closed_by || '',
    'Closed Date': item.closed_date ? new Date(item.closed_date).toLocaleDateString('en-GB') : '',
    'Closed Version': item.closed_version || '',
    'Remark': item.remark || '',
    'Images Attached': item.images?.length || 0,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 12 }, // Log ID
    { wch: 10 }, // Priority
    { wch: 10 }, // Type
    { wch: 16 }, // Module
    { wch: 45 }, // Details
    { wch: 12 }, // Raise By
    { wch: 14 }, // Raise Date
    { wch: 30 }, // Resolution
    { wch: 12 }, // Status
    { wch: 12 }, // Closed by
    { wch: 14 }, // Closed Date
    { wch: 15 }, // Closed Version
    { wch: 20 }, // Remark
    { wch: 15 }, // Images
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Issue Log');
  XLSX.writeFile(workbook, filename);
}
