import { describe, expect, test } from 'vitest';
import { createLogic, interpret } from '../lib';

test('#1: Overflow transitions', () => {
  const machine = createLogic({
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
        always: {
          target: 'final',
        },
      },
      final: {
        data: 'any',
      },
    },
  });
  const func = () => interpret(machine, { overflow: 0 })(3);
  expect(func).toThrowError('Overflow transitions');
});

describe('#2: State final is not defined', () => {
  test('String', () => {
    const machine = () =>
      createLogic({
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
      }).safe;
    expect(machine).toThrowError('State final is not defined');
  });

  test('Object', () => {
    const machine = () =>
      createLogic({
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
                cond: 'cond',
                target: 'final',
                actions: ['action'],
              },
            ],
          },
        },
      }).safe;
    expect(machine).toThrowError('State final is not defined');
  });
});

test('#3: No initial state', () => {
  const machine = () =>
    createLogic({
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
    }).safe;
  expect(machine).toThrowError('No initial state');
});

test('#4: No states', () => {
  const machine = () =>
    createLogic({
      schema: {
        context: {} as { val: number },
        events: {} as number,
        data: {} as number,
      },
      context: { val: 4 },
      initial: 'idle',
      states: {},
    }).safe;
  expect(machine).toThrowError('No states');
});

describe('#5: Cannot transit to himself', () => {
  test('String', () => {
    const machine = () =>
      createLogic({
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
      }).safe;
    expect(machine).toThrowError('Cannot transit to himself : idle');
  });
  test('Object', () => {
    const machine = () =>
      createLogic({
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
      }).safe;
    expect(machine).toThrowError('Cannot transit to himself : idle');
  });
});

describe('#6: Strict errors', () => {
  test('#1: transition actions string', () => {
    const machine = () =>
      createLogic({
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
      }).safe;
    expect(machine).toThrowError('Action action is not provided');
  });

  test('#2: transition actions array', () => {
    const machine = () =>
      createLogic({
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
      }).safe;
    expect(machine).toThrowError('Action action is not provided');
  });

  test('#3: No guards provided', () => {
    const machine = () =>
      createLogic({
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
      }).safe;
    expect(machine).toThrowError('No guards provided');
  });

  test('#4: transition guards string', () => {
    const machine = () =>
      createLogic(
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
        { guards: {} },
      ).safe;
    expect(machine).toThrowError('Guard "cond" is not provided');
  });
});
