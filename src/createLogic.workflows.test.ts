import { describe, expect, test } from 'vitest';
import { createConfig, createLogic } from './createLogic';
import { interpret } from './interpret';

describe('#1: explicit returns, (tidious guards)', () => {
  const machine = createLogic(
    {
      schema: {
        events: {} as { val: number } | null,
        context: {} as { val: number },
        data: {} as number,
      },
      context: { val: 4 },
      initial: 'idle',
      states: {
        idle: {
          always: {
            target: 'calc',
          },
        },
        calc: {
          always: {
            target: 'final',
            actions: ['action'],
          },
        },
        final: {
          data: 'val',
        },
      },
    },
    {
      actions: {
        action: (ctx: { val: number }, arg = { val: 3 }) => {
          ctx.val = ctx.val + arg.val;
          arg.val = 200;
        },
      },
      guards: {},
      datas: {
        val: ctx => ctx.val,
      },
      unFreezeArgs: true,
    },
  );
  const func = interpret(machine);
  test('#1: 3 => 7', () => {
    expect(func()).toEqual(7);
  });

  test('#2: 10 => 14', () => {
    const arg = { val: 10 };
    expect(func(arg)).toEqual(14);
    expect(arg.val).toEqual(200);
  });
});

describe('#2: explicit returns, (tidious guards), try to modify freezedArgs returns errors', () => {
  const machine = createLogic(
    {
      schema: {
        events: {} as { val: number } | null,
        context: {} as { val: number },
        data: {} as number,
      },
      context: { val: 4 },
      initial: 'idle',
      states: {
        idle: {
          always: {
            target: 'calc',
          },
        },
        calc: {
          always: {
            target: 'final',
            actions: ['action'],
          },
        },
        final: {
          data: 'val',
        },
      },
    },
    {
      actions: {
        action: (ctx: { val: number }, arg = { val: 3 }) => {
          ctx.val = ctx.val + arg.val;
          arg.val = 200;
        },
      },
      guards: {},
    },
  );
  const func = interpret(machine);
  test('#2: 10 => 14', () => {
    const arg = { val: 10 };
    const safe = () => func(arg);
    expect(safe).not.toThrowError(
      `Cannot assign to read only property 'val' of object '#<Object>'⁠`,
    );
  });
});

describe('Async', () => {
  type Context = {
    userId?: string;
    connected?: boolean;
    iterator: number;
    errors: string[];
  };

  type Events = { login: string; password: string };

  const DB: Events[] = [
    {
      login: 'login1',
      password: 'password1',
    },
    {
      login: 'login2',
      password: 'password2',
    },
  ];

  describe('Workflow #1', () => {
    // #region Preparation
    const config = createConfig({
      schema: {
        context: {} as Context,
        events: {} as Events,
        data: {} as string,
        promises: {} as {
          fetch: { data: string; error: any };
        },
      },
      // TODO: Permits to undifined context when it is deeply partial
      context: { iterator: 0, errors: [] },
      initial: 'idle',
      states: {
        idle: {
          always: 'fetch',
        },
        fetch: {
          entry: 'iterate',
          invoke: {
            src: 'fetch',
            then: {
              target: 'done',
              actions: 'assignConnection',
            },
            catch: {
              target: 'error',
              actions: 'addConnectionError',
            },
          },
        },
        done: {
          entry: 'iterate',
          data: 'sendID',
        },
        error: {
          entry: 'iterate',
          data: 'sendID',
        },
      },
    });

    const machine = createLogic(config, {
      actions: {
        iterate: ctx => {
          ctx.iterator++;
        },
        assignConnection: (ctx, data) => {
          ctx.userId = data as any;
        },
        addConnectionError: (ctx, data) => {
          ctx.errors.push(data as any);
          ctx.userId = data as any;
        },
      },
      promises: {
        fetch: async (_, { login, password }) => {
          const out = DB.find(
            value => value.login === login && value.password === password,
          );
          if (!out) {
            throw 'noID';
          }
          return out.login;
        },
      },
      datas: {
        sendID: ctx => ctx.userId!,
      },
    });

    const getUserID = interpret(machine);
    // #endregion

    test('01 -> Returns ID if ids are in DB', async () => {
      const id = await getUserID(DB[0]);
      expect(id).toBe(DB[0].login);
    });

    test('02 -> Returns "noID" if ids are in DB', async () => {
      const id = await getUserID({
        login: 'notLogin',
        password: 'noPass',
      });
      expect(id).toBe('noID');
    });
  });
});
