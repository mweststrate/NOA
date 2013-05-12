///<reference path='noa.ts'/>

module NOA {

	export enum ListEvent { INSERT, REMOVE, MOVE, SET, FREE }

	export class List extends CellContainer implements IValue, IList, IMutableList {

		static Aggregates = { count : "count", numbercount: "numbercount", sum : "sum", min: "min", max : "max", vag : "avg", first : "first", last : "last" };

		cells : Cell[] = [];
		aggregates = {};

		constructor() {
			super();
		}

		//TODO: define invariant class and verify it after each call if in debug mode.
		//Inherit invariant for internal mappings in for example filter and join.

		/** core functions */
		insert(index: number, value: ValueContainer): List;
		insert(index: number, value: any, origin: CellContainer): List;
		insert(index: number, value: any, origin?: CellContainer): List {
			this.debugIn("Insert at " + index + ": " + value);
			if (index < 0 || index > this.cells.length)
				throw new Error("Insert out of bounds: " + index + " not in 0.." + this.cells.length)


			var cell = new Cell(<CellContainer>this, index, <any> value, <CellContainer>origin); //Todo extract origin from value
			this.cells.splice(index, 0, cell);

			this._updateIndexes(index +1);
			this.fire(ListEvent.INSERT.toString(), index, cell.get(), cell);

			cell.onChange(this, (newvalue : any, oldvalue : any) : void => {
				this.fire(ListEvent.SET.toString(), cell.index, newvalue, oldvalue, cell);
			})

			this.debugOut();
			return this;
		}

		set (index: number, value: ValueContainer): List;
		set (index: number, value: any, origin: CellContainer): List;
		set (index: number, value: any, origin?: CellContainer): List {
			this.debugIn("Set at " + index + ": " + value);
			if (index < 0 || index >= this.cells.length)
				throw new Error("Set out of bounds: " + index + " not in 0.." + this.cells.length)


			this.cells[index].set(value);

			this.debugOut();
			return this;
		}

		remove (index : number) : any {
			this.debugIn("Remove at " + index);
			if (index < 0 || index >= this.cells.length)
				throw new Error("Remove out of bounds: " + index + " not in 0.." + this.cells.length)

			var origcell = this.cells[index];
			var origvalue = origcell.get();

			this.cells.splice(index, 1);
			this._updateIndexes(index);

			this.fire(ListEvent.REMOVE.toString(), index, origvalue);

			origcell.free();
			this.debugOut();
			return origvalue;
		}

		move (from : number, to : number) : List {
			if (from == to)
				return this;

			this.debugIn("Move from " + from + " to " + to);
			if (from < 0 || to < 0 || from >= this.cells.length || to >= this.cells.length)
				throw new Error("Move out of bounds: " + from + to + " not in 0.." + this.cells.length);


			var c = this.cells[from];
			this.cells.splice(from, 1);
			this.cells.splice(to,0,c);
			this._updateIndexes(to, from);

			this.fire(ListEvent.MOVE.toString(), from, to);

			this.debugOut();
			return this;
		}

		cell (index: number) : Cell {
			if (index < 0 || index >= this.cells.length)
				throw new Error("Cell out of bounds: " + index + " not in 0.." + this.cells.length)

			return this.cells[index];
		}

		size(): number {
			return this.cells.length;
		}

		/** events */
		onInsert(caller: Base, cb: (index: number, value, cell: Cell) => void , fireInitialEvents? : bool) : List {
			this.on(ListEvent.INSERT.toString(), caller, cb);

			if (fireInitialEvents !== false)
				this.each(caller, cb);

			return this;
		}

		onMove(caller: Base, cb : (from : number, to: number) => void) : List {
			this.on(ListEvent.MOVE.toString(), caller, cb);
			return this;
		}

		onRemove(caller: Base, cb : (from : number, value) => void): List {
			this.on(ListEvent.REMOVE.toString(), caller, cb);
			return this;
		}

		onSet(caller: Base, cb : (index : number, newvalue, oldvalue, cell: Cell) => void) : List{
			this.on(ListEvent.SET.toString(), caller, cb);
			return this;
		}

		/** householding */
		_updateIndexes (start : number, end? : number) : List {
			if (start >= this.cells.length)
				return this; //updating after adding the last does need no further processing
			if (end === undefined)
				return this._updateIndexes(start, this.cells.length -1);
			if (end < start)
				return this._updateIndexes(end, start);

			for(var i = start; i <= end; i++)
				this.cells[i].index = i;
			return this;
		}

		each(scope, cb : (index: number, value: any, cell: Cell) => void) {
			var l= this.cells.length;
			for(var i = 0; i < l; i++)
				cb.call(scope, i, this.get(i), this.cells[i]);
		}

