# fsf

<p align="center">
  
  <br />
    <strong>Final State Functions</strong>
    <p>Never use if again. Prototype, test, and code. RED-GREEN-BLUE</p>
  <br />

</p>

<br/>
<br/>

## Features

|                             | **'@bemedev/fsf'** |
| --------------------------- | :----------------: |
| Finite states               |         ✅         |
| Initial state               |         ✅         |
| Transitions (object)        |         ❌         |
| Transitions (string target) |         ✅         |
| Delayed transitions         |         ❌         |
| Eventless transitions       |         ✅         |
| Nested states               |         ❌         |
| Parallel states             |         ❌         |
| History states              |         ❌         |
| Final states                |         ❌         |
| Context                     |         ✅         |
| Entry actions               |         ❌         |
| Exit actions                |         ❌         |
| Transition actions          |         ✅         |
| Parameterized actions       |         ❌         |
| Transition guards           |         ✅         |
| Parameterized guards        |         ❌         |
| Spawned actors              |         ❌         |

<br/>
<br/>

**NB :** Only for sync functions <br/> <br/> If you want to use statechart
features such as nested states, parallel states, history states,
activities, invoked services, delayed transitions, transient transitions,
etc. please use [`XState`](https://github.com/statelyai/xstate). <br/>
<br/> <br/>

## Quick start

<br/>
<br/>

### Installation

<br/>

```bash
npm i @bemedev/fsf //or
yarn add @bemedev/fsf //or
pnpm add @bemedev/fsf
```

### Usage (machine)

<br/>

```ts
import { createFunction, serve, FINAL_TARGET } from '@bemedev/fsf';

const machine = createFunction(
  {
    schema: {
      context: {} as { val: number },
      args: 1 as number,
    },
    context: { val: 4 },
    initial: 'idle',
    states: {
      idle: {
        transitions: [
          {
            target: 'calc',
          },
        ],
      },
      calc: {
        transitions: [
          {
            target: FINAL_TARGET,
            actions: ['action'],
          },
        ],
      },
    },
  },
  {
    actions: {
      action: (ctx, arg) => {
        console.log('arg', arg);
        ctx.val = ctx.val + arg;
      },
    },
  },
);
```

<br/>
<br/>

### Usage (serve)

<br/>

```ts
import { createFunction, serve } from '@bemedev/fsf';

const toggleMachine = createFunction({...});
//Serve infer the return type (the context is the return type of the function)
//Also it infers the fact that serve will be an async function or not
//Here before the states contain an async one,
//"service" will be an async function.
const service = serve(machine); // Type: ()=>{ val: string }
service() // expected = { val: 'true' }
```
