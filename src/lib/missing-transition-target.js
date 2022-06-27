const { JSONPath } = require('jsonpath-plus');

module.exports = (definition) => {
  // retrieve all states
  let machineStates = [];
  JSONPath({ json: definition, path: '$..States' })
    .forEach((s) => {
      machineStates = machineStates.concat(Object.keys(s));
    });

  // retrieve all reachable states
  const reachableStates = JSONPath({ json: definition, path: '$..[StartAt,Next,Default]' })
    .filter((path) => typeof path === 'string')
    .filter((path, pos, array) => array.indexOf(path) === pos);

  // check if all states are reachable
  const unreachable = machineStates.filter((state) => reachableStates.indexOf(state) === -1)
    .map((state) => ({
      'Error code': 'MISSING_TRANSITION_TARGET',
      Message: `State ${state} is not reachable`,
    }));

  // check if all 'Next', 'StartAt' and 'Default' states exist
  const inexistant = reachableStates.filter((state) => machineStates.indexOf(state) === -1)
    .map((state) => ({
      'Error code': 'MISSING_TRANSITION_TARGET',
      Message: `Missing 'StartAt'|'Next'|'Default' target: ${state}`,
    }));

  return unreachable.concat(inexistant);
};
