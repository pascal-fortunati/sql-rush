<p align="center">
  <img src="./docs/sqlrush-logo.svg" alt="SQLRush" width="430">
</p>

<p align="center">
  <strong>Entraînement SQL en français pour préparer l'examen DWWM.</strong><br>
  Écris, exécute, corrige, recommence — jusqu'à ce que les requêtes deviennent des automatismes.
</p>

<p align="center">
  <a href="https://rush.makoserv.fr"><strong>🚀 Ouvrir SQL Rush</strong></a>
  ·
  <a href="#installation-locale">Installation</a>
  ·
  <a href="#fonctionnalités">Fonctionnalités</a>
  ·
  <a href="#déploiement">Déploiement</a>
</p>

---

## SQL Rush, c'est quoi ?

**SQL Rush** est une application web d'entraînement au SQL conçue pour des étudiants **DWWM**.

Le principe est simple : lire une consigne, observer les tables disponibles, écrire une requête, l'exécuter réellement puis comprendre pourquoi elle est correcte — ou pourquoi elle ne l'est pas encore.

L'objectif n'est pas seulement de connaître la syntaxe, mais de retrouver les automatismes nécessaires lorsqu'un jury demande :

> « Écris-moi la requête qui permet de… »

| Contenu | Disponible |
| --- | ---: |
| Exercices exécutables | **264** |
| Niveaux pédagogiques | **8** |
| Jeux de données | **12** |
| Fiches aide-mémoire | **66** |
| Mode Examen / Jury | ✅ |
| Sprint SQL | ✅ |
| Progression, XP, séries et badges | ✅ |

### Démo en ligne

👉 **https://rush.makoserv.fr**

Aucun compte de démonstration n'est nécessaire : chaque utilisateur peut créer son propre compte.

---

## Fonctionnalités

### Atelier SQL

Le cœur de SQL Rush est un catalogue de **264 exercices** avec :

- recherche par notion ou contexte ;
- filtres par niveau et progression avec **FlyonUI Advanced Select** ;
- pagination et question aléatoire ;
- tables disponibles avec vues **Données / Structure** ;
- résultats SQL réels sans rechargement de page ;
- trois indices progressifs ;
- correction et explication sur demande ;
- progression, XP, séries et badges.

Une requête qui s'exécute sans erreur n'est **pas automatiquement considérée comme correcte** : le résultat obtenu est comparé au résultat attendu.

### Monaco Editor + autocomplétion pédagogique

L'éditeur SQL repose sur **Monaco Editor** avec coloration syntaxique et thèmes clair/sombre.

L'autocomplétion est volontairement limitée à ce qui aide à **écrire** la requête sans donner la solution :

- mots-clés SQL (`SELECT`, `FROM`, `WHERE`, `ORDER BY`, etc.) ;
- fonctions SQL autorisées ;
- tables de la base courante ;
- colonnes du schéma courant ;
- alias écrits par l'utilisateur (`FROM hotels h` → `h.` propose les colonnes de `hotels`).

Elle n'utilise jamais :

- la solution ;
- la correction ;
- les indices ;
- le texte de la consigne ;
- les valeurs métier présentes dans les lignes.

Ainsi, `ville` peut être proposé comme colonne, mais `'Toulon'` ne sera pas suggéré automatiquement.

#### Raccourcis

| Raccourci | Action |
| --- | --- |
| `Entrée` | Exécuter / valider la requête |
| `Maj + Entrée` | Nouvelle ligne |
| `Tab` | Accepter une suggestion |
| `Ctrl + Espace` | Ouvrir les suggestions |
| `Ctrl + Entrée` / `Cmd + Entrée` | Exercice suivant après réussite, sinon exécuter |

Les boutons restent disponibles pour toutes les actions.

### Mode Examen / Jury

Le Mode Examen reproduit une question SQL au tableau :

