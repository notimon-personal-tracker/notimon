import finity, { StateMachine } from 'finity';

export function createUserFsm(initialState: string = 'idle') {
  return finity
    .configure()
    .initialState(initialState)
    .state('idle')
      .on('start_day').transitionTo('awaiting_permission')
    .state('awaiting_permission')
      .on('permission_granted').transitionTo('awaiting_answer')
      .on('failed').transitionTo('failed')
    .state('awaiting_answer')
      .on('answered').transitionTo('awaiting_answer')
      .on('skipped').transitionTo('awaiting_answer')
      .on('complete').transitionTo('completed')
      .on('failed').transitionTo('failed')
    .state('completed')
      .on('reset').transitionTo('idle')
    .state('failed')
      .on('reset').transitionTo('idle')
    .start();
}

export function serializeFsm(fsm: StateMachine<any, any>) {
  return fsm.getCurrentState();
}

export function deserializeFsm(state: string) {
  return createUserFsm(state);
} 