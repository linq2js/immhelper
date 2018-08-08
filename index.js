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
    return path.split(/\./).reduce((parent, path) => parent.child(path), this);
  }
}

export function $toggle(current, ...props) {
  if (!props.length) {
    return !current;
  }

  if (current instanceof Array) {
    const array = current.slice();
    props.forEach(prop => (array[prop] = !array[prop]));
    return array;
  }
  const obj = Object.assign({}, current);
  props.forEach(prop => (obj[prop] = !obj[prop]));
  return obj;
}

export function $unset(current, ...props) {
  if (!current) return;
  let newValue = current;
  const isArray = current instanceof Array;
  props.forEach(prop => {
    if (prop in newValue) {
      if (newValue === current) {
        if (isArray) {
          newValue = current.slice();
        } else {
          newValue = Object.assign({}, current);
        }
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

const isPlainObject = val =>
  !!val && typeof val === 'object' && val.constructor === Object;

export function $remove(array, ...items) {
  const newArray = array.filter(x => items.indexOf(x) === -1);
  return newArray.length === array.length ? array : newArray;
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
  if (current instanceof Array) {
    const array = current.slice();
    array[prop] = value;
    return array;
  }
  const obj = {
    ...current
  };
  obj[prop] = value;
  return obj;
}

export function update(state, changes) {
  const root = new Immutable(state);

  function traversal(parent, node) {
    Object.entries(node).forEach(([key, value]) => {
      const child = parent.childFromPath(key);
      if (value instanceof Array) {
        if (value[0] instanceof Function) {
          child.apply(...value);
        } else {
          if (child.value instanceof Array) {
            const spec = value[0];
            if (spec instanceof Array) {
              // apply for each child
              child.value.forEach((item, index) => {
                child.child(index).apply(...spec);
              });
            } else {
              child.value.forEach((item, index) => {
                traversal(child.child(index), spec);
              });
            }
          } else {
            throw new Error(
              'Invalid spec. Cannot apply spec for ' + child.value
            );
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
