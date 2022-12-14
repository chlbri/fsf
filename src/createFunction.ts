import { extractActions, extractTransitions } from './helpers';
import { MachineFunction } from './machineFunction';
import type { Config, Options, StateDefinition } from './types';

export function createFunction<
  TA = undefined,
  TC extends Record<string, unknown> = Record<string, unknown>,
  D = TC,
>(config: Config<TA, TC, D>, options?: Options<TC, TA>) {
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

    states.push({
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
  }

  // #region Props Helpers
  const dataF = config.data;
  const overflow = options?.overflow;
  const _states = states as StateDefinition<TA, TC>[];
  // #endregion

  return new MachineFunction<TA, TC, StateDefinition<TA, TC>, D>({
    _states,
    context,
    dataF,
    initial,
    overflow,
  });
}
