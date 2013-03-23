NOA.require([
    "NOA.core.Base", 
    "NOA.core.Expression"
], function () {
    var readTracker = [];
    NOA.declare("NOA.core.Cell", NOA.core.Base, {
        parent: null,
        value: undefined,
        index: -1,
        init: function (parent, index, value) {
            this.parent = parent;
            this.index = index;
            this._store(value);
            this.initialized = true;
        },
        remove: function () {
            if(this.parent && NOA.Record.isA(this.parent)) {
                this.parent.remove(this.index);
            } else if(this.parent && NOA.List.isA(this.parent)) {
                this.parent.remove(this.index);
            } else {
                throw "Cell.Remove can only be invoked for cells owned by a list or record!";
            }
        },
        set: function (newvalue) {
            if(this.destroyed) {
                return;
            }
            this.debugIn("Receiving new value: " + newvalue);
            if(this.parent != null) {
                this.parent.set(this.index, newvalue);
            } else {
                this._store(newvalue);
            }
            this.debugOut();
        },
        hasExpression: function () {
            return NOA.core.Expression.isA(this.value) || Noa.core.Cell.isA(this.value);
        },
        _store: function (newvalue) {
            var orig = this.value;
            if(newvalue != orig) {
                if(this.hasExpression()) {
                    this.unlistenTo(orig, 'changed');
                }
                if(newvalue && newvalue.live) {
                    newvalue.live();
                }
                if(orig && orig.die) {
                    orig.die();
                }
                this.value = newvalue;
                if(this.hasExpression()) {
                    this.debug("now following", newvalue);
                    sdfjklsdfjkl;
                    this.expressionChanged(newvalue.get(this, this.expressionChanged), null);
                } else {
                    this.value = newvalue;
                    this.expression = null;
                    this.changed(newvalue, orig);
                }
                if(NOA.core.Base.isA(orig)) {
                    orig.die();
                }
            }
        },
        expressionChanged: function (newvalue, old) {
            this.debugIn("Updating cell as expression changed");
            if(NOA.core.Cell.isA(newvalue) || NOA.core.Expression.isA(newvalue)) {
                throw "Assigning cells or expressions as result of an expression is not supported yet";
            }
            if(newvalue && newvalue.live) {
                newvalue.live();
            }
            var orig = this.value;
            this.value = newvalue;
            this.changed(newvalue, orig);
            if(this.initialized) {
                if(NOA.List.isA(this.parent)) {
                    this.parent.fire('set', this.index, newvalue, orig);
                } else if(NOA.Record.isA(this.parent)) {
                    this.parent.fire('put', this.index, newvalue, orig);
                }
            }
            if(orig && orig.die) {
                orig.die();
            }
            this.debugOut();
        },
        get: function (scope, onchange) {
            if(readTracker.length > 0) {
                readTracker[0][this.noaid] = this;
            }
            if(!!scope && !!onchange) {
                this.onChange(scope, onchange);
            } else if(scope) {
                this.onChange(null, scope);
            }
            return this.value;
        },
        live: function () {
            if(this.parent) {
                this.parent.live();
            } else {
                callee.inherited();
            }
            return this;
        },
        die: function () {
            if(this.parent) {
                this.parent.die();
            } else {
                callee.inherited();
            }
            return this;
        },
        free: function () {
            if(this.expression) {
                this.unlistenTo(this.expression, 'changed');
                this.expression.die();
            }
            if(NOA.core.Base.isA(this.value)) {
                this.value.die();
            }
            this.changed(undefined);
        },
        toString: function () {
            return ((this.parent ? this.parent.debugName() + "." + this.index : "Cell " + this.noaid) + ":" + this.value);
        }
    });
    NOA.core.Cell.trackReads = function (list) {
        readTracker.unshift(list);
    };
    NOA.core.Cell.untrackReads = function () {
        readTracker.shift();
    };
});
//@ sourceMappingURL=cell.js.map
