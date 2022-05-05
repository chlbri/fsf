/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  identity,
  isAsyncDef,
  isFinalTarget,
  isSyncDef,
  promiseWithTimeout,
} from './helpers';
import { StateDefinition, StateFunction, UndefinyF } from './types';

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

export class Machine<
  TA = any,
  TC extends Record<string, unknown> = Record<string, unknown>,
  S extends StateDefinition<TA, TC> = StateDefinition<TA, TC>,
  D = any,
> {
  #args!: TA;
  readonly containsAsyncStates: boolean;
  readonly #initialContext: TC;

  // #region Props
  _states: S[];
  private initial: string;
  private context: TC;
  readonly dataF: StateFunction<TC, TA, D>;
  private readonly overflow: number;
  private test: boolean;
  // #endregion

  constructor({
    _states,
    initial,
    context,
    dataF = identity as any,
    overflow = 100,
    test = false,
  }: MarchineArgs<TA, TC, S, D>) {
    // #region Initilize props
    this._states = _states;
    this.initial = initial;
    this.context = context;
    this.dataF = dataF;
    this.overflow = overflow;
    this.test = test;
    // #endregion

    this.#initialContext = context;
    this.#initializeStates();
    // this.#initializeTransitions();
    this.containsAsyncStates = _states.some(
      state => state.type === 'async',
    );
  }

  private get props() {
    return {
      _states: this._states,
      initial: this.initial,
      context: this.context,
      dataF: this.dataF,
      overflow: this.overflow,
      test: this.test,
    };
  }

  readonly cloneWithValues = (
    props?: Partial<MarchineArgs<TA, TC, S, D>>,
  ) => new Machine({ ...this.props, ...props });

  get clone() {
    const context = this.#initialContext;
    return this.cloneWithValues({ context });
  }

  get cloneTest() {
    const context = this.#initialContext;
    const test = true;
    return this.cloneWithValues({ test, context });
  }

  #initializeStates = () => {
    const __allStates = this._states;
    const initial = this.initial;
    if (__allStates.length < 1) throw 'No states';

    const findInitial = __allStates.find(state => state.value === initial);
    if (!findInitial) throw 'No initial state';

    this.#currentState = findInitial;

    this.test && this.enteredStates.push(this.#currentState.value);
  };

  #hasNext = true;

  get data(): D {
    return this.dataF(this.context, this.#args);
  }

  #setCurrentState = (value: string) => {
    const out = this._states.find(_state => _state.value === value);
    this.#currentState = out!;
    this.test && this.enteredStates.push(out!.value);
  };

  #nextSync = () => {
    const current = { ...this.#currentState };
    const args = { ...this.#args };
    if (isSyncDef(current)) {
      this.#hasNext = true;
      const transitions = current.transitions;
      for (const transition of transitions) {
        const cond = transition.conditions
          .map(condition => condition({ ...this.context }, args))
          .every(value => value === true);
        if (!cond) continue;
        transition.actions.forEach(action => action(this.context, args));
        if (isFinalTarget(transition.target)) {
          this.#hasNext = false;
          return;
        }
        this.#setCurrentState(transition.target);
        break;
      }
    }
  };

  #nextAsync = async () => {
    const current = this.#currentState;
    const args = { ...this.#args };
    if (isAsyncDef(current)) {
      this.#hasNext = true;
      const src = promiseWithTimeout({
        timeoutMs: current.timeout,
        promise: () => current.promise({ ...this.context }, args),
      });
      await src()
        .then(data => {
          const transitions = current.onDone;
          for (const transition of transitions) {
            const cond = transition.conditions
              .map(condition => condition({ ...this.context }, data))
              .every(value => value === true);

            if (!cond) continue;
            transition.actions.forEach(action => {
              action(this.context, args);
            });
            if (isFinalTarget(transition.target)) {
              this.#hasNext = false;
              return;
            }
            this.#setCurrentState(transition.target);
            break;
          }
        })
        .catch(error => {
          const transitions = current.onError;
          for (const transition of transitions) {
            const cond = transition.conditions
              .map(condition => condition({ ...this.context }, error))
              .every(value => value === true);
            if (!cond) continue;
            transition.actions.forEach(action =>
              action(this.context, error),
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
    if (this.containsAsyncStates) {
      throw 'async state exists';
    }
    let iterator = 0;
    this.#args = (args ?? undefined) as TA;
    while (this.#hasNext) {
      this.#hasNext = false;
      this.#nextSync();
      iterator++;
      if (iterator >= this.overflow) {
        throw 'Overflow transitions';
      }
    }
    return this.data;
  }) as UndefinyF<TA, D>;

  readonly startAsync = (async args => {
    const error = !this.test && !this.containsAsyncStates;
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
      if (iterator >= this.overflow) {
        throw 'Overflow transitions';
      }
    }
    return this.data;
  }) as UndefinyF<TA, Promise<D>>;

  #currentState!: S;

  get state() {
    return this.#currentState;
  }

  get value() {
    return this.context;
  }

  readonly enteredStates: string[] = [];
}

// export type GetTA<T extends Machine> = T extends Machine<infer U>
//   ? U
//   : never;

// export type GetTC<T extends Machine> = T extends Machine<any, infer U>
//   ? U
//   : never;
