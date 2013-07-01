///<reference path='../noa.ts'/>
module NOA {
	export class Fun extends Base implements IValue {

		private isJSFun: bool;

		private jsFun: Function;

		private argnames: string[];
		private statement: IValue;
		private scopeDependencies: IScopeDependency[] = [];

		constructor(f: Function);
		constructor(argnames: string[], statement : IValue); //statement should be expression? neuh, a constant value is a valid function as well for example..
		constructor(argname: string, statement : IValue); //statement should be expression? neuh, a constant value is a valid function as well for example..
		constructor(a: any, b?: any) {
			super();

			this.isJSFun = Util.isFunction(a);

			if (this.isJSFun)
				this.jsFun = a;
			else {
				this.argnames = Util.isArray(a) ? a : [a];
				this.statement = b;
				this.statement.getScopeDependencies().forEach(dep => {
					if (!Util.inArray(dep.name, this.argnames))
						this.scopeDependencies.push(dep);
				});
				this.statement.live();
			}
		}

		public call(...args: IValue[]) : IValue {
			if (this.isJSFun)
				return LangUtils.withValues(args, this.jsFun);
			else {
				var res = new Expression(<IValue[]>[this].concat(args));
				res.setName("call"); //MWE: mweh? introduce in lang??

				//MWE: TODO: async is weird here, AST should be (de)serialied synchronouszly. Or, just use stats.clone?! That would be nice since it could avoid cloning of constants
				LangUtils.clone(this.statement, (clone) => {
					var wrap = clone;

					//create a let for each argument, and wrap
					for (var i = args.length - 1; i >= 0; i--) {
						wrap = Lang.let(this.argnames[i], args[i], wrap);

					}

					res.set(wrap);

					//copy all scope dependencies of wrap and args to res
					clone.getScopeDependencies().forEach(dep => res.addScopeDependency(dep));
					wrap.getScopeDependencies().forEach(dep => res.addScopeDependency(dep));
				});

				return res;
			}
		}

		public free() {
			super.free();
			if (!this.isJSFun)
				this.statement.die();
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