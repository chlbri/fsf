import type { MachineFunction } from './machineFunction';

/* eslint-disable @typescript-eslint/ban-types */
export type StateFunction<TC = any, TA = any, R = any> = (
  context: TC,
  args: TA,
) => R;

export type SingleOrArray<T> = T | T[];

export type TransitionDefinition<TC = any, TA = any> = {
  target: string;
  source: string;
  actions: StateFunction<TC, TA, void>[];
  //TODO: Better conditions type
  cond: StateFunction<TC, TA, boolean>[];
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
  always: TransitionDefinition<TC, TA>[];
  exit: StateFunction<TC, TA, void>[];
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
  | FinalStateDefinition<TA, TC, R>;

export type PromiseWithTimeout = {
  timeoutMs: number;
  promise: () => Promise<void>;
  failureMessage?: string;
};

export type SAS = SingleOrArray<string>;

export type Transition =
  | string
  | {
      target: string;
      //TODO: Better conditions type
      cond?: SAS;
      actions?: SAS;
      description?: string;
    };

export type BaseState = {
  entry?: SAS;

  description?: string;
};

export type SimpleState = BaseState & {
  exit?: SAS;
  always: SingleOrArray<Exclude<Transition, string>> | string;
};

export type FinalState = BaseState & {
  data: string;
};

export type State = SimpleState | FinalState;

export type Config<TA = any, TC = any, R = TC> = {
  context: TC;
  initial: string;
  schema?: {
    context?: TC;
    args?: TA;
    data?: R;
  };
  data?: string;
  states: Record<string, State>;
};

export type Options<TC = any, TA = any, R = any> = {
  actions?: Record<string, StateFunction<TC, TA, any>>;
  conditions?: Record<string, StateFunction<TC, TA, boolean>>;
  datas?: Record<string, StateFunction<TC, TA, R>>;
  overflow?: number;
};

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
