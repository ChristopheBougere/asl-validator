import { JSONPath } from "jsonpath-plus";
import { AslChecker, StateMachineErrorCode, States } from "../types";

export const missingTransitionTargetErrors: AslChecker = (definition) => {
  // retrieve all states
  let machineStates: string[] = [];
  JSONPath<States[]>({ json: definition, path: "$..States" }).forEach((s) => {
    machineStates = machineStates.concat(Object.keys(s));
  });

  // retrieve all reachable states
  const reachableStates = JSONPath<string[]>({
    json: definition,
    path: "$..[StartAt,Next,Default]",
  }).filter((path, pos, array) => array.indexOf(path) === pos);

  // check if all states are reachable
  const unreachable = machineStates
    .filter((state) => reachableStates.indexOf(state) === -1)
    .map((state) => ({
      "Error code": StateMachineErrorCode.MissingTransitionTarget,
      Message: `State ${state} is not reachable`,
    }));

  // check if all 'Next', 'StartAt' and 'Default' states exist
  const inexistant = reachableStates
    .filter((state) => machineStates.indexOf(state) === -1)
    .map((state) => ({
      "Error code": StateMachineErrorCode.MissingTransitionTarget,
      Message: `Missing 'StartAt'|'Next'|'Default' target: ${state}`,
    }));

  return unreachable.concat(inexistant);
};
