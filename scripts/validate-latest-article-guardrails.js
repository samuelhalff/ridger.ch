"use strict";

const fs = require("fs");
const path = require("path");
const {
  describeTopic,
  findAllTimeNearDuplicate,
  findRecentTitleConflict,
  findRecentTopicConflict,
} = require("./lib/articleTopicGuardrails");

const ROOT = process.cwd();
const FR_PATH = path.join(ROOT, "src", "translations", "fr", "ressources.json");
const TOPIC_ROTATION_WINDOW = Math.max(
  1,
  parseInt(process.env.TOPIC_ROTATION_WINDOW || "10", 10) || 10,
);

function loadJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

if (!fs.existsSync(FR_PATH)) {
  fail(`Canonical FR ressources file not found: ${FR_PATH}`);
}

const frData = loadJSON(FR_PATH);
const articles = Array.isArray(frData.Articles) ? frData.Articles : [];
if (articles.length < 2) {
  console.log("ℹ️ Not enough FR articles to validate latest-article guardrails");
  process.exit(0);
}

const sorted = [...articles].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
const latest = sorted[0];
const recent = sorted.slice(1, TOPIC_ROTATION_WINDOW + 1);

function countWords(text) {
  if (typeof text !== "string") return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

if (
  !latest.category ||
  typeof latest.category !== "string" ||
  !Array.isArray(latest.tags) ||
  latest.tags.length < 3
) {
  fail(
    `Latest article lacks required taxonomy: category must be a non-empty STRING (an object shipped once and 500'd the article) and at least 3 tags are required (${latest.slug})`,
  );
}

const latestWords = countWords(latest.content || "");
if (latestWords < 700) {
  fail(
    `Latest article is too short: ${latestWords} words (minimum: 700) (${latest.slug})`,
  );
}

const titleConflict = findRecentTitleConflict(recent, latest, {
  windowSize: TOPIC_ROTATION_WINDOW,
});
if (titleConflict) {
  fail(
    titleConflict.code === "DUPLICATE_TITLE"
      ? `Latest article title duplicates recent content: "${latest.title}" matches "${titleConflict.previousTitle}"`
      : `Latest article title is too close to recent content: "${latest.title}" vs "${titleConflict.previousTitle}"`,
  );
}

const topicConflict = findRecentTopicConflict(recent, latest, {
  windowSize: TOPIC_ROTATION_WINDOW,
});
if (topicConflict) {
  if (topicConflict.code === "TOPIC_DUPLICATE") {
    fail(
      `Latest article repeats recent topic "${describeTopic(topicConflict.topic)}": "${latest.title}" vs "${topicConflict.previousTitle}"`,
    );
  }
  fail(
    `Latest article is too similar to recent content: "${latest.title}" vs "${topicConflict.previousTitle}"`,
  );
}

// The windowed checks above miss duplicates published months apart (the
// rotation window rolls past them). Compare against the whole corpus too.
const allTimeDuplicate = findAllTimeNearDuplicate(sorted.slice(1), latest);
if (allTimeDuplicate) {
  fail(
    `Latest article near-duplicates existing content (all-time check, ${allTimeDuplicate.code}): "${latest.title}" vs "${allTimeDuplicate.previousTitle}" (${allTimeDuplicate.previousSlug})`,
  );
}

console.log(
  `✅ Latest FR article passes taxonomy, length, duplicate-title, recent-topic and all-time near-duplicate guardrails (${TOPIC_ROTATION_WINDOW}-article window + full corpus)`,
);
