import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export async function queryFinancialHealth() {
  const { data, error } = await supabase
    .from("financial_health")
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function getTransactions(options?: {
  scope?: string;
  type?: string;
  limit?: number;
  offset?: number;
}) {
  let query = supabase
    .from("transactions")
    .select("*, stores(name)")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (options?.scope) query = query.eq("scope", options.scope);
  if (options?.type) query = query.eq("type", options.type);
  if (options?.limit) query = query.limit(options.limit);
  if (options?.offset) query = query.range(options.offset, options.offset + 19);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getDebts(options?: { status?: string; type?: string }) {
  let query = supabase
    .from("debts")
    .select("*")
    .order("created_at", { ascending: false });

  if (options?.status) query = query.eq("status", options.status);
  if (options?.type) query = query.eq("type", options.type);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getAssets() {
  const { data, error } = await supabase
    .from("assets")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getBudgets() {
  const { data, error } = await supabase
    .from("budgets")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getReminders(options?: { status?: string }) {
  let query = supabase
    .from("reminders")
    .select("*")
    .order("due_date", { ascending: true });

  if (options?.status) query = query.eq("status", options.status);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getSavingGoals() {
  const { data, error } = await supabase
    .from("saving_goals")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getStores() {
  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return data;
}