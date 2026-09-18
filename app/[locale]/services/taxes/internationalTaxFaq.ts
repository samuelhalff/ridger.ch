import type { Locale } from "@/src/lib/i18n";
import type { FAQEntry } from "@/src/lib/structuredData";

type FaqSectionContent = {
  title: string;
  intro: string;
  entries: FAQEntry[];
};

const INTERNATIONAL_TAX_FAQ: Record<Locale, FaqSectionContent> = {
  en: {
    title: "International tax FAQ",
    intro:
      "Focused answers for cross-border employers, founders, and finance teams dealing with Swiss tax exposure.",
    entries: [
      {
        question: "What are the risks of shadow payroll in Switzerland?",
        answer:
          "The main risks are under-withheld tax at source, incorrect social-security handling, inconsistent employer reporting, and penalties after an audit. Shadow payroll cases need to be aligned with the employment contract, treaty analysis, travel pattern, and payroll split before the first filing cycle.",
      },
      {
        question:
          "When can a foreign company create a taxable presence in Switzerland?",
        answer:
          "A taxable presence can arise when a foreign company has a permanent establishment, a dependent agent, or a Swiss activity pattern that goes beyond isolated support work. The practical review looks at who signs business, where value is created, how long teams stay in Switzerland, and whether local functions become operational rather than incidental.",
      },
      {
        question:
          "How do double-tax treaties help internationally mobile directors and founders?",
        answer:
          "Treaties allocate taxing rights between Switzerland and the other state, but they only work if residency, employer structure, remuneration type, and working-day evidence are documented properly. In practice, treaty relief often fails because the facts are not aligned across payroll, contracts, and tax returns.",
      },
      {
        question:
          "Do stock options or management incentive plans trigger Swiss tax issues?",
        answer:
          "Yes. Timing, vesting, exercise, relocation, and employer recharge mechanics can all change the Swiss treatment. Equity plans should be reviewed before mobility events or restructurings so payroll reporting, withholding, and personal tax treatment stay consistent.",
      },
    ],
  },
  fr: {
    title: "FAQ fiscalité internationale",
    intro:
      "Réponses ciblées pour les employeurs, fondateurs et équipes finance confrontés à une exposition fiscale transfrontalière en Suisse.",
    entries: [
      {
        question:
          "Quels sont les risques d’un shadow payroll en Suisse ?",
        answer:
          "Les principaux risques sont un impôt à la source insuffisamment prélevé, un traitement erroné des charges sociales, un reporting employeur incohérent et des pénalités en cas de contrôle. Un shadow payroll doit être aligné dès le départ avec le contrat de travail, l’analyse conventionnelle, les jours de présence et la répartition de la paie.",
      },
      {
        question:
          "À partir de quand une société étrangère peut-elle créer une présence fiscale en Suisse ?",
        answer:
          "Une présence imposable peut naître en cas d’établissement stable, d’agent dépendant ou d’activité suisse allant au-delà d’un simple support ponctuel. En pratique, il faut analyser qui conclut les affaires, où la valeur est créée, combien de temps les équipes restent en Suisse et si les fonctions locales deviennent opérationnelles.",
      },
      {
        question:
          "Comment les conventions de double imposition aident-elles les dirigeants et fondateurs mobiles ?",
        answer:
          "Les conventions répartissent les droits d’imposer entre la Suisse et l’autre État, mais elles ne protègent que si la résidence, la structure employeur, le type de rémunération et les jours travaillés sont correctement documentés. En pratique, l’allègement conventionnel échoue souvent quand les faits ne sont pas cohérents entre paie, contrats et déclarations.",
      },
      {
        question:
          "Les plans d’actions ou management packages créent-ils des enjeux fiscaux en Suisse ?",
        answer:
          "Oui. Le calendrier d’acquisition, l’exercice, la mobilité internationale et les recharges entre sociétés peuvent modifier le traitement suisse. Il faut revoir ces plans avant une mobilité ou une restructuration pour garder une cohérence entre paie, retenues et fiscalité personnelle.",
      },
    ],
  },
  de: {
    title: "FAQ internationale Steuern",
    intro:
      "Gezielte Antworten für grenzüberschreitende Arbeitgeber, Gründer und Finance-Teams mit Schweizer Steuerbezug.",
    entries: [
      {
        question: "Welche Risiken hat ein Shadow Payroll in der Schweiz?",
        answer:
          "Die Haupt­risiken sind zu tiefe Quellensteuerabzüge, falsche Sozialversicherungsbehandlung, widersprüchliches Arbeitgeber-Reporting und Sanktionen nach einer Prüfung. Shadow-Payroll-Fälle müssen vor dem ersten Lohnlauf mit Vertrag, DBA-Analyse, Arbeitstagen und Payroll-Aufteilung abgestimmt werden.",
      },
      {
        question:
          "Wann kann eine ausländische Gesellschaft in der Schweiz eine steuerliche Präsenz begründen?",
        answer:
          "Eine steuerliche Präsenz kann durch eine Betriebsstätte, einen abhängigen Vertreter oder durch Tätigkeiten entstehen, die über reine Unterstützung hinausgehen. Praktisch prüft man, wer Geschäfte abschliesst, wo Wertschöpfung stattfindet, wie lange Teams in der Schweiz arbeiten und ob lokale Funktionen operativ werden.",
      },
      {
        question:
          "Wie helfen Doppelbesteuerungsabkommen international mobilen Geschäftsleitern und Gründern?",
        answer:
          "DBA teilen die Besteuerungsrechte zwischen der Schweiz und dem anderen Staat auf, wirken aber nur, wenn Ansässigkeit, Arbeitgeberstruktur, Vergütungsart und Arbeitstage sauber dokumentiert sind. In der Praxis scheitert die Entlastung oft an widersprüchlichen Fakten in Payroll, Verträgen und Steuererklärungen.",
      },
      {
        question:
          "Lösen Aktienoptionen oder Management-Incentive-Pläne Schweizer Steuerfragen aus?",
        answer:
          "Ja. Vesting, Ausübung, Wegzug, Zuzug und Intercompany-Recharges können die Schweizer Behandlung verändern. Beteiligungspläne sollten vor Mobilitätsereignissen oder Restrukturierungen geprüft werden, damit Payroll, Quellensteuer und private Steuererklärung konsistent bleiben.",
      },
    ],
  },
  es: {
    title: "FAQ de fiscalidad internacional",
    intro:
      "Respuestas concretas para empleadores, fundadores y equipos financieros con exposición fiscal transfronteriza en Suiza.",
    entries: [
      {
        question: "¿Cuáles son los riesgos de un shadow payroll en Suiza?",
        answer:
          "Los principales riesgos son una retención en origen insuficiente, un tratamiento incorrecto de la seguridad social, reportes incoherentes del empleador y sanciones tras una inspección. Un shadow payroll debe alinearse desde el inicio con el contrato, el análisis del convenio, los días trabajados y el reparto de nómina.",
      },
      {
        question:
          "¿Cuándo puede una empresa extranjera crear una presencia fiscal en Suiza?",
        answer:
          "Puede surgir una presencia imponible por establecimiento permanente, agente dependiente o actividades suizas que superen un apoyo aislado. En la práctica se analiza quién cierra negocio, dónde se crea valor, cuánto tiempo permanece el equipo en Suiza y si las funciones locales pasan a ser operativas.",
      },
      {
        question:
          "¿Cómo ayudan los convenios para evitar la doble imposición a directivos y fundadores móviles?",
        answer:
          "Los convenios reparten la potestad tributaria entre Suiza y el otro Estado, pero solo funcionan si la residencia, la estructura del empleador, el tipo de remuneración y los días trabajados están bien documentados. En la práctica, el alivio falla cuando nómina, contratos y declaraciones no cuentan la misma historia.",
      },
      {
        question:
          "¿Los planes de acciones u opciones generan cuestiones fiscales en Suiza?",
        answer:
          "Sí. El vesting, el ejercicio, la movilidad internacional y las recargas entre sociedades pueden cambiar el tratamiento suizo. Conviene revisar estos planes antes de un traslado o reestructuración para mantener coherencia entre nómina, retenciones y tributación personal.",
      },
    ],
  },
  pt: {
    title: "FAQ de fiscalidade internacional",
    intro:
      "Respostas objetivas para empregadores, fundadores e equipas financeiras com exposição fiscal transfronteiriça na Suíça.",
    entries: [
      {
        question: "Quais são os riscos de um shadow payroll na Suíça?",
        answer:
          "Os principais riscos são retenção na fonte insuficiente, tratamento incorreto da segurança social, reporting inconsistente do empregador e penalidades após auditoria. Um shadow payroll deve ser alinhado desde o início com o contrato, a análise do tratado, os dias de trabalho e a divisão da folha.",
      },
      {
        question:
          "Quando uma empresa estrangeira pode criar presença fiscal na Suíça?",
        answer:
          "A presença tributável pode surgir por estabelecimento estável, agente dependente ou atividades suíças que vão além de apoio pontual. Na prática, analisa-se quem fecha negócios, onde o valor é criado, quanto tempo as equipas ficam na Suíça e se as funções locais se tornam operacionais.",
      },
      {
        question:
          "Como os tratados contra a dupla tributação ajudam diretores e fundadores móveis?",
        answer:
          "Os tratados repartem os direitos de tributação entre a Suíça e o outro Estado, mas só funcionam se residência, estrutura do empregador, tipo de remuneração e dias trabalhados estiverem bem documentados. Na prática, o alívio falha quando folha, contratos e declarações não estão alinhados.",
      },
      {
        question:
          "Planos de ações ou stock options criam temas fiscais na Suíça?",
        answer:
          "Sim. Vesting, exercício, mobilidade internacional e recargas entre sociedades podem alterar o tratamento suíço. Esses planos devem ser revistos antes de mudanças de mobilidade ou reestruturações para manter coerência entre folha, retenções e tributação pessoal.",
      },
    ],
  },
};

export function getInternationalTaxFaq(locale: Locale): FaqSectionContent {
  return INTERNATIONAL_TAX_FAQ[locale] || INTERNATIONAL_TAX_FAQ.en;
}
