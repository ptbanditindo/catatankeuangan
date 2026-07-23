"use client";

import { useState, useEffect } from "react";
import { Plus, Handshake, Search, CheckCircle } from "lucide-react";
import { getDebts, supabase } from "@/lib/supabase";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import type { Debt } from "@/types";

export default function HutangPage() {
  const { user } = useAuth();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [tab, setTab] = useState<"semua" | "belum_lunas" | "lunas">("semua");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const data = await getDebts();
      setDebts(data as Debt[]);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  const filtered = debts.filter((d) => tab === "semua" || d.status === tab);
  const totalHutang = debts.filter(d => d.type === "hutang_saya" && d.status === "belum_lunas").reduce((s, d) => s + d.amount, 0);
  const totalPiutang = debts.filter(d => d.type === "hutang_orang" && d.status === "belum_lunas").reduce((s, d) => s + d.amount, 0);

  async function handleLunas(id: string) {
    await supabase.from("debts").update({ status: "lunas" }).eq("id", id);
    await supabase.from("transactions").insert({
      scope: "pribadi", type: "pengeluaran", amount: 0, category: "Pembayaran Hutang",
      description: "Pelunasan hutang", date: new Date().toISOString().split("T")[0],
      created_by: user,
    });
    loadData();
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-light-text dark:text-white">Hutang & Piutang</h1>
          <p className="text-dark-muted text-sm mt-1">
            Hutang: {formatCurrency(totalHutang)} • Piutang: {formatCurrency(totalPiutang)}
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /><span>Tambah</span>
        </button>
      </div>

      <div className="flex gap-2">
        {(["semua", "belum_lunas", "lunas"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? "bg-primary-600 text-white" : "bg-dark-card text-dark-muted hover:text-white"
            }`}
          >{t === "semua" ? "Semua" : t === "belum_lunas" ? "Belum Lunas" : "Lunas"}</button>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-12"><Handshake className="w-12 h-12 text-dark-muted mx-auto mb-3" /><p className="text-dark-muted">Belum ada data</p></div>
        ) : filtered.map((debt) => (
          <div key={debt.id} className="card flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                debt.type === "hutang_saya" ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"
              }`}>
                <Handshake className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-light-text dark:text-white">{debt.person_name}</p>
                <p className="text-xs text-dark-muted">
                  {debt.type === "hutang_saya" ? "Hutang Saya" : "Piutang"} • {debt.scope}
                  {debt.due_date && ` • Jatuh tempo: ${formatDateShort(debt.due_date)}`}
                </p>
                <span className={`badge ${debt.status === "lunas" ? "badge-success" : "badge-warning"}`}>
                  {debt.status === "lunas" ? "Lunas" : "Belum Lunas"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-light-text dark:text-white">
                {formatCurrency(debt.amount)}
              </span>
              {debt.status === "belum_lunas" && (
                <button onClick={() => handleLunas(debt.id)}
                  className="p-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors"
                  title="Tandai Lunas">
                  <CheckCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && <DebtModal user={user!} onClose={() => setShowModal(false)} onSuccess={() => { setShowModal(false); loadData(); }} />}
    </div>
  );
}

function DebtModal({ user, onClose, onSuccess }: { user: string; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ scope: "pribadi" as "pribadi" | "toko", type: "hutang_saya" as "hutang_saya" | "hutang_orang", person_name: "", amount: "", due_date: "" });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSubmitting(true);
    try {
      await supabase.from("debts").insert({
        scope: form.scope, type: form.type, person_name: form.person_name,
        amount: parseFloat(form.amount), due_date: form.due_date || null, created_by: user,
      });
      onSuccess();
    } catch (err) { console.error(err); } finally { setSubmitting(false); }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4 text-light-text dark:text-white">Tambah Hutang/Piutang</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="input-group">
            <label className="input-label">Tipe</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "hutang_saya" | "hutang_orang" })}>
              <option value="hutang_saya">Hutang Saya</option>
              <option value="hutang_orang">Piutang (Hutang Orang)</option>
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Nama Orang</label>
            <input type="text" required placeholder="Nama" value={form.person_name} onChange={(e) => setForm({ ...form, person_name: e.target.value })} />
          </div>
          <div className="input-group">
            <label className="input-label">Jumlah (Rp)</label>
            <input type="number" required placeholder="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </div>
          <div className="input-group">
            <label className="input-label">Jatuh Tempo (opsional)</label>
            <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Batal</button>
            <button type="submit" disabled={submitting || !form.person_name || !form.amount} className="btn-primary flex-1">
              {submitting ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}