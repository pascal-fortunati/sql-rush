# SQL Rush DWWM

**Entraînement SQL en français pour préparer l'examen DWWM.**

SQL Rush est une application web d'entraînement au SQL : lire une consigne, observer les tables, écrire une requête, l'exécuter réellement et comprendre pourquoi elle est juste ou fausse. Elle a été conçue pour retrouver les automatismes avant l'épreuve et pour s'entraîner à écrire une requête devant un jury.

**264 exercices exécutables, 8 niveaux, 12 jeux de données, 66 fiches aide-mémoire.**

Application Express/EJS classique, sans SPA. Les requêtes sont réellement exécutées dans SQLite et les résultats apparaissent sans recharger la page.

```text
Version vérifiée avant publication :
- 264/264 exercices validés
- 69 tests Node réussis
- 9 scénarios Playwright réussis
- aucun problème détecté par les audits axe automatisés réalisés
```

---

## Installation locale

Prérequis : **Node.js LTS** (24 recommandé, 22.13 minimum), npm et un navigateur récent.

```bash
git clone <URL_GITHUB>
cd sql-rush-dwwm
npm install
npm run setup
npm run dev
```

Puis ouvrir :

```text
http://localhost:3000
```

Il suffit ensuite de cliquer sur **Créer mon compte**. Aucun compte ni mot de passe de démonstration n'est préinstallé.

### Ce que fait `npm run setup`

1. Crée `.env` si nécessaire, avec un secret de session aléatoire.
2. Crée `data/app.db`, ses tables et les métadonnées des exercices et des badges.
3. Copie en local les composants FlyonUI, Monaco Editor, les polices et les icônes, puis compile Tailwind CSS.
4. Exécute les 264 solutions dans le moteur isolé de l'application, pour vérifier la banque.

La commande est réexécutable et conserve les comptes et la progression. `npm run dev` surveille le serveur et le CSS ; `Ctrl+C` arrête les deux. Après l'installation, aucun CDN n'est nécessaire : polices, icônes et composants sont servis localement.

> **Dépendances natives** — `better-sqlite3` et `bcrypt` utilisent des binaires natifs, dont les scripts d'installation sont explicitement autorisés dans `package.json`. Sur une plateforme sans binaire précompilé, les outils de compilation Node (`node-gyp`, Python, compilateur C++) sont nécessaires.

---

## Fonctionnalités

### Comptes et progression

- Inscription et connexion avec mots de passe hachés (`bcrypt`) et sessions serveur.
- **XP**, niveau global, **séries** (série en cours et record) et **badges** à débloquer.
- Tableau de bord : progression générale et par catégorie, exercices réussis, taux de réussite, dernières tentatives.

### Atelier SQL

- Catalogue des 264 exercices avec **recherche et filtres** (niveau, état de progression), pagination et question aléatoire.
- Filtres construits avec le composant **FlyonUI Advanced Select** (listes déroulantes avec recherche intégrée).
- Consigne, notion, difficulté, contexte, tables et onglets FlyonUI **Données / Structure**.
- Éditeur **Monaco** en mode SQL (coloration des mots-clés, chaînes, nombres et commentaires), thèmes clair/sombre synchronisés avec le site, brouillon local par utilisateur et par exercice.
- Résultats tabulaires : NULL explicites, temps d'exécution, nombre de lignes et aperçu de l'état après modification.
- Trois indices progressifs (rappel, piste précise, structure à compléter), puis solution commentée sur demande confirmée.
- Messages d'erreur pédagogiques : colonne ou table inconnue, syntaxe, agrégats, clés et contraintes.

#### Autocomplétion pédagogique

L'autocomplétion aide à **écrire** du SQL, jamais à résoudre la question. Ses seules sources sont les mots-clés et fonctions SQL génériques acceptés par le moteur, les **tables et colonnes du schéma affiché** et les alias tapés par l'étudiant (`FROM hotels h` → `h.` propose les colonnes de `hotels`). Les suggestions sont légèrement contextuelles : tables après `FROM`/`JOIN`, colonnes après `SELECT`, `WHERE`, `ORDER BY`, `GROUP BY`.

Elle n'utilise jamais la solution, les indices, la correction ni la consigne, et ne propose aucune valeur des données (`ville`, oui ; `'Toulon'`, non). Le bac à sable suit la base sélectionnée ; le Mode Examen n'a **aucune** autocomplétion.

#### Raccourcis clavier

