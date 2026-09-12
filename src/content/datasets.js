const quote = value => value === null ? 'NULL' : typeof value === 'number' ? String(value) : `'${value.replaceAll("'", "''")}'`;

// Des contextes éditoriaux partagent un petit modèle relationnel, pas leurs noms ni leurs données.
const definitions = [
  ['cinema', 'Cinéma', 'films', 'titre', 'duree', 'minutes', 'genres', 'genre_id', 'seances', 'film_id', ['Science-fiction', 'Animation', 'Drame', 'Documentaire'], ['Interstellar', 'Le Voyage de Chihiro', 'Arrival', 'Le Château ambulant', 'La Haine', 'Dune', 'Persepolis', 'Moon'], [169, 125, 116, 119, 98, 155, 96, 97]],
  ['jeux', 'Jeux vidéo', 'jeux', 'titre', 'prix', '€', 'studios', 'studio_id', 'ventes', 'jeu_id', ['Supergiant', 'Team Cherry', 'ConcernedApe', 'Motion Twin'], ['Hades', 'Hollow Knight', 'Pyre', 'Silksong', 'Stardew Valley', 'Bastion', 'Terraria', 'Celeste'], [25, 15, 20, 30, 14, 12, 10, 18]],
  ['bibliotheque', 'Bibliothèque', 'livres', 'titre', 'pages', 'pages', 'rayons', 'rayon_id', 'emprunts', 'livre_id', ['Roman', 'BD', 'Essai', 'Poésie'], ['La Horde du Contrevent', 'Akira', 'Dune', 'Persepolis', 'Une chambre à soi', 'L’Étranger', 'Le Petit Prince', '1984'], [704, 360, 688, 160, 192, 184, 96, 368]],
  ['boutique', 'E-commerce', 'produits', 'nom', 'prix', '€', 'categories', 'categorie_id', 'commandes', 'produit_id', ['Informatique', 'Audio', 'Accessoires', 'Photo'], ['Clavier mécanique', 'Casque studio', 'Souris sans fil', 'Enceinte portable', 'Support laptop', 'Écran 24 pouces', 'Câble USB-C', 'Webcam HD'], [79, 99, 29, 49, 25, 149, 9, 39]],
  ['restaurants', 'Restaurants', 'restaurants', 'nom', 'prix_menu', '€', 'cuisines', 'cuisine_id', 'reservations', 'restaurant_id', ['Française', 'Italienne', 'Japonaise', 'Libanaise'], ['Le Petit Sud', 'La Piazza', 'Chez Marcel', 'Basilico', 'Sakura', 'Les Deux Amis', 'Le Bistrot', 'L’Olivier'], [24, 18, 32, 22, 28, 35, 19, 26]],
  ['voyages', 'Voyages', 'voyages', 'destination', 'prix', '€', 'agences', 'agence_id', 'reservations', 'voyage_id', ['Horizons', 'Échappée', 'Nomade', 'Bivouac'], ['Lisbonne', 'Kyoto', 'Naples', 'Séoul', 'Reykjavik', 'Montréal', 'Porto', 'Rome'], [450, 1800, 520, 1500, 1100, 950, 390, 610]],
  ['ecole', 'École', 'etudiants', 'nom', 'age', 'ans', 'formations', 'formation_id', 'inscriptions', 'etudiant_id', ['DWWM', 'CDA', 'Design', 'Réseaux'], ['Lina Martin', 'Noé Bernard', 'Sarah Petit', 'Adam Robert', 'Emma Durand', 'Yanis Moreau', 'Inès Laurent', 'Hugo Simon'], [21, 28, 19, 32, 24, 22, 18, 26]],
  ['entreprise', 'Entreprise', 'employes', 'nom', 'salaire', '€ mensuels', 'services', 'service_id', 'missions', 'employe_id', ['Développement', 'Support', 'Design', 'RH'], ['Alice Moreau', 'Karim Benali', 'Léa Martin', 'Paul Durand', 'Chloé Robert', 'Samir Petit', 'Lou Bernard', 'Jules Simon'], [2800, 2400, 3200, 2600, 2900, 3800, 2300, 3100]],
  ['refuge', 'Refuge animalier', 'animaux', 'nom', 'age', 'ans', 'especes', 'espece_id', 'visites', 'animal_id', ['Chat', 'Chien', 'Lapin', 'Tortue'], ['Moka', 'Rio', 'Plume', 'Nala', 'Cookie', 'Pixel', 'Luna', 'Oslo'], [3, 5, 2, 7, 1, 4, 6, 8]],
  ['musique', 'Musique', 'albums', 'titre', 'duree', 'minutes', 'styles', 'style_id', 'ecoutes', 'album_id', ['Électro', 'Jazz', 'Rock', 'Classique'], ['Discovery', 'Kind of Blue', 'Random Access Memories', 'Blue Train', 'Abbey Road', 'Moon Safari', 'Mezzanine', 'In Rainbows'], [61, 46, 74, 42, 47, 43, 63, 42]],
  ['garage', 'Automobile', 'voitures', 'modele', 'prix', '€', 'marques', 'marque_id', 'locations', 'voiture_id', ['Renault', 'Toyota', 'Peugeot', 'Volvo'], ['Clio', 'Yaris', 'Captur', 'Corolla', '208', 'Mégane', '308', 'C3'], [16000, 18000, 22000, 27000, 19000, 24000, 23000, 17000]],
  ['hotels', 'Hôtellerie', 'hotels', 'nom', 'prix_nuit', '€', 'chaines', 'chaine_id', 'reservations', 'hotel_id', ['Rivage', 'Urban Stay', 'Indépendant', 'Grand Nord'], ['Les Embruns', 'Le Central', 'La Dune', 'Urban Lyon', 'Le Jardin', 'La Corniche', 'Les Pins', 'Le Patio'], [85, 110, 95, 125, 70, 150, 65, 90]]
];

