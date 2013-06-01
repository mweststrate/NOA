///<reference path='../noa.ts'/>
module NOA {
	export class Lang {

		static SCOPE = {};

		//TODO: swap varname and expr
		static let(expr: IValue, varname: any, stats: IValue) {
			return LangUtils.define(
				function (expr: IValue, varname: IValue, stats: IValue) {
					//TODO: note that varname is in scope of expr as well! thats dangerous...
					//TODO: swap expr, varname to make that clear
					//TODO: let the arguments live or use define
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

					return stats;
				},
				"let"
			)(expr, varname, stats);
		}

		static get (varname): IValue {
			return LangUtils.define(
				function (varname: IValue) {
					//TODO: varname is a variable
					Util.assert(varname && LangUtils.is(varname, ValueType.PlainValue));

					//TODO: note that varname is not allowed to change
					var realname = (<any>varname).get();
					Util.assert(Util.isString(realname));

					var v : Variable = Lang.SCOPE[realname];
					if (!v) {
						//create the variable, so that a 'let' can claim it
						v = Lang.SCOPE[realname] = new Variable(ValueType.Any, undefined);

						//check if anybody claims this var
						setTimeout(() => {
							if (v == Lang.SCOPE[realname])
								v.set(new ErrorValue("Undefined variable '" + varname + "'"));
						}, 1);

						//make sure this var is removed from scope if no longer used!
						//mwe: hmm, doesn't that identify scopes are mixed?! TODO:!!
						v.onFree(null, () => {
							if (v == Lang.SCOPE[realname])
								delete Lang.SCOPE[realname];
						});
					}

					Util.debug("Resolved " + varname + " to " + v);

					return v;
				},
				"get"
			)(varname);
		}

		static mul(left, right): IValue {
			return LangUtils.define(
				function (l : IValue, r: IValue) {
					return LangUtils.withValues([l, r], function (l, r) {
						//Util.debug("Mul: ", l, r, "-> ", l * r);
						return l * r;
					});
				}, 
				"mul",
				[ValueType.PlainValue, ValueType.PlainValue],
				ValueType.Any
			)(left, right);
		}

		static if_(cond: any, iftrue: any, iffalse: any): IValue {
			//TODO: make sure iftrue/ iffalse evaluate lazy..
			return null;
		}

		static eq(left: any, right: any):IValue { //TODO: variable //TODO can cb be declared as type?
			return LangUtils.define(
				(l: IValue, r: IValue) => {
					//TODO:
				},
				"eq",
				[ValueType.Any, ValueType.Any],
				ValueType.PlainValue, //bool
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