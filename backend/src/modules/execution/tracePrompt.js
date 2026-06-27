export function buildSimulationPrompt(code, language, simulationInput = '') {
  // Number every line explicitly so the model cannot miscount them.
  const numberedCode = code
    .split('\n')
    .map((line, i) => {
      const num = String(i + 1).padStart(4, ' ');
      return `${num}| ${line}`;
    })
    .join('\n');

  return `You are an exact code execution simulator for ${language}.

Simulate the code step by step and output ONLY a JSON array inside <trace>[...]</trace> tags.
No prose, no markdown fences, no explanation outside the tags. The content inside <trace>...</trace> must be 100% valid JSON — parseable by JSON.parse() with no modifications.

Each step object must have ALL of these fields:
{
  "stepIndex": 0,
  "line": 1,
  "methodName": "functionName",
  "variables": { "varName": <JSON value> },
  "callStack": ["main"],
  "description": "What happens at this exact step referencing actual values",
  "highlightIndices": [],
  "stepType": "assign"
}

stepType must be one of: compare, swap, assign, call, return, loop, recurse

STRICT JSON RULES — violations will break parsing:
- All strings must use double quotes " — NEVER single quotes '
- Characters and chars must be represented as double-quoted strings e.g. "a", "e", not 'a'
- Boolean values: true / false (lowercase, no quotes)
- Null: null (no quotes)
- Numbers: unquoted integers or decimals e.g. 0, 3.14
- Do NOT include trailing commas
- Do NOT include JavaScript comments inside the JSON

Simulation rules:
- Every variable assignment, comparison, loop iteration, function call, and return = a separate step
- variables must show ALL in-scope variables with their CURRENT values at that step
- For String inputs: represent the string as a JSON string e.g. "hello"
- For char variables: use a JSON string e.g. "h" — never a single-quoted char literal
- For array variables: always include the full current array state as a JSON array
- callStack: push method name on call, pop on return
- description: be specific — e.g. "ch = 'e', which is a vowel, incrementing count to 2"
- highlightIndices: for array operations (like accessing, comparing, or swapping), include the 0-based integer indices of the array elements involved at this step (e.g. [0, 1] when comparing or swapping arr[0] and arr[1]). For non-array code, use an empty array []
- Hard cap: 25 steps maximum — stop after 25 steps. Prioritize meaningful state changes only.
- Skip trivial steps like variable declarations with no value change.
- Combine loop condition check + increment into one step where possible.
- CRITICAL: The "line" field must be the EXACT line number from the prefix before | in the source below

Language-specific rules for C and C++:
- Pointer variables: represent their DEREFERENCED integer value, NOT a hex memory address. e.g. "ptr": 42 not "ptr": "0x7fff1234"
- Struct/node member access like node->val or node.val: use flat variable names e.g. "node_val": 5
- NULL pointers: use JSON null e.g. "ptr": null
- STL containers (vector, list, etc.): represent as a JSON array of their current elements e.g. "vec": [1, 2, 3]
- std::string: represent as a JSON string e.g. "s": "hello"
- size_t, long, unsigned int: represent as plain JSON numbers

${simulationInput
  ? `Use this simulation input: ${simulationInput}`
  : 'Choose a short, representative input — e.g. a 5–6 char string for string methods, a 5–6 element array for sorting, or small numbers for recursion.'}

SOURCE CODE (${language}) — line numbers are shown as "NNNN| <code>":
\`\`\`
${numberedCode}
\`\`\`

Produce the full trace now inside <trace>[...]</trace>:`;
}
