///<reference path='../noa.ts'/>
module NOA {

	export class JoinedList extends ListTransformation {

		lmap : any[] = []; //list with [startindex, length]

		constructor(source: List) {
			super(source);
			source.replayInserts(this, this.onSourceInsert);
		}

		updateLmap  (index : number, delta : number) {
			this.lmap[index][1] += delta;
			for (var i = index + 1; i < this.lmap.length; i++)
				this.lmap[i][0] += delta;
		}

		getOffset(index: number, subindex: number = 0): number {
			if (index< 0 || index > this.lmap.length)
				throw new Error("out of bounds: " + index);

		    if (index == 0)
		        return 0 + subindex;
		    if (index == this.lmap.length) {
		    	if (subindex != 0)
		    		throw new Error("Out of bounds")
		    	return this.lmap[index - 1][0] + this.lmap[index - 1][1];
		    }
		    return this.lmap[index][0] + subindex;
		}

		getLength(index: number): number {
		    return this.lmap[index][1];
		}

		insertLmap(index: number, length: number) {
			var start = index == 0 ? 0 : this.lmap[index - 1][0] + this.lmap[index - 1][1];
            this.lmap.splice(index, 0, [
                start, 
                0
            ]);
            this.updateLmap(index, length);
		}

		removeLmap(index: number) {
		    var size = this.lmap[index][1];
		    var start = this.lmap[index][0];
		    this.updateLmap(index, -1 * size);
		    this.lmap.splice(index, 1);
		}

		setupSublist (index : number, sublist: List) {
			var cell = this.source.cell(index); //the cell knows our position in lmap reliable when handling events, so the join transformation does not need to track that.

			var sublistInsert = function (subindex, _, subcell) {
				this.insert(this.getOffset(cell.index, subindex), subcell);
				this.updateLmap(cell.index, +1);
			}

			var start = this.lmap[index][0];
			sublist.replayInserts(this, (subindex, _, subcell) => {
			    this.insert(start + subindex, subcell);
			});

			sublist.onInsert(this, sublistInsert);
			sublist.onMove(this, function (sf : number, st : number) {
			    this.move(this.getOffset(cell.index, sf), this.getOffset(cell.index, st)); 
			});

			sublist.onRemove(this, function (sf : number) {
			    this.remove(this.getOffset(cell.index, sf)); 
				this.updateLmap(cell.index, -1);
			});
		}

		unregisterSublist(value) {
		    if (value instanceof List) {
		        this.unlisten(value, 'insert');
		        this.unlisten(value, 'remove');
		        this.unlisten(value, 'move');
		    }
		}

		onSourceInsert(index : number, value, cell) {
			if (!(value instanceof List)) { //plain value, insert right away
			    this.insertLmap(index, 1);
				this.insert(this.getOffset(index), value, cell);
			}
			else { //list
                this.insertLmap(index, (<List>value).cells.length);
				this.setupSublist(index, value);
			}
		}

		onSourceRemove (index : number, value) {
		    this.unregisterSublist(value);

			var start = this.getOffset(index);
			var size = this.getLength(index);
			this.updateLmap(index, -1 * size);
			this.lmap.splice(index, 1);
			for (var i = 0; i < size; i++)
				this.remove(start);
		}

		onSourceSet(index: number, newvalue, oldvalue, cell) {
		    var curlength = this.getLength(index);
		    var newlength = newvalue instanceof List ? (<List>newvalue).cells.length : 1;
		    this.updateLmap(index, newlength - curlength);

		    this.unregisterSublist(oldvalue);
		    var start = this.getOffset(index);

		    for (var i = 0; i < curlength; i++)
		        this.remove(start);

		    this.setupSublist(index, newvalue);
		};

        onSourceMove(from: number, to: number) {
		    var length = this.getLength(from);
		    var startf = this.getOffset(from);
            
            //update lmap
		    this.updateLmap(from, -1 * length);
		    this.lmap.splice(from, 1);
		    this.insertLmap(to, length);

            //move
		    var startt = this.getOffset(to); //new index at which we will be inserting
		    if (from < to) {
		    	var pl = this.getLength(to-1); //length of prevous item. -2, since lmap is already updated
		        startt = startt + pl - 1;
		        //console.log("move right " + startf + " -> " + startt)
		    	for (var i = 0; i < length; i++)
		        	this.move(startf, startt);
		    }
		    else
		    	for (var i = 0; i < length; i++)
		        	this.move(startf + i, startt + i);
		};

	}

}