import {ErrorObject} from 'ajv';

import {jsonSchemaErrors} from './checks/json-schema-errors';
import {missingTransitionTargetErrors} from './checks/missing-transition-target-errors';
import {stateTransitionsErrors} from './checks/state-transitions-errors';
import {duplicateStateNames} from './checks/duplicate-state-names-errors';
import {missingTerminalStateErrors} from './checks/missing-terminal-state-errors';
import {StateMachine, StateMachineError, ValidationOptions} from './types';
import {mustNotHaveDuplicateFieldNamesAfterEvaluation} from "./checks/duplicate-payload-template-fields";

const DefaultOptions: ValidationOptions = {
    checkPaths: true,
    checkArn: true,
}

export = function validator(definition: StateMachine, opts?: ValidationOptions): {
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
        errors.push(...mustNotHaveDuplicateFieldNamesAfterEvaluation(definition, options))
    }

    return {
        isValid: errors.length === 0,
        errors,
        errorsText: (separator = '\n') => errors
            .map(error => `${error['Error code']}: ${error.Message}`)
            .join(separator),
    };
}
