NOA.require(["NOA.core.Base"], function(){

    NOA.ensureObject("NOA.impl");

    NOA.impl.SCOPE = [{}]; //empty start scope

    NOA.impl.getCurrentScope = function() {
        return NOA.impl.SCOPE[0];
    };


    NOA.impl.getFromScope = function(name) {
        var s = NOA.impl.getCurrentScope();

        while (s != null) {
            if (name in s)
                return s[name];
            s = s.$PARENTSCOPE$;
        }

        throw "NOA: Undefined variable: " + name;
    };


    NOA.impl.newScope = function(basescope) {
        return {
            $PARENTSCOPE$ : basescope //MWE: lets hope nobody ever names his variable '$PARENTSCOPE$'...
        }
    };


    NOA.impl.pushScope = function(scope) {
        NOA.impl.SCOPE.unshift(scope);
    };

    NOA.impl.popScope = function() {
        NOA.impl.SCOPE.shift();
    };

    /**
     * @author Michel
     */
//TODO: rename apply, dangerous name...
    NOA.declare("NOA.core.Expression",  NOA.core.Base, {
        func : null,
        scope : null,
        value : undefined,
        params : null, //map NOAID -> cell


        init : function(func, scope) {
            this.params = {};
            this.func = func;
            this.scope = scope; //TODO: if scope is null then create empty scope. If record, start scope with 'this' as record

            this._apply();
        },

        get : function(scope, onchange) {
            if (scope && onchange)
                this.onChange(scope, onchange);

            return this.value;
        },

        _apply : function() {
            if (this.destroyed)
                return;
            try {
                NOA.impl.pushScope(this.scope);

                var reads = {};
                NOA.core.Cell.trackReads(reads)

                var origvalue = this.value;
                this.value = this.func.apply(this);
                if (origvalue != this.value)
                    this.changed(this.value, origvalue);

                //cleanup existing params //TODO: use abstract util. compare function for this?
                for(var noaid in this.params)
                    if (!reads[noaid]) {
                        var cell = this.params[noaid]
                        this.unlistenTo(cell, "changed");
                        cell.die();
                    }
                for(var noaid in reads) {
                    if (!this.params[noaid]) {
                        var cell = reads[noaid];
                        this.params[cell.noaid] = cell;
                        cell.live();
                        this.debug("Added expression dependency: " + noaid);
                        this.listenTo(cell, "changed", this._apply);
                    }
                }
            }
            finally {
                NOA.core.Cell.untrackReads();
                NOA.impl.popScope();
            }
        },

        variable : function(name) {
            var thing = NOA.impl.getFromScope(name);
            NOA.assert(!thing.destroyed);
            return thing;
            /*

            this.debug("retrieve from scope ", ": " , thing);
            if (NOA.core.Cell.isA(thing)) {
                return this.setParam(name, thing.get(this, function(newvalue) {
                    if (this.destroyed)
                        return;
                    //if this cell ever changes, recalculate
                    if (newvalue === undefined) {
                        //TODO: if newvalue is undefined, do not reapply? I guess reapply is the proper thing to do...
                    }
                    this.debug("reapply since  " + name + "has changed to " , newvalue);
                    this.setParam(name, newvalue);
                    this._apply();
                }));
            }
            else
                return this.params[name] =  thing;
            */

        },

        free : function() {
            for(var key in this.params) {
                var cell = this.params[key]
                this.unlistenTo(cell, "changed");
                cell.die();
            }
            this.debug("freeing apply " + this.noaid);
        }
    });

});