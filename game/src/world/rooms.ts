// Salles dessinées en code (coordonnées en TUILES, y vers le bas).
// V1 : R0-R7 (Actes I-II, biomes hub + forêt). Variantes A/B seedées sur R1/R2/R4.
// Règles de conception : ouvertures ≥ 2 tuiles pour passer, sorties de puits
// dégagées (jamais de plateforme au-dessus), fossés ≤ 3 tuiles (saut) sauf
// fossés-dash ≥ 5 tuiles (lisibles), piques ≤ 3 tuiles d'affilée.

import { RNG, hashSeed } from '../core/rng';

export const TT = {
  EMPTY: 0,
  SOLID: 1,
  SPIKE_U: 2,
  SPIKE_D: 3,
  SPIKE_L: 4,
  SPIKE_R: 5,
} as const;

export interface Pt { x: number; y: number } // pixels (centre ou coin selon usage)

export interface RoomData {
  name: string;
  hint: string;
  biome: 'hub' | 'forest';
  w: number; h: number;
  grid: Uint8Array;
  coins: Pt[];
  mushs: Pt[]; // centre tuile
  crystals: Pt[];
  rings: Pt[];
  spawn: { x: number; y: number }; // top-left joueur (px)
  respawn: { x: number; y: number };
  goal: { x: number; y: number; w: number; h: number } | null;
  doors: { x: number; y: number; w: number; h: number }[];
  checkpoints: Pt[];
  enemies: Pt[]; // centre bas (pieds)
  pickups: { x: number; y: number; kind: 'dash' | 'cape' }[];
}

const T = 16;

class B {
  grid: Uint8Array;
  coins: Pt[] = [];
  mushs: Pt[] = [];
  crystals: Pt[] = [];
  rings: Pt[] = [];
  spawn = { x: 32, y: 32 };
  respawn = { x: 32, y: 32 };
  goal: RoomData['goal'] = null;
  doors: RoomData['doors'] = [];
  checkpoints: Pt[] = [];
  enemies: Pt[] = [];
  pickups: RoomData['pickups'] = [];
  constructor(public w: number, public h: number) {
    this.grid = new Uint8Array(w * h);
  }
  private set(tx: number, ty: number, v: number): void {
    if (tx >= 0 && ty >= 0 && tx < this.w && ty < this.h) this.grid[ty * this.w + tx] = v;
  }
  solid(x: number, y: number, w: number, h: number): void {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, TT.SOLID);
  }
  spikes(x: number, y: number, w: number, dir: 'U' | 'D' | 'L' | 'R'): void {
    const v = dir === 'U' ? TT.SPIKE_U : dir === 'D' ? TT.SPIKE_D : dir === 'L' ? TT.SPIKE_L : TT.SPIKE_R;
    for (let i = 0; i < w; i++) this.set(x + i, y, v);
  }
  /** Murs extérieurs + plafond (salles fermées, sortie = porte trigger). */
  shell(): void {
    this.solid(0, 0, this.w, 1);
    this.solid(0, 0, 1, this.h);
    this.solid(this.w - 1, 0, 1, this.h);
  }
  coin(tx: number, ty: number): void { this.coins.push({ x: tx * T + 8, y: ty * T + 8 }); }
  mush(tx: number, ty: number): void { this.mushs.push({ x: tx * T + 8, y: ty * T + 8 }); }
  crystal(tx: number, ty: number): void { this.crystals.push({ x: tx * T + 8, y: ty * T + 8 }); }
  ring(tx: number, ty: number): void { this.rings.push({ x: tx * T + 8, y: ty * T + 8 }); }
  /** spawn(tx, tySol) : pieds posés en haut de la rangée tySol. */
  spawnAt(tx: number, tySol: number): void {
    this.spawn = { x: tx * T + 4, y: tySol * T - 11 };
    this.respawn = { ...this.spawn };
  }
  goalAt(tx: number, ty: number): void {
    this.goal = { x: tx * T, y: ty * T, w: T, h: T * 2 };
  }
  doorAt(tx: number, ty: number): void {
    this.doors.push({ x: tx * T, y: ty * T, w: T, h: T * 2 });
  }
  checkpointAt(tx: number, ty: number): void {
    this.checkpoints.push({ x: tx * T + 8, y: ty * T + 8 });
  }
  enemyAt(tx: number, tySol: number): void {
    this.enemies.push({ x: tx * T + 8, y: tySol * T }); // pieds
  }
  pickupAt(tx: number, ty: number, kind: 'dash' | 'cape'): void {
    this.pickups.push({ x: tx * T + 8, y: ty * T + 8, kind });
  }
  done(name: string, hint: string, biome: 'hub' | 'forest'): RoomData {
    return {
      name, hint, biome, w: this.w, h: this.h, grid: this.grid,
      coins: this.coins, mushs: this.mushs, crystals: this.crystals, rings: this.rings,
      spawn: this.spawn, respawn: this.respawn, goal: this.goal, doors: this.doors,
      checkpoints: this.checkpoints, enemies: this.enemies, pickups: this.pickups,
    };
  }
}

