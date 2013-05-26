///<reference path='../noa.ts'/>


module NOA {
	export class Expression/*<T extends IValue>*/ extends Variable {

		funcName: string;
		args: IValue[];

		constructor(name: string, args : IValue[]) {
			super(ValueType.Any, undefined);
			this.funcName = name;
			this.args = args;
			this.args.forEach(arg => arg.live());
		}

		toJSON() {
			return this.value === undefined ? undefined : this.value.toJSON.apply(this.value, arguments);
		}

		toAST(): Object {
			return Serializer.serializeFunction(this.funcName, this.args);
		}

		free() {
			super.free();
			this.args.forEach(arg => arg.die());
		}

		toString(): string {
			//return ["[Expression#", this.noaid, "=", <any>this.funcName,"(", this.args.join(","), ")]"].join("");
			return this.funcName + "(" + this.args.join(", ") + ")";
		}

	}

}