import { JSONPath } from 'jsonpath-plus';
import { StateMachineDefinition, StateMachineError, StateMachineErrorCode } from '../types';

export default function missingTransitionTargetErrors(definition: StateMachineDefinition): StateMachineError[] {
  // retrieve all states
  let machineStates: string[] = [];
  JSONPath({ json: definition, path: '$..States' })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .forEach((s: any) => {
      machineStates = machineStates.concat(Object.keys(s));
    });

  // retrieve all reachable states
  const reachableStates = (JSONPath({ json: definition, path: '$..[StartAt,Next,Default]' })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((path: any) => typeof path === 'string') as string[])
    .filter((path: string, pos, array) => array.indexOf(path) === pos);

  // check if all states are reachable
  const unreachable = machineStates.filter((state) => reachableStates.indexOf(state) === -1)
    .map((state) => ({
      'Error code': StateMachineErrorCode.MissingTransitionTarget,
      Message: `State ${state} is not reachable`,
    }));

  // check if all 'Next', 'StartAt' and 'Default' states exist
  const inexistant = reachableStates.filter((state) => machineStates.indexOf(state) === -1)
    .map((state) => ({
      'Error code': StateMachineErrorCode.MissingTransitionTarget,
      Message: `Missing 'StartAt'|'Next'|'Default' target: ${state}`,
    }));

  return unreachable.concat(inexistant);
}
