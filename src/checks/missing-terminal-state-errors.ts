import { JSONPath } from 'jsonpath-plus';
import { StateMachineDefinition, StateMachineError, StateMachineErrorCode } from '../types';

export default function missingTerminalStateErrors(definition: StateMachineDefinition): StateMachineError[] {
  const errorMessages: StateMachineError[] = [];
  // find each enclosed state machine and verify that
  // each state machine contains at least one of the following:
  // - state with End: true
  // - state with Type: Succeed
  // - state with Type: Fail
  const terminals = new Map();
  let fsmId = 1;
  JSONPath({ json: definition, path: '$..[\'States\']' })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .forEach((states: any) => {
      const fsmKey = `fsm${fsmId}`;
      // initialize the nested fsm to have a terminal count of zero
      terminals.set(fsmKey, 0);
      // check each of its states to see if the fsm terminates
      Object.keys(states).forEach((stateName) => {
        const state = states[stateName];
        const count = terminals.get(fsmKey);
        if (['Succeed', 'Fail'].indexOf(state.Type) !== -1 || state.End) {
          terminals.set(fsmKey, count ? count + 1 : 1);
        }
      });
      fsmId += 1;
    });
  terminals.forEach((value, key) => {
    if (value === 0) {
      errorMessages.push({
        'Error code': StateMachineErrorCode.MissingTerminalState,
        // better to have a line number here
        Message: `State machine ${key} is missing a terminal state`,
      });
    }
  });

  return errorMessages;
}
