import { createMachine } from './createMachine';
import { testMachine } from './testMachine';
import { FINAL_TARGET } from './types';

const machine1 = createMachine(
  {
    tsTypes: {
      context: {} as { val: string },
      // data: {} as boolean,
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
    // data: () => true,
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

const machine2 = createMachine(
  {
    tsTypes: {
      context: {} as { val: number },
      args: 1 as number,
      // data: {} as boolean,
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
    // data: () => true,
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

describe('Machine1', () => {
  testMachine({
    machine: machine1,
    tests: [
      {
        enteredStates: ['idle', 'prom'],
      },

      {
        expected: { val: 'true' },
      },
      {
        // args: 3,
        expected: { val: 'true' },
        enteredStates: ['idle', 'prom'],
      },
    ],
  });
});

describe('Machine2', () => {
  testMachine({
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
