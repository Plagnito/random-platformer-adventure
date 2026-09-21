// Orchestrateur : états, timer (ticks), splits, fantôme, records, transitions.

import { C } from '../core/constants';
import { GAME_BITS, type TickInput } from '../core/input';
import { load, save, pbKey, ghostKey, type PBData } from '../core/storage';
import { buildRooms, type RoomData } from '../world/rooms';
import { World } from '../world/world';
import { Player, type PEvent } from '../player/player';
import { Style, STYLE_POINTS } from '../systems/style';
import { AchSys } from '../systems/achievements';

export type GameState = 'title' | 'play' | 'pause' | 'results';
export type Mode = 'adventure' | 'daily';

export type GEvent =
  | { t: 'room'; index: number }
  | { t: 'finish' }
  | { t: 'rankup'; rank: number }
  | { t: 'respawn' }
  | { t: 'gold'; index: number };

export type TickEvent = PEvent | GEvent;

export interface ResultsData {
  ticks: number;
  deaths: number;
  coins: number;
  styleMax: number;
  styleRank: string;
  splits: number[];
  pbSplits: number[] | null;
  isRecord: boolean;
  seed: string;
  mode: Mode;
  detente: boolean;
  rooms: string[];
}

const bestKey = (mode: string, seed: string) => `best:${mode}:${seed}`;

export class Game {
  state: GameState = 'title';
  mode: Mode = 'adventure';
  seed = '';
  detente = false;
  rooms: RoomData[] = [];
  roomIdx = 0;
  world: World | null = null;
  player = new Player();
  style = new Style();
  ach = new AchSys();

  ticks = 0;
  started = false;
  deaths = 0;
  coinsGot = 0;
  splits: number[] = [];
  bests: number[] = [];
  pb: PBData | null = null;
  ghost: number[][] | null = null;
  rec: number[][] = [];
  results: ResultsData | null = null;

  freeze = 0;
  slowmo = 0;
  deathT = 0;
  trans: { t: number; dur: number; next: number } | null = null;
  splitFlash: { delta: number | null; gold: boolean; t: number } | null = null;
  debug = false;

  onToast: (msg: string) => void = () => undefined;
  onResults: (r: ResultsData) => void = () => undefined;

  constructor(achIds: string[]) {
    this.ach.load(achIds);
    this.rooms = buildRooms('vitrine');
    this.world = new World(this.rooms[0]);
  }

  private get pbMode(): string {
    return this.detente ? this.mode + '-detente' : this.mode;
  }

  curRoom(): RoomData {
    return this.rooms[this.roomIdx];
  }

  startRun(mode: Mode, seed: string, detente: boolean): void {
    this.mode = mode;
    this.seed = seed;
    this.detente = detente;
    this.rooms = buildRooms(seed);
    this.roomIdx = 0;
    this.world = new World(this.rooms[0]);
    this.player = new Player();
    if (detente) {
      this.player.maxDashes = 99; // dash quasi infini en Détente
    }
    const s = this.rooms[0].spawn;
    this.player.reset(s.x, s.y);
    this.style = new Style();
    this.ticks = 0;
    this.started = false;
    this.deaths = 0;
    this.coinsGot = 0;
    this.splits = [];
    this.bests = load<number[]>(bestKey(this.pbMode, seed), []);
    this.pb = load<PBData | null>(pbKey(this.pbMode, seed), null);
    const g = load<{ ticks: number; frames: number[][] } | null>(ghostKey(this.pbMode, seed), null);
    this.ghost = g ? g.frames : null;
    this.rec = [];
    this.results = null;
    this.freeze = 0;
    this.slowmo = 0;
    this.deathT = 0;
    this.trans = null;
    this.splitFlash = null;
    this.state = 'play';
  }

  pause(): void {
    if (this.state === 'play') this.state = 'pause';
  }
  resume(): void {
    if (this.state === 'pause') this.state = 'play';
  }

  restartRoom(): void {
    if (!this.world || this.state !== 'play') return;
    const s = this.curRoom().spawn;
    this.player.reset(s.x, s.y);
    if (this.detente) this.player.maxDashes = 99;
    // restaure les upgrades (breloques déjà ramassées)
    this.reapplyUpgrades();
    this.world.resetDynamics();
    this.deathT = 0;
    this.trans = null;
  }

