"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, Send, User, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { ChatMessage } from "@/types";

export default function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "0",
      role: "assistant",
      content: `Halo! Saya asisten keuangan keluarga Dhaniar. Saya bisa membantu Anda mencatat:\n\n• 💰 Pemasukan & Pengeluaran\n• 📋 Hutang & Piutang\n• 📈 Aset & Portofolio\n• 🎯 Budget & Target Tabungan\n• ⏰ Pengingat Tagihan\n\nSilakan ketik perintah seperti:\n- "Gaji 5jt" atau "beli makan 50rb"\n- "hutang ica 50rb" atau "lunas hutang ica"\n- "beli saham BBCA 1jt"\n- "ingatkan bayar listrik tgl 25 300rb"`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "user", content: input },
          ],
          user,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal terhubung ke AI");
      }

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message || "Selesai diproses!",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: any) {
      setError(err.message);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "⚠️ **Error:** " + err.message + "\n\nPastikan:\n1. DEEPSEEK_API_KEY sudah diisi di .env.local\n2. Koneksi internet berjalan\n3. Server DeepSeek dapat diakses",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-light-text dark:text-white">
            AI Asisten Keuangan
          </h1>
          <p className="text-dark-muted text-sm mt-1">
            Tanyakan atau catat apapun tentang keuangan
          </p>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 card overflow-y-auto mb-4 p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
          >
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}

            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-primary-600 text-white rounded-br-md"
                  : "bg-dark-bg text-dark-text rounded-bl-md border border-dark-border"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {msg.content}
              </p>
              <p
                className={`text-xs mt-1 ${
                  msg.role === "user"
                    ? "text-primary-200"
                    : "text-dark-muted"
                }`}
              >
                {msg.timestamp.toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-xl bg-primary-600/20 flex items-center justify-center flex-shrink-0 mt-1">
                <User className="w-4 h-4 text-primary-400" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-dark-bg rounded-2xl rounded-bl-md px-4 py-3 border border-dark-border">
              <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ketik pesan... (contoh: gaji 5jt, hutang ica 50rb, beli saham bca 1jt)"
          className="flex-1"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="btn-primary !px-4"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </form>

      {error && (
        <div className="mt-3 flex items-center gap-2 text-sm text-yellow-500 bg-yellow-500/10 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}