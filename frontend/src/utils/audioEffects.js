/**
 * HologramAudioManager
 * Manages Web Audio API SFX and VOICEVOX TTS with Web Speech Synthesis fallback.
 */

const API_BASE = (() => {
  if (typeof window === "undefined") return "http://localhost:8000";
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1"
    ? "http://localhost:8000"
    : `http://${host}:8000`;
})();

class HologramAudioManager {
  constructor() {
    this.audioCtx = null;
    this.isMuted = false;
    this.voicevoxAvailable = null; // null = unchecked, true/false after probe
  }

  _getCtx() {
    if (!this.audioCtx && typeof window !== "undefined") {
      const Cls = window.AudioContext || window.webkitAudioContext;
      if (Cls) this.audioCtx = new Cls();
    }
    if (this.audioCtx?.state === "suspended") this.audioCtx.resume();
    return this.audioCtx;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  // Bouncy anime chime SFX
  playBounceSound() {
    if (this.isMuted) return;
    const ctx = this._getCtx();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    } catch (_) {}
  }

  // Holographic ascending chord
  playHologramChime() {
    if (this.isMuted) return;
    const ctx = this._getCtx();
    if (!ctx) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        const t = ctx.currentTime + i * 0.05;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.28);
      } catch (_) {}
    });
  }

  /**
   * Probe if VOICEVOX engine is running at localhost:50021.
   * Result is cached after first call.
   */
  async _probeVoicevox() {
    if (this.voicevoxAvailable !== null) return this.voicevoxAvailable;
    try {
      const res = await fetch(`${API_BASE}/api/voice/check`, { signal: AbortSignal.timeout(1500) });
      this.voicevoxAvailable = res.ok;
    } catch {
      this.voicevoxAvailable = false;
    }
    return this.voicevoxAvailable;
  }

  /**
   * Speak a line using VOICEVOX (via backend proxy) when available,
   * otherwise falls back to Web Speech Synthesis.
   */
  async speakVoiceLine(text, characterType = "kobo") {
    if (this.isMuted) return;

    const available = await this._probeVoicevox();

    if (available) {
      await this._speakViaVoicevox(text, characterType);
    } else {
      this._speakViaSpeechSynthesis(text, characterType);
    }
  }

  async _speakViaVoicevox(text, characterType) {
    // Speaker IDs: 3=ずんだもん(cute anime), 2=四国めたん, 9=波音リツ
    const speakerMap = { kobo: 3, gura: 2, miku: 9 };
    const speaker = speakerMap[characterType] ?? 3;
    try {
      const res = await fetch(`${API_BASE}/api/voice/speak`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, speaker }),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error("voice endpoint failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => URL.revokeObjectURL(url);
      await audio.play();
    } catch {
      this._speakViaSpeechSynthesis(text, characterType);
    }
  }

  _speakViaSpeechSynthesis(text, characterType) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      this.playBounceSound();
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      const cfg = {
        kobo: { lang: "id-ID", pitch: 1.7, rate: 1.2 },
        gura: { lang: "en-US", pitch: 1.6, rate: 1.15 },
        miku: { lang: "ja-JP", pitch: 1.5, rate: 1.1 },
      };
      Object.assign(utt, cfg[characterType] ?? cfg.miku, { volume: 0.9 });
      window.speechSynthesis.speak(utt);
    } catch {
      this.playBounceSound();
    }
  }
}

export const hologramAudio = new HologramAudioManager();
