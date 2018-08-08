const configs = {
  separator: /\./
};

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

  apply(modifier, ...args) {
    const newValue = modifier(this.value, ...args);
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

    this.children.forEach(x => {
      this.value[x.path] = x.value;
    });

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

export function $toggle(current, ...props) {
  if (!props.length) {
    return !current;
  }
  const newValue = clone(current);
  props.forEach(prop => (newValue[prop] = !newValue[prop]));
  return newValue;
}

export function $unset(current, ...props) {
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

function arrayOp(array, method, args) {
  if (!array) {
    array = [];
  } else {
    array = array.slice();
  }
  array[method](...args);
  return array;
}

export function $splice(array, index, count, ...newItems) {
  if (newItems.length || count) {
    return arrayOp(array, 'splice', [index, count].concat(newItems));
  }
  return array;
}

export function $push(array, ...newItems) {
  if (newItems.length) {
    return arrayOp(array, 'push', newItems);
  }
  return array;
}

export function $unshift(array, ...newItems) {
  if (newItems.length) {
    return arrayOp(array, 'unshift', newItems);
  }
  return array;
}

export function $pop(array) {
  if (!array || array.length) {
    return arrayOp(array, 'pop');
  }
  return array;
}

export function $shift(array) {
  if (!array || array.length) {
    return arrayOp(array, 'pop');
  }
  return array;
}

export function $sort(array, sorter) {
  return arrayOp(array, 'sort', sorter);
}

function clone(value) {
  if (value instanceof Array) return value.slice();
  return Object.assign({}, value);
}

const isPlainObject = val =>
  !!val && typeof val === 'object' && val.constructor === Object;

export function $remove(array, ...items) {
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

export function $merge(obj, ...values) {
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

export function $set(current, ...args) {
  if (args.length < 2) {
    return args[0];
  }
  const [prop, value] = args;
  const newValue = clone(current);
  newValue[prop] = value;
  return newValue;
}

export function update(state, changes) {
  const root = new Immutable(state);

  function traversal(parent, node) {
    Object.entries(node).forEach(([key, value]) => {
      const child = parent.childFromPath(key);
      if (value instanceof Array) {
        // is spec
        if (value[0] instanceof Function || typeof value[0] === 'string') {
          if (typeof value[0] === 'string') {
            // is action name
            const actionName = value[0];
            if (actionName in actions) {
              child.apply(...[actions[actionName]].concat(value.slice(1)));
            } else {
              throw new Error(`No action '${actionName}'' defined`);
            }
          } else {
            // is modifier and its args
            child.apply(...value);
          }
        } else {
          // is sub spec
          const spec = value[0];
          if (spec instanceof Array) {
            // apply for each child
            Object.keys(child.value).forEach(key => {
              child.child(key).apply(...spec);
            });
          } else {
            Object.keys(child.value).forEach(key => {
              traversal(child.child(key), spec);
            });
          }
        }
      } else if (isPlainObject(value)) {
        traversal(child, value);
      } else {
        child.apply($set, value);
      }
    });
  }

  if (changes instanceof Array) {
    root.apply(...changes);
  } else {
    traversal(root, changes);
  }

  return root.value;
}

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
