import { describe, expect, test } from 'vitest';
import createFunction from './createFunction';
import { interpret } from './interpret';

describe('#1: explicit returns', () => {
  const machine = createFunction(
    {
      schema: {
        context: {} as { val: number },
        args: {} as number,
        data: {} as number,
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
          always: [
            {
              target: 'final',
              actions: ['action'],
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
      datas: {
        val: ctx => ctx.val,
      },
    },
  );

  const func = interpret(machine);

  test('Case #1: 3 => 7', () => {
    expect(func(3)).toEqual(7);
  });

  test('Case #2: 10 => 14', () => {
    expect(func(10)).toEqual(14);
  });
});

describe('#2: no explicit returns', () => {
  const machine = createFunction(
    {
      schema: {
        context: {} as { val: number },
        args: {} as number,
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
          always: [
            {
              target: 'final',
              actions: ['action'],
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
    },
  );

  const func = interpret(machine);

  test('Case #1: 3 => 7', () => {
    expect(func(3)).toEqual({ val: 7 });
  });

  test('Case #2: 10 => 14', () => {
    expect(func(10)).toEqual({ val: 14 });
  });
});
