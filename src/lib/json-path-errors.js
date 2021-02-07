const jp = require('jsonpath');

module.exports = (definition) => jp.query(definition, '$..[\'InputPath\',\'OutputPath\',\'ResultPath\']')
  .filter((path) => typeof path === 'string')
  .map((path) => {
    // Context object path starts with $$
    // https://docs.aws.amazon.com/step-functions/latest/dg/input-output-contextobject.html#contextobject-access
    if (path.startsWith('$$')) {
      return path.substring(1);
    }
    return path;
  })
  .map((path) => {
    try {
      jp.parse(path);
      return null;
    } catch (e) {
      return e;
    }
  })
  .filter((parsed) => parsed); // remove null values to keep only errors
