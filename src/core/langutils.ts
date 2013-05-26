///<reference path='../noa.ts'/>
module NOA {

	export class LangUtils {
		static is(value: any, type: ValueType): bool {
			if (!(value instanceof Base))
				return type == ValueType.Any;

			switch (type) {
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
		static dereference(v: IValue): any { //TODO: better name?
			if (v === null || v === undefined)
				return v;
			if (Util.isPrimitive(v))
				return v;
			if (v instanceof Variable) {
				return dereference((<Variable>v).value);
			}
			if (v.is(ValueType.List) || v.is(ValueType.Record) || v.is(ValueType.Error)) {
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
			(<Base><any>dest).debug((follow ? "Following " : "Unfollowing") + source);

			//MWE: mweh implementation
			var listenList =
				(dest instanceof List || dest instanceof Variable) &&
				(source instanceof List || source instanceof Variable || source instanceof ErrorValue);

			var listenRecord =
				(dest instanceof Record || dest instanceof Variable) &&
				(source instanceof Record || source instanceof Variable || source instanceof ErrorValue);

			var listenPlain =
				(dest instanceof PlainValue || dest instanceof Variable) &&
				(source instanceof Constant || source instanceof PlainValue || source instanceof Variable || source instanceof ErrorValue)

			if (!(listenList || listenPlain || listenRecord))
				throw new Error("Follow not supported for " + source + " and " + dest);

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

			//live / die
			if (follow)
				source.live();
			else
				source.die();
		}

		static follow(dest: IValue, source: IValue) {
			LangUtils.followHelper(dest, source, true);
		}

		static unfollow(dest: IValue, source: IValue) {
			LangUtils.followHelper(dest, source, false);
		}

		static followEvent(source: IBase, event: string, dest: IBase, follow: bool) {
			if (follow) {
				dest.listen(source, event, (...args: any[]) => {
					args.unshift(event);
					this.fire.apply(this, args);
				});
			}
			else {
				dest.unlisten(source, event);
			}
		}

		static clone(item: IValue, cb: (res: IValue) => void ) {
			var ast = NOA.Serializer.serialize(item);
			new NOA.Unserializer(Util.notImplemented).unserialize(ast, cb);
		}

		private static parseArguments(argtypes, args: any[], destination: Variable): IValue[] {
			//converts to IValue
			//Throws if not correct
			//TODO: use args.. to separate function?
			return Util.map(args, arg => {
				var val = LangUtils.toValue(arg);
				destination.uses(val);
				return val;
			})
		}

		static define(name: string, argtypes: ValueType[], resultType: ValueType, impl: (...args: IValue[]) => any, memoize: bool = false): Function {
			return Lang[name] = function (...args: any[]) {
				var result = new Variable(resultType, undefined);
				var realArgs = parseArguments(argtypes, args, result);
				var wrapper = LangUtils.watchFunction(impl, result);
				wrapper.apply(null, realArgs);
				return result;
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
		2. Destination variable is the variable in which the result of the function will be stored
		3. If the wrapper is invoked, it invokes the original function (with a special scope), allowing it to update the result, by either doing the following
		4. - Return something (This will update the value of destination).
		5. - call this(result). (This will update the value of destination).
		*/
		static watchFunction(func, destination: Variable): Function {
			var cbcalled = false;
			var cb = function (newvalue) {
				cbcalled = true;
				destination.debug("Received new value: " + newvalue)
				destination.set(LangUtils.toValue(newvalue));
				destination.debugOut();
			}

			var f = function () {
				destination.debugIn("Recalculating..");

				try {
					cbcalled = false;

					//var scope: Scope = Scope.getCurrentScope(); //TODO: maybe just pass scopes around?
					var value = func.apply(cb, arguments);

					if (value !== undefined && cbcalled == false)
						cb(value);
				}
				catch (e) {
					cb(new ErrorValue(e));
				}
			};

			return f;
		}

		static withValues(args: IValue[], func): IValue {
			var realargs = args.map(LangUtils.dereference);
			var result = new Variable(ValueType.Any, undefined);
			//result.debugName("with-values-result" + result.noaid);
			var wrapped = LangUtils.watchFunction(func, result);

			var update = function () {
				wrapped.apply(null, realargs);
			};

			args.forEach((arg, index) => {
				result.uses(arg);
				if (arg.is(ValueType.PlainValue)) {
					(<IPlainValue>arg).get(null, (newvalue, _) => {
						realargs[index] = LangUtils.dereference(newvalue);
						update();
					}, false);
				}
			});

			update();

			return result;
		}
	}
}