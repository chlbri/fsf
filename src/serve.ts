import type { MachineFunction } from './machineFunction';
import type { StateDefinition, UndefinyFunction } from './types';

export function serve<
  TA = any,
  TC extends Record<string, unknown> = Record<string, unknown>,
  S extends StateDefinition<TA, TC> = StateDefinition<TA, TC>,
  D = TC,
>(machine: MachineFunction<TA, TC, S, D>): UndefinyFunction<TA, D> {
  const _machine = machine.clone;
  return _machine.start;
}
