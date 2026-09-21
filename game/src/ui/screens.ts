// Écrans DOM : titre, pause, résultats, toasts. Français, second degré.

import { fmtTime, fmtDelta } from '../core/constants';
import type { Mode, ResultsData } from '../game/run';

export interface TitleOpts {
  lastSeed: string;
  daily: string;
  detente: boolean;
  music: boolean;
  sfx: boolean;
}

export interface TitleCb {
  onAdventure: () => void;
  onDaily: () => void;
  onSeed: (seed: string) => void;
  onDetente: (v: boolean) => void;
  onMusic: (v: boolean) => void;
  onSfx: (v: boolean) => void;
}

export interface PauseCb {
  onResume: () => void;
  onRestartRoom: () => void;
  onRestartRun: () => void;
  onQuit: () => void;
  onMusic: (v: boolean) => void;
  onSfx: (v: boolean) => void;
}

export interface ResultsCb {
  onRetry: () => void;
  onNewSeed: () => void;
  onCopyLink: () => void;
  onMenu: () => void;
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

export class Screens {
  private root: HTMLElement;
  private toasts: HTMLElement;

  constructor() {
    this.root = document.getElementById('ui')!;
    this.toasts = document.createElement('div');
    this.toasts.id = 'toasts';
    document.body.appendChild(this.toasts);
  }

  hide(): void {
    this.root.innerHTML = '';
  }

  toast(msg: string): void {
    const d = document.createElement('div');
    d.className = 'toast';
    d.textContent = msg;
    this.toasts.appendChild(d);
    while (this.toasts.children.length > 3) this.toasts.removeChild(this.toasts.children[0]);
    window.setTimeout(() => d.classList.add('out'), 2600);
    window.setTimeout(() => d.remove(), 3100);
  }

  showTitle(o: TitleOpts, cb: TitleCb): void {
    this.root.innerHTML =
      '<div class="panel">' +
      '<h1>SPÉCIMEN 115<span class="sub">RANDOM PLATFORMER ADVENTURE</span></h1>' +
      '<h2>Évade-toi du Fonds. Une seed, 8 salles, un chrono. 🧬</h2>' +
      '<div class="row">' +
      '<button class="btn" id="bAdv">▶ Aventure</button>' +
      '<button class="btn" id="bDaily">📅 Daily<br><span style="font-size:11px;font-weight:normal">(' + esc(o.daily) + ')</span></button>' +
      '</div>' +
      '<div class="row">' +
      '<input type="text" id="seedIn" maxlength="16" value="' + esc(o.lastSeed) + '" placeholder="TA-SEED" />' +
      '<button class="btn alt small" id="bSeed">Jouer cette seed</button>' +
      '</div>' +
      '<div class="modes">' +
      '<label><input type="radio" name="mode" value="std" ' + (o.detente ? '' : 'checked') + '>⚖️ Standard</label>' +
      '<label><input type="radio" name="mode" value="det" ' + (o.detente ? 'checked' : '') + '>🍃 Détente (dash infini, hors classement pur)</label>' +
      '</div>' +
      '<div class="row">' +
      '<button class="btn alt small" id="bMus">' + (o.music ? '🎵 Musique : ON' : '🎵 Musique : OFF') + '</button>' +
      '<button class="btn alt small" id="bSfx">' + (o.sfx ? '🔊 Sons : ON' : '🔊 Sons : OFF') + '</button>' +
      '</div>' +
      '<p class="controls"><b>←→</b>/<b>AD</b> bouger &nbsp;<b>Espace</b> sauter &nbsp;<b>Maj</b> dasher &nbsp;<b>R</b> salle &nbsp;<b>Échap</b> pause<br>Manette supportée • Le chrono démarre au premier input • Mourir, c’est gratuit (et compté fièrement).</p>' +
      '<p class="tiny">Pièce du catalogue random.plagnito.com • 0 pub • 0 tracker • jouable sans compte • v0.1</p>' +
      '</div>';
    const q = (id: string) => document.getElementById(id)!;
    q('bAdv').addEventListener('click', cb.onAdventure);
    q('bDaily').addEventListener('click', cb.onDaily);
    const go = () => cb.onSeed((q('seedIn') as HTMLInputElement).value);
    q('bSeed').addEventListener('click', go);
    (q('seedIn') as HTMLInputElement).addEventListener('keydown', (e) => {
      if (e.key === 'Enter') go();
      e.stopPropagation();
    });
    this.root.querySelectorAll('input[name="mode"]').forEach((el) => {
      el.addEventListener('change', () => {
        cb.onDetente((this.root.querySelector('input[name="mode"]:checked') as HTMLInputElement).value === 'det');
      });
    });
    q('bMus').addEventListener('click', () => {
      const v = q('bMus').textContent!.includes('OFF');
      q('bMus').textContent = v ? '🎵 Musique : ON' : '🎵 Musique : OFF';
      cb.onMusic(v);
    });
    q('bSfx').addEventListener('click', () => {
      const v = q('bSfx').textContent!.includes('OFF');
      q('bSfx').textContent = v ? '🔊 Sons : ON' : '🔊 Sons : OFF';
      cb.onSfx(v);
    });
  }

