# immhelper

<p>
  <a href="https://unpkg.com/immhelper/dist/index.js">
    <img src="http://img.badgesize.io/https://unpkg.com/immhelper/dist/index.js?compression=gzip&amp;label=immhelper">
  </a>
  <a href="./package.json">
    <img src="https://img.shields.io/npm/v/immhelper.svg?maxAge=3600&label=immhelper&colorB=007ec6">
  </a>
  <a href="./License.md">
    <img src="https://img.shields.io/npm/l/immhelper.svg?maxAge=3600">
  </a>
</p>

Fast and lightweight library helps you to update js objects without mutating them

## Install with npm

```
npm install immhelper --save
```

## Features

1.  Extreme fast
1.  Lightweight
1.  Provide many powerful mutating actions
1.  Easy to define custom mutating actions
1.  Support batch processing per spec
1.  Support pipe processing per spec
1.  Support deep updating with target path
1.  Support sub spec with filter
1.  Support named mutating actions
1.  Support typescripts autocomplete
1.  Support proxy for selecting and updating target
1.  Support API to update spec for special cases

## Benchmarks (Fastest to Slowest)

[Show details](benchmarks-result-03.txt)

### Normal

**Object.assign**: Total elapsed = 107 ms (read) + 2578 ms (write) = 2685 ms<br/>
**immhelper**: Total elapsed = 74 ms (read) + 3283 ms (write) = 3357 ms<br/>
**immutable-assign**: Total elapsed = 88 ms (read) + 3970 ms (write) = 4058 ms<br/>
**immer**: Total elapsed = 71 ms (read) + 6883 ms (write) = 6954 ms<br/>
**seamless-immutable**: Total elapsed = 88 ms (read) + 50166 ms (write) = 50254 ms<br/>
**immutability-helper**: Total elapsed = 80 ms (read) + 64408 ms (write) = 64488 ms<br/>

### With Deep Freeze

**Object.assign**: Total elapsed = 99 ms (read) + 28683 ms (write) = 28782 ms<br/>
**immhelper**: Total elapsed = 93 ms (read) + 29871 ms (write) = 29964 ms<br/>
**immer**: Total elapsed = 100 ms (read) + 36421 ms (write) = 36521 ms<br/>
**immutable-assign**: Total elapsed = 98 ms (read) + 43356 ms (write) = 43454 ms<br/>
**immutability-helper**: Total elapsed = 98 ms (read) + 95230 ms (write) = 95328 ms<br/>

### Summary

1.3x Slower than Object.assign<br/>
1.1x Faster than immutable-assign<br/>
2x Faster than immer<br/>
16x Faster than seamless-immutable<br/>
19x Faster than immutability-helper<br/>

## Samples

```js
import {
  update,
  $push,
  $unshift,
  $splice,
  $merge,
  $toggle,
  $unset,
  $set,
  $remove
} from "immhelper";

const original = {
  a: {
    b: {
      c: {
        d: {
          e: {
            f: {}
          }
        }
      }
    }
  },
  arrayPush: [],
  objMerge: {
    name: "Peter"
  },
  toggleMe: false,
  toggleMyProp: {
    done: false,
    completed: true
  },
  removeSecond: [1, 2, 3, 4],
  removeAppleAndBanana: ["Orange", "Apple", "Banana"],
  unsetMyProp: {
    data1: new Date(),
    data2: true
  },
  sqrt: 100,
  doubleItems: [1, 2, 3, 4, 5, 6, 7, 8],
  swapItems: ["left", "right"],
  increaseProps: {
    one: 1,
    two: 2,
    three: 3
  },
  removeByIndexes: [1, 2, 3, 4],
  batchProcessing: {},
  pipeProcessing: "hello",
  doubleOddNumbers: [1, 2, 3, 4],
  parentNode: {
    childNode: {}
  },
  parentNodes: [{ id: 0 }, { id: 1 }]
};
const specs = {
  // you can change separator by using configure({ separator: /pattern/ })
  "a.b.c.d.e.f": [$set, 100],
  "a.b.c.d.e": [$set, "newProp", 100],
  arrayPush: [$push, 1, 2, 3, 4, 5],
  objMerge: [$merge, { age: 20 }, { school: "A" }],
  // using obj method as modifier
  sqrt(x) {
    return Math.sqrt(x);
  },
  // toggle property itself
  toggleMe: [$toggle],
  // toggle child properties
  toggleMyProp: [$toggle, "done", "completed"],
  unsetMyProp: [$unset, "data1", "data2"],
  removeSecond: [$splice, 1, 1],
  // remove array items by its value
  removeAppleAndBanana: [$remove, "Apple", "Banana"],
  // using sub spec to update all array items
  // sub spec syntax [spec]
  // spec can be [action, ...args] or spec tree { a: {  b: ....} }
  doubleItems: [[x => x * 2]],
  // use action name instead of function
  swapItems: ["swap", 0, 1],
  // using sub spec to update all obj values
  increaseProps: [[x => x + 1]],
  removeByIndexes: ["removeAt", 3, 1],
  batchProcessing: ["batch", ["set", "name", "Peter"], ["set", "age", 20]],
  pipeProcessing: ["batch", x => x.toUpperCase(), x => x + " WORLD!!!"],
  //  apply sub spec for only odd numbers
  doubleOddNumbers: [[x => x * 2], x => x % 2],
  parentNode: {
    // remove childNode its self from parentNode
    childNode: ["unset"]
  },
  // remove item at index 1 from parentNodes array
  parentNodes: {
    1: ["unset"]
  }
};
const result = update(original, specs);
expect(result).not.toBe(original);
expect(result).toEqual({
  a: {
    b: {
      c: {
        d: {
          e: {
            f: 100,
            newProp: 100
          }
        }
      }
    }
  },
  arrayPush: [1, 2, 3, 4, 5],
  objMerge: {
    name: "Peter",
    age: 20,
    school: "A"
  },
  toggleMe: true,
  toggleMyProp: {
    done: true,
    completed: false
  },
  unsetMyProp: {},
  sqrt: 10,
  removeSecond: [1, 3, 4],
  removeAppleAndBanana: ["Orange"],
  doubleItems: [2, 4, 6, 8, 10, 12, 14, 16],
  swapItems: ["right", "left"],
  increaseProps: {
    one: 2,
    two: 3,
    three: 4
  },
  removeByIndexes: [1, 3],
  batchProcessing: {
    name: "Peter",
    age: 20
  },
  pipeProcessing: "HELLO WORLD!!!",
  doubleOddNumbers: [2, 2, 6, 4],
  parentNode: {},
  parentNodes: [{ id: 0 }]
});
```

