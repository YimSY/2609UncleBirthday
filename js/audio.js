/**
 * 16-Bit Japanese Arcade Audio Engine using Web Audio API
 * Synthesizes all retro sound effects and multi-track Happy Birthday chiptune song
 */
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.bgmPlaying = false;
    this.bgmNodes = [];
    this.birthdayTimeout = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopBGM();
    }
    return this.isMuted;
  }

  // --- Sound Effects ---

  // Racket hitting the squash ball
  playHit(power = 1, isSmash = false) {
    if (this.isMuted || !this.ctx) return;
    this.init();

    const t = this.ctx.currentTime;
    
    // Impact noise burst
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.04);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = isSmash ? 'highpass' : 'bandpass';
    noiseFilter.frequency.setValueAtTime(isSmash ? 2400 : 1600, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(isSmash ? 0.35 : 0.22, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(t);

    // Tonal pop (string tension)
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = isSmash ? 'sawtooth' : 'triangle';
    const startFreq = isSmash ? 580 * power : 420 * power;
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.08);

    gain.gain.setValueAtTime(isSmash ? 0.4 : 0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  // Front Wall Rubber Bounce (resonant hollow thud)
  playWallBounce() {
    if (this.isMuted || !this.ctx) return;
    this.init();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.exponentialRampToValueAtTime(65, t + 0.12);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  // Floor Bounce (crisp wood tap)
  playFloorBounce() {
    if (this.isMuted || !this.ctx) return;
    this.init();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.06);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  // Tin Hit (metallic error clatter)
  playTin() {
    if (this.isMuted || !this.ctx) return;
    this.init();

    const t = this.ctx.currentTime;
    [180, 240, 310].forEach(f => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(f, t);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.15);
    });
  }

  // Referee Whistle (retro arcade two-tone)
  playWhistle() {
    if (this.isMuted || !this.ctx) return;
    this.init();

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'triangle';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(2200, t);
    osc2.frequency.setValueAtTime(2280, t);

    // Warble
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(25, t);
    lfoGain.gain.setValueAtTime(80, t);
    lfo.connect(osc1.frequency);
    lfo.connect(osc2.frequency);
    lfo.start(t);
    lfo.stop(t + 0.28);

    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.03);
    gain.gain.setValueAtTime(0.2, t + 0.22);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.28);
    osc2.stop(t + 0.28);
  }

  // Point Scored (cheerful 16-bit chime)
  playPointScored(isPlayer) {
    if (this.isMuted || !this.ctx) return;
    this.init();

    const t = this.ctx.currentTime;
    const notes = isPlayer ? [523.25, 659.25, 783.99, 1046.5] : [440, 392, 349.23, 261.63];

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t + idx * 0.07);

      gain.gain.setValueAtTime(0, t);
      gain.gain.setValueAtTime(0.12, t + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.07 + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + idx * 0.07);
      osc.stop(t + idx * 0.07 + 0.12);
    });
  }

  // Deuce / Match Point Alarm
  playDeuce() {
    if (this.isMuted || !this.ctx) return;
    this.init();

    const t = this.ctx.currentTime;
    [440, 554.37, 659.25].forEach(freq => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.35);
    });
  }

  // Sad defeat tune (womp womp)
  playLoss() {
    if (this.isMuted || !this.ctx) return;
    this.init();

    const t = this.ctx.currentTime;
    const notes = [
      { f: 392.00, dur: 0.28 },
      { f: 369.99, dur: 0.28 },
      { f: 349.23, dur: 0.28 },
      { f: 329.63, dur: 0.70 }
    ];

    let start = t;
    notes.forEach((n, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(n.f, start);
      if (i === notes.length - 1) {
        osc.frequency.exponentialRampToValueAtTime(180, start + n.dur);
      }

      gain.gain.setValueAtTime(0.18, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + n.dur);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(start);
      osc.stop(start + n.dur);
      start += n.dur * 0.9;
    });
  }

  // Match Win fanfare
  playLevelWin() {
    if (this.isMuted || !this.ctx) return;
    this.init();

    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 880, 1046.5, 1318.5];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t + i * 0.1);
      gain.gain.setValueAtTime(0.15, t + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + i * 0.1);
      osc.stop(t + i * 0.1 + 0.2);
    });
  }

  // --- Grand Victory: Full 16-Bit Chiptune "Happy Birthday" Soundtrack ---
  playHappyBirthdaySong(onFinish) {
    if (this.isMuted || !this.ctx) return;
    this.init();
    this.stopBGM();

    this.bgmPlaying = true;
    const t0 = this.ctx.currentTime + 0.05;
    const bpm = 126;
    const beat = 60 / bpm; // ~0.476s per beat

    const G4 = 392.00, A4 = 440.00, B4 = 493.88, C5 = 523.25, D5 = 587.33, E5 = 659.25, F5 = 698.46, G5 = 783.99;
    const C3 = 130.81, G3 = 196.00, A3 = 220.00, F3 = 174.61, E3 = 164.81, D3 = 146.83;

    const melody = [
      // Verse 1
      { note: G4, dur: 0.75 }, { note: G4, dur: 0.25 }, { note: A4, dur: 1 }, { note: G4, dur: 1 }, { note: C5, dur: 1 }, { note: B4, dur: 2 },
      // Verse 2
      { note: G4, dur: 0.75 }, { note: G4, dur: 0.25 }, { note: A4, dur: 1 }, { note: G4, dur: 1 }, { note: D5, dur: 1 }, { note: C5, dur: 2 },
      // Verse 3 (Happy Birthday dear Dad!)
      { note: G4, dur: 0.75 }, { note: G4, dur: 0.25 }, { note: G5, dur: 1 }, { note: E5, dur: 1 }, { note: C5, dur: 1 }, { note: B4, dur: 1 }, { note: A4, dur: 2 },
      // Verse 4
      { note: F5, dur: 0.75 }, { note: F5, dur: 0.25 }, { note: E5, dur: 1 }, { note: C5, dur: 1 }, { note: D5, dur: 1 }, { note: C5, dur: 2.5 }
    ];

    const bass = [
      // Verse 1 (C - G)
      { note: C3, dur: 3 }, { note: G3, dur: 3 },
      // Verse 2 (G - C)
      { note: G3, dur: 3 }, { note: C3, dur: 3 },
      // Verse 3 (C - F)
      { note: C3, dur: 2 }, { note: E3, dur: 1 }, { note: F3, dur: 3 },
      // Verse 4 (C - G - C)
      { note: C3, dur: 1.5 }, { note: G3, dur: 1.5 }, { note: C3, dur: 3 }
    ];

    let time = t0;

    // Lead Melody (Square Wave with Vibrato)
    melody.forEach(item => {
      const duration = item.dur * beat;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(item.note, time);

      // Light vibrato
      const vibrato = this.ctx.createOscillator();
      const vibGain = this.ctx.createGain();
      vibrato.frequency.setValueAtTime(6, time);
      vibGain.gain.setValueAtTime(3.5, time);
      vibrato.connect(osc.frequency);
      vibrato.start(time);
      vibrato.stop(time + duration * 0.92);

      // Envelope
      gain.gain.setValueAtTime(0.01, time);
      gain.gain.linearRampToValueAtTime(0.18, time + 0.02);
      gain.gain.setValueAtTime(0.15, time + duration * 0.7);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration * 0.92);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(time);
      osc.stop(time + duration * 0.92);

      this.bgmNodes.push(osc, gain, vibrato, vibGain);
      time += duration;
    });

    const totalSongDuration = time - t0;

    // Bassline (Triangle Wave)
    let bassTime = t0;
    bass.forEach(item => {
      const duration = item.dur * beat;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(item.note, bassTime);

      gain.gain.setValueAtTime(0.2, bassTime);
      gain.gain.setValueAtTime(0.18, bassTime + duration * 0.85);
      gain.gain.exponentialRampToValueAtTime(0.001, bassTime + duration * 0.95);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(bassTime);
      osc.stop(bassTime + duration * 0.95);

      this.bgmNodes.push(osc, gain);
      bassTime += duration;
    });

    // 16-bit retro drum ticks
    let drumTime = t0;
    while (drumTime < time) {
      this.scheduleDrumTick(drumTime);
      drumTime += beat;
    }

    this.birthdayTimeout = setTimeout(() => {
      if (this.bgmPlaying && !this.isMuted) {
        this.playHappyBirthdaySong(onFinish);
      }
      if (onFinish) onFinish();
    }, (totalSongDuration + 0.5) * 1000);
  }

  scheduleDrumTick(time) {
    if (!this.ctx) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.02);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(5000, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.05, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.02);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(time);
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.birthdayTimeout) {
      clearTimeout(this.birthdayTimeout);
      this.birthdayTimeout = null;
    }
    this.bgmNodes.forEach(node => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch (e) {
        // ignore already stopped nodes
      }
    });
    this.bgmNodes = [];
  }
}

window.soundEngine = new SoundEngine();
