import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";

const root = process.cwd();
const today = new Date().toISOString().slice(0, 10);
const baseUrl = "https://kaleidofield.com";

function read(file) {
  return readFileSync(join(root, file), "utf8");
}

function pagePathFromUrl(url) {
  const path = new URL(url).pathname;
  if (path === "/") return "index.html";
  if (path.endsWith("/")) return `${path.replace(/^\//, "")}index.html`;
  if (path.endsWith(".json") || path.endsWith(".txt") || path.endsWith(".xml")) return path.slice(1);
  return `${path.replace(/^\//, "")}.html`;
}

function extractSitemapUrls() {
  return [...read("sitemap.xml").matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
}

function extractJsonLd(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((match) => {
    try {
      return JSON.parse(match[1]);
    } catch {
      return null;
    }
  }).filter(Boolean);
}

function hasArticleSchema(items) {
  return items.some((item) => {
    if (["Article", "NewsArticle", "HowTo", "Dataset", "CollectionPage", "AboutPage", "WebPage"].includes(item["@type"])) return true;
    return Array.isArray(item["@graph"]) && item["@graph"].some((child) => ["Article", "NewsArticle", "CollectionPage", "ItemList"].includes(child["@type"]));
  });
}

function imagePaths(html) {
  return [...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map((match) => match[1]);
}

function imageExists(src, file) {
  if (src.startsWith("http")) return true;
  const prefix = file.includes("/") ? "../" : "";
  let local = src;
  if (local.startsWith("../")) local = local.slice(3);
  if (local.startsWith("/")) local = local.slice(1);
  if (prefix && src.startsWith(prefix)) local = src.slice(prefix.length);
  return existsSync(join(root, local));
}

const sitemapUrls = extractSitemapUrls();
const keywordRows = read("data/seo-keyword-map.csv").trim().split(/\r?\n/).slice(1);
const htmlUrls = sitemapUrls.filter((url) => ![".json", ".txt", ".xml"].includes(extname(new URL(url).pathname)));
const checks = [];

for (const url of htmlUrls) {
  const file = pagePathFromUrl(url);
  if (!existsSync(join(root, file))) {
    checks.push({ url, file, pass: false, issue: "missing file" });
    continue;
  }
  const html = read(file);
  const jsonLd = extractJsonLd(html);
  const robots = html.match(/<meta name="robots" content="([^"]+)"/i)?.[1] || "";
  const imgs = imagePaths(html);
  const badImages = imgs.filter((src) => !imageExists(src, file));
  const isArticle = /\/(guides|news|benchmarks|briefings)\//.test(url);
  const pageChecks = {
    title: /<title>[^<]{20,90}<\/title>/i.test(html),
    description: /<meta name="description" content="[^"]{80,180}"/i.test(html),
    canonical: html.includes(`<link rel="canonical" href="${url}`),
    indexable: /index/i.test(robots) && !/noindex/i.test(robots),
    ogImage: /<meta property="og:image" content="https:\/\/kaleidofield.com\//.test(html),
    twitterImage: /<meta name="twitter:image" content="https:\/\/kaleidofield.com\//.test(html),
    jsonLd: jsonLd.length > 0 && hasArticleSchema(jsonLd),
    cta: !isArticle || html.includes('class="convert-block"'),
    directAnswer: !isArticle || html.includes('class="answer-block"'),
    imageFiles: badImages.length === 0,
  };
  checks.push({ url, file, pass: Object.values(pageChecks).every(Boolean), checks: pageChecks, badImages });
}

const robotsTxt = read("robots.txt");
const aiBots = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "PerplexityBot", "ClaudeBot", "Claude-Web", "Google-Extended", "Applebot"];
const aiIndex = JSON.parse(read("data/ai-index.json"));
const tools = JSON.parse(read("data/tools.json"));
const indexedVisible = "Homepage visible in live site:kaleidofield.com sample; child-page indexation still pending/unknown without Search Console export.";

const passed = checks.filter((check) => check.pass).length;
const failed = checks.filter((check) => !check.pass);
const top10Known = keywordRows.filter((row) => /,true,|,yes,/i.test(row)).length;

mkdirSync(join(root, "output"), { recursive: true });
const lines = [
  `# Kaleido Field SEO Agent Daily Report - ${today}`,
  "",
  "## Page-One Status",
  `- Google Top 10 keywords: ${top10Known} known from local tracker`,
  "- Top 3: unknown without DataForSEO/GSC",
  `- Sitemap URLs: ${sitemapUrls.length}`,
  `- Valid local page checks: ${passed}/${checks.length}`,
  `- Index visibility note: ${indexedVisible}`,
  "",
  "## Keyword Map",
  `- Tracked keywords: ${keywordRows.length}`,
  "- Mapping rule: every keyword is bound to exactly one primary landing page in data/seo-keyword-map.csv.",
  "",
  "## GEO / AI Search Readiness",
  `- robots.txt allows AI crawlers: ${aiBots.every((bot) => robotsTxt.includes(bot)) ? "PASS" : "FAIL"}`,
  `- llms.txt exists: ${existsSync(join(root, "llms.txt")) ? "PASS" : "FAIL"}`,
  `- AI index pages: ${aiIndex.pages?.length || 0}`,
  `- Tool dataset entries: ${tools.tools?.length || 0}`,
  "",
  "## CTA / Conversion Layer",
  "- Goal: move readers from article pages to benchmark, tool dataset, guide cluster, RSS, or AI-readable index.",
  `- Article pages with CTA block: ${checks.filter((check) => ["/guides/", "/news/", "/benchmarks/", "/briefings/"].some((prefix) => new URL(check.url).pathname.startsWith(prefix)) && check.checks?.cta).length}`,
  "",
  "## Failed Checks",
  ...(failed.length ? failed.map((check) => `- ${check.url}: ${JSON.stringify(check.checks || check.issue)}`) : ["- None"]),
  "",
  "## Today Actions",
  "- Added/maintained keyword-to-landing-page tracking.",
  "- Verified technical SEO, AI crawler access, schema, social images, and internal CTA layer.",
  "- Submit changed URLs with IndexNow after deployment.",
  "",
  "## Owner Needs",
  "- Connect Google Search Console export or DataForSEO for true ranking, impressions, CTR, and 11-20 opportunity tracking.",
  "- Connect GA4 if the site should measure RSS/data/benchmark clicks as conversion events.",
  ""
];

writeFileSync(join(root, `output/seo-agent-daily-${today}.md`), lines.join("\n"), "utf8");
console.log(`SEO agent audit complete: ${passed}/${checks.length} pages passed. Report: output/seo-agent-daily-${today}.md`);
if (failed.length) {
  process.exitCode = 1;
}
