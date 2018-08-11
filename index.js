const configs = {
  // for fast performance, we process dot as separator only
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
const contextProp = "@@context";
export function configure(newConfigs) {
  Object.assign(configs, newConfigs);
}

function isEqual(a, b) {
  if (a instanceof Date && b instanceof Date)
    return a.getTime() === b.getTime();
  return a === b;
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

    // is batch processing
    if (modifier === $batch) {
      for (let job of args) {
        if (job instanceof Function) {
          job = [job];
        }
        this.apply.apply(this, job);
      }
      return this;
    }

    let newValue = modifier.apply(
      null,
      [
        this.value instanceof Date ? new Date(this.value.getTime()) : this.value
      ].concat(args)
    );

    // need special context
    while (newValue instanceof Function) {
      newValue = newValue(this);
    }
    // nothing to change
    if (newValue === this) {
      return this;
    }

    if (!isEqual(newValue, this.value)) {
      this.value = newValue;
      this.change(true);
    }
    return this;
  }

  change(valueUpdated) {
    // notify to parent that child value is changed
    if (this.parent) {
      this.parent.change();
    }

    if (this.children.length) {
      // if this is parent, we must clone its value
      if (!this.changed) {
        this.changed = true;
        this.value = clone(this.value);
        for (let x of this.children) {
          if (x.parent === this) {
            this.value[x.path] = x.value;
          }
        }
      } else if (valueUpdated) {
        const newChildren = [];
        for (let x of this.children) {
          if (x.parent === this && x.path in this.value) {
            x.value = this.value[x.path];
            newChildren.push(x);
          } else {
            // child is removed, so we detach the child
            delete x.parent;
            delete this.childMap[x.path];
          }
        }
        this.children = newChildren;
      }
    }

    // update parent model
    if (this.parent) {
      this.parent.value[this.path] = this.value;
    }
  }

  backToParent() {
    // make sure child should be removed fron its parent
    this.parent.children = this.parent.children.filter(x => x !== this);
    delete this.parent.childMap[this.path];
    return this.parent;
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
    return (path instanceof Array
      ? path
      : path.split(configs.separator)
    ).reduce((parent, path) => parent.child(path), this);
  }

  descendants(pattern, specsOrCallback) {
    let callback;
    if (pattern) {
      // match node by pattern and data must be specs
      const specs = specsOrCallback;
      // convert pattern to regex
      const [, exp, flags] = pattern.split("/");
      pattern = new RegExp(exp, flags);
      callback = function(value) {
        if (typeof value === "object") {
          for (let key in value) {
            if (pattern.test(key)) {
              return specs;
            }
          }
        }
        return undefined;
      };
    } else {
      if (specsOrCallback instanceof Array) {
        // [match, ...specs]
        // callback can return false to skip checking node or return spec index
        const originalCallback = specsOrCallback[0];
        const specs = specsOrCallback.slice(1);
        callback = function() {
          const result = originalCallback.apply(null, arguments);
          if (typeof result === "number") {
            return specs[result];
          }
          return result ? specs[0] : undefined;
        };
      } else {
        // data must be callback func, it will be called when visit node
        callback = specsOrCallback;
      }
    }

    function traversal(root, parent, path) {
      if (parent instanceof Array || isPlainObject(parent)) {
        for (let pair of Object.entries(parent)) {
          const value = pair[1];
          const key = pair[0];
          const childPath = path.concat(key);
          const specs = callback(value, key);
          if (specs) {
            // create node from path
            const node = root.childFromPath(childPath);
            processSpec(node, specs);
          }
          traversal(root, value, childPath);
        }
      }
    }

    traversal(this, this.value, []);
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
  // no prop to unset => unset its self
  if (!props.length) {
    return function(node) {
      const parent = node.parent;
      if (!parent) {
        return current;
      }

      if (node.path in parent.value) {
        if (!parent.changed) {
          parent.value = clone(parent.value);
        }
        if (parent.value instanceof Array) {
          parent.value.splice(node.path, 1);
        } else {
          delete parent.value[node.path];
        }
        delete node.parent;
        parent.change(true);
      } else {
        // not exist in parent value
      }
    };
  }

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

export function $removeAt(array) {
  const indexes = arraySlice.call(arguments, 1);
  let newArray = array;
  // remove from bottom to top
  indexes.sort();
  while (indexes.length) {
    const index = indexes.pop();
    if (index >= 0 && index < newArray.length) {
      if (newArray === array) {
        newArray = newArray.slice();
      }
      newArray.splice(index, 1);
    }
  }

  return newArray;
}

export function $push(array) {
  const newItems = arraySlice.call(arguments, 1);
  if (newItems.length) {
    return arrayOp(array, x => arrayPush.apply(x, newItems));
  }
  return array;
}

export function $filter(array, filter) {
  const newArray = array.filter(filter);
  if (newArray.length !== array.length) return newArray;
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
  if (value instanceof Array) {
    return value.slice();
  }
  if (value === null || value === undefined || isPlainObject(value)) {
    return Object.assign({}, value);
  }
  return value;
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

export function $assign(obj) {
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

function createSelectorProxy(context) {
  const proxy = new Proxy(x => undefined, {
    get(target, prop) {
      if (prop === contextProp) return context;
      context = context.child(prop);
      return proxy;
    },
    set(target, prop, value) {
      context.apply($set, prop, value);
      return proxy;
    },
    apply(target, thisArg, args) {
      const action = context.path;
      // back to parent node
      context = context.backToParent();
      context.apply.apply(context, [action].concat(args));
      return proxy;
    }
  });
  return proxy;
}

export function spec(value) {
  return function(node) {
    if (value) {
      processSpec(node, value);
    }
    return node;
  };
}

export function $if(current, condition, thenSpec, elseSpec) {
  return spec(condition(current) ? thenSpec : elseSpec);
}

export function $switch(current, makeChoice, specs = {}) {
  if (!(makeChoice instanceof Function)) {
    specs = makeChoice;
    makeChoice = null;
  }
  return spec(
    specs[makeChoice instanceof Function ? makeChoice(current) : current] ||
      specs.default
  );
}

export function $unless(current, condition, value) {
  return spec(condition(current) ? undefined : value);
}

export function $set(current) {
  const args = arraySlice.call(arguments, 1);
  if (args.length < 2) {
    return args[0];
  }
  // don't use destructing to improve performance
  const prop = args[0];
  const value = args[1];
  if (current[prop] === value) return current;
  const newValue = clone(current);
  newValue[prop] = value;
  return newValue;
}

function processSpec(child, value) {
  // is main spec
  if (value[0] instanceof Function || typeof value[0] === "string") {
    // is modifier and its args
    child.apply.apply(child, value);
  } else {
    processSubSpec(child, value);
  }
}

function processSubSpec(child, value) {
  // is sub spec
  const spec = value[0];
  if (spec instanceof Array) {
    const filter = value[1];
    const limit = value[2];
    let applied = 0;
    // apply for each child
    for (let key of Object.keys(child.value)) {
      // only apply spec for child which is satisfied filter
      if (filter && !filter(child.value[key], key)) {
        continue;
      }
      const newChild = child.child(key);
      newChild.apply.apply(newChild, spec);
      applied++;
      if (limit && applied >= limit) {
        break;
      }
    }
  } else {
    for (let key in child.value) {
      traversal(child.child(key), spec);
    }
  }
}

function traversal(parent, node) {
  for (let pair of Object.entries(node)) {
    const key = pair[0];
    let value = pair[1];
    if (key.charAt(0) === "?") {
      // is wildcard
      parent.descendants(key.substr(1), value);
      continue;
    }
    // convert obj method to custom modifier
    if (value instanceof Function) {
      value = [value];
    }
    const child = parent.childFromPath(key);
    if (value instanceof Array) {
      processSpec(child, value);
    } else if (isPlainObject(value)) {
      traversal(child, value);
    } else {
      child.apply($set, value);
    }
  }
}

// a token to determine batch actions
export function $batch() {
  // do nothing
}

export const update = (state, changes) => {
  const root = new Immutable(state);

  if (changes instanceof Array) {
    processSpec(root, changes);
  } else {
    traversal(root, changes);
  }

  return root.value;
};

export function updatePath(state, ...specs) {
  const root = new Immutable(state);

  for (let spec of specs) {
    if (spec instanceof Function) {
      spec = [spec];
    }
    const selector = spec[0];
    const args = spec.slice(1);
    const node = selector(createSelectorProxy(root))[contextProp];
    if (args.length) {
      node.apply.apply(node, args);
    }
  }

  return root.value;
}

export default update;

export const actions = {
  $batch,
  batch: $batch,
  "=": $set,
  $assign,
  assign: $assign,
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
  swap: $swap,
  $removeAt,
  removeAt: $removeAt,
  if: $if,
  $if,
  $unless,
  unless: $unless,
  $switch,
  switch: $switch,
  $filter,
  filter: $filter
};

function cloneIfPossible(callback) {
  return function() {
    arguments[0] = clone(arguments[0]);
    return callback.apply(null, arguments);
  };
}

export function define(name, action, disableAutoClone) {
  // define(actionHash, disableAutoClone)
  if (isPlainObject(name)) {
    disableAutoClone = action;
    for (let pair of Object.entries(name)) {
      actions[pair.key] = disableAutoClone
        ? pair.value
        : cloneIfPossible(pair.value);
    }
  } else {
    // define(name, action, disableAutoClone)
    actions[name] = disableAutoClone ? action : cloneIfPossible(action);
  }
}
