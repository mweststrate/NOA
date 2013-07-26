///<reference path='../noa.ts'/>
module NOA {
	export class Let extends Expression implements IResolver {

		realvarname: string;
		closure: IResolver;

		constructor(varname: IValue, private expr: IValue, private stat: IValue) {
			super([]); //TODO: just pass varname, expr and stat?
			this.initArg(varname, true);
			this.initArg(expr, true);
			this.initArg(stat, false);
			this.setName("let");

			Util.assert(varname instanceof Constant);
			Util.assert(LangUtils.is(varname, ValueType.String));

			this.realvarname = varname.value();

			this.set(stat);
		}

		start(resolver: IResolver) : IValue {
			Util.assert(!this.started);
			this.started = true;
			this.closure = resolver;

			if (this.expr instanceof Expression)
				(<Expression> this.expr).start(resolver);

			this.debugIn("LET '" + this.realvarname + "' BE '" + this.expr + "' IN " + this.stat);
			if (this.stat instanceof Expression)
				(<Expression> this.stat).start(this);
			this.debugOut();

			return this;
		}

		resolve(varname: string): IValue {
			Util.assert(this.started);
			if (varname == this.realvarname)
				return this.expr;
			else if (this.closure)
				return this.closure.resolve(varname);
			else
				return null;
		}
	}
}