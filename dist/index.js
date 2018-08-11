"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.configure = configure;
exports.$toggle = $toggle;
exports.$unset = $unset;
exports.$splice = $splice;
exports.$removeAt = $removeAt;
exports.$push = $push;
exports.$unshift = $unshift;
exports.$pop = $pop;
exports.$shift = $shift;
exports.$sort = $sort;
exports.$remove = $remove;
exports.$swap = $swap;
exports.$assign = $assign;
exports.spec = spec;
exports.$if = $if;
exports.$switch = $switch;
exports.$unless = $unless;
exports.$set = $set;
exports.$batch = $batch;
exports.updatePath = updatePath;
exports.define = define;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var configs = {
  // for fast performance, we process dot as separator only
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

var contextProp = "@@context";
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

      // is batch processing
      if (modifier === $batch) {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = args[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var job = _step.value;

            if (job instanceof Function) {
              job = [job];
            }
            this.apply.apply(this, job);
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

        return this;
      }

      var newValue = modifier.apply(null, [this.value].concat(args));

      // need special context
      while (newValue instanceof Function) {
        newValue = newValue(this);
      }
      // nothing to change
      if (newValue === this) {
        return this;
      }

      if (newValue !== this.value) {
        this.value = newValue;
        this.change(true);
      }
      return this;
    }
  }, {
    key: "change",
    value: function change(valueUpdated) {
      // notify to parent that child value is changed
      if (this.parent) {
        this.parent.change();
      }

      if (this.children.length) {
        // if this is parent, we must clone its value
        if (!this.changed) {
          this.changed = true;
          this.value = clone(this.value);
          var _iteratorNormalCompletion2 = true;
          var _didIteratorError2 = false;
          var _iteratorError2 = undefined;

          try {
            for (var _iterator2 = this.children[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
              var x = _step2.value;

              if (x.parent === this) {
                this.value[x.path] = x.value;
              }
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
        } else if (valueUpdated) {
          var newChildren = [];
          var _iteratorNormalCompletion3 = true;
          var _didIteratorError3 = false;
          var _iteratorError3 = undefined;

          try {
            for (var _iterator3 = this.children[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
              var _x = _step3.value;

              if (_x.parent === this && _x.path in this.value) {
                _x.value = this.value[_x.path];
                newChildren.push(_x);
              } else {
                // child is removed, so we detach the child
                delete _x.parent;
                delete this.childMap[_x.path];
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

          this.children = newChildren;
        }
      }

      // update parent model
      if (this.parent) {
        this.parent.value[this.path] = this.value;
      }
    }
  }, {
    key: "backToParent",
    value: function backToParent() {
      var _this = this;

      // make sure child should be removed fron its parent
      this.parent.children = this.parent.children.filter(function (x) {
        return x !== _this;
      });
      delete this.parent.childMap[this.path];
      return this.parent;
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
      return (path instanceof Array ? path : path.split(configs.separator)).reduce(function (parent, path) {
        return parent.child(path);
      }, this);
    }
  }, {
    key: "descendants",
    value: function descendants(pattern, specsOrCallback) {
      var callback = void 0;
      if (pattern) {
        // match node by pattern and data must be specs
        var specs = specsOrCallback;
        // convert pattern to regex

        var _pattern$split = pattern.split("/"),
            _pattern$split2 = _slicedToArray(_pattern$split, 3),
            exp = _pattern$split2[1],
            flags = _pattern$split2[2];

        pattern = new RegExp(exp, flags);
        callback = function callback(value) {
          if ((typeof value === "undefined" ? "undefined" : _typeof(value)) === "object") {
            for (var key in value) {
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
          var originalCallback = specsOrCallback[0];
          var _specs = specsOrCallback.slice(1);
          callback = function callback() {
            var result = originalCallback.apply(null, arguments);
            if (typeof result === "number") {
              return _specs[result];
            }
            return result ? _specs[0] : undefined;
          };
        } else {
          // data must be callback func, it will be called when visit node
          callback = specsOrCallback;
        }
      }

      function traversal(root, parent, path) {
        if (parent instanceof Array || isPlainObject(parent)) {
          var _iteratorNormalCompletion4 = true;
          var _didIteratorError4 = false;
          var _iteratorError4 = undefined;

          try {
            for (var _iterator4 = Object.entries(parent)[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
              var pair = _step4.value;

              var value = pair[1];
              var key = pair[0];
              var childPath = path.concat(key);
              var _specs2 = callback(value, key);
              if (_specs2) {
                // create node from path
                var node = root.childFromPath(childPath);
                processSpec(node, _specs2);
              }
              traversal(root, value, childPath);
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
        }
      }

      traversal(this, this.value, []);
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
  var _iteratorNormalCompletion5 = true;
  var _didIteratorError5 = false;
  var _iteratorError5 = undefined;

  try {
    for (var _iterator5 = props[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
      var prop = _step5.value;

      newValue[prop] = !newValue[prop];
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

  return newValue;
}

function $unset(current) {
  var props = arraySlice.call(arguments, 1);
  // no prop to unset => unset its self
  if (!props.length) {
    return function (node) {
      var parent = node.parent;
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

function $removeAt(array) {
  var indexes = arraySlice.call(arguments, 1);
  var newArray = array;
  // remove from bottom to top
  indexes.sort();
  while (indexes.length) {
    var index = indexes.pop();
    if (index >= 0 && index < newArray.length) {
      if (newArray === array) {
        newArray = newArray.slice();
      }
      newArray.splice(index, 1);
    }
  }

  return newArray;
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
  if (value instanceof Array) {
    return value.slice();
  }
  if (value === null || value === undefined || isPlainObject(value)) {
    return Object.assign({}, value);
  }
  return value;
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

function $assign(obj) {
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

function createSelectorProxy(context) {
  var proxy = new Proxy(function (x) {
    return undefined;
  }, {
    get: function get(target, prop) {
      if (prop === contextProp) return context;
      context = context.child(prop);
      return proxy;
    },
    set: function set(target, prop, value) {
      context.apply($set, prop, value);
      return proxy;
    },
    apply: function apply(target, thisArg, args) {
      var action = context.path;
      // back to parent node
      context = context.backToParent();
      context.apply.apply(context, [action].concat(args));
      return proxy;
    }
  });
  return proxy;
}

function spec(value) {
  return function (node) {
    if (value) {
      processSpec(node, value);
    }
    return node;
  };
}

function $if(current, condition, thenSpec, elseSpec) {
  return spec(condition(current) ? thenSpec : elseSpec);
}

function $switch(current, makeChoice) {
  var specs = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  if (!(makeChoice instanceof Function)) {
    specs = makeChoice;
    makeChoice = null;
  }
  return spec(specs[makeChoice instanceof Function ? makeChoice(current) : current] || specs.default);
}

function $unless(current, condition, value) {
  return spec(condition(current) ? undefined : value);
}

function $set(current) {
  var args = arraySlice.call(arguments, 1);
  if (args.length < 2) {
    return args[0];
  }
  // don't use destructing to improve performance
  var prop = args[0];
  var value = args[1];
  if (current[prop] === value) return current;
  var newValue = clone(current);
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
  var spec = value[0];
  var filter = value[1];
  if (spec instanceof Array) {
    // apply for each child
    var _iteratorNormalCompletion6 = true;
    var _didIteratorError6 = false;
    var _iteratorError6 = undefined;

    try {
      for (var _iterator6 = Object.keys(child.value)[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
        var key = _step6.value;

        // only apply spec for child which is satisfied filter
        if (filter && !filter(child.value[key], key)) {
          continue;
        }
        var newChild = child.child(key);
        newChild.apply.apply(newChild, spec);
      }
    } catch (err) {
      _didIteratorError6 = true;
      _iteratorError6 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion6 && _iterator6.return) {
          _iterator6.return();
        }
      } finally {
        if (_didIteratorError6) {
          throw _iteratorError6;
        }
      }
    }
  } else {
    var _iteratorNormalCompletion7 = true;
    var _didIteratorError7 = false;
    var _iteratorError7 = undefined;

    try {
      for (var _iterator7 = Object.keys(child.value)[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
        var _key = _step7.value;

        traversal(child.child(_key), spec);
      }
    } catch (err) {
      _didIteratorError7 = true;
      _iteratorError7 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion7 && _iterator7.return) {
          _iterator7.return();
        }
      } finally {
        if (_didIteratorError7) {
          throw _iteratorError7;
        }
      }
    }
  }
}

function traversal(parent, node) {
  var _iteratorNormalCompletion8 = true;
  var _didIteratorError8 = false;
  var _iteratorError8 = undefined;

  try {
    for (var _iterator8 = Object.entries(node)[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
      var pair = _step8.value;

      var key = pair[0];
      var value = pair[1];
      if (key.charAt(0) === "?") {
        // is wildcard
        parent.descendants(key.substr(1), value);
        continue;
      }
      // convert obj method to custom modifier
      if (value instanceof Function) {
        value = [value];
      }
      var child = parent.childFromPath(key);
      if (value instanceof Array) {
        processSpec(child, value);
      } else if (isPlainObject(value)) {
        traversal(child, value);
      } else {
        child.apply($set, value);
      }
    }
  } catch (err) {
    _didIteratorError8 = true;
    _iteratorError8 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion8 && _iterator8.return) {
        _iterator8.return();
      }
    } finally {
      if (_didIteratorError8) {
        throw _iteratorError8;
      }
    }
  }
}

// a token to determine batch actions
function $batch() {
  // do nothing
}

var update = exports.update = function update(state, changes) {
  var root = new Immutable(state);

  if (changes instanceof Array) {
    processSpec(root, changes);
  } else {
    traversal(root, changes);
  }

  return root.value;
};

function updatePath(state) {
  var root = new Immutable(state);

  for (var _len = arguments.length, specs = Array(_len > 1 ? _len - 1 : 0), _key2 = 1; _key2 < _len; _key2++) {
    specs[_key2 - 1] = arguments[_key2];
  }

  var _iteratorNormalCompletion9 = true;
  var _didIteratorError9 = false;
  var _iteratorError9 = undefined;

  try {
    for (var _iterator9 = specs[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
      var _spec = _step9.value;

      if (_spec instanceof Function) {
        _spec = [_spec];
      }
      var selector = _spec[0];
      var args = _spec.slice(1);
      var node = selector(createSelectorProxy(root))[contextProp];
      if (args.length) {
        node.apply.apply(node, args);
      }
    }
  } catch (err) {
    _didIteratorError9 = true;
    _iteratorError9 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion9 && _iterator9.return) {
        _iterator9.return();
      }
    } finally {
      if (_didIteratorError9) {
        throw _iteratorError9;
      }
    }
  }

  return root.value;
}

exports.default = update;
var actions = exports.actions = {
  $batch: $batch,
  batch: $batch,
  "=": $set,
  $assign: $assign,
  assign: $assign,
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
  swap: $swap,
  $removeAt: $removeAt,
  removeAt: $removeAt,
  if: $if,
  $if: $if,
  $unless: $unless,
  unless: $unless,
  $switch: $switch,
  switch: $switch
};

function cloneIfPossible(callback) {
  return function () {
    arguments[0] = clone(arguments[0]);
    return callback.apply(null, arguments);
  };
}

function define(name, action, disableAutoClone) {
  // define(actionHash, disableAutoClone)
  if (isPlainObject(name)) {
    disableAutoClone = action;
    var _iteratorNormalCompletion10 = true;
    var _didIteratorError10 = false;
    var _iteratorError10 = undefined;

    try {
      for (var _iterator10 = Object.entries(name)[Symbol.iterator](), _step10; !(_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done); _iteratorNormalCompletion10 = true) {
        var pair = _step10.value;

        actions[pair.key] = disableAutoClone ? pair.value : cloneIfPossible(pair.value);
      }
    } catch (err) {
      _didIteratorError10 = true;
      _iteratorError10 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion10 && _iterator10.return) {
          _iterator10.return();
        }
      } finally {
        if (_didIteratorError10) {
          throw _iteratorError10;
        }
      }
    }
  } else {
    // define(name, action, disableAutoClone)
    actions[name] = disableAutoClone ? action : cloneIfPossible(action);
  }
}
//# sourceMappingURL=index.js.map