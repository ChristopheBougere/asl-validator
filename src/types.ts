export type State = Record<string, unknown>;
export type States = Record<string, State>;
export type StateMachine = {
  States: States;
}
export enum StateMachineErrorCode {
  BranchOutboundTransitionTarget = 'BRANCH_OUTBOUND_TRANSITION_TARGET',
  DuplicateStateNames = 'DUPLICATE_STATE_NAMES',
  DuplicateFieldName = 'DUPLICATE_FIELD_NAME',
  InvalidJsonPath = 'INVALID_JSON_PATH',
  MapOutboundTransitionTarget = 'MAP_OUTBOUND_TRANSITION_TARGET',
  MissingTerminalState = 'MISSING_TERMINAL_STATE',
  MissingTransitionTarget = 'MISSING_TRANSITION_TARGET',
  SchemaValidationFailed = 'SCHEMA_VALIDATION_FAILED',
}
export type StateMachineError = {
  'Error code': StateMachineErrorCode;
  Message: string;
  schemaError?: {
    instancePath: string;
    schemaPath: string;
  }
};

export interface ValidationOptions {
  readonly checkPaths: boolean;
  readonly checkArn: boolean;
}

export type AslChecker = (definition: StateMachine, options: ValidationOptions) => StateMachineError[];