# 🧬 Spécimen 115 — prototype jouable (v0.1)

Platformer 2D de précision + speedrun. Pièce du catalogue `random.plagnito.com`.
**0 pub, 0 tracker, 100 % local-first.** Voir `../PLAN_JEU.md` et `../docs/`.

## Lancer

```bash
cd game
npm install
npm run dev      # → http://localhost:5173
npm run build    # → dist/ (bundle statique, chemins relatifs)
```

## Contenu du prototype

- 8 salles (hub + forêt), dont 3 avec variantes seedées (`?seed=XXXX&mode=adventure|daily`)
- Mouvements complets : course, saut variable, dash 8-dir, wall-jump/grimpe, pogo, piqué, glissade, super-saut, cape
- Timer au tick (120 Hz), splits/salle, records + fantôme par seed, daily du jour
- Style (jauge + rangs), 2 breloques, 6 succès, SFX + musique générative, manette
- Déterministe : `F4` = overlay debug (pos, état, hash)

## Contrôles

Clavier (AZERTY OK) : ←→/AD bouger, Espace sauter, Maj dasher, R salle, Échap pause.
Manette : stick/d-pad, A sauter, B/RT dasher, Start pause.

## Structure

```
src/
  core/     constantes, RNG seedé, entrées, stockage local
  world/    salles (rooms.ts) + état runtime (world.ts)
  player/   contrôleur (player.ts)
  systems/  style, succès
  game/     orchestrateur (run.ts : timer, splits, fantôme, records)
  render/   Canvas 2D + particules
  audio/    SFX + musique WebAudio 100 % synthétisés
  ui/       écrans DOM (titre, pause, résultats)
```
