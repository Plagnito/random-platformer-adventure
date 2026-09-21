// Rendu Canvas 2D : caméra, parallax, tuiles, entités, joueur, fantôme, HUD.
// Visuel uniquement — la sim ne dépend JAMAIS de ce fichier.

import { C, TILE, VIEW_W, VIEW_H, fmtTime, fmtDelta } from '../core/constants';
import { TT } from '../world/rooms';
import type { Game } from '../game/run';
import { RANK_NAMES } from '../systems/style';
import { RNG } from '../core/rng';
import type { Particles } from './particles';

interface Star { x: number; y: number; s: number; tw: number }

const PAL = {
  forest: {
    sky0: '#050914', sky1: '#0d2b3a', hill0: '#0a1d28', hill1: '#0e2a24',
    tree: '#123626', solid: '#24355c', solidD: '#1a2547', grass: '#4fe08a',
    moon: '#e8f4ff',
  },
  hub: {
    sky0: '#0c0818', sky1: '#2a1c4d', hill0: '#160f30', hill1: '#1f1440',
    tree: '#2c1f5e', solid: '#33275e', solidD: '#251c48', grass: '#ffd75e',
    moon: '#ffe9b0',
  },
};

export class Renderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  camX = 0; camY = 0;
  trauma = 0;
  fps = 60;
  private stars: Star[] = [];
  private trees: { x: number; h: number }[] = [];
  private lastRoom = -1;
  private roomTime = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    const rng = new RNG(424242);
    for (let i = 0; i < 220; i++) {
      this.stars.push({ x: rng.range(0, 2000), y: rng.range(0, 700), s: rng.range(0.6, 2.2), tw: rng.range(0, 6.28) });
    }
    for (let i = 0; i < 90; i++) {
      this.trees.push({ x: rng.range(0, 2400), h: rng.range(50, 150) });
    }
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize(): void {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = VIEW_W * dpr;
    this.canvas.height = VIEW_H * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const aw = window.innerWidth, ah = window.innerHeight;
    const scale = Math.min(aw / VIEW_W, ah / VIEW_H);
    this.canvas.style.width = Math.floor(VIEW_W * scale) + 'px';
    this.canvas.style.height = Math.floor(VIEW_H * scale) + 'px';
  }

  addTrauma(n: number): void {
    this.trauma = Math.min(1, this.trauma + n);
  }

  private wrap(v: number, m: number): number {
    v %= m;
    return v < 0 ? v + m : v;
  }

  draw(game: Game, fx: Particles, timeMs: number, dt: number): void {
    const { ctx } = this;
    const time = timeMs / 1000;
    this.fps += ((dt > 0 ? 1 / dt : 60) - this.fps) * 0.05;
    const world = game.world;
    if (!world) return;
    const room = world.data;
    const pal = PAL[room.biome];
    const p = game.player;

    // --- caméra ---
    if (game.state === 'title') {
      const maxX = Math.max(0, world.w - VIEW_W);
      this.camX = maxX > 0 ? (Math.sin(time * 0.12) * 0.5 + 0.5) * maxX : (world.w - VIEW_W) / 2;
      this.camY = Math.max(0, (world.h - VIEW_H) / 2);
    } else {
      let tx = p.cx() - VIEW_W / 2 + Math.max(-40, Math.min(40, p.vx * 0.25));
      let ty = p.cy() - VIEW_H / 2 + Math.max(-24, Math.min(24, p.vy * 0.12));
      tx = world.w <= VIEW_W ? (world.w - VIEW_W) / 2 : Math.max(0, Math.min(world.w - VIEW_W, tx));
      ty = world.h <= VIEW_H ? (world.h - VIEW_H) / 2 : Math.max(0, Math.min(world.h - VIEW_H, ty));
      const k = 1 - Math.pow(0.88, dt * 60);
      this.camX += (tx - this.camX) * k;
      this.camY += (ty - this.camY) * k;
    }
    this.trauma = Math.max(0, this.trauma - dt * 1.2);
    const sh = this.trauma * this.trauma * 12;
    const shX = (Math.random() * 2 - 1) * sh;
    const shY = (Math.random() * 2 - 1) * sh;
    const camX = this.camX + shX, camY = this.camY + shY;

    // --- ciel ---
    const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    sky.addColorStop(0, pal.sky0);
    sky.addColorStop(1, pal.sky1);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    // --- étoiles (parallax 0.1) ---
    ctx.fillStyle = '#ffffff';
    for (const s of this.stars) {
      const x = this.wrap(s.x - camX * 0.1, 2000);
      const y = this.wrap(s.y - camY * 0.1, 700);
      if (x > VIEW_W || y > VIEW_H) continue;
      ctx.globalAlpha = 0.35 + 0.35 * Math.sin(time * 2 + s.tw);
      ctx.fillRect(x, y, s.s, s.s);
    }
    ctx.globalAlpha = 1;

    // --- lune / lentille ---
    const mx = VIEW_W - 130 - camX * 0.05, my = 90 - camY * 0.05;
    const halo = ctx.createRadialGradient(mx, my, 4, mx, my, 70);
    halo.addColorStop(0, pal.moon + '55');
    halo.addColorStop(1, pal.moon + '00');
    ctx.fillStyle = halo;
    ctx.fillRect(mx - 70, my - 70, 140, 140);
    ctx.fillStyle = pal.moon;
    ctx.beginPath();
    ctx.arc(mx, my, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = pal.sky0;
    ctx.beginPath();
    ctx.arc(mx - 9, my - 6, 22, 0, Math.PI * 2);
    ctx.fill();

    // --- collines lointaines (0.3) ---
    ctx.fillStyle = pal.hill0;
    ctx.beginPath();
    ctx.moveTo(0, VIEW_H);
    for (let x = 0; x <= VIEW_W; x += 24) {
      const wx = x + camX * 0.3;
      ctx.lineTo(x, VIEW_H - 150 - Math.sin(wx * 0.004) * 60 - Math.sin(wx * 0.013 + 2) * 25);
    }
    ctx.lineTo(VIEW_W, VIEW_H);
    ctx.fill();

    // --- collines proches (0.5) ---
    ctx.fillStyle = pal.hill1;
    ctx.beginPath();
    ctx.moveTo(0, VIEW_H);
    for (let x = 0; x <= VIEW_W; x += 24) {
      const wx = x + camX * 0.5;
      ctx.lineTo(x, VIEW_H - 80 - Math.sin(wx * 0.006 + 5) * 50 - Math.sin(wx * 0.017) * 18);
    }
    ctx.lineTo(VIEW_W, VIEW_H);
    ctx.fill();

    // --- arbres (0.7) ---
    ctx.fillStyle = pal.tree;
    for (const t of this.trees) {
      const x = this.wrap(t.x - camX * 0.7, 2400);
      if (x < -40 || x > VIEW_W + 40) continue;
      const baseY = VIEW_H - 40 - camY * 0.15;
      ctx.beginPath();
      ctx.moveTo(x, baseY - t.h);
      ctx.lineTo(x - t.h * 0.28, baseY);
      ctx.lineTo(x + t.h * 0.28, baseY);
      ctx.fill();
    }

    // --- tuiles ---
    const tx0 = Math.max(0, Math.floor(camX / TILE) - 1);
    const ty0 = Math.max(0, Math.floor(camY / TILE) - 1);
    const tx1 = Math.min(world.gw - 1, Math.ceil((camX + VIEW_W) / TILE) + 1);
    const ty1 = Math.min(world.gh - 1, Math.ceil((camY + VIEW_H) / TILE) + 1);
    for (let ty = ty0; ty <= ty1; ty++) {
      for (let tx = tx0; tx <= tx1; tx++) {
        const t = world.grid[ty * world.gw + tx];
        if (t === TT.EMPTY) continue;
        const x = tx * TILE - camX, y = ty * TILE - camY;
        if (t === TT.SOLID) {
          ctx.fillStyle = pal.solidD;
          ctx.fillRect(x, y, TILE, TILE);
          ctx.fillStyle = pal.solid;
          ctx.fillRect(x + 1, y + 1, TILE - 2, TILE - 2);
          const above = ty > 0 ? world.grid[(ty - 1) * world.gw + tx] : TT.EMPTY;
          if (above !== TT.SOLID) {
            ctx.fillStyle = pal.grass;
            ctx.fillRect(x, y, TILE, 4);
            ctx.fillStyle = '#ffffff33';
            ctx.fillRect(x, y, TILE, 1);
          }
        } else {
          this.drawSpikes(t, x, y);
        }
      }
    }

    // --- entités statiques ---
    for (const d of room.doors) this.drawDoor(d.x - camX, d.y - camY, time);
    if (room.goal) this.drawGoal(room.goal.x + 8 - camX, room.goal.y + 16 - camY, time);
    room.checkpoints.forEach((c, i) => {
      this.drawFlag(c.x - camX, c.y - camY, world.cpAnnounced.has(i), time);
    });
    room.coins.forEach((c, i) => {
      if (!world.coinsTaken.has(i)) this.drawCoin(c.x - camX, c.y - camY, time, i);
    });
    room.mushs.forEach((m, i) => {
      this.drawMush(m.x - camX, m.y - camY, world.mushPulse[i] > 0 ? world.mushPulse[i] : 0);
    });
    for (const c of world.crystals) {
      if (c.cd <= 0) this.drawCrystal(c.x - camX, c.y - camY, time);
      else if (c.cd < 20) {
        ctx.globalAlpha = 1 - c.cd / 20;
        this.drawCrystal(c.x - camX, c.y - camY, time);
        ctx.globalAlpha = 1;
      }
    }
    for (const r of room.rings) this.drawRing(r.x - camX, r.y - camY, time);
    room.pickups.forEach((k, i) => {
      if (!world.pickupsTaken.has(i)) this.drawPickup(k.x - camX, k.y - camY, k.kind, time);
    });
    for (const e of world.enemies) this.drawBouftout(e.x - camX, e.y - camY, e.dir, e.squish, time);

    // --- fantôme du record ---
    if (game.state === 'play') {
      const g = game.ghostFrame();
      if (g) this.drawGhost(g[1] - camX, g[2] - camY, g[3], g[4] === 1);
    }

    // --- joueur ---
    if (game.state !== 'title' && !p.dead) this.drawPlayer(p.cx() - camX, p.cy() - camY, game, time);

    // --- particules ---
    fx.draw(ctx, camX, camY);

    // --- vignette ---
    const vg = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.42, VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.85);
    vg.addColorStop(0, '#00000000');
    vg.addColorStop(1, '#00000055');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    // --- HUD ---
    if (game.state === 'play' || game.state === 'pause') this.drawHUD(game, time);

    // --- transition ---
    if (game.trans) {
      const pr = game.trans.t / game.trans.dur;
      const h = (pr < 0.5 ? pr * 2 : (1 - pr) * 2) * VIEW_H * 0.22;
      ctx.fillStyle = '#05070f';
      ctx.fillRect(0, 0, VIEW_W, h);
      ctx.fillRect(0, VIEW_H - h, VIEW_W, h);
      if (pr > 0.5) {
        const nr = game.rooms[game.trans.next];
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 30px "Trebuchet MS", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Salle ' + (game.trans.next + 1) + '/' + game.rooms.length + ' — ' + nr.name, VIEW_W / 2, VIEW_H / 2);
      }
    }

    // --- debug ---
    if (game.debug) {
      ctx.fillStyle = '#0f0';
      ctx.font = '12px monospace';
      ctx.textAlign = 'left';
      const lines = [
        `pos ${p.x.toFixed(1)},${p.y.toFixed(1)} vel ${p.vx.toFixed(1)},${p.vy.toFixed(1)}`,
        `state ${p.renderState()} coy ${p.coyote} buf ${p.buffer} dash ${p.dashes}/${p.maxDashes}`,
        `room ${game.roomIdx} tick ${game.ticks} hash ${game.stateHash()} fps ${this.fps.toFixed(0)}`,
        `ghost ${game.ghost ? game.ghost.length + 'f' : 'none'} rec ${game.rec.length}f`,
      ];
      lines.forEach((l, i) => ctx.fillText(l, 10, VIEW_H - 52 + i * 14));
    }
  }

  private drawSpikes(t: number, x: number, y: number): void {
    const { ctx } = this;
    ctx.fillStyle = '#39415e';
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = '#cfd6ea';
    ctx.strokeStyle = '#6b7592';
    ctx.lineWidth = 1;
    const tri = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    };
    if (t === TT.SPIKE_U) {
      for (let i = 0; i < 2; i++) tri(x + i * 8, y + 16, x + i * 8 + 4, y + 4, x + i * 8 + 8, y + 16);
    } else if (t === TT.SPIKE_D) {
      for (let i = 0; i < 2; i++) tri(x + i * 8, y, x + i * 8 + 4, y + 12, x + i * 8 + 8, y);
    } else if (t === TT.SPIKE_L) {
      for (let i = 0; i < 2; i++) tri(x + 16, y + i * 8, x + 4, y + i * 8 + 4, x + 16, y + i * 8 + 8);
    } else {
      for (let i = 0; i < 2; i++) tri(x, y + i * 8, x + 12, y + i * 8 + 4, x, y + i * 8 + 8);
    }
  }

  private drawDoor(x: number, y: number, time: number): void {
    const { ctx } = this;
    const pulse = 0.6 + 0.4 * Math.sin(time * 4);
    ctx.fillStyle = '#04121a';
    ctx.fillRect(x - 2, y - 4, 20, 40);
    ctx.strokeStyle = `rgba(80,255,220,${0.5 + pulse * 0.5})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 2, y - 4, 20, 40);
    ctx.fillStyle = `rgba(125,255,212,${0.7 + pulse * 0.3})`;
    // flèche →
    ctx.beginPath();
    ctx.moveTo(x + 2, y + 10); ctx.lineTo(x + 11, y + 16); ctx.lineTo(x + 2, y + 22);
    ctx.closePath(); ctx.fill();
  }

  private drawGoal(x: number, y: number, time: number): void {
    const { ctx } = this;
    const g = ctx.createRadialGradient(x, y, 2, x, y, 34);
    g.addColorStop(0, '#fff8');
    g.addColorStop(0.5, '#ffd75e44');
    g.addColorStop(1, '#ffd75e00');
    ctx.fillStyle = g;
    ctx.fillRect(x - 34, y - 34, 68, 68);
    ctx.strokeStyle = '#ffd75e';
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 6]);
    ctx.lineDashOffset = -time * 30;
    ctx.beginPath();
    ctx.arc(x, y, 17, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x, y, 5 + Math.sin(time * 5), 0, Math.PI * 2);
    ctx.fill();
  }

  private drawFlag(x: number, y: number, on: boolean, time: number): void {
    const { ctx } = this;
    ctx.strokeStyle = '#8b95bd';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y - 14); ctx.lineTo(x, y + 8);
    ctx.stroke();
    ctx.fillStyle = on ? '#ffd75e' : '#4a5480';
    const w = 12 + Math.sin(time * 6) * 2;
    ctx.beginPath();
    ctx.moveTo(x, y - 14); ctx.lineTo(x + w, y - 10); ctx.lineTo(x, y - 6);
    ctx.closePath(); ctx.fill();
  }

  private drawCoin(x: number, y: number, time: number, i: number): void {
    const { ctx } = this;
    const bob = Math.sin(time * 3 + i * 1.7) * 2;
    const r = 4 + Math.sin(time * 5 + i) * 1;
    const g = ctx.createRadialGradient(x, y + bob, 0, x, y + bob, 12);
    g.addColorStop(0, '#fff7');
    g.addColorStop(0.4, '#e8ff7d55');
    g.addColorStop(1, '#e8ff7d00');
    ctx.fillStyle = g;
    ctx.fillRect(x - 12, y + bob - 12, 24, 24);
    ctx.fillStyle = '#e8ff7d';
    ctx.beginPath();
    ctx.arc(x, y + bob, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x - 1, y + bob - 1, r * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawMush(x: number, y: number, pulse: number): void {
    const { ctx } = this;
    const sq = pulse > 0 ? 1 - (pulse / 14) * 0.35 : 0;
    ctx.fillStyle = '#f2e8d5';
    ctx.fillRect(x - 4, y - 2 + sq * 6, 8, 10 - sq * 6);
    ctx.fillStyle = '#e04848';
    ctx.beginPath();
    ctx.ellipse(x, y - 3 + sq * 6, 10, 6 - sq * 3, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x - 4, y - 6 + sq * 6, 1.6, 0, Math.PI * 2);
    ctx.arc(x + 3, y - 7 + sq * 6, 1.3, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawCrystal(x: number, y: number, time: number): void {
    const { ctx } = this;
    const bob = Math.sin(time * 2.5) * 3;
    const w = 6 + Math.sin(time * 6) * 1.5;
    ctx.fillStyle = '#7de9ff';
    ctx.beginPath();
    ctx.moveTo(x, y - 9 + bob); ctx.lineTo(x + w, y + bob); ctx.lineTo(x, y + 9 + bob); ctx.lineTo(x - w, y + bob);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffffffcc';
    ctx.beginPath();
    ctx.moveTo(x, y - 5 + bob); ctx.lineTo(x + w * 0.4, y + bob); ctx.lineTo(x, y + 5 + bob); ctx.lineTo(x - w * 0.4, y + bob);
    ctx.closePath(); ctx.fill();
  }

  private drawRing(x: number, y: number, time: number): void {
    const { ctx } = this;
    ctx.strokeStyle = '#ff8bd1';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x, y, 11 + Math.sin(time * 4) * 1.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#ffffffaa';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, 11 + Math.sin(time * 4) * 1.5, time * 2, time * 2 + 2);
    ctx.stroke();
  }

  private drawPickup(x: number, y: number, kind: string, time: number): void {
    const { ctx } = this;
    const bob = Math.sin(time * 3) * 3;
    const g = ctx.createRadialGradient(x, y + bob, 0, x, y + bob, 18);
    g.addColorStop(0, kind === 'dash' ? '#ffb62e66' : '#6ab8ff66');
    g.addColorStop(1, '#00000000');
    ctx.fillStyle = g;
    ctx.fillRect(x - 18, y + bob - 18, 36, 36);
    if (kind === 'dash') {
      ctx.fillStyle = '#ffb62e';
      for (let i = 0; i < 2; i++) {
        ctx.beginPath();
        ctx.moveTo(x - 7 + i * 8, y - 7 + bob);
        ctx.lineTo(x + i * 8, y + bob);
        ctx.lineTo(x - 7 + i * 8, y + 7 + bob);
        ctx.lineTo(x - 4 + i * 8, y + 7 + bob);
        ctx.lineTo(x + 3 + i * 8, y + bob);
        ctx.lineTo(x - 4 + i * 8, y - 7 + bob);
        ctx.closePath(); ctx.fill();
      }
    } else {
      ctx.fillStyle = '#6ab8ff';
      ctx.beginPath();
      ctx.moveTo(x - 8, y - 8 + bob);
      ctx.quadraticCurveTo(x + 8, y - 4 + bob, x + 6, y + 8 + bob);
      ctx.quadraticCurveTo(x, y + 2 + bob, x - 8, y - 8 + bob);
      ctx.fill();
    }
  }

  private drawBouftout(x: number, y: number, dir: number, squish: number, time: number): void {
    const { ctx } = this;
    const sq = squish > 0 ? (squish / 20) * 0.4 : 0;
    const wob = Math.sin(time * 8 + x * 0.1) * 0.06;
    ctx.save();
    ctx.translate(x + 6, y + 12);
    ctx.rotate(wob * dir);
    ctx.scale(1 + sq, 1 - sq);
    ctx.fillStyle = '#69c24a';
    ctx.beginPath();
    ctx.arc(0, -6, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3d7a2b';
    ctx.fillRect(-6, -1, 5, 2.5);
    ctx.fillRect(1, -1, 5, 2.5);
    // yeux mécontents
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-2.5 + dir * 1.5, -7, 2.4, 0, Math.PI * 2);
    ctx.arc(2.5 + dir * 1.5, -7, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(-2.5 + dir * 2.5, -7, 1.1, 0, Math.PI * 2);
    ctx.arc(2.5 + dir * 2.5, -7, 1.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1d3d14';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-4.5, -10.5); ctx.lineTo(-0.5, -9);
    ctx.moveTo(4.5, -10.5); ctx.lineTo(0.5, -9);
    ctx.stroke();
    ctx.restore();
  }

  private drawGhost(x: number, y: number, face: number, dash: boolean): void {
    const { ctx } = this;
    ctx.save();
    ctx.translate(x, y);
    if (dash) ctx.scale(1.35, 0.7);
    ctx.fillStyle = '#6ee0ff55';
    ctx.beginPath();
    ctx.roundRect(-6, -6.5, 12, 13, 5);
    ctx.fill();
    ctx.strokeStyle = '#6ee0ff88';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#e8fbff88';
    ctx.beginPath();
    ctx.arc(-2 + face * 1.5, -1, 1.6, 0, Math.PI * 2);
    ctx.arc(2 + face * 1.5, -1, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawPlayer(x: number, y: number, game: Game, time: number): void {
    const { ctx } = this;
    const p = game.player;
    // clignotement d'invulnérabilité
    if (p.invuln > 0 && Math.floor(time * 14) % 2 === 0) return;
    const st = p.renderState();
    const rank = game.style.rank();

    // traînée de dash : afterimages (positions relatives au joueur)
    for (let i = 0; i < p.trail.length; i++) {
      const d = p.trail[i];
      const sx = x + (d.x + C.PW / 2 - p.cx());
      const sy = y + (d.y + C.PH / 2 - p.cy());
      ctx.globalAlpha = (i / Math.max(1, p.trail.length)) * 0.35;
      ctx.fillStyle = '#7dffd4';
      ctx.beginPath();
      ctx.roundRect(sx - 6, sy - 6.5, 12, 13, 5);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // halo doré à haut rang
    if (rank >= 3) {
      const g = ctx.createRadialGradient(x, y, 2, x, y, 26);
      g.addColorStop(0, rank >= 4 ? '#ffd75e55' : '#ffe9b055');
      g.addColorStop(1, '#ffd75e00');
      ctx.fillStyle = g;
      ctx.fillRect(x - 26, y - 26, 52, 52);
    }

    // cape
    if (p.cape) {
      const wave = Math.sin(time * 10) * 3;
      ctx.fillStyle = '#3f7fd6';
      ctx.beginPath();
      ctx.moveTo(x - p.face * 4, y - 4);
      ctx.quadraticCurveTo(x - p.face * 14, y + wave, x - p.face * 10, y + 8);
      ctx.quadraticCurveTo(x - p.face * 5, y + 4, x - p.face * 4, y - 4);
      ctx.fill();
    }

    ctx.save();
    ctx.translate(x, y + 5.5);
    ctx.scale(p.squashX, p.squashY);
    ctx.translate(0, -5.5);
    const charging = st === 'charge' && Math.floor(time * 12) % 2 === 0;
    ctx.fillStyle = charging ? '#ffffff' : '#7dffd4';
    ctx.beginPath();
    ctx.roundRect(-6, -6.5, 12, 13, 5);
    ctx.fill();
    ctx.strokeStyle = '#1d5c4d';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // dash : visière blanche
    if (st === 'dash') {
      ctx.fillStyle = '#ffffffcc';
      ctx.beginPath();
      ctx.roundRect(-6, -3, 12, 5, 2);
      ctx.fill();
    }
    // yeux
    const blink = Math.floor(time * 0.5) % 7 === 0;
    const lx = st === 'climb' ? p.face * 2 : p.face * 1.5;
    const ly = st === 'fall' ? 1.5 : st === 'jump' ? -1.5 : 0;
    ctx.fillStyle = '#fff';
    if (!blink) {
      ctx.beginPath();
      ctx.arc(-2.2 + lx, -1 + ly, 2.3, 0, Math.PI * 2);
      ctx.arc(2.2 + lx, -1 + ly, 2.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0b1020';
      ctx.beginPath();
      ctx.arc(-2.2 + lx * 1.4, -1 + ly, 1.1, 0, Math.PI * 2);
      ctx.arc(2.2 + lx * 1.4, -1 + ly, 1.1, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#0b1020';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-4.5 + lx, -1); ctx.lineTo(0 + lx, -1);
      ctx.moveTo(0 + lx, -1); ctx.lineTo(4.5 + lx, -1);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawHUD(game: Game, time: number): void {
    const { ctx } = this;
    const p = game.player;
    ctx.textAlign = 'left';

    // chrono
    ctx.font = 'bold 26px "Courier New", monospace';
    ctx.fillStyle = game.started ? '#ffffff' : '#ffffff88';
    ctx.fillText((game.detente ? '🍃 ' : '') + fmtTime(game.ticks), 16, 34);
    ctx.font = '15px "Trebuchet MS", sans-serif';
    ctx.fillStyle = '#aab4d4';
    ctx.fillText(`💀 ${game.deaths}    ✨ ${game.coinsGot}`, 16, 56);

    // salle + seed
    ctx.textAlign = 'center';
    ctx.fillStyle = '#dfe6ff';
    ctx.font = 'bold 16px "Trebuchet MS", sans-serif';
    ctx.fillText(`Salle ${game.roomIdx + 1}/${game.rooms.length} — ${game.curRoom().name}`, VIEW_W / 2, 24);
    ctx.font = '13px "Trebuchet MS", sans-serif';
    ctx.fillStyle = '#8b95bd';
    ctx.fillText(`${game.mode === 'daily' ? '📅 Daily' : '🗺️ Seed'} ${game.seed}${game.pb ? `   👑 ${fmtTime(game.pb.ticks)}` : ''}`, VIEW_W / 2, 43);

    // style (haut droite)
    const rank = game.style.rank();
    ctx.textAlign = 'right';
    ctx.font = 'bold 15px "Trebuchet MS", sans-serif';
    ctx.fillStyle = rank >= 4 ? '#ffd75e' : '#9fe8ff';
    ctx.fillText(`${RANK_NAMES[rank]}  ×${game.style.mult()}`, VIEW_W - 16, 24);
    ctx.fillStyle = '#141b36';
    ctx.fillRect(VIEW_W - 156, 30, 140, 10);
    const grad = ctx.createLinearGradient(VIEW_W - 156, 0, VIEW_W - 16, 0);
    grad.addColorStop(0, '#6ab8ff');
    grad.addColorStop(1, '#ffd75e');
    ctx.fillStyle = grad;
    ctx.fillRect(VIEW_W - 156, 30, 140 * (game.style.points / 100), 10);
    ctx.strokeStyle = '#3d4f8f';
    ctx.lineWidth = 1;
    ctx.strokeRect(VIEW_W - 156, 30, 140, 10);
    // dashes
    ctx.fillStyle = '#7dffd4';
    ctx.font = '13px "Trebuchet MS", sans-serif';
    const d = Math.min(p.dashes, 3);
    ctx.fillText('◆'.repeat(Math.max(0, d)) + '◇'.repeat(Math.max(0, Math.min(p.maxDashes, 3) - d)), VIEW_W - 16, 58);

    // flash de split
    if (game.splitFlash) {
      const sf = game.splitFlash;
      ctx.textAlign = 'center';
      ctx.font = 'bold 22px "Courier New", monospace';
      if (sf.gold) {
        ctx.fillStyle = '#ffd75e';
        ctx.fillText('✨ GOLD ' + (sf.delta !== null ? fmtDelta(sf.delta) : ''), VIEW_W / 2, 72);
      } else if (sf.delta !== null) {
        ctx.fillStyle = sf.delta <= 0 ? '#7dffa8' : '#ff8b8b';
        ctx.fillText(fmtDelta(sf.delta), VIEW_W / 2, 72);
      }
    }

    // bannière de salle (hint)
    if (game.roomIdx !== this.lastRoom) {
      this.lastRoom = game.roomIdx;
      this.roomTime = time;
    }
    if (time - this.roomTime < 6 && game.state === 'play') {
      ctx.textAlign = 'center';
      ctx.font = '15px "Trebuchet MS", sans-serif';
      ctx.fillStyle = '#0b1020';
      const w = ctx.measureText(game.curRoom().hint).width + 32;
      ctx.globalAlpha = 0.75;
      ctx.fillStyle = '#dfe6ff';
      ctx.beginPath();
      ctx.roundRect(VIEW_W / 2 - w / 2, VIEW_H - 52, w, 30, 8);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#141b36';
      ctx.fillText(game.curRoom().hint, VIEW_W / 2, VIEW_H - 32);
    }

    // invite de démarrage
    if (!game.started && game.state === 'play') {
      ctx.textAlign = 'center';
      ctx.font = 'bold 20px "Trebuchet MS", sans-serif';
      ctx.fillStyle = `rgba(255,255,255,${0.6 + 0.4 * Math.sin(time * 5)})`;
      ctx.fillText('BOUGEZ POUR LANCER LE CHRONO !', VIEW_W / 2, VIEW_H / 2 - 60);
    }
  }
}
