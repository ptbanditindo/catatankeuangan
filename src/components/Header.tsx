"use client";

import { useAuth } from "@/context/AuthContext";
import { getNamaByRole } from "@/lib/useNama";
import { Menu, Sun, Moon, Bell } from "lucide-react";

export default function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { theme, toggleTheme, user } = useAuth();
  const displayName = getNamaByRole(user);

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-dark-bg/80 backdrop-blur-lg border-b border-gray-200 dark:border-dark-border">
      <div className="flex items-center justify-between px-4 sm:px-6 h-16">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg text-gray-600 dark:text-dark-muted hover:bg-gray-100 dark:hover:bg-dark-card"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-semibold text-light-text dark:text-white">
              {new Date().toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </h2>
            <p className="text-xs text-gray-500 dark:text-dark-muted">
              Halo,{" "}
              <span className="font-medium text-primary-600 dark:text-primary-400">
                {displayName}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-gray-600 dark:text-dark-muted hover:bg-gray-100 dark:hover:bg-dark-card transition-colors"
            title={`Ganti ke mode ${theme === "dark" ? "terang" : "gelap"}`}
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
