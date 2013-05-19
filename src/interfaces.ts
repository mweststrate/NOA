///<reference path='noa.ts'/>
module NOA {

	export enum ValueType {
		Error,
		List,
		Record,
		PlainValue, //TODO: split to 'primitive' and 'valuecontainer (or similar)'
		Any
	}

	export class PlainValueEvent {
		public static UPDATE = "change";
		public static FREE = "free";
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
		static is(value: any, type: ValueType): bool {
			if (!(value instanceof Base))
				return type == ValueType.Any;

			switch(type) {
				case ValueType.Any: return true;
				case ValueType.Error: return value instanceof ErrorValue;
				case ValueType.List: return value['insert'];//MWE: typescript cannot check against interfaces
				case ValueType.Record: return value['put'];
				case ValueType.PlainValue: return value['get'];
			}
			Util.notImplemented();
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

			//MWE: mweh implementation
			var listenList =
				(dest instanceof List || dest instanceof Variable) &&
				(source instanceof List || source instanceof Variable || source instanceof Error);

			var listenRecord =
				(dest instanceof Record || dest instanceof Variable) &&
				(source instanceof Record || source instanceof Variable || source instanceof Error);

			var listenPlain =
				(dest instanceof PlainValue || dest instanceof Variable) &&
				(source instanceof Constant || source instanceof PlainValue || source instanceof Variable || source instanceof Error)

			if (!(listenList || listenPlain || listenRecord))
				throw new Error("Follow not supported for " + source+  " and "+ dest);

			if (listenPlain)
				LangUtils.followEvent(source, PlainValueEvent.UPDATE.toString(), dest, follow);
			if (listenList) {
				LangUtils.followEvent(source, ListEvent.INSERT.toString(), dest, follow);
				LangUtils.followEvent(source, ListEvent.MOVE.toString(), dest, follow);
				LangUtils.followEvent(source, ListEvent.REMOVE.toString(), dest, follow);
				LangUtils.followEvent(source, ListEvent.SET.toString(), dest, follow);
			}
			if (listenRecord)
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

		static clone(item: IValue, cb: (res : IValue) => void) {
			var ast = NOA.Serializer.serialize(item);
			new NOA.Unserializer(Util.notImplemented).unserialize(ast, cb);
		}

		private static parseArguments(argtypes, args: any[]) : IValue[] {
			//converts to IValue
			//Throws if not correct
			return Util.map(args, LangUtils.toValue);
		}

		static define(name: string, argtypes : ValueType[], resultType: ValueType, impl : (...args:IValue[]) => any, memoize: bool = false): Function {
			return Lang[name] = function (...args: any[]) {
				var realArgs = parseArguments(argtypes, args);
				var wrapper = LangUtils.watchFunction(impl, resultType);
				wrapper.apply(null, realArgs);
				return (<any>wrapper).result;
			}


				/*function (...args: any[]) {
				var res = new Variable(result, undefined);
				var cbcalled = false;

				var scope : Scope = Scope.getCurrentScope(); //TODO: maybe just pass scopes around?

				var cb = function (newvalue) {
					cbcalled = true;
					res.set(LangUtils.toValue(newvalue));
				}

				try {

					args = parseArguments(argtypes, args);
					args.forEach(arg => res.uses(arg));
					args.unshift(cb);

					var res = impl.apply(cb, args);
					if (res !== undefined && cbcalled == false)
						cb(res);
				}
				catch (e) {
					res.set(new ErrorValue(e));
				}
			}*/
		}

		/**
		Function watcher watches a function and follows the result. A new function is returned. This function has the following properties:
		1. Any arguments passed into the wrapper will be passed into the original function
		2. It has a 'result' property which containts the variable in which the result is stored
		3. If the wrapper is invoked, it invokes the original function (with a special scope), allowing it to updte the result, by either doing the following
		4. - Return something (This will update the stored variable in wrapper.result).
		5. - call this(result). (This will update the stored variable in wrapper.result).
		*/
		static watchFunction(func, expectedType: ValueType = ValueType.Any): Function {
			var scope = Scope.getCurrentScope();
			var res = new Variable(expectedType, undefined);
			var cbcalled = false;
			var cb = function (newvalue) {
				cbcalled = true;
				res.set(LangUtils.toValue(newvalue));
			}

			var f = function () {
				Scope.pushScope(scope);

				try {
					cbcalled = false;

					//var scope: Scope = Scope.getCurrentScope(); //TODO: maybe just pass scopes around?
					var value = func.apply(cb, arguments);

					if (value !== undefined && cbcalled == false)
						cb(value);
				}
				catch(e) {
					cb(new ErrorValue(e));
				}
				finally {
					Scope.popScope();
				}
			};

			(<any>f).result = res;

			return f;
		}

		static withValues(args: IValue[], func): IValue {
			var realargs = args.map(LangUtils.dereference);

			var wrapped = LangUtils.watchFunction(func);

			var update = function () {
				wrapped.apply(null, realargs);
			};

			args.forEach((arg, index) => {
				if (arg.is(ValueType.PlainValue)) {
					(<IPlainValue>arg).get(null, (newvalue, _) => {
						realargs[index] = LangUtils.dereference(newvalue);
						update();
					}, false);
				}
			});

			update();

			return (<any>wrapped).result;
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