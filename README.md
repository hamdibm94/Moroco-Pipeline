# 🇲🇦 Morocco Purchasing Pipeline · Bureau Casablanca

> **Suivi de Production & Pipeline des Achats — Pôle Marché Ibérique (Espagne & Portugal)**  
> Application web d'analyse et de gestion opérationnelle des détections fournisseurs, négociation des lots, suivi des affaires et détection des retards en temps réel.
> 
> Directement modélisée et alignée sur la structure du fichier :  
> `Pipeline/Suivi_Prod-Team-Casa.xlsx`

---

## 📌 Vue d'Ensemble

Le **Morocco Purchasing Pipeline** a été développé pour l'équipe du Bureau de Casablanca (OZEOL / Business Support Plus BSP). Il permet de suivre l'ensemble des détections, dossiers déposés (DD), offres en négociation, forecasts BPA et commandes fermes passées par les acheteurs du bureau sur le marché ibérique.

---

## 👥 Équipe & Profils Utilisateurs

L'application intègre un système d'authentification par code PIN à 4 chiffres avec journalisation complète des actions :

| Membre | Rôle | Code PIN par Défaut | Droits d'Accès |
|---|---|---|---|
| **Toby** | `Admin` | `2309` | Accès complet, configuration Supabase, gestion des comptes, réinitialisation |
| **Said** | `Manager` | `1470` | Saisie des détections, suivi des lots, ajout de notes, consultation |
| **Andreea** | `Manager` | `2580` | Saisie des détections, suivi des offres, ajout de notes, consultation |

> 💡 *Les codes PIN et rôles peuvent être modifiés à tout moment par Toby via la modale **Gestion des Profils & PINs**.*

---

## 🎯 Les 3 Acheteurs Suivis

L'entonnoir de conversion (Buyer Funnel), les filtres et les métriques sont configurés pour les 3 acheteurs clés du bureau :
1. **Hamid AIT TAGADIRTE** (Textile, Confection, Chaussures, Bijoux)
2. **Marouane CHAHDANE** (Lingerie, Homme / Sport, Vêtements)
3. **Raffael BUENOS AIRES** (Pôle Portugal : Chaussures, Maison & Déco, Bazar)

---

## 🗄️ Structure de la Base de Données (`Suivi_Prod-Team-Casa.xlsx`)

La base de données Supabase et le moteur local reprennent exactement les champs de votre fichier de suivi Excel :

| Colonne Application | Champ Excel | Type | Description / Valeurs Possibles |
|---|---|---|---|
| `entry_date` | Date de saisie | `DATE` | Date de détection du lot |
| `buyer` | Acheteur | `TEXT` | `Hamid AIT TAGADIRTE`, `Marouane CHAHDANE`, `Raffael BUENOS AIRES` |
| `prospector` | Prospecteur | `TEXT` | `Said`, `Andreea`, `Toby`, etc. |
| `supplier` | Nom Fournisseur | `TEXT` | Raison sociale du fournisseur (ex: *AIMSA GRUPO TEXTIL SL*) |
| `supplier_type` | Type Fournisseur | `TEXT` | `Actif`, `NEW BIZ`, `Occasionnel`, `Inactif` |
| `product` | Description du lot | `TEXT` | Volumes, détail produits, marques |
| `product_range` | Famille produit | `TEXT` | *Lingerie, Chaussures, Vêtements, Bijoux, Maison & Déco...* |
| `affaire_status` | Statut affaire | `TEXT` | `Lot`, `Prenego`, `DD` (Dossier Déposé), `CRV`, `Rejetée` |
| `offer_date` | Date de l'offre | `DATE` | Date d'émission ou de réception de l'offre |
| `offer_number` | N° Offre | `TEXT` | Référence de l'offre formelle |
| `offer_value` | VVHT Offre (€) | `NUMERIC` | Valeur de Vente Hors Taxe en Euros (€) |
| `offer_status` | Statut de l'offre | `TEXT` | `Negociation`, `Negociée + BPA`, `Negociée en attente BPA`, `Re-valorisation`, `Commandé`, `Perdue` |
| `order_value` | VVHT Commande (€) | `NUMERIC` | Valeur confirmée de la commande fermée (€) |
| `margin_rate` | Marge (%) | `NUMERIC` | Taux de marge brute réalisé (ex: `32.5%`) |
| `order_date` | Date commande | `DATE` | Date de validation de la commande |
| `notes` | Commentaire | `TEXT` | Historique horodaté des échanges, relances et modifications |

---

## 🚀 Mise en Place & Déploiement

### 1. Configuration Supabase (Base Cloud en Temps Réel)
1. Rendez-vous sur votre tableau de bord [Supabase](https://supabase.com/).
2. Créez un nouveau projet (ou utilisez un projet existant).
3. Ouvrez le **SQL Editor** (`New query`).
4. Copiez-collez l'intégralité du fichier [`supabase_schema.sql`](./supabase_schema.sql) et cliquez sur **Run**.
   - *Cela crée les tables `morocco_pipeline` et `pipeline_logs` avec les politiques RLS et insère le jeu de données initial.*
5. Récupérez dans **Project Settings > API** :
   - `Project URL` (ex: `https://xyzcompany.supabase.co`)
   - `anon public key` (clé API publique)
6. Dans l'application web, cliquez sur la roue crantée ⚙️ (**Paramètres**) en haut à droite, collez ces identifiants et cliquez sur **Enregistrer la Connexion**.
7. L'indicateur passe immédiatement à **Cloud Sync Actif 🟢**.

---

### 2. Déploiement sur GitHub & GitHub Pages (1-Click)
1. Créez un nouveau dépôt sur [GitHub](https://github.com/) (ex: `morocco-pipeline-app`).
2. Poussez le dossier de l'application :
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Morocco Purchasing Pipeline App"
   git branch -M main
   git remote add origin https://github.com/<votre-organisation>/morocco-pipeline-app.git
   git push -u origin main
   ```
3. Dans votre dépôt GitHub :
   - Rendez-vous dans **Settings > Pages**.
   - Sous **Build and deployment > Source**, sélectionnez **Deploy from a branch**.
   - Choisissez la branche `main` et le dossier `/ (root)`, puis cliquez sur **Save**.
4. Votre application est immédiatement en ligne et accessible via une URL sécurisée HTTPS !

---

### 3. Exécution en Local
Pour lancer l'application immédiatement sur votre machine :
- Double-cliquez simplement sur `index.html` pour l'ouvrir dans n'importe quel navigateur moderne (Chrome, Edge, Firefox).
- Ou lancez un mini-serveur HTTP local avec Node.js :
  ```bash
  npx serve .
  ```

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
