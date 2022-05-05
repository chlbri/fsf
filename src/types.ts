import { FINAL_TARGET } from './constants';
import type { MachineFunction } from './machineFunction';

/* eslint-disable @typescript-eslint/ban-types */
export type StateFunction<TC = any, TA = any, R = any> = (
  context: TC,
  args: TA,
) => R;

export type SingleOrArray<T> = T | T[];

export type TransitionDefinition<TC = any, TA = any> = {
  target: string | FST;
  source: string;
  actions: StateFunction<TC, TA, void>[];
  conditions: StateFunction<TC, TA, boolean>[];
  description?: string;
};

export type StateType = 'sync' | 'async';

export type BaseStateDefinition<
  TA = any,
  TC = any,
  T extends StateType = StateType,
> = {
  value: string;
  matches: <T extends string>(value: T) => boolean;
  entry: StateFunction<TC, TA, void>[];
  exit: StateFunction<TC, TA, void>[];
  type: T;
};

export type SyncStateDefinition<TA = any, TC = any> = BaseStateDefinition<
  TA,
  TC,
  'sync'
> & {
  transitions: TransitionDefinition<TC, TA>[];
};

export type AsyncStateDefinition<TA = any, TC = any> = BaseStateDefinition<
  TC,
  TA,
  'async'
> & {
  promise: StateFunction<TC, TA, Promise<void>>;
  onDone: TransitionDefinition<TC, TA>[];
  onError: TransitionDefinition<TC, TA>[];
  timeout: number;
  finally?: (context?: TC) => void;
};

export type StateDefinition<TA = any, TC = any> =
  | SyncStateDefinition<TA, TC>
  | AsyncStateDefinition<TA, TC>;

export type PromiseWithTimeout = {
  timeoutMs: number;
  promise: () => Promise<void>;
  failureMessage?: string;
};

export type SAS = SingleOrArray<string>;

export type Transition = {
  target: string | FST;
  conditions?: SAS;
  actions?: SAS;
  description?: string;
};

type _BaseState = {
  entry?: SAS;
  exit?: SAS;
  description?: string;
};

export type SyncState = _BaseState & {
  type: 'sync';
  transitions: SingleOrArray<Transition>;
};

export type AsyncState = _BaseState & {
  type: 'async';
  promise: string;
  onDone: Transition[];
  onError: Transition[];
  timeout: string;
};

export type State = SyncState | AsyncState;

export type DefinitionFromState<
  TA = any,
  TC = any,
  S extends State = State,
> =
  | ('sync' extends S['type'] ? SyncStateDefinition<TA, TC> : never)
  | ('async' extends S['type'] ? AsyncStateDefinition<TA, TC> : never);

export type DFS<
  TA = any,
  TC = any,
  S extends State = State,
> = DefinitionFromState<TA, TC, S>;

export type Config<TA = any, TC = any, S extends State = State, D = TC> = {
  context: TC;
  initial: string;
  args?: TA;
  schema?: {
    context?: TC;
    args?: TA;
    data?: D;
  };
  data?: StateFunction<TC, TA, D>;
  states: Record<string, S>;
};

export type Options<TC = any, TA = any> = {
  actions?: Record<string, StateFunction<TC, any, any>>;
  conditions?: Record<string, StateFunction<TC, TA, boolean>>;
  promises?: Record<string, StateFunction<TC, TA, Promise<any>>>;
  timeouts?: Record<string, number>;
  async?: true | undefined;
  overflow?: number;
};

export type FST = typeof FINAL_TARGET;

export type UndefinyFunction<T, R> = T extends undefined
  ? () => R
  : (args: T) => R;

export type GetTA<T extends MachineFunction> = T extends MachineFunction<
  infer U
>
  ? U
  : never;

export type GetTC<T extends MachineFunction> = T extends MachineFunction<
  any,
  infer U
>
  ? U
  : never;
