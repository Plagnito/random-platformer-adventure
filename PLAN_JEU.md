# 🎮 Random Platformer Adventure — Plan de jeu

> **Pitch en une phrase :** Un platformer 2D ultra-fluide aux graphismes somptueux, avec des niveaux à génération procédurale seedée et un **mode Speedrun** pensé pour la compétition dès le jour 1.
>
> 🌐 **Publication : une « pièce » du catalogue https://random.plagnito.com** (ex. `/a/random-platformer-adventure/`), avec sa fiche d'avis `/p/<slug>`.
>
> 🏷️ Chaque fonctionnalité est taggée **V1** (release) ou **V2** (post-launch) pour garder le scope sous contrôle.

---

## 📌 0. Règles de la plateforme random.plagnito.com (cadre impératif)

Le sous-domaine est un **catalogue existant** (« Service d'anatomie pathologique », 114 pièces) avec ses conventions. Notre jeu n'est pas le site : c'est **une pièce parmi d'autres**.

### 0.1 Le jeu vit sous `/a/<slug>/`
- URL : `https://random.plagnito.com/a/<slug>/`, fiche d'avis : `/p/<slug>`.
- **Pas de routes top-level** : toute navigation interne passe par **query params ou hash** (`/a/<slug>/?seed=...`, `/#daily`…).
- Le jeu est **une app web statique autonome** servie par la plateforme.

### 0.2 Comptes : local-first + SSO Atlas, jamais de login maison
- Règle officielle : *sans compte, les pièces retiennent la progression dans le navigateur uniquement.*
  → ✅ **100 % fonctionnel sans compte** : progression, PB, fantômes, seeds → `localStorage` / IndexedDB.
  → ✅ L'en-ligne (classements mondiaux) est un bonus pour les connectés.
- Connexion **uniquement via le SSO Atlas** (OAuth2, console `oauth.plagnito.com`).
- ⛔ **Aucune page de login / mot de passe maison** (charte Plagnito). Uniquement un bouton « Se connecter avec Atlas ».
- Soumission via `/soumettre` (compte requis, échange/validation avec l'opérateur).

### 0.3 Zéro publicité, zéro traceur
- ⛔ Pas d'Analytics, pixels, régies pub ou SDK tiers traqueurs dans la pièce. Pas de microtransactions : tout se débloque en jouant.

### 0.4 Conventions du catalogue
- Titre + description **FR** en priorité, ton soigné (second degré bienvenu).
- **Emoji, tags** (`game`, `platformer`, `speedrun`, `Français`, `arcade`…), capacités : progression ✅, classement ✅, succès ✅.
- Les 5 premières minutes conditionnent la note → onboarding aux petits oignons.

### 0.5 Contraintes techniques induites
- **Aucun contrôle serveur/headers** → ⛔ pas de WASM threadé (exit Godot web), app statique légère.
- 🎯 **Quelques Mo max**, jouable en < 5 s.
- ❓ **À valider avec l'opérateur :** poids/format max, API scores/succès ?, query params OK sous `/a/<slug>/`.

---

## 1. Vision & narration

- **Genre :** Platformer 2D de précision mâtiné de **roguelite léger** (breloques, runs uniques), accessible mais profond.
- **Histoire : 5 actes, ~20 h de contenu narratif** (bible complète : `docs/LORE.md`) : vous êtes le **Spécimen N°115** qui s'échappe du Fonds (les niveaux sont des **lames de microscope**), commenté par le **Conservateur**, narrateur peu fiable. V1 = Actes I–II (Évasion + Ascension, ~7 h, twist final) ; V2/V3 = Actes III–V (Réserves, Catalogue Noir, Mise en Lumière), 12 quêtes, 120 fresques, 4 fins, NG+ « Nouvelle Lame ».
- **Public :** visiteurs du catalogue, joueurs de platformers, speedrunners — du casual (mode Détente) au hardcore (fioles + deathless).
- **Plateforme (V1) :** web uniquement, desktop-first (clavier + manette via Gamepad API). Tactile en V2.

## 2. Piliers du jeu

| # | Pilier | Signification concrète |
|---|--------|------------------------|
| 1 | **Fun immédiat, profondeur infinie** | Fun dès 30 secondes (dash + pogo + style), tech à maîtriser pendant 500 h. |
| 2 | **Beauté** | Chaque écran « screenshotable » : parallax, lumière, particules, 60 FPS stables. |
| 3 | **Précision** | Contrôles au pixel près, physique déterministe, coyote time + jump buffering. |
| 4 | **Équité du random** | Seed visible et partageable ; solveur garantissant un chemin toujours possible. |
| 5 | **Speedrun-first** | Chrono, splits, fantômes, classements intégrés au cœur du jeu. |
| 6 | **Pièce exemplaire** | Local-first, 0 tracker, légère, SSO Atlas pour l'en-ligne. |

## 3. Gameplay & fonctionnalités fun 🎉

### 3.1 Mouvements : la base (V1 — valeurs exactes : `docs/game-feel.md`)
- Courir, saut variable, **dash** (8 directions, 1 recharge en l'air), wall-slide + wall-jump, grimpe aux lierres, glissade sous les passages bas.
- Aides invisibles : coyote time (~0,1 s), jump buffer (~0,12 s), correction de rebord.
- **Conservation du momentum** : les boosts (pentes, vents, anneaux) se gardent en vitesse → le speedrun naît du mouvement lui-même.

### 3.2 Mouvements avancés : la profondeur (V1)
La « tech » qui rend le jeu fun 500 h et qui fait la beauté du speedrun :
- 🐸 **Pogo** : rebondir sur ennemis et certains pièges pour repartir plus haut (direction selon l'angle d'arrivée). Le cœur du fun.
- 💨 **Dash-chaîné** : traverser un **cristal/anneau de recharge** rend le dash en plein vol → enchaînements aériens spectaculaires.
- 🦅 **Piqué** : dash diagonal vers le bas qui convertit la hauteur en vitesse horizontale (+ style).
- 🧗 **Grab de rebord** + remontée rapide (pas de temps mort accroché).
- 🌀 **Bunny-slide** : glissade en pente = gain de vitesse, saut en fin de glissade = boost.
- 🪂 **Cape planante** (breloque) : planer en maintenant Saut.
- 🌀 **Super-saut chargé** (s'accroupir + sauter) pour les passages verticaux secrets.
- Tout est enseigné par la pratique : la **salle d'entraînement du hub** propose chaque tech en micro-défi chronométré (V1).

### 3.3 Structure d'une run (V1)
1. Choisir : **Aventure** (seed au choix/aléatoire), **Daily**, **Défi**, **Détente**.
2. Traverser 4 biomes (3–5 salles + 1 salle défi optionnelle chacune).
3. **À chaque biome : choisir 1 breloque parmi 3** (§3.5) → chaque run a son « build ».
4. Ascension finale vers le **Grand Objectif** → écran de fin : temps, style max, morts, lucioles, records battus, boutons « Rejouer », « Revanche (même seed) », « Défier un ami ».
5. **Partage 1 clic** : lien de seed (`?seed=…`) + QR code + fantôme joint si en ligne.

### 3.4 Génération procédurale maîtrisée (V1)
- Salles modulaires dessinées à la main (50–100/biome), assemblées selon la seed.
- **Solveur de faisabilité** : chemin garanti avec les capacités de base (les breloques ne sont jamais requises, seulement amusantes).
- Difficulté séparée de la seed (densité de piques, longueur, fenêtres de timing).
- RNG maison déterministe, identique sur tous navigateurs ; génération < 1 s.

### 3.5 Les biomes : 9 terrains de jeu (V1 : hub + 4 · V2/V3 : +4 — voir `docs/LORE.md` §2)

| Biome | Ambiance | Mécaniques stars | Ennemi mascotte |
|-------|----------|------------------|-----------------|
| 🏛️ **Hub — Aile Ouest** (V1) | Hall de musée, tableaux de records, posters clin d'œil aux autres pièces | Vestiaire, salle d'entraînement tech, mur des fresques, portes des modes | Le Conservateur (PNJ narrateur) |
| 🌲 **1. Forêt Luminescente** (V1, tuto déguisé) | Émeraudes + lucioles dorées | 🍄 Champignons-rebonds, lierres, lucioles guides, sols stables | **Bouftout** (boule qui roule, pogo parfait) |
| 💎 **2. Cavernes de Cristal** (V1) | Bleus/violets, cristaux luminescents | 🔷 Cristaux recharge-dash, 🥁 **plateformes tempo** (apparaissent au rythme de la musique !), lasers intermittents, stalactites | **Chauve-souris syndiquée** (revient toujours, suit mollement) |
| ❄️ **3. Cimes Enneigées** (V1) | Blancs bleutés, aurores | 🧊 Glace ultra-glissante, 💨 courants ascendants, 🪂 tyroliennes, ⛄ **boules de neige géantes à chevaucher** | **Manchot grognon** (charge en ligne droite, excellent tremplin) |
| ☁️ **4. Sanctuaire Céleste** (V1) | Or et blanc, nuages | 🌙 Gravité réduite, ⭕ anneaux propulseurs, 🌀 **portails jumeaux**, dalles qui s'effritent, éclairs télégraphiés | **Nuage grincheux** (pleut = zone glissante, pogo = éclair boost) |
| 🌀 **5. Profondeurs Absurdes** (V2, secret) | Méta, loufoque, glitché | Gravité inversée par zones, salles miroir, sol trampoline, salles clin d'œil (vue du dessus ?!) | **???** (spoiler) |
| 🏚️ **6. Les Réserves** (V2, Acte III) | Entrepôt infini, poussière | Étagères mobiles, monte-charges, cartons qui s'effondrent, salles à moitié effacées | **Tamponneur** + Golem de carton |
| 🧊 **7. Chambre Froide** (V2, Acte III) | Glace + obscurité | Jauge de chaleur (torches), halo réduit, stalagmites | **Stalag Mite** + Oubliés |
| 📊 **8. Le Catalogue Noir** (V2/V3, Acte IV) | Méta, glitch, UI diégétique | Salles 404 à reconstruire, gravité locale, salles qui se réécrivent | **Pixel sauvage** + Correcteurs |

- Salle défi par biome : raccourci risqué = coffre (grosse poignée de lucioles + fragment garanti).
- Les biomes 5–8 (V2/V3) : le 5ᵉ (secret) se débloque via le mur des fresques ; les 6–8 portent les Actes III–IV (voir `docs/LORE.md` §2). Fin V1 = fin de l'Acte II (« Hors du bocal » + teaser).

### 3.6 Breloques : le build roguelite (V1 : 12 breloques)
À chaque biome, choix de **1 parmi 3** (proposées selon la seed → les builds sont partageables et rejouables à l'identique). Cumulables, visibles sur le perso.

| Breloque | Effet | Esprit |
|----------|-------|--------|
| ➕ Double Dash | 2 dashes avant de toucher le sol | fun aérien |
| 📏 Dash filant | Dash +40 % de portée | speed |
| 🔄 Pogo régénérant | Le pogo rend le dash | enchaînements |
| 🧲 Aimant à lucioles | Aspire les collectes proches | gourmand |
| 🕯️ Cœur de rechange | Survit à 1 pic / tour | casual-friendly |
| 🪂 Cape planante | Maintenir Saut = planer | exploration |
| 🧲 Ventouses | Adhérence totale sur glace | anti-rage |
| ✨ Aura stylée | Jauge de style x2 | show-off |
| ⏱️ Chrono pressurisé | −5 s bonus par biome si 0 mort | speedrun |
| 🚀 Départ turbo | Boost de vitesse en début de salle | speedrun |
| 🍀 Trèfle du labo | Révèle 1 secret par biome (scintillement) | exploration |
| 💔 Cœur maudit | +1 dash mais les soins… (trade-off rigolo : les lucioles valent 0) | risque/récompense |

### 3.7 Ennemis & pièges : mignons, utiles, pogotables (V1)
- Philosophie : **zéro combat, zéro vie à gérer en continu** — tout s'esquive ou se **pogo**. Chaque ennemi est un danger ET un outil de speedrun.
- Ennemis : Bouftout, Chauve-souris syndiquée, Manchot grognon, Nuage grincheux → tous **pogotables**, patterns lisibles, bouilles adorables (les speedrunners les adoreront, les casuals les trouveront mignons).
- Pièges : piques classiques, **lasers tempo** (synchro musique), **scies circulaires** qui patrouillent, boulets-balanciers, stalactites (ombre télégraphiée), éclairs (télégraphe + son).
- 💀 **La mort est une blague** : réapparition instantanée en début de salle, compteur de morts affiché **fièrement** (« Mort n°247 — le Conservateur prend des notes »), poof personnalisable (§3.11). Mourir souvent = succès (§3.12).

### 3.8 Système de Style : le fun instantané (V1)
- Jauge 0–100 qui monte : dash (+8), pogo (+12), near-miss (+10), seconde sans toucher le sol (+3/s), portails/anneaux (+6). Chute ou mort = reset (avec un « Ouch. » du Conservateur).
- **Rangs** (voix du labo à chaque passage) : 🚶 Promeneur → 🐇 Sauteur → 🤸 Cascadeur → ⚡ Acrobate → 🌩️ Foudre → 👑 **Légende du Fonds**.
- Effets : multiplicateur de lucioles x1→x5, traînée dorée grandissante, couches musicales supplémentaires, ralenti bref « Matrix » sur near-miss à haut rang.
- Affiché en fin de run + meilleur rang persisté par seed/catégorie → nouvelle dimension de compétition (« sub-10 ET rang Foudre »).

### 3.9 Secrets, fresques & lore (V1)
- 🕵️ **Salles secrètes** : murs illusoires (léger scintillement si on regarde bien, Trèfle du labo), passages super-saut, salles « derrière la cascade » — coffres : lucioles, fragments, fresques.
- 🖼️ **Fresques** (V1 : 45 · total : 120 en 6 séries, voir `docs/LORE.md` §5) : morceaux d'histoire du Fonds + clins d'œil aux autres pièces du catalogue, exposés au mur du hub. Compléter le mur = déblocage du biome secret + succès.
- 🏁 **Fins** (V3 — voir `docs/LORE.md` §6) : 4 fins (standard, gardien, blague « Déclassé », vraie fin 100 % avec boss secret N°000). V1 = fin d'étape « Hors du bocal » + teaser des Réserves.
- 🥚 **Easter eggs** : salle Konami (code ↑↑↓↓←→←→BA = chapeau cône offert), posters parodiques dans le hub, répliques du Conservateur qui changent à la 100ᵉ/1000ᵉ mort.

### 3.10 Fioles du labo : les mutateurs délirants (V1 : 6 ; V2 : +6)
Modificateurs optionnels cumulables, annoncés par une fiole qui se brise au lancement. Runs marquées « 🧪 Avec fioles » → **classements séparés** (« Pur » vs « Fioles »).

| Fiole (V1) | Effet |
|------------|-------|
| 🌙 Gravité lunaire | −40 % gravité, sauts lunaires |
| 🪞 Miroir | Monde inversé horizontalement |
| 🏎️ Turbo | Vitesse globale x1,15 |
| 🧼 Savonnette | Tout est glissant comme la glace |
| ♾️ Dash infini | Dash illimité (le bac à sable du fun) |
| 🙈 Sans chrono | Timer caché (runs à l'aveugle, révélés à la fin !) |
| *V2 :* 🐜 Taille mini, 📳 Sol tremblant, 🎲 Breloques aléatoires imposées, 🌑 Obscurité (halo réduit), 🦘 Trampoline partout, 🔀 Salles mélangées |

### 3.11 Modes de jeu (V1 / V2)

| Mode | Description | Tag |
|------|-------------|-----|
| 🗺️ **Aventure** | Run complète sur seed (choisie/aléatoire), 4 biomes + ascension | V1 |
| 📅 **Daily** | Même seed pour tous, 1 essai classé/jour (entraînements illimités hors classement), reset minuit | V1 |
| ⏱️ **Contre-la-montre par salle** | Chaque salle modulaire jouable en solo TT avec médaille (🥉🥈🥇👑) + classement local (mondial en V2) — **énorme rejouabilité speedrun** | V1 |
| 🧪 **Défis du labo** | Salles sur mesure 30–60 s, rotation hebdo, classements | V2 |
| 🎯 **Entraînement** | Savestates, avance image par image, hitboxes, fantôme | V1 |
| 🍃 **Détente** | Dash infini, pas de timer imposé, Cœur de rechange permanent | V1 |
| 🏁 **Défier un ami** | Envoi d'un lien seed + ton fantôme ; l'ami tente de te battre, comparatif animé | V2 (lien seul en V1) |
| 🎯 **Bingo** | Grille 5×5 d'objectifs sur une seed (ligne/colonne/diagonale), solo ou course async | V2 |
| 📅 **Chaos quotidien** | Daily avec fiole imposée différente chaque jour | V2 |

### 3.12 Personnalisation : les chapeaux absurdes (V1 : base ; V2 : étendue)
- 🎩 **Chapeaux** (V1 : 8) : cône de chantier, chapeau melon, **microscope miniature** (clin d'œil), casque de chantier, couronne de laurier (top daily), bonnet de nuit (mode Détente), chapeau de sorcier (rang Foudre), Œil du Grand Objectif (100 %).
- ✨ **Traînées de dash** : classique, arc-en-ciel, feu, pixels 8-bit, confettis.
- 💥 **Poofs de mort** : boulette standard, confettis, « BIP » de censure, petit fantôme qui fait 👋.
- 🚩 **Bannières de profil** + titres (« Sub-10 », « Chasseur de daily », « Mort-vivant (1000 morts) »).
- Déblocage : lucioles (monnaie de jeu), succès, défis. **Rien de payant, rien de pub.**

### 3.13 Succès : 80+ raisons de rejouer (V1 : 30, noms FR loufoques)
Progression, skill, exploration, absurdité — stockés en local, exposés à la plateforme si API (sinon page succès interne partageable en image).

| Succès | Condition | Esprit |
|--------|-----------|--------|
| 🧬 Spécimen en fuite | Finir sa 1ʳᵉ run | onboarding |
| 🌲✔️💎✔️❄️✔️☁️✔️ | Finir chaque biome | progression |
| 💀 Persévérant | 100 morts cumulées | absurdité fière |
| ☠️ Mort-vivant | 1000 morts cumulées | absurdité fière |
| 🦘 Touche-à-terre interdit | 30 s sans toucher le sol | skill |
| 🏓 Ping-pong | 10 pogos d'affilée | skill |
| 👑 Légende du Fonds | Atteindre le rang style max | skill |
| 📅 Lève-tôt | Finir la daily | habitude |
| 🤨 Sérieux ? | 7 dailies d'affilée | habitude |
| 🕵️ Fouineur / Explorateur / Cartographe | 1 / 10 / 25 salles secrètes | exploration |
| 🖼️ Conservateur adjoint | Mur des fresques complet | exploration |
| 🚫 Sans les mains | Finir un biome sans dasher | défi |
| 🎒 Minimaliste | Finir une run sans breloque | défi |
| 🧪 Alchimiste | Finir une run avec chaque fiole V1 | défi |
| 👻 Fantôme battu | Battre son propre fantôme | speedrun |
| ⏱️ Sous les 15 / 10 / 5 | Run complète sous X minutes | speedrun |
| 🥇🥇🥇 Chasseur de breloques | Médailles d'or sur 10 / 25 / 50 TT de salles | TT |
| 🎩 Chapeauté | Posséder 5 chapeaux | collection |
| 💰 Crésus du labo | 10 000 lucioles cumulées | collection |
| 🥚 ↑↑↓↓←→←→BA | Trouver le code Konami | easter egg |
| 🌑 Sans chrono | Finir une run en fiole « Sans chrono » | fun |
| 🧊 Patineur artistique | 500 m de glissade cumulée | fun |
| ⛄ Rodéo | Chevaucher une boule de neige 10 s | fun |
| 💀 Tombeur de… soi-même | Mourir 5× dans la même salle | auto-dérision |
| 🤝 Mauvais ami | Battre le fantôme d'un ami en Défi | social (V2) |

### 3.14 Progression méta & quêtes (V1 : light ; V2 : full)
- **Niveaux de spécimen** (XP = runs, TT, succès) : débloquent breloques/chapeaux/traînées.
- **Quêtes hebdo** (V2) : « finis 2 dailies », « rang Foudre », « 3 salles TT en or » → récompenses lucioles exclusives.
- **Rapport d'autopsie** 📋 : page de stats perso (morts, distance dashée, temps de jeu, pogo max, rang max, seeds jouées) — partageable en image. Clin d'œil anatomie pathologique assumé. (V1)

### 3.15 Boss & gardiens (V1 : 2 · total : 6 — bible : `docs/DIFFICULTE.md` §4)
- V1 : **la Cloche à Vide** (fin Acte I : aspiration + cloches qui tombent) et **le Grand Objectif** (fin Acte II : lasers rotatifs, phase miroir, flash + tempo — 3 phases).
- V2/V3 : **l'Archiviste** (tampons géants, classeurs), **l'Index** (barre de vie en étoiles ⭐, attaques « 1 étoile » / « Signalement »), **le Déclassement** (fuite finale multi-salles), **N°000 « le Premier »** (boss secret, 5 phases, le plus dur du jeu).
- Design : arènes fermées, checkpoint à l'entrée, patterns fixes, phases validées par pogos bien placés (pas de barre de vie chiffrée), TT par boss (V2).

### 3.16 Difficulté « Grossissement » & hardcore (bible : `docs/DIFFICULTE.md`)
- 4 modes : 🍃 Détente (x40), ⚖️ Standard (x100), 🔥 Expert (x400), 🔬 Microscope (x1000) ; salles notées 1–10 affichées à l'entrée (clin d'œil aux µm du catalogue).
- Contenu hard : **~24 pièges** (5 familles : piques, lames mobiles, tempo, environnement, méta), **16 ennemis + élites** (tous pogotables sauf le Golem de carton !), **Lames X** (NG+, versions dures des salles), **Chaleur** (15 protocoles cumulables façon Hadès, V2), **Fioles maudites** (1-hit, sablier, silence… V2), **Salles dorées** (V1 : 8, notation 10), **Profondeurs** (mode infini, V2).
- Règle d'or : tout ce qui tue est télégraphié (≥ 0,5 s) ; tout le hard est optionnel pour finir, obligatoire pour 100 % ; assist toujours disponible (runs marquées, succès « Malin »).

## 4. Direction artistique 🎨
- Style : **pixel-art HD** ou peint (tranché au proto) ; palette par biome ; parallax 4–6 couches ; éclairage 2D dynamique ; shaders (eau, chaleur, aura) ; post-processing (bloom doux, vignette, grain, aberration au dash).
- Le hub « Aile Ouest » ressemble à un muséum : cadres, vitrines, posters parodiques des autres pièces du catalogue (easter eggs visuels).
- Budgets pièce : **quelques Mo max**, < 5 s avant jouable, lazy-load par biome, mode Performance sans changement de physique, 60 FPS (120 Hz supportés).

## 5. Mode Speedrun 🏁
- Timer au millième, start au premier input, stop à l'arrivée, chargements exclus ; splits par biome/salle avec codes couleur ; PB + historique + fantômes rejoués depuis les inputs (Ko).
- Fair-play web : pause auto si onglet caché ; physique à pas fixe d'horloge jeu ; version affichée (saisons).
- Catégories : Any% Seed, Daily (+ Chaos quotidien V2), Random Seed, 100 %/All Fragments, Deathless, **TT par salle** (§3.11) + **TT boss** (V2), runs « 🧪 Fioles » et « 💀 Maudit » séparées, **Lames X** (NG+), **Chaleur** (V2), **Profondeurs** (V2, score infini).
- Mode entraînement : savestates, frame-by-frame, hitboxes, compteur d'inputs.
- V1 = classements **locaux** complets ; V2 = en ligne (API plateforme si dispo, sinon mini-backend + SSO Atlas, re-simulation anti-triche des tops).
- Export LiveSplit + soumission speedrun.com ; « Défier un ami » (lien + fantôme).

## 6. Audio & musique 🎵
- Musique **adaptative** : couches ajoutées avec le rang de style et la vitesse (les plateformes tempo du biome 2 battent sur la musique !) ; thème par biome.
- SFX riches + mode « sons neutres » ; 100 % original (stream-safe) ; audio au premier input (écran « Cliquez pour jouer » = décompte).
- Budget : pistes compressées, lazy-load par biome. Voix du Conservateur en **texte** (pas de doublage — coût/poids), avec effet « bip » type jeux indés (V1) ; doublage FR/EN en V2 si budget.

## 7. UX / UI
- Manette + clavier/souris, remappage total ; HUD minimal configurable ; navigation interne en query/hash ; boutons copier-lien partout.
- Onboarding : le biome 1 EST le tutoriel (jamais de mur de texte ; 1 mécanique par salle) + salle d'entraînement tech au hub.
- FR d'abord, EN ensuite ; daltonisme, réduction flashs/secousses, mode Détente.

## 8. Technique — une pièce web autonome 🛠️

### 8.1 Moteur : **stack web native** ⭐ — TypeScript + Vite + WebGL (PixiJS ou maison)
- Imposé par §0 : app statique légère, aucun header spécial, intégration URLs/OAuth native.
- **Physique maison à pas fixe** (simple pour un platformer, 100 % déterministe), RNG seedé maison.
- Zéro dépendance traqueuse. CI : build + **refus si poids dépassé** + tests (déterminisme, solveur, goldens de seeds).

### 8.2 Architecture (dépôt)
```
/random-platformer-adventure
├── docs/                # plan, specs (game-feel, speedrun, biomes, soumission)
├── game/                # la pièce
│   ├── src/
│   │   ├── core/        # boucle, timer, RNG, storage local, routing (?seed= / #daily)
│   │   ├── player/      # contrôleur, tech avancées, fantômes (record/replay)
│   │   ├── worldgen/    # salles, assembleur, solveur, secrets
│   │   ├── systems/     # style, breloques, fioles, succès, quêtes, stats
│   │   ├── speedrun/    # splits, PB, TT salles, classements locaux, exports
│   │   ├── render/      # WebGL : parallax, lumières, particules, shaders
│   │   ├── audio/       # musique adaptative (WebAudio), SFX
│   │   ├── ui/          # hub, menus, HUD, vestiaire, rapport d'autopsie
│   │   └── online/      # SSO Atlas + client API (V2)
│   └── assets/          # sprites, tuiles, audio compressé
├── server/ (V2)         # mini-backend scores/replays si besoin
├── tools/               # éditeur de salles, validateur de seeds, budgets
└── tests/               # déterminisme, solveur, goldens
```

### 8.3 Livrable « pièce »
- Bundle statique déposé via `/soumettre`, slug proposé : `random-platformer-adventure`.
- Métadonnées : titre FR, description, emoji 🧬, tags (`game`, `platformer`, `speedrun`, `Français`, `arcade`, `cozy` ?), capacités ✅✅✅.
- Versionnage strict (saisons de classements).

## 9. Roadmap 🗺️

| Phase | Contenu fun livré | Durée* |
|-------|-------------------|--------|
| **0. Prototype** | 1 salle grise, mouvements de base + **pogo + style V0**, timer. Valider : « bouger est fun dans le navigateur ? » + valider formats auprès de l'opérateur (§0.5). | 2–3 sem. |
| **1. Vertical slice** | Biome 1 complet (🍄 champis, lierres, Bouftout), 3 breloques, 10 succès, timer + splits + PB + fantôme, `?seed=`, 1 chapeau. « Jouable, beau et drôle » sur un périmètre réduit. | 1–2 mois |
| **2. Alpha** | Biomes 2 (tempo !) + 3 (boules de neige !), 12 breloques, système de style complet, 8 chapeaux, mode entraînement, Daily locale, TT de salles. | 2–3 mois |
| **3. Beta** | Biome 4 (portails !), hub Aile Ouest + Conservateur + fresques, 6 fioles, 30 succès, secrets, mode Détente, rapport d'autopsie. **Soumission de la pièce** + beta via la fiche. Tests speedrunners. | 2–3 mois |
| **4. Release V1** | Retours/avis intégrés, FR/EN, trailer, événement « Daily Race » inaugural. | 1 mois |
| **5. Extension V2 — Les Réserves** | Acte III (biomes 6–7, boss Archiviste, 4 quêtes, fuites du Déclassement), Lames X complètes, Chaleur (15 protocoles), Profondeurs, Défis du labo, Chaos quotidien. | 2–3 mois |
| **6. Extension V3 — Mise en Lumière** | Acte IV (biome 8 méta, boss Index) + Acte V (best-of, choix final, 4 fins, boss secret N°000), 120 fresques, Bingo, Défier un ami complet, TT boss, classements en ligne, speedrun.com officiel. | 2–3 mois |
| **7. Post-launch continu** | Biome secret (Profondeurs Absurdes), saisons, quêtes hebdo, tactile mobile, nouveaux protocoles/fioles, saison 2 (teaser Profondeurs). | continu |

*\*Pour 1–3 personnes à temps partiel.*

### Jalons de validation
- Fin P0 : fun du mouvement validé + réponses opérateur.
- Fin P1 : 5 testeurs finissent le biome via un lien, rient au moins une fois (Conservateur, morts, chapeau), veulent rejouer.
- Fin P3 : 10 speedrunners valident timer/splits/fantômes/TT.

## 10. Risques & parades ⚠️

| Risque | Parade |
|--------|--------|
| **Dispersion « fun » (trop de features)** | Tags V1/V2 stricts ; vertical slice d'abord ; toute nouvelle idée fun → backlog V2 sauf si elle remplace une feature V1. |
| **Scope narratif (20 h !)** | Bible verrouillée (`docs/LORE.md`) ; V1 = Actes I–II uniquement ; narration modulaire (quêtes/fresques ajoutables sans toucher au critique) ; texte court, in-engine, skippable. |
| Game feel médiocre | Prototype dédié, itérations hebdo, références étudiées image par image. |
| Génération injuste | Solveur + tests sur milliers de seeds. |
| Triche (V2 en ligne) | Replays re-simulés, SSO obligatoire, modération. |
| Pièce refusée / non conforme | Respect §0, validation opérateur dès P0. |
| Poids trop élevé | Budgets dès P0, CI qui refuse les builds lourds. |
| 60 FPS non tenus | Mode Performance, tests petites configs dès l'alpha. |
| Différences navigateurs | RNG/physique déterministes, matrice de tests navigateurs. |

## 11. Prochaines étapes concrètes ✅

1. Valider le cadre avec l'opérateur (§0.5).
2. Rendu tranché ✅ : **Canvas 2D maison** (léger, 59 Ko, zéro dép.) ; style : pixel-nuit « forêt luminescente ».
3. Lire/valider les bibles ✅ écrites : `docs/LORE.md` (histoire, 5 actes, quêtes, fins) et `docs/DIFFICULTE.md` (pièges, ennemis, boss, hardcore).
4. Prototype jouable ✅ livré → `game/` (8 salles, mouvements complets, timer, fantôme, seeds, daily, style, succès — `npm run dev`).
5. Spec game feel ✅ écrite → `docs/game-feel.md`, valeurs validées par `tools/smoke.ts` (6/6 : saut 57,6 px, dash 50 px, déterminisme).
6. **Playtest humain** : finir les 8 salles, régler le game feel (protocole §7.3 de la spec), vérifier R5/R6 à la manette.
7. Spec timer speedrun → `docs/speedrun-rules.md` (start/stop/pause, onglets cachés, catégories).
8. Boss 1 (Cloche à Vide) + éditeur de salles → `tools/` (priorité P1).
9. Dossier de soumission → `docs/soumission.md` (titre, description FR, emoji, tags).

---

*Document vivant : mis à jour à chaque phase. Que la meilleure seed gagne — et que le Conservateur prenne des notes ! 🧬🏆*
