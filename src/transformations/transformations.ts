///<reference path='../noa.ts'/>
module NOA {

//TODO: transformations should listen to input arguments if applicable


	export class ListTransformation extends List {
		//TODO: make transformation evaluate on first evaluation (that is, first 'cell' call)?

		source : List; //TODO: remove parent?

		constructor(source: List) {
			super();
			this.source = source;
			this.uses(source);

			source.onFree(this, () => {
			//	debugger;
				this.free()
			})

			source.onInsert(this, this.onSourceInsert, false);

			source.onSet(this, this.onSourceSet);

			source.onMove(this, this.onSourceMove);

			source.onRemove(this, this.onSourceRemove);

		}

		startup() {
			//MWE: needed, because super constructs are always called before any local fiels are initialized :-(
			this.source.each(this, this.onSourceInsert);
		}

		onSourceInsert (index : number, value) { }

		onSourceRemove(index: number, value) { }

		onSourceMove(from : number, to : number) { }

		onSourceSet(index: number, newvalue, oldvalue) { }

		toAST(): Object {
			Util.notImplemented();
			return null;
		}

		toASTHelper(name : string, ...args: any[]) : Object {
			return Serializer.serializeFunction(name, args);
		}
	}

	//TODO:
	//NumberFilter, and use it inside, min,max,avg and such. Numberfilter is just List.map(NOA.util.isNumber)

	//AttributeMap(list, attr):
	//  list.filter(x, x instanceof NOA.Record)
	//      .filter(y, y.getKeys().contains(attr))
	//      .map(z, z.get(attr));

	//Unmap. Todo: is unmap useful? Seems to especially useful in combination with max or sort for example.
	//Is its mapping not to extensively implemented now? Can we avoid it being a parameter to many standard functions?

	//Contains(col, value)
	//  if (col instanceof List) -> col.distinct().contains(value) //assumes distinct is sorted and has effecient contains
	//  if (col instanceof Record) -> col.getKeys().contains(col, value) //Note: can be made more effecient by not using distinct but direclty operate getKeys
	//  else -> ImmutableValue(false)
	//  If result is list, subscribe to insert and remove

	//Intersect

	//Union

	//Substract

	//Other list math

	//Copy. Useful for example timestamp() = copy(now())

	//next(x) or previous(x) : Something  to compare with prevous and next value in list
}