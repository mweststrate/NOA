///<reference path='../noa.ts'/>
module NOA {

	export class ListTransformation extends List {
		source : List; //TODO: remove parent?

		constructor (source : List) {
			super();
			this.source = source;
			this.uses(source);

			source.onFree(this, () => {
			//	debugger;
				this.free()
			})

			source.onInsert(this, this.onSourceInsert);

			source.onSet(this, this.onSourceSet);

			source.onMove(this, this.onSourceMove);

			source.onRemove(this, this.onSourceRemove);

		}

		onSourceInsert (index : number, value, cell: Cell) { }

		onSourceRemove(index: number, value) { }

		onSourceMove(from : number, to : number) { }

		onSourceSet(index: number, newvalue, oldvalue, cell: Cell) { }
	}

	//TODO:
	//NumberFilter, and use it inside, min,max,avg and such. Numberfilter is just List.map(NOA.util.isNumber)

	//AttributeMap(list, attr):
	//  list.filter(x, x instanceof NOA.Record)
	//      .filter(y, y.getKeys().contains(attr))
	//      .map(z, z.get(attr));

	//Unmap

	//Contains(col, value)
	//  if (col instanceof List) -> col.distinct().contains(value) //assumes distinct is sorted and has effecient contains
	//  if (col instanceof Record) -> col.getKeys().contains(col, value) //Note: can be made more effecient by not using distinct but direclty operate getKeys
	//  else -> ImmutableValue(false)
	//  If result is list, subscribe to insert and remove

	//Intersect

	//Union

	//Substract

	//Other list math
}