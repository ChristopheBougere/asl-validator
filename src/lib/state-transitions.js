const { JSONPath } = require('jsonpath-plus');

module.exports = (definition) => {
  const errorMessages = [];

  // given a nested state machine, this function will examine
  // each state and record its `Next` or `Default` values
  // to see what states are reachable.
  // Avoids traversing into Map or Parallel states since the
  // states defined within those containers are not valid
  // targets for states outside the containers.
  const nextAndDefaultTargets = (nestedStateMachine) => {
    const states = [];
    Object.keys(nestedStateMachine.States).forEach((stateName) => {
      const nestedState = nestedStateMachine.States[stateName];
      const isContainer = ['Map', 'Parallel'].indexOf(nestedState.Type) >= 0;
      const path = isContainer ? '$.[Next,Default]' : '$..[Next,Default]';
      states.push(...JSONPath({ json: nestedState, path }));
    });
    return states;
  };

  // reports an error for each state that is found to be an invalid
  // transition
  const validateNestedStateMachine = (nestedStateMachine) => {
    let availStateNames = [];
    // don't traverse into any nested states. We only want to record the States
    // that are immediately under the Branch.
    // These are the only valid states to link to from within the branch
    JSONPath({ json: nestedStateMachine, path: '$.States' }).forEach((branchStates) => {
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
  JSONPath({ json: definition, path: '$..Branches' })
    .forEach((parallelBranches) => {
      parallelBranches.forEach((nestedStateMachine) => {
        const errs = validateNestedStateMachine(nestedStateMachine).map((state) => ({
          'Error code': 'BRANCH_OUTBOUND_TRANSITION_TARGET',
          Message: `Parallel branch state cannot transition to target: ${state}`,
        }));

        errorMessages.push(...errs);
      });
    });

  // we know the step function is schema valid
  // we know that every `Map` state has its expected `Iterator` field
  // we need to visit the Iterator within a Map to ensure that it doesn't
  // link outside its container.
  JSONPath({ json: definition, path: '$..Iterator' })
    .forEach((nestedStateMachine) => {
      const errs = validateNestedStateMachine(nestedStateMachine).map((state) => ({
        'Error code': 'MAP_OUTBOUND_TRANSITION_TARGET',
        Message: `Map branch state cannot transition to target: ${state}`,
      }));

      errorMessages.push(...errs);
    });

  return errorMessages;
};
