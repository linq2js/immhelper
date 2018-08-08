"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.configure = configure;
exports.$toggle = $toggle;
exports.$unset = $unset;
exports.$splice = $splice;
exports.$push = $push;
exports.$unshift = $unshift;
exports.$pop = $pop;
exports.$shift = $shift;
exports.$sort = $sort;
exports.$remove = $remove;
exports.$swap = $swap;
exports.$merge = $merge;
exports.$set = $set;
exports.update = update;
exports.define = define;

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var configs = {
  separator: "."
};

function configure(newConfigs) {
  Object.assign(configs, newConfigs);
}

var Immutable = function () {
  function Immutable(value, parent, path) {
    _classCallCheck(this, Immutable);

    this.parent = parent;
    this.value = value;
    this.path = path;
    this.children = [];
    this.childMap = {};
  }

  _createClass(Immutable, [{
    key: "apply",
    value: function apply(modifier) {
      var args = [].slice.call(arguments, 1);
      if (typeof modifier === "string") {
        if (modifier in actions) {
          modifier = actions[modifier];
        } else {
          throw new Error("No action '" + modifier + "'' defined");
        }
      }
      var newValue = modifier.apply(null, [this.value].concat(args));
      if (newValue !== this.value) {
        this.value = newValue;
        this.change();
      }
      return this;
    }
  }, {
    key: "change",
    value: function change() {
      var _this = this;

      if (!this.changed) {
        this.changed = true;
        if (this.value instanceof Array) {
          this.value = this.value.slice();
        } else if (isPlainObject(this.value)) {
          this.value = Object.assign({}, this.value);
        }
      }

      this.children.forEach(function (x) {
        _this.value[x.path] = x.value;
      });

      if (this.parent) {
        this.parent.change();
      }
    }
  }, {
    key: "child",
    value: function child(path) {
      if (path in this.childMap) {
        return this.childMap[path];
      }
      var child = new Immutable(this.value[path], this, path);
      this.children.push(child);
      this.childMap[path] = child;
      return child;
    }
  }, {
    key: "childFromPath",
    value: function childFromPath(path) {
      return path.split(configs.separator).reduce(function (parent, path) {
        return parent.child(path);
      }, this);
    }
  }]);

  return Immutable;
}();

function $toggle(current) {
  var props = [].slice.call(arguments, 1);
  if (!props.length) {
    return !current;
  }
  var newValue = clone(current);
  props.forEach(function (prop) {
    return newValue[prop] = !newValue[prop];
  });
  return newValue;
}

function $unset(current) {
  var props = [].slice.call(arguments, 1);
  if (!current) return;
  var newValue = current;
  props.forEach(function (prop) {
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
  var _array;

  if (!array) {
    array = [];
  } else {
    array = array.slice();
  }
  (_array = array)[method].apply(_array, _toConsumableArray(args));
  return array;
}

function $splice(array, index, count) {
  var newItems = [].slice.call(arguments, 3);
  if (newItems.length || count) {
    return arrayOp(array, "splice", [index, count].concat(newItems));
  }
  return array;
}

function $push(array) {
  var newItems = [].slice.call(arguments, 1);
  if (newItems.length) {
    return arrayOp(array, "push", newItems);
  }
  return array;
}

function $unshift(array) {
  var newItems = [].slice.call(arguments, 1);
  if (newItems.length) {
    return arrayOp(array, "unshift", newItems);
  }
  return array;
}

function $pop(array) {
  if (!array || array.length) {
    return arrayOp(array, "pop");
  }
  return array;
}

function $shift(array) {
  if (!array || array.length) {
    return arrayOp(array, "pop");
  }
  return array;
}

function $sort(array, sorter) {
  return arrayOp(array, "sort", sorter);
}

function clone(value) {
  if (value instanceof Array) return value.slice();
  return Object.assign({}, value);
}

var isPlainObject = function isPlainObject(val) {
  return !!val && (typeof val === "undefined" ? "undefined" : _typeof(val)) === "object" && val.constructor === Object;
};

function $remove(array) {
  var items = [].slice.call(arguments, 1);
  var newArray = array.filter(function (x) {
    return items.indexOf(x) === -1;
  });
  return newArray.length === array.length ? array : newArray;
}

function $swap(current, from, to) {
  var newValue = clone(current);
  var temp = newValue[from];
  newValue[from] = newValue[to];
  newValue[to] = temp;
  return newValue;
}

function $merge(obj) {
  var values = [].slice.call(arguments, 1);
  if (values.length) {
    var mergedObj = obj;
    values.forEach(function (value) {
      if (value === null || value === undefined) return;
      for (var key in value) {
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

function $set(current) {
  var args = [].slice.call(arguments, 1);
  if (args.length < 2) {
    return args[0];
  }

  var _args = _slicedToArray(args, 2),
      prop = _args[0],
      value = _args[1];

  var newValue = clone(current);
  newValue[prop] = value;
  return newValue;
}

function update(state, changes) {
  var root = new Immutable(state);

  function traversal(parent, node) {
    Object.entries(node).forEach(function (_ref) {
      var _ref2 = _slicedToArray(_ref, 2),
          key = _ref2[0],
          value = _ref2[1];

      var child = parent.childFromPath(key);
      if (value instanceof Array) {
        // is spec
        if (value[0] instanceof Function || typeof value[0] === "string") {
          // is modifier and its args
          child.apply.apply(child, value);
        } else {
          // is sub spec
          var spec = value[0];
          if (spec instanceof Array) {
            // apply for each child
            Object.keys(child.value).forEach(function (key) {
              var newChild = child.child(key);
              newChild.apply.apply(newChild, spec);
            });
          } else {
            Object.keys(child.value).forEach(function (key) {
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
    root.apply.apply(root, changes);
  } else {
    traversal(root, changes);
  }

  return root.value;
}

exports.default = update;
var actions = exports.actions = {
  $merge: $merge,
  merge: $merge,
  $pop: $pop,
  pop: $pop,
  $push: $push,
  push: $push,
  $remove: $remove,
  remove: $remove,
  $set: $set,
  set: $set,
  $shift: $shift,
  shift: $shift,
  $sort: $sort,
  sort: $sort,
  $splice: $splice,
  splice: $splice,
  $toggle: $toggle,
  toggle: $toggle,
  $unset: $unset,
  unset: $unset,
  $unshift: $unshift,
  unshift: $unshift,
  $swap: $swap,
  swap: $swap
};

function define(name, action) {
  if (isPlainObject(name)) {
    Object.assign(actions, action);
  } else {
    actions[name] = action;
  }
}
//# sourceMappingURL=index.js.map