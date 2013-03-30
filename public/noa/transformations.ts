module NOA {

	class ListTransformation extends NOA.List {
		source = List; //TODO: remove parent?

		constructor (source : NOA.List) {
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

	public class ListAggregation extends NOA.ValueContainer { //Generic on return type!
		source = List; //TODO: remove parent?
		value;

		constructor (source : NOA.List) {
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

}