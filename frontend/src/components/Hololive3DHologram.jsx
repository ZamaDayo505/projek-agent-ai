import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";
import {
  Volume2, VolumeX, RotateCw, Music2, Sparkles,
  MessageCircle, BookOpen, ChevronRight
} from "lucide-react";
import { hologramAudio } from "../utils/audioEffects";

// ─── Character definitions ────────────────────────────────────────────────────
const CHARACTERS = {
  kobo: {
    name: "Kobo Kanaeru",
    badge: "Hololive ID Gen 3",
    color: "#0284c7",
    glow: "rgba(2,132,199,0.45)",
    accentBg: "rgba(2,132,199,0.12)",
    emoji: "🌧️",
    vrmUrl: null, // VRM fallback — procedural used
    buildDialogues: (pending, streak, committed) => [
      `Eeeeyaaa! Halo Zama! Gimana kabarmu hari ini? Pawang hujan selalu di sini nemenin kamu! 🌧️`,
      pending > 0
        ? `Woy! Ada ${pending} PR yang belum kelar! Kerjain sekarang apa mau disamber petir? Canda~ ⚡`
        : `Mantap bray! Semua PR beres tanpa sisa! Kobo bangga banget sama kamu! 🌟`,
      committed
        ? `Streak ${streak} hari kamu udah aman hari ini! Gacor bener dah kodingannya! 🔥`
        : `Hari ini belum commit ke GitHub lho! Push buruan sebelum jam 12 malem! ⏳`,
      `Haus gak? Jangan lupa minum air putih, jangan cuma nenggak kopi terus ya! 💧`,
    ],
  },
  gura: {
    name: "Gawr Gura",
    badge: "Hololive English",
    color: "#0ea5e9",
    glow: "rgba(14,165,233,0.45)",
    accentBg: "rgba(14,165,233,0.12)",
    emoji: "🦈",
    vrmUrl: null,
    buildDialogues: (pending, streak, committed) => [
      `A! Hello Zama! How's your day? Shark is here to cheer you on! 🦈`,
      pending > 0
        ? `Hey! You still have ${pending} tasks to finish! Let's bite through them together! 📚`
        : `Yay! All homework is done! You're the apex student today! ✨`,
      committed
        ? `Awesome! GitHub streak is at ${streak} days! Keep the fire burning! 🔥`
        : `Don't forget to push a commit today before midnight, okay? ⏳`,
      `Remember to stay hydrated! Fish need water and so do programmers! 🌊`,
    ],
  },
  miku: {
    name: "Hatsune Miku",
    badge: "Vocaloid 01",
    color: "#06b6d4",
    glow: "rgba(6,182,212,0.45)",
    accentBg: "rgba(6,182,212,0.12)",
    emoji: "🎵",
    vrmUrl: null,
    buildDialogues: (pending, streak, committed) => [
      `ミクだよ！元気してた、Zama？いつも応援しているよ！🩵`,
      pending > 0
        ? `${pending}個の宿題がまだ残っているよ！ミクと一緒に頑張ろう！📚`
        : `すごい！全部の宿題が終わったね！本当に偉いよ！✨`,
      committed
        ? `GitHubのストリーク${streak}日！完璧だよ！🔥`
        : `今日はまだcommitしてないよ！夜中の前に押してね！⏳`,
      `ちょっと休んで、水を飲んでね！あなたの体が大事だから！💧`,
    ],
  },
};

