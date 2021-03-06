///<reference path='../noa.ts'/>

module NOA {
export class Variable/*<T extends IValue>*/ extends Base implements IList /*TODO: IRecord...*/ {

	//TODO: rename fvalue to source
	fvalue: IValue;
	hasPrimitive: bool;
	index: any = undefined;
	pendingResolvers: any;

		constructor(value: IValue = Lang.None()) {
			//TODO: null type?
			super();
			this.fvalue = value;
			this.setup(value, false); //Nobody is listening yet

			//for debugging purposes only
			this.on(PlainValueEvent.CHANGE, this, (newvalue) => this.debug("CHANGED TO: '" + newvalue+ "'"));
		}

		is(expected: ValueType) : bool {
			return this.fvalue.is(expected);
		}

		value(): any {
			return this.fvalue.value();
		}

		set (newvalue: IValue, withEvents: bool = true);
		set (newvalue: any, withEvents: bool = true);
		set (newv: any, withEvents: bool = true) {
			var newvalue = LangUtils.toValue(newv); //MWE: either not this, or make newvalue 'any'

			//Q: should use Lang.equal? -> No, because we should setup the new events
			if (newvalue != this.fvalue) {
				this.debugIn("SET " + newvalue.toString());

				var oldvalue = this.fvalue;
				var ov = oldvalue.value();

				this.teardown(oldvalue, withEvents);

				this.fvalue = newvalue;

				/*if (newvalue.isError()) {
					//TODO: creating new errors for each new type might be expensive?
					//this.setup(newvalue.asError().wrap("Expected ", this.expectedType, "but found error", newvalue.asError().getRootCause()), true);
					this.setup(newvalue, true);
				}
				else*/

				//if (newvalue instanceof Variable)
				//if (withEvents)
				//	LangUtils.startExpression(newvalue, null); //If the new value is not yet started, it just waiting for lazy evaluation, scope should already be bound..
				this.setup(newvalue, withEvents);

				if (withEvents) {
					var nv = newvalue.value();
					if (nv != ov)
						this.fire(PlainValueEvent.CHANGE, nv, ov); //TODO: do not use changed but some constant!
				}
				this.debugOut();
			}
		}

		clone(): IValue {
			return new Variable(this.fvalue ? this.fvalue.clone() : this.fvalue);
		}

		toJSON() {
			this.assertReady();
			return this.fvalue === undefined ? undefined : this.fvalue.toJSON.apply(this.fvalue, arguments);
		}

		toAST(): Object {
			return this.fvalue === undefined ? undefined : this.fvalue.toAST.apply(this.fvalue, arguments);
		}

		toGraph(): any {
			var val = this.value();
			return {
				name: 'Variable',
				value : val && val.toGraph ? val.toGraph() : val,
				source: this.fvalue.toGraph()
			}
		}


		free() {
			//TODO: for all destructors, first free, then fire events and such.
			//That saves unnecessary firing and processing of free events of other objects
			this.teardown(this.fvalue, false);
			super.free();
		}

		teardown(value: IValue, withEvents: bool) {
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
		}

		setup(value: IValue, withEvents: bool) {
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
		}

		//Event and interface wrappers

		onInsert(caller: Base, cb: (index: number, value) => void , fireInitialEvents?: bool) {
			this.on('insert', caller, cb);
			if (fireInitialEvents !== false)
				(<IList>this.fvalue).each(caller, cb);
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
			this.assertReady();

			return this.fvalue ? (<IList>this.fvalue).size() : 0;
		}

		each(...args: any[]) {
			//this.assertReady();

			if (this.fvalue && this.fvalue.is(ValueType.List))
				(<IList>this.fvalue).each.apply(this.fvalue, args);
		}

		cell(index: string): Variable;
		cell(index: number): Variable;
		cell(index: any): Variable {
			if (this.fvalue && (this.fvalue.is(ValueType.List) || this.fvalue.is(ValueType.Record)))
				return (<any>this.fvalue).cell(index);
			else
				throw new Error("Illegal state: variable is not a cell or record");
		}

		get (index: number): IValue;
		get (index: string): IValue;
		get (scope?: any, cb?: (newvalue: any, oldvalue: any) => void , triggerEvents?: bool): IValue;
		get (...args: any[]) {
			//this.assertReady(); //TODO:?

			//record or list?
			if (Util.isNumber(args[0]) || Util.isString(args[0])) {
				Util.assert(this.is(ValueType.List) || this.is(ValueType.Record) || this.is(ValueType.Error))
				return this.fvalue ? (<any>this.fvalue).get(args[0]) : undefined;
			}

			//Plain value
			var value = this.fvalue.value();

			//callback provided? signature is (scope, callback, fireevents)
			//TODO: how does this effect errors and such? maybe write out instead of delegate
			if (args[1]) {
				this.on(PlainValueEvent.CHANGE.toString(), args[0], args[1]);
				if (args[2] !== false)
					args[1].apply(args[0], [value, undefined]);
			}

			return value;
		}

		toString(): string {
			//return ["[Variable#", this.noaid, "=", <any>this.fvalue, "]"].join("");
			return Util.toString(this.fvalue);
		}


		//TODO: set/get Index should be in separate cell container class
		setIndex(index: any): Variable {
			this.index = index;
			return this;
		}

		getIndex(): any {
			Util.assert(this.index != undefined);
			return this.index;
		}

		assertReady() {
			Util.assert(!(this instanceof Expression) || (<Expression>this).started, "Expression should be started before it can be evaluated")
		}
	}

}