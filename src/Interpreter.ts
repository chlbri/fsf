import { Machine } from './Machine';
import { Param, StateDefinition } from './types';

export type InterpreterOptions = {
  overflow?: number;
};

export class Interpreter<
  TA = any,
  TC extends Record<string, unknown> = Record<string, unknown>,
  R = TC,
> {
  #events!: TA;
  readonly #initialContext: TC;

  // #region Props
  #data?: R;
  protected _context!: TC;
  readonly #overflow: number;
  protected _currentState!: StateDefinition<TA, TC>;
  #hasNext = true;
  #machine: Machine<TA, TC, R>;
  #errors: string[];
  // #endregion

  #parseContext = () => {
    return JSON.parse(this.#machine.__initialContext);
  };

  constructor(machine: Machine<TA, TC, R>, options?: InterpreterOptions) {
    this.#machine = machine.safe;
    this.#errors = machine.errors;
    this.#initialContext = this.#parseContext();
    this.#initialContext; //?
    this.#overflow = options?.overflow ?? 100;
    this._initializeStates();
  }

  get machine() {
    return this.#machine.clone;
  }

  get errors() {
    return this.#errors;
  }

  protected readonly _initializeStates = () => {
    Object.freeze(this.#initialContext);
    this._context = this.#parseContext();
    const states = this.machine.props._states;
    const initial = this.machine.props.initial;

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const findInitial = states.find(state => state.value === initial)!;
    this._currentState = findInitial;
  };

  protected readonly _setCurrentState = (value: string) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const out = this.machine.props._states.find(
      _state => _state.value === value,
    )!;
    this._currentState = out;
  };

  #rinit = (events?: TA) => {
    this.#events = events ?? this.#events;
    this.#events;
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
    this._setCurrentState(state);
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

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.#data!;
  };
}
