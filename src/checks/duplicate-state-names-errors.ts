import { JSONPath } from 'jsonpath-plus';
import { StateMachineDefinition, StateMachineError, StateMachineErrorCode } from '../types';

export default function duplicateStateNames(definition: StateMachineDefinition): StateMachineError[] {
  const errorMessages: StateMachineError[] = [];
  const names = new Map();
  JSONPath({ json: definition, path: '$..[\'States\']' })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .forEach((states: any) => {
      Object.keys(states).forEach((stateName) => {
        const current = names.get(stateName);
        names.set(stateName, current ? current + 1 : 1);
      });
    });
  names.forEach((value, key) => {
    if (value > 1) {
      errorMessages.push({
        'Error code': StateMachineErrorCode.DuplicateStateNames,
        Message: `A state with this name already exists: ${key}`,
      });
    }
  });

  return errorMessages;
}
