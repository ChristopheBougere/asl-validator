import Ajv, { ErrorObject } from "ajv";
import paths from "../schemas/paths.json";
import choice from "../schemas/choice.json";
import fail from "../schemas/fail.json";
import parallel from "../schemas/parallel.json";
import pass from "../schemas/pass.json";
import baseStateMachine from "../schemas/base-state-machine.json";
import stateMachine from "../schemas/state-machine.json";
import state from "../schemas/state.json";
import succeed from "../schemas/succeed.json";
import task from "../schemas/task.json";
import wait from "../schemas/wait.json";
import map from "../schemas/map.json";
import errors from "../schemas/errors.json";
import { AslChecker, StateMachineError, StateMachineErrorCode } from "../types";
import { registerAll } from "asl-path-validator";
import { isArnFormatValid } from "./formats";

export const jsonSchemaErrors: AslChecker = (definition, options) => {
  const ajv = new Ajv({
    schemas: [
      paths,
      choice,
      fail,
      parallel,
      pass,
      baseStateMachine,
      stateMachine,
      state,
      succeed,
      task,
      wait,
      map,
      errors,
    ],
    allowUnionTypes: true,
  });
  if (options.checkPaths) {
    registerAll(ajv);
  } else {
    ajv.addFormat("asl_path", () => true);
    ajv.addFormat("asl_ref_path", () => true);
    ajv.addFormat("asl_payload_template", () => true);
  }
  if (options.checkArn) {
    ajv.addFormat("asl_arn", isArnFormatValid);
  } else {
    ajv.addFormat("asl_arn", () => true);
  }
  ajv.validate("http://asl-validator.cloud/state-machine.json#", definition);

  // the use of oneOf can generate a lot of errors since it'll test
  // the value against each of the types and report its wrong on all.
  //
  // instance paths are suitable for error reporting and AJV will generate
  // these for us in their errors. The challenge is which to show when there
  // are multiple.
  //
  // for example, given the simplest example with a one-step definition with only
  // a Pass state. Introducing a typo for the OutputPath expression generates
  // 9 errors from AJV.
  //
  if (!ajv.errors) {
    return [];
  }
  // console.error(JSON.stringify(ajv.errors))

  // select the error with the deepest path
  let selectedErrors: ErrorObject[] = [];
  let deepest = 0;
  ajv.errors.forEach((error) => {
    const { instancePath } = error;
    const depth = instancePath.split("/").length;
    if (depth === deepest) {
      selectedErrors.push(error);
    } else if (depth > deepest) {
      selectedErrors = [error];
    }
    deepest = Math.max(deepest, depth);
  });

  // if there is a oneOf keyword error, then remove the
  // other non-format related errors before proceeding
  const instancePathsWithOneOfKeyword = new Set<string>();
  selectedErrors
    .filter((error) => error.keyword === "oneOf")
    .forEach((error) => {
      instancePathsWithOneOfKeyword.add(error.instancePath);
    });

  return (
    selectedErrors
      .filter(
        (error) =>
          error.keyword === "oneOf" ||
          !instancePathsWithOneOfKeyword.has(error.instancePath)
      )
      .map((error) => ({
        "Error code": StateMachineErrorCode.SchemaValidationFailed,
        Message: `${error.instancePath} is invalid. ${error.message ?? ""}`,
        schemaError: {
          instancePath: error.instancePath,
          schemaPath: decodeURIComponent(error.schemaPath),
        },
      }))
      // avoid returning a list of errors with duplicates
      // this filter will only return items if they don't already appear in an earlier position in the array
      .filter((v: StateMachineError, i, a) => {
        return (
          a.findIndex((v2) => {
            // duplicates are based on the schemaPath and instancePath
            return (
              v2.schemaError.schemaPath === v.schemaError?.schemaPath &&
              v2.schemaError.instancePath === v.schemaError?.instancePath
            );
          }) === i
        );
      })
  );
};
