import { readFileSync } from "node:fs";
import { parseIssueBody } from "./parse-issue-body.mjs";

const MARKER = "<!-- eleventy-validator -->";
const VERIFIED = "eleventy-verified";
const NEEDS = "needs-verification";

const { GITHUB_TOKEN, GITHUB_REPOSITORY, GITHUB_EVENT_PATH } = process.env;
const { issue } = JSON.parse(readFileSync(GITHUB_EVENT_PATH, "utf8"));

async function api(path, method = "GET", body) {
	let res = await fetch(`https://api.github.com/repos/${GITHUB_REPOSITORY}/issues${path}`, {
		method,
		headers: {
			Authorization: `Bearer ${GITHUB_TOKEN}`,
			Accept: "application/vnd.github+json",
		},
		body: body && JSON.stringify(body),
	});
	// Removing a label that isn't on the issue returns 404.
	if(!res.ok && !(method === "DELETE" && res.status === 404)) {
		throw new Error(`GitHub API ${method} ${path} failed: ${res.status} ${await res.text()}`);
	}
	return res.json();
}

function getSiteUrl(body) {
	let value = parseIssueBody(body)["Site URL"];
	return URL.canParse(value) ? value : undefined;
}

async function check(url) {
	if(!url) {
		return { ok: false, message: "⚠️ No site URL found in this issue." };
	}

	try {
		let res = await fetch(`https://v1.generator.11ty.dev/json/${encodeURIComponent(url)}/`, {
			signal: AbortSignal.timeout(10000),
		});
		let { generator } = await res.json();
		if(generator?.toLowerCase().includes("eleventy")) {
			// Markdown and @mentions are inert inside a code span, so only backticks and newlines need removing.
			let safe = generator.replace(/[`\r\n]/g, "").slice(0, 100);
			return { ok: true, message: `✅ Found an Eleventy generator: \`${safe}\`` };
		}
		return { ok: false, message: "❌ No `<meta name=\"generator\" content=\"Eleventy\">` found on the site." };
	} catch(e) {
		return { ok: false, message: `⚠️ Could not reach the generator service (${e.name}).` };
	}
}

let { ok, message } = await check(getSiteUrl(issue.body));
let body = `${MARKER}\n${message}`;

let comments = await api(`/${issue.number}/comments?per_page=100`);
let existing = comments.find(c => c.user.login === "github-actions[bot]" && c.body?.includes(MARKER));
if(existing) {
	await api(`/comments/${existing.id}`, "PATCH", { body });
} else {
	await api(`/${issue.number}/comments`, "POST", { body });
}

await api(`/${issue.number}/labels/${encodeURIComponent(ok ? NEEDS : VERIFIED)}`, "DELETE");
await api(`/${issue.number}/labels`, "POST", { labels: [ok ? VERIFIED : NEEDS] });
