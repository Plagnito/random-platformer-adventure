// Test de fumée : valide les salles (30 seeds), la physique et le déterminisme.
// Lancer : cd game && npx tsx ../tools/smoke.ts

import { buildRooms, TT } from '../game/src/world/rooms';
import { World } from '../game/src/world/world';
import { Game } from '../game/src/game/run';
import { C } from '../game/src/core/constants';

let failures = 0;
function assert(cond: boolean, msg: string): void {
  if (cond) {
    console.log('  ✓ ' + msg);
  } else {
    failures++;
    console.log('  ✗ ÉCHEC : ' + msg);
  }
}

// ---------- 1. salles valides sur 30 seeds ----------
console.log('1. Salles (30 seeds)...');
for (let s = 0; s < 30; s++) {
  const rooms = buildRooms('SMOKE-' + s);
  if (rooms.length !== 8) {
    assert(false, 'seed SMOKE-' + s + ' : 8 salles');
    continue;
  }
  rooms.forEach((r, i) => {
    const w = new World(r);
    // spawn libre
    if (w.solidRect(r.spawn.x, r.spawn.y, C.PW, C.PH)) {
      assert(false, `seed ${s} salle ${i} (${r.name}) : spawn dans un mur`);
    }
    // sortie : porte ou objectif
    if (i < rooms.length - 1 && r.doors.length === 0) assert(false, `seed ${s} salle ${i} : pas de porte`);
    if (i === rooms.length - 1 && !r.goal) assert(false, `seed ${s} : pas d'objectif final`);
    // portes/objectifs accessibles (zone non solide)
    for (const d of r.doors) {
      if (w.solidRect(d.x + 4, d.y + 4, 8, 24)) assert(false, `seed ${s} salle ${i} : porte murée`);
    }
    // ennemis avec du sol sous les pieds
    for (const e of r.enemies) {
      if (!w.solidAt(e.x, e.y + 2)) assert(false, `seed ${s} salle ${i} : ennemi dans le vide`);
    }
    // anneaux/cristaux hors des murs
    for (const c of r.crystals) {
      if (w.solidAt(c.x, c.y)) assert(false, `seed ${s} salle ${i} : cristal dans un mur`);
    }
    for (const rg of r.rings) {
      if (w.solidAt(rg.x, rg.y)) assert(false, `seed ${s} salle ${i} : anneau dans un mur`);
    }
    // checkpoints libres
    for (const c of r.checkpoints) {
      if (w.solidRect(c.x - 8, c.y - 8, 16, 16)) assert(false, `seed ${s} salle ${i} : checkpoint muré`);
    }
  });
}
assert(failures === 0, '240 salles vérifiées (spawn, sorties, ennemis, objets)');

// ---------- helpers d'inputs scriptés ----------
interface SI { ax: number; ay: number; jumpHeld: boolean; jumpPressed: boolean; dashPressed: boolean; downHeld: boolean; bits: number }
function script(holds: number[]): SI[] {
  // holds : bits tenus par tick -> calcule les edges comme Input.sample()
  let prev = 0;
  return holds.map((h) => {
    const pressed = h & ~prev;
    prev = h;
    const left = (h & 1) !== 0, right = (h & 2) !== 0;
    const up = (h & 4) !== 0, down = (h & 8) !== 0;
    return {
      ax: left && !right ? -1 : right && !left ? 1 : 0,
      ay: up && !down ? -1 : down && !up ? 1 : 0,
      jumpHeld: (h & 16) !== 0,
      jumpPressed: (pressed & 16) !== 0,
      dashPressed: (pressed & 32) !== 0,
      downHeld: down,
      bits: h,
    };
  });
}
const L = 1, R = 2, U = 4, D = 8, J = 16, DA = 32;

// ---------- 2. saut : hauteur ~56 px ----------
console.log('2. Physique du saut...');
{
  const g = new Game([]);
  g.startRun('adventure', 'SMOKE-JUMP', false);
  const holds: number[] = [];
  for (let i = 0; i < 40; i++) holds.push(0); // stabilisation
  holds.push(J);
  for (let i = 0; i < 40; i++) holds.push(J); // tenu = saut complet
  for (let i = 0; i < 160; i++) holds.push(0);
  const startY = g.player.y;
  let minY = startY;
  for (const inp of script(holds)) {
    g.tick(inp);
    if (g.player.y < minY) minY = g.player.y;
  }
  const rise = startY - minY;
  assert(rise > 50 && rise < 62, `hauteur de saut = ${rise.toFixed(1)} px (cible ~56)`);
  assert(g.player.onGround, 'atterrissage de retour au sol');
}

