import { interpret } from '../../interpreter';
import { createLogic } from '../../Machine';
import { createTests } from '@bemedev/vitest-extended';

describe('Explicit returns, (tidious guards)', () => {
  const machine = createLogic(
    {
      context: { val: 4 },
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
      // action: (ctx: { val: number }, arg = { val: 3 }) => {
      //   ctx.val = ctx.val + arg.val;
      //   arg.val = 200;
      // },
      action: (ctx, arg = { val: 3 }) => {
        ctx.val = ctx.val + arg.val;
        arg.val = 200;
      },
    },
    guards: {},
    datas: {
      defaultData: ctx => ctx.val,
      val: ctx => ctx.val,
    },
    unFreezeArgs: true,
  });

  const func = interpret(machine, { context: { val: 4 } });

  const { acceptation, success } = createTests(func);

  describe('#00 => Acceptation', acceptation);

  describe(
    '#01 => Success',
    success(
      {
        invite: '"none" => 3',
        expected: 7,
      },
      {
        invite: '3 => 7',
        expected: 7,
        parameters: { val: 3 },
      },
      {
        invite: '10 => 14',
        expected: 14,
        parameters: { val: 10 },
      },
    ),
  );
});
