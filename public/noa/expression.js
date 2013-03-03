NOA("noa/base", function(base, NOA) {

    NOA.declare("noa/expression", base, {
        target : null,
        func : null,
        params : null,
        context : null,
        scope : null,
        boundargs : null,
        value : undefined,
        target : null,

        
        /**
         * Creates a new function application. 
         * @param  {[cell]} target [The cell where the result of the function is stored]
         * @param  {[func]} func   [The function to invoke. The return value will be the result of this application. this.variable('xx') is available to read data from the scope. Note that the onChange of 'this' will not trigger reevaluation]
         * @param  {[scope]} scope which can resolve variables
         * @param  {[context]} the 'this' object in the variable
         * @param {[boundargs]} [boundargs] [list of items that will be passed on to func whenever invoked]
         * @return {[type]}
         */
         init : function(target, func, scope, context /* bound args */) {
            //if (target)
              //  this.setTarget(target);

            this.func = func;
            this.scope = scope;
            this.params = {
                this : context
            };

        //    this.boundargs = jQuery.makeArray(arguments).splice(4);
       //     this.setupBoundArgs();

            this._apply(); //apply first time
        },

        get : function(scope, onchange) {
            if (scope && onchange)
                this.onChange(scope, onchange);
                
            return this.value;
        },
    /*
        setTarget : function(target) {
            if (this.target || !target)
                throw "Not implemented: multiple targets on apply";
            this.target = target;
            this.target.uses(this);
            //this.listenTo(target, 'free', this.free);
        },
    */
        setParam : function(name, param) {
            if (name in this.params && this.params[name].die)
                this.params[name].die();

            if (param.live)
                param.live();

            return this.params[name] = param;
        },

        /*
            Bound vars are vars that are passed from the fourth argument on to the constructor, and will be passed to the function to be invoked. It is especially useful for internals and testing
            Those vars are not availble in the scope or whatever, so from a language perspective they are not very important and if needed, it can be factored out from the code anywhere. 
        */
    /*    setupBoundArgs : function() {
            var a = this.boundargs,
                l = a.length,
                self = this;

            for(var i = 0; i < l; i++) {
                 //If a bound value is a cell, replace it with its value, and actively listen to that value
                if (NOA.core.Cell.isA(a[i])) {
                    //this.uses(a[i]);
                    (function() {
                        var idx = i; //capture in scope 
                         //append value and listen to changes
                        a[i] = a[i].get(self, function(newvalue) {
                            a[i] = newvalue;
                            self._apply();                            
                        });
                    })();
                }
            }    
        },
    */
        _apply : function() {
            if (this.destroyed)
                return;
            try {
                NOA.impl.pushScope(this.scope);
                var origvalue = this.value;
                this.value = this.func.apply(this, this.boundargs);
                if (origvalue != this.value)
                    this.changed(this.value, origvalue);
    //            if (this.target)
    //                this.target.set(this.value);
            }
            finally {
                NOA.impl.popScope();
            }
        },

        variable : function(name) {
            if (name in this.params)
        		return this.params[name];
        	else {
                var thing = NOA.impl.getFromScope(name);
                NOA.assert(!thing.destroyed);

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
        	}
        			
        },
        
        free : function() {
            for(var key in this.params)
                if (key != "this" && this.params[key].die)
                    this.params[key].die();
            this.debug("freeing apply " + this.noaid);
        }
    });
});