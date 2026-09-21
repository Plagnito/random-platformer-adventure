# 🎯 Spec Game Feel — valeurs maîtresses

> **LA référence chiffrée du jeu.** Toute constante de mouvement/physique vit dans `src/core/constants.ts` (source unique, importée par le jeu, le solveur et les tests).
> Convention : distances en **pixels** (tuile = 16 px), durées en **ticks** (120 ticks/s — voir §1). Les équivalents « tuiles » et « secondes » sont indicatifs.

---

## 0. Principes

1. **Le fun vient du contrôle** : le perso fait *exactement* ce que les doigts demandent, en < 1 tick de latence perçue (polling chaque tick, zéro buffer de rendu).
2. **Généreux en lecture, exigeant en exécution** : coyote time, jump buffer, correction de coins, hitbox pardonnante — mais les salles dures restent dures.
3. **Tout est en ticks entiers** : timers, freezes, ralentis → 100 % déterministe, replays minuscules (voir §12).
4. **On tune avec des outils, pas au feeling** : salle de mesure, overlay debug, tests auto (§13–14). Aucune constante ne change sans passer le protocole §13.3.

---

## 1. Unités & boucle fixe

| Paramètre | Valeur |
|-----------|--------|
| Tuile | **16 px** |
| Hitbox joueur | **8 (l) × 11 (h) px** (sprite visuel ~16×16, hitbox pardonnante) |
| Fréquence logique | **120 ticks/s** (tick = 1/120 s ≈ 8,33 ms) |
| Rendu | `requestAnimationFrame`, indépendant (60/120/144 Hz OK), interpolation de rendu entre ticks |
| Accumulateur | max **8 ticks/frame** (au-delà : ralenti « spiral of death » plutôt que saut — le timer suit les ticks, jamais l'horloge murale) |
| Timer speedrun | **compteur de ticks** depuis le premier input ; affichage ms = `round(ticks × 1000 / 120)` (exact au tick, honnête) |
| RTA (streaming) | `performance.now()` affiché à part, jamais utilisé pour les classements |

---

## 2. Constantes maîtresses (tableau complet)

### 2.1 Course

| Constante | Valeur | Note |
|-----------|--------|------|
| `RUN_MAX` | 100 px/s (6,25 tuiles/s) | vitesse de pointe |
| `RUN_ACCEL` | 1400 px/s² | 0 → max en ~0,07 s (nerveux immédiat) |
| `RUN_FRICTION` | 1800 px/s² | arrêt en ~0,055 s |
| `SKID_DECEL` | 2600 px/s² | demi-tour (dérapage + poussière) |
| `AIR_ACCEL` | 900 px/s² | bon contrôle aérien (fun > réalisme) |
| `ICE_ACCEL` / `ICE_FRICTION` | 500 / 120 px/s² | la glace = quasi pas d'adhérence |

### 2.2 Saut

| Constante | Valeur | Note |
|-----------|--------|------|
| `JUMP_V0` | 330 px/s | impulsion initiale |
| `G_UP` | 969 px/s² | gravité en montée |
| `G_DOWN_MULT` | ×1,4 | gravité en descente (saut « claquant ») |
| `JUMP_CUT_MULT` | ×2,4 | gravité si on relâche tôt (saut variable) |
| `MAX_FALL` | 250 px/s | vitesse de chute max |
| `FAST_FALL` | 320 px/s | touche Bas en l'air |
| **Hauteur saut complet** | **≈ 56 px ≈ 3,5 tuiles** | saute 3 tuiles + marge |
| **Petit saut (tap)** | ≈ 23 px ≈ 1,5 tuile | |
| **Distance saut complet** | ≈ 63 px ≈ 4 tuiles | à vitesse max |
| `COYOTE_TICKS` | 12 (0,10 s) | sauter après avoir quitté le rebord |
| `BUFFER_TICKS` | 14 (≈ 0,117 s) | saut pressé avant l'atterrissage |
| Correction de coin (plafond) | 4 px | nudge horizontal auto |
| Assistance de rebord | snap 3 px | « attrape » le bord en montant |

### 2.3 Dash

| Constante | Valeur | Note |
|-----------|--------|------|
| `DASH_SPEED` | 340 px/s | 8 directions (visée au stick/flèches) |
| `DASH_TICKS` | 18 (0,15 s) | **distance ≈ 51 px ≈ 3,2 tuiles** |
| `DASH_COOLDOWN_TICKS` | 24 (0,20 s) | anti-spam (hors Dash infini) |
| `DASH_FREEZE_TICKS` | 5 (≈ 0,042 s) | hit-stop au déclenchement |
| Recharge | sol, cristal, anneau, pogo (breloque) | 1 charge (2 avec Double Dash) |
| Traînées (afterimages) | 1 fantôme / 2 ticks pendant le dash | visuel |

### 2.4 Murs

| Constante | Valeur | Note |
|-----------|--------|------|
| `WALL_SLIDE_MAX` | 50 px/s | glissade lente (poussière + son) |
| `WALL_JUMP_VX` | 175 px/s | impulsion horizontale |
| `WALL_JUMP_VY` | 280 px/s | ≈ 85 % du saut normal |
| `CLIMB_UP` | 55 px/s | grimpe (Haut + vers le mur), illimitée mais lente |
| Grab de rebord | auto si mains à ±4 px du rebord | remontée en 10 ticks |

### 2.5 Tech avancées

| Constante | Valeur | Note |
|-----------|--------|------|
| `POGO_VY` | 335 px/s | rebond ennemi (fenêtre buffer 12 ticks avant contact) |
| `POGO_VX_KEEP` | ×1,05 (cap 160 px/s) | le pogo récompense la vitesse |
| `POGO_FREEZE_TICKS` | 6 (0,05 s) | le « pop » satisfaisant |
| `SLIDE_FRICTION` | 300 px/s² | glissade (Bas + vitesse) |
| `DIVE_LAND_BOOST` | ×1,35 (cap 220 px/s) | piqué → atterrissage = boost + glissade 42 ticks |
| `SUPERJUMP_MULT` | ×1,2 (charge 42 ticks) | ≈ 5 tuiles (passages secrets verticaux) |
| `CAPE_FALL_MAX` | 45 px/s | planer (maintenir Saut en chute, breloque) |
| `CAPE_DRIFT` | 700 px/s² | contrôle en planage |

### 2.6 Interacteurs

| Élément | Valeur | Note |
|---------|--------|------|
| 🍄 Champignon-rebond | `vy = −400` (≈ 5,2 tuiles) | squash 12 ticks, « boing » |
| 🔷 Cristal recharge | rend le dash + lift 120 px/s | respawn 60 ticks |
| ⭕ Anneau propulseur | 380 px/s vers la sortie + dash | visée auto à ±15° |
| 🌀 Portail | conserve `v` ×1,1, anti-boucle 36 ticks | son « wop » distinct entrée/sortie |
| 🪂 Tyrolienne | 220 px/s le long du câble, saut = boost ×1,1 | décrochage auto en fin |
| 💨 Vent | 600 px/s² dans la direction | bourrasques seedées (jamais de RNG libre) |
| 🪂 Boule de neige (chevauchée) | suit la pente, 140–260 px/s | saut = éjection ×1,2 |
| 🟨 Trampoline (V2) | `vy = −460` (≈ 6,8 tuiles) | |

---

## 3. Détails d'implémentation

### 3.1 Saut variable (le cœur du game feel)
- Monter + bouton tenu → `G_UP`. Monter + relâché → `G_UP × JUMP_CUT_MULT`. Descendre → `G_UP × G_DOWN_MULT`.
- Cap `MAX_FALL` / `FAST_FALL` (Bas enfoncé en l'air, annule au lâcher ou à l'atterrissage).
- Atterrissage : si `vy > 215` → freeze 4 ticks + poussière + « thud » ; si > 300 (fast fall) → 6 ticks + onde de choc visuelle.

### 3.2 Dash
- Pendant `DASH_TICKS` : vélocité verrouillée sur la direction, gravité nulle, traverse les ennemis (pas les murs !).
- Fin de dash : conserve 60 % de la vitesse en vélocité normale (le « dash-jump » enchaîné est récompensé).
- Dash vers le bas en l'air = **piqué** (atterrissage → §2.5).
- Redirection : changer de direction pendant le dash est impossible (commitment), sauf breloque V2.

### 3.3 Collisions (ordre strict, chaque tick)
1. Intégrer X → résoudre tuiles X (murs, pentes ≤ 2 px marchables).
2. Intégrer Y → résoudre tuiles Y (sol, plafond + correction de coin 4 px).
3. Entités (ennemis, anneaux, portails…) : AABB contre hitbox.
4. Pièges : AABB **réduite de 1 px** par côté (pardonnante — le joueur doit sentir qu'on l'aide, jamais l'inverse).
5. Eau/vent/zones : appliquent leurs accélérations (avant intégration du tick suivant).

### 3.4 Salles & checkpoints
- Respawn : position du checkpoint (snap tuile), vélocité nulle, état neutre, invulnérabilité 30 ticks (clignotement), timer speedrun **non remis** (la mort coûte le temps perdu, c'est tout).
- Transition de salle : slide caméra 42 ticks, **sim en pause, timer en pause** (règle speedrun).

---

## 4. Caméra & juice 🎥

### 4.1 Caméra
- Lookahead : `x = vx × 0,25` (cap ±40 px), `y = vy × 0,12` (cap ±24 px) + dip d'atterrissage 6 px (retour en 20 ticks).
- Suivi : amortissement critique (≈ 8 % de l'écart résorbé par tick à 120 Hz — snappy mais doux).
- Verrouillage : ne montre jamais hors-salle (clamp aux bornes + 8 px de marge).
- Transitions boss/arènes : zoom 1,1× en 30 ticks (annoncé, jamais pendant un saut).

### 4.2 Freeze & ralentis (TOUT en ticks — déterministe)

| Événement | Effet |
|-----------|-------|
| Dash | freeze 5 ticks |
| Pogo | freeze 6 ticks |
| Atterrissage dur (vy > 215) | freeze 4 ticks (+6 si fast fall > 300) |
| Near-miss (rang ≥ Acrobate) | ralenti ×1/4 pendant 30 ticks (1 tick sim / 4 ticks horloge) |
| Mort | freeze 14 ticks + ralenti ×1/3 (36 ticks) + poof → respawn |
| Record de salle/seed | 24 ticks de confettis + « NOUVEAU RECORD » (sim continue, pas de freeze — ne jamais casser le flow d'une run !) |
| Boss phase validée | freeze 10 ticks + shake |

### 4.3 Shake, squash, particules
- Shake : trauma 0–1 (pogo +0,25, atterrissage dur +0,2, mort +0,5, boss +0,7), decay 1,2/s, offset = trauma² × 12 px (bruit seedé **visuel**, hors sim). Option : réduit/désactivé (accessibilité).
- Squash & stretch : atterrissage (×1,25/×0,75, 10 ticks), saut (×0,8/×1,2, 8 ticks), dash (×1,3 directionnel), pogo (×1,4). Le perso ne dépasse jamais ±30 % (lisibilité hitbox).
- Budgets particules : 60 max simultanées (Performance : 20), poussière 6–10 par événement, traînée dash 1/2 ticks, confettis record 80 (hors budget, 24 ticks).
- Flashs : aucun flash plein écran > 80 ms ; option « réduire les flashs » (remplace par fondu).

---

## 5. Inputs ⌨️🎮

| Action | Clavier (défaut) | Manette | Bits replay |
|--------|------------------|---------|-------------|
| Gauche/Droite | ←/→ ou A/D | stick/d-pad | 0–1 |
| Haut/Bas | ↑/↓ ou W/S | stick/d-pad | 2–3 |
| Saut | Espace/Z | A/Croix | 4 |
| Dash | Shift/X | RT/R2 ou B/Rond | 5 |
| Planer (cape) | maintenir Saut | maintenir Saut | — |
| Pause | Échap/P | Start | 6 |
| Reset salle | R | Select + A ? (configurable) | 7 (hors sim, méta) |

- **SOCD** : Gauche + Droite = neutre (pas de priorité — équité speedrun). Haut + Bas = neutre.
- Polling : état échantillonné **chaque tick** (clavier + manette fusionnés, remappage total, deadzone stick 0,25).
- Replay : **2 octets/tick** (12 bits utilisés) → ~240 octets/s, fantôme d'une run de 10 min ≈ 144 Ko. Compression RLE pour le stockage (runs répétitives → ~10–30 Ko).

---

## 6. Déterminisme (règles strictes 🔒)

1. Pas fixe 1/120, accumulateur capé (§1). Tout timer en ticks entiers.
2. **RNG seedé uniquement** (`splitmix32`) : 3 flux séparés — `WORLD` (génération), `GAME` (breloques, bourrasques, élites), `VISUAL` (particules, shake — peut diverger sans casser les replays, mais seedé quand même par simplicité).
3. ⛔ **Interdit dans la sim** : `Math.random()`, `Date.now()`, `performance.now()`, et les fonctions `Math.*` transcendantes (`sin/cos/sqrt/tan/pow…` — non garanties identiques entre navigateurs !). Remplacements : tables précalculées (ex. `SIN_TABLE[1024]`), approximations entières, ou algos sans racine (comparer des carrés).
4. Autorisés : `+ − × / %`, comparaisons, `Math.floor/ceil/abs/min/max` (entiers/exacts).
5. État sérialisable (JSON) à tout tick → savestates d'entraînement + tests.
6. **Test de non-régression** : 10 000 ticks rejoués depuis inputs enregistrés → hash d'état identique (CI, navigateurs Chrome/Firefox/WebKit).

---

## 7. Debug, tuning & tests 🛠️

### 7.1 Overlay debug (touche F4)
Position/vitesse (px + tuiles), état (sol/air/dash/mur…), timers coyote/buffer/dash, tick courant, seed, hash d'état (8 caractères — compare les replays d'un coup d'œil), FPS + ticks/frame.

### 7.2 Salle de mesure (greybox, `tools/mesure/`)
- Règles graduées (tuiles), mâts de 1–6 tuiles (valider hauteurs de saut), fosses de 2–8 tuiles (distances), murs de wall-jump, rails de dash.
- Protocole : chaque changement de constante → capture vidéo auto + mesures → comparé aux cibles §2 (tolérance ±1 px).

### 7.3 Protocole d'itération (hebdo en P0–P1)
1. Jouer la salle de mesure + 3 salles grises (5 min).
2. Noter UN problème (« le saut flotte », « le dash arrive court »).
3. Changer UNE constante (±10–20 %).
4. Re-mesurer (tests §7.2) + 5 runs aveugles (un testeur compare A/B sans savoir).
5. Committer avec la raison (« JUMP_V0 320→330 : les sauts de 3 tuiles passaient à 80 %, cible 100 % »).

### 7.4 Tests automatiques (CI)
- `jump_height == 56 ± 1 px`, `dash_distance == 51 ± 1 px`, `pogo_vy`, super-saut ≈ 5 tuiles.
- Déterminisme : replay 10 000 ticks → hash identique.
- Solveur : 1 000 seeds aléatoires → 100 % faisables en capacités de base.
- Budgets : bundle < X Mo (voir §0.5 du plan), 60 FPS sur config mini (test synthétique).

---

## 8. Références & inspirations
- *Celeste* (précision, coyote/buffer, dash 8-dir, TT) — la grammaire de référence.
- *Super Meat Boy* (respawn instantané, momentum), *Ori* (fluidité, bash → notre pogo), *Hollow Knight* (pogo !), *Mario* (saut variable depuis 1985).
- Principe maison : **« 30 secondes pour sourire, 500 heures pour maîtriser. »**

---

*Historique des changements : chaque modification de constante est loggée ici (date, valeur, raison, auteur).*
- *2026-09-21 : création (valeurs initiales théoriques — À VALIDER au prototype P0).*
