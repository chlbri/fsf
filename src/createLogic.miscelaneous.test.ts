/* eslint-disable @typescript-eslint/no-unused-vars */
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
          target: 'calculation',
        },
        'final',
      ],
    },
    glue: {
      invoke: [],
    },
    calculation: {
      entry: ['add3'],
      always: {
        cond: 'tidious',
        target: 'final',
        actions: ['action'],
      },
    },
    final: {
      entry: ['add1'],
      data: 'val',
    },
  },
});

const machine = createLogic(config);
// #endregion

test('Config', () => {
  expect(machine.__config).toEqual(config);
});

test('Options', () => {
  expect(machine.__options).toEqual({ async: true });
});