| Raccourci | Entraînement, Sprint, Bac à sable |
| --- | --- |
| `Entrée` | Exécuter / valider la requête |
| `Maj+Entrée` | Nouvelle ligne |
| `Tab` | Accepter la suggestion (`Échap` ferme la liste, `Entrée` ne l'accepte jamais) |
| `Ctrl+Espace` | Afficher les suggestions |
| `Ctrl+Entrée` / `Cmd+Entrée` | Exercice suivant après une réussite, sinon exécuter |

Les boutons restent disponibles pour chaque action.

### Mode Examen / Jury

Une question tirée au sort, interface épurée, **aucun indice**, aucun rappel de syntaxe et **aucune autocomplétion** (l'éditeur Monaco ne garde que la coloration). La solution n'est pas envoyée dans la page, et aucun SQL n'est exécuté pendant la saisie : `Entrée` écrit une nouvelle ligne et `Ctrl+Entrée` est désactivé. Le bouton **J'ai terminé** valide une seule fois, affiche le résultat et la correction, puis permet de tirer une autre question.

Un chrono mesure le temps sans imposer de limite, et le bouton **Masquer la base** permet à un collègue de jouer l'examinateur. Les 264 consignes sont utilisables dans ce mode.

### Sprint SQL (multi-tentatives)

`/sprint` propose **5, 10 ou 20 questions** distinctes, sur une difficulté ou sur toutes, sans indice.

Le sprint est **multi-tentatives** : une réponse fausse ne fait pas passer à la question suivante. La question reste ouverte tant qu'elle n'est pas résolue, ce qui permet de corriger sa requête et de relancer autant de fois que nécessaire. Il est aussi possible de **passer une question** pour continuer le sprint.

Le bilan distingue donc trois chiffres :

| Indicateur | Signification |
| --- | --- |
| **du premier coup** | questions justes dès la première tentative |
| **résolues** | questions finalement réussies, quel que soit le nombre d'essais |
| **tentatives** | nombre total d'essais sur l'ensemble du sprint |

Chaque question du bilan est étiquetée *Du premier coup*, *Résolue*, *À revoir* ou *Passée*, avec la correction et les notions à retravailler. Recharger la page reprend la question courante ; recharger le bilan ne relance pas de sprint.

### Mes erreurs

La page `/review` regroupe le taux de réussite par catégorie et les 30 dernières tentatives incorrectes, erreurs SQL comprises, avec un statut « Réussi depuis » lorsque l'exercice a été repris avec succès. Un entraînement ciblé tire des exercices pondérés par les catégories les plus ratées, avec un poids supplémentaire pour les exercices échoués et jamais réussis.

### Classement

Classement de la promotion affiché avec **FlyonUI DataTables** : recherche par pseudo, tri par colonne, pagination et choix du nombre de lignes. Seuls le pseudo, le niveau, l'XP, les exercices réussis et la meilleure série sont exposés — jamais d'email ni de hash.

### Bac à sable et aide-mémoire

- `/playground` : les douze jeux de données, sans score. Une instruction par exécution, chaque requête repartant des données initiales.
- `/cheatsheet` : **66 fiches aide-mémoire** organisées en accordéons FlyonUI sur les huit niveaux, avec rappels, exemples exécutables et liens vers la pratique. L'aide est absente de l'interface d'examen.

### Interface

Thèmes **clair / sombre** avec le `theme-controller` FlyonUI et mémorisation du choix, interface **responsive** du mobile au grand écran, icônes **Material Symbols Rounded**, navigation au clavier et libellés accessibles.

---

## Banque pédagogique

| Niveau | Contenu | Exercices |
| --- | --- | ---: |
| 1 | SELECT, FROM, colonnes, AS, DISTINCT, expressions | 24 |
| 2 | WHERE, comparaisons, AND/OR/NOT, BETWEEN, IN, LIKE, NULL | 56 |
| 3 | ORDER BY, ASC/DESC, LIMIT, OFFSET, tris combinés | 28 |
| 4 | COUNT, SUM, AVG, MIN/MAX, GROUP BY, HAVING | 36 |
| 5 | Clés, INNER/LEFT JOIN, relations 1-N, jointures multiples | 32 |
| 6 | INSERT, UPDATE, DELETE ciblés | 24 |
| 7 | CREATE, contraintes, clés, ALTER, DROP | 32 |
| 8 | Sous-requêtes, IN, EXISTS, agrégations avec jointures | 32 |
| **Total** | **66 situations pédagogiques, quatre contextes chacune** | **264** |

Les 12 contextes : cinéma, jeux vidéo, bibliothèque, e-commerce, restaurants, voyages, école, entreprise, refuge animalier, musique, automobile, hôtels.

Les jeux de données sont pédagogiques : données fictives, doublons utiles, valeurs NULL, parents sans enfant et lignes sans activité. Les tables portent des noms métier propres à chaque contexte et partagent un modèle relationnel simple (table principale, groupe parent, activités), ce qui permet de retravailler une même notion dans plusieurs domaines.

---

## Stack

- **Node.js** et **Express 5**
- **EJS** et **JavaScript** vanilla (pas de framework front)
- **Tailwind CSS 4**
- **FlyonUI 2**, dont **FlyonUI Advanced Select** et **FlyonUI DataTables**
- **Monaco Editor** (build local, chargé uniquement sur les pages d'exercice)
- **SQLite** via **better-sqlite3**
- **bcrypt** pour les mots de passe
- **express-session** avec stockage SQLite
- **Material Symbols Rounded**, Manrope et JetBrains Mono, servis localement
- Helmet, jetons CSRF et limitation des tentatives d'authentification et d'exécution

```text
src/
  app.js                     Routes HTTP et orchestration des parcours
  server.js                  Démarrage et arrêt du serveur
  config/database.js         Schéma application et stockage des sessions
  content/
    datasets.js              12 jeux de données
    exercises.js             66 modèles éditoriaux -> 264 exercices + aide-mémoire
    custom-exercises.js      Questions supplémentaires indépendantes
  services/
    sql-policy.js            Analyse lexicale et politique SQL
    sql-runner.js            Processus isolés, délais et limite de concurrence
    validation.js            Comparaison des résultats et des schémas
    progress.js              Tentatives, XP, séries, badges et statistiques
  workers/sql-process.js     SQLite uniquement, sans accès à la base application
  views/                     Pages EJS et partials réutilisables
  styles/app.css             Tailwind, FlyonUI, thèmes et disposition
public/
  js/                        Thème, exécution SQL, résultats accessibles
  css/ vendor/               CSS compilé et composants copiés (générés)
scripts/                     Setup, assets, validation de la banque
data/app.db                  Comptes, progression et sessions (non versionné)
```

---

## Moteur SQL sécurisé

Le SQL écrit par l'étudiant **n'est jamais exécuté sur `data/app.db`**. La base application, séparée, ne reçoit que des requêtes écrites par l'application avec des paramètres liés.

Pour chaque tentative :

1. Validation de la taille de la requête et analyse lexicale (une seule instruction, commandes autorisées uniquement).
2. Lancement d'un **processus enfant isolé**, avec un environnement minimal et sans secret de session.
3. Création d'une base SQLite **`:memory:`**, application du schéma et du jeu de données de confiance.
4. Exécution de la requête de l'étudiant, puis de la solution dans une seconde base `:memory:` identique.
5. **Comparaison intelligente** des deux résultats, puis fermeture des bases et du processus.

Un **timeout** de 1 500 ms interrompt le processus (`SIGKILL`), y compris pendant une boucle native SQLite. La politique SQL interdit ATTACH, PRAGMA, VACUUM, les extensions, les triggers et les fonctions inconnues ; les résultats sont bornés (500 lignes, 40 colonnes) et la concurrence est limitée.

### SQL valide n'est pas forcément la bonne réponse

Les textes SQL ne sont jamais comparés entre eux : c'est le **résultat** qui est évalué. Une requête peut donc s'exécuter parfaitement et être comptée comme fausse si elle ne répond pas à la consigne.

La comparaison porte sur :

- le nombre de colonnes et leur position, telles que demandées dans l'énoncé ;
- les valeurs, les types, les NULL et les **multiplicités** (deux lignes identiques comptent deux fois) ;
- l'ordre, uniquement lorsque la consigne l'impose (ORDER BY) ;
- les alias, uniquement lorsqu'un alias est explicitement demandé ;
- l'origine réelle des colonnes, pour refuser une mauvaise colonne même sur un résultat vide ;
- pour INSERT/UPDATE/DELETE, l'état final de **toutes** les tables, afin de détecter les modifications collatérales ;
- pour CREATE/ALTER/DROP, les colonnes, types, PK, NOT NULL, valeurs par défaut, UNIQUE, clés étrangères et CHECK.

Une sous-requête, un alias de table ou un filtre équivalent sont donc acceptés. La comparaison s'effectue sur le jeu de données fourni : elle ne prouve pas l'équivalence mathématique pour toutes les bases possibles. Le classement est un outil de motivation, pas une certification surveillée.

---

## XP, séries et scores

- Première réussite : **10 XP** (facile), **20 XP** (normale), **35 XP** (difficile).
- Chaque indice retire 2 XP, avec un minimum de 1 XP.
- Première réussite en mode Examen : bonus de 5 XP.
- Solution consultée avant la première réussite : progression enregistrée, **0 XP**.
- Refaire un exercice déjà réussi : **0 XP**, sans gonfler la série.
- Une tentative incorrecte remet la série à zéro ; chaque nouvelle réussite distincte l'augmente.
- Niveau global : `1 + floor(XP / 150)`, indépendant des huit niveaux pédagogiques.

Les mises à jour sont transactionnelles, la progression est unique par couple utilisateur/exercice, et le client ne choisit ni l'XP ni le nombre d'indices réellement enregistrés. Les questions d'examen et de sprint sont attribuées côté serveur.

---

## Commandes

| Commande | Effet |
| --- | --- |
| `npm install` | Installe les dépendances verrouillées par `package-lock.json` |
| `npm run setup` | Secret local, base, assets, build CSS et contrôle de la banque |
| `npm run dev` | Serveur et CSS avec surveillance |
| `npm start` | Serveur sans surveillance, après `setup` |
| `npm run build` | Assets locaux et CSS minifié |
| `npm run validate` | Exécute les 264 solutions dans les processus isolés |
| `npm test` | Tests Node : moteur SQL, validation, sécurité, comptes, sessions, parcours HTTP |
| `npm run test:browser` | Parcours Playwright et audit automatisé axe |

Les tests utilisent une base **en mémoire**, indépendante de `data/app.db`, et ne créent aucun compte de démonstration.

---

## Déploiement

Le projet sera hébergé sur mon Proxmox, avec le domaine :

```text
https://rush.makoserv.fr
```

Principes prévus :

- conteneur **LXC Linux** sur Proxmox, avec **Node.js LTS** installé ;
- déploiement du code, puis `npm install` et `npm run setup` ;
- configuration d'un fichier **`.env`** de production (voir `.env.example`) ;
- démarrage par `npm start`, encadré par un **service systemd** (redémarrage automatique, logs journald) ;
- **reverse proxy HTTPS** devant l'application (Nginx ou Caddy, certificat Let's Encrypt) ;
- `COOKIE_SECURE=true` pour que le cookie de session ne circule qu'en HTTPS ;
- `TRUST_PROXY=1` pour un unique proxy de confiance devant Node ;
- conserver **`data/app.db` sur un stockage persistant** et sauvegardé : c'est là que vivent les comptes et la progression.

Exemple de `.env` de production :

```dotenv
PORT=3000
HOST=0.0.0.0
NODE_ENV=production
SESSION_SECRET=REMPLACER_PAR_UN_SECRET_ALEATOIRE_DE_32_CARACTERES_MINIMUM
COOKIE_SECURE=true
TRUST_PROXY=1
```

Ne jamais publier la valeur réelle de `SESSION_SECRET`. Cette version est prévue pour **une seule instance Node** avec SQLite ; il n'y a pas de mode distribué. Sauvegarder `data/app.db` serveur arrêté, ou via l'API de sauvegarde SQLite — ne pas copier le seul fichier `app.db` pendant des écritures WAL.

---

## Limites de cette version

Pas d'email transactionnel, de récupération de mot de passe, de connexion sociale ni d'espace administrateur. Le SQL est celui de SQLite : certaines syntaxes MySQL/PostgreSQL ne sont pas prises en charge. Le bac à sable est réinitialisé à chaque instruction. Le mode Examen simule un oral mais ne surveille pas les autres onglets du navigateur. L'isolation est au niveau processus et politique SQL, pas au niveau conteneur ou système : un déploiement public exposé à des attaquants déterminés mériterait une isolation OS supplémentaire. Enfin, un audit axe automatisé ne remplace pas une vérification manuelle complète au lecteur d'écran.

---

## Références

- [SQLBolt](https://sqlbolt.com/lesson) — inspiration du cycle consigne / données / SQL / résultat ; identité visuelle originale.
- [FlyonUI](https://flyonui.com/docs/getting-started/quick-start/) — [composants](https://flyonui.com/docs/component/), [thèmes](https://flyonui.com/docs/customization/themes/).
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md)
- [SQLite : PRAGMA et limites](https://www.sqlite.org/pragma.html) — [Node : arrêt des processus enfants](https://nodejs.org/api/child_process.html#subprocesskillsignal)
