///<reference path='../noa.ts'/>
module NOA {
	export class Get extends Expression {

		realvarname: string;

		constructor(varname: IValue) {
			super([varname]);

			this.setName("get");

			Util.assert(varname instanceof Constant);
			Util.assert(LangUtils.is(varname, ValueType.String));

			this.realvarname = varname.value();

			this.set(new ErrorValue("Uninitialized variable '" + this.realvarname + "'"));
		}

		start(resolver: IResolver) : IValue{
			var val = resolver ? resolver.resolve(this.realvarname) : null;
			if (!val)
				this.set(new ErrorValue("Uninitialized variable '" + this.realvarname + "'"));
			else
				this.set(val);

			this.debug("GET '" + this.realvarname + "' FOLLOWS " + this.fvalue.toString());
			return this;
		}
	}
}