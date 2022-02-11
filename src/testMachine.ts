import { Machine } from './machine';
import { nanoid } from 'nanoid';

type Test<TA = any, TC = any> = { invite?: string; args: TA } & (
  | { expected: TC; enteredStates?: (string | undefined)[] }
  | { expected?: TC; enteredStates: (string | undefined)[] }
);

type Props<AS extends true | undefined = undefined, TA = any, TC = any> = {
  machine: Machine<AS, TA, TC>;
  tests: Test<TA, TC>[];
  // invite?: string;
  timeout?: number;
};

function constructInvite(invite = nanoid()) {
  return `${invite} ==>`;
}

function testCase<TA = any, TC = any>(
  machine: Machine<any, TA, TC>,
  { invite, args, expected, enteredStates }: Test<TA, TC>,
  timeout: number,
) {
  describe(constructInvite(invite), () => {
    !!expected &&
      test(
        'Result matches',
        async () => {
          const _machine = machine.cloneTest;
          const received = await _machine.startAsync(args);
          expect(received).toStrictEqual(expected);
        },
        timeout,
      );
    !!enteredStates &&
      test(
        'STATES match',
        async () => {
          const _machine = machine.cloneTest;
          await _machine.startAsync(args);
          expect(_machine.enteredStates).toStrictEqual(enteredStates);
        },
        timeout,
      );
  });
}

export function testMachine<
  AS extends true | undefined = undefined,
  TA = any,
  TC = any,
>({ machine, tests, timeout = 3500 }: Props<AS, TA, TC>) {
  // for (const test of tests) {
  //   testCase(machine, test, timeout);
  // }
  tests.forEach(test => testCase(machine, test, timeout));
}
