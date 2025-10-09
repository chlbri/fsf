# **Final State Functions**

Never use "if" again. Prototype, test, and code.
**<u>[RED-GREEN-BLUE](https://blog.cleancoder.com/uncle-bob/2014/12/17/TheCyclesOfTDD.html)</u>**
as Uncle BoB says

<br/>

## Introduction

State machines are a useful concept in computer science and programming,
and are often used to model the behavior of systems. In this journey, I
explore this new way of programming to answer questions like what state
machines are, how they work, how can I implement them in my workflow.

A state machine is a mathematical model of computation that represents the
behavior of a system as a sequence of states and transitions between those
states. At any given time, a state machine is in a specific state, and when
certain conditions are met, it can transition to a new state.

![Simple Cute machine](./public/transitions-events.af54e0b5.svg)

> **_Simple Cute machine_**, image from
> [XState](https://xstate.js.org/docs/guides/introduction-to-state-machines-and-statecharts/#transitions-and-events)

<br/>

State machines can be implemented in a variety of ways, such as using a
switch statement or a series of if-else statements. In other hand, state
machines allow abstraction of methods/functions, guards (if-else) and
developpers can implement after defining the state machine, the logic of
the system. I used to say it's an industrial way to do programming in
opposition to the craftmanship model.

The "[XState](https://xstate.js.org/docs/)" library is the best
implementation of state machines. It goes a step further as they implement
state charts, where you can have events, children state machines, parallel
states for examples.

So I take inspiration of this library to create my own one only focus of
create of synchronous function. It's the only missing thing inside this
library.

I try my best to follow the syntax of XState, so you can use it can be used
with the
[Stately Editor](https://stately.ai/registry/discover?page=1&facetFilters=%255B%255D&numericFilters=%255B%255D)

<br />

## Features

|                              | **'@bemedev/fsf'** |
| ---------------------------- | :----------------: |
| Finite states                |         ✅         |
| Initial state                |         ✅         |
| Transitions (object)         |         ✅         |
| Transitions (string target)  |         ✅         |
| Delayed transitions          |         ❌         |
| Eventless transitions (only) |         ✅         |
| Nested states                |         ❌         |
| Parallel states              |         ❌         |
| Final states                 |         ✅         |
| Context                      |         ✅         |
| Entry actions                |         ✅         |
| Exit actions                 |         ✅         |
| Transition actions           |         ✅         |
| Parameterized actions        |         ✅         |
| Transition guards            |         ✅         |
| Parameterized guards         |         ✅         |
| Asynchronous                 |         ✅         |

<br/>

## Quick start

<br/>

### Installation

```bash
npm i @bemedev/fsf //or
yarn add @bemedev/fsf //or
pnpm add @bemedev/fsf
```

<br/>

### Usage (machine)

```ts
import { describe, expect, test } from 'vitest';
import { createLogic, interpret } from '@bemedev/fsf';

describe('#4: Complex, https query builder', () => {
  type Context = {
    apiKey?: string;
    apiUrl?: string;
    url?: string;
  };

  type Events = { products?: string[]; categories?: string[] };

  const queryMachine = createLogic(
    {
      context: {},
      initial: 'preferences',
      data: 'query', // Required in v1.0.0+
      states: {
        preferences: {
          always: {
            actions: ['setUrl', 'setApiKey', 'startUrl'],
            target: 'categories',
          },
        },
        categories: {
          always: [
            {
              cond: 'hasCategories',
              target: 'products',
              actions: 'setCategories',
            },
            'products',
          ],
        },
        products: {
          always: [
            {
              cond: 'hasProducts',
              target: 'final',
              actions: 'setProducts',
            },
            'final',
          ],
        },
        final: {
          data: 'query',
        },
      },
    },
    {
      context: {} as Context,
      // Add null option to make arguments optionals
      events: {} as Events | null,
      data: {} as string,
    },
  ).provideOptions({
    actions: {
      setApiKey: ctx => {
        ctx.apiKey = '123';
      },
      setUrl: ctx => {
        ctx.apiUrl = 'https://example.com';
      },
      startUrl: ctx => {
        const { apiUrl, apiKey } = ctx;
        ctx.url = `${apiUrl}?apikey=${apiKey}`;
      },
      setCategories: (ctx, { categories }) => {
        const _categories = categories?.join(',');
        ctx.url += `&categories=${_categories}`;
      },
      setProducts: (ctx, { products }) => {
        const _products = products?.join(',');
        ctx.url += `&categories=${_products}`;
      },
    },
    guards: {
      hasCategories: (_, { categories }) =>
        !!categories && categories.length > 0,
      hasProducts: (_, { products }) => !!products && products.length > 0,
    },
    datas: {
      query: ctx => ctx.url,
    },
  });

  const func = interpret(queryMachine);

  test('#1: no args', () => {
    // So here, arguments are optionals !
    expect(func()).toBe('https://example.com?apikey=123');
  });

  test('#2: categories', () => {
    expect(func({ categories: ['a', 'b'] })).toBe(
      'https://example.com?apikey=123&categories=a,b',
    );
  });

  test('#3: products', () => {
    expect(func({ products: ['a', 'b'] })).toBe(
      'https://example.com?apikey=123&categories=a,b',
    );
  });

  test('#4: categories and products', () => {
    expect(func({ products: ['a', 'b'], categories: ['c', 'd'] })).toBe(
      'https://example.com?apikey=123&categories=c,d&categories=a,b',
    );
  });
});
```

<br/>

## Migration to v1.0.0

**Breaking Changes**: Version 1.0.0 introduces significant API changes:

1. **`data` property is now required** at the configuration level
2. **`createLogic` signature changed**: Schema is now the second argument
3. **Options are provided via `provideOptions` method** instead of third
   argument

### Old API (v0.x):

```ts
const machine = createLogic(
  {
    schema: {
      context: {} as Context,
      events: {} as Events,
      data: {} as string,
    },
    initial: 'idle',
    states: {
      done: { data: 'result' },
    },
  },
  {
    // Options here (third argument)
    datas: {
      result: () => 'success',
    },
  },
);
```

### New API (v1.0.0+):

```ts
type Context = { value: number };
type Events = { type: 'INCREMENT' };
type Data = string;

const machine = createLogic(
  {
    initial: 'idle',
    data: 'defaultData', // ← Now required
    states: {
      idle: { always: 'done' },
      done: { data: 'result' },
    },
  },
  {
    // Schema is now second argument
    context: {} as Context,
    events: {} as Events,
    data: {} as Data,
  },
).provideOptions({
  // Options provided via provideOptions method
  datas: {
    defaultData: () => 'default', // ← Must provide corresponding function
    result: () => 'success',
  },
});
```

### Why These Changes?

1. **Required `data` property**: Ensures machines always have a fallback
   data return value, even when transitioning through states without
   explicit data definitions.

2. **Separated schema from config**: Cleaner separation of concerns -
   configuration defines the structure, schema defines the types.

3. **`provideOptions` method**: Enables better composition and allows for
   late binding of implementation details (actions, guards, datas,
   promises).

<br/>

### **Note**: Versions below 1.0.0 have breaking API changes. Please use v1.0.0 or higher.

---

<br/>

## API Reference

### `createLogic<TContext, TEvents, TData>(config, types)`

Creates a state machine logic instance.

**Parameters:**

- `config`: Machine configuration object
  - `initial`: (required) Initial state name
  - `data`: (required) Default data function key - **BREAKING CHANGE in
    v1.0.0**
  - `states`: (required) State definitions
  - `context`: (optional) Initial context value

- `types`: Type definitions object - **BREAKING CHANGE: Now second
  argument**
  - `context`: TypeScript type for context (e.g., `{} as MyContext`)
  - `events`: TypeScript type for events (e.g., `{} as MyEvents`)
  - `data`: TypeScript type for data return value (e.g., `{} as MyData`)
  - `promises`: (optional) TypeScript type for async promises

**Returns:** Machine logic instance with `provideOptions` method

**Example:**

```ts
type Context = { count: number };
type Events = { type: 'INCREMENT' } | { type: 'DECREMENT' };
type Data = number;

const machine = createLogic(
  {
    initial: 'idle',
    data: 'defaultData', // Required in v1.0.0+
    context: { count: 0 },
    states: {
      idle: {
        on: {
          INCREMENT: { target: 'active', actions: 'increment' },
        },
      },
      active: { data: 'result' },
    },
  },
  {
    context: {} as Context,
    events: {} as Events,
    data: {} as Data,
  },
).provideOptions({
  actions: {
    increment: ctx => {
      ctx.count++;
    },
  },
  datas: {
    defaultData: ctx => ctx.count,
    result: ctx => ctx.count,
  },
});
```

<br/>

### `.provideOptions(options)`

Provides implementation options to a machine logic instance. **BREAKING
CHANGE in v1.0.0** - Options are no longer passed as third argument to
`createLogic`.

**Parameters:**

- `options`: Implementation options object
  - `actions`: Action function implementations
  - `guards`: Guard function implementations
  - `datas`: Data function implementations (must include function matching
    `config.data`)
  - `promises`: (optional) Promise function implementations for async
    states

**Returns:** Configured machine logic instance ready to be interpreted

**Example:**

```ts
const machine = createLogic(config, types).provideOptions({
  actions: {
    increment: ctx => {
      ctx.count++;
    },
  },
  guards: {
    isPositive: ctx => ctx.count > 0,
  },
  datas: {
    defaultData: ctx => ctx.count,
  },
});
```

<br/>

### `interpret<TContext, TEvents, TData>(machine)`

Interprets a machine logic instance and returns an executable function.

**Parameters:**

- `machine`: Machine logic instance created with `createLogic`

**Returns:** Function that executes the state machine with given events

**Example:**

```ts
const machine = createLogic(config, options);
const execute = interpret(machine);

const result = execute({ type: 'START' });
```

<br/>

## Advanced Usage

### Guards (Conditional Logic)

Guards allow conditional transitions based on context and event data.

```ts
type Context = { status: string };
type Events = { type: 'CHECK'; value: number };
type Data = string;

const machine = createLogic(
  {
    initial: 'idle',
    data: 'status',
    states: {
      idle: {
        on: {
          CHECK: [
            { target: 'valid', cond: 'isValid' },
            { target: 'invalid' },
          ],
        },
      },
      valid: { data: 'status' },
      invalid: { data: 'status' },
    },
  },
  {
    context: {} as Context,
    events: {} as Events,
    data: {} as Data,
  },
).provideOptions({
  guards: {
    isValid: (ctx, event) => event.value > 0,
  },
  datas: {
    status: ctx => ctx.status,
  },
});
```

### Actions (Side Effects)

Actions perform side effects during state transitions.

```ts
type Context = { count: number };
type Events = { type: 'INCREMENT' };
type Data = number;

const machine = createLogic(
  {
    initial: 'idle',
    data: 'counter',
    context: { count: 0 },
    states: {
      idle: {
        on: {
          INCREMENT: {
            target: 'active',
            actions: 'incrementCounter',
          },
        },
      },
      active: { data: 'counter' },
    },
  },
  {
    context: {} as Context,
    events: {} as Events,
    data: {} as Data,
  },
).provideOptions({
  actions: {
    incrementCounter: ctx => {
      ctx.count = (ctx.count || 0) + 1;
    },
  },
  datas: {
    counter: ctx => ctx.count,
  },
});
```

### Entry and Exit Actions

Execute actions when entering or exiting states.

```ts
type Context = {};
type Events = { type: 'START' };
type Data = string;

const machine = createLogic(
  {
    initial: 'idle',
    data: 'result',
    states: {
      idle: {
        entry: 'logEntry',
        exit: 'logExit',
        on: { START: 'running' },
      },
      running: { data: 'result' },
    },
  },
  {
    context: {} as Context,
    events: {} as Events,
    data: {} as Data,
  },
).provideOptions({
  actions: {
    logEntry: () => console.log('Entering idle'),
    logExit: () => console.log('Exiting idle'),
  },
  datas: {
    result: () => 'done',
  },
});
```

### Eventless Transitions (Always)

Automatic transitions without requiring events.

```ts
type Context = { ready: boolean; result: string };
type Events = null;
type Data = string;

const machine = createLogic(
  {
    initial: 'check',
    data: 'output',
    context: { ready: false, result: '' },
    states: {
      check: {
        always: [
          { target: 'success', cond: 'isReady' },
          { target: 'waiting' },
        ],
      },
      success: { data: 'output' },
      waiting: { data: 'output' },
    },
  },
  {
    context: {} as Context,
    events: {} as Events,
    data: {} as Data,
  },
).provideOptions({
  guards: {
    isReady: ctx => ctx.ready === true,
  },
  datas: {
    output: ctx => ctx.result,
  },
});
```

<br/>

## TypeScript Support

The library is written in TypeScript and provides full type safety.

```ts
type Context = {
  count: number;
  message: string;
};

type Events =
  | { type: 'INCREMENT' }
  | { type: 'DECREMENT' }
  | { type: 'RESET' };

type Data = number;

const machine = createLogic(
  {
    context: { count: 0, message: '' },
    initial: 'active',
    data: 'getCount',
    states: {
      active: {
        on: {
          INCREMENT: { actions: 'increment' },
          DECREMENT: { actions: 'decrement' },
          RESET: { actions: 'reset' },
        },
        data: 'getCount',
      },
    },
  },
  {
    context: {} as Context,
    events: {} as Events,
    data: {} as Data,
  },
).provideOptions({
  actions: {
    increment: ctx => {
      ctx.count++;
    },
    decrement: ctx => {
      ctx.count--;
    },
    reset: ctx => {
      ctx.count = 0;
    },
  },
  datas: {
    getCount: ctx => ctx.count,
  },
});
```

<br/>

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes following the
   [commit conventions](./.github/copilot-instructions.md)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

<br/>

## License

This project is licensed under the MIT License.

<br/>

## Author

**chlbri** (bri_lvi@icloud.com)

[GitHub Profile](https://github.com/chlbri?tab=repositories)

<br/>

## Acknowledgments

- Inspired by [XState](https://xstate.js.org/)
- Compatible with [Stately Editor](https://stately.ai/)
- Built with TypeScript, Vitest, and Rollup

<br/>

### **Note**: Versions below 1.0.0 have breaking API changes. Please use v1.0.0 or higher.

---

<br/>
<br/>

## Author

chlbri (bri_lvi@icloud.com)

[My github](https://github.com/chlbri?tab=repositories)

[<svg width="98" height="96" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z" fill="#24292f"/></svg>](https://github.com/chlbri?tab=repositories)

<br/>

## Links

- [Documentation](https://github.com/chlbri/monadisk)