- question tirée au sort ;
- aucune aide syntaxique ;
- aucun indice ;
- aucune autocomplétion ;
- Monaco conserve uniquement le confort d'édition et la coloration ;
- aucun SQL n'est exécuté pendant la saisie ;
- validation uniquement avec **J'ai terminé** ;
- chrono sans limite imposée ;
- possibilité de masquer la base pour qu'un collègue joue le rôle du jury.

Les **264 consignes** peuvent être utilisées dans ce mode.

### Sprint SQL

Un Sprint contient **5, 10 ou 20 questions**.

Une mauvaise réponse ne fait pas passer automatiquement à la suivante : l'étudiant peut corriger sa requête et réessayer jusqu'à la résoudre, ou choisir de passer la question.

Le bilan distingue :

| Indicateur | Signification |
| --- | --- |
| **Du premier coup** | questions réussies dès la première tentative |
| **Résolues** | questions finalement trouvées |
| **Tentatives** | nombre total d'essais |

Les notions qui ont posé problème sont mises en évidence à la fin du Sprint.

### Mes erreurs

La page de révision regroupe :

- taux de réussite par catégorie ;
- dernières tentatives incorrectes ;
- erreurs SQL ;
- exercices réussis depuis une ancienne erreur ;
- entraînement ciblé sur les notions les plus faibles.

### Classement

Le classement utilise **FlyonUI DataTables** avec :

- recherche par pseudo ;
- tri ;
- pagination ;
- choix du nombre de lignes.

Seuls les éléments utiles au jeu sont visibles : pseudo, niveau, XP, exercices réussis et meilleure série.

### Bac à sable

Le Playground permet de tester librement du SQL sur les **12 jeux de données**, sans score.

Chaque exécution repart volontairement des données initiales.

### Aide-mémoire

La page `/cheatsheet` propose **66 fiches** réparties sur les huit niveaux :

- rappel très court ;
- syntaxe ;
- exemple ;
- lien direct vers un exercice associé.

---

## Banque pédagogique

| Niveau | Notions principales | Exercices |
| --- | --- | ---: |
| **1** | SELECT, FROM, colonnes, AS, DISTINCT, expressions | 24 |
| **2** | WHERE, comparaisons, AND/OR/NOT, BETWEEN, IN, LIKE, NULL | 56 |
| **3** | ORDER BY, ASC/DESC, LIMIT, OFFSET, tris combinés | 28 |
| **4** | COUNT, SUM, AVG, MIN/MAX, GROUP BY, HAVING | 36 |
| **5** | Clés, INNER/LEFT JOIN, relations 1-N, jointures multiples | 32 |
| **6** | INSERT, UPDATE, DELETE ciblés | 24 |
| **7** | CREATE, contraintes, clés, ALTER, DROP | 32 |
| **8** | Sous-requêtes, IN, EXISTS, agrégations avec jointures | 32 |
|  | **Total** | **264** |

Les 12 contextes utilisés sont : **cinéma, jeux vidéo, bibliothèque, e-commerce, restaurants, voyages, école, entreprise, refuge animalier, musique, automobile et hôtels**.

Les données sont fictives et volontairement pédagogiques : doublons, valeurs `NULL`, relations sans enfant, lignes sans activité et cas utiles aux jointures et agrégations.

---

## Stack

### Backend

- **Node.js**
- **Express 5**
- **EJS**
- JavaScript vanilla
- **SQLite** avec `better-sqlite3`
- `bcrypt`
- `express-session`
- Helmet, protection CSRF et limitations d'exécution

### Frontend

- **Tailwind CSS 4**
- **FlyonUI 2**
- FlyonUI Advanced Select
- FlyonUI DataTables
- **Monaco Editor**
- Material Symbols Rounded
- Manrope
- JetBrains Mono

Les polices, icônes et composants frontend sont servis localement : aucun CDN n'est nécessaire après l'installation.

---

## Installation locale

### Prérequis

- **Node.js LTS** — Node 24 recommandé, Node 22.13 minimum
- npm
- un navigateur récent

