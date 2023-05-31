#!/usr/bin/env node

import fs from 'fs';
import program from 'commander';

import validator from '../src/validator';
import {StateMachine, ValidationOptions} from '../src/types';

enum ExitCode {
  Success = 0,
  ValidationError = 1,
  ProgramError = 2,
}

function exit(exitCode: ExitCode) {
  process.exit(exitCode);
}

function collect(value: string, previous: string[]) {
  return previous.concat([value]);
}

program
  .description('Amazon States Language validator')
  .option('--json-definition <jsonDefinition>', 'JSON definition', collect, [])
  .option('--json-path <jsonPath>', 'JSON path', collect, [])
  .option('--silent', 'silent mode')
  .option('--no-path-check', 'skips checking path expressions')
  .option('--no-arn-check', 'skips the arn check for Resource values')
  .parse(process.argv);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function log(...args: any[]) {
  if (!program.silent) {
    // eslint-disable-next-line no-console, @typescript-eslint/no-unsafe-argument
    console.log(...args);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function error(...args: any[]) {
  if (!program.silent) {
    // eslint-disable-next-line no-console, @typescript-eslint/no-unsafe-argument
    console.error(...args);
  }
}

function validate(name: string, definition: StateMachine) {
  try {
    const validationOpts: ValidationOptions = {
      checkArn: !program.noArnCheck,
      checkPaths: !program.noPathCheck
    }
    const result = validator(definition, validationOpts);
    if (result.isValid) {
      log(`✓ State machine definition "${name}" is valid`);
      return ExitCode.Success;
    }
    error(`✕ State machine definition "${name}" is invalid:\n`, result.errorsText());
    return ExitCode.ValidationError;
  } catch (err) {
    error('Validator exception:', err);
    return ExitCode.ProgramError;
  }
}

function main() {
  try {
    const jsonDefinitions = (program.jsonDefinition ?? []) as string[];
    const jsonPaths = (program.jsonPath ?? []) as string[];
    if (jsonDefinitions.length === 0 && jsonPaths.length === 0) {
      log('--json-definition or --json-path is required.');
      program.help();
    }

    let exitCode = ExitCode.Success;

    // Validate JSON definitions
    jsonDefinitions.forEach((jsonDefinition: string, index: number) => {
      const name = `json definition #${index + 1}`;
      let definition;
      try {
        definition = JSON.parse(jsonDefinition) as StateMachine;
        exitCode = Math.max(validate(name, definition));
      } catch (err) {
        error(`Unable to parse ${name}`);
      }
    });

    // Validate JSON paths
    jsonPaths.forEach((jsonPath: string) => {
      const definition = JSON.parse(fs.readFileSync(jsonPath).toString()) as StateMachine;
      exitCode = Math.max(exitCode, validate(jsonPath, definition));
    });
    exit(exitCode);
  } catch (err) {
    error(err);
    exit(ExitCode.ProgramError);
  }
}

main();