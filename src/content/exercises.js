import { datasets } from './datasets.js';
import { customExercises } from './custom-exercises.js';

export const levels = [
  ['Fondamentaux', 'SELECT · FROM · DISTINCT', 'database'],
  ['Filtrer les données', 'WHERE · AND · NULL', 'filter_alt'],
  ['Trier et limiter', 'ORDER BY · LIMIT · OFFSET', 'sort'],
  ['Fonctions et agrégations', 'COUNT · GROUP BY · HAVING', 'functions'],
  ['Relations et jointures', 'INNER JOIN · LEFT JOIN', 'join_inner'],
  ['Manipuler les données', 'INSERT · UPDATE · DELETE', 'edit_square'],
  ['Construire la structure', 'CREATE · ALTER · Contraintes', 'account_tree'],
  ['Requêtes avancées', 'Sous-requêtes · EXISTS · Synthèse', 'neurology']
].map(([name, concepts, icon], i) => ({ id: i + 1, name, concepts, icon }));

const patterns = [];
function add(level, tag, title, make, tip) { patterns.push({ level, tag, title, make, tip }); }
const q = s => `'${s.replaceAll("'", "''")}'`;

add(1, 'SELECT', 'Premier regard', d => [`Affiche toutes les colonnes de la table ${d.table}.`, `SELECT * FROM ${d.table};`], 'SELECT * sélectionne toutes les colonnes ; FROM indique la table.');
add(1, 'Colonnes', 'Juste l’essentiel', d => [`Affiche uniquement ${d.label} puis ${d.metric} de ${d.table}, dans cet ordre.`, `SELECT ${d.label}, ${d.metric} FROM ${d.table};`], 'Sépare les colonnes par une virgule. Une colonne absente du SELECT ne doit pas apparaître dans le résultat.');
add(1, 'AS', 'Des noms explicites', d => [`Affiche ${d.label} sous l’alias libelle, puis ${d.metric} sous l’alias valeur, depuis ${d.table}.`, `SELECT ${d.label} AS libelle, ${d.metric} AS valeur FROM ${d.table};`, { strictColumns: true }], 'AS change le nom de la colonne affichée, sans modifier la table.');
add(1, 'DISTINCT', 'Sans doublons', d => [`Quelles villes sont présentes dans ${d.table} ? Affiche uniquement ville, une fois par ville.`, `SELECT DISTINCT ville FROM ${d.table};`], 'DISTINCT supprime les doublons du résultat, pas les lignes de la table.');
add(1, 'DISTINCT sur plusieurs colonnes', 'Des couples uniques', d => [`Affiche les couples distincts ville, ${d.parentKey} de ${d.table}. Conserve aussi les valeurs NULL.`, `SELECT DISTINCT ville, ${d.parentKey} FROM ${d.table};`], 'Avec plusieurs colonnes, DISTINCT s’applique à la combinaison de leurs valeurs.');
add(1, 'Expressions', 'Une valeur calculée', d => [`Pour chaque ligne de ${d.table}, affiche ${d.label}, puis ${d.metric} multiplié par 2 sous l’alias double_valeur.`, `SELECT ${d.label}, ${d.metric} * 2 AS double_valeur FROM ${d.table};`, { strictColumns: true }], 'Une expression peut être placée dans SELECT. Utilise AS pour nommer son résultat.');

