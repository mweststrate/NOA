///<reference path='noa.ts'/>

module NOA {
export class Variable/*<T extends IValue>*/ extends Base implements IList /*TODO: IRecord...*/ {

	value: IValue;
	hasPrimitive: bool;


		constructor(private expectedType : ValueType, value: IValue) {
			//TODO: null type?
			super();
			this.value = value;
			this.setup(value, false); //Nobody is listening yet
		}
/*
		as<Y>(): Y {
			if (this.is())
				return this;
			else
				return new Error("Expected '" + this.targetType() + "' found: '" + (this.value ? this.value.getType() : this.value) + "'");
		}

		is(): boolean {
			return this.value !== null && this.value !== undefined && this.value.getType() == this.targetType();
		}
*/

		getType(): ValueType {
			return this.value.getType();
		}

		is(expected: ValueType) : bool {
			return this.value.is(expected);
		}

		isError(): bool {
			return this.value.isError();
		}

		asError(): ErrorValue {
			return this.value.asError();
		}

		set(newvalue: IValue, withEvents: bool = true) {
			//Q: should use Lang.equal? -> No, because we should setup the new events
			if (newvalue != this.value) {
				var oldvalue = this.value;

				var combineChangeEvent =
					(LangUtils.is(newvalue, ValueType.PlainValue)) &&
					(LangUtils.is(oldvalue, ValueType.PlainValue));

				this.teardown(oldvalue, withEvents,combineChangeEvent);

				if (newvalue.isError()) {
					//TODO: creating new errors for each new type might be expensive?
					this.setup(newvalue.asError().wrap("Expected ", this.expectedType, "but found error", newvalue.asError().getRootCause()), true);
				}
				else if (!LangUtils.is(newvalue, this.expectedType)) {
					this.setup(new ErrorValue("Expected ", this.expectedType, "but found:", newvalue), true);
				}
				else
					this.setup(newvalue, withEvents, combineChangeEvent);

				if (combineChangeEvent && withEvents) {
					var nv = (<IPlainValue>newvalue).get();
					var ov = (<IPlainValue>oldvalue).get();
					if (nv != ov)
						this.fire('change', nv, ov); //TODO: do not use changed but some constant!
				}

				if (newvalue)
					newvalue.live();
				if (oldvalue)
					oldvalue.die();
			}
		}

		toJSON() {
			return this.value.toJSON.apply(this.value, arguments);
		}

		toAST(): Object {
			return this.value.toAST.apply(this.value, arguments);
		}

/*
		live() {
			if (this.value != null)
				this.value.live();
		}

		die() {
			if (this.value != null)
				this.value.die();
		}
*/
		free() {
			super.free();

			if (this.value)
				this.value.die();
		}

		teardown(value: IValue, withEvents: bool, suppressPrimitiveGet: bool) {
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
				//TODO: record, plain..

			}
			if (value.is(ValueType.PlainValue)) {
				var ov = (<IPlainValue>value).get();
				if (!suppressPrimitiveGet && ov !== undefined)
					this.fire("change", undefined, ov);
			}
		}

		setup(value: IValue, withEvents: bool, suppressPrimitiveGet = false) {
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
				if (!suppressPrimitiveGet && nv !== undefined)
					this.fire("change", nv, undefined);
			}
		}

		//Event and interface wrappers

		onInsert(caller: Base, cb: (index: number, value, cell: Cell) => void , fireInitialEvents?: bool) {
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

		onSet(caller: Base, cb: (index: number, newvalue, oldvalue, cell: Cell) => void ) {
			this.on('set', caller, cb);
		}

		size(): number {
			return this.value ? (<IList>this.value).size() : 0;
		}

		each(...args: any[]) {
			if (this.value)
				(<IList>this.value).each.apply(this.value, args);
		}

		get (index: number, scope?: any, cb?: (newvalue: any, oldvalue: any) => void , triggerEvents?: bool): IValue;
		get (scope?: any, cb?: (newvalue: any, oldvalue: any) => void , triggerEvents?: bool): IValue;
		get (...args: any[]) {
			//TODO: check arguments for either list / record or plain value?
			return (<any>this.value).get.apply(this, args);
		}
	}

}