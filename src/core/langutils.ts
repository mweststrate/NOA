///<reference path='../noa.ts'/>
module NOA {

	export interface IFunctionDefinition {
		name: string;
		documentation?: string;
		implementation?: Function;
		constr?: new (...args: IValue[])=> Expression;
		autoTrigger?: bool;
		memoize?: bool;
		argTypes?: ValueType[];
		resultType?: ValueType;
		initialArgs?: any[];
	}

	export class LangUtils {

		static define(d: IFunctionDefinition) {

			Util.assert(!!d.implementation ^ !!d.constr);
			if (d.autoTrigger)
				Util.assert(d.implementation);

			var f = function (...args: any[]) {
				var result: Expression;
				var realArgs: IValue[] = args.map(LangUtils.toValue);

				if (d.constr) {
					result = Util.applyConstructor(d.constr, realArgs);
					result.setName(d.name);
				}
				else if (d.autoTrigger) {
					result = new AutoTriggeredExpression(d.name, d.implementation, realArgs);
				}
				else {
					result = new Expression(realArgs);
					result.setName(d.name);

					//TODO: shouldn't watchfunction be the responsibility of Expression?
					//TODO: if one of the values is error, set result as error (in watch function?)
					var wrapper = LangUtils.watchFunction(d.implementation,	result);
					wrapper.apply(null, realArgs);
				}

				return result;
			}

			//declare
			NOA.Lang[d.name] = f;

			//declare on list / variable as convenience method..
			if (d.argTypes && d.argTypes[0] == ValueType.List) {
				Variable.prototype[d.name] = List.prototype[d.name] = function (...args: any) {
					return f.apply(NOA.Lang, [this].concat(args));
				}
			}

			if (Util.isArray(d.initialArgs))
				return f.apply(NOA.Lang, d.initialArgs);
		}

		static is(thing: IValue, type: ValueType): bool {
			return thing && thing.is && thing.is(type);
		}

		static canBe(thing: IValue, type: ValueType): bool {
			return thing instanceof Variable || LangUtils.is(thing, type);
		}

		static toValue(value: any): IValue {
			if (Util.isPrimitive(value))
				return new Constant(value);
			else if (Util.isFunction(value))
				return new Fun(value);
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

			var f = function (...args: IValue[]) {
				//destination.debugIn("Recalculating..");

				var errArg; //TODO: auto propate errors
				/*if (args.some(arg => {
						var res = LangUtils.is(arg, ValueType.Error);
						if (res)
							errArg = arg;
						return res;
				})) {
					cb(errArg);
				}*/
				if (false) {

				}
				else {
					//TODO: is try catch really needed? how expencive is this? might reduce performance. Maybe explicit catch case?
					try {
						cbcalled = false;

						//var scope: Scope = Scope.getCurrentScope(); //TODO: maybe just pass scopes around?
						var value = func.apply(cb, args);

						if (value !== undefined && cbcalled == false)
							cb(value);
					}
					catch (e) {
						cb(new ErrorValue(e));
					}
				}
			};

			return f;
		}


	}

	export class AutoTriggeredExpression extends Expression {
		constructor(name: string, func: Function, argsToWatch: IValue[]) {
			super(argsToWatch);
			this.setName(name);

			var currentArgs = argsToWatch.map(arg => arg.value());

			//result.debugName("with-values-result" + result.noaid);
			var wrapped = LangUtils.watchFunction(func, this);

			var update = function () {
				//Util.debug(result, "updating for changed arguments", JSON.stringify(realargs));
				wrapped.apply(null, currentArgs);
			};

			argsToWatch.forEach((arg, index) => {
				//this.uses(arg);
				//if (arg.is(ValueType.PlainValue)) { //TODO: should be asserted
				if (arg instanceof Variable) {
					(<Variable>arg).get(<Base>{}, (newvalue: IValue, _) => { //TODO: scope? //TODO: seems not to be triggered yet..
						currentArgs[index] = newvalue && newvalue.value ? newvalue.value() : newvalue;//TODO: does change evaluate its argument
						update();
					}, false);
				}
			});

			update();
		}
	}
}