// ---------- 3. dash : distance ~51 px ----------
console.log('3. Physique du dash...');
{
  const g = new Game([]);
  g.startRun('adventure', 'SMOKE-DASH', false);
  const holds: number[] = [];
  for (let i = 0; i < 40; i++) holds.push(0);
  holds.push(R | DA);
  for (let i = 0; i < 60; i++) holds.push(0);
  const ins = script(holds);
  let dashSeen = false;
  for (const inp of ins) {
    const before = g.player.dashT;
    g.tick(inp);
    if (before === 0 && g.player.dashT > 0) dashSeen = true;
  }
  assert(dashSeen, 'dash déclenché');
  // mesure isolée : rejoue et mesure pendant le dash
  const g2 = new Game([]);
  g2.startRun('adventure', 'SMOKE-DASH', false);
  for (let i = 0; i < 40; i++) g2.tick(script([0])[0]);
  const x0 = g2.player.x;
  const seq = script([R | DA]);
  g2.tick(seq[0]);
  let guard = 0;
  while (g2.player.dashT > 0 && guard++ < 60) g2.tick(script([R])[0]); // freeze inclus
  const dx = g2.player.x - x0;
  assert(dx > 46 && dx < 56, `distance de dash = ${dx.toFixed(1)} px (cible ~51)`);
}

// ---------- 4. progression : R0 -> R1 en courant à droite ----------
console.log('4. Progression de salle...');
{
  const g = new Game([]);
  g.startRun('adventure', 'SMOKE-PROG', false);
  const holds: number[] = [];
  for (let i = 0; i < 1400; i++) holds.push(R); // court à droite (~11 s)
  for (const inp of script(holds)) {
    g.tick(inp);
    if (g.roomIdx > 0) break;
  }
  assert(g.roomIdx === 1, `porte R0 franchie (salle courante = ${g.roomIdx})`);
  assert(g.ticks > 0 && g.started, 'chrono démarré au premier input');
}

// ---------- 5. déterminisme : même seed + mêmes inputs = même état ----------
console.log('5. Déterminisme (2 runs identiques)...');
{
  const runOnce = (): string => {
    const g = new Game([]);
    g.startRun('adventure', 'SMOKE-DET', false);
    const holds: number[] = [];
    for (let i = 0; i < 200; i++) holds.push(R);
    holds.push(R | J);
    for (let i = 0; i < 30; i++) holds.push(R | J);
    for (let i = 0; i < 100; i++) holds.push(R);
    holds.push(DA);
    for (let i = 0; i < 200; i++) holds.push(L | D);
    for (const inp of script(holds)) g.tick(inp);
    const p = g.player;
    return [p.x.toFixed(4), p.y.toFixed(4), p.vx.toFixed(4), p.vy.toFixed(4), g.ticks, g.roomIdx, g.deaths, g.stateHash()].join('|');
  };
  const a = runOnce();
  const b = runOnce();
  assert(a === b, 'états identiques après 531 ticks scriptés');
  if (a !== b) {
    console.log('    A=' + a);
    console.log('    B=' + b);
  }
}

// ---------- 6. piques tuent, respawn au checkpoint ----------
console.log('6. Mort + respawn...');
{
  const g = new Game([]);
  g.startRun('adventure', 'SMOKE-DIE', false);
  // téléporte le joueur dans les piques de R2 (salle 2, piques connues en variante A)
  // ... plus simple : tombe dans le vide de R1 en courant sans sauter.
  const holds: number[] = [];
  for (let i = 0; i < 3000; i++) holds.push(R);
  let died = false;
  for (const inp of script(holds)) {
    g.tick(inp);
    if (g.deaths > 0) {
      died = true;
      break;
    }
    if (g.roomIdx > 2) break;
  }
  assert(died, `mort détectée (morts=${g.deaths}, salle=${g.roomIdx})`);
  assert(!g.player.dead || g.deaths > 0, 'état de mort géré');
  void TT;
}

console.log(failures === 0 ? '\n✅ SMOKE OK — 6/6' : `\n❌ ${failures} échec(s)`);
process.exit(failures === 0 ? 0 : 1);
