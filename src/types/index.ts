export type PriorityType = '1.High' | '2.Medium' | '3.Low';
export type StatusType = 'Open' | 'In Progress' | 'Test' | 'Closed';

export interface IssueImage {
  id?: string;
  issue_id?: string;
  file_url: string;
  file_name: string;
  file_size?: number;
  created_at?: string;
}

export interface Issue {
  id: string;
  log_id: string;
  priority: PriorityType | string;
  type: string;
  module: string;
  details: string;
  raise_by: string;
  raise_date: string;
  status: StatusType | string;
  resolution?: string | null;
  closed_by?: string | null;
  closed_date?: string | null;
  closed_version?: string | null;
  remark?: string | null;
  created_at?: string;
  updated_at?: string;
  images?: IssueImage[];
}

export interface TeamMember {
  id: number;
  name: string;
  role?: string;
}

export interface SystemModule {
  id: number;
  name: string;
}

export interface IssueFilter {
  search: string;
  status: string;
  priority: string;
  module: string;
  raise_by: string;
}
