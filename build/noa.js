var __extends = this.__extends || function (d, b) {
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var NOA;
(function (NOA) {
    var BaseData = (function () {
        function BaseData() {
            this.events = {
            };
            this.subscriptions = {
            };
            this.debugname = null;
            this.refcount = 0;
        }
        BaseData.prototype.removeSubscription = function (binding) {
            delete this.subscriptions[binding.id];
        };
        BaseData.prototype.addSubscription = function (binding) {
            this.subscriptions[binding.id] = binding;
        };
        BaseData.prototype.getSubscriptions = function () {
            var res = [];
            for(var key in this.subscriptions) {
                res.push(this.subscriptions[key]);
            }
            return res;
        };
        BaseData.prototype.getListeners = function (eventname) {
            if(this.events[eventname]) {
                return this.events[eventname];
            }
            return {
            };
        };
        BaseData.prototype.addEventListener = function (binding) {
            var eventname = binding.event;
            if(!this.events[eventname]) {
                this.events[eventname] = {
                };
            }
            this.events[eventname][binding.id] = binding;
        };
        BaseData.prototype.removeEventListener = function (binding) {
            delete this.events[binding.event][binding.id];
        };
        BaseData.prototype.free = function () {
            NOA.Util.each(this.events, function (listeners) {
                return NOA.Util.each(listeners, function (listener) {
                    return listener.free();
                });
            });
            NOA.Util.each(this.subscriptions, function (h) {
                return h.free();
            });
        };
        return BaseData;
    })();
    NOA.BaseData = BaseData;    
    var Base = (function () {
        function Base() {
            this.destroyed = false;
            this.freeing = false;
            this.noabase = new BaseData();
            this.noaid = Base.noaid += 1;
            var x = this;
            while(x = x['__proto__']) {
                if(!x.constructor.count) {
                    x.constructor.count = 0;
                }
                x.constructor.count += 1;
            }
        }
        Base.noaid = 0;
        Base.prototype.fire = function (event) {
            var args = [];
            for (var _i = 0; _i < (arguments.length - 1); _i++) {
                args[_i] = arguments[_i + 1];
            }
            if(this.destroyed) {
                return this;
            }
            var a = NOA.Util.makeArray(arguments);
            a.shift();
            var listeners = this.noabase.getListeners(event);
            NOA.Util.debugIn(this, "fires", event, ":", a);
            for(var key in listeners) {
                if(listeners[key]) {
                    listeners[key].fire.apply(listeners[key], a);
                }
            }
            NOA.Util.debugOut();
            return this;
        };
        Base.prototype.on = function (ev, caller, callback) {
            var a = NOA.Util.makeArray(arguments);
            var event = a.shift();
            var f = a.shift();
            var scope = this;
            if(!NOA.Util.isFunction(f)) {
                scope = f;
            }
            f = a.shift();
            return new NOA.Binding(event, this, caller, f);
        };
        Base.prototype.listen = function (other, event, callback) {
            other.on(event, this, callback);
            return this;
        };
        Base.prototype.unlisten = function (other, event) {
            if(!this.destroyed && !this.freeing) {
                var ar = this.noabase.getSubscriptions(), l = ar.length;
                for(var i = 0; i < l; i++) {
                    if(ar[i] && ar[i].source == other && ar[i].event == event) {
                        ar[i].free();
                    }
                }
            }
            return this;
        };
        Base.prototype.free = function () {
            if(this.destroyed || this.freeing) {
                return;
            }
            this.freeing = true;
            if(this.noabase.refcount > 0) {
                throw this.debugName() + " refuses to destruct: It is kept alive by something else.";
            }
            this.fire('free');
            this.noabase.free();
            this.destroyed = true;
            delete this.freeing;
            var x = this;
            while(x = x['__proto__']) {
                if(x.constructor.count !== undefined) {
                    x.constructor.count -= 1;
                }
            }
        };
        Base.prototype.onFree = function (caller, callback) {
            this.on('free', caller, callback);
            return this;
        };
        Base.prototype.live = function () {
            this.noabase.refcount += 1;
            this.debug("live", this.noabase.refcount);
            if(this.destroyed) {
                throw this + " Attempt to resurrect!";
            }
            return this;
        };
        Base.prototype.die = function () {
            if(this.destroyed || this.freeing) {
                return this;
            }
            this.noabase.refcount -= 1;
            this.debug("die", this.noabase.refcount);
            if(this.noabase.refcount == 0) {
                this.free();
            } else if(this.noabase.refcount < 0) {
                throw new Error(this + " Trying to kill a thing which is not living");
            }
            return this;
        };
        Base.prototype.uses = function (that) {
            if(that) {
                that.live();
                this.onFree(this, function () {
                    return that.die();
                });
            }
            return this;
        };
        Base.prototype.debugName = function (newname) {
            if(!newname) {
                if(this.noabase && this.noabase.debugname) {
                    return this.noabase.debugname;
                }
                return this.toString();
            } else {
                this.noabase.debugname = newname;
                return this;
            }
        };
        Base.prototype.debug = function () {
            var args = [];
            for (var _i = 0; _i < (arguments.length - 0); _i++) {
                args[_i] = arguments[_i + 0];
            }
            NOA.Util.debug.apply(NOA.Util, [
                this
            ].concat(NOA.Util.makeArray(arguments)));
        };
        Base.prototype.debugIn = function () {
            var args = [];
            for (var _i = 0; _i < (arguments.length - 0); _i++) {
                args[_i] = arguments[_i + 0];
            }
            NOA.Util.debugIn.apply(NOA.Util, [
                this
            ].concat(NOA.Util.makeArray(arguments)));
        };
        Base.prototype.debugOut = function () {
            var args = [];
            for (var _i = 0; _i < (arguments.length - 0); _i++) {
                args[_i] = arguments[_i + 0];
            }
            NOA.Util.debugOut();
        };
        return Base;
    })();
    NOA.Base = Base;    
    var GlobalEvents = (function (_super) {
        __extends(GlobalEvents, _super);
        function GlobalEvents() {
            _super.apply(this, arguments);

        }
        GlobalEvents.prototype.onListMove = function () {
        };
        GlobalEvents.prototype.onListSet = function () {
        };
        GlobalEvents.prototype.onListInsert = function () {
        };
        GlobalEvents.prototype.onListRemove = function () {
        };
        GlobalEvents.prototype.onRecordPut = function () {
        };
        GlobalEvents.prototype.fireListMove = function () {
        };
        GlobalEvents.prototype.fireListSet = function () {
        };
        GlobalEvents.prototype.fireListRemove = function () {
        };
        GlobalEvents.prototype.fireListInsert = function () {
        };
        GlobalEvents.prototype.fireRecordPut = function () {
        };
        return GlobalEvents;
    })(Base);
    NOA.GlobalEvents = GlobalEvents;    
    NOA.Events = new GlobalEvents();
})(NOA || (NOA = {}));
var NOA;
(function (NOA) {
    var Binding = (function () {
        function Binding(event, source, dest, callback) {
            this._firing = false;
            if(!callback) {
                throw this.toString() + ": no callback provided!";
            }
            this.id = "" + (++Binding.bindingcount);
            this.event = event;
            this.source = source;
            source.noabase.addEventListener(this);
            this.dest = dest instanceof NOA.Base ? dest : null;
            if(this.dest) {
                this.dest.noabase.addSubscription(this);
            }
            this.callback = callback;
        }
        Binding.bindingcount = 0;
        Binding.prototype.fire = function () {
            if(this._firing) {
                if(this.event == 'free') {
                    return;
                }
                throw this.toString() + ": exception: circular event detected";
            }
            this._firing = true;
            try  {
                this.callback.apply(this.dest, arguments);
            }finally {
                this._firing = false;
            }
        };
        Binding.prototype.free = function () {
            if(this.dest) {
                this.dest.noabase.removeSubscription(this);
            }
            this.source.noabase.removeEventListener(this);
        };
        Binding.prototype.toString = function () {
            return "[NOA.util.Binding on '" + this.event + "']";
        };
        return Binding;
    })();
    NOA.Binding = Binding;    
})(NOA || (NOA = {}));
var NOA;
(function (NOA) {
    var CellContainer = (function (_super) {
        __extends(CellContainer, _super);
        function CellContainer() {
            _super.apply(this, arguments);

        }
        CellContainer.prototype.fireCellChanged = function (index, newvalue, oldvalue, cell) {
            NOA.Util.notImplemented();
        };
        CellContainer.prototype.cell = function (index) {
            NOA.Util.notImplemented();
            return null;
        };
        return CellContainer;
    })(NOA.Base);
    NOA.CellContainer = CellContainer;    
    var ValueContainer = (function (_super) {
        __extends(ValueContainer, _super);
        function ValueContainer() {
            _super.apply(this, arguments);

        }
        ValueContainer.prototype.getOrigin = function () {
            return this.origin;
        };
        ValueContainer.prototype.setOrigin = function (origin) {
            this.origin = origin;
        };
        ValueContainer.prototype.get = function (caller, onChange) {
            if(onChange) {
                this.onChange(caller, onChange);
            }
            return this.value;
        };
        ValueContainer.prototype.changed = function () {
            var args = [];
            for (var _i = 0; _i < (arguments.length - 0); _i++) {
                args[_i] = arguments[_i + 0];
            }
            var a = NOA.Util.makeArray(arguments);
            a.unshift('change');
            this.fire.apply(this, a);
            return this;
        };
        ValueContainer.prototype.onChange = function (caller, callback) {
            return this.on('change', caller, callback);
        };
        return ValueContainer;
    })(NOA.Base);
    NOA.ValueContainer = ValueContainer;    
    var Cell = (function (_super) {
        __extends(Cell, _super);
        function Cell(parent, index, value, origin) {
                _super.call(this);
            this.index = -1;
            this.initialized = false;
            this.parent = parent;
            this.index = index;
            if(origin) {
                this.setOrigin(origin);
            } else if(value instanceof ValueContainer) {
                this.setOrigin((value).getOrigin());
            }
            this.set(value);
            this.initialized = true;
        }
        Cell.prototype.hasExpression = function () {
            return this.value instanceof ValueContainer;
        };
        Cell.prototype.set = function (newvalue) {
            var _this = this;
            if(this.destroyed) {
                return;
            }
            this.debugIn("Receiving new value: " + newvalue);
            var orig = this.value;
            if(newvalue != orig) {
                var oldvalue = orig;
                if(this.hasExpression()) {
                    oldvalue = orig.get();
                    this.unlisten(orig, 'change');
                }
                if(newvalue instanceof NOA.Base) {
                    newvalue.live();
                }
                if(orig instanceof NOA.Base) {
                    orig.die();
                }
                this.value = newvalue;
                if(this.hasExpression()) {
                    this.debug("now following", newvalue);
                    newvalue = (newvalue).get(newvalue, function (newv, oldv) {
                        _this.fireChanged(newv, oldv);
                    });
                }
                if(this.initialized) {
                    this.fireChanged(newvalue, oldvalue);
                }
            }
            this.debugOut();
        };
        Cell.prototype.fireChanged = function (newv, oldv) {
            if(this.parent) {
                this.parent.fireCellChanged(this.index, newv, oldv, this);
            }
            this.changed(newv, oldv, this);
        };
        Cell.prototype.get = function (caller, onchange) {
            var res = _super.prototype.get.call(this, caller, onchange);
            if(this.hasExpression()) {
                return res.get();
            }
            return res;
        };
        Cell.prototype.live = function () {
            if(this.parent) {
                this.parent.live();
            } else {
                _super.prototype.live.call(this);
            }
            return this;
        };
        Cell.prototype.die = function () {
            if(this.parent) {
                this.parent.die();
            } else {
                _super.prototype.die.call(this);
            }
            return this;
        };
        Cell.prototype.free = function () {
            if(this.hasExpression()) {
                this.unlisten(this.value, 'change');
            }
            if(this.value instanceof NOA.Base) {
                this.value.die();
            }
            _super.prototype.free.call(this);
        };
        Cell.prototype.toString = function () {
            return ((this.parent ? this.parent.debugName() + "." + this.index : "Cell " + this.noaid) + ":" + this.value);
        };
        return Cell;
    })(ValueContainer);
    NOA.Cell = Cell;    
})(NOA || (NOA = {}));
var NOA;
(function (NOA) {
    var Scope = (function () {
        function Scope(parentscope) {
            this.vars = {
            };
            this.parent = parentscope;
        }
        Scope.SCOPE = [];
        Scope.getCurrentScope = function getCurrentScope() {
            return Scope.SCOPE[0];
        };
        Scope.newScope = function newScope(basescope) {
            return new Scope(basescope);
        };
        Scope.pushScope = function pushScope(scope) {
            Scope.SCOPE.unshift(scope);
        };
        Scope.popScope = function popScope() {
            Scope.SCOPE.shift();
        };
        Scope.prototype.get = function (varname, readTracker) {
            if(varname in this.vars) {
                var thing = this.vars[varname];
                readTracker[thing.noaid] = thing;
                return thing;
            }
            if(this.parent) {
                return this.parent.get(varname, readTracker);
            }
            throw "Undefined variable: '" + varname + "'";
        };
        Scope.prototype.set = function (varname, value) {
            if(varname in this.vars) {
                throw "Already declared: '" + varname + "'";
            }
            if(!value) {
                throw "No value provided to Scope.set!";
            }
            this.vars[varname] = value;
        };
        return Scope;
    })();
    NOA.Scope = Scope;    
    var Expression = (function (_super) {
        __extends(Expression, _super);
        function Expression(func, scope) {
                _super.call(this);
            this.params = {
            };
            this.readTracker = null;
            this.func = func;
            this.scope = scope;
            this._apply();
        }
        Expression.prototype._apply = function () {
            if(this.destroyed) {
                return;
            }
            try  {
                Scope.pushScope(this.scope);
                var reads = this.readTracker = {
                };
                var origvalue = this.value;
                this.value = this.func.apply(this);
                if(origvalue != this.value) {
                    this.changed(this.value, origvalue);
                }
                for(var noaid in this.params) {
                    if(!reads[noaid]) {
                        var cell = this.params[noaid];
                        this.unlisten(cell, "change");
                    }
                }
                for(var noaid in reads) {
                    if(!this.params[noaid]) {
                        var cell = reads[noaid];
                        this.params[cell.noaid] = cell;
                        this.debug("Added expression dependency: " + cell.debugName());
                        this.listen(cell, "change", this._apply);
                    }
                }
            }finally {
                Scope.popScope();
            }
        };
        Expression.prototype.variable = function (name) {
            var thing = Scope.getCurrentScope().get(name, this.readTracker);
            NOA.Util.assert(!thing.destroyed);
            return thing.get();
        };
        Expression.prototype.free = function () {
            this.debug("freeing expression " + this.noaid);
            for(var key in this.params) {
                var cell = this.params[key];
                this.unlisten(cell, "change");
            }
            _super.prototype.free.call(this);
        };
        return Expression;
    })(NOA.ValueContainer);
    NOA.Expression = Expression;    
})(NOA || (NOA = {}));
var NOA;
(function (NOA) {
    var List = (function (_super) {
        __extends(List, _super);
        function List() {
                _super.call(this);
            this.cells = [];
            this.aggregates = {
            };
        }
        List.Aggregates = {
            count: "count",
            numbercount: "numbercount",
            sum: "sum",
            min: "min",
            max: "max",
            vag: "avg",
            first: "first",
            last: "last"
        };
        List.prototype.insert = function (index, value, origin) {
            this.debugIn("Insert at " + index + ": " + value);
            var cell = new NOA.Cell(this, index, value, origin);
            this.cells.splice(index, 0, cell);
            this._updateIndexes(index + 1, 1);
            this.fire('insert', index, cell.get(), cell);
            this.debugOut();
            return this;
        };
        List.prototype.set = function (index, value, origin) {
            this.debugIn("Set at " + index + ": " + value);
            this.cells[index].set(value);
            this.debugOut();
            return this;
        };
        List.prototype.fireCellChanged = function (index, newvalue, oldvalue, cell) {
            this.fire('set', index, newvalue, oldvalue, cell);
        };
        List.prototype.remove = function (index) {
            this.debugIn("Remove at " + index);
            var origcell = this.cells[index];
            var origvalue = origcell.get();
            this.cells.splice(index, 1);
            this._updateIndexes(index, -1);
            this.fire('remove', index, origvalue);
            origcell.free();
            this.debugOut();
            return origvalue;
        };
        List.prototype.move = function (from, to) {
            if(from == to) {
                return this;
            }
            this.debugIn("Move from " + from + " to " + to);
            var c = this.cells[from];
            c.index = to;
            if(from > to) {
                this._updateIndexes(to, from, 1);
                c.index = to;
                this.cells.splice(from, 1);
                this.cells.splice(to, 0, c);
            } else {
                this._updateIndexes(from, to, -1);
                this.cells.splice(to, 0, c);
                this.cells.splice(from, 1);
                this.cells[to].index = to;
            }
            this.fire('move', from, to);
            this.debugOut();
            return this;
        };
        List.prototype.cell = function (index) {
            return this.cells[index];
        };
        List.prototype.onInsert = function (caller, cb) {
            this.on('insert', caller, cb);
            return this;
        };
        List.prototype.onMove = function (caller, cb) {
            this.on('move', caller, cb);
            return this;
        };
        List.prototype.onRemove = function (caller, cb) {
            this.on('remove', caller, cb);
            return this;
        };
        List.prototype.onSet = function (caller, cb) {
            this.on('set', caller, cb);
            return this;
        };
        List.prototype._updateIndexes = function (start, end, delta) {
            if(arguments.length == 2) {
                var l = this.cells.length;
                for(var i = start; i < l; i++) {
                    this.cells[i].index += end;
                }
            } else if(arguments.length == 3) {
                for(var i = start; i < end; i++) {
                    this.cells[i].index += delta;
                }
            }
            return this;
        };
        List.prototype.replayInserts = function (scope, cb) {
            var l = this.cells.length;
            for(var i = 0; i < l; i++) {
                cb.call(scope, i, this.get(i), this.cells[i]);
            }
        };
        List.prototype.add = function (value, origin) {
            this.insert(this.cells.length, value, origin);
            return this;
        };
        List.prototype.aggregate = function (index, caller, onchange) {
            if(this.aggregates[index]) {
                return this.aggregates[index].get(caller, onchange);
            }
            if(!(NOA.Util[index] && NOA.Util[index].prototype == NOA.ListAggregation)) {
                throw "Unknown aggregate: " + index;
            }
            var a = this.aggregates[index] = this[index]();
            return a.get(onchange);
        };
        List.prototype.get = function (index) {
            return this.cells[index].get();
        };
        List.prototype.toArray = function (recurse) {
            var res = [];
            var l = this.cells.length;
            for(var i = 0; i < l; i++) {
                res.push(this.get(i));
            }
            return res;
        };
        List.prototype.removeAll = function (value) {
            for(var i = this.cells.length - 1; i >= 0; i--) {
                if(this.get(i) == value) {
                    this.remove(i);
                }
            }
        };
        List.prototype.free = function () {
            console.log("freeing " + this.cells.length);
            for(var i = this.cells.length - 1; i >= 0; i--) {
                this.cells[i].free();
            }
            _super.prototype.free.call(this);
        };
        List.prototype.map = function (name, func) {
            return new NOA.MappedList(this, name, func);
        };
        List.prototype.filter = function (name, func) {
            return new NOA.FilteredList(this, name, func);
        };
        List.prototype.subset = function (begin, end) {
            if(end === undefined) {
                return new NOA.SubSetList(this, begin, end);
            }
            return new NOA.ListTail(this, begin);
        };
        List.prototype.tail = function () {
            return new NOA.ListTail(this, 1);
        };
        List.prototype.last = function () {
            return new NOA.ListTail(this, -1);
        };
        List.prototype.reverse = function () {
            return new NOA.ReversedList(this);
        };
        List.prototype.sort = function (comperator) {
            return new NOA.SortedList(this, comperator);
        };
        List.prototype.distinct = function () {
            return new NOA.DistinctList(this);
        };
        List.prototype.join = function () {
            return new NOA.JoinedList(this);
        };
        List.prototype.sum = function () {
            return new NOA.ListSum(this);
        };
        List.prototype.min = function () {
            return new NOA.ListMin(this);
        };
        List.prototype.max = function () {
            return new NOA.ListMax(this);
        };
        List.prototype.avg = function () {
            return new NOA.ListAverage(this);
        };
        List.prototype.count = function () {
            return new NOA.ListCount(this);
        };
        List.prototype.first = function () {
            return new NOA.ListFirst(this);
        };
        List.prototype.numbercount = function () {
            return new NOA.ListNumberCount(this);
        };
        List.prototype.atIndex = function (index) {
            return new NOA.ListIndex(this, index);
        };
        return List;
    })(NOA.CellContainer);
    NOA.List = List;    
})(NOA || (NOA = {}));
var NOA;
(function (NOA) {
    var Record = (function (_super) {
        __extends(Record, _super);
        function Record() {
            _super.apply(this, arguments);

            this.data = {
            };
            this.keys = new NOA.List();
        }
        Record.prototype.set = function (key, value) {
            if(!this.has(key)) {
                this.data[key] = new NOA.Cell(this, key, value, this);
                this.keys.add(key, this);
                this.fire('set', key, value, undefined);
            } else if(this.get(key) != value) {
                (this.data[key]).set(value);
            }
        };
        Record.prototype.fireCellChanged = function (index, newvalue, oldvalue) {
            this.fire('set', index, newvalue, oldvalue);
        };
        Record.prototype.remove = function (key) {
            if(!this.has(key)) {
                return;
            }
            this.fire('remove', key);
            (this.data[key]).free();
            this.keys.removeAll(key);
            delete this.data[key];
        };
        Record.prototype.cell = function (key) {
            return this.data[key];
        };
        Record.prototype.get = function (key, caller, onchange) {
            if(!this.has(key)) {
                throw "Value for '" + key + "' is not yet defined!";
            }
            return (this.data[key]).get(caller, onchange);
        };
        Record.prototype.has = function (key) {
            return key in this.data;
        };
        Record.prototype.replaySets = function (handler) {
            for(var key in this.data) {
                handler.call(key, this.get(key));
            }
        };
        Record.prototype.onSet = function (caller, callback) {
            return this.on('set', caller, callback);
        };
        Record.prototype.onRemove = function (caller, callback) {
            return this.on('remove', caller, callback);
        };
        Record.prototype.toObject = function (recurse) {
            var res = {
            };
            for(var key in this.data) {
                res[key] = this.get(key);
            }
            return res;
        };
        Record.prototype.free = function () {
            for(var key in this.data) {
                (this.data[key]).die().free();
            }
            this.keys.free();
            _super.prototype.free.call(this);
        };
        return Record;
    })(NOA.CellContainer);
    NOA.Record = Record;    
})(NOA || (NOA = {}));
var NOA;
(function (NOA) {
    var ListTransformation = (function (_super) {
        __extends(ListTransformation, _super);
        function ListTransformation(source) {
            var _this = this;
                _super.call(this);
            this.source = source;
            this.uses(source);
            source.onFree(this, function () {
                _this.free();
            });
            source.onInsert(this, this.onSourceInsert);
            source.onSet(this, this.onSourceSet);
            source.onMove(this, this.onSourceMove);
            source.onRemove(this, this.onSourceRemove);
        }
        ListTransformation.prototype.onSourceInsert = function (index, value, cell) {
        };
        ListTransformation.prototype.onSourceRemove = function (index, value) {
        };
        ListTransformation.prototype.onSourceMove = function (from, to) {
        };
        ListTransformation.prototype.onSourceSet = function (index, newvalue, oldvalue, cell) {
        };
        return ListTransformation;
    })(NOA.List);
    NOA.ListTransformation = ListTransformation;    
    var MappedList = (function (_super) {
        __extends(MappedList, _super);
        function MappedList(source, name, func) {
                _super.call(this, source);
            this.basescope = NOA.Scope.getCurrentScope();
            this.func = func;
            this.varname = name;
            this.replayInserts(this, this.onSourceInsert);
        }
        MappedList.prototype.onSourceInsert = function (index, _, source) {
            var scope = NOA.Scope.newScope(this.basescope);
            scope.set(this.varname, source);
            var a;
            if(NOA.Util.isFunction(this.func)) {
                a = new NOA.Expression(this.func, scope);
            } else if(this.func instanceof NOA.Expression) {
                a = this.func;
            } else {
                throw "Map function should be JS function or expression";
            }
            this.insert(index, a, source);
        };
        MappedList.prototype.onSourceRemove = function (index, value) {
            this.remove(index);
        };
        MappedList.prototype.onSourceMove = function (from, to) {
            this.move(from, to);
        };
        return MappedList;
    })(ListTransformation);
    NOA.MappedList = MappedList;    
    var FilteredList = (function (_super) {
        __extends(FilteredList, _super);
        function FilteredList(source, name, func) {
            var _this = this;
                _super.call(this, source.map(name, func));
            this.mapping = [];
            this.parent = source;
            this.parent.debugName = function (_) {
                return "FilterMap-for-" + _this.debugName();
            };
            this.source.replayInserts(this, this.onSourceInsert);
        }
        FilteredList.prototype.updateMapping = function (index, delta, to) {
            var l = to ? to : this.mapping.length;
            for(var i = index; i < l; i++) {
                var m = this.mapping[i];
                this.mapping[i] = [
                    m[0] + delta, 
                    m[1]
                ];
            }
        };
        FilteredList.prototype.onSourceInsert = function (index, value) {
            var tidx = 0, l = this.mapping.length;
            if(index < l) {
                tidx = this.mapping[index][0];
            } else if(l > 0) {
                tidx = this.mapping[l - 1][0] + 1;
            }
            if(value === true) {
                this.mapping.splice(index, 0, [
                    tidx, 
                    true
                ]);
                this.updateMapping(index + 1, 1);
                this.insert(tidx, this.parent.cell(index));
            } else {
                this.mapping.splice(index, 0, [
                    tidx, 
                    false
                ]);
            }
        };
        FilteredList.prototype.onSourceRemove = function (index, value) {
            var tidx = this.mapping[index][0];
            var has = this.mapping[index][1];
            if(has) {
                this.remove(tidx);
                this.updateMapping(index + 1, -1);
            }
            this.mapping.splice(index, 1);
        };
        FilteredList.prototype.onSourceMove = function (from, to) {
            var tidx = this.mapping[to][0];
            var fidx = this.mapping[from][0];
            var hasf = this.mapping[from][1];
            if(hasf) {
                this.move(fidx, tidx);
            }
            if(to < from) {
                if(hasf) {
                    this.updateMapping(to, 1, from - 1);
                }
                this.mapping.splice(from, 1);
                this.mapping.splice(to, 0, [
                    tidx, 
                    hasf
                ]);
            } else {
                if(hasf) {
                    this.updateMapping(from + 1, -1, to);
                }
                this.mapping.splice(to, 0, [
                    tidx, 
                    hasf
                ]);
                this.mapping.splice(from, 1);
            }
        };
        FilteredList.prototype.onSourceSet = function (index, should, _) {
            var tidx = this.mapping[index][0];
            if(should) {
                this.mapping[index] = [
                    tidx, 
                    true
                ];
                this.updateMapping(index + 1, 1);
                this.insert(tidx, this.parent.cell(index));
            } else {
                this.remove(tidx);
                this.mapping[index] = [
                    tidx, 
                    false
                ];
                this.updateMapping(index + 1, -1);
            }
        };
        return FilteredList;
    })(ListTransformation);
    NOA.FilteredList = FilteredList;    
    var SubSetList = (function (_super) {
        __extends(SubSetList, _super);
        function SubSetList(source, begin, end) {
                _super.call(this, source);
            this.begin = begin;
            this.end = end;
            var l = Math.min(source.cells.length, end);
            for(var i = begin; i < l; i++) {
                this.add(source.cell(i));
            }
            this.unlisten(source, 'set');
        }
        SubSetList.prototype.removeLast = function () {
            if(this.cells.length > this.end - this.begin) {
                this.remove(this.cells.length - 1);
            }
        };
        SubSetList.prototype.addLast = function () {
            if(this.end < this.source.cells.length) {
                this.add(this.source.cell(this.end));
            }
        };
        SubSetList.prototype.removeFirst = function () {
            if(this.end - this.begin > 0) {
                this.remove(0);
            }
        };
        SubSetList.prototype.addFirst = function () {
            if(this.begin < this.source.cells.length) {
                this.insert(0, this.source.cell(this.begin));
            }
        };
        SubSetList.prototype.onSourceInsert = function (index, value, cell) {
            if(index < this.begin) {
                this.removeLast();
                this.addFirst();
            } else if(index >= this.begin && index < this.end) {
                this.removeLast();
                this.insert(index - this.begin, cell);
            }
        };
        SubSetList.prototype.onSourceRemove = function (index) {
            if(index < this.begin) {
                this.removeFirst();
                this.addLast();
            } else if(index >= this.begin && index < this.end) {
                this.remove(index - this.begin);
                this.addLast();
            }
        };
        SubSetList.prototype.onSourceMove = function (from, to) {
            if((from < this.begin && to < this.begin) || (from > this.end && to > this.end)) {
                return;
            }
            var f = from - this.begin;
            var t = to - this.begin;
            var l = this.end - this.begin;
            if(f >= 0 && f < l && t >= 0 && t < l) {
                this.move(f, t);
            } else {
                if(t >= 0 && t < l) {
                    this.insert(t, this.source.cell(from));
                    if(f < 0) {
                        this.removeFirst();
                        this.addLast();
                    } else {
                        this.removeLast();
                    }
                } else {
                    this.remove(f);
                    if(t < 0) {
                        this.addFirst();
                        this.removeLast();
                    } else {
                        this.addLast();
                    }
                }
            }
        };
        return SubSetList;
    })(ListTransformation);
    NOA.SubSetList = SubSetList;    
    var ReversedList = (function (_super) {
        __extends(ReversedList, _super);
        function ReversedList(source) {
                _super.call(this, source);
            var l = source.cells.length;
            for(var i = l - 1; i >= 0; i--) {
                this.add(source.cell(i));
            }
            this.unlisten(source, 'set');
        }
        ReversedList.prototype.onSourceInsert = function (index, value, cell) {
            this.insert(this.cells.length - index, cell);
        };
        ReversedList.prototype.onSourceRemove = function (index) {
            this.remove(this.cells.length - index - 1);
        };
        ReversedList.prototype.onSourceMove = function (from, to) {
            this.move(this.cells.length - from - 1, this.cells.length - to - 1);
        };
        return ReversedList;
    })(ListTransformation);
    NOA.ReversedList = ReversedList;    
    var SortedList = (function (_super) {
        __extends(SortedList, _super);
        function SortedList(source, comperator) {
                _super.call(this, source);
            this.mapping = [];
            this.func = comperator;
            if(comperator == null) {
                this.func = function (a, b) {
                    if(a == b) {
                        return 0;
                    } else if(a < b) {
                        return -1;
                    } else {
                        return 1;
                    }
                };
            }
            source.replayInserts(this, this.onSourceInsert);
            this.unlisten(source, 'move');
        }
        SortedList.prototype.updateMapping = function (from, delta) {
            var l = this.mapping.length;
            for(var i = 0; i < l; i++) {
                if(this.mapping[i] >= from) {
                    this.mapping[i] += delta;
                }
            }
        };
        SortedList.prototype.searcher = function (a, b) {
            return this.func(a, b.get());
        };
        SortedList.prototype.onSourceInsert = function (baseindex, value, cell, _knownindex) {
            var nidx = _knownindex;
            if(nidx === undefined) {
                nidx = NOA.Util.binarySearch(this.cells, value, this.searcher);
            }
            this.insert(nidx, value, cell.getOrigin());
            this.updateMapping(nidx, 1);
            this.mapping.splice(baseindex, 0, nidx);
        };
        SortedList.prototype.onSourceRemove = function (baseindex, _) {
            var idx = this.mapping[baseindex];
            this.remove(idx);
            this.updateMapping(idx, -1);
            this.mapping.splice(baseindex, 1);
        };
        SortedList.prototype.onSourceSet = function (index, value, _, cell) {
            var baseidx = this.mapping[index];
            var nidx = NOA.Util.binarySearch(this.cells, value, this.searcher);
            if(nidx != baseidx) {
                this.onSourceRemove(index);
                this.onSourceInsert(index, value, cell, nidx);
            } else {
                this.set(index, value);
            }
        };
        return SortedList;
    })(ListTransformation);
    NOA.SortedList = SortedList;    
    var DistinctList = (function (_super) {
        __extends(DistinctList, _super);
        function DistinctList(source) {
                _super.call(this, source);
            this.occ = {
            };
            source.replayInserts(this, this.onSourceInsert);
            this.unlisten(source, 'move');
        }
        DistinctList.prototype.toKey = function (value) {
            if(value === null || value === undefined) {
                return "";
            }
            if(value instanceof NOA.Base) {
                return "$$NOA#" + value.noaid;
            }
            return value.toString();
        };
        DistinctList.prototype.onSourceInsert = function (index, value, cell) {
            var key = this.toKey(value);
            var has = key in this.occ;
            if(!has) {
                this.add(value, cell);
                this.occ[key] = 1;
            } else {
                this.occ[key] += 1;
            }
        };
        DistinctList.prototype.onSourceRemove = function (index, value) {
            var key = this.toKey(value);
            var has = key in this.occ;
            if(has) {
                this.occ[key] -= 1;
                if(this.occ[key] == 0) {
                    this.removeAll(value);
                    delete this.occ[key];
                }
            }
        };
        DistinctList.prototype.onSourceSet = function (index, newvalue, origvalue, cell) {
            this.onSourceRemove(index, origvalue);
            this.onSourceInsert(index, newvalue, cell);
        };
        return DistinctList;
    })(ListTransformation);
    NOA.DistinctList = DistinctList;    
    var JoinedList = (function (_super) {
        __extends(JoinedList, _super);
        function JoinedList(source) {
                _super.call(this, source);
            this.lmap = [];
            source.replayInserts(this, this.onSourceInsert);
        }
        JoinedList.prototype.updateLmap = function (index, delta) {
            this.lmap[index][1] += delta;
            for(var i = index + 1; i < this.lmap.length; i++) {
                this.lmap[i][0] += delta;
            }
        };
        JoinedList.prototype.setupSublist = function (index, sublist) {
            var cell = this.source.cell(index);
            var sublistInsert = function (subindex, _, subcell) {
                this.insert(this.lmap[cell.index][0] + subindex, subcell);
                this.updateLmap(cell.index, +1);
            };
            sublist.replayInserts(this, sublistInsert);
            sublist.onInsert(this, sublistInsert);
            sublist.onMove(this, function (sf, st) {
                this.move(this.lmap[cell.index][0] + sf, this.lmap[cell.index][0] + st);
            });
            sublist.onRemove(this, function (sf) {
                this.remove(this.lmap[cell.index][0] + sf);
                this.updateLmap(cell.index, -1);
            });
        };
        JoinedList.prototype.onSourceInsert = function (index, value, cell) {
            var start = index == 0 ? 0 : this.lmap[index - 1][0] + this.lmap[index - 1][1];
            if(!(value instanceof NOA.List)) {
                this.lmap.splice(index, 0, [
                    start, 
                    1
                ]);
                this.insert(start, value, cell);
            } else {
                this.lmap.splice(index, 0, [
                    start, 
                    0
                ]);
                this.setupSublist(index, value);
            }
        };
        JoinedList.prototype.onSourceRemove = function (index, value) {
            if(value instanceof NOA.List) {
                this.unlisten(value, 'insert');
                this.unlisten(value, 'remove');
                this.unlisten(value, 'move');
            }
            var size = this.lmap[index][1];
            var start = this.lmap[index][0];
            this.updateLmap(index, -1 * size);
            this.lmap.splice(index, 1);
            for(var i = 0; i < size; i++) {
                this.remove(start);
            }
        };
        JoinedList.prototype.onSourceSet = function (index, newvalue, oldvalue, cell) {
            this.onSourceRemove(index, oldvalue);
            this.onSourceInsert(index, newvalue, cell);
        };
        JoinedList.prototype.onSourceMove = function (from, to) {
            var cell = this.source.cell(from);
            this.onSourceRemove(from, this.source.get(from));
            this.onSourceInsert(to > from ? to - 1 : to, cell.get(), cell);
        };
        return JoinedList;
    })(ListTransformation);
    NOA.JoinedList = JoinedList;    
    var ListTail = (function (_super) {
        __extends(ListTail, _super);
        function ListTail(source, start) {
                _super.call(this, source);
            if(start === undefined) {
                this.start = 1;
            }
            this.start = start;
            this.unlisten(source, 'set');
        }
        ListTail.prototype.onSourceInsert = function (index, _, cell) {
            if(index < this.start) {
                if(this.source.cells.length >= this.start) {
                    this.insert(0, this.source.get(this.start));
                }
            } else {
                this.insert(index - this.start, cell);
            }
        };
        ListTail.prototype.onSourceRemove = function (index, value) {
            if(index < this.start) {
                if(this.cells.length > 0) {
                    this.remove(0);
                }
            } else {
                this.remove(index - this.start);
            }
        };
        ListTail.prototype.onSourceMove = function (from, to) {
            if(from >= this.start && to >= this.start) {
                this.move(from - this.start, to - this.start);
            } else {
                if(from >= this.start) {
                    this.set(from - this.start, this.source.get(from));
                }
                if(to >= this.start) {
                    this.set(to - this.start, this.source.get(to));
                }
            }
        };
        return ListTail;
    })(ListTransformation);
    NOA.ListTail = ListTail;    
})(NOA || (NOA = {}));
var NOA;
(function (NOA) {
    var Util = (function () {
        function Util() { }
        Util.depth = 0;
        Util.count = 0;
        Util.testnr = 0;
        Util.GLOBALSCOPE = (function () {
            return this;
        })();
        Util.debugbreakon = -1;
        Util.debugIn = function debugIn() {
            var args = [];
            for (var _i = 0; _i < (arguments.length - 0); _i++) {
                args[_i] = arguments[_i + 0];
            }
            Util.depth += 1;
            Util.debug.apply(Util, arguments);
        };
        Util.debugOut = function debugOut() {
            var args = [];
            for (var _i = 0; _i < (arguments.length - 0); _i++) {
                args[_i] = arguments[_i + 0];
            }
            Util.depth = Math.max(Util.depth - 1, 0);
        };
        Util.debug = function debug() {
            var args = [];
            for (var _i = 0; _i < (arguments.length - 0); _i++) {
                args[_i] = arguments[_i + 0];
            }
            Util.count += 1;
            var p = '';
            for(var i = Util.depth; i >= 0; i-- , p += ' ') {
                ;
            }
            var stuff = [];
            for(var i = 0; i < arguments.length; i++) {
                var a = arguments[i];
                if(a === null) {
                    stuff.push("'null'");
                } else if(a === undefined) {
                    stuff.push("'undefined'");
                } else if(a.debugName) {
                    stuff.push(a.debugName());
                } else if(a.toString().indexOf(' ') > -1) {
                    stuff.push("'" + a.toString() + "'");
                } else {
                    stuff.push(a.toString());
                }
            }
            console.log(Util.count + ':' + p + stuff.join(' '));
            if(Util.count == Util.debugbreakon) {
                debugger;

            }
        };
        Util.warn = function warn() {
            var args = [];
            for (var _i = 0; _i < (arguments.length - 0); _i++) {
                args[_i] = arguments[_i + 0];
            }
            console.warn.apply(console, arguments);
        };
        Util.assert = function assert(value) {
            if(!value) {
                throw "NOA assertion failed!";
            }
        };
        Util.test = function test(test, expected) {
            Util.testnr += 1;
            if(('' + test) != ('' + expected)) {
                var msg = "Test #" + Util.testnr + " failed: '" + test + "' expected '" + expected + "'";
                console.error(msg);
                document.write("<br/>" + msg);
            }
        };
        Util.each = function each(ar, cb, scope, flags) {
            scope = scope || Util.GLOBALSCOPE;
            flags = flags || "";
            var map = flags.match(/m/), filter = flags.match(/f/), sparse = flags.match(/s/), reverse = flags.match(/r/), res = [], start = reverse ? ar.length - 1 : 0, delta = reverse ? -1 : 1, end = reverse ? -1 : ar.length, isArray = Util.isArray(ar);
            if(isArray) {
                for(var i = start; i != end; i += delta) {
                    if(ar[i] == null && sparse) {
                        continue;
                    }
                    var value = cb.call(scope, ar[i], i, ar, scope);
                    if(map) {
                        if(reverse) {
                            res.unshift(value);
                        } else {
                            res.push(value);
                        }
                    } else if(filter) {
                        if(value === true) {
                            if(reverse) {
                                res.unshift(ar[i]);
                            } else {
                                res.push(ar[i]);
                            }
                        }
                    } else if(value === false) {
                        break;
                    }
                }
                return res;
            } else {
                for(var key in ar) {
                    if(ar[key] == null && sparse) {
                        continue;
                    }
                    var value = cb.call(scope, ar[key], key, ar, scope);
                    if(map) {
                        res[key] = value;
                    } else if(filter) {
                        if(value === true) {
                            res[key] = ar[key];
                        }
                    } else if(value === false) {
                        break;
                    }
                }
                return res;
            }
        };
        Util.ensureObject = function ensureObject(path, scope) {
            var parts;
            if(Util.type(path) == "array") {
                parts = path;
            } else {
                parts = path.split(".");
            }
            if(scope == undefined) {
                scope = Util.GLOBALSCOPE;
            }
            for(var i = 0; i < parts.length; i++) {
                if(!scope[parts[i]]) {
                    scope[parts[i]] = {
                    };
                }
                scope = scope[parts[i]];
            }
            return scope;
        };
        Util.exists = function exists(path, scope) {
            var parts;
            if(Util.isArray(path)) {
                parts = path;
            } else {
                parts = path.split(".");
            }
            if(!scope) {
                scope = Util.GLOBALSCOPE;
            }
            for(var i = 0; i < parts.length; i++) {
                if(!scope[parts[i]]) {
                    return false;
                }
                scope = scope[parts[i]];
            }
            return true;
        };
        Util.isFunction = function isFunction(thing) {
            return Util.type(thing) === "function";
        };
        Util.isNumber = function isNumber(thing) {
            return Util.type(thing) == "number";
        };
        Util.isArray = function isArray(thing) {
            return Object.prototype.toString.call(thing) === '[object Array]';
        };
        Util.inArray = function inArray(thing, array) {
            if(!Util.isArray(array)) {
                throw "Second argument should be array";
            }
            for(var i = 0; i < array.length; i++) {
                if(array[i] == thing) {
                    return i;
                }
            }
            return -1;
        };
        Util.type = function type(obj) {
            if(obj == null) {
                return String(obj);
            } else {
                return Object.prototype.toString.call(obj).substring(8).replace(/\]$/, "").toLowerCase();
            }
        };
        Util.makeArray = function makeArray(ar) {
            var res = [];
            var i = ar.length;
            for(; i; i--) {
                res[i - 1] = ar[i - 1];
            }
            return res;
        };
        Util.binarySearch = function binarySearch(list, needle, comperator) {
            var l = list.length - 1;
            var lower = 0;
            var upper = l;
            if(l == -1) {
                return 0;
            }
            if(comperator(needle, list[l]) > 0) {
                return list.length;
            }
            while(upper - lower > 1) {
                var t = Math.round((upper + lower) / 2);
                var v = comperator(needle, list[t]);
                if(v < 0) {
                    upper = t;
                } else {
                    lower = t;
                }
            }
            if(upper == lower) {
                return upper;
            } else if(comperator(needle, list[lower]) < 0) {
                return lower;
            }
            return upper;
        };
        Util.identity = function identity(x) {
            return x;
        };
        Util.noop = function noop() {
        };
        Util.notImplemented = function notImplemented() {
            throw "Not implemented. This function is TODO or supposed to be abstract";
        };
        Util.randomUUID = function randomUUID() {
            return "todo";
        };
        Util.runtests = function runtests(tests) {
            var report = [
                "\n==[ TEST REPORT ]=="
            ];
            var assert = require("assert");
            var count = 0;
            var success = 0;
            var filter = function (_) {
                return true;
            };
            if(process.argv.length == 3) {
                filter = function (name) {
                    return name.indexOf(process.argv[2]) != -1;
                };
            }
            var failed = true;
            for(var key in tests) {
                if(filter(key)) {
                    console.log("\n[\x1b[34mRun\x1b[0m]   " + key + "\n");
                    failed = true;
                    count += 1;
                    assert.done = function () {
                        report.push("[\x1b[32mok\x1b[0m]   " + key);
                        failed = false;
                        success += 1;
                    };
                    try  {
                        tests[key](assert);
                        if(failed) {
                            throw new Error("Test finished without calling 'done'");
                        }
                    } catch (e) {
                        console.error(e);
                        console.error(e.stack);
                        report.push("\n[\x1b[1m\x1b[31mFAIL\x1b[0m] " + key + ":\n          " + e);
                        if(e.stack) {
                            report.push("\x1b[37m      " + e.stack.split("\n")[1] + "\x1b[0m");
                        }
                    }
                }
            }
            console.log(report.join("\n"));
            console.log("\nCompleted test run: " + success + " out of " + count + " tests succeeded");
        };
        return Util;
    })();
    NOA.Util = Util;    
})(NOA || (NOA = {}));
(function (root) {
    for(var key in NOA) {
        exports[key] = NOA[key];
    }
})(this);
var NOA;
(function (NOA) {
    var ListAggregation = (function (_super) {
        __extends(ListAggregation, _super);
        function ListAggregation(source) {
            var _this = this;
                _super.call(this);
            this.source = source;
            this.uses(source);
            source.onFree(this, function () {
                return _this.free();
            });
            source.onInsert(this, this.onSourceInsert);
            source.onSet(this, this.onSourceSet);
            source.onMove(this, this.onSourceMove);
            source.onRemove(this, this.onSourceRemove);
        }
        ListAggregation.prototype.onSourceInsert = function (index, value, cell) {
        };
        ListAggregation.prototype.onSourceRemove = function (index, value) {
        };
        ListAggregation.prototype.onSourceMove = function (from, to) {
        };
        ListAggregation.prototype.onSourceSet = function (index, newvalue, oldvalue, cell) {
        };
        ListAggregation.prototype.updateValue = function (newvalue, cell) {
            if(newvalue != this.value) {
                var old = this.value;
                this.value = newvalue;
                var origin = null;
                if(cell) {
                    origin = cell.getOrigin();
                } else if(newvalue instanceof NOA.ValueContainer) {
                    origin = (newvalue).getOrigin();
                }
                this.setOrigin(origin);
                this.changed(newvalue, old);
            }
        };
        return ListAggregation;
    })(NOA.ValueContainer);
    NOA.ListAggregation = ListAggregation;    
    var ListCount = (function (_super) {
        __extends(ListCount, _super);
        function ListCount(source) {
                _super.call(this, source);
            this.value = 0;
            this.unlisten(source, 'move');
            this.unlisten(source, 'set');
        }
        ListCount.prototype.onSourceInsert = function (index, value) {
            this.updateValue(this.value + 1);
        };
        ListCount.prototype.onSourceRemove = function (index, value) {
            this.updateValue(this.value - 1);
        };
        return ListCount;
    })(ListAggregation);
    NOA.ListCount = ListCount;    
    var ListNumberCount = (function (_super) {
        __extends(ListNumberCount, _super);
        function ListNumberCount(source) {
                _super.call(this, source);
            this.value = 0;
            this.unlisten(source, 'move');
        }
        ListNumberCount.prototype.onSourceInsert = function (index, value) {
            if(NOA.Util.isNumber(value)) {
                this.updateValue(this.value + 1);
            }
        };
        ListNumberCount.prototype.onSourceRemove = function (index, value) {
            if(NOA.Util.isNumber(value)) {
                this.updateValue(this.value - 1);
            }
        };
        ListNumberCount.prototype.onSourceSet = function (index, newvalue, oldvalue) {
            var lin = NOA.Util.isNumber(newvalue);
            var rin = NOA.Util.isNumber(oldvalue);
            if(lin && !rin) {
                this.updateValue(this.value + 1);
            } else if(rin && !lin) {
                this.updateValue(this.value - 1);
            }
        };
        return ListNumberCount;
    })(ListAggregation);
    NOA.ListNumberCount = ListNumberCount;    
    var ListSum = (function (_super) {
        __extends(ListSum, _super);
        function ListSum(source) {
                _super.call(this, source);
            this.value = 0;
            this.unlisten(source, 'move');
        }
        ListSum.prototype.onSourceInsert = function (index, value) {
            if(NOA.Util.isNumber(value)) {
                this.updateValue(this.value + value);
            }
        };
        ListSum.prototype.onSourceRemove = function (index, value) {
            if(NOA.Util.isNumber(value)) {
                this.updateValue(this.value - value);
            }
        };
        ListSum.prototype.onSourceSet = function (index, newvalue, oldvalue) {
            var delta = 0;
            if(NOA.Util.isNumber(newvalue)) {
                delta += newvalue;
            }
            if(NOA.Util.isNumber(oldvalue)) {
                delta -= oldvalue;
            }
            this.updateValue(this.value + delta);
        };
        return ListSum;
    })(ListAggregation);
    NOA.ListSum = ListSum;    
    var ListAverage = (function (_super) {
        __extends(ListAverage, _super);
        function ListAverage(source) {
                _super.call(this, source);
            this.value = 0;
            this.unlisten(source, 'move');
            this.unlisten(source, 'set');
            this.unlisten(source, 'remove');
            this.unlisten(source, 'insert');
            source.aggregate(NOA.List.Aggregates.sum);
            this.sum = source.aggregates[NOA.List.Aggregates.sum];
            this.sum.live();
            source.aggregate(NOA.List.Aggregates.numbercount);
            this.count = source.aggregates[NOA.List.Aggregates.numbercount];
            this.count.live();
            this.sum.get(null, this.listChanged);
            this.count.get(null, this.listChanged);
            this.listChanged();
        }
        ListAverage.prototype.listChanged = function () {
            if(this.count.get() == 0) {
                this.updateValue(0);
            }
            this.updateValue(this.sum.get() / this.count.get());
        };
        ListAverage.prototype.free = function () {
            this.count.die();
            this.sum.die();
            _super.prototype.free.call(this);
        };
        return ListAverage;
    })(ListAggregation);
    NOA.ListAverage = ListAverage;    
    var ListMax = (function (_super) {
        __extends(ListMax, _super);
        function ListMax(source) {
                _super.call(this, source);
            this.value = 0;
            this.unlisten(source, 'move');
            this.findNewMax();
        }
        ListMax.prototype.findNewMax = function () {
            var max = -1 * (1 / 0);
            var maxcell = null;
            NOA.Util.each(this.source.cells, function (cell) {
                var v = cell.get();
                if(NOA.Util.isNumber(v)) {
                    if(v > max) {
                        max = v;
                        maxcell = cell;
                    }
                }
            });
            this.updateValue(max, maxcell);
        };
        ListMax.prototype.onSourceInsert = function (index, value, cell) {
            if(NOA.Util.isNumber(value) && value > this.value) {
                this.updateValue(value, cell);
            }
        };
        ListMax.prototype.onSourceRemove = function (index, value) {
            if(NOA.Util.isNumber(value) && value >= this.value) {
                this.findNewMax();
            }
        };
        ListMax.prototype.onSourceSet = function (index, newvalue, oldvalue) {
            if(NOA.Util.isNumber(oldvalue) && oldvalue >= this.value) {
                this.findNewMax();
            }
        };
        return ListMax;
    })(ListAggregation);
    NOA.ListMax = ListMax;    
    var ListMin = (function (_super) {
        __extends(ListMin, _super);
        function ListMin(source) {
                _super.call(this, source);
            this.value = 0;
            this.unlisten(source, 'move');
            this.findNewMin();
        }
        ListMin.prototype.findNewMin = function () {
            var min = 1 * (1 / 0);
            var mincell = null;
            NOA.Util.each(this.source.cells, function (cell) {
                var v = cell.get();
                if(NOA.Util.isNumber(v)) {
                    if(v < min) {
                        min = v;
                        mincell = cell;
                    }
                }
            });
            this.updateValue(min, mincell);
        };
        ListMin.prototype.onSourceInsert = function (index, value, cell) {
            if(NOA.Util.isNumber(value) && value < this.value) {
                this.updateValue(value, cell);
            }
        };
        ListMin.prototype.onSourceRemove = function (index, value) {
            if(NOA.Util.isNumber(value) && value <= this.value) {
                this.findNewMin();
            }
        };
        ListMin.prototype.onSourceSet = function (index, newvalue, oldvalue) {
            if(NOA.Util.isNumber(oldvalue) && oldvalue <= this.value) {
                this.findNewMin();
            }
        };
        return ListMin;
    })(ListAggregation);
    NOA.ListMin = ListMin;    
    var ListIndex = (function (_super) {
        __extends(ListIndex, _super);
        function ListIndex(source, index) {
                _super.call(this, source);
            this.unlisten(source, 'set');
            this.index = index;
            this.updateRealIndex();
            this.update();
        }
        ListIndex.prototype.updateRealIndex = function () {
            this.realindex = this.index < 0 ? this.source.cells.length - this.index : this.index;
        };
        ListIndex.prototype.update = function () {
            if(this.realindex < 0 || this.realindex >= this.source.cells.length) {
                this.updateValue(null);
            } else {
                this.updateValue(this.source.cell(this.realindex));
            }
        };
        ListIndex.prototype.onSourceInsert = function (index, value) {
            this.updateRealIndex();
            this.update();
        };
        ListIndex.prototype.onSourceRemove = function (index, value) {
            this.updateRealIndex();
            this.update();
        };
        ListIndex.prototype.onSourceMove = function (from, to) {
            if(from == this.realindex || to == this.realindex) {
                this.update();
            }
        };
        return ListIndex;
    })(ListAggregation);
    NOA.ListIndex = ListIndex;    
    var ListFirst = (function (_super) {
        __extends(ListFirst, _super);
        function ListFirst(source) {
                _super.call(this, source, 0);
        }
        return ListFirst;
    })(ListIndex);
    NOA.ListFirst = ListFirst;    
    var ListLast = (function (_super) {
        __extends(ListLast, _super);
        function ListLast(source) {
                _super.call(this, source, -1);
        }
        return ListLast;
    })(ListIndex);
    NOA.ListLast = ListLast;    
})(NOA || (NOA = {}));
