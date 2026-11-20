'use client';

export type PhaseSound = 'focus' | 'break';

/** Two short rising notes for focus, one long falling pair for a break. */
const NOTES: Record<PhaseSound, { hz: number; at: number }[]> = {
  focus: [
    { hz: 523.25, at: 0 },
    { hz: 783.99, at: 0.16 },
  ],
  break: [
    { hz: 783.99, at: 0 },
    { hz: 523.25, at: 0.22 },
  ],
};
const LENGTH_S: Record<PhaseSound, number> = { focus: 0.5, break: 1.6 };
const PEAK_GAIN = 0.07;

let context: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  context ??= new Ctor();
  return context;
}

/** Play a soft chime. Silently does nothing where audio is unavailable or not yet allowed. */
export function playPhaseSound(kind: PhaseSound): void {
  try {
    const audio = getContext();
    if (!audio) return;
    if (audio.state === 'suspended') void audio.resume();
    for (const note of NOTES[kind]) {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = note.hz;
      const start = audio.currentTime + note.at;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(PEAK_GAIN, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + LENGTH_S[kind]);
      oscillator.connect(gain).connect(audio.destination);
      oscillator.start(start);
      oscillator.stop(start + LENGTH_S[kind] + 0.05);
    }
  } catch {
    // A blocked or missing audio device must never interrupt a session.
  }
}
