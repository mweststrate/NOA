///<reference path='noa.ts'/>
module NOA {
	export class Lang {

		static if_(cond: IValue, iftrue: IValue, iffalse: IValue): IValue {
			//TODO: make sure iftrue/ iffalse evaluate lazy..
			return null;
		}

		static eq(left: IValue, right: IValue):IValue {
			return null;
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

		static div(left: ValueContainer, right: ValueContainer): IValue {
			return <IValue> <any> /*TODO: return ValueContainer*/ new Expression((cb) => {
				return (
					left.get(this, (newleft, _) => {
						cb(newleft / right.get());
					}, false)
				/
					right.get(this, (newright, _) => {
						cb(left.get() / newright);
					}, false)
				);
			}).uses(left).uses(right);
		}

		static variable(varname: string): IValue {
			return null;
		}

		static let(expr: IValue, varname: string, stat: IValue): IValue {
			return null;
		}

		static sum(list: List) : ValueContainer {
			//TODO: memoize
			return new ListSum(list);
		}

		static numbercount(list: List): ValueContainer {
			//TODO: memoize
			return new ListNumberCount(list);
		}

		static avg(list: List/*TODO: ListVariable*/, cb : (value: IValue) => void) : IValue {
			return <IValue><any> (<Base><any>(
				Lang.let(
					Lang.numbercount(list),
					"count",
					Lang.if_(
						Lang.eq(Lang.variable("count"), new Constant(0)),
						new Constant(0),
						Lang.div(
							Lang.sum(list),
							<ValueContainer> Lang.variable("count") //TODO: make cast-or-default functions
						)
					)
				)
			)).uses(list);
		}

		public static declare_/*<T extends IVariable>*/(name: String, argtypes: any[], func: (...args: any[]) => Variable /* T */, memoize: bool) {
			//declare the thing
			//check input arguments on errors
			//check input argument on types
			//evaluate
			//setup AST
		}

	}
}