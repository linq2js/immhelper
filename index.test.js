import {
  update,
  updatePath,
  $push,
  $unshift,
  $splice,
  $assign,
  $toggle,
  $unset,
  $set,
  $remove
} from "./index";

describe("samples", function() {
  it("all api", function() {
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
      parentNodes: [{ id: 0 }, { id: 1 }],
      updateTree: {
        text: "root",
        children: [
          {
            text: "child 1",
            data: {},
            children: [{ text: "child 1.1" }]
          },
          {
            text: "child 2",
            data: {},
            children: [{ text: "child 2.1" }, { text: "child 2.2" }]
          }
        ]
      },
      usingIfToUpdate: {
        value: 1
      },
      usingUnlessToUpdate: {
        dataLoaded: false
      },
      usingSwitchToUpdate1: 1,
      usingSwitchToUpdate2: {
        value: true
      },
      usingFilter: [1, 2, 3, 4, 5]
    };
    const specs = {
      // you can change separator by using configure({ separator: /pattern/ })
      "a.b.c.d.e.f": [$set, 100],
      "a.b.c.d.e": [$set, "newProp", 100],
      arrayPush: [$push, 1, 2, 3, 4, 5],
      objMerge: [$assign, { age: 20 }, { school: "A" }],
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
      },
      updateTree: {
        // using conditional spec to update all nodes which has text prop, exclude all data nodes
        "?": [node => node && node.text, ["set", "done", true]],
        // do same thing with pattern matching
        "?/text/i": ["set", "deleted", true],
        children: {
          // using diff spec for each node
          "?"(node, prop) {
            if (node && node.text) {
              return prop % 2 === 0
                ? ["set", "isEven", true]
                : ["set", "isOdd", true];
            }
            return undefined;
          }
        }
      },
      usingIfToUpdate: [
        "if",
        x => x % 2 === 0,
        ["set", "isEven", true],
        ["set", "isOdd", true]
      ],
      usingUnlessToUpdate: [
        "unless",
        x => x.dataLoaded,
        ["set", "text", "loading..."]
      ],
      usingSwitchToUpdate1: [
        "switch",
        {
          1: ["set", "one"],
          2: ["set", "two"],
          default: ["set", "other"]
        }
      ],
      usingSwitchToUpdate2: [
        "switch",
        x => (x.value ? "male" : "female"),
        {
          male: ["set", "sex", "male"],
          default: ["set", "sex", "female"]
        }
      ],
      usingFilter: ['filter', x => x % 2 === 0]
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
      parentNodes: [{ id: 0 }],
      updateTree: {
        text: "root",
        children: [
          {
            text: "child 1",
            done: true,
            deleted: true,
            isEven: true,
            data: {},
            children: [
              { text: "child 1.1", done: true, deleted: true, isEven: true }
            ]
          },
          {
            text: "child 2",
            done: true,
            deleted: true,
            isOdd: true,
            data: {},
            children: [
              { text: "child 2.1", done: true, deleted: true, isEven: true },
              { text: "child 2.2", done: true, deleted: true, isOdd: true }
            ]
          }
        ]
      },
      usingIfToUpdate: {
        value: 1,
        isOdd: true
      },
      usingUnlessToUpdate: {
        dataLoaded: false,
        text: "loading..."
      },
      usingSwitchToUpdate1: "one",
      usingSwitchToUpdate2: {
        value: true,
        sex: "male"
      },
      usingFilter: [2, 4]
    });
  });

  it("typescript api, selector proxy and modifier", function() {
    const original = { a: { b: { c: [] } } };
    const result = updatePath(
      original,
      [x => x.a.b.c, "push", 1, 2, 3],
      [x => x.a.b, "set", "name", "Peter"]
    );
    expect(result).toEqual({
      a: {
        b: {
          name: "Peter",
          c: [1, 2, 3]
        }
      }
    });
  });

  it("sub spec for root", function() {
    const original = [1, 2, 3, 4, 5];
    const result = update(original, ["push", 1]);

    expect(result).toEqual([1, 2, 3, 4, 5, 1]);
  });

  it("sub spec for root", function() {
    const original = [1, 2, 3, 4, 5];
    const result = update(original, [[x => x * 2]]);

    expect(result).toEqual([2, 4, 6, 8, 10]);
  });

  it("typescript api, proxy only", function() {
    const original = { a: { b: { c: [] } } };
    const result = updatePath(
      original,
      x => x.a.b.c.push(1, 2, 3),
      x => (x.a.b.name = "Peter")
    );

    expect(result).toEqual({
      a: {
        b: {
          name: "Peter",
          c: [1, 2, 3]
        }
      }
    });
  });
});

