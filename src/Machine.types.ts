import type {
  Config,
  ConfigTypes,
  Options,
  PromiseState,
  StateDefinition,
  Transition,
  TransitionArray,
  TransitionDefinition,
} from './types';

export type MarchineArgs<
  C extends Config,
  T extends ConfigTypes<C> = ConfigTypes<C>,
  R = T['context'],
> = {
  _states: StateDefinition<T['events'], T['context'], R>[];
  initial: string;
  context: T['context'];
  config: C;
  options?: Options<C, T>;
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
> = {
  source: string;
  options?: Omit<Options<C, T>, 'overflow' | 'datas'>;
  __keys: string[];
};

export type ExtractFunction<TC extends object = object, TA = any> = (
  value: Transition,
) => TransitionDefinition<TC, TA>;

export type PropsExtractorTransition<
  C extends Config,
  T extends ConfigTypes<C> = ConfigTypes<C>,
> = {
  source: string;
  always: Transition | TransitionArray;
  options?: Omit<Options<C, T>, 'overflow' | 'datas'>;
  __keys: string[];
};

export type PropsExtractorPromise<
  C extends Config,
  T extends ConfigTypes<C> = ConfigTypes<C>,
> = {
  source: string;
  promises: PromiseState['invoke'];
  options?: Omit<Options<C, T>, 'overflow' | 'datas'>;
  __keys: string[];
};

export type CloneArgs<
  C extends Config,
  T extends ConfigTypes<C> = ConfigTypes<C>,
> = {
  config?: Partial<Config>;
  options?: Options<C, T>;
};
