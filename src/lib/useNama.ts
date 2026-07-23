"use client";

export function getNamaSuami(): string {
  if (typeof window === "undefined") return "Suami";
  return localStorage.getItem("nama_suami") || "Suami";
}

export function getNamaIstri(): string {
  if (typeof window === "undefined") return "Istri";
  return localStorage.getItem("nama_istri") || "Istri";
}

export function getNamaByRole(role: "suami" | "istri" | null): string {
  if (!role) return "User";
  return role === "suami" ? getNamaSuami() : getNamaIstri();
}

export function getInitial(role: "suami" | "istri" | null): string {
  const nama = getNamaByRole(role);
  return nama.charAt(0).toUpperCase();
}