## Typescript support

### immhelper.d.ts

```typescript
declare namespace ImmHelper {
    // tuple [selector, action, ...args]
    type UpdateSpec<T> = [(model: T) => any, string | Function, ...any[]];
    interface Update {
        <T>(model: T, ...specs: UpdateSpec<T>[]): T;

        default: ImmHelper.Update;
    }
}

declare var updatePath: ImmHelper.Update;
export = updatePath;
```

### Usages

```typescript
/// <reference path="./immhelper.d.ts"/>
import { updatePath, $push, $set } from "immhelper";
const state = {
  a: {
    b: {
      c: []
    }
  }
};
const newState1 = updatePath(
  state,
  [x => x.a.b.c, $push, 1, 2, 3],
  [x => x.a.b, $set, "newProp", 100]
);
// this is shorter way but there are some limitations
// 1. Do not try to get prop value from obj, using originalState to get value instead
// 2. Only mutating actions are allowed
// 3. Mutating actions must be defined by using define(actionName, func) or define({ actionName: func })
const newState2 = updatePath(
  state,
  x => x.a.b.c.push(1, 2, 3),
  x => (x.a.b.newProp = 100)
);
console.log(newState1, newState2);
```

## Mutating actions

### [$push, ...items]<br/>['push', ...items]<br/>actions.push(target, ...items)<br/>actions.$push(target, ...items)

push() all the items in array on the target

### [$pop]<br/>['pop']<br/>actions.pop(target)<br/>actions.$pop(target)

### [$unshift, ...items]<br/>['unshift', ...items]<br/>actions.unshift(target, ...items)<br/>actions.$unshift(target, ...items)

unshift() all the items in array on the target.

### [$splice, index, count, ...items]<br/>['splice', index, count, ...items]<br/>actions.splice(target, index, count, ...items)<br/>actions.$splice(target, index, count, ...items)

splice() remove item at specified index and push new items at there.

### [$remove, ...items]<br/>['remove', ...items]<br/>actions.remove(target, ...items)<br/>actions.$remove(target, ...items)

remove specified items from target array

### [$removeAt, ...indexes]<br/>['removeAt', ...indexes]<br/>actions.removeAt(target, ...indexes)<br/>actions.$removeAt(target, ...indexes)

remove items from array by indexes

### [$set, value]<br/>['set', value]<br/>actions.set(target, value)<br/>actions.$pop(target, value)

replace the target entirely.

### [$set, prop, value]<br/>['set', prop, value]<br/>actions.set(target, prop, value)<br/>actions.$set(target, prop, value)

set value for specified prop of the target

### [$toggle]<br/>['toggle']<br/>actions.toggle(target)<br/>actions.$toggle(target)

toggle target's value.

### [$toggle, ...props]<br/>['toggle', ...props]<br/>actions.toggle(target, ...props)<br/>actions.$toggle(target, ...props)

toggle all prop values of the target

### [$unset, ...props]<br/>['unset', ...props]<br/>actions.unset(target, ...props)<br/>actions.$unset(target, ...props)

remove keys from the target object or set undefined for array indexes

### [$assign, ...objects]<br/>['assign' ...objects]<br/>actions.assign(target ...objects)<br/>actions.$assign(target, ...objects)

copy the values of all enumerable own properties from one or more source objects to a target object

### define(actionName, actionFunc, disableAutoClone)

define new mutating action, if disableAutoClone = true, original value will be passed instead of cloned value.
Set disableAutoClone = true if you want to handle value manually, return original value if no change needed.

```js
define("removeAt", function(originalArray, index) {
  // nothing to remove
  if (index >= originalArray.length) return originalArray;
  const newArray = originalArray.slice();
  newArray.splice(index, 1);
  return newArray;
}, true);
```

## Special use cases

```js
import { without, compact, zip } from "lodash";
import { define, updatePath } from "immhelper";

define({
  "+"(current, value) {
    return current + value;
  },
  "-"(current, value) {
    return current - value;
  },
  without,
  compact,
  zip
});

const state = { counter: 0 };

updatePath(state, [x => x.counter, "+", 1]);
updatePath(state, [x => x.counter, "-", 1]);
```

## Define custom mutating actions

```js
import { define, $set } from "immhelper";
define({
  "=": $set,
  addOne(currentValue, ...args) {
    return currentValue + 1;
  }
});
```
