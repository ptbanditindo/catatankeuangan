"use client";

import { useState, useEffect } from "react";
import { Plus, ArrowDownRight, Search } from "lucide-react";
import { getTransactions, supabase } from "@/lib/supabase";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import type { Transaction } from "@/types";

export default function PengeluaranPage() {
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
      const data = await getTransactions({ type: "pengeluaran" });
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
            Pengeluaran
          </h1>
          <p className="text-dark-muted text-sm mt-1">
            Catat dan kelola semua pengeluaran
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

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
        <input
          type="text"
          placeholder="Cari pengeluaran..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10"
        />
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-12">
            <ArrowDownRight className="w-12 h-12 text-dark-muted mx-auto mb-3" />
            <p className="text-dark-muted">Belum ada pengeluaran</p>
          </div>
        ) : (
          filtered.map((tx) => (
            <div key={tx.id} className="card flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                  <ArrowDownRight className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="font-medium text-light-text dark:text-white">
                    {tx.description || tx.category || "Pengeluaran"}
                  </p>
                  <p className="text-xs text-dark-muted">
                    {formatDateShort(tx.date)} • {tx.scope}
                    {tx.stores && ` • ${(tx.stores as any).name}`}
                    <span className="inline-block mx-1">•</span>
                    Dicatat oleh: <span className="capitalize font-medium text-primary-400">{tx.created_by}</span>
                  </p>
                </div>
              </div>
              <span className="text-lg font-bold text-red-500">
                -{formatCurrency(tx.amount)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}