add(2, 'WHERE', 'Cap sur Toulon', d => [`Affiche ${d.label} et ville de ${d.table} pour les lignes situées à Toulon.`, `SELECT ${d.label}, ville FROM ${d.table} WHERE ville = 'Toulon';`], 'WHERE filtre les lignes. Une chaîne de caractères est entourée de quotes simples.');
add(2, '!=', 'Une ville à exclure', d => [`Affiche ${d.label} des lignes de ${d.table} dont ville est différente de Paris.`, `SELECT ${d.label} FROM ${d.table} WHERE ville != 'Paris';`], '!= ou <> signifie « différent de ».');
add(2, '>', 'Au-dessus du seuil', d => [`Affiche ${d.label} et ${d.metric} de ${d.table} lorsque ${d.metric} dépasse strictement ${d.values[0]} (${d.unit}).`, `SELECT ${d.label}, ${d.metric} FROM ${d.table} WHERE ${d.metric} > ${d.values[0]};`], '> exclut la valeur du seuil.');
add(2, '<=', 'Un plafond à respecter', d => [`Affiche ${d.label} et ${d.metric} de ${d.table} lorsque ${d.metric} vaut au maximum ${d.values[0]} (${d.unit}).`, `SELECT ${d.label}, ${d.metric} FROM ${d.table} WHERE ${d.metric} <= ${d.values[0]};`], '<= inclut la valeur du seuil ; < l’exclurait.');
add(2, 'AND', 'Deux conditions à la fois', d => [`Affiche ${d.label} de ${d.table} : ville doit être Toulon et ${d.metric} doit être supérieur ou égal à ${d.values[2]}.`, `SELECT ${d.label} FROM ${d.table} WHERE ville = 'Toulon' AND ${d.metric} >= ${d.values[2]};`], 'AND impose que les deux conditions soient vraies.');
add(2, 'OR', 'L’un ou l’autre', d => [`Affiche ${d.label} de ${d.table} pour les lignes situées à Lyon ou à Nice.`, `SELECT ${d.label} FROM ${d.table} WHERE ville = 'Lyon' OR ville = 'Nice';`], 'OR retient une ligne dès qu’une des deux conditions est vraie.');
add(2, 'AND / OR', 'Attention aux parenthèses', d => [`Affiche ${d.label} de ${d.table} : ville est Toulon ou Lyon, et dans les deux cas ${d.metric} est strictement inférieur à ${d.values[1]}.`, `SELECT ${d.label} FROM ${d.table} WHERE (ville = 'Toulon' OR ville = 'Lyon') AND ${d.metric} < ${d.values[1]};`], 'AND est prioritaire sur OR. Regroupe les villes entre parenthèses.');
add(2, 'BETWEEN', 'Dans l’intervalle', d => { const bounds = [...d.values].sort((a, b) => a - b); return [`Affiche ${d.label} et ${d.metric} de ${d.table} entre ${bounds[2]} et ${bounds[5]}, bornes comprises.`, `SELECT ${d.label}, ${d.metric} FROM ${d.table} WHERE ${d.metric} BETWEEN ${bounds[2]} AND ${bounds[5]};`]; }, 'BETWEEN inclut les deux bornes.');
add(2, 'IN', 'Une liste de villes', d => [`Affiche ${d.label} de ${d.table} lorsque ville appartient à la liste Toulon, Paris.`, `SELECT ${d.label} FROM ${d.table} WHERE ville IN ('Toulon','Paris');`], 'IN teste l’appartenance à une liste entre parenthèses.');
add(2, 'NOT', 'Ni Paris, ni Lyon', d => [`Affiche ${d.label} de ${d.table} pour les lignes dont ville n’est ni Paris ni Lyon.`, `SELECT ${d.label} FROM ${d.table} WHERE ville NOT IN ('Paris','Lyon');`], 'NOT inverse la condition. NOT IN exclut toutes les valeurs de la liste.');
add(2, 'LIKE', 'Chercher un début de nom', d => [`Affiche ${d.label} de ${d.table} dont ${d.label} commence par « ${d.names[0].slice(0, 2)} ».`, `SELECT ${d.label} FROM ${d.table} WHERE ${d.label} LIKE ${q(d.names[0].slice(0, 2) + '%')};`], 'Dans LIKE, % représente zéro, un ou plusieurs caractères.');
add(2, 'IS NULL', 'Les informations absentes', d => [`Affiche ${d.label} de ${d.table} pour les lignes qui n’ont pas de note (NULL).`, `SELECT ${d.label} FROM ${d.table} WHERE note IS NULL;`], 'NULL n’est ni une chaîne vide ni zéro. Teste-le avec IS NULL, jamais = NULL.');
add(2, 'IS NOT NULL', 'Les notes renseignées', d => [`Affiche ${d.label} et note de ${d.table} lorsque note est renseignée.`, `SELECT ${d.label}, note FROM ${d.table} WHERE note IS NOT NULL;`], 'IS NOT NULL recherche une valeur présente.');
add(2, 'Résultat vide', 'Aucun résultat est un résultat', d => [`Affiche ${d.label} de ${d.table} pour les lignes situées à Brest. La ville peut ne pas être présente.`, `SELECT ${d.label} FROM ${d.table} WHERE ville = 'Brest';`], 'Un SELECT valide peut retourner zéro ligne. Les colonnes demandées restent importantes.');

