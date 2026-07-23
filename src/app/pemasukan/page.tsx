"use client";

import { useState, useEffect } from "react";
import { Plus, ArrowUpRight, Search } from "lucide-react";
import { getTransactions, supabase } from "@/lib/supabase";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import { getNamaByRole } from "@/lib/useNama";
import { useAuth } from "@/context/AuthContext";
import type { Transaction } from "@/types";

export default function PemasukanPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const data = await getTransactions({ type: "pemasukan" });
      setTransactions(data as Transaction[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = transactions.filter(
    (t) =>
      t.description?.toLowerCase().includes(search.toLowerCase()) ||
      t.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-light-text dark:text-white">
            Pemasukan
          </h1>
          <p className="text-dark-muted text-sm mt-1">
            Catat dan kelola semua pemasukan
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
        <input
          type="text"
          placeholder="Cari pemasukan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10"
        />
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-12">
            <ArrowUpRight className="w-12 h-12 text-dark-muted mx-auto mb-3" />
            <p className="text-dark-muted">Belum ada pemasukan</p>
          </div>
        ) : (
          filtered.map((tx) => (
            <div key={tx.id} className="card flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                  <ArrowUpRight className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="font-medium text-light-text dark:text-white">
                    {tx.description || tx.category || "Pemasukan"}
                  </p>
                  <p className="text-xs text-dark-muted">
                    {formatDateShort(tx.date)} • {tx.scope}
                    {tx.stores && ` • ${(tx.stores as any).name}`}
                    <span className="inline-block mx-1">•</span>
                    Dicatat oleh: <span className="capitalize font-medium text-primary-400">{tx.created_by}</span>
                  </p>
                </div>
              </div>
              <span className="text-lg font-bold text-green-500">
                +{formatCurrency(tx.amount)}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <TransactionModal
          type="pemasukan"
          user={user!}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

function TransactionModal({
  type,
  user,
  onClose,
  onSuccess,
}: {
  type: "pemasukan" | "pengeluaran";
  user: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    scope: "pribadi" as "pribadi" | "toko",
    amount: "",
    category: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await supabase.from("transactions").insert({
        scope: form.scope,
        type,
        amount: parseFloat(form.amount),
        category: form.category || null,
        description: form.description || null,
        date: form.date,
        created_by: user,
      });
      onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4 text-light-text dark:text-white">
          Tambah {type === "pemasukan" ? "Pemasukan" : "Pengeluaran"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="input-group">
            <label className="input-label">Scope</label>
            <select
              value={form.scope}
              onChange={(e) =>
                setForm({ ...form, scope: e.target.value as "pribadi" | "toko" })
              }
            >
              <option value="pribadi">Pribadi</option>
              <option value="toko">Toko</option>
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Jumlah (Rp)</label>
            <input
              type="number"
              required
              placeholder="0"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </div>
          <div className="input-group">
            <label className="input-label">Kategori</label>
            <input
              type="text"
              placeholder="Mis: Makanan, Gaji, Transport"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </div>
          <div className="input-group">
            <label className="input-label">Deskripsi</label>
            <input
              type="text"
              placeholder="Deskripsi transaksi"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="input-group">
            <label className="input-label">Tanggal</label>
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting || !form.amount}
              className="btn-primary flex-1"
            >
              {submitting ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}