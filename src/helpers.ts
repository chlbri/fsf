import {
  SAS,
  StateFunction,
  Transition,
  TransitionDefinition,
  SingleOrArray,
  State,
  FinalState,
  SyncState,
  AsyncState,
  PromiseWithTimeoutArgs,
} from './types';

export const returnTrue = () => true;

export function unimplementedAction<T extends string>(action: T) {
  console.log(`${action} (Not implemented)`);
}

export const voidNothing = () => void undefined;
export const return0 = () => 0;
export const asyncVoidNothing = async () => void undefined;
export const asyncReturn0 = async () => 0;

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
  source: string,
  options?: {
    actions?: Record<string, StateFunction<TC, TA, void>>;
    conditions?: Record<string, StateFunction<TC, TA, boolean>>;
  },
): (value: Transition) => TransitionDefinition<TC, TA> {
  return transition => {
    const target = transition.target;
    const description = transition.description;

    const actions = extractActions(transition.actions);

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
      ...transitions.map(extractTransitionFunction(source, options)),
    );
  } else {
    functions.push(
      extractTransitionFunction(source, options)(transitions),
    );
  }
  return functions;
}

export function isSync(state: State): state is SyncState {
  return state.type === 'sync' || !!state.transitions;
}

export function isAsync(state: State): state is AsyncState {
  return state.type === 'async' || !!state.src;
}

export function isFinal(state: State): state is FinalState {
  return state.type === 'final' || (!state.transitions && !state.src);
}

export function promiseWithTimeout<T>({
  timeoutMs,
  promise,
  failureMessage,
}: PromiseWithTimeoutArgs<T>): () => Promise<Awaited<T>> {
  let timeoutHandle: NodeJS.Timeout;
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
