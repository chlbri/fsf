import { createLogic } from '../Machine';
import { interpret } from '../interpreter';

describe('Errors', () => {
  test('#01: Overflow transitions', () => {
    const machine = createLogic(
      {
        initial: 'idle',
        __tsSchema: {} as {
          initial: 'idle';
          states: 'idle' | 'calc' | 'final';
        },
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
      },
      {} as {
        context: { val?: number };
        events: number;
        data: number;
        // promises: {};
      },
    );
    const func = () => interpret(machine, { overflow: 1 })(3);

    expect(func).toThrowError('Overflow transitions');
  });

  describe('#02: Tansition state is not defined', () => {
    test('#01 => string', () => {
      const machine = () =>
        createLogic(
          {
            initial: 'idle',
            states: {
              idle: {
                always: {
                  target: 'calc',
                },
              },
              calc: {
                always: 'notDefined',
              },
            },
          },
          {} as {
            context: { val: number };
            events: number;
            data: number;
            // promises: {};
          },
        ).safe;
      expect(machine).toThrowError('State "notDefined" is not defined');
    });

    test('#02 => object', () => {
      const machine = () =>
        createLogic(
          {
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
            },
          },
          {} as {
            context: { val: number };
            events: number;
            data: number;
            // promises: {};
          },
        ).safe;
      expect(machine).toThrowError('State "final" is not defined');
    });
  });

  test('#03 => No initial state', () => {
    const machine = () =>
      createLogic(
        {
          states: {
            idle: {
              always: 'any',
            },
            any: {
              data: 'any',
            },
          },
        } as any,
        {} as any,
      ).safe;
    expect(machine).toThrowError('No initial state');
  });

  test('#4: No states', () => {
    const machine = () =>
      createLogic(
        {
          context: { val: 4 },
          initial: 'idle',
          states: {},
        },
        {} as any,
      ).safe;
    expect(machine).toThrowError('No states');
  });

  describe('#5: Cannot transit to himself', () => {
    test('String', () => {
      const machine = () =>
        createLogic(
          {
            context: { val: 4 },
            initial: 'idle',
            states: {
              idle: {
                always: 'idle',
              },
            },
          },
          {} as any,
        ).safe;
      expect(machine).toThrowError('Cannot transit to himself : idle');
    });
    test('Object', () => {
      const machine = () =>
        createLogic(
          {
            context: { val: 4 },
            initial: 'idle',
            states: {
              idle: {
                always: {
                  target: 'idle',
                },
              },
            },
          },
          {} as any,
        ).safe;
      expect(machine).toThrowError('Cannot transit to himself : idle');
    });
  });

  describe('#6: Strict errors', () => {
    test('#1: transition actions string', () => {
      const machine = () =>
        createLogic(
          {
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
          {} as any,
        ).safe;
      expect(machine).toThrowError('Action action is not provided');
    });

    test('#2: transition actions array', () => {
      const machine = () =>
        createLogic(
          {
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
          {} as any,
        ).safe;
      expect(machine).toThrowError('Action action is not provided');
    });

    test('#3: No guards provided', () => {
      const machine = () =>
        createLogic(
          {
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
          {} as any,
        ).safe;
      expect(machine).toThrowError('No guards provided');
    });

    test('#4: transition guards string', () => {
      const machine = () =>
        createLogic(
          {
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
          {} as any,
        ).provideOptions({ guards: {} }).safe;
      expect(machine).toThrowError('Guard "cond" is not provided');
    });
  });

  describe('#7: explicit returns, (tidious guards), try to modify freezedArgs returns errors', () => {
    const machine = createLogic(
      {
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
              actions: ['action'],
            },
          },
          final: {
            data: 'val',
          },
        },
      },
      {
        events: {} as { val: number } | null,
        context: {} as { val: number },
        data: {} as number,
      },
    ).provideOptions({
      actions: {
        action: (ctx, arg = { val: 3 }) => {
          ctx.val = ctx.val + arg.val;
          arg.val = 200;
        },
      },
    });
    const func = interpret(machine);
    test('#2: 10 => 14', () => {
      const arg = { val: 10 };
      const safe = () => func(arg);
      expect(safe).toThrowError(
        `Cannot assign to read only property 'val' of object '#<Object>'`,
      );
    });
  });
});
