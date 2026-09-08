import React, { useState, useEffect, useRef } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  PieChart,
  ArrowDownRight,
  ArrowUpRight,
  Mic,
  MicOff,
  Volume2
} from "lucide-react";
import { apiClient } from "../api/client";

export function FinanceView({ financeSummary, onRefreshFinance, onOpenSettings }) {
  const [naturalText, setNaturalText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [extractedItems, setExtractedItems] = useState([]);
  const [parseSummary, setParseSummary] = useState("");
  const [parseError, setParseError] = useState("");

  // Voice recognition states
  const [isRecording, setIsRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef(null);

  // Manual entry states
  const [entryType, setEntryType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Makanan");
  const [note, setNote] = useState("");
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  // Initialize Speech Recognition API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = false;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = "id-ID"; // Bahasa Indonesia

    recognitionInstance.onresult = (event) => {
      let currentResultText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentResultText += event.results[i][0].transcript;
      }
      setVoiceTranscript(currentResultText);
      setNaturalText(currentResultText);
    };

    recognitionInstance.onerror = (speechErr) => {
      console.warn("Speech recognition error:", speechErr.error);
      setIsRecording(false);
      if (speechErr.error === "not-allowed") {
        alert("Izin mikrofon ditolak oleh browser. Silakan izinkan akses mikrofon untuk memakai fitur suara.");
      }
    };

    recognitionInstance.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognitionInstance;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const toggleVoiceRecording = () => {
    if (!speechSupported) {
      alert("Browser Anda belum mendukung Web Speech API bawaan. Disarankan menggunakan Google Chrome, Microsoft Edge, atau Safari.");
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      // Automatically trigger smart parse if voice transcript exists
      if (voiceTranscript.trim()) {
        triggerSmartParse(voiceTranscript.trim());
      }
    } else {
      setVoiceTranscript("");
      setParseError("");
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
      }
    }
  };

  const formatRupiah = (val) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val || 0);
  };

  const triggerSmartParse = async (textToParse) => {
    const query = textToParse || naturalText;
    if (!query.trim()) return;

    setIsParsing(true);
    setParseError("");
    setExtractedItems([]);
    setParseSummary("");

    try {
      const response = await apiClient.parseExpense(query);
      if (response.extracted_items && response.extracted_items.length > 0) {
        setExtractedItems(response.extracted_items);
        setParseSummary(response.detected_summary);
      } else {
        setParseError(response.detected_summary || "Tidak ada transaksi yang terdeteksi dari kalimat/suara.");
      }
    } catch (err) {
      setParseError(err.message || "Gagal memproses catatan pengeluaran.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleSmartParseSubmit = (e) => {
    e.preventDefault();
    triggerSmartParse();
  };

  const handleSaveExtracted = async () => {
    if (extractedItems.length === 0) return;
    try {
      await apiClient.addBatchTransactions(extractedItems);
      setExtractedItems([]);
      setParseSummary("");
      setNaturalText("");
      setVoiceTranscript("");
      onRefreshFinance();
    } catch (err) {
      alert("Gagal menyimpan transaksi: " + err.message);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      alert("Masukkan nominal yang valid");
      return;
    }

    setIsSubmittingManual(true);
    try {
      await apiClient.addTransaction({
        entry_type: entryType,
        amount: parsedAmount,
        category: category,
        note: note.trim()
      });
      setAmount("");
      setNote("");
      onRefreshFinance();
    } catch (err) {
      alert("Gagal menambah transaksi: " + err.message);
    } finally {
      setIsSubmittingManual(false);
    }
  };

  const handleDelete = async (transactionId) => {
    if (!confirm("Hapus catatan transaksi ini?")) return;
    try {
      await apiClient.deleteTransaction(transactionId);
      onRefreshFinance();
    } catch (err) {
      alert("Gagal menghapus transaksi: " + err.message);
    }
  };

  const categoriesList = ["Makanan", "Transportasi", "Tagihan", "Belanja", "Hiburan", "Kesehatan", "Pendidikan", "Gaji", "Investasi", "Lain-lain"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      
      {/* Header */}
      <div>
        <h2 style={{ fontSize: "1.45rem", fontWeight: 700, color: "#0f172a" }}>Laporan & Catatan Keuangan</h2>
        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
          Catat pengeluaran lewat <strong>suara (voice)</strong>, ketik teks bebas AI, atau input manual.
        </p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
        
        <div className="card" style={{ borderLeft: "4px solid #059669", background: "#ffffff" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "#059669", fontSize: "0.78rem", fontWeight: 600 }}>
            <span>TOTAL PEMASUKAN</span>
            <TrendingUp size={16} />
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: "0.35rem", color: "#0f172a" }}>
            {formatRupiah(financeSummary?.total_income)}
          </div>
        </div>

        <div className="card" style={{ borderLeft: "4px solid #e11d48", background: "#ffffff" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "#e11d48", fontSize: "0.78rem", fontWeight: 600 }}>
            <span>TOTAL PENGELUARAN</span>
            <TrendingDown size={16} />
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: "0.35rem", color: "#0f172a" }}>
            {formatRupiah(financeSummary?.total_expense)}
          </div>
        </div>

        <div className="card" style={{ borderLeft: "4px solid #4f46e5", background: "#ffffff" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "#4f46e5", fontSize: "0.78rem", fontWeight: 600 }}>
            <span>SALDO BERSIH</span>
            <Wallet size={16} />
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: "0.35rem", color: "#0f172a" }}>
            {formatRupiah(financeSummary?.net_balance)}
          </div>
        </div>

      </div>

      {/* Smart Voice & Text AI Input Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1.25rem" }}>
        
        {/* Voice & Smart Text Card */}
        <div className="card" style={{ border: "1px solid #c7d2fe", background: "#ffffff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div style={{ width: "2rem", height: "2rem", borderRadius: "0.5rem", background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Sparkles size={16} color="#4f46e5" />
              </div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 600, color: "#0f172a" }}>Pencatatan Suara (Voice) & AI</h3>
            </div>

            {/* Voice Record Toggle Button */}
            <button
              type="button"
              onClick={toggleVoiceRecording}
              className={`btn ${isRecording ? "btn-mic-recording" : "btn-outline"}`}
              style={{
                fontSize: "0.8rem",
                padding: "0.4rem 0.85rem",
                borderColor: isRecording ? "#ef4444" : "#cbd5e1"
              }}
              title="Bicara langsung untuk mencatat keuangan"
            >
              {isRecording ? <MicOff size={15} color="#dc2626" /> : <Mic size={15} color="#4f46e5" />}
              <span>{isRecording ? "Stop & Proses" : "Mulai Bicara (Voice)"}</span>
            </button>
          </div>

          {isRecording && (
            <div style={{
              background: "#fff1f2",
              border: "1px solid #fecdd3",
              borderRadius: "0.625rem",
              padding: "0.75rem",
              marginBottom: "0.85rem",
              display: "flex",
              alignItems: "center",
              gap: "0.6rem"
            }}>
              <Volume2 size={18} color="#e11d48" className="pulse-flame" />
              <div>
                <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#9f1239" }}>
                  Mendengarkan suara Anda... (Bicara sekarang)
                </span>
                <p style={{ fontSize: "0.75rem", color: "#be123c", marginTop: "0.1rem" }}>
                  Contoh: <em>"Beli nasi padang 25 ribu dan bayar wifi 300rb"</em>
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSmartParseSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <textarea
              className="input-field"
              rows={3}
              placeholder="Atau ketik di sini: contoh 'Beli bensin 30rb, makan ramen 45rb, dan terima bayaran proyek 1.5jt'"
              value={naturalText}
              onChange={(e) => setNaturalText(e.target.value)}
              style={{ resize: "vertical" }}
            />
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Didukung AI lokal gratis & OpenAI GPT-4o
              </span>
              <button type="submit" className="btn btn-primary" disabled={isParsing || !naturalText.trim()}>
                <Sparkles size={14} />
                <span>{isParsing ? "Memproses..." : "Ekstrak Transaksi"}</span>
              </button>
            </div>
          </form>

          {parseError && (
            <div style={{ marginTop: "0.85rem", padding: "0.65rem 0.85rem", background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: "0.5rem", color: "#be123c", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <AlertCircle size={15} />
              <span>{parseError}</span>
            </div>
          )}

          {extractedItems.length > 0 && (
            <div style={{ marginTop: "1rem", background: "#f8fafc", padding: "0.9rem", borderRadius: "0.625rem", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.65rem" }}>
                <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#059669" }}>
                  ✓ {parseSummary}
                </span>
                <button onClick={handleSaveExtracted} className="btn btn-primary" style={{ padding: "0.35rem 0.75rem", fontSize: "0.78rem" }}>
                  <Check size={14} /> Masukkan ke Tabel
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                {extractedItems.map((item, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#ffffff", padding: "0.45rem 0.65rem", borderRadius: "0.4rem", border: "1px solid #e2e8f0", fontSize: "0.82rem" }}>
                    <div>
                      <span className={`badge ${item.entry_type === "income" ? "badge-income" : "badge-expense"}`} style={{ fontSize: "0.65rem", marginRight: "0.4rem" }}>
                        {item.entry_type === "income" ? "Masuk" : "Keluar"}
                      </span>
                      <strong>{item.category}</strong>: {item.note || "Tanpa keterangan"}
                    </div>
                    <span style={{ fontWeight: 700, color: item.entry_type === "income" ? "#0284c7" : "#e11d48" }}>
                      {formatRupiah(item.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Manual Input Card */}
        <div className="card" style={{ background: "#ffffff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <div style={{ width: "2rem", height: "2rem", borderRadius: "0.5rem", background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Plus size={16} color="#059669" />
            </div>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 600, color: "#0f172a" }}>Input Manual Cepat</h3>
          </div>

          <form onSubmit={handleManualSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              <button
                type="button"
                className={`btn ${entryType === "expense" ? "btn-danger" : "btn-outline"}`}
                onClick={() => setEntryType("expense")}
                style={{ fontSize: "0.85rem" }}
              >
                <ArrowDownRight size={14} /> Pengeluaran
              </button>
              <button
                type="button"
                className={`btn ${entryType === "income" ? "btn-primary" : "btn-outline"}`}
                onClick={() => setEntryType("income")}
                style={{ fontSize: "0.85rem" }}
              >
                <ArrowUpRight size={14} /> Pemasukan
              </button>
            </div>

            <div>
              <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>Nominal (Rp)</label>
              <input
                type="number"
                className="input-field"
                placeholder="contoh: 25000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              <div>
                <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>Kategori</label>
                <select className="input-field" value={category} onChange={(e) => setCategory(e.target.value)}>
                  {categoriesList.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>Keterangan</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Catatan item"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-outline" disabled={isSubmittingManual} style={{ marginTop: "0.2rem" }}>
              {isSubmittingManual ? "Menyimpan..." : "Tambah ke Catatan"}
            </button>
          </form>
        </div>

      </div>

      {/* Category Breakdown & Transaction History */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.25rem" }}>
        
        {/* Category Breakdown */}
        <div className="card" style={{ background: "#ffffff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <PieChart size={18} color="#ea580c" />
            <h3 style={{ fontSize: "1.05rem", fontWeight: 600, color: "#0f172a" }}>Distribusi Kategori Pengeluaran</h3>
          </div>

          {(!financeSummary?.category_distribution || financeSummary.category_distribution.length === 0) ? (
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", textAlign: "center", padding: "1.5rem 0" }}>
              Belum ada data pengeluaran yang tercatat.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {financeSummary.category_distribution.map((cat, idx) => (
                <div key={idx}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: "0.25rem" }}>
                    <span style={{ fontWeight: 500, color: "#334155" }}>{cat.category}</span>
                    <span style={{ fontWeight: 600, color: "#0f172a" }}>{formatRupiah(cat.total_spent)} ({cat.percentage}%)</span>
                  </div>
                  <div style={{ width: "100%", height: "6px", background: "#f1f5f9", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{
                      width: `${Math.min(cat.percentage, 100)}%`,
                      height: "100%",
                      background: "#4f46e5",
                      borderRadius: "3px"
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Transactions Table */}
        <div className="card" style={{ background: "#ffffff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 600, color: "#0f172a" }}>Tabel Catatan Keuangan Terkini</h3>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>20 catatan terakhir</span>
          </div>

          {(!financeSummary?.recent_transactions || financeSummary.recent_transactions.length === 0) ? (
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", textAlign: "center", padding: "1.5rem 0" }}>
              Belum ada catatan transaksi di dalam tabel.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "380px", overflowY: "auto" }}>
              {financeSummary.recent_transactions.map((tx) => (
                <div
                  key={tx.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.6rem 0.75rem",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "0.5rem"
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <span className={`badge ${tx.entry_type === "income" ? "badge-income" : "badge-expense"}`} style={{ fontSize: "0.65rem" }}>
                        {tx.entry_type === "income" ? "+" : "-"}
                      </span>
                      <strong style={{ fontSize: "0.85rem", color: "#0f172a" }}>{tx.category}</strong>
                    </div>
                    {tx.note && (
                      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>{tx.note}</p>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.9rem", color: tx.entry_type === "income" ? "#0284c7" : "#e11d48" }}>
                      {tx.entry_type === "income" ? "+" : "-"}{formatRupiah(tx.amount)}
                    </span>
                    <button
                      onClick={() => handleDelete(tx.id)}
                      style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", padding: "0.2rem" }}
                      title="Hapus Transaksi"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
