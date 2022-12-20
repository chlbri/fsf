import { describe, expect, test } from 'vitest';
import createFunction from '../lib/createFunction';
import { interpret } from '../lib/interpret';

test('#1: Overflow transitions', () => {
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
          data: 'any',
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

describe('#2: State final is not defined', () => {
  test('String', () => {
    const machine = () =>
      createFunction({
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
            },
          },
          calc: {
            always: 'final',
          },
        },
      });
    expect(machine).toThrowError('State final is not defined');
  });

  test('Object', () => {
    const machine = () =>
      createFunction({
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
      });
    expect(machine).toThrowError('State final is not defined');
  });
});

test('#3: No initial state', () => {
  const machine = () =>
    createFunction({
      schema: {
        context: {} as { val: number },
        events: {} as number,
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
        calc: {
          data: 'val',
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
        events: {} as number,
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
          events: {} as number,
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
          events: {} as number,
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

describe('#6: Strict errors', () => {
  test('#1: transition actions string', () => {
    const machine = () =>
      createFunction(
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
                target: 'any',
                actions: 'action',
              },
            },
            any: {
              data: 'any',
            },
          },
        },
        { strict: true },
      );
    expect(machine).toThrowError('Action action is not provided');
  });

  test('#2: transition actions array', () => {
    const machine = () =>
      createFunction(
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
                target: 'any',
                actions: ['action'],
              },
            },
            any: {
              data: 'any',
            },
          },
        },
        { strict: true },
      );
    expect(machine).toThrowError('Action action is not provided');
  });

  test('#3: No guards provided', () => {
    const machine = () =>
      createFunction(
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
                target: 'any',
                cond: 'cond',
              },
            },
            any: {
              data: 'any',
            },
          },
        },
        { strict: true },
      );
    expect(machine).toThrowError('No guards provided');
  });

  test('#4: transition guards string', () => {
    const machine = () =>
      createFunction(
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
                target: 'any',
                cond: 'cond',
              },
            },
            any: {
              data: 'any',
            },
          },
        },
        { strict: true, guards: {} },
      );
    expect(machine).toThrowError('Guard "cond" is not provided');
  });
});
