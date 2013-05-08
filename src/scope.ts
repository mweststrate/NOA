///<reference path='noa.ts'/>
module NOA {

	//TODO: make reall class of scope, not some wrapped map.
	export class Scope {
		private static SCOPE: Scope[] = [];

		static getCurrentScope(): Scope {
			return SCOPE[0];
		};

		static newScope(basescope: Scope): Scope {
			return new Scope(basescope);
		}

		static pushScope(scope) {
			SCOPE.unshift(scope);
		};

		static popScope() {
			SCOPE.shift();
		};

		// - End static members -//
		private vars = {};
		private parent: Scope;

		constructor(parentscope?: Scope) {
			this.parent = parentscope;
		}

		get (varname: string, readTracker: Object);
		get (varname: string, field: string, readTracker: Object);
		get (...args: any[]): ValueContainer {
			var varname: string = args[0],
				field, readTracker;
			if (args.length == 2)
				readTracker = args[1];
			else if (args.length == 3) {
				field = args[1];
				readTracker = args[2];
			}

			if (varname in this.vars) {
				var thing = this.vars[varname];
				//TODO: causes uberlivign as well!
				if (field && thing.get() && (field in thing.get())) //MWE: TODO: FIXME: this one is not scalable either!
					thing = (thing.get())[field]();
				else if (field) //MWE: field is temporarily expression? it own't trigger a change if varname updates...
					thing = thing.cell(field);
				if (!thing)
					throw new Error("Not in scope: field: '" + field + "'");
				readTracker[thing.noaid] = thing;
				return thing;
			}

			if (this.parent)
				return this.parent.get(varname, readTracker);

			throw new Error("Undefined variable: '" + varname + "'")
		}

		set (varname: string, value: ValueContainer) {
			if (varname in this.vars)
				throw new Error("Already declared: '" + varname + "'")

			if (!value)
				throw new Error("No value provided to Scope.set!")

			this.vars[varname] = value;
		}
	}
}