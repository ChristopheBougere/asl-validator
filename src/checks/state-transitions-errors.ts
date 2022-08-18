import { JSONPath } from 'jsonpath-plus';
import {AslChecker, StateMachine, StateMachineError, StateMachineErrorCode, States} from '../types';

export const stateTransitionsErrors : AslChecker = (definition) => {
  const errorMessages: StateMachineError[] = [];

  // given a nested state machine, this function will examine
  // each state and record its `Next` or `Default` values
  // to see what states are reachable.
  // Avoids traversing into Map or Parallel states since the
  // states defined within those containers are not valid
  // targets for states outside the containers.
  const nextAndDefaultTargets = (nestedStateMachine: StateMachine) => {
    const states: string[] = [];
    Object.keys(nestedStateMachine.States)
      .forEach((stateName) => {
        const nestedState = nestedStateMachine.States[stateName];
        const isContainer = ['Map', 'Parallel'].indexOf(nestedState.Type as string) >= 0;
        if (isContainer) {
          states.push(...JSONPath<string[]>({
            json: nestedState,
            path: '$.Next',
          }));
          states.push(...JSONPath<string[]>({
            json: nestedState,
            path: '$.Default',
          }));
        } else {
          states.push(...JSONPath<string[]>({
            json: nestedState,
            path: '$..[Next,Default]',
          }));
        }
      });
    return states;
  };

  // reports an error for each state that is found to be an invalid
  // transition
  const validateNestedStateMachine = (nestedStateMachine: StateMachine) => {
    let availStateNames: string[] = [];
    // don't traverse into any nested states. We only want to record the States
    // that are immediately under the Branch.
    // These are the only valid states to link to from within the branch
    JSONPath<States[]>({
      json: nestedStateMachine,
      path: '$.States',
    })
      .forEach((branchStates) => {
        availStateNames = availStateNames.concat(Object.keys(branchStates));
      });

    // check that there are no transitions outside this branch
    const targetedStates = nextAndDefaultTargets(nestedStateMachine);

    return targetedStates.filter((state) => availStateNames.indexOf(state) === -1);
  };

  // we know the step function is schema valid
  // we know that every `Parallel` state has its expected `Branches` field
  // we need to visit each Branch within a Parallel to ensure that it doesn't
  // link outside its branch.
  JSONPath<StateMachine[][]>({
    json: definition,
    path: '$..Branches',
  })
    .forEach((parallelBranches) => {
      parallelBranches.forEach((nestedStateMachine) => {
        const errs = validateNestedStateMachine(nestedStateMachine).map((state) => ({
          'Error code': StateMachineErrorCode.BranchOutboundTransitionTarget,
          Message: `Parallel branch state cannot transition to target: ${state}`,
        }));

        errorMessages.push(...errs);
      });
    });

  // we know the step function is schema valid
  // we know that every `Map` state has its expected `Iterator` field
  // we need to visit the Iterator within a Map to ensure that it doesn't
  // link outside its container.
  JSONPath<StateMachine[]>({
    json: definition,
    path: '$..Iterator',
  })
    .forEach((nestedStateMachine) => {
      const errs = validateNestedStateMachine(nestedStateMachine)
        .map((state) => ({
          'Error code': StateMachineErrorCode.MapOutboundTransitionTarget,
          Message: `Map branch state cannot transition to target: ${state}`,
        }));

      errorMessages.push(...errs);
    });

  return errorMessages;
}
