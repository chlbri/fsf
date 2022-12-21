import reduceGuards, { GuardDefs, GuardDefUnion } from '@bemedev/x-guard';
import merge from 'deepmerge';
import { identity, isFinalState, isFinalStateDefinition } from './helpers';
import type {
  CloneArgs,
  ExtractFunction,
  ExtractFunctionProps,
  MarchineArgs,
  NextFunction,
  PropsExtractorTransition,
} from './Machine.types';
import type {
  Config,
  Guards,
  GuardUnion,
  Options,
  SAS,
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
> {
  // #region Props
  #initialContext: string;
  #states: StateDefinition<TA, TC, R>[];
  #initial: string;
  #config: Config<TA, TC, R>;
  #options?: Options<TA, TC, R>;
  #errors: string[] = [];

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

  #extractFunction = <TC extends object = object, TA = any>({
    options,
    source,
    __keys,
  }: ExtractFunctionProps<TC, TA>): ExtractFunction<TC, TA> => {
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
  }: PropsExtractorTransition<TC, TA>): TransitionDefinition<TC, TA>[] => {
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

  #buildStates = (
    config: Config<TA, TC, R>,
    options?: Options<TA, TC, R>,
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
          always,
        });
      }
    }
    return states;
  };
  // #endregion

  constructor(config: Config<TA, TC, R>, options?: Options<TA, TC, R>) {
    // #region Initialize props
    this.#states = this.#buildStates(config, options);
    this.#initial = config.initial;
    this.#config = config;
    this.#options = options;
    // #endregion
    this.#initialContext = JSON.stringify(config.context);
  }

  /**
   * Use internally to get the props
   */
  get props(): Omit<MarchineArgs<TA, TC, R>, 'context'> {
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
  }: CloneArgs<TA, TC, R>) => {
    const _config = merge(this.#config, (config ??= {}));
    const _options = merge(
      (this.#options ??= {}),
      (options ??= {}),
    ) as Options<TA, TC, R>;
    return new Machine(_config, _options);
  };

  get clone() {
    const context = JSON.parse(this.#initialContext);
    const config = merge(this.#config, { context });
    return this.cloneWithValues({ config });
  }

  readonly withOptions = (
    options: Required<MarchineArgs<TA, TC, R>>['options'],
  ) => {
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
    const _events = Object.freeze(events) as any;
    let hasNext = true;
    if (isFinalStateDefinition(current)) {
      current.entry.forEach(entry => entry(context, _events));
      data = current.data(context, _events);
      hasNext = false;
    } else {
      current.entry.forEach(entry => entry(context, _events));

      for (const transition of current.always) {
        const _cond = transition.cond;
        if (_cond) {
          const check = _cond(context, _events);
          if (!check) continue;
        }
        transition.actions.forEach(action => action(context, _events));

        state = transition.target;
        break;
      }

      current.exit.forEach(entry => entry(context, _events));
    }
    return { state, context, data, hasNext };
  };
}
