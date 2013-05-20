///<reference path='../noa.ts'/>
module NOA {

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

			this.unlisten(source, 'move');

			this.startup();
		}

		updateMapping(from : number, delta : number) {
			var l = this.mapping.length;
			for (var i = 0; i < l; i++)
				if (this.mapping[i] >= from)
					this.mapping[i] += delta;
		}

		//Comperator wrap function
		searcher(a, b: Variable) {
			return this.func(a, b.get()); //b is a cell, so unwrap the value
		}

		//reusable insert function
		onSourceInsert (baseindex: number, value, _knownindex? : number) {
			var nidx = _knownindex;
			if (nidx === undefined)
				nidx = Util.binarySearch(this.cells, value, (a, b) => this.searcher(a,b));

			this.insert(nidx, value);
			this.updateMapping(nidx, 1);
			this.mapping.splice(baseindex, 0, nidx);
		}

		onSourceRemove(baseindex: number, _?) {
			var idx = this.mapping[baseindex];
			this.remove(idx);
			this.updateMapping(idx, -1);
			this.mapping.splice(baseindex, 1);
		}

		onSourceSet (index : number, value) {
			var baseidx = this.mapping[index];
			var nidx = Util.binarySearch(this.cells, value, (a, b) => this.searcher(a,b));
			if (nidx != baseidx) {
				this.onSourceRemove(index);
				this.onSourceInsert(index, value, nidx);
			}
			else //just update
				this.set(index, value);
		}

		toAST(): Object {
			return this.toASTHelper("sort"); //TODO: pass in argumetns
		}
	}
}