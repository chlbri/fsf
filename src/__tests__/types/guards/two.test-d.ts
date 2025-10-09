import { createLogic } from '../../../Machine';

type Context = {
  value: number;
  items: string[];
};

type Events = { type: 'PROCESS'; threshold?: number };

type Data = string[];

export const config1 = createLogic(
  {
    initial: 'checking',
    data: 'getItems',
    context: { value: 0, items: [] },
    states: {
      checking: {
        always: [
          {
            cond: { and: ['hasValue', 'hasItems'] },
            target: 'valid',
          },
          {
            cond: { or: ['isEmpty', 'isZero'] },
            target: 'invalid',
          },
          'pending',
        ],
      },
      valid: {
        data: 'getItems',
      },
      invalid: {
        data: 'getItems',
      },
      pending: {
        data: 'getItems',
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

expectTypeOf<GuardsKeys>().toEqualTypeOf<
  'hasValue' | 'hasItems' | 'isEmpty' | 'isZero'
>();
