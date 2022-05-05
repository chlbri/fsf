import { nanoid } from 'nanoid';
import type { MachineFunction } from './machineFunction';
import type { StateDefinition } from './types';

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
  S extends StateDefinition<TA, TC> = StateDefinition<TA, TC>,
  D = any,
> = {
  machine: MachineFunction<TA, TC, S, D>;
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
  S extends StateDefinition<TA, TC> = StateDefinition<TA, TC>,
  D = any,
>(
  machine: MachineFunction<TA, TC, S, D>,
  { invite, args, expected, enteredStates }: Test<TA, TC>,
  timeout = 3500,
  tester = describe,
) {
  tester(constructInvite(invite), () => {
    beforeAll(() => {
      machine.startAsync(args as TA);
    });
    !!expected &&
      it(
        'Result matches expected',
        async () => {
          expect(machine.value).toStrictEqual(expected);
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

export function test<
  TA = any,
  TC extends Record<string, unknown> = Record<string, unknown>,
  S extends StateDefinition<TA, TC> = StateDefinition<TA, TC>,
  D = any,
>({ machine, tests, timeout }: Props<TA, TC, S, D>) {
  tests.forEach(test => {
    testCase(machine.cloneTest, test, timeout);
  });
}

test.skip = <
  TA = any,
  TC extends Record<string, unknown> = Record<string, unknown>,
  S extends StateDefinition<TA, TC> = StateDefinition<TA, TC>,
  D = any,
>({
  machine,
  tests,
  timeout,
}: Props<TA, TC, S, D>) => {
  tests.forEach(test => {
    testCase(machine.cloneTest, test, timeout, describe.skip);
  });
};

test.only = <
  TA = any,
  TC extends Record<string, unknown> = Record<string, unknown>,
  S extends StateDefinition<TA, TC> = StateDefinition<TA, TC>,
  D = any,
>({
  machine,
  tests,
  timeout,
}: Props<TA, TC, S, D>) => {
  tests.forEach(test => {
    testCase(machine.cloneTest, test, timeout, describe.only);
  });
};

test.todo = (todo: string) => {
  it.todo(todo);
};
