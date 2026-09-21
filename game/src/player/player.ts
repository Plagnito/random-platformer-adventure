// Contrôleur du Spécimen 115 — course, saut variable, dash 8-dir, murs,
// pogo, piqué, glissade, super-saut, cape. Valeurs : docs/game-feel.md

import { C, TILE, DT, DIAG } from '../core/constants';
import type { TickInput } from '../core/input';
import type { World } from '../world/world';

export type PEvent =
  | { t: 'jump'; super: boolean }
  | { t: 'walljump' }
  | { t: 'dash' }
  | { t: 'pogo'; x: number; y: number }
  | { t: 'die'; x: number; y: number }
  | { t: 'coin'; x: number; y: number }
  | { t: 'ring'; x: number; y: number }
  | { t: 'mush'; x: number; y: number }
  | { t: 'crystal'; x: number; y: number }
  | { t: 'pickup'; kind: 'dash' | 'cape'; x: number; y: number }
  | { t: 'checkpoint'; x: number; y: number }
  | { t: 'nearmiss'; x: number; y: number }
  | { t: 'land'; hard: boolean }
  | { t: 'skid'; x: number; y: number }
  | { t: 'door' }
  | { t: 'goal' };

function approach(v: number, target: number, delta: number): number {
  if (v < target) return Math.min(v + delta, target);
  if (v > target) return Math.max(v - delta, target);
  return v;
}

export interface TrailDot { x: number; y: number; face: number }

export class Player {
  x = 0; y = 0; vx = 0; vy = 0;
  face: 1 | -1 = 1;
  onGround = false;
  coyote = 0; buffer = 0;
  dashes = 1; maxDashes = 1;
  dashCD = 0; dashT = 0; dashDX = 1; dashDY = 0;
  wasDive = false;
  charge = 0;
  sliding = false; climbing = false;
  touchWall = 0;
  dead = false;
  invuln = 0; ringCD = 0; nearCD = 0;
  respawn = { x: 0, y: 0 };
  cape = false;
  airTicks = 0;
  prevBottom = 0;
  squashX = 1; squashY = 1;
  trail: TrailDot[] = [];
  private skidded = false;

  reset(x: number, y: number): void {
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.onGround = false;
    this.coyote = 0; this.buffer = 0;
    this.dashes = this.maxDashes;
    this.dashCD = 0; this.dashT = 0;
    this.wasDive = false; this.charge = 0;
    this.sliding = false; this.climbing = false;
    this.dead = false; this.invuln = 0; this.ringCD = 0; this.nearCD = 0;
    this.respawn = { x, y };
    this.airTicks = 0;
    this.squashX = 1; this.squashY = 1;
    this.trail = [];
  }

  respawnAtCheckpoint(): void {
    this.x = this.respawn.x; this.y = this.respawn.y;
    this.vx = 0; this.vy = 0;
    this.dashes = this.maxDashes;
    this.dashT = 0; this.dashCD = 0;
    this.dead = false;
    this.invuln = C.RESPAWN_INVULN;
    this.ringCD = 0;
    this.buffer = 0; this.coyote = 0;
    this.trail = [];
    this.squashX = 1; this.squashY = 1;
  }

  cx(): number { return this.x + C.PW / 2; }
  cy(): number { return this.y + C.PH / 2; }

  renderState(): string {
    if (this.dead) return 'dead';
    if (this.dashT > 0) return 'dash';
    if (this.climbing) return 'climb';
    if (this.sliding) return 'slide';
    if (this.charge >= C.SUPER_CHARGE) return 'charge';
    if (!this.onGround) return this.vy < 0 ? 'jump' : 'fall';
    if (Math.abs(this.vx) > 20) return 'run';
    return 'idle';
  }

  private endDash(): void {
    this.vx = this.dashDX !== 0 ? this.dashDX * C.DASH_SPEED * C.DASH_KEEP : this.vx * 0.5;
    this.vy = this.dashDY !== 0 ? this.dashDY * C.DASH_SPEED * 0.5 : 0;
  }

