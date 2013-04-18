///<reference path='noa.ts'/>

module NOA {

	export class List extends CellContainer {

		static Aggregates = { count : "count", numbercount: "numbercount", sum : "sum", min: "min", max : "max", vag : "avg", first : "first", last : "last" };

		cells : Cell[] = [];
		aggregates = {};

		constructor() {
			super();
		}

		/** core functions */
		insert(index: number, value: ValueContainer): List;
		insert(index: number, value: any, origin: CellContainer): List;
		insert(index: number, value: any, origin?: CellContainer): List {
			this.debugIn("Insert at " + index + ": " + value);

			var cell = new Cell(<CellContainer>this, index, <any> value, <CellContainer>origin); //Todo extract origin from value
			this.cells.splice(index, 0, cell);

			this._updateIndexes(index +1, 1);
			this.fire('insert', index, cell.get(), cell);

			this.debugOut();
			return this;
		}

		set (index: number, value: ValueContainer): List;
		set (index: number, value: any, origin: CellContainer): List;
		set (index: number, value: any, origin?: CellContainer): List {
			this.debugIn("Set at " + index + ": " + value);

			this.cells[index].set(value);

			this.debugOut();
			return this;
		}

		fireCellChanged(index: any, newvalue: any, oldvalue: any, cell : Cell) {
		    this.fire('set', index, newvalue, oldvalue, cell);
		};

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

		onInsert(caller: Base, cb : (index: number, value, cell: Cell) => void) : List {
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

		onSet(caller: Base, cb : (index : number, newvalue, oldvalue, cell: Cell) => void) : List{
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

		replayInserts(scope, cb : (index: number, value: any, cell: Cell) => void) {
			var l= this.cells.length;
			for(var i = 0; i < l; i++)
				cb.call(scope, i, this.get(i), this.cells[i]);
		}


        /** util functions */

		add(value: ValueContainer);
		add(value: any, origin: CellContainer);
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

        //TODO: if caller & onchange, should it follow the cell or follow the value at the specified index?!
        //Todo should it follow atIndex?
		get (index: number /*, caller?: Base, onchange? : (newvalue, oldvalue)=>void*/) {
		    return this.cells[index].get(/*caller, onchange*/);
		}

		toArray(recurse?: bool) { //TODO: implement recurse
		    var res = [];
		    var l = this.cells.length;
		    for (var i = 0; i < l; i++)
		        res.push(this.get(i));
		    return res;
		}

		removeAll(value) {
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

		tail() {
		    return new ListTail(this, 1);
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

		avg () {
		    return new ListAverage(this);
		}

		count () {
		    return new ListCount(this);
		}

		first () {
		    return new ListFirst(this);
		}

		numbercount () {
		    return new ListNumberCount(this);
		}

		atIndex(index: number) { //TODO: bleghname
		    return new ListIndex(this, index);
		}
	}

}