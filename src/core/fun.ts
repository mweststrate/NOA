///<reference path='../noa.ts'/>
module NOA {
	export class FunctionApplication extends Variable implements IResolver {

		constructor(private fun: Fun, private args: IValue[]) {
			super();
			Util.assert(fun.started);
			//TODO: improved checking based on function definition
			Util.assert(fun.isJSFun || fun.argnames.length == args.length, this.fun.toString() + " called with invalid number of arguments: " + args.length);
			this.args.forEach(arg => arg.live());

			var clone = this.fun.statement.clone();
			LangUtils.startExpression(clone, this);
			this.set(clone);
		}

		resolve(name: string): IValue {
			var argpos = Util.find(name, this.fun.argnames);
			if (argpos >= 0)
				return this.args[argpos];
			return this.fun.resolve(name);
		}

		free() {
			super.free();
			this.args.forEach(arg => arg.die());
		}

		toString() {
			return "apply" + this.noaid + " of " + this.fun.toString() + " with(" + this.args.map(a => a.value()).join(",") + ")";
		}
	}

	export class Fun extends Expression implements IValue implements IResolver {

		isJSFun: bool;

		jsFun: Function;

		argnames: string[];
		statement: IValue;
		closure: IResolver;
		started: bool = false;
		functionName: string;

		constructor(f: Function);
		//constructor(argnames: string[], statement : IValue); //statement should be expression? neuh, a constant value is a valid function as well for example..
		//constructor(argname: string, statement : IValue); //statement should be expression? neuh, a constant value is a valid function as well for example..
		constructor(...args: IValue[]);
		constructor(...args: any[]) {
			super(Util.isFunction(args[0]) ? [] : args);
			this.setName("fun");
			Util.assert(args.length > 0);
			var fun = args[args.length-1];
			this.isJSFun = Util.isFunction(fun);

			if (this.isJSFun) {
				Util.assert(args.length == 1);
				this.jsFun = fun;
			}
			else {
				this.argnames = args.slice(0, -1).map(arg => arg.value());
				this.statement = fun;
			}
		}

		setFunctionName(name: string) {
			Util.assert(!this.started);
			this.functionName = name;
		}

		start(resolver: IResolver) : IValue {
			Util.assert(!this.started);
			this.started = true;
			this.closure = resolver;
			return this;
		}

		resolve(name: string) : IValue {
			//function is available under its own name its own body to allow for recursion
			if (this.functionName && name === this.functionName)
				return this;
			if (this.closure)
				return this.closure.resolve(name);
			return null;
		}

		public set() {
			throw new Error("Value of a function should not be set!");
		}

		public call(...args: IValue[]): IValue {
			Util.assert(this.started);

			this.debugIn("CALL WITH ('" + args.map(arg => "" + arg.toString()).join("', '") + "')");
			try {
				if (this.isJSFun)
					return new JavascriptExpression("call", this.jsFun, args.map(LangUtils.toValue), true).start(null); //js funcs cannot have closure
				else {
					return new FunctionApplication(this, args);
				}
			}
			finally {
				this.debugOut();
			}

		}

		clone(): IValue {
			//TODO: should be just return 'this' or am I missing something?
			var res : Fun;
			if (this.isJSFun)
				res = new Fun(this.jsFun)
			else
				res = NOA.Lang.fun.apply(NOA.Lang, [].concat(this.args.slice(0, -1).map(arg => arg.clone()), this.statement));

			res.setFunctionName(this.functionName);
			return res;
		}

		is(type: ValueType): bool {
			return type === ValueType.Function || type == ValueType.Primitive;
		}

		value(): any { return this; }

		toAST(): Object {
			var res = Serializer.serializeFunction("fun", [].concat(<any[]>this.argnames, [this.statement]));
			res.name = this.functionName;
			return res;
		}

		toJSON(): any {
			return this.isJSFun ? <any>this.jsFun : "fun"+(this.functionName ? " " + this.functionName:"")+"(" + this.argnames.join(",") + ")";
		}

		toGraph() {
			return {
				name: 'Fun',
				functionName : this.functionName,
				args: this.argnames,
				body : this.isJSFun ? this.jsFun.toString() : this.statement.toGraph(),
				started: this.started,
				closure: this.closure ? (<any>this.closure).toGraph() :null //TODO: mweh cast
			}
		}

		toString() {
			return "fun#" + this.noaid + (this.functionName ? " " + this.functionName:"") + "(" + (this.argnames ? this.argnames.join(",") : "") + ")" + (this.isJSFun ? "[native]" : "");
		}

	}
}