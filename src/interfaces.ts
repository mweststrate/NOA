///<reference path='noa.ts'/>
module NOA {

	export enum ValueType {
		Error,
		List,
		Record,
		PlainValue,
		Any
	}

	export enum PlainValueEvent { UPDATE, FREE }

	export interface IValue extends IBase {
		toJSON(): any;
		toAST(): Object;
		getType(): ValueType;

		isError() : bool;
		asError() : Error;
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
			return true; //TODO:
		}

		static followHelper(source: IValue, dest: IValue, follow: bool) {

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

		static follow(source: IValue, dest: IValue) {
			LangUtils.followHelper(source, dest, true);
		}


		static unfollow(source: IValue, dest: IValue) {
			LangUtils.followHelper(source, dest, false);
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
			if (this instanceof Error)
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
			switch(type) {
				case ValueType.Any: return true;
				case ValueType.Error : return this instanceof Error;
				case ValueType.List: return this['onInsert'];//MWE: typescript cannot check against interfaces
				case ValueType.Record: return this['onPut'];
				case ValueType.PlainValue: return this['onUpdate'];
			}
			return Util.notImplemented();
		}

		isError () : bool { return this.is(ValueType.Error); }
		asError() {
			Util.assert(this.isError());
			return <Error> this;
		}

		toJSON(): any {
			return Util.notImplemented();
		}

		toAST(): Object {
			return Util.notImplemented();
		}
	}

	export class Variable/*<T extends IValue>*/ extends Base {

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
		isError(): bool {
			return this.value.isError();
		}

		asError(): Error {
			return this.value.asError();
		}

		set(newvalue: IValue) {
			if (this.value != newvalue) {
				var oldvalue = this.value;

				this.teardown(oldvalue);

				if (newvalue.isError()) {
					//TODO: creating new errors for each new type might be expensive?
					this.setup(newvalue.asError().wrap("Expected ", this.expectedType, "but found error", newvalue.asError().getRootCause()));
				}
				else if (!LangUtils.is(newvalue, this.expectedType)) {
					this.setup(new Error("Expected ", this.expectedType, "but found:", newvalue));
				}
				else
					this.setup(newvalue);

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

		getType(): ValueType {
			return this.value.getType();
		}

		free() {
			super.free();

			if (this.value)
				this.value.die();
		}

		teardown(value: IValue) {
			throw new Error("Variable.teardown() should be overridden");
		}

		setup(value: IValue) {
			throw new Error("Variable.setup() should be overridden");
		}

		targetType(): ValueType {
			throw new Error("Variable.targetType() should be overridden");
		}
	}

	export class ListVariable extends Variable/*<IList>*/ implements IList {

		teardown(value: IList) {
			if (value) {
				this.unlisten(value);

				//empty current listeners. TODO: maybe a clear / removeRange operation should be more efficient :)
				var l = value.size();
				for (var i = l - 1; i >= 0; i--)
					this.fire('remove', i, value.get(i));
			}
		}

		setup(value: IList) {
			if (value) {
				value.onInsert(this, this.onSourceInsert, true);
				value.onMove(this, this.onSourceMove);
				value.onRemove(this, this.onSourceRemove);
				value.onSet(this, this.onSourceSet);
			}
		}

		targetType(): ValueType {
			return ValueType.List;
		}

		//Event and interface wrappers

		onInsert(caller: Base, cb: (index: number, value, cell: Cell) => void , fireInitialEvents?: bool) {
			this.on('insert', caller, cb);
			if (fireInitialEvents !== false)
				(<IList>this.value).each(caller, cb);
		}

		onSourceInsert(...args: any[]) {
			args.unshift('insert');
			this.fire.apply(this, args);
		}

		onMove(caller: Base, cb: (from: number, to: number) => void ) {
			this.on('move', caller, cb);
		}

		onSourceMove(...args: any[]) {
			args.unshift('move');
			this.fire.apply(this, args);
		}

		onRemove(caller: Base, cb: (from: number, value) => void ) {
			this.on('remove', caller, cb);
		}

		onSourceRemove(...args: any[]) {
			args.unshift('remove');
			this.fire.apply(this, args);
		}

		onSet(caller: Base, cb: (index: number, newvalue, oldvalue, cell: Cell) => void ) {
			this.on('set', caller, cb);
		}

		onSourceSet(...args: any[]) {
			args.unshift('set');
			this.fire.apply(this, args);
		}

		//Listen to free? Nope, value should not be able to free as long as at least we are listening to it :) Otherwise, it should be handled in Variable.

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