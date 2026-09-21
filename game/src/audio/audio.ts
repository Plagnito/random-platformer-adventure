// Audio 100 % synthétisé (WebAudio) : SFX + musique générative adaptative.
// Aucun asset, aucun flux réseau. Démarre au premier geste (bouton).

export class AudioSys {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxG: GainNode | null = null;
  private musG: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  musicOn = true;
  sfxOn = true;
  layer = 0; // 0 basse, 1 +arpège, 2 +lead (selon rang de style)
  private seqOn = false;
  private nextT = 0;
  private step = 0;

  ensure(): void {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(this.ctx.destination);
      this.sfxG = this.ctx.createGain();
      this.sfxG.gain.value = this.sfxOn ? 0.5 : 0;
      this.sfxG.connect(this.master);
      this.musG = this.ctx.createGain();
      this.musG.gain.value = this.musicOn ? 0.14 : 0;
      this.musG.connect(this.master);
      // tampon de bruit réutilisé
      const len = this.ctx.sampleRate;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.startSeq();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  setMusic(on: boolean): void {
    this.musicOn = on;
    if (this.musG && this.ctx) this.musG.gain.setValueAtTime(on ? 0.14 : 0, this.ctx.currentTime);
  }
  setSfx(on: boolean): void {
    this.sfxOn = on;
    if (this.sfxG && this.ctx) this.sfxG.gain.setValueAtTime(on ? 0.5 : 0, this.ctx.currentTime);
  }

  private tone(f0: number, f1: number, dur: number, type: OscillatorType, vol: number, delay = 0): void {
    if (!this.ctx || !this.sfxG || !this.sfxOn) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(Math.max(20, f0), t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(this.sfxG);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  private noise(dur: number, vol: number, freq: number, delay = 0): void {
    if (!this.ctx || !this.sfxG || !this.noiseBuf || !this.sfxOn) return;
    const t = this.ctx.currentTime + delay;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(this.sfxG);
    src.start(t);
    src.stop(t + dur + 0.05);
  }

  // ---------- SFX ----------
  jump(sup: boolean): void {
    this.tone(sup ? 220 : 300, sup ? 700 : 620, sup ? 0.25 : 0.14, 'square', sup ? 0.25 : 0.16);
  }
  walljump(): void {
    this.tone(350, 700, 0.12, 'square', 0.16);
  }
  dash(): void {
    this.noise(0.16, 0.3, 2400);
    this.tone(900, 220, 0.14, 'sawtooth', 0.12);
  }
  pogo(): void {
    this.tone(500, 950, 0.12, 'square', 0.22);
    this.tone(1000, 1400, 0.1, 'sine', 0.15, 0.03);
  }
  coin(mult: number): void {
    const base = 880 * (1 + mult * 0.06);
    this.tone(base, base, 0.07, 'sine', 0.2);
    this.tone(base * 1.5, base * 1.5, 0.12, 'sine', 0.2, 0.06);
  }
  death(): void {
    this.tone(400, 60, 0.35, 'sawtooth', 0.25);
    this.noise(0.25, 0.25, 900);
  }
  checkpoint(): void {
    this.tone(520, 780, 0.16, 'triangle', 0.2);
  }
  ring(): void {
    this.tone(300, 1200, 0.2, 'sine', 0.25);
  }
  mush(): void {
    this.tone(200, 90, 0.18, 'sine', 0.3);
    this.tone(400, 800, 0.14, 'triangle', 0.15, 0.05);
  }
  crystal(): void {
    this.tone(1200, 1800, 0.12, 'sine', 0.16);
  }
  pickup(): void {
    this.tone(660, 660, 0.09, 'square', 0.16);
    this.tone(880, 880, 0.09, 'square', 0.16, 0.09);
    this.tone(1320, 1320, 0.16, 'square', 0.16, 0.18);
  }
  ui(): void {
    this.tone(600, 800, 0.07, 'triangle', 0.14);
  }
  land(hard: boolean): void {
    this.noise(hard ? 0.12 : 0.06, hard ? 0.22 : 0.1, 500);
  }
  skid(): void {
    this.noise(0.1, 0.1, 3000);
  }
  respawn(): void {
    this.tone(500, 700, 0.1, 'triangle', 0.12);
  }
  room(): void {
    this.tone(440, 660, 0.18, 'triangle', 0.18);
  }
  gold(): void {
    this.tone(1320, 1760, 0.2, 'sine', 0.2);
  }
  rankup(): void {
    this.tone(700, 1400, 0.22, 'triangle', 0.2);
  }
  record(): void {
    const seq = [523, 659, 784, 1047, 1319];
    seq.forEach((f, i) => this.tone(f, f, 0.16, 'triangle', 0.22, i * 0.09));
  }
  finish(): void {
    const seq = [523, 659, 784, 1047];
    seq.forEach((f, i) => this.tone(f, f, 0.2, 'triangle', 0.2, i * 0.11));
  }

  // ---------- musique générative (la mineur pentatonique) ----------
  private startSeq(): void {
    if (this.seqOn || !this.ctx) return;
    this.seqOn = true;
    this.nextT = this.ctx.currentTime + 0.1;
    const sixteenth = 60 / 104 / 4;
    const bass = [55, 0, 55, 55, 0, 55, 0, 65.41, 55, 0, 55, 55, 0, 49, 58.27, 73.42];
    const arp = [440, 523.25, 587.33, 659.25, 523.25, 587.33, 440, 392, 440, 523.25, 659.25, 587.33, 523.25, 440, 392, 329.63];
    const lead = [880, 0, 0, 0, 783.99, 0, 659.25, 0, 0, 0, 587.33, 0, 523.25, 0, 0, 0];
    window.setInterval(() => {
      if (!this.ctx || !this.musG || !this.musicOn) return;
      while (this.nextT < this.ctx.currentTime + 0.18) {
        const i = this.step % 16;
        this.mnote(bass[i], this.nextT, sixteenth * 1.8, 'triangle', 0.5);
        if (this.layer >= 1) this.mnote(arp[i], this.nextT, sixteenth * 0.95, 'sine', 0.22);
        if (this.layer >= 2) this.mnote(lead[i], this.nextT, sixteenth * 2.5, 'sine', 0.16);
        this.nextT += sixteenth;
        this.step++;
      }
    }, 45);
  }

  private mnote(freq: number, t: number, dur: number, type: OscillatorType, vol: number): void {
    if (!this.ctx || !this.musG || freq <= 0) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(this.musG);
    o.start(t);
    o.stop(t + dur + 0.05);
  }
}
