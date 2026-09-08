import React, { useState, useEffect } from "react";
import { X, Key, GitBranch, Check, Copy } from "lucide-react";
import { apiClient } from "../api/client";

export function SettingsModal({ isOpen, onClose, onSettingsSaved }) {
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [githubUser, setGithubUser] = useState("");
  const [reminderHour, setReminderHour] = useState(20);
  const [hasExistingKey, setHasExistingKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState("");

  const webhookUrl = "http://localhost:8000/api/github/webhook";

  useEffect(() => {
    if (isOpen) {
      apiClient.getSettings().then((res) => {
        setHasExistingKey(res.has_openai_key);
        setGithubUser(res.github_username || "");
        setReminderHour(res.reminder_hour || 20);
      }).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await apiClient.updateSettings({
        openai_api_key: apiKeyInput ? apiKeyInput : undefined,
        github_username: githubUser,
        reminder_hour: Number(reminderHour),
      });
      setNotificationMsg("Pengaturan berhasil disimpan!");
      setTimeout(() => {
        setNotificationMsg("");
        onSettingsSaved();
        onClose();
      }, 800);
    } catch (err) {
      alert("Gagal menyimpan pengaturan: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(15, 23, 42, 0.5)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 50,
      padding: "1rem"
    }}>
      <div className="card" style={{ maxWidth: "520px", width: "100%", background: "#ffffff", boxShadow: "var(--shadow-lg)" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#0f172a" }}>Pengaturan Akun & Model</h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Konfigurasi username GitHub & kunci AI</p>
          </div>
          <button onClick={onClose} className="btn btn-outline" style={{ padding: "0.4rem", borderRadius: "50%" }}>
            <X size={16} />
          </button>
        </div>

        {notificationMsg && (
          <div style={{ padding: "0.6rem 1rem", background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "0.5rem", color: "#059669", fontSize: "0.85rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Check size={16} /> {notificationMsg}
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          
          {/* GitHub Username */}
          <div>
            <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.35rem" }}>
              <GitBranch size={15} color="#ea580c" /> Username GitHub (Gratis & Publik)
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="contoh: torvalds atau username-github-kamu"
              value={githubUser}
              onChange={(e) => setGithubUser(e.target.value)}
              required
            />
            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              <strong>Tidak perlu API key</strong>. Cukup masukkan nama akun GitHub Anda untuk melacak commit dan streak secara otomatis.
            </p>
          </div>

          {/* OpenAI Key */}
          <div>
            <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.35rem" }}>
              <Key size={15} color="#4f46e5" /> OpenAI API Key (Opsional)
              {hasExistingKey && (
                <span className="badge badge-success" style={{ marginLeft: "auto", fontSize: "0.68rem" }}>
                  Tersimpan
                </span>
              )}
            </label>
            <input
              type="password"
              className="input-field"
              placeholder={hasExistingKey ? "••••••••••••••••••••••••••••••••" : "sk-..."}
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
            />
            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              Jika dikosongkan, fitur input suara/teks keuangan tetap bekerja memakai <strong>AI Cerdas Lokal</strong> bawaan aplikasi tanpa biaya.
            </p>
          </div>

          {/* Webhook helper */}
          <div style={{ background: "#f8fafc", border: "1px dashed #cbd5e1", padding: "0.85rem", borderRadius: "0.625rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.35rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569" }}>Webhook URL (Deteksi Commit Instan)</span>
              <button
                type="button"
                onClick={() => copyToClipboard(webhookUrl)}
                style={{ background: "transparent", border: "none", color: "#4f46e5", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.72rem", fontWeight: 600 }}
              >
                {copiedWebhook ? <Check size={12} /> : <Copy size={12} />} {copiedWebhook ? "Tersalin!" : "Salin URL"}
              </button>
            </div>
            <code style={{ fontSize: "0.72rem", wordBreak: "break-all", color: "#334155", background: "#e2e8f0", padding: "0.2rem 0.4rem", borderRadius: "0.25rem", display: "block" }}>
              {webhookUrl}
            </code>
            <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>
              Bisa dipasang di repo GitHub &rarr; Settings &rarr; Webhooks (Event: Pushes) agar commit terdeteksi detik itu juga.
            </p>
          </div>

          {/* Footer Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.25rem" }}>
            <button type="button" onClick={onClose} className="btn btn-outline">
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? "Menyimpan..." : "Simpan Pengaturan"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
