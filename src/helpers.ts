import type {
  FinalState,
  FinalStateDefinition,
  SAS,
  SingleOrArray,
  StateDefinition,
  StateFunction,
  Transition,
  TransitionDefinition,
} from './types';

// #region Usual Functions
// eslint-disable-next-line @typescript-eslint/no-empty-function
export const voidNothing = () => {};
export const returnTrue = () => true;
export const return0 = () => 0;
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
      ...strings.map(entry => {
        return conditions?.[entry] ?? returnTrue;
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

function extractTransitionFromFunction<TC = any, TA = any>(
  source: string,
  options?: {
    actions?: Record<string, StateFunction<TC, TA, void>>;
    conditions?: Record<string, StateFunction<TC, TA, boolean>>;
  },
): (value: Transition) => TransitionDefinition<TC, TA> {
  return transition => {
    const target = transition.target;

    //TODO: test error "Cannot transit to himself"
    if (source === target) {
      throw `Cannot transit to himself : ${source}`;
    }

    const description = transition.description;
    const actions = extractActions(transition.actions, options?.actions);
    const conditions = extractConditions(
      transition.cond,
      options?.conditions,
    );

    return {
      source,
      actions,
      cond: conditions,
      target,
      description,
    };
  };
}

export function extractTransitions<TC = any, TA = any>(
  source: string,
  always: SingleOrArray<Transition>,
  options?: {
    actions?: Record<string, StateFunction<TC, TA, void>>;
    conditions?: Record<string, StateFunction<TC, TA, boolean>>;
  },
) {
  const functions: TransitionDefinition<TC, TA>[] = [];

  if (Array.isArray(always)) {
    functions.push(
      ...always.map(extractTransitionFromFunction(source, options)),
    );
  } else {
    functions.push(extractTransitionFromFunction(source, options)(always));
  }
  return functions;
}

export function isFinalState(value: any): value is FinalState {
  return 'data' in value && typeof value.data === 'string';
}

export function isFinalStateDefinition<TA = any, TC = any, R = any>(
  value: StateDefinition<TA, TC, R>,
): value is FinalStateDefinition<TA, TC, R> {
  return 'data' in value && typeof value.data === 'function';
}

// export function promiseWithTimeout({
//   timeoutMs,
//   promise,
//   failureMessage,
// }: PromiseWithTimeout): () => Promise<void> {
//   let timeoutHandle: ReturnType<typeof setTimeout>;
//   const timeoutPromise = new Promise<never>((_, reject) => {
//     timeoutHandle = setTimeout(
//       () => reject(new Error(failureMessage)),
//       timeoutMs,
//     );
//   });

//   return () =>
//     Promise.race([promise(), timeoutPromise]).then(result => {
//       clearTimeout(timeoutHandle);
//       return result;
//     });
// }
