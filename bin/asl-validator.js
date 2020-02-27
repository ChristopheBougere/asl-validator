#!/usr/bin/env node
/* eslint-disable no-console, strict, prefer-destructuring */

'use strict';

const fs = require('fs');
const program = require('commander');

const version = require('../package.json').version;
const validator = require('../src/validator');

function doneValid() {
  if (!program.silent) {
    console.log('✓ State machine definition is valid');
  }
  process.exit(0);
}

function doneInvalid(errors) {
  if (!program.silent) {
    console.error('✕ State machine definition is invalid:\n', errors);
  }
  process.exit(1);
}

function fail(message) {
  if (!program.silent) {
    console.error(message);
  }
  process.exit(2);
}

program
  .version(version, '-v, --version')
  .description('Amazon States Language validator')
  .option('--json-definition <jsonDefinition>', 'JSON definition')
  .option('--json-path <jsonPath>', 'JSON path')
  .option('--silent', 'silent mode')
  .parse(process.argv);

let definition;
try {
  if (typeof program.jsonDefinition === 'string') {
    definition = JSON.parse(program.jsonDefinition);
  } else if (typeof program.jsonPath === 'string') {
    definition = JSON.parse(fs.readFileSync(program.jsonPath));
  } else {
    program.help();
    fail('--json-definition or --json-path is required.');
  }
} catch (e) {
  fail(`Unable to read or parse state machine definition: ${e}`);
}
try {
  const result = validator(definition);
  if (result.isValid) {
    doneValid();
  } else {
    doneInvalid(result.errorsText());
  }
} catch (e) {
  fail(`Validator exception: ${e}`);
}
