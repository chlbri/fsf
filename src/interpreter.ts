import { Machine } from './Machine';
import { Param, StateDefinition } from './types';
import type { Config, ConfigTypes, isAsyncConfig } from './types2';

export type InterpreterOptions = {
  overflow?: number;
};

class Interpreter<
  const C extends Config,
  const T extends ConfigTypes<C> = ConfigTypes<C>,
  TA extends T['events'] = T['events'],
  TC extends T['context'] = T['context'],
  R extends T['data'] = T['data'],
> {
  #events!: TA;
  #initialContext!: TC;

  // #region Props
  #data?: R;
  protected _context!: TC;
  readonly #overflow: number;
  protected _currentState!: StateDefinition<TA, TC, R>;
  #hasNext = true;
  readonly #machine: Machine<C, T>;
  readonly #errors: string[];
  // #endregion

  constructor(machine: Machine<C, T>, options?: InterpreterOptions) {
    this.#machine = machine.safe;
    this.#errors = machine.errors;
    this.#overflow = options?.overflow ?? 100;
    this._initializeStates();
  }

  get machine() {
    return this.#machine.clone;
  }

  get errors() {
    return this.#errors;
  }

  get initialContext() {
    return this.#initialContext;
  }

  protected readonly _initializeStates = () => {
    Object.freeze(this.#initialContext);
    this._context = this.#initialContext;
    const states = this.machine.props._states;
    const initial = this.machine.props.initial;

    const findInitial = states.find(state => state.value === initial)!;
    this._currentState = findInitial;
  };

  protected readonly _setCurrentState = (value: string) => {
    const out = this.machine.props._states.find(
      _state => _state.value === value,
    )!;
    this._currentState = out;
  };

  #rinit = (events?: TA) => {
    this.#events = events ?? this.#events;
    this.#hasNext = true;
    this._context = structuredClone(this.#initialContext);
    this._setCurrentState(this.#machine.props.initial);
    return 0;
  };

  #next = () => {
    const { context, hasNext, state, data } = this.#machine.next({
      context: this._context,
      events: this.#events,
      state: this._currentState.value,
    });

    this._context = context;
    this.#hasNext = hasNext;
    this._setCurrentState(state ?? this._currentState.value);
    this.#data = data;
  };

  #nextAsync = async () => {
    const { context, hasNext, state, data } =
      await this.#machine.nextAsync({
        context: this._context,
        events: this.#events,
        state: this._currentState.value,
      });

    this._context = context;
    this.#hasNext = hasNext;
    this._setCurrentState(state ?? this._currentState.value);
    this.#data = data;
  };

  setInitialContext = (context: TC) => {
    this.#initialContext = context;
    Object.freeze(this.#initialContext);
  };

  readonly build = (...events: Param<TA>) => {
    let iterator = this.#rinit(events[0]);

    while (this.#hasNext) {
      this.#next();
      iterator++;
      if (iterator >= this.#overflow) {
        throw new Error('Overflow transitions');
      }
    }

    return this.#data!;
  };

  readonly buildAsync = async (...events: Param<TA>) => {
    let iterator = this.#rinit(events[0]);

    while (this.#hasNext) {
      await this.#nextAsync();
      iterator++;
      if (iterator >= this.#overflow) {
        throw new Error('Overflow transitions');
      }
    }

    return this.#data!;
  };
}

export { type Interpreter };

type ReturnAsync<Async extends boolean, TA, R> = true extends Async
  ? (...events: Param<TA>) => Promise<NonNullable<R>>
  : (...events: Param<TA>) => NonNullable<R>;

// Difficult
export function interpret<
  const C extends Config = Config,
  const T extends ConfigTypes<C> = ConfigTypes<C>,
>(
  machine: Machine<C, T, T['events'], T['context'], T['data']>,
  options?: InterpreterOptions,
): ReturnAsync<isAsyncConfig<C>, T['events'], T['data']> {
  const interpreter = new Interpreter<C, T>(machine, options);
  const async = machine.__options.async;
  return (
    !async ? interpreter.build : interpreter.buildAsync
  ) as ReturnAsync<isAsyncConfig<C>, T['events'], T['data']>;
}
