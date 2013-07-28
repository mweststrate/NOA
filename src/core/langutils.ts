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

		//TODO: rename to declare
		static define(d: IFunctionDefinition) {

			Util.assert(!!d.implementation ^ !!d.constr);
			if (d.autoTrigger)
				Util.assert(d.implementation);

			var f = function (...args: any[]) {
				var result: Expression;
				var realArgs: IValue[] = args.map(LangUtils.toValue);

				//TODO: support Fun instances as well
				if (d.constr) {
					result = Util.applyConstructor(d.constr, realArgs);
					result.setName(d.name);
				}
				else
					result = new JavascriptExpression(d.name, d.implementation, realArgs, d.autoTrigger);

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

		//TODO: rename to "toNOA" or "fromJSON"
		//make synonym function "NOA" at toplevel (so that new List() == NOA([]))
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

		static startExpression(value: IValue, resolver: IResolver) {
			if (value instanceof Expression && !(<Expression>value).started)
				(<Expression>value).start(resolver);
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

		public static parseExpression(expression: string): IValue {
			var extracted = Util.extractStringMap(expression, '__string__');
			var stringmap: Object  = extracted[1];
			var expression: string = extracted[0];

			var tokens = expression.split(/\b|(?=\W)(?!\s)/); //split on word boundaries, on each char within a non-word, but not for each char in whitespace..
			var pos = 0;

			function consume(): string {
				if (pos < tokens.length && tokens[pos].trim() === "") //consume whitespace
					pos++;
				return pos < tokens.length ? tokens[pos++].trim() : null;
			}

			function unconsume(): any {
				pos--;
				if (tokens[pos].trim() === "") //unconsume whitespace
					pos--;
				return null;
			}

			function parseTerm(term: String): bool {
				return consume() == term ? true : !!unconsume();
			}

			function parseIdentifier(): string {
				var m = consume().match(/^[a-z_]\w*$/i);
				return m ? m[0] : unconsume();
			}

			function parsePrimitive() : Constant {
				var res, token = consume();

				if (token.indexOf("__string__") == 0)
					res = new Constant(stringmap[token]);
				else if (Util.isBoolLike(token))
					res = new Constant(Util.toBool(token));
				else if (Util.isNumberLike(token))
					res = new Constant(Util.toNumber(token));

				return res || unconsume();
			}

			function parseParen(): IValue {
				if (!parseTerm("("))
					return null;
				var res = parse();
				if (!parseTerm(")")) {
					pos++;
					throw "Expected ')' to close parentheses";
				}
				return res;
			}

			function parseFuncall(): IValue {
				var name = parseIdentifier();
				if (!name)
					return null;
				if (!parseTerm("("))
					return unconsume(); //unparse identifier

				var args:IValue[] = [];
				if (!parseTerm(")")) {
					do {
						args.push(parse());
					} while (parseTerm(","))
					if (!parseTerm(")")) {
						pos++;
						throw "Expected ')' to end function call";
					}
				}

				if (!Lang[name]) 
					return NOA.Lang.call.apply(null, [NOA.Lang.get(name)].concat(args));
				return NOA.Lang[name].apply(null, args);
			}

			function parseGet(): IValue {
				var name;
				return !!(name = parseIdentifier()) ? Lang.get(name) : null;
			}

			function parse(): IValue {
				var res = parseParen() || parsePrimitive() || parseFuncall() || parseGet();
				if (res)
					return res;
				throw "Expected expression";
			}

			try {
				var res = parse();
				if (pos < tokens.length)
					throw "Found superfluous input";
				return res;
			}
			catch (e) {
				throw e + ": " + tokens.slice(0, pos).join("") + " -->>" + (tokens[pos]||"(end of input)") + "<<-- " + tokens.slice(pos + 1).join("");
			}
		}

	}
}