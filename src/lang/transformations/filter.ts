///<reference path='../../noa.ts'/>


NOA.LangUtils.define({
	name: "filter",
	argTypes: [NOA.ValueType.List, NOA.ValueType.Function],
	implementation: function(list: NOA.IValue, fun: NOA.IValue) {
		return new NOA.FilteredList(<NOA.IList>list, <NOA.Fun>fun);
	}
	//TODO: can be memoized íf function has no unresolved scope dependencies
});

module NOA {

	export class FilteredList extends ListTransformation {

		parent : List;
		mapping : any[] = [];

		constructor(source: IList, func: Fun);
		constructor(source: IList, func: Function);
		constructor(source: IList, func: any) {
			super(new MappedList(source, func)); //<IList>NOA.Lang.map(source, func));

			this.parent = <List>source;
			this.parent.debugName = (_?: string): any => "FilterMap-for-" + this.debugName();

			this.startup();
		}

		updateMapping (index: number, delta: number, to?: number) {
			var l = to ? to : this.mapping.length;
			for (var i = index; i < l; i++) {
				var m = this.mapping[i];
				this.mapping[i] = [m[0] + delta, m[1]];
			}
		}

		onSourceInsert (index : number, value) {
			var tidx = 0, l = this.mapping.length;
			if (index < l)
				tidx = this.mapping[index][0];
			else if (l > 0)
				tidx = this.mapping[l - 1][0] + 1; //+1?

			if (value === true) {
				//insert new entry in the mapping
				this.mapping.splice(index, 0, [<any>tidx, true]);
				//update all next entries in the mappings with +1.
				this.updateMapping(index + 1, 1);
				//insert the proper value from parent. A cell will be followed automatically
				this.insert(tidx, this.parent.cell(index));
			}
			else
			//just insert the new entry, no further update needed
				this.mapping.splice(index, 0, [<any>tidx, false]); //nothing changed, but insert extra record in the mapping
		}

		onSourceRemove(index: number, value) {
			var tidx = this.mapping[index][0];
			var has = this.mapping[index][1];

			if (has) {
				this.remove(tidx);
				this.updateMapping(index + 1, -1);
			}

			this.mapping.splice(index, 1);
		}

		onSourceMove(from : number, to : number) {
			var tidx = this.mapping[to][0];
			var fidx = this.mapping[from][0];
			var hasf = this.mapping[from][1];

			if (hasf)
				this.move(fidx, tidx);

			if (to < from) {
				if (hasf)
					this.updateMapping(to, 1, from - 1);
				this.mapping.splice(from, 1);
				this.mapping.splice(to, 0, [tidx, hasf]);
			}
			else { //to > from
				if (hasf)
					this.updateMapping(from + 1, -1, to); //to -1 ?
				this.mapping.splice(to, 0, [tidx, hasf]);
				this.mapping.splice(from, 1);
			}
		}

		onSourceSet(index: number, should, _) {
			var tidx = this.mapping[index][0];
			//Note, this func only fires if should changed, so we can rely on that
			if (should) {
				//update new entry in the mapping
				this.mapping[index] = [tidx, true];
				//update all next entries in the mappings with +1.
				this.updateMapping(index + 1, 1);
				//insert the proper value from parent
				this.insert(tidx, this.parent.cell(index));
			}
			else {
				this.remove(tidx);
				this.mapping[index] = [tidx, false];
				this.updateMapping(index + 1, -1);
			}
		}

		toAST(): Object {
			var res : any = this.parent.toAST();
			res.name = 'filter';
			res.args[0] = (<MappedList>this.source).source.toAST();
			return res;
		}

	}

}