  showPause(mode: Mode, seed: string, music: boolean, sfx: boolean, cb: PauseCb): void {
    this.root.innerHTML =
      '<div class="panel">' +
      '<h2>⏸️ Pause — le chrono attend (lui aussi).</h2>' +
      '<p>' + (mode === 'daily' ? '📅 Daily' : '🗺️ Seed') + ' ' + esc(seed) + '</p>' +
      '<div class="row"><button class="btn" id="bRes">▶ Reprendre</button></div>' +
      '<div class="row">' +
      '<button class="btn alt small" id="bRoom">🔁 Salle</button>' +
      '<button class="btn alt small" id="bRun">⏮ Run</button>' +
      '<button class="btn alt small" id="bQuit">🏠 Menu</button>' +
      '</div>' +
      '<div class="row">' +
      '<button class="btn alt small" id="bMus">' + (music ? '🎵 Musique : ON' : '🎵 Musique : OFF') + '</button>' +
      '<button class="btn alt small" id="bSfx">' + (sfx ? '🔊 Sons : ON' : '🔊 Sons : OFF') + '</button>' +
      '</div>' +
      '</div>';
    const q = (id: string) => document.getElementById(id)!;
    q('bRes').addEventListener('click', cb.onResume);
    q('bRoom').addEventListener('click', cb.onRestartRoom);
    q('bRun').addEventListener('click', cb.onRestartRun);
    q('bQuit').addEventListener('click', cb.onQuit);
    q('bMus').addEventListener('click', () => {
      const v = q('bMus').textContent!.includes('OFF');
      q('bMus').textContent = v ? '🎵 Musique : ON' : '🎵 Musique : OFF';
      cb.onMusic(v);
    });
    q('bSfx').addEventListener('click', () => {
      const v = q('bSfx').textContent!.includes('OFF');
      q('bSfx').textContent = v ? '🔊 Sons : ON' : '🔊 Sons : OFF';
      cb.onSfx(v);
    });
  }

  showResults(r: ResultsData, cb: ResultsCb): void {
    let splits = '';
    for (let i = 0; i < r.splits.length; i++) {
      const prev = i > 0 ? r.splits[i - 1] : 0;
      const seg = r.splits[i] - prev;
      let delta = '';
      if (r.pbSplits && r.pbSplits[i] !== undefined) {
        const d = r.splits[i] - r.pbSplits[i];
        const cls = d <= 0 ? 'ahead' : 'behind';
        delta = '<span class="' + cls + '">' + fmtDelta(d) + '</span>';
      }
      splits += '<div><span>' + esc(r.rooms[Math.min(i, r.rooms.length - 1)]) + '</span><span>' +
        fmtTime(seg) + ' · ' + fmtTime(r.splits[i]) + ' ' + delta + '</span></div>';
    }
    this.root.innerHTML =
      '<div class="panel">' +
      (r.isRecord ? '<p class="record">👑 NOUVEAU RECORD !</p>' : '<h2>Run terminée !</h2>') +
      '<div class="big-time">' + fmtTime(r.ticks) + '</div>' +
      '<p>' + (r.mode === 'daily' ? '📅 Daily' : '🗺️ Seed') + ' ' + esc(r.seed) + (r.detente ? ' • 🍃 Détente' : '') + '</p>' +
      '<table class="scores">' +
      '<tr><td>💀 Morts</td><td>' + r.deaths + '</td></tr>' +
      '<tr><td>✨ Lucioles</td><td>' + r.coins + '</td></tr>' +
      '<tr><td>⚡ Style max</td><td>' + esc(r.styleRank) + '</td></tr>' +
      '</table>' +
      '<div class="splits">' + splits + '</div>' +
      '<div class="row">' +
      '<button class="btn" id="bRetry">🔁 Revanche</button>' +
      '<button class="btn" id="bNew">🎲 Nouvelle seed</button>' +
      '</div>' +
      '<div class="row">' +
      '<button class="btn alt small" id="bCopy">📋 Copier le lien</button>' +
      '<button class="btn alt small" id="bMenu">🏠 Menu</button>' +
      '</div>' +
      (r.isRecord
        ? '<p class="tiny">Le Conservateur vérifie la calibration… Non, c’est bien un record. Hmm.</p>'
        : '<p class="tiny">Le Conservateur a noté : « peut mieux faire ». (Il note tout.)</p>') +
      '</div>';
    const q = (id: string) => document.getElementById(id)!;
    q('bRetry').addEventListener('click', cb.onRetry);
    q('bNew').addEventListener('click', cb.onNewSeed);
    q('bCopy').addEventListener('click', cb.onCopyLink);
    q('bMenu').addEventListener('click', cb.onMenu);
  }
}