add(3, 'ASC', 'L’ordre alphabétique', d => [`Affiche ${d.label} de ${d.table} dans l’ordre alphabétique croissant.`, `SELECT ${d.label} FROM ${d.table} ORDER BY ${d.label} ASC;`], 'ORDER BY vient après FROM et WHERE. ASC est l’ordre croissant.');
add(3, 'DESC', 'Du plus grand au plus petit', d => [`Affiche ${d.label} et ${d.metric} de ${d.table}, par ${d.metric} décroissant. En cas d’égalité, trie par id croissant.`, `SELECT ${d.label}, ${d.metric} FROM ${d.table} ORDER BY ${d.metric} DESC, id ASC;`], 'DESC inverse le tri. Un second critère rend les égalités déterministes.');
add(3, 'LIMIT', 'Le podium', d => [`Affiche les 3 premières lignes de ${d.table} par ${d.metric} décroissant puis id croissant. Retourne ${d.label}, ${d.metric}.`, `SELECT ${d.label}, ${d.metric} FROM ${d.table} ORDER BY ${d.metric} DESC, id LIMIT 3;`], 'Trie avant de limiter, sinon les « trois premiers » n’ont pas le sens demandé.');
add(3, 'OFFSET', 'La deuxième page', d => [`Affiche ${d.label} de ${d.table} par id croissant, en sautant les 3 premières lignes et en conservant les 3 suivantes.`, `SELECT ${d.label} FROM ${d.table} ORDER BY id LIMIT 3 OFFSET 3;`], 'LIMIT indique combien de lignes conserver ; OFFSET combien de lignes sauter.');
add(3, 'WHERE + ORDER BY', 'Une liste locale', d => [`Affiche ${d.label} et ${d.metric} des lignes de ${d.table} situées à Toulon, par ${d.metric} croissant puis id croissant.`, `SELECT ${d.label}, ${d.metric} FROM ${d.table} WHERE ville = 'Toulon' ORDER BY ${d.metric}, id;`], 'L’ordre des clauses est SELECT, FROM, WHERE, ORDER BY.');
add(3, 'WHERE + LIMIT', 'Le meilleur choix local', d => [`À Lyon, quelle ligne de ${d.table} a la plus grande valeur de ${d.metric} ? Affiche ${d.label} et ${d.metric}. En cas d’égalité, prends le plus petit id.`, `SELECT ${d.label}, ${d.metric} FROM ${d.table} WHERE ville = 'Lyon' ORDER BY ${d.metric} DESC, id LIMIT 1;`], 'Filtre d’abord la ville, trie les candidats, puis conserve une ligne.');
add(3, 'Tri multiple', 'Une liste bien rangée', d => [`Affiche ville et ${d.label} de ${d.table}, par ville alphabétique, puis par ${d.label} alphabétique.`, `SELECT ville, ${d.label} FROM ${d.table} ORDER BY ville, ${d.label};`], 'Les critères de tri sont séparés par des virgules et appliqués de gauche à droite.');

add(4, 'COUNT', 'Combien de lignes ?', d => [`Compte toutes les lignes de ${d.table}. Retourne une colonne nommée total.`, `SELECT COUNT(*) AS total FROM ${d.table};`, { strictColumns: true }], 'COUNT(*) compte les lignes, même lorsqu’une de leurs colonnes est NULL.');
add(4, 'COUNT / NULL', 'Compter les notes', d => [`Compte les notes non NULL de ${d.table}. Retourne une seule valeur.`, `SELECT COUNT(note) FROM ${d.table};`], 'COUNT(colonne) ignore les NULL, contrairement à COUNT(*).');
add(4, 'SUM', 'Faire le total', d => [`Calcule la somme de quantite dans ${d.events}, uniquement pour le statut confirme.`, `SELECT SUM(quantite) FROM ${d.events} WHERE statut = 'confirme';`], 'WHERE filtre les lignes avant que SUM calcule le total.');
add(4, 'AVG', 'Une moyenne utile', d => [`Calcule la moyenne de ${d.metric} pour les lignes de ${d.table} situées à Toulon.`, `SELECT AVG(${d.metric}) FROM ${d.table} WHERE ville = 'Toulon';`], 'AVG calcule la moyenne des valeurs non NULL.');
add(4, 'MIN / MAX', 'Les deux extrêmes', d => [`Affiche en une ligne le minimum puis le maximum de ${d.metric} dans ${d.table}.`, `SELECT MIN(${d.metric}), MAX(${d.metric}) FROM ${d.table};`], 'Plusieurs agrégats peuvent figurer dans le même SELECT.');
add(4, 'GROUP BY', 'Compter par ville', d => [`Pour chaque ville de ${d.table}, affiche ville puis le nombre de lignes.`, `SELECT ville, COUNT(*) FROM ${d.table} GROUP BY ville;`], 'GROUP BY crée un groupe par ville ; COUNT calcule ensuite un total pour chaque groupe.');
add(4, 'HAVING', 'Les villes les plus représentées', d => [`Affiche ville et le nombre de lignes de ${d.table}, uniquement pour les villes ayant au moins 2 lignes.`, `SELECT ville, COUNT(*) FROM ${d.table} GROUP BY ville HAVING COUNT(*) >= 2;`], 'HAVING filtre les groupes après agrégation. WHERE ne peut pas filtrer COUNT(*).');
add(4, 'COUNT DISTINCT', 'Compter sans doublons', d => [`Combien de villes différentes figurent dans ${d.table} ? Retourne une seule valeur.`, `SELECT COUNT(DISTINCT ville) FROM ${d.table};`], 'COUNT(DISTINCT colonne) compte les valeurs distinctes non NULL.');
add(4, 'WHERE / HAVING', 'Deux étapes de filtrage', d => [`Par ville dans ${d.table}, compte seulement les lignes dont note est NULL. Affiche ville et le nombre obtenu, pour les groupes d’au moins 2 lignes.`, `SELECT ville, COUNT(*) FROM ${d.table} WHERE note IS NULL GROUP BY ville HAVING COUNT(*) >= 2;`], 'WHERE choisit les lignes ; GROUP BY les regroupe ; HAVING choisit les groupes.');

