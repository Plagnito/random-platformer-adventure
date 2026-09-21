// Point d'entrée : boucle 120 Hz, routage des événements -> audio/particules/UI.

import './style.css';
import { TICKS_PER_SEC } from './core/constants';
import { Input } from './core/input';
import { Game, type Mode, type TickEvent } from './game/run';
import { Renderer } from './render/render';
import { Particles } from './render/particles';
import { AudioSys } from './audio/audio';
import { Screens } from './ui/screens';
import { loadSettings, saveSettings, loadAch } from './core/storage';
import { RNG, dailySeed, randomSeedString } from './core/rng';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const input = new Input();
input.attach();
const settings = loadSettings();
const audio = new AudioSys();
audio.musicOn = settings.music;
audio.sfxOn = settings.sfx;
const game = new Game(loadAch());
const renderer = new Renderer(canvas);
const fx = new Particles();
const screens = new Screens();

function normSeed(s: string): string {
  const n = s.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 16);
  return n || randomSeedString(new RNG((Math.random() * 0xffffffff) >>> 0));
}

function runUrl(mode: Mode, seed: string, detente: boolean): string {
  return location.pathname + '?seed=' + encodeURIComponent(seed) + '&mode=' + mode + (detente ? '&detente=1' : '');
}

function startRun(mode: Mode, seedRaw: string): void {
  audio.ensure();
  audio.ui();
  const seed = normSeed(seedRaw);
  settings.lastSeed = seed;
  settings.detente = settings.detente;
  saveSettings(settings);
  fx.clear();
  game.startRun(mode, seed, settings.detente);
  screens.hide();
  input.enabled = true;
  input.resetEdges();
  try {
    history.replaceState(null, '', runUrl(mode, seed, settings.detente));
  } catch { /* file:// : tant pis */ }
}

function showTitle(): void {
  input.enabled = false;
  input.resetEdges();
  game.quitToTitle();
  const params = new URLSearchParams(location.search);
  screens.showTitle(
    {
      lastSeed: params.get('seed') || settings.lastSeed,
      daily: dailySeed(),
      detente: settings.detente,
      music: audio.musicOn,
      sfx: audio.sfxOn,
    },
    {
      onAdventure: () => startRun('adventure', randomSeedString(new RNG((Math.random() * 0xffffffff) >>> 0))),
      onDaily: () => startRun('daily', dailySeed()),
      onSeed: (s) => startRun('adventure', s),
      onDetente: (v) => {
        settings.detente = v;
        saveSettings(settings);
      },
      onMusic: (v) => {
        audio.ensure();
        audio.setMusic(v);
        settings.music = v;
        saveSettings(settings);
      },
      onSfx: (v) => {
        audio.ensure();
        audio.setSfx(v);
        settings.sfx = v;
        saveSettings(settings);
      },
    }
  );
}

function showPause(): void {
  input.enabled = false;
  game.pause();
  audio.ui();
  screens.showPause(game.mode, game.seed, audio.musicOn, audio.sfxOn, {
    onResume: () => {
      audio.ensure();
      audio.ui();
      screens.hide();
      game.resume();
      input.enabled = true;
      input.resetEdges();
    },
    onRestartRoom: () => {
      audio.ui();
      screens.hide();
      game.resume();
      game.restartRoom();
      input.enabled = true;
      input.resetEdges();
    },
    onRestartRun: () => startRun(game.mode, game.seed),
    onQuit: () => {
      audio.ui();
      showTitle();
    },
    onMusic: (v) => {
      audio.setMusic(v);
      settings.music = v;
      saveSettings(settings);
    },
    onSfx: (v) => {
      audio.setSfx(v);
      settings.sfx = v;
      saveSettings(settings);
    },
  });
}

game.onToast = (m) => screens.toast(m);
game.onResults = (r) => {
  input.enabled = false;
  input.resetEdges();
  if (r.isRecord) {
    audio.record();
    fx.confetti(game.player.cx(), game.player.cy() - 40, 120);
  } else {
    audio.finish();
  }
  screens.showResults(r, {
    onRetry: () => startRun(r.mode, r.seed),
    onNewSeed: () => startRun('adventure', randomSeedString(new RNG((Math.random() * 0xffffffff) >>> 0))),
    onCopyLink: () => {
      const url = location.origin + runUrl(r.mode, r.seed, r.detente);
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(
          () => screens.toast('📋 Lien copié ! Défie tes amis.'),
          () => screens.toast('📋 Copie impossible : ' + url)
        );
      } else {
        screens.toast('📋 ' + url);
      }
      audio.ui();
    },
    onMenu: () => showTitle(),
  });
};

