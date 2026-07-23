"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getNamaByRole, getInitial } from "@/lib/useNama";
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Briefcase,
  Handshake,
  PiggyBank,
  Bell,
  History,
  Settings,
  Bot,
  LogOut,
  X,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: TrendingUp, label: "Pemasukan", href: "/pemasukan" },
  { icon: TrendingDown, label: "Pengeluaran", href: "/pengeluaran" },
  { icon: Briefcase, label: "Aset", href: "/aset" },
  { icon: Handshake, label: "Hutang & Piutang", href: "/hutang" },
  { icon: PiggyBank, label: "Budget & Tabungan", href: "/budget" },
  { icon: Bell, label: "Pengingat", href: "/reminder" },
  { icon: History, label: "Riwayat", href: "/riwayat" },
  { icon: Bot, label: "AI Asisten", href: "/chat" },
  { icon: Settings, label: "Pengaturan", href: "/pengaturan" },
];

export default function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-dark-card border-r border-dark-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-dark-border">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2" onClick={onClose}>
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-white text-lg">Dhaniar</span>
              </Link>
              <button
                onClick={onClose}
                className="lg:hidden text-dark-muted hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary-600/20 text-primary-400 border border-primary-600/30"
                      : "text-dark-muted hover:text-white hover:bg-dark-border/50"
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User info & Logout */}
          <div className="p-4 border-t border-dark-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold">
                {getInitial(user)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {getNamaByRole(user)}
                </p>
                <p className="text-xs text-dark-muted">Kelola Keuangan</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}