export type StateFunction<TC = any, TA = any, R = any> = (
  context?: TC,
  args?: TA,
) => R;

export type SingleOrArray<T> = T | T[];

export type TransitionDefinition<TC = any, TA = any> = {
  target: string;
  source: string;
  actions: StateFunction<TC, TA, void>[];
  conditions: StateFunction<TC, TA, boolean>[];
  description?: string;
};

export type StateDefinition<TC = any, TA = any> = {
  value: string;
  matches: <T extends string>(value: T) => boolean;
  entry: StateFunction<TC, TA, void>[];
  exit: StateFunction<TC, TA, void>[];
} & (
  | {
      type: 'sync';
      transitions: TransitionDefinition<TC, TA>[];
    }
  | {
      type: 'async';
      src: StateFunction<TC, TA, Promise<any>>;
      onDone: Omit<TransitionDefinition<TC, any>, 'conditions'>;
      onError: Omit<TransitionDefinition<TC, any>, 'conditions'>;
      timeout: number;
      // finally: (context?: TContext) => void;
    }
  | {
      type: 'final';
    }
);

export type PromiseWithTimeoutArgs<T> = {
  timeoutMs: number;
  promise: () => Promise<T>;
  failureMessage?: string;
};

export type SAS = SingleOrArray<string>;

export type Transition = {
  target: string;
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
  type?: 'sync';
  transitions: SingleOrArray<Transition>;
  src?: undefined;
  onDone?: undefined;
  onError?: undefined;
  timeout?: undefined;
};

export type AsyncState = _BaseState & {
  type?: 'async';
  src: string;
  onDone: Omit<Transition, 'conditions'>;
  onError: Omit<Transition, 'conditions'>;
  timeout: string;
  transitions?: undefined;
};

export type FinalState = _BaseState & {
  type?: 'final';
  transitions?: undefined;
  src?: undefined;
  onDone?: undefined;
  onError?: undefined;
  timeout?: undefined;
};

export type State = SyncState | AsyncState | FinalState;

export type Config<TC = any, TA = any> = TC extends undefined ? {
  context: TC;
  initial: string;
  args?: TA;
  states: Record<string, State>;
}:{
  context: TC;
  initial: string;
  args?: TA;
  states: Record<string, State>;
};

export type Options<TC = any, TA = any> = {
  actions?: Record<string, StateFunction<TC, any, any>>;
  conditions?: Record<string, StateFunction<TC, TA, boolean>>;
  promises?: Record<string, StateFunction<TC, TA, Promise<any>>>;
  timeouts?: Record<string, number>;
};
