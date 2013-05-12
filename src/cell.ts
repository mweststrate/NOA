///<reference path='noa.ts'/>

module NOA {

	/**
		TODO: make cell not depend on parent, than it can be reused among multiple parents, and be passed around
		in, for example, sublist, reverse, count, summ, aggregations and such

		replayInserts should have an variant which does not care about ordering
	*/
	export class Cell extends ValueContainer implements IValue , IPlainValue {

		private parent : CellContainer;
		index  : any = -1; //int or string
		private initialized : bool = false;

		constructor(parent: CellContainer, index: number, value: ValueContainer);
		constructor(parent: CellContainer, index: string, value: ValueContainer);
		constructor(parent: CellContainer, index: string, value: any, origin: CellContainer);
		constructor(parent: CellContainer, index: number, value: any, origin: CellContainer);
		constructor(parent: CellContainer, index: any, value: any, origin?: CellContainer) {
			super();
			this.parent = parent;
			this.index = index;

			if (origin)
				this.setOrigin(origin)
			else if(value instanceof ValueContainer)
				this.setOrigin((<ValueContainer> value).getOrigin())

			this.set(value);
			this.initialized = true;
		}

		hasExpression () {
			return this.value instanceof ValueContainer;
		}

		//TODO: parse new value to List / Record if Array / Object
		set(newvalue) {
			if(this.destroyed)
				return;

			this.debugIn("Receiving new value: " + newvalue);

			var orig = this.value;

			if(newvalue != orig) {
				var oldvalue = orig;
				if(this.hasExpression()) {
					oldvalue = orig.get();
					this.unlisten(<Base>orig, 'change');
				}

				if(newvalue instanceof Base)
					newvalue.live();

				if(orig instanceof Base)
					orig.die();

				this.value = newvalue;

				if(this.hasExpression()) {
					this.debug("now following", newvalue);

					newvalue = (<ValueContainer>newvalue).get(newvalue, (newv, oldv) => {
						this.fireChanged(newv, oldv);
					}, false);
				}

				if (this.initialized)
					this.fireChanged(newvalue, oldvalue);
			}
			this.debugOut();
		}

		fireChanged (newv : any, oldv: any) {
			this.changed(newv, oldv, this);
		}

		get (): any;
		get (caller: Base, onchange: (newvalue: any, oldvalue: any) => void , fireInitialEvent?: bool): any;
		get (caller?: Base, onchange?: (newvalue: any, oldvalue: any) => void , fireInitialEvent?: bool): any {

			if (this.hasExpression()) {
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

		free () {
			if(this.hasExpression())
				this.unlisten(this.value, 'change');

			if(this.value instanceof Base)
				this.value.die();

			//this.changed(undefined); //or fireChanged?
			super.free();
		}

		toAST(): Object {
			return Serializer.serialize(this.get());
		}

		toString () : string {
			return ("[Cell(" + this.noaid +"): " +
			   (this.parent ? this.parent.toString() + "#" + this.index : "") +
			   "=" + this.value +"]");
		}

		
		isError(): boolean {
			return false; //TODO: check expression?
		}

		asError(): Error {
			return <Error> Util.notImplemented();
		}

	}
}
//@ sourceMappingURL=cell.js.map