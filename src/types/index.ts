export type LogType = 'TIME' | 'EXPENSE';

export interface Project {
  id: string;
  name: string;
  client: string;
  hourlyRate: number;
  status: 'ACTIVE' | 'ARCHIVED' | 'COMPLETED';
  createdAt: number;
}

export interface LogItem {
  id: string;
  projectId: string;
  date: string;
  description: string;
  type: LogType;
  // Time specific
  hours?: number;
  // Expense specific
  cost?: number;
  markupPercent?: number;
  billableAmount?: number;
  profit?: number;
  createdAt: number;
}

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface AppState {
  user: User | null;
  projects: Project[];
  logs: LogItem[];
  isDemoMode: boolean;
  isLoading: boolean;
}
