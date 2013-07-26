///<reference path='../core/expression.ts'/>

module NOA {

	export class JavascriptExpression extends Expression {
		constructor(name: string, private func: Function, private funParams: IValue[], private autoTrigger: bool = false) {
			super(funParams);
			this.setName(name);
		}

		start(resolver: IResolver): IValue {
			super.start(resolver);

			//TODO: shouldn't watchfunction be the responsibility of this class?
			//TODO: if one of the values is error, set result as error (in watch function?)

			var wrapped = LangUtils.watchFunction(this.func, this);

			if (this.autoTrigger) {
				var currentArgs = this.funParams.map(arg => arg.value());


				var update = function () {
					wrapped.apply(null, currentArgs);
				};

				this.funParams.forEach((arg, index) => {
					//if (arg.is(ValueType.PlainValue)) { //TODO: should be asserted
					if (arg instanceof Variable) {
						(<Variable>arg).get(<Base>{}, (newvalue: IValue, _) => { //TODO: scope? //TODO: seems not to be triggered yet..
							currentArgs[index] = newvalue && newvalue.value ? newvalue.value() : newvalue;//TODO: does change evaluate its argument
							update();
						}, false);
					}
				});

				update();
			}
			else {
				//not auto triggered, apply once.
				wrapped.apply(null, this.funParams);
			}

			return this;
		}
	}

}