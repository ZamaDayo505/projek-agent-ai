import React, { useState, useEffect } from "react";
import { Sparkles, MessageCircle, BookOpen, Heart, Volume2 } from "lucide-react";

export function MikuHologram({ streakData, homeworkList = [], onNavigate }) {
  const [reactionIndex, setReactionIndex] = useState(0);
  const [isBouncing, setIsBouncing] = useState(false);
  const [isHologramOn, setIsHologramOn] = useState(true);

  const pendingHomework = homeworkList.filter((item) => !item.is_completed);
  const pendingCount = pendingHomework.length;
  const currentStreak = streakData?.current_streak || 0;

  const mikuDialogues = [
    `Halo Zama! Gimana kabarmu hari ini? Semoga harimu menyenangkan ya~ Kalau capek koding, rehat sejenak yuk! 🩵`,
    pendingCount > 0
      ? `Miku ingetin nih, ada ${pendingCount} PR yang menunggu untuk diselesaikan! Mau Miku temani ngerjainnya? 📚`
      : `Wah keren! Semua PR kamu sudah selesai! Kamu rajin banget deh hari ini! ✨`,
    streakData?.committed_today
      ? `Streak GitHub kamu hari ini (${currentStreak} hari) aman dan menyala! Kerja bagus! 🔥`
      : `Hari ini belum commit ke GitHub nih. Yuk sempatkan push satu commit sebelum tengah malam ya! ⏳`,
    `Jangan lupa minum air putih dan jangan begadang terlalu larut ya, kesehatanmu penting banget! 💧`,
    `Kamu pasti bisa menyelesaikan semua targetmu hari ini! Miku selalu dukung kamu dari sini! 🎵`
  ];

  const handleMikuClick = () => {
    setIsBouncing(true);
    setReactionIndex((prev) => (prev + 1) % mikuDialogues.length);
    setTimeout(() => setIsBouncing(false), 600);
  };

  const handleAskMood = () => {
    setReactionIndex(0);
    setIsBouncing(true);
    setTimeout(() => setIsBouncing(false), 600);
  };

  const handleCheckHomework = () => {
    setReactionIndex(1);
    setIsBouncing(true);
    setTimeout(() => setIsBouncing(false), 600);
  };

  const handleCheerUp = () => {
    setReactionIndex(4);
    setIsBouncing(true);
    setTimeout(() => setIsBouncing(false), 600);
  };

  if (!isHologramOn) {
    return (
      <div style={{ textAlign: "right", marginBottom: "0.5rem" }}>
        <button
          onClick={() => setIsHologramOn(true)}
          className="btn btn-outline"
          style={{ fontSize: "0.75rem", padding: "0.3rem 0.65rem", borderColor: "#22d3ee", color: "#0891b2" }}
        >
          ✦ Tampilkan Hologram Miku
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "relative",
        background: "linear-gradient(135deg, rgba(236, 254, 255, 0.8) 0%, rgba(240, 253, 250, 0.9) 100%)",
        border: "1px solid rgba(34, 211, 238, 0.4)",
        borderRadius: "1rem",
        padding: "1.25rem 1.5rem",
        boxShadow: "0 8px 24px rgba(6, 182, 212, 0.12)",
        overflow: "hidden",
        marginBottom: "1.5rem",
      }}
    >
      {/* Background Holographic Glow & Grid Lines */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(to right, rgba(6, 182, 212, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(6, 182, 212, 0.05) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          pointerEvents: "none",
        }}
      />

      {/* Top Bar inside Hologram */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 10, marginBottom: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#06b6d4",
              boxShadow: "0 0 8px #06b6d4",
              display: "inline-block",
            }}
          />
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#0891b2", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Holographic Companion System // Hatsune Miku 01
          </span>
        </div>

        <button
          onClick={() => setIsHologramOn(false)}
          style={{
            background: "transparent",
            border: "none",
            color: "#94a3b8",
            fontSize: "0.72rem",
            cursor: "pointer",
          }}
        >
          Sembunyikan
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "1.75rem", flexWrap: "wrap", position: "relative", zIndex: 10 }}>
        
        {/* Hologram Miku Avatar & Projector Base */}
        <div
          onClick={handleMikuClick}
          title="Klik Miku untuk berinteraksi!"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            cursor: "pointer",
            position: "relative",
            minWidth: "110px",
            userSelect: "none",
          }}
        >
          {/* Miku Chibi Holographic Illustration with Twin Tails */}
          <div
            style={{
              transform: isBouncing ? "scale(1.15) translateY(-8px)" : "scale(1)",
              transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
              position: "relative",
              filter: "drop-shadow(0 0 12px rgba(34, 211, 238, 0.75))",
            }}
          >
            <svg width="105" height="120" viewBox="0 0 100 115" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Left Twin-tail */}
              <path
                d="M32 40 C 12 48, 5 75, 10 100 C 15 105, 25 85, 28 65 Z"
                fill="url(#mikuHairGrad)"
                opacity="0.9"
              />
              {/* Right Twin-tail */}
              <path
                d="M68 40 C 88 48, 95 75, 90 100 C 85 105, 75 85, 72 65 Z"
                fill="url(#mikuHairGrad)"
                opacity="0.9"
              />

              {/* Head / Face */}
              <circle cx="50" cy="45" r="22" fill="#fff5eb" stroke="#22d3ee" strokeWidth="1.5" />

              {/* Hair Front Bangs */}
              <path
                d="M30 38 C 36 24, 64 24, 70 38 C 65 34, 58 40, 50 36 C 42 40, 35 34, 30 38 Z"
                fill="url(#mikuHairGrad)"
              />
              <path d="M47 36 L 50 44 L 53 36 Z" fill="url(#mikuHairGrad)" />

              {/* Eyes */}
              <ellipse cx="42" cy="46" rx="3.2" ry="4.5" fill="#0891b2" />
              <ellipse cx="58" cy="46" rx="3.2" ry="4.5" fill="#0891b2" />
              <circle cx="43" cy="44.5" r="1.2" fill="#ffffff" />
              <circle cx="59" cy="44.5" r="1.2" fill="#ffffff" />

              {/* Blushing Cheeks */}
              <ellipse cx="37" cy="51" rx="2.5" ry="1.2" fill="#fda4af" opacity="0.8" />
              <ellipse cx="63" cy="51" rx="2.5" ry="1.2" fill="#fda4af" opacity="0.8" />

              {/* Cute Smile */}
              <path d="M47 53 Q 50 56 53 53" stroke="#e11d48" strokeWidth="1.2" fill="none" strokeLinecap="round" />

              {/* Headset with red ribbon */}
              <rect x="25" y="40" width="4" height="9" rx="2" fill="#334155" />
              <rect x="71" y="40" width="4" height="9" rx="2" fill="#334155" />
              <path d="M26 40 C 26 22, 74 22, 74 40" stroke="#334155" strokeWidth="2" fill="none" />
              <rect x="23" y="32" width="6" height="5" rx="1" fill="#ef4444" />
              <rect x="71" y="32" width="6" height="5" rx="1" fill="#ef4444" />

              {/* Body / Outfit */}
              <path d="M40 67 L 43 90 L 57 90 L 60 67 Z" fill="#e2e8f0" stroke="#06b6d4" strokeWidth="1.2" />
              <polygon points="50,70 47,85 53,85" fill="#06b6d4" />
              <rect x="42" y="87" width="16" height="7" fill="#0891b2" />

              {/* Gradients */}
              <defs>
                <linearGradient id="mikuHairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="50%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#0284c7" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Hologram Emitter / Projector Ring Base */}
          <div
            style={{
              width: "78px",
              height: "14px",
              borderRadius: "50%",
              background: "radial-gradient(ellipse, rgba(34, 211, 238, 0.6) 0%, rgba(6, 182, 212, 0.1) 70%, transparent 100%)",
              border: "1.5px solid #22d3ee",
              boxShadow: "0 0 16px #22d3ee",
              marginTop: "-6px",
            }}
          />

          <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#0891b2", marginTop: "0.3rem" }}>
            Tap Miku! ✦
          </span>
        </div>

        {/* Interactive Floating Pop-up Chat Bubble */}
        <div style={{ flex: 1, minWidth: "260px" }}>
          
          <div
            style={{
              background: "#ffffff",
              border: "1.5px solid rgba(6, 182, 212, 0.35)",
              borderRadius: "0.875rem",
              padding: "1rem 1.25rem",
              boxShadow: "0 4px 16px rgba(6, 182, 212, 0.12)",
              position: "relative",
            }}
          >
            {/* Pointer arrow to Miku */}
            <div
              style={{
                position: "absolute",
                left: "-8px",
                top: "32px",
                width: "0",
                height: "0",
                borderTop: "7px solid transparent",
                borderBottom: "7px solid transparent",
                borderRight: "8px solid #ffffff",
              }}
            />

            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.35rem" }}>
              <Sparkles size={14} color="#06b6d4" />
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#0e7490" }}>
                Hatsune Miku Menyapa:
              </span>
            </div>

            <p style={{ fontSize: "0.92rem", color: "#0f172a", lineHeight: 1.5, fontWeight: 500 }}>
              "{mikuDialogues[reactionIndex]}"
            </p>

            {/* Interactive Response Buttons */}
            <div style={{ display: "flex", gap: "0.45rem", marginTop: "0.85rem", flexWrap: "wrap" }}>
              <button
                onClick={handleAskMood}
                className="btn btn-outline"
                style={{ fontSize: "0.75rem", padding: "0.3rem 0.65rem", borderRadius: "9999px", borderColor: "#a5f3fc", color: "#0891b2" }}
              >
                <MessageCircle size={12} /> Tanya Kabar
              </button>

              <button
                onClick={handleCheckHomework}
                className="btn btn-outline"
                style={{ fontSize: "0.75rem", padding: "0.3rem 0.65rem", borderRadius: "9999px", borderColor: "#a5f3fc", color: "#0891b2" }}
              >
                <BookOpen size={12} /> Cek PR ({pendingCount})
              </button>

              <button
                onClick={handleCheerUp}
                className="btn btn-outline"
                style={{ fontSize: "0.75rem", padding: "0.3rem 0.65rem", borderRadius: "9999px", borderColor: "#a5f3fc", color: "#0891b2" }}
              >
                <Heart size={12} color="#ec4899" /> Minta Semangat!
              </button>

              {pendingCount > 0 && (
                <button
                  onClick={() => onNavigate("homework")}
                  className="btn btn-primary"
                  style={{ fontSize: "0.75rem", padding: "0.3rem 0.75rem", borderRadius: "9999px", background: "#0891b2" }}
                >
                  Buka Daftar PR &rarr;
                </button>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
