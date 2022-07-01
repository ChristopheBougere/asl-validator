import { JSONPath } from 'jsonpath-plus';
import { StateMachine, StateMachineError, StateMachineErrorCode } from '../types';

export default function jsonPathErrors(definition: StateMachine): StateMachineError[] {
  return JSONPath<string[]>({ json: definition, path: '$..[InputPath,OutputPath,ResultPath]' })
    .map((path) => {
      // Context object path starts with $$
      // https://docs.aws.amazon.com/step-functions/latest/dg/input-output-contextobject.html#contextobject-access
      if (path.startsWith('$$')) {
        return path.substring(1);
      }
      return path;
    })
    .map((path) => {
      try {
        JSONPath({ path, json: definition });
        return null;
      } catch (e) {
        return {
          'Error code': StateMachineErrorCode.InvalidJsonPath,
          Message: (e as Error).message,
        };
      }
    })
    .filter((parsed: StateMachineError | null) => parsed) as StateMachineError[]; // remove null values to keep only errors
  }
