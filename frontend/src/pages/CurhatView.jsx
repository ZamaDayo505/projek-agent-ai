import React, { useState, useEffect, useRef } from "react";
import { Send, Bot, User, Trash2, Sparkles, HeartHandshake, RefreshCw } from "lucide-react";
import { apiClient } from "../api/client";

export function CurhatView({ onOpenSettings }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const chatBottomRef = useRef(null);

  const quickPrompts = [
    "Kepala jenuh banget koding seharian tapi fitur masih ada bug...",
    "Takut streak GitHub putus gara-gara lembur kerjaan lain.",
    "Merasa boros banget minggu ini, gimana ya cara kontrol diri?",
    "Hari ini berhasil commit dan deploy fitur baru! Senang banget!"
  ];

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const historyList = await apiClient.getChatHistory();
      if (historyList && historyList.length > 0) {
        setMessages(historyList);
      } else {
        setMessages([
          {
            id: 0,
            role: "assistant",
            message: "Halo! Aku di sini untuk mendengarkan. Ada apa hari ini? Kamu bisa cerita apa saja—soal deadline koding, target streak, masalah keuangan, atau hal-hal kecil yang bikin penat. Ceritakan saja ya."
          }
        ]);
      }
    } catch (err) {
      console.error("Failed to load chat history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const handleSendMessage = async (textToSend) => {
    const trimmed = (textToSend || inputMessage).trim();
    if (!trimmed || isSending) return;

    const optimisticMessage = {
      id: Date.now(),
      role: "user",
      message: trimmed
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setInputMessage("");
    setIsSending(true);

    try {
      const response = await apiClient.sendCurhat(trimmed);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          message: response.reply_content
        }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          message: "Maaf, ada kendala menghubungi model AI. Pastikan OpenAI API Key sudah diisi di Pengaturan jika ingin respon penuh GPT-4o."
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm("Hapus semua riwayat percakapan curhat?")) return;
    try {
      await apiClient.clearChatHistory();
      setMessages([
        {
          id: Date.now(),
          role: "assistant",
          message: "Riwayat telah dibersihkan. Ruang obrolan baru sudah siap. Ada yang ingin kamu bagi hari ini?"
        }
      ]);
    } catch (err) {
      alert("Gagal menghapus riwayat: " + err.message);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", height: "calc(100vh - 160px)", minHeight: "560px" }}>
      
      {/* Header Bar */}
      <div className="card" style={{ padding: "0.85rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#ffffff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ width: "2.35rem", height: "2.35rem", borderRadius: "50%", background: "#fdf4ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <HeartHandshake size={20} color="#c026d3" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" }}>Teman Curhat Developer</h3>
              <span className="badge badge-success" style={{ fontSize: "0.68rem" }}>Online</span>
            </div>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Ruang aman & privat untuk melepas penat koding</p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn btn-outline" style={{ padding: "0.4rem 0.75rem", fontSize: "0.78rem" }} onClick={handleClearHistory} title="Bersihkan Obrolan">
            <Trash2 size={14} /> Bersihkan
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="card" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "1rem", padding: "1.25rem", background: "#ffffff" }}>
        
        {isLoadingHistory ? (
          <div style={{ margin: "auto", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
            <RefreshCw size={24} className="pulse-flame" style={{ marginBottom: "0.5rem" }} />
            <p>Memuat percakapan...</p>
          </div>
        ) : (
          messages.map((item) => {
            const isUser = item.role === "user";
            return (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  gap: "0.65rem",
                  alignSelf: isUser ? "flex-end" : "flex-start",
                  maxWidth: "78%",
                  flexDirection: isUser ? "row-reverse" : "row"
                }}
              >
                <div style={{
                  width: "2rem",
                  height: "2rem",
                  borderRadius: "50%",
                  background: isUser ? "#eef2ff" : "#fdf4ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}>
                  {isUser ? <User size={14} color="#4f46e5" /> : <Bot size={14} color="#c026d3" />}
                </div>

                <div style={{
                  background: isUser ? "#4f46e5" : "#f8fafc",
                  color: isUser ? "#ffffff" : "#0f172a",
                  border: isUser ? "1px solid #4338ca" : "1px solid #e2e8f0",
                  borderRadius: "0.875rem",
                  borderTopRightRadius: isUser ? "0.2rem" : "0.875rem",
                  borderTopLeftRadius: !isUser ? "0.2rem" : "0.875rem",
                  padding: "0.75rem 1.05rem",
                  fontSize: "0.9rem",
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                  boxShadow: "var(--shadow-sm)"
                }}>
                  {item.message}
                </div>
              </div>
            );
          })
        )}

        {isSending && (
          <div style={{ display: "flex", gap: "0.65rem", alignSelf: "flex-start" }}>
            <div style={{ width: "2rem", height: "2rem", borderRadius: "50%", background: "#fdf4ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Bot size={14} color="#c026d3" />
            </div>
            <div style={{ background: "#f8fafc", padding: "0.65rem 1.15rem", borderRadius: "0.875rem", border: "1px solid #e2e8f0", borderTopLeftRadius: "0.2rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
              <span className="pulse-flame">Sedang mendengarkan & memikirkan tanggapan...</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Quick Prompt Chips */}
      <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.25rem" }}>
        {quickPrompts.map((promptText, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(promptText)}
            disabled={isSending}
            style={{
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              padding: "0.35rem 0.75rem",
              borderRadius: "9999px",
              color: "#475569",
              fontSize: "0.75rem",
              cursor: "pointer",
              whiteSpace: "nowrap",
              boxShadow: "var(--shadow-sm)",
              transition: "all 0.15s ease"
            }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = "#4f46e5"; e.currentTarget.style.color = "#4f46e5"; }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.color = "#475569"; }}
          >
            <Sparkles size={11} style={{ display: "inline", marginRight: "0.3rem", color: "#4f46e5" }} />
            {promptText}
          </button>
        ))}
      </div>

      {/* Input Message Form */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
        style={{ display: "flex", gap: "0.65rem" }}
      >
        <input
          type="text"
          className="input-field"
          placeholder="Tulis apa yang kamu rasakan atau alami hari ini..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          disabled={isSending}
          style={{ borderRadius: "0.65rem" }}
        />
        <button type="submit" className="btn btn-primary" disabled={isSending || !inputMessage.trim()} style={{ borderRadius: "0.65rem", padding: "0.6rem 1.2rem" }}>
          <Send size={15} />
          <span>Kirim</span>
        </button>
      </form>

    </div>
  );
}
