# Architecture technique — CarbuMalin

## Vue d'ensemble

Application web **100 % statique** (HTML + JS + CSS), sans backend ni base de données serveur.  
Déployée sur hébergement mutualisé via FTP. Données rechargées quotidiennement par GitHub Actions.

---

## Stack technique

| Couche | Technologie | Rôle |
|---|---|---|
| Frontend | HTML5 / CSS3 / JS vanilla | UI, logique métier |
| Carte | Leaflet (vendor local) | Affichage des stations |
| Géocodage villes | `data/communes.json` (geo.api.gouv.fr) | Résolution ville → coordonnées |
| Itinéraire | OSRM public + fallback vol d'oiseau ×1,22 | Distance routière, respect des péages |
| Catalogue voiture | `data/vehicle_catalog.json` (ADEME) | Autocomplétion + consommation |
| Données carburant | Open data gouvernement + enrichissement enseignes | Stations et prix |
| Persistance | localStorage navigateur | Comptes, voitures, localisation |
| CI/CD | GitHub Actions (`update-data.yml`) | Regénération JSON + déploiement FTP |

---

## Structure des dossiers

```
work/               ← dossier de travail Claude Code
├── index.html            ← point d'entrée unique (SPA mono-page)
├── assets/
│   ├── app.js            ← toute la logique applicative
│   ├── styles.css        ← interface responsive
│   ├── logo.svg
│   ├── favicon.svg
│   └── vendor/leaflet/   ← Leaflet embarqué (pas de CDN)
├── data/                 ← JSON consommés par l'app
│   ├── stations.json
│   ├── communes.json
│   ├── vehicle_catalog.json
│   ├── station_brands.json
│   ├── history.json
│   ├── metadata.json
│   ├── distributions.json
│   └── daily_scores_*.json
└── scripts/
    └── build_data.py     ← génération des JSON (Python local + GitHub Actions)

public_html/                ← copie prête pour public_html (générée par preparer_ftp.bat)
DesignSystem/                ← assets et spécifications design
work/docs/           ← cette documentation
```

---

## Flux de données

```
Open data gouvernemental (API temps réel)
        ↓
    build_data.py
        ↓
    data/*.json
        ↓
    app.js (lecture fetch)
        ↓
    Interface utilisateur
```

---

## Modules de app.js

| Module | Responsabilité |
|---|---|
| Auth / Comptes | Création, validation admin, localStorage |
| Voitures | Catalogue ADEME, saisie manuelle, stockage |
| Décision | Algorithme de score station (prix, distance, temps, usure) |
| Carte | Leaflet, markers stations, popup détail |
| Dashboard | Statistiques personnelles de plein |
| Géocodage | Lookup communes.json, fallback coordonnées |
| Itinéraire | Appel OSRM, gestion péages, fallback |

---

## Limites V1 (à traiter en V2)

- Comptes uniquement locaux (localStorage) → pas de synchronisation multi-appareils
- Pas d'emails automatiques ni de validation centrale
- Pas d'OAuth (Google, Microsoft, Facebook, Instagram)
- Nécessite un backend pour les fonctionnalités sociales/cloud

---

## Liens utiles

- Données carburant : https://data.economie.gouv.fr/
- Communes françaises : https://geo.api.gouv.fr/
- Catalogue ADEME : https://carlabelling.ademe.fr/
- OSRM routing : https://router.project-osrm.org/
