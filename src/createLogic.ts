import { Machine } from './Machine';
import { isAsync } from './helpers';
import type { Config, IsAsyncConfig, Options, State } from './types';

export function createConfig<
  TA = undefined,
  TC extends Record<string, unknown> = Record<string, unknown>,
  R = TC,
  S extends Record<string, { data: any; error: any }> = Record<
    string,
    { data: any; error: any }
  >,
  ST extends Record<string, State> = Record<string, State>,
>(config: Config<TA, TC, R, S, ST>) {
  return config;
}

export function createLogic<
  TA = undefined,
  TC extends Record<string, unknown> = Record<string, unknown>,
  R = TC,
  S extends Record<string, { data: any; error: any }> = Record<
    string,
    { data: any; error: any }
  >,
  ST extends Record<string, State> = Record<string, State>,
>(config: Config<TA, TC, R, S, ST>, options?: Options<TA, TC, R>) {
  type AS = IsAsyncConfig<typeof config>;

  const async = isAsync(config) as AS;

  const _machine = new Machine<TA, TC, R, S, ST, AS>(config, {
    ...options,
    async,
  });
  return _machine;
}
