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

			this.startup();
		}

		onSourceInsert (index : number, _) {
			var scope = Scope.newScope(this.basescope);
			scope.set(this.varname, this.source.cell(index));

			if (this.func instanceof Base) { //Poor way expression check
				LangUtils.clone(this.func, (clone : IValue) => {
					this.insert(index, Lang.let(
						this.source.cell(index),
						this.varname,
						clone
					));
				});
			}
			else if (Util.isFunction(this.func)) {
				this.insert(index, Lang.let(
					this.source.cell(index),
					this.varname,
					Lang.evalJSExpression(LangUtils.toValue( + this.func))
				));
			}
			//TODO: support string and parse

			/* TODO:
			if (Util.isFunction(this.func))
				a = new Expression(this.func, scope)
			else if (this.func instanceof Expression)
				a = this.func;
			else
			*/
			throw "Map function should be JS function or expression"

		}

		onSourceRemove(index: number, value) {
			this.remove(index);
		}

		onSourceMove(from : number, to : number) {
			this.move(from, to)
		}

		toAST(): Object {
			return this.toASTHelper("map", this.varname); //TODO: function, use toString for real funcs
		}

	}
}