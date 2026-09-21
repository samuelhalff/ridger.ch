#!/usr/bin/env python3
"""Translate references[].labelKey from French to DE/ES/PT in ressources.json files."""

import json
import sys

# ------------------------------------------------------------------
# Translation maps: FR → DE, FR → ES, FR → PT
# ------------------------------------------------------------------

DE = {
    # CFA / international
    "CFA Institute – Global Investment Performance Standards (GIPS)":
        "CFA Institute – Global Investment Performance Standards (GIPS)",

    # Conférence suisse des impôts
    "Conférence suisse des impôts – Impôt sur les successions":
        "Schweizerische Steuerkonferenz (SSK) – Erbschaftssteuer",

    # Deloitte
    "Deloitte Suisse – Family Office & Art":
        "Deloitte Schweiz – Family Office & Art",
    "Deloitte Suisse – LSFin/LEFin pour les family offices":
        "Deloitte Schweiz – FIDLEG/FINIG für Family Offices",
    "Deloitte Suisse – Multi Family Office":
        "Deloitte Schweiz – Multi Family Office",
    "Deloitte – Digital Family Office":
        "Deloitte – Digitales Family Office",
    "Deloitte – Family Governance Framework":
        "Deloitte – Family Governance Framework",
    "Deloitte – Family Office Cost Benchmarking":
        "Deloitte – Family Office Kosten-Benchmarking",
    "Deloitte – Global Family Office Survey":
        "Deloitte – Global Family Office Survey",
    "Deloitte — The Family Office Insights Series":
        "Deloitte — The Family Office Insights Series",

    # ESTV
    "ESTV – Déductibilité des dons à des institutions d'utilité publique":
        "ESTV – Abzugsfähigkeit von Zuwendungen an gemeinnützige Institutionen",
    "ESTV – Délais et échéances de l'impôt fédéral direct":
        "ESTV – Fristen und Fälligkeiten der direkten Bundessteuer",
    "ESTV – Fiscalité des sociétés holding":
        "ESTV – Besteuerung von Holdinggesellschaften",
    "ESTV – Imposition d'après la dépense (art. 14 LIFD)":
        "ESTV – Aufwandbesteuerung (Art. 14 DBG)",
    "ESTV – Impôt sur la fortune : actifs mobiliers":
        "ESTV – Vermögenssteuer: bewegliches Vermögen",
    "ESTV – Obligations déclaratives et documentation fiscale":
        "ESTV – Deklarationspflichten und Steuerdokumentation",
    "ESTV – Valeur locative (Eigenmietwert)":
        "ESTV – Eigenmietwert",

    # EY
    "EY Suisse – Family Office best practices":
        "EY Schweiz – Family Office Best Practices",
    "EY Suisse – Family Office et coordination":
        "EY Schweiz – Family Office und Koordination",
    "EY Suisse – Philanthropie et planification patrimoniale":
        "EY Schweiz – Philanthropie und Vermögensplanung",
    "EY Suisse – Tax Calendar Switzerland":
        "EY Schweiz – Steuerkalender Schweiz",
    "EY – Family Enterprise Governance":
        "EY – Family Enterprise Governance",
    "EY – Family Enterprise Survey":
        "EY – Family Enterprise Survey",

    # FINMA
    "FINMA – Cybersécurité et risques opérationnels":
        "FINMA – Cybersicherheit und operationelle Risiken",
    "FINMA – Directive sur la gestion de fortune":
        "FINMA – Richtlinie zur Vermögensverwaltung",
    "FINMA – Liste des banques agréées":
        "FINMA – Liste der bewilligten Banken",
    "FINMA – Obligations de diligence et documentation":
        "FINMA – Sorgfaltspflichten und Dokumentation",
    "FINMA – Reconnaissance des trusts étrangers":
        "FINMA – Anerkennung ausländischer Trusts",
    "FINMA – Risques opérationnels et cybersécurité":
        "FINMA – Operationelle Risiken und Cybersicherheit",
    "FINMA – Surveillance des gestionnaires de fortune":
        "FINMA – Aufsicht über Vermögensverwalter",
    "FINMA – Surveillance des établissements financiers":
        "FINMA – Aufsicht über Finanzinstitute",
    "FINMA – Transparence des frais (LSFin)":
        "FINMA – Kostentransparenz (FIDLEG)",
    "FINMA – Transparence des frais et rétrocessions":
        "FINMA – Kostentransparenz und Retrozessionen",
    "FINMA – Établissements financiers et surveillance":
        "FINMA – Finanzinstitute und Aufsicht",
    "FINMA — Autorité fédérale de surveillance des marchés financiers":
        "FINMA — Eidgenössische Finanzmarktaufsicht",

    # Fedlex
    "Fedlex – Code civil suisse (droit des personnes et de la famille)":
        "Fedlex – Schweizerisches Zivilgesetzbuch (Personen- und Familienrecht)",
    "Fedlex – Code civil suisse (succession)":
        "Fedlex – Schweizerisches Zivilgesetzbuch (Erbrecht)",
    "Fedlex – Code civil suisse, Livre III : Successions":
        "Fedlex – Schweizerisches Zivilgesetzbuch, Teil III: Erbrecht",
    "Fedlex – Convention de La Haye sur les trusts (RS 0.221.371)":
        "Fedlex – Haager Übereinkommen über Trusts (SR 0.221.371)",
    "Fedlex – LIFD (acomptes et délais de paiement)":
        "Fedlex – DBG (Vorauszahlungen und Zahlungsfristen)",
    "Fedlex – LIFD (revenus de la fortune immobilière)":
        "Fedlex – DBG (Einkünfte aus unbeweglichem Vermögen)",
    "Fedlex – LIFD art. 14":
        "Fedlex – DBG Art. 14",
    "Fedlex – LIFD art. 33a (dons)":
        "Fedlex – DBG Art. 33a (Zuwendungen)",
    "Fedlex – Loi fédérale sur la protection des données (nLPD)":
        "Fedlex – Bundesgesetz über den Datenschutz (nDSG)",
    "Fedlex – Loi sur la protection des données (LPD)":
        "Fedlex – Datenschutzgesetz (DSG)",
    "Fedlex – Loi sur le transfert international des biens culturels (LTBC)":
        "Fedlex – Bundesgesetz über den internationalen Kulturgütertransfer (KGTG)",
    "Fedlex – Loi sur les fondations (CC art. 80 ss)":
        "Fedlex – Stiftungsrecht (ZGB Art. 80 ff.)",
    "Fedlex – Loi sur les services financiers (LSFin)":
        "Fedlex – Bundesgesetz über die Finanzdienstleistungen (FIDLEG)",
    "Fedlex – Loi sur les établissements financiers (LEFin)":
        "Fedlex – Bundesgesetz über die Finanzinstitute (FINIG)",
    "Loi sur les établissements financiers (LEFin) – Fedlex":
        "Bundesgesetz über die Finanzinstitute (FINIG) – Fedlex",

    # Julius Baer
    "Julius Baer – Family Office Services":
        "Julius Baer – Family Office Services",

    # KPMG
    "KPMG Suisse – Compliance calendar":
        "KPMG Schweiz – Compliance-Kalender",
    "KPMG Suisse – Enjeux patrimoniaux des familles":
        "KPMG Schweiz – Vermögensplanung für Familien",
    "KPMG Suisse – Private Clients":
        "KPMG Schweiz – Privatkunden",
    "KPMG Suisse – Real Estate & Wealth":
        "KPMG Schweiz – Immobilien & Vermögen",
    "KPMG – Family Office Services Switzerland":
        "KPMG – Family Office Services Schweiz",
    "KPMG – Private Wealth Switzerland":
        "KPMG – Private Wealth Schweiz",

    # Federal offices
    "OFCS – Centre national pour la cybersécurité (NCSC)":
        "BACS – Nationales Zentrum für Cybersicherheit (NCSC)",
    "OFDF – Ports francs et dépôts francs en Suisse":
        "BAZG – Freizonen und Zollfreilager in der Schweiz",
    "OSFIN – Organisme de surveillance des gestionnaires de fortune":
        "OSFIN – Aufsichtsorganisation für Vermögensverwalter",
    "Office fédéral de la justice – Droit successoral":
        "Bundesamt für Justiz (BJ) – Erbrecht",

    # Pictet
    "Pictet – Gestion de fortune en Suisse":
        "Pictet – Vermögensverwaltung in der Schweiz",
    "Pictet – Standards de mesure de performance":
        "Pictet – Performance-Messstandards",

    # PFPDT
    "Préposé fédéral à la protection des données (PFPDT) – LPD":
        "Eidgenössischer Datenschutz- und Öffentlichkeitsbeauftragter (EDÖB) – DSG",

    # PwC
    "PwC Suisse – Family Office Onboarding":
        "PwC Schweiz – Family Office Onboarding",
    "PwC Suisse – Family Office Reporting":
        "PwC Schweiz – Family Office Reporting",
    "PwC Suisse – Fiscalité immobilière privée":
        "PwC Schweiz – Private Immobilienbesteuerung",
    "PwC Suisse – Imposition forfaitaire":
        "PwC Schweiz – Pauschalbesteuerung",
    "PwC Suisse – Structures patrimoniales":
        "PwC Schweiz – Vermögensstrukturen",
    "PwC Suisse — Family Offices":
        "PwC Schweiz — Family Offices",

    # SECO
    "SECO – Gouvernance d'entreprise familiale":
        "SECO – Corporate Governance für Familienunternehmen",
    "SECO – Obligations légales des sociétés anonymes":
        "SECO – Gesetzliche Pflichten der Aktiengesellschaft",

    # SIF
    "SIF – Conventions de double imposition":
        "SIF – Doppelbesteuerungsabkommen",

    # SNB
    "SNB – Marché immobilier et stabilité financière":
        "SNB – Immobilienmarkt und Finanzstabilität",
    "SNB – Rapport sur la stabilité financière":
        "SNB – Bericht zur Finanzstabilität",
    "SNB – Rapport sur la stabilité financière 2024":
        "SNB – Bericht zur Finanzstabilität 2024",
    "SNB – Stabilité financière et innovation":
        "SNB – Finanzstabilität und Innovation",
    "SNB – Statistiques des marchés financiers":
        "SNB – Statistiken der Finanzmärkte",
    "SNB – Statistiques financières":
        "SNB – Finanzstatistiken",

    # Swiss Banking
    "Swiss Banking – Code de conduite":
        "Swiss Banking – Verhaltenskodex",
    "Swiss Banking – Qualité et standards du conseil":
        "Swiss Banking – Beratungsqualität und Standards",
    "Swiss Banking – Sécurité des dépôts":
        "Swiss Banking – Einlagensicherung",
    "Swiss Family Office Association":
        "Swiss Family Office Association",
    "SwissBanking — Association suisse des banquiers":
        "SwissBanking — Schweizerische Bankiervereinigung",

    # UBS
    "UBS Global Family Office Report 2024":
        "UBS Global Family Office Report 2024",
    "UBS – Art Banking et collections privées":
        "UBS – Art Banking und Privatsammlungen",
    "UBS – Family Office Report":
        "UBS – Family Office Report",
    "UBS – Philanthropie et family office":
        "UBS – Philanthropie und Family Office",
    "UBS – Sécurité numérique pour clients privés":
        "UBS – Digitale Sicherheit für Privatkunden",

    # Zewo
    "Zewo – Certification des organisations d'utilité publique":
        "Zewo – Zertifizierung gemeinnütziger Organisationen",

    # ahv-iv.ch
    "ahv-iv.ch — Mémento 2.01 Cotisations salariales AVS/AI/APG":
        "ahv-iv.ch — Merkblatt 2.01 AHV/IV/EO-Beiträge für Arbeitnehmende",
    "ahv-iv.ch — Mémento 2.06 Travail domestique":
        "ahv-iv.ch — Merkblatt 2.06 Haushaltsarbeit",

    # bag.admin.ch
    "bag.admin.ch — Assurance obligatoire des soins (OFSP)":
        "bag.admin.ch — Obligatorische Krankenpflegeversicherung (BAG)",

    # ch.ch
    "ch.ch — Assurance-maladie obligatoire":
        "ch.ch — Obligatorische Krankenkasse",
    "ch.ch — Circuler en Suisse avec un permis de conduire étranger":
        "ch.ch — Fahren in der Schweiz mit ausländischem Führerausweis",
    "ch.ch — Permis de séjour et autorisations de travail":
        "ch.ch — Aufenthalts- und Arbeitsbewilligungen",

    # edu.ge.ch
    "edu.ge.ch — Département de l'instruction publique (DIP)":
        "edu.ge.ch — Département de l'instruction publique (DIP)",

    # esisuisse
    "esisuisse – Garantie des dépôts en Suisse":
        "esisuisse – Einlagensicherung in der Schweiz",

    # estv.admin.ch
    "estv.admin.ch — Impôt à la source (AFC)":
        "estv.admin.ch — Quellensteuer (ESTV)",

    # fedlex.admin.ch
    "fedlex.admin.ch — Accord sur la libre circulation des personnes (ALCP)":
        "fedlex.admin.ch — Abkommen über die Personenfreizügigkeit (AoFZA)",
    "fedlex.admin.ch — Code civil suisse (CC)":
        "fedlex.admin.ch — Schweizerisches Zivilgesetzbuch (ZGB)",
    "fedlex.admin.ch — Code des obligations (bail à loyer)":
        "fedlex.admin.ch — Obligationenrecht (Mietrecht)",
    "fedlex.admin.ch — Code des obligations (contrat d'entreprise)":
        "fedlex.admin.ch — Obligationenrecht (Werkvertrag)",
    "fedlex.admin.ch — Code des obligations (mandat)":
        "fedlex.admin.ch — Obligationenrecht (Auftragsrecht)",
    "fedlex.admin.ch — Loi fédérale sur l'impôt fédéral direct (LIFD)":
        "fedlex.admin.ch — Bundesgesetz über die direkte Bundessteuer (DBG)",
    "fedlex.admin.ch — Loi fédérale sur les étrangers et l'intégration (LEI)":
        "fedlex.admin.ch — Bundesgesetz über die Ausländerinnen und Ausländer und über die Integration (AIG)",
    "fedlex.admin.ch — Loi sur l'assurance-accidents (LAA)":
        "fedlex.admin.ch — Bundesgesetz über die Unfallversicherung (UVG)",
    "fedlex.admin.ch — Loi sur l'harmonisation des impôts directs (LHID)":
        "fedlex.admin.ch — Bundesgesetz über die Harmonisierung der direkten Steuern (StHG)",
    "fedlex.admin.ch — Loi sur la prévoyance professionnelle (LPP)":
        "fedlex.admin.ch — Bundesgesetz über die berufliche Vorsorge (BVG)",
    "fedlex.admin.ch — Ordonnance sur le bail à loyer (OBLF)":
        "fedlex.admin.ch — Verordnung über die Miete (VMWG)",

    # ge.ch
    "ge.ch — Annoncer mon arrivée à l'OCPM":
        "ge.ch — Anmeldung bei der OCPM (Kantonales Bevölkerungs- und Migrationsamt)",
    "ge.ch — Annoncer un changement d'adresse":
        "ge.ch — Adressänderung melden",
    "ge.ch — Assurance-maladie":
        "ge.ch — Krankenversicherung",
    "ge.ch — Bases légales et directives (autorisation de construire)":
        "ge.ch — Rechtsgrundlagen und Richtlinien (Baubewilligung)",
    "ge.ch — Chèque-service : un soutien administratif":
        "ge.ch — Chèque-service: administrative Unterstützung",
    "ge.ch — Conditions et obligations à respecter":
        "ge.ch — Bedingungen und Pflichten",
    "ge.ch — Demander une autorisation de construire":
        "ge.ch — Baubewilligung beantragen",
    "ge.ch — Déclarer son personnel de maison aux impôts":
        "ge.ch — Hauspersonal bei der Steuer deklarieren",
    "ge.ch — Déclarer votre employé aux assurances sociales":
        "ge.ch — Mitarbeitende bei der Sozialversicherung anmelden",
    "ge.ch — Département de l'instruction publique, de la formation et de la jeunesse":
        "ge.ch — Département de l'instruction publique, de la formation et de la jeunesse (DIP)",
    "ge.ch — Employer du personnel de maison":
        "ge.ch — Hauspersonal beschäftigen",
    "ge.ch — Gérer le chantier":
        "ge.ch — Baustelle verwalten",
    "ge.ch — Impôt à la source":
        "ge.ch — Quellensteuer",
    "ge.ch — Les CTT en vigueur à Genève":
        "ge.ch — Geltende Normalarbeitsverträge (NAV) in Genf",
    "ge.ch — Office cantonal de la population et des migrations (OCPM)":
        "ge.ch — Kantonales Amt für Bevölkerung und Migration (OCPM)",
    "ge.ch — Office cantonal des véhicules (OCV)":
        "ge.ch — Kantonales Strassenverkehrsamt (OCV)",
    "ge.ch — Registre du commerce":
        "ge.ch — Handelsregister",
    "ge.ch — Scolarité obligatoire":
        "ge.ch — Schulpflicht",
    "ge.ch — Échanger un permis de conduire étranger":
        "ge.ch — Ausländischen Führerausweis umtauschen",

    # justice.ge.ch
    "justice.ge.ch — Tribunal des baux et loyers":
        "justice.ge.ch — Mietgericht (Tribunal des baux et loyers)",

    # priminfo
    "priminfo.admin.ch — Primes de l'assurance-maladie (OFSP)":
        "priminfo.admin.ch — Krankenkassenprämien (BAG)",

    # sem.admin.ch
    "sem.admin.ch — Vivre et travailler en Suisse (types d'autorisations)":
        "sem.admin.ch — Leben und Arbeiten in der Schweiz (Bewilligungsarten)",
}

