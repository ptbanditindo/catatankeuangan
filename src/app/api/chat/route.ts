import { NextResponse } from "next/server";
import { chatCompletion, SYSTEM_TOOLS } from "@/lib/deepseek";
import { supabase } from "@/lib/supabase";

async function handleToolCall(toolCall: any, createdBy: string) {
  const { name, arguments: args } = toolCall.function;
  const params = JSON.parse(args);

  switch (name) {
    case "upsert_transaction": {
      const { id, scope, store_id, type, amount, category, description, date } =
        params;
      if (id) {
        const { data, error } = await supabase
          .from("transactions")
          .update({
            scope,
            store_id: store_id || null,
            type,
            amount,
            category,
            description,
            date,
          })
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return { success: true, action: "update", data, type: "transaksi" };
      } else {
        const { data, error } = await supabase
          .from("transactions")
          .insert({
            scope,
            store_id: store_id || null,
            type,
            amount,
            category,
            description,
            date: date || new Date().toISOString().split("T")[0],
            created_by: createdBy,
          })
          .select()
          .single();
        if (error) throw error;
        return { success: true, action: "create", data, type: "transaksi" };
      }
    }

    case "upsert_debt": {
      const { id, scope, type, person_name, amount, status, due_date } = params;
      if (id) {
        const { data, error } = await supabase
          .from("debts")
          .update({ scope, type, person_name, amount, status, due_date })
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return { success: true, action: "update", data, type: "hutang" };
      } else {
        const { data, error } = await supabase
          .from("debts")
          .insert({
            scope,
            type,
            person_name,
            amount,
            status: status || "belum_lunas",
            due_date,
            created_by: createdBy,
          })
          .select()
          .single();
        if (error) throw error;
        return { success: true, action: "create", data, type: "hutang" };
      }
    }

    case "upsert_asset": {
      const { id, name, category, amount, metadata } = params;
      if (id) {
        const { data, error } = await supabase
          .from("assets")
          .update({ name, category, amount, metadata: metadata || {} })
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return { success: true, action: "update", data, type: "aset" };
      } else {
        const { data, error } = await supabase
          .from("assets")
          .insert({
            name,
            category,
            amount,
            metadata: metadata || {},
            created_by: createdBy,
          })
          .select()
          .single();
        if (error) throw error;
        return { success: true, action: "create", data, type: "aset" };
      }
    }

    case "upsert_budget": {
      const { id, scope, category, monthly_limit } = params;
      if (id) {
        const { data, error } = await supabase
          .from("budgets")
          .update({ scope, category, monthly_limit })
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return { success: true, action: "update", data, type: "budget" };
      } else {
        const { data, error } = await supabase
          .from("budgets")
          .upsert(
            { scope, category, monthly_limit, created_by: createdBy },
            { onConflict: "scope,category" }
          )
          .select()
          .single();
        if (error) throw error;
        return { success: true, action: "create", data, type: "budget" };
      }
    }

    case "upsert_reminder": {
      const { id, title, amount, due_date, type, status } = params;
      if (id) {
        const { data, error } = await supabase
          .from("reminders")
          .update({ title, amount, due_date, type, status })
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return { success: true, action: "update", data, type: "pengingat" };
      } else {
        const { data, error } = await supabase
          .from("reminders")
          .insert({
            title,
            amount,
            due_date,
            type,
            status: status || "pending",
            created_by: createdBy,
          })
          .select()
          .single();
        if (error) throw error;
        return { success: true, action: "create", data, type: "pengingat" };
      }
    }

    case "upsert_saving_goal": {
      const { id, goal_name, target_amount, current_amount, target_date } =
        params;
      if (id) {
        const { data, error } = await supabase
          .from("saving_goals")
          .update({ goal_name, target_amount, current_amount, target_date })
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return { success: true, action: "update", data, type: "target tabungan" };
      } else {
        const { data, error } = await supabase
          .from("saving_goals")
          .insert({
            goal_name,
            target_amount,
            current_amount: current_amount || 0,
            target_date,
            created_by: createdBy,
          })
          .select()
          .single();
        if (error) throw error;
        return { success: true, action: "create", data, type: "target tabungan" };
      }
    }

    case "delete_transaction": {
      const { id } = params;
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id);
      if (error) throw error;
      return { success: true, action: "delete", type: "transaksi" };
    }

    case "update_debt_status": {
      const { id, status } = params;
      const { data, error } = await supabase
        .from("debts")
        .update({ status })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;

      // If debt is paid, also create a transaction record
      if (status === "lunas") {
        await supabase.from("transactions").insert({
          scope: data.scope,
          type: "pengeluaran",
          amount: data.amount,
          category: "Pembayaran Hutang",
          description: `Bayar hutang ${data.person_name} - ${data.type === "hutang_saya" ? "hutang saya" : "hutang orang"}`,
          date: new Date().toISOString().split("T")[0],
          created_by: createdBy,
        });
      }

      return { success: true, action: "update", data, type: "hutang" };
    }

    case "get_financial_summary": {
      const { data, error } = await supabase
        .from("financial_health")
        .select("*")
        .single();
      if (error) throw error;
      return { success: true, action: "summary", data, type: "ringkasan" };
    }

    case "search_transactions": {
      const { keyword, type } = params;
      let query = supabase
        .from("transactions")
        .select("id, amount, category, description, date, type, scope, created_by")
        .order("date", { ascending: false })
        .limit(20);

      if (keyword) {
        query = query.or(`description.ilike.%${keyword}%,category.ilike.%${keyword}%`);
      }
      if (type) {
        query = query.eq("type", type);
      }

      const { data, error } = await query;
      if (error) throw error;
      return { success: true, action: "search", data: data || [], type: "pencarian" };
    }

    case "delete_all_transactions": {
      const { confirm } = params;
      if (!confirm) {
        return { success: false, message: "Dibatalkan - perlu konfirmasi" };
      }
      const { error } = await supabase.from("transactions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw error;
      return { success: true, action: "delete_all", type: "semua transaksi" };
    }

    default:
      return { success: false, message: "Tool tidak dikenal" };
  }
}

export async function POST(request: Request) {
  try {
    const { messages, user } = await request.json();

    // Tambahkan info user yang login ke system prompt
    const enhancedMessages = [
      {
        role: "system" as const,
        content: `User yang sedang login adalah: **${user || "suami"}**. JANGAN PERNAH bertanya siapa pencatatnya. Semua transaksi dicatat oleh: ${user || "suami"}.`,
      },
      ...messages,
    ];

    // Get AI response with tool calling
    const response = await chatCompletion(enhancedMessages, SYSTEM_TOOLS);

    // Handle tool calls if any
    if (response.tool_calls && response.tool_calls.length > 0) {
      const results = [];
      for (const toolCall of response.tool_calls) {
        const result = await handleToolCall(toolCall, user || "suami");
        results.push(result);
      }

      // Get follow-up response from AI after tool execution
      const followUpMessages: any[] = [
        ...messages,
        response,
        ...results.map((r, i) => ({
          role: "tool" as const,
          content: JSON.stringify(r),
          tool_call_id: response.tool_calls![i]?.id || response.tool_calls![0]?.id,
        })),
      ];

      const followUp = await chatCompletion(followUpMessages);
      return NextResponse.json({
        message: followUp.content || "Selesai!",
        toolResults: results,
      });
    }

    return NextResponse.json({
      message: response.content || "Maaf, saya tidak bisa memproses permintaan Anda.",
    });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}