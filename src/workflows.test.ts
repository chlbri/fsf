import { describe, expect, test } from 'vitest';
import createFunction from './createFunction';
import { interpret } from './interpret';

describe('#1: explicit returns, (tidious guards)', () => {
  const machine = createFunction(
    {
      schema: {
        context: {} as { val: number },
        events: {} as number,
        data: {} as number,
      },
      context: { val: 4 },
      initial: 'idle',
      states: {
        idle: {
          always: {
            target: 'calc',
            cond: {
              or: [
                'tidious',
                {
                  and: ['tidious', { and: 'tidious' }, { or: 'tidious' }],
                },
              ],
            },
          },
        },
        calc: {
          always: [
            {
              target: 'final',
              actions: ['action'],
              cond: ['tidious', { or: ['tidious', 'tidious'] }],
            },
          ],
        },
        final: {
          data: 'val',
        },
      },
    },
    {
      actions: {
        action: (ctx, arg) => {
          ctx.val = ctx.val + arg;
        },
      },
      guards: {},
      datas: {
        val: ctx => ctx.val,
      },
    },
  );
  const func = interpret(machine);

  test('#1: 3 => 7', () => {
    expect(func(3)).toEqual(7);
  });

  test('#2: 10 => 14', () => {
    expect(func(10)).toEqual(14);
  });
});

describe('#2: no explicit returns, (tidious actions)', () => {
  const func = createFunction(
    {
      schema: {
        context: {} as { val: number },
        events: {} as number,
      },
      context: { val: 4 },
      initial: 'idle',
      states: {
        idle: {
          always: {
            target: 'calc',
          },
        },
        calc: {
          entry: 'tidious',
          always: {
            target: 'final',
            actions: ['action'],
          },
          exit: 'tidious',
        },
        final: {
          data: 'val',
        },
      },
    },
    {
      actions: {
        action: (ctx, arg) => {
          ctx.val = ctx.val + arg;
        },
      },
    },
  ).build;

  test('#1: 3 => 7', () => {
    expect(func(3)).toEqual({ val: 7 });
  });

  test('#2: 10 => 14', () => {
    expect(func(10)).toEqual({ val: 14 });
  });
});

describe('#3: With guards and entry', () => {
  const machine = createFunction(
    {
      schema: {
        context: {} as { val: number },
        events: {} as number,
      },
      context: { val: 4 },
      initial: 'idle',
      states: {
        idle: {
          always: 'check',
        },
        check: {
          always: [
            {
              cond: 'cond',
              target: 'calc',
            },
            'final',
          ],
        },
        calc: {
          always: [
            {
              cond: 'tidious',
              target: 'final',
              actions: ['action'],
            },
          ],
        },
        final: {
          entry: 'add1',
          data: 'val',
        },
      },
    },
    {
      actions: {
        action: (ctx, arg) => {
          ctx.val = ctx.val + arg;
        },
        add1: ctx => {
          ctx.val = ctx.val + 1;
        },
      },
      guards: {
        cond: (_, arg) => arg > 7,
      },
    },
  );

  const func = interpret(machine);

  test('#1: 3 => 7', () => {
    expect(func(3)).toEqual({ val: 5 });
  });

  test('#2: 10 => 14', () => {
    expect(func(10)).toEqual({ val: 15 });
  });
});

describe('#4: Complex, https query builder', () => {
  type Context = {
    apiKey?: string;
    apiUrl?: string;
    url?: string;
  };

  type Events = { products?: string[]; categories?: string[] };

  const queryMachine = createFunction(
    {
      schema: {
        context: {} as Context,
        events: {} as Events,
        data: {} as string,
      },
      context: {},
      initial: 'preferences',
      states: {
        preferences: {
          always: {
            actions: ['setUrl', 'setApiKey', 'startUrl'],
            target: 'categories',
          },
        },
        categories: {
          always: [
            {
              cond: 'hasCategories',
              target: 'products',
              actions: 'setCategories',
            },
            'products',
          ],
        },
        products: {
          always: [
            {
              cond: 'hasProducts',
              target: 'final',
              actions: 'setProducts',
            },
            'final',
          ],
        },
        final: {
          data: 'query',
        },
      },
    },
    {
      strict: true,
      actions: {
        setApiKey: ctx => {
          ctx.apiKey = '123';
        },
        setUrl: ctx => {
          ctx.apiUrl = 'https://example.com';
        },
        startUrl: ctx => {
          const { apiUrl, apiKey } = ctx;
          ctx.url = `${apiUrl}?apikey=${apiKey}`;
        },
        setCategories: (ctx, { categories }) => {
          const _categories = categories?.join(',');
          ctx.url += `&categories=${_categories}`;
        },
        setProducts: (ctx, { products }) => {
          const _products = products?.join(',');
          ctx.url += `&products=${_products}`;
        },
      },
      guards: {
        hasCategories: (_, { categories }) =>
          !!categories && categories.length > 0,
        hasProducts: (_, { products }) =>
          !!products && products.length > 0,
      },
      datas: {
        query: ctx => ctx.url,
      },
    },
  );

  const func = interpret(queryMachine);

  test('#1: no args', () => {
    expect(func()).toBe('https://example.com?apikey=123');
  });

  test('#2: categories', () => {
    expect(func({ categories: ['a', 'b'] })).toBe(
      'https://example.com?apikey=123&categories=a,b',
    );
  });

  test('#3: products', () => {
    expect(func({ products: ['a', 'b'] })).toBe(
      'https://example.com?apikey=123&products=a,b',
    );
  });

  test('#4: categories and products', () => {
    expect(func({ products: ['a', 'b'], categories: ['c', 'd'] })).toBe(
      'https://example.com?apikey=123&categories=c,d&products=a,b',
    );
  });
});
