import { MachineFunction } from './machineFunction';

export function interpret<
  TA = any,
  TC extends Record<string, unknown> = Record<string, unknown>,
  R = TC,
>(machine: MachineFunction<TA, TC, R>) {
  const _machine = machine.clone;
  return _machine.start;
}
