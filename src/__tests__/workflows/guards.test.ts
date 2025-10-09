import { describe, expect, test } from 'vitest';
import { interpret } from '../../interpreter';
import { createLogic } from '../../Machine';

describe('Guards: and/or logic', () => {
  type Context = {
    value: number;
    flag: boolean;
  };

  type Events = {
    increment: number;
  };

  describe('#0: Simple string guard', () => {
    const machine = createLogic(
      {
        initial: 'idle',
        data: 'defaultData',
        states: {
          idle: {
            always: [
              {
                cond: 'isPositive',
                target: 'positive',
              },
              'negative',
            ],
          },
          positive: {
            data: 'positive',
          },
          negative: {
            data: 'negative',
          },
        },
      },
      {
        context: {} as Context,
        events: {} as Events | null,
        data: {} as string,
      },
    ).provideOptions({
      guards: {
        isPositive: ctx => ctx.value > 0,
      },
      datas: {
        defaultData: ctx => `default-${ctx.value}`,
        positive: () => 'positive',
        negative: () => 'negative',
      },
    });

    test('value=10 (positive) => positive', () => {
      const func = interpret(machine, {
        context: { value: 10, flag: false },
      });
      expect(func()).toBe('positive');
    });

    test('value=-5 (negative) => negative', () => {
      const func = interpret(machine, {
        context: { value: -5, flag: false },
      });
      expect(func()).toBe('negative');
    });

    test('value=0 (zero) => negative', () => {
      const func = interpret(machine, {
        context: { value: 0, flag: false },
      });
      expect(func()).toBe('negative');
    });
  });

  describe('#1: Simple AND guards', () => {
    const machine = createLogic(
      {
        initial: 'idle',
        data: 'defaultData',
        states: {
          idle: {
            always: [
              {
                cond: {
                  and: ['isPositive', 'isEven'],
                },
                target: 'positiveEven',
              },
              {
                cond: {
                  and: ['isPositive', 'isOdd'],
                },
                target: 'positiveOdd',
              },
              'negative',
            ],
          },
          positiveEven: {
            data: 'positiveEven',
          },
          positiveOdd: {
            data: 'positiveOdd',
          },
          negative: {
            data: 'negative',
          },
        },
      },
      {
        context: {} as Context,
        events: {} as Events | null,
        data: {} as string,
      },
    ).provideOptions({
      guards: {
        isPositive: ctx => ctx.value > 0,
        isEven: ctx => ctx.value % 2 === 0,
        isOdd: ctx => ctx.value % 2 !== 0,
      },
      datas: {
        defaultData: ctx => `default-${ctx.value}`,
        positiveEven: () => 'positiveEven',
        positiveOdd: () => 'positiveOdd',
        negative: () => 'negative',
      },
    });

    test('value=4 (positive and even) => positiveEven', () => {
      const func = interpret(machine, {
        context: { value: 4, flag: true },
      });
      expect(func()).toBe('positiveEven');
    });

    test('value=5 (positive and odd) => positiveOdd', () => {
      const func = interpret(machine, {
        context: { value: 5, flag: true },
      });
      expect(func()).toBe('positiveOdd');
    });

    test('value=-2 (negative) => negative', () => {
      const func = interpret(machine, {
        context: { value: -2, flag: true },
      });
      expect(func()).toBe('negative');
    });

    test('value=0 (zero) => negative', () => {
      const func = interpret(machine, {
        context: { value: 0, flag: true },
      });
      expect(func()).toBe('negative');
    });
  });

  describe('#2: Simple OR guards', () => {
    const machine = createLogic(
      {
        initial: 'idle',
        data: 'defaultData',
        states: {
          idle: {
            always: [
              {
                cond: {
                  or: ['isLarge', 'isFlagged'],
                },
                target: 'approved',
              },
              'rejected',
            ],
          },
          approved: {
            data: 'approved',
          },
          rejected: {
            data: 'rejected',
          },
        },
      },
      {
        context: {} as Context,
        events: {} as Events | null,
        data: {} as string,
      },
    ).provideOptions({
      guards: {
        isLarge: ctx => ctx.value > 100,
        isFlagged: ctx => ctx.flag === true,
      },
      datas: {
        defaultData: ctx => `default-${ctx.value}`,
        approved: () => 'approved',
        rejected: () => 'rejected',
      },
    });

    test('value=150, flag=false (large) => approved', () => {
      const func = interpret(machine, {
        context: { value: 150, flag: false },
      });
      expect(func()).toBe('approved');
    });

    test('value=50, flag=true (flagged) => approved', () => {
      const func = interpret(machine, {
        context: { value: 50, flag: true },
      });
      expect(func()).toBe('approved');
    });

    test('value=200, flag=true (both) => approved', () => {
      const func = interpret(machine, {
        context: { value: 200, flag: true },
      });
      expect(func()).toBe('approved');
    });

    test('value=50, flag=false (neither) => rejected', () => {
      const func = interpret(machine, {
        context: { value: 50, flag: false },
      });
      expect(func()).toBe('rejected');
    });
  });

  describe('#3: Nested AND/OR guards', () => {
    const machine = createLogic(
      {
        initial: 'idle',
        data: 'defaultData',
        states: {
          idle: {
            always: [
              {
                cond: {
                  and: [
                    'isPositive',
                    {
                      or: ['isEven', 'isFlagged'],
                    },
                  ],
                },
                target: 'complex',
              },
              'simple',
            ],
          },
          complex: {
            data: 'complex',
          },
          simple: {
            data: 'simple',
          },
        },
      },
      {
        context: {} as Context,
        events: {} as Events | null,
        data: {} as string,
      },
    ).provideOptions({
      guards: {
        isPositive: ctx => ctx.value > 0,
        isEven: ctx => ctx.value % 2 === 0,
        isFlagged: ctx => ctx.flag === true,
      },
      datas: {
        defaultData: ctx => `default-${ctx.value}`,
        complex: () => 'complex',
        simple: () => 'simple',
      },
    });

    test('value=4, flag=false (positive AND even) => complex', () => {
      const func = interpret(machine, {
        context: { value: 4, flag: false },
      });
      expect(func()).toBe('complex');
    });

    test('value=5, flag=true (positive AND flagged) => complex', () => {
      const func = interpret(machine, {
        context: { value: 5, flag: true },
      });
      expect(func()).toBe('complex');
    });

    test('value=5, flag=false (positive but odd and not flagged) => simple', () => {
      const func = interpret(machine, {
        context: { value: 5, flag: false },
      });
      expect(func()).toBe('simple');
    });

    test('value=-4, flag=true (negative) => simple', () => {
      const func = interpret(machine, {
        context: { value: -4, flag: true },
      });
      expect(func()).toBe('simple');
    });
  });

  describe('#4: Array of guards (AND)', () => {
    const machine = createLogic(
      {
        initial: 'idle',
        data: 'defaultData',
        states: {
          idle: {
            always: [
              {
                cond: ['isPositive', 'isEven', 'isSmall'],
                target: 'validated',
              },
              'rejected',
            ],
          },
          validated: {
            data: 'validated',
          },
          rejected: {
            data: 'rejected',
          },
        },
      },
      {
        context: {} as Context,
        events: {} as Events | null,
        data: {} as string,
      },
    ).provideOptions({
      guards: {
        isPositive: ctx => ctx.value > 0,
        isEven: ctx => ctx.value % 2 === 0,
        isSmall: ctx => ctx.value < 10,
      },
      datas: {
        defaultData: ctx => `default-${ctx.value}`,
        validated: () => 'validated',
        rejected: () => 'rejected',
      },
    });

    test('value=4 (positive, even, small) => validated', () => {
      const func = interpret(machine, {
        context: { value: 4, flag: false },
      });
      expect(func()).toBe('validated');
    });

    test('value=2 (positive, even, small) => validated', () => {
      const func = interpret(machine, {
        context: { value: 2, flag: false },
      });
      expect(func()).toBe('validated');
    });

    test('value=12 (positive, even, NOT small) => rejected', () => {
      const func = interpret(machine, {
        context: { value: 12, flag: false },
      });
      expect(func()).toBe('rejected');
    });

    test('value=5 (positive, NOT even, small) => rejected', () => {
      const func = interpret(machine, {
        context: { value: 5, flag: false },
      });
      expect(func()).toBe('rejected');
    });
  });

  describe('#4b: Array with nested AND/OR guards', () => {
    const machine = createLogic(
      {
        initial: 'idle',
        data: 'defaultData',
        states: {
          idle: {
            always: [
              {
                cond: [
                  'isPositive',
                  {
                    and: ['isEven', 'isSmall'],
                  },
                ],
                target: 'validated',
              },
              'rejected',
            ],
          },
          validated: {
            data: 'validated',
          },
          rejected: {
            data: 'rejected',
          },
        },
      },
      {
        context: {} as Context,
        events: {} as Events | null,
        data: {} as string,
      },
    ).provideOptions({
      guards: {
        isPositive: ctx => ctx.value > 0,
        isEven: ctx => ctx.value % 2 === 0,
        isSmall: ctx => ctx.value < 10,
      },
      datas: {
        defaultData: ctx => `default-${ctx.value}`,
        validated: () => 'validated',
        rejected: () => 'rejected',
      },
    });

    test('value=4 (positive AND (even AND small)) => validated', () => {
      const func = interpret(machine, {
        context: { value: 4, flag: false },
      });
      expect(func()).toBe('validated');
    });

    test('value=12 (positive AND even but NOT small) => rejected', () => {
      const func = interpret(machine, {
        context: { value: 12, flag: false },
      });
      expect(func()).toBe('rejected');
    });

    test('value=-4 (NOT positive) => rejected', () => {
      const func = interpret(machine, {
        context: { value: -4, flag: false },
      });
      expect(func()).toBe('rejected');
    });
  });

  describe('#4c: Array with nested OR guards', () => {
    const machine = createLogic(
      {
        initial: 'idle',
        data: 'defaultData',
        states: {
          idle: {
            always: [
              {
                cond: [
                  'isPositive',
                  {
                    or: ['isLarge', 'isFlagged'],
                  },
                ],
                target: 'special',
              },
              'normal',
            ],
          },
          special: {
            data: 'special',
          },
          normal: {
            data: 'normal',
          },
        },
      },
      {
        context: {} as Context,
        events: {} as Events | null,
        data: {} as string,
      },
    ).provideOptions({
      guards: {
        isPositive: ctx => ctx.value > 0,
        isLarge: ctx => ctx.value > 100,
        isFlagged: ctx => ctx.flag === true,
      },
      datas: {
        defaultData: ctx => `default-${ctx.value}`,
        special: () => 'special',
        normal: () => 'normal',
      },
    });

    test('value=150, flag=false (positive AND large) => special', () => {
      const func = interpret(machine, {
        context: { value: 150, flag: false },
      });
      expect(func()).toBe('special');
    });

    test('value=50, flag=true (positive AND flagged) => special', () => {
      const func = interpret(machine, {
        context: { value: 50, flag: true },
      });
      expect(func()).toBe('special');
    });

    test('value=50, flag=false (positive but neither large nor flagged) => normal', () => {
      const func = interpret(machine, {
        context: { value: 50, flag: false },
      });
      expect(func()).toBe('normal');
    });

    test('value=-50, flag=true (NOT positive) => normal', () => {
      const func = interpret(machine, {
        context: { value: -50, flag: true },
      });
      expect(func()).toBe('normal');
    });
  });

  describe('#5: Complex nested guards', () => {
    const machine = createLogic(
      {
        initial: 'idle',
        data: 'defaultData',
        states: {
          idle: {
            always: [
              {
                cond: {
                  or: [
                    {
                      and: ['isPositive', 'isEven'],
                    },
                    {
                      and: ['isNegative', 'isFlagged'],
                    },
                  ],
                },
                target: 'approved',
              },
              'rejected',
            ],
          },
          approved: {
            data: 'approved',
          },
          rejected: {
            data: 'rejected',
          },
        },
      },
      {
        context: {} as Context,
        events: {} as Events | null,
        data: {} as string,
      },
    ).provideOptions({
      guards: {
        isPositive: ctx => ctx.value > 0,
        isNegative: ctx => ctx.value < 0,
        isEven: ctx => ctx.value % 2 === 0,
        isFlagged: ctx => ctx.flag === true,
      },
      datas: {
        defaultData: ctx => `default-${ctx.value}`,
        approved: () => 'approved',
        rejected: () => 'rejected',
      },
    });

    test('value=4, flag=false (positive AND even) => approved', () => {
      const func = interpret(machine, {
        context: { value: 4, flag: false },
      });
      expect(func()).toBe('approved');
    });

    test('value=-3, flag=true (negative AND flagged) => approved', () => {
      const func = interpret(machine, {
        context: { value: -3, flag: true },
      });
      expect(func()).toBe('approved');
    });

    test('value=5, flag=false (positive but odd) => rejected', () => {
      const func = interpret(machine, {
        context: { value: 5, flag: false },
      });
      expect(func()).toBe('rejected');
    });

    test('value=-3, flag=false (negative but not flagged) => rejected', () => {
      const func = interpret(machine, {
        context: { value: -3, flag: false },
      });
      expect(func()).toBe('rejected');
    });
  });
});
