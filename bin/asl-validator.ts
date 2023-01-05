#!/usr/bin/env node
/* eslint-disable no-console, prefer-destructuring */

import fs from 'fs';
import program from 'commander';

import validator from '../src/validator';
import {StateMachine, ValidationOptions} from '../src/types';

program
  .description('Amazon States Language validator')
  .option('--json-definition <jsonDefinition>', 'JSON definition')
  .option('--json-path <jsonPath>', 'JSON path')
  .option('--silent', 'silent mode')
  .option('--no-path-check', 'skips checking path expressions')
  .option('--no-arn-check', 'skips the arn check for Resource values')
  .parse(process.argv);

let definition;
try {
  if (typeof program.jsonDefinition === 'string') {
    definition = JSON.parse(program.jsonDefinition) as StateMachine;
  } else if (typeof program.jsonPath === 'string') {
    definition = JSON.parse(fs.readFileSync(program.jsonPath).toString()) as StateMachine;
  } else {
    console.log('--json-definition or --json-path is required.');
    program.help();
  }
} catch (e) {
  if (!program.silent) {
    console.error('Unable to read or parse state machine definition:', e);
  }
  process.exit(2);
}
try {
  const validationOpts: ValidationOptions = {
    checkArn: !program.noArnCheck,
    checkPaths: !program.noPathCheck
  }
  const result = validator(definition, validationOpts);
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
  if (!program.silent) {
    console.error('Validator exception:', e);
  }
  process.exit(2);
}