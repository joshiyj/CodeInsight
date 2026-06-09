/**
 * Compares variables between consecutive steps and injects changedVariables[].
 * @param {Object[]} steps
 * @returns {Object[]}
 */
export function enrichSteps(steps) {
  return steps.map((step, i) => {
    if (i === 0) {
      return { ...step, changedVariables: Object.keys(step.variables || {}) };
    }
    const prev = steps[i - 1].variables || {};
    const curr = step.variables       || {};
    const changed = Object.keys(curr).filter(
      k => JSON.stringify(curr[k]) !== JSON.stringify(prev[k])
    );
    return { ...step, changedVariables: changed };
  });
}