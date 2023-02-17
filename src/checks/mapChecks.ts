import {AslChecker, StateMachineErrorCode} from "../types";
import {checkPropertyWorkflow} from "./checkProperty";

export const mapChecks: AslChecker = (definition) => {
    return [
        ...checkPropertyWorkflow({
            definition,
            filter: ({state}) => {
                return state.Type === 'Map'
            },
            propCheck: 'exactlyOne',
            props: ["ItemProcessor", "Iterator"],
            errorCode: StateMachineErrorCode.MapItemProcessorError,
        }),
        ...checkPropertyWorkflow({
            definition,
            filter: ({state}) => {
                return state.Type === 'Map'
            },
            propCheck: 'atMostOne',
            props: ["ItemSelector", "Parameters"],
            errorCode: StateMachineErrorCode.MapItemSelectorError,
        }),
    ]
}
