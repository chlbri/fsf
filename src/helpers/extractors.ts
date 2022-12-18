import reduceGuards from '@bemedev/x-guard';
import type {
  FinalState,
  FinalStateDefinition,
  Options,
  SAS,
  SingleOrArray,
  StateDefinition,
  StateFunction,
  Transition,
  TransitionDefinition,
} from '../types';
import { voidNothing } from './functions';
import { assignGuards } from './guards';

// #region Usual Functions

// #endregion

export function extractActions<TC = any, TA = any>(
  strings?: SAS,
  actions?: Options<TA, TC>['actions'],
  strict = false,
) {
  const functions: StateFunction<TC, TA, void>[] = [];
  if (!strings) return functions;
  if (Array.isArray(strings)) {
    functions.push(
      ...strings.map(entry => {
        const action = actions?.[entry];
        if (!action) {
          if (strict) throw new Error(`Action ${entry} is not provided`);
          return voidNothing;
        }
        return action;
      }),
    );
  } else {
    const action = actions?.[strings];
    if (!action) {
      strict; //?
      if (strict) throw new Error(`Action ${strings} is not provided`);
      functions.push(voidNothing);
    } else {
      functions.push(action);
    }
  }
  return functions;
}

function extractFunction<TC extends object = object, TA = any>(
  source: string,
  __keys: string[],
  options?: Omit<Options<TA, TC>, 'overflow' | 'datas'>,
): (value: Transition) => TransitionDefinition<TC, TA> {
  return transition => {
    if (typeof transition === 'string') {
      const target = transition;
      const check = __keys.includes(target);
      if (!check) throw new Error(`State ${target} is not defined`);
      if (source === transition) {
        throw new Error(`Cannot transit to himself : ${target}`);
      }
      return {
        source,
        actions: [],
        target,
      };
    }
    const target = transition.target;
    const check = __keys.includes(target);
    if (!check) throw new Error(`State ${target} is not defined`);
    if (source === target) {
      throw new Error(`Cannot transit to himself : ${target}`);
    }

    const description = transition.description;
    const actions = extractActions(
      transition.actions,
      options?.actions,
      options?.strict,
    );
    const _conds = assignGuards(
      transition.cond,
      options?.guards,
      options?.strict,
    );
    const cond = reduceGuards(_conds);

    return {
      source,
      actions,
      cond,
      target,
      description,
    };
  };
}

type PropsExtractorTransition<TC extends object = object, TA = any> = {
  source: string;
  always: SingleOrArray<Transition>;
  options?: Omit<Options<TA, TC>, 'overflow' | 'datas'>;
  __keys: string[];
};

export function extractTransitions<TC extends object = object, TA = any>({
  source,
  always,
  options,
  __keys,
}: PropsExtractorTransition<TC, TA>) {
  const functions: TransitionDefinition<TC, TA>[] = [];
  const extractor = extractFunction(source, __keys, options);
  if (Array.isArray(always)) {
    functions.push(...always.map(extractor));
  } else {
    functions.push(extractor(always));
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
