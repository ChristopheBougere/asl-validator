import {getStates, getStatesContainer, StateEntry, StateFilter} from "./get-states";
import {State, StateMachine, StateMachineError, StateMachineErrorCode, ValidationOptions} from "../types";

export const IsMap = ({state}: StateEntry): boolean => {
    return state.Type === 'Map'
}

export const IsTask = ({state}: StateEntry): boolean => {
    return state.Type === 'Task'
}

export const IsWait = ({state}: StateEntry): boolean => {
    return state.Type === 'Wait'
}

export const IsSucceed = ({state}: StateEntry): boolean => {
    return state.Type === 'Succeed'
}

export const IsFail = ({state}: StateEntry): boolean => {
    return state.Type === 'Fail'
}

export const IsChoice = ({state}: StateEntry): boolean => {
    return state.Type === 'Choice'
}

export type StateChecker = (entry: StateEntry) => StateMachineError | null

export const stateChecks = (
    definition: StateMachine,
    options: ValidationOptions,
    checks: Array<{ filter: StateFilter, checker: StateChecker }>): StateMachineError[] => {

    const errorMessages: StateMachineError[] = [];
    // for each embedded state machine
    getStatesContainer(definition).forEach((states) => {
        // for each state entry (state + name)
        getStates(states).forEach((entry) => {
            // walk all checks and see if any care about this entry.
            // if so, invoke that checker and append any errors
            errorMessages.push(
                ...checks.filter((check) => {
                    return check.filter(entry)
                }).map(({checker}) => {
                    return checker(entry)
                }).filter((maybeErr) => !!maybeErr)
                    .map((err) => err as StateMachineError))
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

export const AtMostOne = ({props, errorCode}:{props: string[], errorCode: StateMachineErrorCode}): StateChecker => {
    return ({state, stateName}) => {
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
}

export const ExactlyOne = ({props, errorCode}:{props: string[], errorCode: StateMachineErrorCode}): StateChecker => {
    return ({state, stateName}) => {
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

}
