import {
  Config,
  Options,
  OptionsM,
  PromiseState,
  State,
  StateDefinition,
  Transition,
  TransitionArray,
  TransitionDefinition,
} from './types';

export type MarchineArgs<
  ST extends Record<string, State>,
  S extends Record<string, { data: any; error: any }> = Record<
    string,
    { data: any; error: any }
  >,
  TA = any,
  TC extends Record<string, unknown> = Record<string, unknown>,
  R = TC,
  Async extends boolean = false,
> = {
  _states: StateDefinition<TA, TC, R>[];
  initial: string;
  context: TC;
  config: Config<ST, TA, TC, R>;
  options?: Options<ST, S, TA, TC, R, Async>;
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
  ST extends Record<string, State> = Record<string, State>,
  S extends Record<string, { data: any; error: any }> = Record<
    string,
    { data: any; error: any }
  >,
  TC extends object = object,
  TA = any,
  R = any,
  Async extends boolean = false,
> = {
  source: string;
  options?: Omit<Options<ST, S, TA, TC, R, Async>, 'overflow' | 'datas'>;
  __keys: string[];
};

export type ExtractFunction<TC extends object = object, TA = any> = (
  value: Transition,
) => TransitionDefinition<TC, TA>;

export type PropsExtractorTransition<
  ST extends Record<string, State> = Record<string, State>,
  S extends Record<string, { data: any; error: any }> = Record<
    string,
    { data: any; error: any }
  >,
  TC extends object = object,
  TA = any,
  R = any,
  Async extends boolean = boolean,
> = {
  source: string;
  always: Transition | TransitionArray;
  options?: Omit<Options<ST, S, TA, TC, R, Async>, 'overflow' | 'datas'>;
  __keys: string[];
};

export type PropsExtractorPromise<
  ST extends Record<string, State> = Record<string, State>,
  S extends Record<string, { data: any; error: any }> = Record<
    string,
    { data: any; error: any }
  >,
  TC extends object = object,
  TA = any,
  R = any,
  Async extends boolean = false,
> = {
  source: string;
  promises: PromiseState['invoke'];
  options?: Omit<Options<ST, S, TA, TC, R, Async>, 'overflow' | 'datas'>;
  __keys: string[];
};

export type CloneArgs<
  ST extends Record<string, State>,
  S extends Record<string, { data: any; error: any }> = Record<
    string,
    { data: any; error: any }
  >,
  TA = any,
  TC extends Record<string, unknown> = Record<string, unknown>,
  R = TC,
  Async extends boolean = false,
> = {
  config?: Partial<Config<ST, TA, TC, R>>;
  options?: OptionsM<ST, S, TA, TC, R, Async>;
};