export const datasets = definitions.map(([id, name, table, label, metric, unit, parent, parentKey, events, eventKey, groups, names, values]) => {
  const schemaSql = `CREATE TABLE ${parent} (id INTEGER PRIMARY KEY, nom TEXT NOT NULL UNIQUE);
CREATE TABLE ${table} (id INTEGER PRIMARY KEY, ${label} TEXT NOT NULL, ${metric} INTEGER NOT NULL, ville TEXT NOT NULL, note TEXT, ${parentKey} INTEGER REFERENCES ${parent}(id));
CREATE TABLE ${events} (id INTEGER PRIMARY KEY, ${eventKey} INTEGER NOT NULL REFERENCES ${table}(id), quantite INTEGER NOT NULL, statut TEXT NOT NULL);`;
  const cities = ['Toulon', 'Lyon', 'Toulon', 'Paris', 'Lyon', 'Paris', 'Toulon', 'Nice'];
  const parents = [1, 2, 1, 2, 3, 1, null, 3];
  const seedSql = groups.map((group, i) => `INSERT INTO ${parent} VALUES (${i + 1},${quote(group)});`).join('\n') + '\n' +
    names.map((name, i) => `INSERT INTO ${table} VALUES (${i + 1},${quote(name)},${values[i]},${quote(cities[i])},${quote(i % 3 === 0 ? 'À vérifier' : null)},${quote(parents[i])});`).join('\n') + '\n' +
    [[1, 1, 2, 'confirme'], [2, 1, 1, 'en_attente'], [3, 2, 3, 'confirme'], [4, 3, 1, 'annule'], [5, 4, 2, 'confirme'], [6, 4, 4, 'confirme'], [7, 5, 1, 'en_attente'], [8, 6, 2, 'confirme']].map(row => `INSERT INTO ${events} VALUES (${row.map(quote).join(',')});`).join('\n');
  return { id, name, table, label, metric, unit, parent, parentKey, events, eventKey, groups, names, values, schemaSql, seedSql };
});
export const datasetById = new Map(datasets.map(d => [d.id, d]));
