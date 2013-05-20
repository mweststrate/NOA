///<reference path='noa.ts'/>

module NOA {

	/**
		TODO: make cell not depend on parent, than it can be reused among multiple parents, and be passed around
		in, for example, sublist, reverse, count, summ, aggregations and such

		replayInserts should have an variant which does not care about ordering
	*/
	/*
	export class Cell extends Variable implements IValue , IPlainValue {

		private parent: CellContainer;
		private indexes: any;
		//index  : any = -1; //int or string

	constructor(parent: CellContainer, value: IValue, origin?: CellContainer) {
			super(ValueType.Any, value);
			this.parent = parent;
			this.indexes = {};


		}

		origin: CellContainer;
		public getOrigin(): CellContainer {
			return this.origin;
		}



		//TODO: parse new value to List / Record if Array / Object
		set(newvalue: any) {
			if(this.destroyed)
				return;

			this.debugIn("Receiving new value: " + newvalue);

			super.set(LangUtils.toValue(newvalue), true);

			this.debugOut();
		}


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
			return ("[Cell#" + this.noaid + //" of " +
				//(this.parent ? this.parent.toString() + "@" + this.index : "") +
				"=" + this.value +"]");
		}

	}*/
}
//@ sourceMappingURL=cell.js.map