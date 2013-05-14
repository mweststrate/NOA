///<reference path='noa.ts'/>

module NOA {

	/**
		TODO: make cell not depend on parent, than it can be reused among multiple parents, and be passed around
		in, for example, sublist, reverse, count, summ, aggregations and such

		replayInserts should have an variant which does not care about ordering
	*/
	export class Cell extends Variable implements IValue , IPlainValue {

		private parent : CellContainer;
		index  : any = -1; //int or string

/* TODO: restore orign		constructor(parent: CellContainer, index: number, value: ValueContainer);
		constructor(parent: CellContainer, index: string, value: ValueContainer);
*/		constructor(parent: CellContainer, index: string, value: IValue, origin?: CellContainer);//MWE: fix: origin not optional
		constructor(parent: CellContainer, index: number, value: IValue, origin?: CellContainer);
		constructor(parent: CellContainer, index: any, value: IValue, origin?: CellContainer) {
			super(ValueType.Any, value);
			this.parent = parent;
			this.index = index;

/*TODO: restore origin and such			if (origin)
				this.setOrigin(origin)
			else if(value instanceof ValueContainer)
				this.setOrigin((<ValueContainer> value).getOrigin())
*/
		}

		origin: CellContainer;
		public getOrigin(): CellContainer {
			return this.origin;
		}

/*		public setOrigin(origin: CellContainer) {
			this.origin = origin;
		}
*/

		//TODO: parse new value to List / Record if Array / Object
		set(newvalue) {
			if(this.destroyed)
				return;

			this.debugIn("Receiving new value: " + newvalue);

			super.set(newvalue, true);

			this.debugOut();
		}

/*
		get (): any;
		get (caller: Base, onchange: (newvalue: any, oldvalue: any) => void , fireInitialEvent?: bool): any;
		get (caller?: Base, onchange?: (newvalue: any, oldvalue: any) => void , fireInitialEvent?: bool): any {

			if (this.hasPlainValue()) {
				var expr = <ValueContainer> super.get(caller, onchange, true);
				//MWE: note, we do not have to listen to the expression, because the expression onChange already causes this cell to update :), so we would be listening twice;
				var value = expr.get();

				if (onchange && fireInitialEvent !== false)
					onchange.call(caller, value);

				return value;
			}
			else
				return super.get(caller, onchange, fireInitialEvent);
		}
*/
		live () {
			if(this.parent)
				this.parent.live();
			else
				super.live();
			return this;
		}

		die () {
			if(this.parent)
				this.parent.die();
			else
				super.die();
			return this;
		}

		toAST(): Object {
			return Serializer.serialize(this.get());
		}

		toString () : string {
			return ("[Cell(" + this.noaid +"): " +
				(this.parent ? this.parent.toString() + "#" + this.index : "") +
				"=" + this.value +"]");
		}

	}
}
//@ sourceMappingURL=cell.js.map