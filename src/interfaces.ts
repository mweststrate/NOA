///<reference path='noa.ts'/>
module NOA {

	export enum ValueType {
		Error,
		List,
		Record,
		PlainValue, //TODO: split to 'primitive' and 'valuecontainer (or similar)'
		Any
	}

	export enum PlainValueEvent {
		UPDATE = 100,
		FREE = 101
	}

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
		static is(value: any, type: ValueType) {
			if (!(value instanceof Base))
				return type == ValueType.Any;

			switch(type) {
				case ValueType.Any: return true;
				case ValueType.Error: return this instanceof ErrorValue;
				case ValueType.List: return this['insert'];//MWE: typescript cannot check against interfaces
				case ValueType.Record: return this['put'];
				case ValueType.PlainValue: return this['get'];
			}
			return Util.notImplemented();
		}

		static toValue(value: any): IValue {

			if (value instanceof Base) //MWE: todo: bwegh...
				return <IValue> value;

			//TODO: object, array?

			//TODO: check primitives
			//TODO: make primitives pointer equal by sharing?

			return new Constant(value);
		}

		/**
			Converts any value to the value it is ultimatily representing.
			Variables, Constants and PlainValues return their actual contents (recursively).

			Other values will be returned directly
		*/
		static dereference(v: IValue) : any { //TODO: better name?
				if (v === null || v === undefined)
					return v;
				if (Util.isPrimitive(v))
					return v;
				if (v.is(ValueType.List) || v.is(ValueType.Record) || v.is(ValueType.Error)) {
					if (v instanceof Variable) //compare contents, not variables
						return dereference((<Variable>v).value);
					return v;
				}
				if (v.is(ValueType.PlainValue))
					return (<IPlainValue>v).get();
				throw new Error("Uncomparable: " + v);
			}

		static equal(left: IValue, right: IValue): bool {
			return dereference(left) == dereference(right);
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

		private static parseArguments(argtypes, args: any[]) : IValue[] {
			//converts to IValue
			//Throws if not correct
			return Util.map(args, LangUtils.toValue);
		}

		static define(name: string, argtypes : ValueType[], result: ValueType, impl : (cb: (newvalue: any)=> void, ...args:any[]) => any, memoize: bool = false): Function {

			return Lang[name] = function (...args: any[]) {
				var res = new Variable(result, undefined);
				var cbcalled = false;

				var cb = function (newvalue) {
					cbcalled = true;
					res.set(LangUtils.toValue(newvalue));
				}

				try {

					args = parseArguments(argtypes, args);
					args.forEach(arg => res.uses(arg));
					args.unshift(cb);

					var res = impl.apply(null, args); //TODO: scope?
					if (res !== undefined && cbcalled == false)
						cb(res);
				}
				catch (e) {
					res.set(new ErrorValue(e));
				}
			}
		}
	}

	export /*abstract*/ class AbstractValue extends Base implements IValue {

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


	//etc
	/*
	export class Expression2<T extends IValue> implements IVariable<T> {

	}
*/

}