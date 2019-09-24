const Ajv = require('ajv');

const choice = require('./schemas/choice');
const fail = require('./schemas/fail');
const parallel = require('./schemas/parallel');
const pass = require('./schemas/pass');
const stateMachine = require('./schemas/state-machine');
const state = require('./schemas/state');
const succeed = require('./schemas/succeed');
const task = require('./schemas/task');
const wait = require('./schemas/wait');
const map = require('./schemas/map');
const checkJsonPath = require('./lib/json-path-errors');
const missingTransitionTarget = require('./lib/missing-transition-target');

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
      map,
    ],
  });

  // Validating JSON paths
  const jsonPathErrors = checkJsonPath(definition);

  // Check unreachable states
  const missingTransitionTargetErrors = missingTransitionTarget(definition);

  // Validating JSON schemas
  const isJsonSchemaValid = ajv.validate('http://asl-validator.cloud/state-machine#', definition);

  return {
    isValid: isJsonSchemaValid && !jsonPathErrors.length && !missingTransitionTargetErrors.length,
    errors: jsonPathErrors.concat(ajv.errors || []).concat(missingTransitionTargetErrors || []),
  };
}

module.exports = validator;
