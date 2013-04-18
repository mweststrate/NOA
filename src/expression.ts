///<reference path='noa.ts'/>
//TODO: move to own namespace: NOA.expessions
module NOA {

	//TODO: make reall class of scope, not some wrapped map. 
	export class Scope {
	    private static SCOPE : Scope[] = [];

		static getCurrentScope () : Scope {
			return SCOPE[0];
		};

		static newScope (basescope : Scope) : Scope {
		    return new Scope(basescope);
		}

		static pushScope (scope) {
			SCOPE.unshift(scope);
		};

		static popScope () {
			SCOPE.shift();
		};

        // - End static members -//
        private vars = {};
		private parent: Scope;

        constructor(parentscope?: Scope) {
            this.parent = parentscope;
        }

        get (varname: string, readTracker: Object): ValueContainer {
            if (varname in this.vars) {
                var thing = this.vars[varname];
                readTracker[thing.noaid] = thing;
                return thing;
            }
            if (this.parent)
	            return this.parent.get(varname, readTracker);

            throw "Undefined variable: '" + varname + "'"
        }

        set (varname: string, value : ValueContainer) {
        	if (varname in this.vars)
        		throw  "Already declared: '" + varname + "'"

        	if (!value)
        		throw "No value provided to Scope.set!"

        	this.vars[varname] = value;
        }
	}

	export class Expression extends ValueContainer {
		func : Function;
		scope : Object;
		value : any ;
		params = {}; //contains bound value containers
		readTracker = null;


		constructor (func, scope) {
			super();
			this.func = func;
			this.scope = scope; //TODO: if scope is null then create empty scope. If record, start scope with 'this' as record

			this._apply();
		};

		_apply () {
			if (this.destroyed)
				return;
			 try {
				Scope.pushScope(this.scope);

				var reads = this.readTracker = {}; //Setup readtracker for this.variable() mwe: bwegh..

				var origvalue = this.value;
				this.value = this.func.apply(this);
				if (origvalue != this.value)
					this.changed(this.value, origvalue);

				//cleanup existing params //TODO: use abstract util. compare function for this?
				for(var noaid in this.params)
					if (!reads[noaid]) {
						var cell = this.params[noaid]
						this.unlisten(cell, "change");
					}
				//register new parents
				for(var noaid in reads) {
					if (!this.params[noaid]) {
						var cell = reads[noaid];
						this.params[cell.noaid] = cell;
						this.debug("Added expression dependency: " + cell.debugName());
						this.listen(cell, "change", this._apply);
					}
				}
			}
			finally {
				Scope.popScope();
			}
		};

		variable (name: string) {
		    var thing = Scope.getCurrentScope().get(name, this.readTracker);
			Util.assert(!thing.destroyed);
			return thing.get(); //TODO: could registered values being read here instead of in cell?
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

		};

		free() {
			this.debug("freeing expression " + this.noaid);
			for(var key in this.params) {
				var cell = this.params[key]
				this.unlisten(cell, "change");//TODO: to sensitive, hardcoded strings!
				//cell.die();
			}
			super.free();
		}
	}

}