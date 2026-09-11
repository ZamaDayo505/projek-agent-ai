import React, { useEffect, useRef, useState, useCallback } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";
import * as THREE from "three";
import {
  Volume2, VolumeX, Music2, MessageCircle,
  ChevronRight, Loader2
} from "lucide-react";
import { hologramAudio } from "../utils/audioEffects";

// ─── Character config ─────────────────────────────────────────────────────────
const CHARS = {
  kobo: {
    name: "Kobo Kanaeru", badge: "Hololive ID Gen 3",
    color: "#38bdf8", glow: "rgba(56,189,248,0.5)", accentBg: "rgba(56,189,248,0.12)",
    emoji: "🌧️", vrmFile: "/models/kobo.vrm",
    buildDialogues: (p, s, c) => [
      `Eeeeyaaa! Halo Zama! Gimana kabarmu hari ini? Pawang hujan selalu nemenin kamu! 🌧️`,
      p > 0 ? `Woy! Ada ${p} PR belum kelar! Kerjain sekarang apa mau disamber petir? ⚡` : `Mantap bray! Semua PR beres! Kobo bangga sama kamu! 🌟`,
      c ? `Streak ${s} hari udah aman! Gacor bener dah kodingannya! 🔥` : `Hari ini belum commit! Push buruan sebelum jam 12! ⏳`,
      `Jangan lupa minum air putih ya, jangan cuma kopi terus! 💧`,
    ],
  },
  gura: {
    name: "Gawr Gura", badge: "Hololive EN",
    color: "#818cf8", glow: "rgba(129,140,248,0.5)", accentBg: "rgba(129,140,248,0.12)",
    emoji: "🦈", vrmFile: "/models/gura.vrm",
    buildDialogues: (p, s, c) => [
      `A! Hello Zama! How's your day? Shark is here to cheer you on! 🦈`,
      p > 0 ? `Hey! Still ${p} tasks left! Let's bite through them! 📚` : `Yay! All homework done! You're the apex student! ✨`,
      c ? `GitHub streak ${s} days strong! Keep it up! 🔥` : `Don't forget to push a commit before midnight! ⏳`,
      `Stay hydrated! Fish need water and so do programmers! 🌊`,
    ],
  },
  miku: {
    name: "Hatsune Miku", badge: "Vocaloid 01",
    color: "#22d3ee", glow: "rgba(34,211,238,0.5)", accentBg: "rgba(34,211,238,0.12)",
    emoji: "🎵", vrmFile: "/models/miku.vrm",
    buildDialogues: (p, s, c) => [
      `ミクだよ！元気してた、Zama？いつも応援しているよ！🩵`,
      p > 0 ? `${p}個の宿題がまだ残っているよ！ミクと一緒に頑張ろう！📚` : `すごい！全部の宿題が終わったね！本当に偉いよ！✨`,
      c ? `GitHubのストリーク${s}日！完璧だよ！🔥` : `今日はまだcommitしてないよ！夜中の前に押してね！⏳`,
      `ちょっと休んで、水を飲んでね！あなたの体が大事だから！💧`,
    ],
  },
};

