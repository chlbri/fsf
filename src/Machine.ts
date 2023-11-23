import reduceGuards, { GuardDefUnion, GuardDefs } from '@bemedev/x-guard';
import merge from 'deepmerge';
import type {
  CloneArgs,
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
  isFinalState,
  isFinalStateDefinition,
  isPromiseState,
  isPromiseStateDefinition,
  isSimpleStateDefinition,
} from './helpers';
import type {
  Config,
  GuardUnion,
  Guards,
  Options,
  OptionsM,
  PromiseStateDefinition,
  SAS,
  SRCDefinition,
  State,
  StateDefinition,
  StateFunction,
  TransitionDefinition,
  Undy,
} from './types';

/**
 * @class Class representing a machine function
 *
 * Implements syntax of {@link XState https://xstate.js.org/docs/guides/states.html#state-nodes}
 */
export class Machine<
  TA = any,
  TC extends Record<string, unknown> = Record<string, unknown>,
  R = TC,
  S extends Record<string, { data: any; error: any }> = Record<
    string,
    { data: any; error: any }
  >,
  ST extends Record<string, State> = Record<string, State>,
  Async extends boolean = false,
> {
  // #region Props
  #initialContext: string;
  #states: StateDefinition<TA, TC, R>[];
  #initial: string;
  #config: Config<TA, TC, R>;
  #options: OptionsM<TA, TC, R, Async>;
  #errors: string[] = [];
  #unFreezeArgs: boolean;

  // #endregion

  // #region Getters
  get __config() {
    return this.#config;
  }

  get __options() {
    return this.#options;
  }

  get __initialContext() {
    return this.#initialContext;
  }

  get errors() {
    return this.#errors;
  }

  get hasErrors() {
    return this.errors.length > 0;
  }

  get safe() {
    if (this.hasErrors) {
      throw new Error(this.errors[0]);
    }
    return this;
  }
  // #endregion

  // #region Buiilding states
  #assignGuardsUnion = <TA = any, TC extends object = object, R = any>(
    values: GuardUnion[],
    guards: Required<Options<TA, TC, R>>['guards'],
  ): GuardDefUnion<Undy<TA>, TC>[] => {
    return values.reduce((acc: GuardDefUnion<Undy<TA>, TC>[], value) => {
      if (typeof value === 'string') {
        const guard = guards[value];
        acc.push(guard);
      } else {
        const _guards = this.#assignGuards(value, guards);
        acc.push(_guards as any);
      }
      return acc;
    }, []);
  };

  #assignGuards = <TA = any, TC extends object = object, R = any>(
    values?: Guards,
    guards?: Options<TA, TC, R>['guards'],
  ): GuardDefs<Undy<TA>, TC> | undefined => {
    if (!values) {
      return;
    }
    if (!guards) {
      this.#errors.push('No guards provided');
      return;
    }
    if (typeof values === 'string') {
      const guard = guards[values];
      if (!guard) {
        this.#errors.push(`Guard "${values}" is not provided`);
        return;
      }
      return guard;
    }
    if ('and' in values) {
      const _and = values.and;
      if (Array.isArray(_and)) {
        const and = this.#assignGuardsUnion(_and, guards);
        return { and };
      } else {
        const and = this.#assignGuardsUnion([_and], guards);
        return { and };
      }
    }
    if ('or' in values) {
      const _or = values.or;
      if (Array.isArray(_or)) {
        const or = this.#assignGuardsUnion(_or, guards);
        return { or };
      } else {
        const or = this.#assignGuardsUnion([_or], guards);
        return { or };
      }
    }
    return this.#assignGuardsUnion(values, guards);
  };

  #extractActions = <TC = any, TA = any>(
    strings?: SAS,
    actions?: Options<TA, TC>['actions'],
  ): StateFunction<TC, TA, void>[] => {
    const functions: StateFunction<TC, TA, void>[] = [];
    if (!strings) {
      // this.#errors.push('No actions');
      return functions;
    }
    if (Array.isArray(strings)) {
      const _actions = strings
        .map(str => this.#extractActions(str, actions))
        .flat();
      functions.push(..._actions);
    } else {
      const action = actions?.[strings];
      if (!action) {
        this.#errors.push(`Action ${strings} is not provided`);
      } else {
        functions.push(action);
      }
    }
    return functions;
  };

  #extractFunction = <TC extends object = object, TA = any, R = any>({
    options,
    source,
    __keys,
  }: ExtractFunctionProps<TC, TA, R, Async>): ExtractFunction<TC, TA> => {
    return transition => {
      if (typeof transition === 'string') {
        const target = transition;
        const check = __keys.includes(target);
        if (!check) {
          this.#errors.push(`State ${target} is not defined`);
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
        this.#errors.push(`State ${target} is not defined`);
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

  #extractTransitions = <TC extends object = object, TA = any>({
    source,
    always,
    options,
    __keys,
  }: PropsExtractorTransition<TC, TA, R, Async>): TransitionDefinition<
    TC,
    TA
  >[] => {
    const functions: TransitionDefinition<TC, TA>[] = [];
    const extractor = this.#extractFunction({
      source,
      __keys,
      options,
    });
    if (Array.isArray(always)) {
      functions.push(...always.map(extractor));
    } else {
      functions.push(extractor(always));
    }
    return functions;
  };

  #extractPromise = <R>(
    value: string,
    promises?: Options<TA, TC, R>['promises'],
  ): StateFunction<TC, TA, Promise<R>> | undefined => {
    const action = promises?.[value];
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
  }: PropsExtractorPromise<TC, TA, R, Async>) {
    const _promises: SRCDefinition<TA, TC, R>[] = [];
    if (Array.isArray(promises)) {
      const _actions = promises
        .map(promises =>
          this.#extractPromises({
            source,
            __keys,
            promises,
            options,
          }),
        )
        .flat();

      _promises.push(..._actions);
    } else {
      const _finally = this.#extractActions(
        promises.finally,
        options?.actions,
      );
      const value = promises.src;

      const src = this.#extractPromise<R>(promises.src, options?.promises);

      const then = this.#extractTransitions({
        __keys,
        always: promises.then,
        source,
        options,
      });

      const _catch = this.#extractTransitions({
        __keys,
        always: promises.catch,
        source,
        options,
      });

      if (this.__options?.strict && !!src) {
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

  #buildStates = (
    config: Config<TA, TC, R>,
    options?: Options<TA, TC, R, Async>,
  ) => {
    // #region Props
    const initial = config.initial;
    const states: StateDefinition<TA, TC>[] = [];
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
        const data = options?.datas?.[state.data] ?? identity;

        states.push({
          value,
          entry,
          data,
        });
      } else if (isPromiseState(state)) {
        const source = value;

        const promises = this.#extractPromises({
          source,
          __keys,
          promises: state.promises,
          options,
        });

        states.push({
          entry,
          promises,
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

  constructor(
    config: Config<TA, TC, R, S, ST>,
    options?: OptionsM<TA, TC, R, Async>,
  ) {
    // #region Initialize props
    this.#states = this.#buildStates(config, options);
    this.#initial = config.initial;
    this.#config = config;
    this.#options = options ?? { async: false as Async };
    this.#unFreezeArgs = options?.unFreezeArgs ?? false;
    // #endregion
    this.#initialContext = JSON.stringify(config.context);
  }

  /**
   * Use internally to get the props
   */
  get props(): Omit<MarchineArgs<TA, TC, R, Async>, 'context'> {
    return {
      _states: this.#states,
      initial: this.#initial,
      config: this.#config,
      options: this.#options,
    };
  }

  readonly cloneWithValues = ({
    config,
    options,
  }: CloneArgs<TA, TC, R, Async>) => {
    const _config = merge(this.#config, (config ??= {}));
    const _options = merge(
      (this.#options ??= { async: false as Async }),
      options ?? { async: false },
    ) as OptionsM<TA, TC, R, Async>;
    return new Machine(_config, _options);
  };

  get clone() {
    const context = JSON.parse(this.#initialContext);
    const config = merge(this.#config, { context });
    return this.cloneWithValues({ config });
  }

  readonly withOptions = (options: OptionsM<TA, TC, R, Async>) => {
    return this.cloneWithValues({ options });
  };

  readonly withContext = (context: TC) => {
    const config = { context };
    return this.cloneWithValues({ config });
  };

  #searchState = (state: string) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const _state = this.#states.find(s => s.value === state)!;
    return _state;
  };

  /**
   * Returns the next state
   *
   * Warning: This function is not pure, only use a inline context
   */
  readonly next: NextFunction<TA, TC, R> = ({
    events,
    state,
    context,
  }) => {
    const current = this.#searchState(state);
    let data: R | undefined = undefined;
    const _events = this.#unFreezeArgs
      ? events
      : (Object.freeze(events) as any);
    let hasNext = true;
    if (isFinalStateDefinition(current)) {
      current.entry.forEach(entry => entry(context, _events));
      data = current.data(context, _events);
      hasNext = false;
    } else if (isSimpleStateDefinition(current)) {
      current.entry.forEach(entry => entry(context, _events));

      state = this.#runTransitions(
        current.transitions,
        context,
        _events,
        state,
      );
      current.exit.forEach(entry => entry(context, _events));
    }
    state; //?
    return { state, context, data, hasNext };
  };

  /**
   * Returns the next state
   *
   * Warning: This function is not pure, only use a inline context
   */
  readonly nextAsync: NextFunctionAsync<TA, TC, R> = async ({
    events,
    state,
    context,
  }) => {
    const current = this.#searchState(state);
    let data: R | undefined = undefined;
    const _events = this.#unFreezeArgs
      ? events
      : (Object.freeze(events) as any);

    let hasNext = true;
    this.#states[1]; //?
    if (isPromiseStateDefinition(current)) {
      state = await this.#resolveStatePromise(
        current,
        context,
        _events,
        state,
      );
      state; //?
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
      state = _state;
    }
    return { state, context, data, hasNext };
  };

  #runTransitions(
    transitions: TransitionDefinition<TC, TA>[],
    context: TC,
    _events: any,
    state: string,
  ) {
    for (const transition of transitions) {
      const _cond = transition.cond;
      if (_cond) {
        const check = _cond(context, _events);
        if (!check) continue;
      }
      transition.actions.forEach(action => action(context, _events));

      state = transition.target;
      break;
    }
    return state;
  }

  async #resolveStatePromise(
    current: PromiseStateDefinition<TA, TC, any>,
    context: TC,
    _events: any,
    state: string,
  ) {
    current.entry.forEach(entry => entry(context, _events));

    for await (const promise of current.promises) {
      const { src, catch: _catch, then, finally: _finally } = promise;
      if (src) {
        await src(context, _events)
          .then(awaited => {
            state = this.#runTransitions(then, context, awaited, state);
          })
          .catch(reason => {
            state = this.#runTransitions(_catch, context, reason, state);
          })
          .finally(() => {
            _finally.forEach(entry => entry(context, _events));
          });
      }
    }
    return state;
  }
}

export type ExtractTypestateFromMachine<C extends Machine> =
  C extends Machine<any, any, any, any, infer A> ? A : never;
