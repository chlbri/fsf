import { interpret } from '../../interpreter';
import { createLogic } from '../../Machine';

describe('#2: explicit returns, (tidious guards), try to modify freezedArgs returns errors', () => {
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

    const machine = createLogic(
      {
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
      },
      {
        context: {} as Context,
        events: {} as Events,
        data: {} as string,
        promises: {} as {
          fetch: { data: string; error: any };
        },
      },
    ).provideOptions({
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

    const getUserID = interpret(machine, {
      context: { iterator: 0, errors: [] },
    });
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
