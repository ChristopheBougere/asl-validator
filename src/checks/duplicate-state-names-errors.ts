import { JSONPath } from "jsonpath-plus";
import {
  AslChecker,
  StateMachineError,
  StateMachineErrorCode,
  States,
} from "../types";

export const duplicateStateNames: AslChecker = (definition) => {
  const errorMessages: StateMachineError[] = [];
  const names: Record<string, number> = {};
  JSONPath<States[]>({ json: definition, path: "$..['States']" }).forEach(
    (states) => {
      Object.keys(states).forEach((stateName) => {
        const current = names[stateName];
        names[stateName] = current ? current + 1 : 1;
      });
    }
  );
  for (const [key, value] of Object.entries(names)) {
    if (value > 1) {
      errorMessages.push({
        "Error code": StateMachineErrorCode.DuplicateStateNames,
        Message: `A state with this name already exists: ${key}`,
      });
    }
  }

  return errorMessages;
};
