///<reference path='../noa.ts'/>
module NOA {
	export class Call extends Expression { //TODO: rename to FunctionCall

		constructor(private funvar: IValue, private params: IValue[]) {
			super((<IValue[]>[funvar]).concat(params));
			this.setName("call");

			Util.assert(LangUtils.canBe(funvar, ValueType.Function));
			//TODO: or string, in that case, invoke from Lang[funname]
		}

		start(resolver: IResolver) {
			super.start(resolver);
			if (this.funvar instanceof Fun)
				this.applyFun(this.funvar);
			else if (this.funvar instanceof Variable)
				(<Variable>this.funvar).get(this, this.applyFun, true);
			else
				throw new Error("Illegal state: expected variable or fun");
			return this;
		}

		applyFun(fun) {
			if (fun && fun instanceof Base && fun.is(ValueType.Error))
				this.set(fun);
			else if (fun instanceof Fun) {
				LangUtils.startExpression(fun, null);
				this.set((fun.call.apply(fun, this.params)));
			}
			else
				this.set(new ErrorValue("Call expected function found " + (fun && fun.value ? fun.value() : fun)));
		}
	}
}