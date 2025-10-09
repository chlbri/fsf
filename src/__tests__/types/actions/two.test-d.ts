import { createLogic } from '../../../Machine';
type Context = { count: number };
type Events =
  | { type: 'INCREMENT' }
  | { type: 'DECREMENT' }
  | { type: 'RESET' };
type Data = number;

export const config1 = createLogic(
  {
    initial: 'idle',
    data: 'getCount',
    context: { count: 0 },
    states: {
      idle: {
        always: { target: 'incrementing', actions: 'increment' },
      },
      incrementing: {
        always: {
          target: 'idle',
        },
      },
      decrementing: {
        always: {
          actions: ['decrement'],
        },
      },
      resetting: {},
    },
  },
  {
    context: {} as Context,
    events: {} as Events,
    data: {} as Data,
  },
);

type ActionsKeys = keyof Exclude<
  Parameters<(typeof config1)['provideOptions']>[0]['actions'],
  undefined
>;

expectTypeOf<ActionsKeys>().toEqualTypeOf<'increment' | 'decrement'>();
