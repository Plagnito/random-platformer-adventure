# 💀 Bible de la difficulté — Dur mais juste, et drôle

> Philosophie, catalogue des pièges/ennemis/boss, systèmes hardcore (Lames X, Chaleur, Profondeurs).
> Tout le contenu difficile est **optionnel pour finir**, **obligatoire pour 100 %**. La mort est instantanée, le respawn aussi, et le compteur de morts est une fierté.

---

## 0. Règles d'or de l'équité

1. **Tout ce qui tue est télégraphié** : piques visibles, ombres + son avant chute, délai ≥ 0,5 s avant activation, lasers avec pré-faisceau. Zéro mort « gratuite ».
2. **Respawn instantané** au dernier checkpoint (début de salle minimum ; mi-salle en Détente/Standard sur salles longues).
3. **Patterns fixes, jamais de RNG** sur boss et pièges tempo (le RNG seedé ne place que la disposition, jamais le timing).
4. **La difficulté vient de l'exécution, pas de la lecture** : on voit le danger, c'est le faire qui est dur.
5. **Assist toujours disponible** (§7), runs marquées, jamais de honte (succès « Malin » si fini avec assist !).
6. **Clins d'œil catalogue** : la difficulté des salles s'affiche en **grossissement** (x40 → x1000), comme les pièces affichent des µm. 🔬

---

## 1. Échelle « Grossissement »

### 1.1 Modes globaux

| Mode | Grossissement | Checkpoints | Dégâts | Déblocage |
|------|---------------|-------------|--------|-----------|
| 🍃 Détente | x40 | Mi-salle + début | Cœur de rechange permanent, timer optionnel | Dès le début |
| ⚖️ Standard | x100 | Début de salle + mi-salle (salles longues) | Mort = respawn salle | Dès le début |
| 🔥 Expert | x400 | Début de salle uniquement, pièges +25 % vélocité | Idem, fenêtres tempo −20 % | Finir Acte I |
| 🔬 Microscope | x1000 | Début de salle, pièges +50 %, élites systématiques | Idem + score x2 | Finir Acte II (V1) / Fin A (final) |

### 1.2 Notation des salles (1–10, affichée à l'entrée)
1–2 : promenade · 3–4 : standard · 5–6 : corsé · 7–8 : expert · 9 : microscope · 10 : dorée (salles prestige §5.4).
Le générateur respecte une **courbe par acte** (§6) et n'assemble que des salles « apprises » (mécaniques déjà introduites).

---

## 2. Catalogue des pièges (~24, V1 : 16)

### Famille A — Piques & lames fixes (V1)

| Piège | Effet | Télégraphe | Biome d'intro |
|-------|-------|------------|---------------|
| Piques classiques | Mort au toucher | Visibles, son « ting » à proximité | Forêt |
| Piques rétractables | Sortent/rentrent sur tempo fixe | Clic + frémissement 0,5 s avant | Cristal |
| Piques collantes | Ralentissent 50 % au contact (pas mortelles — combo avec tempo !) | Brillent, bruit de glue | Cristal |
| Piques timides | Sortent quand on ne les regarde pas (direction du regard !) | Ricanement… | Chambre Froide (V2) |

### Famille B — Lames mobiles (V1)

| Piège | Effet | Télégraphe | Biome |
|-------|-------|------------|-------|
| Scie patrouilleuse | Suit un rail, mort au toucher | Rail visible, vrombissement | Cristal |
| Scalpel volant | Traverse la salle en ligne droite quand on entre dans sa ligne de vue | Laser de visée 0,6 s avant | Céleste |
| Boulet-balancier | Pendule, mort + projection | Chaîne visible, grincement | Cimes |
| Guillotine | Tombe quand on passe dessous | Ombre + cliquetis, délai 0,4 s | Réserves (V2) |
| Tampon écraseur | Descend sur tempo (boss Archiviste + salles A3) | Ombre + « TAM-PON ! » | Réserves (V2) |

### Famille C — Tempo & rythme (V1)

