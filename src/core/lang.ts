///<reference path='../noa.ts'/>
module NOA {
	export class Lang {

		static None(): Constant {
			Lang.None = function () {
				return new Constant(undefined);
			}
			return Lang.None();
		}

		static fun(fun : Function) :Fun ;
		static fun(argnames : String[], stats: IValue) : Fun;
		static fun(argnames : any, stats?: IValue) : Fun {
			return new Fun(argnames, stats);
		}

		//TODO: swap varname and expr
		static let(expr: IValue, varname: any, stats: IValue) {
			Util.assert(Util.isString(varname) || LangUtils.is(varname, ValueType.String));

			var expr = LangUtils.toValue(expr);
			var stats = LangUtils.toValue(stats);

			//TODO: prevent varname from changing!
			var realname =  Util.isString(varname) ? varname : (<any>varname).value();
			var res = new Expression([<IValue>expr, LangUtils.toValue(varname), <IValue>stats]);
			res.setName("let");

			var scopeDependencies = [];
			var used = false;

			if (expr instanceof Expression)
				expr.getScopeDependencies().forEach(dep => scopeDependencies.push(dep));
			if (stats instanceof Expression) {
				stats.getScopeDependencies().forEach(dep => {
					if (dep.name === realname) {
						Util.debug("Claiming " + dep.value + " as " + realname + ", assigning: " + expr);
						used = true;
						dep.value.set(expr);
						dep.claimed = true;
					}
					else
						scopeDependencies.push(dep);
				});
			}

			if (!used)
				Util.warn("Unused variable '" + realname + "'");

			res.scopeDependencies = scopeDependencies;
			res.set(stats);

			return res;
		}

		static get (varname): IValue {
			Util.assert(Util.isString(varname) || LangUtils.is(varname, ValueType.String));

			//TODO: prevent varname from changing, or, act accordingly!
			var realname =  Util.isString(varname) ? varname : (<any>varname).value();
			var res = new Expression([LangUtils.toValue(varname)]);
			res.setName("get");

			var dep = {
				name : realname,
				value: new Variable(),
				claimed: false
			};

			dep.value.live();
			res.addScopeDependency(dep);
			res.onFree(null, () => dep.value.die());

			//check if anybody claims this var
			setTimeout(() => {
				if (!dep.claimed)
					res.set(new ErrorValue("Undefined variable '" + realname + "'"));
			}, 1);

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
			return LangUtils.define(ListSum, "sum");//(list);
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