add(5, 'INNER JOIN', 'Relier deux tables', d => [`Affiche ${d.table}.${d.label}, puis ${d.parent}.nom pour les lignes ayant une relation avec ${d.parent}.`, `SELECT t.${d.label}, p.nom FROM ${d.table} t INNER JOIN ${d.parent} p ON t.${d.parentKey} = p.id;`], 'Relie la clé étrangère de la table principale à la clé primaire du parent avec ON.');
add(5, 'LEFT JOIN', 'Ne perdre personne', d => [`Affiche ${d.table}.${d.label}, puis ${d.parent}.nom pour TOUTES les lignes de ${d.table}, même celles sans parent.`, `SELECT t.${d.label}, p.nom FROM ${d.table} t LEFT JOIN ${d.parent} p ON t.${d.parentKey} = p.id;`], 'LEFT JOIN conserve toutes les lignes de gauche. Le parent absent est représenté par NULL.');
add(5, 'LEFT JOIN / NULL', 'Sans activité', d => [`Affiche ${d.label} des lignes de ${d.table} qui n’ont aucune ligne associée dans ${d.events}.`, `SELECT t.${d.label} FROM ${d.table} t LEFT JOIN ${d.events} e ON e.${d.eventKey} = t.id WHERE e.id IS NULL;`], 'Une jointure gauche suivie de IS NULL repère l’absence de correspondance.');
add(5, 'Relation 1-N', 'Lire le détail', d => [`Pour chaque ligne de ${d.events}, affiche son id, le ${d.label} associé dans ${d.table}, puis sa quantite.`, `SELECT e.id, t.${d.label}, e.quantite FROM ${d.events} e JOIN ${d.table} t ON e.${d.eventKey} = t.id;`], 'Plusieurs lignes d’activité peuvent pointer vers la même clé primaire. Ne supprime pas ces répétitions.');
add(5, 'Jointures multiples', 'Trois tables, une réponse', d => [`Pour chaque ligne de ${d.events} reliée à ${d.table} et ${d.parent}, affiche l’id de l’activité, ${d.table}.${d.label}, puis ${d.parent}.nom.`, `SELECT e.id, t.${d.label}, p.nom FROM ${d.events} e JOIN ${d.table} t ON e.${d.eventKey}=t.id JOIN ${d.parent} p ON t.${d.parentKey}=p.id;`], 'Chaque JOIN doit avoir sa propre condition ON. Les alias évitent les noms ambigus.');
add(5, 'JOIN + WHERE', 'Activités confirmées', d => [`Affiche ${d.table}.${d.label} et ${d.events}.quantite pour chaque activité dont statut vaut confirme. Conserve les éventuels doublons.`, `SELECT t.${d.label}, e.quantite FROM ${d.table} t JOIN ${d.events} e ON e.${d.eventKey}=t.id WHERE e.statut='confirme';`], 'ON relie les tables ; WHERE filtre les lignes du résultat joint.');
add(5, 'JOIN + DISTINCT', 'Au moins une activité', d => [`Affiche une seule fois chaque ${d.label} de ${d.table} ayant au moins une ligne associée dans ${d.events}.`, `SELECT DISTINCT t.${d.label} FROM ${d.table} t JOIN ${d.events} e ON e.${d.eventKey}=t.id;`], 'Une relation 1-N peut dupliquer les noms ; DISTINCT les déduplique.');
add(5, 'Clé étrangère', 'Les groupes sans membre', d => [`Affiche nom de ${d.parent} pour les groupes auxquels aucune ligne de ${d.table} n’est rattachée.`, `SELECT p.nom FROM ${d.parent} p LEFT JOIN ${d.table} t ON t.${d.parentKey}=p.id WHERE t.id IS NULL;`], 'Place les groupes à gauche pour conserver aussi ceux qui n’ont aucun membre.');

