///<reference path='../noa.ts'/>

module NOA {
	//TODO: rename to primitive?
	export class Constant extends Base implements IPlainValue {
		fvalue: any;

		constructor(value: any) {
			super();
			Util.assert(Util.isPrimitive(value));
			this.fvalue = value;
		}

		public changed(...args: any[]) {
			throw new Error("Constant value should never change!");
			return this;
		}

		get (caller?: Base, callback?: (newvalue: any, oldvalue: any) => void , fireInitialEvent?: bool): any {
			//onChange is never triggered, so do not register an event
			if (callback && fireInitialEvent !== false)
				callback.call(caller, this.fvalue, undefined);

			return this.fvalue;
		}

		is(type: ValueType): bool {
			switch(type) {
				case ValueType.Bool:
					return Util.isBool(this.fvalue);
				case ValueType.None:
					return this.fvalue === null || this.fvalue === undefined;
				case ValueType.Number:
					return Util.isNumber(this.fvalue);
				case ValueType.Primitive:
					return true;
				case ValueType.String:
					return Util.isString(this.fvalue);
				case ValueType.Error:
				case ValueType.Function:
				case ValueType.List:
				case ValueType.Record:
					return false;
				default:
					throw new Error("Unimplemented type: " + type);
			}
		}

		value(): any {
			return this.fvalue;
		}

		clone(): IValue {
			return this;
		}

		toJSON(): any {
			return this.fvalue;
		}

		toAST(): Object {
			return this.fvalue;
		}

		toGraph(): any {
			return this.toString();
		}

		toString(): string {
			//return ["[Constant#", this.noaid, "=", this.fvalue, "]"].join("");
			return this.fvalue === null || this.fvalue === undefined ? "None" : this.fvalue;
		}

		free() {
			super.free();
		}
	}
}