import { describe, expect, test } from 'vitest';
import { createLogic } from './createLogic';
import { interpret } from './interpret';

describe('#1: explicit returns, (tidious guards)', () => {
  const machine = createLogic(
    {
      schema: {
        events: {} as number | null,
        context: {} as { val: number },
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
        action: (ctx, arg = 3) => {
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
    expect(func()).toEqual(7);
  });

  test('#2: 10 => 14', () => {
    expect(func(10)).toEqual(14);
  });
});