add(6, 'INSERT', 'Ajouter un groupe', d => [`Ajoute dans ${d.parent} la ligne id = 5, nom = 'Nouveautés'. Ne modifie aucune autre donnée.`, `INSERT INTO ${d.parent} (id,nom) VALUES (5,'Nouveautés');`], 'INSERT INTO nomme la table et les colonnes ; VALUES fournit les valeurs dans le même ordre.');
add(6, 'INSERT / NULL', 'Une nouvelle entrée', d => [`Ajoute à ${d.table} : id 9, ${d.label} 'Nouvelle entrée', ${d.metric} ${d.values[0]}, ville 'Toulon', note NULL, ${d.parentKey} 1.`, `INSERT INTO ${d.table} (id,${d.label},${d.metric},ville,note,${d.parentKey}) VALUES (9,'Nouvelle entrée',${d.values[0]},'Toulon',NULL,1);`], 'NULL s’écrit sans quotes. La clé étrangère doit désigner un parent existant.');
add(6, 'UPDATE', 'Une correction ciblée', d => [`Dans ${d.table}, change uniquement ville en 'Brest' pour la ligne d’id 2.`, `UPDATE ${d.table} SET ville='Brest' WHERE id=2;`], 'UPDATE indique la table, SET les changements, WHERE la ligne ciblée. Sans WHERE, toutes les lignes changeraient.');
add(6, 'UPDATE / Calcul', 'Une augmentation ciblée', d => [`Dans ${d.table}, augmente ${d.metric} de 2 uniquement pour les lignes situées à Toulon.`, `UPDATE ${d.table} SET ${d.metric}=${d.metric}+2 WHERE ville='Toulon';`], 'SET peut utiliser la valeur actuelle de la colonne dans un calcul.');
add(6, 'DELETE', 'Supprimer une activité', d => [`Supprime uniquement la ligne d’id 3 de ${d.events}.`, `DELETE FROM ${d.events} WHERE id=3;`], 'DELETE FROM supprime des lignes ; WHERE limite la suppression. La table continue d’exister.');
add(6, 'DELETE / WHERE', 'Nettoyer les annulations', d => [`Supprime de ${d.events} (activités de ${d.table}) toutes les lignes de statut annule, et uniquement celles-ci.`, `DELETE FROM ${d.events} WHERE statut='annule';`], 'Vérifie mentalement le filtre avant un DELETE. Sans WHERE, tu viderais toute la table.');

