import {
  asyncVoidNothing,
  extractActions,
  extractTransitions,
  isAsync,
  isFinal,
  isSync,
} from './helpers';
import { Machine } from './machine';
import type {
  AsyncStateDefinition,
  Config,
  FinalStateDefinition,
  Options,
  StateDefinition,
  StateType,
  SyncStateDefinition,
  TransitionDefinition,
} from './types';

export function createMachine<
  T extends StateType = StateType,
  TA = any,
  TC = any,
>(
  config: Config<TA, TC, T | 'final' | 'sync'>,
  options?: Options<TC, TA>,
) {
  const context = config.context;
  const initial = config.initial;
  const states: StateDefinition<TA, TC, T>[] = [];
  const __states = Object.entries(config.states);
  const stringStates = __states.map(([key]) => key);

  for (const [value, state] of __states) {
    const matches = <T extends string>(_value: T) => _value === value;
    const source = value;

    const entry = extractActions(state.entry);
    const exit = extractActions(state.exit);

    if (isSync(state)) {
      states.push({
        type: state.type ?? 'sync',
        value,
        entry,
        exit,
        matches,
        transitions: extractTransitions(
          stringStates,
          source,
          state?.transitions,
          options,
        ),
      } as SyncStateDefinition<TA, TC,T>);
      continue;
    }

    if (isAsync(state)) {
      const src = options?.promises?.[state.src] ?? asyncVoidNothing;

      // #region Build onDone
      const onDone: Omit<TransitionDefinition<TC, any>, 'conditions'> = {
        source,
        target: state.onDone.target,
        actions: extractActions(state.onDone.actions, options?.actions),
        description: state.onDone.description,
      };
      // #endregion

      // #region Build onErrror
      const onError: Omit<TransitionDefinition<TC, any>, 'conditions'> = {
        source,
        target: state.onError.target,
        actions: extractActions(state.onError.actions, options?.actions),
        description: state.onError.description,
      };
      // #endregion

      // #region Build timeout
      const timeout = options?.timeouts?.[state.timeout] ?? 400;

      // #endregion

      states.push({
        type: state.type ?? 'async',
        value,
        entry,
        exit,
        matches,
        src,
        onDone,
        onError,
        timeout,
      } as AsyncStateDefinition<TA, TC,T>);
      continue;
    }

    if (isFinal(state)) {
      states.push({
        type: state.type ?? 'final',
        value,
        entry,
        exit,
        matches,
      } as FinalStateDefinition<TA, TC,T>);
      continue;
    }
  }

  return new Machine(states, initial, context);
}
