import { describe, expect, test } from 'vitest';
import { interpret } from '../../../interpreter';
import { createLogic } from '../../../Machine';

describe('#5: Overflow transitions in async logic', () => {
  type Context = {
    counter: number;
    iterations: number;
  };

  type Events = { increment: number };

  describe('Async overflow with ping-pong states', () => {
    test('01 -> Throws error with async promises bouncing between two states', async () => {
      const machine = createLogic(
        {
          initial: 'idle',
          data: 'returnCounter',
          states: {
            idle: {
              always: 'stateA',
            },
            stateA: {
              invoke: {
                src: 'processA',
                then: 'stateB',
                catch: 'error',
              },
            },
            stateB: {
              invoke: {
                src: 'processB',
                then: 'stateA',
                catch: 'error',
              },
            },
            error: {
              data: 'returnCounter',
            },
          },
        },
        {
          context: {} as Context,
          events: {} as Events,
          data: {} as number,
          promises: {} as {
            processA: { data: void; error: never };
            processB: { data: void; error: never };
          },
        },
      ).provideOptions({
        promises: {
          processA: async (ctx: Context) => {
            ctx.counter++;
          },
          processB: async (ctx: Context) => {
            ctx.counter++;
          },
        },
        datas: {
          returnCounter: (ctx: Context) => ctx.counter,
        },
      });

      const process = interpret(machine, {
        context: { counter: 0, iterations: 0 },
        overflow: 10,
      });

      await expect(process({ increment: 1 })).rejects.toThrow(
        'Overflow transitions',
      );
    });

    test('02 -> Tracks counter correctly during ping-pong before overflow', async () => {
      let lastCounter = 0;

      const machine = createLogic(
        {
          initial: 'idle',
          data: 'returnCounter',
          states: {
            idle: {
              always: 'ping',
            },
            ping: {
              invoke: {
                src: 'pingProcess',
                then: 'pong',
                catch: 'error',
              },
            },
            pong: {
              invoke: {
                src: 'pongProcess',
                then: 'ping',
                catch: 'error',
              },
            },
            error: {
              data: 'returnCounter',
            },
          },
        },
        {
          context: {} as Context,
          events: {} as Events,
          data: {} as number,
          promises: {} as {
            pingProcess: { data: void; error: never };
            pongProcess: { data: void; error: never };
          },
        },
      ).provideOptions({
        promises: {
          pingProcess: async (ctx: Context) => {
            ctx.counter += 1;
            lastCounter = ctx.counter;
          },
          pongProcess: async (ctx: Context) => {
            ctx.counter += 2;
            lastCounter = ctx.counter;
          },
        },
        datas: {
          returnCounter: (ctx: Context) => ctx.counter,
        },
      });

      const process = interpret(machine, {
        context: { counter: 0, iterations: 0 },
        overflow: 5,
      });

      try {
        await process({ increment: 1 });
      } catch (error: any) {
        expect(error.message).toBe('Overflow transitions');
        expect(lastCounter).toBeGreaterThan(0);
      }
    });

    test('03 -> Throws error with very small overflow limit (3) using async', async () => {
      const machine = createLogic(
        {
          initial: 'idle',
          data: 'returnCounter',
          states: {
            idle: {
              always: 'step1',
            },
            step1: {
              invoke: {
                src: 'processStep1',
                then: 'step2',
                catch: 'error',
              },
            },
            step2: {
              invoke: {
                src: 'processStep2',
                then: 'step1',
                catch: 'error',
              },
            },
            error: {
              data: 'returnCounter',
            },
          },
        },
        {
          context: {} as Context,
          events: {} as Events,
          data: {} as number,
          promises: {} as {
            processStep1: { data: void; error: never };
            processStep2: { data: void; error: never };
          },
        },
      ).provideOptions({
        promises: {
          processStep1: async (ctx: Context) => {
            ctx.counter++;
          },
          processStep2: async (ctx: Context) => {
            ctx.counter++;
          },
        },
        datas: {
          returnCounter: (ctx: Context) => ctx.counter,
        },
      });

      const process = interpret(machine, {
        context: { counter: 0, iterations: 0 },
        overflow: 3,
      });

      await expect(process({ increment: 1 })).rejects.toThrow(
        'Overflow transitions',
      );
    });

    test('04 -> Succeeds when async transitions complete before overflow limit', async () => {
      const machine = createLogic(
        {
          initial: 'idle',
          data: 'returnCounter',
          states: {
            idle: {
              always: 'step1',
            },
            step1: {
              invoke: {
                src: 'processStep1',
                then: 'step2',
                catch: 'error',
              },
            },
            step2: {
              invoke: {
                src: 'processStep2',
                then: 'final',
                catch: 'error',
              },
            },
            final: {
              data: 'returnCounter',
            },
            error: {
              data: 'returnCounter',
            },
          },
        },
        {
          context: {} as Context,
          events: {} as Events,
          data: {} as number,
          promises: {} as {
            processStep1: { data: void; error: never };
            processStep2: { data: void; error: never };
          },
        },
      ).provideOptions({
        promises: {
          processStep1: async (ctx: Context) => {
            ctx.counter++;
          },
          processStep2: async (ctx: Context) => {
            ctx.counter++;
          },
        },
        datas: {
          returnCounter: (ctx: Context) => ctx.counter,
        },
      });

      const process = interpret(machine, {
        context: { counter: 0, iterations: 0 },
        overflow: 10,
      });

      const result = await process({ increment: 1 });
      expect(result).toBe(2);
    });
  });

  describe('Overflow with async promises', () => {
    test('05 -> Throws overflow with array of promises ping-ponging', async () => {
      const machine = createLogic(
        {
          initial: 'idle',
          data: 'returnCounter',
          states: {
            idle: {
              always: 'multiPromiseA',
            },
            multiPromiseA: {
              invoke: [
                {
                  src: 'promise1',
                  then: 'multiPromiseB',
                  catch: 'error',
                },
                {
                  src: 'promise2',
                  then: 'multiPromiseB',
                  catch: 'error',
                },
              ],
            },
            multiPromiseB: {
              invoke: {
                src: 'promise3',
                then: 'multiPromiseA',
                catch: 'error',
              },
            },
            error: {
              data: 'returnCounter',
            },
          },
        },
        {
          context: {} as Context,
          events: {} as Events,
          data: {} as number,
          promises: {} as {
            promise1: { data: void; error: never };
            promise2: { data: void; error: never };
            promise3: { data: void; error: never };
          },
        },
      ).provideOptions({
        promises: {
          promise1: async (ctx: Context) => {
            ctx.counter++;
          },
          promise2: async (ctx: Context) => {
            ctx.counter += 10;
          },
          promise3: async (ctx: Context) => {
            ctx.counter += 100;
          },
        },
        datas: {
          returnCounter: (ctx: Context) => ctx.counter,
        },
      });

      const process = interpret(machine, {
        context: { counter: 0, iterations: 0 },
        overflow: 20,
      });

      await expect(process({ increment: 1 })).rejects.toThrow(
        'Overflow transitions',
      );
    });

    test('06 -> Multiple counters with ping-pong async states', async () => {
      const machine = createLogic(
        {
          initial: 'idle',
          data: 'returnCounter',
          states: {
            idle: {
              always: 'trackA',
            },
            trackA: {
              invoke: {
                src: 'trackProcessA',
                then: 'trackB',
                catch: 'error',
              },
            },
            trackB: {
              invoke: {
                src: 'trackProcessB',
                then: 'trackA',
                catch: 'error',
              },
            },
            error: {
              data: 'returnCounter',
            },
          },
        },
        {
          context: {} as Context,
          events: {} as Events,
          data: {} as number,
          promises: {} as {
            trackProcessA: { data: void; error: never };
            trackProcessB: { data: void; error: never };
          },
        },
      ).provideOptions({
        promises: {
          trackProcessA: async (ctx: Context) => {
            ctx.counter += 5;
            ctx.iterations++;
          },
          trackProcessB: async (ctx: Context) => {
            ctx.counter += 3;
            ctx.iterations++;
          },
        },
        datas: {
          returnCounter: (ctx: Context) => ctx.counter,
        },
      });

      const process = interpret(machine, {
        context: { counter: 0, iterations: 0 },
        overflow: 8,
      });

      try {
        await process({ increment: 1 });
      } catch (error: any) {
        expect(error.message).toBe('Overflow transitions');
      }
    });
  });

  describe('Conditional transitions avoiding overflow', () => {
    test('07 -> Async ping-pong breaks with guard before overflow', async () => {
      const machine = createLogic(
        {
          initial: 'idle',
          data: 'returnCounter',
          states: {
            idle: {
              always: 'stateA',
            },
            stateA: {
              invoke: {
                src: 'processA',
                then: [
                  {
                    cond: 'shouldStop',
                    target: 'final',
                  },
                  'stateB',
                ],
                catch: 'error',
              },
            },
            stateB: {
              invoke: {
                src: 'processB',
                then: 'stateA',
                catch: 'error',
              },
            },
            final: {
              data: 'returnCounter',
            },
            error: {
              data: 'returnCounter',
            },
          },
        },
        {
          context: {} as Context,
          events: {} as Events,
          data: {} as number,
          promises: {} as {
            processA: { data: void; error: never };
            processB: { data: void; error: never };
          },
        },
      ).provideOptions({
        promises: {
          processA: async (ctx: Context) => {
            ctx.counter++;
          },
          processB: async (ctx: Context) => {
            ctx.counter++;
          },
        },
        guards: {
          shouldStop: (ctx: Context) => ctx.counter >= 10,
        },
        datas: {
          returnCounter: (ctx: Context) => ctx.counter,
        },
      });

      const process = interpret(machine, {
        context: { counter: 0, iterations: 0 },
        overflow: 50,
      });

      const result = await process({ increment: 1 });
      expect(result).toBe(11);
    });

    test('08 -> Guard on stateB of ping-pong exits gracefully', async () => {
      const machine = createLogic(
        {
          initial: 'idle',
          data: 'returnCounter',
          states: {
            idle: {
              always: 'stateA',
            },
            stateA: {
              invoke: {
                src: 'processA',
                then: 'stateB',
                catch: 'error',
              },
            },
            stateB: {
              invoke: {
                src: 'processB',
                then: [
                  {
                    cond: 'shouldFinish',
                    target: 'done',
                  },
                  'stateA',
                ],
                catch: 'error',
              },
            },
            done: {
              data: 'returnCounter',
            },
            error: {
              data: 'returnCounter',
            },
          },
        },
        {
          context: {} as Context,
          events: {} as Events,
          data: {} as number,
          promises: {} as {
            processA: { data: void; error: never };
            processB: { data: void; error: never };
          },
        },
      ).provideOptions({
        promises: {
          processA: async (ctx: Context) => {
            ctx.counter += 2;
          },
          processB: async (ctx: Context) => {
            ctx.counter += 3;
          },
        },
        guards: {
          shouldFinish: (ctx: Context) => ctx.counter >= 15,
        },
        datas: {
          returnCounter: (ctx: Context) => ctx.counter,
        },
      });

      const process = interpret(machine, {
        context: { counter: 0, iterations: 0 },
        overflow: 100,
      });

      const result = await process({ increment: 1 });
      expect(result).toBeGreaterThanOrEqual(15);
    });
  });

  describe('Complex async scenarios with overflow', () => {
    test('09 -> Three-state circular async pattern triggers overflow', async () => {
      const machine = createLogic(
        {
          initial: 'idle',
          data: 'returnCounter',
          states: {
            idle: {
              always: 'state1',
            },
            state1: {
              invoke: {
                src: 'async1',
                then: 'state2',
                catch: 'error',
              },
            },
            state2: {
              invoke: {
                src: 'async2',
                then: 'state3',
                catch: 'error',
              },
            },
            state3: {
              invoke: {
                src: 'async3',
                then: 'state1',
                catch: 'error',
              },
            },
            error: {
              data: 'returnCounter',
            },
          },
        },
        {
          context: {} as Context,
          events: {} as Events,
          data: {} as number,
          promises: {} as {
            async1: { data: void; error: never };
            async2: { data: void; error: never };
            async3: { data: void; error: never };
          },
        },
      ).provideOptions({
        promises: {
          async1: async (ctx: Context) => {
            ctx.counter += 1;
          },
          async2: async (ctx: Context) => {
            ctx.counter += 2;
          },
          async3: async (ctx: Context) => {
            ctx.counter += 3;
          },
        },
        datas: {
          returnCounter: (ctx: Context) => ctx.counter,
        },
      });

      const process = interpret(machine, {
        context: { counter: 0, iterations: 0 },
        overflow: 15,
      });

      await expect(process({ increment: 1 })).rejects.toThrow(
        'Overflow transitions',
      );
    });

    test('10 -> Delayed async promises in ping-pong still trigger overflow', async () => {
      const machine = createLogic(
        {
          initial: 'idle',
          data: 'returnCounter',
          states: {
            idle: {
              always: 'delayedA',
            },
            delayedA: {
              invoke: {
                src: 'delayedPromiseA',
                then: 'delayedB',
                catch: 'error',
              },
            },
            delayedB: {
              invoke: {
                src: 'delayedPromiseB',
                then: 'delayedA',
                catch: 'error',
              },
            },
            error: {
              data: 'returnCounter',
            },
          },
        },
        {
          context: {} as Context,
          events: {} as Events,
          data: {} as number,
          promises: {} as {
            delayedPromiseA: { data: void; error: never };
            delayedPromiseB: { data: void; error: never };
          },
        },
      ).provideOptions({
        promises: {
          delayedPromiseA: async (ctx: Context) => {
            await new Promise(resolve => setTimeout(resolve, 10));
            ctx.counter++;
          },
          delayedPromiseB: async (ctx: Context) => {
            await new Promise(resolve => setTimeout(resolve, 5));
            ctx.counter += 2;
          },
        },
        datas: {
          returnCounter: (ctx: Context) => ctx.counter,
        },
      });

      const process = interpret(machine, {
        context: { counter: 0, iterations: 0 },
        overflow: 8,
      });

      const startTime = Date.now();

      await expect(process({ increment: 1 })).rejects.toThrow(
        'Overflow transitions',
      );

      const duration = Date.now() - startTime;
      expect(duration).toBeGreaterThanOrEqual(30);
    });
  });

  describe('Edge cases', () => {
    test('11 -> Async overflow with limit of 2 - ping-pong fails immediately', async () => {
      const machine = createLogic(
        {
          initial: 'idle',
          data: 'returnValue',
          states: {
            idle: {
              always: 'asyncA',
            },
            asyncA: {
              invoke: {
                src: 'processA',
                then: 'asyncB',
                catch: 'error',
              },
            },
            asyncB: {
              invoke: {
                src: 'processB',
                then: 'asyncA',
                catch: 'error',
              },
            },
            error: {
              data: 'returnValue',
            },
          },
        },
        {
          context: {} as Context,
          events: {} as Events,
          data: {} as string,
          promises: {} as {
            processA: { data: void; error: never };
            processB: { data: void; error: never };
          },
        },
      ).provideOptions({
        promises: {
          processA: async () => {},
          processB: async () => {},
        },
        datas: {
          returnValue: () => 'overflow',
        },
      });

      const process = interpret(machine, {
        context: { counter: 0, iterations: 0 },
        overflow: 2,
      });

      await expect(process({ increment: 1 })).rejects.toThrow(
        'Overflow transitions',
      );
    });

    test('12 -> No overflow with sufficient limit and proper async exit', async () => {
      const machine = createLogic(
        {
          initial: 'idle',
          data: 'returnCounter',
          states: {
            idle: {
              always: 'processA',
            },
            processA: {
              invoke: {
                src: 'simpleProcessA',
                then: 'processB',
                catch: 'error',
              },
            },
            processB: {
              invoke: {
                src: 'simpleProcessB',
                then: 'done',
                catch: 'error',
              },
            },
            done: {
              data: 'returnCounter',
            },
            error: {
              data: 'returnCounter',
            },
          },
        },
        {
          context: {} as Context,
          events: {} as Events,
          data: {} as number,
          promises: {} as {
            simpleProcessA: { data: void; error: never };
            simpleProcessB: { data: void; error: never };
          },
        },
      ).provideOptions({
        promises: {
          simpleProcessA: async (ctx: Context) => {
            ctx.counter = 42;
          },
          simpleProcessB: async (ctx: Context) => {
            ctx.counter += 8;
          },
        },
        datas: {
          returnCounter: (ctx: Context) => ctx.counter,
        },
      });

      const process = interpret(machine, {
        context: { counter: 0, iterations: 0 },
        overflow: 100,
      });

      const result = await process({ increment: 1 });
      expect(result).toBe(50);
    });
  });
});
