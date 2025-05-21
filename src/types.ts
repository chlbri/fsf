export type Undy<T> = T extends null ? Exclude<T, null> | undefined : T;

export type StateFunction<TC = any, TA = any, R = void> = (
  context: TC,
  events: Undy<TA>,
) => R;

export type SingleOrArray<T = any> = T | readonly T[];
export type SoA<T = any> = SingleOrArray<T>;

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
  value: string;
};

export type PromiseStateDefinition<
  TA = any,
  TC = any,
  R = any,
> = BaseStateDefinition<TA, TC> & {
  invoke: SRCDefinition<TA, TC, R>[];
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
  | PromiseStateDefinition<TA, TC, any>
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

export type TransitionArray = readonly [
  {
    target: string;
    cond: Guards;
    actions?: SAS;
    description?: string;
  },
  ...Transition[],
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
  invoke: SoA<SRC>;
};

export type FinalState = BaseState & {
  data: string;
};

export type State = SimpleState | FinalState | PromiseState;

export type Config<
  ST extends Record<string, State> = Record<string, State>,
  TA = any,
  TC = any,
  R = TC,
  S extends Record<string, { data: any; error: any }> = Record<
    string,
    { data: any; error: any }
  >,
> = {
  context: TC;
  initial: string;
  schema: {
    context?: TC;
    events?: TA;
    data: R;
    promises?: S;
  };
  data?: string;
  states: ST;
};

export type ExtractArgsFromConfig<C extends Config> =
  C extends Config<any, infer A> ? A : never;

export type ExtractContextFromConfig<C extends Config> =
  C extends Config<any, any, infer A> ? A : never;

export type ExtractReturnFromConfig<C extends Config> =
  C extends Config<any, any, any, infer A> ? A : never;

export type ExtractServicesFromConfig<C extends Config> =
  C extends Config<any, any, any, any, infer A> ? A : never;

export type ExtractTypestateFromConfig<C extends Config> =
  C extends Config<infer A> ? A : never;

export type ExtractSOAToUnion<T extends SingleOrArray | undefined> =
  T extends undefined ? never : T extends Readonly<any> ? T[number] : T;

// #region Actions for Options
export type GetEntryActions<ST extends Record<string, State>> =
  GetEntryActionsFromState<ST[keyof ST]>;

export type GetEntryActionsFromState<ST extends State> = ExtractSOAToUnion<
  ST['entry']
>;

export type GetTransitionsActions<T extends Transition | TransitionArray> =
  T extends string
    ? never
    : T extends TransitionObj
      ? ExtractSOAToUnion<T['actions']>
      : T extends TransitionArray
        ? GetTransitionsActions<T[number]>
        : never;

export type GetExitActionsFromSimpleState<ST extends SimpleState> =
  ExtractSOAToUnion<ST['exit']>;

export type GetActionKeysFromSimpleState<ST extends SimpleState> =
  | GetTransitionsActions<ST['always']>
  | GetEntryActionsFromState<ST>
  | GetExitActionsFromSimpleState<ST>;

export type GetPromiseKeysFromInvoke<T extends PromiseState['invoke']> =
  T extends SRC
    ? T['src']
    : T extends ReadonlyArray<SRC>
      ? T[number]['src']
      : never;

export type GetActionsBySRC<
  S extends Record<string, { data: any; error: any }>,
  T extends SRC,
  TC extends object = object,
> = Record<
  GetTransitionsActions<T['then']>,
  StateFunction<TC, S[T['src']]['data']>
> &
  Record<
    GetTransitionsActions<T['catch']>,
    StateFunction<TC, S[T['src']]['error']>
  >;

export type GetActionsFromPromises<
  ST extends PromiseState,
  S extends Record<string, { data: any; error: any }> = Record<
    string,
    { data: any; error: any }
  >,
  TC extends object = object,
  TA = any,
> = Record<GetEntryActionsFromState<ST>, StateFunction<TC, TA, void>> &
  (ST['invoke'] extends infer Invoke
    ? Invoke extends SRC
      ? GetActionsBySRC<S, Invoke, TC>
      : Invoke extends SRC[]
        ? GetActionsBySRC<S, Invoke[number], TC>
        : unknown
    : unknown);

export type GetActionsFromState<
  ST extends State,
  S extends Record<string, { data: any; error: any }> = Record<
    string,
    { data: any; error: any }
  >,
  TC extends object = object,
  TA = any,
> = ST extends PromiseState
  ? GetActionsFromPromises<ST, S, TC, TA>
  : ST extends SimpleState
    ? Record<GetActionKeysFromSimpleState<ST>, StateFunction<TC, TA>>
    : ST extends FinalState
      ? Record<GetEntryActionsFromState<ST>, StateFunction<TC, TA>>
      : never;
// #endregion

// #region Guards for Options

export type GetGuardsFromGuards<T extends Guards | undefined> =
  T extends undefined
    ? never
    : T extends string
      ? T
      : T extends string[]
        ? T[number]
        : T extends readonly GuardUnion[]
          ? GetGuardsFromGuards<T[number]>
          : T extends GuardOr
            ? GetGuardsFromGuards<T['or']>
            : T extends GuardAnd
              ? GetGuardsFromGuards<T['and']>
              : never;

export type GetGuardKeysFromTransition<
  T extends Transition | TransitionArray,
> = T extends string
  ? never
  : T extends TransitionObj
    ? GetGuardsFromGuards<T['cond']>
    : T extends TransitionArray
      ? GetGuardKeysFromTransition<T[number]>
      : never;

export type RecordFunctions<
  K,
  TC extends object = object,
  TA = any,
  R = void,
> = K extends string ? Record<K, StateFunction<TC, TA, R>> : never;

export type GetGuardsFromSimpleState<
  ST extends SimpleState,
  TC extends object = object,
  TA = any,
> =
  GetGuardKeysFromTransition<ST['always']> extends infer Keys
    ? Record<Keys & string, StateFunction<TC, TA, boolean>>
    : never;

export type GetGuardsFromSRC<
  Invoke extends SRC,
  S extends Record<string, { data: any; error: any }> = Record<
    string,
    { data: any; error: any }
  >,
  TC extends object = object,
> = (GetGuardKeysFromTransition<Invoke['then']> extends infer ThenKeys
  ? ThenKeys extends number
    ? unknown
    : RecordFunctions<ThenKeys, TC, S[Invoke['src']]['data'], boolean>
  : unknown) &
  (GetGuardKeysFromTransition<Invoke['catch']> extends infer CatchKeys
    ? CatchKeys extends never
      ? unknown
      : RecordFunctions<CatchKeys, TC, S[Invoke['src']]['error'], boolean>
    : unknown);

export type GetGuardsFromPromiseState<
  ST extends PromiseState,
  S extends Record<string, { data: any; error: any }> = Record<
    string,
    { data: any; error: any }
  >,
  TC extends object = object,
> = ST['invoke'] extends infer Invoke
  ? Invoke extends SRC
    ? GetGuardsFromSRC<Invoke, S, TC>
    : Invoke extends ReadonlyArray<SRC>
      ? GetGuardsFromSRC<Invoke[number], S, TC>
      : never
  : never;

// #endregion

type UnionToIntersection<U> = (
  U extends any ? (x: U) => void : never
) extends (x: infer I) => void
  ? I
  : never;

export type Options<
  ST extends Record<string, State> = Record<string, State>,
  S extends Record<string, { data: any; error: any }> = Record<
    string,
    { data: any; error: any }
  >,
  TA = any,
  TC extends object = object,
  R = TC,
  Async extends boolean = false,
> = {
  actions?: Partial<
    UnionToIntersection<GetActionsFromState<ST[keyof ST], S, TC, TA>>
  >;
  guards?: Record<string, StateFunction<TC, TA, boolean>>;
  datas?: Record<string, StateFunction<TC, TA, R>>;
  promises?: Record<string, StateFunction<TC, TA, Promise<any>>>;
  overflow?: number;
  strict?: boolean;
  unFreezeArgs?: boolean;
  async?: Async;
};

export type OptionsM<
  ST extends Record<string, State> = Record<string, State>,
  S extends Record<string, { data: any; error: any }> = Record<
    string,
    { data: any; error: any }
  >,
  TA = any,
  TC extends object = object,
  R = TC,
  Async extends boolean = false,
> = Options<ST, S, TA, TC, R, Async> & { async: Async };

export type OptionsFromConfig<C extends Config> = Options<
  ExtractArgsFromConfig<C>,
  ExtractContextFromConfig<C>,
  ExtractReturnFromConfig<C>
>;

export type IsAsyncState<C extends Record<string, State>> =
  C extends Record<any, infer A>
    ? A extends PromiseState
      ? true
      : false
    : never;

export type IsAsyncConfig<C extends Config> = IsAsyncState<
  ExtractTypestateFromConfig<C>
>;

export type Primitives = string | number | boolean;

export type Param<T> = T extends null ? [Exclude<T, null>?] : [T];
