const Ajv = require('ajv');
const jp = require('jsonpath');

const choice = require('./schemas/choice');
const fail = require('./schemas/fail');
const parallel = require('./schemas/parallel');
const pass = require('./schemas/pass');
const stateMachine = require('./schemas/state-machine');
const state = require('./schemas/state');
const succeed = require('./schemas/succeed');
const task = require('./schemas/task');
const wait = require('./schemas/wait');

function validator(definition) {
  const ajv = new Ajv({
    schemas: [
      choice,
      fail,
      parallel,
      pass,
      stateMachine,
      state,
      succeed,
      task,
      wait,
    ],
  });

  // Validating JSON paths
  const jsonPathErrors = jp.query(definition, '$..[\'InputPath\',\'OutputPath\',\'ResultPath\']')
    .map((path) => {
      try {
        jp.parse(path);
        return null;
      } catch (e) {
        return e;
      }
    })
    .filter(parsed => parsed); // remove null values to keep only errors

  // Validating JSON schemas
  const isJsonSchemaValid = ajv.validate('http://asl-validator.cloud/state-machine#', definition);

  return {
    isValid: isJsonSchemaValid && !jsonPathErrors.length,
    errors: jsonPathErrors.concat(ajv.errors || []),
  };
}

module.exports = validator;
