"use client";

import { useState, useEffect } from "react";
import { Plus, Briefcase, TrendingUp, Search, Trash2 } from "lucide-react";
import { getAssets, supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import type { Asset } from "@/types";

export default function AsetPage() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const data = await getAssets();
      setAssets(data as Asset[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = assets.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase())
  );

  const totalAset = assets.reduce((sum, a) => sum + a.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-light-text dark:text-white">
            Aset & Portofolio
          </h1>
          <p className="text-dark-muted text-sm mt-1">
            Total Aset: {formatCurrency(totalAset)}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Aset</span>
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
        <input
          type="text"
          placeholder="Cari aset..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-12">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full card text-center py-12">
            <Briefcase className="w-12 h-12 text-dark-muted mx-auto mb-3" />
            <p className="text-dark-muted">Belum ada aset</p>
          </div>
        ) : (
          filtered.map((asset) => (
            <div key={asset.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="font-medium text-light-text dark:text-white">
                      {asset.name}
                    </p>
                    <span className="badge-info">{asset.category}</span>
                  </div>
                </div>
              </div>
              <p className="text-lg font-bold text-light-text dark:text-white">
                {formatCurrency(asset.amount)}
              </p>
              {asset.metadata && Object.keys(asset.metadata).length > 0 && (
                <div className="mt-2 text-xs text-dark-muted">
                  {Object.entries(asset.metadata).map(([key, val]) => (
                    <span key={key} className="mr-3">
                      {key}: {String(val)}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-dark-muted mt-2">
                Dicatat oleh: {asset.created_by}
              </p>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <AssetModal
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

function AssetModal({
  user,
  onClose,
  onSuccess,
}: {
  user: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    category: "saham" as Asset["category"],
    amount: "",
    metadata: "",
  });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      let metadata = {};
      if (form.metadata) {
        try {
          metadata = JSON.parse(form.metadata);
        } catch {}
      }
      await supabase.from("assets").insert({
        name: form.name,
        category: form.category,
        amount: parseFloat(form.amount),
        metadata,
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
          Tambah Aset
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="input-group">
            <label className="input-label">Nama Aset</label>
            <input
              type="text"
              required
              placeholder="BBCA, TLKM, Gold, etc"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="input-group">
            <label className="input-label">Kategori</label>
            <select
              value={form.category}
              onChange={(e) =>
                setForm({ ...form, category: e.target.value as Asset["category"] })
              }
            >
              <option value="saham">Saham</option>
              <option value="forex">Forex</option>
              <option value="emas">Emas</option>
              <option value="dll">Lainnya</option>
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Nilai (Rp)</label>
            <input
              type="number"
              required
              placeholder="0"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </div>
          <div className="input-group">
            <label className="input-label">
              Metadata (JSON, optional)
            </label>
            <textarea
              placeholder='{"lot": 10, "harga_beli": 5000}'
              value={form.metadata}
              onChange={(e) => setForm({ ...form, metadata: e.target.value })}
              rows={3}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting || !form.name || !form.amount}
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