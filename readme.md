# immhelper

Lightweight library helps you to update js objects without mutating them

## Install with npm

```
npm install immhelper --save
```

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
  swapItems: ["left", "right"]
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
  increaseProps: [[x => x + 1]]
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
  swapItems: ["right", "left"]
});
```

## Typescript support

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

## For Typescript fan

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

### [$push, ...items] / ['push', ...items] / actions.push(target, ...items) / actions.$push(target, ...items)

push() all the items in array on the target

### [$pop] / ['pop'] / actions.pop(target) / actions.$pop(target)

### [$unshift, ...items] / ['unshift', ...items] / actions.unshift(target, ...items) / actions.$unshift(target, ...items)

unshift() all the items in array on the target.

### [$splice, index, count, ...items] / ['splice', index, count, ...items] / actions.splice(target, index, count, ...items) / actions.$splice(target, index, count, ...items)

splice() remove item at specified index and push new items at there.

### [$remove, ...items] / ['remove', ...items] / actions.remove(target, ...items) / actions.$remove(target, ...items)

remove specified items from target array

### [$set, value] / ['set', value] / actions.set(target, value) / actions.$pop(target, value)

replace the target entirely.

### [$set, prop, value] / ['set', prop, value] / actions.set(target, prop, value) / actions.$set(target, prop, value)

set value for specified prop of the target

### [$toggle] / ['toggle'] / actions.toggle(target) / actions.$toggle(target)

toggle target's value.

### [$toggle, ...props] / ['toggle', ...props] / actions.toggle(target, ...props) / actions.$toggle(target, ...props)

toggle all prop values of the target

### [$unset, ...props] / ['unset', ...props] / actions.unset(target, ...props) / actions.$unset(target, ...props)

remove keys from the target object or set undefined for array indexes

### [$assign, ...objects] / ['assign' ...objects] / actions.assign(target ...objects) / actions.$assign(target, ...objects)

copy the values of all enumerable own properties from one or more source objects to a target object

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
