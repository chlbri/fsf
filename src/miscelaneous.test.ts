import { expect, test } from 'vitest';
import { createConfig, createLogic } from './createLogic';

// #region Preparation
const config = createConfig({
  schema: {
    context: {} as { val: number },
    events: {} as number,
    data: {} as number,
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
    glue: {
      promises: [],
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
});

const options = {};
const machine = createLogic(config, options);
// #endregion

test('Config', () => {
  expect(machine.__config).toEqual(config);
});

test('Options', () => {
  expect(machine.__options).toEqual({ ...options, async: true });
});
