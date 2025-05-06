import jsonata from "jsonata";
import {
  StateMachine,
  StateMachineError,
  StateMachineErrorCode,
} from "../types";
import { getStates } from "./get-states";

type Value = string | number | boolean | Record<string, unknown>;

function checkField(
  stateName: string,
  fieldName: string,
  value: Value
): StateMachineError[] {
  if (typeof value === "object") {
    if (Array.isArray(value)) {
      return value.flatMap((entry, index) =>
        checkField(stateName, `${fieldName}[${index}]`, entry as Value)
      );
    } else {
      Object.entries(value).flatMap(([innerFieldName, innerValue]) =>
        checkField(
          stateName,
          fieldName + "/" + innerFieldName,
          innerValue as Value
        )
      );
    }
  } else if (typeof value === "string") {
    if (value.startsWith("{%") || value.endsWith("%}")) {
      if (/\{% .* %\}/.test(value)) {
        try {
          jsonata(value.match(/\{% (.*) %\}/)?.[1] ?? "");
          return [];
        } catch (error) {
          return [
            {
              "Error code": StateMachineErrorCode.InvalidJsonataSyntax,
              Message: `Invalid JSONata syntax in ${stateName}/${fieldName}: ${
                (error as Error).message
              }`,
            },
          ];
        }
      } else
        return [
          {
            "Error code": StateMachineErrorCode.InvalidJsonataSyntax,
            Message: `Invalid JSONata syntax in ${stateName}/${fieldName}: JSONata surround syntax incomplete. Should be: "{% <JSONata expression> %}"`,
          },
        ];
    } else return [];
  } else if (typeof value === "boolean") {
    return [];
  } else if (typeof value === "number") {
    return [];
  } else {
    throw Error(
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `JSONata Syntax Validation Error: ${stateName}/${fieldName} is of type '${typeof value}' (${value}) which is not expected!`
    );
  }
  return [];
}

export function validateJsonataSyntax(
  definition: StateMachine
): StateMachineError[] {
  return getStates(definition.States)
    .filter(
      (entry) =>
        (entry.state.QueryLanguage ??
          definition.QueryLanguage ??
          "JSONPath") === "JSONata"
    )
    .flatMap(({ state, stateName }) =>
      Object.entries(state).flatMap(([fieldName, value]) =>
        checkField(stateName, fieldName, value as Value)
      )
    );
}
