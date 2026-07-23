"use client";

import { useState, useEffect } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Handshake,
  Briefcase,
  Target,
  PiggyBank,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import StatCard from "@/components/StatCard";
import {
  queryFinancialHealth,
  getTransactions,
  getDebts,
  getAssets,
  getBudgets,
  getReminders,
  getSavingGoals,
} from "@/lib/supabase";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import type { FinancialHealth, Transaction, Debt, Reminder } from "@/types";

export default function DashboardPage() {
  const [health, setHealth] = useState<FinancialHealth | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
    []
  );
  const [upcomingReminders, setUpcomingReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [healthData, txns, reminders] = await Promise.all([
        queryFinancialHealth().catch(() => null),
        getTransactions({ limit: 5 }).catch(() => []),
        getReminders({ status: "pending" }).catch(() => []),
      ]);

      setHealth(healthData as FinancialHealth);
      setRecentTransactions(txns as Transaction[]);
      setUpcomingReminders(reminders as Reminder[]);
      setError(null);
    } catch (err: any) {
      setError("Gagal memuat data. Pastikan Supabase sudah terkonfigurasi.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-dark-muted animate-pulse">
            Memuat data keuangan...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="card max-w-md text-center">
          <div className="w-16 h-16 bg-yellow-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-yellow-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2 text-light-text dark:text-white">
            Selamat Datang di Dhaniar Finance
          </h3>
          <p className="text-sm text-dark-muted mb-6">
            {error}
            <br />
            Konfigurasikan Supabase Anda melalui file .env.local untuk mulai
            menggunakan aplikasi.
          </p>
          <p className="text-xs bg-dark-card rounded-lg p-3 text-left font-mono text-dark-muted">
            NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
            <br />
            NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-light-text dark:text-white">
          Dashboard Keuangan
        </h1>
        <p className="text-dark-muted text-sm mt-1">
          Ringkasan kesehatan keuangan keluarga Dhaniar
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Pemasukan"
          value={formatCurrency(health?.total_pemasukan || 0)}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          label="Total Pengeluaran"
          value={formatCurrency(health?.total_pengeluaran || 0)}
          icon={TrendingDown}
          color="red"
        />
        <StatCard
          label="Net Flow"
          value={formatCurrency(health?.net_flow || 0)}
          icon={Wallet}
          color={(health?.net_flow || 0) >= 0 ? "blue" : "red"}
          trend={(health?.net_flow || 0) >= 0 ? "up" : "down"}
        />
        <StatCard
          label="Total Aset"
          value={formatCurrency(health?.total_aset || 0)}
          icon={Briefcase}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Hutang Saya"
          value={formatCurrency(health?.total_hutang_saya || 0)}
          icon={Handshake}
          color="red"
        />
        <StatCard
          label="Piutang"
          value={formatCurrency(health?.total_piutang || 0)}
          icon={Handshake}
          color="green"
        />
        <StatCard
          label="Net Worth"
          value={formatCurrency(health?.net_worth || 0)}
          icon={Target}
          color={(health?.net_worth || 0) >= 0 ? "blue" : "red"}
        />
        <StatCard
          label="Tabungan"
          value={`${health?.saving_progress_percentage || 0}%`}
          icon={PiggyBank}
          color="yellow"
          trend={
            (health?.saving_progress_percentage || 0) >= 50
              ? "up"
              : "down"
          }
          trendValue={`Rp ${formatCurrency(health?.total_saved || 0)}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-light-text dark:text-white">
              Transaksi Terbaru
            </h3>
            <span className="text-xs text-dark-muted">
              {recentTransactions.length} transaksi
            </span>
          </div>
          {recentTransactions.length === 0 ? (
            <p className="text-sm text-dark-muted text-center py-8">
              Belum ada transaksi
            </p>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-dark-border last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        tx.type === "pemasukan"
                          ? "bg-green-500/10 text-green-500"
                          : "bg-red-500/10 text-red-500"
                      }`}
                    >
                      {tx.type === "pemasukan" ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-light-text dark:text-white">
                        {tx.description || tx.category || "Transaksi"}
                      </p>
                      <p className="text-xs text-dark-muted">
                        {formatDateShort(tx.date)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      tx.type === "pemasukan"
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    {tx.type === "pemasukan" ? "+" : "-"}
                    {formatCurrency(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Reminders */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-light-text dark:text-white">
              Pengingat Mendatang
            </h3>
            <span className="text-xs text-dark-muted">
              {upcomingReminders.length} pending
            </span>
          </div>
          {upcomingReminders.length === 0 ? (
            <p className="text-sm text-dark-muted text-center py-8">
              Tidak ada pengingat
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingReminders.slice(0, 5).map((reminder) => (
                <div
                  key={reminder.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-dark-border last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        reminder.type === "tagihan"
                          ? "bg-red-500/10 text-red-500"
                          : "bg-yellow-500/10 text-yellow-500"
                      }`}
                    >
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-light-text dark:text-white">
                        {reminder.title}
                      </p>
                      <p className="text-xs text-dark-muted">
                        Jatuh tempo: {formatDateShort(reminder.due_date)}
                      </p>
                    </div>
                  </div>
                  {reminder.amount && (
                    <span className="text-sm font-semibold text-light-text dark:text-white">
                      {formatCurrency(reminder.amount)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Budget Usage */}
      {health && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-light-text dark:text-white">
              Penggunaan Budget Bulan Ini
            </h3>
            <span className="text-xs text-dark-muted">
              {formatCurrency(health.total_budget_spent)} /{" "}
              {formatCurrency(health.total_budget_limit)}
            </span>
          </div>
          <div className="progress-bar">
            <div
              className={`progress-fill ${
                health.budget_usage_percentage > 80
                  ? "bg-red-500"
                  : health.budget_usage_percentage > 60
                  ? "bg-yellow-500"
                  : "bg-green-500"
              }`}
              style={{ width: `${Math.min(health.budget_usage_percentage, 100)}%` }}
            />
          </div>
          <p className="text-xs text-dark-muted mt-2">
            {health.budget_usage_percentage}% dari total budget telah digunakan
          </p>
        </div>
      )}
    </div>
  );
}