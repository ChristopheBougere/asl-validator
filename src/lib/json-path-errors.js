const jp = require('jsonpath');

module.exports = definition => jp.query(definition, '$..[\'InputPath\',\'OutputPath\',\'ResultPath\']')
  .filter(path => typeof path === 'string')
  .map((path) => {
    try {
      jp.parse(path);
      return null;
    } catch (e) {
      return e;
    }
  })
  .filter(parsed => parsed); // remove null values to keep only errors
