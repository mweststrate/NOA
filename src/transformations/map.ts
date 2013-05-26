///<reference path='../noa.ts'/>
module NOA {

	export class MappedList extends ListTransformation {
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

			this.func = func;
			if (this.func instanceof Base)
				this.func.live();

			this.varname = name;

			this.startup();
		}

		onSourceInsert (index : number, _) {
			//var scope = Scope.newScope(this.basescope);
			var source = this.source.cell(index);
			//scope.set(this.varname, source);

			console.log("inserting new item!");

			if (this.func instanceof Base) { //Poor way expression check
				console.dir(this.func.toAST());

				LangUtils.clone(this.func, (clone: IValue) => {

					console.info("MAP inserting expression clone: ");
					console.dir(clone);

					this.insert(index, Lang.let(
						source,
						this.varname,
						clone
					));
				});
			}
			else if (Util.isFunction(this.func)) {
				this.insert(index, Lang.let(
					source,
					this.varname,
					LangUtils.withValues([source], this.func)
				));
			}
			//TODO: support string and parse

			else
				throw new Error("Map function should be JS function or expression");

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

		free() {
			super.free();

			if(this.func instanceof Base)
				this.func.die();
		}
	}
}