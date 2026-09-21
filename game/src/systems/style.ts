// Système de Style : jauge 0-100, rangs, multiplicateur de lucioles.

export const RANK_NAMES = [
  'Promeneur',
  'Sauteur',
  'Cascadeur',
  'Acrobate',
  'Foudre',
  'Légende du Fonds',
];

const RANK_MIN = [0, 15, 35, 55, 75, 92];

export const STYLE_POINTS = {
  dash: 8,
  pogo: 12,
  nearmiss: 10,
  ring: 6,
  mush: 4,
  coin: 1,
  room: 10,
  airPerTick: 0.025, // +3/s en l'air
  groundDecay: 0.1, // -12/s au sol
} as const;

export class Style {
  points = 0;
  max = 0;

  add(n: number): void {
    this.points = Math.max(0, Math.min(100, this.points + n));
    if (this.points > this.max) this.max = this.points;
  }
  halve(): void {
    this.points *= 0.5;
  }
  reset(): void {
    this.points = 0;
  }
  tick(grounded: boolean): void {
    if (grounded && this.points > 0) {
      this.points = Math.max(0, this.points - STYLE_POINTS.groundDecay);
    }
  }
  rank(): number {
    let r = 0;
    for (let i = 0; i < RANK_MIN.length; i++) if (this.points >= RANK_MIN[i]) r = i;
    return r;
  }
  mult(): number {
    return 1 + Math.min(4, Math.floor(this.points / 20));
  }
  rankName(): string {
    return RANK_NAMES[this.rank()];
  }
  maxRankName(): string {
    let r = 0;
    for (let i = 0; i < RANK_MIN.length; i++) if (this.max >= RANK_MIN[i]) r = i;
    return RANK_NAMES[r];
  }
}