```bash
git clone https://github.com/pascal-fortunati/sql-rush.git
cd sql-rush

npm install
npm run setup
npm run dev
```

Puis ouvrir :

```text
http://localhost:3000
```

`npm run setup` :

1. crée `.env` si nécessaire avec un secret de session local ;
2. initialise `data/app.db` ;
3. prépare les métadonnées, badges et progression ;
4. copie FlyonUI, Monaco Editor, les polices et les icônes ;
5. compile Tailwind CSS ;
6. valide les **264 exercices** dans le moteur SQL isolé.

La commande peut être relancée sans supprimer les comptes ou la progression existants.

> `better-sqlite3` et `bcrypt` utilisent des modules natifs. Sur une plateforme sans binaire précompilé compatible, les outils de compilation Node peuvent être nécessaires.

---

## Configuration

Exemple de `.env` pour une instance derrière un reverse proxy HTTPS :

```dotenv
PORT=3000
HOST=0.0.0.0
NODE_ENV=production

SESSION_SECRET=REMPLACER_PAR_UN_SECRET_LONG_ET_ALEATOIRE

COOKIE_SECURE=true
TRUST_PROXY=1
```

Ne jamais versionner le vrai `SESSION_SECRET`.

---

## Moteur SQL et validation

### Le SQL étudiant n'accède jamais à la base de l'application

`data/app.db` contient les comptes, les sessions et la progression.

Les requêtes écrites par les étudiants ne sont **jamais exécutées** sur cette base.

Pour chaque tentative :

1. la requête est analysée et soumise à la politique SQL ;
2. un processus enfant est démarré avec un environnement minimal ;
3. une base SQLite `:memory:` reçoit le schéma et les données de l'exercice ;
4. la requête de l'étudiant y est exécutée ;
5. la solution de référence est exécutée dans une seconde base identique ;
6. les résultats ou états finaux sont comparés ;
7. les bases temporaires et le processus sont détruits.

Le moteur applique notamment :

- une seule instruction par exécution ;
- timeout de **1 500 ms** ;
- limites sur le nombre de lignes et colonnes ;
- concurrence limitée ;
- interdiction de commandes telles que `ATTACH`, `DETACH`, `PRAGMA`, `VACUUM`, extensions et triggers ;
- liste contrôlée des fonctions SQL.

### Trois résultats possibles

Une tentative peut être :

1. **Erreur SQL** — la requête n'est pas exécutable ;
2. **SQL valide mais réponse incorrecte** — la requête fonctionne, mais ne répond pas à la consigne ;
3. **Réponse correcte** — le résultat ou l'état final correspond à ce qui était demandé.

Pour les `SELECT`, le validateur prend notamment en compte :

- colonnes et positions ;
- valeurs et types ;
- `NULL` ;
- multiplicités ;
- ordre lorsqu'il est demandé ;
- alias lorsqu'ils sont explicitement requis.

Pour `INSERT`, `UPDATE` et `DELETE`, l'état final des tables est comparé.

Pour `CREATE`, `ALTER` et `DROP`, le schéma final est contrôlé.

Deux requêtes écrites différemment peuvent donc être acceptées si elles produisent le résultat attendu.

---

## XP, séries et progression

- **Facile** : 10 XP
- **Normal** : 20 XP
- **Difficile** : 35 XP
- chaque indice retire 2 XP, avec un minimum de 1 XP ;
- une solution consultée avant la première réussite donne 0 XP ;
- refaire un exercice déjà réussi ne rapporte pas de nouvel XP ;
- une mauvaise tentative remet la série à zéro ;
- une nouvelle réussite distincte augmente la série.

Le niveau global suit :

```text
1 + floor(XP / 150)
```

Il est indépendant des huit niveaux pédagogiques.

---

## Déploiement

SQL Rush est actuellement déployé publiquement sur :

### 👉 https://rush.makoserv.fr

L'instance de production tourne dans un **conteneur LXC sous Proxmox**, avec :

