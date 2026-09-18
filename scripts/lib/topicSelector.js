"use strict";

/**
 * Topic selector module for pre-generating article topics.
 * Ensures topics are chosen with knowledge of recent topics before generation,
 * avoiding rotation conflicts and CI failures.
 */

const {
  TOPIC_KEYWORDS,
  describeTopic,
  detectTopic,
} = require("./articleTopicGuardrails");

/**
 * Analyze recent articles and return available (non-avoided) topics.
 * @param {Object} frData - French resources data
 * @param {Array<string>} avoidTopics - Topics to avoid (from rotation window)
 * @param {number} rotationWindow - Number of recent articles to check
 * @returns {Object} { availableTopics, avoidedTopics, topicCounts, analysis }
 */
function getAvailableTopics(frData, avoidTopics = [], rotationWindow = 10) {
  const articles = Array.isArray(frData?.Articles) ? frData.Articles : [];
  const sorted = [...articles].sort((a, b) =>
    (b.date || "").localeCompare(a.date || ""),
  );
  const recent = sorted.slice(0, rotationWindow);

  // Count topics in recent articles
  const topicCounts = {};
  for (const topic of TOPIC_KEYWORDS) {
    topicCounts[topic.topic] = 0;
  }
  topicCounts["general"] = 0;

  for (const article of recent) {
    const topic = detectTopic(article);
    topicCounts[topic] = (topicCounts[topic] || 0) + 1;
  }

  // Build available topics (exclude rotation window + overrepresented)
  const avoidedTopics = new Set(avoidTopics);
  const overrepresented = [];
  for (const [topic, count] of Object.entries(topicCounts)) {
    if (count >= 2 && topic !== "general") {
      avoidedTopics.add(topic);
      overrepresented.push({ topic, count, label: describeTopic(topic) });
    }
  }

  const availableTopics = TOPIC_KEYWORDS.filter(
    (t) => !avoidedTopics.has(t.topic),
  ).map((t) => ({
    topic: t.topic,
    label: t.label,
    patterns: t.patterns,
  }));

  return {
    availableTopics,
    avoidedTopics: Array.from(avoidedTopics),
    avoidedTopicsLabels: Array.from(avoidedTopics).map(describeTopic),
    topicCounts,
    overrepresented,
    rotationWindow,
  };
}

/**
 * Build topic guidance for the AI agent, including explicit list of available topics.
 * @param {Object} analysis - Result from getAvailableTopics()
 * @returns {string} Formatted guidance text
 */
function buildTopicGuidanceForAgent(analysis) {
  if (!analysis || !Array.isArray(analysis.availableTopics)) {
    return "Choisis un sujet pertinent pour Ridger.";
  }

  const lines = [];
  lines.push("=== SÉLECTION DE THÈME (CRITIQUE) ===");

  if (analysis.avoidedTopicsLabels.length > 0) {
    lines.push(
      `⚠️ THÈMES À ABSOLUMENT ÉVITER (traités dans les ${analysis.rotationWindow} derniers articles):`
    );
    for (const label of analysis.avoidedTopicsLabels) {
      lines.push(`  ✗ ${label}`);
    }
  }

  lines.push("");
  lines.push(
    `✅ THÈMES DISPONIBLES (à privilégier pour respecter la rotation):`
  );
  for (const topicDef of analysis.availableTopics) {
    lines.push(`  ✓ ${topicDef.label}`);
  }

  lines.push("");
  lines.push(
    "INSTRUCTION: Choisis OBLIGATOIREMENT un article dont le thème figure dans la liste 'THÈMES DISPONIBLES'."
  );
  lines.push(
    "Une sélection parmi les thèmes évités entraînera le rejet de l'article."
  );

  return lines.join("\n");
}

/**
 * Validate that a generated article respects topic rotation constraints.
 * @param {Object} article - Generated article
 * @param {Object} analysis - Result from getAvailableTopics()
 * @returns {{ valid: boolean, error?: string, detectedTopic: string }}
 */
function validateArticleTopicAgainstAvailable(article, analysis) {
  if (!analysis || !Array.isArray(analysis.availableTopics)) {
    return { valid: true, detectedTopic: "unknown" };
  }

  const detectedTopic = detectTopic(article);

  // Check if detected topic is in the avoided list
  if (analysis.avoidedTopics.includes(detectedTopic)) {
    return {
      valid: false,
      detectedTopic,
      error: `Article topic "${describeTopic(detectedTopic)}" is in the avoided list (rotation constraint). Available topics: ${analysis.availableTopics.map((topic) => topic.label).join(", ")}`,
    };
  }

  return { valid: true, detectedTopic };
}

module.exports = {
  getAvailableTopics,
  buildTopicGuidanceForAgent,
  validateArticleTopicAgainstAvailable,
};
