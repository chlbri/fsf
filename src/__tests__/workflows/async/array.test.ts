import { describe, expect, test } from 'vitest';
import { interpret } from '../../../interpreter';
import { createLogic } from '../../../Machine';

describe('#3: Array of promises in async logic', () => {
  type Context = {
    results: string[];
    errors: string[];
    executions: string[];
    finallyCalls: string[];
  };

  type Events = { value: number };

  describe('Multiple promises - all succeed', () => {
    const machine = createLogic(
      {
        initial: 'idle',
        data: 'returnResults',
        states: {
          idle: {
            always: 'fetchMultiple',
          },
          fetchMultiple: {
            entry: 'markStart',
            invoke: [
              {
                src: 'fetchData1',
                then: {
                  target: 'processing',
                  actions: 'storeResult1',
                },
                catch: {
                  target: 'error',
                  actions: 'storeError1',
                },
                finally: 'markFinally1',
              },
              {
                src: 'fetchData2',
                then: {
                  target: 'processing',
                  actions: 'storeResult2',
                },
                catch: {
                  target: 'error',
                  actions: 'storeError2',
                },
                finally: 'markFinally2',
              },
              {
                src: 'fetchData3',
                then: {
                  target: 'processing',
                  actions: 'storeResult3',
                },
                catch: {
                  target: 'error',
                  actions: 'storeError3',
                },
                finally: 'markFinally3',
              },
            ],
          },
          processing: {
            data: 'returnResults',
          },
          error: {
            data: 'returnErrors',
          },
        },
      },
      {
        context: {} as Context,
        events: {} as Events,
        data: {} as { results: string[]; errors: string[] },
        promises: {} as {
          fetchData1: { data: string; error: string };
          fetchData2: { data: string; error: string };
          fetchData3: { data: string; error: string };
        },
      },
    ).provideOptions({
      actions: {
        markStart: ctx => {
          ctx.executions.push('start');
        },
        storeResult1: (ctx, data) => {
          ctx.results.push(`result1:${data}`);
        },
        storeResult2: (ctx, data) => {
          ctx.results.push(`result2:${data}`);
        },
        storeResult3: (ctx, data) => {
          ctx.results.push(`result3:${data}`);
        },
        storeError1: (ctx, error) => {
          ctx.errors.push(`error1:${error}`);
        },
        storeError2: (ctx, error) => {
          ctx.errors.push(`error2:${error}`);
        },
        storeError3: (ctx, error) => {
          ctx.errors.push(`error3:${error}`);
        },
        markFinally1: ctx => {
          ctx.finallyCalls.push('finally1');
        },
        markFinally2: ctx => {
          ctx.finallyCalls.push('finally2');
        },
        markFinally3: ctx => {
          ctx.finallyCalls.push('finally3');
        },
      },
      promises: {
        fetchData1: async (_, { value }) => {
          return `data1-${value * 2}`;
        },
        fetchData2: async (_, { value }) => {
          return `data2-${value * 3}`;
        },
        fetchData3: async (_, { value }) => {
          return `data3-${value * 4}`;
        },
      },
      datas: {
        returnResults: ctx => ({
          results: ctx.results,
          errors: ctx.errors,
        }),
        returnErrors: ctx => ({
          results: ctx.results,
          errors: ctx.errors,
        }),
      },
    });

    const process = interpret(machine, {
      context: {
        results: [],
        errors: [],
        executions: [],
        finallyCalls: [],
      },
    });

    test('01 -> All promises resolve successfully', async () => {
      const result = await process({ value: 5 });

      expect(result.results).toHaveLength(3);
      expect(result.results).toContain('result1:data1-10');
      expect(result.results).toContain('result2:data2-15');
      expect(result.results).toContain('result3:data3-20');
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Multiple promises - mixed success and failure', () => {
    const machine = createLogic(
      {
        initial: 'idle',
        data: 'returnMixed',
        states: {
          idle: {
            always: 'fetchMixed',
          },
          fetchMixed: {
            invoke: [
              {
                src: 'successPromise',
                then: {
                  target: 'partial',
                  actions: 'storeSuccess',
                },
                catch: {
                  target: 'partial',
                  actions: 'storeFailure',
                },
                finally: 'markFinally1',
              },
              {
                src: 'failurePromise',
                then: {
                  target: 'partial',
                  actions: 'storeSuccess',
                },
                catch: {
                  target: 'partial',
                  actions: 'storeFailure',
                },
                finally: 'markFinally2',
              },
              {
                src: 'anotherSuccessPromise',
                then: {
                  target: 'partial',
                  actions: 'storeSuccess',
                },
                catch: {
                  target: 'partial',
                  actions: 'storeFailure',
                },
                finally: 'markFinally3',
              },
            ],
          },
          partial: {
            data: 'returnMixed',
          },
        },
      },
      {
        context: {} as Context,
        events: {} as Events,
        data: {} as { results: string[]; errors: string[] },
        promises: {} as {
          successPromise: { data: string; error: string };
          failurePromise: { data: string; error: string };
          anotherSuccessPromise: { data: string; error: string };
        },
      },
    ).provideOptions({
      actions: {
        storeSuccess: (ctx, data) => {
          ctx.results.push(data as any);
        },
        storeFailure: (ctx, error) => {
          ctx.errors.push(error as any);
        },
        markFinally1: (ctx: Context) => {
          ctx.finallyCalls.push('finally1');
        },
        markFinally2: (ctx: Context) => {
          ctx.finallyCalls.push('finally2');
        },
        markFinally3: (ctx: Context) => {
          ctx.finallyCalls.push('finally3');
        },
      },
      promises: {
        successPromise: async (_, { value }) => {
          return `success-${value}`;
        },
        failurePromise: async (_, { value }) => {
          throw `failure-${value}`;
        },
        anotherSuccessPromise: async (_, { value }) => {
          return `another-${value}`;
        },
      },
      datas: {
        returnMixed: ctx => ({
          results: ctx.results,
          errors: ctx.errors,
        }),
      },
    });

    test('03 -> Mixed results - some succeed, some fail', async () => {
      const process = interpret(machine, {
        context: {
          results: [],
          errors: [],
          executions: [],
          finallyCalls: [],
        },
      });

      const result = await process({ value: 10 });

      expect(result.results).toHaveLength(2);
      expect(result.results).toContain('success-10');
      expect(result.results).toContain('another-10');

      expect(result.errors).toHaveLength(1);
      expect(result.errors).toContain('failure-10');
    });
  });

  describe('Promises execution order and parallelism', () => {
    test('05 -> Promises execute in parallel', async () => {
      const executionOrder: string[] = [];
      const delays = [100, 50, 75];

      const machine = createLogic(
        {
          initial: 'idle',
          data: 'returnOrder',
          states: {
            idle: {
              always: 'parallel',
            },
            parallel: {
              invoke: [
                {
                  src: 'slowPromise',
                  then: 'done',
                  catch: 'error',
                },
                {
                  src: 'fastPromise',
                  then: 'done',
                  catch: 'error',
                },
                {
                  src: 'mediumPromise',
                  then: 'done',
                  catch: 'error',
                },
              ],
            },
            done: {
              data: 'returnOrder',
            },
            error: {
              data: 'returnOrder',
            },
          },
        },
        {
          context: {} as { order: string[] },
          events: null as any,
          data: {} as string[],
          promises: {} as {
            slowPromise: { data: void; error: never };
            fastPromise: { data: void; error: never };
            mediumPromise: { data: void; error: never };
          },
        },
      ).provideOptions({
        promises: {
          slowPromise: async () => {
            await new Promise(resolve => setTimeout(resolve, delays[0]));
            executionOrder.push('slow');
          },
          fastPromise: async () => {
            await new Promise(resolve => setTimeout(resolve, delays[1]));
            executionOrder.push('fast');
          },
          mediumPromise: async () => {
            await new Promise(resolve => setTimeout(resolve, delays[2]));
            executionOrder.push('medium');
          },
        },
        datas: {
          returnOrder: () => executionOrder,
        },
      });

      const process = interpret(machine, {
        context: { order: [] },
      });

      const startTime = Date.now();
      const result = await process();
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(150);
      expect(result).toEqual(['fast', 'medium', 'slow']);
    });
  });

  describe('Empty and edge cases', () => {
    test('06 -> All promises fail', async () => {
      const machine = createLogic(
        {
          initial: 'idle',
          data: 'returnData',
          states: {
            idle: {
              always: 'allFail',
            },
            allFail: {
              invoke: [
                {
                  src: 'fail1',
                  then: 'success',
                  catch: {
                    target: 'error',
                    actions: 'captureError1',
                  },
                },
                {
                  src: 'fail2',
                  then: 'success',
                  catch: {
                    target: 'error',
                    actions: 'captureError2',
                  },
                },
              ],
            },
            success: {
              data: 'returnData',
            },
            error: {
              data: 'returnData',
            },
          },
        },
        {
          context: {} as Context,
          events: null as any,
          data: {} as { errors: string[] },
          promises: {} as {
            fail1: { data: never; error: string };
            fail2: { data: never; error: string };
          },
        },
      ).provideOptions({
        actions: {
          captureError1: (ctx, error) => {
            ctx.errors.push(`error1:${error}`);
          },
          captureError2: (ctx, error) => {
            ctx.errors.push(`error2:${error}`);
          },
        },
        promises: {
          fail1: async () => {
            throw 'fail1-reason';
          },
          fail2: async () => {
            throw 'fail2-reason';
          },
        },
        datas: {
          returnData: ctx => ({ errors: ctx.errors }),
        },
      });

      const process = interpret(machine, {
        context: {
          results: [],
          errors: [],
          executions: [],
          finallyCalls: [],
        },
      });

      const result = await process();

      expect(result.errors).toHaveLength(2);
      expect(result.errors).toContain('error1:fail1-reason');
      expect(result.errors).toContain('error2:fail2-reason');
    });
  });

  describe('Context mutation tracking', () => {
    test('07 -> Context mutations from multiple promises accumulate', async () => {
      const machine = createLogic(
        {
          initial: 'idle',
          data: 'returnResults',
          states: {
            idle: {
              always: 'accumulate',
            },
            accumulate: {
              invoke: [
                {
                  src: 'addOne',
                  then: {
                    target: 'done',
                    actions: 'processOne',
                  },
                  catch: 'error',
                },
                {
                  src: 'addTwo',
                  then: {
                    target: 'done',
                    actions: 'processTwo',
                  },
                  catch: 'error',
                },
                {
                  src: 'addThree',
                  then: {
                    target: 'done',
                    actions: 'processThree',
                  },
                  catch: 'error',
                },
              ],
            },
            done: {
              data: 'returnResults',
            },
            error: {
              data: 'returnResults',
            },
          },
        },
        {
          context: {} as Context,
          events: {} as { multiplier: number },
          data: {} as { results: string[] },
          promises: {} as {
            addOne: { data: number; error: never };
            addTwo: { data: number; error: never };
            addThree: { data: number; error: never };
          },
        },
      ).provideOptions({
        actions: {
          processOne: (ctx, value) => {
            ctx.results.push(`one:${value}`);
          },
          processTwo: (ctx, value) => {
            ctx.results.push(`two:${value}`);
          },
          processThree: (ctx, value) => {
            ctx.results.push(`three:${value}`);
          },
        },
        promises: {
          addOne: async (_, { multiplier }) => multiplier * 1,
          addTwo: async (_, { multiplier }) => multiplier * 2,
          addThree: async (_, { multiplier }) => multiplier * 3,
        },
        datas: {
          returnResults: ctx => ({ results: ctx.results }),
        },
      });

      const process = interpret(machine, {
        context: {
          results: [],
          errors: [],
          executions: [],
          finallyCalls: [],
        },
      });

      const result = await process({ multiplier: 5 });

      expect(result.results).toHaveLength(3);
      expect(result.results).toContain('one:5');
      expect(result.results).toContain('two:10');
      expect(result.results).toContain('three:15');
    });
  });

  describe('Different transition targets', () => {
    test('08 -> Different promises can transition to different states', async () => {
      const transitionLog: string[] = [];

      const machine = createLogic(
        {
          initial: 'idle',
          data: 'returnLog',
          states: {
            idle: {
              always: 'multiTarget',
            },
            multiTarget: {
              invoke: [
                {
                  src: 'toStateA',
                  then: {
                    target: 'stateA',
                    actions: 'logA',
                  },
                  catch: 'error',
                },
                {
                  src: 'toStateB',
                  then: {
                    target: 'stateB',
                    actions: 'logB',
                  },
                  catch: 'error',
                },
              ],
            },
            stateA: {
              entry: 'markStateA',
              data: 'returnLog',
            },
            stateB: {
              entry: 'markStateB',
              data: 'returnLog',
            },
            error: {
              data: 'returnLog',
            },
          },
        },
        {
          context: {} as { log: string[] },
          events: null as any,
          data: {} as string[],
          promises: {} as {
            toStateA: { data: string; error: never };
            toStateB: { data: string; error: never };
          },
        },
      ).provideOptions({
        actions: {
          logA: () => {
            transitionLog.push('transitionA');
          },
          logB: () => {
            transitionLog.push('transitionB');
          },
          markStateA: () => {
            transitionLog.push('enteredA');
          },
          markStateB: () => {
            transitionLog.push('enteredB');
          },
        },
        promises: {
          toStateA: async () => 'dataA',
          toStateB: async () => 'dataB',
        },
        datas: {
          returnLog: () => transitionLog,
        },
      });

      const process = interpret(machine, {
        context: { log: [] },
      });

      const result = await process();

      expect(result.length).toBeGreaterThan(0);
      expect(
        result.includes('transitionA') || result.includes('transitionB'),
      ).toBe(true);
    });
  });
});
