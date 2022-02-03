import { createMachine } from './createMachine';

describe('Async', () => {
  const machine = createMachine(
    {
      initial: 'idle',
      context: undefined,
      states: {
        idle: {
          // type: 'async',
          transitions: [
            {
              conditions: 'test',
              target: 'next',
            },
          ],
        },
        next: {
          type: 'final',
        },
      },
    },
    {
      conditions: {
        test: () => false,
      },
    },
  );
});

// describe('Sync', () => {

// });
