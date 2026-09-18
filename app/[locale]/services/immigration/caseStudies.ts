import type { Locale } from "@/src/lib/i18n";

export type CaseStudy = {
  slug: string;
  title: string;
  description: string;
  outcome: string;
};

type CaseStudySection = {
  title: string;
  intro: string;
  cases: CaseStudy[];
};

const CASE_STUDIES: Record<Locale, CaseStudySection> = {
  en: {
    title: "Anonymous case studies",
    intro:
      "Representative cross-border situations we handle for founders, finance teams, and internationally mobile employees.",
    cases: [
      {
        slug: "uk-scale-up-geneva",
        title: "How we helped a UK scale-up set up operations in Geneva",
        description:
          "A UK software company needed a Geneva presence for sales leadership and local hiring. We coordinated company setup, payroll onboarding, Swiss social-insurance registration, and the local administrative calendar so the launch could happen without fragmented advisors.",
        outcome:
          "Result: the client launched the Swiss entity with a clear operating timeline, compliant payroll setup, and one aligned workflow between founders, HR, and finance.",
      },
      {
        slug: "eu-executive-shadow-payroll",
        title:
          "How we stabilized a shadow-payroll situation for an EU executive in Switzerland",
        description:
          "An executive was already working partly from Switzerland before the employer had aligned payroll and tax reporting. We reviewed work patterns, source-tax exposure, ANobAG and social-security points, then rebuilt the reporting sequence with the employer and local counterparties.",
        outcome:
          "Result: the company reduced audit risk, corrected reporting logic, and regained visibility on the Swiss compliance perimeter.",
      },
      {
        slug: "founder-family-relocation",
        title:
          "How we supported a founder family relocating to Switzerland while launching a company",
        description:
          "A founder family combined residence planning, company incorporation, bank onboarding, and first local employment contracts in one compressed timeline. We coordinated permits, entity setup, and first-cycle finance administration so the move and launch stayed synchronized.",
        outcome:
          "Result: the family entered Switzerland with a structured file, and the new business started with cleaner governance and fewer last-minute administrative blockers.",
      },
    ],
  },
  fr: {
    title: "Études de cas anonymisées",
    intro:
      "Situations transfrontalières représentatives que nous traitons pour des fondateurs, équipes finance et salariés mobiles.",
    cases: [
      {
        slug: "uk-scale-up-geneva",
        title:
          "Comment nous avons aidé une scale-up britannique à s’implanter à Genève",
        description:
          "Une société logicielle britannique devait ouvrir une présence genevoise pour piloter le commercial et recruter localement. Nous avons coordonné la création de la structure, la mise en place de la paie, les affiliations sociales suisses et le calendrier administratif local afin d’éviter un montage éclaté entre plusieurs conseillers.",
        outcome:
          "Résultat : l’entité suisse a été lancée avec un planning opérationnel clair, une paie conforme et un flux de travail aligné entre fondateurs, RH et finance.",
      },
      {
        slug: "eu-executive-shadow-payroll",
        title:
          "Comment nous avons sécurisé un cas de shadow payroll pour un cadre européen en Suisse",
        description:
          "Un dirigeant travaillait déjà partiellement depuis la Suisse avant que l’employeur n’ait aligné la paie et le reporting fiscal. Nous avons revu les jours de présence, l’exposition à l’impôt à la source, les sujets ANobAG et assurances sociales, puis reconstruit la séquence de déclarations avec l’employeur et les interlocuteurs locaux.",
        outcome:
          "Résultat : l’entreprise a réduit son risque de contrôle, corrigé sa logique de reporting et retrouvé de la visibilité sur le périmètre suisse.",
      },
      {
        slug: "founder-family-relocation",
        title:
          "Comment nous avons accompagné le déménagement d’une famille fondatrice avec lancement de société",
        description:
          "Une famille de fondateurs devait combiner projet de résidence, création de société, relation bancaire et premiers contrats de travail locaux dans un calendrier serré. Nous avons coordonné les permis, la structure et les premières étapes administratives et financières pour garder l’ensemble synchronisé.",
        outcome:
          "Résultat : la famille est arrivée avec un dossier mieux structuré, et la société a démarré avec une gouvernance plus propre et moins de blocages administratifs de dernière minute.",
      },
    ],
  },
  de: {
    title: "Anonymisierte Fallstudien",
    intro:
      "Typische grenzüberschreitende Situationen, die wir für Gründer, Finance-Teams und mobile Mitarbeitende begleiten.",
    cases: [
      {
        slug: "uk-scale-up-geneva",
        title:
          "Wie wir ein britisches Scale-up beim Aufbau in Genf unterstützt haben",
        description:
          "Ein britisches Softwareunternehmen brauchte eine Genfer Präsenz für Sales-Leitung und lokale Einstellungen. Wir koordinierten Gesellschaftsgründung, Payroll-Onboarding, Schweizer Sozialversicherungen und den lokalen Administrationskalender, damit der Start nicht auf mehrere Berater aufgespalten wurde.",
        outcome:
          "Ergebnis: Die Schweizer Einheit startete mit klarem Zeitplan, konformer Payroll und abgestimmtem Ablauf zwischen Gründern, HR und Finance.",
      },
      {
        slug: "eu-executive-shadow-payroll",
        title:
          "Wie wir eine Shadow-Payroll-Situation für eine EU-Führungskraft stabilisiert haben",
        description:
          "Eine Führungskraft arbeitete bereits teilweise aus der Schweiz, bevor Payroll und Steuer-Reporting sauber aufgesetzt waren. Wir prüften Arbeitstage, Quellensteuer, ANobAG- und Sozialversicherungsthemen und bauten den Reporting-Ablauf mit Arbeitgeber und lokalen Parteien neu auf.",
        outcome:
          "Ergebnis: Das Unternehmen reduzierte das Prüfungsrisiko, korrigierte seine Reporting-Logik und gewann wieder Klarheit über den Schweizer Compliance-Umfang.",
      },
      {
        slug: "founder-family-relocation",
        title:
          "Wie wir eine Gründerfamilie bei Umzug und Firmengründung begleitet haben",
        description:
          "Eine Gründerfamilie musste Aufenthaltsplanung, Firmengründung, Bank-Onboarding und erste lokale Arbeitsverträge in engem Zeitrahmen verbinden. Wir koordinierten Bewilligungen, Struktur und die ersten finanziellen und administrativen Schritte.",
        outcome:
          "Ergebnis: Die Familie zog mit besser vorbereitetem Dossier um, und das Unternehmen startete mit saubererer Governance und weniger Last-Minute-Hürden.",
      },
    ],
  },
  es: {
    title: "Casos prácticos anonimizados",
    intro:
      "Situaciones transfronterizas representativas que tratamos para fundadores, equipos financieros y empleados con movilidad internacional.",
    cases: [
      {
        slug: "uk-scale-up-geneva",
        title:
          "Cómo ayudamos a una scale-up británica a implantarse en Ginebra",
        description:
          "Una empresa británica de software necesitaba presencia en Ginebra para liderar ventas y contratar localmente. Coordinamos la constitución, la nómina, las altas en la seguridad social suiza y el calendario administrativo local para evitar un proyecto fragmentado entre varios asesores.",
        outcome:
          "Resultado: la entidad suiza se lanzó con un calendario operativo claro, nómina conforme y un flujo coordinado entre fundadores, RR. HH. y finanzas.",
      },
      {
        slug: "eu-executive-shadow-payroll",
        title:
          "Cómo estabilizamos un caso de shadow payroll para un directivo europeo en Suiza",
        description:
          "Un directivo ya trabajaba parcialmente desde Suiza antes de que la empresa hubiera alineado la nómina y el reporting fiscal. Revisamos días trabajados, exposición a retención en origen, ANobAG y seguridad social, y reorganizamos la secuencia de reporting con el empleador y los interlocutores locales.",
        outcome:
          "Resultado: la empresa redujo el riesgo de inspección, corrigió su lógica de reporting y recuperó visibilidad sobre el perímetro de cumplimiento suizo.",
      },
      {
        slug: "founder-family-relocation",
        title:
          "Cómo acompañamos a una familia fundadora en su traslado y lanzamiento en Suiza",
        description:
          "Una familia fundadora debía combinar residencia, constitución societaria, relación bancaria y primeros contratos locales en un calendario comprimido. Coordinamos permisos, estructura y primeros pasos administrativos y financieros para mantener todo sincronizado.",
        outcome:
          "Resultado: la familia llegó con un expediente más sólido y la nueva empresa comenzó con una gobernanza más limpia y menos bloqueos administrativos de última hora.",
      },
    ],
  },
  pt: {
    title: "Estudos de caso anonimizados",
    intro:
      "Situações transfronteiriças representativas que tratamos para fundadores, equipas financeiras e colaboradores com mobilidade internacional.",
    cases: [
      {
        slug: "uk-scale-up-geneva",
        title:
          "Como ajudámos uma scale-up britânica a instalar-se em Genebra",
        description:
          "Uma empresa britânica de software precisava de presença em Genebra para liderar vendas e contratar localmente. Coordenámos constituição, folha salarial, inscrições na segurança social suíça e calendário administrativo local para evitar um projeto fragmentado entre vários consultores.",
        outcome:
          "Resultado: a entidade suíça arrancou com calendário operacional claro, payroll conforme e fluxo alinhado entre fundadores, RH e finanças.",
      },
      {
        slug: "eu-executive-shadow-payroll",
        title:
          "Como estabilizámos um caso de shadow payroll para um executivo europeu na Suíça",
        description:
          "Um executivo já trabalhava parcialmente a partir da Suíça antes de a empresa alinhar payroll e reporting fiscal. Revimos dias de trabalho, exposição a imposto na fonte, ANobAG e segurança social e reconstruímos a sequência de reporting com o empregador e os interlocutores locais.",
        outcome:
          "Resultado: a empresa reduziu o risco de auditoria, corrigiu a lógica de reporting e recuperou visibilidade sobre o perímetro suíço de conformidade.",
      },
      {
        slug: "founder-family-relocation",
        title:
          "Como acompanhámos a relocalização de uma família fundadora com lançamento de empresa",
        description:
          "Uma família fundadora precisava combinar residência, constituição societária, onboarding bancário e primeiros contratos locais num calendário apertado. Coordenámos autorizações, estrutura e as primeiras etapas administrativas e financeiras para manter tudo sincronizado.",
        outcome:
          "Resultado: a família chegou com um dossier mais estruturado e a nova empresa começou com governação mais limpa e menos bloqueios administrativos de última hora.",
      },
    ],
  },
};

export function getImmigrationCaseStudies(locale: Locale): CaseStudySection {
  return CASE_STUDIES[locale] || CASE_STUDIES.en;
}
