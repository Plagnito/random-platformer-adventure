// Particules purement visuelles (hors sim déterministe).

import { RNG } from '../core/rng';

interface P {
  x: number; y: number; vx: number; vy: number;
  life: number; max: number; size: number;
  color: string; grav: number; shape: number; // 0 rect, 1 cercle, 2 étincelle
}

export class Particles {
  list: P[] = [];
  rng = new RNG(987654321);
  max = 240;

  private push(p: P): void {
    if (this.list.length >= this.max) this.list.shift();
    this.list.push(p);
  }

  dust(x: number, y: number, n = 6, color = '#9aa7c7'): void {
    for (let i = 0; i < n; i++) {
      this.push({
        x: x + this.rng.range(-4, 4), y: y + this.rng.range(-2, 0),
        vx: this.rng.range(-40, 40), vy: this.rng.range(-60, -10),
        life: 0, max: this.rng.range(0.25, 0.5), size: this.rng.range(1.5, 3),
        color, grav: 120, shape: 1,
      });
    }
  }

  sparkle(x: number, y: number, n = 8, color = '#ffe27a'): void {
    for (let i = 0; i < n; i++) {
      const a = this.rng.range(0, Math.PI * 2);
      const sp = this.rng.range(40, 160);
      this.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: 0, max: this.rng.range(0.3, 0.6), size: this.rng.range(1.5, 3),
        color, grav: 60, shape: 2,
      });
    }
  }

  poof(x: number, y: number): void {
    for (let i = 0; i < 22; i++) {
      const a = this.rng.range(0, Math.PI * 2);
      const sp = this.rng.range(30, 200);
      this.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60,
        life: 0, max: this.rng.range(0.4, 0.8), size: this.rng.range(2, 4),
        color: this.rng.pick(['#7dffd4', '#ffffff', '#9fe8ff']),
        grav: 300, shape: 1,
      });
    }
  }

  trail(x: number, y: number, color = '#7dffd4'): void {
    this.push({
      x: x + this.rng.range(-3, 3), y: y + this.rng.range(-4, 4),
      vx: this.rng.range(-15, 15), vy: this.rng.range(-15, 15),
      life: 0, max: 0.35, size: this.rng.range(2, 4), color, grav: 0, shape: 1,
    });
  }

  confetti(x: number, y: number, n = 80): void {
    const cols = ['#ffd75e', '#7dffd4', '#ff8bd1', '#9fe8ff', '#b6ff7d'];
    for (let i = 0; i < n; i++) {
      this.push({
        x: x + this.rng.range(-60, 60), y: y + this.rng.range(-20, 20),
        vx: this.rng.range(-120, 120), vy: this.rng.range(-260, -60),
        life: 0, max: this.rng.range(0.8, 1.6), size: this.rng.range(2, 4.5),
        color: this.rng.pick(cols), grav: 420, shape: 0,
      });
    }
  }

  ringBurst(x: number, y: number, color = '#ff8bd1'): void {
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      this.push({
        x, y, vx: Math.cos(a) * 170, vy: Math.sin(a) * 170,
        life: 0, max: 0.4, size: 2.5, color, grav: 0, shape: 2,
      });
    }
  }

  update(dt: number, frozen: boolean): void {
    if (frozen) return;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.life += dt;
      if (p.life >= p.max) {
        this.list.splice(i, 1);
        continue;
      }
      p.vy += p.grav * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  draw(ctx: CanvasRenderingContext2D, camX: number, camY: number): void {
    for (const p of this.list) {
      const k = 1 - p.life / p.max;
      ctx.globalAlpha = k;
      ctx.fillStyle = p.color;
      const x = p.x - camX, y = p.y - camY;
      if (p.shape === 0) {
        ctx.fillRect(x - p.size / 2, y - p.size / 2, p.size, p.size * 0.7);
      } else if (p.shape === 1) {
        ctx.beginPath();
        ctx.arc(x, y, p.size * k + 0.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - p.vx * 0.03, y - p.vy * 0.03);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  clear(): void {
    this.list = [];
  }
}
