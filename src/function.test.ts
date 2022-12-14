import { describe } from 'vitest';
import { FINAL_TARGET } from '../src/constants';
import { createFunction } from '../src/createFunction';
import { ttest } from '../src/testFunction';

describe('machine2', () => {
  const machine2 = createFunction(
    {
      schema: {
        context: {} as { val: number },
        args: 1 as number,
      },
      context: { val: 4 },
      initial: 'idle',
      states: {
        idle: {
          transitions: {
            target: 'calc',
          },
        },
        calc: {
          transitions: [
            {
              target: FINAL_TARGET,
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

  ttest({
    machine: machine2,
    tests: [
      {
        invite: '#1',
        args: 3,
        enteredStates: ['idle', 'calc'],
      },

      {
        invite: '#2',
        args: 6,
        expected: { val: 10 },
      },
      {
        invite: '#3',
        args: 3,
        expected: { val: 7 },
        enteredStates: ['idle', 'calc'],
      },
      {
        invite: '#4',
        args: 10,
        expected: { val: 14 },
        enteredStates: ['idle', 'calc'],
      },
    ],
  });
});
