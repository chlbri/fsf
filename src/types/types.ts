import type { StateFunction } from './core';

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
