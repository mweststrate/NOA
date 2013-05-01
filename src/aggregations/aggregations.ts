///<reference path='../noa.ts'/>
module NOA {
	export class ListAggregation extends ValueContainer { //Generic on return type!
		source: List; //TODO: remove parent?
		value;

		constructor(source: List) {
			super();
			//TODO: register at parent so the aggregate can be freed
			this.source = source;
			this.uses(source);

			source.onFree(this, () => this.free())

			source.onInsert(this, this.onSourceInsert);

			source.onSet(this, this.onSourceSet);

			source.onMove(this, this.onSourceMove);

			source.onRemove(this, this.onSourceRemove);

		}

		onSourceInsert(index: number, value, cell: Cell) { }

		onSourceRemove(index: number, value) { }

		onSourceMove(from: number, to: number) { }

		onSourceSet(index: number, newvalue, oldvalue, cell: Cell) { }

		updateValue(newvalue, cell?: Cell) {
			if (newvalue != this.value) {
				var old = this.value;
				this.value = newvalue;

				var origin: CellContainer = null;
				if (cell)
					origin = cell.getOrigin();
				else if (newvalue instanceof ValueContainer)
					origin = (<ValueContainer>newvalue).getOrigin();

				this.setOrigin(origin);
				this.changed(newvalue, old);
			}
		}

		toAST(): Object {
			Util.notImplemented();
			return null;
		}

		toASTHelper(name: string, ...args: any[]): Object { //MWE: note, similar to transformation!
			return {
				type: 'function',
				name: name,
				source: this.source.getRef(),
				args: args
			}
		}

	}

	export class ListCount extends ListAggregation {

		value: number = 0;

		constructor(source: List) {
			super(source);
			this.unlisten(source, 'move')
			this.unlisten(source, 'set')
		}

		onSourceInsert(index: number, value) {
			this.updateValue(this.value + 1)
		}

		onSourceRemove(index: number, value) {
			this.updateValue(this.value - 1)
		}

		toAST(): Object {
			return this.toASTHelper("count");
		}

	}

	//TODO: just replace by numberfilter().count()
	export class ListNumberCount extends ListAggregation {

		value: number = 0;

		constructor(source: List) {
			super(source);
			this.unlisten(source, 'move')
		}

		onSourceInsert(index: number, value) {
			if (Util.isNumber(value))
				this.updateValue(this.value + 1)
		}

		onSourceRemove(index: number, value) {  //TODO: check if remove provides old value!
			if (Util.isNumber(value))
				this.updateValue(this.value - 1)
		}

		onSourceSet(index: number, newvalue, oldvalue) {
			var lin = Util.isNumber(newvalue);
			var rin = Util.isNumber(oldvalue);
			if (lin && !rin)
				this.updateValue(this.value + 1)
			else if (rin && !lin)
				this.updateValue(this.value - 1);
		}

		toAST(): Object {
			return this.toASTHelper("numbercount");
		}
	}

	export class ListSum extends ListAggregation {

		value: number = 0;

		constructor(source: List) {
			super(source);
			this.unlisten(source, 'move')
		}

		onSourceInsert(index: number, value) {
			if (Util.isNumber(value))
				this.updateValue(this.value + value)
		}

		onSourceRemove(index: number, value) {
			if (Util.isNumber(value))
				this.updateValue(this.value - value)
		}

		onSourceSet(index: number, newvalue, oldvalue) {
			var delta = 0;
			if(Util.isNumber(newvalue))
				delta += newvalue;
			if (Util.isNumber(oldvalue))
				delta -= oldvalue;
			this.updateValue(this.value + delta);
		}

		toAST(): Object {
			return this.toASTHelper("sum");
		}
	}


