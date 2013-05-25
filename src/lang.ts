///<reference path='noa.ts'/>
module NOA {
	export class Lang {

		static SCOPE = {};

		static let(expr : IValue, varname : any, stats: IValue) {
			//TODO: note that varname is in scope of expr as well! thats dangerous...
			//TODO: swap expr, varname to make that clear
			//TODO: let the arguments live or use define
			varname = LangUtils.toValue(varname); //varname can either be string or constant
			Util.assert(varname && LangUtils.is(varname, ValueType.PlainValue));

			//TODO: note that varname is not allowed to change
			var realname = (<any>varname).get();
			Util.assert(Util.isString(realname));

			var v = Lang.SCOPE[realname];
			if (v) {
				delete Lang.SCOPE[realname]; //claim it!

				Util.debug("Claiming " + v + " as " + realname + ", assigning: " + expr);

				v.set(expr);
			}
			else
				Util.warn("Unused variable '" + realname + "'");

			//TODO: check if in scope, if not, warn about never used
			//var scope = Scope.getCurrentScope(); //todo new scope
			//scope.set(realname, expr);
			//TODO: claim this variable and remove it fromm the scope object
			//Scope.pushScope(Scope.newScope(Scope.getCurrentScope())); //when to pop?!

			return stats;

/*			var scope = Scope.pushScope(Scope.newScope(Scope.getCurrentScope()))
			try {
				scope.set(realname, expr);
				return stats;
			} finally {
				Scope.popScope();
			}
*/
			/*return LangUtils.define(
				"eq",
				[ValueType.Any, ValueType.PlainValue, ValueType.Any],
				ValueType.Any,
				function(expr : IValue, varname : IPlainValue, stats: IValue) {
					Util.assert(varname && LangUtils.is(varname, ValueType.PlainValue));

					var realname = varname.get();
					Util.assert(Util.isString(realname));

				} ,
				false
			)(expr, varname, stats);*/

//			var v = Scope.getCurrentScope().get((<any>LangUtils.toValue(varname)));
//			(<any>v).set(expr);
//			return stats;
		}

		static get(varname): IValue {
			//TODO: let the arguments live or use define
			//TODO: varname is a variable

			var v = Lang.SCOPE[varname];
			if (!v) {
				//create the variable, so that a 'let' can claim it
				v = Lang.SCOPE[varname] = new Variable(ValueType.Any, undefined);
				//check if anybody claims this var
				setTimeout(() => {
					if (v == Lang.SCOPE[varname])
						v.set(new ErrorValue("Undefined variable '" + varname +"'"));
					}, 1);
			}

			Util.debug("Resolved " + varname + " to " + v);

			return v;

//			var v = new Variable(ValueType.Any, undefined);
//			var scope = Scope.pushScope(Scope.newScope(Scope.getCurrentScope()))
//			scope.set(varname, v);

//			return v;

			//Variable r = new Variable(ValueType, v);

			//var v = Scope.getCurrentScope().get((<any>LangUtils.toValue(varname)).get());
			//TODO: if not claimed after timeout, no one will define it, set error!
			//return v;
			/*
			return LangUtils.define(
				"get",
				[ValueType.PlainValue],
				ValueType.Any,
				function(varname: IValue) {
					return LangUtils.withValues([varname], function (name) {
					});
				}
			)(varname);
*/
		}

		static mul(left, right): IValue {
			return LangUtils.define(
				"mul",
				[ValueType.PlainValue, ValueType.PlainValue],
				ValueType.Any,
				function (l : IValue, r: IValue) {
					return LangUtils.withValues([l,r], function (l,r) {
						return l * r;
					});
				}
			)(left, right);
		}

		static if_(cond: any, iftrue: any, iffalse: any): IValue {
			//TODO: make sure iftrue/ iffalse evaluate lazy..
			return null;
		}

		static eq(left: any, right: any):IValue { //TODO: variable //TODO can cb be declared as type?
			return LangUtils.define(
				"eq",
				[ValueType.Any, ValueType.Any],
				ValueType.PlainValue, //bool
				(l: IValue, r: IValue) => {
					//TODO:
				} ,
				false
			)(left, right);
		}

		static list(...vals: IValue[]): List {
			return null;
		}

		static powerset(list: List): IValue {
			return list.map("x",
				list.map("y",
					Lang.list(
						Lang.variable("x"),
						Lang.variable("y")
					)
				)
			);
		}


		static div(left: IValue, right: IValue): IValue {
			return null;
			/*
			return new Expression((cb) => {
				return (
					left.get(this, (newleft, _) => {
						cb(newleft / right.get());
					}, false)
				/
					right.get(this, (newright, _) => {
						cb(left.get() / newright);
					}, false)
				);
			}).uses(left).uses(right);*/
		}

		static variable(varname: string): IValue {
			return null;
		}

		static sum(list: IList) : IValue {
			//TODO: memoize
			return new ListSum(list);
		}

		static numbercount(list: IList): IValue {
			//TODO: memoize
			return new ListNumberCount(list);
		}

		//TODO: copy

		//TODO: next / prev
		static avg() {
			Lang.declare_(
				"avg",
				[ValueType.List, ValueType.List],
				ValueType.PlainValue,
				function(cb, list: Variable){
					return Lang.let(
						Lang.numbercount(list),
						"count",
						Lang.if_(
							Lang.eq(Lang.variable("count"), 0),//new Constant(0)),
							0, //new Constant(0),
							Lang.div(
								Lang.sum(list),
								Lang.variable("count") //TODO: make cast-or-default functions
							)
						)
					)
				},
				true
			);
		}


		static avgOLD(list: List/*TODO: ListVariable*/, cb : (value: IValue) => void) : IValue {
			return <IValue><any> (<Base><any>(
				Lang.let(
					Lang.numbercount(list),
					"count",
					Lang.if_(
						Lang.eq(Lang.variable("count"), 0), //new Constant(0)),
						0, //new Constant(0),
						Lang.div(
							Lang.sum(list),
							Lang.variable("count") //TODO: make cast-or-default functions
						)
					)
				)
			)).uses(list);
		}

		public static declare_/*<T extends IVariable>*/(name: String, argtypes: any[], restype: ValueType, func: (...args: any[]) => Variable /* T */, memoize: bool) {
			//declare the thing
			//check input arguments on errors
			//check input argument on types
			//evaluate
			//setup AST
		}

	}
}