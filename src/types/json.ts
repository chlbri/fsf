import type { PromiseDef, SAS, SingleOrArray, SoA } from './core';

// #region Guards

export type SimpleGuard = string;
export type GuardUnion = GuardAnd | GuardOr | SimpleGuard;
export type GuardAnd = { and: GuardUnion[] };
export type GuardOr = { or: GuardUnion[] };
export type Guards = SingleOrArray<GuardUnion>;

// #endregion

export type TransitionObj<S extends string = string> = {
  target?: S;
  cond?: Guards;
  actions?: SAS;
  description?: string;
};

export type Transition<S extends string = string> = S | TransitionObj<S>;

export type BaseState = {
  entry?: SAS;
  description?: string;
};

export type TransitionArray<S extends string = string> = readonly [
  ...{
    target?: S;
    cond: Guards;
    actions?: SAS;
    description?: string;
  }[],
  Transition<S>,
];

export type SimpleState<S extends string = string> = BaseState & {
  exit?: SAS;
  always?: Transition<S> | TransitionArray<S>;
};

export type SRC<S extends string = string> = {
  src: S;
  then: Transition<S> | TransitionArray<S>;
  catch: Transition<S> | TransitionArray<S>;
  finally?: SAS;
};

export type PromiseState<S extends string = string> = BaseState & {
  invoke: SoA<SRC<S>>;
};

export type FinalState = BaseState & {
  data: string;
};

export type State<S extends string = string> =
  | SimpleState<S>
  | FinalState
  | PromiseState<S>;

export type Config = {
  data: string;
  states: Record<string, State>;
  initial: string;
};

export type ConfigTypes<C extends Config> = {
  context: any;
  events: any;
  data: any;
} & (C['states'][keyof C['states']] extends infer P extends PromiseState
  ? {
      promises: {
        [K in GetPromiseKeysFromPromise<P>]: PromiseDef;
      };
    }
  : unknown);

export type ConfigDef = {
  states: string;
  initial: string;
};

export type NoExtraKeysConfigDef<T extends ConfigDef> = T & {
  [K in Exclude<keyof T, keyof ConfigDef>]: never;
};

export type TransformConfigDef<T extends ConfigDef> = {
  initial: T['initial'];
  states: {
    [K in T['states'] | T['initial']]: T['states'] extends infer S1 extends
      string
      ? State<S1>
      : State<string>;
  };
};

export type NoExtraKeysState<T extends State> = T & {
  [K in Exclude<keyof T, keyof State>]: never;
};

export type NoExtraKeysConfig<T extends Config> = T & {
  [K in Exclude<keyof T, keyof Config | '__tsSchema'>]: never;
} & {
  states: {
    [K in keyof T['states']]: NoExtraKeysState<T['states'][K]>;
  };
};

type _isAsyncConfig<C extends Config> = C extends {
  states: Record<any, infer A extends any>;
}
  ? A extends PromiseState
    ? true
    : false
  : never;

export type IsAsyncConfig<C extends Config> =
  _isAsyncConfig<C> extends false ? false : true;

export type ExtractSOA<T extends SingleOrArray | undefined> =
  unknown extends T
    ? never
    : T extends undefined
      ? never
      : T extends ReadonlyArray<any>
        ? T[number]
        : T;

export type GetEntryActions<ST extends Record<string, State>> =
  GetEntryActionKeysFromState<ST[keyof ST]>;

export type GetEntryActionKeysFromState<ST extends State> = ExtractSOA<
  ST['entry']
>;

export type GetTransitionsActions<T extends Transition | TransitionArray> =
  T extends string
    ? never
    : T extends TransitionObj
      ? ExtractSOA<T['actions']>
      : T extends TransitionArray
        ? GetTransitionsActions<T[number]>
        : never;

export type GetExitActionsFromSimpleState<ST extends SimpleState> =
  ExtractSOA<ST['exit']>;

export type GetActionKeysFromSimpleState<ST extends SimpleState> =
  | GetTransitionsActions<Exclude<ST['always'], undefined>>
  | GetEntryActionKeysFromState<ST>
  | GetExitActionsFromSimpleState<ST>;

export type GetPromiseKeysFromPromise<T extends PromiseState> =
  ExtractSOA<T['invoke']> extends infer U extends SRC ? U['src'] : never;

export type GetPromiseKeysFromConfig<C extends Config> =
  Extract<
    C['states'][keyof C['states']],
    PromiseState
  > extends infer P extends PromiseState
    ? GetPromiseKeysFromPromise<P>
    : never;

// #region Guards

export type GetKeysFromGuard<T extends Guards | undefined> =
  T extends undefined
    ? never
    : T extends string
      ? T
      : T extends string[]
        ? T[number]
        : T extends readonly GuardUnion[]
          ? GetKeysFromGuard<T[number]>
          : T extends GuardOr
            ? GetKeysFromGuard<T['or']>
            : T extends GuardAnd
              ? GetKeysFromGuard<T['and']>
              : never;

export type GetGuardKeysFromTransition<
  T extends TransitionArray | Transition,
> = T extends string
  ? never
  : T extends TransitionObj
    ? GetKeysFromGuard<T['cond']>
    : T extends TransitionArray
      ? GetGuardKeysFromTransition<T[number]>
      : never;

// #endregion

type _ExtractDataKeysFromConfig<C extends Config> =
  | (C extends {
      data: infer D;
    }
      ? D
      : never)
  | {
      [K in keyof C['states']]: C['states'][K] extends infer Ck extends
        FinalState
        ? Ck['data']
        : never;
    }[keyof C['states']];

export type ExtractDataKeysFromConfig<C extends Config> =
  _ExtractDataKeysFromConfig<C> extends infer T extends string ? T : never;
