import type { GuardDefs, GuardDefUnion } from '@bemedev/x-guard';
import { Guards, GuardUnion, Options } from '../types';
import { returnTrue } from './functions';

function assignGuardsUnion<TA = any, TC extends object = object, R = any>(
  values: GuardUnion[],
  guards: Required<Options<TA, TC, R>>['guards'],
  strict = false,
): GuardDefUnion<TA, TC>[] {
  return values.reduce((acc: GuardDefUnion<TA, TC>[], value) => {
    if (typeof value === 'string') {
      const guard = guards[value];
      acc.push(guard);
    } else {
      const _guards = assignGuards(value, guards, strict);
      acc.push(_guards as any);
    }
    return acc;
  }, []);
}

export function assignGuards<
  TA = any,
  TC extends object = object,
  R = any,
>(
  values?: Guards,
  guards?: Options<TA, TC, R>['guards'],
  strict = false,
): GuardDefs<TA, TC> {
  if (!values) return returnTrue;
  if (!guards) {
    if (strict) throw new Error('No guards provided');
    return returnTrue;
  }
  if (typeof values === 'string') {
    const guard = guards[values];
    if (!guard) {
      if (strict) throw new Error(`Guard "${values}" is not provided`);
      return returnTrue;
    }
    return guard;
  }
  if ('and' in values) {
    const _and = values.and;
    if (Array.isArray(_and)) {
      const and = assignGuardsUnion(_and, guards, strict);
      return { and };
    } else {
      const and = assignGuardsUnion([_and], guards, strict);
      return { and };
    }
  }
  if ('or' in values) {
    const _or = values.or;
    if (Array.isArray(_or)) {
      const or = assignGuardsUnion(_or, guards, strict);
      return { or };
    } else {
      const or = assignGuardsUnion([_or], guards, strict);
      return { or };
    }
  }
  return assignGuardsUnion(values, guards, strict);
}
