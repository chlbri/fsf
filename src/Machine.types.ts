import {
  Config,
  Options,
  SingleOrArray,
  StateDefinition,
  Transition,
  TransitionDefinition,
} from './types';

export type MarchineArgs<
  TA = any,
  TC extends Record<string, unknown> = Record<string, unknown>,
  R = TC,
> = {
  _states: StateDefinition<TA, TC, R>[];
  initial: string;
  context: TC;
  config: Config<TA, TC, R>;
  options?: Options<TA, TC, R>;
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

export type ExtractFunctionProps<TC extends object = object, TA = any> = {
  source: string;
  options?: Omit<Options<TA, TC>, 'overflow' | 'datas'>;
  __keys: string[];
};

export type ExtractFunction<TC extends object = object, TA = any> = (
  value: Transition,
) => TransitionDefinition<TC, TA>;

export type PropsExtractorTransition<
  TC extends object = object,
  TA = any,
> = {
  source: string;
  always: SingleOrArray<Transition>;
  options?: Omit<Options<TA, TC>, 'overflow' | 'datas'>;
  __keys: string[];
};

export type CloneArgs<
  TA = any,
  TC extends Record<string, unknown> = Record<string, unknown>,
  R = TC,
> = {
  config?: Partial<Config<TA, TC, R>>;
  options?: Partial<Options<TA, TC, R>>;
};
