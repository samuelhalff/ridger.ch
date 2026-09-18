import type { Locale } from "@/src/lib/i18n";
import type { CaseStudyCard } from "@/src/components/site/case-studies-section";

type CaseStudySection = {
  title: string;
  intro: string;
  cases: CaseStudyCard[];
};

const CASE_STUDIES: Record<Locale, CaseStudySection> = {
  en: {
    title: "Anonymous tax case studies",
    intro:
      "Representative tax situations where structured Swiss advice mattered more than generic filing support.",
    cases: [
      {
        slug: "group-entry-geneva-tax",
        title:
          "How we aligned the Swiss tax setup for an international group entering Geneva",
        description:
          "A foreign group needed a Swiss setup that matched local registration, VAT, payroll, and corporate-tax reporting from day one. We coordinated the filing sequence, clarified the operating perimeter, and aligned the first local deadlines with the wider finance calendar.",
        outcome:
          "Result: the group started with a cleaner Swiss compliance baseline and fewer contradictory positions between tax, accounting, and operations.",
      },
      {
        slug: "expat-dual-tax-review",
        title:
          "How we reviewed dual-tax exposure for an executive moving between Switzerland and the EU",
        description:
          "An executive had overlapping residence, compensation, and travel questions affecting source tax and treaty treatment. We mapped the factual pattern, reviewed the payroll chain, and clarified what needed to be documented locally and abroad.",
        outcome:
          "Result: the client regained clarity on reporting duties and reduced the risk of inconsistent tax filings across jurisdictions.",
      },
      {
        slug: "vat-catchup-sme",
        title:
          "How we stabilized a Swiss VAT catch-up for a growing SME",
        description:
          "A growing company had outpaced its original VAT process and was filing with weak internal controls. We rebuilt the reporting logic, rechecked account mappings, and structured the support file needed for ongoing submissions and future reviews.",
        outcome:
          "Result: the SME moved back to a repeatable VAT process with clearer evidence and less month-end uncertainty.",
      },
    ],
  },
  fr: {
    title: "Études de cas fiscales anonymisées",
    intro:
      "Situations fiscales représentatives où un accompagnement suisse structuré comptait davantage qu’un simple dépôt de déclaration.",
    cases: [
      {
        slug: "group-entry-geneva-tax",
        title:
          "Comment nous avons aligné le dispositif fiscal suisse d’un groupe entrant à Genève",
        description:
          "Un groupe étranger devait lancer une présence suisse cohérente avec les inscriptions locales, la TVA, la paie et le reporting d’impôt sur les sociétés dès le départ. Nous avons coordonné la séquence des dépôts, clarifié le périmètre opérationnel et aligné les premières échéances locales sur le calendrier finance du groupe.",
        outcome:
          "Résultat : le groupe a démarré avec une base de conformité suisse plus propre et moins de contradictions entre fiscalité, comptabilité et opérations.",
      },
      {
        slug: "expat-dual-tax-review",
        title:
          "Comment nous avons revu une exposition à double imposition pour un dirigeant mobile entre la Suisse et l’UE",
        description:
          "Un dirigeant faisait face à des questions croisées de résidence, de rémunération et de jours de présence affectant l’impôt à la source et l’application des conventions. Nous avons cartographié les faits, revu la chaîne de paie et clarifié ce qui devait être documenté en Suisse et à l’étranger.",
        outcome:
          "Résultat : le client a retrouvé de la clarté sur ses obligations déclaratives et réduit le risque de positions incohérentes entre juridictions.",
      },
      {
        slug: "vat-catchup-sme",
        title:
          "Comment nous avons sécurisé une remise à niveau TVA pour une PME en croissance",
        description:
          "Une société en croissance avait dépassé son processus TVA initial et déclarait avec des contrôles internes insuffisants. Nous avons reconstruit la logique de reporting, revérifié les mappings comptables et structuré le dossier de support pour les dépôts à venir et les contrôles futurs.",
        outcome:
          "Résultat : la PME est revenue à un processus TVA plus reproductible, avec de meilleures preuves et moins d’incertitude en clôture.",
      },
    ],
  },
  de: {
    title: "Anonymisierte Steuer-Fallstudien",
    intro:
      "Typische Steuersituationen, in denen strukturierte Schweizer Beratung mehr gebracht hat als reine Einreichungsunterstützung.",
    cases: [
      {
        slug: "group-entry-geneva-tax",
        title:
          "Wie wir das Schweizer Steuersetup für einen internationalen Markteintritt in Genf abgestimmt haben",
        description:
          "Ein ausländischer Konzern brauchte von Beginn an ein stimmiges Schweizer Setup für Registrierungen, MWST, Payroll und Steuer-Reporting. Wir koordinierten die Einreichungsreihenfolge, klärten den operativen Umfang und richteten die ersten lokalen Fristen auf den globalen Finance-Kalender aus.",
        outcome:
          "Ergebnis: Der Konzern startete mit saubererer Schweizer Compliance und weniger Widersprüchen zwischen Steuern, Buchhaltung und Operations.",
      },
      {
        slug: "expat-dual-tax-review",
        title:
          "Wie wir eine Doppelbesteuerungs-Exponierung für eine mobile Führungskraft zwischen der Schweiz und der EU geprüft haben",
        description:
          "Eine Führungskraft hatte überlappende Fragen zu Ansässigkeit, Vergütung und Arbeitstagen mit Auswirkungen auf Quellensteuer und DBA-Anwendung. Wir erfassten die Fakten, prüften die Payroll-Kette und klärten, was lokal und im Ausland dokumentiert werden musste.",
        outcome:
          "Ergebnis: Der Kunde gewann Klarheit über seine Deklarationspflichten und reduzierte das Risiko widersprüchlicher Steuerpositionen.",
      },
      {
        slug: "vat-catchup-sme",
        title:
          "Wie wir einen MWST-Catch-up für ein wachsendes KMU stabilisiert haben",
        description:
          "Ein wachsendes Unternehmen war über sein ursprüngliches MWST-Setup hinausgewachsen und meldete mit schwachen Kontrollen. Wir bauten die Reporting-Logik neu auf, prüften Kontozuordnungen und strukturierten die Support-Unterlagen für laufende Einreichungen und spätere Prüfungen.",
        outcome:
          "Ergebnis: Das KMU erhielt einen wiederholbaren MWST-Prozess mit klarerer Dokumentation und weniger Unsicherheit im Monatsabschluss.",
      },
    ],
  },
  es: {
    title: "Casos fiscales anonimizados",
    intro:
      "Situaciones tributarias representativas en las que una coordinación suiza estructurada aportó más que un simple apoyo de presentación.",
    cases: [
      {
        slug: "group-entry-geneva-tax",
        title:
          "Cómo alineamos la implantación fiscal suiza de un grupo internacional en Ginebra",
        description:
          "Un grupo extranjero necesitaba una implantación suiza coherente con registros locales, IVA, nómina e impuesto sobre sociedades desde el primer día. Coordinamos la secuencia de trámites, aclaramos el perímetro operativo y alineamos los primeros vencimientos locales con el calendario financiero del grupo.",
        outcome:
          "Resultado: el grupo arrancó con una base de cumplimiento suizo más limpia y menos contradicciones entre fiscalidad, contabilidad y operaciones.",
      },
      {
        slug: "expat-dual-tax-review",
        title:
          "Cómo revisamos la exposición a doble imposición de un directivo móvil entre Suiza y la UE",
        description:
          "Un directivo tenía cuestiones cruzadas de residencia, remuneración y días trabajados que afectaban a la retención y a los convenios. Mapeamos los hechos, revisamos la cadena de nómina y aclaramos qué debía documentarse en Suiza y en el extranjero.",
        outcome:
          "Resultado: el cliente recuperó claridad sobre sus obligaciones declarativas y redujo el riesgo de posiciones fiscales incoherentes.",
      },
      {
        slug: "vat-catchup-sme",
        title:
          "Cómo estabilizamos una regularización de IVA para una pyme en crecimiento",
        description:
          "Una empresa en crecimiento había superado su proceso inicial de IVA y declaraba con controles internos débiles. Reconstruimos la lógica de reporting, revisamos los mapeos contables y organizamos el soporte documental para declaraciones futuras y posibles revisiones.",
        outcome:
          "Resultado: la pyme volvió a un proceso de IVA más repetible, con mejores evidencias y menos incertidumbre de cierre.",
      },
    ],
  },
  pt: {
    title: "Estudos de caso fiscais anonimizados",
    intro:
      "Situações fiscais representativas em que um acompanhamento suíço estruturado foi mais útil do que simples apoio de submissão.",
    cases: [
      {
        slug: "group-entry-geneva-tax",
        title:
          "Como alinhámos o setup fiscal suíço de um grupo internacional em Genebra",
        description:
          "Um grupo estrangeiro precisava de um arranque suíço coerente com registos locais, IVA, payroll e reporting de imposto societário desde o primeiro dia. Coordenámos a sequência de entregas, clarificámos o perímetro operacional e alinhámos os primeiros prazos locais com o calendário financeiro do grupo.",
        outcome:
          "Resultado: o grupo começou com uma base suíça de conformidade mais limpa e menos contradições entre fiscalidade, contabilidade e operações.",
      },
      {
        slug: "expat-dual-tax-review",
        title:
          "Como revimos a exposição a dupla tributação de um executivo móvel entre a Suíça e a UE",
        description:
          "Um executivo tinha questões sobre residência, remuneração e dias de trabalho com impacto em retenção na fonte e tratados. Mapeámos os factos, revimos a cadeia de payroll e clarificámos o que precisava de ser documentado na Suíça e no exterior.",
        outcome:
          "Resultado: o cliente recuperou clareza sobre as obrigações declarativas e reduziu o risco de posições fiscais incoerentes entre jurisdições.",
      },
      {
        slug: "vat-catchup-sme",
        title:
          "Como estabilizámos uma regularização de IVA para uma PME em crescimento",
        description:
          "Uma empresa em crescimento tinha ultrapassado o processo inicial de IVA e declarava com controlos internos fracos. Reconstruímos a lógica de reporting, revimos os mapeamentos contabilísticos e estruturámos o dossiê de suporte para entregas futuras e revisões.",
        outcome:
          "Resultado: a PME voltou a um processo de IVA mais repetível, com melhores evidências e menos incerteza no fecho.",
      },
    ],
  },
};

export function getTaxCaseStudies(locale: Locale): CaseStudySection {
  return CASE_STUDIES[locale] || CASE_STUDIES.en;
}
