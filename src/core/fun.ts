///<reference path='../noa.ts'/>
module NOA {
	export class Fun extends Expression implements IValue {

		private isJSFun: bool;

		private jsFun: Function;

		private argnames: string[];
		private statement: IValue;
		private closure: IResolver;
		private started: bool = false;

		constructor(f: Function);
		//constructor(argnames: string[], statement : IValue); //statement should be expression? neuh, a constant value is a valid function as well for example..
		//constructor(argname: string, statement : IValue); //statement should be expression? neuh, a constant value is a valid function as well for example..
		constructor(...args: IValue[]);
		constructor(...args: any[]) {
			super(Util.isFunction(args[0]) ? [] : args.slice(0, -1));
			this.setName("fun");
			Util.assert(args.length > 0);
			var fun = args[args.length-1];
			this.isJSFun = Util.isFunction(fun);

			if (this.isJSFun) {
				Util.assert(args.length == 1);
				this.jsFun = fun;
			}
			else {
				this.initArg(fun, false);
				this.argnames = args.slice(0, -1).map(arg => arg.value());
				this.statement = fun;

				/*this.statement.getScopeDependencies().forEach(dep => {
					if (Util.find(dep.name, this.argnames) == -1) //Not declared by us
						this.scopeDependencies.push(dep);
				});*/
			}
		}

		start(resolver: IResolver) : IValue {
			Util.assert(!this.started);
			this.started = true;
			this.closure = resolver;
			return this;
		}

		public set() {
			throw new Error("Value of an expression should not be set!");
		}

		public call(...args: IValue[]): IValue {
			Util.assert(this.started);
			this.debug("CALL with arguments: (" + args.map(x => x.value()).join(",") + ")");

			if (this.isJSFun)
				return new AutoTriggeredExpression("call", this.jsFun, args.map(LangUtils.toValue)); //TODO: unecessary toValue?
			else {
				var res = new Expression([]);//<IValue[]>[this].concat(args));
				res.setName("call"); //MWE: mweh? introduce in lang?? //TODO: whole res seems unecessary if the clone wasn't async...
				res.initArg(this, false);
				args.forEach(arg => res.initArg(arg, true));

				//MWE: TODO: async is weird here, AST should be (de)serialied synchronouszly. Or, just use stats.clone?! That would be nice since it could avoid cloning of constants
				LangUtils.clone(this.statement, (clone) => {
					var wrap = clone;

					//create a let for each argument, and wrap
					//TODO: fix, use declared arguments instead of provided arguments
					for (var i = args.length - 1; i >= 0; i--) {
						wrap = Lang.let(this.argnames[i], args[i], wrap);
					}

					/*if (wrap instanceof Variable) { //TODO: many unchecked casts!
						(<Variable>wrap).setResolver(this);
						//avoid resolver being set another time. TODO: should not be needed but asserted in setResolver?
						(<Variable>wrap).setResolver = Util.noop;
					}*/
					if (wrap instanceof Expression)
						(<Expression>wrap).start(this.closure);

					res.set(wrap);

				});
				return res;
			}
		}

		public free() {
			this.debug("Freeing fun")
			super.free();
			//if (!this.isJSFun)
			//	this.statement.die();
		}

		is(type: ValueType): bool {
			return type === ValueType.Function || type == ValueType.Primitive;
		}

		value(): any { return this; }

		toAST(): Object {
			return Serializer.serializeFunction("fun", (<any[]>this.argnames).concat([this.statement]));
		}

		toJSON(): any {
			return this.isJSFun ? <any>this.jsFun : "fun(" + this.argnames.join(",") + ")";
		}

		toGraph() {
			return {
				name: 'Fun',
				args: this.argnames,
				body : this.isJSFun ? this.jsFun.toString() : this.statement.toGraph(),
				deps: this.getScopeDependencies().map(dep => dep.name)
			}
		}

		getScopeDependencies() : IScopeDependency[] {
			return this.scopeDependencies;
		}

	}
}