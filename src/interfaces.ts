///<reference path='noa.ts'/>
module NOA {

	export enum ValueType {
		Error,
		List,
		Record,
		PlainValue, //TODO: split to 'primitive' and 'valuecontainer (or similar)'
		Any
	}

	export enum PlainValueEvent { UPDATE, FREE }

	export interface IValue extends IBase {
		toJSON(): any;
		toAST(): Object;

		getType(): ValueType;
		is(expected: ValueType) : bool;

		isError() : bool;
		asError() : ErrorValue;
	}

	export interface IPlainValue extends IValue { //TODO: cell and expression implement IPlainValue
		get(): any;
		get(caller: Base, onChange: (newvalue: any, oldvalue: any) => void , fireInitialEvent?: bool): any;
	}

	export interface IList extends IValue {
		onInsert(caller: Base, cb: (index: number, value, cell: Cell) => void , fireInitialEvents?: bool);
		onMove(caller: Base, cb: (from: number, to: number) => void );
		onRemove(caller: Base, cb: (from: number, value) => void );
		onSet(caller: Base, cb: (index: number, newvalue, oldvalue, cell: Cell) => void );


		each(scope, cb: (index: number, value: any, cell: Cell) => void );
		size(): number;
		get(index: number): IValue;
	}

	export interface IMutableList extends IList {
		insert(index: number, value: IValue);
	}

	export interface IRecord extends IValue {
		onPut(caller: Base, callback: (key: string, newvalue: any, oldvalue: any) => void , fireInitialEvent?: bool);
	}

	export interface IMutableRecord extends IRecord {
		put(key: string, value: IValue);
	}

	export class LangUtils {
		static is(value: IValue, type: ValueType) {
			switch(type) {
				case ValueType.Any: return true;
				case ValueType.Error: return this instanceof ErrorValue;
				case ValueType.List: return this['onInsert'];//MWE: typescript cannot check against interfaces
				case ValueType.Record: return this['onPut'];
				case ValueType.PlainValue: return this['onUpdate'];
			}
			return Util.notImplemented();
		}

		static followHelper(dest: IValue, source: IValue, follow: bool) {

			Util.assert(source != null && dest != null);

			dest.uses(source);
			var t = source.getType();
			//no if, Error follows all types!
			if (t == ValueType.PlainValue)
				LangUtils.followEvent(source, PlainValueEvent.UPDATE.toString(), dest, follow);
			if (t == ValueType.List) {
				LangUtils.followEvent(source, ListEvent.INSERT.toString(), dest, follow);
				LangUtils.followEvent(source, ListEvent.MOVE.toString(), dest, follow);
				LangUtils.followEvent(source, ListEvent.REMOVE.toString(), dest, follow);
				LangUtils.followEvent(source, ListEvent.SET.toString(), dest, follow);
			}
			if (t == ValueType.Record)
				LangUtils.followEvent(source, RecordEvent.PUT.toString(), dest, follow);
		}

		static follow(dest: IValue, source: IValue) {
			LangUtils.followHelper(dest, source, true);
		}

		static unfollow(dest: IValue, source: IValue) {
			LangUtils.followHelper(dest, source, false);
		}

		static followEvent(source: IBase, event: string, dest: IBase, follow : bool) {
			if (follow) {
				dest.listen(source, event, (...args: any[]) => {
					args.unshift(event);
					this.fire.apply(this, args);
				} );
			}
			else {
				dest.unlisten(source, event);
			}
		}
	}

	export class AbstractValue extends Base implements IValue {

		constructor() {
			super();
		}

		getType() : ValueType {
			if (this instanceof ErrorValue)
				return ValueType.Error;
			if (this.is(ValueType.List))
				return ValueType.List;
			if (this.is(ValueType.Record))
				return ValueType.Record;
			if (this.is(ValueType.PlainValue))
				return ValueType.PlainValue;
			return ValueType.Any; //MWE; or: unknown?
		}

		is(type : ValueType): bool {
			return LangUtils.is(this, type);
		}

		isError () : bool { return this.is(ValueType.Error); }
		asError() {
			Util.assert(this.isError());
			return <ErrorValue> this;
		}

		toJSON(): any {
			return Util.notImplemented();
		}

		toAST(): Object {
			return Util.notImplemented();
		}
	}

	export class Variable/*<T extends IValue>*/ extends Base implements IList /*TODO: IRecord...*/ {

		value: IValue;

		constructor(private expectedType : ValueType, value: IValue) {
			//TODO: null type?
			super();
			this.value = value;
			this.setup(value);
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

		is(expected: ValueType) {
			return this.value.is(expected);
		}

		isError(): bool {
			return this.value.isError();
		}

		asError(): ErrorValue {
			return this.value.asError();
		}

		set(newvalue: IValue) {
			if (this.value != newvalue) {
				var oldvalue = this.value;
				var combineChangeEvent = LangUtils.is(newvalue, ValueType.PlainValue) && LangUtils.is(oldvalue, ValueType.PlainValue);

				this.teardown(oldvalue, combineChangeEvent);

				if (newvalue.isError()) {
					//TODO: creating new errors for each new type might be expensive?
					this.setup(newvalue.asError().wrap("Expected ", this.expectedType, "but found error", newvalue.asError().getRootCause()));
				}
				else if (!LangUtils.is(newvalue, this.expectedType)) {
					this.setup(new ErrorValue("Expected ", this.expectedType, "but found:", newvalue));
				}
				else
					this.setup(newvalue, combineChangeEvent);

				if (combineChangeEvent)
					this.fire('changed', (<IPlainValue>newvalue).get(), (<IPlainValue>oldvalue).get());


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

		teardown(value: IValue, suppressPrimitiveGet: bool) {
			if (!value)
				return;

			LangUtils.unfollow(this, value);

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
				if (!suppressPrimitiveGet)
					this.fire("changed", undefined, (<IPlainValue>value).get());
			}
		}

		setup(value: IValue, suppressPrimitiveGet = false) {
			if (!value)
				return;

			LangUtils.follow(this, value);

			if (value.is(ValueType.List)) {
				(<List>value).each(this, function (index: number, value) {
					this.fire(ListEvent.INSERT.toString(), index, value);
				});
			}
			if (value.is(ValueType.Record)) {
				//TODO: Record
			}
			if (value.is(ValueType.PlainValue)) {
				if (!suppressPrimitiveGet)
					this.fire("changed",(<IPlainValue>value).get(), undefined);
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

		get(index: number): IValue {
			return (<IList>this.value).get(index);
		}
	}

	//etc
	/*
	export class Expression2<T extends IValue> implements IVariable<T> {

	}
*/

}