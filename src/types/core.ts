export type SingleOrArray<T = any> = T | readonly T[];

export type UnionToIntersection<U> = (
  U extends any ? (x: U) => void : never
) extends (x: infer I) => void
  ? I
  : never;

export type RecordFunctions<
  K,
  TC extends object = object,
  TA = any,
  R = void,
> = K extends string ? Record<K, StateFunction<TC, TA, R>> : never;

export type SoA<T = any> = SingleOrArray<T>;
export type Undy<T> = T extends null ? Exclude<T, null> | undefined : T;

export type StateFunction<TC = any, TA = any, R = void> = (
  context: TC,
  events: Undy<TA>,
) => R;

export type SAS = SingleOrArray<string>;

export type Param<T> = T extends null ? [Exclude<T, null>?] : [T];
