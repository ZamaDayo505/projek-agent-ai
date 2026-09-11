import React from "react";
import {
  Flame,
  Wallet,
  MessageSquareHeart,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  Clock,
  BookOpen,
  CheckSquare
} from "lucide-react";
import { Hololive3DHologram } from "../components/Hololive3DHologram";

export function Dashboard({
  streakData,
  financeSummary,
  homeworkList = [],
  onNavigate,
  onRefreshStreak,
  isRefreshingStreak
}) {
  const formatRupiah = (num) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(num || 0);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return "Selamat Pagi";
    if (hour < 15) return "Selamat Siang";
    if (hour < 19) return "Selamat Sore";
    return "Selamat Malam";
  };

  const pendingHomework = homeworkList.filter((item) => !item.is_completed);
  const pendingCount = pendingHomework.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      
      {/* Top Greeting Banner */}
      <div
        className="card"
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem"
        }}
      >
        <div>
          <span style={{ fontSize: "0.75rem", color: "#4f46e5", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Personal Developer & Student Companion
          </span>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: "0.2rem", color: "#0f172a" }}>
            {getGreeting()}, Rekan Developer! 👋
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginTop: "0.2rem" }}>
            Jaga streak koding, kelola PR & tugas sekolah, catat keuangan suara, dan temani harimu bersama Miku.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.65rem" }}>
          <button className="btn btn-outline" onClick={onRefreshStreak} disabled={isRefreshingStreak}>
            <RefreshCw size={14} className={isRefreshingStreak ? "pulse-flame" : ""} />
            <span>{isRefreshingStreak ? "Memeriksa..." : "Cek Streak"}</span>
          </button>
          <button className="btn btn-primary" onClick={() => onNavigate("curhat")}>
            <MessageSquareHeart size={14} />
            <span>Mulai Curhat</span>
          </button>
        </div>
      </div>

      {/* Interactive Hololive 3D Hologram Stage */}
      <Hololive3DHologram
        streakData={streakData}
        homeworkList={homeworkList}
        onNavigate={onNavigate}
      />

      {/* 4 Core Highlight Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))", gap: "1.25rem" }}>
        
        {/* 1. GitHub Streak Card */}
        <div className="card card-interactive" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#ffffff" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.85rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <div style={{ width: "2.25rem", height: "2.25rem", borderRadius: "0.5rem", background: "#fff7ed", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Flame size={20} color="#ea580c" />
                </div>
                <div>
                  <h3 style={{ fontSize: "0.98rem", fontWeight: 600, color: "#0f172a" }}>GitHub Streak</h3>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>@{streakData?.username || "belum diatur"}</p>
                </div>
              </div>
              <span className={`badge ${streakData?.committed_today ? "badge-success" : "badge-streak"}`}>
                {streakData?.committed_today ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                {streakData?.committed_today ? "Commit Aman" : "Belum Commit"}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", margin: "0.85rem 0" }}>
              <span style={{ fontSize: "2.4rem", fontWeight: 800, color: streakData?.committed_today ? "#059669" : "#ea580c" }}>
                {streakData?.current_streak || 0}
              </span>
              <span style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>hari berturut-turut</span>
            </div>

            <p style={{ fontSize: "0.82rem", color: "#475569", lineHeight: 1.45 }}>
              {streakData?.reminder_message || "Sedang memeriksa status streak..."}
            </p>
          </div>

          <div style={{ marginTop: "1.25rem", paddingTop: "0.85rem", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Rekor: <strong style={{ color: "#0f172a" }}>{streakData?.longest_streak || 0} hari</strong>
            </span>
            <button
              onClick={() => onNavigate("github")}
              style={{ background: "transparent", border: "none", color: "#4f46e5", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem" }}
            >
              Lihat Detail <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* 2. Daftar PR Card */}
        <div className="card card-interactive" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#ffffff" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.85rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <div style={{ width: "2.25rem", height: "2.25rem", borderRadius: "0.5rem", background: "#ecfeff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <BookOpen size={20} color="#0891b2" />
                </div>
                <div>
                  <h3 style={{ fontSize: "0.98rem", fontWeight: 600, color: "#0f172a" }}>Daftar PR / Tugas</h3>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Target Belajar</p>
                </div>
              </div>
              <span className="badge" style={{ background: pendingCount > 0 ? "#fff1f2" : "#ecfdf5", color: pendingCount > 0 ? "#e11d48" : "#059669", border: pendingCount > 0 ? "1px solid #fecdd3" : "1px solid #d1fae5" }}>
                {pendingCount > 0 ? `${pendingCount} Menunggu` : "Semua Beres"}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", margin: "0.85rem 0" }}>
              <span style={{ fontSize: "2.4rem", fontWeight: 800, color: pendingCount > 0 ? "#0891b2" : "#059669" }}>
                {pendingCount}
              </span>
              <span style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>tugas belum selesai</span>
            </div>

            <p style={{ fontSize: "0.82rem", color: "#475569", lineHeight: 1.45 }}>
              {pendingCount > 0
                ? `Tugas terdekat: "${pendingHomework[0].title}" (${pendingHomework[0].subject}).`
                : "Hebat! Semua pekerjaan rumah sudah selesai dikerjakan."}
            </p>
          </div>

          <div style={{ marginTop: "1.25rem", paddingTop: "0.85rem", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Total PR: {homeworkList.length}
            </span>
            <button
              onClick={() => onNavigate("homework")}
              style={{ background: "transparent", border: "none", color: "#0891b2", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem" }}
            >
              Buka PR <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* 3. Keuangan Card */}
        <div className="card card-interactive" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#ffffff" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.85rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <div style={{ width: "2.25rem", height: "2.25rem", borderRadius: "0.5rem", background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Wallet size={20} color="#059669" />
                </div>
                <div>
                  <h3 style={{ fontSize: "0.98rem", fontWeight: 600, color: "#0f172a" }}>Arus Kas Keuangan</h3>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Saldo & Kas</p>
                </div>
              </div>
              <span className={`badge ${financeSummary?.net_balance >= 0 ? "badge-income" : "badge-expense"}`}>
                {financeSummary?.net_balance >= 0 ? "Surplus" : "Defisit"}
              </span>
            </div>

            <div style={{ margin: "0.75rem 0" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Saldo Bersih</span>
              <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "#0f172a" }}>
                {formatRupiah(financeSummary?.net_balance)}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginTop: "0.3rem" }}>
              <div style={{ background: "#f8fafc", padding: "0.45rem 0.6rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "0.68rem", color: "#059669", fontWeight: 600 }}>Masuk</div>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0f172a" }}>
                  {formatRupiah(financeSummary?.total_income)}
                </div>
              </div>

              <div style={{ background: "#f8fafc", padding: "0.45rem 0.6rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "0.68rem", color: "#e11d48", fontWeight: 600 }}>Keluar</div>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0f172a" }}>
                  {formatRupiah(financeSummary?.total_expense)}
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: "1.25rem", paddingTop: "0.85rem", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              {financeSummary?.recent_transactions?.length || 0} catatan
            </span>
            <button
              onClick={() => onNavigate("finance")}
              style={{ background: "transparent", border: "none", color: "#4f46e5", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem" }}
            >
              Catat Kas <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* 4. Curhat Card */}
        <div className="card card-interactive" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#ffffff" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.85rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <div style={{ width: "2.25rem", height: "2.25rem", borderRadius: "0.5rem", background: "#fdf4ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <MessageSquareHeart size={20} color="#c026d3" />
                </div>
                <div>
                  <h3 style={{ fontSize: "0.98rem", fontWeight: 600, color: "#0f172a" }}>Ruang Curhat</h3>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Teman Bicara</p>
                </div>
              </div>
              <span className="badge" style={{ background: "#fdf4ff", color: "#c026d3", border: "1px solid #f5d0fe" }}>
                <Sparkles size={12} /> Siap Mendengar
              </span>
            </div>

            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "0.625rem", padding: "0.75rem", margin: "0.65rem 0" }}>
              <p style={{ fontSize: "0.8rem", fontStyle: "italic", color: "#334155", lineHeight: 1.4 }}>
                "Penat koding atau banyak PR numpuk? Tumpahkan saja keluh kesahmu di sini tanpa ragu."
              </p>
            </div>

            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
              Teman bicara yang mengerti realitas developer & siswa sekolah.
            </p>
          </div>

          <div style={{ marginTop: "1.25rem", paddingTop: "0.85rem", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.75rem", color: "#c026d3", fontWeight: 500 }}>Ruang privat</span>
            <button
              onClick={() => onNavigate("curhat")}
              style={{ background: "transparent", border: "none", color: "#4f46e5", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem" }}
            >
              Mulai Ngobrol <ArrowRight size={14} />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