ES = {
    # CFA / international
    "CFA Institute – Global Investment Performance Standards (GIPS)":
        "CFA Institute – Global Investment Performance Standards (GIPS)",

    # Conférence suisse des impôts
    "Conférence suisse des impôts – Impôt sur les successions":
        "Conferencia Fiscal Suiza (SSK) – Impuesto sobre sucesiones",

    # Deloitte
    "Deloitte Suisse – Family Office & Art":
        "Deloitte Suiza – Family Office y Arte",
    "Deloitte Suisse – LSFin/LEFin pour les family offices":
        "Deloitte Suiza – LSFin/LEFin para family offices",
    "Deloitte Suisse – Multi Family Office":
        "Deloitte Suiza – Multi Family Office",
    "Deloitte – Digital Family Office":
        "Deloitte – Family Office Digital",
    "Deloitte – Family Governance Framework":
        "Deloitte – Marco de Gobernanza Familiar",
    "Deloitte – Family Office Cost Benchmarking":
        "Deloitte – Benchmarking de Costes del Family Office",
    "Deloitte – Global Family Office Survey":
        "Deloitte – Encuesta Global de Family Offices",
    "Deloitte — The Family Office Insights Series":
        "Deloitte — The Family Office Insights Series",

    # ESTV
    "ESTV – Déductibilité des dons à des institutions d'utilité publique":
        "AFC – Deducibilidad de donaciones a instituciones de utilidad pública",
    "ESTV – Délais et échéances de l'impôt fédéral direct":
        "AFC – Plazos y vencimientos del impuesto federal directo",
    "ESTV – Fiscalité des sociétés holding":
        "AFC – Fiscalidad de las sociedades holding",
    "ESTV – Imposition d'après la dépense (art. 14 LIFD)":
        "AFC – Tributación a tanto alzado (art. 14 LIFD)",
    "ESTV – Impôt sur la fortune : actifs mobiliers":
        "AFC – Impuesto sobre el patrimonio: activos mobiliarios",
    "ESTV – Obligations déclaratives et documentation fiscale":
        "AFC – Obligaciones declarativas y documentación fiscal",
    "ESTV – Valeur locative (Eigenmietwert)":
        "AFC – Valor locativo (Eigenmietwert)",

    # EY
    "EY Suisse – Family Office best practices":
        "EY Suiza – Mejores prácticas para Family Offices",
    "EY Suisse – Family Office et coordination":
        "EY Suiza – Family Office y coordinación",
    "EY Suisse – Philanthropie et planification patrimoniale":
        "EY Suiza – Filantropía y planificación patrimonial",
    "EY Suisse – Tax Calendar Switzerland":
        "EY Suiza – Calendario Fiscal Suiza",
    "EY – Family Enterprise Governance":
        "EY – Gobernanza de Empresas Familiares",
    "EY – Family Enterprise Survey":
        "EY – Encuesta de Empresas Familiares",

    # FINMA
    "FINMA – Cybersécurité et risques opérationnels":
        "FINMA – Ciberseguridad y riesgos operacionales",
    "FINMA – Directive sur la gestion de fortune":
        "FINMA – Directiva sobre gestión patrimonial",
    "FINMA – Liste des banques agréées":
        "FINMA – Lista de bancos autorizados",
    "FINMA – Obligations de diligence et documentation":
        "FINMA – Obligaciones de diligencia y documentación",
    "FINMA – Reconnaissance des trusts étrangers":
        "FINMA – Reconocimiento de trusts extranjeros",
    "FINMA – Risques opérationnels et cybersécurité":
        "FINMA – Riesgos operacionales y ciberseguridad",
    "FINMA – Surveillance des gestionnaires de fortune":
        "FINMA – Supervisión de gestores de patrimonio",
    "FINMA – Surveillance des établissements financiers":
        "FINMA – Supervisión de entidades financieras",
    "FINMA – Transparence des frais (LSFin)":
        "FINMA – Transparencia de costes (LSFin)",
    "FINMA – Transparence des frais et rétrocessions":
        "FINMA – Transparencia de costes y retrocesiones",
    "FINMA – Établissements financiers et surveillance":
        "FINMA – Entidades financieras y supervisión",
    "FINMA — Autorité fédérale de surveillance des marchés financiers":
        "FINMA — Autoridad Federal de Supervisión de los Mercados Financieros",

    # Fedlex
    "Fedlex – Code civil suisse (droit des personnes et de la famille)":
        "Fedlex – Código Civil suizo (derecho de personas y familia)",
    "Fedlex – Code civil suisse (succession)":
        "Fedlex – Código Civil suizo (derecho sucesorio)",
    "Fedlex – Code civil suisse, Livre III : Successions":
        "Fedlex – Código Civil suizo, Libro III: Sucesiones",
    "Fedlex – Convention de La Haye sur les trusts (RS 0.221.371)":
        "Fedlex – Convenio de La Haya sobre trusts (RS 0.221.371)",
    "Fedlex – LIFD (acomptes et délais de paiement)":
        "Fedlex – LIFD (pagos anticipados y plazos de pago)",
    "Fedlex – LIFD (revenus de la fortune immobilière)":
        "Fedlex – LIFD (rendimientos del patrimonio inmobiliario)",
    "Fedlex – LIFD art. 14":
        "Fedlex – LIFD art. 14",
    "Fedlex – LIFD art. 33a (dons)":
        "Fedlex – LIFD art. 33a (donaciones)",
    "Fedlex – Loi fédérale sur la protection des données (nLPD)":
        "Fedlex – Ley Federal de Protección de Datos (nLPD)",
    "Fedlex – Loi sur la protection des données (LPD)":
        "Fedlex – Ley de Protección de Datos (LPD)",
    "Fedlex – Loi sur le transfert international des biens culturels (LTBC)":
        "Fedlex – Ley sobre la transferencia internacional de bienes culturales (LTBC)",
    "Fedlex – Loi sur les fondations (CC art. 80 ss)":
        "Fedlex – Derecho de fundaciones (CC art. 80 ss.)",
    "Fedlex – Loi sur les services financiers (LSFin)":
        "Fedlex – Ley de Servicios Financieros (LSFin)",
    "Fedlex – Loi sur les établissements financiers (LEFin)":
        "Fedlex – Ley de Entidades Financieras (LEFin)",
    "Loi sur les établissements financiers (LEFin) – Fedlex":
        "Ley de Entidades Financieras (LEFin) – Fedlex",

    # Julius Baer
    "Julius Baer – Family Office Services":
        "Julius Baer – Servicios Family Office",

    # KPMG
    "KPMG Suisse – Compliance calendar":
        "KPMG Suiza – Calendario de cumplimiento normativo",
    "KPMG Suisse – Enjeux patrimoniaux des familles":
        "KPMG Suiza – Gestión patrimonial familiar",
    "KPMG Suisse – Private Clients":
        "KPMG Suiza – Clientes privados",
    "KPMG Suisse – Real Estate & Wealth":
        "KPMG Suiza – Inmobiliario y Patrimonio",
    "KPMG – Family Office Services Switzerland":
        "KPMG – Servicios Family Office Suiza",
    "KPMG – Private Wealth Switzerland":
        "KPMG – Patrimonio Privado Suiza",

    # Federal offices
    "OFCS – Centre national pour la cybersécurité (NCSC)":
        "OFCS – Centro Nacional de Ciberseguridad (NCSC)",
    "OFDF – Ports francs et dépôts francs en Suisse":
        "OFDF – Zonas francas y depósitos francos en Suiza",
    "OSFIN – Organisme de surveillance des gestionnaires de fortune":
        "OSFIN – Organismo de supervisión de gestores de patrimonio",
    "Office fédéral de la justice – Droit successoral":
        "Oficina Federal de Justicia (OFJ) – Derecho sucesorio",

    # Pictet
    "Pictet – Gestion de fortune en Suisse":
        "Pictet – Gestión patrimonial en Suiza",
    "Pictet – Standards de mesure de performance":
        "Pictet – Estándares de medición del rendimiento",

    # PFPDT
    "Préposé fédéral à la protection des données (PFPDT) – LPD":
        "Comisionado Federal de Protección de Datos (PFPDT) – LPD",

    # PwC
    "PwC Suisse – Family Office Onboarding":
        "PwC Suiza – Incorporación de Family Offices",
    "PwC Suisse – Family Office Reporting":
        "PwC Suiza – Reporting de Family Offices",
    "PwC Suisse – Fiscalité immobilière privée":
        "PwC Suiza – Fiscalidad inmobiliaria privada",
    "PwC Suisse – Imposition forfaitaire":
        "PwC Suiza – Tributación a tanto alzado",
    "PwC Suisse – Structures patrimoniales":
        "PwC Suiza – Estructuras patrimoniales",
    "PwC Suisse — Family Offices":
        "PwC Suiza — Family Offices",

    # SECO
    "SECO – Gouvernance d'entreprise familiale":
        "SECO – Gobernanza de empresas familiares",
    "SECO – Obligations légales des sociétés anonymes":
        "SECO – Obligaciones legales de las sociedades anónimas",

    # SIF
    "SIF – Conventions de double imposition":
        "SIF – Convenios para evitar la doble imposición",

    # SNB
    "SNB – Marché immobilier et stabilité financière":
        "SNB – Mercado inmobiliario y estabilidad financiera",
    "SNB – Rapport sur la stabilité financière":
        "SNB – Informe sobre estabilidad financiera",
    "SNB – Rapport sur la stabilité financière 2024":
        "SNB – Informe sobre estabilidad financiera 2024",
    "SNB – Stabilité financière et innovation":
        "SNB – Estabilidad financiera e innovación",
    "SNB – Statistiques des marchés financiers":
        "SNB – Estadísticas de los mercados financieros",
    "SNB – Statistiques financières":
        "SNB – Estadísticas financieras",

    # Swiss Banking
    "Swiss Banking – Code de conduite":
        "Swiss Banking – Código de conducta",
    "Swiss Banking – Qualité et standards du conseil":
        "Swiss Banking – Calidad y estándares de asesoramiento",
    "Swiss Banking – Sécurité des dépôts":
        "Swiss Banking – Garantía de depósitos",
    "Swiss Family Office Association":
        "Swiss Family Office Association",
    "SwissBanking — Association suisse des banquiers":
        "SwissBanking — Asociación Suiza de Banqueros",

    # UBS
    "UBS Global Family Office Report 2024":
        "UBS Global Family Office Report 2024",
    "UBS – Art Banking et collections privées":
        "UBS – Art Banking y colecciones privadas",
    "UBS – Family Office Report":
        "UBS – Family Office Report",
    "UBS – Philanthropie et family office":
        "UBS – Filantropía y family office",
    "UBS – Sécurité numérique pour clients privés":
        "UBS – Seguridad digital para clientes privados",

    # Zewo
    "Zewo – Certification des organisations d'utilité publique":
        "Zewo – Certificación de organizaciones de utilidad pública",

    # ahv-iv.ch
    "ahv-iv.ch — Mémento 2.01 Cotisations salariales AVS/AI/APG":
        "ahv-iv.ch — Memorándum 2.01 Cotizaciones salariales AHV/IV/EO",
    "ahv-iv.ch — Mémento 2.06 Travail domestique":
        "ahv-iv.ch — Memorándum 2.06 Trabajo doméstico",

    # bag.admin.ch
    "bag.admin.ch — Assurance obligatoire des soins (OFSP)":
        "bag.admin.ch — Seguro obligatorio de enfermedad (OFSP)",

    # ch.ch
    "ch.ch — Assurance-maladie obligatoire":
        "ch.ch — Seguro de enfermedad obligatorio",
    "ch.ch — Circuler en Suisse avec un permis de conduire étranger":
        "ch.ch — Conducir en Suiza con permiso de conducir extranjero",
    "ch.ch — Permis de séjour et autorisations de travail":
        "ch.ch — Permisos de residencia y autorizaciones de trabajo",

    # edu.ge.ch
    "edu.ge.ch — Département de l'instruction publique (DIP)":
        "edu.ge.ch — Departamento de Instrucción Pública (DIP)",

    # esisuisse
    "esisuisse – Garantie des dépôts en Suisse":
        "esisuisse – Garantía de depósitos en Suiza",

    # estv.admin.ch
    "estv.admin.ch — Impôt à la source (AFC)":
        "estv.admin.ch — Impuesto en la fuente (AFC)",

    # fedlex.admin.ch
    "fedlex.admin.ch — Accord sur la libre circulation des personnes (ALCP)":
        "fedlex.admin.ch — Acuerdo sobre la libre circulación de personas (ALCP)",
    "fedlex.admin.ch — Code civil suisse (CC)":
        "fedlex.admin.ch — Código Civil suizo (CC)",
    "fedlex.admin.ch — Code des obligations (bail à loyer)":
        "fedlex.admin.ch — Código de Obligaciones (arrendamiento)",
    "fedlex.admin.ch — Code des obligations (contrat d'entreprise)":
        "fedlex.admin.ch — Código de Obligaciones (contrato de obra)",
    "fedlex.admin.ch — Code des obligations (mandat)":
        "fedlex.admin.ch — Código de Obligaciones (mandato)",
    "fedlex.admin.ch — Loi fédérale sur l'impôt fédéral direct (LIFD)":
        "fedlex.admin.ch — Ley Federal sobre el Impuesto Federal Directo (LIFD)",
    "fedlex.admin.ch — Loi fédérale sur les étrangers et l'intégration (LEI)":
        "fedlex.admin.ch — Ley Federal sobre Extranjeros e Integración (LEI)",
    "fedlex.admin.ch — Loi sur l'assurance-accidents (LAA)":
        "fedlex.admin.ch — Ley sobre el Seguro de Accidentes (LAA)",
    "fedlex.admin.ch — Loi sur l'harmonisation des impôts directs (LHID)":
        "fedlex.admin.ch — Ley de Armonización de los Impuestos Directos (LHID)",
    "fedlex.admin.ch — Loi sur la prévoyance professionnelle (LPP)":
        "fedlex.admin.ch — Ley sobre la Previsión Profesional (LPP)",
    "fedlex.admin.ch — Ordonnance sur le bail à loyer (OBLF)":
        "fedlex.admin.ch — Ordenanza sobre arrendamiento (OBLF)",

    # ge.ch
    "ge.ch — Annoncer mon arrivée à l'OCPM":
        "ge.ch — Notificar mi llegada a la OCPM",
    "ge.ch — Annoncer un changement d'adresse":
        "ge.ch — Notificar un cambio de domicilio",
    "ge.ch — Assurance-maladie":
        "ge.ch — Seguro de enfermedad",
    "ge.ch — Bases légales et directives (autorisation de construire)":
        "ge.ch — Bases legales y directrices (permiso de construcción)",
    "ge.ch — Chèque-service : un soutien administratif":
        "ge.ch — Chèque-service: apoyo administrativo",
    "ge.ch — Conditions et obligations à respecter":
        "ge.ch — Condiciones y obligaciones a cumplir",
    "ge.ch — Demander une autorisation de construire":
        "ge.ch — Solicitar permiso de construcción",
    "ge.ch — Déclarer son personnel de maison aux impôts":
        "ge.ch — Declarar el personal doméstico en impuestos",
    "ge.ch — Déclarer votre employé aux assurances sociales":
        "ge.ch — Inscribir al empleado en la seguridad social",
    "ge.ch — Département de l'instruction publique, de la formation et de la jeunesse":
        "ge.ch — Departamento de Instrucción Pública, Formación y Juventud (DIP)",
    "ge.ch — Employer du personnel de maison":
        "ge.ch — Emplear personal doméstico",
    "ge.ch — Gérer le chantier":
        "ge.ch — Gestionar la obra",
    "ge.ch — Impôt à la source":
        "ge.ch — Impuesto en la fuente",
    "ge.ch — Les CTT en vigueur à Genève":
        "ge.ch — CTT vigentes en Ginebra",
    "ge.ch — Office cantonal de la population et des migrations (OCPM)":
        "ge.ch — Oficina Cantonal de Población y Migraciones (OCPM)",
    "ge.ch — Office cantonal des véhicules (OCV)":
        "ge.ch — Oficina Cantonal de Vehículos (OCV)",
    "ge.ch — Registre du commerce":
        "ge.ch — Registro Mercantil",
    "ge.ch — Scolarité obligatoire":
        "ge.ch — Escolarización obligatoria",
    "ge.ch — Échanger un permis de conduire étranger":
        "ge.ch — Canjear un permiso de conducir extranjero",

    # justice.ge.ch
    "justice.ge.ch — Tribunal des baux et loyers":
        "justice.ge.ch — Tribunal de arrendamientos (Tribunal des baux et loyers)",

    # priminfo
    "priminfo.admin.ch — Primes de l'assurance-maladie (OFSP)":
        "priminfo.admin.ch — Primas del seguro de enfermedad (OFSP)",

    # sem.admin.ch
    "sem.admin.ch — Vivre et travailler en Suisse (types d'autorisations)":
        "sem.admin.ch — Vivir y trabajar en Suiza (tipos de autorizaciones)",
}

