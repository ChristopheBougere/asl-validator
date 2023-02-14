import {State, StateMachine, StateMachineError, StateMachineErrorCode} from "../types";
import {getStates, getStatesContainer, StateEntry} from "./get-states";

export const exactlyOneOfPropertyWorkflow = ({definition, filter, props, errorCode}: {
    definition: StateMachine,
    filter: (entry: StateEntry) => boolean
    props: string[],
    errorCode: StateMachineErrorCode
}): StateMachineError[] => {
    const errorMessages: StateMachineError[] = [];
    getStatesContainer(definition).forEach((states) => {
        getStates(states)
            .filter(filter).forEach(({stateName, state}) => {
            const error = exactlyOneOfProperty({
                props,
                state,
                stateName,
                errorCode
            })
            if (error) {
                errorMessages.push(error)
            }
        })
    })
    return errorMessages;

}

export const exactlyOneOfProperty = ({props, state, stateName, errorCode}: {
    props: string[],
    state: State,
    stateName: string,
    errorCode: StateMachineErrorCode
}): StateMachineError | null => {
    const count = props.map((prop) => prop in state ? 1 : 0)
        .map((val) => Number(val))
        .reduce((prev, curr) => prev + curr, 0)
    if (count !== 1) {
        return {
            "Error code": errorCode,
            // Use of JSONPath within the error message is unnecessary
            // since the state names are unique.
            Message: `State "${stateName}" MUST contain exactly one of ${props.map((p) => {
                return `"${p}"`
            }).join(", ")}`,

        }
    }
    return null
}
