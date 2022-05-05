import { Machine } from './machine';
import { StateDefinition, UndefinyF } from './types';

type ReturnType<
  TA = any,
  TC extends Record<string, unknown> = Record<string, unknown>,
  S extends StateDefinition<TA, TC> = StateDefinition<TA, TC>,
  D = TC,
> = 'async' extends S['type']
  ? UndefinyF<TA, Promise<D>>
  : UndefinyF<TA, D>;

export function serve<
  TA = any,
  TC extends Record<string, unknown> = Record<string, unknown>,
  S extends StateDefinition<TA, TC> = StateDefinition<TA, TC>,
  D = TC,
>(machine: Machine<TA, TC, S, D>): ReturnType<TA, TC, S, D> {
  const _machine = machine.clone;
  const async = _machine.containsAsyncStates;
  return ((args: TA) => {
    return async ? _machine.startAsync(args) : _machine.start(args);
  }) as ReturnType<TA, TC, S, D>;
}

// type ReturnType2<T extends Machine> =
//   'async' extends T['_states'][number]['type']
//     ? (args: GetTA<T>) => Promise<GetTC<T>>
//     : (args: GetTA<T>) => GetTC<T>;

// export function serve2<T extends Machine>(machine: T): ReturnType2<T> {
//   const checkAsync = machine._states.some(state => state.type === 'async');
//   return (
//     checkAsync ? machine.startAsync : machine.start
//   ) as ReturnType2<T>;
// }
