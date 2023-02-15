import {AslChecker, StateMachineErrorCode} from "../types";
import {checkPropertyWorkflow} from "./checkProperty";

export const waitDuration: AslChecker = (definition) => {
    return checkPropertyWorkflow({
        props: ["Seconds", "SecondsPath", "Timestamp", "TimestampPath"],
        errorCode: StateMachineErrorCode.WaitDurationError,
        definition,
        filter: ({state}) => {
            return state.Type === 'Wait'
        },
        propCheck: 'exactlyOne'
    })
}
