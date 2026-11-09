// Maps each `### Label` section of a GitHub Issue Form body to its value.
export function parseIssueBody(body) {
	let fields = {};
	for(let section of (body ?? "").replace(/\r\n/g, "\n").split(/^### /m).slice(1)) {
		let [label, ...lines] = section.split("\n");
		let value = lines.join("\n").trim();
		fields[label.trim()] = value === "_No response_" ? "" : value;
	}
	return fields;
}
