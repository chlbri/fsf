import { FINAL_TARGET } from '../src/constants';
import { createFunction } from '../src/createFunction';
import { ttest } from '../src/testFunction';

describe('machine1', () => {
  const machine1 = createFunction(
    {
      schema: {
        context: {} as { val: string },
      },
      context: { val: '' },
      initial: 'idle',
      states: {
        idle: {
          type: 'sync',
          transitions: [
            {
              target: 'prom',
            },
          ],
        },
        prom: {
          type: 'async',
          promise: 'prom',
          onDone: [
            {
              target: FINAL_TARGET,
              actions: ['ok'],
            },
          ],
          onError: [],
          timeout: '0',
        },
      },
    },
    {
      promises: {
        prom: async () => true,
      },
      actions: {
        ok: ctx => {
          ctx.val = 'true';
        },
      },
    },
  );

  ttest({
    machine: machine1,
    tests: [
      {
        enteredStates: ['idle', 'prom'],
      },
      {
        expected: { val: 'true' },
      },
      {
        expected: { val: 'true' },
        enteredStates: ['idle', 'prom'],
      },
    ],
  });
});

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
          type: 'sync',
          transitions: [
            {
              target: 'calc',
            },
          ],
        },
        calc: {
          type: 'sync',
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
          console.log('arg', arg);
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
