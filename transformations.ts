///<reference path='noa.ts'/>

module NOA {

	export class ListTransformation extends List {
		source : List; //TODO: remove parent?

		constructor (source : List) {
			super();
			this.source = source;
			this.uses(source);

			source.onFree(this, () => this.free())

			source.onInsert(this, this.onSourceInsert);

			source.onSet(this, this.onSourceSet);

			source.onMove(this, this.onSourceMove);

			source.onRemove(this, this.onSourceRemove);

		}

		onSourceInsert (index : number, value, cell: Cell) { }

		onSourceRemove(index: number, value) { }

		onSourceMove(from : number, to : number) { }

		onSourceSet(index: number, newvalue, oldvalue, cell: Cell) { }
	}


	export class MappedList extends ListTransformation {
		basescope : Object;
		func : any; //function or expession
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

			this.replayInserts(this.onSourceInsert);

		}

		onSourceInsert (index : number, _, source) {
			var scope = Scope.newScope(this.basescope);
			scope[name] = source;

			var a;
			if (NOA.isFunction(this.func))
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

	export class FilteredList extends ListTransformation {

		parent : List;
		mapping : any[] = [];

		constructor(source: List, name: string, func: any /* Expression or function */) {
		    super(source.map(name, func)); //do not follow the source but to the filtermap!

		    this.parent = source;
			
			this.source.replayInserts(this.onSourceInsert);
		}

		updateMapping (index: number, delta: number, to?: number) {
			var l = to ? to : this.mapping.length;
			for (var i = index; i < l; i++) {
				var m = this.mapping[i];
				this.mapping[i] = [m[0] + delta, m[1]];
			}
		}

		onSourceInsert (index : number, value) {
			var tidx = 0, l = this.mapping.length;
			if (index < l)
				tidx = this.mapping[index][0];
			else if (l > 0)
				tidx = this.mapping[l - 1][0] + 1; //+1?

			if (value === true) {
				//insert new entry in the mapping
				this.mapping.splice(index, 0, [<any>tidx, true]);
				//update all next entries in the mappings with +1.
				this.updateMapping(index + 1, 1);
				//insert the proper value from parent. A cell will be followed automatically
				this.insert(tidx, this.parent.cell(index));
			}
			else
			//just insert the new entry, no further update needed
				this.mapping.splice(index, 0, [<any>tidx, false]); //nothing changed, but insert extra record in the mapping
		}

		onSourceRemove(index: number, value) {
			var tidx = this.mapping[index][0];
			var has = this.mapping[index][1];

			if (has) {
				this.remove(tidx);
				this.updateMapping(index + 1, -1);
			}

			this.mapping.splice(index, 1);
		}

		onSourceMove(from : number, to : number) {
			var tidx = this.mapping[to][0];
			var fidx = this.mapping[from][0];
			var hasf = this.mapping[from][1];

			if (hasf)
				this.move(fidx, tidx);

			if (to < from) {
				if (hasf)
					this.updateMapping(to, 1, from - 1);
				this.mapping.splice(from, 1);
				this.mapping.splice(to, 0, [tidx, hasf]);
			}
			else { //to > from
				if (hasf)
					this.updateMapping(from + 1, -1, to); //to -1 ?
				this.mapping.splice(to, 0, [tidx, hasf]);
				this.mapping.splice(from, 1);
			}
		}

		onSourceSet(index: number, should, _) {
			var tidx = this.mapping[index][0];
			//Note, this func only fires if should changed, so we can rely on that
			if (should) {
				//update new entry in the mapping
				this.mapping[index] = [tidx, true];
				//update all next entries in the mappings with +1.
				this.updateMapping(index + 1, 1);
				//insert the proper value from parent
				this.insert(tidx, this.parent.cell(index));
			}
			else {
				this.remove(tidx);
				this.mapping[index] = [tidx, false];
				this.updateMapping(index + 1, -1);
			}
		}
	}

	export class SubSetList extends ListTransformation {
		begin : number;
		end : number;

		constructor(source: List, begin: number, end: number) {
			super(source);
			this.begin = begin;
			this.end = end;

			var l = Math.min(source.cells.length, end);
			for (var i = begin; i < l; i++)
				this.add(source.cell(i));

			this.unlisten(source, 'set')
		}

		removeLast() {
			if (this.cells.length > this.end - this.begin)
				this.remove(this.cells.length - 1); //remove the last
		}

		addLast() {
			if (this.end < this.source.cells.length) //add another item at the end
				this.add(this.source.cell(this.end));
		}

		removeFirst() {
			if (this.end - this.begin > 0)
				this.remove(0); //remove the first

		}

		addFirst() {
			if (this.begin < this.source.cells.length)
				this.insert(0, this.source.cell(this.begin))
		}

		onSourceInsert(index, value, cell) {
			if (index < this.begin) { //Item inserted before the subset
				this.removeLast();
				this.addFirst();
			}
			else if (index >= this.begin && index < this.end) { //item inserted within the subset
				this.removeLast();
				this.insert(index - this.begin, cell);
			}
		};

		onSourceRemove (index) {
			if (index < this.begin) {
				this.removeFirst();
				this.addLast();
			}
			else if (index >= this.begin && index < this.end) {

				this.remove(index - this.begin); //remove the item in the list

				this.addLast();
			}
		};

		onSourceMove (from, to) {
			if ((from < this.begin && to < this.begin) || (from > this.end && to > this.end))
				return; //not interesting, out the range and both on the same side

			var f = from - this.begin;
			var t = to - this.begin;
			var l = this.end - this.begin;

			if (f >= 0 && f < l && t >= 0 && t < l) //within this subset
				this.move(f, t);
			else {
				//To is in this range (and from is not..)
				if (t >= 0 && t < l) {
					this.insert(t, this.source.cell(from));
					if (f < 0) { //item was original before this subset, move the set
						this.removeFirst();
						this.addLast();
					}
					else
						this.removeLast();
				}
				else { //From is in this range (and to is not)
					this.remove(f);
					if (t < 0) { //item is moved before this subset, move the set
						this.addFirst();
						this.removeLast();
					}
					else
						this.addLast();
				}
			}
		};

	}

	export class ReversedList extends ListTransformation {
		constructor(source: List) {
			super(source);

			var l = source.cells.length;

			//map all cells
			for (var i = l - 1; i >= 0; i--)
				this.add(source.cell(i));

			this.unlisten(source, 'set');
		}

		onSourceInsert (index, value, cell) {
			this.insert(this.cells.length - index, cell);
		};

		onSourceRemove (index) {
			this.remove(this.cells.length - index - 1);
		};

		onSourceMove(from, to) {
			this.move(this.cells.length - from - 1, this.cells.length - to - 1);
		};
	}

	export class SortedList extends ListTransformation {

		mapping : number[] = []; //maps original number to the new index
		func : any;

		constructor(source: List, comperator) {
			super(source);
			this.func = comperator;

			//Comperator function
			if(comperator == null)
				this.func = function (a, b) {
					if (a == b)
						return 0;
					else if (a < b)
						return -1;
					else
						return 1;
				};

			source.replayInserts(this.onSourceInsert);

			this.unlisten(source, 'move');
		}

		updateMapping(from : number, delta : number) {
			var l = this.mapping.length;
			for (var i = 0; i < l; i++)
				if (this.mapping[i] >= from)
					this.mapping[i] += delta;
		}

		//Comperator wrap function
		searcher (a, b : Cell) {
			return this.func(a, b.get()); //b is a cell, so unwrap the value
		};

		//reusable insert function
		onSourceInsert (baseindex: number, value, cell : Cell, _knownindex? : number) {
			var nidx = _knownindex;
			if (nidx === undefined)
				nidx = NOA.binarySearch(this.cells, value, this.searcher);

			this.insert(nidx, value, cell.getOrigin());
			this.updateMapping(nidx, 1);
			this.mapping.splice(baseindex, 0, nidx);
		};

		onSourceRemove(baseindex: number, _?) {
			var idx = this.mapping[baseindex];
			this.remove(idx);
			this.updateMapping(idx, -1);
			this.mapping.splice(baseindex, 1);
		}

		onSourceSet (index : number, value, _, cell) {
			var baseidx = this.mapping[index];
			var nidx = NOA.binarySearch(this.cells, value, this.searcher);
			if (nidx != baseidx) {
				this.onSourceRemove(index);
				this.onSourceInsert(index, value, cell, nidx);
			}
			else //just update
				this.set(index, value);
		};
	}

	export class DistinctList extends ListTransformation {

		occ = {};

		constructor(source: List) {
			super(source);
			source.replayInserts(this.onSourceInsert)
			this.unlisten(source, 'move')
		}

		toKey (value) {
			if (value === null || value === undefined)
				return "";
			if (value instanceof Base)
				return "$$NOA#" + value.noaid;
			return value.toString();
		}

		onSourceInsert (index : number, value, cell) {
			var key = this.toKey(value);
			var has = key in this.occ;
			if (!has) {
				this.add(value, cell);
				this.occ[key] = 1;
			}
			else
				this.occ[key] += 1;
		};

		onSourceRemove (index : number, value) {
			var key = this.toKey(value);
			var has = key in this.occ;
			if (has) {
				this.occ[key] -= 1;
				if (this.occ[key] == 0) {
					this.removeAll(value);
					delete this.occ[key];
				}
			}
		};


		onSourceSet(index: number, newvalue, origvalue, cell) {
			this.onSourceRemove(index, origvalue);
			this.onSourceInsert(index, newvalue, cell);
		};
	}


	export class JoinedList extends ListTransformation {

		lmap : any[] = []; //list with [startindex, length]

		constructor(source: List) {
			super(source);
			source.replayInserts(this.onSourceInsert);
		}

		updateLmap  (index : number, delta : number) {
			this.lmap[index][1] += delta;
			for (var i = index + 1; i < this.lmap.length; i++)
				this.lmap[i][0] += delta;
		}

		setupSublist (index : number, sublist) {
			var cell = this.source.cell(index); //the cell knows our position in lmap reliable when handling events, so the join transformation does not need to track that.

			var sublistInsert = function (subindex, _, cell) {
				this.insert(this.lmap[cell.index][0] + subindex, cell);
				this.updateLmap(cell.index, +1);
			}

			sublist.replayInserts(sublistInsert);

			sublist.onInsert(this, sublistInsert);
			sublist.onMove(this, function (sf : number, st : number) {
				this.move(this.lmap[cell.index][0] + sf, this.lmap[cell.index][0] + st);
			});

			sublist.onRemove(this, function (sf : number) {
				this.remove(this.lmap[cell.index][0] + sf);
				this.updateLmap(cell.index, -1);
			});
		}

		onSourceInsert(index : number, value, cell) {
			var start = index == 0 ? 0 : this.lmap[index - 1][0] + this.lmap[index - 1][1];

			if (!(value instanceof List)) { //plain value, insert right away
				this.lmap.splice(index, 0, [start, 1]);
				this.insert(start, value, cell);
			}
			else { //list
				this.lmap.splice(index, 0, [start, 0]);
				this.setupSublist(index, value);
			}
		}

		onSourceRemove (index : number, value) {
			if (value instanceof List) {
				this.unlisten(value, 'insert');
				this.unlisten(value, 'remove');
				this.unlisten(value, 'move');
			}

			var size =this. lmap[index][1];
			var start=this.lmap[index][0];
			this.updateLmap(index, -1 * size);
			this.lmap.splice(index, 1);
			for (var i = 0; i < size; i++)
				this.remove(start);

		}


		onSourceSet (index : number, newvalue, oldvalue, cell) {
			this.onSourceRemove(index, oldvalue);
			this.onSourceInsert(index, newvalue, cell);
		};

		onSourceMove (from : number, to : number) {
			//this can be done in an intelligent way by moving the items, but, its complicated since we already captured in the scope
			//just, copy the original from and to value and re-apply remove and insert at the proper indexes
		    /*MWE: old , this seem to be incorrect, it seems to be a swap funciton. Lets fix that. 
            this.onSourceRemove(from, this.source.get(from)); //pass the old value to remove, to unlisten the changes
			this.onSourceInsert(from, this.source.get(from));
			this.onSourceRemove(to, this.source.get(to)); //pass the old value
			this.onSourceInsert(to, this.source.get(to));
            */
		    var cell = this.source.cell(from);
		    this.onSourceRemove(from, this.source.get(from));
		    this.onSourceInsert(to > from ? to - 1 : to, cell.get(), cell);
		};

	}

	export class ListTail extends ListTransformation {
		start : number; //sublist from

		constructor(source: List, start? : number) {
			super(source);
			if (start === undefined)
				this.start = 1;
			this.start = start;
			this.unlisten(source, 'set');
		}

		onSourceInsert(index: number, _, cell) {
			if (index < this.start){
				if (this.source.cells.length >= this.start)
					this.insert(0, this.source.get(this.start));
			}
			else
				this.insert(index - this.start, cell);
		}

		onSourceRemove(index: number, value) {
			if (index < this.start) {
				if (this.cells.length > 0)
					this.remove(0);
			}
			else
				this.remove(index - this.start);
		}

		onSourceMove(from: number, to: number) {
			if (from >= this.start && to >= this.start)
				this.move(from - this.start, to - this.start)
			else {
				if (from >= this.start)
					this.set(from - this.start, this.source.get(from))
				if (to >= this.start)
					this.set(to - this.start, this.source.get(to))
			}
		}

	}

	//TODO:
	//NumberFilter, and use it inside, min,max,avg and such
	//Unmap
	//Contains
	//Intersect
	//Union
	//Substract
	//Other list math
}