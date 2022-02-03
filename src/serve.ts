import { Machine } from './machine';

type ReturnType<
  AS extends true | undefined = undefined,
  TA = any,
  TC = any,
> = AS extends true ? (args: TA) => Promise<TC> : (args: TA) => TC;

export function serve<
  AS extends true | undefined = undefined,
  TA = any,
  TC = any,
>(machine: Machine<AS, TA, TC>): ReturnType<AS, TA, TC> {
  const checkAsync = machine._states.some(state => state.type === 'async');
  return (checkAsync ? machine.startAsync : machine.start) as ReturnType<
    AS,
    TA,
    TC
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
