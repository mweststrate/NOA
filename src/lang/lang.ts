///<reference path='../noa.ts'/>
module NOA {
	//TODO: move classes to own files

	export class Lang {

		//TODO: should be global scope to share this general available items in, such as None, Hour etc...
		static None(): Constant {
			Lang.None = function () { //TODO: reuse same instance? note live / die
				return new Constant(undefined);
			}
			return Lang.None();
		}

		static fun(fun: Function) : Fun;
		static fun(...args: IValue[]) : Fun;
		static fun(...args: any[]): Fun {
			//TODO: Lang.functions should be passable as first class functions as well!
			if (args.length == 1 && Util.isFunction(args[0]))
				return new Fun(<Function> args[0]);
			return Util.applyConstructor(Fun, args.map(LangUtils.toValue));
		}

		static let(varname: any, expression: IValue, statement: IValue) {
			return new Let(
				LangUtils.toValue(varname),
				LangUtils.toValue(expression),
				LangUtils.toValue(statement)
			);
		}

		static get (varname): IValue {
			return new Get(LangUtils.toValue(varname));
		}

		static call(...args: IValue[]) : IValue {
			Util.assert(args.length > 0, "Call expects at least one argument, the function");

			var realargs = args.map(LangUtils.toValue);

			//TODO: Optimization: if the function itself will never change, there is no need to wrap an additional call expression.
			//if (realargs[0] instanceof Fun)
			//	return (<Fun>realargs[0]).call.apply(realargs[0], realargs.slice(1));

			return new Call(realargs[0], realargs.slice(1));
		}

		//TODO: make reusable binop
		static mul(left, right): IValue {
			return LangUtils.define({
				name: "mul",
				autoTrigger: true,
				implementation : function (l, r) {
					return l * r;
				},
				initialArgs : [left, right]
			});
		}

		static substract(left, right): IValue {
			return LangUtils.define({
				name: "substract",
				autoTrigger: true,
				implementation: function (l, r) {
					return l - r;
				},
				initialArgs: [left, right]
			});
		}

		static if_(condition: any, truthy: any, falsy: any): IValue {
			return LangUtils.define({
				name: "if_",
				autoTrigger: false,
				constr: IfThenElse,
				initialArgs: [condition, truthy, falsy]
			});

		}

		static eq(left, right): IValue {
			return LangUtils.define({
				name: "eq",
				autoTrigger: true,
				implementation : function (l, r) {
					if (l instanceof Base && r instanceof Base)
						return (<Base>l).noaid == (<Base>r).noaid;
					return l == r;
				},
				initialArgs : [left, right]
			});
		}

		static not(expr): IValue {
			return LangUtils.define({
				name: "not",
				autoTrigger: true,
				implementation : function (e) {
					return !e;
				},
				initialArgs : [expr]
			});
		}

		static list(...vals: IValue[]): List {
			return null;
		}
/*
		static powerset(list: List): IValue {
			return list.map(Lang.fun("x",
				list.map(Lang.fun("y",
					Lang.list(
						Lang.variable("x"),
						Lang.variable("y")
					)
				))
			));
		}
*/

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
			return LangUtils.define({
				constr: ListSum,
				name: "sum",
				initialArgs : [list]

			});
		}

		static map(list: IList, fun: Fun) {
			return Util.notImplemented();
		}

		static filter(list: IList, fun: Fun): IValue {
			return Util.notImplemented();
		}


		static join(list: IList): IValue {
			return Util.notImplemented();
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
				ValueType.Number,
				function(cb, list: Variable){
					return Lang.let(
						"count",
						Lang.numbercount(list),
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
					"count",
					Lang.numbercount(list),
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