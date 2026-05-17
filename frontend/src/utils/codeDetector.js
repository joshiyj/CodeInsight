// src/utils/codeDetector.js

/**
 * @typedef {'javascript'|'python'|'java'|'c'|'cpp'} SupportedLanguage
 */

/**
 * Each entry: { language, score: () => number }
 * Score is a count of matched signals. Highest score wins.
 * Minimum score of 2 required to trigger a switch (avoids false positives).
 */
const DETECTORS = [

  // ── Java ─────────────────────────────────────────────────────────────────
  {
    language: 'java',
    signals: [
      { re: /\bpublic\s+class\s+\w+/,                   weight: 4 }, // public class Foo
      { re: /\bpublic\s+static\s+void\s+main\s*\(/,     weight: 4 }, // main method
      { re: /\bSystem\.out\.print/,                      weight: 3 }, // System.out
      { re: /\bpublic\s+(?:static\s+)?(?:int|void|boolean|String|double|long|float)\s+\w+\s*\(/, weight: 3 },
      { re: /\bnew\s+\w+\s*[(<]/,                       weight: 2 }, // new Foo(
      { re: /\bimport\s+java\./,                         weight: 5 }, // import java.*
      { re: /\bimport\s+javax\./,                        weight: 5 },
      { re: /\b(?:int|boolean|double|long|float)\[\]/,  weight: 2 }, // int[]
      { re: /\bArrayList\b|\bHashMap\b|\bLinkedList\b/, weight: 3 },
      { re: /@Override\b/,                               weight: 3 },
      { re: /\bextends\b|\bimplements\b/,               weight: 2 },
      { re: /\bthrows\s+\w+/,                            weight: 2 },
      { re: /\bfinal\s+\w/,                              weight: 1 },
    ],
  },

  // ── C++ ──────────────────────────────────────────────────────────────────
  {
    language: 'cpp',
    signals: [
      { re: /#include\s*<(?:iostream|vector|string|algorithm|map|set|queue|stack|bits\/stdc\+\+)>/, weight: 5 },
      { re: /\busing\s+namespace\s+std\s*;/,            weight: 5 },
      { re: /\bstd::/,                                   weight: 4 },
      { re: /\bcout\s*<</,                               weight: 4 },
      { re: /\bcin\s*>>/,                                weight: 4 },
      { re: /\bvector\s*</,                              weight: 3 },
      { re: /\btemplate\s*</,                            weight: 3 },
      { re: /\bnullptr\b/,                               weight: 2 },
      { re: /\bauto\s+\w+\s*=/,                         weight: 1 }, // weak signal — also in JS
      { re: /::\w+/,                                     weight: 2 }, // scope resolution
      { re: /\bdelete\s+\w/,                             weight: 2 },
      { re: /\bconst\s+\w+\s*&/,                        weight: 2 }, // const ref
    ],
  },

  // ── C ────────────────────────────────────────────────────────────────────
  {
    language: 'c',
    signals: [
      { re: /#include\s*<(?:stdio|stdlib|string|math|time)\.h>/,  weight: 5 },
      { re: /\bprintf\s*\(/,                             weight: 4 },
      { re: /\bscanf\s*\(/,                              weight: 4 },
      { re: /\bmalloc\s*\(|\bcalloc\s*\(|\brealloc\s*\(/, weight: 4 },
      { re: /\bfree\s*\(/,                               weight: 3 },
      { re: /\bint\s+main\s*\(\s*(?:void|int)?\s*\)/,  weight: 4 },
      { re: /\bstruct\s+\w+\s*{/,                       weight: 3 },
      { re: /\btypedef\s+struct/,                        weight: 3 },
      { re: /\bNULL\b/,                                  weight: 2 },
      { re: /->/,                                        weight: 2 }, // pointer member access
    ],
  },

  // ── Python ───────────────────────────────────────────────────────────────
  {
    language: 'python',
    signals: [
      { re: /^#!/,                                       weight: 3 }, // shebang
      { re: /\bdef\s+\w+\s*\(/,                        weight: 4 }, // def foo(
      { re: /\bimport\s+\w+/,                           weight: 2 },
      { re: /\bfrom\s+\w+\s+import\b/,                 weight: 3 },
      { re: /\bprint\s*\(/,                             weight: 2 },
      { re: /:\s*\n\s+/m,                               weight: 3 }, // indented block after colon
      { re: /\belif\b/,                                 weight: 4 }, // Python-only keyword
      { re: /\bself\s*\./,                              weight: 4 }, // self.x
      { re: /\bNone\b|\bTrue\b|\bFalse\b/,             weight: 2 },
      { re: /\bclass\s+\w+(?:\s*\([\w,\s]*\))?\s*:/,  weight: 3 }, // class Foo:
      { re: /\blambda\s+\w+/,                           weight: 3 },
      { re: /f"[^"]*{[^}]+}[^"]*"/,                    weight: 3 }, // f-strings
      { re: /\brange\s*\(/,                             weight: 2 },
      { re: /"""[\s\S]*?"""/,                           weight: 2 }, // docstrings
    ],
  },

  // ── JavaScript ───────────────────────────────────────────────────────────
  {
    language: 'javascript',
    signals: [
      { re: /\bconst\s+\w+\s*=\s*(?:function|\(|async)/,  weight: 4 },
      { re: /\blet\s+\w+\s*=/,                         weight: 3 },
      { re: /\b(?:=>)\s*{?/,                            weight: 3 }, // arrow function
      { re: /\bconsole\.log\s*\(/,                      weight: 4 },
      { re: /\brequire\s*\(/,                           weight: 4 }, // CommonJS
      { re: /\bimport\s+.*\bfrom\s+['"]/,              weight: 4 }, // ES import
      { re: /\bexport\s+(?:default\s+)?(?:function|class|const)/, weight: 4 },
      { re: /\bPromise\b|\basync\s+function|\bawait\b/, weight: 3 },
      { re: /\bdocument\.\w+|\bwindow\.\w+/,           weight: 4 }, // DOM
      { re: /\bundefined\b|\btypeof\b/,                 weight: 2 },
      { re: /\bnull\b.*(?:===|!==)/,                   weight: 2 },
      { re: /`[^`]*\${[^}]+}[^`]*`/,                   weight: 3 }, // template literals
    ],
  },
];

/**
 * Detects the programming language of a code snippet.
 *
 * @param {string} code
 * @returns {{ language: SupportedLanguage, confidence: 'high'|'medium'|'low' } | null}
 *   Returns null if no language scores above the minimum threshold.
 */
export function detectLanguage(code) {
  if (!code || code.trim().length < 20) return null;

  const scores = DETECTORS.map(({ language, signals }) => {
    const score = signals.reduce((total, { re, weight }) => {
      return total + (re.test(code) ? weight : 0);
    }, 0);
    return { language, score };
  });

  // Sort descending
  scores.sort((a, b) => b.score - a.score);

  const best   = scores[0];
  const runner = scores[1];

  // Minimum score threshold — avoids false positives on tiny snippets
  if (best.score < 3) return null;

  // Gap between first and second must be meaningful to be confident
  const gap        = best.score - runner.score;
  const confidence = gap >= 4 ? 'high' : gap >= 2 ? 'medium' : 'low';

  // Don't switch on low confidence (too ambiguous)
  if (confidence === 'low') return null;

  return { language: best.language, confidence };
}