import {AslChecker, StateMachineError, StateMachineErrorCode} from "../types";
import {getStates, getStatesContainer} from "./get-states";

// performs the check that non-Terminal states do not contain a `Next` field.
// This replaces the following schema snippet:
// "oneOf": [{
//     "required": ["Next"]
//   }, {
//     "required": ["End"]
//   }],
export const terminalStateWithNext: AslChecker = (definition) => {
    const errorMessages: StateMachineError[] = [];
    getStatesContainer(definition).forEach((states) => {
        getStates(states).forEach(({stateName, state}) => {
            // Terminal fields don't need this check
            if (state.Type === 'Succeed' || state.Type === 'Fail' || state.Type === 'Choice') {
                return
            }
            if ('End' in state && 'Next' in state) {
                errorMessages.push({
                    "Error code": StateMachineErrorCode.TerminalStateWithNextError,
                    // Use of JSONPath within the error message is unnecessary
                    // since the state names are unique.
                    Message: `State "${stateName}" contains both "End" and "Next" fields.`,
                })
            }
        })
    })
    return errorMessages;
}