	//TODO: just use an experssion for this based on count and sum
	/*
	export class ListAverage extends ListAggregation {

		value: number = 0;
		sum : ListSum;
		count: ListCount;

		constructor(source: List) {
			super(source);
			this.unlisten(source, 'move')
			this.unlisten(source, 'set')
			this.unlisten(source, 'remove')
			this.unlisten(source, 'insert')

			source.aggregate(List.Aggregates.sum);
			this.sum = source.aggregates[List.Aggregates.sum];
			this.sum.live();

			source.aggregate(List.Aggregates.numbercount);
			this.count = source.aggregates[List.Aggregates.numbercount]
			this.count.live();

			this.sum.get(null, this.listChanged);
			this.count.get(null, this.listChanged);

			this.listChanged();
		}

		listChanged() {
			if (this.count.get() == 0)
				this.updateValue(0);
			this.updateValue(this.sum.get() / this.count.get());
		}

		free() {
			this.count.die();
			this.sum.die();
			super.free();
		}

		toAST(): Object {
			return this.toASTHelper("avg");
		}

	}
	*/

	export class ListMax extends ListAggregation {

		value: number = 0;

		constructor(source: List) {
			super(source);
			this.unlisten(source, 'move')

			this.findNewMax();
		}

		findNewMax () {
			var max = -1 * (1/0); // -INF
			var maxcell = null;

			Util.each(this.source.cells, cell => {
				var v = cell.get();
				if (Util.isNumber(v))
					if (v > max) {
						max = v;
						maxcell = cell;
					}
			})
			this.updateValue(max, maxcell);
		}

		onSourceInsert(index: number, value, cell) {
			if (Util.isNumber(value) && value > this.value)
				this.updateValue(value, cell);
		}

		onSourceRemove(index: number, value) {
			if (Util.isNumber(value) && value >= this.value)
				this.findNewMax();
		}

		onSourceSet(index: number, newvalue, oldvalue) {
			if (Util.isNumber(oldvalue) && oldvalue >= this.value)
				this.findNewMax();
		}

		toAST(): Object {
			return this.toASTHelper("max");
		}
	}

	export class ListMin extends ListAggregation {

		value: number = 0;

		constructor(source: List) {
			super(source);
			this.unlisten(source, 'move')

			this.findNewMin();
		}

		findNewMin () {
			var min = 1 * (1/0); // +NF
			var mincell = null;

			Util.each(this.source.cells, cell => {
				var v = cell.get();
				if (Util.isNumber(v))
					if (v < min) {
						min = v;
						mincell = cell;
					}
			})
			this.updateValue(min, mincell);
		}

		onSourceInsert(index: number, value, cell:Cell) {
			if (Util.isNumber(value) && value < this.value)
				this.updateValue(value, cell);
		}

		onSourceRemove(index: number, value) {
			if (Util.isNumber(value) && value <= this.value)
				this.findNewMin();
		}

		onSourceSet(index: number, newvalue, oldvalue) {
			if (Util.isNumber(oldvalue) && oldvalue <= this.value)
				this.findNewMin();
		}

		toAST(): Object {
			return this.toASTHelper("min");
		}
	}


	export class ListIndex extends ListAggregation {

		index: number;
		realindex : number;

		constructor(source: List, index: number) {
			super(source);
			this.unlisten(source, 'set')
			this.index = index;
			this.updateRealIndex();
			this.update();
		}

		updateRealIndex() {
			this.realindex = this.index < 0 ? this.source.cells.length - this.index : this.index;
		}

		update() {
			if (this.realindex < 0 || this.realindex >= this.source.cells.length)
				this.updateValue(null)
			else
				this.updateValue(this.source.cell(this.realindex));
		}

		onSourceInsert(index: number, value) {
			this.updateRealIndex();
			this.update();
		}

		onSourceRemove(index: number, value) {
			this.updateRealIndex();
			this.update();
		}

		onSourceMove(from: number, to: number) {
			if (from == this.realindex || to == this.realindex)
				this.update();
		}
/*
		onSourceSet(index: number, newvalue) {
			if (index == this.realindex)
				this.updateValue(newvalue);
		}*/

		toAST(): Object {
			return this.toASTHelper("index", this.index);
		}
	}

	export class ListFirst extends ListIndex {
		constructor(source: List) {
			super(source, 0);
		}

		toAST(): Object {
			return this.toASTHelper("first");
		}
	}

	export class ListLast extends ListIndex {
		constructor(source: List) {
			super(source, -1);
		}

		toAST(): Object {
			return this.toASTHelper("last");
		}
	}
}