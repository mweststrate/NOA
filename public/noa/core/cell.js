NOA.require(["NOA.core.Base",  "NOA.core.Expression"], function(){

    var readTracker = [];

    NOA.declare("NOA.core.Cell",  NOA.core.Base, {
        parent : null,
        value : undefined,
        index : -1,
        expression : null,

        init : function(parent, index, value) {
            this.parent = parent;
            this.index = index;
            this._store(value);
            this.initialized = true;
        },

        remove : function() {
            if (this.parent && NOA.Record.isA(this.parent))
                this.parent.remove(this.index);
            else if (this.parent && NOA.List.isA(this.parent))
                this.parent.remove(this.index);
            else
                throw "Cell.Remove can only be invoked for cells owned by a list or record!";
        },

        set : function(newvalue) {
            if (this.destroyed) //if changed after being removed; stop updating
                return;

            this.debugIn("Receiving new value: " + newvalue);

            if (this.parent != null)
                this.parent.set(this.index, newvalue); //update record / list //TODO: is index always up to date?
            else
                this._store(newvalue); //cell without parent

            this.debugOut();
        },

        _store : function(newvalue) {
            var orig = this.value;
            if (this.expression && newvalue != this.expression || !this.expression && newvalue != orig) {
                if (this.expression) {
                    this.unlistenTo(this.expression, 'changed'); //TODO: is this the proper event?
                    this.expression.die();
                }

                //if (NOA.core.Base.isA(newvalue))
                if (newvalue && newvalue.live)
                    newvalue.live();
                if (orig && orig.die)
                    orig.die();

                if (NOA.core.Expression.isA(newvalue) || NOA.core.Cell.isA(newvalue)) {
                    this.debug("now following",newvalue);
                    this.expression = newvalue;
                    this.expressionChanged(newvalue.get(this, this.expressionChanged), null);
                }
                else {
                    this.value = newvalue;
                    this.expression = null;
                    this.changed(newvalue, orig);
                }

                if (NOA.core.Base.isA(orig))
                    orig.die();
            }
        },

        expressionChanged : function(newvalue, old) {
            this.debugIn("Updating cell as expression changed");
            if (NOA.core.Cell.isA(newvalue) || NOA.core.Expression.isA(newvalue))
                throw "Assigning cells or expressions as result of an expression is not supported yet"; //MWE: maybe it will work correctly, but it becomes a bit fuzzy...

            if (newvalue && newvalue.live)
                newvalue.live();

            var orig = this.value;
            this.value = newvalue;
            this.changed(newvalue, orig);

            //do not call set on parent, since it will call _store on this cell. Rather, invoke their handlers directly
            if (this.initialized) {
                if (NOA.List.isA(this.parent))
                    this.parent.fire('set', this.index, newvalue, orig);
                else if (NOA.Record.isA(this.parent))
                    this.parent.fire('put',this.index, newvalue, orig);
            }

            if (orig && orig.die)
                orig.die();

            this.debugOut();
        },

        get : function(scope, onchange) {
            if (readTracker.length > 0)
                readTracker[0][this.noaid] = this; //register that this item was read

            if (!!scope && !!onchange)
                this.onChange(scope, onchange);
            else if (scope)
                this.onChange(null, scope);

            return this.value;
        },

        /*    follow : function(thing) {
         if (this.expression)
         throw "Not implemented yet, change expression";
         if (this.expression) {
         throw "hoi";
         this.expression.die();
         //          unlistenTo the change
         }
         this.expression = thing;
         thing.live();
         this.set(thing.get(this, function(newvalue) {
         this.set(newvalue);
         }));
         },
         */
        live : function() {
            if (this.parent)
                this.parent.live();
            else
                callee.inherited();

            return this;
        },

        die : function() {
            if (this.parent)
                this.parent.die();
            else
                callee.inherited();

            return this;
        },

        free : function() {
            if (this.expression) {
                this.unlistenTo(this.expression, 'changed'); //TODO: is this the proper event?
                this.expression.die();
            }

            if (NOA.core.Base.isA(this.value))
                this.value.die();
            //  if (this.expression)
            //    this.expression.die();
            //MWE: do this?
            this.changed(undefined);
        },

        toString : function() {
            return( //beware the newline!
                (this.parent ? this.parent.debugName() + "." + this.index : "Cell " + this.noaid)
                    + ":" + this.value);
        }

    });

    NOA.core.Cell.trackReads = function(list) {
        readTracker.unshift(list);
    }

    NOA.core.Cell.untrackReads = function() {
        readTracker.shift   ();
    }

});