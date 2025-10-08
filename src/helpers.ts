import type {
  Config,
  FinalState,
  FinalStateDefinition,
  PromiseState,
  PromiseStateDefinition,
  SimpleStateDefinition,
  StateDefinition,
} from './types';

//ignore coverage
export const voidNothing = () => void 0;
export const returnTrue = () => true;
//ignore coverage
export const return0 = () => 0;
export const identity = <T>(value: T) => value;

export function isReadonlyArray(array: any): array is ReadonlyArray<any> {
  return Array.isArray(array);
}

export function isFinalState(value: any): value is FinalState {
  return 'data' in value && typeof value.data === 'string';
}

export function isPromiseState(value: any): value is PromiseState {
  const check3 = 'invoke' in value;
  return check3;
}

export function isFinalStateDefinition<TA = any, TC = any, R = any>(
  value: StateDefinition<TA, TC, R>,
): value is FinalStateDefinition<TA, TC, R> {
  return 'data' in value;
}

export function isPromiseStateDefinition<TA = any, TC = any>(
  value: StateDefinition<TA, TC>,
): value is PromiseStateDefinition<TA, TC, any> {
  const check1 = 'invoke' in value;
  return check1;
}

export function isAsync<const C extends Config>(config: C) {
  const values = Object.values(config.states);
  return values.some(isPromiseState);
}

export function isSimpleStateDefinition<TA = any, TC = any>(
  value: StateDefinition<TA, TC>,
): value is SimpleStateDefinition<TA, TC> {
  return 'exit' in value;
}
