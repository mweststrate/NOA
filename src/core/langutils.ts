///<reference path='../noa.ts'/>
module NOA {

	export class LangUtils {

		static is(thing: IValue, type: ValueType): bool {
			return thing && thing.is && thing.is(type);
		}

		static canBe(thing: IValue, type: ValueType): bool {
			return thing instanceof Variable || LangUtils.is(thing, type);
		}

		static toValue(value: any): IValue {
			if (Util.isPrimitive(value))
				return new Constant(value);
			if (!(value instanceof Base))
				throw new Error("Unable to convert value to NOA.IValue: " + value);

			return <IValue> value;
		}

		/**
			Converts any value to the value it is ultimatily representing.
			Variables, Constants and PlainValues return their actual contents (recursively).

			Other values will be returned directly
		*/
		static dereferencex(v: any): any { //TODO: better name?
			if (v === null || v === undefined)
				return v;
			if (Util.isPrimitive(v))
				return v;
			return v.dereference();
		}

		static followHelper(dest: IValue, source: IValue, follow: bool) {

			Util.assert(source != null && dest != null);
			//(<Base><any>dest).debug((follow ? "Following " : "Unfollowing") + source);

			//MWE: mweh implementation
			var listenList   = LangUtils.canBe(dest, ValueType.List)   && LangUtils.canBe(source, ValueType.List);
			var listenRecord = LangUtils.canBe(dest, ValueType.Record) && LangUtils.canBe(source, ValueType.Record);
			var listenPlain  = LangUtils.canBe(dest, ValueType.Primitive)  && LangUtils.canBe(source, ValueType.Primitive);

			if (!(listenList || listenPlain || listenRecord))
				throw new Error("Follow not supported for " + source + " and " + dest);

			if (listenPlain)
				for(var key in PlainValueEvent)
					LangUtils.followEvent(source, PlainValueEvent[key], dest, follow);

			if (listenList)
				for(var key in ListEvent)
					LangUtils.followEvent(source, ListEvent[key], dest, follow);

			if (listenRecord)
				for(var key in RecordEvent)
					LangUtils.followEvent(source, RecordEvent[key], dest, follow);


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

		//TODO: swap dest / source arguments, this is weird
		static followEvent(source: IBase, event: string, dest: IBase, follow: bool) {
			if (follow) {
				dest.listen(source, event, function(...args: any[]) {
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

		static define(impl: (...args: IValue[]) => any, name: string, argtypes: ValueType[], resultType: ValueType, memoize: bool = false): Function;
		static define(exprConstructor: new (...args: IValue[]) => Expression, name: string);
		static define(...defineargs: any[]) {
			//TODO: if type of first argument is List, then add this function on List.prototype as well
			var func = defineargs[0];
			var name = defineargs[1];
			Util.assert(Util.isFunction(func));
			Util.assert(Util.isString(name));


			return NOA.Lang[name] = function (...args: any[]) {
				var result: Expression;
				var realArgs : IValue[] = args.map(LangUtils.toValue);

				if (defineargs.length == 2) {
					var constr = <new (...args: IValue[]) => Expression> func;
					result = Util.applyConstructor(constr, realArgs);
					result.setName(name);
				}
				else {
					result = new Expression(realArgs);
					result.setName(name);

					//TODO: shouldn't watchfunction be the responsibility of Expression?
					//TODO: if one of the values is error, set result as error (in watch function?)
					var wrapper = LangUtils.watchFunction(func, result);
					wrapper.apply(null, realArgs);
				}

				return result;
			}
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
			Util.assert(Util.isFunction(func));
			Util.assert(destination instanceof Variable);

			var cbcalled = false;
			var cb = function (newvalue) {
				cbcalled = true;
				//destination.debug("Received new value: " + newvalue)
				destination.set(LangUtils.toValue(newvalue));
				//destination.debugOut();
			}

			var f = function () {
				//destination.debugIn("Recalculating..");

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
			var realargs = args.map(arg => arg.value());
			var result = new Variable();
			//result.debugName("with-values-result" + result.noaid);
			var wrapped = LangUtils.watchFunction(func, result);

			var update = function () {
				//Util.debug(result, "updating for changed arguments", JSON.stringify(realargs));
				wrapped.apply(null, realargs);
			};

			args.forEach((arg, index) => {
				result.uses(arg);
				//if (arg.is(ValueType.PlainValue)) { //TODO: should be asserted
					(<IPlainValue>arg).get(<Base>{}, (newvalue, _) => { //TODO: scope? //TODO: seems not to be triggered yet..
						realargs[index] = newvalue;
						update();
					}, false);
				//}
			});

//			Util.debug(result, "listening to", args.map(arg => arg.toString()).join(", "));

			update();

			return result;
		}
	}
}