| Piège | Effet | Télégraphe | Biome |
|-------|-------|------------|-------|
| Laser intermittent | Faisceau ON/OFF sur tempo fixe | Pré-faisceau fin + bip | Cristal |
| Plateforme tempo | Apparaît/disparaît **au rythme de la musique** | Battement visuel + sonore | Cristal |
| Métronome | Zone qui tue sur le temps fort (gros « TIC ») | Compte visuel 3-2-1-TIC | Céleste |
| Stalactite / stalagmite | Tombe (ou pousse) quand on passe | Ombre/fissure + craquement | Cristal/Cimes |

### Famille D — Environnement (V1 : 4, V2 : +4)

| Danger | Effet | Biome |
|--------|-------|-------|
| Courants (4 dir. + bourrasques) | Poussent, perturbent les sauts | Cimes |
| Glace | Adhérence ~0 (combo pentes = fun/speed) | Cimes |
| Obscurité | Halo réduit, dangers masqués (jamais de mort gratuite : halo minimal garanti) | Chambre Froide (V2) |
| Encre bouillante | « Lave » : mort + bloubloub | Réserves (V2, sous-sols) |
| Jauge de chaleur | Le froid tue lentement ; torches/zones chaudes pour se réchauffer | Chambre Froide (V2) |
| Cartons piégés | S'effondrent 1 s après contact (plateformes !) | Réserves (V2) |
| Salles qui s'effondrent | Le sol disparaît derrière (fuites du Déclassement) | A3+ (V2) |
| Vide / hors-lame | Chute = mort douce (« hors champ du microscope ») | Partout |

### Famille E — Méta (Acte IV, V2/V3)

| Danger | Effet |
|--------|-------|
| Salle 404 | Morceaux manquants (trous à reconstruire avec fragments) |
| Correcteur | Efface les plateformes temporaires sur son passage |
| Gravité locale | Zones en gravité inversée/latérale (signalées, transitions douces) |
| Salle qui se réécrit | Disposition change toutes les X s (pattern fixe, jamais pendant un saut !) |

---

## 3. Ennemis (~16 + élites) — tous pogotables 🐸

