// État runtime d'une salle : collisions, ennemis, interacteurs.
// 100 % déterministe (ticks entiers, pas de Math.* transcendant).

import { C, TILE, DT } from '../core/constants';
import { TT, type RoomData } from './rooms';
import type { Player, PEvent } from '../player/player';
import type { TickInput } from '../core/input';
import { DIAG } from '../core/constants';

export interface Enemy { x: number; y: number; dir: number; squish: number }
export interface Crystal { x: number; y: number; cd: number }

function overlap(ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

export class World {
  w: number; h: number; // px
  gw: number; gh: number; // tuiles
  grid: Uint8Array;
  data: RoomData;
  enemies: Enemy[] = [];
  crystals: Crystal[] = [];
  mushPulse: number[] = [];
  coinsTaken = new Set<number>();
  pickupsTaken = new Set<number>();
  cpAnnounced = new Set<number>();

  constructor(data: RoomData) {
    this.data = data;
    this.gw = data.w; this.gh = data.h;
    this.grid = data.grid;
    this.w = data.w * TILE; this.h = data.h * TILE;
    this.mushPulse = data.mushs.map(() => 0);
    this.resetDynamics();
  }

  resetDynamics(): void {
    this.enemies = this.data.enemies.map((e) => ({
      x: e.x - C.ENEMY_W / 2, y: e.y - C.ENEMY_H, dir: 1, squish: 0,
    }));
    this.crystals = this.data.crystals.map((c) => ({ x: c.x, y: c.y, cd: 0 }));
  }

  solidAt(px: number, py: number): boolean {
    const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
    if (ty >= this.gh) return false; // le vide sous la salle (mort)
    if (tx < 0 || tx >= this.gw || ty < 0) return true;
    return this.grid[ty * this.gw + tx] === TT.SOLID;
  }

  solidRect(x: number, y: number, w: number, h: number): boolean {
    const x0 = Math.floor(x / TILE), x1 = Math.floor((x + w - 0.01) / TILE);
    const y0 = Math.floor(y / TILE), y1 = Math.floor((y + h - 0.01) / TILE);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (ty >= this.gh) continue;
        if (tx < 0 || tx >= this.gw || ty < 0) return true;
        if (this.grid[ty * this.gw + tx] === TT.SOLID) return true;
      }
    }
    return false;
  }

  wallSide(p: Player): number {
    const m1 = p.y + 2, m2 = p.y + C.PH - 2;
    if (this.solidAt(p.x - 1, m1) || this.solidAt(p.x - 1, m2)) return -1;
    if (this.solidAt(p.x + C.PW + 1, m1) || this.solidAt(p.x + C.PW + 1, m2)) return 1;
    return 0;
  }

  tick(): void {
    for (const e of this.enemies) {
      if (e.squish > 0) e.squish--;
      const step = e.dir * C.ENEMY_SPEED * DT;
      const lead = e.dir > 0 ? e.x + C.ENEMY_W + step + 1 : e.x + step - 1;
      const blocked = this.solidAt(lead, e.y + 6);
      const noFloor = !this.solidAt(lead, e.y + C.ENEMY_H + 2);
      if (blocked || noFloor) e.dir = -e.dir as 1 | -1;
      else e.x += step;
    }
    for (const c of this.crystals) if (c.cd > 0) c.cd--;
    for (let i = 0; i < this.mushPulse.length; i++) if (this.mushPulse[i] > 0) this.mushPulse[i]--;
  }

  private kill(p: Player, ev: PEvent[]): void {
    if (p.invuln > 0 || p.dead) return;
    p.dead = true;
    ev.push({ t: 'die', x: p.cx(), y: p.cy() });
  }

  /** Interactions joueur <-> monde. Retourne les triggers de sortie. */
  interact(p: Player, inp: TickInput, ev: PEvent[]): { door: boolean; goal: boolean } {
    let door = false, goal = false;
    if (p.dead) return { door, goal };
    const px = p.x, py = p.y, pw = C.PW, ph = C.PH;

    // --- piques (hitbox réduite = pardonnante) ---
    const x0 = Math.floor(px / TILE), x1 = Math.floor((px + pw) / TILE);
    const y0 = Math.floor(py / TILE), y1 = Math.floor((py + ph) / TILE);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (tx < 0 || ty < 0 || tx >= this.gw || ty >= this.gh) continue;
        const t = this.grid[ty * this.gw + tx];
        if (t < TT.SPIKE_U || t > TT.SPIKE_R) continue;
        const bx = tx * TILE, by = ty * TILE;
        let hx = bx, hy = by, hw = TILE, hh = TILE;
        if (t === TT.SPIKE_U) { hx += 2; hy += 9; hw = 12; hh = 7; }
        else if (t === TT.SPIKE_D) { hx += 2; hw = 12; hh = 7; }
        else if (t === TT.SPIKE_L) { hx += 9; hy += 2; hw = 7; hh = 12; }
        else { hy += 2; hw = 7; hh = 12; }
        if (overlap(px, py, pw, ph, hx, hy, hw, hh)) this.kill(p, ev);
      }
    }

    // --- ennemis : pogo (dessus) ou mort (côté) ---
    for (const e of this.enemies) {
      if (!overlap(px, py, pw, ph, e.x, e.y, C.ENEMY_W, C.ENEMY_H)) continue;
      const stomp = p.vy >= 0 && p.prevBottom <= e.y + 5;
      if (stomp) {
        p.vy = -C.POGO_VY;
        p.onGround = false;
        const nvx = p.vx * C.POGO_KEEP;
        p.vx = Math.max(-C.POGO_CAP, Math.min(C.POGO_CAP, nvx));
        p.squashX = 0.75; p.squashY = 1.35;
        e.squish = 20;
        ev.push({ t: 'pogo', x: p.cx(), y: e.y });
      } else {
        this.kill(p, ev);
      }
    }

    // --- champignons ---
    for (let i = 0; i < this.data.mushs.length; i++) {
      const m = this.data.mushs[i];
      const top = m.y - 8;
      if (p.vy > 0 && p.y + ph >= top - 2 && p.y + ph <= top + 12 &&
          px + pw > m.x - 9 && px < m.x + 9) {
        p.vy = -C.MUSH_VY;
        p.onGround = false;
        p.wasDive = false;
        p.squashX = 0.75; p.squashY = 1.35;
        this.mushPulse[i] = 14;
        ev.push({ t: 'mush', x: m.x, y: top });
      }
    }

    // --- cristaux (recharge dash si utile) ---
    for (const c of this.crystals) {
      if (c.cd > 0) continue;
      const dx = p.cx() - c.x, dy = p.cy() - c.y;
      if (dx * dx + dy * dy < 14 * 14 && p.dashes < p.maxDashes) {
        p.dashes = p.maxDashes;
        p.vy = Math.min(p.vy, -C.CRYSTAL_LIFT);
        c.cd = C.CRYSTAL_RESPAWN;
        ev.push({ t: 'crystal', x: c.x, y: c.y });
      }
    }

    // --- anneaux (boost direction input, défaut haut) ---
    if (p.ringCD <= 0) {
      for (const r of this.data.rings) {
        const dx = p.cx() - r.x, dy = p.cy() - r.y;
        if (dx * dx + dy * dy < C.RING_RADIUS * C.RING_RADIUS) {
          let ix = inp.ax, iy = inp.ay;
          if (ix === 0 && iy === 0) { ix = 0; iy = -1; }
          if (ix !== 0 && iy !== 0) { ix *= DIAG; iy *= DIAG; }
          p.vx = ix * C.RING_SPEED;
          p.vy = iy * C.RING_SPEED;
          p.dashes = p.maxDashes;
          p.dashT = 0;
          p.wasDive = false;
          p.onGround = false;
          p.ringCD = C.RING_CD;
          ev.push({ t: 'ring', x: r.x, y: r.y });
          break;
        }
      }
    }

    // --- lucioles ---
    for (let i = 0; i < this.data.coins.length; i++) {
      if (this.coinsTaken.has(i)) continue;
      const c = this.data.coins[i];
      const dx = p.cx() - c.x, dy = p.cy() - c.y;
      if (dx * dx + dy * dy < 13 * 13) {
        this.coinsTaken.add(i);
        ev.push({ t: 'coin', x: c.x, y: c.y });
      }
    }

    // --- breloques (pickups) ---
    for (let i = 0; i < this.data.pickups.length; i++) {
      if (this.pickupsTaken.has(i)) continue;
      const k = this.data.pickups[i];
      const dx = p.cx() - k.x, dy = p.cy() - k.y;
      if (dx * dx + dy * dy < 15 * 15) {
        this.pickupsTaken.add(i);
        if (k.kind === 'dash') { p.maxDashes = 2; p.dashes = 2; }
        else p.cape = true;
        ev.push({ t: 'pickup', kind: k.kind, x: k.x, y: k.y });
      }
    }

    // --- checkpoints ---
    for (let i = 0; i < this.data.checkpoints.length; i++) {
      const c = this.data.checkpoints[i];
      if (overlap(px, py, pw, ph, c.x - 8, c.y - 8, 16, 16)) {
        p.respawn = { x: c.x - C.PW / 2, y: (Math.floor(c.y / TILE) + 1) * TILE - C.PH };
        if (!this.cpAnnounced.has(i)) {
          this.cpAnnounced.add(i);
          ev.push({ t: 'checkpoint', x: c.x, y: c.y });
        }
      }
    }

    // --- portes / objectif ---
    for (const d of this.data.doors) {
      if (overlap(px, py, pw, ph, d.x, d.y, d.w, d.h)) door = true;
    }
    const g = this.data.goal;
    if (g && overlap(px, py, pw, ph, g.x, g.y, g.w, g.h)) goal = true;

    // --- near-miss (style) : frôler un danger à vitesse élevée ---
    if (p.nearCD <= 0 && !p.dead) {
      const sp2 = p.vx * p.vx + p.vy * p.vy;
      if (sp2 > 150 * 150) {
        let near = false;
        for (const e of this.enemies) {
          if (overlap(px - 14, py - 14, pw + 28, ph + 28, e.x, e.y, C.ENEMY_W, C.ENEMY_H)) { near = true; break; }
        }
        if (!near) {
          const ex0 = Math.floor((px - 14) / TILE), ex1 = Math.floor((px + pw + 14) / TILE);
          const ey0 = Math.floor((py - 14) / TILE), ey1 = Math.floor((py + ph + 14) / TILE);
          outer: for (let ty = ey0; ty <= ey1; ty++) {
            for (let tx = ex0; tx <= ex1; tx++) {
              if (tx < 0 || ty < 0 || tx >= this.gw || ty >= this.gh) continue;
              const t = this.grid[ty * this.gw + tx];
              if (t >= TT.SPIKE_U && t <= TT.SPIKE_R) { near = true; break outer; }
            }
          }
        }
        if (near) {
          p.nearCD = C.NEARMISS_CD;
          ev.push({ t: 'nearmiss', x: p.cx(), y: p.cy() });
        }
      }
    }

    // --- le vide ---
    if (p.y > this.h + 24) this.kill(p, ev);

    return { door, goal };
  }
}
