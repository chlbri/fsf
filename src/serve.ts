import { Machine } from './machine';
// import type {GetTA, GetTC,} from './machine'
import { StateType } from './types';

type ReturnType<
  TA = any,
  TC = any,
  T extends StateType = StateType,
> = 'async' extends T ? (args: TA) => Promise<TC> : (args: TA) => TC;

export function serve<T extends StateType = StateType, TA = any, TC = any>(
  machine: Machine<TA, TC, T>,
): ReturnType<TA, TC, T> {
  const checkAsync = machine._states.some(state => state.type === 'async');
  return (checkAsync ? machine.startAsync : machine.start) as ReturnType<
    TA,
    TC,
    T
  >;
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
