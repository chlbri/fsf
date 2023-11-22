export type Undy<T> = T extends null ? Exclude<T, null> | undefined : T;

/* eslint-disable @typescript-eslint/ban-types */
export type StateFunction<TC = any, TA = any, R = any> = (
  context: TC,
  events: Undy<TA>,
) => R;

export type SingleOrArray<T> = T | T[];

// #region Guards

export type SimpleGuard = string;
export type GuardUnion = GuardAnd | GuardOr | SimpleGuard;
export type GuardAnd = { and: SingleOrArray<GuardUnion> };
export type GuardOr = { or: SingleOrArray<GuardUnion> };
export type Guards = SingleOrArray<GuardUnion>;
export type GuardDef<TA = any, TC = any> = StateFunction<TC, TA, boolean>;

// #endregion

export type TransitionDefinition<TC = any, TA = any> = {
  target: string;
  source: string;
  actions: StateFunction<TC, TA, void>[];
  cond?: GuardDef<TA, TC>;
  description?: string;
};

export type BaseStateDefinition<TA = any, TC = any> = {
  value: string;
  entry: StateFunction<TC, TA, void>[];
};

export type SimpleStateDefinition<
  TA = any,
  TC = any,
> = BaseStateDefinition<TA, TC> & {
  transitions: TransitionDefinition<TC, TA>[];
  exit: StateFunction<TC, TA, void>[];
};

export type SRCDefinition<TA = any, TC = any, R = any> = {
  then: TransitionDefinition<TC, TA>[];
  catch: TransitionDefinition<TC, TA>[];
  finally: StateFunction<TC, TA, void>[];
  src?: StateFunction<TC, TA, Promise<R>>;
};

export type PromiseStateDefinition<
  TA = any,
  TC = any,
  R = any,
> = BaseStateDefinition<TA, TC> & {
  promises: SRCDefinition<TC, TA, R>[];
};

export type FinalStateDefinition<
  TA = any,
  TC = any,
  R = any,
> = BaseStateDefinition<TA, TC> & {
  data: StateFunction<TC, TA, R>;
};

export type StateDefinition<TA = any, TC = any, R = any> =
  | SimpleStateDefinition<TA, TC>
  | PromiseStateDefinition<TA, TC, R>
  | FinalStateDefinition<TA, TC, R>;

export type PromiseWithTimeout = {
  timeoutMs: number;
  promise: () => Promise<void>;
  failureMessage?: string;
};

export type SAS = SingleOrArray<string>;

export type TransitionObj = {
  target: string;
  cond?: Guards;
  actions?: SAS;
  description?: string;
};

export type Transition = string | TransitionObj;

export type BaseState = {
  entry?: SAS;
  description?: string;
};

export type TransitionArray = [
  {
    target: string;
    cond: Guards;
    actions?: SAS;
    description?: string;
  },
  ...TransitionObj[],
];

export type SimpleState = BaseState & {
  exit?: SAS;
  always: Transition | TransitionArray;
};

export type SRC = {
  src: string;
  then: Transition | TransitionArray;
  catch: Transition | TransitionArray;
  finally?: SAS;
};

export type PromiseState = BaseState & {
  promises: SingleOrArray<SRC>;
};

export type FinalState = BaseState & {
  data: string;
};

export type State = SimpleState | FinalState | PromiseState;

export type Config<TA = any, TC = any, R = TC> = {
  context: TC;
  initial: string;
  schema: {
    context?: TC;
    events?: TA;
    data: R;
  };
  data?: string;
  states: Record<string, State>;
};

export type Options<TA = any, TC = any, R = any> = {
  actions?: Record<string, StateFunction<TC, TA, any>>;
  guards?: Record<string, StateFunction<TC, TA, boolean>>;
  datas?: Record<string, StateFunction<TC, TA, R>>;
  promises?: Record<string, StateFunction<TC, TA, Promise<any>>>;
  overflow?: number;
  strict?: boolean;
  unFreezeArgs?: boolean;
};

export type Primitives = string | number | boolean;

export type Param<T> = T extends null ? [Exclude<T, null>?] : [T];
