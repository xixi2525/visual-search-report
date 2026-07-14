# Kaleido Field Operations

Updated: 2026-07-10

Kaleido Field is currently a static editorial site served by a small Node server on Railway.
The production domain is `https://kaleidofield.com`.

## Current Hosting

- Production host: Railway
- Project: GEO News Web
- Service: kaleido-field
- Domains: `kaleidofield.com`, `www.kaleidofield.com`
- Start command: `node server.js`
- Validation command: `npm run build`

There is no Sites project attached to this source yet. A move to Sites should be treated as
a migration project, not a routine deploy, because the current site depends on a custom
Node server and runtime admin API.

## Source Of Truth

Local files in this folder are the source of truth.

Avoid using the production admin editor for normal publishing. Railway containers can be
replaced on redeploy, so edits made only through the live admin surface can be lost and will
not appear in version history. Use the admin editor only for emergency copy fixes, then copy
the same fix back into the local source before the next deploy.

## Publishing Checklist

Before publishing:

1. Confirm the page belongs to one of the editorial desks in `EDITORIAL_STRATEGY.md`.
2. Confirm the page has a direct answer or thesis near the top.
3. Confirm source links, method notes, and evidence boundaries are clear.
4. Confirm images are story-specific and not reused without a reason.
5. Run `npm run build`.
6. Read the generated `output/seo-agent-daily-YYYY-MM-DD.md` report.
7. Deploy only after local validation passes.

After publishing:

1. Check `https://kaleidofield.com/`.
2. Check `https://kaleidofield.com/sitemap.xml`.
3. Check the new or changed URLs directly.
4. Submit changed URLs through IndexNow when applicable.
5. Record the batch in `output/` with pages changed, evidence added, and follow-up queries.

## Site Health Signals

Use these as the default management scorecard:

- Local validation: all required files pass.
- Sitemap count: expected canonical HTML pages only.
- `llms.txt` and `data/ai-index.json` include new or materially changed pages.
- Article pages include a direct answer block and conversion block.
- Production deployment is running.
- Custom domains are active.
- Recent HTTP errors are explainable, such as `/wp-login.php` probes or protected `/admin`.

## Sites Migration Notes

Sites is still a good fit if the goal is easier versioned site management inside Codex.
Do the migration in a separate branch or copy of the project.

Recommended migration path:

1. Keep Railway live while preparing the Sites version.
2. Convert the static pages into a Sites-compatible app structure.
3. Preserve canonical URLs exactly.
4. Preserve `robots.txt`, `sitemap.xml`, `rss.xml`, `llms.txt`, and machine-readable data files.
5. Replace the runtime admin editor with a source-controlled publishing workflow or a proper CMS.
6. Deploy a private Sites preview first.
7. Move the custom domain only after parity checks pass.

Do not attach `kaleidofield.com` to Sites until the Sites build has matching URL behavior,
metadata, structured data, and machine-readable files.
