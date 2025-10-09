import { createLogic } from '../../../Machine';

type Context = {
  age: number;
  hasLicense: boolean;
  hasCar: boolean;
};

type Events = { type: 'CHECK_ELIGIBILITY' };

type Data = boolean;

export const config1 = createLogic(
  {
    initial: 'idle',
    data: 'canDrive',
    context: { age: 0, hasLicense: false, hasCar: false },
    states: {
      idle: {
        always: [
          {
            // Nested guards: (isAdult AND hasLicense) AND hasCar
            cond: {
              and: [{ and: ['isAdult', 'hasLicense'] }, 'hasCar'],
            },
          },
          {
            // Complex nested: (isAdult OR isTeenager) AND NOT hasCar
            cond: {
              and: [{ or: ['isAdult', 'isTeenager'] }, 'noVehicle'],
            },
          },
          'notEligible',
        ],
      },
      notEligible: {},
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
  'isAdult' | 'hasLicense' | 'hasCar' | 'isTeenager' | 'noVehicle'
>();
