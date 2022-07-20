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
    JSONPath<Record<string, unknown>[]>({
        json: definition,
        // this uses some extensions to the original JSONPath spec supported by the lib
        //
        // extension 1: @property.match enables matching on the matched property name.
        //              This finds and selects all nodes with a name ending in .$
        // extension 2: ^ operator twice at the end selects the parent node instead of the value for the node
        //
        // also, don't miss the array offset [0] before selecting the grandparent.
        // There may be multiple fields within a node that could be in conflict.
        // We're checking all the keys in the parent node, so we only need a single
        // result for that parent.
        path: `$..[Parameters,ResultSelector]..*[?(@property.match(/^.+\\.\\$$/))][0]^^`
    })
        .forEach((parent) => {
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
            });
        });
    return errorMessages;
}