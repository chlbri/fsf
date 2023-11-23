import { expect, test } from 'vitest';
import { createLogic } from '../lib';
import { createConfig } from './createLogic';

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
  expect(machine.__options).toEqual({ ...options, async: false });
});
