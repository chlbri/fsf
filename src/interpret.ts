import type { MachineFunction } from './machineFunction';
import type { UndefinyFunction } from './types';

export function interpret<
  TA = any,
  TC extends Record<string, unknown> = Record<string, unknown>,
  R = TC,
>(machine: MachineFunction<TA, TC, R>): UndefinyFunction<TA, R> {
  const _machine = machine.clone;
  return _machine.start;
}