add(7, 'CREATE TABLE', 'Une table de brouillon', d => [`Crée brouillons_${d.table} avec exactement id INTEGER PRIMARY KEY et ${d.label} TEXT NOT NULL.`, `CREATE TABLE brouillons_${d.table} (id INTEGER PRIMARY KEY, ${d.label} TEXT NOT NULL);`], 'Les définitions des colonnes sont séparées par des virgules entre parenthèses.');
add(7, 'UNIQUE', 'Une identité unique', d => [`Crée contacts_${d.table} avec id INTEGER PRIMARY KEY, email TEXT NOT NULL UNIQUE et nom TEXT NOT NULL, dans cet ordre.`, `CREATE TABLE contacts_${d.table} (id INTEGER PRIMARY KEY, email TEXT NOT NULL UNIQUE, nom TEXT NOT NULL);`], 'NOT NULL impose une valeur ; UNIQUE interdit deux valeurs identiques. Les deux contraintes sont complémentaires.');
add(7, 'FOREIGN KEY', 'Conserver le lien', d => [`Crée favoris avec id INTEGER PRIMARY KEY et cible_id INTEGER NOT NULL référençant ${d.table}(id).`, `CREATE TABLE favoris (id INTEGER PRIMARY KEY, cible_id INTEGER NOT NULL REFERENCES ${d.table}(id));`], 'REFERENCES pointe vers la clé du parent. Une contrainte FOREIGN KEY séparée est également possible.');
add(7, 'ALTER TABLE ADD', 'Une colonne en plus', d => [`Ajoute à ${d.table} une colonne description de type TEXT, nullable et sans valeur par défaut.`, `ALTER TABLE ${d.table} ADD COLUMN description TEXT;`], 'SQLite accepte ALTER TABLE … ADD COLUMN pour ajouter une colonne.');
add(7, 'ALTER TABLE RENAME', 'Renommer une colonne', d => [`Dans ${d.table}, renomme la colonne note en commentaire. Conserve les données et les autres colonnes.`, `ALTER TABLE ${d.table} RENAME COLUMN note TO commentaire;`], 'RENAME COLUMN change le nom d’une colonne sans perdre ses valeurs.');
add(7, 'DROP TABLE', 'Retirer une table', d => [`Supprime la table ${d.events} de la structure. Conserve ${d.table} et ${d.parent}, ainsi que leurs données.`, `DROP TABLE ${d.events};`], 'DROP TABLE supprime la table entière. DELETE FROM conserverait la structure.');
add(7, 'DEFAULT', 'Une valeur par défaut', d => [`Crée taches_${d.table} avec id INTEGER PRIMARY KEY, titre TEXT NOT NULL et terminee INTEGER NOT NULL DEFAULT 0.`, `CREATE TABLE taches_${d.table} (id INTEGER PRIMARY KEY, titre TEXT NOT NULL, terminee INTEGER NOT NULL DEFAULT 0);`], 'DEFAULT fournit la valeur lorsqu’un INSERT omet cette colonne.');
add(7, 'Clé composée', 'Une paire unique', d => [`Crée suivi avec cible_id INTEGER référençant ${d.table}(id), jour TEXT, et une clé primaire composée de (cible_id, jour). N’ajoute pas de NOT NULL explicite.`, `CREATE TABLE suivi (cible_id INTEGER REFERENCES ${d.table}(id), jour TEXT, PRIMARY KEY(cible_id,jour));`], 'Une clé primaire composée identifie la combinaison de colonnes. SQLite a des particularités sur NULL avec ces clés.');

