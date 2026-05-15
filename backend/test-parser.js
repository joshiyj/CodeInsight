import { parseIssues } from './src/modules/analysis/issueParser.js';

const text = `
Here is the review:
<issues>
[
  {
    "category": "performance",
    "line": 9,
    "column": 23,
    "endLine": 9,
    "message": "Potential integer overflow",
    "explanation": "Calculating mid",
    "suggestedFix": "Change left = mid;"
  }
</issues>
`;

console.log(parseIssues(text));
