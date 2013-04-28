///<reference path='../noa.ts'/>
module NOA {

	export class MappedList extends ListTransformation {
		basescope : Scope;
		func : any; //function or expession
		varname : string;
		/**
		 * Constructs a new list with all the mapped items in this list. If name is defined, the current value to which the filter is applied is available
		 * in func as this.variable(x), and it is available as the first argument
		 * @param  {[type]} name of the variable in the scope [description]
		 * @param  {[type]} func [description]
		 * @return {[type]}
		 */
		constructor(source: List, name: string, func: any /* Function or Expression */) {
			super(source);

			this.basescope = Scope.getCurrentScope();
			this.func = func;
			this.varname = name;

			this.source.replayInserts(this, this.onSourceInsert);

		}

		onSourceInsert (index : number, _, source) {
			var scope = Scope.newScope(this.basescope);
			scope.set(this.varname, source);

			var a;
			if (Util.isFunction(this.func))
				a = new Expression(this.func, scope)
			else if (this.func instanceof Expression)
				a = this.func;
			else
				throw "Map function should be JS function or expression"

			this.insert(index, a, source); //cells that are assigned an expression automatically listen
		}

		onSourceRemove(index: number, value) {
			this.remove(index);
		}

		onSourceMove(from : number, to : number) {
			this.move(from, to)
		}

	}
}