"use strict";

/**
 * Offline stand-in for the Azure models, used by scripts/article-pipeline.test.js
 * (AI_MOCK_MODULE) to run the whole pipeline end to end — topic pick, keyword
 * derivation, research/reference handling, validation, 4 translations, parity
 * checks — without secrets or network. It produces deterministic,
 * rule-compliant articles from the context the pipeline passes in; it is NOT
 * content and never ships.
 */

const rules = require("../lib/ridgerArticleRules");

const L = {
  fr: { lead: "En bref", role: "Notre rôle", checked: "Sources officielles consultées le", faith: "La page officielle fait foi.", q: "Que faut-il savoir sur", q2: "Comment aborder", body: "Cette section décrit le cadre général, les étapes et les points de vigilance pour une famille établie en Suisse, avec un renvoi systématique aux autorités compétentes et aux partenaires spécialisés.", answer: "La réponse dépend de la situation de chaque famille et des règles cantonales applicables ; la page officielle citée donne le cadre à jour.", anchor: "notre coordination fiscale et administrative" },
  en: { lead: "In short", role: "Our role", checked: "Official sources checked on", faith: "The official page prevails.", q: "What should you know about", q2: "How should you approach", body: "This section sets out the general framework, the steps and the points to watch for a family settled in Switzerland, always referring to the competent authorities and specialist partners.", answer: "The answer depends on each family's situation and on the applicable cantonal rules; the official page cited gives the current framework.", anchor: "our tax and administrative coordination" },
  de: { lead: "Kurz gesagt", role: "Unsere Rolle", checked: "Offizielle Quellen geprüft am", faith: "Massgebend ist die offizielle Seite.", q: "Was sollten Sie wissen über", q2: "Wie gehen Sie vor bei", body: "Dieser Abschnitt beschreibt den allgemeinen Rahmen, die Schritte und die Punkte, auf die eine in der Schweiz ansässige Familie achten sollte, stets mit Verweis auf die zuständigen Behörden und spezialisierte Partner.", answer: "Die Antwort hängt von der Situation jeder Familie und den anwendbaren kantonalen Regeln ab; die zitierte offizielle Seite gibt den aktuellen Rahmen wieder.", anchor: "unsere steuerliche und administrative Koordination" },
  es: { lead: "En resumen", role: "Nuestro papel", checked: "Fuentes oficiales consultadas el", faith: "Prevalece la página oficial.", q: "Qué hay que saber sobre", q2: "Cómo abordar", body: "Esta sección describe el marco general, las etapas y los puntos de atención para una familia establecida en Suiza, remitiendo siempre a las autoridades competentes y a socios especializados.", answer: "La respuesta depende de la situación de cada familia y de las normas cantonales aplicables; la página oficial citada ofrece el marco actualizado.", anchor: "nuestra coordinación fiscal y administrativa" },
  pt: { lead: "Em resumo", role: "O nosso papel", checked: "Fontes oficiais consultadas em", faith: "Prevalece a página oficial.", q: "O que deve saber sobre", q2: "Como abordar", body: "Esta secção descreve o enquadramento geral, as etapas e os pontos de atenção para uma família estabelecida na Suíça, remetendo sempre para as autoridades competentes e parceiros especializados.", answer: "A resposta depende da situação de cada família e das regras cantonais aplicáveis; a página oficial citada apresenta o enquadramento atualizado.", anchor: "a nossa coordenação fiscal e administrativa" },
};

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function buildArticle(locale, { keywords, references, serviceUrl, today }) {
  const t = L[locale];
  const k = keywords[locale];
  const sec = k.secondary.length ? k.secondary : [k.primary];
  const para = Array(5).fill(t.body).join(" ");
  const sections = [0, 1, 2, 3].map((i) => {
    const kw = sec[i % sec.length];
    const link = i === 0 ? ` [${references[0].labelKey}](${references[0].url})` : "";
    return `## ${i % 2 ? t.q2 : t.q} ${kw} ?\n\n${para}${link}\n\n${para}`;
  });
  const faq = [1, 2, 3, 4].map((i) => `### ${t.q} ${sec[i % sec.length]} (${i + 10}) ?\n\n${t.answer}`);
  const content = [
    `${cap(k.primary)} : ${t.answer} ${t.lead}, 30 / 90.`,
    "",
    `## ${rules.KEY_FACTS_HEADINGS[locale]}`,
    "",
    `- ${t.answer} (2026)`,
    `- ${t.answer} (30)`,
    `- ${t.answer} (90)`,
    "",
    ...sections.flatMap((s) => [s, ""]),
    `## ${t.role}`,
    "",
    `${para} [${t.anchor}](${serviceUrl}).`,
    "",
    `${t.checked} ${today}. ${t.faith}`,
    "",
    `## ${rules.FAQ_HEADINGS[locale]}`,
    "",
    ...faq.flatMap((f) => [f, ""]),
  ].join("\n");
  const title = `${cap(k.primary)} : ${t.lead.toLowerCase()} (${locale})`.slice(0, 70);
  return {
    title,
    seoTitle: `${cap(k.primary)} — ${t.lead.toLowerCase()} et repères`.slice(0, 50),
    metaDescription: `${cap(k.primary)} — ${t.answer}`.slice(0, 155),
    description: t.answer,
    imageAlt: `${cap(k.primary)} — illustration`,
    tags: [k.primary, ...sec.slice(0, 4)].map((x) => x.toLowerCase()),
    content,
  };
}

