import React from "react";
import {
  Flame, Wallet, MessageSquareHeart,
  TrendingUp, TrendingDown, ArrowRight,
  RefreshCw, Sparkles, CheckCircle2, Clock,
  BookOpen, Zap
} from "lucide-react";
import { Hololive3DHologram } from "../components/Hololive3DHologram";

export function Dashboard({
  streakData, financeSummary, homeworkList = [],
  onNavigate, onRefreshStreak, isRefreshingStreak
}) {
  const toRupiah = (n) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n || 0);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 11) return "Selamat Pagi ☀️";
    if (h < 15) return "Selamat Siang 🌤️";
    if (h < 19) return "Selamat Sore 🌆";
    return "Selamat Malam 🌙";
  };

  const pending = homeworkList.filter((t) => !t.is_completed);

  const StatCard = ({ icon: Icon, iconBg, title, subtitle, badge, badgeStyle, main, sub, footer, accentColor, onClick }) => (
    <div
      className="card card-interactive"
      style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", cursor: onClick ? "pointer" : "default" }}
      onClick={onClick}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.85rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
          <div style={{ width: "2.4rem", height: "2.4rem", borderRadius: "0.65rem", background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 12px ${accentColor}30` }}>
            <Icon size={19} color={accentColor} />
          </div>
          <div>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-main)" }}>{title}</h3>
            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{subtitle}</p>
          </div>
        </div>
        {badge && <span className="badge" style={badgeStyle}>{badge}</span>}
      </div>

      {/* Main number */}
      <div style={{ margin: "0.5rem 0" }}>
        <div style={{ fontSize: "2.2rem", fontWeight: 900, color: accentColor, lineHeight: 1, fontFamily: "var(--font-display)" }}>{main}</div>
        {sub && <div style={{ fontSize: "0.88rem", color: "var(--text-sub)", marginTop: "0.2rem" }}>{sub}</div>}
      </div>

      {/* Divider + Footer */}
      <hr className="card-divider" />
      {footer}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* ── Hero Greeting Banner ── */}
      <div className="card" style={{
        background: "linear-gradient(135deg, rgba(79,70,229,0.18) 0%, rgba(124,58,237,0.12) 50%, rgba(6,182,212,0.1) 100%)",
        borderColor: "rgba(139,92,246,0.25)",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem"
      }}>
        <div>
          <span style={{ fontSize: "0.7rem", color: "var(--primary-light)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Personal Developer &amp; Student Companion ✦
          </span>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 900, marginTop: "0.25rem", color: "var(--text-main)", fontFamily: "var(--font-display)" }}>
            {greeting()}, Zama! 👋
          </h2>
          <p style={{ color: "var(--text-sub)", fontSize: "0.87rem", marginTop: "0.3rem" }}>
            Jaga streak koding, selesaikan PR, catat keuangan, dan ngobrol bareng hologram.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.65rem" }}>
          <button className="btn btn-outline" onClick={onRefreshStreak} disabled={isRefreshingStreak}>
            <RefreshCw size={14} className={isRefreshingStreak ? "spin-slow" : ""} />
            {isRefreshingStreak ? "Memeriksa..." : "Cek Streak"}
          </button>
          <button className="btn btn-primary" onClick={() => onNavigate("curhat")}>
            <MessageSquareHeart size={14} />
            Mulai Curhat
          </button>
        </div>
      </div>

      {/* ── 3D Hologram Stage ── */}
      <Hololive3DHologram
        streakData={streakData}
        homeworkList={homeworkList}
        onNavigate={onNavigate}
      />

      {/* ── 4-Card Stats Grid ── */}
      <div className="grid-stats">

        {/* 1. GitHub Streak */}
        <StatCard
          icon={Flame}
          iconBg="rgba(251,146,60,0.15)"
          accentColor="#fb923c"
          title="GitHub Streak"
          subtitle={`@${streakData?.username || "belum diatur"}`}
          badge={
            streakData?.committed_today
              ? <><CheckCircle2 size={12} /> Commit Aman</>
              : <><Clock size={12} /> Belum Commit</>
          }
          badgeStyle={streakData?.committed_today ? {
            background: "rgba(52,211,153,0.15)", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)"
          } : {
            background: "rgba(251,146,60,0.15)", color: "#fb923c", border: "1px solid rgba(251,146,60,0.3)"
          }}
          main={streakData?.current_streak ?? 0}
          sub="hari berturut-turut"
          footer={
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Rekor: <strong style={{ color: "var(--text-sub)" }}>{streakData?.longest_streak ?? 0} hari</strong>
              </span>
              <button className="btn btn-ghost" style={{ fontSize: "0.78rem", color: "#fb923c", gap: "0.2rem" }} onClick={() => onNavigate("github")}>
                Detail <ArrowRight size={13} />
              </button>
            </div>
          }
        />

        {/* 2. Daftar PR */}
        <StatCard
          icon={BookOpen}
          iconBg="rgba(34,211,238,0.12)"
          accentColor="#22d3ee"
          title="Daftar PR / Tugas"
          subtitle="Target Belajar"
          badge={pending.length > 0 ? `${pending.length} Menunggu` : "Semua Beres ✓"}
          badgeStyle={pending.length > 0 ? {
            background: "rgba(251,113,133,0.15)", color: "#fb7185", border: "1px solid rgba(251,113,133,0.3)"
          } : {
            background: "rgba(52,211,153,0.15)", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)"
          }}
          main={pending.length}
          sub="tugas belum selesai"
          footer={
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Total: {homeworkList.length} PR</span>
              <button className="btn btn-ghost" style={{ fontSize: "0.78rem", color: "#22d3ee", gap: "0.2rem" }} onClick={() => onNavigate("homework")}>
                Buka PR <ArrowRight size={13} />
              </button>
            </div>
          }
        />

        {/* 3. Keuangan */}
        <StatCard
          icon={Wallet}
          iconBg="rgba(52,211,153,0.12)"
          accentColor="#34d399"
          title="Arus Kas"
          subtitle="Saldo & Kas"
          badge={financeSummary?.net_balance >= 0 ? "Surplus" : "Defisit"}
          badgeStyle={financeSummary?.net_balance >= 0 ? {
            background: "rgba(34,211,238,0.15)", color: "#22d3ee", border: "1px solid rgba(34,211,238,0.3)"
          } : {
            background: "rgba(251,113,133,0.15)", color: "#fb7185", border: "1px solid rgba(251,113,133,0.3)"
          }}
          main={toRupiah(financeSummary?.net_balance)}
          sub={
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.45rem", marginTop: "0.4rem" }}>
              {[
                { label: "Masuk", value: financeSummary?.total_income, color: "#34d399", Icon: TrendingUp },
                { label: "Keluar", value: financeSummary?.total_expense, color: "#fb7185", Icon: TrendingDown },
              ].map(({ label, value, color, Icon }) => (
                <div key={label} style={{ background: "rgba(255,255,255,0.04)", padding: "0.4rem 0.55rem", borderRadius: "0.45rem", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div style={{ fontSize: "0.67rem", color, fontWeight: 700, display: "flex", alignItems: "center", gap: "0.2rem" }}><Icon size={10} />{label}</div>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-main)" }}>{toRupiah(value)}</div>
                </div>
              ))}
            </div>
          }
          footer={
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{financeSummary?.recent_transactions?.length ?? 0} catatan</span>
              <button className="btn btn-ghost" style={{ fontSize: "0.78rem", color: "#34d399", gap: "0.2rem" }} onClick={() => onNavigate("finance")}>
                Catat Kas <ArrowRight size={13} />
              </button>
            </div>
          }
        />

        {/* 4. Ruang Curhat */}
        <StatCard
          icon={MessageSquareHeart}
          iconBg="rgba(244,114,182,0.12)"
          accentColor="#f472b6"
          title="Ruang Curhat"
          subtitle="Teman Bicara AI"
          badge={<><Sparkles size={11} /> Siap Dengar</>}
          badgeStyle={{ background: "rgba(244,114,182,0.12)", color: "#f472b6", border: "1px solid rgba(244,114,182,0.3)" }}
          main={<span style={{ fontSize: "2rem" }}>🫂</span>}
          sub={
            <p style={{ fontSize: "0.8rem", fontStyle: "italic", color: "var(--text-sub)", marginTop: "0.3rem", lineHeight: 1.45 }}>
              "Penat koding atau PR numpuk? Tumpahkan saja di sini."
            </p>
          }
          footer={
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.75rem", color: "#f472b6", fontWeight: 500 }}>Ruang privat</span>
              <button className="btn btn-ghost" style={{ fontSize: "0.78rem", color: "#f472b6", gap: "0.2rem" }} onClick={() => onNavigate("curhat")}>
                Ngobrol <ArrowRight size={13} />
              </button>
            </div>
          }
        />

      </div>
    </div>
  );
}
