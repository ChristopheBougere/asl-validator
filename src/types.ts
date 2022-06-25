export type StateMachineDefinition = Record<string, unknown>;
export enum StateMachineErrorCode {
  BranchOutboundTransitionTarget = 'BRANCH_OUTBOUND_TRANSITION_TARGET',
  DuplicateStateNames = 'DUPLICATE_STATE_NAMES',
  InvalidJsonPath = 'INVALID_JSON_PATH',
  MapOutboundTransitionTarget = 'MAP_OUTBOUND_TRANSITION_TARGET',
  MissingTerminalState = 'MISSING_TERMINAL_STATE',
  MissingTransitionTarget = 'MISSING_TRANSITION_TARGET',
  SchemaValidationFailed = 'SCHEMA_VALIDATION_FAILED',
}
export type StateMachineError = {
  'Error code': StateMachineErrorCode;
  Message: string;
};
