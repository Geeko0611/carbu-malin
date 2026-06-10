# DesignSystem — Livraisons design

Ce dossier contient tous les assets et spécifications produits par Claude Design (ou l'outil design utilisé).

## Contenu actuel (V1 existant)

Les fichiers du dossier `Design/` original sont la référence V1 :
- Logos, mascottes Croco, fonds, icônes (PNG/SVG)
- `DESIGN SYSTEM.docx` — charte graphique
- `Prompt Site Web.docx` — brief design initial
- Maquettes générées (sous-dossier `ChatGPT/`)

## Convention de nommage pour les futures livraisons

```
v2_[nom-ecran]_[variante].[ext]
```

Exemple : `v2_accueil_mobile.png`, `v2_carte_dark.png`

## Lien avec le développement

Quand Claude Design livre un asset ici, il met à jour `state.md` (section Design)  
pour que Claude Code sache quoi intégrer dans `work/assets/`.
