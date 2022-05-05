import {
  asyncVoid,
  extractActions,
  extractTransitions,
  isAsync,
  isSync,
} from './helpers';
import { MachineFunction } from './machineFunction';
import type {
  Config,
  DFS,
  Options,
  State,
  StateDefinition,
  TransitionDefinition,
} from './types';

export function createFunction<
  TA = undefined,
  TC extends Record<string, unknown> = Record<string, unknown>,
  S extends State = State,
  D = TC,
>(config: Config<TA, TC, S, D>, options?: Options<TC, TA>) {
  // #region Props
  const context = config.context;
  const initial = config.initial;
  const states: StateDefinition<TA, TC>[] = [];
  const __states = Object.entries(config.states);
  const stringStates = __states.map(([key]) => key);
  // #endregion

  for (const [value, state] of __states) {
    const matches = <T extends string>(_value: T) => _value === value;
    const source = value;
    const entry = extractActions(state.entry);
    const exit = extractActions(state.exit);

    if (isSync(state)) {
      states.push({
        type: state.type,
        value,
        entry,
        exit,
        matches,
        transitions: extractTransitions(
          stringStates,
          source,
          state.transitions,
          options,
        ),
      });
      continue;
    }

    if (isAsync(state)) {
      const promise = options?.promises?.[state.promise] ?? asyncVoid;

      // #region Build onDone
      const onDone: TransitionDefinition<TC, any>[] = extractTransitions(
        stringStates,
        source,
        state.onDone,
        options,
      );
      // #endregion

      // #region Build onErrror
      const onError: TransitionDefinition<TC, any>[] = extractTransitions(
        stringStates,
        source,
        state.onError,
        options,
      );
      // #endregion

      const timeout = options?.timeouts?.[state.timeout] ?? 400;

      states.push({
        type: state.type,
        value,
        entry,
        exit,
        matches,
        promise,
        onDone,
        onError,
        timeout,
      });
      continue;
    }
  }

  // #region Props Helpers
  const dataF = config.data;
  const overflow = options?.overflow;
  const _states = states as DFS<TA, TC, S>[];
  // #endregion

  return new MachineFunction<TA, TC, DFS<TA, TC, S>, D>({
    _states,
    context,
    dataF,
    initial,
    overflow,
  });
}
