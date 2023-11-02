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
  stateChecks,
} from "./checks/state-checks";

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
