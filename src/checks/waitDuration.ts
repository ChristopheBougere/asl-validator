import {AslChecker, StateMachineErrorCode} from "../types";
import {exactlyOneOfPropertyWorkflow} from "./exactlyOneOfProperty";

export const waitDuration: AslChecker = (definition) => {
    return exactlyOneOfPropertyWorkflow({
        props: ["Seconds", "SecondsPath", "Timestamp", "TimestampPath"],
        errorCode: StateMachineErrorCode.WaitDurationError,
        definition,
        filter: ({state}) => {
            return state.Type === 'Wait'
        }
    })
}
