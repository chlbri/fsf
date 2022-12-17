import cloneDeep from 'lodash.clonedeep';
import { identity, isFinalStateDefinition } from './helpers';
import type { StateDefinition, UndefinyFunction } from './types';

type MarchineArgs<
  TA = any,
  TC extends Record<string, unknown> = Record<string, unknown>,
  R = TC,
> = {
  _states: StateDefinition<TA, TC, R>[];
  initial: string;
  context: TC;
  overflow?: number;
  test?: boolean;
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
  #args!: TA;
  readonly #initialContext: TC;

  // #region Props
  #states: StateDefinition<TA, TC, R>[];
  #data: R | undefined;
  #initial: string;
  #context: TC;
  readonly #overflow: number;
  #test: boolean;
  #currentState!: StateDefinition<TA, TC>;
  #hasNext = true;
  // #endregion

  constructor({
    _states,
    initial,
    context,
    overflow = 100,
    test = false,
  }: MarchineArgs<TA, TC, R>) {
    // #region Initialize props
    this.#states = _states;
    this.#initial = initial;
    this.#context = context;
    this.#overflow = overflow;
    this.#test = test;
    // #endregion

    this.#initialContext = cloneDeep(context);
    Object.freeze(this.#initialContext);
    this.#initializeStates();
  }

  get #props() {
    return {
      _states: this.#states,
      initial: this.#initial,
      context: this.#context,
      overflow: this.#overflow,
      test: this.#test,
    };
  }

  readonly cloneWithValues = (props?: Partial<MarchineArgs<TA, TC, R>>) =>
    new MachineFunction({ ...this.#props, ...props });

  readonly matches = (value: string) => this.#currentState.value === value;

  get clone() {
    const context = cloneDeep(this.#initialContext);
    return this.cloneWithValues({ context });
  }

  get cloneTest() {
    const context = cloneDeep(this.#initialContext);
    const test = true;
    return this.cloneWithValues({ test, context });
  }

  #initializeStates = () => {
    const __allStates = this.#states;
    const initial = this.#initial;
    if (__allStates.length < 1) throw 'No states';

    const findInitial = __allStates.find(state => state.value === initial);
    if (!findInitial) throw 'No initial state';

    this.#currentState = findInitial;

    this.#test && this.enteredStates.push(this.#currentState.value);
  };

  #setCurrentState = (value: string) => {
    const out = this.#states.find(_state => _state.value === value);
    if (!out) throw `No state found for ${value}`;
    this.#currentState = out;
    this.#test && this.enteredStates.push(out.value);
  };

  #next = () => {
    const current = { ...this.#currentState };
    const args = this.#clonedArgs;
    if (isFinalStateDefinition(current)) {
      current.entry.forEach(entry => entry(this.#context, args as TA));
      this.#data = current.data(this.#context, args as TA);
      this.#hasNext = false;
    } else {
      current.entry.forEach(entry => entry(this.#context, args as TA));

      //TODO: Better transitions
      for (const transition of current.always) {
        //TODO: Better conditions
        const cond = transition.cond
          .map(condition => condition({ ...this.#context }, args as TA))
          .every(identity);
        if (!cond) continue;
        transition.actions.forEach(action =>
          action(this.#context, args as TA),
        );

        this.#setCurrentState(transition.target);
        break;
      }

      current.exit.forEach(entry => entry(this.#context, args as TA));
    }
  };

  get #clonedArgs() {
    return cloneDeep(this.#args);
  }

  get data() {
    return this.#data; //?
  }

  #rinit = (args: TA) => {
    this.#args = args;
    this.#hasNext = true;
    this.#context = cloneDeep(this.#initialContext);
    this.#setCurrentState(this.#initial);
    return 0;
  };

  readonly start = (args => {
    let iterator = this.#rinit(args);

    while (this.#hasNext) {
      this.#next();
      iterator++;
      if (iterator >= this.#overflow) {
        throw 'Overflow transitions';
      }
    }
    return this.data;
  }) as UndefinyFunction<TA, R>;

  get state() {
    return this.#currentState;
  }

  get context() {
    return this.#context;
  }

  readonly enteredStates: string[] = [];
}
