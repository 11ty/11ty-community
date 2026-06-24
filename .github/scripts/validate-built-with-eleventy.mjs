// Fetches a submitted site and looks for an Eleventy signal in the HTML.
// This part only checks and writes a comment. Labeling and closing is the workflow's job, not ours.
//
//   node .github/scripts/validate-built-with-eleventy.mjs <site-url>

import { appendFileSync, writeFileSync } from "node:fs";

const COMMENT_MARKER = "<!-- eleventy-validator -->";
const FETCH_TIMEOUT_MS = 15000;
const USER_AGENT =
  "Mozilla/5.0 (compatible; 11ty-community-validator/1.0; +https://github.com/11ty/11ty-community)";

// A generator meta tag whose content mentions Eleventy, in either attribute order.
const META_GENERATOR =
  /<meta\b[^>]*\bname\s*=\s*["']generator["'][^>]*\bcontent\s*=\s*["']([^"']*)["'][^>]*>/i;
const META_GENERATOR_REVERSED =
  /<meta\b[^>]*\bcontent\s*=\s*["']([^"']*)["'][^>]*\bname\s*=\s*["']generator["'][^>]*>/i;

const NO_RESPONSE = /^_?no response_?$/i;

/** Parse a GitHub Issue Form body ("### Label\n\nvalue") into a label→value map. */
function parseIssueForm(body) {
  const fields = {};
  const re = /^###[ \t]+(.+?)[ \t]*\r?\n+([\s\S]*?)(?=\r?\n###[ \t]+|$)/gm;
  let m;
  while ((m = re.exec(body)) !== null) {
    const value = m[2].trim();
    fields[m[1].trim()] = NO_RESPONSE.test(value) ? "" : value;
  }
  return fields;
}

/** Pull the first http(s) URL out of an arbitrary string. */
function firstUrl(text) {
  const m = (text || "").match(/https?:\/\/[^\s)<>"'`]+/i);
  return m ? m[0] : "";
}

async function fetchHtml(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml" },
    });
    const html = await res.text();
    return { ok: res.ok, status: res.status, html, finalUrl: res.url };
  } finally {
    clearTimeout(timer);
  }
}

function findGeneratorMeta(html) {
  const m = html.match(META_GENERATOR) || html.match(META_GENERATOR_REVERSED);
  if (!m) return null;
  return /eleventy/i.test(m[1]) ? m[0] : null; // a non-Eleventy generator tag isn't a match
}

/**
 * @returns {{tier:'pass'|'weak'|'fail', verified:boolean, reasons:string[],
 *            generatorTag:string|null, fetchError:string|null}}
 */
function classify({ html, fetchError }) {
  const reasons = [];

  if (fetchError) {
    reasons.push(`Could not fetch the site (${fetchError}).`);
    return { tier: "fail", verified: false, reasons, generatorTag: null, fetchError };
  }

  const generatorTag = findGeneratorMeta(html);
  if (generatorTag) {
    reasons.push("Found a `generator` meta tag declaring Eleventy.");
    return { tier: "pass", verified: true, reasons, generatorTag, fetchError: null };
  }

  if (/eleventy/i.test(html)) {
    reasons.push('The word "Eleventy" appears in the page HTML.');
    reasons.push("But no `<meta name=\"generator\" content=\"Eleventy\">` tag was found.");
    return { tier: "weak", verified: false, reasons, generatorTag: null, fetchError: null };
  }

  reasons.push("No `<meta name=\"generator\">` tag mentioning Eleventy.");
  reasons.push('No mention of "Eleventy" in the page HTML.');
  return { tier: "fail", verified: false, reasons, generatorTag: null, fetchError: null };
}

function buildComment({ tier, siteUrl, result }) {
  const lines = [COMMENT_MARKER, "## 🤖 Automated Eleventy check", ""];
  const checklist = result.reasons.map((r) => `- ${r}`).join("\n");
  const site = siteUrl ? `[\`${siteUrl}\`](${siteUrl})` : "the submitted URL";

  if (tier === "pass") {
    lines.push(`✅ **Verified.** I found an Eleventy generator meta tag on ${site}.`, "");
    if (result.generatorTag) lines.push("```html", result.generatorTag, "```", "");
    lines.push(
      "This meets the [Eleventy Leaderboard](https://www.11ty.dev/speedlify/) eligibility requirement. A maintainer can add the `approved` label to publish it."
    );
  } else if (tier === "weak") {
    lines.push(
      `⚠️ **Needs a quick human check.** I couldn't confirm Eleventy automatically on ${site}, but there are some signals:`,
      "",
      checklist,
      "",
      "To be eligible for the [Eleventy Leaderboards](https://www.11ty.dev/speedlify/), please add this to your site's HTML:",
      "",
      '```html',
      '<meta name="generator" content="Eleventy">',
      "```",
      "",
      "Edit this issue after updating and I'll re-check automatically."
    );
  } else {
    lines.push(
      `❌ **Could not verify this is built with Eleventy.** I checked ${site} and found:`,
      "",
      checklist,
      "",
      "Per the [submission guidelines](https://github.com/11ty/11ty-community/issues/new/choose), your site's HTML should include:",
      "",
      '```html',
      '<meta name="generator" content="Eleventy">',
      "```",
      "",
      "Edit this issue after updating and I'll re-check automatically.",
      "",
      "_Note: this is an automated check. If your site blocks bots or renders entirely with client-side JavaScript, it may be Eleventy but unreadable to this check — a maintainer can still verify manually._"
    );
  }
  return lines.join("\n") + "\n";
}

function output(key, value) {
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
}

async function main() {
  // Two modes: CLI arg (local testing) or GitHub Actions env.
  const argSite = process.argv[2];
  let siteUrl;

  if (argSite) {
    siteUrl = argSite;
  } else {
    const fields = parseIssueForm(process.env.ISSUE_BODY || "");
    siteUrl = firstUrl(fields["Site URL"]) || firstUrl(process.env.ISSUE_TITLE);
  }

  if (!siteUrl) {
    const result = {
      tier: "fail",
      verified: false,
      reasons: ["No site URL could be found in this issue."],
      generatorTag: null,
      fetchError: null,
    };
    writeFileSync("comment.md", buildComment({ tier: "fail", siteUrl: "", result }));
    output("tier", "fail");
    output("verified", "false");
    console.log("No site URL found.");
    return;
  }

  let html = "";
  let fetchError = null;
  try {
    const res = await fetchHtml(siteUrl);
    html = res.html;
    if (!res.ok) fetchError = `HTTP ${res.status}`;
  } catch (err) {
    fetchError = err.name === "AbortError" ? "request timed out" : err.message || String(err);
  }

  const result = classify({ html, fetchError });
  const comment = buildComment({ tier: result.tier, siteUrl, result });
  writeFileSync("comment.md", comment);

  output("tier", result.tier);
  output("verified", String(result.verified));
  output("site_url", siteUrl);

  console.log(`Site:     ${siteUrl}`);
  console.log(`Tier:     ${result.tier}`);
  console.log(`Reasons:\n  - ${result.reasons.join("\n  - ")}`);
  console.log(`\n--- comment.md ---\n${comment}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
