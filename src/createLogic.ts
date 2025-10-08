import { Machine } from './Machine';
import type { CreateLogic_F } from './createLogic.types';
import { isAsync } from './helpers';
import type { Config, Options, State, isAsyncConfig } from './types2';

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

export const createLogic: CreateLogic_F = (config, types) => {
  const _machine = new Machine(config, types);
  return _machine;
};
