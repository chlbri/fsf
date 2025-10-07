import { Machine } from './Machine';
import { Param, State, StateDefinition } from './types';

export type InterpreterOptions = {
  overflow?: number;
};

class Interpreter<
  const ST extends Record<string, State>,
  TA = any,
  TC extends Record<string, unknown> = Record<string, unknown>,
  R = TC,
  const S extends Record<string, { data: any; error: any }> = Record<
    string,
    { data: any; error: any }
  >,
  Async extends boolean = false,
> {
  #events!: TA;
  readonly #initialContext: TC;

  // #region Props
  #data?: R;
  protected _context!: TC;
  readonly #overflow: number;
  protected _currentState!: StateDefinition<TA, TC>;
  #hasNext = true;
  readonly #machine: Machine<ST, TA, TC, R, S, Async>;
  readonly #errors: string[];
  // #endregion

  #parseContext = () => {
    return JSON.parse(this.#machine.__initialContext);
  };

  constructor(
    machine: Machine<ST, TA, TC, R, S, Async>,
    options?: InterpreterOptions,
  ) {
    this.#machine = machine.safe;
    this.#errors = machine.errors;
    this.#initialContext = this.#parseContext();
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
    this._context = this.#parseContext();
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
    this._context = this.#parseContext();
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

export function interpret<
  const ST extends Record<string, State>,
  TA = any,
  TC extends Record<string, unknown> = Record<string, unknown>,
  R = TC,
  const S extends Record<string, { data: any; error: any }> = Record<
    string,
    { data: any; error: any }
  >,
  Async extends boolean = false,
>(
  machine: Machine<ST, TA, TC, R, S, Async>,
  options?: InterpreterOptions,
): ReturnAsync<Async, TA, R> {
  const interpreter = new Interpreter(machine, options);
  const async = machine.__options.async;
  return (
    !async ? interpreter.build : interpreter.buildAsync
  ) as ReturnAsync<Async, TA, R>;
}
