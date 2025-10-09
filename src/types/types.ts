/* eslint-disable @typescript-eslint/no-empty-object-type */
import type {
  PromiseDefs,
  RecordFunctions,
  StateFunction,
  UnionToIntersection,
} from './core';
import type {
  Config,
  ConfigTypes,
  ExtractDataKeysFromConfig,
  ExtractSOA,
  FinalState,
  GetActionKeysFromSimpleState,
  GetEntryActionKeysFromState,
  GetGuardKeysFromTransition,
  GetPromiseKeysFromConfig,
  GetTransitionsActions,
  PromiseState,
  SimpleState,
  SRC,
  State,
} from './json';

export type GuardDef<TA = any, TC = any> = StateFunction<TC, TA, boolean>;

export type TransitionDefinition<TC = any, TA = any> = {
  target?: string;
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

// #region Actions
export type GetActionsBySRC<
  S extends PromiseDefs,
  T extends SRC,
  TC extends object = object,
> = Record<
  GetTransitionsActions<T['then']>,
  StateFunction<TC, S[T['src']]['data']>
> &
  Record<
    GetTransitionsActions<T['catch']>,
    StateFunction<TC, S[T['src']]['error']>
  > &
  Record<
    ExtractSOA<T['finally']>,
    StateFunction<TC, S[T['src']]['data'] | S[T['src']]['error'], void>
  >;

export type GetActionsFromPromiseState<
  ST extends PromiseState,
  S extends PromiseDefs = PromiseDefs,
  TC extends object = object,
  TA = any,
> = Record<GetEntryActionKeysFromState<ST>, StateFunction<TC, TA, void>> &
  (ExtractSOA<ST['invoke']> extends infer U extends SRC
    ? GetActionsBySRC<S, U, TC>
    : unknown);

export type GetActionsFromState<
  ST extends State,
  S extends PromiseDefs = PromiseDefs,
  TC extends object = object,
  TA = any,
> = ST extends PromiseState
  ? GetActionsFromPromiseState<ST, S, TC, TA>
  : ST extends SimpleState
    ? Record<GetActionKeysFromSimpleState<ST>, StateFunction<TC, TA>>
    : ST extends FinalState
      ? Record<GetEntryActionKeysFromState<ST>, StateFunction<TC, TA>>
      : never;

// export type GetActionsFromConfig<
//   C extends Config,
//   S extends PromiseDefs = PromiseDefs,
//   TC extends object = object,
//   TA = any,
// > = {
//   [K in keyof C['states']]: GetActionsFromState<C['states'][K], S, TC, TA>;
// }[keyof C['states']];
// #endregion

// #region Guards
export type GetGuardsFromSimpleState<
  ST extends SimpleState,
  TC extends object = object,
  TA = any,
> =
  GetGuardKeysFromTransition<
    Exclude<ST['always'], undefined>
  > extends infer Keys extends string
    ? Record<Keys, StateFunction<TC, TA, boolean>>
    : never;

export type GetGuardsFromSRC<
  Invoke extends SRC,
  S extends PromiseDefs = PromiseDefs,
  TC extends object = object,
> = (GetGuardKeysFromTransition<Invoke['then']> extends infer ThenKeys
  ? ThenKeys extends never
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
  S extends PromiseDefs = PromiseDefs,
  TC extends object = object,
> = ST['invoke'] extends infer Invoke
  ? Invoke extends SRC
    ? GetGuardsFromSRC<Invoke, S, TC>
    : Invoke extends ReadonlyArray<SRC>
      ? GetGuardsFromSRC<Invoke[number], S, TC>
      : never
  : never;

export type GetGuardsFromState<
  ST extends State,
  S extends PromiseDefs = Record<string, { data: any; error: any }>,
  TC extends object = object,
  TA = any,
> = ST extends SimpleState
  ? GetGuardsFromSimpleState<ST, TC, TA>
  : ST extends PromiseState
    ? GetGuardsFromPromiseState<ST, S, TC>
    : never;

// export type GetGuardsFromConfig<
//   C extends Config,
//   S extends PromiseDefs = PromiseDefs,
//   TC extends object = object,
//   TA = any,
// > = {
//   [K in keyof C['states']]: GetGuardsFromState<C['states'][K], S, TC, TA>;
// }[keyof C['states']];
// #endregion

export type Options<
  C extends Config,
  T extends ConfigTypes<C>,
  T1 extends T & { promises: {} } = T & { promises: {} },
> = {
  overflow?: number;
  strict?: boolean;
  unFreezeArgs?: boolean;

  datas?: Partial<
    UnionToIntersection<
      Record<
        ExtractDataKeysFromConfig<C>,
        StateFunction<T['context'], T['events'], T['data']>
      >
    >
  >;

  actions?: Partial<
    UnionToIntersection<
      GetActionsFromState<
        C['states'][keyof C['states']],
        T1['promises'],
        T['context'],
        T['events']
      >
    >
  >;

  guards?: Partial<
    UnionToIntersection<
      GetGuardsFromState<
        C['states'][keyof C['states']],
        T1['promises'],
        T['context'],
        T['events']
      >
    >
  >;

  promises?: Record<
    GetPromiseKeysFromConfig<C>,
    StateFunction<T['context'], T['events'], Promise<any>>
  >;
};
