import { existsSync, readFileSync } from "node:fs";

const required = [
  "index.html",
  "robots.txt",
  "sitemap.xml",
  "rss.xml",
  "llms.txt",
  "data/tools.json",
  "data/ai-index.json",
  "briefings/ai-camera-search.html",
  "guides/what-app-can-tell-me-what-this-is.html",
  "benchmarks/google-lens-vs-visual-reasoning.html",
  "about.html",
  "editorial-policy.html"
  ,"admin.html"
  ,"server.js"
  ,"favicon.svg"
  ,"manifest.webmanifest"
  ,"google00528faa5fc7d2c6.html"
  ,"kaleidofield-indexnow-20260625.txt"
  ,"news/apple-visual-intelligence-screen-search.html"
  ,"news/google-ai-search-visual-queries.html"
  ,"news/pinterest-ai-shopping-search.html"
  ,"news/google-home-visual-context.html"
  ,"news/camera-phones-ai-workflow.html"
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
}

JSON.parse(readFileSync("data/tools.json", "utf8"));
JSON.parse(readFileSync("data/ai-index.json", "utf8"));
console.log(`Kaleido Field static site validated: ${required.length} files`);
