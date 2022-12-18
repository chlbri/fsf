import { describe, expect, test } from 'vitest';
import createFunction from './createFunction';
import { interpret } from './interpret';

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

describe('#5: Cannot transit to himself', () => {
  test('String', () => {
    const machine = () =>
      createFunction({
        schema: {
          context: {} as { val: number },
          args: {} as number,
          data: {} as number,
        },
        context: { val: 4 },
        initial: 'idle',
        states: {
          idle: {
            always: 'idle',
          },
        },
      });
    expect(machine).toThrowError('Cannot transit to himself : idle');
  });
  test('Object', () => {
    const machine = () =>
      createFunction({
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
              target: 'idle',
            },
          },
        },
      });
    expect(machine).toThrowError('Cannot transit to himself : idle');
  });
});
