import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Sparkles, MessageCircle, BookOpen, Heart, Volume2, VolumeX, RotateCw, Music2 } from "lucide-react";
import { hologramAudio } from "../utils/audioEffects";

export function Hololive3DHologram({ streakData, homeworkList = [], onNavigate }) {
  const mountRef = useRef(null);
  const [selectedCharacter, setSelectedCharacter] = useState("kobo"); // "kobo" | "gura" | "miku"
  const [isMuted, setIsMuted] = useState(false);
  const [isDancing, setIsDancing] = useState(false);
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [isHologramVisible, setIsHologramVisible] = useState(true);

  // References for Three.js animation loops
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const characterGroupRef = useRef(null);
  const leftTailRef = useRef(null);
  const rightTailRef = useRef(null);
  const sharkTailRef = useRef(null);
  const danceTimerRef = useRef(null);
  const particlesRef = useRef(null);

  const pendingHomework = homeworkList.filter((item) => !item.is_completed);
  const pendingCount = pendingHomework.length;
  const currentStreak = streakData?.current_streak || 0;

  // Dialogues per character
  const characterProfiles = {
    kobo: {
      name: "Kobo Kanaeru",
      badge: "Hololive ID Gen 3",
      themeColor: "#0284c7",
      glowColor: "rgba(2, 132, 199, 0.4)",
      catchphrase: "Eeeeyaaa!",
      dialogues: [
        `Eeeeyaaa! Halo Zama! Gimana kabarmu hari ini? Jangan loyo-loyo, pawang hujan di sini nemenin kamu! 🌧️`,
        pendingCount > 0
          ? `Woy Zama! Ada ${pendingCount} PR tuh yang belum kelar! Kerjain sekarang apa mau disamber petir? Canda petir hehe~ ⚡`
          : `Mantap bray! Semua PR beres tanpa sisa! Kobo bangga banget sama kamu! 🌟`,
        streakData?.committed_today
          ? `Streak ${currentStreak} hari kamu udah aman hari ini! Gacor bener dah kodingannya! 🔥`
          : `Hari ini belum commit ke GitHub lho! Push buruan sebelum jam 12 malem, jangan sampe apinya mati! ⏳`,
        `Haus gak? Jangan lupa minum air putih, jangan cuma nenggak kopi terus yaa! 💧`,
        `Semangat terus koding dan belajarnya! Kobo doain dari langit biar lancar jaya! 🌈`
      ]
    },
    gura: {
      name: "Gawr Gura",
      badge: "Hololive English",
      themeColor: "#0ea5e9",
      glowColor: "rgba(14, 165, 233, 0.4)",
      catchphrase: "A!",
      dialogues: [
        `A! Hello Zama! How's your day going? Shark is here to cheer you on! 🦈`,
        pendingCount > 0
          ? `Hey! You still have ${pendingCount} homework tasks to finish! Let's bite through them together! 📚`
          : `Yay! All homework is done! You're the apex student today! ✨`,
        streakData?.committed_today
          ? `Awesome! GitHub streak is at ${currentStreak} days! Keep the fire burning! 🔥`
          : `Don't forget to push a commit today before midnight, okay? ⏳`,
        `Remember to stay hydrated! Fish need water and so do programmers! 🌊`,
        `You can do it! Gura is always rooting for you! Domo same desu! 💙`
      ]
    },
    miku: {
      name: "Hatsune Miku",
      badge: "Vocaloid 01",
      themeColor: "#06b6d4",
      glowColor: "rgba(6, 182, 212, 0.4)",
      catchphrase: "Miku Miku!",
      dialogues: [
        `Halo Zama! Gimana kabarmu hari ini? Jangan lupa tersenyum ya~ 🩵`,
        pendingCount > 0
          ? `Ada ${pendingCount} PR yang menunggu untuk diselesaikan! Miku siap temani kamu belajar! 🎵`
          : `Hebat sekali! Semua PR hari ini sudah selesai! Kamu rajin banget! ✨`,
        streakData?.committed_today
          ? `Streak GitHub ${currentStreak} hari kamu terjaga sempurna! Kerja bagus! 🔥`
          : `Hari ini belum ada commit. Sempatkan push satu commit sebelum tengah malam ya! ⏳`,
        `Rehat sejenak kalau sudah lelah koding, kesehatanmu yang utama ya! 💧`,
        `Miku akan selalu menyemangatimu lewat melodi dan hologram ini! 🎶`
      ]
    }
  };

  const currentProfile = characterProfiles[selectedCharacter];

  // -------------------------------------------------------------
  // THREE.JS SCENE SETUP & 3D PROCEDURAL CHARACTER MESH
  // -------------------------------------------------------------
  useEffect(() => {
    if (!mountRef.current || !isHologramVisible) return;

    const width = mountRef.current.clientWidth || 280;
    const height = 240;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 1.3, 4.5);
    camera.lookAt(0, 0.8, 0);

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    mountRef.current.innerHTML = "";
    mountRef.current.appendChild(renderer.domElement);

    // 3. Lighting (Holographic Cyberpunk Lighting)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const cyanLight = new THREE.PointLight(0x22d3ee, 2.5, 8);
    cyanLight.position.set(0, -0.2, 0.5);
    scene.add(cyanLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(2, 3, 3);
    scene.add(dirLight);

    // 4. Projector Base (Hologram Platform Rings)
    const baseGroup = new THREE.Group();
    const ringGeo1 = new THREE.RingGeometry(0.7, 0.85, 32);
    const ringMat1 = new THREE.MeshBasicMaterial({ color: 0x06b6d4, side: THREE.DoubleSide, transparent: true, opacity: 0.65 });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 2;
    ring1.position.y = -0.3;
    baseGroup.add(ring1);

    const ringGeo2 = new THREE.RingGeometry(0.4, 0.52, 24);
    const ringMat2 = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.x = Math.PI / 2;
    ring2.position.y = -0.28;
    baseGroup.add(ring2);
    scene.add(baseGroup);

    // 5. Hologram Rising Particle Beams
    const particleCount = 45;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 1.6;
      particlePositions[i * 3 + 1] = Math.random() * 2.2 - 0.2;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 1.6;
    }
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({ color: 0x38bdf8, size: 0.04, transparent: true, opacity: 0.65 });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    particlesRef.current = particleSystem;
    scene.add(particleSystem);

    // 6. Procedural 3D Chibi Hololive Model
    const characterGroup = new THREE.Group();
    characterGroup.position.set(0, 0.45, 0);
    characterGroupRef.current = characterGroup;

    // Materials
    const skinMat = new THREE.MeshLambertMaterial({ color: 0xfff1e6 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0369a1 });
    const cheekMat = new THREE.MeshBasicMaterial({ color: 0xf472b6, transparent: true, opacity: 0.65 });

    let hairColor = 0x0284c7; // Kobo default blue
    let outfitColor = 0xfacc15; // Kobo raincoat yellow
    if (selectedCharacter === "gura") {
      hairColor = 0x93c5fd; // Silver-blue
      outfitColor = 0x1e3a8a; // Dark blue shark hoodie
    } else if (selectedCharacter === "miku") {
      hairColor = 0x06b6d4; // Cyan
      outfitColor = 0x334155; // Slate idol vest
    }

    const hairMat = new THREE.MeshLambertMaterial({ color: hairColor });
    const outfitMat = new THREE.MeshLambertMaterial({ color: outfitColor });

    // Head (Chibi cute spherical anime head)
    const headGeo = new THREE.SphereGeometry(0.48, 24, 24);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.position.set(0, 0.7, 0);
    characterGroup.add(headMesh);

    // Eyes
    const eyeGeo = new THREE.CapsuleGeometry(0.05, 0.07, 8, 12);
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.16, 0.72, 0.44);
    characterGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.16, 0.72, 0.44);
    characterGroup.add(rightEye);

    // Blushing cheeks
    const cheekGeo = new THREE.SphereGeometry(0.05, 12, 12);
    const leftCheek = new THREE.Mesh(cheekGeo, cheekMat);
    leftCheek.position.set(-0.25, 0.62, 0.41);
    characterGroup.add(leftCheek);

    const rightCheek = new THREE.Mesh(cheekGeo, cheekMat);
    rightCheek.position.set(0.25, 0.62, 0.41);
    characterGroup.add(rightCheek);

    // Hair Front Bangs
    const bangsGeo = new THREE.SphereGeometry(0.51, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2.2);
    const bangsMesh = new THREE.Mesh(bangsGeo, hairMat);
    bangsMesh.position.set(0, 0.75, -0.02);
    characterGroup.add(bangsMesh);

    // Body / Outfit
    const bodyGeo = new THREE.ConeGeometry(0.42, 0.75, 20);
    const bodyMesh = new THREE.Mesh(bodyGeo, outfitMat);
    bodyMesh.position.set(0, 0.18, 0);
    characterGroup.add(bodyMesh);

    // Character-Specific Accessories & Hair Styles
    if (selectedCharacter === "kobo") {
      // Kobo's Rain Shaman Water Hair Buns
      const bunGeo = new THREE.SphereGeometry(0.22, 16, 16);
      const leftBun = new THREE.Mesh(bunGeo, hairMat);
      leftBun.position.set(-0.48, 0.9, 0);
      leftTailRef.current = leftBun;
      characterGroup.add(leftBun);

      const rightBun = new THREE.Mesh(bunGeo, hairMat);
      rightBun.position.set(0.48, 0.9, 0);
      rightTailRef.current = rightBun;
      characterGroup.add(rightBun);

      // Yellow Umbrella mini model on hand
      const umbrellaGeo = new THREE.ConeGeometry(0.28, 0.12, 16);
      const umbrellaMat = new THREE.MeshLambertMaterial({ color: 0xfacc15 });
      const umbrella = new THREE.Mesh(umbrellaGeo, umbrellaMat);
      umbrella.position.set(0.45, 0.45, 0.2);
      umbrella.rotation.z = -0.3;
      characterGroup.add(umbrella);

    } else if (selectedCharacter === "gura") {
      // Gura's Shark Hood Fin & Tail
      const finGeo = new THREE.ConeGeometry(0.12, 0.35, 12);
      const finMesh = new THREE.Mesh(finGeo, outfitMat);
      finMesh.position.set(0, 1.25, -0.05);
      finMesh.rotation.x = -0.25;
      characterGroup.add(finMesh);

      // Animated Shark Tail
      const tailGeo = new THREE.ConeGeometry(0.18, 0.65, 12);
      const tailMesh = new THREE.Mesh(tailGeo, outfitMat);
      tailMesh.position.set(0, 0.05, -0.45);
      tailMesh.rotation.x = -1.2;
      sharkTailRef.current = tailMesh;
      characterGroup.add(tailMesh);

    } else if (selectedCharacter === "miku") {
      // Miku's Iconic Twin Tails
      const tailGeo = new THREE.CylinderGeometry(0.12, 0.04, 0.9, 12);
      const leftMikuTail = new THREE.Mesh(tailGeo, hairMat);
      leftMikuTail.position.set(-0.45, 0.55, 0);
      leftMikuTail.rotation.z = 0.4;
      leftTailRef.current = leftMikuTail;
      characterGroup.add(leftMikuTail);

      const rightMikuTail = new THREE.Mesh(tailGeo, hairMat);
      rightMikuTail.position.set(0.45, 0.55, 0);
      rightMikuTail.rotation.z = -0.4;
      rightTailRef.current = rightMikuTail;
      characterGroup.add(rightMikuTail);
    }

    scene.add(characterGroup);

    // 7. Mouse / Touch Drag Orbiting Interaction
    let isDragging = false;
    let prevMouseX = 0;
    let targetRotationY = 0;

    const onPointerDown = (e) => {
      isDragging = true;
      prevMouseX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;
      const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      const deltaX = clientX - prevMouseX;
      prevMouseX = clientX;
      targetRotationY += deltaX * 0.012;
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const canvasElement = renderer.domElement;
    canvasElement.addEventListener("mousedown", onPointerDown);
    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("mouseup", onPointerUp);

    canvasElement.addEventListener("touchstart", onPointerDown, { passive: true });
    window.addEventListener("touchmove", onPointerMove, { passive: true });
    window.addEventListener("touchend", onPointerUp);

    // 8. Main 60fps Animation Loop with Dance / Goyang Physics
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Rotate projector ring
      ring1.rotation.z = elapsedTime * 0.4;
      ring2.rotation.z = -elapsedTime * 0.6;

      // Particles rising
      if (particlesRef.current) {
        const positions = particlesRef.current.geometry.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
          positions[i * 3 + 1] += 0.008;
          if (positions[i * 3 + 1] > 2.2) {
            positions[i * 3 + 1] = -0.2;
          }
        }
        particlesRef.current.geometry.attributes.position.needsUpdate = true;
      }

      // Character Dancing / Goyang-Goyang or Idle Motion
      if (characterGroupRef.current) {
        // Smooth rotation damping
        characterGroupRef.current.rotation.y += (targetRotationY - characterGroupRef.current.rotation.y) * 0.1;

        if (isDancing) {
          // Energetic Goyang-Goyang / Dance animation!
          const danceSpeed = elapsedTime * 9.0;
          characterGroupRef.current.position.y = 0.45 + Math.abs(Math.sin(danceSpeed)) * 0.28;
          characterGroupRef.current.rotation.z = Math.sin(danceSpeed * 0.7) * 0.22; // Side-to-side wobble
          characterGroupRef.current.rotation.x = Math.cos(danceSpeed * 0.5) * 0.12;

          // Wiggle hair / shark tail
          if (leftTailRef.current) leftTailRef.current.rotation.z = Math.sin(danceSpeed) * 0.4;
          if (rightTailRef.current) rightTailRef.current.rotation.z = -Math.sin(danceSpeed) * 0.4;
          if (sharkTailRef.current) sharkTailRef.current.rotation.y = Math.sin(danceSpeed * 1.2) * 0.6;

        } else {
          // Gentle floating breathing & head tilt idle
          const idleSpeed = elapsedTime * 2.2;
          characterGroupRef.current.position.y = 0.45 + Math.sin(idleSpeed) * 0.08;
          characterGroupRef.current.rotation.z = Math.sin(idleSpeed * 0.6) * 0.04;
          characterGroupRef.current.rotation.x = 0;

          if (leftTailRef.current) leftTailRef.current.rotation.z = Math.sin(idleSpeed) * 0.12;
          if (rightTailRef.current) rightTailRef.current.rotation.z = -Math.sin(idleSpeed) * 0.12;
          if (sharkTailRef.current) sharkTailRef.current.rotation.y = Math.sin(idleSpeed) * 0.2;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      canvasElement.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("mouseup", onPointerUp);
      canvasElement.removeEventListener("touchstart", onPointerDown);
      window.removeEventListener("touchmove", onPointerMove);
      window.removeEventListener("touchend", onPointerUp);

      if (mountRef.current && renderer.domElement) {
        mountRef.current.innerHTML = "";
      }
      renderer.dispose();
    };
  }, [selectedCharacter, isDancing, isHologramVisible]);

  // -------------------------------------------------------------
  // INTERACTIVE TRIGGER FUNCTIONS (Click, Dance, Voice)
  // -------------------------------------------------------------
  const triggerDance = (durationSeconds = 4) => {
    setIsDancing(true);
    hologramAudio.playBounceSound();

    if (danceTimerRef.current) clearTimeout(danceTimerRef.current);
    danceTimerRef.current = setTimeout(() => {
      setIsDancing(false);
    }, durationSeconds * 1000);
  };

  const handleCharacterClick = () => {
    triggerDance(3.5);
    const nextIdx = (dialogueIndex + 1) % currentProfile.dialogues.length;
    setDialogueIndex(nextIdx);

    const lineText = currentProfile.dialogues[nextIdx];
    hologramAudio.speakVoiceLine(lineText, selectedCharacter);
  };

  const handleAskMood = () => {
    setDialogueIndex(0);
    triggerDance(3);
    hologramAudio.speakVoiceLine(currentProfile.dialogues[0], selectedCharacter);
  };

  const handleCheckHomework = () => {
    setDialogueIndex(1);
    triggerDance(3);
    hologramAudio.speakVoiceLine(currentProfile.dialogues[1], selectedCharacter);
  };

  const handleCheerUp = () => {
    setDialogueIndex(4);
    triggerDance(4);
    hologramAudio.speakVoiceLine(currentProfile.dialogues[4], selectedCharacter);
  };

  const handleToggleMute = () => {
    const muted = hologramAudio.toggleMute();
    setIsMuted(muted);
  };

  if (!isHologramVisible) {
    return (
      <div style={{ textAlign: "right", marginBottom: "0.5rem" }}>
        <button
          onClick={() => setIsHologramVisible(true)}
          className="btn btn-outline"
          style={{ fontSize: "0.75rem", padding: "0.3rem 0.65rem", borderColor: "#0ea5e9", color: "#0284c7" }}
        >
          ✦ Tampilkan Hologram 3D Hololive
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "relative",
        background: "linear-gradient(135deg, rgba(240, 249, 255, 0.95) 0%, rgba(248, 250, 252, 0.98) 100%)",
        border: `1.5px solid ${currentProfile.themeColor}33`,
        borderRadius: "1rem",
        padding: "1.25rem 1.5rem",
        boxShadow: `0 8px 24px ${currentProfile.glowColor}`,
        overflow: "hidden",
        marginBottom: "1.5rem",
      }}
    >
      {/* Background Holographic Grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(to right, rgba(2, 132, 199, 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(2, 132, 199, 0.04) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          pointerEvents: "none",
        }}
      />

      {/* Top Header: Character Switcher & Controls */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.65rem",
          position: "relative",
          zIndex: 20,
          marginBottom: "0.75rem",
        }}
      >
        {/* Character Selector Pills */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "#ffffff", padding: "0.25rem 0.4rem", borderRadius: "9999px", border: "1px solid #e2e8f0", boxShadow: "var(--shadow-sm)" }}>
          {[
            { id: "kobo", label: "🌧️ Kobo (ID)", color: "#0284c7" },
            { id: "gura", label: "🦈 Gura (EN)", color: "#0ea5e9" },
            { id: "miku", label: "🎵 Miku (01)", color: "#06b6d4" },
          ].map((char) => (
            <button
              key={char.id}
              onClick={() => {
                setSelectedCharacter(char.id);
                setDialogueIndex(0);
                triggerDance(2.5);
                hologramAudio.playHologramChime();
              }}
              style={{
                border: "none",
                background: selectedCharacter === char.id ? char.color : "transparent",
                color: selectedCharacter === char.id ? "#ffffff" : "#475569",
                padding: "0.25rem 0.65rem",
                borderRadius: "9999px",
                fontSize: "0.74rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {char.label}
            </button>
          ))}
        </div>

        {/* Right Tools: Mute sound, Hide hologram */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
          <button
            onClick={handleToggleMute}
            className="btn btn-outline"
            style={{ padding: "0.3rem 0.6rem", fontSize: "0.74rem", borderRadius: "9999px" }}
            title={isMuted ? "Aktifkan Suara Karakter" : "Matikan Suara Karakter"}
          >
            {isMuted ? <VolumeX size={14} color="#e11d48" /> : <Volume2 size={14} color="#0284c7" />}
            <span>{isMuted ? "Suara Mati" : "Suara Nyala"}</span>
          </button>

          <button
            onClick={() => setIsHologramVisible(false)}
            style={{ background: "transparent", border: "none", color: "#94a3b8", fontSize: "0.72rem", cursor: "pointer" }}
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Main Hologram Area: 3D Canvas + Interactive Chat Bubble */}
      <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap", position: "relative", zIndex: 10 }}>
        
        {/* 3D WebGL Canvas Container */}
        <div
          onClick={handleCharacterClick}
          title="Klik untuk ajak goyang & dengarkan suaranya!"
          style={{
            position: "relative",
            width: "230px",
            height: "220px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          {/* Three.js Canvas Mount */}
          <div ref={mountRef} style={{ width: "100%", height: "100%" }} />

          {/* Floating Action Tip */}
          <div
            style={{
              position: "absolute",
              bottom: "4px",
              background: "rgba(255, 255, 255, 0.9)",
              border: `1px solid ${currentProfile.themeColor}55`,
              padding: "0.2rem 0.55rem",
              borderRadius: "9999px",
              fontSize: "0.68rem",
              fontWeight: 700,
              color: currentProfile.themeColor,
              boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
            }}
          >
            <RotateCw size={10} /> Drag putar 360° • Tap goyang!
          </div>
        </div>

        {/* Interactive Floating Speech Bubble */}
        <div style={{ flex: 1, minWidth: "260px" }}>
          <div
            style={{
              background: "#ffffff",
              border: `1.5px solid ${currentProfile.themeColor}55`,
              borderRadius: "0.875rem",
              padding: "1.1rem 1.25rem",
              boxShadow: `0 4px 16px ${currentProfile.glowColor}`,
              position: "relative",
            }}
          >
            {/* Bubble Arrow */}
            <div
              style={{
                position: "absolute",
                left: "-8px",
                top: "36px",
                width: 0,
                height: 0,
                borderTop: "7px solid transparent",
                borderBottom: "7px solid transparent",
                borderRight: "8px solid #ffffff",
              }}
            />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Sparkles size={14} color={currentProfile.themeColor} />
                <span style={{ fontSize: "0.82rem", fontWeight: 700, color: currentProfile.themeColor }}>
                  {currentProfile.name} ({currentProfile.catchphrase})
                </span>
              </div>
              <span className="badge" style={{ background: "#f0f9ff", color: currentProfile.themeColor, fontSize: "0.65rem", border: "1px solid #bae6fd" }}>
                3D Live Motion
              </span>
            </div>

            <p style={{ fontSize: "0.92rem", color: "#0f172a", lineHeight: 1.55, fontWeight: 500 }}>
              "{currentProfile.dialogues[dialogueIndex]}"
            </p>

            {/* Action Buttons: Goyang-goyang, Tanya Kabar, Cek PR */}
            <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.85rem", flexWrap: "wrap" }}>
              <button
                onClick={() => triggerDance(4)}
                className="btn btn-outline"
                style={{
                  fontSize: "0.74rem",
                  padding: "0.3rem 0.65rem",
                  borderRadius: "9999px",
                  borderColor: isDancing ? "#f43f5e" : "#bae6fd",
                  color: isDancing ? "#e11d48" : currentProfile.themeColor,
                  background: isDancing ? "#fff1f2" : "#ffffff",
                  fontWeight: 700,
                }}
              >
                <Music2 size={13} className={isDancing ? "pulse-flame" : ""} />
                <span>{isDancing ? "Lagi Goyang! 💃" : "Ajak Goyang 💃"}</span>
              </button>

              <button
                onClick={handleAskMood}
                className="btn btn-outline"
                style={{ fontSize: "0.74rem", padding: "0.3rem 0.65rem", borderRadius: "9999px", borderColor: "#bae6fd", color: "#0284c7" }}
              >
                <MessageCircle size={12} /> Tanya Kabar
              </button>

              <button
                onClick={handleCheckHomework}
                className="btn btn-outline"
                style={{ fontSize: "0.74rem", padding: "0.3rem 0.65rem", borderRadius: "9999px", borderColor: "#bae6fd", color: "#0284c7" }}
              >
                <BookOpen size={12} /> Cek PR ({pendingCount})
              </button>

              <button
                onClick={handleCheerUp}
                className="btn btn-outline"
                style={{ fontSize: "0.74rem", padding: "0.3rem 0.65rem", borderRadius: "9999px", borderColor: "#bae6fd", color: "#0284c7" }}
              >
                <Heart size={12} color="#ec4899" /> Minta Semangat
              </button>

              {pendingCount > 0 && (
                <button
                  onClick={() => onNavigate("homework")}
                  className="btn btn-primary"
                  style={{ fontSize: "0.74rem", padding: "0.3rem 0.75rem", borderRadius: "9999px", background: currentProfile.themeColor }}
                >
                  Buka PR &rarr;
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
