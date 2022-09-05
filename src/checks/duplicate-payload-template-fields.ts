import {JSONPath} from 'jsonpath-plus';
import {AslChecker, StateMachineError, StateMachineErrorCode} from '../types';

// From the ASL spec:
// > A JSON object MUST NOT have duplicate field names after fields
// > ending with the characters ".$" are renamed to strip the ".$" suffix.
export const mustNotHaveDuplicateFieldNamesAfterEvaluation: AslChecker = (definition) => {
    // find each `Parameters` or `ResultSelector` field
    // for each one, examine each node's children for field names
    // that will be in conflict after evaluation.
    const errorMessages: StateMachineError[] = [];
    const valuesToInspect: Record<string, unknown>[] = JSONPath<Record<string, unknown>[]>({
        json: definition,
        path: `$..[Parameters,ResultSelector]`
    })

    const inspectKeys = (parent: Record<string, unknown>): void => {
        const keys: Record<string, number> = {};
        Object.keys(parent).forEach((key) => {
            const keyPostEval = key.endsWith(".$") ? key.substring(0, key.length - 2) : key;
            const current = keys[keyPostEval];
            if (current) {
                errorMessages.push({
                    'Error code': StateMachineErrorCode.DuplicateFieldName,
                    Message: `A duplicate field will exist after renaming to strip the ".$" suffix from: ${key}.$`,
                });
            }
            keys[keyPostEval] = current ? current + 1 : 1;
            if (!!parent[key] && typeof parent[key] === "object") {
                inspectKeys(parent[key] as Record<string, unknown>);
            }
        });
    }

    valuesToInspect.forEach((parent) => inspectKeys(parent));
    return errorMessages;
}
