import type { MachineFunction } from './machineFunction';
import type { StateDefinition, UndefinyFunction } from './types';

type ServeReturnType<
  TA = any,
  TC extends Record<string, unknown> = Record<string, unknown>,
  S extends StateDefinition<TA, TC> = StateDefinition<TA, TC>,
  D = TC,
> = 'async' extends S['type']
  ? UndefinyFunction<TA, Promise<D>>
  : UndefinyFunction<TA, D>;

export function serve<
  TA = any,
  TC extends Record<string, unknown> = Record<string, unknown>,
  S extends StateDefinition<TA, TC> = StateDefinition<TA, TC>,
  D = TC,
>(machine: MachineFunction<TA, TC, S, D>): ServeReturnType<TA, TC, S, D> {
  const _machine = machine.clone;
  const async = _machine.async;
  return (async ? _machine.startAsync : _machine.start) as ServeReturnType<
    TA,
    TC,
    S,
    D
  >;
}
