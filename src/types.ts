export type StateFunction<
  TC extends Record<string, unknown> = Record<string, unknown>,
  TA = any,
  R = any,
> = (context?: TC, args?: TA) => R;

export type TransitionDefinition<
  TC extends Record<string, unknown>,
  TA,
  TT extends string,
> = {
  target: TT;
  source?: TT;
  actions: StateFunction<TC, TA, void>[];
  conditions: StateFunction<TC, TA, boolean>[];
  in: TT;
  description?: string;
};

export type StateValue = string | { [x: string]: string | StateValue };
export type State<
  TContext extends Record<string, unknown>,
  TArgs,
  TT extends string,
> = {
  value: TT;
  matches: <T extends TT>(value: T) => boolean;
  context?: TContext;
  args?: TArgs;
} & (
  | {
      type?: 'simple';
      transitions: TransitionDefinition<TContext, TArgs, TT>[];
    }
  | {
      type: 'final';
    }
);

export type SingleOrArray<T> = T | T[];

export type PromiseState<
  TC extends Record<string, unknown> = Record<string, unknown>,
  TA = any,
  TT extends string = string,
  R = any,
> = {
  type: 'promise';
  value: TT;
  matches: <T extends TT>(value: T) => boolean;
  context?: TC;
  args?: TA;
  src: StateFunction<TC, TA, PromiseLike<R>>;
  onDone: {
    target: TT;
    actions: SingleOrArray<StateFunction<TC, R, void>>;
  };
  onError: {
    target: TT;
    actions: SingleOrArray<StateFunction<TC, any, void>>;
  };
  onEnd?: {
    target: TT;
    actions: SingleOrArray<() => void>;
  };
};

export type HierarchicalState<
  TC extends Record<string, unknown> = Record<string, unknown>,
  TA = any,
  TT extends string = string,
  R extends Record<string, any> = Record<string, any>,
> = {
  type: 'hierachical';
  value?:TT,
  context?: TC;
  args?: TA;
  states: Record<
    TT,
    | HierarchicalState<TC, TA, TT>
    | SimpleState<TC, TA, TT>
    | PromiseState<TC, TA, TT, R[string]>
  >;
  initial: TT;
};

export type Config<
  TC extends Record<string, unknown> = Record<string, unknown>,
  TA = any,
  TT extends string = string,
  C extends string = string,
  R extends Record<string, any> = Record<string, any>,
> = {
  type: 'hierachical';
  id: C;
  context?: TC;
  args?: TA;
  states: Record<
    TT,
    | HierarchicalState<TC, TA, TT>
    | SimpleState<TC, TA, TT>
    | PromiseState<TC, TA, TT, R[string]>
  >;
  initial: TT;
};

function testHier<
  TC extends Record<string, unknown> = Record<string, unknown>,
  TA = any,
  TT extends string = string,
  R extends Record<string, any> = Record<string, any>,
>(arg: HierarchicalState<TC, TA, TT, R>) {
  return true;
}

testHier({
  type: 'hierachical',
  context: { oh: true },
  args: [56, 'ert'],
  states: {
    other: {
      value: 'other',
      matches: val => val === 'other',
      transitions: [],
    },
    success: {
      value: 'success',
      matches: val => val === 'success',
      transitions: [],
    },
    error: {
      value: 'error',
      matches: val => val === 'error',
      transitions: [],
    },
    promise: {
      value: 'promise',
      type: 'promise',
      matches: val => val === 'promise',
      src: async () => true,
      onDone: {
        target: 'success',
        actions: [],
      },
      onError: {
        target: 'error',
        actions: [],
      },
    },
  },
  initial: 'other',
});

export type SimpleState<
  TC extends Record<string, unknown> = Record<string, unknown>,
  TA = any,
  TT extends string = string,
  R = any,
> = {
  type?: 'simple';
  value: TT;
  matches: <T extends TT>(value: T) => boolean;
  transitions: TransitionDefinition<TC, TA, TT>[];
  context?: TC;
  args?: TA;
};

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
