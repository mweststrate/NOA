///<reference path='../noa.ts'/>
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
			this.func.live(); //TODO: maybe live is not needed here at all?

			this.unlisten(source, ListEvent.SET.toString()); //TODO: if func is just a js func, onSet should also reeavaluate the func

			this.startup();
		}

		onSourceInsert (index : number, _) {
			//var scope = Scope.newScope(this.basescope);
			var source = this.source.cell(index);
			//scope.set(this.varname, source);

			console.log("inserting new item for " + source);

			this.insert(index, this.func.call(source));
		}

		onSourceRemove(index: number, value) {
			this.remove(index);
		}

		onSourceMove(from : number, to : number) {
			this.move(from, to)
		}

		toAST(): Object {
			return this.toASTHelper("map", "TODO:"); //TODO: function, use toString for real funcs
		}

		getScopeDependencies() : IScopeDependency[] {
			return this.source.getScopeDependencies().concat(this.func.getScopeDependencies());
		}

		free() {
			super.free();

			this.func.die();
		}
	}
}