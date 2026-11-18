const NOTE_TONES = ['lavender', 'blush', 'blue', 'mint', 'peach', 'cream'] as const;

export function taskNoteTone(id: string) {
  let hash = 0;
  for (const character of id) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return NOTE_TONES[hash % NOTE_TONES.length]!;
}
