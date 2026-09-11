import React, { useState, useEffect, useCallback } from "react";
import { Navbar } from "./components/Navbar";
import { SettingsModal } from "./components/SettingsModal";
import { Dashboard } from "./pages/Dashboard";
import { GitHubView } from "./pages/GitHubView";
import { FinanceView } from "./pages/FinanceView";
import { HomeworkView } from "./pages/HomeworkView";
import { CurhatView } from "./pages/CurhatView";
import { apiClient } from "./api/client";
import { AlertCircle, ArrowRight } from "lucide-react";

export function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [streakData, setStreakData] = useState(null);
  const [financeSummary, setFinanceSummary] = useState(null);
  const [homeworkList, setHomeworkList] = useState([]);
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

  const loadHomework = useCallback(async () => {
    try {
      const data = await apiClient.getHomework();
      setHomeworkList(data);
    } catch (err) {
      console.error("Failed to fetch homework:", err);
    }
  }, []);

  useEffect(() => {
    loadSettings();
    loadStreak();
    loadFinance();
    loadHomework();
  }, [loadSettings, loadStreak, loadFinance, loadHomework]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
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
              background: "rgba(99,102,241,0.1)",
              border: "1px solid rgba(99,102,241,0.3)",
              borderRadius: "0.75rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "0.65rem",
              backdropFilter: "blur(8px)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <AlertCircle size={17} color="#818cf8" />
              <span style={{ fontSize: "0.85rem", color: "var(--text-sub)" }}>
                Masukkan <strong style={{ color: "var(--text-main)" }}>Username GitHub</strong> Anda di Pengaturan agar streak terdeteksi otomatis.
              </span>
            </div>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="btn btn-outline"
              style={{ fontSize: "0.78rem", padding: "0.35rem 0.75rem" }}
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
            homeworkList={homeworkList}
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

        {activeTab === "homework" && (
          <HomeworkView
            homeworkList={homeworkList}
            onRefreshHomework={loadHomework}
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
