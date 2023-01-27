import { describe, expect, test } from 'vitest';
import { createLogic, interpret } from '../lib';

describe('#1: explicit returns, (tidious guards)', () => {
  const machine = createLogic(
    {
      schema: {
        events: {} as { val: number } | null,
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
        action: (ctx, arg = { val: 3 }) => {
          ctx.val = ctx.val + arg.val;
          arg.val = 200;
        },
      },
      guards: {},
      datas: {
        val: ctx => ctx.val,
      },
      unFreezeArgs: true,
    },
  );
  const func = interpret(machine);
  test('#1: 3 => 7', () => {
    expect(func()).toEqual(7);
  });

  test('#2: 10 => 14', () => {
    const arg = { val: 10 };
    expect(func(arg)).toEqual(14);
    expect(arg.val).toEqual(200);
  });
});

describe('#2: explicit returns, (tidious guards), try to modify freezedArgs returns errors', () => {
  const machine = createLogic(
    {
      schema: {
        events: {} as { val: number } | null,
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
        action: (ctx, arg = { val: 3 }) => {
          ctx.val = ctx.val + arg.val;
          arg.val = 200;
        },
      },
      guards: {},
    },
  );
  const func = interpret(machine);
  test('#2: 10 => 14', () => {
    const arg = { val: 10 };
    const safe = () => func(arg);
    expect(safe).not.toThrowError(
      `Cannot assign to read only property 'val' of object '#<Object>'⁠`,
    );
  });
});
