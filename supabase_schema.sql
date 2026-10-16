-- ==========================================================================
-- 🇲🇦 MOROCCO PURCHASING PIPELINE - SUPABASE DATABASE SCHEMA
-- Tailored to: Suivi_Prod-Team-Casa.xlsx
-- Bureau Casablanca - Iberian Market Portfolio (Spain & Portugal)
-- Run this script in: Supabase Studio -> SQL Editor -> New Query -> Run
-- ==========================================================================

-- 1. Create main pipeline table
CREATE TABLE IF NOT EXISTS morocco_pipeline (
    id BIGSERIAL PRIMARY KEY,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    buyer TEXT NOT NULL,
    prospector TEXT,
    supplier TEXT NOT NULL,
    supplier_type TEXT DEFAULT 'Actif',
    product TEXT,
    product_range TEXT,
    affaire_status TEXT DEFAULT 'DD',
    dd_date DATE,
    offer_date DATE,
    offer_number TEXT,
    offer_value NUMERIC(14, 2) DEFAULT 0.00,
    offer_status TEXT,
    bpa_received BOOLEAN DEFAULT false,
    bpa_date DATE,
    order_value NUMERIC(14, 2) DEFAULT 0.00,
    margin_value NUMERIC(14, 2) DEFAULT 0.00,
    margin_rate NUMERIC(6, 2) DEFAULT 0.00,
    order_date DATE,
    notes TEXT,
    team TEXT DEFAULT 'Morocco',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Migration support for existing tables:
ALTER TABLE morocco_pipeline ADD COLUMN IF NOT EXISTS bpa_date DATE;

-- 2. Create team activity & audit logs table (for Toby, Said, Andreea)
CREATE TABLE IF NOT EXISTS pipeline_logs (
    id BIGSERIAL PRIMARY KEY,
    deal_id BIGINT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_name TEXT NOT NULL,
    action TEXT NOT NULL,
    supplier TEXT,
    details TEXT
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE morocco_pipeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_logs ENABLE ROW LEVEL SECURITY;

-- 4. Create Public Access Policies
DROP POLICY IF EXISTS "Allow public full access on morocco_pipeline" ON morocco_pipeline;
CREATE POLICY "Allow public full access on morocco_pipeline" 
    ON morocco_pipeline FOR ALL 
    USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public full access on pipeline_logs" ON pipeline_logs;
CREATE POLICY "Allow public full access on pipeline_logs" 
    ON pipeline_logs FOR ALL 
    USING (true) WITH CHECK (true);

-- 5. Enable Real-time synchronization
ALTER PUBLICATION supabase_realtime ADD TABLE morocco_pipeline;
ALTER PUBLICATION supabase_realtime ADD TABLE pipeline_logs;

-- 6. Insert baseline records from Suivi_Prod-Team-Casa.xlsx
INSERT INTO morocco_pipeline (
    id, entry_date, buyer, prospector, supplier, supplier_type,
    product, product_range, affaire_status, offer_date, offer_number,
    offer_value, offer_status, order_value, margin_value, margin_rate, order_date, notes, team
) VALUES
    (1, '2026-10-02', 'Hamid AIT TAGADIRTE', NULL, 'CONOS SCP', 'Actif', 'Lot de cônes et fils textiles industriels', 'Textile technique', 'DD', '2026-10-08', '1000198210', 14200, 'Negociation', 0, 0, 0, NULL, '[2026-10-02 10:15 · Said]: Nouveau lot détecté auprès du fournisseur actif CONOS SCP.
[2026-10-12 14:30 · Hamid AIT TAGADIRTE]: Actif à relancer 15/10/2026 pour ajustement de l''offre.', 'Morocco'),
    (2, '2026-10-02', 'Hamid AIT TAGADIRTE', NULL, 'CREACIONES TABERNER SL', 'NEW BIZ', 'Collection confection féminine prêt-à-porter', 'Vêtements', 'Prenego', NULL, NULL, 0, NULL, 0, 0, 0, NULL, '[2026-10-02 11:20 · Said]: Fournisseur New Biz contacté sur Valence.
[2026-10-13 09:45 · Hamid AIT TAGADIRTE]: Chercher statut fournisseur et programmer relance 15/10/2026.', 'Morocco'),
    (3, '2026-10-13', 'Hamid AIT TAGADIRTE', 'Yassine', 'QUATORCE ONZAS', 'NEW BIZ', 'Mixte de vêtements pour enfants messi', 'Vêtements kids', 'DD', '2026-10-13', '1000199450', 28400, 'Negociation', 0, 0, 0, NULL, '[2026-10-13 10:00 · Andreea]: Détection confirmée stock licence officielle Messi 8 500 pcs.
[2026-10-13 16:20 · Hamid AIT TAGADIRTE]: Attente mail de confirmation d''autorisation de commercialisation de la marque Messi (relance en cours).', 'Morocco'),
    (4, '2026-10-13', 'Hamid AIT TAGADIRTE', NULL, 'INTERIORES DIBEN', 'Actif', 'Mixte de sous-vêtements pour enfants homme et femme', 'Vêtements', 'CRV', NULL, NULL, 19500, 'Negociation', 0, 0, 0, NULL, '[2026-10-13 11:15 · Hamid AIT TAGADIRTE]: CRV à déposer pour validation catégorie sous-vêtements.', 'Morocco'),
    (5, '2026-10-13', 'Hamid AIT TAGADIRTE', 'Karim', 'JUAN MOTERA LOPEZ', 'Actif', 'Bijoux (accessoires en plaqué or)', 'Bijoux', 'DD', '2026-10-10', '1000198890', 16800, 'Re-valorisation', 0, 0, 0, NULL, '[2026-10-13 14:00 · Hamid AIT TAGADIRTE]: Attente retour CP pour les résultats des ventes du lot précédent du mois de septembre dernier. Relance à faire au CP.', 'Morocco'),
    (6, '2026-10-13', 'Hamid AIT TAGADIRTE', 'Said', 'TB KATREAL SL', 'NEW BIZ', 'Lot de chaussures femme fin de série', 'Chaussures femmes', 'DD', '2026-10-14', '1000199620', 22500, 'Negociation', 0, 0, 0, NULL, '[2026-10-13 15:30 · Said]: Dossier déposé (DD) auprès de Hamid. En attente l''offre CP.', 'Morocco'),
    (7, '2026-10-02', 'Marouane CHAHDANE', 'Nadia', 'AIMSA GRUPO TEXTIL SL', 'Actif', 'Mixte Lingerie fine et corseterie', 'Lingerie', 'DD', '2026-10-09', '1000198440', 36500, 'Negociation', 0, 0, 0, NULL, '[2026-10-02 14:10 · Marouane CHAHDANE]: Besoin de détails client à contacter par tél. Mail envoyé.', 'Morocco'),
    (8, '2026-10-02', 'Marouane CHAHDANE', NULL, 'SUC DE GENEROS DE PUNTO FRANCES SL', 'Actif', 'Mixte Lingerie + chaussure + vêtement sportif', 'Lingerie', 'Prenego', NULL, NULL, 0, NULL, 0, 0, 0, NULL, '[2026-10-02 15:00 · Said]: Détection stock invendus catalogués Barcelona.', 'Morocco'),
    (9, '2026-10-02', 'Marouane CHAHDANE', NULL, 'MODA PARIS MADRID SL', 'Actif', 'Mixte Lingerie femme dentelle et nuit', 'Lingerie', 'DD', '2026-10-07', '1000198115', 29800, 'Negociée + BPA', 0, 0, 0, NULL, '[2026-10-02 16:30 · Marouane CHAHDANE]: Négociation complétée avec le gérant. BPA signé en attente d''émission PO.', 'Morocco'),
    (10, '2026-10-02', 'Marouane CHAHDANE', NULL, 'MARTA DEL PILAR', 'Actif', 'MARTA DEL PILAR lot déstockage maillots et robes', 'Vêtements', 'DD', '2026-10-08', '1000198305', 18750, 'Negociation', 0, 0, 0, NULL, '[2026-10-02 17:15 · Marouane CHAHDANE]: En cours de négociation sur les volumes restants.', 'Morocco'),
    (11, '2026-10-13', 'Marouane CHAHDANE', NULL, 'BERMAS LIDE SL', 'Actif', 'BERMAS LIDE SL lot déstockage bonneterie', 'Vêtements', 'Lot', NULL, NULL, 0, NULL, 0, 0, 0, NULL, '[2026-10-13 11:30 · Said]: Première qualification fournisseur effectuée.', 'Morocco'),
    (12, '2026-09-18', 'Hamid AIT TAGADIRTE', 'Karim', 'CALZADOS IBERICA SA', 'Actif', 'Baskets de ville cuir & sneakers sport 6 200 paires', 'Chaussures', 'DD', '2026-09-25', '1000196880', 48500, 'Commandé', 48500, 14792.5, 30.50, '2026-10-05', '[2026-09-25 11:00 · Said]: Offre validée avec le CP.
[2026-10-05 16:30 · Hamid AIT TAGADIRTE]: Commande passée et validée. Bon de commande n° PO-26-884.', 'Morocco'),
    (13, '2026-09-22', 'Hamid AIT TAGADIRTE', 'Yassine', 'TEXTIL SEVILLANA SL', 'Actif', 'Parures de lit et linge de maison 3 400 pcs', 'Maison & Déco', 'DD', '2026-09-29', '1000197215', 32000, 'Negociée en attente BPA', 0, 0, 0, NULL, '[2026-10-10 14:00 · Hamid AIT TAGADIRTE]: Offre acceptée par le fournisseur, accord de principe obtenu, en attente de la signature BPA.', 'Morocco'),
    (14, '2026-09-15', 'Hamid AIT TAGADIRTE', 'Karim', 'MODAS ALICANTE SL', 'Occasionnel', 'Robes de cérémonie été 1 200 pcs', 'Vêtements', 'DD', '2026-09-20', '1000196300', 12500, 'Perdue', 0, 0, 0, NULL, '[2026-09-28 17:00 · Hamid AIT TAGADIRTE]: Lot vendu à un concurrent local espagnol à meilleur prix.', 'Morocco'),
    (15, '2026-10-01', 'Marouane CHAHDANE', 'Nadia', 'PUNTO BLANCO DISTRIBUCION', 'Actif', 'Chaussettes homme et sport technique 45 000 paires', 'Lingerie', 'DD', '2026-10-06', '1000198020', 41200, 'Commandé', 41200, 14008, 34.00, '2026-10-12', '[2026-10-12 18:00 · Marouane CHAHDANE]: Commande confirmée et enregistrée. Marge 14 008 € (34.0%).', 'Morocco'),
    (16, '2026-10-05', 'Marouane CHAHDANE', 'Yassine', 'CORTEFIEL EXPORT SL', 'Actif', 'Chemises et polos homme fin de saison 11 000 pcs', 'Homme / Sport', 'DD', '2026-10-11', '1000199120', 54000, 'Negociée + BPA', 0, 0, 0, NULL, '[2026-10-11 16:30 · Andreea]: Réception offre fournisseur.
[2026-10-13 15:45 · Marouane CHAHDANE]: BPA validé par la direction. Dossier en forecast pour la semaine prochaine.', 'Morocco'),
    (17, '2026-09-28', 'Marouane CHAHDANE', 'Nadia', 'BODEGAS Y TEXTILES DEL SUR', 'Occasionnel', 'Accessoires de maroquinerie et ceintures', 'Maroquinerie / Bags', 'DD', '2026-10-04', '1000197890', 15300, 'Perdue', 0, 0, 0, NULL, '[2026-10-08 11:20 · Marouane CHAHDANE]: Prix plancher non négociable par le fournisseur, offre déclinée.', 'Morocco'),
    (18, '2026-10-04', 'Raffael BUENOS AIRES', 'Manuel', 'PORTO CALCADO LDA', 'Actif', 'Chaussures confort cuir et mocassins Portugal 4 200 paires', 'Chaussures', 'DD', '2026-10-09', '1000198550', 39500, 'Commandé', 39500, 12245, 31.00, '2026-10-14', '[2026-10-09 15:00 · Andreea]: Détection pôle Portugal auprès de Porto Calcado.
[2026-10-14 11:30 · Raffael BUENOS AIRES]: Commande validée aujourd''hui! Marge 12 245 € (31.0%).', 'Morocco'),
    (19, '2026-10-06', 'Raffael BUENOS AIRES', 'Manuel', 'LISBOA TEXTEIS SA', 'NEW BIZ', 'Serviettes éponge et peignoirs coton 100% 8 000 pcs', 'Maison & Déco', 'DD', '2026-10-12', '1000199290', 47800, 'Negociée + BPA', 0, 0, 0, NULL, '[2026-10-12 10:30 · Said]: Négociation menée à bien avec Lisboa Texteis.
[2026-10-14 09:20 · Raffael BUENOS AIRES]: BPA signé, déstockage prévu pour expédition fin de mois.', 'Morocco'),
    (20, '2026-10-08', 'Raffael BUENOS AIRES', 'Joao', 'COIMBRA HOMEWARE LDA', 'Actif', 'Batteries de cuisine et articles ménagers Bazar 5 500 pcs', 'Bazar', 'DD', '2026-10-13', '1000199510', 26200, 'Negociation', 0, 0, 0, NULL, '[2026-10-13 14:45 · Raffael BUENOS AIRES]: Offre reçue, discussion en cours sur la prise en charge du transport.', 'Morocco'),
    (21, '2026-10-11', 'Raffael BUENOS AIRES', 'Joao', 'MINHO CONFECCOES LDA', 'NEW BIZ', 'T-shirts et sweats sportswear unis 14 000 pcs', 'Homme / Sport', 'DD', '2026-10-14', '1000199700', 31500, 'Negociation', 0, 0, 0, NULL, '[2026-10-14 10:15 · Andreea]: Réception des échantillons à Casa. Échantillons conformes.', 'Morocco'),
    (22, '2026-10-12', 'Raffael BUENOS AIRES', 'Manuel', 'BRAGA PACKAGING & DPH', 'Inactif', 'Lots d''hygiène corporelle et cosmétiques fin de lot', 'Hygiène & DPH', 'Prenego', NULL, NULL, 0, NULL, 0, 0, 0, NULL, '[2026-10-12 16:00 · Said]: Fournisseur réactivé après 6 mois d''inactivité. Listing produits attendu sous 48h.', 'Morocco'),
    (23, '2026-09-20', 'Raffael BUENOS AIRES', NULL, 'AVEIRO CERAMICAS SA', 'Actif', 'Vaisselle et services de table céramique 22 palettes', 'Maison & Déco', 'DD', '2026-09-27', '1000197050', 21000, 'Perdue', 0, 0, 0, NULL, '[2026-10-02 12:00 · Raffael BUENOS AIRES]: Fournisseur a trouvé un repreneur direct au Portugal.', 'Morocco');

-- Reset primary key sequence to maximum id
SELECT setval('morocco_pipeline_id_seq', (SELECT MAX(id) FROM morocco_pipeline));

-- 7. Insert initial team logs
INSERT INTO pipeline_logs (deal_id, timestamp, user_name, action, supplier, details) VALUES
    (6, '2026-10-13 16:45:00+00', 'Said', 'Statut Affaire', 'TB KATREAL SL', 'Dossier Déposé (DD) transmis à l''acheteur Hamid · En attente offre CP'),
    (4, '2026-10-13 15:20:00+00', 'Hamid AIT TAGADIRTE', 'Note Suivi', 'INTERIORES DIBEN', 'CRV à déposer pour le lot sous-vêtements'),
    (3, '2026-10-13 14:10:00+00', 'Andreea', 'Relance Fournisseur', 'QUATORCE ONZAS', 'Attente mail de confirmation d''autorisation de marque Messi'),
    (7, '2026-10-12 11:30:00+00', 'Toby', 'Création Détection', 'AIMSA GRUPO TEXTIL SL', 'Attribué à Marouane CHAHDANE · Catégorie Lingerie'),
    (18, '2026-10-14 11:35:00+00', 'Raffael BUENOS AIRES', 'Commande Validée', 'PORTO CALCADO LDA', 'Commande confirmée 39 500 € · Marge 12 245 € (31%)');
