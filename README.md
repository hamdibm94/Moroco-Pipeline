# 🇲🇦 Morocco Purchasing Pipeline · Bureau Casablanca

> **Suivi de Production & Pipeline des Achats — Pôle Marché Ibérique (Espagne & Portugal)**  
> Application web d'analyse et de gestion opérationnelle des détections fournisseurs, négociation des lots, suivi des affaires et détection des retards en temps réel.
> 
> Directement modélisée et alignée sur la structure du fichier :  
> `Pipeline/Suivi_Prod-Team-Casa.xlsx`

---

## 📌 Vue d'Ensemble

Le **Morocco Purchasing Pipeline** a été développé pour l'équipe du Bureau de Casablanca . Il permet de suivre l'ensemble des détections, dossiers déposés (DD), offres en négociation, forecasts BPA et commandes fermes passées par les acheteurs du bureau .

---

## 📊 Modules & Fonctionnalités Clés

- **Cartes KPI Exécutives** : Total Lots Détectés, Pipeline Actif (€), Forecast Négocié (€), Commandes Fermes (€), Alertes Retard (>5j / >14j), Marge Moyenne.
- **Entonnoir de Conversion Acheteurs** : Suivi séparé pour Hamid AIT TAGADIRTE, Marouane CHAHDANE et Raffael BUENOS AIRES avec taux de conversion automatique et signaux opérationnels.
- **Détection Automatique des Retards (Stalling Deals)** :
  - `> 5 jours` sur un Dossier Déposé (DD) sans offre formelle reçue.
  - `> 14 jours` sur une offre en cours de négociation.
- **Tiroir Split 2 Colonnes** :
  - **Colonne Gauche** : Onglets *📦 Fournisseur & Lot*, *🌿 Statut Affaire*, *💰 Offre & Commande*.
  - **Colonne Droite** : Fil de discussion et historique des modifications avec badges d'auteurs (`Toby`, `Said`, `Andreea`).
- **Journal d'Audit & Changements** : Enregistrement de chaque création, modification de statut, note ou montant, avec filtre par auteur.
- **Export Excel / CSV** : Export instantané encodé en UTF-8 BOM avec séparateurs point-virgule, prêt pour Microsoft Excel en français.
