///<reference path='../noa.ts'/>


module NOA {
	export class Expression/*<T extends IValue>*/ extends Variable {

		funcName: string = undefined;
		args: IValue[];
		scopeDependencies: IScopeDependency[] = [];
		started: bool = false;

		constructor(args : IValue[]) { //TODO: first argument should be name: string
			super(Lang.None());
			this.args = [];
			args.forEach(arg => this.initArg(arg, true));
		}

		start(resolver: IResolver) : IValue { //todo rename resolver to closure
			Util.assert(!this.started);
			this.args.forEach(arg => {
				if (arg instanceof Expression && !(<Expression>arg).started)
					(<Expression>arg).start(resolver);
			});
			this.started = true;
			return this;
		}

		initArg(arg: IValue, assingResolver = true) {
			this.args.push(arg);
			arg.live();
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

		toGraph(): any {
			var res = super.toGraph();
			res.name = this.getName();
			res.args = this.args.map(arg => arg.toGraph());
			return res;
		}

		clone(): IValue {
			Util.assert(this.getName());
			var f = NOA.Lang[this.getName()];
			Util.assert(f);
			var args = this.args.map(arg => arg.clone());
			return f.apply(NOA.Lang, args);
		}

		free() {
			super.free();
			this.args.forEach(arg => arg.die());
		}

		toString(): string {
			//return ["[Expression#", this.noaid, "=", <any>this.funcName,"(", this.args.join(","), ")]"].join("");
			return this.funcName + "#" + this.noaid + "(" + (this.args ? this.args.map(a => "" + a.toString()).join(", ") : "") + ")";
		}

	}


}