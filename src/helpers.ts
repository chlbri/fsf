import { FINAL_TARGET } from './constants';
import type {
  AsyncState,
  AsyncStateDefinition,
  FST,
  PromiseWithTimeout,
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

// #region Usual Functions
export const asyncVoid = async () => {
  return;
};

export const voidNothing = () => {
  return;
};

export const returnTrue = () => true;
export const return0 = () => 0;
export const asyncReturn0 = async () => 0;
export const asyncReturnTrue = async () => true;
export const identity = <T>(value: T) => value;
// #endregion

function extractConditions<TC = any, TA = any>(
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
  states: string[],
  source: string,
  options?: {
    actions?: Record<string, StateFunction<TC, TA, void>>;
    conditions?: Record<string, StateFunction<TC, TA, boolean>>;
  },
): (value: Transition) => TransitionDefinition<TC, TA> {
  return transition => {
    const target = transition.target;
    const stateNotExists =
      !isFinalTarget(target) && !states.includes(target as string);

    if (stateNotExists) {
      throw `No state for "${target}"`;
    }

    if (source === target) {
      throw `Cannot transit to himself : ${source}`;
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
  states: string[],
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
        extractTransitionFunction(states, source, options),
      ),
    );
  } else {
    functions.push(
      extractTransitionFunction(states, source, options)(transitions),
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

export function isFinalTarget(value: unknown): value is FST {
  return value === FINAL_TARGET;
}

export function promiseWithTimeout({
  timeoutMs,
  promise,
  failureMessage,
}: PromiseWithTimeout): () => Promise<void> {
  let timeoutHandle: ReturnType<typeof setTimeout>;
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
