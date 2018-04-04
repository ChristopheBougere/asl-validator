const jp = require('jsonpath');

module.exports = (definition) => {
  // retrieve all states
  let machineStates = [];
  jp.query(definition, '$..[\'States\']')
    .forEach((s) => {
      machineStates = machineStates.concat(Object.keys(s));
    });

  // retrieve all reachable states
  const reachableStates = jp.query(definition, '$..[\'StartAt\',\'Next\',\'Default\']')
    .filter(path => typeof path === 'string')
    .filter((path, pos, array) => array.indexOf(path) === pos);

  // check if all states are reachable
  return machineStates.filter(state => reachableStates.indexOf(state) === -1)
    .map(state => ({
      'Error code': 'MISSING_TRANSITION_TARGET',
      Message: `State ${state} is not reachable`,
    }));
};