add(8, 'Sous-requête', 'Au-dessus de la moyenne', d => [`Affiche ${d.label} et ${d.metric} de ${d.table} pour les lignes dont ${d.metric} est strictement supérieur à la moyenne globale.`, `SELECT ${d.label}, ${d.metric} FROM ${d.table} WHERE ${d.metric} > (SELECT AVG(${d.metric}) FROM ${d.table});`], 'La sous-requête calcule une valeur scalaire que le filtre peut comparer à chaque ligne.');
add(8, 'IN / Sous-requête', 'Une activité confirmée existe', d => [`Affiche ${d.label} des lignes de ${d.table} ayant au moins une activité de statut confirme dans ${d.events}. Chaque ligne principale ne doit apparaître qu’une fois.`, `SELECT ${d.label} FROM ${d.table} WHERE id IN (SELECT ${d.eventKey} FROM ${d.events} WHERE statut='confirme');`], 'IN accepte aussi le résultat d’une sous-requête à une seule colonne.');
add(8, 'EXISTS', 'Une quantité significative', d => [`Affiche ${d.label} des lignes de ${d.table} ayant au moins une activité avec quantite >= 3 dans ${d.events}.`, `SELECT t.${d.label} FROM ${d.table} t WHERE EXISTS (SELECT 1 FROM ${d.events} e WHERE e.${d.eventKey}=t.id AND e.quantite>=3);`], 'EXISTS teste l’existence d’une correspondance ; la sous-requête est reliée à la ligne externe.');
add(8, 'NOT EXISTS', 'Aucune confirmation', d => [`Affiche ${d.label} des lignes de ${d.table} n’ayant aucune activité de statut confirme dans ${d.events}, y compris celles sans activité.`, `SELECT t.${d.label} FROM ${d.table} t WHERE NOT EXISTS (SELECT 1 FROM ${d.events} e WHERE e.${d.eventKey}=t.id AND e.statut='confirme');`], 'NOT EXISTS inclut les lignes sans aucune activité et évite les pièges de NOT IN avec NULL.');
add(8, 'JOIN + COUNT', 'Compter aussi les zéros', d => [`Pour chaque ligne de ${d.table}, affiche ${d.label} puis son nombre d’activités dans ${d.events}, zéro compris.`, `SELECT t.${d.label}, COUNT(e.id) FROM ${d.table} t LEFT JOIN ${d.events} e ON e.${d.eventKey}=t.id GROUP BY t.id, t.${d.label};`], 'Après LEFT JOIN, COUNT(e.id) compte zéro si aucun enfant n’existe. COUNT(*) compterait la ligne artificielle.');
add(8, 'JOIN + HAVING', 'Les plus actifs', d => [`Affiche ${d.table}.${d.label} et la somme des quantite de ${d.events}, uniquement pour les totaux >= 3.`, `SELECT t.${d.label}, SUM(e.quantite) FROM ${d.table} t JOIN ${d.events} e ON e.${d.eventKey}=t.id GROUP BY t.id, t.${d.label} HAVING SUM(e.quantite)>=3;`], 'La jointure récupère les activités ; GROUP BY regroupe par entité ; HAVING filtre le total.');
add(8, 'MAX / Sous-requête', 'Tous les records', d => [`Affiche ${d.label} et ${d.metric} de ${d.table} pour toutes les lignes qui atteignent la valeur maximale de ${d.metric}, y compris les ex æquo.`, `SELECT ${d.label}, ${d.metric} FROM ${d.table} WHERE ${d.metric}=(SELECT MAX(${d.metric}) FROM ${d.table});`], 'Comparer à MAX garde les ex æquo, contrairement à LIMIT 1.');
add(8, 'Synthèse', 'Le bilan par groupe', d => [`Pour chaque groupe de ${d.parent} ayant des activités confirmées, affiche son nom puis la somme des quantite de ${d.events}. Trie par total décroissant puis nom croissant.`, `SELECT p.nom, SUM(e.quantite) AS total FROM ${d.parent} p JOIN ${d.table} t ON t.${d.parentKey}=p.id JOIN ${d.events} e ON e.${d.eventKey}=t.id WHERE e.statut='confirme' GROUP BY p.id,p.nom ORDER BY total DESC,p.nom;`, { orderMatters: true }], 'Construis les jointures, filtre les confirmations, regroupe, puis trie les totaux.');

