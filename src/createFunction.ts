import {
  extractActions,
  extractTransitions,
  identity,
  isFinalState,
} from './helpers';
import { MachineFunction } from './machineFunction';
import type { Config, Options, StateDefinition } from './types';

export function createFunction<
  TA = undefined,
  TC extends Record<string, unknown> = Record<string, unknown>,
  R = TC,
>(config: Config<TA, TC, R>, options?: Options<TA, TC, R>) {
  // #region Props
  const context = config.context;
  const initial = config.initial;
  const states: StateDefinition<TA, TC>[] = [];
  const __states = Object.entries(config.states);
  const __keys = Object.keys(config.states);
  const strict = options?.strict;
  // #endregion

  if (__states.length < 1) throw new Error('No states');

  if (!__keys.includes(initial)) throw new Error('No initial state');

  for (const [value, state] of __states) {
    const entry = extractActions(state.entry, options?.actions, strict);
    if (isFinalState(state)) {
      const data = options?.datas?.[state.data] ?? identity;
      states.push({
        value,
        entry,
        data,
      });
    } else {
      const source = value;
      const always = extractTransitions({
        source,
        always: state.always,
        options,
        __keys,
      });
      const exit = extractActions(state.exit, options?.actions, strict);
      states.push({
        value,
        entry,
        exit,
        always,
      });
    }
  }

  // #region Props Helpers
  const overflow = options?.overflow;
  const _states = states as StateDefinition<TA, TC>[];
  // #endregion

  return new MachineFunction<TA, TC, R>({
    _states,
    context,
    initial,
    overflow,
    config,
    options,
  });
}
