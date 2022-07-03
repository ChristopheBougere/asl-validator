import {ErrorObject} from 'ajv';

import jsonSchemaErrors from './checks/json-schema-errors';
import jsonPathErrors from  './checks/json-path-errors';
import missingTransitionTargetErrors from  './checks/missing-transition-target-errors';
import stateTransitionsErrors from  './checks/state-transitions-errors';
import duplicateStateNamesErrors from './checks/duplicate-state-names-errors';
import missingTerminalStateErrors from './checks/missing-terminal-state-errors';
import { StateMachine, StateMachineError } from './types';

export default function validator(definition: StateMachine): {
  isValid: boolean;
  errors: (ErrorObject | StateMachineError)[];
  errorsText: (separator?: string) => string;
} {

  const errors = jsonSchemaErrors(definition);
  if (errors.length === 0) {
    errors.push(...jsonPathErrors(definition));
    errors.push(...missingTransitionTargetErrors(definition));
    errors.push(...stateTransitionsErrors(definition));
    errors.push(...duplicateStateNamesErrors(definition));
    errors.push(...missingTerminalStateErrors(definition));
  }

  return {
    isValid: errors.length === 0,
    errors,
    errorsText: (separator = '\n') => errors
      .map(error => `${error['Error code']}: ${error.Message}`)
      .join(separator),
  };
}
