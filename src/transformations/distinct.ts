///<reference path='../noa.ts'/>
module NOA {

	export class DistinctList extends ListTransformation {

		occ = {};

		constructor(source: List) {
			super(source);
			source.replayInserts(this, this.onSourceInsert)
			this.unlisten(source, 'move')
		}

		toKey (value) {
			if (value === null || value === undefined)
				return "";
			if (value instanceof Base)
				return "$$NOA#" + value.noaid;
			return value.toString();
		}

		onSourceInsert (index : number, value, cell) {
			var key = this.toKey(value);
			var has = key in this.occ;
			if (!has) {
				this.add(value, cell);
				this.occ[key] = 1;
			}
			else
				this.occ[key] += 1;
		};

		onSourceRemove (index : number, value) {
			var key = this.toKey(value);
			var has = key in this.occ;
			if (has) {
				this.occ[key] -= 1;
				if (this.occ[key] == 0) {
					this.removeAll(value);
					delete this.occ[key];
				}
			}
		};


		onSourceSet(index: number, newvalue, origvalue, cell) {
			this.onSourceRemove(index, origvalue);
			this.onSourceInsert(index, newvalue, cell);
		};

		toAST(): Object {
			return this.toASTHelper("distinct");
		}
	}
}