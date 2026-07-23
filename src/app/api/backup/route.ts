import { NextResponse } from "next/server";
import { google } from "googleapis";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    // Lazy import supabase only on actual request
    const { getClient } = await import("@/lib/supabase");
    const supabase = getClient();
    
    const credentials = process.env.GOOGLE_SHEETS_CREDENTIALS;
    if (!credentials) {
      return NextResponse.json(
        { success: false, message: "Google Sheets credentials not configured" },
        { status: 400 }
      );
    }

    // Fetch all data from Supabase
    const [transactions, debts, assets, budgets, reminders, savingGoals] =
      await Promise.all([
        supabase.from("transactions").select("*"),
        supabase.from("debts").select("*"),
        supabase.from("assets").select("*"),
        supabase.from("budgets").select("*"),
        supabase.from("reminders").select("*"),
        supabase.from("saving_goals").select("*"),
      ]);

    // Initialize Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(credentials),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = JSON.parse(credentials).spreadsheet_id;

    // Prepare data for sheets
    const timestamp = new Date().toISOString();

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "Transactions!A:H",
      valueInputOption: "RAW",
      requestBody: {
        values: [
          ["ID", "Scope", "Type", "Amount", "Category", "Description", "Date", "Created By"],
          ...(transactions.data || []).map((t: any) => [
            t.id, t.scope, t.type, t.amount, t.category, t.description, t.date, t.created_by,
          ]),
        ],
      },
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "FinancialHealth!A1",
      valueInputOption: "RAW",
      requestBody: {
        values: [["Last Backup", timestamp]],
      },
    });

    return NextResponse.json({
      success: true,
      message: "Backup berhasil dilakukan",
      timestamp,
    });
  } catch (error: any) {
    console.error("Backup Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Backup failed" },
      { status: 500 }
    );
  }
}