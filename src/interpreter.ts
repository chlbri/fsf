import { Machine, type AnyMachine } from './Machine';

import type {
  Config,
  ConfigTypes,
  IsAsyncConfig,
  Param,
  StateDefinition,
} from './types';

export type InterpreterOptions<TC> = {
  overflow?: number;
} & (object extends TC ? { context?: TC } : { context: TC });

class Interpreter<
  const C extends Config,
  const T extends ConfigTypes<C> = ConfigTypes<C>,
> {
  #events!: T['events'];
  #initialContext!: T['context'];

  // #region Props
  #data?: T['data'];
  protected _context!: T['context'];
  readonly #overflow: number;
  protected _currentState!: StateDefinition<
    T['events'],
    T['context'],
    T['data']
  >;
  #hasNext = true;
  readonly #machine: Machine<C, T>;
  // #endregion

  constructor(
    machine: Machine<C, T>,
    options?: InterpreterOptions<T['context']>,
  ) {
    this.#machine = machine.safe;
    this.#overflow = options?.overflow ?? 100;
    this._initializeStates();
  }

  get machine() {
    return this.#machine.clone;
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

  #rinit = (events?: T['events']) => {
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

  setInitialContext = (context: T['context']) => {
    this.#initialContext = context;
    Object.freeze(this.#initialContext);
  };

  readonly build = (...events: Param<T['events']>) => {
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

  readonly buildAsync = async (...events: Param<T['events']>) => {
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
export function interpret<const M extends AnyMachine>(
  machine: M,
  options?: InterpreterOptions<M['__types']['context']>,
): ReturnAsync<
  IsAsyncConfig<M['__config']>,
  M['__types']['events'],
  M['__types']['data']
> {
  const interpreter = new (Interpreter as any)(machine, options);

  interpreter.setInitialContext(options?.context ?? {});
  return (
    !machine.async ? interpreter.build : interpreter.buildAsync
  ) as ReturnAsync<
    IsAsyncConfig<M['__config']>,
    M['__types']['events'],
    M['__types']['data']
  >;
}
