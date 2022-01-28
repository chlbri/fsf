import { State } from './types';

export class Machine<
  TC extends Record<string, unknown>,
  TA,
  TT extends string,
> {
  context?: TC;
  args?: TA;
  constructor(
    private __allStates: State<TC, TA, TT>[],
    private overflow = 100,
  ) {
    if (!__allStates[0]) throw 'No states';
    if (!__allStates.some(value => value.type === 'final'))
      throw 'No final states';
    if (__allStates[0].type === 'final')
      throw 'First state cannot be final';
    this._currentState = __allStates[0];
    this.args = this._currentState.args;
    this.context = this._currentState.context;
  }

  setCurrentState(value: TT) {
    const out = this.__allStates.find(_state => (_state.value = value));
    if (!out) throw `No state for ${value}`;
    this._currentState = out;
  }

  next() {
    const current = this._currentState;
    const args = { ...this.args } as TA;
    if (current.type === 'final') return;
    const transitions = current.transitions;
    for (const transition of transitions) {
      const cond = transition.conditions
        .map(condition => condition(this.context, args))
        .every(value => value);
      if (!cond) continue;
      transition.actions.forEach(action => action(this.context, args));
      this.setCurrentState(transition.target);
      break;
    }
  }

  initialize(args: TA) {
    const temp = this.__allStates.map(state => {
      state.args = args;
      return state;
    });
    this.__allStates.length = 0;
    this.__allStates.push(...temp);
  }

  start() {
    let iterator = 0;
    while (this._currentState.type !== 'final') {
      this.next();
      iterator++;
      if (iterator <= this.overflow) {
        throw 'Overflow transitions';
      }
    }
  }

  _currentState: State<TC, TA, TT>;

  get state(): State<TC, TA, TT> {
    throw undefined;
  }

  enteredStates: State<TC, TA, TT>[] = [];

  get initialState(): State<TC, TA, TT> {
    return this.__allStates[0];
  }
}

export default function createMachine() {}
