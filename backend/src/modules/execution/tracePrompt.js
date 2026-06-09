export function buildSimulationPrompt(code, language, simulationInput = '') {
  return `You are an exact code execution simulator for ${language}.

Simulate the code step by step and output ONLY a JSON array inside <trace>[...]</trace> tags.
No prose, no markdown, no explanation outside the tags.

Each step object must have ALL of these fields:
{
  "stepIndex": 0,
  "line": 1,
  "methodName": "functionName",
  "variables": { "varName": value },
  "callStack": ["main"],
  "description": "Specific description of what happens — e.g. Comparing arr[2]=5 with arr[3]=3",
  "highlightIndices": [],
  "stepType": "assign"
}

stepType must be one of: compare, swap, assign, call, return, loop, recurse

Rules:
- Every variable assignment, comparison, swap, function call, and return = a separate step
- variables must contain ALL in-scope variables with their CURRENT values at that step
- For array variables, always include the full current array state
- callStack must accurately reflect recursion depth — push on call, pop on return
- description must be specific and reference actual values: "Swapping arr[1]=3 and arr[4]=9"
- highlightIndices: indices in the primary array being accessed or compared at this step
- Hard cap: 500 steps maximum — stop after 500 and do not truncate mid-step

${simulationInput
  ? `Use this simulation input: ${simulationInput}`
  : 'Use a small representative input (5-6 elements for sorting, small values for recursion).'}

SOURCE CODE (${language}):
\`\`\`
${code}
\`\`\`

Produce the full trace now inside <trace>[...]</trace>:`;
}