function teachingNotes(sql, tip) {
  const notes = [tip];
  const clauses = [
    [/^SELECT/i, 'SELECT choisit les colonnes ou calcule les expressions affichées.'],
    [/\bFROM\b/, 'FROM précise la table de départ.'],
    [/\bLEFT JOIN\b/, 'LEFT JOIN conserve toutes les lignes de gauche, même sans correspondance.'],
    [/\bJOIN\b/, 'ON relie les clés : sans cette condition, les combinaisons de lignes se multiplient.'],
    [/\bWHERE\b/, 'WHERE retient les lignes qui respectent le filtre avant toute agrégation.'],
    [/\bGROUP BY\b/, 'GROUP BY forme un groupe pour chaque combinaison de valeurs indiquées.'],
    [/\bHAVING\b/, 'HAVING filtre les groupes après le calcul des agrégats.'],
    [/\bORDER BY\b/, 'ORDER BY organise le résultat ; les critères sont appliqués de gauche à droite.'],
    [/\bLIMIT\b/, 'LIMIT restreint le nombre de lignes après le tri ; OFFSET décale le début si présent.'],
    [/^INSERT/i, 'INSERT INTO indique les colonnes de destination ; VALUES fournit les valeurs correspondantes.'],
    [/^UPDATE/i, 'SET décrit les nouvelles valeurs. Le WHERE empêche de modifier les autres lignes.'],
    [/^DELETE/i, 'DELETE retire les lignes sélectionnées mais conserve la structure de la table.'],
    [/\bPRIMARY KEY\b/, 'PRIMARY KEY identifie chaque ligne (ou chaque combinaison de colonnes).'],
    [/\bREFERENCES\b/, 'REFERENCES impose que la valeur corresponde à la clé de la table référencée.'],
    [/\bNOT NULL\b/, 'NOT NULL refuse l’absence de valeur.'],
    [/\bUNIQUE\b/, 'UNIQUE interdit les valeurs non NULL répétées dans la colonne ou le groupe de colonnes.'],
    [/\bDEFAULT\b/, 'DEFAULT s’applique si la colonne est omise lors d’un INSERT.']
  ];
  for (const [pattern, note] of clauses) if (pattern.test(sql)) notes.push(note);
  return notes.map((text, i) => `${i + 1}. ${text}`).join('\n');
}
function progressiveHints(p, d, sql) {
  const precise = p.level === 7 ? `La modification concerne la structure. Repère les types, les clés et les contraintes demandées ; les tables existantes doivent être préservées sauf consigne contraire.` :
    p.level === 6 ? `Cible ${sql.match(/^(?:INSERT INTO|UPDATE|DELETE FROM) (\w+)/)?.[1]}. ${sql.includes('WHERE') ? 'Commence par vérifier le filtre avec un SELECT avant de modifier les lignes.' : 'Nomme explicitement les colonnes pour associer chaque valeur à la bonne place.'}` :
      /JOIN/.test(sql) ? `Pars de ${d.table} et relie ${d.parentKey} à ${d.parent}.id, ou ${d.events}.${d.eventKey} à ${d.table}.id selon la consigne. Vérifie si les lignes sans correspondance doivent rester.` :
        /GROUP BY/.test(sql) ? `La colonne ville définit les groupes. Sépare le filtre sur les lignes (WHERE) du filtre sur leur nombre (HAVING).` :
          /\b(?:COUNT|AVG|SUM|MIN|MAX)\(/.test(sql) ? `Identifie l’agrégat demandé et les lignes sur lesquelles il doit porter. COUNT(*) compte les lignes ; COUNT(colonne) ignore les NULL.` :
            `La table de départ est ${d.table}. ${p.level === 3 ? 'Trie après avoir filtré ; LIMIT et OFFSET viennent à la fin.' : p.level === 2 ? 'Écris le test après WHERE et entoure les valeurs textuelles de quotes simples.' : 'Nomme les colonnes demandées dans SELECT, séparées par des virgules.'}`;
  let skeleton = sql.replace(/'(?:''|[^'])*'/g, "'…'").replace(/\b\d+\b/g, '…').replace(/^SELECT[\s\S]*?\bFROM\b/i, 'SELECT …\nFROM');
  if (p.level === 7) skeleton = sql.startsWith('CREATE') ? 'CREATE TABLE … (\n  … INTEGER PRIMARY KEY,\n  …\n);' : sql.startsWith('DROP') ? 'DROP TABLE …;' : 'ALTER TABLE …\n  …;';
  return [p.tip, precise, `Une structure à compléter (les … sont à remplacer) :\n${skeleton}`];
}

// Variantes générées modèle par modèle (4 contextes chacun), puis entrelacées dans le parcours.
const variantsByPattern = patterns.map((p, index) => Array.from({ length: 4 }, (_, variant) => {
  const d = datasets[(index * 4 + variant) % datasets.length];
  const [statement, solutionSql, options = {}] = p.make(d);
  return {
    id: `l${p.level}-${String(index + 1).padStart(2, '0')}-${d.id}`,
    title: p.title, statement, level: p.level, category: levels[p.level - 1].name,
    difficulty: p.level <= 3 ? 'Facile' : p.level <= 6 ? 'Normale' : 'Difficile',
    tags: [p.tag, d.name], datasetId: d.id, schemaSql: d.schemaSql, seedSql: d.seedSql, solutionSql,
    validationMode: p.level === 6 ? 'state' : p.level === 7 ? 'schema' : 'result',
    orderMatters: p.level === 3, strictColumns: false,
    hints: progressiveHints(p, d, solutionSql),
    explanation: teachingNotes(solutionSql, p.tip),
    notion: p.tip, xp: p.level <= 3 ? 10 : p.level <= 6 ? 20 : 35, examEligible: true, ...options
  };
}));
/* Ordre du parcours : dans chaque niveau, le premier contexte de chaque modèle, puis le deuxième, etc.
   Deux variantes d'un même modèle ne se suivent donc jamais (chaque niveau compte plusieurs modèles). */
export const exercises = levels.flatMap(level => {
  const groups = variantsByPattern.filter(group => group[0].level === level.id);
  return Array.from({ length: 4 }, (_, variant) => groups.map(group => group[variant])).flat();
}).concat(customExercises);
export const exerciseById = new Map(exercises.map(e => [e.id, e]));

/* Aide-mémoire : une fiche par notion (la première variante de chaque motif d'exercice).
   Exposé ici pour que la page et son test de cohérence partagent la même construction. */
export const cheatsheet = levels.map(level => ({
  ...level,
  examples: variantsByPattern.filter(group => group[0].level === level.id).map(group => group[0])
}));
