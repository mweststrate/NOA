///<reference path='../noa.ts'/>
module NOA {
	export class Fun extends Base { //TODO: extend IValue for serializability and such?

		private isJSFun: bool;

		private jsFun: Function;

		private argnames: string[];
		private statement: IValue;

		constructor(f: Function);
		constructor(argnames: string[], statement : IValue); //statement should be expression? neuh, a constant value is a valid function as well for example..
		constructor(a: any, b?: any) {
			super();

			this.isJSFun = Util.isFunction(a);

			if (this.isJSFun)
				this.jsFun = a;
			else {
				this.argnames = a;
				this.statement = b;
				this.statement.live();
			}
		}

		public call(...args: IValue[]) : IValue {
			if (this.isJSFun)
				return LangUtils.withValues(args, this.jsFun);
			else {
				var res = new Variable();

				//MWE: TODO: async is weird here, AST should be (de)serialied synchronouszly. Or, just use stats.clone?! That would be nice since it could avoid cloning of constants
				LangUtils.clone(this.statement, (clone) => {
					var wrap = clone;

					//create a let for each argument, and wrap
					for (var i = args.length - 1; i >= 0; i--)
						wrap = Lang.let(args[i], this.argnames[i], wrap);

					res.set(wrap);

					//TODO: copy all scope dependencies of wrap to res
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
	}
}