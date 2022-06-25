import { JSONPath } from 'jsonpath-plus';
import { StateMachineDefinition, StateMachineError, StateMachineErrorCode } from '../types';

export default function jsonPathErrors(definition: StateMachineDefinition): StateMachineError[] {
  return JSONPath({ json: definition, path: '$..[InputPath,OutputPath,ResultPath]' })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((path: any) => typeof path === 'string')
    .map((path: string) => {
      // Context object path starts with $$
      // https://docs.aws.amazon.com/step-functions/latest/dg/input-output-contextobject.html#contextobject-access
      if (path.startsWith('$$')) {
        return path.substring(1);
      }
      return path;
    })
    .map((path: string) => {
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