describe("update", function() {
  describe("$push", function() {
    const push7 = [$push, 7];
    const original = [1];

    it("pushes", function() {
      expect(update(original, push7)).toEqual([1, 7]);
    });
    it("does not mutate the original object", function() {
      update(original, push7);
      expect(original).toEqual([1]);
    });

    it("keeps reference equality when possible", function() {
      expect(update(original, [$push])).toBe(original);
    });
  });

  describe("$unshift", function() {
    const unshift7 = [$unshift, 7];
    const original = [1];
    it("unshifts", function() {
      expect(update(original, unshift7)).toEqual([7, 1]);
    });
    it("does not mutate the original object", function() {
      update(original, unshift7);
      expect(original).toEqual([1]);
    });
    it("keeps reference equality when possible", function() {
      expect(update(original, [$unshift])).toBe(original);
    });
  });

  describe("$splice", function() {
    const original = [1, 4, 3];
    const spliceData = [$splice, 1, 1, 2];
    it("splices", function() {
      expect(update(original, spliceData)).toEqual([1, 2, 3]);
    });
    it("does not mutate the original object", function() {
      update(original, spliceData);
      expect(original).toEqual([1, 4, 3]);
    });

    it("keeps reference equality when possible", function() {
      expect(update(original, [$splice])).toBe(original);
    });
  });

  describe("$assign", function() {
    const original = { a: "b" };
    const mergeData = [$assign, { c: "d" }];
    it("merges", function() {
      expect(update(original, mergeData)).toEqual({
        a: "b",
        c: "d"
      });
    });
    it("does not mutate the original object", function() {
      update(original, mergeData);
      expect(original).toEqual({ a: "b" });
    });
    it("keeps reference equality when possible", function() {
      const original = { a: { b: { c: true } } };
      expect(update(original, { a: [$assign] })).toBe(original);
      expect(update(original, { a: [$assign, { b: original.a.b }] })).toBe(
        original
      );

      // Merging primatives of the same value should return the original.
      expect(update(original, { a: { b: [$assign, { c: true }] } })).toBe(
        original
      );

      // Two objects are different values even though they are deeply equal.
      expect(update(original, { a: [$assign, { b: { c: true } }] })).not.toBe(
        original
      );
      expect(
        update(original, {
          a: [$assign, { b: original.a.b, c: false }]
        })
      ).not.toBe(original);
    });
  });

  describe("$set", function() {
    it("sets", function() {
      expect(update({ a: "b" }, [$set, { c: "d" }])).toEqual({ c: "d" });
    });
    it("does not mutate the original object", function() {
      const obj = { a: "b" };
      update(obj, [$set, { c: "d" }]);
      expect(obj).toEqual({ a: "b" });
    });
    it("keeps reference equality when possible", function() {
      const original = { a: 1 };
      expect(update(original, { a: [$set, 1] })).toBe(original);
      expect(update(original, { a: [$set, 2] })).not.toBe(original);
    });
  });

  describe("$toggle", function() {
    const original = { a: false, b: true };
    const toggleData = [$toggle, "a", "b"];
    it("toggles false to true and true to false", function() {
      expect(update(original, toggleData)).toEqual({
        a: true,
        b: false
      });
    });
    it("does not mutate the original object", function() {
      const obj = { a: false };
      update(obj, [$toggle, "a"]);
      expect(obj).toEqual({ a: false });
    });
  });

  describe("$unset", function() {
    it("unsets", function() {
      expect(update({ a: "b" }, [$unset, "a"]).a).toBe(undefined);
    });
    it("removes the key from the object", function() {
      const removed = update({ a: "b" }, [$unset, "a"]);
      expect("a" in removed).toBe(false);
    });
    it("removes multiple keys from the object", function() {
      const original = { a: "b", c: "d", e: "f" };
      const removed = update(original, [$unset, "a", "e"]);
      expect("a" in removed).toBe(false);
      expect("a" in original).toBe(true);
      expect("e" in removed).toBe(false);
      expect("e" in original).toBe(true);
    });

    it("keeps reference equality when possible", function() {
      const original = { a: 1 };
      expect(update(original, [$unset, "b"])).toBe(original);
      expect(update(original, [$unset, "a"])).not.toBe(original);
    });
  });

  describe("deep update", function() {
    it("works", function() {
      expect(
        update(
          {
            a: "b",
            c: {
              d: "e",
              f: [1],
              g: [2],
              h: [3],
              i: { j: "k" },
              l: 4,
              m: "n"
            }
          },
          {
            c: {
              d: [$set, "m"],
              f: [$push, 5],
              g: [$unshift, 6],
              h: [$splice, 0, 1, 7],
              i: [$assign, { n: "o" }],
              l: [x => x * 2],
              m: [x => x + x]
            }
          }
        )
      ).toEqual({
        a: "b",
        c: {
          d: "m",
          f: [1, 5],
          g: [6, 2],
          h: [7],
          i: { j: "k", n: "o" },
          l: 8,
          m: "nn"
        }
      });
    });
    it("keeps reference equality when possible", function() {
      const original = { a: { b: 1 }, c: { d: { e: 1 } } };

      expect(update(original, { a: { b: [$set, 1] } })).toBe(original);
      expect(update(original, { a: { b: [$set, 1] } }).a).toBe(original.a);

      expect(update(original, { c: { d: { e: [$set, 1] } } })).toBe(original);
      expect(update(original, { c: { d: { e: [$set, 1] } } }).c).toBe(
        original.c
      );
      expect(update(original, { c: { d: { e: [$set, 1] } } }).c.d).toBe(
        original.c.d
      );

      expect(
        update(original, {
          a: { b: [$set, 1] },
          c: { d: { e: [$set, 1] } }
        })
      ).toBe(original);
      expect(
        update(original, {
          a: { b: [$set, 1] },
          c: { d: { e: [$set, 1] } }
        }).a
      ).toBe(original.a);
      expect(
        update(original, {
          a: { b: [$set, 1] },
          c: { d: { e: [$set, 1] } }
        }).c
      ).toBe(original.c);
      expect(
        update(original, {
          a: { b: [$set, 1] },
          c: { d: { e: [$set, 1] } }
        }).c.d
      ).toBe(original.c.d);

      expect(update(original, { a: { b: [$set, 2] } })).not.toBe(original);
      expect(update(original, { a: { b: [$set, 2] } }).a).not.toBe(original.a);
      expect(update(original, { a: { b: [$set, 2] } }).a.b).not.toBe(
        original.a.b
      );

      expect(update(original, { a: { b: [$set, 2] } }).c).toBe(original.c);
      expect(update(original, { a: { b: [$set, 2] } }).c.d).toBe(original.c.d);
    });
  });

  it("should accept array spec to modify arrays", function() {
    const original = { value: [{ a: 0 }] };
    const modified = update(original, { value: [{ a: [$set, 1] }] });
    expect(modified).toEqual({ value: [{ a: 1 }] });
  });

  it("should accept object spec to modify arrays", function() {
    const original = { value: [{ a: 0 }, { a: 0 }] };
    const modified = update(original, { value: [{ a: [$set, 1] }] });
    expect(modified).toEqual({ value: [{ a: 1 }, { a: 1 }] });
  });
});
