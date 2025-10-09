import { createLogic } from '../../../Machine';

type Context = {
  count: number;
  isReady: boolean;
};

type Events =
  | { type: 'CHECK'; value: number }
  | { type: 'VALIDATE'; threshold: number };

type Data = string;

export const config1 = createLogic(
  {
    initial: 'idle',
    data: 'status',
    context: { count: 0, isReady: false },
    states: {
      idle: {
        always: [
          {
            cond: 'isPositive',
            target: 'valid',
          },
          {
            cond: 'isReady',
            target: 'ready',
          },
          'waiting',
        ],
      },
      valid: {
        data: 'status',
      },
      ready: {
        data: 'status',
      },
      waiting: {
        data: 'status',
      },
    },
  },
  {
    context: {} as Context,
    events: {} as Events,
    data: {} as Data,
  },
);

type GuardsKeys = keyof Exclude<
  Parameters<(typeof config1)['provideOptions']>[0]['guards'],
  undefined
>;

expectTypeOf<GuardsKeys>().toEqualTypeOf<'isPositive' | 'isReady'>();
