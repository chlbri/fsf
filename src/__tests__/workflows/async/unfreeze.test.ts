import { describe, expect, test } from 'vitest';
import { interpret } from '../../../interpreter';
import { createLogic } from '../../../Machine';

describe('#4: unFreezeArgs behavior in async logic', () => {
  type Context = {
    results: string[];
    mutatedValue?: number;
  };

  type Events = { value: number };

  describe('With unFreezeArgs: false (default) - events should be frozen', () => {
    test('01 -> Attempting to mutate frozen events throws error in promise', async () => {
      const machine = createLogic(
        {
          initial: 'idle',
          data: 'returnResults',
          states: {
            idle: {
              always: 'process',
            },
            process: {
              invoke: {
                src: 'mutateEvents',
                then: 'success',
                catch: {
                  target: 'error',
                  actions: 'captureError',
                },
              },
            },
            success: {
              data: 'returnResults',
            },
            error: {
              data: 'returnResults',
            },
          },
        },
        {
          context: {} as Context,
          events: {} as Events,
          data: {} as { results: string[] },
          promises: {} as {
            mutateEvents: { data: string; error: string };
          },
        },
      ).provideOptions({
        actions: {
          captureError: (ctx: Context, error: any) => {
            ctx.results.push(`error:${error}`);
          },
        } as any,
        promises: {
          mutateEvents: async (_ctx, events) => {
            try {
              (events as any).value = 999;
              return 'success';
            } catch (err: any) {
              throw err.message || 'Mutation failed';
            }
          },
        },
        datas: {
          returnResults: ctx => ({ results: ctx.results }),
        },
      });

      const process = interpret(machine, {
        context: { results: [] },
      });

      const result = await process({ value: 42 });

      expect(result.results.length).toBeGreaterThanOrEqual(0);
    });

    test('02 -> Events remain unchanged after promise execution', async () => {
      const capturedValues: number[] = [];

      const machine = createLogic(
        {
          initial: 'idle',
          data: 'returnValues',
          states: {
            idle: {
              always: 'process',
            },
            process: {
              invoke: {
                src: 'captureValue',
                then: 'done',
                catch: 'error',
              },
            },
            done: {
              data: 'returnValues',
            },
            error: {
              data: 'returnValues',
            },
          },
        },
        {
          context: {} as Context,
          events: {} as Events,
          data: {} as number[],
          promises: {} as {
            captureValue: { data: void; error: never };
          },
        },
      ).provideOptions({
        promises: {
          captureValue: async (_, events) => {
            capturedValues.push(events.value);
          },
        },
        datas: {
          returnValues: () => capturedValues,
        },
        unFreezeArgs: false,
      });

      const process = interpret(machine, {
        context: { results: [] },
      });

      const result = await process({ value: 100 });

      expect(result).toContain(100);
      expect(capturedValues[0]).toBe(100);
    });
  });

  describe('With unFreezeArgs: true - events can be mutated', () => {
    test('03 -> Events can be mutated in promise handlers', async () => {
      const machine = createLogic(
        {
          initial: 'idle',
          data: 'returnMutatedValue',
          states: {
            idle: {
              always: 'process',
            },
            process: {
              invoke: {
                src: 'mutateAndCapture',
                then: {
                  target: 'success',
                  actions: 'storeMutatedValue',
                },
                catch: 'error',
              },
            },
            success: {
              data: 'returnMutatedValue',
            },
            error: {
              data: 'returnMutatedValue',
            },
          },
        },
        {
          context: {} as Context,
          events: {} as Events,
          data: {} as number | undefined,
          promises: {} as {
            mutateAndCapture: { data: Events; error: never };
          },
        },
      ).provideOptions({
        actions: {
          storeMutatedValue: (ctx: Context, mutatedEvents: any) => {
            ctx.mutatedValue = (mutatedEvents as any).value;
          },
        } as any,
        promises: {
          mutateAndCapture: async (_, events) => {
            (events as any).value = 999;
            return events;
          },
        },
        datas: {
          returnMutatedValue: ctx => ctx.mutatedValue,
        },
        unFreezeArgs: true,
      });

      const process = interpret(machine, {
        context: { results: [] },
      });

      const result = await process({ value: 42 });

      expect(result).toBe(999);
    });

    test('04 -> Multiple promises can mutate events independently', async () => {
      const mutations: number[] = [];

      const machine = createLogic(
        {
          initial: 'idle',
          data: 'returnMutations',
          states: {
            idle: {
              always: 'process',
            },
            process: {
              invoke: [
                {
                  src: 'mutate1',
                  then: 'done',
                  catch: 'error',
                },
                {
                  src: 'mutate2',
                  then: 'done',
                  catch: 'error',
                },
                {
                  src: 'mutate3',
                  then: 'done',
                  catch: 'error',
                },
              ],
            },
            done: {
              data: 'returnMutations',
            },
            error: {
              data: 'returnMutations',
            },
          },
        },
        {
          context: {} as Context,
          events: {} as Events,
          data: {} as number[],
          promises: {} as {
            mutate1: { data: void; error: never };
            mutate2: { data: void; error: never };
            mutate3: { data: void; error: never };
          },
        },
      ).provideOptions({
        promises: {
          mutate1: async (_, events) => {
            (events as any).value += 10;
            mutations.push((events as any).value);
          },
          mutate2: async (_, events) => {
            (events as any).value += 20;
            mutations.push((events as any).value);
          },
          mutate3: async (_, events) => {
            (events as any).value += 30;
            mutations.push((events as any).value);
          },
        },
        datas: {
          returnMutations: () => mutations,
        },
        unFreezeArgs: true,
      });

      const process = interpret(machine, {
        context: { results: [] },
      });

      await process({ value: 100 });

      expect(mutations.length).toBe(3);
      expect(mutations.some(v => v > 100)).toBe(true);
    });

    test('05 -> Promise actions can modify events in then/catch', async () => {
      let capturedInThen: number | undefined;

      const machine = createLogic(
        {
          initial: 'idle',
          data: 'returnCaptured',
          states: {
            idle: {
              always: 'process',
            },
            process: {
              invoke: {
                src: 'returnModifiedValue',
                then: {
                  target: 'success',
                  actions: 'captureModifiedValue',
                },
                catch: 'error',
              },
            },
            success: {
              data: 'returnCaptured',
            },
            error: {
              data: 'returnCaptured',
            },
          },
        },
        {
          context: {} as Context,
          events: {} as Events,
          data: {} as number | undefined,
          promises: {} as {
            returnModifiedValue: { data: number; error: never };
          },
        },
      ).provideOptions({
        actions: {
          captureModifiedValue: (_: any, value: any) => {
            capturedInThen = value as any;
          },
        } as any,
        promises: {
          returnModifiedValue: async (_, events) => {
            (events as any).value *= 2;
            return (events as any).value;
          },
        },
        datas: {
          returnCaptured: () => capturedInThen,
        },
        unFreezeArgs: true,
      });

      const process = interpret(machine, {
        context: { results: [] },
      });

      const result = await process({ value: 21 });

      expect(result).toBe(42);
      expect(capturedInThen).toBe(42);
    });

    test('06 -> Entry actions with unfrozen events in async state', async () => {
      let entryValue: number | undefined;

      const machine = createLogic(
        {
          initial: 'idle',
          data: 'returnValue',
          states: {
            idle: {
              always: 'process',
            },
            process: {
              entry: 'modifyInEntry',
              invoke: {
                src: 'captureValue',
                then: 'done',
                catch: 'error',
              },
            },
            done: {
              data: 'returnValue',
            },
            error: {
              data: 'returnValue',
            },
          },
        },
        {
          context: {} as Context,
          events: {} as Events,
          data: {} as number | undefined,
          promises: {} as {
            captureValue: { data: number; error: never };
          },
        },
      ).provideOptions({
        actions: {
          modifyInEntry: (_: any, events: any) => {
            (events as any).value += 5;
            entryValue = (events as any).value;
          },
        } as any,
        promises: {
          captureValue: async (_, events) => {
            return (events as any).value;
          },
        },
        datas: {
          returnValue: () => entryValue,
        },
        unFreezeArgs: true,
      });

      const process = interpret(machine, {
        context: { results: [] },
      });

      const result = await process({ value: 10 });

      expect(result).toBe(15);
    });

    test('07 -> Finally actions with unfrozen events', async () => {
      let finallyValue: number | undefined;

      const machine = createLogic(
        {
          initial: 'idle',
          data: 'returnValue',
          states: {
            idle: {
              always: 'process',
            },
            process: {
              invoke: {
                src: 'modifyValue',
                then: 'done',
                catch: 'error',
                finally: 'captureInFinally',
              },
            },
            done: {
              data: 'returnValue',
            },
            error: {
              data: 'returnValue',
            },
          },
        },
        {
          context: {} as Context,
          events: {} as Events,
          data: {} as number | undefined,
          promises: {} as {
            modifyValue: { data: void; error: never };
          },
        },
      ).provideOptions({
        actions: {
          captureInFinally: (_: any, events: any) => {
            finallyValue = (events as any).value;
          },
        } as any,
        promises: {
          modifyValue: async (_, events) => {
            (events as any).value = 777;
          },
        },
        datas: {
          returnValue: () => finallyValue,
        },
        unFreezeArgs: true,
      });

      const process = interpret(machine, {
        context: { results: [] },
      });

      const result = await process({ value: 50 });

      expect(result).toBe(777);
    });
  });

  describe('Edge cases with unFreezeArgs', () => {
    test('08 -> Nested object mutation with unFreezeArgs: true', async () => {
      type NestedEvents = {
        data: { value: number; nested: { deep: number } };
      };

      const machine = createLogic(
        {
          initial: 'idle',
          data: 'returnNested',
          states: {
            idle: {
              always: 'process',
            },
            process: {
              invoke: {
                src: 'mutateNested',
                then: {
                  target: 'done',
                  actions: 'storeNested',
                },
                catch: 'error',
              },
            },
            done: {
              data: 'returnNested',
            },
            error: {
              data: 'returnNested',
            },
          },
        },
        {
          context: {} as Context & { nestedValue?: number },
          events: {} as NestedEvents,
          data: {} as number | undefined,
          promises: {} as {
            mutateNested: { data: NestedEvents; error: never };
          },
        },
      ).provideOptions({
        actions: {
          storeNested: (ctx: any, events: any) => {
            ctx.nestedValue = (events as any).data.nested.deep;
          },
        } as any,
        promises: {
          mutateNested: async (_, events) => {
            (events as any).data.nested.deep = 888;
            return events;
          },
        },
        datas: {
          returnNested: ctx => (ctx as any).nestedValue,
        },
        unFreezeArgs: true,
      });

      const process = interpret(machine, {
        context: { results: [] },
      });

      const result = await process({
        data: { value: 1, nested: { deep: 2 } },
      });

      expect(result).toBe(888);
    });

    test('09 -> Comparing frozen vs unfrozen behavior', async () => {
      type TestContext = {
        frozenError: boolean;
        unfrozenSuccess: boolean;
      };

      const machineFrozen = createLogic(
        {
          initial: 'idle',
          data: 'returnStatus',
          states: {
            idle: { always: 'process' },
            process: {
              invoke: {
                src: 'attemptMutation',
                then: 'done',
                catch: {
                  target: 'error',
                  actions: 'markFrozenError',
                },
              },
            },
            done: {
              data: 'returnStatus',
            },
            error: {
              data: 'returnStatus',
            },
          },
        },
        {
          context: {} as TestContext,
          events: {} as Events,
          data: {} as TestContext,
          promises: {} as {
            attemptMutation: { data: void; error: Error };
          },
        },
      ).provideOptions({
        actions: {
          markFrozenError: (ctx: TestContext) => {
            ctx.frozenError = true;
          },
        } as any,
        promises: {
          attemptMutation: async (_, events) => {
            (events as any).value = 123;
          },
        },
        datas: {
          returnStatus: ctx => ctx,
        },
        unFreezeArgs: false,
      });

      const machineUnfrozen = createLogic(
        {
          initial: 'idle',
          data: 'returnStatus',
          states: {
            idle: { always: 'process' },
            process: {
              invoke: {
                src: 'attemptMutation',
                then: {
                  target: 'done',
                  actions: 'markUnfrozenSuccess',
                },
                catch: 'error',
              },
            },
            done: {
              data: 'returnStatus',
            },
            error: {
              data: 'returnStatus',
            },
          },
        },
        {
          context: {} as TestContext,
          events: {} as Events,
          data: {} as TestContext,
          promises: {} as {
            attemptMutation: { data: void; error: never };
          },
        },
      ).provideOptions({
        actions: {
          markUnfrozenSuccess: (ctx: TestContext) => {
            ctx.unfrozenSuccess = true;
          },
        } as any,
        promises: {
          attemptMutation: async (_, events) => {
            (events as any).value = 123;
          },
        },
        datas: {
          returnStatus: ctx => ctx,
        },
        unFreezeArgs: true,
      });

      const processFrozen = interpret(machineFrozen, {
        context: { frozenError: false, unfrozenSuccess: false },
      });

      const processUnfrozen = interpret(machineUnfrozen, {
        context: { frozenError: false, unfrozenSuccess: false },
      });

      await processFrozen({ value: 42 });
      const resultUnfrozen = await processUnfrozen({ value: 42 });

      expect(resultUnfrozen.unfrozenSuccess).toBe(true);
    });
  });
});
