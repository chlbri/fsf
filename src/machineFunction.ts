import cloneDeep from 'lodash.clonedeep';
import { isFinalStateDefinition } from './helpers';
import type { Config, Options, StateDefinition } from './types';

type MarchineArgs<
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

//TODO: Create a test library
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
  #context: TC;
  readonly #overflow: number;
  #config: Config<TA, TC, R>;
  #options?: Options<TA, TC, R>;
  #currentState!: StateDefinition<TA, TC>;
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
    this.#context = context;
    this.#overflow = overflow;
    this.#config = config;
    this.#options = options;
    // this.#test = test;

    // #endregion

    this.#initialContext = cloneDeep(context);
    Object.freeze(this.#initialContext);
    this._initializeStates();
  }

  get #props() {
    return {
      _states: this.#states,
      initial: this.#initial,
      context: this.#context,
      overflow: this.#overflow,
      config: this.#config,
      options: this.#options,
      // test: this.#test,
    };
  }

  readonly cloneWithValues = (props?: Partial<MarchineArgs<TA, TC, R>>) =>
    new MachineFunction({ ...this.#props, ...props });

  // readonly matches = (value: string) => this.#currentState.value === value;

  get clone() {
    const context = cloneDeep(this.#initialContext);
    return this.cloneWithValues({ context });
  }

  // get cloneTest() {
  //   const context = cloneDeep(this.#initialContext);
  //   const test = true;
  //   return this.cloneWithValues({ test, context });
  // }

  protected _initializeStates = () => {
    const __allStates = this.#states;
    const initial = this.#initial;

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const findInitial = __allStates.find(
      state => state.value === initial,
    )!;
    this.#currentState = findInitial;

    // this.#test && this.enteredStates.push(this.#currentState.value);
  };

  protected _setCurrentState = (value: string) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const out = this.#states.find(_state => _state.value === value)!;
    this.#currentState = out;
    // this.#test && this.enteredStates.push(out.value);
  };

  #next = () => {
    const current = { ...this.#currentState };
    const events = this.#clonedEvents;
    if (isFinalStateDefinition(current)) {
      current.entry.forEach(entry => entry(this.#context, events));
      this.#data = current.data(this.#context, events);
      this.#hasNext = false;
    } else {
      current.entry.forEach(entry => entry(this.#context, events));

      for (const transition of current.always) {
        const _cond = transition.cond;
        if (_cond) {
          const check = _cond({ ...this.#context }, events);
          if (!check) continue;
        }
        transition.actions.forEach(action =>
          action(this.#context, events),
        );

        this._setCurrentState(transition.target);
        break;
      }

      current.exit.forEach(entry => entry(this.#context, events));
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
    this.#context = cloneDeep(this.#initialContext);
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
