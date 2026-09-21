// RNG déterministe (mulberry32) + hash de seed (xfnv1a).
// JAMAIS Math.random() dans la sim. 3 flux : WORLD / GAME / VISUAL.

export function hashSeed(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export class RNG {
  private s: number;
  constructor(seed: number) {
    this.s = seed >>> 0 || 1;
  }
  next(): number {
    // mulberry32
    this.s = (this.s + 0x6d2b79f5) >>> 0;
    let t = this.s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  int(n: number): number {
    return Math.floor(this.next() * n);
  }
  range(a: number, b: number): number {
    return a + this.next() * (b - a);
  }
  pick<T>(arr: T[]): T {
    return arr[this.int(arr.length)];
  }
  fork(salt: number): RNG {
    return new RNG((this.s ^ Math.imul(salt, 0x9e3779b9)) >>> 0);
  }
}

export function dailySeed(date = new Date()): string {
  const y = date.getFullYear();
  const m = ('0' + (date.getMonth() + 1)).slice(-2);
  const d = ('0' + date.getDate()).slice(-2);
  return 'DAILY-' + y + m + d;
}

const SEED_WORDS = ['LUMEN', 'BOUFT', 'PIQUE', 'DASH', 'FROST', 'CRIST', 'MICRO', 'LAME'];
export function randomSeedString(rng: RNG): string {
  const w = rng.pick(SEED_WORDS);
  const n = ('0000' + rng.int(1296).toString(36).toUpperCase()).slice(-4);
  return w + '-' + n;
}
