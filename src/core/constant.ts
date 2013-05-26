///<reference path='../noa.ts'/>

module NOA {
	export class Constant extends AbstractValue implements IPlainValue {
		value: any;

		constructor(value: any) {
			super();

			this.value = LangUtils.dereference(value);
			if (this.value instanceof Base)
				this.value.live();
		}

		public changed(...args: any[]) {
			throw new Error("Constant value should never change!");
			return this;
		}

		get (caller?: Base, callback?: (newvalue: any, oldvalue: any) => void , fireInitialEvent?: bool): any {
			//onChange is never triggered, so do not register an event
			if (callback && fireInitialEvent !== false)
				callback.call(caller, this.value, undefined);

			return this.value;
		}

		toJSON(): any {
			if (this.value instanceof Base)
				return (<IValue> this.value).toJSON();
			return this.value;
		}

		toAST(): Object {
			if (this.value instanceof Base)
				return (<IValue> this.value).toAST();
			return this.value;
		}

		toString(): string {
			//return ["[Constant#", this.noaid, "=", this.value, "]"].join("");
			return this.value;
		}

		free() {
			if (this.value instanceof Base)
				this.value.die();

			super.free();
		}
	}
}