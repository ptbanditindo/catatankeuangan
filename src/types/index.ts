export type CreatedBy = "suami" | "istri";
export type TransactionScope = "pribadi" | "toko";
export type TransactionType = "pemasukan" | "pengeluaran";
export type DebtType = "hutang_saya" | "hutang_orang";
export type DebtStatus = "belum_lunas" | "lunas";
export type AssetCategory = "saham" | "forex" | "emas" | "dll";
export type ReminderType = "tagihan" | "hutang" | "piutang";
export type ReminderStatus = "pending" | "lunas";

export interface Store {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  scope: TransactionScope;
  store_id: string | null;
  type: TransactionType;
  amount: number;
  category: string | null;
  description: string | null;
  date: string;
  created_by: CreatedBy;
  created_at: string;
  stores?: Store;
}

export interface Debt {
  id: string;
  user_id: string;
  scope: TransactionScope;
  store_id: string | null;
  type: DebtType;
  person_name: string;
  amount: number;
  status: DebtStatus;
  due_date: string | null;
  created_by: CreatedBy;
  created_at: string;
}

export interface Asset {
  id: string;
  user_id: string;
  name: string;
  category: AssetCategory;
  amount: number;
  metadata: Record<string, any>;
  created_by: CreatedBy;
  created_at: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  title: string;
  amount: number | null;
  due_date: string;
  type: ReminderType;
  status: ReminderStatus;
  created_by: CreatedBy;
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  scope: TransactionScope;
  category: string;
  monthly_limit: number;
  created_by: CreatedBy;
  created_at: string;
}

export interface SavingGoal {
  id: string;
  user_id: string;
  goal_name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  created_by: CreatedBy;
  created_at: string;
}

export interface FinancialHealth {
  total_pemasukan: number;
  total_pengeluaran: number;
  net_flow: number;
  total_hutang_saya: number;
  total_piutang: number;
  total_aset: number;
  net_worth: number;
  total_budget_limit: number;
  total_budget_spent: number;
  budget_usage_percentage: number;
  total_target: number;
  total_saved: number;
  saving_progress_percentage: number;
}

export interface AIMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface AIToolCall {
  action: string;
  parameters: Record<string, any>;
}

export type PageName =
  | "dashboard"
  | "pemasukan"
  | "pengeluaran"
  | "aset"
  | "hutang"
  | "budget"
  | "reminder"
  | "chat";