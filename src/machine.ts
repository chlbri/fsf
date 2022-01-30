import {
  asyncVoidNothing,
  extractActions,
  extractTransitions,
  isAsync,
  isFinal,
  isSync,
  promiseWithTimeout,
} from './helpers';
import type {
  Config,
  Options,
  StateDefinition,
  TransitionDefinition,
} from './types';

export class Machine<TC = any, TA = any> {
  #context?: TC;
  #args?: TA;
  constructor(
    public states: StateDefinition<TC, TA>[],
    private initial: string,
    private overflow = 100,
    public test = false,
  ) {
    this.#initialeStates(states, initial);
  }

  #initialeStates(
    __allStates: StateDefinition<TC, TA>[],
    initial: string,
  ) {
    if (__allStates.length < 1) throw 'No states';
    if (!__allStates.some(value => value.type === 'final'))
      throw 'No final states';

    const findInitial = __allStates.find(state => state.value === initial);
    if (!findInitial) throw 'No initial state';
    if (findInitial.type === 'final') throw 'First state cannot be final';

    this.#currentState = findInitial;
    this.#context = this.#currentState.context;
    this.test && this.enteredStates.push(this.#currentState);
  }

  #hasNext = false;

  #initializeArgs(args?: TA) {
    const temp = this.states.map(state => {
      state.args = args;
      return state;
    });
    this.states.length = 0;
    this.states.push(...temp);
  }

  #setCurrentState(value: string) {
    if (value === this.#currentState.value) {
      this.#currentState.context = this.#context;
      return;
    }
    const out = this.states.find(_state => _state.value === value);

    if (!out) throw `No state for ${value}`;
    out.context = this.#context;
    this.#currentState = out;
    this.#currentState.type = 'final';
    this.test && this.enteredStates.push(out);
  }

  #nextSync() {
    const current = this.#currentState;
    const args = { ...this.#args } as TA;
    if (current.type === 'sync') {
      this.#hasNext = true;
      const transitions = current.transitions;
      for (const transition of transitions) {
        if (transition.conditions.length < 1) {
          transition.actions.forEach(action =>
            action(this.#context, args),
          );

          this.#setCurrentState(transition.target);

          break;
        }
        const cond = transition.conditions
          .map(condition => condition(this.#context, args))
          .every(value => value === true);
        if (!cond) continue;
        transition.actions.forEach(action => action(this.#context, args));
        this.#setCurrentState(transition.target);
        break;
      }
    }
  }

  async #nextAsync() {
    const current = this.#currentState;
    const args = { ...this.#args } as TA;
    if (current.type === 'async') {
      this.#hasNext = true;
      const src = promiseWithTimeout({
        timeoutMs: current.timeout,
        promise: () => current.src(this.#context, args),
      });
      await src()
        .then(data => {
          const actions = current.onDone.actions;
          const target = current.onDone.target;
          actions.forEach(action => action(this.#context, data));
          this.#setCurrentState(target);
        })
        .catch(error => {
          const actions = current.onError.actions;
          const target = current.onError.target;
          actions.forEach(action => action(this.#context, error));
          this.#setCurrentState(target);
        });
    }
  }

  start(args: TA) {
    let iterator = 0;
    this.#initializeArgs(args);
    this.#args = args;
    while (this.#hasNext && this.#currentState.type !== 'final') {
      this.#hasNext = false;
      this.#nextSync();
      iterator++;
      if (iterator >= this.overflow) {
        throw 'Overflow transitions';
      }
    }
  }

  async startAsync(args: TA) {
    let iterator = 0;
    this.#initializeArgs(args);
    this.#args = args;
    while (this.#hasNext && this.#currentState.type !== 'final') {
      this.#hasNext = false;
      this.#nextSync();
      await this.#nextAsync();
      iterator++;
      if (iterator >= this.overflow) {
        throw 'Overflow transitions';
      }
    }
  }

  #currentState!: StateDefinition<TC, TA>;

  get state() {
    return this.#currentState;
  }

  get value() {
    return this.#context;
  }

  enteredStates: StateDefinition<TC, TA>[] = [];
}

export default function createMachine<TC = any, TA = any>(
  config: Config<TC, TA>,
  options?: Options<TC, TA>,
) {
  const initial = config.initial;
  const states: StateDefinition<TC, TA>[] = [];
  const __states = Object.entries(config.states);

  for (const [value, state] of __states) {
    const matches = <T extends string>(_value: T) => _value === value;
    const source = value;

    const entry = extractActions(state.entry);
    const exit = extractActions(state.exit);

    if (isSync(state)) {
      states.push({
        type: state.type ?? 'sync',
        value,
        entry,
        exit,
        matches,
        transitions: extractTransitions(
          source,
          state?.transitions,
          options,
        ),
      });
      continue;
    }

    if (isAsync(state)) {
      const src = options?.promises?.[state.src] ?? asyncVoidNothing;

      // #region Build onDone
      const onDone: Omit<TransitionDefinition<TC, any>, 'conditions'> = {
        source,
        target: state.onDone.target,
        actions: extractActions(state.onDone.actions, options?.actions),
        description: state.onDone.description,
      };
      // #endregion

      // #region Build onErrror
      const onError: Omit<TransitionDefinition<TC, any>, 'conditions'> = {
        source,
        target: state.onError.target,
        actions: extractActions(state.onError.actions, options?.actions),
        description: state.onError.description,
      };
      // #endregion

      // #region Build timeout
      const timeout = options?.timeouts?.[state.timeout] ?? 400;

      // #endregion

      states.push({
        type: state.type ?? 'async',
        value,
        entry,
        exit,
        matches,
        src,
        onDone,
        onError,
        timeout,
      });
      continue;
    }

    if (isFinal(state)) {
      states.push({
        type: state.type ?? 'final',
        value,
        entry,
        exit,
        matches,
      });
      continue;
    }
  }

  return new Machine(states, initial);
}

const machine = createMachine(
  {
    initial: 'idle',
    states: {
      idle: {
        // type: 'async',
        transitions: [
          {
            target: 'trt',
          },
        ],
      },
      trt: {
        type: 'final',
      },
    },
  },
  {},
);

//
// console.log(JSON.stringify(machine.states, null, 2));
console.log('Value ======>');
console.log(machine.state.value);
machine.start(undefined);
console.log('Value ======>');
console.log(machine.state.value);
