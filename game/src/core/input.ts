// Entrées : clavier (AZERTY-friendly) + manette, échantillonnées 1x par tick.
// SOCD : Gauche+Droite = neutre (équité speedrun).

export const B = {
  LEFT: 1,
  RIGHT: 2,
  UP: 4,
  DOWN: 8,
  JUMP: 16,
  DASH: 32,
} as const;

export interface TickInput {
  ax: number;
  ay: number;
  jumpHeld: boolean;
  jumpPressed: boolean;
  dashPressed: boolean;
  downHeld: boolean;
  bits: number;
}

const KEYMAP: Record<string, number> = {
  ArrowLeft: B.LEFT, KeyA: B.LEFT, KeyQ: B.LEFT,
  ArrowRight: B.RIGHT, KeyD: B.RIGHT,
  ArrowUp: B.UP, KeyW: B.UP, KeyZ: B.UP,
  ArrowDown: B.DOWN, KeyS: B.DOWN,
  Space: B.JUMP, KeyJ: B.JUMP,
  ShiftLeft: B.DASH, ShiftRight: B.DASH, KeyK: B.DASH, KeyX: B.DASH,
};

export const GAME_BITS = B.LEFT | B.RIGHT | B.UP | B.DOWN | B.JUMP | B.DASH;

export class Input {
  private held = 0;
  private prev = 0;
  private pauseFlag = false;
  private restartFlag = false;
  enabled = true;

  attach(): void {
    window.addEventListener('keydown', (e) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      if (e.code === 'Escape' || e.code === 'KeyP') {
        this.pauseFlag = true;
        return;
      }
      if (e.code === 'KeyR') {
        this.restartFlag = true;
        return;
      }
      if (e.code === 'F4') return; // géré par main.ts (debug)
      if (!this.enabled) return;
      const bit = KEYMAP[e.code];
      if (bit !== undefined) {
        this.held |= bit;
        e.preventDefault();
      }
      if (e.code === 'Escape' || e.code === 'KeyP') this.pauseFlag = true;
      if (e.code === 'KeyR') this.restartFlag = true;
    });
    window.addEventListener('keyup', (e) => {
      const bit = KEYMAP[e.code];
      if (bit !== undefined) {
        this.keyBits &= ~bit;
        this.held = this.keyBits | this.padBits;
      }
    });
    window.addEventListener('blur', () => {
      this.keyBits = 0;
      this.held = this.padBits;
    });
    // Évite le scroll / menu contextuel pendant le jeu
    window.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  /** À appeler 1x par FRAME (pas par tick) : fusionne la manette. */
  poll(): void {
    try {
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      for (const p of pads) {
        if (!p || !p.connected) continue;
        let g = 0;
        const ax = p.axes[0] ?? 0;
        const ay = p.axes[1] ?? 0;
        if (ax < -0.35 || p.buttons[14]?.pressed) g |= B.LEFT;
        if (ax > 0.35 || p.buttons[15]?.pressed) g |= B.RIGHT;
        if (ay < -0.35 || p.buttons[12]?.pressed) g |= B.UP;
        if (ay > 0.35 || p.buttons[13]?.pressed) g |= B.DOWN;
        if (p.buttons[0]?.pressed) g |= B.JUMP;
        if (p.buttons[1]?.pressed || p.buttons[7]?.pressed) g |= B.DASH;
        if (p.buttons[9]?.pressed && !this.padStartHeld) this.pauseFlag = true;
        this.padStartHeld = !!p.buttons[9]?.pressed;
        // fusion clavier + manette (bits clavier conservés)
        this.held |= g;
        // retire les bits manette relâchés : on recalcule tout
        this.padBits = g;
        break; // 1ère manette seulement
      }
      // held = keyBits | padBits
      this.held = this.keyBits | this.padBits;
    } catch {
      /* pas de gamepad : tant pis */
    }
  }

  private keyBits = 0;
  private padBits = 0;
  private padStartHeld = false;

  // NOTE: keydown/keyup écrivent dans keyBits via held... on synchronise :
  syncKeys(): void {
    // appelé après poll() : rien à faire, keyBits géré par events.
  }

  /** À appeler 1x par TICK de sim. */
  sample(): TickInput {
    const h = this.held;
    const pressed = h & ~this.prev;
    this.prev = h;
    const left = (h & B.LEFT) !== 0;
    const right = (h & B.RIGHT) !== 0;
    const up = (h & B.UP) !== 0;
    const down = (h & B.DOWN) !== 0;
    return {
      ax: left && !right ? -1 : right && !left ? 1 : 0,
      ay: up && !down ? -1 : down && !up ? 1 : 0,
      jumpHeld: (h & B.JUMP) !== 0,
      jumpPressed: (pressed & B.JUMP) !== 0,
      dashPressed: (pressed & B.DASH) !== 0,
      downHeld: down,
      bits: h,
    };
  }

  takePause(): boolean {
    const v = this.pauseFlag;
    this.pauseFlag = false;
    return v;
  }
  takeRestart(): boolean {
    const v = this.restartFlag;
    this.restartFlag = false;
    return v;
  }
  /** Remet les edges à zéro (changement d'écran). */
  resetEdges(): void {
    this.prev = this.held;
    this.pauseFlag = false;
    this.restartFlag = false;
  }
}
