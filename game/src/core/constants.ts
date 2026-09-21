// Source unique des constantes — voir docs/game-feel.md
// Distances en px (tuile 16), durées en TICKS (120/s). Ne JAMAIS utiliser de
// secondes/volants non-tickés dans la sim (déterminisme speedrun).

export const TILE = 16;
export const VIEW_W = 960;
export const VIEW_H = 540;
export const TICKS_PER_SEC = 120;
export const DT = 1 / TICKS_PER_SEC;

export const C = {
  PW: 8, // hitbox joueur (l)
  PH: 11, // hitbox joueur (h)

  RUN_MAX: 100,
  RUN_ACCEL: 1400,
  RUN_FRICTION: 1800,
  SKID_DECEL: 2600,
  AIR_ACCEL: 900,

  JUMP_V0: 330,
  GRAV_UP: 969,
  GRAV_DOWN_MULT: 1.4,
  JUMP_CUT_MULT: 2.4,
  MAX_FALL: 250,
  FAST_FALL: 320,

  COYOTE: 12, // ticks (0.10 s)
  BUFFER: 14, // ticks (~0.117 s)
  CORNER_X: 4, // correction de coin plafond (px)
  LEDGE_SNAP: 4, // assistance de rebord (px)

  DASH_SPEED: 340,
  DASH_TICKS: 18, // 0.15 s -> ~51 px
  DASH_CD: 24,
  DASH_FREEZE: 5,
  DASH_KEEP: 0.6, // vélocité conservée en fin de dash

  WALL_SLIDE_MAX: 50,
  WJUMP_VX: 175,
  WJUMP_VY: 280,
  CLIMB_UP: 55,

  POGO_VY: 335,
  POGO_KEEP: 1.05,
  POGO_CAP: 160,
  POGO_FREEZE: 6,
  POGO_WINDOW: 12, // buffer de pogo avant contact (ticks)

  SLIDE_FRICTION: 300,
  DIVE_BOOST: 1.35,
  DIVE_CAP: 220,
  DIVE_MIN: 90,

  SUPER_MULT: 1.2,
  SUPER_CHARGE: 42, // ticks accroupi

  CAPE_FALL: 45,
  CAPE_DRIFT: 700,

  MUSH_VY: 400,
  RING_SPEED: 380,
  RING_RADIUS: 15, // rayon de déclenchement (px)
  RING_CD: 36,
  CRYSTAL_LIFT: 120,
  CRYSTAL_RESPAWN: 60,

  ENEMY_SPEED: 40,
  ENEMY_W: 12,
  ENEMY_H: 12,

  DEATH_FREEZE: 14, // ticks avant respawn (comptés dans le chrono !)
  RESPAWN_INVULN: 30,
  NEARMISS_CD: 30,

  SLOWMO_DIV: 4, // 1 tick sim / 4 ticks horloge
  SLOWMO_TICKS: 30,
} as const;

export const DIAG = 0.7071067811865476; // normalisation diagonale précalculée (pas de sqrt dans la sim !)

export function fmtTime(ticks: number): string {
  const ms = Math.round((ticks * 1000) / TICKS_PER_SEC);
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const mmm = ms % 1000;
  const ss = s < 10 ? '0' + s : '' + s;
  const mmmm = mmm < 10 ? '00' + mmm : mmm < 100 ? '0' + mmm : '' + mmm;
  return m + ':' + ss + '.' + mmmm;
}

export function fmtDelta(ticks: number): string {
  const sign = ticks <= 0 ? '-' : '+';
  const ms = Math.round((Math.abs(ticks) * 1000) / TICKS_PER_SEC);
  const s = Math.floor(ms / 1000);
  const mmm = ms % 1000;
  const mmmm = mmm < 10 ? '00' + mmm : mmm < 100 ? '0' + mmm : '' + mmm;
  return sign + s + '.' + mmmm;
}
