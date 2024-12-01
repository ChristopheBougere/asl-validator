import { ErrorObject } from "ajv";

import { jsonSchemaErrors } from "./checks/json-schema-errors";
import { missingTransitionTargetErrors } from "./checks/missing-transition-target-errors";
import { stateTransitionsErrors } from "./checks/state-transitions-errors";
import { duplicateStateNames } from "./checks/duplicate-state-names-errors";
import { missingTerminalStateErrors } from "./checks/missing-terminal-state-errors";
import {
  StateMachine,
  StateMachineError,
  StateMachineErrorCode,
  ValidationOptions,
} from "./types";
import { mustNotHaveDuplicateFieldNamesAfterEvaluation } from "./checks/duplicate-payload-template-fields";
import {
  AtMostOne,
  ExactlyOne,
  IsChoice,
  IsFail,
  IsMap,
  IsSucceed,
  IsTask,
  IsWait,
  None,
  stateChecks,
} from "./checks/state-checks";
import { StateEntry } from "./checks/get-states";

const DefaultOptions: ValidationOptions = {
  checkPaths: true,
  checkArn: true,
};

export = function validator(
  definition: StateMachine,
  opts?: ValidationOptions
): {
  isValid: boolean;
  errors: (ErrorObject | StateMachineError)[];
  errorsText: (separator?: string) => string;
} {
  // A state machine's query language defaults to JSONPath.
  // The interpreter MUST support JSONPath and JSONata, and
  // MAY support others.
  const defaultQueryLanguage = definition.QueryLanguage ?? "JSONPath";

  const IsJsonPath = ({ state }: StateEntry): boolean => {
    const queryLanguage = state.QueryLanguage ?? defaultQueryLanguage;
    return queryLanguage === "JSONPath";
  };
  const IsJsonNata = ({ state }: StateEntry): boolean => {
    const queryLanguage = state.QueryLanguage ?? defaultQueryLanguage;
    return queryLanguage === "JSONata";
  };

  const options = opts ?? DefaultOptions;
  const errors = jsonSchemaErrors(definition, options);
  if (errors.length === 0) {
    errors.push(...missingTransitionTargetErrors(definition, options));
    errors.push(...stateTransitionsErrors(definition, options));
    errors.push(...duplicateStateNames(definition, options));
    errors.push(...missingTerminalStateErrors(definition, options));
    errors.push(
      ...mustNotHaveDuplicateFieldNamesAfterEvaluation(definition, options)
    );
    errors.push(
      ...stateChecks(definition, options, [
        {
          filter: IsTask,
          checker: AtMostOne({
            props: ["TimeoutSeconds", "TimeoutSecondsPath"],
            errorCode: StateMachineErrorCode.TaskTimeoutError,
          }),
        },
        {
          filter: IsTask,
          checker: AtMostOne({
            props: ["HeartbeatSeconds", "HeartbeatSecondsPath"],
            errorCode: StateMachineErrorCode.TaskHeartbeatError,
          }),
        },
        {
          filter: IsMap,
          checker: ExactlyOne({
            props: ["ItemProcessor", "Iterator"],
            errorCode: StateMachineErrorCode.MapItemProcessorError,
          }),
        },
        {
          filter: IsMap,
          checker: AtMostOne({
            props: ["ItemSelector", "Parameters"],
            errorCode: StateMachineErrorCode.MapItemSelectorError,
          }),
        },
        {
          filter: IsWait,
          checker: ExactlyOne({
            props: ["Seconds", "SecondsPath", "Timestamp", "TimestampPath"],
            errorCode: StateMachineErrorCode.WaitDurationError,
          }),
        },
        {
          // performs the check that non-Terminal states do not contain a `Next` field.
          // This replaces the following schema snippet:
          // "oneOf": [{
          //     "required": ["Next"]
          //   }, {
          //     "required": ["End"]
          //   }],
          filter: (entry) => {
            return !(IsSucceed(entry) || IsFail(entry) || IsChoice(entry));
          },
          checker: ExactlyOne({
            props: ["End", "Next"],
            errorCode: StateMachineErrorCode.TerminalStateWithNextError,
          }),
        },
        {
          filter: IsMap,
          checker: AtMostOne({
            props: ["ToleratedFailureCount", "ToleratedFailureCountPath"],
            errorCode: StateMachineErrorCode.MapToleratedFailureError,
          }),
        },
        {
          filter: IsMap,
          checker: AtMostOne({
            props: [
              "ToleratedFailurePercentage",
              "ToleratedFailurePercentagePath",
            ],
            errorCode: StateMachineErrorCode.MapToleratedFailureError,
          }),
        },
        {
          filter: IsMap,
          checker: AtMostOne({
            props: ["MaxConcurrency", "MaxConcurrencyPath"],
            errorCode: StateMachineErrorCode.MapMaxConcurrencyError,
          }),
        },
        {
          filter: IsMap,
          checker: AtMostOne({
            props: ["MaxItems", "MaxItemsPath"],
            path: "$.ItemReader.ReaderConfig",
            errorCode: StateMachineErrorCode.MapItemReaderMaxItemsError,
          }),
        },
        {
          filter: IsMap,
          checker: AtMostOne({
            props: ["MaxItemsPerBatch", "MaxItemsPerBatchPath"],
            path: "$.ItemBatcher",
            errorCode: StateMachineErrorCode.MapItemBatcherError,
          }),
        },
        {
          filter: IsMap,
          checker: AtMostOne({
            props: ["MaxInputBytesPerBatch", "MaxInputBytesPerBatchPath"],
            path: "$.ItemBatcher",
            errorCode: StateMachineErrorCode.MapItemBatcherError,
          }),
        },
        {
          filter: IsFail,
          checker: AtMostOne({
            props: ["Cause", "CausePath"],
            errorCode: StateMachineErrorCode.FailCauseProperty,
          }),
        },
        {
          filter: IsFail,
          checker: AtMostOne({
            props: ["Error", "ErrorPath"],
            errorCode: StateMachineErrorCode.FailErrorProperty,
          }),
        },
        {
          filter: IsJsonNata,
          checker: None({
            props: [
              "InputPath",
              "OutputPath",
              "ResultPath",
              "Parameters",
              "ResultSelector",
            ],
            errorCode: StateMachineErrorCode.QueryLanguageFieldError,
          }),
        },
        {
          filter: IsJsonPath,
          checker: None({
            props: ["Arguments", "Output"],
            errorCode: StateMachineErrorCode.QueryLanguageFieldError,
          }),
        },
        {
          filter: (entry) => {
            return IsMap(entry) && IsJsonPath(entry);
          },
          checker: None({
            props: ["Arguments"],
            path: "$.ItemReader",
            errorCode: StateMachineErrorCode.QueryLanguageFieldError,
          }),
        },
      ])
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    errorsText: (separator = "\n") =>
      errors
        .map((error) => `${error["Error code"]}: ${error.Message}`)
        .join(separator),
  };
};