// ─── Build procedural chibi mesh (fallback when no VRM available) ──────────────
function buildProceduralCharacter(type) {
  const group = new THREE.Group();

  const palette = {
    kobo: { hair: 0x0284c7, outfit: 0xfacc15, skin: 0xfef3c7 },
    gura: { hair: 0x93c5fd, outfit: 0x1e3a8a, skin: 0xfef3c7 },
    miku: { hair: 0x06b6d4, outfit: 0x334155, skin: 0xfef3c7 },
  }[type];

  const toonMat = (hex, opacity = 1) => new THREE.MeshToonMaterial({
    color: hex, transparent: opacity < 1, opacity
  });

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.48, 28, 28), toonMat(palette.skin));
  head.position.y = 0.7;
  group.add(head);

  // Eyes
  const eyeGeo = new THREE.CapsuleGeometry(0.055, 0.08, 8, 12);
  const eyeMat = toonMat(0x0c4a6e);
  [-0.16, 0.16].forEach((x) => {
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(x, 0.72, 0.44);
    group.add(eye);
  });

  // Cheeks
  const cheekMat = toonMat(0xf472b6, 0.6);
  const cheekGeo = new THREE.SphereGeometry(0.055, 12, 12);
  [-0.26, 0.26].forEach((x) => {
    const c = new THREE.Mesh(cheekGeo, cheekMat);
    c.position.set(x, 0.61, 0.41);
    group.add(c);
  });

  // Hair cap
  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.515, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2.2),
    toonMat(palette.hair)
  );
  hair.position.set(0, 0.78, -0.02);
  group.add(hair);

  // Body
  const body = new THREE.Mesh(new THREE.ConeGeometry(0.44, 0.8, 22), toonMat(palette.outfit));
  body.position.y = 0.15;
  group.add(body);

  // Arms
  const armGeo = new THREE.CapsuleGeometry(0.09, 0.3, 8, 12);
  [-1, 1].forEach((side) => {
    const arm = new THREE.Mesh(armGeo, toonMat(palette.skin));
    arm.position.set(side * 0.55, 0.3, 0);
    arm.rotation.z = side * 0.35;
    group.add(arm);
  });

  // Character extras
  const extras = [];
  if (type === "kobo") {
    const bunGeo = new THREE.SphereGeometry(0.22, 16, 16);
    const leftBun = new THREE.Mesh(bunGeo, toonMat(palette.hair));
    leftBun.position.set(-0.48, 0.92, 0);
    const rightBun = new THREE.Mesh(bunGeo, toonMat(palette.hair));
    rightBun.position.set(0.48, 0.92, 0);
    group.add(leftBun, rightBun);
    extras.push({ mesh: leftBun, swing: "bun_left" }, { mesh: rightBun, swing: "bun_right" });
  } else if (type === "gura") {
    const fin = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.38, 12), toonMat(palette.outfit));
    fin.position.set(0, 1.28, -0.06);
    fin.rotation.x = -0.25;
    group.add(fin);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.19, 0.68, 12), toonMat(palette.outfit));
    tail.position.set(0, -0.08, -0.5);
    tail.rotation.x = Math.PI * 0.55;
    group.add(tail);
    extras.push({ mesh: tail, swing: "shark_tail" });
  } else {
    // Miku twin tails
    const tailGeo = new THREE.CylinderGeometry(0.07, 0.035, 0.72, 10);
    [-1, 1].forEach((side) => {
      const t = new THREE.Mesh(tailGeo, toonMat(palette.hair));
      t.position.set(side * 0.46, 0.42, -0.18);
      t.rotation.z = side * 0.5;
      group.add(t);
      extras.push({ mesh: t, swing: `miku_tail_${side}` });
    });
  }

  return { group, extras };
}

