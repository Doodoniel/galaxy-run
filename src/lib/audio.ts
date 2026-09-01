/**
 * Sound for the mission.
 *
 * Effects are synthesised with the Web Audio API so the game ships with no
 * audio files at all; speech uses the browser's own English voice, which is
 * what makes the "listen and draw" stage work without a teacher reading aloud.
 */

let ctx: AudioContext | null = null;
let muted = false;

export function setMuted(value: boolean) {
  muted = value;
  if (muted) window.speechSynthesis?.cancel();
}

export function isMuted() {
  return muted;
}

function audio(): AudioContext | null {
  if (muted) return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as any).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

interface ToneOptions {
  freq: number;
  to?: number;
  dur?: number;
  type?: OscillatorType;
  gain?: number;
  delay?: number;
}

function tone({ freq, to, dur = 0.16, type = 'sine', gain = 0.14, delay = 0 }: ToneOptions) {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to) osc.frequency.exponentialRampToValueAtTime(Math.max(to, 1), t0 + dur);
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(amp).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noise(dur = 0.4, gain = 0.16, sweepFrom = 1800) {
  const ac = audio();
  if (!ac) return;
  const frames = Math.floor(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, frames, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(sweepFrom, ac.currentTime);
  filter.frequency.exponentialRampToValueAtTime(180, ac.currentTime + dur);
  const amp = ac.createGain();
  amp.gain.setValueAtTime(gain, ac.currentTime);
  amp.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
  src.connect(filter).connect(amp).connect(ac.destination);
  src.start();
}

export const sfx = {
  tap: () => tone({ freq: 520, dur: 0.06, type: 'triangle', gain: 0.07 }),
  right: () => {
    tone({ freq: 660, dur: 0.1, type: 'triangle' });
    tone({ freq: 880, dur: 0.14, type: 'triangle', delay: 0.08 });
    tone({ freq: 1320, dur: 0.2, type: 'sine', gain: 0.1, delay: 0.16 });
  },
  wrong: () => {
    tone({ freq: 240, to: 120, dur: 0.3, type: 'sawtooth', gain: 0.1 });
    noise(0.25, 0.09, 900);
  },
  star: () => {
    [784, 988, 1319, 1568].forEach((f, i) =>
      tone({ freq: f, dur: 0.26, type: 'triangle', gain: 0.11, delay: i * 0.07 }),
    );
  },
  launch: () => {
    noise(1.1, 0.2, 2600);
    tone({ freq: 90, to: 420, dur: 1.0, type: 'sawtooth', gain: 0.09 });
  },
  roll: () => {
    for (let i = 0; i < 6; i++) tone({ freq: 300 + i * 60, dur: 0.05, type: 'square', gain: 0.05, delay: i * 0.06 });
  },
  move: () => tone({ freq: 700, to: 1100, dur: 0.09, type: 'sine', gain: 0.07 }),
  meteor: () => {
    noise(0.7, 0.22, 3000);
    tone({ freq: 160, to: 55, dur: 0.6, type: 'sawtooth', gain: 0.12 });
  },
  wormhole: () => {
    tone({ freq: 200, to: 1400, dur: 0.5, type: 'sine', gain: 0.1 });
    tone({ freq: 1400, to: 200, dur: 0.5, type: 'sine', gain: 0.07, delay: 0.25 });
  },
  tick: () => tone({ freq: 1000, dur: 0.03, type: 'square', gain: 0.05 }),
  fanfare: () => {
    [523, 659, 784, 1047, 1319].forEach((f, i) =>
      tone({ freq: f, dur: 0.42, type: 'triangle', gain: 0.12, delay: i * 0.11 }),
    );
  },
};

/* ------------------------------------------------------------------ *
 * Speech
 * ------------------------------------------------------------------ */

let cachedVoice: SpeechSynthesisVoice | null | undefined;

function pickVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice !== undefined) return cachedVoice;
  const voices = window.speechSynthesis?.getVoices() ?? [];
  if (!voices.length) return null; // voices load async; try again next call
  const score = (v: SpeechSynthesisVoice) => {
    let s = 0;
    if (/^en[-_]GB/i.test(v.lang)) s += 6;
    else if (/^en[-_]US/i.test(v.lang)) s += 5;
    else if (/^en/i.test(v.lang)) s += 4;
    if (/natural|neural|premium|enhanced/i.test(v.name)) s += 3;
    if (/google/i.test(v.name)) s += 2;
    return s;
  };
  const best = voices.filter((v) => /^en/i.test(v.lang)).sort((a, b) => score(b) - score(a))[0];
  cachedVoice = best ?? null;
  return cachedVoice;
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoice = undefined;
    pickVoice();
  };
}

export function speak(text: string, opts: { rate?: number; onEnd?: () => void } = {}) {
  const synth = window.speechSynthesis;
  if (!synth || muted) {
    opts.onEnd?.();
    return;
  }
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const voice = pickVoice();
  if (voice) u.voice = voice;
  u.lang = voice?.lang ?? 'en-GB';
  u.rate = opts.rate ?? 0.92;
  u.pitch = 1;
  if (opts.onEnd) {
    u.onend = opts.onEnd;
    u.onerror = opts.onEnd;
  }
  synth.speak(u);
}

export function stopSpeaking() {
  window.speechSynthesis?.cancel();
}

export const speechAvailable = () => typeof window !== 'undefined' && !!window.speechSynthesis;
