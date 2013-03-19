NOA.require(["NOA.core.Base"], function() {

NOA.declare("NOA.List", NOA.core.Base, {
    
    parent : null,
    cells : null,
    sublists : null,
    isroot : true,
    aggregates : null,
    
    init : function(parentlist) {
        this.parent = parentlist;
        this.isroot = this.parent == null;
        this.cells = [];
        this.sublists = [];

        if (parentlist) {
            NOA.debug("New lit with parent:  "+ parentlist);
            this.uses(parentlist); 
            this.listenTo(parentlist, 'free', this.free);
        }
        //TODO: if parent, than make inmutable...
    },
    
    /** core functions */
    insert : function(index, value) {
        this.debugIn("Insert at " + index + ": " + value);

        var cell = new NOA.core.Cell(this, index, value);
        this.cells.splice(index, 0, cell);
        
        this._updateIndexes(index +1, 1);
        this.fire('insert', index, cell.value);

        this.debugOut();
        return this;
    },
    
    set : function(index, value) {
        this.debugIn("Set at " + index + ": " + value);

    	var orig = this.get(index);
        if (orig != value) {
            this.cells[index]._store(value);
            
            this.fire('set', index, this.cells[index].value, orig);
        }

        this.debugOut();
        return this;
    },
    
    remove : function(index) {
        this.debugIn("Remove at " + index);

    	var origcell = this.cells[index];
        

        this.cells.splice(index, 1);
        this._updateIndexes(index, -1);
                
        this.fire('remove', index, origcell.get());
    	
        origcell.free();
        this.debugOut();
        return this;
    },
    
    move : function(from, to) {
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
    },
    
    cell : function(key) {
    	return this.cells[key];
    },
    
    /** householding */
    
    _updateIndexes : function(start, end /*?*/, delta) {
        //debugger;
        if (arguments.length == 2) {
	        var l = this.cells.length;
	        for(var i = start; i < l; i++)
	            this.cells[i].index += end;
		}
        else if (arguments.length == 3)
	        for(var i = start; i < end; i++)
        		this.cells[i].index += delta;
    },

    replayInserts : function(scope, handler) {
        var l= this.cells.length;
        for(var i = 0; i < l; i++)
            handler.call(scope, i, this.get(i));
    },
    
    /** child functions */
    
    /**
     * Constructs a new list with all the mapped items in this list. If name is defined, the current value to which the filter is applied is available
     * in func as this.variable(x), and it is available as the first argument
     * @param  {[type]} name of the variable in the scope [description]
     * @param  {[type]} func [description]
     * @return {[type]}
     */
    map : function(name, func) {
        if (func === undefined) {
            func = name;
            name = "_";
        }

        //TODO: memoize these calls?
        var list = new NOA.List(this);
        var l = this.cells.length;

        var basescope = NOA.impl.getCurrentScope();
        
        var insert = function(index, value) {
            
            var source = this.parent.cell(index);
            var scope = NOA.impl.newScope(basescope);
            scope[name] = source;
            
            var a = new NOA.core.Expression(null, func, scope, this, source); //source will be both available as this.variable('name') or as the first arg in 'func'. 
  //TODO:?          a = a.listenTo(source, 'free', a.die or free); //destruct on free ASAP, othwerise unnecesary applications will be triggered.

            //first create the new cell with the value, then start listening (otherwise a temp cell would create unecessary events)
            this.insert(index, a);
            //a.setTarget(this.cell(index));
        };

        //map all cells
        for(var i = 0; i < l; i++) 
            insert.call(list, i, this.cells[i].get());
            
        list.listenTo(this, 'insert', insert);
            
        list.listenTo(this, 'remove', function(index) {
            this.remove(index);
        });
        
        list.listenTo(this, 'move', function(from, to) {
            this.move(from, to);
        });
        
        return list;
    },
    
    /**
     * Constructs a new list with all the items of which func applies true. If name is defined, the current value to which the filter is applied is available
     * in func as this.variable(x), or, as the first argument
     * @param  {[type]} name of the variable in the scope [description]
     * @param  {[type]} func [description]
     * @return {[type]}
     */
    filter : function(name, func) {
        if (func === undefined) {
            func = name;
            name = "_";
        }

        var mapping = [];
        
        var list = new NOA.List(this);
        var maplist =  list._filtermap = this.map(name, func).debugName("filterHelperMap").live(); //use a map to react properly to result changes and avoid code duplication
        list.onFree(maplist, maplist.die); //make the maplist come to live
        

        function updateMapping(index, delta, to) {
            var l = to ? to : mapping.length;
            for(var i = index; i < l; i++) {
                var m = mapping[i];
                mapping[i] = [m[0] + delta, m[1]];
            }
        }

        function insert(index, value){
            var tidx = 0, l = mapping.length; 
            if (index < l)
                tidx = mapping[index][0];
            else if (l > 0)
                tidx = mapping[l-1][0] +1; //+1? 

            if (value == true) {
                //insert new entry in the mapping
                mapping.splice(index, 0, [tidx, true]);
                //update all next entries in the mappings with +1.
                updateMapping(index + 1, 1);
                //insert the proper value from parent. A cell will be followed automatically
                this.insert(tidx, this.parent.cell(index));
            }
            else
                //just insert the new entry, no further update needed
                mapping.splice(index, 0, [tidx, false]); //nothing changed, but insert extra record in the mapping
            
        };
        list.listenTo(maplist, 'insert', insert);
        
        list.listenTo(maplist, 'set', function(index, should) {
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
                this.insert(tidx, this.parent.cell(index));
        	}
            else {
                this.remove(tidx);
                mapping[index] = [tidx, false];
                updateMapping(index + 1 -1);
            }
        });

            
        list.listenTo(maplist, 'remove', function(index) {
            //debugger;
            var tidx = mapping[index][0];
            var has =  mapping[index][1];
                        
            if (has) {
                this.remove(tidx);
                updateMapping(index +1, -1);
            }
                
            mapping.splice(index, 1);
        });
        
        list.listenTo(maplist, 'move', function(from, to){
        	var tidx = mapping[to][0];
        	var fidx = mapping[from][0];
        	var hasf = mapping[from][1];
        	
            if (hasf) 
                this.move(fidx, tidx);

        	if (to < from) {
        		if (hasf)
        			updateMapping(to, 1, from -1);
        		mapping.splice(from, 1);
        		mapping.splice(to, 0, [tidx, hasf]);
            }
            else { //to > from
				if (hasf)
					updateMapping(from + 1 , -1, to); //to -1 ?
				mapping.splice(to, 0, [tidx, hasf]);
				mapping.splice(from, 1);            	
            }
        });

        maplist.replayInserts(this, insert);

        return list; 
    },
    
    subset : function(begin, end) {
		var list = new NOA.List(this);
        var l = Math.min(this.cells.length, end);
        ////debugger;
        //map all cells
        for(var i = begin; i < l; i++)
            list.add(this.cells[i].getValue());
            
        function removeLast() {
        	if (list.cells.length > end - begin)
        			list.remove(list.cells.length - 1); //remove the last
        }
        
        function addLast() {
    		if (end < list.parent.cells.length) //add another item at the end
    			list.add(list.parent.cells[end].get()); 
        }
        
        function removeFirst() {
        	if (end - begin > 0)
        		list.remove(0); //remove the first
        	
        }
        
        function addFirst() {
        	if (begin < list.parent.cells.length)
    			list.insert(0, list.parent.cells[begin].get()); //insert the new first item
        }
            
        list.listenTo(this, 'insert', function(index, value) {
        	if (index < begin) { //Item inserted before the subset
        		removeLast();
        		addFirst();
        	}
        	else if (index >= begin && index < end) { //item inserted within the subset
        		removeLast();
            	this.insert(index - begin, value);
           }
        });
            
        list.listenTo(this, 'set', function(index, value) {
        	if (index >= begin && index < end)
            	this.set(index - begin, value);
        });
            
        list.listenTo(this, 'remove', function(index) {
            if (index < begin) { 
                removeFirst();
                addLast();
            }
            else if (index >= begin && index < end) { 
                
                this.remove(index - begin); //remove the item in the list
                
                addLast();  
            }
        });
        
        list.listenTo(this, 'move', function(from, to) {
        	if ((from < begin && to < begin) || (from > end && to > end))
        		return; //not interesting, out the range and both on the same side
        	
        	var f = from - begin;
        	var t = to - begin;
        	var l = end - begin;
        	
        	if (f >= 0 && f < l && t >= 0 && t <  l) //within this subset
        		this.move(f, t);
    		else {
    			//To is in this range (and from is not..)
    			if (t >= 0 && t < l) {
    				this.insert(t, parent.get(from));
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
    },
    
    reverse : function() {
		var list = new NOA.List(this);
        var l = this.cells.length;
        
        //map all cells
        for(var i = l - 1; i>= 0; i--)
            list.add(this.cells[i].getValue());
            
        list.listenTo(this, 'insert', function(index, value) {
        	this.insert(this.cells.length - index, value);
        });
		
		list.listenTo(this, 'set', function(index, value) {
			this.set(index, value);
		});    
            
        list.listenTo(this, 'remove', function(index) {
        	this.remove(this.cells.length - index - 1);
        });
        
        list.listenTo(this, 'move', function(from, to) {
        	this.move(this.cells.length - from - 1, his.cells.length - to - 1);
        });
        
        
        return list;        
    },

    sort : function(comperator) { //TODO: do not support comperators
		var list = new NOA.List(this);
		var mapping = [];
		
		function updateMapping(from, delta) {
        	var l = mapping.length;
        	for(var i = 0; i < l; i++) 
        		if (mapping[i] >= from)
					mapping[i] += delta;
        }

		//Comperator function
		var func = comperator;
		if (comperator == null)
			func = function(a, b) {
				if (a == b)
					return 0;
				else if (a < b)
					return -1;
				else
					return 1;
			};
			
		//Comperator wrap function
		var searcher = function(a, b) {
			return func(a, b.get()); //b is a cell, so unwrap the value
		};
		
		//reusable insert function
		var insert = function(base, value, _knownindex) {
			var nidx = _knownindex;
			if (nidx === undefined) 
				nidx = NOA.util.binarySearch(this.cells, value, searcher);
			
			this.insert(nidx, value);
			updateMapping(nidx, 1);		
			mapping.splice(base, 0, nidx);	
		};
		
		var remove = function(base) {
			var idx = mapping[base];
			this.remove(idx);
			updateMapping(idx, -1);		
			mapping.splice(base, 1);		
		}
		
		var set = function(index, value) {
            var baseidx = mapping[index];
			var nidx = NOA.util.binarySearch(this.cells, value, searcher);
			if (nidx != baseidx) {
				remove.call(this, index);
				insert.call(this, index, value, nidx);
			}
			else //just update
				this.set(index, value);
       	};
		
		var l = this.cells.length;
		for(var i = 0; i < l; i++)
			insert.call(list, i, this.cells[i].getValue());
			
		list.listenTo(this, 'insert', insert);
			
		list.listenTo(this, 'set', set);
            
        list.listenTo(this, 'remove', remove);

		//no need to listen to move

		return list;        
    },
    
    distinct : function() {
    	var occ = {};
    	
    	var toKey = function(value) {
    		if (value === null || value === undefined)
    			return "";
    		if (NOA.core.Base.isA(value)) 
    			return "$$NOA#" + value.noaid;
    		return value.toString();
    	}
    	
    	var l = this.cells.length;
    	var list = new NOA.List(this);
    	
    	var insert = function(index, value) {
    		var key = toKey(value);
    		var has = key in occ;
    		if (!has) {
    			this.add(value);
    			occ[key] =  1;
    		}
    		else
    			occ[key] += 1;
    	};
    	
    	var remove = function(index, value) {
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
    		insert.call(list, i, this.cells[i].getValue()); 
    	
    	list.listenTo(this, 'insert', insert);
			
		list.listenTo(this, 'set', function(index, value, orig) {
			remove.call(this, index, orig);
			insert.call(this, index, value);	
		});
            
        list.listenTo(this, 'remove', remove);
        
        //no need to listen to move
        
        return list;
    },

    join : function() {
  //      debugger;
        var list = new NOA.List(this);
        //list with item -> [offset, length]
        var lmap = [];

        var updateLmap = function(index, delta) {
            lmap[index][1] += delta;
            for(var i = index + 1; i < lmap.length; i++)
                lmap[i][0] += delta; 
        }

        var setupSublist = function(index, sublist) {
            var cell = list.parent.cell(index); //the cell knows our position in lmap reliable when handling events
            var sublistInsert = function(subindex, subvalue) {
                this.insert(lmap[cell.index][0] + subindex, subvalue);
                updateLmap(cell.index, +1);
            }

            sublist.replayInserts(list, sublistInsert);
            
            list.listenTo(sublist, 'insert', sublistInsert);
            list.listenTo(sublist, 'move', function(sf, st) {
                this.move(lmap[cell.index][0] + sf, lmap[cell.index][0] + st);
            });
            list.listenTo(sublist, 'remove', function(sf) {
                this.remove(lmap[cell.index][0] + sf);
                updateLmap(cell.index, -1);
            });
            list.listenTo(sublist, 'set', function(sf, value) {
                this.set(lmap[cell.index][0] + sf, value);
            });
        }

        var insert = function(index, value) {
            var start = index == 0 ? 0 : lmap[index -1][0] + lmap[index -1][1];
            if (!NOA.List.isA(value)) { //plain value, insert right away
                lmap.splice(index, 0, [start,1]);
                list.insert(start, value);
            }
            else { //list
                lmap.splice(index, 0, [start, 0]);
                setupSublist(index, value);
            }
        }

        var remove = function(index, value) {
            if (NOA.List.isA(value)) {
                list.debug("removed list " + value + " at " + index);
                list.unlistenTo(value, 'insert');
                list.unlistenTo(value, 'set');
                list.unlistenTo(value, 'remove');
                list.unlistenTo(value, 'move');
            }

            var size = lmap[index][1];
            updateLmap(index, -1*size);
            for(var i = 0; i < size; i++)
                list.remove(lmap[index][0]);
            lmap.splice(index, 1);
        }

        this.replayInserts(list, insert);
        list.listenTo(this, 'insert', insert);
        list.listenTo(this, 'set', function(index, newvalue, oldvalue) {
           remove(index, oldvalue);
           insert(index, newvalue); 
        });
        list.listenTo(this, 'remove', remove);
        list.listenTo(this, 'move', function(from, to) {
            //this can be done in an intelligent way by moving the items, but, its complicated since we already captured in the scope
           //just, copy the original from and to value and re-apply remove and insert at the proper indexes
           remove(from, this.parent.get(from)); //pass the old value to remove, to unlisten the changes
           insert(from, this.parent.get(from));
           remove(to, this.parent.get(to)); //pass the old value
           insert(to, this.parent.get(to));
        });

        return list;
    },
    
    /** aggregate */

    size : function() {
        
    },
    
    sum : function() {
        
    },
    
    min : function() {
        
    },
    
    max : function() {
        
    },
    
    avg : function() {
        
    },
    
    count : function() {
        
    },
    
    first : function() {
        
    },
    
    last : function() {
        
    },
    
    /** util functions */
    
    add : function(value, cont) {
        this.insert(this.cells.length, value);   
        //return this.cells.length - 1;
        return this;
    },
    
    get : function(index, scope, onchange) {
        return this.cells[index].get(scope, onchange);
    },
    
    toArray : function() {
    	var res = [];
        var l = this.cells.length;
        for(var i = 0; i < l; i++)
            res.push(this.get(i));
        return res;
    },
    
    removeAll : function(value) {
    	for(var i = this.cells.length -1 ; i >=0; i--) {
    		if (this.get(i) == value)
    			this.remove(i);
    	}
    },

    free : function() {
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

});

});