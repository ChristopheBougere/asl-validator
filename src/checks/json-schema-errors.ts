import Ajv, { ErrorObject } from "ajv";
import jsonata from "jsonata";
import addFormats from "ajv-formats";
import commonSchema from "../schemas/common.json";
import pathsSchema from "../schemas/paths.json";
import jsonataSchema from "../schemas/jsonata.json";
import choiceSchema from "../schemas/choice.json";
import failSchema from "../schemas/fail.json";
import parallelSchema from "../schemas/parallel.json";
import passSchema from "../schemas/pass.json";
import baseStateMachineSchema from "../schemas/base-state-machine.json";
import stateMachineSchema from "../schemas/state-machine.json";
import stateSchema from "../schemas/state.json";
import succeedSchema from "../schemas/succeed.json";
import taskSchema from "../schemas/task.json";
import waitSchema from "../schemas/wait.json";
import mapSchema from "../schemas/map.json";
import errorsSchema from "../schemas/errors.json";
import { AslChecker, StateMachineError, StateMachineErrorCode } from "../types";
import { registerAll } from "asl-path-validator";
import { isArnFormatValid } from "./formats";

export const jsonSchemaErrors: AslChecker = (definition, options) => {
  const ajv = new Ajv({
    schemas: [
      commonSchema,
      pathsSchema,
      jsonataSchema,
      choiceSchema,
      failSchema,
      parallelSchema,
      passSchema,
      baseStateMachineSchema,
      stateMachineSchema,
      stateSchema,
      succeedSchema,
      taskSchema,
      waitSchema,
      mapSchema,
      errorsSchema,
    ],
    allowUnionTypes: true,
  });
  addFormats(ajv);

  const validateJsonataString = (value: string): boolean => {
    const trimmed = value.trim();
    try {
      let expr = trimmed.startsWith("{%") ? trimmed.slice(2) : trimmed;
      expr = expr.endsWith("%}") ? expr.slice(0, -2) : expr;
      jsonata(expr);
      return true;
    } catch (err: unknown) {
      return false;
    }
  };
  const maybeJsonataString = (value: string): boolean => {
    const trimmed = value.trim();
    if (trimmed.startsWith("{%") || trimmed.endsWith("%}")) {
      return validateJsonataString(trimmed);
    }
    return true;
  };

  ajv.addFormat("jsonata_string", validateJsonataString);
  ajv.addFormat("maybe_jsonata_string", maybeJsonataString);
  if (options.checkPaths) {
    registerAll(ajv);
  } else {
    ajv.addFormat("asl_path", () => true);
    ajv.addFormat("asl_ref_path", () => true);
    ajv.addFormat("asl_payload_template", () => true);
    // An ASL ResultPath is a ReferencePath that cannot have variables.
    ajv.addFormat("asl_result_path", () => true);
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
