import { returnTrue, voidNothing } from './helpers';
import {
  Config,
  Options,
  SingleOrArray,
  State,
  StateDefinition,
  StateFunction,
  Transition,
  TransitionDefinition,
} from './types';

export class Machine<TT extends string = string, TC = any, TA = any> {
  #context?: TC;
  #args?: TA;
  constructor(
    private __allStates: StateDefinition<TT, TC, TA>[],
    private overflow = 100,
    private test?: boolean,
  ) {
    this.#initialeStates(__allStates);
    if (!this.#args) throw 'No arguments';
    this.#initializeArgs(this.#args);
  }

  #initialeStates(__allStates: StateDefinition<TT, TC, TA, any>[]) {
    if (!__allStates[0]) throw 'No states';
    if (!__allStates.some(value => !value.type || value.type === 'final'))
      throw 'No final states';
    if (__allStates[0].type === 'final')
      throw 'First state cannot be final';
    this.#currentState = __allStates[0];
    this.#args = this.#currentState.args;
    this.#context = this.#currentState.context;
    this.test && this.enteredStates.push(this.#currentState);
  }

  #initializeArgs(args: TA) {
    const temp = this.__allStates.map(state => {
      state.args = args;
      return state;
    });
    this.__allStates.length = 0;
    this.__allStates.push(...temp);
  }

  #setCurrentState(value: TT) {
    if (value === this.#currentState.value) {
      this.#currentState.context = this.#context;
      return;
    }
    const out = this.__allStates.find(_state => (_state.value = value));
    if (!out) throw `No state for ${value}`;
    out.context = this.#context;
    this.#currentState = out;
    this.test && this.enteredStates.push(out);
  }

  #nextSync() {
    const current = this.#currentState;
    const args = { ...this.#args } as TA;
    if (current.type === 'sync') {
      const transitions = current.transitions;
      for (const transition of transitions) {
        const cond = transition.conditions
          .map(condition => condition(this.#context, args))
          .every(value => value);
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
      await current
        .src(this.#context, args)
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

  start() {
    let iterator = 0;
    while (this.#currentState.type !== 'final') {
      this.#nextSync();
      iterator++;
      if (iterator <= this.overflow) {
        throw 'Overflow transitions';
      }
    }
  }

  #currentState!: StateDefinition<TT, TC, TA>;

  get state() {
    return this.#currentState;
  }

  get value() {
    return this.#context;
  }

  enteredStates: StateDefinition<TT, TC, TA>[] = [];

  get initialState(): StateDefinition<TT, TC, TA> {
    return this.__allStates[0];
  }
}

export default function createMachine<
  TC = any,
  TA = any,
  TT extends string = string,
  R extends {
    actions: string;
    conditions: string;
    promises: Record<
      string,
      {
        src: string;
        actionsDone: string;
        errorsDone: string;
      }
    >;
    timeouts: string | number;
  } = {
    actions: string;
    conditions: string;
    promises: Record<
      string,
      {
        src: any;
        actionsDone: string;
        errorsDone: string;
      }
    >;
    timeouts: string | number;
  },
>(
  config: Config<
    TC,
    TA,
    TT,
    {
      actions: R['actions'];
      conditions: R['conditions'];
      promises: keyof R['promises'] extends string
        ? keyof R['promises']
        : string;
      timeouts: R['timeouts'];
    }
  >,
  options?: Options<TC, TA, R>,
) {
  const states: StateDefinition<TT, TC, TA>[] = [];
  const __states = Object.entries(config.states) as [TT, State<TT>][];

  for (const [value, state] of __states) {
    const matches = <T extends TT>(_value: T) => _value === value;
    const source = value;

    const __entry = state.entry as SingleOrArray<R['actions']>;
    const entry: TransitionDefinition<TT, TC, TA>['actions'] = [];
    const __exit = state.exit as SingleOrArray<R['actions']>;
    const exit: TransitionDefinition<TT, TC, TA>['actions'] = [];
    // #region Assign Entry & Exit
    extractAction(__entry, entry);
    extractAction(__exit, exit);
    // #endregion

    const transitions: TransitionDefinition<TT, TC, TA>[] = [];

    if (state.type === 'sync') {
      const type = state.type;
      const __transitions = state.transitions;
      if (Array.isArray(__transitions)) {
        __transitions.forEach(extractTransition(transitions, source));
      } else {
        extractTransition(transitions, source)(__transitions);
      }
      states.push({ type, value, entry, exit, matches, transitions });
    }
    const __promises: string[] = [];

    const __timeouts: string[] = [];
  }

  function extractAction(
    strings: SingleOrArray<R['actions']>,
    functions: StateFunction<TC, TA, void>[],
  ) {
    if (Array.isArray(strings)) {
      functions.push(
        ...strings.map(_entry => {
          return options?.actions?.[_entry] ?? voidNothing;
        }),
      );
    } else {
      functions.push(options?.actions?.[strings] ?? voidNothing);
    }
  }

  function extractConditions(
    strings: SingleOrArray<R['conditions']>,
    functions: StateFunction<TC, TA, boolean>[],
  ) {
    if (Array.isArray(strings)) {
      functions.push(
        ...strings.map(_entry => {
          return options?.conditions?.[_entry] ?? returnTrue;
        }),
      );
    } else {
      functions.push(options?.conditions?.[strings] ?? returnTrue);
    }
  }

  function extractTransition(
    transitions: TransitionDefinition<TT, TC, TA>[],
    source: TT,
  ): (value: Transition<TT, string, string>) => void {
    return __transition => {
      const target = __transition.target;
      const description = __transition.description;
      const __actions = __transition.actions as SingleOrArray<
        R['actions']
      >;
      const actions: TransitionDefinition<TT, TC, TA>['actions'] = [];
      const __conditions = __transition.conditions as SingleOrArray<
        R['conditions']
      >;
      const conditions: TransitionDefinition<TT, TC, TA>['conditions'] =
        [];
      extractAction(__actions, actions);
      extractConditions(__conditions, conditions);
      transitions.push({
        actions,
        conditions,
        target,
        source,
        description,
      });
    };
  }
}
