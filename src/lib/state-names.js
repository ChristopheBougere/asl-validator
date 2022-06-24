const jp = require('jsonpath');

module.exports = (definition) => {
  const errorMessages = [];
  const names = new Map();
  jp.query(definition, '$..[\'States\']')
    .forEach((states) => {
      Object.keys(states).forEach((stateName) => {
        const current = names.get(stateName);
        names.set(stateName, current ? current + 1 : 1);
      });
      names.forEach((value, key) => {
        if (value > 1) {
          errorMessages.push({
            'Error code': 'DUPLICATE_STATE_NAMES',
            Message: `A state with this name already exists: ${key}`,
          });
        }
      });
    });

  return errorMessages;
};
