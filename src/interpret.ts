import { Interpreter, InterpreterOptions } from './Interpreter';
import { Machine } from './Machine';

export function interpret<
  TA = any,
  TC extends Record<string, unknown> = Record<string, unknown>,
  R = TC,
>(machine: Machine<TA, TC, R>, options?: InterpreterOptions) {
  const interpreter = new Interpreter(machine, options);
  return interpreter.build;
}
