import { nanoid } from 'nanoid';
import type { MachineFunction } from './machineFunction';

type Test<TA = any, TC = any> = {
  invite?: string;
} & (TA extends undefined ? { args?: undefined } : { args: TA }) &
  (
    | { expected: TC; enteredStates?: (string | undefined)[] }
    | { expected?: TC; enteredStates: (string | undefined)[] }
  );

type Props<
  TA = any,
  TC extends Record<string, unknown> = Record<string, unknown>,
  R = TC,
> = {
  machine: MachineFunction<TA, TC, R>;
  tests: Test<TA, TC>[];
  // invite?: string;
  timeout?: number;
};

function constructInvite(invite = nanoid(7)) {
  return `${invite} =>`;
}

function testCase<
  TA = any,
  TC extends Record<string, unknown> = Record<string, unknown>,
  D = any,
>(
  machine: MachineFunction<TA, TC, D>,
  { invite, args, expected, enteredStates }: Test<TA, TC>,
  timeout = 3500,
  tester: any = describe,
) {
  tester(constructInvite(invite), () => {
    beforeAll(() => {
      machine.start(args as TA);
    });
    !!expected &&
      it(
        'Result matches expected',
        async () => {
          expect(machine.context).toStrictEqual(expected);
        },
        timeout,
      );
    !!enteredStates &&
      it(
        'STATES match expecteds',
        async () => {
          expect(machine.enteredStates).toStrictEqual(enteredStates);
        },
        timeout,
      );
  });
}

export function ttest<
  TA = any,
  TC extends Record<string, unknown> = Record<string, unknown>,
  D = any,
>({ machine, tests, timeout }: Props<TA, TC, D>) {
  tests.forEach(test => {
    testCase(machine.cloneTest, test, timeout);
  });
}

ttest.skip = <
  TA = any,
  TC extends Record<string, unknown> = Record<string, unknown>,
  R = TC,
>({
  machine,
  tests,
  timeout,
}: Props<TA, TC, R>) => {
  tests.forEach(test => {
    testCase(machine.cloneTest, test, timeout, describe.skip);
  });
};

ttest.only = <
  TA = any,
  TC extends Record<string, unknown> = Record<string, unknown>,
  R = any,
>({
  machine,
  tests,
  timeout,
}: Props<TA, TC, R>) => {
  tests.forEach(test => {
    testCase(machine.cloneTest, test, timeout, describe.only);
  });
};

ttest.todo = (todo: string) => {
  it.todo(todo);
};
