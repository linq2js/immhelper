const configs = {
  separator: "."
};

const {
  slice: arraySlice,
  shift: arrayShift,
  unshift: arrayUnshift,
  push: arrayPush,
  pop: arrayPop,
  splice: arraySplice,
  sort: arraySort
} = Array.prototype;

export function configure(newConfigs) {
  Object.assign(configs, newConfigs);
}

class Immutable {
  constructor(value, parent, path) {
    this.parent = parent;
    this.value = value;
    this.path = path;
    this.children = [];
    this.childMap = {};
  }

  apply(modifier) {
    const args = arraySlice.call(arguments, 1);
    if (typeof modifier === "string") {
      if (modifier in actions) {
        modifier = actions[modifier];
      } else {
        throw new Error(`No action '${modifier}'' defined`);
      }
    }
    const newValue = modifier.apply(null, [this.value].concat(args));
    if (newValue !== this.value) {
      this.value = newValue;
      this.change();
    }
    return this;
  }

  change() {
    if (!this.changed) {
      this.changed = true;
      if (this.value instanceof Array) {
        this.value = this.value.slice();
      } else if (isPlainObject(this.value)) {
        this.value = Object.assign({}, this.value);
      }
    }

    for (let x of this.children) {
      this.value[x.path] = x.value;
    }

    if (this.parent) {
      this.parent.change();
    }
  }

  child(path) {
    if (path in this.childMap) {
      return this.childMap[path];
    }
    const child = new Immutable(this.value[path], this, path);
    this.children.push(child);
    this.childMap[path] = child;
    return child;
  }

  childFromPath(path) {
    return path
      .split(configs.separator)
      .reduce((parent, path) => parent.child(path), this);
  }
}

export function $toggle(current) {
  const props = arraySlice.call(arguments, 1);
  if (!props.length) {
    return !current;
  }
  const newValue = clone(current);
  for (let prop of props) {
    newValue[prop] = !newValue[prop];
  }
  return newValue;
}

export function $unset(current) {
  const props = arraySlice.call(arguments, 1);
  if (!current) return;
  let newValue = current;
  props.forEach(prop => {
    if (prop in newValue) {
      if (newValue === current) {
        newValue = clone(current);
      }
      delete newValue[prop];
    }
  });

  return newValue;
}

function arrayOp(array, modifier) {
  if (!array) {
    array = [];
  } else {
    array = array.slice();
  }
  modifier(array);
  return array;
}

export function $splice(array, index, count) {
  const newItems = arraySlice.call(arguments, 3);
  if (newItems.length || count) {
    return arrayOp(array, x =>
      arraySplice.apply(x, [index, count].concat(newItems))
    );
  }
  return array;
}

export function $push(array) {
  const newItems = arraySlice.call(arguments, 1);
  if (newItems.length) {
    return arrayOp(array, x => arrayPush.apply(x, newItems));
  }
  return array;
}

export function $unshift(array) {
  const newItems = arraySlice.call(arguments, 1);
  if (newItems.length) {
    return arrayOp(array, x => arrayUnshift.apply(x, newItems));
  }
  return array;
}

export function $pop(array) {
  if (!array || array.length) {
    return arrayOp(array, x => x.pop());
  }
  return array;
}

export function $shift(array) {
  if (!array || array.length) {
    return arrayOp(array, x => x.shift());
  }
  return array;
}

export function $sort(array, sorter) {
  return arrayOp(array, x => x.sort(sorter));
}

function clone(value) {
  if (value instanceof Array) return value.slice();
  return Object.assign({}, value);
}

const isPlainObject = val =>
  !!val && typeof val === "object" && val.constructor === Object;

export function $remove(array) {
  const items = arraySlice.call(arguments, 1);
  const newArray = array.filter(x => items.indexOf(x) === -1);
  return newArray.length === array.length ? array : newArray;
}

export function $swap(current, from, to) {
  const newValue = clone(current);
  const temp = newValue[from];
  newValue[from] = newValue[to];
  newValue[to] = temp;
  return newValue;
}

export function $merge(obj) {
  const values = arraySlice.call(arguments, 1);
  if (values.length) {
    let mergedObj = obj;
    values.forEach(value => {
      if (value === null || value === undefined) return;
      for (let key in value) {
        if (value[key] !== mergedObj[key]) {
          if (mergedObj === obj) {
            mergedObj = Object.assign({}, obj);
          }
          mergedObj[key] = value[key];
        }
      }
    });
    return mergedObj;
  }

  return obj;
}

export function $set(current) {
  const args = arraySlice.call(arguments, 1);
  if (args.length < 2) {
    return args[0];
  }
  // don't use destructing to improve performance
  const prop = args[0];
  const value = args[1];
  const newValue = clone(current);
  newValue[prop] = value;
  return newValue;
}

export const update = (state, changes) => {
  const root = new Immutable(state);

  function traversal(parent, node) {
    for (let pair of Object.entries(node)) {
      const key = pair[0];
      let value = pair[1];
      // convert obj method to custom modifier
      if (value instanceof Function) {
        value = [value];
      }
      const child = parent.childFromPath(key);
      if (value instanceof Array) {
        // is spec
        if (value[0] instanceof Function || typeof value[0] === "string") {
          // is modifier and its args
          child.apply.apply(child, value);
        } else {
          // is sub spec
          const spec = value[0];
          if (spec instanceof Array) {
            // apply for each child
            for (let key of Object.keys(child.value)) {
              const newChild = child.child(key);
              newChild.apply.apply(newChild, spec);
            }
          } else {
            for (let key of Object.keys(child.value)) {
              traversal(child.child(key), spec);
            }
          }
        }
      } else if (isPlainObject(value)) {
        traversal(child, value);
      } else {
        child.apply($set, value);
      }
    }
  }

  if (changes instanceof Array) {
    root.apply.apply(root, changes);
  } else {
    traversal(root, changes);
  }

  return root.value;
};

export default update;

export const actions = {
  $merge,
  merge: $merge,
  $pop,
  pop: $pop,
  $push,
  push: $push,
  $remove,
  remove: $remove,
  $set,
  set: $set,
  $shift,
  shift: $shift,
  $sort,
  sort: $sort,
  $splice,
  splice: $splice,
  $toggle,
  toggle: $toggle,
  $unset,
  unset: $unset,
  $unshift,
  unshift: $unshift,
  $swap,
  swap: $swap
};

export function define(name, action) {
  if (isPlainObject(name)) {
    Object.assign(actions, action);
  } else {
    actions[name] = action;
  }
}