  tick(inp: TickInput, world: World, ev: PEvent[]): void {
    if (this.dead) return;
    // retour visuel squash (rendu seul, pas de sim)
    this.squashX += (1 - this.squashX) * 0.25;
    this.squashY += (1 - this.squashY) * 0.25;
    // traînée de dash
    if (this.dashT > 0) {
      if (this.trail.length === 0 || this.trail.length % 2 === 0) {
        this.trail.push({ x: this.x, y: this.y, face: this.face });
        if (this.trail.length > 10) this.trail.shift();
      }
    } else if (this.trail.length > 0) {
      this.trail.shift();
    }

    if (this.invuln > 0) this.invuln--;
    if (this.ringCD > 0) this.ringCD--;
    if (this.nearCD > 0) this.nearCD--;
    if (this.dashCD > 0) this.dashCD--;

    if (this.dashT > 0) {
      this.dashT--;
      this.vx = this.dashDX * C.DASH_SPEED;
      this.vy = this.dashDY * C.DASH_SPEED;
      if (this.dashT === 0) this.endDash();
    } else {
      // --- horizontal ---
      if (this.onGround) {
        this.sliding = inp.downHeld && Math.abs(this.vx) > 60;
        if (inp.ax !== 0) {
          this.face = inp.ax > 0 ? 1 : -1;
          const flip = (this.vx > 0 && inp.ax < 0) || (this.vx < 0 && inp.ax > 0);
          if (flip && Math.abs(this.vx) > 50) {
            if (!this.skidded) {
              this.skidded = true;
              ev.push({ t: 'skid', x: this.cx(), y: this.y + C.PH });
            }
            this.vx = approach(this.vx, inp.ax * C.RUN_MAX, C.SKID_DECEL * DT);
          } else {
            this.skidded = false;
            this.vx = approach(this.vx, inp.ax * C.RUN_MAX,
              (this.sliding ? C.SLIDE_FRICTION : C.RUN_ACCEL) * DT);
          }
        } else {
          this.vx = approach(this.vx, 0, (this.sliding ? C.SLIDE_FRICTION : C.RUN_FRICTION) * DT);
        }
      } else {
        this.sliding = false;
        this.airTicks++;
        if (inp.ax !== 0) {
          this.face = inp.ax > 0 ? 1 : -1;
          const pushing = (this.vx > 0 && inp.ax > 0) || (this.vx < 0 && inp.ax < 0);
          if (!(pushing && Math.abs(this.vx) > C.RUN_MAX)) {
            this.vx = approach(this.vx, inp.ax * C.RUN_MAX, C.AIR_ACCEL * DT);
          }
        }
      }

      // --- gravité (toujours appliquée, même au sol : ça stabilise
      // l'état "sol" — sinon onGround scintille un tick sur deux) ---
      {
        let g: number = C.GRAV_UP;
        if (this.vy >= 0) g = C.GRAV_UP * C.GRAV_DOWN_MULT;
        else if (!inp.jumpHeld) g = C.GRAV_UP * C.JUMP_CUT_MULT;
        this.vy += g * DT;
        let cap: number = C.MAX_FALL;
        if (inp.downHeld) cap = C.FAST_FALL;
        if (this.cape && this.vy > 0 && inp.jumpHeld) {
          cap = Math.min(cap, C.CAPE_FALL);
          this.vx = approach(this.vx, inp.ax * C.RUN_MAX, C.CAPE_DRIFT * DT);
        }
        if (this.vy > cap) this.vy = cap;
      }

      // --- murs : slide / grimpe (après la gravité : les clamps gagnent) ---
      this.touchWall = this.onGround ? 0 : world.wallSide(this);
      this.climbing = false;
      if (!this.onGround && this.touchWall !== 0 && inp.ax === this.touchWall) {
        if (this.vy > C.WALL_SLIDE_MAX) this.vy = C.WALL_SLIDE_MAX;
        this.face = this.touchWall > 0 ? 1 : -1;
        if (inp.ay < 0) {
          this.vy = -C.CLIMB_UP;
          this.climbing = true;
        }
      }

      // --- buffer de saut ---
      if (inp.jumpPressed) this.buffer = C.BUFFER;

      // --- charge du super-saut ---
      if (this.onGround && inp.downHeld && inp.ax === 0 && Math.abs(this.vx) < 10) this.charge++;

      // --- sauts ---
      if (this.buffer > 0) {
        if (this.onGround || this.coyote > 0) {
          const sup = this.charge >= C.SUPER_CHARGE;
          this.vy = -C.JUMP_V0 * (sup ? C.SUPER_MULT : 1);
          this.onGround = false;
          this.coyote = 0; this.buffer = 0; this.charge = 0;
          this.wasDive = false;
          this.squashX = 0.8; this.squashY = 1.25;
          ev.push({ t: 'jump', super: sup });
        } else if (this.touchWall !== 0) {
          this.vx = -this.touchWall * C.WJUMP_VX;
          this.vy = -C.WJUMP_VY;
          this.face = (-this.touchWall > 0 ? 1 : -1);
          this.buffer = 0;
          this.wasDive = false;
          this.squashX = 0.8; this.squashY = 1.25;
          ev.push({ t: 'walljump' });
        }
      }
      if (!(this.onGround && inp.downHeld)) this.charge = 0;

      // --- dash ---
      if (inp.dashPressed && this.dashCD <= 0 && this.dashes > 0) {
        let dx = inp.ax, dy = inp.ay;
        if (dx === 0 && dy === 0) { dx = this.face; dy = 0; }
        if (dx !== 0 && dy !== 0) { dx *= DIAG; dy *= DIAG; }
        this.dashDX = dx; this.dashDY = dy;
        this.dashT = C.DASH_TICKS;
        this.dashes--;
        this.dashCD = C.DASH_CD;
        this.wasDive = dy > 0.3;
        this.squashX = 1.3; this.squashY = 0.7;
        ev.push({ t: 'dash' });
      }
    }

    // --- intégration + collisions ---
    this.prevBottom = this.y + C.PH;
    this.moveX(world);
    this.moveY(world, ev);

    if (this.onGround) {
      this.coyote = C.COYOTE;
      this.airTicks = 0;
      if (this.dashT <= 0) this.dashes = this.maxDashes;
    } else if (this.coyote > 0) {
      this.coyote--;
    }
    if (this.buffer > 0) this.buffer--;

    const res = world.interact(this, inp, ev);
    if (res.door) ev.push({ t: 'door' });
    if (res.goal) ev.push({ t: 'goal' });
  }

