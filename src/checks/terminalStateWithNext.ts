import {AslChecker, StateMachineErrorCode} from "../types";
import {checkPropertyWorkflow} from "./checkProperty";

// performs the check that non-Terminal states do not contain a `Next` field.
// This replaces the following schema snippet:
// "oneOf": [{
//     "required": ["Next"]
//   }, {
//     "required": ["End"]
//   }],
export const terminalStateWithNext: AslChecker = (definition) => {
    return checkPropertyWorkflow({
        props: ['End', 'Next'],
        errorCode: StateMachineErrorCode.TerminalStateWithNextError,
        definition,
        filter: ({state}) => {
            return state.Type !== 'Succeed' &&
                state.Type !== 'Fail' &&
                state.Type !== 'Choice'
        },
        propCheck: 'exactlyOne'
    })
}
