"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { KeyRound, Eye, EyeOff } from "lucide-react";

export default function PinScreen() {
  const { isAuthenticated, login } = useAuth();
  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!isAuthenticated && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [isAuthenticated]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    setError("");

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are filled
    if (newPin.every((digit) => digit !== "") && index === 5) {
      handleSubmit(newPin.join(""));
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = (pinValue?: string) => {
    const pinToCheck = pinValue || pin.join("");
    if (pinToCheck.length !== 6) {
      setError("PIN harus 6 digit");
      return;
    }

    setLoading(true);
    const success = login(pinToCheck);
    setLoading(false);

    if (!success) {
      setError("PIN salah! Coba lagi.");
      setPin(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
  };

  if (isAuthenticated) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-dark-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-600/30">
            <KeyRound className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">
            Dhaniar Finance
          </h1>
          <p className="text-dark-muted text-sm">
            Masukkan PIN untuk mengakses aplikasi
          </p>
        </div>

        <div className="card bg-dark-card border-dark-border !p-8">
          <div className="flex justify-center gap-3 mb-6">
            {pin.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type={showPin ? "text" : "password"}
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`w-12 h-14 text-center text-xl font-bold 
                         rounded-xl text-white transition-all duration-200
                         [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none
                         ${digit
                           ? "bg-primary-600/20 border-2 border-primary-500 shadow-lg shadow-primary-500/30 scale-110"
                           : "bg-dark-bg border-2 border-dark-border hover:border-primary-500/50"
                         }
                         focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30
                         animate-slide-up`}
                style={{ animationDelay: `${index * 50}ms` }}
                disabled={loading}
              />
            ))}
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center mb-4 animate-slide-down">
              {error}
            </p>
          )}

          <div className="flex justify-center gap-4">
            <button
              onClick={() => setShowPin(!showPin)}
              className="btn-secondary !px-4 !py-2 text-sm"
            >
              {showPin ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => handleSubmit()}
              disabled={loading || pin.some((d) => !d)}
              className="btn-primary !px-8 !py-2"
            >
              {loading ? "Memeriksa..." : "Masuk"}
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-dark-border">
            <p className="text-xs text-dark-muted text-center">
              PIN Suami: ****** | PIN Istri: ******
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}