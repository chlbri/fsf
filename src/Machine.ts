import reduceGuards, { GuardDefs, GuardDefUnion } from '@bemedev/x-guard';

import type {
  ExtractFunction,
  ExtractFunctionProps,
  MarchineArgs,
  NextFunction,
  NextFunctionAsync,
  PropsExtractorPromise,
  PropsExtractorTransition,
} from './Machine.types';

import {
  identity,
  isAsync,
  isFinalState,
  isFinalStateDefinition,
  isPromiseState,
  isPromiseStateDefinition,
  isReadonlyArray,
  isSimpleStateDefinition,
} from './helpers';

import type {
  Config,
  ConfigDef,
  ConfigTypes,
  Guards,
  GuardUnion,
  NoExtraKeysConfigDef,
  Options,
  PromiseStateDefinition,
  SAS,
  SRCDefinition,
  StateDefinition,
  StateFunction,
  TransformConfigDef,
  TransitionDefinition,
  Undy,
} from './types';

/**
 * @class Class representing a machine function
 *
 * Implements syntax of {@link XState https://xstate.js.org/docs/guides/states.html#state-nodes}
 */
class Machine<
  const C extends Config = Config,
  const T extends ConfigTypes<C> = ConfigTypes<C>,
> {
  // #region Props
  #states: StateDefinition<T['events'], T['context'], T['data']>[] = [];
  #initial: string;
  #config: C;
  readonly __types: T;
  #options: Options<C, T> = {};
  #errors: string[] = [];
  #unFreezeArgs!: boolean;

  // #endregion

  // #region Getters
  get __config() {
    return this.#config;
  }

  get __options() {
    return this.#options;
  }

  get errors() {
    return this.#errors;
  }

  get hasErrors() {
    return this.errors.length > 0;
  }

  get safe() {
    if (this.hasErrors) {
      console.error('errors =>', this.#errors);
      throw new Error(this.#errors[0]);
    }
    return this;
  }

  get async() {
    return isAsync(this.#config);
  }
  // #endregion

  // #region Building states
  #assignGuardsUnion = (
    values: readonly GuardUnion[],
    guards: Required<Options<C, T>>['guards'],
  ): GuardDefUnion<Undy<T['events']>, T['context']>[] => {
    return values.reduce(
      (acc: GuardDefUnion<Undy<T['events']>, T['context']>[], value) => {
        if (typeof value === 'string') {
          const guard = (guards as any)[value];
          acc.push(guard);
        } else {
          const _guards = this.#assignGuards(value, guards);
          if (_guards) acc.push(_guards as any);
        }
        return acc;
      },
      [],
    );
  };

  #assignGuards = (
    values?: Guards,
    guards?: Options<C, T>['guards'],
  ): GuardDefs<Undy<T['events']>, T['context']> | undefined => {
    if (!values) return;
    if (!guards) {
      this.#errors.push('No guards provided');
      return;
    }
    if (typeof values === 'string') {
      const guard = (guards as any)[values];
      if (!guard) {
        this.#errors.push(`Guard "${values}" is not provided`);
        return;
      }
      return guard;
    }
    if ('and' in values) {
      const _and = values.and;
      if (isReadonlyArray(_and)) {
        const and = this.#assignGuardsUnion(_and, guards);
        return { and };
      } else {
        const and = this.#assignGuardsUnion([_and as any], guards);
        return { and };
      }
    }
    if ('or' in values) {
      const _or = values.or;
      if (isReadonlyArray(_or)) {
        const or = this.#assignGuardsUnion(_or, guards);
        return { or };
      } else {
        const or = this.#assignGuardsUnion([_or as any], guards);
        return { or };
      }
    }
    return this.#assignGuardsUnion(values as any, guards);
  };

  #extractActions = (
    strings?: SAS,
    actions?: Options<C, T>['actions'],
  ): StateFunction<T['context'], T['events'], void>[] => {
    const functions: StateFunction<T['context'], T['events'], void>[] = [];
    if (!strings) return functions;

    if (isReadonlyArray(strings)) {
      const _actions = strings
        .map(str => this.#extractActions(str, actions))
        .flat();
      functions.push(..._actions);
    } else {
      const action = (actions as any)?.[strings];

      if (!action) {
        this.#errors.push(`Action ${strings} is not provided`);
      } else {
        functions.push(action);
      }
    }
    return functions;
  };

  #extractFunction = ({
    options,
    source,
    __keys,
  }: ExtractFunctionProps<C, T>): ExtractFunction<
    T['context'],
    T['events']
  > => {
    return transition => {
      if (typeof transition === 'string') {
        const target = transition;
        const check = __keys.includes(target);
        if (!check) {
          this.#errors.push(`State "${target}" is not defined`);
        }

        if (source === transition) {
          this.#errors.push(`Cannot transit to himself : ${target}`);
        }
        return {
          source,
          actions: [],
          target,
        };
      }

      const target = transition.target;
      const check = __keys.includes(target);
      if (!check) {
        this.#errors.push(`State "${target}" is not defined`);
      }

      if (source === target) {
        this.#errors.push(`Cannot transit to himself : ${target}`);
      }

      const description = transition.description;
      const actions = this.#extractActions(
        transition.actions,
        options?.actions,
      );
      const conds = this.#assignGuards(transition.cond, options?.guards);
      const cond = reduceGuards(conds);

      return {
        source,
        actions,
        cond,
        target,
        description,
      };
    };
  };

  #extractTransitions = ({
    source,
    always,
    options,
    __keys,
  }: PropsExtractorTransition<C, T>): TransitionDefinition<
    T['context'],
    T['events']
  >[] => {
    const functions: TransitionDefinition<T['context'], T['events']>[] =
      [];
    const extractor = this.#extractFunction({
      source,
      __keys,
      options,
    });

    if (isReadonlyArray(always)) {
      functions.push(...always.map(extractor));
    } else {
      functions.push(extractor(always));
    }
    return functions;
  };

  #extractPromise = (
    value: string,
    promises?: Options<C, T>['promises'],
  ):
    | StateFunction<T['context'], T['events'], Promise<any>>
    | undefined => {
    const action = (promises as any)?.[value];
    if (!action) {
      this.#errors.push(`Promise ${value} is not provided`);
    }

    return action;
  };

  #extractPromises<R = any>({
    source,
    __keys,
    promises,
    options,
  }: PropsExtractorPromise<C, T>): SRCDefinition<
    T['events'],
    T['context'],
    R
  >[] {
    const _promises: SRCDefinition<T['events'], T['context'], R>[] = [];
    if (isReadonlyArray(promises)) {
      const _actions = promises
        .map(promises => {
          const args = {
            source,
            __keys,
            promises,
            options,
          } as any;
          return this.#extractPromises(args);
        })
        .flat();

      _promises.push(..._actions);
    } else {
      const _finally = this.#extractActions(
        promises.finally,
        options?.actions,
      );
      const value = promises.src;

      const src = this.#extractPromise(promises.src, options?.promises);

      const argsThen = {
        __keys,
        always: promises.then,
        source,
        options,
      } as any;

      const then = this.#extractTransitions(argsThen);

      const argsCatch = {
        __keys,
        always: promises.catch,
        source,
        options,
      } as any;

      const _catch = this.#extractTransitions(argsCatch);

      if (!src) {
        this.#errors.push(`Promise "${promises.src}" is not defined`);
      }

      _promises.push({
        catch: _catch,
        finally: _finally,
        src,
        then,
        value,
      });
    }
    return _promises;
  }

  readonly #buildStates = (config: C, options?: Options<C, T>) => {
    // #region Props
    const initial = config.initial;
    const states: StateDefinition<T['events'], T['context']>[] = [];
    const __states = Object.entries(config.states);
    const __keys = Object.keys(config.states);
    // #endregion

    if (__states.length < 1) {
      this.#errors.push('No states');
    }

    if (!__keys.includes(initial)) {
      this.#errors.push(`No initial state : ${initial}`);
    }

    for (const [value, state] of __states) {
      const entry = this.#extractActions(state.entry, options?.actions);
      if (isFinalState(state)) {
        const data = (options as any)?.datas?.[state.data] ?? identity;

        states.push({
          value,
          entry,
          data,
        });
      } else if (isPromiseState(state)) {
        const source = value;

        const promises = this.#extractPromises({
          source,
          promises: state.invoke,
          options,
          __keys,
        } as any);

        states.push({
          entry,
          invoke: promises,
          value,
        });
      } else {
        const source = value;
        const always = this.#extractTransitions({
          source,
          always: state.always,
          options,
          __keys,
        });

        const exit = this.#extractActions(state.exit, options?.actions);

        states.push({
          value,
          entry,
          exit,
          transitions: always,
        });
      }
    }
    return states;
  };
  // #endregion

  constructor(config: C, types: T) {
    // #region Initialize props
    this.#config = config;
    this.__types = types;
    this.#initial = config.initial;
    this.#addOptions(this.#options);
    // #endregion
  }

  /**
   * Use internally to get the props
   */
  get props(): Omit<MarchineArgs<C, T>, 'context'> {
    return {
      _states: this.#states,
      initial: this.#initial,
      config: this.#config,
      options: this.#options,
    } as any;
  }

  get clone() {
    const out = new Machine(this.#config, this.__types) as unknown as this;
    if (this.#options) out.#addOptions(this.#options);
    return out;
  }

  #searchState = (state: string) => {
    const _state = this.#states.find(s => s.value === state);
    return _state!;
  };

  /**
   * Returns the next state
   *
   * Warning: This function is not pure, only use a inline context
   */
  readonly next: NextFunction<T['events'], T['context'], T['data']> = ({
    events,
    state,
    context,
  }) => {
    const current = this.#searchState(state);

    let data: T['data'] | undefined = undefined;
    const _events = this.#unFreezeArgs
      ? events
      : (Object.freeze(events) as any);
    let hasNext = false;
    let target: string | undefined = undefined;

    if (isFinalStateDefinition(current)) {
      current.entry.forEach(entry => entry(context, _events));
      data = current.data(context, _events);
    } else if (isSimpleStateDefinition(current)) {
      current.entry.forEach(entry => entry(context, _events));

      target = this.#runTransitions(current.transitions, context, _events);
      current.exit.forEach(entry => entry(context, _events));
      hasNext = target !== undefined;
    }

    return { state: target, context, data, hasNext };
  };

  /**
   * Returns the next state
   *
   * Warning: This function is not pure, only use a inline context
   */
  readonly nextAsync: NextFunctionAsync<
    T['events'],
    T['context'],
    T['data']
  > = async ({ events, state, context }) => {
    const current = this.#searchState(state);
    let data: T['data'] | undefined = undefined;
    const _events = this.#unFreezeArgs ? events : Object.freeze(events);
    let target: string | undefined = undefined;

    let hasNext = true;
    if (isPromiseStateDefinition(current)) {
      target = await this.#resolveStatePromise(current, context, _events);
    } else {
      const {
        data: _data,
        hasNext: _hasNext,
        state: _state,
      } = this.next({
        context,
        events,
        state,
      });

      data = _data;
      hasNext = _hasNext;
      target = _state;
    }
    return { state: target, context, data, hasNext };
  };

  #runTransitions(
    transitions: TransitionDefinition<T['context'], T['events']>[],
    context: T['context'],
    _events: any,
  ) {
    let target: string | undefined = undefined;
    for (const transition of transitions) {
      const _cond = transition.cond;
      if (_cond) {
        const check = _cond(context, _events);
        if (!check) continue;
      }
      transition.actions.forEach(action => action(context, _events));

      target = transition.target;
      break;
    }
    return target;
  }

  #resolveStatePromise = async (
    current: PromiseStateDefinition<T['events'], T['context'], any>,
    context: T['context'],
    _events: any,
  ): Promise<string | undefined> => {
    current.entry.forEach(entry => entry(context, _events));
    let target: string | undefined = undefined;

    for await (const promise of current.invoke) {
      const { src, catch: _catch, then, finally: _finally } = promise;
      if (src) {
        await src(context, _events)
          .then(awaited => {
            target = this.#runTransitions(then, context, awaited);
          })
          .catch(reason => {
            target = this.#runTransitions(_catch, context, reason);
          })
          .finally(() => {
            _finally.forEach(entry => entry(context, _events));
          });
      }
    }
    return target;
  };

  #addOptions = (options: Options<C, T>) => {
    this.#options = options;
    this.#unFreezeArgs = options.unFreezeArgs ?? false;
    this.#states = this.#buildStates(this.#config, options);
  };

  provideOptions = (options: Options<C, T>) => {
    const out = this.clone;
    out.#errors = [];
    out.#addOptions(options);
    return out;
  };
}

export { type Machine };

export type AnyMachine = {
  __config: any;
  __types: {
    context: any;
    events: any;
    data: any;
    promises?: any;
  };
  async: boolean;
};

export type CreateLogic_F = <
  const C2 extends
    NoExtraKeysConfigDef<ConfigDef> = NoExtraKeysConfigDef<ConfigDef>,
  const C extends Config & TransformConfigDef<C2> = Config &
    TransformConfigDef<C2>,
  const T extends ConfigTypes<C> & { context: object } = ConfigTypes<C> & {
    context: object;
  },
>(
  config: C & { __tsSchema?: NoExtraKeysConfigDef<C2> },
  types: T,
) => Machine<C, T>;

export const createLogic: CreateLogic_F = (config, types) => {
  const _machine = new Machine(config, types) as any;
  return _machine;
};
