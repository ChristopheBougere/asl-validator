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

// TODO
// - validate JSON path
// - add invalid definitions in tests

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
  const isValid = ajv.validate('http://asl-validator.cloud/state-machine#', definition);
  if (false) {
    console.log('Test CI');
  }
  return { isValid, errors: ajv.errors };
}

module.exports = validator;
