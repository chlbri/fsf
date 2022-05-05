import { nanoid } from 'nanoid';
import type { Machine } from './machine';
import { StateDefinition } from './types';

type Test<TA = any, TC = any> = {
  invite?: string;
} & (TA extends undefined ? { args?: never } : { args: TA }) &
  (
    | { expected: TC; enteredStates?: (string | undefined)[] }
    | { expected?: TC; enteredStates: (string | undefined)[] }
  );

type Props<
  TA = any,
  TC extends Record<string, unknown> = Record<string, unknown>,
  S extends StateDefinition<TA, TC> = StateDefinition<TA, TC>,
  D = any,
> = {
  machine: Machine<TA, TC, S, D>;
  tests: Test<TA, TC>[];
  // invite?: string;
  timeout?: number;
};

function constructInvite(invite = nanoid()) {
  return `${invite} ==>`;
}

function testCase<
  TA = any,
  TC extends Record<string, unknown> = Record<string, unknown>,
  S extends StateDefinition<TA, TC> = StateDefinition<TA, TC>,
  D = any,
>(
  machine: Machine<TA, TC, S, D>,
  { invite, args, expected, enteredStates }: Test<TA, TC>,
  timeout: number,
) {
  describe(constructInvite(invite), () => {
    beforeAll(() => {
      machine.startAsync(args as TA);
    });
    !!expected &&
      test(
        'Result matches expected',
        async () => {
          expect(machine.value).toStrictEqual(expected);
        },
        timeout,
      );
    !!enteredStates &&
      test(
        'STATES match expecteds',
        async () => {
          expect(machine.enteredStates).toStrictEqual(enteredStates);
        },
        timeout,
      );
  });
}

export function testMachine<
  TA = any,
  TC extends Record<string, unknown> = Record<string, unknown>,
  S extends StateDefinition<TA, TC> = StateDefinition<TA, TC>,
  D = any,
>({ machine, tests, timeout = 3500 }: Props<TA, TC, S, D>) {
  // for (const test of tests) {
  //   testCase(machine, test, timeout);
  // }

  tests.forEach(test => {
    testCase(machine.cloneTest, test, timeout);
  });
}
