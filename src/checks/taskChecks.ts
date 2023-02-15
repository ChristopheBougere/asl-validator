import {AslChecker, StateMachineErrorCode} from "../types";
import {checkPropertyWorkflow} from "./checkProperty";

export const taskChecks: AslChecker = (definition) => {
    return [
        ...checkPropertyWorkflow({
            definition,
            filter: ({state}) => {
                return state.Type === 'Task'
            },
            propCheck: 'atMostOne',
            props: ["TimeoutSeconds", "TimeoutSecondsPath"],
            errorCode: StateMachineErrorCode.TaskTimeoutError,
        }),

        ...checkPropertyWorkflow({
            definition,
            filter: ({state}) => {
                return state.Type === 'Task'
            },
            propCheck: 'atMostOne',
            props: ["HeartbeatSeconds", "HeartbeatSecondsPath"],
            errorCode: StateMachineErrorCode.TaskHeartbeatError,
        })
    ]
}