  private moveX(world: World): void {
    this.x += this.vx * DT;
    if (world.solidRect(this.x, this.y, C.PW, C.PH)) {
      if (this.vx > 0) {
        const tx = Math.floor((this.x + C.PW) / TILE);
        this.x = tx * TILE - C.PW - 0.01;
      } else if (this.vx < 0) {
        const tx = Math.floor(this.x / TILE);
        this.x = (tx + 1) * TILE + 0.01;
      }
      // assistance de rebord : remonte de qqs px si ça libère
      if (this.vy >= 0) {
        for (let s = 1; s <= C.LEDGE_SNAP; s++) {
          if (!world.solidRect(this.x, this.y - s, C.PW, C.PH)) {
            this.y -= s;
            return;
          }
        }
      }
      this.vx = 0;
    }
  }

  private moveY(world: World, ev: PEvent[]): void {
    const wasGround = this.onGround;
    this.y += this.vy * DT;
    this.onGround = false;
    if (world.solidRect(this.x, this.y, C.PW, C.PH)) {
      if (this.vy >= 0) {
        const ty = Math.floor((this.y + C.PH) / TILE);
        this.y = ty * TILE - C.PH;
        if (!wasGround) {
          if (this.vy > 300 || (this.wasDive && this.vy > 150)) {
            if (this.wasDive) {
              const sp = Math.min(Math.max(Math.abs(this.vx), C.DIVE_MIN) * C.DIVE_BOOST, C.DIVE_CAP);
              this.vx = this.face * sp;
              this.sliding = true;
            }
            this.squashX = 1.3; this.squashY = 0.7;
            ev.push({ t: 'land', hard: true });
          } else if (this.vy > 215) {
            this.squashX = 1.2; this.squashY = 0.8;
            ev.push({ t: 'land', hard: false });
          }
        }
        this.wasDive = false;
        this.vy = 0;
        this.onGround = true;
      } else {
        const ty = Math.floor(this.y / TILE);
        this.y = (ty + 1) * TILE + 0.01;
        // correction de coin : pousse vers le bord libre (bords uniquement)
        const dir = this.vx > 0 ? 1 : this.vx < 0 ? -1 : this.face;
        if (!world.solidRect(this.x + dir * C.CORNER_X, this.y, C.PW, C.PH)) {
          this.x += dir * C.CORNER_X;
        } else {
          this.vy = 0;
        }
      }
    }
  }
}
