///<reference path='../noa.ts'/>

module NOA {
	export class ErrorValue extends Base implements IValue {

		error: string;
		cause: ErrorValue;

		constructor(error: string, cause?: ErrorValue);
		constructor(...args: any[]);
		constructor(...args: any[]) {
			super();

			if (args.length > 1 && LangUtils.is(args[args.length - 1], ValueType.Error)) {
				this.cause = args[args.length - 1];
				this.cause.live();
				args.pop();
			}

			this.error = Util.map(args, (arg, i) => i % 2 == 1 ? "'" + arg + "'" : ""+arg).join(" ");

		}

		toJSON() {
			return {
				"error": this.error,
				"stack": Util.map(this.getStack(), e => e.getError()).join(",\n")
			}
		}

		toAST(): Object {
			return { "type": "error", "error": this.error };
		}

		is(type: ValueType): bool {
			return type === ValueType.Error || type == ValueType.Primitive;
		}

		value(): any { return this; }

		getCause(): ErrorValue {
			return this.cause;
		}

		getRootCause(): ErrorValue {
			if (this.cause)
				return this.cause.getRootCause();
			else
				return this;
		}

		getStack(): ErrorValue[] {
			var v = this;
			var res = new ErrorValue[]/*new Array<Error>()*/;
			while (v) {
				res.push(v);
				v = v.getCause();
			}
			return res;
		}

		wrap(message: string, error: ErrorValue);
		wrap(...args: any[]);
		wrap(...args: any[]) {
			return new ErrorValue(args);
		}

		free() {
			super.free();

			if (this.cause)
				this.cause.die();
		}

		toString(): string {
			return "[Error#" + this.noaid + "] " + this.error + (this.cause? "\n\t" + this.cause.toString() : "");
		}
	}
}