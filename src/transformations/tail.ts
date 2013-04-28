///<reference path='../noa.ts'/>
module NOA {

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
				if (this.source.cells.length > this.start)
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
}