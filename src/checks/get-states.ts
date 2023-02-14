import {State, StateMachine, States} from "../types";
import {JSONPath} from "jsonpath-plus";

export const getStatesContainer = (definition: StateMachine) : States[] => {
    return JSONPath<States[]>({
        json: definition,
        path: '$..[\'States\']'
    })
}

export const getStates = (states: States): Array<{stateName: string, state: State & {Type: string}}> => {
    return Object.keys(states).map((stateName) => {
        const state = states[stateName]
        return {stateName, state}
    }).filter(({state}) => {
        // the schemas will validate if this Type field is valid.
        return 'Type' in state
    }).map(({state, stateName}) => { return {stateName, state: state as State & {Type: string}}})
}
