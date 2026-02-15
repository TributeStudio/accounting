export type LogType = 'TIME' | 'EXPENSE' | 'FIXED_FEE' | 'MEDIA_SPEND';

export interface Project {
  id: string;
  name: string;
  client: string;
  hourlyRate: number;
  startDate?: string;
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
  // Expense/Fee specific
  amount?: number; // Base amount ($ value)
  cost?: number; // Internal cost (for expenses/media)
  markupPercent?: number;
  billableAmount?: number;
  profit?: number;
  rateMultiplier?: number; // Applies to hourly rate (e.g. 1.5 for overtime)
  rate?: number; // Base hourly rate override (optional)

  // Media Spend Specific details
  mediaDetails?: {
    googleSpend: number;
    metaSpend: number;
    billingMonth: string;
    annualSpendRunningTotal: number;
    fees: {
      mediaManagement: number;
      creativeOps: number;
      roiEngine: number;
    };
  };

  createdAt: number;
}

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role?: 'admin' | 'user';
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  type: LogType;
  originalLogId?: string; // Reference to original log
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // T-{CLIENT}-{YYMM}-{SEQ}
  clientId: string;
  date: string;
  dueDate: string;
  terms: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'DRAFT' | 'SENT' | 'PAID';
  createdAt: number;
}

export interface Client {
  id: string;
  name: string;
  address: string;
  contactPerson: string;
  email: string;
  phone: string;
  defaultRate: number;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: number;
  billingSettings?: {
    retainerAmount?: number;
    mediaManagementFee?: number; // percent
    adminFeePercentage?: number; // percent
  };
}

export interface AppState {
  user: User | null;
  users: User[];
  clients: Client[];
  projects: Project[];
  logs: LogItem[];
  invoices: Invoice[]; // New
  isDemoMode: boolean;
  isLoading: boolean;
}
