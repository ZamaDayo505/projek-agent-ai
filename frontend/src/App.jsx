import React, { useState, useEffect, useCallback } from "react";
import { Navbar } from "./components/Navbar";
import { SettingsModal } from "./components/SettingsModal";
import { Dashboard } from "./pages/Dashboard";
import { GitHubView } from "./pages/GitHubView";
import { FinanceView } from "./pages/FinanceView";
import { CurhatView } from "./pages/CurhatView";
import { apiClient } from "./api/client";
import { AlertCircle, ArrowRight } from "lucide-react";

export function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [streakData, setStreakData] = useState(null);
  const [financeSummary, setFinanceSummary] = useState(null);
  const [isRefreshingStreak, setIsRefreshingStreak] = useState(false);
  const [systemSettings, setSystemSettings] = useState({ has_openai_key: false, github_username: "" });

  const loadSettings = useCallback(async () => {
    try {
      const settings = await apiClient.getSettings();
      setSystemSettings(settings);
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    }
  }, []);

  const loadStreak = useCallback(async () => {
    setIsRefreshingStreak(true);
    try {
      const data = await apiClient.getStreak();
      setStreakData(data);
    } catch (err) {
      console.error("Failed to fetch streak:", err);
    } finally {
      setIsRefreshingStreak(false);
    }
  }, []);

  const loadFinance = useCallback(async () => {
    try {
      const data = await apiClient.getFinanceSummary();
      setFinanceSummary(data);
    } catch (err) {
      console.error("Failed to fetch finance:", err);
    }
  }, []);

  useEffect(() => {
    loadSettings();
    loadStreak();
    loadFinance();
  }, [loadSettings, loadStreak, loadFinance]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-primary)" }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        streakData={streakData}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <main className="app-container" style={{ flex: 1, paddingBottom: "3rem" }}>
        
        {/* Setup Prompt Banner if GitHub Username is not configured */}
        {!systemSettings.github_username && (
          <div
            style={{
              marginBottom: "1.25rem",
              padding: "0.75rem 1.15rem",
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: "0.65rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "0.65rem",
              boxShadow: "var(--shadow-sm)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <AlertCircle size={17} color="#3b82f6" />
              <span style={{ fontSize: "0.85rem", color: "#1e40af" }}>
                Masukkan <strong>Username GitHub</strong> Anda di menu Pengaturan agar streak dan aktivitas commit langsung terdeteksi otomatis.
              </span>
            </div>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="btn btn-outline"
              style={{ fontSize: "0.78rem", padding: "0.35rem 0.75rem", borderColor: "#93c5fd", color: "#1d4ed8" }}
            >
              Atur Sekarang <ArrowRight size={13} />
            </button>
          </div>
        )}

        {/* Dynamic Tab Rendering */}
        {activeTab === "dashboard" && (
          <Dashboard
            streakData={streakData}
            financeSummary={financeSummary}
            onNavigate={setActiveTab}
            onRefreshStreak={loadStreak}
            isRefreshingStreak={isRefreshingStreak}
          />
        )}

        {activeTab === "github" && (
          <GitHubView
            streakData={streakData}
            onRefreshStreak={loadStreak}
            isRefreshing={isRefreshingStreak}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}

        {activeTab === "finance" && (
          <FinanceView
            financeSummary={financeSummary}
            onRefreshFinance={loadFinance}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}

        {activeTab === "curhat" && (
          <CurhatView onOpenSettings={() => setIsSettingsOpen(true)} />
        )}
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSettingsSaved={() => {
          loadSettings();
          loadStreak();
        }}
      />
    </div>
  );
}

export default App;
