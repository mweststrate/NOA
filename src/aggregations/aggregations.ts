///<reference path='../noa.ts'/>
module NOA {

	//TODO: aggregations should listen to input arguments if applicable

	export class ListAggregation extends Expression { //TODO: should be variable //Generic on return type!
		//TODO: make aggregations evaluate on first evaluation

		source: IList; //TODO: remove parent?

		constructor(source: IList) {
			super([source]);
			//TODO: register at parent so the aggregate can be freed
			this.source = source;
			this.uses(source);

			source.onFree(this, () => this.free())

			source.onInsert(this, this.onSourceInsert, false);

			source.onSet(this, this.onSourceSet);

			source.onMove(this, this.onSourceMove);

			source.onRemove(this, this.onSourceRemove);

		}

		startup() {
			//MWE: needed, because super constructs are always called before any local fiels are initialized :-(
			this.source.each(this, this.onSourceInsert);
		}

		onSourceInsert(index: number, value) { }

		onSourceRemove(index: number, value) { }

		onSourceMove(from: number, to: number) { }

		onSourceSet(index: number, newvalue, oldvalue) { }



		toAST(): Object {
			Util.notImplemented();
			return null;
		}

		toASTHelper(name: string, ...args: any[]): Object { //MWE: note, similar to transformation!
			args.unshift(this.source);
			return Serializer.serializeFunction(name, args);
		}
	}

	export class ListCount extends ListAggregation {

		constructor(source: List) {
			super(source);
			this.unlisten(source, ListEvent.MOVE.toString())
			this.unlisten(source, ListEvent.SET.toString())
			this.startup();
		}

		onSourceInsert(index: number, value) {
			this.set(this.value() + 1)
		}

		onSourceRemove(index: number, value) {
			this.set(this.value() - 1)
		}

		toAST(): Object {
			return this.toASTHelper("count");
		}
	}

	//TODO: just replace by numberfilter().count()
	export class ListNumberCount extends ListAggregation {

		constructor(source: IList) {
			super(source);
			this.unlisten(source, ListEvent.MOVE.toString())
			this.startup();
		}

		onSourceInsert(index: number, value) {
			if (Util.isNumber(value))
				this.set(this.value() + 1)
		}

		onSourceRemove(index: number, value) {  //TODO: check if remove provides old value!
			if (Util.isNumber(value))
				this.set(this.value() - 1)
		}

		onSourceSet(index: number, newvalue, oldvalue) {
			var lin = Util.isNumber(newvalue);
			var rin = Util.isNumber(oldvalue);
			if (lin && !rin)
				this.set(this.value() + 1)
			else if (rin && !lin)
				this.set(this.value() - 1);
		}

		toAST(): Object {
			return this.toASTHelper("numbercount");
		}
	}

	export class ListSum extends ListAggregation {

		constructor(source: IList) {
			super(source);
			this.unlisten(source, ListEvent.MOVE.toString())
			this.startup();
		}

		onSourceInsert(index: number, value) {
			if (Util.isNumber(value))
				this.set(this.value + value)
		}

		onSourceRemove(index: number, value) {
			if (Util.isNumber(value))
				this.set(this.value - value)
		}

		onSourceSet(index: number, newvalue, oldvalue) {
			var delta = 0;
			if(Util.isNumber(newvalue))
				delta += newvalue;
			if (Util.isNumber(oldvalue))
				delta -= oldvalue;
			this.set(this.value() + delta);
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
			this.unlisten(source, ListEvent.MOVE.toString())
			this.unlisten(source, ListEvent.SET.toString())
			this.unlisten(source, ListEvent.REMOVE.toString())
			this.unlisten(source, ListEvent.INSERT.toString())

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
				this.set(0);
			this.set(this.sum.get() / this.count.get());
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

	//TODO: Min / Max should initialize to NONE instead of INF.
	export class ListMax extends ListAggregation {

		constructor(source: List) {
			super(source);
			this.unlisten(source, ListEvent.MOVE.toString())

			this.findNewMax();
		}

		findNewMax () {
			var max = -1 * (1/0); // -INF

			this.source.each(this, (index, v) => {
				if (Util.isNumber(v))
					if (v > max) {
						max = v;
					}
			})
			this.set(max);
		}

		onSourceInsert(index: number, value) {
			if (Util.isNumber(value) && value > this.value)
				this.set(value);
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

		constructor(source: List) {
			super(source);
			this.unlisten(source, ListEvent.MOVE.toString())

			this.findNewMin();
		}

		findNewMin () {
			var min = 1 * (1/0); // +INF

			this.source.each(this, (index, v) => {
				if (Util.isNumber(v))
					if (v < min) {
						min = v;
					}
			})
			this.set(min);
		}

		onSourceInsert(index: number, value) {
			if (Util.isNumber(value) && value < this.value)
				this.set(value);
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

		constructor(source: IList, index: number) {
			super(source);
			this.unlisten(source, ListEvent.SET.toString())
			this.index = index;
			this.updateRealIndex();
			this.update();
		}

		updateRealIndex() {
			this.realindex = this.index < 0 ? this.source.size() - this.index : this.index;
		}

		update() {
			if (this.realindex < 0 || this.realindex >= this.source.size())
				this.set(null)
			else
				this.set((<List>this.source).cell(this.realindex)); //TODO: fix cast
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
				this.set(newvalue);
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