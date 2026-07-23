"use client";

import { useState, useEffect } from "react";
import { Plus, PiggyBank, Target, Search, TrendingUp } from "lucide-react";
import { getBudgets, getSavingGoals, getTransactions, supabase } from "@/lib/supabase";
import { formatCurrency, getMonthRange } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import type { Budget, SavingGoal, Transaction } from "@/types";

export default function BudgetPage() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<SavingGoal[]>([]);
  const [spending, setSpending] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [budgetData, goalData, txData] = await Promise.all([
        getBudgets(),
        getSavingGoals(),
        getTransactions({}).catch(() => []),
      ]);
      setBudgets(budgetData as Budget[]);
      setGoals(goalData as SavingGoal[]);
      
      const { start, end } = getMonthRange();
      const monthlyTxns = (txData as Transaction[]).filter(
        (t) => t.type === "pengeluaran" && new Date(t.date) >= start && new Date(t.date) <= end
      );
      const spendingMap: Record<string, number> = {};
      monthlyTxns.forEach((t) => {
        if (t.category) {
          spendingMap[t.category] = (spendingMap[t.category] || 0) + t.amount;
        }
      });
      setSpending(spendingMap);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  if (loading) return <div className="text-center py-12"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-light-text dark:text-white">Budget & Tabungan</h1></div>
        <div className="flex gap-2">
          <button onClick={() => setShowBudgetModal(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /><span>Budget</span>
          </button>
          <button onClick={() => setShowGoalModal(true)} className="btn-secondary flex items-center gap-2 text-sm">
            <Target className="w-4 h-4" /><span>Target</span>
          </button>
        </div>
      </div>

      {/* Budgets */}
      <div>
        <h3 className="font-semibold text-light-text dark:text-white mb-3">Budget Bulanan</h3>
        {budgets.length === 0 ? (
          <div className="card text-center py-8"><PiggyBank className="w-10 h-10 text-dark-muted mx-auto mb-2" /><p className="text-dark-muted text-sm">Belum ada budget</p></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {budgets.map((b) => {
              const spent = spending[b.category] || 0;
              const pct = Math.min((spent / b.monthly_limit) * 100, 100);
              return (
                <div key={b.id} className="card">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium text-light-text dark:text-white">{b.category}</span>
                    <span className="text-sm text-dark-muted">{b.scope}</span>
                  </div>
                  <div className="progress-bar mb-2">
                    <div className={`progress-fill ${pct > 80 ? "bg-red-500" : pct > 60 ? "bg-yellow-500" : "bg-green-500"}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-muted">Terpakai: {formatCurrency(spent)}</span>
                    <span className="font-medium text-light-text dark:text-white">Limit: {formatCurrency(b.monthly_limit)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Saving Goals */}
      <div>
        <h3 className="font-semibold text-light-text dark:text-white mb-3">Target Tabungan</h3>
        {goals.length === 0 ? (
          <div className="card text-center py-8"><Target className="w-10 h-10 text-dark-muted mx-auto mb-2" /><p className="text-dark-muted text-sm">Belum ada target tabungan</p></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {goals.map((g) => {
              const pct = Math.min((g.current_amount / g.target_amount) * 100, 100);
              return (
                <div key={g.id} className="card">
                  <h4 className="font-medium text-light-text dark:text-white mb-2">{g.goal_name}</h4>
                  <div className="progress-bar mb-2">
                    <div className="progress-fill bg-primary-500" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-muted">Terkumpul: {formatCurrency(g.current_amount)}</span>
                    <span className="font-medium text-light-text dark:text-white">Target: {formatCurrency(g.target_amount)}</span>
                  </div>
                  {g.target_date && (
                    <p className="text-xs text-dark-muted mt-1">Target: {new Date(g.target_date).toLocaleDateString("id-ID")}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showBudgetModal && <BudgetModal user={user!} onClose={() => setShowBudgetModal(false)} onSuccess={() => { setShowBudgetModal(false); loadData(); }} />}
      {showGoalModal && <GoalModal user={user!} onClose={() => setShowGoalModal(false)} onSuccess={() => { setShowGoalModal(false); loadData(); }} />}
    </div>
  );
}

function BudgetModal({ user, onClose, onSuccess }: { user: string; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ scope: "pribadi" as "pribadi" | "toko", category: "", monthly_limit: "" });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSubmitting(true);
    try {
      await supabase.from("budgets").upsert(
        { scope: form.scope, category: form.category, monthly_limit: parseFloat(form.monthly_limit), created_by: user },
        { onConflict: "scope,category" }
      );
      onSuccess();
    } catch (err) { console.error(err); } finally { setSubmitting(false); }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4 text-light-text dark:text-white">Tambah Budget</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="input-group">
            <label className="input-label">Scope</label>
            <select value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value as "pribadi" | "toko" })}>
              <option value="pribadi">Pribadi</option><option value="toko">Toko</option>
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Kategori</label>
            <input type="text" required placeholder="Makanan, Transport, dll" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          </div>
          <div className="input-group">
            <label className="input-label">Batas Bulanan (Rp)</label>
            <input type="number" required placeholder="0" value={form.monthly_limit} onChange={(e) => setForm({ ...form, monthly_limit: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Batal</button>
            <button type="submit" disabled={submitting || !form.category || !form.monthly_limit} className="btn-primary flex-1">
              {submitting ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function GoalModal({ user, onClose, onSuccess }: { user: string; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ goal_name: "", target_amount: "", current_amount: "", target_date: "" });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSubmitting(true);
    try {
      await supabase.from("saving_goals").insert({
        goal_name: form.goal_name, target_amount: parseFloat(form.target_amount),
        current_amount: parseFloat(form.current_amount || "0"), target_date: form.target_date || null, created_by: user,
      });
      onSuccess();
    } catch (err) { console.error(err); } finally { setSubmitting(false); }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4 text-light-text dark:text-white">Tambah Target Tabungan</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="input-group">
            <label className="input-label">Nama Target</label>
            <input type="text" required placeholder="Beli Rumah, Liburan, dll" value={form.goal_name} onChange={(e) => setForm({ ...form, goal_name: e.target.value })} />
          </div>
          <div className="input-group">
            <label className="input-label">Jumlah Target (Rp)</label>
            <input type="number" required placeholder="0" value={form.target_amount} onChange={(e) => setForm({ ...form, target_amount: e.target.value })} />
          </div>
          <div className="input-group">
            <label className="input-label">Sudah Ditabung (Rp)</label>
            <input type="number" placeholder="0" value={form.current_amount} onChange={(e) => setForm({ ...form, current_amount: e.target.value })} />
          </div>
          <div className="input-group">
            <label className="input-label">Target Tanggal (opsional)</label>
            <input type="date" value={form.target_date} onChange={(e) => setForm({ ...form, target_date: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Batal</button>
            <button type="submit" disabled={submitting || !form.goal_name || !form.target_amount} className="btn-primary flex-1">
              {submitting ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}