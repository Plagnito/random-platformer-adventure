// Stockage local-first (localStorage). Tout le jeu fonctionne sans compte.
// Si le stockage est indisponible (navigation privée), on dégrade silently.

const P = 'rpa1:';

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(P + key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(P + key, JSON.stringify(value));
  } catch {
    /* quota / privé : on ignore */
  }
}

export interface PBData {
  ticks: number;
  deaths: number;
  date: string;
  splits: number[];
}

// Fantôme V0 : positions par tick (V1 = replay d'inputs, 2 octets/tick).
// frames = [roomIdx, x, y, face, dashFlag] x N
export interface GhostData {
  ticks: number;
  frames: number[][];
}

export interface Settings {
  music: boolean;
  sfx: boolean;
  detente: boolean;
  lastSeed: string;
}

export const pbKey = (mode: string, seed: string) => `pb:${mode}:${seed}`;
export const ghostKey = (mode: string, seed: string) => `ghost:${mode}:${seed}`;

export function loadSettings(): Settings {
  return load<Settings>('settings', { music: true, sfx: true, detente: false, lastSeed: '' });
}
export function saveSettings(s: Settings): void {
  save('settings', s);
}

export function loadAch(): string[] {
  return load<string[]>('ach', []);
}
export function saveAch(ids: string[]): void {
  save('ach', ids);
}
