import {
  FinalState,
  FinalStateDefinition,
  StateDefinition,
} from './types';

//ignore coverage
export const voidNothing = () => void 0;
export const returnTrue = () => true;
//ignore coverage
export const return0 = () => 0;
export const identity = <T>(value: T) => value;

export function deepClone<T = any>(obj: T, hash = new WeakMap()): T {
  if (Object(obj) !== obj) return obj; // primitives
  const _obj = obj as any;
  if (hash.has(_obj)) return hash.get(_obj); // cyclic reference
  const result =
    _obj instanceof Set
      ? new Set(_obj) // See note about this!
      : _obj instanceof Map
      ? new Map(
          Array.from(_obj, ([key, val]) => [key, deepClone(val, hash)]),
        )
      : _obj instanceof Date
      ? new Date(_obj)
      : _obj instanceof RegExp
      ? new RegExp(_obj.source, _obj.flags)
      : // ... add here any specific treatment for other classes ...
      // and finally a catch-all:
      _obj.constructor
      ? _obj.constructor()
      : Object.create(null);
  hash.set(_obj, result);
  return Object.assign(
    result,
    ...Object.keys(_obj).map(key => ({
      [key]: deepClone(_obj[key], hash),
    })),
  );
}

export function isFinalState(value: any): value is FinalState {
  return 'data' in value && typeof value.data === 'string';
}

export function isFinalStateDefinition<TA = any, TC = any, R = any>(
  value: StateDefinition<TA, TC, R>,
): value is FinalStateDefinition<TA, TC, R> {
  return 'data' in value && typeof value.data === 'function';
}
