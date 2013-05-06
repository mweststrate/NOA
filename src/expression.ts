///<reference path='noa.ts'/>
//TODO: move to own namespace: NOA.expessions
module NOA {

	//TODO: support expression like:
	//New Expression(function(cb, args1...), args2)

	//TODO: input arguments which are not NOA objects, should be converted to static values automatically,
	//which support a get callback which is in fact ignored always.

	export class Expression extends ValueContainer implements IValue {
		func : Function;
		scope : Object;
		value : any = undefined;
		params = {}; //contains bound value containers
		readTracker = null;

		//TODO: scope should not be argument tot the expression, but assigned by Cell.Set
		/**
			func supports both synchronous and asynchronos invocation pattern. In the latter case, undefined should be return to indicate that we should wait on the callback
		*/

		//Sync pattern
		constructor(func: () => any, scope?: Scope);

		//A-sync pattern
		constructor(func: (callback: (newvalue: any) => void ) => void , scope?: Scope);

		constructor(func, scope?: Scope) {
			super();
			this.func = func;
			this.scope = scope; //TODO: if scope is null then create empty scope. If record, start scope with 'this' as record

			this._apply(); //TODO: defer apply until needed
		};

		_apply () {
			if (this.destroyed)
				return;

			//TODO: check if not running apply already. If so, postpone or make sure the last one wins.
			Scope.pushScope(this.scope);

			var reads = this.readTracker = {}; //Setup readtracker for this.variable() mwe: bwegh..

			var origvalue = this.value;
			var cbcalled = false;

			var functioncallback = (newvalue) => {
				cbcalled = true;

				//cleanup existing params //TODO: use abstract util. compare function for this?
				for (var noaid in this.params)
					if (!reads[noaid]) {
						var cell = this.params[noaid]
						this.unlisten(cell, "change");
					}

				//register new parents
				for (var noaid in reads) {
					if (!this.params[noaid]) {
						var cell = reads[noaid];
						this.params[cell.noaid] = cell;
						this.debug("Added expression dependency: " + cell.debugName());
						this.listen(cell, "change", this._apply);
					}
				}

				Scope.popScope(); //MWE: TODO: FIXME: can be totally other scope than the one defined above! Use a reference of some kind!

				//update known value and invoke callbacks
				this.value = newvalue;
				if (origvalue != this.value)
					this.changed(this.value, origvalue);

			};

			//invoke the function
			var res = this.func.apply(this, functioncallback);

			//check whether the function follows sync or async pattern
			if (res !== undefined && cbcalled === false)
				functioncallback(res);
		};

		variable (name: string, field? : string) { //TODO: typed
			var thing = field
				? Scope.getCurrentScope().get(name, field, this.readTracker)
				: Scope.getCurrentScope().get(name, this.readTracker);
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

		toAST(): Object {
			throw new Error("toAST of expression should be prevented!");
		}
	}
}