"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  user: "suami" | "istri" | null;
  login: (pin: string) => boolean;
  logout: () => void;
  theme: "dark" | "light";
  toggleTheme: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<"suami" | "istri" | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "dark" | "light" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    } else {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const login = useCallback((pin: string): boolean => {
    const pinSuami = process.env.NEXT_PUBLIC_PIN_SUAMI || "123456";
    const pinIstri = process.env.NEXT_PUBLIC_PIN_ISTRI || "654321";

    if (pin === pinSuami) {
      setIsAuthenticated(true);
      setUser("suami");
      sessionStorage.setItem("auth", "true");
      sessionStorage.setItem("user", "suami");
      return true;
    } else if (pin === pinIstri) {
      setIsAuthenticated(true);
      setUser("istri");
      sessionStorage.setItem("auth", "true");
      sessionStorage.setItem("user", "istri");
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setUser(null);
    sessionStorage.removeItem("auth");
    sessionStorage.removeItem("user");
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const newTheme = prev === "dark" ? "light" : "dark";
      localStorage.setItem("theme", newTheme);
      document.documentElement.classList.toggle("dark", newTheme === "dark");
      return newTheme;
    });
  }, []);

  useEffect(() => {
    const auth = sessionStorage.getItem("auth");
    const user = sessionStorage.getItem("user") as "suami" | "istri" | null;
    if (auth === "true" && user) {
      setIsAuthenticated(true);
      setUser(user);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, login, logout, theme, toggleTheme }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}