// ─── Component ────────────────────────────────────────────────────────────────
export function Hololive3DHologram({ streakData, homeworkList = [], onNavigate }) {
  const mountRef = useRef(null);
  const [charKey, setCharKey] = useState("kobo");
  const [muted, setMuted] = useState(false);
  const [dancing, setDancing] = useState(false);
  const [dialogueIdx, setDialogueIdx] = useState(0);
  const [showDialogue, setShowDialogue] = useState(true);
  const [vrmLoaded, setVrmLoaded] = useState(false);
  const [loadingVrm, setLoadingVrm] = useState(false);

  // Three.js refs (stable across renders)
  const threeRef = useRef({
    renderer: null, scene: null, camera: null, clock: null,
    charGroup: null, extras: [], vrm: null,
    rafId: null,
    drag: { active: false, lastX: 0, rotY: 0, targetRotY: 0 },
  });

  const pendingCount = homeworkList.filter((h) => !h.is_completed).length;
  const streak = streakData?.current_streak ?? 0;
  const committed = !!streakData?.committed_today;

  const profile = CHARACTERS[charKey];
  const dialogues = profile.buildDialogues(pendingCount, streak, committed);
  const currentDialogue = dialogues[dialogueIdx % dialogues.length];

  // ── Next dialogue ──────────────────────────────────────────────────────────
  const nextDialogue = useCallback(() => {
    setDialogueIdx((i) => (i + 1) % dialogues.length);
    if (!muted) hologramAudio.speakVoiceLine(dialogues[(dialogueIdx + 1) % dialogues.length], charKey);
  }, [dialogues, dialogueIdx, muted, charKey]);

  // ── Toggle dance ──────────────────────────────────────────────────────────
  const toggleDance = useCallback(() => {
    setDancing((d) => !d);
    if (!muted) hologramAudio.playBounceSound();
  }, [muted]);

  // ── Toggle mute ───────────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    setMuted((m) => {
      hologramAudio.toggleMute();
      return !m;
    });
  }, []);

  // ── Greet on mount & on character switch ──────────────────────────────────
  useEffect(() => {
    if (!muted) {
      const timer = setTimeout(() => hologramAudio.speakVoiceLine(dialogues[0], charKey), 600);
      return () => clearTimeout(timer);
    }
  }, [charKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Main Three.js setup ───────────────────────────────────────────────────
  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const W = el.clientWidth || 360;
    const H = 300;
    const r = threeRef.current;

    // Scene
    r.scene = new THREE.Scene();
    r.clock = new THREE.Clock();

    // Camera
    r.camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 100);
    r.camera.position.set(0, 1.2, 4.2);
    r.camera.lookAt(0, 0.8, 0);

    // Renderer
    r.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    r.renderer.setSize(W, H);
    r.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    r.renderer.shadowMap.enabled = true;
    el.innerHTML = "";
    el.appendChild(r.renderer.domElement);

    // Lights
    r.scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
    keyLight.position.set(2, 4, 3);
    r.scene.add(keyLight);
    const rimLight = new THREE.PointLight(0x7c3aed, 2.5, 8);
    rimLight.position.set(-2, 2, -2);
    r.scene.add(rimLight);
    const cyanFill = new THREE.PointLight(0x22d3ee, 1.8, 6);
    cyanFill.position.set(0, -0.5, 2);
    r.scene.add(cyanFill);

    // Platform rings
    const ringDefs = [
      { inner: 0.65, outer: 0.8, color: 0x7c3aed, opacity: 0.7, y: -0.31 },
      { inner: 0.38, outer: 0.5, color: 0x22d3ee, opacity: 0.85, y: -0.29 },
    ];
    ringDefs.forEach(({ inner, outer, color, opacity, y }) => {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(inner, outer, 48),
        new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = y;
      r.scene.add(ring);
    });

    // Floating particles
    const pCount = 60;
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      pPos[i * 3]     = (Math.random() - 0.5) * 2;
      pPos[i * 3 + 1] = Math.random() * 2.5 - 0.2;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
      color: 0x818cf8, size: 0.035, transparent: true, opacity: 0.7
    }));
    r.scene.add(particles);

    // Build procedural character
    const { group, extras } = buildProceduralCharacter(charKey);
    group.position.set(0, 0.35, 0);
    r.charGroup = group;
    r.extras = extras;
    r.scene.add(group);

    // Try to load VRM (async, non-blocking)
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));

    // ── Animation loop ────────────────────────────────────────────────────
    const dancingRef = { value: false };
    const mutedRef   = { value: false };
    // We track dancing via closure update below
    const animate = () => {
      r.rafId = requestAnimationFrame(animate);
      const t = r.clock.getElapsedTime();
      const dt = r.clock.getDelta ? 0.016 : 0.016;

      // Smooth rotation damping
      r.drag.rotY += (r.drag.targetRotY - r.drag.rotY) * 0.08;
      if (r.charGroup) {
        r.charGroup.rotation.y = r.drag.rotY;
        // Idle float
        r.charGroup.position.y = 0.35 + Math.sin(t * 1.2) * 0.04;
      }

      // Character-specific swings
      r.extras.forEach(({ mesh, swing }) => {
        if (!mesh) return;
        if (swing.startsWith("bun")) {
          mesh.rotation.z = Math.sin(t * 2.5) * 0.12;
        } else if (swing === "shark_tail") {
          mesh.rotation.z = Math.sin(t * 3) * 0.2;
        } else if (swing.startsWith("miku_tail")) {
          const side = swing.endsWith("1") ? 1 : -1;
          mesh.rotation.z = side * (0.5 + Math.sin(t * 2.2) * 0.15);
        }
      });

      // Dance bounce
      if (dancingRef.value && r.charGroup) {
        r.charGroup.position.y = 0.35 + Math.abs(Math.sin(t * 5)) * 0.18;
        r.charGroup.rotation.z = Math.sin(t * 4) * 0.08;
      } else if (r.charGroup) {
        r.charGroup.rotation.z += (0 - r.charGroup.rotation.z) * 0.05;
      }

      // Particles drift upward
      const posArr = particles.geometry.attributes.position.array;
      for (let i = 1; i < pCount * 3; i += 3) {
        posArr[i] += 0.005;
        if (posArr[i] > 2.5) posArr[i] = -0.2;
      }
      particles.geometry.attributes.position.needsUpdate = true;
      particles.rotation.y += 0.002;

      // VRM update
      if (r.vrm) r.vrm.update(dt);

      r.renderer.render(r.scene, r.camera);
    };

    animate();

    // Expose dancingRef setter for the dancing state
    r.setDancingRef = (v) => { dancingRef.value = v; };

    // ── Drag rotation ─────────────────────────────────────────────────────
    const canvas = r.renderer.domElement;
    const onPointerDown = (e) => {
      r.drag.active = true;
      r.drag.lastX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    };
    const onPointerMove = (e) => {
      if (!r.drag.active) return;
      const x = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
      r.drag.targetRotY += (x - r.drag.lastX) * 0.012;
      r.drag.lastX = x;
    };
    const onPointerUp = () => { r.drag.active = false; };

    canvas.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("touchstart", onPointerDown, { passive: true });
    window.addEventListener("touchmove", onPointerMove, { passive: true });
    window.addEventListener("touchend", onPointerUp);

    // ── Resize observer ───────────────────────────────────────────────────
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth || 360;
      r.camera.aspect = w / H;
      r.camera.updateProjectionMatrix();
      r.renderer.setSize(w, H);
    });
    ro.observe(el);

    return () => {
      cancelAnimationFrame(r.rafId);
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("touchstart", onPointerDown);
      window.removeEventListener("touchmove", onPointerMove);
      window.removeEventListener("touchend", onPointerUp);
      ro.disconnect();
      r.renderer.dispose();
    };
  }, [charKey]); // Re-init on character switch

  // Sync dancing state into animation loop ref
  useEffect(() => {
    if (threeRef.current.setDancingRef) threeRef.current.setDancingRef(dancing);
  }, [dancing]);

  return (
    <div className="hologram-stage" style={{ marginBottom: "0rem" }}>

      {/* Canvas mount */}
      <div ref={mountRef} style={{ width: "100%", height: "300px", cursor: "grab", position: "relative", zIndex: 2 }} />

      {/* Dialogue bubble */}
      {showDialogue && (
        <div style={{
          position: "absolute",
          top: "1rem", right: "1rem",
          maxWidth: "260px",
          background: "rgba(15,10,40,0.88)",
          backdropFilter: "blur(16px)",
          border: `1px solid ${profile.color}55`,
          borderRadius: "1rem 1rem 0.25rem 1rem",
          padding: "0.75rem 1rem",
          boxShadow: `0 8px 24px rgba(0,0,0,0.5), 0 0 20px ${profile.color}25`,
          zIndex: 5,
          cursor: "pointer",
          transition: "all 0.2s ease",
        }} onClick={nextDialogue}>
          <p style={{ fontSize: "0.8rem", color: "#e2d9f3", lineHeight: 1.55, margin: 0 }}>
            {currentDialogue}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.3rem", marginTop: "0.5rem" }}>
            <span style={{ fontSize: "0.68rem", color: profile.color, fontWeight: 600 }}>{profile.name}</span>
            <ChevronRight size={11} color={profile.color} />
          </div>
        </div>
      )}

      {/* Character info bar */}
      <div style={{
        position: "relative", zIndex: 3,
        padding: "0.65rem 1.25rem",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem",
        background: "rgba(0,0,0,0.35)",
        backdropFilter: "blur(8px)",
        borderTop: `1px solid ${profile.color}30`,
      }}>
        {/* Character selector pills */}
        <div style={{ display: "flex", gap: "0.4rem" }}>
          {Object.entries(CHARACTERS).map(([key, ch]) => (
            <button
              key={key}
              onClick={() => { setCharKey(key); setDialogueIdx(0); hologramAudio.playHologramChime(); }}
              style={{
                padding: "0.3rem 0.75rem",
                borderRadius: "9999px",
                fontSize: "0.75rem",
                fontWeight: 700,
                cursor: "pointer",
                border: `1px solid ${charKey === key ? ch.color : "rgba(255,255,255,0.12)"}`,
                background: charKey === key ? ch.accentBg : "transparent",
                color: charKey === key ? ch.color : "var(--text-sub)",
                transition: "all 0.15s ease",
                boxShadow: charKey === key ? `0 0 12px ${ch.color}40` : "none",
              }}
            >
              {ch.emoji} {ch.name.split(" ")[0]}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div style={{ display: "flex", gap: "0.45rem" }}>
          <button className="btn btn-outline" style={{ padding: "0.35rem 0.7rem", fontSize: "0.75rem" }} onClick={toggleDance}>
            <Music2 size={13} />
            {dancing ? "Stop" : "Dance"}
          </button>
          <button className="btn btn-outline" style={{ padding: "0.35rem 0.7rem", fontSize: "0.75rem" }} onClick={nextDialogue}>
            <MessageCircle size={13} />
            Ngobrol
          </button>
          <button className="btn btn-outline" style={{ padding: "0.35rem", borderRadius: "0.5rem" }} onClick={toggleMute}>
            {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
        </div>
      </div>

      {/* Hologram bottom glow */}
      <div style={{
        position: "absolute", bottom: 0, left: "50%",
        transform: "translateX(-50%)",
        width: "70%", height: "60px",
        background: `radial-gradient(ellipse, ${profile.glow} 0%, transparent 70%)`,
        pointerEvents: "none",
        zIndex: 1,
      }} />
    </div>
  );
}
