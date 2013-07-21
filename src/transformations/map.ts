///<reference path='../noa.ts'/>

//return new MappedList(list, fun);
NOA.LangUtils.define({
	name: "map",
	argTypes: [NOA.ValueType.List, NOA.ValueType.Function],
	implementation: function(list: NOA.IValue, fun: NOA.IValue) {
		return new NOA.MappedList(<NOA.IList>list, <NOA.Fun>fun);
	}
	//TODO: can be memoized íf function has no unresolved scope dependencies
});
/*
var rlist = <IList> LangUtils.toValue(list);
var rfun = <Fun> LangUtils.toValue(fun);

var res = new Expression([rlist, rfun]);
res.setName("map");
res.set(new MappedList(rlist, rfun));
return res;
*/
//return LangUtils.define(MappedList, "map");//([list, fun]);



module NOA {


	export class MappedList extends ListTransformation {
		func : Fun; //function or expession
		/**
		 * Constructs a new list with all the mapped items in this list. If name is defined, the current value to which the filter is applied is available
		 * in func as this.variable(x), and it is available as the first argument
		 * @param  {[type]} name of the variable in the scope [description]
		 * @param  {[type]} func [description]
		 * @return {[type]}
		 */
		constructor(source: IList, func: Fun);
		constructor(source: IList, func: Function);
		constructor(source: IList, func: any) {
			super(source);

			this.func = Util.isFunction(func) ? NOA.Lang.fun(func) : func;
			Util.assert(LangUtils.canBe(this.func, ValueType.Function));
			this.func.live(); //TODO: maybe live is not needed here at all?

			this.unlisten(source, ListEvent.SET.toString()); //TODO: if func is just a js func, onSet should also reeavaluate the func

			this.startup();
		}

		onSourceInsert (index : number, _) {
			//var scope = Scope.newScope(this.basescope);
			var source = this.source.cell(index);
			//scope.set(this.varname, source);

//			console.log("inserting new item for " + source);

			this.insert(index, (<Call>Lang.call(this.func, source)).start(null)); //Lang.call, allows func to chaneg in the future :)
		}

		onSourceRemove(index: number, value) {
			this.remove(index);
		}

		onSourceMove(from : number, to : number) {
			this.move(from, to)
		}

		toAST(): Object {
			return this.toASTHelper("map", this.source, this.func);
		}

		toGraph() {
			var res = super.toGraph();
			res.func = this.func.toGraph();
			return res;
		}

		free() {
			super.free();

			this.func.die();
		}
	}
}