import { describe, expect, test } from 'vitest';
import createFunction from '../src/createFunction';
import { interpret } from './interpret';

describe('#1: errors', () => {
  test('#1: Overflow transitions', () => {
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
        },
      },
      {
        overflow: 0,
      },
    );
    const func = () => interpret(machine)(3);
    expect(func).toThrowError('Overflow transitions');
  });

  test('#2: No state found for ', () => {
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
    const func = () => interpret(machine)(3);
    expect(func).toThrowError('No state found for final');
  });

  test('#3: No initial state', () => {
    const machine = () =>
      createFunction({
        schema: {
          context: {} as { val: number },
          args: {} as number,
          data: {} as number,
        },
        context: { val: 4 },
        initial: 'idle2',
        states: {
          idle: {
            always: {
              target: 'calc',
            },
          },
        },
      });
    expect(machine).toThrowError('No initial state');
  });

  test('#4: No states', () => {
    const machine = () =>
      createFunction({
        schema: {
          context: {} as { val: number },
          args: {} as number,
          data: {} as number,
        },
        context: { val: 4 },
        initial: 'idle',
        states: {},
      });
    expect(machine).toThrowError('No states');
  });
});

describe('#2: Workflows', () => {
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
});
