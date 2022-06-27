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
const errors = require('./schemas/errors');
const checkJsonPath = require('./lib/json-path-errors');
const missingTransitionTarget = require('./lib/missing-transition-target');
const stateTransitions = require('./lib/state-transitions');
const stateNames = require('./lib/state-names');
const terminals = require('./lib/terminals');

function formatError(e) {
  const code = e.Code ? e.Code : e['Error code'];
  return code ? `${code}: ${e.Message}` : e.message;
}

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
      errors,
    ],
  });

  // Validating JSON schemas
  const isJsonSchemaValid = ajv.validate('http://asl-validator.cloud/state-machine.json#', definition);

  const postSchemaValidationErrors = [];
  if (isJsonSchemaValid) {
    postSchemaValidationErrors.push(...checkJsonPath(definition));
    postSchemaValidationErrors.push(...missingTransitionTarget(definition));
    postSchemaValidationErrors.push(...stateTransitions(definition));
    postSchemaValidationErrors.push(...stateNames(definition));
    postSchemaValidationErrors.push(...terminals(definition));
  }

  return {
    isValid: isJsonSchemaValid && !postSchemaValidationErrors.length,
    errors: (ajv.errors || []).concat(postSchemaValidationErrors || []),
    errorsText: (separator = '\n') => {
      const errorList = [];
      if (ajv.errors) {
        errorList.push(ajv.errorsText(ajv.errors, { separator }));
      }
      errorList.push(postSchemaValidationErrors.map(formatError).join(separator));
      return errorList.join(separator);
    },
  };
}

module.exports = validator;
