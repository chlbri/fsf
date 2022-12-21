import { describe, expect, test } from 'vitest';
import { deepClone } from './helpers';

function expectPrimitive(actual: unknown) {
  const expected = deepClone(actual);
  expect(actual).toBe(expected);
}

function expectObject(actual: {
  product: string;
  complex: { nested: string };
}) {
  const expected = deepClone(actual);
  expect(actual).not.toBe(expected);
  expect(actual).toEqual(expected);
  actual.product = actual.product + '!';
  expect(actual).not.toEqual(expected);
  actual.product = expected.product;
  expect(actual).toEqual(expected);

  // Nested
  actual.complex.nested = expected.complex.nested + '!';
  expect(actual).not.toEqual(expected);
}

describe('Primitives', () => {
  describe('Numbers', () => {
    test('1', () => {
      expectPrimitive(1);
    });
    test('77', () => {
      expectPrimitive(77);
    });
  });
  describe('Booleans', () => {
    test('true', () => {
      expectPrimitive(true);
    });

    test('false', () => {
      expectPrimitive(false);
    });
  });
});

describe('Complex', () => {
  test('#1', () => {
    expectObject({ product: 'vitest', complex: { nested: 'vitest' } });
  });

  test('#2', () => {
    expectObject({ product: 'jest', complex: { nested: 'jest' } });
  });
});
