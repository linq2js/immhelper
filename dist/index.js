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
exports.$map = $map;
exports.$removeAt = $removeAt;
exports.$push = $push;
exports.$filter = $filter;
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
exports.createModifier = createModifier;

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

var pathCache = {};
var contextProp = "@@context";
function configure(newConfigs) {
  Object.assign(configs, newConfigs);
}

function isEqual(a, b) {
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  return a === b;
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

            if (isPlainObject(job)) {
              processSpec(this, job);
            } else {
              if (typeof job === "function") {
                job = [job];
              }
              this.apply.apply(this, job);
            }
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

      var newValue = modifier.apply(null, [this.value instanceof Date ? new Date(this.value.getTime()) : this.value].concat(args));

      // need special context
      while (typeof newValue === "function") {
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
  }, {
    key: "change",
    value: function change(valueUpdated) {
      var _this = this;

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
          this.children = this.children.filter(function (x) {
            if (x.parent === _this && x.path in _this.value) {
              x.value = _this.value[x.path];
              return true;
            }
            // child is removed, so we detach the child
            delete x.parent;
            delete _this.childMap[x.path];
            return false;
          });
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
      var _this2 = this;

      // make sure child should be removed fron its parent
      this.parent.children = this.parent.children.filter(function (x) {
        return x !== _this2;
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
    key: "parsePath",
    value: function parsePath(path) {
      if (Array.isArray(path)) return path;
      var cachedPath = pathCache[path];
      if (cachedPath) return cachedPath;
      return pathCache[path] = path.split(configs.separator);
    }
  }, {
    key: "childFromPath",
    value: function childFromPath(path) {
      return this.parsePath(path).reduce(function (parent, path) {
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
        if (Array.isArray(specsOrCallback)) {
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
        if (Array.isArray(parent) || isPlainObject(parent)) {
          var _iteratorNormalCompletion3 = true;
          var _didIteratorError3 = false;
          var _iteratorError3 = undefined;

          try {
            for (var _iterator3 = Object.entries(parent)[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
              var pair = _step3.value;

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
  var _iteratorNormalCompletion4 = true;
  var _didIteratorError4 = false;
  var _iteratorError4 = undefined;

  try {
    for (var _iterator4 = props[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
      var prop = _step4.value;

      newValue[prop] = !newValue[prop];
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
        if (Array.isArray(parent.value)) {
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
  if (typeof props[0] === "function") {
    var filter = props[0];
    for (var prop in current) {
      if (!filter(current[prop], prop)) {
        if (newValue === current) {
          newValue = {};
        }
        newValue[prop] = current[prop];
      }
    }

    return newValue;
  }

  var _iteratorNormalCompletion5 = true;
  var _didIteratorError5 = false;
  var _iteratorError5 = undefined;

  try {
    for (var _iterator5 = props[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
      var _prop = _step5.value;

      if (_prop in newValue) {
        if (newValue === current) {
          newValue = clone(current);
        }
        delete newValue[_prop];
      }
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

function arrayOp(array, modifier) {
  if (!array) {
    array = [];
  } else {
    array = array.slice(0);
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

function $map(array, mapper) {
  var hasChange = false;
  var newArray = array.map(function () {
    var newItem = mapper.apply(this, arguments);
    if (newItem !== arguments[0]) {
      hasChange = true;
    }
    return newItem;
  });
  return hasChange ? newArray : array;
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

function $filter(array, filter) {
  var newArray = array.filter(filter);
  if (newArray.length !== array.length) return newArray;
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
  if (Array.isArray(value)) {
    return value.concat([]);
  }
  if (value === null || value === undefined || isPlainObject(value)) {
    var newObject = {};
    var _iteratorNormalCompletion6 = true;
    var _didIteratorError6 = false;
    var _iteratorError6 = undefined;

    try {
      for (var _iterator6 = Object.keys(value)[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
        var prop = _step6.value;

        newObject[prop] = value[prop];
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

    return newObject;
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
  var length = arguments.length;
  var mergedObj = obj;
  var changed = false;
  for (var index = 1; index < length; index++) {
    var value = arguments[index];
    if (value === null || value === undefined) {
      continue;
    }
    var _iteratorNormalCompletion7 = true;
    var _didIteratorError7 = false;
    var _iteratorError7 = undefined;

    try {
      for (var _iterator7 = Object.keys(value)[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
        var key = _step7.value;

        if (value[key] !== mergedObj[key]) {
          if (!changed) {
            changed = true;
            // clone before updating
            mergedObj = {};
            var _iteratorNormalCompletion8 = true;
            var _didIteratorError8 = false;
            var _iteratorError8 = undefined;

            try {
              for (var _iterator8 = Object.keys(obj)[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
                var prop = _step8.value;

                mergedObj[prop] = obj[prop];
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
          mergedObj[key] = value[key];
        }
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
  return mergedObj;
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

  if (!(typeof makeChoice === "function")) {
    specs = makeChoice;
    makeChoice = null;
  }
  return spec(specs[typeof makeChoice === "function" ? makeChoice(current) : current] || specs.default);
}

function $unless(current, condition, value) {
  return spec(condition(current) ? undefined : value);
}

function $set(current, prop, value) {
  if (arguments.length < 3) {
    return prop;
  }
  if (typeof value === "function") {
    value = value(current[prop], current);
  }
  if (current[prop] === value) return current;
  var newValue = clone(current);
  newValue[prop] = value;
  return newValue;
}

function processSpec(child, value) {
  // is main spec
  if (typeof value[0] === "function" || typeof value[0] === "string") {
    // is modifier and its args
    child.apply.apply(child, value);
  } else {
    processSubSpec(child, value);
  }
}

function processSubSpec(child, value) {
  // is sub spec
  var spec = value[0];
  if (Array.isArray(spec)) {
    var filter = value[1];
    var limit = value[2];
    var applied = 0;
    // apply for each child
    var _iteratorNormalCompletion9 = true;
    var _didIteratorError9 = false;
    var _iteratorError9 = undefined;

    try {
      for (var _iterator9 = Object.keys(child.value)[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
        var key = _step9.value;

        // only apply spec for child which is satisfied filter
        if (filter && !filter(child.value[key], key)) {
          continue;
        }
        var newChild = child.child(key);
        newChild.apply.apply(newChild, spec);
        applied++;
        if (limit && applied >= limit) {
          break;
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
  } else {
    var _iteratorNormalCompletion10 = true;
    var _didIteratorError10 = false;
    var _iteratorError10 = undefined;

    try {
      for (var _iterator10 = Object.keys(child.value)[Symbol.iterator](), _step10; !(_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done); _iteratorNormalCompletion10 = true) {
        var _key = _step10.value;

        traversal(child.child(_key), spec);
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
  }
}

function traversal(parent, node) {
  var _iteratorNormalCompletion11 = true;
  var _didIteratorError11 = false;
  var _iteratorError11 = undefined;

  try {
    for (var _iterator11 = Object.keys(node)[Symbol.iterator](), _step11; !(_iteratorNormalCompletion11 = (_step11 = _iterator11.next()).done); _iteratorNormalCompletion11 = true) {
      var key = _step11.value;

      var value = node[key];
      if (key.charAt(0) === "?") {
        // is wildcard
        parent.descendants(key.substr(1), value);
        continue;
      }
      // convert obj method to custom modifier
      if (typeof value === "function") {
        value = [value];
      }
      var child = parent.childFromPath(key);
      if (Array.isArray(value)) {
        processSpec(child, value);
      } else if (isPlainObject(value)) {
        traversal(child, value);
      } else {
        child.apply($set, value);
      }
    }
  } catch (err) {
    _didIteratorError11 = true;
    _iteratorError11 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion11 && _iterator11.return) {
        _iterator11.return();
      }
    } finally {
      if (_didIteratorError11) {
        throw _iteratorError11;
      }
    }
  }
}

// a token to determine batch actions
function $batch() {
  // do nothing
}

var update = exports.update = function update(state, changes) {
  // create curry func
  if (arguments.length === 1) {
    changes = state;
    return function (state) {
      return update(state, changes);
    };
  }
  var root = new Immutable(state);

  if (Array.isArray(changes)) {
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

  var _iteratorNormalCompletion12 = true;
  var _didIteratorError12 = false;
  var _iteratorError12 = undefined;

  try {
    for (var _iterator12 = specs[Symbol.iterator](), _step12; !(_iteratorNormalCompletion12 = (_step12 = _iterator12.next()).done); _iteratorNormalCompletion12 = true) {
      var _spec = _step12.value;

      if (typeof _spec === "function") {
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
    _didIteratorError12 = true;
    _iteratorError12 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion12 && _iterator12.return) {
        _iterator12.return();
      }
    } finally {
      if (_didIteratorError12) {
        throw _iteratorError12;
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
  switch: $switch,
  $filter: $filter,
  filter: $filter,
  map: $map,
  $map: $map
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
    var _iteratorNormalCompletion13 = true;
    var _didIteratorError13 = false;
    var _iteratorError13 = undefined;

    try {
      for (var _iterator13 = Object.entries(name)[Symbol.iterator](), _step13; !(_iteratorNormalCompletion13 = (_step13 = _iterator13.next()).done); _iteratorNormalCompletion13 = true) {
        var pair = _step13.value;

        actions[pair[0]] = disableAutoClone ? pair.value : cloneIfPossible(pair[1]);
      }
    } catch (err) {
      _didIteratorError13 = true;
      _iteratorError13 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion13 && _iterator13.return) {
          _iterator13.return();
        }
      } finally {
        if (_didIteratorError13) {
          throw _iteratorError13;
        }
      }
    }
  } else {
    // define(name, action, disableAutoClone)
    actions[name] = disableAutoClone ? action : cloneIfPossible(action);
  }
}

function createModifier(getter, setter) {
  return Object.assign(function (specs) {
    var state = getter();
    var nextState = update(state, specs);
    if (state !== nextState) {
      setter(nextState);
    }
  }, {
    set: function set(nextState) {
      if (nextState === null || nextState === undefined) return;
      var state = getter();
      if (!state) {
        setter(nextState);
        return;
      }
      for (var prop in nextState) {
        if (state[prop] !== nextState) {
          setter(nextState);
          return;
        }
      }
    }
  });
}
//# sourceMappingURL=index.js.map