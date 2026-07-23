"use client";

import { useState, useEffect } from "react";
import { Settings, User, Save } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function PengaturanPage() {
  const { user } = useAuth();
  const [namaSuami, setNamaSuami] = useState("Suami");
  const [namaIstri, setNamaIstri] = useState("Istri");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const s = localStorage.getItem("nama_suami");
    const i = localStorage.getItem("nama_istri");
    if (s) setNamaSuami(s);
    if (i) setNamaIstri(i);
  }, []);

  function handleSave() {
    localStorage.setItem("nama_suami", namaSuami);
    localStorage.setItem("nama_istri", namaIstri);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    // Reload biar nama terupdate di seluruh app
    window.location.reload();
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-light-text dark:text-white">
          Pengaturan
        </h1>
        <p className="text-dark-muted text-sm mt-1">
          Sesuaikan nama panggilan suami & istri
        </p>
      </div>

      <div className="card space-y-6">
        <div className="input-group">
          <label className="input-label flex items-center gap-2">
            <User className="w-4 h-4 text-primary-500" />
            Nama Panggilan Suami
          </label>
          <input
            type="text"
            value={namaSuami}
            onChange={(e) => setNamaSuami(e.target.value)}
            placeholder="Mis: Dhaniar, Mas, dll"
            className="w-full"
          />
          <p className="text-xs text-dark-muted">
            Tampil di: Header, Sidebar, Riwayat transaksi "Dicatat oleh:"
          </p>
        </div>

        <div className="input-group">
          <label className="input-label flex items-center gap-2">
            <User className="w-4 h-4 text-pink-500" />
            Nama Panggilan Istri
          </label>
          <input
            type="text"
            value={namaIstri}
            onChange={(e) => setNamaIstri(e.target.value)}
            placeholder="Mis: Wulan, Mbak, dll"
            className="w-full"
          />
          <p className="text-xs text-dark-muted">
            Tampil di: Header, Sidebar, Riwayat transaksi "Dicatat oleh:"
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={!namaSuami.trim() || !namaIstri.trim()}
          className="btn-primary flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saved ? "Tersimpan! ✅" : "Simpan Pengaturan"}
        </button>
      </div>

      <div className="card">
        <h3 className="font-semibold text-light-text dark:text-white mb-3">
          Preview Tampilan
        </h3>
        <div className="space-y-2 text-sm">
          <p className="text-dark-muted">
            <span className="text-primary-400 font-medium">{namaSuami}</span>
            {" "}(sekarang login sebagai: <span className="capitalize font-medium">{user}</span>)
          </p>
          <p className="text-dark-muted">
            Dicatat oleh: <span className="text-primary-400 font-medium">{user === "suami" ? namaSuami : namaIstri}</span>
          </p>
        </div>
      </div>
    </div>
  );
}