///<reference path='../noa.ts'/>
module NOA {
	export class IfThenElse extends Expression {
		private closure: IResolver;

		constructor(private condition: IValue, private truthy: IValue, private falsy: IValue) {
			super([condition, truthy, falsy]);
			this.setName("if_");
		}

		start(resolver: IResolver) : IValue {
			Util.assert(!this.started);
			this.started = true;
			this.closure = resolver;

			LangUtils.startExpression(this.condition, this.closure);

			if (this.condition instanceof Variable)
				(<Variable>this.condition).get(this, this.applyCondition, true);
			else
				this.applyCondition(this.condition.value());

			return this;
		}


		applyCondition (newvalue) {
			if (newvalue instanceof Base && newvalue.is(ValueType.Error))
				this.set(newvalue);
			else {
				//evaluate lazy in if, this makes recursion possible.
				if (!!newvalue) {
					LangUtils.startExpression(this.truthy, this.closure);
					this.set(this.truthy);
				}
				else {
					LangUtils.startExpression(this.falsy, this.closure);
					this.set(this.falsy);
				}
			}
		}
	}
}