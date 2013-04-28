///<reference path='../noa.ts'/>
module NOA {


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

}