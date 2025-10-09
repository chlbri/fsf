import { createLogic } from '../../../Machine';

type Context = {
  apiKey?: string;
  apiUrl?: string;
  url?: string;
};

type Events = { products?: string[]; categories?: string[] };
type Data = string;

export const config1 = createLogic(
  {
    initial: 'preferences',
    data: 'query',
    states: {
      preferences: {
        always: {
          actions: ['setUrl', 'setApiKey', 'startUrl'],
          target: 'categories',
        },
      },
      categories: {
        always: [
          {
            cond: 'hasCategories',
            target: 'products',
            actions: 'setCategories',
          },
          'products',
        ],
      },
      products: {
        always: [
          {
            cond: 'hasProducts',
            // target: 'final',
            actions: 'setProducts',
          },
        ],
      },
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

expectTypeOf<ActionsKeys>().toEqualTypeOf<
  'setUrl' | 'setApiKey' | 'startUrl' | 'setCategories' | 'setProducts'
>();