// ---------- R0 : Le Bocal (hub / entraînement) ----------
function r0(): RoomData {
  const b = new B(60, 20);
  b.shell();
  b.solid(1, 18, 58, 2);
  b.mush(20, 17);
  b.coin(19, 14); b.coin(20, 13); b.coin(21, 14);
  b.solid(30, 15, 4, 1);
  b.coin(31, 14); b.coin(32, 14);
  // puits d'entraînement : ouverture lignes 16-17 (on passe dessous)
  b.solid(40, 10, 1, 6); b.solid(44, 10, 1, 6);
  b.coin(42, 15); b.coin(42, 12);
  b.ring(50, 13); // démo anneau (sauter dedans !)
  b.coin(50, 10);
  b.checkpointAt(55, 17);
  b.spawnAt(3, 18);
  b.doorAt(57, 16);
  return b.done('Le Bocal', 'Bienvenue au Fonds, Spécimen 115 ! ← → bouger • Espace sauter • Maj dasher • R salle', 'hub');
}

// ---------- R1 : Premiers pas (+ variante) ----------
// fossé central de 5 tuiles = leçon du dash (saut seul = 4 tuiles max).
function r1a(): RoomData {
  const b = new B(60, 20);
  b.shell();
  b.solid(1, 18, 12, 2); b.solid(16, 18, 13, 2); b.solid(34, 18, 12, 2); b.solid(49, 18, 10, 2);
  b.solid(36, 16, 3, 2);
  b.coin(13, 15); b.coin(14, 14); b.coin(15, 15);
  b.coin(29, 15); b.coin(30, 14); b.coin(31, 13); b.coin(32, 14); b.coin(33, 15);
  b.coin(46, 15); b.coin(47, 14); b.coin(48, 15);
  b.checkpointAt(34, 17);
  b.spawnAt(2, 18);
  b.doorAt(57, 16);
  return b.done('Premiers pas', 'Les fossés se sautent. Les GRANDS fossés se DASHENT (Maj en l’air !).', 'forest');
}
function r1b(): RoomData {
  const b = new B(60, 20);
  b.shell();
  b.solid(1, 18, 10, 2); b.solid(14, 18, 12, 2); b.solid(31, 18, 14, 2); b.solid(48, 18, 11, 2);
  b.solid(38, 16, 3, 2);
  b.coin(11, 15); b.coin(12, 14); b.coin(13, 15);
  b.coin(26, 15); b.coin(27, 14); b.coin(28, 13); b.coin(29, 14); b.coin(30, 15);
  b.coin(45, 15); b.coin(46, 14); b.coin(47, 15);
  b.checkpointAt(31, 17);
  b.spawnAt(2, 18);
  b.doorAt(57, 16);
  return b.done('Premiers pas', 'Les fossés se sautent. Les GRANDS fossés se DASHENT (Maj en l’air !).', 'forest');
}

