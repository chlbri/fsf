import {
  Config,
  Options,
  OptionsM,
  PromiseState,
  StateDefinition,
  Transition,
  TransitionArray,
  TransitionDefinition,
} from './types';

export type MarchineArgs<
  TA = any,
  TC extends Record<string, unknown> = Record<string, unknown>,
  R = TC,
  Async extends boolean = false,
> = {
  _states: StateDefinition<TA, TC, R>[];
  initial: string;
  context: TC;
  config: Config<TA, TC, R>;
  options?: Options<TA, TC, R, Async>;
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
  state: string;
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
  TC extends object = object,
  TA = any,
  R = any,
  Async extends boolean = false,
> = {
  source: string;
  options?: Omit<Options<TA, TC, R, Async>, 'overflow' | 'datas'>;
  __keys: string[];
};

export type ExtractFunction<TC extends object = object, TA = any> = (
  value: Transition,
) => TransitionDefinition<TC, TA>;

export type PropsExtractorTransition<
  TC extends object = object,
  TA = any,
  R = any,
  Async extends boolean = boolean,
> = {
  source: string;
  always: Transition | TransitionArray;
  options?: Omit<Options<TA, TC, R, Async>, 'overflow' | 'datas'>;
  __keys: string[];
};

export type PropsExtractorPromise<
  TC extends object = object,
  TA = any,
  R = any,
  Async extends boolean = false,
> = {
  source: string;
  promises: PromiseState['promises'];
  options?: Omit<Options<TA, TC, R, Async>, 'overflow' | 'datas'>;
  __keys: string[];
};

export type CloneArgs<
  TA = any,
  TC extends Record<string, unknown> = Record<string, unknown>,
  R = TC,
  Async extends boolean = false,
> = {
  config?: Partial<Config<TA, TC, R>>;
  options?: OptionsM<TA, TC, R, Async>;
};
