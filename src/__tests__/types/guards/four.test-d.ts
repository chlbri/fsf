import { createLogic } from '../../../Machine';

type Context = {
  products?: string[];
  categories?: string[];
  apiKey?: string;
};

type Events = { products?: string[]; categories?: string[] } | null;

type Data = string;

export const config1 = createLogic(
  {
    initial: 'preferences',
    data: 'query',
    states: {
      preferences: {
        always: {
          actions: ['setApiKey', 'startUrl'],
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
            target: 'final',
            actions: 'setProducts',
          },
          'final',
        ],
      },
      final: {
        data: 'query',
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
  'hasCategories' | 'hasProducts'
>();
