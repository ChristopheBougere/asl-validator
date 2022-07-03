const { JSONPath } = require('jsonpath-plus');

module.exports = (definition) => JSONPath({ json: definition, path: '$..[InputPath,OutputPath,ResultPath]' })
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
      JSONPath({ path, json: definition });
      return null;
    } catch (e) {
      try {
        JSONPath({ path, json: [{}] });
        return null;
      } catch (e2) {
        // ignore, return first error
      }
      return e;
    }
  })
  .filter((parsed) => parsed); // remove null values to keep only errors
