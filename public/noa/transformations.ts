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

		onSourceInsert (index : number, value) { }

		onSourceRemove(index: number, value) { }

		onSourceMove(from : number, to : number) { }

		onSourceSet(index: number, oldvalue) { }
	}

	
	export class MappedList extends ListTransformation {

            /**
		 * Constructs a new list with all the mapped items in this list. If name is defined, the current value to which the filter is applied is available
		 * in func as this.variable(x), and it is available as the first argument
		 * @param  {[type]} name of the variable in the scope [description]
		 * @param  {[type]} func [description]
		 * @return {[type]}
		 */
	    constructor(source: List, name: string, func: any /* Function or Expression */) {
	        super(source);

	        var basescope = Scope.getCurrentScope();
	        var list = this;
	        var insert = function (index, value) {

	            var source = list.source.cell(index);
	            var scope = Scope.newScope(basescope);
	            scope[name] = source;

	            //new way
	            var a;
	            if (NOA.isFunction(func))
	                a = new Expression(func, scope)
	            else if (func instanceof Expression)
	                a = func;
	            else
	                throw "Map function should be JS function or expression"
	            //var a = new NOA.core.Expression(null, func, scope, this, source); //source will be both available as this.variable('name') or as the first arg in 'func'.
	            //TODO:?          a = a.listenTo(source, 'free', a.die or free); //destruct on free ASAP, othwerise unnecesary applications will be triggered.

	            //first create the new cell with the value, then start listening (otherwise a temp cell would create unecessary events)
	            list.insert(index, a);
	        };

	        //map all events
	        this.replayInserts(insert);

	        this.onInsert(list, insert);

	        this.onRemove(list, idx => list.remove(idx))

	        this.onMove(list, (from: number, to: number) => list.move(from, to))

	        return list;
	    }
	}

	export class FilteredList extends ListTransformation {

	    _filtermap: List;

	    constructor(source: List, name: string, func: any /* Expression or function */) {
	        super(source);

	        var mapping = [];

	        var maplist = this._filtermap = source.map(name, func);
	        maplist.debugName("filterHelperMap");
	        maplist.live(); //use a map to react properly to result changes and avoid code duplication

	        var list = this;
	        
	        function updateMapping(index: number, delta: number, to?: number) {
	            var l = to ? to : mapping.length;
	            for (var i = index; i < l; i++) {
	                var m = mapping[i];
	                mapping[i] = [m[0] + delta, m[1]];
	            }
	        }

	        function insert(index: number, value) {
	            var tidx = 0, l = mapping.length;
	            if (index < l)
	                tidx = mapping[index][0];
	            else if (l > 0)
	                tidx = mapping[l - 1][0] + 1; //+1?

	            if (value == true) {
	                //insert new entry in the mapping
	                mapping.splice(index, 0, [<any>tidx, true]);
	                //update all next entries in the mappings with +1.
	                updateMapping(index + 1, 1);
	                //insert the proper value from parent. A cell will be followed automatically
	                list.insert(tidx, this.parent.cell(index));
	            }
	            else
	                //just insert the new entry, no further update needed
	                mapping.splice(index, 0, [<any>tidx, false]); //nothing changed, but insert extra record in the mapping

	        };
	        maplist.onInsert(list, insert);

	        maplist.onSet(list, function (index, should) {
	            //console.info(this.toArray());
	            //debugger;
	            var tidx = mapping[index][0];
	            //Note, this func only fires if should changed, so we can rely on that
	            if (should) {
	                //update new entry in the mapping
	                mapping[index] = [tidx, true];
	                //update all next entries in the mappings with +1.
	                updateMapping(index + 1, 1);
	                //insert the proper value from parent
	                list.insert(tidx, list.source.cell(index));
	            }
	            else {
	                list.remove(tidx);
	                mapping[index] = [tidx, false];
	                updateMapping(index + 1, -1);
	            }
	        });


	        maplist.onRemove(list, function (index: number) {
	            //debugger;
	            var tidx = mapping[index][0];
	            var has = mapping[index][1];

	            if (has) {
	                list.remove(tidx);
	                updateMapping(index + 1, -1);
	            }

	            mapping.splice(index, 1);
	        });

	        maplist.onMove(list, function (from: number, to: number) {
	            var tidx = mapping[to][0];
	            var fidx = mapping[from][0];
	            var hasf = mapping[from][1];

	            if (hasf)
	                list.move(fidx, tidx);

	            if (to < from) {
	                if (hasf)
	                    updateMapping(to, 1, from - 1);
	                mapping.splice(from, 1);
	                mapping.splice(to, 0, [tidx, hasf]);
	            }
	            else { //to > from
	                if (hasf)
	                    updateMapping(from + 1, -1, to); //to -1 ?
	                mapping.splice(to, 0, [tidx, hasf]);
	                mapping.splice(from, 1);
	            }
	        });

	        maplist.replayInserts(insert);

	    }

	    free() {
	        this._filtermap.free();
	    }
	}


	export class SubSetList extends ListTransformation {
	    constructor(source: List, begin: number, end: number) {
	        super(source);
	        var list = this;

	        var l = Math.min(source.cells.length, end);
	        ////debugger;
	        //map all cells
	        for (var i = begin; i < l; i++)
	            list.add(source.cells[i].getValue());

	        function removeLast() {
	            if (list.cells.length > end - begin)
	                list.remove(list.cells.length - 1); //remove the last
	        }

	        function addLast() {
	            if (end < this.source.cells.length) //add another item at the end
	                list.add(this.source.cells[end].get());
	        }

	        function removeFirst() {
	            if (end - begin > 0)
	                list.remove(0); //remove the first

	        }

	        function addFirst() {
	            if (begin < this.source.cells.length)
	                list.insert(0, this.source.cells[begin].get()); //insert the new first item
	        }

	        list.listen(this, 'insert', function (index, value) {
	            if (index < begin) { //Item inserted before the subset
	                removeLast();
	                addFirst();
	            }
	            else if (index >= begin && index < end) { //item inserted within the subset
	                removeLast();
	                this.insert(index - begin, value);
	            }
	        });

	        list.listen(this, 'set', function (index, value) {
	            if (index >= begin && index < end)
	                this.set(index - begin, value);
	        });

	        list.listen(this, 'remove', function (index) {
	            if (index < begin) {
	                removeFirst();
	                addLast();
	            }
	            else if (index >= begin && index < end) {

	                this.remove(index - begin); //remove the item in the list

	                addLast();
	            }
	        });

	        list.listen(this, 'move', function (from, to) {
	            if ((from < begin && to < begin) || (from > end && to > end))
	                return; //not interesting, out the range and both on the same side

	            var f = from - begin;
	            var t = to - begin;
	            var l = end - begin;

	            if (f >= 0 && f < l && t >= 0 && t < l) //within this subset
	                this.move(f, t);
	            else {
	                //To is in this range (and from is not..)
	                if (t >= 0 && t < l) {
	                    this.insert(t, this.source.get(from));
	                    if (f < 0) { //item was original before this subset, move the set
	                        removeFirst();
	                        addLast();
	                    }
	                    else
	                        removeLast();
	                }
	                else { //From is in this range (and to is not)
	                    this.remove(f);
	                    if (t < 0) { //item is moved before this subset, move the set
	                        addFirst();
	                        removeLast();
	                    }
	                    else
	                        addLast();
	                }
	            }
	        });

	        return list;
        }

    }

	export class ReversedList extends ListTransformation {
	    constructor(source: List) {
	        super(source);

	        var list = this;
	        var l = source.cells.length;

	        //map all cells
	        for (var i = l - 1; i >= 0; i--)
	            list.add(source.cells[i].getValue());

	        list.listen(source, 'insert', function (index, value) {
	            this.insert(this.cells.length - index, value);
	        });

	        list.listen(source, 'set', function (index, value) {
	            this.set(index, value);
	        });

	        list.listen(source, 'remove', function (index) {
	            this.remove(this.cells.length - index - 1);
	        });

	        list.listen(source, 'move', function (from, to) {
	            this.move(this.cells.length - from - 1, this.cells.length - to - 1);
	        });

	    }
    }
	
	export class SortedList extends ListTransformation {
	    constructor(source: List, comperator) {
	        super(source);

	    var list = (this);
	    var mapping = [];

	    function updateMapping(from, delta) {
	        var l = mapping.length;
	        for (var i = 0; i < l; i++)
	            if (mapping[i] >= from)
	                mapping[i] += delta;
	    }

            //Comperator function
	    var func = comperator;
	    if(comperator == null)
            func = function (a, b) {
                if (a == b)
                    return 0;
                else if (a < b)
                    return -1;
                else
                    return 1;
            };

	        //Comperator wrap function
	        var searcher = function (a, b) {
	            return func(a, b.get()); //b is a cell, so unwrap the value
	        };

	        //reusable insert function
	        var insert = function (base, value, _knownindex) {
	            var nidx = _knownindex;
	            if (nidx === undefined)
	                nidx = NOA.binarySearch(this.cells, value, searcher);

	            this.insert(nidx, value);
	            updateMapping(nidx, 1);
	            mapping.splice(base, 0, nidx);
	        };

	        var remove = function (base) {
	            var idx = mapping[base];
	            this.remove(idx);
	            updateMapping(idx, -1);
	            mapping.splice(base, 1);
	        }

	        var set = function (index, value) {
	            var baseidx = mapping[index];
	            var nidx = NOA.binarySearch(this.cells, value, searcher);
	            if (nidx != baseidx) {
	                remove.call(this, index);
	                insert.call(this, index, value, nidx);
	            }
	            else //just update
	                this.set(index, value);
	        };

	        var l = source.cells.length;
	        for (var i = 0; i < l; i++)
	            insert.call(list, i, source.cells[i].getValue());

	        list.listen(source, 'insert', insert);

	        list.listen(source, 'set', set );

	        list.listen(source, 'remove', remove);

	        //no need to listen to move

	    }
	}

	export class DistinctList extends ListTransformation {
	    constructor(source: List) {
	        super(source);
	    var occ = {};

	    var toKey = function (value) {
	        if (value === null || value === undefined)
	            return "";
	        if (value instanceof Base)
	            return "$$NOA#" + value.noaid;
	        return value.toString();
	    }

            var l = source.cells.length;
	    var list = (this);

	    var insert = function (index, value) {
	        var key = toKey(value);
	        var has = key in occ;
	        if (!has) {
	            this.add(value);
	            occ[key] = 1;
	        }
	        else
	            occ[key] += 1;
	    };

	    var remove = function (index, value) {
	        var key = toKey(value);
	        var has = key in occ;
	        if (has) {
	            occ[key] -= 1;
	            if (occ[key] == 0) {
	                this.removeAll(value);
	                delete occ[key];
	            }
	        }
	    };

	    for(var i = 0; i < l; i++)
	        insert.call(list, i, source.cells[i].getValue());

	    list.listen(source, 'insert', insert);

	    list.listen(source, 'set', function (index, value, orig) {
	            remove.call(this, index, orig);
	            insert.call(this, index, value);
	        });

	    list.listen(source, 'remove', remove);

	        //no need to listen to move

	    }
	}

	export class JoinedList extends ListTransformation {

	    constructor(source: List) {
	        super(source);
	        //      debugger;
	        var list = (this);
	        //list with item -> [offset, length]
	        var lmap = [];

	        var updateLmap = function (index, delta) {
	            lmap[index][1] += delta;
	            for (var i = index + 1; i < lmap.length; i++)
	                lmap[i][0] += delta;
	        }

	        var setupSublist = function (index, sublist) {
	            var cell = this.source.cell(index); //the cell knows our position in lmap reliable when handling events

	            var sublistInsert = function (subindex, subvalue) {
	                this.insert(lmap[cell.index][0] + subindex, subvalue);
	                updateLmap(cell.index, +1);
	            }

	            sublist.replayInserts(sublistInsert);

	            list.listen(sublist, 'insert', sublistInsert);
	            list.listen(sublist, 'move', function (sf, st) {
	                this.move(lmap[cell.index][0] + sf, lmap[cell.index][0] + st);
	            });
	            list.listen(sublist, 'remove', function (sf) {
	                this.remove(lmap[cell.index][0] + sf);
	                updateLmap(cell.index, -1);
	            });
	            list.listen(sublist, 'set', function (sf, value) {
	                this.set(lmap[cell.index][0] + sf, value);
	            });
	        }

	        var insert = function (index, value) {
	            var start = index == 0 ? 0 : lmap[index - 1][0] + lmap[index - 1][1];
	            if (!(value instanceof List)) { //plain value, insert right away
	                lmap.splice(index, 0, [start, 1]);
	                list.insert(start, value);
	            }
	            else { //list
	                lmap.splice(index, 0, [start, 0]);
	                setupSublist(index, value);
	                //               value.live();
	            }
	        }

	        var remove = function (index, value) {
	            if (value instanceof List) {
	                list.debug("removed list " + value + " at " + index);
	                list.unlisten(value, 'insert');
	                list.unlisten(value, 'set');
	                list.unlisten(value, 'remove');
	                list.unlisten(value, 'move');
	                //               value.die();
	            }

	            var size = lmap[index][1];
	            updateLmap(index, -1 * size);
	            for (var i = 0; i < size; i++)
	                list.remove(lmap[index][0]);
	            lmap.splice(index, 1);
	        }

	        source.replayInserts(insert);

	        list.listen(source, 'insert', insert);
	        list.listen(source, 'set', function (index, newvalue, oldvalue) {
	            remove(index, oldvalue);
	            insert(index, newvalue);
	        });
	        list.listen(source, 'remove', remove);
	        list.listen(source, 'move', function (from, to) {
	            //this can be done in an intelligent way by moving the items, but, its complicated since we already captured in the scope
	            //just, copy the original from and to value and re-apply remove and insert at the proper indexes
	            remove(from, this.parent.get(from)); //pass the old value to remove, to unlisten the changes
	            insert(from, this.parent.get(from));
	            remove(to, this.parent.get(to)); //pass the old value
	            insert(to, this.parent.get(to));
	        });

	        return list;
	    }

	}


	//TODO: this one can perfectly be memoized
	//TODO: very similar to SubList?
    export class ListTail extends ListTransformation {
    	start : number; //sublist from

        constructor(source: List, start? : number) {
            super(source);
            if (start === undefined)
            	this.start = 1;
            this.start = start;
        }

        onSourceInsert(index: number, value) {
        	if (index < this.start){
        		if (this.source.cells.length >= this.start)
        			this.insert(0, this.source.get(this.start));
    		}
    		else
            	this.insert(index - this.start, value);
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

        onSourceSet(index: number, newvalue) {
        	if (index >= this.start)
        		this.set(index - this.start, newvalue);
        }
    }
	
}