#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { program } from "commander";
import YAML from "yaml";

import validator from "../src/validator";
import { StateMachine, ValidationOptions } from "../src/types";

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

function getVersion(packageJsonPath: string): string | null {
  if (!fs.existsSync(packageJsonPath)) {
    return null;
  }
  const { version } = JSON.parse(
    fs.readFileSync(packageJsonPath).toString()
  ) as {
    version: string;
  };
  return version;
}

program
  .description("Amazon States Language validator")
  // make it work wether it is compiled or not
  .version(
    getVersion(path.join(__dirname, "../package.json")) ??
      getVersion(path.join(__dirname, "../../package.json")) ??
      ""
  )
  .option("--json-definition <jsonDefinition>", "JSON definition", collect, [])
  .option("--json-path <jsonPath>", "JSON path", collect, [])
  .option("--yaml-definition <yamlDefinition>", "YAML definition", collect, [])
  .option("--yaml-path <yamlPath>", "YAML path", collect, [])
  .option("--silent", "silent mode")
  .option("--no-path-check", "skips checking path expressions")
  .option("--no-arn-check", "skips the arn check for Resource values")
  .parse();

const options = program.opts();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function log(...args: any[]) {
  if (!options.silent) {
    // eslint-disable-next-line no-console, @typescript-eslint/no-unsafe-argument
    console.log(...args);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function error(...args: any[]) {
  if (!options.silent) {
    // eslint-disable-next-line no-console, @typescript-eslint/no-unsafe-argument
    console.error(...args);
  }
}

function validate(name: string, definition: StateMachine) {
  try {
    const validationOpts: ValidationOptions = {
      checkArn: !options.noArnCheck,
      checkPaths: !options.noPathCheck,
    };
    const result = validator(definition, validationOpts);
    if (result.isValid) {
      log(`✓ State machine definition "${name}" is valid`);
      return ExitCode.Success;
    }
    error(
      `✕ State machine definition "${name}" is invalid:\n`,
      result.errorsText()
    );
    return ExitCode.ValidationError;
  } catch (err) {
    error("Validator exception:", err);
    return ExitCode.ProgramError;
  }
}

function main() {
  try {
    const jsonDefinitions = (options.jsonDefinition ?? []) as string[];
    const jsonPaths = (options.jsonPath ?? []) as string[];
    const yamlDefinitions = (options.yamlDefinition ?? []) as string[];
    const yamlPaths = (options.yamlPath ?? []) as string[];
    if (
      jsonDefinitions.length === 0 &&
      jsonPaths.length === 0 &&
      yamlDefinitions.length === 0 &&
      yamlPaths.length === 0
    ) {
      log("No state machine to validate.");
      program.help();
    }

    let exitCode = ExitCode.Success;

    // Validate JSON definitions
    jsonDefinitions.forEach((jsonDefinition: string, index: number) => {
      const name = `JSON definition #${index + 1}`;
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
      const definition = JSON.parse(
        fs.readFileSync(jsonPath).toString()
      ) as StateMachine;
      exitCode = Math.max(exitCode, validate(jsonPath, definition));
    });

    // Validate YAML definitions
    yamlDefinitions.forEach((yamlDefinition: string, index: number) => {
      const name = `YAML definition #${index + 1}`;
      let definition;
      try {
        definition = YAML.parse(yamlDefinition) as StateMachine;
        exitCode = Math.max(validate(name, definition));
      } catch (err) {
        error(`Unable to parse ${name}`);
      }
    });

    // Validate YAML paths
    yamlPaths.forEach((yamlPath: string) => {
      const definition = YAML.parse(
        fs.readFileSync(yamlPath).toString()
      ) as StateMachine;
      exitCode = Math.max(exitCode, validate(yamlPath, definition));
    });

    exit(exitCode);
  } catch (err) {
    error(err);
    exit(ExitCode.ProgramError);
  }
}

main();
