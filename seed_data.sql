-- ==========================================================================
-- 🇲🇦 MOROCCO PURCHASING PIPELINE - OCTOBER 2026 MISSION SEED DATA
-- Generated from: Suivi_Prod-Team-Casa.xlsx (Suivi_global + Personal Sheets)
-- Run this script in: Supabase Studio -> SQL Editor -> New Query -> Run
-- ==========================================================================

-- Ensure columns exist
ALTER TABLE morocco_pipeline ADD COLUMN IF NOT EXISTS affaire_number TEXT;
ALTER TABLE morocco_pipeline ADD COLUMN IF NOT EXISTS bpa_date DATE;
ALTER TABLE morocco_pipeline ADD COLUMN IF NOT EXISTS purchase_price NUMERIC(14, 2) DEFAULT 0.00;

-- Upsert all 37 deals from Casablanca October 2026 Mission
INSERT INTO morocco_pipeline (
    id,
    affaire_number,
    entry_date,
    buyer,
    prospector,
    supplier,
    supplier_type,
    product,
    product_range,
    affaire_status,
    dd_date,
    offer_date,
    offer_number,
    offer_value,
    offer_status,
    bpa_received,
    bpa_date,
    order_value,
    margin_value,
    margin_rate,
    order_date,
    notes,
    team
) VALUES
  (1, NULL, '2026-10-02', 'Hamid AIT TAGADIRTE', NULL, 'CONOS SCP', 'Actif', NULL, NULL, 'Prenego', NULL, NULL, NULL, 0, '', false, NULL, 0, 0, 0, NULL, '[2026-10-02 · Hamid AIT TAGADIRTE]: Actif à relancer 19/10/2026', 'Morocco'),
  (2, NULL, '2026-10-02', 'Hamid AIT TAGADIRTE', NULL, 'CREACIONES  TABERNER SL', 'NEW BIZ', NULL, NULL, 'Prenego', NULL, NULL, NULL, 0, '', false, NULL, 0, 0, 0, NULL, '[2026-10-02 · Hamid AIT TAGADIRTE]: chercher statut fournisseur et programmer relance 19/10/2026', 'Morocco'),
  (3, NULL, '2026-10-13', 'Hamid AIT TAGADIRTE', NULL, 'QUATORCE ONZAS', 'NEW BIZ', 'Mixte de vêtements pour enfants messi', 'Vêtements kids', 'CRV', NULL, NULL, NULL, 0, '', false, NULL, 0, 0, 0, NULL, '[2026-10-13 · Hamid AIT TAGADIRTE]: attente retour photo manquante pour déposer le dossier', 'Morocco'),
  (4, '5144919', '2026-10-13', 'Hamid AIT TAGADIRTE', NULL, 'INTERIORES DIBEN', 'Actif', 'Mixte de sous-vêtements pour enfants homme et femme', 'LINGERIE FEMME-SOUS VETEMENT', 'DD', '2026-10-13', NULL, NULL, 0, '', false, NULL, 0, 0, 0, NULL, '[2026-10-13 · Hamid AIT TAGADIRTE]: CRV à dépôser', 'Morocco'),
  (5, NULL, '2026-10-13', 'Hamid AIT TAGADIRTE', NULL, 'JUAN MOTERA LOPEZ', 'Actif', 'Bijoux (accessoires en palque en or)', 'Bijoux', 'CRV', NULL, NULL, NULL, 0, '', false, NULL, 0, 0, 0, NULL, '[2026-10-13 · Hamid AIT TAGADIRTE]: Attente retour CP pour les résultats des ventes du lot précedent du moi de septembre dernier. Relance à faire au CP', 'Morocco'),
  (6, '5143850', '2026-10-13', 'Hamid AIT TAGADIRTE', 'Said', 'TB KATREAL SL', 'NEW BIZ', 'Lot de chaussures', 'CHAUSSURE-ENFANT-BEBE', 'DD', '2026-10-13', '2026-10-16', '1000207641', 9719, 'Negociation', false, NULL, 0, 0, 0, NULL, '[2026-10-13 · Hamid AIT TAGADIRTE]: a négocier le 19/10/2026', 'Morocco'),
  (7, NULL, '2026-10-15', 'Hamid AIT TAGADIRTE', NULL, 'Be Sunset', 'Actif', 'Vetements', 'vetements femme', 'CRV', NULL, NULL, NULL, 0, '', false, NULL, 0, 0, 0, NULL, '[2026-10-15 · Hamid AIT TAGADIRTE]: lot detecté en attente de compléments d''info en plus clarifier la creation de l''affaire par le pros Orlandu', 'Morocco'),
  (8, NULL, '2026-10-16', 'Hamid AIT TAGADIRTE', NULL, 'SUPERBVISION OPTIK SL', 'Occasionnel', 'Lunettes de soleil', 'Accessoires', 'Prenego', NULL, NULL, NULL, 0, 'Re-valorisation', false, NULL, 0, 0, 0, NULL, '[2026-10-16 · Hamid AIT TAGADIRTE]: Dossier importé depuis Suivi_Prod-Team-Casa.xlsx', 'Morocco'),
  (9, NULL, '2026-10-16', 'Hamid AIT TAGADIRTE', NULL, 'SUNSET FASHION TRADE SL', 'Actif', 'Vétement de femme', 'vétement de femme', 'CRV', NULL, NULL, NULL, 0, '', false, NULL, 0, 0, 0, NULL, '[2026-10-16 · Hamid AIT TAGADIRTE]: Dossier importé depuis Suivi_Prod-Team-Casa.xlsx', 'Morocco'),
  (10, '5143670', '2026-10-02', 'Marouane CHAHDANE', NULL, 'AIMSA GRUPO TEXTIL SL', 'Actif', 'Mixte Lingerie', 'LINGERIE FEMME-BAIN ET BEACHWEAR', 'DD', '2026-10-02', NULL, NULL, 0, '', false, NULL, 0, 0, 0, NULL, '[2026-10-02 · Marouane CHAHDANE]: ok', 'Morocco'),
  (11, '5142847', '2026-10-02', 'Marouane CHAHDANE', NULL, 'SUC DE GENEROS DE PUNTO FRANCES SL', 'Actif', 'Mixte Lingerie + chaussure+vétement sportif', 'LINGERIE FEMME-SOUS VETEMENT', 'DD', '2026-10-02', NULL, NULL, 0, '', false, NULL, 0, 0, 0, NULL, '[2026-10-02 · Marouane CHAHDANE]: ok', 'Morocco'),
  (12, NULL, '2026-10-02', 'Marouane CHAHDANE', NULL, 'MODA PARIS MADRID SL', 'Actif', 'Mixte Lingerie femme', 'Lingerie', 'CRV', NULL, NULL, NULL, 0, '', false, NULL, 0, 0, 0, NULL, '[2026-10-02 · Marouane CHAHDANE]: En attente d’informations supplémentaires.', 'Morocco'),
  (13, NULL, '2026-10-02', 'Marouane CHAHDANE', NULL, 'MARTA DEL PILAR', 'Actif', 'Il dispose d’un lot de maillots de bain assortis, de leggings également, ainsi que une offre', 'INGERIE FEMME-BAIN ET BEACHWEAR', 'DD', '2026-10-02', '2026-06-09', '1000204810', 0, 'Closed', false, NULL, 0, 0, 0, NULL, '[2026-10-02 · Marouane CHAHDANE]: Traité par Andrei Gaspar', 'Morocco'),
  (14, NULL, '2026-10-13', 'Marouane CHAHDANE', NULL, 'BERMAS LIDE SL', 'Inactif', 'Lingerie pour hommes, chaussettes, ensemble de sport deux pièces (sweat à capuche et leggings), pyjamas pour femme', 'Lingerie,chaussures, Vêtements etc pour  homme et femme', 'Lot', NULL, NULL, NULL, 0, '', false, NULL, 0, 0, 0, NULL, '[2026-10-13 · Marouane CHAHDANE]: En attente d’informations supplémentaires.', 'Morocco'),
  (15, NULL, '2026-10-14', 'Marouane CHAHDANE', NULL, 'CONFECCIONES FINDEL SA', 'Inactif', 'Lingerie homme', 'Lingerie', 'Closed', NULL, NULL, NULL, 0, '', false, NULL, 0, 0, 0, NULL, '[2026-10-14 · Marouane CHAHDANE]: Dossier importé depuis Suivi_Prod-Team-Casa.xlsx', 'Morocco'),
  (16, NULL, '2026-10-14', 'Marouane CHAHDANE', NULL, 'CALCETINES MARBE SL', 'Occasionnel', 'Lingerie', 'Lingerie', 'Closed', NULL, NULL, NULL, 0, '', false, NULL, 0, 0, 0, NULL, '[2026-10-14 · Marouane CHAHDANE]: Dossier importé depuis Suivi_Prod-Team-Casa.xlsx', 'Morocco'),
  (17, '5141210', '2026-10-16', 'Marouane CHAHDANE', NULL, 'EGATEX', 'Actif', NULL, NULL, 'Lot', NULL, NULL, NULL, 0, '', false, NULL, 0, 0, 0, NULL, '[2026-10-16 · Marouane CHAHDANE]: A contacter lundi', 'Morocco'),
  (18, '5139566', '2026-10-16', 'Marouane CHAHDANE', NULL, 'TICSEN BCN', 'Occasionnel', 'lingerie et pyjamas', 'Lingerie, pijamas y bañadores homme et femme', 'Lot', NULL, NULL, NULL, 0, '', false, NULL, 0, 0, 0, NULL, '[2026-10-16 · Marouane CHAHDANE]: Lundi, le responsable m’enverra listing', 'Morocco'),
  (19, NULL, '2026-10-16', 'Marouane CHAHDANE', NULL, 'TOT SOL', 'Inactif', 'NEATBOX', NULL, 'Prenego', NULL, NULL, NULL, 0, '', false, NULL, 0, 0, 0, NULL, '[2026-10-16 · Marouane CHAHDANE]: En attente de repoonse', 'Morocco'),
  (20, '5141866', '2026-09-29', 'Raffael BUENOS AIRES', NULL, 'MILK DYNAMICS, LDA', 'Actif', 'DOG BISCUIT', NULL, 'Prenego', NULL, NULL, NULL, 0, 'Closed', false, NULL, 0, 0, 0, NULL, '[2026-09-29 · Raffael BUENOS AIRES]: Dossier importé depuis Suivi_Prod-Team-Casa.xlsx', 'Morocco'),
  (21, '5141297', '2026-10-07', 'Raffael BUENOS AIRES', NULL, 'SERENITY APPROACH LDA (PROSPECTION)', 'NEW BIZ', '47 FURNITURE', NULL, 'Closed', NULL, NULL, NULL, 0, '', false, NULL, 0, 0, 0, NULL, '[2026-10-07 · Raffael BUENOS AIRES]: Dossier importé depuis Suivi_Prod-Team-Casa.xlsx', 'Morocco'),
  (22, '5138070', '2026-10-07', 'Raffael BUENOS AIRES', NULL, 'JOAQUIM LIMA LDA (PROSPECTION)', 'Actif', 'MATERIAL CLOTHING', 'MERCERIE-TRICOT CROCHET ET BRODERIE', 'DD', '2026-10-07', '2026-10-07', '1000206234', 33097, 'Negociation', false, NULL, 0, 0, 0, NULL, '[2026-10-07 · Raffael BUENOS AIRES]: Dossier importé depuis Suivi_Prod-Team-Casa.xlsx', 'Morocco'),
  (23, '5141281', '2026-10-07', 'Raffael BUENOS AIRES', NULL, 'RODRIGUES & FERREIRA / MALHAS ROFER', 'Inactif', 'PULLOVERS', NULL, 'Prenego', NULL, NULL, NULL, 0, '', false, NULL, 0, 0, 0, NULL, '[2026-10-07 · Raffael BUENOS AIRES]: Dossier importé depuis Suivi_Prod-Team-Casa.xlsx', 'Morocco'),
  (24, '5141080', '2026-10-07', 'Raffael BUENOS AIRES', NULL, 'CONFECCOES CUNHA & RIBEIRO, LDA', 'Inactif', 'SWEAT BLEU', NULL, 'Closed', NULL, NULL, NULL, 0, '', false, NULL, 0, 0, 0, NULL, '[2026-10-07 · Raffael BUENOS AIRES]: Dossier importé depuis Suivi_Prod-Team-Casa.xlsx', 'Morocco'),
  (25, '5142412', '2026-10-07', 'Raffael BUENOS AIRES', NULL, 'DISLAMP - ARTIGOS DE ILUMINACAO, LDA', 'Actif', 'LUMINARIAS', NULL, 'CRV', NULL, NULL, NULL, 0, '', false, NULL, 0, 0, 0, NULL, '[2026-10-07 · Raffael BUENOS AIRES]: Dossier importé depuis Suivi_Prod-Team-Casa.xlsx', 'Morocco'),
  (26, '5144123', '2026-10-08', 'Raffael BUENOS AIRES', NULL, 'PISCATEXTIL - INDUSTRIA TEXTIL, LDA', 'Actif', 'PLAID DE COTON', 'LINGE DE MAISON-TEXTILE DECO', 'DD', '2026-10-08', '2026-10-08', '1000205676', 29990, 'Commandé', true, '2026-10-08', 29990, 0, 0, '2026-10-08', '[2026-10-08 · Raffael BUENOS AIRES]: Dossier importé depuis Suivi_Prod-Team-Casa.xlsx', 'Morocco'),
  (27, '5142061', '2026-10-09', 'Raffael BUENOS AIRES', NULL, 'DUNLOP PROTECTIVE FOOTWEAR BV', 'Actif', 'PVC BOOTS', NULL, 'DD', '2026-10-09', NULL, NULL, 0, '', false, NULL, 0, 0, 0, NULL, '[2026-10-09 · Raffael BUENOS AIRES]: Dossier importé depuis Suivi_Prod-Team-Casa.xlsx', 'Morocco'),
  (28, '5143174', '2026-10-09', 'Raffael BUENOS AIRES', NULL, 'MOVEO, LDA', 'Actif', 'COUVERTS PLASTIQUE', 'TABLE ET CUISINE-VAISSELLE PLASTIQUE', 'DD', '2026-10-09', NULL, NULL, 0, '', false, NULL, 0, 0, 0, NULL, '[2026-10-09 · Raffael BUENOS AIRES]: Dossier importé depuis Suivi_Prod-Team-Casa.xlsx', 'Morocco'),
  (29, '5143186', '2026-10-12', 'Raffael BUENOS AIRES', NULL, 'RICARDO MILTON - PRODUCAO & COMERCIO', 'Actif', 'NEATBOX', 'RANGEMENT-RANGEMENT PLASTIQUE', 'DD', '2026-10-12', NULL, NULL, 0, '', false, NULL, 0, 0, 0, NULL, '[2026-10-12 · Raffael BUENOS AIRES]: Dossier importé depuis Suivi_Prod-Team-Casa.xlsx', 'Morocco'),
  (30, '5143199', '2026-10-12', 'Raffael BUENOS AIRES', NULL, 'TOPBRANDS - GLOBAL TRADE COMPANY, UN', 'Occasionnel', 'FIDGET TOYS S2', 'JOUET-FOIRE ET RECRE', 'DD', '2026-10-12', NULL, NULL, 0, '', false, NULL, 0, 0, 0, NULL, '[2026-10-12 · Raffael BUENOS AIRES]: Dossier importé depuis Suivi_Prod-Team-Casa.xlsx', 'Morocco'),
  (31, '5143229', '2026-10-13', 'Raffael BUENOS AIRES', NULL, 'JMDUARTE LDA', 'Inactif', 'BABY CLOTHES', 'PUERICULTURE-PETITE PUERICULTURE', 'DD', '2026-10-13', NULL, NULL, 0, '', false, NULL, 0, 0, 0, NULL, '[2026-10-13 · Raffael BUENOS AIRES]: Dossier importé depuis Suivi_Prod-Team-Casa.xlsx', 'Morocco'),
  (32, '5143298', '2026-10-13', 'Raffael BUENOS AIRES', NULL, 'MUNDIAL - IMPORTACAO E EXPORTACAO, L', 'Inactif', 'SACS, STATUES', 'PAPETERIE-ECRITURE ET COLORIAGE', 'DD', '2026-10-13', NULL, NULL, 0, '', false, NULL, 0, 0, 0, NULL, '[2026-10-13 · Raffael BUENOS AIRES]: Dossier importé depuis Suivi_Prod-Team-Casa.xlsx', 'Morocco'),
  (33, '5143396', '2026-10-14', 'Raffael BUENOS AIRES', NULL, 'ESOTERICA ARTE - IMPORTACAO E EXPORTA', 'Actif', 'ENCENS', 'DECORATION-BOUGIE ET SENTEUR', 'DD', '2026-10-14', '2026-10-14', '1000207316', 14655, 'Negociation', false, NULL, 0, 0, 0, NULL, '[2026-10-14 · Raffael BUENOS AIRES]: Dossier importé depuis Suivi_Prod-Team-Casa.xlsx', 'Morocco'),
  (34, '5143720', '2026-10-14', 'Raffael BUENOS AIRES', NULL, 'POLISPORT - PLASTICOS SA', 'Actif', 'CYCLISME ACCESSOIRE', 'SPORT-CYCLISME ACCESSOIRE', 'DD', '2026-10-14', NULL, NULL, 0, '', false, NULL, 0, 0, 0, NULL, '[2026-10-14 · Raffael BUENOS AIRES]: Dossier importé depuis Suivi_Prod-Team-Casa.xlsx', 'Morocco'),
  (35, '5143628', '2026-10-14', 'Raffael BUENOS AIRES', NULL, 'PAPER POINT LDA', 'Actif', 'NOTEBOOK', 'PAPETERIE-PETIT MATERIEL SCOLAIRE BUREAU', 'DD', '2026-10-14', NULL, NULL, 0, '', false, NULL, 0, 0, 0, NULL, '[2026-10-14 · Raffael BUENOS AIRES]: Dossier importé depuis Suivi_Prod-Team-Casa.xlsx', 'Morocco'),
  (36, '5143931', '2026-10-16', 'Raffael BUENOS AIRES', NULL, 'VALUE CERAMIC', 'Inactif', 'BOWL AND PLATE', 'TABLE ET CUISINE-VAISSELLE CERAMIQUE', 'Closed', NULL, NULL, NULL, 0, '', false, NULL, 0, 0, 0, NULL, '[2026-10-16 · Raffael BUENOS AIRES]: Dossier importé depuis Suivi_Prod-Team-Casa.xlsx', 'Morocco'),
  (37, '5143914', '2026-10-16', 'Raffael BUENOS AIRES', NULL, 'INDUSTRIAS DE CONFECCOES MEFRI, LDA', 'Actif', 'SORTIMENT POUR ENFANT', 'ENFANT ADO - COMPLET ET ENSEMBLE', 'DD', '2026-10-16', '2026-10-16', '1000207826', 12098, 'Negociation', false, NULL, 0, 0, 0, NULL, '[2026-10-16 · Raffael BUENOS AIRES]: Dossier importé depuis Suivi_Prod-Team-Casa.xlsx', 'Morocco')
