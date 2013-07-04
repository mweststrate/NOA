///<reference path='../noa.ts'/>
module NOA {
	export class Lang {

		//TODO: should be global scope to share this general available items in, such as None, Hour etc...
		static None(): Constant {
			Lang.None = function () { //TODO: reuse same instance? note live / die
				return new Constant(undefined);
			}
			return Lang.None();
		}

		static fun(fun : Function) :Fun ;
		static fun(argnames : string[], stats: IValue) : Fun;
		static fun(argnames : any, stats?: IValue) : Fun {
			return new Fun(argnames, stats);
		}

		static let(varname: any, expression: IValue, statement: IValue) {
			//TODO: allow a list of varnames and expressions, that saves a lot of let wraps for funcdtions and such! Big optimization
			Util.assert(Util.isString(varname) || LangUtils.is(varname, ValueType.String));

			var expr = LangUtils.toValue(expression);
			var stat = LangUtils.toValue(statement);

			//TODO: prevent varname from changing!
			var realname =  Util.isString(varname) ? varname : (<any>varname).value();
			var res = new Expression([<IValue>expr, LangUtils.toValue(varname), <IValue>stat]);
			res.setName("let");
			//OPtimize: we could just return statement instead of expression, after removing the matching dependencies. However that makes it quite unclear where the
			//dependencies are gone (unless claimed dependencies are not propagated further?) and it makes it a bit magic where dependencies are solved
			//however, it saves a level of wrapping
			var scopeDependencies = [];
			var used = false;

			expr.getScopeDependencies().forEach(dep => scopeDependencies.push(dep));
			stat.getScopeDependencies().forEach(dep => {
				if (dep.name === realname) {
					Util.debug(dep.value.toString() + " LET " + realname + " => " + expr.value());
					used = true;
					dep.value.set(expr);
					dep.claimed = true;
				}
				else
					scopeDependencies.push(dep);
			});

			if (!used)
				Util.warn("Unused variable '" + realname + "'");

			res.scopeDependencies = scopeDependencies;
			res.set(stat);
			/*res.toGraph = function () {
				return {
					let: realname,
					value: expr.toGraph(),
					body: stat.toGraph()
				}
			}*/

			return res;
		}

		static get (varname): IValue {
			Util.assert(Util.isString(varname) || LangUtils.is(varname, ValueType.String));

			//TODO: prevent varname from changing, or, act accordingly!
			var realname =  Util.isString(varname) ? varname : (<any>varname).value();
			var res = new Expression([LangUtils.toValue(varname)]);
			res.setName("get");

			res.set(new ErrorValue("Undefined variable '" + realname + "'"));

			var dep = {
				name : realname,
				value: res,
				claimed: false
			};

			res.addScopeDependency(dep);
			res.toGraph = function () {
				return {
					get: realname,
					value: this.fvalue.toGraph()
				}
			}
			return res;
		}

		static call(...args: IValue[]) : IValue {
			if (args.length < 1)
				res.set(new ErrorValue("Call expects at least one argument, the function"));

			//Optimize: if the function itself will never change, there is no need to wrap an additional call expression.
			if (args[0] instanceof Fun)
				return (<Fun>args[0]).call.apply(args[0],args.slice(1));

			var realargs = args.map(LangUtils.toValue);
			var res = new Expression(realargs);
			res.setName("call");

			var first = realargs[0];
			if (!LangUtils.canBe(first,ValueType.Function))
				res.set(new ErrorValue("First argument of call should be a function, found: " + first.value()));

			function applyFun(fun) {
				if (fun && fun.is(ValueType.Error))
					res.set(fun);
				else if (fun && fun.is(ValueType.Function))
					res.set(fun.call.apply(fun, realargs.slice(1)));
				else
					res.set(new ErrorValue("Call expected function found " + (fun && fun.value ? fun.value() : fun)));

			}

			if (first instanceof Fun)
				applyFun(first);
			else if (first instanceof Variable)
				(<Variable>first).get(res, applyFun, true);
			else
				throw new Error("IllegalState");

			return res;
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
				[ValueType.Number, ValueType.Number],
				ValueType.Number
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
				[],
//				[null, null], //Null means any?
				ValueType.Bool,
				false
			)(left, right);
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
			return LangUtils.define(ListSum, "sum");//([list]); //eeh why not just return listsum?
		}

		static map(list: IList, fun: Fun): IValue {
			return new MappedList(list, fun);
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