// ─── 2D Canvas Hologram Renderer (fallback when no VRM) ──────────────────────
function draw2DHologram(canvas, charKey, tick, dancing, profile) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2;
  ctx.clearRect(0, 0, W, H);

  const col = profile.color;
  const glowCol = profile.glow;

  // Background radial
  const bg = ctx.createRadialGradient(cx, cy, 10, cx, cy, H * 0.65);
  bg.addColorStop(0, "rgba(20,10,50,0.85)");
  bg.addColorStop(1, "rgba(5,5,20,0)");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Platform ellipse
  const pY = H * 0.84;
  const pW = W * 0.38, pH = 14;
  const platGrad = ctx.createRadialGradient(cx, pY, 2, cx, pY, pW);
  platGrad.addColorStop(0, col);
  platGrad.addColorStop(0.5, glowCol.replace("0.5", "0.3"));
  platGrad.addColorStop(1, "transparent");
  ctx.beginPath();
  ctx.ellipse(cx, pY, pW, pH, 0, 0, Math.PI * 2);
  ctx.fillStyle = platGrad;
  ctx.fill();

  // Platform rings
  for (let r = 0; r < 2; r++) {
    ctx.beginPath();
    ctx.ellipse(cx, pY, pW * (0.7 + r * 0.35), pH * (0.6 + r * 0.3), 0, 0, Math.PI * 2);
    ctx.strokeStyle = r === 0 ? col : "rgba(139,92,246,0.7)";
    ctx.lineWidth = r === 0 ? 2 : 1;
    ctx.stroke();
  }

  // Body float
  const floatY = Math.sin(tick * 1.5) * (dancing ? 10 : 5);
  const bodyY = cy - 20 + floatY;

  // Hologram scan lines (on body area)
  ctx.save();
  ctx.globalAlpha = 0.07;
  for (let y = bodyY - 130; y < bodyY + 60; y += 4) {
    ctx.fillStyle = col;
    ctx.fillRect(cx - 80, y, 160, 1.5);
  }
  ctx.restore();

  // Body glow aura
  const aura = ctx.createRadialGradient(cx, bodyY, 20, cx, bodyY, 110);
  aura.addColorStop(0, glowCol.replace("0.5", "0.12"));
  aura.addColorStop(1, "transparent");
  ctx.fillStyle = aura;
  ctx.fillRect(cx - 120, bodyY - 140, 240, 210);

  // ─── Draw character based on charKey ─────────────────────────────────────
  const wobble = dancing ? Math.sin(tick * 8) * 6 : 0;
  ctx.save();
  ctx.translate(cx + wobble, bodyY);

  // Legs
  ctx.fillStyle = charKey === "gura" ? "#1e3a8a" : charKey === "miku" ? "#1e293b" : "#1e293b";
  ctx.beginPath(); ctx.roundRect(-22, 28, 16, 40, 4); ctx.fill();
  ctx.beginPath(); ctx.roundRect(6, 28, 16, 40, 4); ctx.fill();
  // Shoes
  ctx.fillStyle = "#0f172a";
  ctx.beginPath(); ctx.ellipse(-14, 68, 14, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(14, 68, 14, 7, 0, 0, Math.PI * 2); ctx.fill();

  // Body/dress
  const bodyCol = charKey === "gura" ? "#1e3a8a" : charKey === "miku" ? "#1e3a5f" : "#0369a1";
  ctx.fillStyle = bodyCol;
  ctx.beginPath(); ctx.roundRect(-32, -10, 64, 42, [6, 6, 18, 18]); ctx.fill();

  // Outfit detail / tie
  if (charKey === "miku") {
    ctx.fillStyle = "#22d3ee";
    ctx.fillRect(-3, -8, 6, 22);
    ctx.fillStyle = "#0e7490";
    ctx.beginPath(); ctx.roundRect(-28, -9, 56, 14, 4); ctx.fill(); // collar
  } else if (charKey === "gura") {
    ctx.fillStyle = "#93c5fd";
    ctx.beginPath(); ctx.roundRect(-28, -8, 56, 12, 4); ctx.fill();
    ctx.fillStyle = "#bfdbfe";
    ctx.fillRect(-3, -5, 6, 20);
  } else {
    ctx.fillStyle = "#facc15";
    ctx.beginPath(); ctx.roundRect(-30, -8, 60, 12, 4); ctx.fill(); // raincoat collar
  }

  // Arms
  const armSway = Math.sin(tick * 1.8) * (dancing ? 15 : 4);
  ctx.fillStyle = "#fde68a";
  // Left arm
  ctx.save();
  ctx.translate(-36, 2);
  ctx.rotate((-0.25 + armSway * 0.02) * Math.PI);
  ctx.beginPath(); ctx.roundRect(-7, 0, 14, 36, 7); ctx.fill();
  ctx.restore();
  // Right arm
  ctx.save();
  ctx.translate(36, 2);
  ctx.rotate((0.25 - armSway * 0.02) * Math.PI);
  ctx.beginPath(); ctx.roundRect(-7, 0, 14, 36, 7); ctx.fill();
  ctx.restore();

  // Neck
  ctx.fillStyle = "#fde68a";
  ctx.beginPath(); ctx.roundRect(-8, -22, 16, 14, 4); ctx.fill();

  // Head (round anime chibi)
  const headSwayX = Math.sin(tick * 1.1) * (dancing ? 6 : 2);
  ctx.save();
  ctx.translate(headSwayX, 0);

  // Head shadow
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.beginPath(); ctx.ellipse(2, -85, 42, 38, 0, 0, Math.PI * 2); ctx.fill();

  // Head base
  ctx.fillStyle = "#fef3c7";
  ctx.beginPath(); ctx.ellipse(0, -88, 40, 36, 0, 0, Math.PI * 2); ctx.fill();

  // Hair base (back)
  const hairCol = charKey === "gura" ? "#93c5fd" : charKey === "miku" ? "#06b6d4" : "#0284c7";
  ctx.fillStyle = hairCol;
  ctx.beginPath(); ctx.ellipse(0, -92, 42, 34, 0, 0, Math.PI); ctx.fill();

  // Face — eyes (anime big eyes)
  // Left eye
  ctx.fillStyle = "#fff";
  ctx.beginPath(); ctx.ellipse(-14, -89, 12, 10, -0.1, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = charKey === "gura" ? "#6366f1" : charKey === "miku" ? "#0891b2" : "#0284c7";
  ctx.beginPath(); ctx.ellipse(-14, -89, 8, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#000";
  ctx.beginPath(); ctx.ellipse(-14, -89, 5, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath(); ctx.ellipse(-11, -92, 2.5, 2.5, 0, 0, Math.PI * 2); ctx.fill();

  // Right eye
  ctx.fillStyle = "#fff";
  ctx.beginPath(); ctx.ellipse(14, -89, 12, 10, 0.1, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = charKey === "gura" ? "#6366f1" : charKey === "miku" ? "#0891b2" : "#0284c7";
  ctx.beginPath(); ctx.ellipse(14, -89, 8, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#000";
  ctx.beginPath(); ctx.ellipse(14, -89, 5, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath(); ctx.ellipse(17, -92, 2.5, 2.5, 0, 0, Math.PI * 2); ctx.fill();

  // Blush cheeks
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = "#f9a8d4";
  ctx.beginPath(); ctx.ellipse(-26, -83, 10, 6, 0.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(26, -83, 10, 6, -0.2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // Mouth (small cute smile)
  ctx.strokeStyle = "#e11d48";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, -78, 5, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();

  // Hair front bangs
  ctx.fillStyle = hairCol;
  ctx.beginPath();
  ctx.moveTo(-38, -100); ctx.quadraticCurveTo(-35, -78, -22, -76);
  ctx.quadraticCurveTo(-18, -100, -10, -102);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(38, -100); ctx.quadraticCurveTo(35, -78, 22, -76);
  ctx.quadraticCurveTo(18, -100, 10, -102);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-12, -104); ctx.quadraticCurveTo(0, -80, 12, -104);
  ctx.fill();

  // Character-specific accessories
  if (charKey === "kobo") {
    // Rain shaman buns
    const bunSway = Math.sin(tick * 2.5) * 8;
    ctx.fillStyle = hairCol;
    ctx.beginPath(); ctx.ellipse(-46 + bunSway * 0.3, -97, 16, 16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(46 - bunSway * 0.3, -97, 16, 16, 0, 0, Math.PI * 2); ctx.fill();
    // Rain shaman gem
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath(); ctx.ellipse(0, -126, 6, 6, 0, 0, Math.PI * 2); ctx.fill();
  } else if (charKey === "gura") {
    // Shark fin on head
    ctx.fillStyle = "#93c5fd";
    ctx.beginPath();
    ctx.moveTo(-8, -122); ctx.lineTo(0, -146); ctx.lineTo(8, -122);
    ctx.closePath(); ctx.fill();
    // Shark tail (animated)
    const tailAng = Math.sin(tick * 3) * 0.25;
    ctx.save();
    ctx.translate(0, 38);
    ctx.rotate(tailAng);
    ctx.fillStyle = "#1e3a8a";
    ctx.beginPath();
    ctx.moveTo(-8, 0); ctx.lineTo(-24, 28); ctx.lineTo(-6, 20); ctx.lineTo(0, 34);
    ctx.lineTo(6, 20); ctx.lineTo(24, 28); ctx.lineTo(8, 0);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  } else {
    // Miku twin tails (long animated)
    const tailFlow = Math.sin(tick * 1.8) * 12;
    ctx.strokeStyle = hairCol;
    ctx.lineWidth = 18;
    ctx.lineCap = "round";
    // Left tail
    ctx.beginPath();
    ctx.moveTo(-30, -92);
    ctx.bezierCurveTo(-60, -60, -70 + tailFlow, 0, -55 + tailFlow * 0.5, 60);
    ctx.stroke();
    // Right tail
    ctx.beginPath();
    ctx.moveTo(30, -92);
    ctx.bezierCurveTo(60, -60, 70 - tailFlow, 0, 55 - tailFlow * 0.5, 60);
    ctx.stroke();

    // Miku headset
    ctx.strokeStyle = "#0e7490";
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(0, -92, 46, -Math.PI, 0); ctx.stroke();
    ctx.fillStyle = "#0e7490";
    ctx.beginPath(); ctx.ellipse(-46, -92, 6, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(46, -92, 6, 9, 0, 0, Math.PI * 2); ctx.fill();
  }

  ctx.restore(); // head sway
  ctx.restore(); // body translate

  // Hologram particles floating up
  ctx.save();
  for (let i = 0; i < 12; i++) {
    const px = cx + Math.sin(i * 2.1 + tick * 0.8) * (60 + i * 8);
    const py = pY - ((tick * 30 + i * 28) % 220);
    const alpha = Math.max(0, 1 - py / 220) * 0.5;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = i % 2 === 0 ? col : "rgba(139,92,246,0.9)";
    ctx.beginPath();
    ctx.arc(px, py, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Bottom fade vignette
  const vignette = ctx.createLinearGradient(0, H * 0.75, 0, H);
  vignette.addColorStop(0, "transparent");
  vignette.addColorStop(1, "rgba(5,5,20,0.7)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, H * 0.75, W, H * 0.25);
}

// ─── Component ────────────────────────────────────────────────────────────────
export function Hololive3DHologram({ streakData, homeworkList = [], onNavigate }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const tickRef = useRef(0);
  const threeRef = useRef({ renderer: null, scene: null, camera: null, vrm: null, rafId: null });

  const [charKey, setCharKey] = useState("kobo");
  const [muted, setMuted] = useState(false);
  const [dancing, setDancing] = useState(false);
  const [dialogueIdx, setDialogueIdx] = useState(0);
  const [vrmStatus, setVrmStatus] = useState("idle"); // idle | loading | loaded | missing

  const dancingRef = useRef(false);
  const charKeyRef = useRef("kobo");

  const pendingCount = homeworkList.filter((h) => !h.is_completed).length;
  const streak = streakData?.current_streak ?? 0;
  const committed = !!streakData?.committed_today;

  const profile = CHARS[charKey];
  const dialogues = profile.buildDialogues(pendingCount, streak, committed);
  const currentDialogue = dialogues[dialogueIdx % dialogues.length];

  // Keep refs in sync
  useEffect(() => { dancingRef.current = dancing; }, [dancing]);
  useEffect(() => { charKeyRef.current = charKey; }, [charKey]);

  // ── VRM Loader ─────────────────────────────────────────────────────────────
  const loadVRM = useCallback(async (key) => {
    let vrmPath = CHARS[key]?.vrmFile || "/models/asset.vrm";

    try {
      const probe = await fetch(vrmPath, { method: "HEAD" });
      if (!probe.ok) {
        vrmPath = "/models/asset.vrm";
        const fallbackProbe = await fetch(vrmPath, { method: "HEAD" });
        if (!fallbackProbe.ok) {
          setVrmStatus("missing");
          return;
        }
      }
    } catch {
      setVrmStatus("missing");
      return;
    }

    setVrmStatus("loading");
    const r = threeRef.current;

    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!r.renderer) {
      r.scene = new THREE.Scene();
      r.camera = new THREE.PerspectiveCamera(30, canvas.width / canvas.height, 0.1, 20);
      r.camera.position.set(0, 1.3, 2.5);
      r.camera.lookAt(0, 1.15, 0);

      r.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      r.renderer.setSize(canvas.width, canvas.height);
      r.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      r.renderer.outputColorSpace = THREE.SRGBColorSpace;

      // Lights
      r.scene.add(new THREE.AmbientLight(0xffffff, 1.0));
      const dirLight = new THREE.DirectionalLight(0xffffff, 1.6);
      dirLight.position.set(1, 3, 2);
      r.scene.add(dirLight);

      const rimLight = new THREE.PointLight(0x7c3aed, 2.2, 8);
      rimLight.position.set(-2, 1.5, -2);
      r.scene.add(rimLight);

      const fillLight = new THREE.PointLight(0x22d3ee, 1.6, 6);
      fillLight.position.set(1, 0, 2);
      r.scene.add(fillLight);
    }

    if (r.vrm) {
      r.scene.remove(r.vrm.scene);
      r.vrm = null;
    }

    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));

    try {
      const gltf = await new Promise((resolve, reject) =>
        loader.load(vrmPath, resolve, undefined, reject)
      );
      const vrm = gltf.userData.vrm;
      if (!vrm) throw new Error("No VRM data found");

      VRMUtils.removeUnnecessaryVertices(gltf.scene);
      VRMUtils.removeUnnecessaryJoints(gltf.scene);
      VRMUtils.rotateVRM0(vrm);

      r.vrm = vrm;
      r.scene.add(vrm.scene);
      setVrmStatus("loaded");

      // Drag controls
      let isDragging = false;
      let lastX = 0;
      let rotY = 0;

      const onDown = (e) => {
        isDragging = true;
        lastX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
      };
      const onMove = (e) => {
        if (!isDragging) return;
        const currentX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
        rotY += (currentX - lastX) * 0.012;
        lastX = currentX;
      };
      const onUp = () => { isDragging = false; };

      canvas.addEventListener("pointerdown", onDown);
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);

      cancelAnimationFrame(r.rafId);
      const clock = new THREE.Clock();

      const animateVRM = () => {
        r.rafId = requestAnimationFrame(animateVRM);
        const dt = clock.getDelta();
        const t = clock.elapsedTime;

        if (r.vrm) {
          r.vrm.update(dt);
          r.vrm.scene.rotation.y += (rotY - r.vrm.scene.rotation.y) * 0.1;
          r.vrm.scene.position.y = Math.sin(t * 1.5) * (dancingRef.current ? 0.08 : 0.02);

          if (r.vrm.expressionManager) {
            const blink = Math.sin(t * 1.8) > 0.95 ? 1 : 0;
            r.vrm.expressionManager.setValue("blink", blink);
          }
        }
        r.renderer.render(r.scene, r.camera);
      };
      animateVRM();
    } catch (err) {
      console.warn("VRM load error:", err);
      setVrmStatus("missing");
    }
  }, []);

  useEffect(() => {
    loadVRM(charKey);
  }, [charKey, loadVRM]);

  // ── 2D Canvas Loop (when VRM not loaded) ───────────────────────────────────
  useEffect(() => {
    if (vrmStatus === "loaded") {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const loop = () => {
      tickRef.current += 0.016;
      draw2DHologram(canvas, charKeyRef.current, tickRef.current, dancingRef.current, CHARS[charKeyRef.current]);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(rafRef.current);
  }, [vrmStatus, charKey]);

  // ── Greet on character switch ──────────────────────────────────────────────
  useEffect(() => {
    if (!muted) {
      const t = setTimeout(() => hologramAudio.speakVoiceLine(dialogues[0], charKey), 500);
      return () => clearTimeout(t);
    }
  }, [charKey]); // eslint-disable-line

  const nextDialogue = useCallback(() => {
    const next = (dialogueIdx + 1) % dialogues.length;
    setDialogueIdx(next);
    if (!muted) hologramAudio.speakVoiceLine(dialogues[next], charKey);
  }, [dialogues, dialogueIdx, muted, charKey]);

  const toggleDance = useCallback(() => {
    setDancing((d) => !d);
    if (!muted) hologramAudio.playBounceSound();
  }, [muted]);

  const toggleMute = useCallback(() => {
    setMuted((m) => { hologramAudio.toggleMute(); return !m; });
  }, []);

  const switchChar = useCallback((key) => {
    setCharKey(key);
    setDialogueIdx(0);
    setVrmStatus("idle");
    hologramAudio.playHologramChime();
  }, []);

  return (
    <div className="hologram-stage" style={{ position: "relative" }}>

      {/* Canvas — shared between 2D and Three.js VRM */}
      <canvas
        ref={canvasRef}
        width={800}
        height={300}
        style={{ width: "100%", height: "300px", display: "block" }}
      />

      {/* VRM loading indicator */}
      {vrmStatus === "loading" && (
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", zIndex: 10 }}>
          <Loader2 size={28} color={profile.color} style={{ animation: "spin 1s linear infinite" }} />
          <span style={{ fontSize: "0.78rem", color: profile.color }}>Memuat model VRM...</span>
        </div>
      )}

      {/* VRM missing — hint */}
      {vrmStatus === "missing" && (
        <div style={{ position: "absolute", top: "0.75rem", left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.7)", border: `1px solid ${profile.color}40`, borderRadius: "0.75rem", padding: "0.4rem 0.9rem", backdropFilter: "blur(8px)", zIndex: 10 }}>
          <span style={{ fontSize: "0.72rem", color: profile.color }}>
            📁 Taruh <strong>{profile.vrmFile.replace("/models/", "")}</strong> di <code style={{ background: "rgba(255,255,255,0.1)", padding: "0 4px", borderRadius: "3px" }}>frontend/public/models/</code> untuk model 3D
          </span>
        </div>
      )}

      {/* Dialogue bubble */}
      <div style={{
        position: "absolute", top: "1rem", right: "1rem",
        maxWidth: "240px",
        background: "rgba(10,5,30,0.9)",
        backdropFilter: "blur(16px)",
        border: `1px solid ${profile.color}44`,
        borderRadius: "1rem 1rem 0.25rem 1rem",
        padding: "0.7rem 0.9rem",
        boxShadow: `0 8px 24px rgba(0,0,0,0.5), 0 0 20px ${profile.color}20`,
        zIndex: 5, cursor: "pointer",
      }} onClick={nextDialogue}>
        <p style={{ fontSize: "0.78rem", color: "#e2d9f3", lineHeight: 1.55, margin: 0 }}>
          {currentDialogue}
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.25rem", marginTop: "0.4rem" }}>
          <span style={{ fontSize: "0.66rem", color: profile.color, fontWeight: 700 }}>{profile.name}</span>
          <ChevronRight size={10} color={profile.color} />
        </div>
      </div>

      {/* Bottom control bar */}
      <div style={{
        position: "relative", zIndex: 3,
        padding: "0.6rem 1.1rem",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.6rem",
        background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)",
        borderTop: `1px solid ${profile.color}25`,
      }}>
        {/* Character pills */}
        <div style={{ display: "flex", gap: "0.35rem" }}>
          {Object.entries(CHARS).map(([key, ch]) => (
            <button key={key} onClick={() => switchChar(key)} style={{
              padding: "0.28rem 0.7rem", borderRadius: "9999px", fontSize: "0.73rem", fontWeight: 700,
              cursor: "pointer",
              border: `1px solid ${charKey === key ? ch.color : "rgba(255,255,255,0.1)"}`,
              background: charKey === key ? ch.accentBg : "transparent",
              color: charKey === key ? ch.color : "var(--text-sub)",
              transition: "all 0.15s ease",
              boxShadow: charKey === key ? `0 0 12px ${ch.color}40` : "none",
            }}>
              {ch.emoji} {ch.name.split(" ")[0]}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div style={{ display: "flex", gap: "0.4rem" }}>
          <button className="btn btn-outline" style={{ padding: "0.3rem 0.65rem", fontSize: "0.73rem" }} onClick={toggleDance}>
            <Music2 size={12} /> {dancing ? "Stop" : "Dance!"}
          </button>
          <button className="btn btn-outline" style={{ padding: "0.3rem 0.65rem", fontSize: "0.73rem" }} onClick={nextDialogue}>
            <MessageCircle size={12} /> Ngobrol
          </button>
          <button className="btn btn-outline" style={{ padding: "0.3rem 0.5rem" }} onClick={toggleMute}>
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
        </div>
      </div>

      {/* Bottom glow */}
      <div style={{
        position: "absolute", bottom: 48, left: "50%", transform: "translateX(-50%)",
        width: "65%", height: "50px",
        background: `radial-gradient(ellipse, ${profile.glow} 0%, transparent 70%)`,
        pointerEvents: "none", zIndex: 1,
      }} />
    </div>
  );
}
