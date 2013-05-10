///<reference path='noa.ts'/>
module NOA {

//	export interface IValue {
/*		TODO: need list / record support for get() ? probably not. 
		get (): any;
		get (caller: Base, onChange: (newvalue: any, oldvalue: any) => void ): void;
		get (caller: Base, onChange: (newvalue: any, oldvalue: any) => void , fireInitialEvent: bool): any;
*/		
/*		toAST(): Object;

		toJSON() : any;

		//TODO: getScope?

		//TODO: static unserialize()
	}
	*/

	export class CellContainer extends Base implements IValue {
		
		constructor() {
			super();
		}

		fireCellChanged(index: any, newvalue: any, oldvalue: any, cell: Cell) { Util.notImplemented() }

		cell(index: any): Cell { Util.notImplemented(); return null; }
		toJSON() : any { Util.notImplemented(); return null; }

		toAST(): Object {
			return {
				type: "ref",
				id: this.noaid
			}
		}

		getType() : ValueType {
			throw new Error("CellContainer.getType() is abstract");
		}
	}

	export class ValueContainer extends Base implements IValue {
		value: any; 
		origin: CellContainer;

		constructor() {
			super();
		}

		public getOrigin(): CellContainer {
			return this.origin;
		}

		public setOrigin(origin: CellContainer) {
			this.origin = origin;
		}

		public get (): any;
		public get (caller: Base, onChange: (newvalue: any, oldvalue: any) => void ): void;
		public get (caller : Base, onChange : (newvalue: any, oldvalue: any) => void, fireInitialEvent: bool): any;
		public get (caller?: Base, onChange?: (newvalue: any, oldvalue: any) => void, fireInitialEvent?: bool): any {
			if (onChange)
				this.onChange(caller, onChange);

			if (onChange && fireInitialEvent !== false)
				onChange.call(caller, this.value, undefined);

			return this.value;
		}

		public changed(...args: any[]) {
			var a = Util.makeArray(arguments);
			a.unshift('change');
			this.fire.apply(this, a);
			return this;
		}

		onChange(caller: Base, callback: (newvalue: any, oldvalue: any) => void ) : void{
			this.on('change', caller, callback);
		}

		toAST(): Object { Util.notImplemented(); return null; }


		toJSON(): any {
			var value = this.get();
			if (value === undefined || value === null)
				return value;
			switch(Util.type(value)) {
				case "boolean":
				case "string":
				case "number":
					return value;
			}
			return value.toJSON();
		}

		getType() {
			return ValueType.PlainValue;
		}
	}

	export class Constant extends ValueContainer implements IPlainValue {

		constructor(value : any) {
			super();
			this.value = value;
		}

		public changed(...args: any[]) {
			throw new Error("Constant value should never change!");
			return this;
		}

		onChange(caller: Base, callback: (newvalue: any, oldvalue: any) => void ): void {
			//onChange is never triggered, so do not register an event
		}
	}

	/**
	This class just follows some IValue and just wraps it. The advantage is that others can just register events
	on this object, regardless whether the thing that represents this variable is reassigned later
	//TODO: maybe should be typed for lists, records and single values? That makes these classes a lot easier
	*/
	/*
	export class Variable extends ValueContainer { //TODO: implements IList, IRecord, search for instance of's
		//TODO: copy logic from expression.scope stuff
		constructor(value : IValue) {
			super();
			this.value = value;
		}

		public set (newvalue: IValue) {
			if (newvalue != this.value) {
				var oldvalue = this.value;
				this.value = newvalue;

				if (oldvalue instanceof List) {
					this.unlisten(<Base> oldvalue);

					var l = (<List>oldvalue).cells.length;
					for (var i = 0; i < l; i++)
						this.fire('remove', l - 1 - i, oldvalue.get(l - 1 - i));
				}
				//TODO: same for record

				else {
					this.changed(newvalue instanceof List || newvalue instanceof Record ? undefined : newvalue, oldvalue);
				}

				if (newvalue instanceof List) {
					(<List>newvalue).each(this, (index, value) => this.fire('insert', index, value));

					//TODO: listen to all events
				}
				//TODO: same for record

				//No else for primitives; unless previous value was a list or record
				else if (oldvalue instanceof List || oldvalue instanceof Record) {
					this.changed(newvalue, undefined);
				}

				if (newvalue instanceof Base)
					(<Base><any>newvalue).live();
				if (oldvalue instanceof Base)
					(<Base>oldvalue).die();
			}
		}

		public free() {
			super.free();
			if (this.value instanceof Base)
				this.value.die();
		}
	}*/
}