import {
  extractActions,
  extractTransitions,
  identity,
  isFinalState,
} from './helpers';
import { MachineFunction } from './machineFunction';
import type { Config, Options, StateDefinition } from './types';

export default function createFunction<
  TA = undefined,
  TC extends Record<string, unknown> = Record<string, unknown>,
  R = TC,
>(config: Config<TA, TC, R>, options?: Options<TC, TA, R>) {
  // #region Props
  const context = config.context;
  const initial = config.initial;
  const states: StateDefinition<TA, TC>[] = [];
  const __states = Object.entries(config.states);
  // #endregion

  for (const [value, state] of __states) {
    const entry = extractActions(state.entry);
    if (isFinalState(state)) {
      const data = options?.datas?.[state.data] ?? identity;
      states.push({
        value,
        entry,
        data,
      });
    } else {
      const source = value;
      const exit = extractActions(state.exit);
      states.push({
        value,
        entry,
        exit,
        always: extractTransitions(source, state.always, options),
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
  });
}
