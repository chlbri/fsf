import { Interpreter, InterpreterOptions } from './Interpreter';
import { Machine } from './Machine';
import { Param, State } from './types';

type ReturnAsync<Async extends boolean, TA, R> = Async extends false
  ? (...events: Param<TA>) => NonNullable<R>
  : (...events: Param<TA>) => Promise<NonNullable<R>>;

export function interpret<
  TA = any,
  TC extends Record<string, unknown> = Record<string, unknown>,
  R = TC,
  S extends Record<string, { data: any; error: any }> = Record<
    string,
    { data: any; error: any }
  >,
  ST extends Record<string, State> = Record<string, State>,
  Async extends boolean = false,
>(
  machine: Machine<TA, TC, R, S, ST, Async>,
  options?: InterpreterOptions,
): ReturnAsync<Async, TA, R> {
  const interpreter = new Interpreter(machine, options);
  const async = machine.__options.async;
  return (
    !async ? interpreter.build : interpreter.buildAsync
  ) as ReturnAsync<Async, TA, R>;
}