  private reapplyUpgrades(): void {
    // rejoue les pickups déjà pris dans les salles précédentes
    for (let i = 0; i < this.roomIdx; i++) {
      for (const k of this.rooms[i].pickups) {
        if (k.kind === 'dash' && !this.detente) {
          this.player.maxDashes = 2;
          this.player.dashes = 2;
        }
        if (k.kind === 'cape') this.player.cape = true;
      }
    }
    // + ceux de la salle courante déjà pris
    const w = this.world;
    if (w) {
      w.pickupsTaken.forEach((pi) => {
        const k = w.data.pickups[pi];
        if (!k) return;
        if (k.kind === 'dash' && !this.detente) {
          this.player.maxDashes = 2;
          this.player.dashes = 2;
        }
        if (k.kind === 'cape') this.player.cape = true;
      });
    }
  }

  restartRun(): void {
    this.startRun(this.mode, this.seed, this.detente);
  }

  quitToTitle(): void {
    this.state = 'title';
    this.rooms = buildRooms('vitrine');
    this.roomIdx = 0;
    this.world = new World(this.rooms[0]);
  }

  ghostFrame(): [number, number, number, number, number] | null {
    if (!this.ghost || !this.started || this.ticks <= 0) return null;
    const f = this.ghost[this.ticks - 1];
    if (!f) return null;
    if (f[0] !== this.roomIdx) return null;
    return [f[0], f[1], f[2], f[3], f[4]];
  }

  stateHash(): string {
    let h = 0x811c9dc5;
    const mix = (n: number) => {
      h ^= Math.floor(n * 1000) & 0xffffffff;
      h = Math.imul(h, 0x01000193);
    };
    mix(this.player.x); mix(this.player.y); mix(this.player.vx); mix(this.player.vy);
    mix(this.ticks); mix(this.roomIdx);
    return (h >>> 0).toString(16).padStart(8, '0');
  }

  private recordFrame(): void {
    this.rec.push([
      this.roomIdx,
      Math.round(this.player.x),
      Math.round(this.player.y),
      this.player.face,
      this.player.dashT > 0 ? 1 : 0,
    ]);
  }

  private unlock(id: string): void {
    const a = this.ach.unlock(id);
    if (a) {
      save('ach', this.ach.ids());
      this.onToast('🏆 ' + a.name + ' — ' + a.desc);
    }
  }

  private startTransition(next: number, out: TickEvent[]): void {
    this.splits.push(this.ticks);
    const i = this.splits.length - 1;
    // delta vs PB
    let delta: number | null = null;
    if (this.pb && this.pb.splits[i] !== undefined) delta = this.ticks - this.pb.splits[i];
    // médaille d'or de segment ?
    const prev = i > 0 ? this.splits[i - 1] : 0;
    const seg = this.ticks - prev;
    let gold = false;
    if (this.bests[i] === undefined || seg < this.bests[i]) {
      this.bests[i] = seg;
      gold = true;
      out.push({ t: 'gold', index: i });
    }
    this.splitFlash = { delta, gold, t: 240 };
    this.style.add(STYLE_POINTS.room);
    this.trans = { t: 0, dur: 42, next };
    out.push({ t: 'room', index: next });
  }

  private finish(out: TickEvent[]): void {
    this.splits.push(this.ticks);
    const isRecord = !this.pb || this.ticks < this.pb.ticks;
    if (isRecord) {
      this.pb = {
        ticks: this.ticks,
        deaths: this.deaths,
        date: new Date().toISOString(),
        splits: [...this.splits],
      };
      save(pbKey(this.pbMode, this.seed), this.pb);
      save(ghostKey(this.pbMode, this.seed), { ticks: this.ticks, frames: this.rec });
    }
    save(bestKey(this.pbMode, this.seed), this.bests);
    this.unlock('fin');
    if (this.mode === 'daily') this.unlock('daily');
    this.results = {
      ticks: this.ticks,
      deaths: this.deaths,
      coins: this.coinsGot,
      styleMax: this.style.max,
      styleRank: this.style.maxRankName(),
      splits: [...this.splits],
      pbSplits: this.pb && !isRecord ? this.pb.splits : null,
      isRecord,
      seed: this.seed,
      mode: this.mode,
      detente: this.detente,
      rooms: this.rooms.map((r) => r.name),
    };
    this.state = 'results';
    out.push({ t: 'finish' });
    this.onResults(this.results);
  }

