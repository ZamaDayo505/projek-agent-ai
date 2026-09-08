import React from "react";
import { Flame, GitCommit, RefreshCw, GitBranch, Calendar, CheckCircle2, Clock } from "lucide-react";

export function GitHubView({ streakData, onRefreshStreak, isRefreshing, onOpenSettings }) {
  const commits = streakData?.recent_commits || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      
      {/* Header with Title & Action */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ fontSize: "1.45rem", fontWeight: 700, color: "#0f172a" }}>GitHub Streak & Commit Monitor</h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Melacak ritme commit akun <strong>@{streakData?.username || "belum diatur"}</strong> secara otomatis tanpa API key.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn btn-outline" onClick={onOpenSettings}>
            Ganti Akun
          </button>
          <button className="btn btn-primary" onClick={onRefreshStreak} disabled={isRefreshing}>
            <RefreshCw size={14} className={isRefreshing ? "pulse-flame" : ""} />
            <span>{isRefreshing ? "Menyinkronkan..." : "Sinkronkan Sekarang"}</span>
          </button>
        </div>
      </div>

      {/* Main Streak Hero Card */}
      <div className="card" style={{
        background: streakData?.committed_today ? "#f0fdf4" : "#fff7ed",
        border: streakData?.committed_today ? "1px solid #bbf7d0" : "1px solid #fed7aa",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: "1.5rem",
        alignItems: "center"
      }}>
        
        {/* Streak Counter */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <div style={{
            width: "4.75rem",
            height: "4.75rem",
            borderRadius: "1rem",
            background: streakData?.committed_today ? "#dcfce7" : "#ffedd5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.04)"
          }}>
            <Flame size={44} color={streakData?.committed_today ? "#059669" : "#ea580c"} className={streakData?.committed_today ? "" : "pulse-flame"} />
          </div>

          <div>
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
              Streak Aktif
            </span>
            <div style={{ fontSize: "2.75rem", fontWeight: 800, lineHeight: 1.1, color: streakData?.committed_today ? "#059669" : "#ea580c" }}>
              {streakData?.current_streak || 0} <span style={{ fontSize: "1.15rem", fontWeight: 600, color: "var(--text-muted)" }}>Hari</span>
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
              Rekor Terpanjang: <strong style={{ color: "#0f172a" }}>{streakData?.longest_streak || 0} hari berturut-turut</strong>
            </div>
          </div>
        </div>

        {/* Today's Status Banner */}
        <div style={{ background: "#ffffff", padding: "1.15rem", borderRadius: "0.75rem", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
            {streakData?.committed_today ? (
              <>
                <CheckCircle2 size={18} color="#059669" />
                <span style={{ fontWeight: 700, color: "#059669", fontSize: "0.95rem" }}>Target Hari Ini Tercapai!</span>
              </>
            ) : (
              <>
                <Clock size={18} color="#ea580c" />
                <span style={{ fontWeight: 700, color: "#ea580c", fontSize: "0.95rem" }}>Menunggu Commit Hari Ini</span>
              </>
            )}
          </div>
          <p style={{ fontSize: "0.85rem", color: "#334155", lineHeight: 1.45 }}>
            {streakData?.reminder_message}
          </p>
          {streakData?.last_commit_date && (
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.4rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <Calendar size={13} /> Terakhir commit terdeteksi: <strong>{streakData.last_commit_date}</strong>
            </div>
          )}
        </div>

      </div>

      {/* Recent Commit Timeline */}
      <div className="card" style={{ background: "#ffffff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <GitCommit size={18} color="#4f46e5" />
          <h3 style={{ fontSize: "1.05rem", fontWeight: 600, color: "#0f172a" }}>Aktivitas Commit Terkini</h3>
        </div>

        {commits.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--text-muted)" }}>
            <GitBranch size={32} style={{ opacity: 0.3, marginBottom: "0.5rem" }} />
            <p style={{ fontSize: "0.88rem" }}>Belum ada aktivitas commit publik yang terdeteksi untuk akun ini.</p>
            <p style={{ fontSize: "0.75rem", marginTop: "0.2rem" }}>Pastikan username GitHub sudah benar pada menu Pengaturan.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {commits.map((commit, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.75rem 0.9rem",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "0.55rem",
                  flexWrap: "wrap",
                  gap: "0.65rem"
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.65rem" }}>
                  <div style={{ marginTop: "0.3rem", width: "0.45rem", height: "0.45rem", borderRadius: "50%", background: "#4f46e5" }} />
                  <div>
                    <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "#0f172a" }}>
                      {commit.message}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.15rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ color: "#4f46e5", fontWeight: 500 }}>{commit.repo}</span>
                      <span>•</span>
                      <code style={{ background: "#e2e8f0", padding: "0.1rem 0.35rem", borderRadius: "0.25rem" }}>{commit.sha}</code>
                    </div>
                  </div>
                </div>

                <span className="badge" style={{ background: "#ffffff", border: "1px solid #e2e8f0", color: "#64748b" }}>
                  {commit.date}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
