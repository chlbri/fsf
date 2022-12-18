import { expect, test } from 'vitest';
import createFunction from './createFunction';

const config = {
  schema: {
    context: {} as { val: number },
    events: {} as number,
  },
  context: { val: 4 },
  initial: 'idle',
  states: {
    idle: {
      always: 'check',
    },
    check: {
      always: [
        {
          cond: 'cond',
          target: 'calc',
        },
        'final',
      ],
    },
    calc: {
      always: [
        {
          cond: 'tidious',
          target: 'final',
          actions: ['action'],
        },
      ],
    },
    final: {
      entry: 'add1',
      data: 'val',
    },
  },
};

const options = {};
const machine = createFunction(config, options);

test('Config', () => {
  expect(machine.__config).toEqual(config);
});

test('Options', () => {
  expect(machine.__options).toEqual(options);
});
