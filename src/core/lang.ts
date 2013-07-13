///<reference path='../noa.ts'/>
module NOA {

	export class Let  extends Expression {

		realvarname: string;

		constructor(varname: IValue, private expr: IValue, private stat: IValue) {
			super([]);
			this.initArg(varname, true);
			this.initArg(expr, true);
			this.initArg(stat, false);
			this.setName("let");

			Util.assert(varname instanceof Constant);
			Util.assert(LangUtils.is(varname, ValueType.String));

			this.realvarname = varname.value();
			console.info("LET " + this.realvarname + ": " + expr.value());

			stat.setResolver({
				resolve: (name: string, target: Variable): bool => {
					if (name == this.realvarname) {
						console.info("LET UPDATE " + target.toString() + " => " + this.expr.value());
						target.set(this.expr);
						return true;
					}
					else
						return this.resolve(name, target);
				}
			});
			this.set(stat);
		}
	}

	export class Call extends Expression {

		constructor(private funvar: Variable, private params: IValue[]) {
			super((<IValue[]>[funvar]).concat(params));
			this.setName("call");

			Util.assert(funvar instanceof Variable && LangUtils.canBe(funvar, ValueType.Function));

			funvar.get(this, this.applyFun, true);
		}

		applyFun(fun) {
			if (fun && fun instanceof Base && fun.is(ValueType.Error))
				this.set(fun);
			else if (fun instanceof Fun)
				this.set(fun.call.apply(fun, this.params));
			else
				this.set(new ErrorValue("Call expected function found " + (fun && fun.value ? fun.value() : fun)));
		}
	}

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
		static fun(...args: any[]) : Fun {
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
			Util.assert(Util.isString(varname) || (LangUtils.is(varname, ValueType.String) && varname instanceof Constant));

			var realname =  Util.isString(varname) ? varname : (<IValue>varname).value();
			var res = new Expression([LangUtils.toValue(varname)]);
			res.setName("get");

			res.set(new ErrorValue("Undefined variable '" + realname + "'"));
			res.resolve(realname, res);

			return res;
		}

		static call(...args: IValue[]) : IValue {
			Util.assert(args.length > 0, "Call expects at least one argument, the function");

			var realargs = args.map(LangUtils.toValue);

			//Optimization: if the function itself will never change, there is no need to wrap an additional call expression.
			if (realargs[0] instanceof Fun)
				return (<Fun>realargs[0]).call.apply(realargs[0], realargs.slice(1));

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
			var cond = LangUtils.toValue(condition);
			var iftrue = LangUtils.toValue(truthy);
			var iffalse = LangUtils.toValue(falsy);

			var res = new Expression([cond, iftrue, iffalse]);
			res.setName("if_");

			var applyCond = function(value) {
				if (value instanceof Base && value.is(ValueType.Error))
					res.set(value);
				else
					res.set(!!value ? iftrue : iffalse);
			}

			if (cond instanceof Variable)
				(<Variable>cond).get(res, applyCond, true);
			else
				applyCond(!!cond.value());

			return res;
		}

		static eq(left: any, right: any):IValue { //TODO: variable //TODO can cb be declared as type?
			/*		return LangUtils.define(
						(l: IValue, r: IValue) => {
							//TODO:
						},
						"eq",
						[],
		//				[null, null], //Null means any?
						ValueType.Bool,
						false
					)(left, right);*/
			return null;
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
			//TODO: memoize
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
			//return new MappedList(list, fun);
			var rlist = <IList> LangUtils.toValue(list);
			var rfun = <Fun> LangUtils.toValue(fun);

			var res = new Expression([rlist, rfun]);


			res.setName("filter");
			res.set(new FilteredList(rlist, rfun));

			//rlist.die(); rfun.die(); //will receive a 'live' from map as well! //MWE askward, TODO: improve

			return res;
			//return LangUtils.define(MappedList, "map");//([list, fun]);
		}


		static join(list: IList): IValue {
			return new JoinedList(list);
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