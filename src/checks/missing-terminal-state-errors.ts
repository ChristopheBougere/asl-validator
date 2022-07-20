import {JSONPath} from 'jsonpath-plus';
import {AslChecker, StateMachineError, StateMachineErrorCode, States} from '../types';

export const missingTerminalStateErrors: AslChecker = (definition) => {
    const errorMessages: StateMachineError[] = [];
    // find each enclosed state machine and verify that
    // each state machine contains at least one of the following:
    // - state with End: true
    // - state with Type: Succeed
    // - state with Type: Fail
    const terminals: Record<string, number> = {};
    let fsmId = 1;
    JSONPath<States[]>({json: definition, path: '$..[\'States\']'})
        .forEach((states) => {
            const fsmKey = `fsm${fsmId}`;
            // initialize the nested fsm to have a terminal count of zero
            terminals[fsmKey] = 0;
            // check each of its states to see if the fsm terminates
            Object.keys(states).forEach((stateName) => {
                const state = states[stateName];
                const count = terminals[fsmKey];
                if (['Succeed', 'Fail'].indexOf(state.Type as string) !== -1 || state.End) {
                    terminals[fsmKey] = count ? count + 1 : 1;
                }
            });
            fsmId += 1;
        });
    for (const [key, value] of Object.entries(terminals)) {
        if (value === 0) {
            errorMessages.push({
                'Error code': StateMachineErrorCode.MissingTerminalState,
                // better to have a line number here
                Message: `State machine ${key} is missing a terminal state`,
            });
        }
    }

    return errorMessages;
}