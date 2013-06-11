///<reference path='../noa.ts'/>


module NOA {
export class Variable/*<T extends IValue>*/ extends Base implements IList /*TODO: IRecord...*/ {

	value: IValue;
	hasPrimitive: bool;
	indexes: any;

		constructor(private expectedType : ValueType, value: IValue) {
			//TODO: null type?
			super();
			this.value = value;
			this.indexes = {};
			this.setup(value, false); //Nobody is listening yet
		}

		getType(): ValueType {
			return this.value.getType();
		}

		is(expected: ValueType) : bool {
			if (this.value === null || this.value === undefined)
				return expected == ValueType.Any || expected == ValueType.PlainValue; //TODO: weird.. now the case because it is gettable...?!
			return this.value.is(expected);
		}

		isError(): bool {
			return this.value && this.value.isError();
		}

		asError(): ErrorValue {
			return this.value.asError();
		}

		set(newvalue: IValue, withEvents: bool = true) {
			newvalue = LangUtils.toValue(newvalue); //MWE: either not this, or make newvalue 'any'

			//Q: should use Lang.equal? -> No, because we should setup the new events
			if (newvalue != this.value) {
				var oldvalue = this.value;
				//TODO: FIXME: oldvalue is not necessearyle a plain value
				var ov = oldvalue ? (<IPlainValue>oldvalue).get() : undefined;

				var combineChangeEvent =
					(LangUtils.is(newvalue, ValueType.PlainValue)) &&
					(LangUtils.is(oldvalue, ValueType.PlainValue));

				this.teardown(oldvalue, withEvents, combineChangeEvent);

				this.value = newvalue;

				if (newvalue.isError()) {
					//TODO: creating new errors for each new type might be expensive?
					//this.setup(newvalue.asError().wrap("Expected ", this.expectedType, "but found error", newvalue.asError().getRootCause()), true);
					this.setup(newvalue, true);
				}
				else if (!LangUtils.is(newvalue, this.expectedType)) {
					this.setup(new ErrorValue("Expected '", this.expectedType, "' but found:", newvalue), true);
				}
				else
					this.setup(newvalue, withEvents, combineChangeEvent);

				if (combineChangeEvent && withEvents) {
					var nv = newvalue ? (<IPlainValue>newvalue).get() : undefined;
					if (nv != ov)
						this.fire('change', nv, ov); //TODO: do not use changed but some constant!
				}
			}
		}

		toJSON() {
			return this.value === undefined ? undefined : this.value.toJSON.apply(this.value, arguments);
		}

		toAST(): Object {
			return this.value === undefined ? undefined : this.value.toAST.apply(this.value, arguments);
		}

		free() {
			//TODO: for all destructors, first free, then fire events and such.
			//That saves unnecessary firing and processing of free events of other objects
			this.teardown(this.value, false, false);

			super.free();
		}

		teardown(value: IValue, withEvents: bool, suppressGetCallback: bool) {
			if (!value)
				return;

			LangUtils.unfollow(this, value);

			if (withEvents === false)
				return;

			if (value.is(ValueType.List)) {
				//empty current listeners. TODO: maybe a clear / removeRange operation should be more efficient :)
				var l = (<IList>value).size();
				for (var i = l - 1; i >= 0; i--)
					this.fire(ListEvent.REMOVE.toString(), i, (<IList>value).get(i));
			}
			if (value.is(ValueType.Record)) {
				//TODO: record:.

			}
			if (value.is(ValueType.PlainValue)) {
				var ov = (<IPlainValue>value).get();
				if (!suppressGetCallback && ov !== undefined)
					this.fire("change", undefined, ov);
			}
		}

		setup(value: IValue, withEvents: bool, suppressGetCallback = false) {
			if (!value)
				return;

			LangUtils.follow(this, value);

			if (withEvents === false)
				return;

			if (value.is(ValueType.List)) {
				(<List>value).each(this, function (index: number, value) {
					this.fire(ListEvent.INSERT.toString(), index, value);
				});
			}
			if (value.is(ValueType.Record)) {
				//TODO: Record
			}
			if (value.is(ValueType.PlainValue)) {
				var nv = (<IPlainValue>value).get();
				if (!suppressGetCallback && nv !== undefined)
					this.fire("change", nv, undefined);
			}
		}

		//Event and interface wrappers

		onInsert(caller: Base, cb: (index: number, value) => void , fireInitialEvents?: bool) {
			this.on('insert', caller, cb);
			if (fireInitialEvents !== false)
				(<IList>this.value).each(caller, cb);
		}

		onMove(caller: Base, cb: (from: number, to: number) => void ) {
			this.on('move', caller, cb);
		}

		onRemove(caller: Base, cb: (from: number, value) => void ) {
			this.on('remove', caller, cb);
		}

		onSet(caller: Base, cb: (index: number, newvalue, oldvalue) => void ) {
			this.on('set', caller, cb);
		}

		size(): number {
			return this.value ? (<IList>this.value).size() : 0;
		}

		each(...args: any[]) {
			if (this.value)
				(<IList>this.value).each.apply(this.value, args);
		}

		get (index: number): IValue;
		get (index: string): IValue;
		get (scope?: any, cb?: (newvalue: any, oldvalue: any) => void , triggerEvents?: bool): IValue;
		get (...args: any[]) {
			//record or list?
			if (Util.isNumber(args[0]) || Util.isString(args[0])) {
				return this.value ? (<any>this.value).get(args[0]) : undefined;
			}

			//Plain value
			var value = undefined;
			if (this.value instanceof Variable || this.value instanceof Constant) //TODO: fix check! this.is(ValueType.PlainValue))
				var value = (<PlainValue>this.value).get();
			else
				value = this.value; //either nothing or list


			//callback provided? signature is (scope, callback, fireevents)
			if (args[1]) {
				this.on(PlainValueEvent.UPDATE.toString(), args[0], args[1]);
				if (args[2] !== false)
					args[1].apply(args[0], [value, undefined]);
			}

			return value;
		}

		toString(): string {
			return ["[Variable#", this.noaid, "=", <any>this.value, "]"].join("");
		}


		//TODO: move to 'ContainedVariable'
		addIndex(parent: CellContainer, index: any): Variable {
			Util.assert(this.indexes[parent.noaid] === undefined);

			this.indexes[parent.noaid] = index;
			return this;
		}


		updateIndex(parent: CellContainer, index: any): Variable {
			Util.assert(this.indexes[parent.noaid] !== undefined);

			this.indexes[parent.noaid] = index;
			return this;
		}

		removeIndex(parent: CellContainer): Variable {
			Util.assert(this.indexes[parent.noaid] !== undefined);

			delete this.indexes[parent.noaid];
			return this;
		}


		getIndex(parent: CellContainer): any {
			Util.assert(this.indexes[parent.noaid] !== undefined);

			return this.indexes[parent.noaid];
		}
	}

}