import {
  identity,
  isAsyncDef,
  isFinalTarget,
  isSyncDef,
  promiseWithTimeout,
} from './helpers';
import type {
  StateDefinition,
  StateFunction,
  UndefinyFunction,
} from './types';

type MarchineArgs<
  TA = any,
  TC extends Record<string, unknown> = Record<string, unknown>,
  S extends StateDefinition<TA, TC> = StateDefinition<TA, TC>,
  D = any,
> = {
  _states: S[];
  initial: string;
  context: TC;
  dataF?: StateFunction<TC, TA, D>;
  overflow?: number;
  test?: boolean;
};

export class MachineFunction<
  TA = any,
  TC extends Record<string, unknown> = Record<string, unknown>,
  S extends StateDefinition<TA, TC> = StateDefinition<TA, TC>,
  D = any,
> {
  #args!: TA;
  readonly async: boolean;
  readonly #initialContext: TC;

  // #region Props
  #states: S[];
  #initial: string;
  #context: TC;
  readonly #dataF: StateFunction<TC, TA, D>;
  readonly #overflow: number;
  #test: boolean;
  // #endregion

  constructor({
    _states,
    initial,
    context,
    dataF = identity as StateFunction<TC, TA, D>,
    overflow = 100,
    test = false,
  }: MarchineArgs<TA, TC, S, D>) {
    // #region Initilize props
    this.#states = _states;
    this.#initial = initial;
    this.#context = context;
    this.#dataF = dataF;
    this.#overflow = overflow;
    this.#test = test;
    // #endregion

    this.#initialContext = { ...context };
    this.#initializeStates();
    this.async = _states.some(state => state.type === 'async');
  }

  get #props() {
    return {
      _states: this.#states,
      initial: this.#initial,
      context: this.#context,
      dataF: this.#dataF,
      overflow: this.#overflow,
      test: this.#test,
    };
  }

  readonly cloneWithValues = (
    props?: Partial<MarchineArgs<TA, TC, S, D>>,
  ) => new MachineFunction({ ...this.#props, ...props });

  get clone() {
    const context = { ...this.#initialContext };
    return this.cloneWithValues({ context });
  }

  get cloneTest() {
    const context = { ...this.#initialContext };
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

  #hasNext = true;

  get data(): D {
    return this.#dataF(this.#context, this.#args);
  }

  #setCurrentState = (value: string) => {
    const out = this.#states.find(_state => _state.value === value);
    if (!out) throw `No state found for ${value}`;
    this.#currentState = out;
    this.#test && this.enteredStates.push(out.value);
  };

  #nextSync = () => {
    const current = { ...this.#currentState };
    const args = this.#clonedArgs;
    if (isSyncDef(current)) {
      this.#hasNext = true;
      const transitions = current.transitions;
      for (const transition of transitions) {
        const cond = transition.conditions
          .map(condition => condition({ ...this.#context }, args as TA))
          .every(value => value === true);
        if (!cond) continue;
        transition.actions.forEach(action =>
          action(this.#context, args as TA),
        );
        if (isFinalTarget(transition.target)) {
          this.#hasNext = false;
          return;
        }
        this.#setCurrentState(transition.target);
        break;
      }
    }
  };

  get #clonedArgs() {
    if (this.#args instanceof Array) {
      return [...this.#args];
    }
    if (typeof this.#args === 'object') {
      return { ...this.#args };
    }
    return this.#args;
  }

  #nextAsync = async () => {
    const current = this.#currentState;
    const args = this.#clonedArgs;

    if (isAsyncDef(current)) {
      this.#hasNext = true;
      const src = promiseWithTimeout({
        timeoutMs: current.timeout,
        promise: () => current.promise({ ...this.#context }, args as TA),
      });
      await src()
        .then(() => {
          const transitions = current.onDone;
          for (const transition of transitions) {
            const cond = transition.conditions
              .map(condition =>
                condition({ ...this.#context }, args as TA),
              )
              .every(value => value === true);

            if (!cond) continue;
            transition.actions.forEach(action => {
              action(this.#context, args as TA);
            });
            if (isFinalTarget(transition.target)) {
              this.#hasNext = false;
              return;
            }
            this.#setCurrentState(transition.target);
            break;
          }
        })
        .catch(() => {
          const transitions = current.onError;
          for (const transition of transitions) {
            const cond = transition.conditions
              .map(condition =>
                condition({ ...this.#context }, args as TA),
              )
              .every(value => value === true);
            if (!cond) continue;
            transition.actions.forEach(action =>
              action(this.#context, args as TA),
            );
            if (isFinalTarget(transition.target)) {
              this.#hasNext = false;
              return;
            }
            this.#setCurrentState(transition.target);
            break;
          }
        });
    }
  };

  readonly start = (args => {
    if (this.async) {
      throw 'async state exists';
    }
    let iterator = 0;
    this.#args = args as TA;

    while (this.#hasNext) {
      this.#hasNext = false;
      this.#nextSync();
      iterator++;
      if (iterator >= this.#overflow) {
        throw 'Overflow transitions';
      }
    }
    return this.data;
  }) as UndefinyFunction<TA, D>;

  readonly startAsync = (async args => {
    const error = !this.#test && !this.async;
    if (error) {
      throw 'no async state';
    }
    let iterator = 0;
    this.#args = (args ?? undefined) as TA;
    while (this.#hasNext) {
      this.#hasNext = false;
      this.#nextSync();
      await this.#nextAsync();
      iterator++;
      if (iterator >= this.#overflow) {
        throw 'Overflow transitions';
      }
    }
    return this.data;
  }) as UndefinyFunction<TA, Promise<D>>;

  #currentState!: S;

  get state() {
    return this.#currentState;
  }

  get value() {
    return this.#context;
  }

  readonly enteredStates: string[] = [];
}
