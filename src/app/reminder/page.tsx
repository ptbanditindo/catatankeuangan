"use client";

import { useState, useEffect } from "react";
import { Plus, Bell, Search, CheckCircle } from "lucide-react";
import { getReminders, supabase } from "@/lib/supabase";
import { formatCurrency, formatDateShort, isOverdue } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import type { Reminder } from "@/types";

export default function ReminderPage() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [tab, setTab] = useState<"semua" | "pending" | "lunas">("semua");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const data = await getReminders();
      setReminders(data as Reminder[]);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  const filtered = reminders.filter((r) => tab === "semua" || r.status === tab);

  async function handleLunas(id: string) {
    await supabase.from("reminders").update({ status: "lunas" }).eq("id", id);
    loadData();
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-light-text dark:text-white">Pengingat</h1>
          <p className="text-dark-muted text-sm mt-1">
            {reminders.filter((r) => r.status === "pending" && isOverdue(r.due_date)).length} overdue
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /><span>Tambah</span>
        </button>
      </div>

      <div className="flex gap-2">
        {(["semua", "pending", "lunas"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? "bg-primary-600 text-white" : "bg-dark-card text-dark-muted hover:text-white"
            }`}
          >{t === "semua" ? "Semua" : t === "pending" ? "Pending" : "Lunas"}</button>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-12"><Bell className="w-12 h-12 text-dark-muted mx-auto mb-3" /><p className="text-dark-muted">Belum ada pengingat</p></div>
        ) : filtered.map((r) => (
          <div key={r.id} className="card flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                r.type === "tagihan" ? "bg-red-500/10 text-red-500" : "bg-yellow-500/10 text-yellow-500"
              }`}>
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-light-text dark:text-white">{r.title}</p>
                <p className="text-xs text-dark-muted">
                  {r.type} • Jatuh tempo: {formatDateShort(r.due_date)}
                  {isOverdue(r.due_date) && r.status === "pending" && <span className="text-red-400 ml-2">Terlewat!</span>}
                </p>
                <span className={`badge ${r.status === "lunas" ? "badge-success" : "badge-warning"}`}>
                  {r.status === "lunas" ? "Lunas" : "Pending"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {r.amount && <span className="text-lg font-bold text-light-text dark:text-white">{formatCurrency(r.amount)}</span>}
              {r.status === "pending" && (
                <button onClick={() => handleLunas(r.id)}
                  className="p-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors"
                  title="Tandai Lunas">
                  <CheckCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && <ReminderModal user={user!} onClose={() => setShowModal(false)} onSuccess={() => { setShowModal(false); loadData(); }} />}
    </div>
  );
}

function ReminderModal({ user, onClose, onSuccess }: { user: string; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ title: "", amount: "", due_date: "", type: "tagihan" as "tagihan" | "hutang" | "piutang" });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSubmitting(true);
    try {
      await supabase.from("reminders").insert({
        title: form.title, amount: form.amount ? parseFloat(form.amount) : null,
        due_date: form.due_date, type: form.type, created_by: user,
      });
      onSuccess();
    } catch (err) { console.error(err); } finally { setSubmitting(false); }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4 text-light-text dark:text-white">Tambah Pengingat</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="input-group">
            <label className="input-label">Judul</label>
            <input type="text" required placeholder="Bayar Listrik, Cicilan, dll" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="input-group">
            <label className="input-label">Tipe</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "tagihan" | "hutang" | "piutang" })}>
              <option value="tagihan">Tagihan</option><option value="hutang">Hutang</option><option value="piutang">Piutang</option>
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Jumlah (Rp, opsional)</label>
            <input type="number" placeholder="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </div>
          <div className="input-group">
            <label className="input-label">Tanggal Jatuh Tempo</label>
            <input type="date" required value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Batal</button>
            <button type="submit" disabled={submitting || !form.title || !form.due_date} className="btn-primary flex-1">
              {submitting ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}