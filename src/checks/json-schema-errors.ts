
import Ajv from 'ajv';
import paths from '../schemas/paths.json';
import choice from '../schemas/choice.json';
import fail from  '../schemas/fail.json';
import parallel from  '../schemas/parallel.json';
import pass from  '../schemas/pass.json';
import stateMachine from  '../schemas/state-machine.json';
import state from  '../schemas/state.json';
import succeed from  '../schemas/succeed.json';
import task from  '../schemas/task.json';
import wait from  '../schemas/wait.json';
import map from  '../schemas/map.json';
import errors from  '../schemas/errors.json';
import { StateMachine, StateMachineError, StateMachineErrorCode } from '../types';
import {registerAll} from "asl-path-validator";
import {isArnFormatValid} from "./formats";

export default function jsonSchemaErrors(definition: StateMachine): StateMachineError[] {
  const ajv = new Ajv({
    schemas: [
      paths,
      choice,
      fail,
      parallel,
      pass,
      stateMachine,
      state,
      succeed,
      task,
      wait,
      map,
      errors,
    ],
    allowUnionTypes: true
  });
  registerAll(ajv);
  ajv.addFormat("asl_arn", isArnFormatValid)
  void ajv.validate('http://asl-validator.cloud/state-machine.json#', definition);
  return (ajv.errors ?? []).map(error => ({
    'Error code': StateMachineErrorCode.SchemaValidationFailed,
    Message: error.message as string,
  }));
}
