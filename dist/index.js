"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

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

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var configs = {
  separator: "."
};

var _Array$prototype = Array.prototype,
    arraySlice = _Array$prototype.slice,
    arrayShift = _Array$prototype.shift,
    arrayUnshift = _Array$prototype.unshift,
    arrayPush = _Array$prototype.push,
    arrayPop = _Array$prototype.pop,
    arraySplice = _Array$prototype.splice,
    arraySort = _Array$prototype.sort;
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
      var args = arraySlice.call(arguments, 1);
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
      if (!this.changed) {
        this.changed = true;
        if (this.value instanceof Array) {
          this.value = this.value.slice();
        } else if (isPlainObject(this.value)) {
          this.value = Object.assign({}, this.value);
        }
      }

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this.children[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var x = _step.value;

          this.value[x.path] = x.value;
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

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
  var props = arraySlice.call(arguments, 1);
  if (!props.length) {
    return !current;
  }
  var newValue = clone(current);
  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = props[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var prop = _step2.value;

      newValue[prop] = !newValue[prop];
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2.return) {
        _iterator2.return();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }

  return newValue;
}

function $unset(current) {
  var props = arraySlice.call(arguments, 1);
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

function arrayOp(array, modifier) {
  if (!array) {
    array = [];
  } else {
    array = array.slice();
  }
  modifier(array);
  return array;
}

function $splice(array, index, count) {
  var newItems = arraySlice.call(arguments, 3);
  if (newItems.length || count) {
    return arrayOp(array, function (x) {
      return arraySplice.apply(x, [index, count].concat(newItems));
    });
  }
  return array;
}

function $push(array) {
  var newItems = arraySlice.call(arguments, 1);
  if (newItems.length) {
    return arrayOp(array, function (x) {
      return arrayPush.apply(x, newItems);
    });
  }
  return array;
}

function $unshift(array) {
  var newItems = arraySlice.call(arguments, 1);
  if (newItems.length) {
    return arrayOp(array, function (x) {
      return arrayUnshift.apply(x, newItems);
    });
  }
  return array;
}

function $pop(array) {
  if (!array || array.length) {
    return arrayOp(array, function (x) {
      return x.pop();
    });
  }
  return array;
}

function $shift(array) {
  if (!array || array.length) {
    return arrayOp(array, function (x) {
      return x.shift();
    });
  }
  return array;
}

function $sort(array, sorter) {
  return arrayOp(array, function (x) {
    return x.sort(sorter);
  });
}

function clone(value) {
  if (value instanceof Array) return value.slice();
  return Object.assign({}, value);
}

var isPlainObject = function isPlainObject(val) {
  return !!val && (typeof val === "undefined" ? "undefined" : _typeof(val)) === "object" && val.constructor === Object;
};

function $remove(array) {
  var items = arraySlice.call(arguments, 1);
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
  var values = arraySlice.call(arguments, 1);
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
  var args = arraySlice.call(arguments, 1);
  if (args.length < 2) {
    return args[0];
  }
  // don't use destructing to improve performance
  var prop = args[0];
  var value = args[1];
  var newValue = clone(current);
  newValue[prop] = value;
  return newValue;
}

function update(state, changes) {
  var root = new Immutable(state);

  function traversal(parent, node) {
    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
      for (var _iterator3 = Object.entries(node)[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
        var pair = _step3.value;

        var key = pair[0];
        var value = pair[1];
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
              var _iteratorNormalCompletion4 = true;
              var _didIteratorError4 = false;
              var _iteratorError4 = undefined;

              try {
                for (var _iterator4 = Object.keys(child.value)[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                  var _key = _step4.value;

                  var newChild = child.child(_key);
                  newChild.apply.apply(newChild, spec);
                }
              } catch (err) {
                _didIteratorError4 = true;
                _iteratorError4 = err;
              } finally {
                try {
                  if (!_iteratorNormalCompletion4 && _iterator4.return) {
                    _iterator4.return();
                  }
                } finally {
                  if (_didIteratorError4) {
                    throw _iteratorError4;
                  }
                }
              }
            } else {
              var _iteratorNormalCompletion5 = true;
              var _didIteratorError5 = false;
              var _iteratorError5 = undefined;

              try {
                for (var _iterator5 = Object.keys(child.value)[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                  var _key2 = _step5.value;

                  traversal(child.child(_key2), spec);
                }
              } catch (err) {
                _didIteratorError5 = true;
                _iteratorError5 = err;
              } finally {
                try {
                  if (!_iteratorNormalCompletion5 && _iterator5.return) {
                    _iterator5.return();
                  }
                } finally {
                  if (_didIteratorError5) {
                    throw _iteratorError5;
                  }
                }
              }
            }
          }
        } else if (isPlainObject(value)) {
          traversal(child, value);
        } else {
          child.apply($set, value);
        }
      }
    } catch (err) {
      _didIteratorError3 = true;
      _iteratorError3 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion3 && _iterator3.return) {
          _iterator3.return();
        }
      } finally {
        if (_didIteratorError3) {
          throw _iteratorError3;
        }
      }
    }
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