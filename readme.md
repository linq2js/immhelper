# immhelper

Lightweight library helps you to update js objects without mutating them

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
  doubleItems: [1, 2, 3, 4, 5, 6, 7, 8]
};
const specs = {
  // you can change separator by using configure({ separator: /pattern/ })
  "a.b.c.d.e.f": [$set, 100],
  "a.b.c.d.e": [$set, "newProp", 100],
  arrayPush: [$push, 1, 2, 3, 4, 5],
  objMerge: [$merge, { age: 20 }, { school: "A" }],
  // custom function
  sqrt: [x => Math.sqrt(x)],
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
  doubleItems: [[x => x * 2]]
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
  doubleItems: [2, 4, 6, 8, 10, 12, 14, 16]
});
```
