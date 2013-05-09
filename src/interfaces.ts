///<reference path='noa.ts'/>
module NOA {

	export enum ValueType { Error, List, Record, PlainValue }

	export interface IValue extends Base {
		toJSON(): any;
		toAST(): Object;
		getType(): ValueType;
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
		getValue(index: number): IValue;
	}

	export interface IRecord extends IValue {
		onPut(caller: Base, callback: (key: string, newvalue: any, oldvalue: any) => void , fireInitialEvent?: bool);
	}

	export class Error extends Base implements IValue, IList, IRecord, IPlainValue {
		
		constructor(private error: string, private cause?: Error) {
			super();
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

		getType(): ValueType {
			return ValueType.Error;
		}

		getCause(): Error {
			return this.cause;
		}

		getRootCause(): Error {
			if (this.cause)
				return this.cause.getRootCause();
			else
				return this;
		}

		getStack(): Error[] {
			var v = this;
			var res = new Array<Error>();
			while (v) {
				res.push(v);
				v = v.getCause();
			}
			return res;
		}

		//* Interface implementations */
		onInsert(caller: Base, cb: (index: number, value, cell: Cell) => void , fireInitialEvents?: bool) {
			if (cb && fireInitialEvents !== undefined)
				cb.call(caller, 0, this, null);
		}

		onMove(caller: Base, cb: (from: number, to: number) => void ) { }
		onRemove(caller: Base, cb: (from: number, value) => void ) { }
		onSet(caller: Base, cb: (index: number, newvalue, oldvalue, cell: Cell) => void ) { }

		get(): any;
		get(caller: Base, onChange: (newvalue: any, oldvalue: any) => void , fireInitialEvent?: bool): any;
		get(caller?: Base, onChange?: (newvalue: any, oldvalue: any) => void , fireInitialEvent?: bool): any {
			if (onChange && fireInitialEvent !== undefined) {
				onChange.call(caller, this, undefined);
				return undefined;
			}
			return this;
		}

		onPut(caller: Base, cb: (index: string, value, cell: Cell) => void, fireInitialEvents?: bool) {
			if (cb && fireInitialEvents !== undefined)
				cb.call(caller, 0, this, null);
		}

		each(scope, cb: (index: number, value: any, cell: Cell) => void ) { }

		size(): number {
			return 0;
		}

		getValue(index: number): IValue {
			return this;
		}

		/*equals(other: IValue) {
			return false; //Too pessimistic?
		}*/
	}

	export class Variable<T extends IValue> extends Base {

		constructor(private value: T) {
			super();
			this.setup(value);
		}

		as<Y>(): Y {
			if (this.is())
				return this;
			else
				return new Error("Expected '" + this.targetType() + "' found: '" + (this.value ? this.value.getType() : this.value) + "'");
		}

		is(): boolean {
			return this.value !== null && this.value !== undefined && this.value.getType() == this.targetType();
		}

		set(newvalue: T) {
			if (this.value != newvalue) {
				var oldvalue = this.value;
				
				this.teardown(oldvalue);
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

		teardown(value: T) {
			throw new Error("Variable.teardown() should be overridden");
		}

		setup(value: T) {
			throw new Error("Variable.setup() should be overridden");
		}

		targetType(): ValueType {
			throw new Error("Variable.targetType() should be overridden");
		}
	}

	export class ListVariable extends Variable<IList> implements IList {

		teardown(value: IList) {
			if (value) {
				this.unlisten(value);
				
				//empty current listeners. TODO: maybe a clear / removeRange operation should be more efficient :)
				var l = value.size();
				for (var i = l - 1; i >= 0; i--)
					this.fire('remove', i, value.getValue(i));
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
				this.value.each(caller, cb);
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
			return this.value ? this.value.size() : 0;
		}

		each(...args: any[]) {
			if (this.value)
				this.value.each.apply(this.value, args);
		}

		getValue(index: number): IValue {
			return this.value.getValue(index);
		}
	}

	//etc
	/*
	export class Expression2<T extends IValue> implements IVariable<T> {

	}
*/
	
}