module.exports = {
  research({ item, keywords, today }) {
    const k = keywords.fr;
    return {
      research: {
        slug: `${k.primary} guide ${item.id}`.slice(0, 70),
        title: `${cap(k.primary)} : en bref (fr)`,
        seoTitle: `${cap(k.primary)} — en bref et repères`.slice(0, 50),
        metaDescription: `${cap(k.primary)} — ${L.fr.answer}`.slice(0, 155),
        description: L.fr.answer,
        directAnswer: L.fr.answer,
        keyFacts: [],
        recentDevelopments: [{ date: today, status: "en vigueur", summary: "mock", source: "https://www.estv.admin.ch/" }],
        outline: [],
        faq: [],
        references: [
          { labelKey: "estv.admin.ch — Administration fédérale des contributions", url: "https://www.estv.admin.ch/estv/fr/home.html" },
          { labelKey: "fedlex.admin.ch — Recueil systématique", url: "https://www.fedlex.admin.ch/fr/home" },
          { labelKey: "ch.ch — Impôts", url: "https://www.ch.ch/fr/impots/" },
        ],
      },
    };
  },
  draft({ item, research, references, keywords, servicePathMaps, today }) {
    if (process.env.MOCK_FORBID_GENERATION === "1") throw new Error("mock: article generation called during a dry run");
    const a = buildArticle("fr", {
      keywords,
      references,
      serviceUrl: rules.localizedServiceUrl("fr", item.service, servicePathMaps),
      today,
    });
    return { newArticle: { ...a, slug: research.slug, title: research.title } };
  },
  repair({ article }) {
    return { newArticle: article };
  },
  translate({ locale, frArticle, keywords, servicePathMaps }) {
    if (process.env.MOCK_FORBID_GENERATION === "1") throw new Error("mock: translation called during a dry run");
    const a = buildArticle(locale, {
      keywords,
      references: frArticle.references,
      serviceUrl: rules.localizedServiceUrl(locale, "/services/tax-administration", servicePathMaps),
      today: frArticle.date,
    });
    return {
      ...a,
      tags: frArticle.tags.map((tag, i) => `${a.tags[i % a.tags.length]} ${locale}${i}`),
      referenceLabels: frArticle.references.map((r) => `${r.labelKey} (${locale})`),
    };
  },
};