		/** util functions */
		add(value: ValueContainer);
		add(value: any, origin?: CellContainer);
		add(value: any, origin?: CellContainer) {
			this.insert(this.cells.length, value, origin);
			//return this.cells.length - 1;
			return this;
		}

		aggregate(index: string, caller?: Base, onchange?: (newvalue, oldvalue) => void ) {
			if (this.aggregates[index])
				return this.aggregates[index].get(caller, onchange)

			//check if index is a known aggregate class?
			if (!(Util[index] && Util[index].prototype == ListAggregation))
				throw "Unknown aggregate: " + index;

			var a = this.aggregates[index] = this[index](); //invokes aggregation
			return a.get(onchange);
		}

		get (index: number): any;
		get (index: number): IValue; //TODO: really?
		get (index: number, caller: Base, onchange: (newvalue, oldvalue) => void , fireInitialEvent?: bool): any;
		get (index?: number, caller?: Base, onchange?: (newvalue, oldvalue) => void , fireInitialEvent?: bool): any {
			if (index < 0 || index >= this.cells.length)
				throw new Error("Get out of bounds: " + index + " not in 0.." + this.cells.length)

			return this.cells[index].get(caller, onchange, fireInitialEvent);
		}

		toJSON() {
			var res = [];
			var l = this.cells.length;
			for (var i = 0; i < l; i++)
				res.push(this.cell(i).toJSON());
			return res;
		}

		toFullAST(): Object {
			var res = {
				type: 'List',
				id: this.noaid,
				values: []
			};
			for (var i = 0; i < this.cells.length; i++)
				res.values.push(this.cells[i].toAST());
			return res;
		}

		removeAll(value : any) {
			for (var i = this.cells.length - 1 ; i >= 0; i--) {
				if (this.get(i) == value)
					this.remove(i);
			}
		}

		free() {
			console.log("freeing " + this.cells.length)
			for (var i = this.cells.length - 1; i >= 0; i--)
				this.cells[i].free();

			//TODO: free aggregates
			super.free();
		}

		/* toString : function() {
		 var res = [];
		 var l = this.cells.length;
		 for(var i = 0; i < l; i++)
		 res.push(this.get(i));
		 return "[" + res.join(",") + "]";
		 }
		 */

		/** transform functions */
		map(name: string, func: any /*funciton or Expression */): List {
			return new MappedList(this, name, func);
		}

		/**
		 * Constructs a new list with all the items of which func applies true. If name is defined, the current value to which the filter is applied is available
		 * in func as this.variable(x), or, as the first argument
		 * @param  {[type]} name of the variable in the scope [description]
		 * @param  {[type]} func [description]
		 * @return {[type]}
		 */
		filter(name: string, func: any /* Expression or function */): List {
			return new FilteredList(this, name, func)
		}

		/**
		 *
		 *
		 * Was here..
		 *
		 * @param  {[type]} begin [description]
		 * @param  {[type]} end   [description]
		 * @return {[type]}       [description]
		 */
		subset(begin: number, end?: number): List {
			if (end === undefined)
				return new ListTail(this, begin);
			return new SubSetList(this, begin, end);
		}

		tail(start : number = 1):List {
			return new ListTail(this, start);
		}

		last() {
			return new ListTail(this, -1);
		}

		reverse(): List {
			//TODO: if this is a reversed list, return this.getSource()
			return new ReversedList(this);
		}

		//TODO: introduce sort and sortby (map(getfield).order.ummap)
		sort(comperator): List {
			return new SortedList(this, comperator);
		}

		distinct(): List {
			//TODO: return sorted version of the list!
			return new DistinctList(this);
		}

		join(): List {
			return new JoinedList(this);
		}

		/** aggregate */

		sum () {
			return new ListSum(this);
		}

		min () {
			return new ListMin(this);
		}

		max () {
			return new ListMax(this);
		}

		avg () : Expression {
			var scope = Scope.newScope(null);
			scope.set("this", new Constant(this));
			return <Expression> new Expression(function() {
				var count = this.variable("this", "numbercount");
				var sum = this.variable("this", "sum");
				return count > 0 ? (sum / count) : 0; //MWE: wrong div result?
			}, scope).setAST(Serializer.serializeFunction("avg",[this])).uses(this);
		}

		count () {
			return new ListCount(this);
		}

		first () {
			return new ListFirst(this);
		}

		numbercount () : ValueContainer {
			return new ListNumberCount(this);
		}

		atIndex(index: number) { //TODO: bleghname
			return new ListIndex(this, index);
		}


		isError(): bool {
			return false;
		}
	}
}