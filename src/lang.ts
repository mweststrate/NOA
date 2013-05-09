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

		static div(left: IValue, right: IValue): IValue {
			return new Expression((cb) => {
				var leftv, rightv;

				return (
					left.get(this, (newright, _) => {
						rightv = newright;
						cb(leftv / rightv);
					}, false)
				/
					left.get(this, (newleft, _) => {
						leftv = newleft;
						cb(leftv / rightv);
					}, false)
				);
			}); //TODO: .uses(left).uses(right);
		}

		static variable(varname: string): IValue {
			return null;
		}

		static let(expr: IValue, varname: string, stat: IValue): IValue {
			return null;
		}

		static sum(list: List) : IValue {
			//TODO: memoize
			return new ListSum(list);
		}

		static numbercount(list: List): IValue {
			//TODO: memoize
			return new ListNumberCount(list);
		}

		static avg(list: List, cb : (value: IValue) => void) : IValue {
			return (
				Lang.let(
					Lang.numbercount(list),
					"count",
					Lang.if_(
						Lang.eq(Lang.variable("count"), new Constant(0)),
						new Constant(0),
						Lang.div(
							Lang.sum(list),
							Lang.variable("count")
						)
					)
				)
			);
		}

	}
}