ON CONFLICT (id) DO UPDATE SET
    affaire_number = EXCLUDED.affaire_number,
    entry_date = EXCLUDED.entry_date,
    buyer = EXCLUDED.buyer,
    prospector = EXCLUDED.prospector,
    supplier = EXCLUDED.supplier,
    supplier_type = EXCLUDED.supplier_type,
    product = EXCLUDED.product,
    product_range = EXCLUDED.product_range,
    affaire_status = EXCLUDED.affaire_status,
    dd_date = EXCLUDED.dd_date,
    offer_date = EXCLUDED.offer_date,
    offer_number = EXCLUDED.offer_number,
    offer_value = EXCLUDED.offer_value,
    offer_status = EXCLUDED.offer_status,
    bpa_received = EXCLUDED.bpa_received,
    bpa_date = EXCLUDED.bpa_date,
    order_value = EXCLUDED.order_value,
    margin_value = EXCLUDED.margin_value,
    margin_rate = EXCLUDED.margin_rate,
    order_date = EXCLUDED.order_date,
    notes = EXCLUDED.notes,
    team = EXCLUDED.team,
    updated_at = timezone('utc'::text, now());

-- Reset serial sequence to prevent id collisions with future inserts
SELECT setval(pg_get_serial_sequence('morocco_pipeline', 'id'), coalesce(max(id), 1)) FROM morocco_pipeline;
