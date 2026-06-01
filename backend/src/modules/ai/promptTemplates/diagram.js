export function buildDiagramPrompt(code, language) {
  return `You create algorithm flowcharts as JSON graphs. Analyze the ${language} code and produce a control-flow graph.

Return ONLY valid JSON inside <graph>...</graph>. No prose. No markdown.

Schema:
{ "nodes": [{ "id": "A", "label": "text", "shape": "rect" }],
  "edges": [{ "from": "A", "to": "B" }] }

Shapes: "rounded" = start/end only. "rect" = process/action. "diamond" = decision/condition.

CRITICAL RULES:
1. Every if-statement and loop condition in the code MUST be a diamond node.
2. Every diamond MUST have exactly 2 outgoing edges with "label": "Yes" and "label": "No".
3. Non-diamond edges MUST NOT have a "label" key. Never put "Yes"/"No" on rect or rounded edges.
4. Every for/while loop: condition diamond → Yes → body → back to condition. No → forward.
5. Group consecutive assignments into one node: "max = arr[0], i = 1" not two nodes.
6. Group swap operations into one node: "Swap arr[i], arr[j]".
7. Include return statements as their own node before End.
8. Labels: max 30 chars, no double quotes, conditions end with '?'.
9. Strip type keywords and access modifiers from labels.
10. Only show logic present in the code — never invent checks or conditions.
11. Use 7–14 nodes total. Every path must reach End.
12. If code is trivial, emit <graph>NONE</graph>

EXAMPLE 1 — Simple loop with condition (findMax):
<graph>
{
  "nodes": [
    { "id": "A", "label": "Start findMax", "shape": "rounded" },
    { "id": "B", "label": "max = arr[0], i = 1", "shape": "rect" },
    { "id": "C", "label": "i < arr.length?", "shape": "diamond" },
    { "id": "D", "label": "arr[i] > max?", "shape": "diamond" },
    { "id": "E", "label": "max = arr[i]", "shape": "rect" },
    { "id": "F", "label": "i++", "shape": "rect" },
    { "id": "G", "label": "return max", "shape": "rect" },
    { "id": "H", "label": "End", "shape": "rounded" }
  ],
  "edges": [
    { "from": "A", "to": "B" },
    { "from": "B", "to": "C" },
    { "from": "C", "to": "D", "label": "Yes" },
    { "from": "C", "to": "G", "label": "No" },
    { "from": "D", "to": "E", "label": "Yes" },
    { "from": "D", "to": "F", "label": "No" },
    { "from": "E", "to": "F" },
    { "from": "F", "to": "C" },
    { "from": "G", "to": "H" }
  ]
}
</graph>

EXAMPLE 2 — Nested loops (bubbleSort):
<graph>
{
  "nodes": [
    { "id": "A", "label": "Start bubbleSort", "shape": "rounded" },
    { "id": "B", "label": "n = arr.length", "shape": "rect" },
    { "id": "C", "label": "i < n - 1?", "shape": "diamond" },
    { "id": "D", "label": "j = 0", "shape": "rect" },
    { "id": "E", "label": "j < n - i - 1?", "shape": "diamond" },
    { "id": "F", "label": "arr[j] > arr[j+1]?", "shape": "diamond" },
    { "id": "G", "label": "Swap arr[j], arr[j+1]", "shape": "rect" },
    { "id": "H", "label": "j++", "shape": "rect" },
    { "id": "I", "label": "i++", "shape": "rect" },
    { "id": "J", "label": "return arr", "shape": "rect" },
    { "id": "K", "label": "End", "shape": "rounded" }
  ],
  "edges": [
    { "from": "A", "to": "B" },
    { "from": "B", "to": "C" },
    { "from": "C", "to": "D", "label": "Yes" },
    { "from": "C", "to": "J", "label": "No" },
    { "from": "D", "to": "E" },
    { "from": "E", "to": "F", "label": "Yes" },
    { "from": "E", "to": "I", "label": "No" },
    { "from": "F", "to": "G", "label": "Yes" },
    { "from": "F", "to": "H", "label": "No" },
    { "from": "G", "to": "H" },
    { "from": "H", "to": "E" },
    { "from": "I", "to": "C" },
    { "from": "J", "to": "K" }
  ]
}
</graph>

Key patterns in the examples:
- Every if/for/while = diamond with Yes and No
- Non-diamond edges have NO label
- Loop back-edges: F→C (inner), I→C (outer)
- return is a separate node before End
- Assignments grouped: "max = arr[0], i = 1" is ONE node

SOURCE CODE (${language}):
\`\`\`
${code}
\`\`\`

Produce the graph JSON now:`;
}