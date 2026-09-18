import type { Locale } from "@/src/lib/i18n";
import type { CaseStudyCard } from "@/src/components/site/case-studies-section";

type CaseStudySection = {
  title: string;
  intro: string;
  cases: CaseStudyCard[];
};

const CASE_STUDIES: Record<Locale, CaseStudySection> = {
  en: {
    title: "Anonymous payroll case studies",
    intro:
      "Representative payroll and Swiss social-charge situations where operational discipline mattered as much as calculation accuracy.",
    cases: [
      {
        slug: "payroll-transition-sme",
        title:
          "How we stabilized a delayed payroll transition for a 25-person SME",
        description:
          "A company had changed providers mid-cycle and inherited inconsistent payroll inputs, missing cutoffs, and weak monthly controls. We rebuilt the payroll calendar, aligned HR and finance responsibilities, and normalized the evidence needed for recurring runs and year-end declarations.",
        outcome:
          "Result: the client regained a predictable monthly payroll process and reduced the operational risk around social charges and source-tax submissions.",
      },
      {
        slug: "cross-border-hiring-payroll",
        title:
          "How we structured Swiss payroll for a company hiring across borders",
        description:
          "A management team was hiring employees with mixed residency patterns and needed clarity on source tax, family allowances, pension onboarding, and employer-side reporting. We clarified the onboarding sequence and standardized the recurring payroll controls.",
        outcome:
          "Result: payroll became easier to operate, and the company avoided running each new hire as a separate exception case.",
      },
      {
        slug: "swissdec-cleanup",
        title:
          "How we cleaned up swissdec reporting after inconsistent prior filings",
        description:
          "A business had payroll outputs that no longer matched the underlying employee and insurance data. We reconciled the payroll logic, reviewed prior inconsistencies, and rebuilt the file structure used for annual declarations and insurer exchanges.",
        outcome:
          "Result: the company returned to a more defensible payroll file with clearer audit trails and fewer manual fixes before deadlines.",
      },
    ],
  },
  fr: {
    title: "Études de cas paie anonymisées",
    intro:
      "Situations représentatives de paie et de charges sociales suisses où la discipline opérationnelle comptait autant que le calcul.",
    cases: [
      {
        slug: "payroll-transition-sme",
        title:
          "Comment nous avons stabilisé une transition de paie tardive pour une PME de 25 personnes",
        description:
          "Une société avait changé de prestataire en cours de cycle et repris des données de paie incohérentes, des échéances mal tenues et des contrôles mensuels insuffisants. Nous avons reconstruit le calendrier de paie, clarifié les rôles RH/finance et normalisé les pièces nécessaires aux cycles récurrents et aux déclarations annuelles.",
        outcome:
          "Résultat : le client a retrouvé un processus mensuel plus prévisible et réduit son risque opérationnel sur les charges sociales et l’impôt à la source.",
      },
      {
        slug: "cross-border-hiring-payroll",
        title:
          "Comment nous avons structuré une paie suisse pour une entreprise recrutant au-delà des frontières",
        description:
          "Une équipe de direction recrutait des salariés avec des situations de résidence mixtes et devait clarifier l’impôt à la source, les allocations familiales, l’affiliation LPP et le reporting employeur. Nous avons cadré la séquence d’onboarding et standardisé les contrôles récurrents.",
        outcome:
          "Résultat : la paie est devenue plus simple à opérer et l’entreprise a évité de traiter chaque embauche comme un cas isolé.",
      },
      {
        slug: "swissdec-cleanup",
        title:
          "Comment nous avons remis à niveau un reporting swissdec devenu incohérent",
        description:
          "Une entreprise disposait de sorties de paie qui ne correspondaient plus aux données salariés et assurances. Nous avons réconcilié la logique de paie, revu les incohérences antérieures et restructuré le dossier utilisé pour les déclarations annuelles et les échanges avec les assureurs.",
        outcome:
          "Résultat : la société est revenue à un dossier de paie plus défendable, avec de meilleures traces et moins de corrections manuelles avant échéance.",
      },
    ],
  },
  de: {
    title: "Anonymisierte Payroll-Fallstudien",
    intro:
      "Typische Payroll- und Sozialversicherungsfälle, in denen operative Disziplin genauso wichtig war wie die eigentliche Berechnung.",
    cases: [
      {
        slug: "payroll-transition-sme",
        title:
          "Wie wir einen verspäteten Payroll-Wechsel für ein 25-Personen-KMU stabilisiert haben",
        description:
          "Ein Unternehmen hatte mitten im Zyklus den Anbieter gewechselt und inkonsistente Payroll-Daten, verpasste Cutoffs und schwache Kontrollen übernommen. Wir bauten den Payroll-Kalender neu auf, klärten HR- und Finance-Verantwortung und standardisierten die Unterlagen für laufende Löhne und Jahresdeklarationen.",
        outcome:
          "Ergebnis: Der Kunde gewann einen berechenbareren Monatsprozess zurück und reduzierte das operative Risiko bei Sozialabgaben und Quellensteuer.",
      },
      {
        slug: "cross-border-hiring-payroll",
        title:
          "Wie wir Schweizer Payroll für grenzüberschreitende Einstellungen strukturiert haben",
        description:
          "Ein Managementteam stellte Mitarbeitende mit gemischten Wohnsitzmustern ein und brauchte Klarheit zu Quellensteuer, Familienzulagen, BVG-Onboarding und Arbeitgeber-Reporting. Wir strukturierten die Onboarding-Sequenz und standardisierten wiederkehrende Payroll-Kontrollen.",
        outcome:
          "Ergebnis: Die Payroll wurde leichter steuerbar, und das Unternehmen musste neue Einstellungen nicht mehr als Einzel-Ausnahmen behandeln.",
      },
      {
        slug: "swissdec-cleanup",
        title:
          "Wie wir ein inkonsistentes swissdec-Reporting bereinigt haben",
        description:
          "Ein Unternehmen hatte Payroll-Ausgaben, die nicht mehr zu Mitarbeiter- und Versicherungsdaten passten. Wir stimmten die Payroll-Logik ab, prüften frühere Inkonsistenzen und bauten die Unterlagen für Jahresdeklarationen und Versicherer-Kommunikation neu auf.",
        outcome:
          "Ergebnis: Das Unternehmen kehrte zu einem besser belegbaren Payroll-Dossier mit klareren Prüfpfaden und weniger manuellen Korrekturen zurück.",
      },
    ],
  },
  es: {
    title: "Casos de nómina anonimizados",
    intro:
      "Situaciones representativas de nómina y cargas sociales suizas en las que la disciplina operativa importó tanto como el cálculo.",
    cases: [
      {
        slug: "payroll-transition-sme",
        title:
          "Cómo estabilizamos una transición tardía de nómina para una pyme de 25 personas",
        description:
          "Una empresa había cambiado de proveedor en mitad del ciclo y heredó datos incoherentes, cierres mal controlados y controles mensuales débiles. Reconstruimos el calendario de nómina, aclaramos responsabilidades de RR. HH. y finanzas y normalizamos la documentación para ciclos recurrentes y declaraciones anuales.",
        outcome:
          "Resultado: el cliente recuperó un proceso mensual más previsible y redujo el riesgo operativo en cargas sociales y retenciones.",
      },
      {
        slug: "cross-border-hiring-payroll",
        title:
          "Cómo estructuramos nómina suiza para una empresa que contrataba en varios países",
        description:
          "Un equipo directivo contrataba empleados con patrones de residencia mixtos y necesitaba claridad sobre retención en origen, asignaciones familiares, alta en pensiones y reporting del empleador. Ordenamos la secuencia de onboarding y estandarizamos los controles recurrentes.",
        outcome:
          "Resultado: la nómina pasó a ser más operable y la empresa dejó de tratar cada nueva contratación como una excepción aislada.",
      },
      {
        slug: "swissdec-cleanup",
        title:
          "Cómo saneamos un reporting swissdec que se había vuelto incoherente",
        description:
          "Una empresa tenía salidas de nómina que ya no encajaban con los datos de empleados y aseguradoras. Reconciliamos la lógica de nómina, revisamos inconsistencias previas y reconstruimos el archivo usado para declaraciones anuales e intercambios con aseguradoras.",
        outcome:
          "Resultado: la empresa volvió a un dossier de nómina más defendible, con mejor trazabilidad y menos correcciones manuales antes de plazo.",
      },
    ],
  },
  pt: {
    title: "Estudos de caso de payroll anonimizados",
    intro:
      "Situações representativas de payroll e encargos sociais suíços em que a disciplina operacional contou tanto quanto o cálculo.",
    cases: [
      {
        slug: "payroll-transition-sme",
        title:
          "Como estabilizámos uma transição tardia de payroll para uma PME com 25 pessoas",
        description:
          "Uma empresa tinha mudado de prestador a meio do ciclo e herdado dados incoerentes, cortes mal controlados e verificações mensais fracas. Reconstruímos o calendário de payroll, clarificámos responsabilidades entre RH e finanças e normalizámos a documentação para ciclos recorrentes e declarações anuais.",
        outcome:
          "Resultado: o cliente recuperou um processo mensal mais previsível e reduziu o risco operacional em encargos sociais e imposto na fonte.",
      },
      {
        slug: "cross-border-hiring-payroll",
        title:
          "Como estruturámos payroll suíço para uma empresa a contratar além-fronteiras",
        description:
          "Uma equipa de gestão contratava colaboradores com padrões mistos de residência e precisava de clareza sobre imposto na fonte, abonos de família, onboarding de pensões e reporting patronal. Organizámos a sequência de onboarding e padronizámos os controlos recorrentes.",
        outcome:
          "Resultado: o payroll tornou-se mais fácil de operar e a empresa deixou de tratar cada contratação como uma exceção isolada.",
      },
      {
        slug: "swissdec-cleanup",
        title:
          "Como saneámos um reporting swissdec que se tinha tornado incoerente",
        description:
          "Uma empresa tinha outputs de payroll que já não batiam com os dados de colaboradores e seguradoras. Reconciliámos a lógica de payroll, revimos inconsistências anteriores e reestruturámos o ficheiro usado para declarações anuais e trocas com seguradoras.",
        outcome:
          "Resultado: a empresa regressou a um dossier de payroll mais defensável, com melhor trilho de auditoria e menos correções manuais antes dos prazos.",
      },
    ],
  },
};

export function getPayrollCaseStudies(locale: Locale): CaseStudySection {
  return CASE_STUDIES[locale] || CASE_STUDIES.en;
}
