///<reference path='../noa.ts'/>
module NOA {

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

		toAST(): Object {
			return this.toASTHelper("subset", this.begin, this.end);
		}
	}
}