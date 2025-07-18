import {
  getStates,
  getStatesContainer,
  StateEntry,
  StateFilter,
} from "./get-states";
import {
  StateMachine,
  StateMachineError,
  StateMachineErrorCode,
  ValidationOptions,
} from "../types";
import { JSONPath } from "jsonpath-plus";

export const IsMap = ({ state }: StateEntry): boolean => {
  return state.Type === "Map";
};

export const IsTask = ({ state }: StateEntry): boolean => {
  return state.Type === "Task";
};

export const IsWait = ({ state }: StateEntry): boolean => {
  return state.Type === "Wait";
};

export const IsSucceed = ({ state }: StateEntry): boolean => {
  return state.Type === "Succeed";
};

export const IsFail = ({ state }: StateEntry): boolean => {
  return state.Type === "Fail";
};

export const IsChoice = ({ state }: StateEntry): boolean => {
  return state.Type === "Choice";
};

export type StateChecker = (entry: StateEntry) => StateMachineError | null;

export const stateChecks = (
  definition: StateMachine,
  _options: ValidationOptions,
  checks: Array<{ filter: StateFilter; checker: StateChecker }>
): StateMachineError[] => {
  const errorMessages: StateMachineError[] = [];
  // for each embedded state machine
  getStatesContainer(definition).forEach((states) => {
    // for each state entry (state + name)
    getStates(states).forEach((entry) => {
      // walk all checks and see if any care about this entry.
      // if so, invoke that checker and append any errors
      errorMessages.push(
        ...checks
          .filter((check) => {
            return check.filter(entry);
          })
          .map(({ checker }) => {
            return checker(entry);
          })
          .filter((maybeErr) => !!maybeErr)
          .map((err) => err as StateMachineError)
      );
    });
  });
  return errorMessages;
};

const getPropertyCount = ({
  props,
  object,
}: {
  props: string[];
  object: Record<string, unknown>;
}): number => {
  return props
    .map((prop) => (prop in object ? 1 : 0))
    .map((val) => Number(val))
    .reduce((prev, curr) => prev + curr, 0);
};

const enforceMaxCount = ({
  props,
  errorCode,
  path,
  maxCount,
  errorMessage,
}: {
  props: string[];
  errorCode: StateMachineErrorCode;
  maxCount: number;
  errorMessage: string;
  // path to a sub-property within the state to use as the
  // context for the property checks. This is intended to
  // support enforcement of constraints on nested properties
  // within a State.
  // See the Map's ItemReader.ReaderConfiguration at most one
  // rule for MaxItems and MaxItemsPath.
  path?: string;
}): StateChecker => {
  return ({ state, stateName }) => {
    const object = path
      ? JSONPath<Record<string, unknown>>({
          path,
          json: state,
          wrap: false,
        })
      : state;
    if (!object) {
      return null;
    }
    const count = getPropertyCount({ object, props });
    if (count > maxCount) {
      return {
        "Error code": errorCode,
        // Use of JSONPath within the error message is unnecessary
        // since the state names are unique.
        Message: `State "${stateName}" ${errorMessage} ${props
          .map((p) => {
            return `"${p}"`;
          })
          .join(", ")}`,
      };
    }
    return null;
  };
};

export const AtMostOne = ({
  props,
  errorCode,
  path,
}: {
  props: string[];
  errorCode: StateMachineErrorCode;
  // path to a sub-property within the state to use as the
  // context for the property checks. This is intended to
  // support enforcement of constraints on nested properties
  // within a State.
  // See the Map's ItemReader.ReaderConfiguration at most one
  // rule for MaxItems and MaxItemsPath.
  path?: string;
}): StateChecker => {
  return enforceMaxCount({
    maxCount: 1,
    props,
    errorCode,
    path,
    errorMessage: "MUST contain at most one of",
  });
};

export const ExactlyOne = ({
  props,
  errorCode,
}: {
  props: string[];
  errorCode: StateMachineErrorCode;
}): StateChecker => {
  return ({ state, stateName }) => {
    const count = getPropertyCount({ object: state, props });
    if (count !== 1) {
      return {
        "Error code": errorCode,
        // Use of JSONPath within the error message is unnecessary
        // since the state names are unique.
        Message: `State "${stateName}" MUST contain exactly one of ${props
          .map((p) => {
            return `"${p}"`;
          })
          .join(", ")}`,
      };
    }
    return null;
  };
};
