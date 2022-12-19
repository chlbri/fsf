import cloneDeep from 'lodash.clonedeep';
import { isFinalStateDefinition } from './helpers';
import type { Config, Options, StateDefinition } from './types';

export type MarchineArgs<
  TA = any,
  TC extends Record<string, unknown> = Record<string, unknown>,
  R = TC,
> = {
  _states: StateDefinition<TA, TC, R>[];
  initial: string;
  context: TC;
  overflow?: number;
  config: Config<TA, TC, R>;
  options?: Options<TA, TC, R>;
  // test?: boolean;
};

/**
 * @class Class representing a machine function
 *
 * Implements syntax of {@link XState https://xstate.js.org/docs/guides/states.html#state-nodes}
 */
export class MachineFunction<
  TA = any,
  TC extends Record<string, unknown> = Record<string, unknown>,
  R = TC,
> {
  #events!: TA;
  readonly #initialContext: TC;

  // #region Props
  #states: StateDefinition<TA, TC, R>[];
  #data: R | undefined;
  #initial: string;
  protected _context: TC;
  readonly #overflow: number;
  #config: Config<TA, TC, R>;
  #options?: Options<TA, TC, R>;
  protected _currentState!: StateDefinition<TA, TC>;
  #hasNext = true;
  readonly enteredStates: string[] = [];

  // #endregion

  // #region Getters
  get __config() {
    return this.#config;
  }

  get __options() {
    return this.#options;
  }
  // #endregion

  constructor({
    _states,
    initial,
    context,
    overflow = 100,
    config,
    options,
  }: MarchineArgs<TA, TC, R>) {
    // #region Initialize props
    this.#states = _states;
    this.#initial = initial;
    this._context = context;
    this.#overflow = overflow;
    this.#config = config;
    this.#options = options;
    // #endregion

    this.#initialContext = cloneDeep(context);
    this._initializeStates();
  }

  /**
   * Use internally to get the props
   */
  get __props(): MarchineArgs<TA, TC, R> {
    return {
      _states: this.#states,
      initial: this.#initial,
      context: cloneDeep(this.#initialContext),
      overflow: this.#overflow,
      config: this.#config,
      options: this.#options,
    };
  }

  //ignore coverage
  get props(): MarchineArgs<TA, TC, R> {
    return Object.freeze(this.__props);
  }

  readonly cloneWithValues = (props?: Partial<MarchineArgs<TA, TC, R>>) =>
    new MachineFunction({ ...this.__props, ...props });

  get clone() {
    const context = cloneDeep(this.#initialContext);
    return this.cloneWithValues({ context });
  }

  protected _initializeStates = () => {
    Object.freeze(this.#initialContext);
    const __allStates = this.#states;
    const initial = this.#initial;

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const findInitial = __allStates.find(
      state => state.value === initial,
    )!;
    this._currentState = findInitial;
  };

  protected _setCurrentState = (value: string) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const out = this.#states.find(_state => _state.value === value)!;
    this._currentState = out;
  };

  #next = () => {
    const current = { ...this._currentState };
    const events = this.#clonedEvents;
    if (isFinalStateDefinition(current)) {
      current.entry.forEach(entry => entry(this._context, events));
      this.#data = current.data(this._context, events);
      this.#hasNext = false;
    } else {
      current.entry.forEach(entry => entry(this._context, events));

      for (const transition of current.always) {
        const _cond = transition.cond;
        if (_cond) {
          const check = _cond({ ...this._context }, events);
          if (!check) continue;
        }
        transition.actions.forEach(action =>
          action(this._context, events),
        );

        this._setCurrentState(transition.target);
        break;
      }

      current.exit.forEach(entry => entry(this._context, events));
    }
  };

  get #clonedEvents() {
    return cloneDeep(this.#events);
  }

  get data() {
    return this.#data; //?
  }

  #rinit = (events?: TA) => {
    this.#events = events ?? this.#events ?? ({} as TA);
    this.#hasNext = true;
    this._context = cloneDeep(this.#initialContext);
    this._setCurrentState(this.#initial);
    return 0;
  };

  readonly start = (events?: TA) => {
    let iterator = this.#rinit(events);

    while (this.#hasNext) {
      this.#next();
      iterator++;
      if (iterator >= this.#overflow) {
        throw new Error('Overflow transitions');
      }
    }
    return this.data;
  };

  readonly build = this.start;
}
