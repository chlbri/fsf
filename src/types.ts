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

export type BaseStateDefinition<TA = any, TC = any> = {
  value: string;
  matches: <T extends string>(value: T) => boolean;
  entry: StateFunction<TC, TA, void>[];
  exit: StateFunction<TC, TA, void>[];
};

export type StateDefinition<TA = any, TC = any> = BaseStateDefinition<
  TA,
  TC
> & {
  transitions: TransitionDefinition<TC, TA>[];
};

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

export type State = {
  entry?: SAS;
  exit?: SAS;
  description?: string;
  transitions: SingleOrArray<Transition>;
};

export type Config<TA = any, TC = any, D = TC> = {
  context: TC;
  initial: string;
  args?: TA;
  schema?: {
    context?: TC;
    args?: TA;
    data?: D;
  };
  data?: StateFunction<TC, TA, D>;
  states: Record<string, State>;
};

export type Options<TC = any, TA = any> = {
  actions?: Record<string, StateFunction<TC, TA, any>>;
  conditions?: Record<string, StateFunction<TC, TA, boolean>>;
  promises?: Record<string, StateFunction<TC, TA, Promise<any>>>;
  timeouts?: Record<string, number>;
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
