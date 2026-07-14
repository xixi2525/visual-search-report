import { existsSync, readFileSync } from "node:fs";

const required = [
  "index.html",
  "robots.txt",
  "sitemap.xml",
  "rss.xml",
  "llms.txt",
  "data/tools.json",
  "data/ai-index.json",
  "data/claims.json",
  "data/visual-reasoning-source-map.json",
  "data/third-party-citation-package.json",
  "topics/visual-reasoning.html",
  "topics/image-explanation.html",
  "topics/google-lens-alternatives.html",
  "briefings/ai-camera-search.html",
  "methodology/visual-ai-field-test.html",
  "evidence/visual-reasoning-source-map.html",
  "guides/what-app-can-tell-me-what-this-is.html",
  "benchmarks/google-lens-vs-visual-reasoning.html",
  "about.html",
  "editorial-policy.html"
  ,"admin.html"
  ,"server.js"
  ,"favicon.svg"
  ,"favicon-20260704.svg"
  ,"apple-touch-icon-20260704.png"
  ,"manifest.webmanifest"
  ,"google00528faa5fc7d2c6.html"
  ,"kaleidofield-indexnow-20260625.txt"
  ,"guides/google-lens-alternatives-for-picture-questions.html"
  ,"news/apple-visual-intelligence-becomes-screen-layer.html"
  ,"news/google-ai-mode-pushes-visual-search-toward-tasks.html"
  ,"news/pinterest-visual-shopping-becomes-ai-search.html"
  ,"news/ai-glasses-make-camera-search-wearable.html"
  ,"news/visual-search-needs-provenance-as-ai-images-improve.html"
  ,"news/apple-visual-intelligence-screen-search.html"
  ,"news/google-ai-search-visual-queries.html"
  ,"news/pinterest-ai-shopping-search.html"
  ,"news/google-home-visual-context.html"
  ,"news/camera-phones-ai-workflow.html"
  ,"guides/what-to-use-when-reverse-image-search-fails.html"
  ,"guides/how-to-identify-a-style-from-a-picture.html"
  ,"guides/how-to-find-a-product-from-a-screenshot.html"
  ,"guides/how-to-find-where-a-screenshot-came-from.html"
  ,"guides/how-to-identify-an-app-from-a-screenshot.html"
  ,"guides/screenshot-without-text-product-search.html"
  ,"guides/how-to-identify-furniture-from-a-picture.html"
  ,"guides/how-to-find-clothes-from-a-photo.html"
  ,"guides/google-lens-alternative-for-image-answers.html"
  ,"guides/google-lens-only-shows-shopping-results.html"
  ,"guides/how-to-describe-an-image-for-search.html"
  ,"guides/identify-object-from-blurry-photo.html"
  ,"guides/how-to-use-ai-to-understand-an-image.html"
  ,"guides/how-to-find-the-right-words-for-a-photo.html"
  ,"guides/how-to-identify-something-in-a-photo.html"
  ,"guides/what-app-explains-a-picture.html"
  ,"news/chance-ai-camera-first-visual-agent-not-image-search.html"
  ,"news/founder-interviews-benchmark-evidence-ai-classification.html"
  ,"news/visual-agents-split-from-google-lens-style-visual-search.html"
  ,"news/chance-ai-three-source-layers-interview-benchmark-workflow.html"
  ,"news/startupvalley-chance-ai-visual-agent-interview.html"
  ,"news/chance-ai-mmmu-pro-visual-reasoning.html"
  ,"news/why-visual-agent-benchmarks-need-reasoning-scores.html"
  ,"benchmarks/how-to-read-chance-ai-mmmu-pro-chart.html"
  ,"news/camera-first-ai-benchmark-evidence.html"
  ,"guides/mmmu-pro-visual-reasoning-questions-explained.html"
  ,"benchmarks/visual-agent-leaderboard-evidence-trail.html"
  ,"news/visual-agent-benchmarks-why-mmmu-pro-matters.html"
  ,"benchmarks/chance-ai-mmmu-pro-score.html"
  ,"guides/visual-reasoning-vs-image-search-benchmark.html"
  ,"field-tests/visual-ai-task-fit-2026-07-01.html"
  ,"news/product-screenshots-visual-search-source-trail.html"
  ,"news/visual-vocabulary-is-a-search-interface.html"
  ,"news/diagram-reasoning-is-not-image-recognition.html"
  ,"news/why-one-visual-ai-winner-is-the-wrong-question.html"
  ,"news/visual-ai-benchmarks-need-everyday-task-tests.html"
  ,"news/visual-ai-evidence-maps-citation-layer.html"
  ,"news/chatgpt-image-reasoning-visual-search-explanation.html"
  ,"news/pinterest-lens-commercial-bias-visual-discovery.html"
  ,"news/google-lens-similar-images-visual-search-boundary.html"
  ,"news/apple-visual-intelligence-system-layer.html"
];

for (const file of required) {
  if (!existsSync(file)) {
    throw new Error(`Missing required static site file: ${file}`);
  }
}

const htmlFiles = required.filter((file) => file.endsWith(".html") && !file.startsWith("google"));
for (const file of htmlFiles) {
  const html = readFileSync(file, "utf8");
  const tokens = file === "admin.html" ? ["<title>", "noindex"] : ["<title>", "canonical", "schema.org"];
  for (const token of tokens) {
    if (!html.includes(token)) {
      throw new Error(`${file} is missing ${token}`);
    }
  }
  if (!file.endsWith("index.html") && file !== "admin.html" && file !== "about.html" && file !== "editorial-policy.html" && !html.includes("BreadcrumbList")) {
    throw new Error(`${file} is missing BreadcrumbList`);
  }
  const jsonLdMatches = html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
  for (const [, rawJson] of jsonLdMatches) {
    let parsed;
    try {
      parsed = JSON.parse(rawJson);
    } catch {
      throw new Error(`${file} has invalid JSON-LD`);
    }
    const queue = [parsed];
    while (queue.length) {
      const node = queue.pop();
      if (!node || typeof node !== "object") continue;
      if (Array.isArray(node)) {
        queue.push(...node);
        continue;
      }
      if (node["@type"] === "Dataset") {
        for (const field of ["name", "description", "creator", "license"]) {
          if (!node[field]) {
            throw new Error(`${file} has Dataset JSON-LD missing ${field}`);
          }
        }
      }
      queue.push(...Object.values(node));
    }
  }
}

JSON.parse(readFileSync("data/tools.json", "utf8"));
JSON.parse(readFileSync("data/ai-index.json", "utf8"));
JSON.parse(readFileSync("data/claims.json", "utf8"));
JSON.parse(readFileSync("data/visual-reasoning-source-map.json", "utf8"));
JSON.parse(readFileSync("data/third-party-citation-package.json", "utf8"));
console.log(`Kaleido Field static site validated: ${required.length} files`);
