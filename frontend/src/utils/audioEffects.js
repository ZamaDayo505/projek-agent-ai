// Audio Synthesizer & Voice Lines for Hololive 3D Hologram

class HologramAudioManager {
  constructor() {
    this.audioContext = null;
    this.isMuted = false;
  }

  getAudioContext() {
    if (!this.audioContext && typeof window !== "undefined") {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioContext = new AudioContextClass();
      }
    }
    if (this.audioContext && this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  // Play a cute bouncy cheerful anime sound effect
  playBounceSound() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
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
    } catch (err) {
      console.warn("Audio bounce error:", err);
    }
  }

  // Play a holographic futuristic chime effect
  playHologramChime() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const frequencies = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      frequencies.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";

        const startTime = ctx.currentTime + index * 0.05;
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.12, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.25);
      });
    } catch (err) {
      console.warn("Audio chime error:", err);
    }
  }

  // Speak character voice lines using Web Speech Synthesis tuned to cute anime pitch
  speakVoiceLine(text, characterType = "kobo") {
    if (this.isMuted || typeof window === "undefined" || !("speechSynthesis" in window)) {
      this.playBounceSound();
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Stop ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);

      if (characterType === "gura") {
        utterance.lang = "en-US";
        utterance.pitch = 1.6;
        utterance.rate = 1.15;
      } else if (characterType === "kobo") {
        utterance.lang = "id-ID";
        utterance.pitch = 1.7;
        utterance.rate = 1.2;
      } else {
        utterance.lang = "ja-JP";
        utterance.pitch = 1.5;
        utterance.rate = 1.1;
      }

      utterance.volume = 0.9;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      this.playBounceSound();
    }
  }
}

export const hologramAudio = new HologramAudioManager();