| Ennemi | Pattern | Utilité pogo | Biome | Tag |
|--------|---------|--------------|-------|-----|
| Bouftout | Roule en ligne, rebondit aux murs | Tremplin parfait | Forêt | V1 |
| Chauve-souris syndiquée | Suit mollement, fait des pauses (35 h !) | Boost vertical | Cristal | V1 |
| Manchot grognon | Charge en ligne droite quand on s'approche | Gros boost horizontal | Cimes | V1 |
| Nuage grincheux | Dérive, pleut (flaques glissantes) | Pogo = éclair boost | Céleste | V1 |
| Mite de bibliothèque | Ronge les plateformes tempo (les raccourcit !) | Petit boost | Réserves | V2 |
| Punaise | Colle au mur, fonce si on passe devant | Boost mural | Réserves | V2 |
| Tamponneur | Saute sur place en tamponnant (mini-tampons) | Timing strict = gros boost | Réserves | V2 |
| Golem de carton | Lent, indestructible, bloque les passages (puzzle !) | Non pogotable (trop lourd — le seul !) | Réserves | V2 |
| Stalag Mite | Tombe du plafond quand on passe (puis rampe) | Boost surprise | Chambre Froide | V2 |
| Oublié | Fantôme qui traverse les murs en ligne droite (pattern fixe) | Boost fantôme (traverse tout !) | Réserves/Ch.Froide | V2 |
| Chauve-souris chasseuse | Suit vite et bien (élite) | Boost ++ | Cristal X / Microscope | V1 (élite) |
| Bouftout doré | Rapide, doré, +50 lucioles si pogoté 3× (puis s'enfuit !) | Jackpot | Aléatoire rare | V1 |
| Manchot lanceur | Lance des boules de neige (destructibles au dash) | Pogo sur boule = méga-boost | Cimes X | V2 |
| Nuage orageux | Éclairs télégraphiés en chaîne | Pogo éclair = boost max | Céleste X | V2 |
| Pixel sauvage | Se téléporte sur grille fixe (pattern mémorisable) | Boost téléporté (rigolo !) | Index | V2/V3 |
| Correcteur junior | Efface les checkpoints temporaires des salles longues (!!) | Boost + rend le checkpoint | Index | V3 |

**Élites** (dorés, +50 % vitesse, patterns resserrés) : systématiques en Microscope, fréquents en Lames X, rares ailleurs. Récompense : +lucioles, entrée bestiaire dorée. 👑

---

## 4. Boss (V1 : 2 · total : 6)

> Boss = arène fermée, checkpoint à l'entrée, patterns fixes en 3–5 phases, jauge de « cran » (3–5 pogos bien placés pour passer la phase — pas de barre de vie chiffrée, du game feel). TT par boss (V2).

| Boss | Acte | Arène & phases | Récompense | Tag |
|------|------|----------------|------------|-----|
| 🫙 **La Cloche à Vide** | I | Arène circulaire. P1 : cloches qui tombent (ombres). P2 : **aspiration** vers le centre (piques au centre !). P3 : les deux + tempo. | Breloque « Vide d'air » (dash en zone de vent) | V1 |
| 👁️ **Le Grand Objectif** | II | Lentille géante. P1 : lasers rotatifs (pré-faisceaux). P2 : **miroir** (contrôles inversés par intermittence, annoncés !). P3 : flash aveuglant + plateformes tempo. | Accès Acte III + « Mise au point » (traînée) | V1 |
| 🗄️ **L'Archiviste** | III | Bureau. P1 : tampons géants (zones). P2 : classeurs qui claquent (murs mobiles). P3 : paperasse (projectiles lents) + le tout. Running gag : il verbalise vos esquives. | Formulaire B-12 (clé A4) | V2 |
| 📊 **L'Index** | IV | Salle-fiche. Barre de vie en **étoiles** ⭐. Attaques : « 1 étoile » (pluie de piques), « Signalement » (Correcteurs), « Page introuvable » (trous 404). P4 : il **vous note en direct** (la note baisse si vous mourez — finir à 5⭐ = succès « Favori »). | Accès Acte V | V2/V3 |
| 🕳️ **Le Déclassement** | V | Pas d'arène : **fuite finale** multi-salles (toutes mécaniques revisitées) + phase arène dans le vide (plateformes qui s'effacent). | Choix final (fins) | V3 |
| 0️⃣ **N°000 « le Premier »** | Secret | **5 phases** : best-of de tous les boss + phase finale « 60 secondes » (DPS… non : finir la phase avant que la salle s'efface !). Le combat le plus dur du jeu. | Vraie fin (D) + 👑 Couronne du Fonds | V3 |

---

## 5. Systèmes hardcore 💀

### 5.1 Lames X (NG+, V1 partiel → complet)
- Après l'Acte II (V1) : versions **X** des salles des biomes 1–2 (puis tous biomes) : pièges resserrés, élites, checkpoints réduits.
- Classements X séparés ; médailles X ; succès « Opticien » (finir un biome entier en X).

### 5.2 Chaleur du labo (V2 — 15 Protocoles cumulables, style Hadès)
Chaque protocole ajoute de la « chaleur » ; score total = niveau de défi ; **classements par chaleur**.

| # | Protocole | Effet | Chaleur |
|---|-----------|-------|---------|
| P1 | Piques polies | Scies/boulets +30 % vitesse | +1 |
| P2 | Semelles de plomb | Saut −10 % | +2 |
| P3 | Fourmis dans les jambes | Glissade permanente légère | +1 |
| P4 | Élites de service | Tous ennemis en élites | +2 |
| P5 | Mi-temps | Tempo −15 % (tout bat plus vite !) | +2 |
| P6 | Régime sec | Pas de Cœur de rechange (breloque désactivée) | +1 |
| P7 | Hausse des prix | Lucioles /2 (économie du style !) | +1 |
| P8 | Visite guidée | Checkpoints de mi-salle supprimés | +2 |
| P9 | Courant d'air | Bourrasques aléatoires (seedées !) | +2 |
| P10 | Obscurité partielle | Halo −30 % | +1 |
| P11 | Grève du dash | Dash −20 % portée | +2 |
| P12 | Correcteurs | 1 Correcteur junior par salle longue | +2 |
| P13 | Auditeurs | Le Conservateur commente TOUT (déconcentration maximale 😅) | +1 |
| P14 | Porcelaine partielle | 2 coups max par salle (cœur fragile qui se recharge) | +3 |
| P15 | Grand ménage | Salles +1 niveau de notation (recâblage hard) | +3 |

### 5.3 Fioles maudites (V2, 6 — runs « 💀 Maudit », classements séparés)
Porcelaine (1-hit), Sablier (timer global serré par biome), Amnésie (checkpoints invisibles — on ne sait où on respawn !), Poids (dash −50 %), Silence (aucun SFX d'alerte — les télégraphes sonores disparaissent !), Miroir total (monde + contrôles inversés).

### 5.4 Salles dorées (V1 : 8)
Salles optionnelles ultra-précises (notation 10), 1 checkpoint, signalées par une porte dorée. Récompense : fragments + cosmétique prestige (**traînée « Or du Fonds »**). Les speedrunners en raffolent (TT dédiés).

### 5.5 Les Profondeurs (V2) — mode infini
Descente procédurale infinie, difficulté croissante, 1 checkpoint / 5 salles, score = profondeur + style. **Classement de profondeur** (local V2, mondial si en ligne). La carotte infinie des hardcore. 🕳️

### 5.6 Défis d'ascèse (succès + filtres de classement)
Sans-dash, sans-breloque (déjà V1), sans-mort (Deathless), sans-pogo (« Plat comme une lame »), 100 % mort-né… pardon : « 100 % » (tout finir + tout trouver).

---

## 6. Courbe de difficulté (campagne)

| Acte | Grossissement moyen des salles | Nouveautés | Checkpoints | Boss |
|------|-------------------------------|------------|-------------|------|
| I | 2 → 4 | 1 mécanique / salle, zéro combo | Généreux (mi-salle) | Cloche (tuto+) |
| II | 4 → 6 | Combos de 2 mécaniques, 1ʳᵉs élites | Standard | Objectif (vrai test) |
| III | 5 → 7 | Combos de 3, fuites, obscurité | Standard strict | Archiviste |
| IV | 6 → 8 | Méta, 404, gravité locale | Stricts | Index |
| V | 7 → 9 | Best-of, combos de 4, fuite finale | Stricts + arènes | Déclassement + N°000 (10) |
| X / Microscope | +2 partout | Élites, tempo resserré | Réduits | +1 phase (V2+) |

---

## 7. Équité & assist 🛟

- **Checkpoints** : début de salle toujours ; mi-salle selon mode ; arènes de boss à l'entrée.
- **Télégraphie** : visuelle (ombres, pré-faisceaux, frémissements) + sonore (bips, grincements) + délai (≥ 0,5 s, ≥ 0,4 s en Expert, jamais moins).
- **Options d'assist** (menu, combinables) : ralenti 90/75/50 %, invincibilité, dash infini, skip de salle (1/heure ? non : illimité, mais runs marquées). → Runs marquées **« assistées »** (exclues des classements Purs, visibles dans « Assisté », succès « Malin » si finie avec assist : *pas de honte, que du fun*).
- **Jamais de punition** : pas de perte de progression à la mort, pas de timer punitif en Détente, pas de contenu bloqué par le skill sauf cosmétiques prestige (affichés comme tels).

---

## 8. Intégration speedrun 🏁

- Catégories hard : Lames X Any%, Chaleur 10+/20+/max, Profondeurs (score), TT boss, Deathless, Low% (sans breloque), « Porcelaine » (1-hit, fous uniquement).
- Splits : par acte + par boss + salles dorées ; fantômes X séparés.
- Export LiveSplit avec toutes les catégories ; soumission speedrun.com (V2+).

---

*Équilibrage : chaque salle testée par le solveur (faisabilité) + notation auto (densité × tempo × combos) + validation humaine sur échantillon par niveau.*
