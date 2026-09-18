import type { Locale } from "@/src/lib/i18n";
import type { CaseStudyCard } from "@/src/components/site/case-studies-section";

type CaseStudySection = {
  title: string;
  intro: string;
  cases: CaseStudyCard[];
};

const CASE_STUDIES: Record<Locale, CaseStudySection> = {
  en: {
    title: "Anonymous accounting case studies",
    intro:
      "Representative finance-operations situations where better accounting structure improved decision-making and compliance at the same time.",
    cases: [
      {
        slug: "spreadsheet-to-monthly-close",
        title:
          "How we moved a founder-led company from spreadsheets to a repeatable monthly close",
        description:
          "A founder-led business had grown beyond ad hoc bookkeeping and no longer had a reliable monthly view of cash, receivables, and VAT exposure. We restructured the chart of accounts, clarified document flows, and established a recurring close rhythm with clearer handoffs.",
        outcome:
          "Result: management gained a cleaner monthly finance view and fewer year-end surprises tied to missing support or late adjustments.",
      },
      {
        slug: "cleanup-pre-audit",
        title:
          "How we cleaned up an accounting file before external review",
        description:
          "An SME entered year-end with delayed reconciliations, unsupported balance-sheet positions, and inconsistent supporting files. We prioritized the sensitive areas, rebuilt the closing file, and aligned internal owners around a narrower document checklist.",
        outcome:
          "Result: the company approached year-end with a more defensible file and reduced friction with external reviewers and tax stakeholders.",
      },
      {
        slug: "odoo-banking-month-end",
        title:
          "How we reduced month-end friction with Swiss banking imports and QR invoice discipline",
        description:
          "A services company had Odoo in place but still relied on manual reconciliation habits that slowed month-end and blurred accountability. We reorganized the banking workflow, tightened document capture, and linked the accounting routine to a more stable review process.",
        outcome:
          "Result: the finance team spent less time untangling bank movements and had better visibility on what was still open at close.",
      },
    ],
  },
  fr: {
    title: "Études de cas comptables anonymisées",
    intro:
      "Situations représentatives d’organisation financière où une meilleure structure comptable a amélioré à la fois le pilotage et la conformité.",
    cases: [
      {
        slug: "spreadsheet-to-monthly-close",
        title:
          "Comment nous avons fait passer une société pilotée par son fondateur à une clôture mensuelle plus fiable",
        description:
          "Une entreprise dirigée par son fondateur avait dépassé le stade d’une tenue comptable ad hoc et ne disposait plus d’une vision mensuelle fiable de la trésorerie, des créances et de l’exposition TVA. Nous avons restructuré le plan comptable, clarifié les flux documentaires et mis en place un rythme de clôture récurrent avec des relais mieux définis.",
        outcome:
          "Résultat : la direction a retrouvé une lecture financière mensuelle plus propre et moins de surprises de fin d’année liées aux pièces manquantes ou aux ajustements tardifs.",
      },
      {
        slug: "cleanup-pre-audit",
        title:
          "Comment nous avons remis à niveau un dossier comptable avant revue externe",
        description:
          "Une PME arrivait à la clôture avec des réconciliations en retard, des postes de bilan insuffisamment justifiés et des supports épars. Nous avons priorisé les zones sensibles, reconstruit le dossier de clôture et aligné les responsables internes autour d’une liste documentaire plus resserrée.",
        outcome:
          "Résultat : la société a abordé la clôture avec un dossier plus défendable et moins de friction avec les relecteurs externes et les interlocuteurs fiscaux.",
      },
      {
        slug: "odoo-banking-month-end",
        title:
          "Comment nous avons réduit les frictions de clôture avec les imports bancaires suisses et la discipline facture QR",
        description:
          "Une société de services utilisait déjà Odoo mais restait dépendante d’habitudes de rapprochement trop manuelles, ce qui ralentissait la clôture et diluait les responsabilités. Nous avons réorganisé le flux bancaire, renforcé la capture documentaire et relié la routine comptable à un processus de revue plus stable.",
        outcome:
          "Résultat : l’équipe finance a passé moins de temps à reconstituer les mouvements bancaires et a gagné en visibilité sur les points encore ouverts à la clôture.",
      },
    ],
  },
  de: {
    title: "Anonymisierte Buchhaltungs-Fallstudien",
    intro:
      "Typische Finance-Operations-Situationen, in denen eine bessere Buchhaltungsstruktur sowohl Steuerung als auch Compliance verbessert hat.",
    cases: [
      {
        slug: "spreadsheet-to-monthly-close",
        title:
          "Wie wir ein gründergeführtes Unternehmen von Tabellen zu einem verlässlicheren Monatsabschluss geführt haben",
        description:
          "Ein gründergeführtes Unternehmen war über ad hoc Buchhaltung hinausgewachsen und hatte keinen verlässlichen Monatsblick mehr auf Cash, Debitoren und MWST-Risiken. Wir strukturierten den Kontenplan neu, klärten Dokumentenflüsse und etablierten einen wiederkehrenden Abschlussrhythmus mit klareren Übergaben.",
        outcome:
          "Ergebnis: Das Management gewann eine sauberere monatliche Finanzsicht und weniger Überraschungen zum Jahresende durch fehlende Unterlagen oder späte Buchungen.",
      },
      {
        slug: "cleanup-pre-audit",
        title:
          "Wie wir eine Buchhaltungsakte vor externer Prüfung bereinigt haben",
        description:
          "Ein KMU ging mit verspäteten Abstimmungen, unzureichend belegten Bilanzpositionen und uneinheitlichen Unterlagen ins Jahresende. Wir priorisierten sensible Bereiche, bauten die Abschlussakte neu auf und richteten interne Verantwortliche auf eine engere Dokumentenliste aus.",
        outcome:
          "Ergebnis: Das Unternehmen ging mit besser belegbarer Akte und weniger Reibung mit externen Prüfern und Steuerparteien in den Abschluss.",
      },
      {
        slug: "odoo-banking-month-end",
        title:
          "Wie wir Monatsend-Reibung mit Schweizer Bankimporten und QR-Rechnungsdisziplin reduziert haben",
        description:
          "Ein Dienstleistungsunternehmen nutzte bereits Odoo, war aber noch stark von manuellen Abstimmungsgewohnheiten abhängig, was den Monatsabschluss verlangsamte und Verantwortlichkeiten verwischte. Wir organisierten den Bankworkflow neu, stärkten die Dokumentenerfassung und banden die Routine an einen stabileren Review-Prozess an.",
        outcome:
          "Ergebnis: Das Finance-Team verbrachte weniger Zeit mit der Auflösung von Bankbewegungen und hatte bessere Sicht auf offene Punkte zum Abschluss.",
      },
    ],
  },
  es: {
    title: "Casos contables anonimizados",
    intro:
      "Situaciones representativas de operaciones financieras donde una mejor estructura contable mejoró al mismo tiempo la gestión y la conformidad.",
    cases: [
      {
        slug: "spreadsheet-to-monthly-close",
        title:
          "Cómo pasamos una empresa dirigida por su fundador de hojas de cálculo a un cierre mensual más fiable",
        description:
          "Un negocio liderado por su fundador había superado la contabilidad ad hoc y ya no tenía una visión mensual fiable de caja, clientes e IVA. Reestructuramos el plan de cuentas, aclaramos los flujos documentales y establecimos un ritmo de cierre recurrente con mejores traspasos.",
        outcome:
          "Resultado: la dirección recuperó una lectura financiera mensual más clara y menos sorpresas de cierre ligadas a soporte incompleto o ajustes tardíos.",
      },
      {
        slug: "cleanup-pre-audit",
        title:
          "Cómo saneamos un expediente contable antes de una revisión externa",
        description:
          "Una pyme llegaba al cierre con conciliaciones retrasadas, posiciones de balance poco soportadas y archivos dispares. Priorizamos las áreas sensibles, reconstruimos el expediente de cierre y alineamos a los responsables internos sobre una lista documental más estrecha.",
        outcome:
          "Resultado: la empresa afrontó el cierre con un archivo más defendible y menos fricción con revisores externos y partes fiscales.",
      },
      {
        slug: "odoo-banking-month-end",
        title:
          "Cómo redujimos la fricción de cierre con importaciones bancarias suizas y disciplina de factura QR",
        description:
          "Una empresa de servicios ya tenía Odoo, pero seguía dependiendo de conciliaciones demasiado manuales que ralentizaban el cierre y difuminaban responsabilidades. Reorganizamos el flujo bancario, reforzamos la captura documental y conectamos la rutina contable con un proceso de revisión más estable.",
        outcome:
          "Resultado: el equipo financiero dedicó menos tiempo a deshacer movimientos bancarios y ganó visibilidad sobre lo que seguía abierto al cierre.",
      },
    ],
  },
  pt: {
    title: "Estudos de caso contabilísticos anonimizados",
    intro:
      "Situações representativas de operações financeiras em que uma estrutura contabilística melhor melhorou ao mesmo tempo a gestão e a conformidade.",
    cases: [
      {
        slug: "spreadsheet-to-monthly-close",
        title:
          "Como passámos uma empresa liderada pelo fundador de folhas de cálculo para um fecho mensal mais fiável",
        description:
          "Uma empresa liderada pelo fundador tinha ultrapassado a contabilidade ad hoc e já não tinha visão mensal fiável sobre caixa, clientes e IVA. Reestruturámos o plano de contas, clarificámos os fluxos documentais e estabelecemos um ritmo recorrente de fecho com melhores passagens de responsabilidade.",
        outcome:
          "Resultado: a gestão recuperou uma leitura financeira mensal mais limpa e menos surpresas de fim de ano ligadas a suporte incompleto ou ajustes tardios.",
      },
      {
        slug: "cleanup-pre-audit",
        title:
          "Como saneámos um dossier contabilístico antes de revisão externa",
        description:
          "Uma PME aproximava-se do fecho com reconciliações atrasadas, posições de balanço pouco suportadas e ficheiros inconsistentes. Priorizámos as áreas sensíveis, reconstruímos o dossier de fecho e alinhámos os responsáveis internos numa lista documental mais enxuta.",
        outcome:
          "Resultado: a empresa chegou ao fecho com um dossier mais defensável e menos fricção com revisores externos e interlocutores fiscais.",
      },
      {
        slug: "odoo-banking-month-end",
        title:
          "Como reduzimos a fricção de fecho com importações bancárias suíças e disciplina de fatura QR",
        description:
          "Uma empresa de serviços já utilizava Odoo, mas continuava dependente de reconciliações demasiado manuais, o que atrasava o fecho e diluía responsabilidades. Reorganizámos o fluxo bancário, reforçámos a captura documental e ligámos a rotina contabilística a um processo de revisão mais estável.",
        outcome:
          "Resultado: a equipa financeira passou menos tempo a desfazer movimentos bancários e ganhou melhor visibilidade sobre o que ainda estava em aberto no fecho.",
      },
    ],
  },
};

export function getAccountingCaseStudies(locale: Locale): CaseStudySection {
  return CASE_STUDIES[locale] || CASE_STUDIES.en;
}
