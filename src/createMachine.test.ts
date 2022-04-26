import { createMachine } from './createMachine';
import { serve } from './serve';
import { testMachine } from './testMachine';
import { FINAL_TARGET } from './types';

const machine = createMachine(
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

const c = serve(machine);
c();

describe('Machine', () => {
  testMachine({
    machine,
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