// ---------- R2 : Canopée (murs + piques) (+ variante miroir) ----------
function r2a(): RoomData {
  const b = new B(40, 30);
  b.shell();
  b.solid(1, 28, 38, 2);
  b.spikes(10, 27, 3, 'U');
  b.solid(29, 8, 1, 18); // entrée lignes 26-27
  b.solid(33, 8, 1, 20);
  b.solid(24, 7, 6, 1); b.solid(33, 7, 6, 1); // sortie du puits dégagée (30-32)
  b.coin(31, 24); b.coin(31, 20); b.coin(31, 16); b.coin(31, 12); b.coin(31, 10);
  b.coin(11, 24);
  b.checkpointAt(27, 27);
  b.spawnAt(2, 28);
  b.doorAt(36, 5);
  return b.done('Canopée', 'Contre un mur : Espace = wall-jump, Haut = grimper. Les piques ? Ça pique.', 'forest');
}
function r2b(): RoomData {
  const b = new B(40, 30);
  b.shell();
  b.solid(1, 28, 38, 2);
  b.spikes(18, 27, 3, 'U');
  b.solid(6, 8, 1, 20);
  b.solid(10, 8, 1, 18); // entrée lignes 26-27
  b.solid(1, 7, 5, 1); b.solid(10, 7, 6, 1); // sortie du puits dégagée (6-9)
  b.coin(8, 24); b.coin(8, 20); b.coin(8, 16); b.coin(8, 12); b.coin(8, 10);
  b.coin(19, 24);
  b.checkpointAt(12, 27);
  b.spawnAt(36, 28);
  b.doorAt(3, 5);
  return b.done('Canopée', 'Contre un mur : Espace = wall-jump, Haut = grimper. Les piques ? Ça pique.', 'forest');
}

// ---------- R3 : Champignonnière ----------
function r3(): RoomData {
  const b = new B(60, 20);
  b.shell();
  b.solid(1, 18, 58, 2);
  b.spikes(15, 17, 3, 'U'); b.mush(18, 17); b.spikes(19, 17, 6, 'U');
  b.spikes(35, 17, 3, 'U'); b.mush(38, 17); b.spikes(39, 17, 8, 'U');
  b.coin(17, 14); b.coin(18, 12); b.coin(19, 14);
  b.coin(37, 14); b.coin(38, 12); b.coin(39, 14);
  b.checkpointAt(30, 17);
  b.spawnAt(2, 18);
  b.doorAt(57, 16);
  return b.done('Champignonnière', 'Les champignons rebondissent. Les piques, non. Choisis ton camp. 🍄', 'forest');
}

// ---------- R4 : Pogo Party (+ variante) ----------
function r4a(): RoomData {
  const b = new B(64, 20);
  b.shell();
  b.solid(1, 18, 11, 2);
  b.solid(14, 17, 15, 1);
  b.enemyAt(16, 17); b.enemyAt(24, 17);
  b.crystal(21, 13);
  b.solid(8, 15, 3, 1); b.solid(4, 13, 5, 1);
  b.pickupAt(6, 12, 'dash');
  b.solid(31, 18, 9, 2); b.solid(49, 18, 14, 2);
  b.solid(40, 19, 9, 1);
  b.spikes(40, 18, 3, 'U'); b.mush(43, 18); b.spikes(44, 18, 5, 'U');
  b.coin(15, 14); b.coin(21, 11); b.coin(27, 14); b.coin(43, 14);
  b.checkpointAt(33, 17);
  b.spawnAt(2, 18);
  b.doorAt(61, 16);
  return b.done('Pogo Party', 'Saute sur les Bouftouts pour POGOter ! Le cristal rend ton dash. 💨', 'forest');
}
function r4b(): RoomData {
  const b = new B(64, 20);
  b.shell();
  b.solid(1, 18, 13, 2);
  b.solid(16, 17, 15, 1);
  b.enemyAt(18, 17); b.enemyAt(27, 17);
  b.crystal(23, 13);
  b.solid(8, 15, 3, 1); b.solid(4, 13, 5, 1);
  b.pickupAt(6, 12, 'dash');
  b.solid(33, 18, 9, 2); b.solid(51, 18, 12, 2);
  b.solid(42, 19, 9, 1);
  b.spikes(42, 18, 3, 'U'); b.mush(45, 18); b.spikes(46, 18, 5, 'U');
  b.coin(17, 14); b.coin(23, 11); b.coin(29, 14); b.coin(45, 14);
  b.checkpointAt(35, 17);
  b.spawnAt(2, 18);
  b.doorAt(61, 16);
  return b.done('Pogo Party', 'Saute sur les Bouftouts pour POGOter ! Le cristal rend ton dash. 💨', 'forest');
}

