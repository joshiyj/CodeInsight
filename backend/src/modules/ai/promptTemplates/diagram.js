export function buildDiagramPrompt(code, language) {
  return `You are a code visualization expert. Analyze the following ${language} code and produce a flowchart graph as JSON.

Return ONLY valid JSON inside <graph>...</graph> tags. No prose, no markdown, no backticks.

JSON schema:
{
  "nodes": [
    { "id": "A", "label": "plain text only", "shape": "rect" }
  ],
  "edges": [
    { "from": "A", "to": "B", "label": "optional edge label" }
  ]
}

Rules:
- Node IDs: single uppercase letters A, B, C... up to Z (max 15 nodes)
- Labels: use EXACT code syntax from the source — be specific
- Keep labels under 35 characters — split long labels across two short lines if needed
- For method/function start nodes: use ONLY the method name — not the full signature
  ✅ "Start binarySearch"   ❌ "public static int binarySearch(int[] arr, int target)"
- Strip all access modifiers and return types from labels: no "public", "static", "void", "int"
- For variable declarations: drop the type keyword
  ✅ "left = 0, right = arr.length - 1"   ❌ "int left = 0, int right = arr.length - 1"
- You MAY use: ( ) [ ] <= >= === !== == != + - * / . ? spaces
- The ONLY forbidden character is a double quote " — use single quote ' instead
- Decision nodes must show real conditions: "arr[mid] === target?"
- Assignment nodes must show actual values: "mid = Math.floor((left + right) / 2)"
- shape values: "rect" for steps, "diamond" for decisions, "rounded" for start and end nodes
- Edge labels: "Yes", "No", "True", "False", or leave blank
- Max 15 nodes
- If too trivial: emit <graph>NONE</graph>

Example output for binary search:
<graph>
{
  "nodes": [
    { "id": "A", "label": "Start binarySearch", "shape": "rounded" },
    { "id": "B", "label": "left = 0, right = arr.length - 1", "shape": "rect" },
    { "id": "C", "label": "left <= right?", "shape": "diamond" },
    { "id": "D", "label": "mid = (left + right) / 2", "shape": "rect" },
    { "id": "E", "label": "arr[mid] === target?", "shape": "diamond" },
    { "id": "F", "label": "return mid", "shape": "rect" },
    { "id": "G", "label": "arr[mid] < target?", "shape": "diamond" },
    { "id": "H", "label": "left = mid + 1", "shape": "rect" },
    { "id": "I", "label": "right = mid - 1", "shape": "rect" },
    { "id": "J", "label": "return -1", "shape": "rect" },
    { "id": "K", "label": "End", "shape": "rounded" }
  ],
  "edges": [
    { "from": "A", "to": "B" },
    { "from": "B", "to": "C" },
    { "from": "C", "to": "D", "label": "Yes" },
    { "from": "D", "to": "E" },
    { "from": "E", "to": "F", "label": "Yes" },
    { "from": "E", "to": "G", "label": "No" },
    { "from": "G", "to": "H", "label": "Yes" },
    { "from": "G", "to": "I", "label": "No" },
    { "from": "H", "to": "C" },
    { "from": "I", "to": "C" },
    { "from": "C", "to": "J", "label": "No" },
    { "from": "F", "to": "K" },
    { "from": "J", "to": "K" }
  ]
}
</graph>

SOURCE CODE (${language}):
\`\`\`
${code}
\`\`\`

Produce the graph JSON now:`;
}