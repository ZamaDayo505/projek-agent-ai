import React from "react";
import { LayoutDashboard, Flame, Wallet, MessageSquareHeart, BookOpen, Settings, Sparkles } from "lucide-react";

const NAV_ITEMS = [
  { id: "dashboard",  label: "Dashboard",      icon: LayoutDashboard },
  { id: "github",     label: "GitHub Streak",  icon: Flame },
  { id: "finance",    label: "Keuangan",        icon: Wallet },
  { id: "homework",   label: "Daftar PR",       icon: BookOpen },
  { id: "curhat",     label: "Ruang Curhat",    icon: MessageSquareHeart },
];

export function Navbar({ activeTab, setActiveTab, streakData, onOpenSettings }) {
  return (
    <header style={{
      borderBottom: "1px solid rgba(130,100,255,0.15)",
      background: "rgba(10,10,26,0.85)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      position: "sticky",
      top: 0,
      zIndex: 50,
      boxShadow: "0 4px 24px rgba(0,0,0,0.4)"
    }}>
      <div className="app-container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1.5rem" }}>

        {/* Brand */}
        <div
          style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}
          onClick={() => setActiveTab("dashboard")}
        >
          <div style={{
            width: "2.4rem", height: "2.4rem",
            borderRadius: "0.75rem",
            background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 16px rgba(139,92,246,0.5)",
            fontSize: "1.2rem"
          }}>
            ✦
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "#f0eeff", letterSpacing: "-0.02em", fontFamily: "var(--font-display)" }}>
              DevCompanion
            </div>
            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", letterSpacing: "0.04em" }}>
              Streak • Keuangan • Curhat
            </div>
          </div>
        </div>

        {/* Navigation Pills */}
        <nav style={{ display: "flex", alignItems: "center", gap: "0.2rem", background: "rgba(255,255,255,0.04)", padding: "0.3rem", borderRadius: "1rem", border: "1px solid rgba(130,100,255,0.15)" }}>
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                style={{
                  display: "flex", alignItems: "center", gap: "0.4rem",
                  padding: "0.42rem 0.85rem",
                  borderRadius: "0.7rem",
                  fontSize: "0.83rem",
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? "#fff" : "var(--text-sub)",
                  background: isActive ? "linear-gradient(135deg, #7c3aed, #4f46e5)" : "transparent",
                  border: "1px solid transparent",
                  borderColor: isActive ? "rgba(139,92,246,0.4)" : "transparent",
                  boxShadow: isActive ? "0 4px 14px rgba(139,92,246,0.35)" : "none",
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                  whiteSpace: "nowrap"
                }}
              >
                <Icon size={14} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Streak Badge + Settings */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          {streakData && (
            <div
              className={`badge ${streakData.committed_today ? "badge-success" : "badge-streak"}`}
              style={{ cursor: "pointer", padding: "0.35rem 0.75rem" }}
              onClick={() => setActiveTab("github")}
              title={streakData.reminder_message}
            >
              <Flame size={12} className={streakData.committed_today ? "" : "pulse-flame"} />
              <span>{streakData.current_streak} Hari</span>
            </div>
          )}

          <button
            className="btn btn-outline"
            style={{ padding: "0.42rem", borderRadius: "0.6rem" }}
            onClick={onOpenSettings}
            title="Pengaturan"
          >
            <Settings size={16} color="var(--text-sub)" />
          </button>
        </div>

      </div>
    </header>
  );
}
