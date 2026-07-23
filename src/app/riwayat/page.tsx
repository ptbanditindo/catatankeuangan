"use client";

import { useState, useEffect } from "react";
import { History, Search, RotateCcw, AlertTriangle } from "lucide-react";
import { supabase, getTransactions } from "@/lib/supabase";
import { formatCurrency, formatDateShort, formatDate } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import type { Transaction } from "@/types";

export default function RiwayatPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"semua" | "bisa_dihapus" | "terhapus">("semua");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null);

  const now = new Date();

  useEffect(() => {
    loadData();
    loadDeletedIds();
  }, []);

  async function loadData() {
    try {
      const data = await getTransactions({ limit: 500 });
      setTransactions(data as Transaction[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadDeletedIds() {
    try {
      const { data } = await supabase
        .from("transaction_history")
        .select("transaction_id, action, restored_at")
        .order("changed_at", { ascending: false });
      
      if (data) {
        const deleted = new Set<string>();
        data.forEach((h: any) => {
          if (h.action === "deleted" && !h.restored_at) {
            deleted.add(h.transaction_id);
          }
        });
        setDeletedIds(deleted);
      }
    } catch {}
  }

  // Bisa dihapus jika BELUM 24 jam sejak tanggal transaksi
  const canDelete = (tx: Transaction) => {
    const txDate = new Date(tx.date + "T23:59:59");
    const diffHours = (now.getTime() - txDate.getTime()) / (1000 * 60 * 60);
    return diffHours < 24;
  };

  // Bisa dikembalikan dalam 30 hari sejak dihapus
  const canRestore = (tx: Transaction) => {
    const txDate = new Date(tx.date);
    const diffDays = Math.floor((now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays < 30;
  };

  const isDeleted = (tx: Transaction) => deletedIds.has(tx.id);

  async function handleDelete(id: string) {
    const tx = transactions.find((t) => t.id === id);
    if (!tx || !canDelete(tx)) return;

    // HAPUS DULU dari database (prioritas utama)
    const { error: deleteError } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Gagal hapus:", deleteError);
      return;
    }

    // BARU simpan history (opsional - skip jika tabel belum ada)
    try {
      await supabase.from("transaction_history").insert({
        transaction_id: id,
        action: "deleted",
        original_data: tx,
        deleted_by: user,
        deleted_at: new Date().toISOString(),
      });
    } catch {
      // History table mungkin belum dibuat, skip
    }

    // Update UI
    setDeletedIds((prev) => new Set([...prev, id]));
    setConfirmDelete(null);
    loadData();
  }

  async function handleRestore(id: string) {
    const tx = transactions.find((t) => t.id === id);
    if (!tx || !canRestore(tx)) return;

    try {
      // Coba ambil data asli dari history (jika ada)
      let originalData: any = null;
      try {
        const { data: history } = await supabase
          .from("transaction_history")
          .select("original_data")
          .eq("transaction_id", id)
          .eq("action", "deleted")
          .single();

        if (history) {
          originalData = history.original_data;
        }
      } catch {
        // History table belum ada
      }

      // Restore transaction
      if (originalData) {
        await supabase.from("transactions").insert(originalData);

        // Mark history as restored
        try {
          await supabase
            .from("transaction_history")
            .update({ restored_at: new Date().toISOString(), restored_by: user })
            .eq("transaction_id", id)
            .eq("action", "deleted")
            .is("restored_at", null);
        } catch {}
      }

      setConfirmRestore(null);
      loadData();
    } catch (err) {
      console.error(err);
    }
  }

  const filtered = transactions.filter((tx) => {
    const matchesSearch =
      tx.description?.toLowerCase().includes(search.toLowerCase()) ||
      tx.category?.toLowerCase().includes(search.toLowerCase());

    if (filter === "bisa_dihapus") return matchesSearch && canDelete(tx) && !isDeleted(tx);
    if (filter === "terhapus") return matchesSearch && isDeleted(tx);
    return matchesSearch && !isDeleted(tx);
  });

  const activeCount = transactions.filter((t) => !isDeleted(t)).length;
  const deletedCount = deletedIds.size;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-light-text dark:text-white">
            Riwayat Transaksi
          </h1>
          <p className="text-dark-muted text-sm mt-1">
            {activeCount} aktif • {deletedCount} dihapus
            {deletedCount > 0 && " (akan otomatis terhapus permanen setelah 30 hari)"}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(["semua", "bisa_dihapus", "terhapus"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? "bg-primary-600 text-white"
                : "bg-dark-card text-dark-muted hover:text-white"
            }`}
          >
            {f === "semua" ? "Semua" : f === "bisa_dihapus" ? "Bisa Dihapus" : "Terhapus"}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
        <input
          type="text"
          placeholder="Cari transaksi..."
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
            <History className="w-12 h-12 text-dark-muted mx-auto mb-3" />
            <p className="text-dark-muted">Tidak ada transaksi</p>
          </div>
        ) : (
          filtered.map((tx) => {
            const txDate = new Date(tx.date);
            const diffDays = Math.floor((now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24));
            const deleted = isDeleted(tx);
            const canDel = canDelete(tx);
            const canRes = canRestore(tx);

            return (
              <div
                key={tx.id}
                className={`card flex items-center justify-between ${
                  deleted ? "opacity-50" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      tx.type === "pemasukan"
                        ? "bg-green-500/10 text-green-500"
                        : "bg-red-500/10 text-red-500"
                    }`}
                  >
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-light-text dark:text-white">
                      {tx.description || tx.category || "Transaksi"}
                      {deleted && (
                        <span className="ml-2 badge-danger">Dihapus</span>
                      )}
                    </p>
                    <p className="text-xs text-dark-muted">
                      {formatDateShort(tx.date)} • {tx.scope} •{" "}
                      <span className="capitalize">{tx.type}</span> •{" "}
                      Dicatat: <span className="capitalize">{tx.created_by}</span>
                      <span className="ml-2">
                        {diffDays === 0
                          ? "Hari ini"
                          : `${diffDays} hari lalu`}
                      </span>
                    </p>
                    <p className="text-xs text-dark-muted mt-0.5">
                      Kategori: {tx.category || "-"}
                      {tx.description && ` • ${tx.description}`}
                    </p>
                    {/* Restore deadline info */}
                    {deleted && canRes && (
                      <p className="text-xs text-green-400 mt-1">
                        ⏳ Dapat dikembalikan dalam {30 - diffDays} hari lagi
                      </p>
                    )}
                    {deleted && !canRes && (
                      <p className="text-xs text-red-400 mt-1">
                        ⛔ Sudah {diffDays} hari, tidak bisa dikembalikan
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-lg font-bold ${
                      tx.type === "pemasukan" ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {tx.type === "pemasukan" ? "+" : "-"}
                    {formatCurrency(tx.amount)}
                  </span>

                  {/* Action buttons */}
                  {!deleted && canDel && (
                    <button
                      onClick={() => setConfirmDelete(tx.id)}
                      className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                      title="Hapus transaksi"
                    >
                      <History className="w-4 h-4" />
                    </button>
                  )}
                  {!deleted && !canDel && (
                    <span className="text-xs text-dark-muted" title="Transaksi hari ini tidak bisa dihapus">
                      🔒
                    </span>
                  )}
                  {deleted && canRes && (
                    <button
                      onClick={() => setConfirmRestore(tx.id)}
                      className="p-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors"
                      title="Kembalikan transaksi"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-light-text dark:text-white">
                  Hapus Transaksi?
                </h3>
                <p className="text-sm text-dark-muted">
                  Transaksi akan tersimpan di riwayat dan bisa dikembalikan dalam 30 hari
                </p>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="btn-secondary flex-1"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="btn-danger flex-1"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Confirmation Modal */}
      {confirmRestore && (
        <div className="modal-overlay" onClick={() => setConfirmRestore(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-light-text dark:text-white">
                  Kembalikan Transaksi?
                </h3>
                <p className="text-sm text-dark-muted">
                  Transaksi akan dikembalikan ke daftar aktif
                </p>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setConfirmRestore(null)}
                className="btn-secondary flex-1"
              >
                Batal
              </button>
              <button
                onClick={() => handleRestore(confirmRestore)}
                className="btn-primary flex-1"
              >
                Kembalikan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}