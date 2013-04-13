///<reference path='noa.ts'/>

module NOA {

	//TODO: make reall class of scope, not some wrapped map. 
	export class Scope {
		private static SCOPE = [{}];

		static getCurrentScope () {
			return SCOPE[0];
		};


		static getFromScope (name) {
			var s = getCurrentScope();

			while (s != null) {
				if (name in s)
					return s[name];
				s = s['$PARENTSCOPE$'];
			}


			throw "NOA: Undefined variable: " + name;
		};


		static newScope (basescope) {
			return {
				$PARENTSCOPE$ : basescope //MWE: lets hope nobody ever names his variable '$PARENTSCOPE$'...
			}
		}


		static pushScope (scope) {
			SCOPE.unshift(scope);
		};

		static popScope () {
			SCOPE.shift();
		};

	}

	export class Expression extends ValueContainer {
		func : Function;
		scope : Object;
		value : any ;
		params = {}; //contains bound value containers


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

				var reads = {};
				Cell.trackReads(reads)

				var origvalue = this.value;
				this.value = this.func.apply(this);
				if (origvalue != this.value)
					this.changed(this.value, origvalue);

				//cleanup existing params //TODO: use abstract util. compare function for this?
				for(var noaid in this.params)
					if (!reads[noaid]) {
						var cell = this.params[noaid]
						this.unlisten(cell, "changed");
						cell.die();
					}
				//register new parents
				for(var noaid in reads) {
					if (!this.params[noaid]) {
						var cell = reads[noaid];
						this.params[cell.noaid] = cell;
						cell.live();
						this.debug("Added expression dependency: " + cell.debugName());
						this.listen(cell, "changed", this._apply);
					}
				}
			}
			finally {
				Cell.untrackReads();
				Scope.popScope();
			}
		};

		variable (name) {
			var thing = Scope.getFromScope(name);
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
				this.unlisten(cell, "changed");
				cell.die();
			}
			super.free();
		}
	}

}