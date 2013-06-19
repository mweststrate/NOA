///<reference path='../noa.ts'/>


module NOA {
	export class Expression/*<T extends IValue>*/ extends Variable {

		funcName: string = undefined;
		args: IValue[];

		constructor(args : IValue[]) {
			super(Lang.None());
			this.args = args;
			this.args.forEach(arg => arg.live());
		}

		setName(name: string) {
			this.funcName = name;
		}

		getName() {
			Util.assert(this.funcName, "Name of expression is not defined!");
			return this.funcName;
		}

		toJSON() {
			return this.value().toJSON.apply(this.value(), arguments);
		}

		toAST(): Object {
			return Serializer.serializeFunction(this.getName(), this.args);
		}

		free() {
			super.free();
			this.args.forEach(arg => arg.die());
		}

		toString(): string {
			//return ["[Expression#", this.noaid, "=", <any>this.funcName,"(", this.args.join(","), ")]"].join("");
			return this.funcName + "#" + this.noaid + "(" + this.args.join(", ") + ")";
		}

	}

}