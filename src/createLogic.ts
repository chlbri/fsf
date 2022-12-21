import { Machine } from './Machine';
import type { Config, Options } from './types';

export function createLogic<
  TA = undefined,
  TC extends Record<string, unknown> = Record<string, unknown>,
  R = TC,
>(config: Config<TA, TC, R>, options?: Options<TA, TC, R>) {
  const _machine = new Machine(config, options);
  return _machine;
}
