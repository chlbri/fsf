import { createLogic } from '../Machine';
import { interpret } from '../interpreter';

test('#1: Overflow transitions', () => {
  const machine = createLogic(
    {
      initial: 'idle',
      __tsSchema: {} as {
        initial: 'idle';
        states: 'idle' | 'calc' | 'final';
      },
      states: {
        idle: {
          always: {
            target: 'calc',
          },
        },
        calc: {
          always: {
            target: 'final',
          },
        },
        final: {
          data: 'any',
        },
      },
    },
    {} as {
      context: { val: number };
      events: number;
      data: number;
      // promises: {};
    },
  );
  const func = () => interpret(machine, { overflow: 1 })(3);
  expect(func).toThrowError('Overflow transitions');
});
