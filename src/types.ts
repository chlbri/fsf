import { asyncReturn0, asyncVoidNothing, voidNothing } from './helpers';

export type StateFunction<TC = any, TA = any, R = any> = (
  context?: TC,
  args?: TA,
) => R;

export type SingleOrArray<T> = T | T[];

export type TransitionDefinition<
  TT extends string = string,
  TC = any,
  TA = any,
> = {
  target: TT;
  source: TT;
  actions: StateFunction<TC, TA, void>[];
  conditions: StateFunction<TC, TA, boolean>[];
  description?: string;
};

export type StateDefinition<
  TT extends string = string,
  TContext = any,
  TArgs = any,
  R = any,
> = {
  value: TT;
  matches: <T extends TT>(value: T) => boolean;
  context?: TContext;
  args?: TArgs;
  entry: StateFunction<TContext, TArgs, void>[];
  exit: StateFunction<TContext, TArgs, void>[];
} & (
  | {
      type: 'sync';
      transitions: TransitionDefinition<TT, TContext, TArgs>[];
    }
  | {
      type: 'async';
      src: StateFunction<TContext, TArgs, Promise<R>>;
      onDone: Omit<TransitionDefinition<TT, TContext, R>, 'conditions'>;
      onError: Omit<TransitionDefinition<TT, TContext, any>, 'conditions'>;
      timeout: number;
      // finally: (context?: TContext) => void;
    }
  | {
      type?: 'final';
    }
);

export type Transition<
  S extends string = string,
  A extends string = string,
  C extends string = string,
> = {
  target: S;
  conditions: SingleOrArray<C>;
  actions: SingleOrArray<A>;
  description?: string;
};

export type State<
  S extends string = string,
  A extends string = string,
  C extends string = string,
  P extends string = string,
  O extends string = string,
  E extends string = string,
  T extends string | number = string | number,
> = {
  entry: SingleOrArray<A>;
  exit: SingleOrArray<A>;
  description?: string;
} & (
  | {
      type: 'sync';
      transitions: SingleOrArray<Transition<S, A, C>>;
    }
  | {
      type: 'async';
      src: P;
      onDone: Omit<Transition<S, O>, 'conditions'>;
      onError: Omit<Transition<S, E>, 'conditions'>;
      timeout: T;
      // finally: (context?: TContext) => void;
    }
  | {
      type?: 'final';
    }
);

export type Config<
  TC = any,
  TA = any,
  TT extends string = string,
  R extends {
    actions: string;
    conditions: string;
    promises: string;
    timeouts: string | number;
  } = {
    actions: string;
    conditions: string;
    promises: string;
    timeouts: string | number;
  },
> = {
  context?: TC;
  initial: TT;
  args?: TA;
  states: Record<
    TT,
    State<
      TT,
      R['actions'],
      R['conditions'],
      R['promises'],
      R['actions'],
      R['actions'],
      R['timeouts']
    >
  >;
};

export type ActionsMap<
  TC,
  TA,
  A extends string,
  P extends Record<
    string,
    {
      src: string;
      actionsDone: string;
      errorsDone: string;
    }
  >,
> = {
  [key in A]?: StateFunction<TC, TA, void>;
} & Partial<
  {
    [key in keyof P]: Record<
      P[key]['actionsDone'],
      StateFunction<TC, P[key]['src'], void>
    >;
  }[keyof P]
> &
  Partial<
    {
      [key in keyof P]: Record<
        P[key]['errorsDone'],
        StateFunction<TC, any, void>
      >;
    }[keyof P]
  >;

export type ConditionsMap<TC, TA, C extends string> = Partial<
  Record<C, StateFunction<TC, TA, boolean>>
>;

export type PromisesMap<
  TC,
  TA,
  P extends Record<
    string,
    {
      src: any;
      actionsDone: string;
      errorsDone: string;
    }
  >,
> = {
  [key in keyof P]?: StateFunction<TC, TA, Promise<P[key]['src']>>;
};

export type Options<
  TC = any,
  TA = any,
  R extends {
    actions: string;
    conditions: string;
    promises: Record<
      string,
      {
        src: any;
        actionsDone: string;
        errorsDone: string;
      }
    >;
    timeouts: string | number;
  } = {
    actions: string;
    conditions: string;
    promises: Record<
      string,
      {
        src: any;
        actionsDone: string;
        errorsDone: string;
      }
    >;
    timeouts: string | number;
  },
> = {
  actions?: ActionsMap<TC, TA, R['actions'], R['promises']>;
  conditions?: ConditionsMap<TC, TA, R['conditions']>;
  promises?: PromisesMap<TC, TA, R['promises']>;
  timeouts?: Record<R['timeouts'], number>;
};

function testConfig<
  TC = any,
  TA = any,
  R extends {
    actions: string;
    conditions: string;
    promises: Record<
      string,
      {
        src: any;
        actionsDone: string;
        errorsDone: string;
      }
    >;
    timeouts: string | number;
  } = {
    actions: string;
    conditions: string;
    promises: Record<
      string,
      {
        src: any;
        actionsDone: string;
        errorsDone: string;
      }
    >;
    timeouts: string | number;
  },
>(config: Options<TC, TA, R>) {
  console.log(config);
}

testConfig<
  number,
  boolean,
  {
    actions: 'string';
    conditions: string;
    promises: Record<
      'prom1' | 'prom2',
      {
        src: number;
        actionsDone: 'allo';
        errorsDone: 'toto';
      }
    >;
    timeouts: string | number;
  }
>({
  actions: {
    string: voidNothing,
    allo: voidNothing,
    toto: voidNothing,
  },
  promises: {
    prom1: asyncReturn0,
  },
  timeouts: { aer: 0 },
});

const arr = [2, 3, 4];
const _arr = arr.map(x => x + 1);
arr.length = 0;
arr.push(..._arr);
console.log('arr', '=>', arr);
const testPro = async (arg: boolean) => {
  if (arg) return true;
  throw new Error('d');
};
const _test = testPro(false).catch(err => {
  err.message;
});

type TestPro = Parameters<typeof _test['catch']>;
