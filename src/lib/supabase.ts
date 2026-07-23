import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getClient(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

    if (!url) {
      throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
    }

    client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

// Re-export helper
export const supabase = new Proxy<SupabaseClient>({} as SupabaseClient, {
  get(_, prop: string | symbol) {
    const c = getClient();
    return (c as any)[prop];
  },
});

async function handleQuery(fn: () => Promise<any>) {
  try {
    return await fn();
  } catch (err: any) {
    if (err?.message?.includes("not configured") || err?.message?.includes("is not set")) {
      return [];
    }
    throw err;
  }
}

export async function queryFinancialHealth() {
  try {
    const { data, error } = await supabase
      .from("financial_health")
      .select("*")
      .single();
    if (error) throw error;
    return data;
  } catch {
    return null;
  }
}

export async function getTransactions(options?: {
  scope?: string;
  type?: string;
  limit?: number;
  offset?: number;
}) {
  return handleQuery(async () => {
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
  });
}

export async function getDebts(options?: { status?: string; type?: string }) {
  return handleQuery(async () => {
    let query = supabase
      .from("debts")
      .select("*")
      .order("created_at", { ascending: false });

    if (options?.status) query = query.eq("status", options.status);
    if (options?.type) query = query.eq("type", options.type);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  });
}

export async function getAssets() {
  return handleQuery(async () => {
    const { data, error } = await supabase
      .from("assets")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  });
}

export async function getBudgets() {
  return handleQuery(async () => {
    const { data, error } = await supabase
      .from("budgets")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  });
}

export async function getReminders(options?: { status?: string }) {
  return handleQuery(async () => {
    let query = supabase
      .from("reminders")
      .select("*")
      .order("due_date", { ascending: true });

    if (options?.status) query = query.eq("status", options.status);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  });
}

export async function getSavingGoals() {
  return handleQuery(async () => {
    const { data, error } = await supabase
      .from("saving_goals")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  });
}

export async function getStores() {
  return handleQuery(async () => {
    const { data, error } = await supabase
      .from("stores")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;
    return data;
  });
}