  tick(inp: TickInput): TickEvent[] {
    const out: TickEvent[] = [];
    if (this.state !== 'play' || !this.world) return out;
    if (this.splitFlash && --this.splitFlash.t <= 0) this.splitFlash = null;

    // transition de salle : sim en pause, chrono en pause
    if (this.trans) {
      this.trans.t++;
      if (this.trans.t === Math.floor(this.trans.dur / 2)) {
        this.roomIdx = this.trans.next;
        this.world = new World(this.curRoom());
        const s = this.curRoom().spawn;
        this.player.reset(s.x, s.y);
        this.reapplyUpgrades();
      }
      if (this.trans.t >= this.trans.dur) this.trans = null;
      return out;
    }

    // mort : compteur avant respawn (le chrono TOURNE : mourir coûte du temps)
    if (this.deathT > 0) {
      this.deathT--;
      if (this.started) {
        this.ticks++;
        this.recordFrame();
      }
      if (this.deathT === 0) {
        this.player.respawnAtCheckpoint();
        this.world.resetDynamics();
        out.push({ t: 'respawn' });
      }
      return out;
    }

    if (this.slowmo > 0) {
      this.slowmo--;
      if (this.slowmo % C.SLOWMO_DIV !== 0) return out;
    }
    if (this.freeze > 0) {
      this.freeze--;
      return out;
    }

    if (!this.started && (inp.bits & GAME_BITS) !== 0) this.started = true;

    const ev: PEvent[] = [];
    this.world.tick();
    this.player.tick(inp, this.world, ev);

    const rankBefore = this.style.rank();
    for (const e of ev) {
      out.push(e);
      switch (e.t) {
        case 'dash':
          this.freeze = C.DASH_FREEZE;
          this.style.add(STYLE_POINTS.dash);
          this.unlock('dash');
          break;
        case 'pogo':
          this.freeze = C.POGO_FREEZE;
          this.style.add(STYLE_POINTS.pogo);
          this.unlock('pogo');
          break;
        case 'nearmiss':
          this.style.add(STYLE_POINTS.nearmiss);
          if (this.style.rank() >= 3 && this.slowmo <= 0) this.slowmo = C.SLOWMO_TICKS;
          break;
        case 'ring':
          this.style.add(STYLE_POINTS.ring);
          break;
        case 'mush':
          this.style.add(STYLE_POINTS.mush);
          break;
        case 'crystal':
          break;
        case 'coin': {
          const gain = this.style.mult();
          this.coinsGot += gain;
          this.style.add(STYLE_POINTS.coin);
          break;
        }
        case 'pickup':
          this.onToast(e.kind === 'dash' ? '🎒 Breloque : DOUBLE DASH ! (2 dashes en l’air)' : '🪂 Breloque : CAPE PLANANTE ! (maintenir Saut en chute)');
          break;
        case 'die':
          this.deaths++;
          this.deathT = C.DEATH_FREEZE;
          this.style.reset();
          if (this.deaths >= 10) this.unlock('mort10');
          break;
        case 'land':
          if (e.hard) this.freeze = Math.max(this.freeze, 4);
          this.style.halve();
          break;
        case 'door':
          this.startTransition(this.roomIdx + 1, out);
          break;
        case 'goal':
          this.finish(out);
          break;
        default:
          break;
      }
      if (this.state !== 'play') break;
    }

    if (!this.player.onGround && this.started) this.style.add(STYLE_POINTS.airPerTick);
    this.style.tick(this.player.onGround);
    const rankAfter = this.style.rank();
    if (rankAfter > rankBefore) {
      out.push({ t: 'rankup', rank: rankAfter });
      if (rankAfter >= 3) this.onToast('✨ Rang de style : ' + this.style.rankName() + ' !');
      if (rankAfter >= 4) this.unlock('foudre');
    }

    if (this.started && this.state === 'play') {
      this.ticks++;
      this.recordFrame();
    }
    return out;
  }
}
