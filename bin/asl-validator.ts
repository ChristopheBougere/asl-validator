#!/usr/bin/env node
/* eslint-disable no-console, prefer-destructuring */

import fs from 'fs';
import program from 'commander';

import validator from '../src/validator';

function fail(message: string) {
  if (!program.silent) {
    console.error(message);
  }
  process.exit(2);
}

program
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
    definition = JSON.parse(fs.readFileSync(program.jsonPath).toString());
  } else {
    console.log('--json-definition or --json-path is required.');
    program.help();
  }
} catch (e) {
  fail(`Unable to read or parse state machine definition: ${e}`);
}
try {
  const result = validator(definition);
  if (result.isValid) {
    if (!program.silent) {
      console.log('✓ State machine definition is valid');
    }
    process.exit(0);
  } else {
    if (!program.silent) {
      console.error('✕ State machine definition is invalid:\n', result.errorsText());
    }
    process.exit(1);
  }
} catch (e) {
  fail(`Validator exception: ${e}`);
}
