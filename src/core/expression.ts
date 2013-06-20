///<reference path='../noa.ts'/>


module NOA {
	export class Expression/*<T extends IValue>*/ extends Variable {

		funcName: string = undefined;
		args: IValue[];
		scopeDependencies : IScopeDependency[] = [];

		constructor(args : IValue[]) {
			super(Lang.None());
			this.args = args;
			this.args.forEach(arg => {
				arg.live();
				if (arg instanceof Expression)
					this.scopeDependencies = this.scopeDependencies.concat((<Expression>arg).getScopeDependencies())
			});
		}

		setName(name: string) {
			this.funcName = name;
		}

		getName() {
			Util.assert(this.funcName, "Name of expression is not defined!");
			return this.funcName;
		}

		toJSON() {
			return this.fvalue.toJSON();
		}

		toAST(): Object {
			return Serializer.serializeFunction(this.getName(), this.args);
		}

		getScopeDependencies() : IScopeDependency[] {
			return this.scopeDependencies;
		}

		addScopeDependency(dep: IScopeDependency) {
			this.scopeDependencies.push(dep);
		}

		free() {
			super.free();
			this.args.forEach(arg => arg.die());
		}

		toString(): string {
			//return ["[Expression#", this.noaid, "=", <any>this.funcName,"(", this.args.join(","), ")]"].join("");
			return this.funcName + "#" + this.noaid + "(" + (this.args ? this.args.join(", ") : "") + ")";
		}

	}

	export interface IScopeDependency {
		name: string;
		value: Variable;
		claimed: bool;
	}

}