function handleEvents(evts: TickEvent[]): void {
  const p = game.player;
  for (const e of evts) {
    switch (e.t) {
      case 'jump':
        audio.jump(e.super);
        fx.dust(p.cx(), p.y + 11, e.super ? 12 : 5);
        break;
      case 'walljump':
        audio.walljump();
        fx.dust(p.cx(), p.cy(), 5);
        break;
      case 'dash':
        audio.dash();
        renderer.addTrauma(0.15);
        fx.sparkle(p.cx(), p.cy(), 10, '#7dffd4');
        break;
      case 'pogo':
        audio.pogo();
        renderer.addTrauma(0.25);
        fx.ringBurst(e.x, e.y, '#b6ff7d');
        break;
      case 'die':
        audio.death();
        renderer.addTrauma(0.5);
        fx.poof(e.x, e.y);
        break;
      case 'coin':
        audio.coin(game.style.mult());
        fx.sparkle(e.x, e.y, 6, '#e8ff7d');
        break;
      case 'ring':
        audio.ring();
        renderer.addTrauma(0.2);
        fx.ringBurst(e.x, e.y);
        break;
      case 'mush':
        audio.mush();
        fx.dust(e.x, e.y, 8, '#e04848');
        break;
      case 'crystal':
        audio.crystal();
        fx.sparkle(e.x, e.y, 8, '#7de9ff');
        break;
      case 'pickup':
        audio.pickup();
        renderer.addTrauma(0.2);
        fx.sparkle(e.x, e.y, 16, e.kind === 'dash' ? '#ffb62e' : '#6ab8ff');
        break;
      case 'checkpoint':
        audio.checkpoint();
        fx.sparkle(e.x, e.y, 8, '#ffd75e');
        break;
      case 'land':
        audio.land(e.hard);
        if (e.hard) {
          renderer.addTrauma(0.2);
          fx.dust(p.cx(), p.y + 11, 10);
        } else {
          fx.dust(p.cx(), p.y + 11, 4);
        }
        break;
      case 'skid':
        audio.skid();
        fx.dust(e.x, e.y, 3);
        break;
      case 'room':
        audio.room();
        break;
      case 'respawn':
        audio.respawn();
        fx.sparkle(p.cx(), p.cy(), 8, '#9fe8ff');
        break;
      case 'gold':
        audio.gold();
        fx.sparkle(p.cx(), p.cy() - 20, 14, '#ffd75e');
        break;
      case 'rankup':
        audio.rankup();
        if (e.rank >= 3) fx.ringBurst(p.cx(), p.cy(), '#ffd75e');
        break;
      case 'finish':
        break; // géré par onResults
      default:
        break;
    }
  }
}

// F4 : overlay debug
window.addEventListener('keydown', (e) => {
  if (e.code === 'F4') {
    game.debug = !game.debug;
    e.preventDefault();
  }
});

// pause auto si l'onglet est caché (fair-play speedrun)
document.addEventListener('visibilitychange', () => {
  if (document.hidden && game.state === 'play') showPause();
});

// ---------- boucle ----------
let last = performance.now();
let acc = 0;

function frame(now: number): void {
  requestAnimationFrame(frame);
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.25) dt = 0.25;

  input.poll();
  if (input.takePause()) {
    if (game.state === 'play') showPause();
    else if (game.state === 'pause') {
      audio.ensure();
      audio.ui();
      screens.hide();
      game.resume();
      input.enabled = true;
      input.resetEdges();
    }
  }
  if (game.state === 'play' && input.takeRestart()) {
    game.restartRoom();
    audio.ui();
  } else {
    input.takeRestart();
  }

  if (game.state === 'play') {
    acc += dt;
    let n = 0;
    while (acc >= 1 / TICKS_PER_SEC && n < 8) {
      const inp = input.sample();
      handleEvents(game.tick(inp));
      acc -= 1 / TICKS_PER_SEC;
      n++;
    }
    if (n === 8) acc = 0;
  } else {
    acc = 0;
  }

  const r = game.style.rank();
  audio.layer = r >= 4 ? 2 : r >= 2 ? 1 : 0;

  fx.update(dt, game.freeze > 0 && game.state === 'play');
  renderer.draw(game, fx, now, dt);
}

// ---------- boot ----------
showTitle();
requestAnimationFrame(frame);
