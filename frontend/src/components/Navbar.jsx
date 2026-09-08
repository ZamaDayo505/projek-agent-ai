import React from "react";
import { LayoutDashboard, Flame, Wallet, MessageSquareHeart, Settings } from "lucide-react";

export function Navbar({ activeTab, setActiveTab, streakData, onOpenSettings }) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "github", label: "GitHub Streak", icon: Flame },
    { id: "finance", label: "Keuangan", icon: Wallet },
    { id: "curhat", label: "Ruang Curhat", icon: MessageSquareHeart },
  ];

  return (
    <header style={{ borderBottom: "1px solid var(--border-color)", background: "#ffffff", position: "sticky", top: 0, zIndex: 30, boxShadow: "var(--shadow-sm)" }}>
      <div className="app-container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.85rem 1.5rem" }}>
        
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }} onClick={() => setActiveTab("dashboard")}>
          <div style={{
            width: "2.35rem",
            height: "2.35rem",
            borderRadius: "0.6rem",
            background: "#4f46e5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: "bold",
            fontSize: "1.1rem",
            boxShadow: "0 2px 8px rgba(79, 70, 229, 0.25)"
          }}>
            ✦
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "#0f172a", letterSpacing: "-0.02em" }}>DevCompanion</div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Streak • Keuangan • Curhat</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: "flex", alignItems: "center", gap: "0.25rem", background: "#f1f5f9", padding: "0.25rem", borderRadius: "0.65rem", border: "1px solid #e2e8f0" }}>
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  padding: "0.45rem 0.85rem",
                  borderRadius: "0.5rem",
                  fontSize: "0.85rem",
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "#4f46e5" : "#475569",
                  background: isActive ? "#ffffff" : "transparent",
                  border: isActive ? "1px solid #e2e8f0" : "1px solid transparent",
                  boxShadow: isActive ? "var(--shadow-sm)" : "none",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <IconComponent size={15} color={isActive ? "#4f46e5" : "currentColor"} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Section: Streak Pill & Settings */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
          {streakData && (
            <div
              className={`badge ${streakData.committed_today ? "badge-success" : "badge-streak"}`}
              style={{ cursor: "pointer", padding: "0.35rem 0.65rem" }}
              onClick={() => setActiveTab("github")}
              title={streakData.reminder_message}
            >
              <Flame size={13} className={streakData.committed_today ? "" : "pulse-flame"} />
              <span>{streakData.current_streak} Hari Streak</span>
            </div>
          )}

          <button
            className="btn btn-outline"
            style={{ padding: "0.45rem", borderRadius: "0.5rem" }}
            onClick={onOpenSettings}
            title="Pengaturan"
          >
            <Settings size={17} color="#475569" />
          </button>
        </div>

      </div>
    </header>
  );
}
