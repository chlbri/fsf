import { Machine } from './Machine';
import { isAsync } from './helpers';
import type { Config, IsAsyncConfig, Options, State } from './types';

export function createConfig<
  const ST extends Record<string, State>,
  TA = undefined,
  const TC extends Record<string, unknown> = Record<string, unknown>,
  R = TC,
  const S extends Record<string, { data: any; error: any }> = Record<
    string,
    { data: any; error: any }
  >,
>(config: Config<ST, TA, TC, R, S>) {
  return config;
}

export function createLogic<
  const ST extends Record<string, State>,
  TA = undefined,
  const TC extends Record<string, unknown> = Record<string, unknown>,
  R = TC,
  const S extends Record<string, { data: any; error: any }> = Record<
    string,
    { data: any; error: any }
  >,
>(config: Config<ST, TA, TC, R, S>, options?: Options<ST, S, TA, TC, R>) {
  type AS = IsAsyncConfig<typeof config>;

  const async = isAsync(config) as AS;

  const _machine = new Machine(config, {
    ...options,
    async,
  });
  return _machine;
}
