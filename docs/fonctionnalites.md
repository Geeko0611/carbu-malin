# Fonctionnalités — CarbuMalin

## Fonctionnalités V1 (livrées)

### Authentification
- Création de compte avec email + mot de passe (localStorage)
- Validation admin : seul le compte administrateur peut approuver les nouveaux comptes
- Comptes en attente jusqu'à validation
- Déconnexion

### Profil voiture
- Recherche dans le catalogue officiel ADEME (marque, modèle, version, carburant)
- Saisie manuelle si modèle absent
- Stockage de plusieurs voitures par compte
- Consommation officielle utilisée dans les calculs

### Outil de décision "Où faire mon plein ?"
- Saisie : ville de départ, carburant (SP95, Gazole…), volume souhaité
- Récupération des stations dans un rayon configuré
- Calcul du score pour chaque station intégrant :
  - Prix du carburant
  - Distance routière (OSRM, avec exclusion péages sur demande)
  - Temps de trajet estimé
  - Usure véhicule (coût kilométrique)
- Classement des stations par score global
- Affichage sur carte Leaflet avec markers

### Carte interactive
- Fond OpenStreetMap (tuiles locales Leaflet, pas de CDN)
- Markers colorés selon le score
- Popup détail : nom station, enseigne, adresse, prix, distance
- Géolocalisation navigateur optionnelle

### Statistiques personnelles
- Historique des pleins enregistrés
- Dashboard : dépenses, volumes, stations fréquentées
- Graphiques de prix dans le temps

### Données temps réel
- Mise à jour automatique quotidienne (GitHub Actions)
- Source : Open data gouvernemental (prix en temps réel + historique)
- Enrichissement des noms d'enseignes (Total, Leclerc, Intermarché…)

---

## Fonctionnalités V2 (backlog — non développées)

> À prioriser par le Chef de projet (Chat Claude)

### Backend / Comptes cloud
- Authentification centralisée (email/mot de passe)
- Synchronisation multi-appareils
- Emails automatiques (confirmation d'inscription, réinitialisation)
- OAuth : Google, Microsoft, Facebook, Instagram

### Social / Communauté
- Notation des stations par les utilisateurs
- Signalement de prix incorrects
- Partage d'un plein avantageux

### Mobile
- PWA complète (installation, push notifications)
- Géolocalisation continue

### Personnalisation avancée
- Alertes prix (notification quand SP95 < seuil)
- Itinéraire multi-étapes (trajet + plein en chemin)
- Comparaison de carburants (SP95 vs E10 vs Gazole selon la voiture)

---

## Règles métier clés

### Algorithme de score
Le score d'une station prend en compte (pondération à préciser en V2) :
1. **Prix absolu** du carburant × volume demandé → coût direct
2. **Coût du détour** = distance aller-retour × coût kilométrique voiture
3. **Valeur temps** = temps détour × coût horaire conducteur (paramétrable)
4. **Économie nette** = (prix station moyenne − prix station) × volume − coût détour

### Gestion des péages
- Si l'utilisateur refuse les péages → requête OSRM avec `exclude=motorway`
- Si OSRM ne répond pas → fallback distance vol d'oiseau × 1,22

### Géocodage
1. Lookup dans `communes.json` (base officielle)
2. Si non trouvé → géolocalisation navigateur
3. Si refusée → saisie manuelle de coordonnées
