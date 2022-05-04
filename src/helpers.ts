import {
  AsyncState,
  AsyncStateDefinition,
  FinalStateTarget,
  FINAL_TARGET,
  PromiseWithTimeoutArgs,
  SAS,
  SingleOrArray,
  State,
  StateDefinition,
  StateFunction,
  SyncState,
  SyncStateDefinition,
  Transition,
  TransitionDefinition,
} from './types';

export const returnTrue = () => true;

export function unimplementedAction<T extends string>(action: T) {
  console.log(`${action} (Not implemented)`);
}

export const voidNothing = () => void undefined;
export const return0 = () => 0;
export const asyncVoidNothing = async () => void undefined;
export const asyncReturn0 = async () => 0;

export const identity = <T>(x: T) => x;

export function extractConditions<TC = any, TA = any>(
  strings?: SAS,
  conditions?: Record<string, StateFunction<TC, TA, boolean>>,
) {
  const functions: StateFunction<TC, TA, boolean>[] = [];
  if (!strings) return functions;
  if (Array.isArray(strings)) {
    functions.push(
      ...strings.map(_entry => {
        return conditions?.[_entry] ?? returnTrue;
      }),
    );
  } else {
    functions.push(conditions?.[strings] ?? returnTrue);
  }
  return functions;
}

export function extractActions<TC = any, TA = any>(
  strings?: SAS,
  actions?: Record<string, StateFunction<TC, TA, void>>,
) {
  const functions: StateFunction<TC, TA, void>[] = [];
  if (!strings) return functions;
  if (Array.isArray(strings)) {
    functions.push(
      ...strings.map(_entry => {
        return actions?.[_entry] ?? voidNothing;
      }),
    );
  } else {
    functions.push(actions?.[strings] ?? voidNothing);
  }
  return functions;
}

export function extractTransitionFunction<TC = any, TA = any>(
  strings: string[],
  source: string,
  options?: {
    actions?: Record<string, StateFunction<TC, TA, void>>;
    conditions?: Record<string, StateFunction<TC, TA, boolean>>;
  },
): (value: Transition) => TransitionDefinition<TC, TA> {
  return transition => {
    const target = transition.target;
    const someStateNotExists =
      !(target === FINAL_TARGET) && !strings.includes(target as string);

    if (someStateNotExists) {
      throw `No state for "${target}"`;
    }

    if (source === target) {
      throw 'Cannot transit to himself';
    }
    const description = transition.description;

    const actions = extractActions(transition.actions, options?.actions);

    const conditions = extractConditions(
      transition.conditions,
      options?.conditions,
    );

    return {
      source,
      actions,
      conditions,
      target,
      description,
    };
  };
}

export function extractTransitions<TC = any, TA = any>(
  strings: string[],
  source: string,
  transitions?: SingleOrArray<Transition>,
  options?: {
    actions?: Record<string, StateFunction<TC, TA, void>>;
    conditions?: Record<string, StateFunction<TC, TA, boolean>>;
  },
) {
  const functions: TransitionDefinition<TC, TA>[] = [];
  if (!transitions) return functions;

  if (Array.isArray(transitions)) {
    functions.push(
      ...transitions.map(
        extractTransitionFunction(strings, source, options),
      ),
    );
  } else {
    functions.push(
      extractTransitionFunction(strings, source, options)(transitions),
    );
  }
  return functions;
}

export function isSync(state: State): state is SyncState {
  return state.type === 'sync';
}

export function isAsync(state: State): state is AsyncState {
  return state.type === 'async';
}

export function isFinalTarget(
  value: string | FinalStateTarget,
): value is FinalStateTarget {
  return value === FINAL_TARGET;
}

export function promiseWithTimeout<T>({
  timeoutMs,
  promise,
  failureMessage,
}: PromiseWithTimeoutArgs<T>): () => Promise<Awaited<T>> {
  let timeoutHandle: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(
      () => reject(new Error(failureMessage)),
      timeoutMs,
    );
  });

  return () =>
    Promise.race([promise(), timeoutPromise]).then(result => {
      clearTimeout(timeoutHandle);
      return result;
    });
}

export function isSyncDef<TA = any, TC = any>(
  state: StateDefinition<TA, TC>,
): state is SyncStateDefinition<TA, TC> {
  return state.type === 'sync';
}

export function isAsyncDef<TA = any, TC = any>(
  state: StateDefinition<TA, TC>,
): state is AsyncStateDefinition<TA, TC> {
  return state.type === 'async';
}
