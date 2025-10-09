import { createLogic } from '../Machine';
import { interpret } from '../interpreter';

describe('Errors', () => {
  test('#01: Overflow transitions', () => {
    const machine = createLogic(
      {
        initial: 'idle',
        data: 'defaultData',
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
          final: {},
        },
      },
      {} as {
        context: { val?: number };
        events: number;
        data: number;
        // promises: {};
      },
    ).provideOptions({
      datas: {
        defaultData: () => 0,
      },
    });
    const func = () => interpret(machine, { overflow: 1 })(3);

    expect(func).toThrowError('Overflow transitions');
  });
  describe('#02: Tansition state is not defined', () => {
    test('#01 => string', () => {
      const machine = () =>
        createLogic(
          {
            initial: 'idle',
            data: 'defaultData',
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
        ).provideOptions({
          datas: {
            defaultData: () => 0,
          },
        }).safe;
      expect(machine).toThrowError('State "notDefined" is not defined');
    });

    test('#02 => object', () => {
      const machine = () =>
        createLogic(
          {
            initial: 'idle',
            data: 'defaultData',
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
        ).provideOptions({
          datas: {
            defaultData: () => 0,
          },
        }).safe;
      expect(machine).toThrowError('State "final" is not defined');
    });
  });

  test('#03 => No initial state', () => {
    const machine = () =>
      createLogic(
        {
          data: 'defaultData',
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
      ).provideOptions({
        datas: {
          defaultData: () => 0,
          any: () => 'any',
        },
      }).safe;
    expect(machine).toThrowError('No initial state');
  });

  test('#4: No states', () => {
    const machine = () =>
      createLogic(
        {
          context: { val: 4 },
          initial: 'idle',
          data: 'defaultData',
          states: {},
        },
        {} as any,
      ).provideOptions({
        datas: {
          defaultData: () => 0,
        },
      }).safe;
    expect(machine).toThrowError('No states');
  });

  describe('#5: Cannot transit to himself', () => {
    test('String', () => {
      const machine = () =>
        createLogic(
          {
            context: { val: 4 },
            initial: 'idle',
            data: 'defaultData',
            states: {
              idle: {
                always: 'idle',
              },
            },
          },
          {} as any,
        ).provideOptions({
          datas: {
            defaultData: () => 0,
          },
        }).safe;
      expect(machine).toThrowError('Cannot transit to himself : idle');
    });
    test('Object', () => {
      const machine = () =>
        createLogic(
          {
            context: { val: 4 },
            initial: 'idle',
            data: 'defaultData',
            states: {
              idle: {
                always: {
                  target: 'idle',
                },
              },
            },
          },
          {} as any,
        ).provideOptions({
          datas: {
            defaultData: () => 0,
          },
        }).safe;
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
            data: 'defaultData',
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
        ).provideOptions({
          datas: {
            defaultData: () => 0,
            any: () => 'any',
          },
        }).safe;
      expect(machine).toThrowError('Action action is not provided');
    });

    test('#2: transition actions array', () => {
      const machine = () =>
        createLogic(
          {
            context: { val: 4 },
            initial: 'idle',
            data: 'defaultData',
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
        ).provideOptions({
          datas: {
            defaultData: () => 0,
            any: () => 'any',
          },
        }).safe;
      expect(machine).toThrowError('Action action is not provided');
    });

    test('#3: No guards provided', () => {
      const machine = () =>
        createLogic(
          {
            context: { val: 4 },
            initial: 'idle',
            data: 'defaultData',
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
        ).provideOptions({
          datas: {
            defaultData: () => 0,
            any: () => 'any',
          },
        }).safe;
      expect(machine).toThrowError('No guards provided');
    });

    test('#4: transition guards string', () => {
      const machine = () =>
        createLogic(
          {
            context: { val: 4 },
            initial: 'idle',
            data: 'defaultData',
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
        ).provideOptions({
          guards: {},
          datas: {
            defaultData: () => 0,
            any: () => 'any',
          },
        }).safe;
      expect(machine).toThrowError('Guard "cond" is not provided');
    });
  });

  describe('#7: explicit returns, (tidious guards), try to modify freezedArgs returns errors', () => {
    const machine = createLogic(
      {
        initial: 'idle',
        data: 'defaultData',
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
      datas: {
        defaultData: ctx => ctx.val,
        val: ctx => ctx.val,
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

  describe('#8: Missing data function', () => {
    test('#1: config.data exists but no corresponding function in datas', () => {
      const machine = () =>
        createLogic(
          {
            initial: 'idle',
            data: 'missingData',
            states: {
              idle: {
                always: 'final',
              },
              final: {
                data: 'finalData',
              },
            },
          },
          {} as any,
        ).provideOptions({
          datas: {
            finalData: () => 'final',
            // missingData is NOT provided
          },
        }).safe;
      expect(machine).toThrowError(
        'At least one data function must be provided',
      );
    });

    test('#2: config.data exists but datas object is empty', () => {
      const machine = () =>
        createLogic(
          {
            initial: 'idle',
            data: 'defaultData',
            states: {
              idle: {
                data: 'result',
              },
            },
          },
          {} as any,
        ).provideOptions({
          datas: {},
        }).safe;
      expect(machine).toThrowError(
        'At least one data function must be provided',
      );
    });

    test('#3: config.data exists but datas is not provided', () => {
      const machine = () =>
        createLogic(
          {
            initial: 'idle',
            data: 'defaultData',
            states: {
              idle: {
                data: 'result',
              },
            },
          },
          {} as any,
        ).safe;
      expect(machine).toThrowError(
        'At least one data function must be provided',
      );
    });
  });
});
