///<reference path='noa.ts'/>

module NOA {
	export class ErrorValue extends AbstractValue implements IValue, IList, IRecord, IPlainValue {

		error: string;
		cause: ErrorValue;

		backingList: List;
		backingRecord: Record;
		backingPlain: IPlainValue;

		constructor(error: string, cause?: ErrorValue);
		constructor(...args: any[]);
		constructor(...args: any[]) {
			super();

			if (args.length > 1 && args[args.length - 1] instanceof ErrorValue) {
				this.cause = args[args.length - 1];
				args.pop();
			}

			this.error = Util.map(args, (arg, i) => i % 2 == 1 ? "'" + arg + "'" : ""+arg).join(" ");

			this.backingPlain = new Variable(ValueType.Any, this.error); //new Constant(this);

			this.backingList = new List();
			this.backingList.add(this);

			this.backingRecord = new Record();
			this.backingRecord.put("error", this);
		}

		isError(): bool {
			return true;
		}

		getError(): string {
			return this.error;
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

		//* Interface implementations */
		onInsert(caller: Base, cb: (index: number, value) => void , fireInitialEvents?: bool) {
			this.backingList.onInsert(caller, cb, fireInitialEvents);
		}

		onMove(caller: Base, cb: (from: number, to: number) => void ) { }
		onRemove(caller: Base, cb: (from: number, value) => void ) { }
		onSet(caller: Base, cb: (index: number, newvalue, oldvalue, cell: Cell) => void ) { }

		get(): any;
		get (caller: Base, onChange: (newvalue: any, oldvalue: any) => void , fireInitialEvent?: bool): any;
		get (index: number): IValue;
		get(callerOrIndex?: any, onChange?: (newvalue: any, oldvalue: any) => void , fireInitialEvent?: bool): any {
			if (Util.isNumber(callerOrIndex))
				return this.backingList.get(callerOrIndex);

			return this.backingPlain.get(<Base>callerOrIndex, onChange, fireInitialEvent);
		}

		onPut(caller: Base, cb: (index: string, value, cell: Cell) => void , fireInitialEvents?: bool) {
			return this.backingRecord.onPut(caller, cb, fireInitialEvents);
		}

		each(scope, cb: (index: number, value: any, cell: Cell) => void ) {
			this.backingList.each(scope, cb);
		}

		size(): number {
			return this.backingList.size();
		}

		free() {
			this.backingList.free();
			this.backingRecord.free();
			this.backingPlain.free();
			super.free();
		}

		toString(): string {
			return "[Error] " + this.error + (this.cause? "\n\t" + this.cause.toString() : "");
		}
	}
}