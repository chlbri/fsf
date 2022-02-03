import { ttest } from '@core_chlbri/test';
import { createMachine } from './createMachine';
import { serve, serve2 } from './serve';

describe('Problems to configure', () => {
  describe('Machine have empty states', () => {
    const func = () =>
      createMachine({
        initial: 'nostate',
        context: undefined,
        states: {},
      });

    ttest({
      func,
      tests: [
        {
          throws: true,
          // thrown: 'No all cases are handled for state "idle"',
        },
        {
          throws: true,
          thrown: 'No states',
        },
      ],
    });
  });

  describe("Machine doesn't have final states", () => {
    const func = () =>
      createMachine({
        initial: 'nostate',
        context: undefined,
        states: {
          state1: {
            transitions: [],
          },
          state2: {
            transitions: [],
          },
        },
      });
    ttest({
      func,
      tests: [
        {
          throws: true,
          // thrown: 'No all cases are handled for state "idle"',
        },
        {
          throws: true,
          thrown: 'No final states',
        },
      ],
    });
  });

  describe('Machine, initial state not exists', () => {
    const func = () =>
      createMachine({
        initial: 'nostate',
        context: undefined,
        states: {
          state1: {},
        },
      });
    ttest({
      func,
      tests: [
        {
          throws: true,
          // thrown: 'No all cases are handled for state "idle"',
        },
        {
          throws: true,
          thrown: 'No initial state',
        },
      ],
    });
  });

  describe('Machine, initial state is final', () => {
    const func = () =>
      createMachine({
        initial: 'idle',
        context: undefined,
        states: {
          idle: {},
        },
      });
    ttest({
      func,
      tests: [
        {
          throws: true,
          // thrown: 'No all cases are handled for state "idle"',
        },
        {
          throws: true,
          thrown: 'First state cannot be final',
        },
      ],
    });
  });

  describe('Machine cannot transit to himself', () => {
    const func = () =>
      createMachine({
        initial: 'idle',
        context: undefined,
        states: {
          idle: {
            // type: 'async',
            transitions: [
              {
                conditions: 'test',
                target: 'idle',
              },
            ],
          },
          next: {
            type: 'final',
          },
        },
      });
    ttest({
      func,
      tests: [
        {
          throws: true,
          // thrown: 'No all cases are handled for state "idle"',
        },
        {
          throws: true,
          // thrown: 'No all cases are handled for state "idle"',
        },
        {
          throws: true,
          thrown: 'Cannot transit to himself',
        },
      ],
    });
  });

  describe("Machine, one target state doesn't exist", () => {
    const func = () =>
      createMachine({
        initial: 'idle',
        context: undefined,
        states: {
          idle: {
            // type: 'async',
            transitions: [
              {
                conditions: 'test',
                target: 'notexits',
              },
            ],
          },
          next: {
            type: 'final',
          },
        },
      });
    ttest({
      func,
      tests: [
        {
          throws: true,
          // thrown: 'No all cases are handled for state "idle"',
        },
        {
          throws: true,
          // thrown: 'No all cases are handled for state "idle"',
        },
        {
          throws: true,
          thrown: 'No state for "notexits"',
        },
      ],
    });
  });
});

describe('Working', () => {
  describe('Errors', () => {
    describe('Machine have an infinite loop state', () => {
      const machine = createMachine<'sync'>(
        {
          initial: 'idle',
          context: undefined,
          states: {
            idle: {
              transitions: [],
            },
            next: {},
          },
        },
        {
          conditions: {
            test: () => false,
          },
        },
      );

      const server = serve(machine);

      const func = machine.start;
      ttest({
        func,
        tests: [
          {
            args: true,
            throws: true,
            // thrown: 'No all cases are handled for state "idle"',
          },
          {
            args: false,
            throws: true,
            // thrown: 'No all cases are handled for state "idle"',
          },
          {
            args: false,
            throws: true,
            thrown: 'No all cases are handled for state "idle"',
          },
        ],
      });
    });
    describe('Machine, async when sync', () => {
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
      const func = machine.startAsync;
      ttest({
        func,
        tests: [
          {
            args: true,
            throws: true,
            // thrown: 'No all cases are handled for state "idle"',
          },
          {
            args: false,
            throws: true,
            // thrown: 'No all cases are handled for state "idle"',
          },
          {
            args: false,
            throws: true,
            thrown: 'no async state',
          },
        ],
      });
    });
  });
});
