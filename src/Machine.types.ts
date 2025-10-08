import {
  PromiseState,
  StateDefinition,
  Transition,
  TransitionArray,
  TransitionDefinition,
} from './types';
import type { Config, ConfigTypes, Options } from './types2';

export type MarchineArgs<
  C extends Config,
  T extends ConfigTypes<C> = ConfigTypes<C>,
  TA = T['events'],
  TC extends T['context'] = T['context'],
  R = TC,
> = {
  _states: StateDefinition<TA, TC, R>[];
  initial: string;
  context: TC;
  config: C;
  options?: Options<C, T, R>;
  // test?: boolean;
};

type NextArgs<
  TA = any,
  TC extends Record<string, unknown> = Record<string, unknown>,
> = {
  state: string;
  events: TA;
  context: TC;
};

type NextResult<
  TC extends Record<string, unknown> = Record<string, unknown>,
  R = TC,
> = {
  state?: string;
  context: TC;
  data?: R;
  hasNext: boolean;
};

export type NextFunction<
  TA = any,
  TC extends Record<string, unknown> = Record<string, unknown>,
  R = TC,
> = (props: NextArgs<TA, TC>) => NextResult<TC, R>;

export type NextFunctionAsync<
  TA = any,
  TC extends Record<string, unknown> = Record<string, unknown>,
  R = TC,
> = (props: NextArgs<TA, TC>) => Promise<NextResult<TC, R>>;

export type ExtractFunctionProps<
  C extends Config,
  T extends ConfigTypes<C> = ConfigTypes<C>,
  TC extends T['context'] = T['context'],
  R = TC,
> = {
  source: string;
  options?: Omit<Options<C, T, R>, 'overflow' | 'datas'>;
  __keys: string[];
};

export type ExtractFunction<TC extends object = object, TA = any> = (
  value: Transition,
) => TransitionDefinition<TC, TA>;

export type PropsExtractorTransition<
  C extends Config,
  T extends ConfigTypes<C> = ConfigTypes<C>,
  TC extends T['context'] = T['context'],
  R = TC,
> = {
  source: string;
  always: Transition | TransitionArray;
  options?: Omit<Options<C, T, R>, 'overflow' | 'datas'>;
  __keys: string[];
};

export type PropsExtractorPromise<
  C extends Config,
  T extends ConfigTypes<C> = ConfigTypes<C>,
  TC extends T['context'] = T['context'],
  R = TC,
> = {
  source: string;
  promises: PromiseState['invoke'];
  options?: Omit<Options<C, T, R>, 'overflow' | 'datas'>;
  __keys: string[];
};

export type CloneArgs<
  C extends Config,
  T extends ConfigTypes<C> = ConfigTypes<C>,
  TC extends T['context'] = T['context'],
  R = TC,
> = {
  config?: Partial<Config>;
  options?: Options<C, T, R>;
};
