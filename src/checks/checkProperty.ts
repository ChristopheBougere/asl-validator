import {State, StateMachine, StateMachineError, StateMachineErrorCode} from "../types";
import {getStates, getStatesContainer, StateEntry} from "./get-states";

type StatePropChecker = (args: {
    props: string[],
    state: State,
    stateName: string,
    errorCode: StateMachineErrorCode
}) => StateMachineError | null

export type StatePropCheckerType = 'exactlyOne' | 'atMostOne'

export const checkPropertyWorkflow = ({definition, filter, props, errorCode, propCheck}: {
    definition: StateMachine,
    filter: (entry: StateEntry) => boolean
    props: string[],
    propCheck: StatePropCheckerType
    errorCode: StateMachineErrorCode
}): StateMachineError[] => {

    const propChecker : StatePropChecker = propCheck === 'exactlyOne' ? checkProperty : atMostOneOfProperty

    const errorMessages: StateMachineError[] = [];
    getStatesContainer(definition).forEach((states) => {
        getStates(states)
            .filter(filter).forEach(({stateName, state}) => {
            const error = propChecker({
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

const getPropertyCount = ({props, state}: {
    props: string[],
    state: State,
}) : number => {
    return props.map((prop) => prop in state ? 1 : 0)
        .map((val) => Number(val))
        .reduce((prev, curr) => prev + curr, 0)
}

const checkProperty : StatePropChecker = ({props, state, stateName, errorCode})  => {
    const count = getPropertyCount({state, props})
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

const atMostOneOfProperty : StatePropChecker = ({props, state, stateName, errorCode})  => {
    const count = getPropertyCount({state, props})
    if (count > 1) {
        return {
            "Error code": errorCode,
            // Use of JSONPath within the error message is unnecessary
            // since the state names are unique.
            Message: `State "${stateName}" MUST contain at most one of ${props.map((p) => {
                return `"${p}"`
            }).join(", ")}`,

        }
    }
    return null
}