- Node.js LTS ;
- service **systemd** ;
- reverse proxy HTTPS ;
- `COOKIE_SECURE=true` ;
- `TRUST_PROXY=1` ;
- stockage persistant pour `data/app.db`.

Pour une installation de production classique :

```bash
git clone https://github.com/pascal-fortunati/sql-rush.git
cd sql-rush

npm install
npm run setup
npm start
```

`data/app.db` doit être conservée sur un stockage persistant et sauvegardée régulièrement.

Lors d'une mise à jour :

```bash
git pull --ff-only
npm install
npm run build
sudo systemctl restart sql-rush
```

Pour les évolutions qui modifient l'initialisation ou le contenu pédagogique, utiliser `npm run setup` à la place de `npm run build`.

---

## Structure du projet

```text
src/
├── app.js
├── server.js
├── config/
├── content/
│   ├── datasets.js
│   ├── exercises.js
│   └── custom-exercises.js
├── services/
│   ├── sql-policy.js
│   ├── sql-runner.js
│   ├── validation.js
│   └── progress.js
├── workers/
│   └── sql-process.js
├── views/
└── styles/

public/
└── js/

scripts/
├── setup.js
├── assets.js
└── validate-exercises.js

data/
└── app.db          # non versionné
```

`public/css/` et `public/vendor/` sont générés localement pendant le build.

---

## Commandes utiles

| Commande | Description |
| --- | --- |
| `npm install` | Installe les dépendances |
| `npm run setup` | Initialise la base, génère les assets et valide la banque |
| `npm run dev` | Lance le serveur et le CSS en mode développement |
| `npm start` | Lance l'application en production |
| `npm run build` | Génère les assets frontend |
| `npm run validate` | Vérifie les 264 exercices |

---

## Qualité vérifiée

Avant publication, cette version a été contrôlée localement avec :

- **264/264 exercices validés** ;
- **69 tests Node réussis** ;
- **9 scénarios Playwright réussis** ;
- aucune violation détectée par les audits **axe** automatisés réalisés sur les parcours contrôlés ;
- vérifications responsive sur mobile, tablette et desktop.

Les suites de tests de développement ne sont pas distribuées dans le dépôt public.

> Les contrôles automatisés d'accessibilité complètent, mais ne remplacent pas un audit manuel avec des technologies d'assistance.

---

## Limites de cette version

SQL Rush est avant tout une plateforme pédagogique destinée à l'entraînement SQL.

- Pas encore d'e-mail transactionnel, de récupération de mot de passe, de connexion sociale ou d'espace d'administration dédié.
- Les exercices utilisent **SQLite** : certaines syntaxes propres à MySQL ou PostgreSQL ne sont pas disponibles.
- Le bac à sable repart volontairement de ses données initiales à chaque exécution.
- Le Mode Examen reproduit les conditions d'une question SQL au tableau, mais ne constitue pas un environnement d'examen surveillé.
- L'exécution SQL est séparée de la base applicative et protégée par des bases temporaires, une politique SQL restrictive, des processus dédiés, des limites de ressources et des délais d'exécution. Cette isolation est adaptée à l'usage pédagogique prévu, sans prétendre remplacer une sandbox système dédiée à des environnements fortement hostiles ou multi-tenant.
- Les contrôles d'accessibilité automatisés ne remplacent pas une vérification humaine complète.

---

## Références

- [SQLBolt](https://sqlbolt.com/lesson) — inspiration du cycle consigne → données → SQL → résultat.
- [FlyonUI](https://flyonui.com/docs/getting-started/quick-start/) — composants et thèmes.
- [FlyonUI Advanced Select](https://flyonui.com/docs/advanced-forms/advanced-select/)
- [FlyonUI DataTables](https://flyonui.com/docs/third-party-plugins/datatables/)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- [SQLite](https://www.sqlite.org/)
- [Node.js](https://nodejs.org/)

---

<p align="center">
  <strong>SQL Rush</strong><br>
  Moins de stress. Plus de pratique.
</p>