// ---------- R5 : Lames (dash vertical + cape) ----------
function r5(): RoomData {
  const b = new B(56, 24);
  b.shell();
  b.solid(1, 22, 54, 2);
  b.spikes(8, 21, 3, 'U');
  b.solid(14, 20, 3, 1);
  b.spikes(18, 21, 3, 'U');
  b.solid(24, 10, 1, 10); // ouverture lignes 20-21
  b.solid(28, 10, 1, 10);
  b.crystal(26, 17); b.crystal(26, 12);
  b.solid(22, 9, 2, 1); b.solid(29, 9, 12, 1); // sortie du puits dégagée (24-28)
  b.solid(42, 12, 4, 1); b.solid(47, 15, 4, 1);
  b.pickupAt(31, 18, 'cape');
  b.coin(10, 19); b.coin(15, 18); b.coin(20, 19);
  b.coin(26, 15); b.coin(26, 10); b.coin(43, 10); b.coin(48, 13);
  b.checkpointAt(23, 21); b.checkpointAt(30, 8);
  b.spawnAt(2, 22);
  b.doorAt(52, 20);
  return b.done('Lames', 'Dash vers le HAUT + cristaux = fusée. Quelque chose brille sous la corniche… 🚀', 'forest');
}

// ---------- R6 : Ascension (verticale + anneaux) ----------
function r6(): RoomData {
  const b = new B(24, 64);
  b.shell();
  b.solid(1, 62, 22, 2);
  // Puits A
  b.solid(7, 48, 1, 12); // ouverture lignes 60-61
  b.solid(12, 48, 1, 14);
  b.solid(4, 47, 4, 1); b.solid(12, 47, 8, 1); // P1 (sortie dégagée 8-11)
  // Puits B
  b.solid(15, 34, 1, 12); // ouverture lignes 46-47
  b.solid(20, 34, 1, 14);
  b.solid(12, 33, 4, 1); b.solid(20, 33, 3, 1); // P2 (sortie dégagée 16-19)
  // Chaîne d'anneaux (à gauche de P3) vers P3
  b.ring(8, 29); b.ring(8, 25); b.ring(8, 21);
  b.solid(10, 19, 10, 1); // P3
  // Puits D
  b.solid(14, 6, 1, 12); // ouverture lignes 18-19
  b.solid(19, 6, 1, 14);
  b.solid(12, 5, 3, 1); b.solid(19, 5, 4, 1); // P4 (sortie dégagée 15-18)
  b.coin(9, 58); b.coin(9, 54); b.coin(9, 50);
  b.coin(17, 44); b.coin(17, 40); b.coin(17, 36);
  b.coin(8, 27); b.coin(8, 23);
  b.coin(16, 14); b.coin(16, 10);
  b.checkpointAt(6, 46); b.checkpointAt(13, 32); b.checkpointAt(11, 18);
  b.spawnAt(3, 62);
  b.doorAt(20, 3);
  return b.done('Ascension', 'Grimpe, petit spécimen ! Les anneaux rendent ton dash ET te propulsent. ⭕', 'forest');
}

// ---------- R7 : Objectif (finale) ----------
function r7(): RoomData {
  const b = new B(40, 20);
  b.shell();
  b.solid(1, 18, 38, 2);
  b.coin(10, 16); b.coin(14, 15); b.coin(18, 15); b.coin(22, 15); b.coin(26, 15); b.coin(30, 16);
  b.spawnAt(2, 18);
  b.goalAt(34, 16);
  return b.done('Le Grand Objectif', 'Le Grand Objectif t’observe… Fonce, Spécimen 115 ! 👁️', 'forest');
}

/** Assemble le monde selon la seed (variantes A/B). */
export function buildRooms(seedStr: string): RoomData[] {
  const rng = new RNG(hashSeed('rooms:' + seedStr));
  const pickA = () => rng.int(2) === 0;
  return [
    r0(),
    pickA() ? r1a() : r1b(),
    pickA() ? r2a() : r2b(),
    r3(),
    pickA() ? r4a() : r4b(),
    r5(),
    r6(),
    r7(),
  ];
}
