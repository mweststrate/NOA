///<reference path='noa.ts'/>

module NOA {

	export class List extends CellContainer {

		static Aggregates = { count : "count", numbercount: "numbercount", sum : "sum", min: "min", max : "max", vag : "avg", first : "first", last : "last" };

		cells = [];
		aggregates = {};

		constructor() {
			super();
		}

		/** core functions */
			insert (index: number, value) : List {
			this.debugIn("Insert at " + index + ": " + value);

			var cell = new Cell(this, index, value);
			this.cells.splice(index, 0, cell);

			this._updateIndexes(index +1, 1);
			this.fire('insert', index, cell.value);

			this.debugOut();
			return this;
		}

		set (index : number, value) : List {
			this.debugIn("Set at " + index + ": " + value);

			this.cells[index]._store(value);

			this.debugOut();
			return this;
		}

		remove (index : number) : any {
			this.debugIn("Remove at " + index);

			var origcell = this.cells[index];
			var origvalue = origcell.get();

			this.cells.splice(index, 1);
			this._updateIndexes(index, -1);

			this.fire('remove', index, origvalue);

			origcell.free();
			this.debugOut();
			return origvalue;
		}

		move (from : number, to : number) : List {
			if (from == to)
				return this;

			this.debugIn("Move from " + from + " to " + to);

			var c = this.cells[from];
			c.index = to;

			if (from > to) {
				this._updateIndexes(to, from, 1);
				c.index = to;
				this.cells.splice(from, 1);
				this.cells.splice(to,0,c);
			}
			else { //from < to
				this._updateIndexes(from, to, -1);
				this.cells.splice(to,0,c);
				this.cells.splice(from, 1);
				this.cells[to].index = to;
			}

			this.fire('move', from, to);

			this.debugOut();
			return this;
		}

		cell (index: number) : Cell {
			return this.cells[index];
		}

		/** events */

			onInsert(caller: Base, cb : (index: number, value) => void) : List {
			this.on('insert', caller, cb);
			return this;
		}

		onMove(caller: Base, cb : (from : number, to: number) => void) : List {
			this.on('move', caller, cb);
			return this;
		}

		onRemove(caller: Base, cb : (from : number, value) => void): List {
			this.on('remove', caller, cb);
			return this;
		}

		onSet(caller: Base, cb : (index : number, value) => void) : List{
			this.on('set', caller, cb);
			return this;
		}

		/** householding */

			_updateIndexes (start : number, end : number, delta? : number) : List{
//TODO: move end to the third argument to simplify the code        
//debugger;
			if (arguments.length == 2) {
				var l = this.cells.length;
				for(var i = start; i < l; i++)
					this.cells[i].index += end;
			}
			else if (arguments.length == 3)
				for(var i = start; i < end; i++)
					this.cells[i].index += delta;
			return this;
		}

		replayInserts(cb : (index: number, value: any) => void) {
			var l= this.cells.length;
			for(var i = 0; i < l; i++)
				cb(i, this.get(i));
		}

		/** child functions */

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
		subset(begin: number, end: number): List {
		    return new SubSetList(this, begin, end);
		}
			
		reverse(): List {
		    return new ReversedList(this);
		}

		

		sort(comperator): List { 
		    return new SortedList(this, comperator);
		}

	

		distinct(): List {
		    return new DistinctList(this);
		}
		
		join(): List {
		    return new JoinedList(this);
		}

		/** aggregate */



			sum () {

		}

		min () {

		}

		max () {

		}

		avg () {

		}

		count () {

		}

		first () {

		}

		numbercount () {

		}

		last () {

		}

		/** util functions */

		add (value) {
			this.insert(this.cells.length, value);
			//return this.cells.length - 1;
			return this;
		}

		aggregate(index: string, caller?: Base, onchange?: (newvalue, oldvalue) => void ) {
		    if (this.aggregates[index])
		        return this.aggregates[index].get(caller, onchange)

		    //check if index is a known aggregate class?
		    if (!(NOA[index] && NOA[index].prototype == ListAggregation))
		        throw "Unknown aggregate: " + index;

		    var a = this.aggregates[index] = this[index](); //invokes aggregation
		    return a.get(onchange);
		}

		get (index : number, caller?: Base, onchange? : (newvalue, oldvalue)=>void) {
			return this.cells[index].get(caller, onchange);
		}

		toArray (recurse? : bool) { //TODO: implement recurse
			var res = [];
			var l = this.cells.length;
			for(var i = 0; i < l; i++)
				res.push(this.get(i));
			return res;
		}

		removeAll (value) {
		for(var i = this.cells.length -1 ; i >=0; i--) {
			if (this.get(i) == value)
				this.remove(i);
		}
	}

		free () {
			console.log("freeing " + this.cells.length)
			for (var i = this.cells.length -1; i >= 0; i--)
				this.cells[i].free();

			//TODO: free aggregates
		}

		/* toString : function() {
		 var res = [];
		 var l = this.cells.length;
		 for(var i = 0; i < l; i++)
		 res.push(this.get(i));
		 return "[" + res.join(",") + "]";
		 }
		 */

	}





}