PT = {
    # CFA / international
    "CFA Institute – Global Investment Performance Standards (GIPS)":
        "CFA Institute – Global Investment Performance Standards (GIPS)",

    # Conférence suisse des impôts
    "Conférence suisse des impôts – Impôt sur les successions":
        "Conferência Fiscal Suíça (SSK) – Imposto sobre heranças",

    # Deloitte
    "Deloitte Suisse – Family Office & Art":
        "Deloitte Suíça – Family Office e Arte",
    "Deloitte Suisse – LSFin/LEFin pour les family offices":
        "Deloitte Suíça – LSFin/LEFin para family offices",
    "Deloitte Suisse – Multi Family Office":
        "Deloitte Suíça – Multi Family Office",
    "Deloitte – Digital Family Office":
        "Deloitte – Family Office Digital",
    "Deloitte – Family Governance Framework":
        "Deloitte – Estrutura de Governança Familiar",
    "Deloitte – Family Office Cost Benchmarking":
        "Deloitte – Benchmarking de Custos do Family Office",
    "Deloitte – Global Family Office Survey":
        "Deloitte – Pesquisa Global de Family Offices",
    "Deloitte — The Family Office Insights Series":
        "Deloitte — The Family Office Insights Series",

    # ESTV
    "ESTV – Déductibilité des dons à des institutions d'utilité publique":
        "AFC – Dedutibilidade de doações a instituições de utilidade pública",
    "ESTV – Délais et échéances de l'impôt fédéral direct":
        "AFC – Prazos e vencimentos do imposto federal direto",
    "ESTV – Fiscalité des sociétés holding":
        "AFC – Fiscalidade das sociedades holding",
    "ESTV – Imposition d'après la dépense (art. 14 LIFD)":
        "AFC – Tributação por despesas (art. 14 LIFD)",
    "ESTV – Impôt sur la fortune : actifs mobiliers":
        "AFC – Imposto sobre o patrimônio: ativos mobiliários",
    "ESTV – Obligations déclaratives et documentation fiscale":
        "AFC – Obrigações declarativas e documentação fiscal",
    "ESTV – Valeur locative (Eigenmietwert)":
        "AFC – Valor locativo (Eigenmietwert)",

    # EY
    "EY Suisse – Family Office best practices":
        "EY Suíça – Boas práticas para Family Offices",
    "EY Suisse – Family Office et coordination":
        "EY Suíça – Family Office e coordenação",
    "EY Suisse – Philanthropie et planification patrimoniale":
        "EY Suíça – Filantropia e planejamento patrimonial",
    "EY Suisse – Tax Calendar Switzerland":
        "EY Suíça – Calendário Fiscal Suíça",
    "EY – Family Enterprise Governance":
        "EY – Governança de Empresas Familiares",
    "EY – Family Enterprise Survey":
        "EY – Pesquisa de Empresas Familiares",

    # FINMA
    "FINMA – Cybersécurité et risques opérationnels":
        "FINMA – Cibersegurança e riscos operacionais",
    "FINMA – Directive sur la gestion de fortune":
        "FINMA – Diretiva sobre gestão patrimonial",
    "FINMA – Liste des banques agréées":
        "FINMA – Lista dos bancos autorizados",
    "FINMA – Obligations de diligence et documentation":
        "FINMA – Obrigações de diligência e documentação",
    "FINMA – Reconnaissance des trusts étrangers":
        "FINMA – Reconhecimento de trusts estrangeiros",
    "FINMA – Risques opérationnels et cybersécurité":
        "FINMA – Riscos operacionais e cibersegurança",
    "FINMA – Surveillance des gestionnaires de fortune":
        "FINMA – Supervisão de gestores de patrimônio",
    "FINMA – Surveillance des établissements financiers":
        "FINMA – Supervisão de instituições financeiras",
    "FINMA – Transparence des frais (LSFin)":
        "FINMA – Transparência de custos (LSFin)",
    "FINMA – Transparence des frais et rétrocessions":
        "FINMA – Transparência de custos e retrocessões",
    "FINMA – Établissements financiers et surveillance":
        "FINMA – Instituições financeiras e supervisão",
    "FINMA — Autorité fédérale de surveillance des marchés financiers":
        "FINMA — Autoridade Federal de Supervisão dos Mercados Financeiros",

    # Fedlex
    "Fedlex – Code civil suisse (droit des personnes et de la famille)":
        "Fedlex – Código Civil suíço (direito das pessoas e da família)",
    "Fedlex – Code civil suisse (succession)":
        "Fedlex – Código Civil suíço (direito sucessório)",
    "Fedlex – Code civil suisse, Livre III : Successions":
        "Fedlex – Código Civil suíço, Livro III: Sucessões",
    "Fedlex – Convention de La Haye sur les trusts (RS 0.221.371)":
        "Fedlex – Convenção de Haia sobre trusts (RS 0.221.371)",
    "Fedlex – LIFD (acomptes et délais de paiement)":
        "Fedlex – LIFD (pagamentos antecipados e prazos)",
    "Fedlex – LIFD (revenus de la fortune immobilière)":
        "Fedlex – LIFD (rendimentos do patrimônio imobiliário)",
    "Fedlex – LIFD art. 14":
        "Fedlex – LIFD art. 14",
    "Fedlex – LIFD art. 33a (dons)":
        "Fedlex – LIFD art. 33a (doações)",
    "Fedlex – Loi fédérale sur la protection des données (nLPD)":
        "Fedlex – Lei Federal de Proteção de Dados (nLPD)",
    "Fedlex – Loi sur la protection des données (LPD)":
        "Fedlex – Lei de Proteção de Dados (LPD)",
    "Fedlex – Loi sur le transfert international des biens culturels (LTBC)":
        "Fedlex – Lei sobre a transferência internacional de bens culturais (LTBC)",
    "Fedlex – Loi sur les fondations (CC art. 80 ss)":
        "Fedlex – Direito de fundações (CC art. 80 ss.)",
    "Fedlex – Loi sur les services financiers (LSFin)":
        "Fedlex – Lei de Serviços Financeiros (LSFin)",
    "Fedlex – Loi sur les établissements financiers (LEFin)":
        "Fedlex – Lei de Instituições Financeiras (LEFin)",
    "Loi sur les établissements financiers (LEFin) – Fedlex":
        "Lei de Instituições Financeiras (LEFin) – Fedlex",

    # Julius Baer
    "Julius Baer – Family Office Services":
        "Julius Baer – Serviços Family Office",

    # KPMG
    "KPMG Suisse – Compliance calendar":
        "KPMG Suíça – Calendário de conformidade regulatória",
    "KPMG Suisse – Enjeux patrimoniaux des familles":
        "KPMG Suíça – Gestão patrimonial familiar",
    "KPMG Suisse – Private Clients":
        "KPMG Suíça – Clientes privados",
    "KPMG Suisse – Real Estate & Wealth":
        "KPMG Suíça – Imobiliário e Patrimônio",
    "KPMG – Family Office Services Switzerland":
        "KPMG – Serviços Family Office Suíça",
    "KPMG – Private Wealth Switzerland":
        "KPMG – Patrimônio Privado Suíça",

    # Federal offices
    "OFCS – Centre national pour la cybersécurité (NCSC)":
        "OFCS – Centro Nacional de Cibersegurança (NCSC)",
    "OFDF – Ports francs et dépôts francs en Suisse":
        "OFDF – Zonas francas e depósitos francos na Suíça",
    "OSFIN – Organisme de surveillance des gestionnaires de fortune":
        "OSFIN – Organismo de supervisão de gestores de patrimônio",
    "Office fédéral de la justice – Droit successoral":
        "Escritório Federal de Justiça (OFJ) – Direito sucessório",

    # Pictet
    "Pictet – Gestion de fortune en Suisse":
        "Pictet – Gestão patrimonial na Suíça",
    "Pictet – Standards de mesure de performance":
        "Pictet – Padrões de medição de desempenho",

    # PFPDT
    "Préposé fédéral à la protection des données (PFPDT) – LPD":
        "Comissário Federal de Proteção de Dados (PFPDT) – LPD",

    # PwC
    "PwC Suisse – Family Office Onboarding":
        "PwC Suíça – Onboarding de Family Offices",
    "PwC Suisse – Family Office Reporting":
        "PwC Suíça – Reporting de Family Offices",
    "PwC Suisse – Fiscalité immobilière privée":
        "PwC Suíça – Fiscalidade imobiliária privada",
    "PwC Suisse – Imposition forfaitaire":
        "PwC Suíça – Tributação forfetária",
    "PwC Suisse – Structures patrimoniales":
        "PwC Suíça – Estruturas patrimoniais",
    "PwC Suisse — Family Offices":
        "PwC Suíça — Family Offices",

    # SECO
    "SECO – Gouvernance d'entreprise familiale":
        "SECO – Governança de empresas familiares",
    "SECO – Obligations légales des sociétés anonymes":
        "SECO – Obrigações legais das sociedades anónimas",

    # SIF
    "SIF – Conventions de double imposition":
        "SIF – Convenções para evitar a dupla tributação",

    # SNB
    "SNB – Marché immobilier et stabilité financière":
        "SNB – Mercado imobiliário e estabilidade financeira",
    "SNB – Rapport sur la stabilité financière":
        "SNB – Relatório sobre estabilidade financeira",
    "SNB – Rapport sur la stabilité financière 2024":
        "SNB – Relatório sobre estabilidade financeira 2024",
    "SNB – Stabilité financière et innovation":
        "SNB – Estabilidade financeira e inovação",
    "SNB – Statistiques des marchés financiers":
        "SNB – Estatísticas dos mercados financeiros",
    "SNB – Statistiques financières":
        "SNB – Estatísticas financeiras",

    # Swiss Banking
    "Swiss Banking – Code de conduite":
        "Swiss Banking – Código de conduta",
    "Swiss Banking – Qualité et standards du conseil":
        "Swiss Banking – Qualidade e padrões de aconselhamento",
    "Swiss Banking – Sécurité des dépôts":
        "Swiss Banking – Garantia de depósitos",
    "Swiss Family Office Association":
        "Swiss Family Office Association",
    "SwissBanking — Association suisse des banquiers":
        "SwissBanking — Associação Suíça de Banqueiros",

    # UBS
    "UBS Global Family Office Report 2024":
        "UBS Global Family Office Report 2024",
    "UBS – Art Banking et collections privées":
        "UBS – Art Banking e coleções privadas",
    "UBS – Family Office Report":
        "UBS – Family Office Report",
    "UBS – Philanthropie et family office":
        "UBS – Filantropia e family office",
    "UBS – Sécurité numérique pour clients privés":
        "UBS – Segurança digital para clientes privados",

    # Zewo
    "Zewo – Certification des organisations d'utilité publique":
        "Zewo – Certificação de organizações de utilidade pública",

    # ahv-iv.ch
    "ahv-iv.ch — Mémento 2.01 Cotisations salariales AVS/AI/APG":
        "ahv-iv.ch — Memorando 2.01 Contribuições salariais AHV/IV/EO",
    "ahv-iv.ch — Mémento 2.06 Travail domestique":
        "ahv-iv.ch — Memorando 2.06 Trabalho doméstico",

    # bag.admin.ch
    "bag.admin.ch — Assurance obligatoire des soins (OFSP)":
        "bag.admin.ch — Seguro obrigatório de saúde (OFSP)",

    # ch.ch
    "ch.ch — Assurance-maladie obligatoire":
        "ch.ch — Seguro de saúde obrigatório",
    "ch.ch — Circuler en Suisse avec un permis de conduire étranger":
        "ch.ch — Conduzir na Suíça com carta de condução estrangeira",
    "ch.ch — Permis de séjour et autorisations de travail":
        "ch.ch — Autorizações de residência e de trabalho",

    # edu.ge.ch
    "edu.ge.ch — Département de l'instruction publique (DIP)":
        "edu.ge.ch — Departamento de Instrução Pública (DIP)",

    # esisuisse
    "esisuisse – Garantie des dépôts en Suisse":
        "esisuisse – Garantia de depósitos na Suíça",

    # estv.admin.ch
    "estv.admin.ch — Impôt à la source (AFC)":
        "estv.admin.ch — Imposto na fonte (AFC)",

    # fedlex.admin.ch
    "fedlex.admin.ch — Accord sur la libre circulation des personnes (ALCP)":
        "fedlex.admin.ch — Acordo sobre a livre circulação de pessoas (ALCP)",
    "fedlex.admin.ch — Code civil suisse (CC)":
        "fedlex.admin.ch — Código Civil suíço (CC)",
    "fedlex.admin.ch — Code des obligations (bail à loyer)":
        "fedlex.admin.ch — Código das Obrigações (arrendamento)",
    "fedlex.admin.ch — Code des obligations (contrat d'entreprise)":
        "fedlex.admin.ch — Código das Obrigações (contrato de empreitada)",
    "fedlex.admin.ch — Code des obligations (mandat)":
        "fedlex.admin.ch — Código das Obrigações (mandato)",
    "fedlex.admin.ch — Loi fédérale sur l'impôt fédéral direct (LIFD)":
        "fedlex.admin.ch — Lei Federal sobre o Imposto Federal Direto (LIFD)",
    "fedlex.admin.ch — Loi fédérale sur les étrangers et l'intégration (LEI)":
        "fedlex.admin.ch — Lei Federal sobre Estrangeiros e Integração (LEI)",
    "fedlex.admin.ch — Loi sur l'assurance-accidents (LAA)":
        "fedlex.admin.ch — Lei sobre o Seguro de Acidentes (LAA)",
    "fedlex.admin.ch — Loi sur l'harmonisation des impôts directs (LHID)":
        "fedlex.admin.ch — Lei de Harmonização dos Impostos Diretos (LHID)",
    "fedlex.admin.ch — Loi sur la prévoyance professionnelle (LPP)":
        "fedlex.admin.ch — Lei sobre a Previdência Profissional (LPP)",
    "fedlex.admin.ch — Ordonnance sur le bail à loyer (OBLF)":
        "fedlex.admin.ch — Ordenança sobre arrendamento (OBLF)",

    # ge.ch
    "ge.ch — Annoncer mon arrivée à l'OCPM":
        "ge.ch — Comunicar a minha chegada à OCPM",
    "ge.ch — Annoncer un changement d'adresse":
        "ge.ch — Comunicar uma mudança de morada",
    "ge.ch — Assurance-maladie":
        "ge.ch — Seguro de saúde",
    "ge.ch — Bases légales et directives (autorisation de construire)":
        "ge.ch — Bases legais e diretrizes (licença de construção)",
    "ge.ch — Chèque-service : un soutien administratif":
        "ge.ch — Chèque-service: apoio administrativo",
    "ge.ch — Conditions et obligations à respecter":
        "ge.ch — Condições e obrigações a respeitar",
    "ge.ch — Demander une autorisation de construire":
        "ge.ch — Solicitar licença de construção",
    "ge.ch — Déclarer son personnel de maison aux impôts":
        "ge.ch — Declarar o pessoal doméstico nos impostos",
    "ge.ch — Déclarer votre employé aux assurances sociales":
        "ge.ch — Inscrever o empregado na segurança social",
    "ge.ch — Département de l'instruction publique, de la formation et de la jeunesse":
        "ge.ch — Departamento de Instrução Pública, Formação e Juventude (DIP)",
    "ge.ch — Employer du personnel de maison":
        "ge.ch — Empregar pessoal doméstico",
    "ge.ch — Gérer le chantier":
        "ge.ch — Gerir a obra",
    "ge.ch — Impôt à la source":
        "ge.ch — Imposto na fonte",
    "ge.ch — Les CTT en vigueur à Genève":
        "ge.ch — CTT em vigor em Genebra",
    "ge.ch — Office cantonal de la population et des migrations (OCPM)":
        "ge.ch — Serviço Cantonal de População e Migrações (OCPM)",
    "ge.ch — Office cantonal des véhicules (OCV)":
        "ge.ch — Serviço Cantonal de Veículos (OCV)",
    "ge.ch — Registre du commerce":
        "ge.ch — Registo Comercial",
    "ge.ch — Scolarité obligatoire":
        "ge.ch — Escolaridade obrigatória",
    "ge.ch — Échanger un permis de conduire étranger":
        "ge.ch — Trocar carta de condução estrangeira",

    # justice.ge.ch
    "justice.ge.ch — Tribunal des baux et loyers":
        "justice.ge.ch — Tribunal de arrendamentos (Tribunal des baux et loyers)",

    # priminfo
    "priminfo.admin.ch — Primes de l'assurance-maladie (OFSP)":
        "priminfo.admin.ch — Prémios do seguro de saúde (OFSP)",

    # sem.admin.ch
    "sem.admin.ch — Vivre et travailler en Suisse (types d'autorisations)":
        "sem.admin.ch — Viver e trabalhar na Suíça (tipos de autorizações)",
}

MAPS = {"de": DE, "es": ES, "pt": PT}


def translate_file(locale, translation_map):
    path = f"/home/sam/dev/ridger.ch/src/translations/{locale}/ressources.json"
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    articles = data.get("Articles", [])
    translated = 0
    untranslated = []

    for art in articles:
        for ref in art.get("references", []):
            fr_label = ref["labelKey"]
            if fr_label in translation_map:
                ref["labelKey"] = translation_map[fr_label]
                translated += 1
            else:
                untranslated.append(fr_label)

    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")

    return translated, untranslated


for locale, tmap in MAPS.items():
    count, missing = translate_file(locale, tmap)
    print(f"{locale}: {count} labels translated")
    if missing:
        print(f"  UNTRANSLATED ({len(missing)}):")
        for m in sorted(set(missing)):
            print(f"    - {m}")
