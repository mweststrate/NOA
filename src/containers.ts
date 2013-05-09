///<reference path='noa.ts'/>
module NOA {

	export interface IValue {

		get (): any;
		get (caller: Base, onChange: (newvalue: any, oldvalue: any) => void ): void;
		get (caller: Base, onChange: (newvalue: any, oldvalue: any) => void , fireInitialEvent: bool): any;
		
		toAST(): Object;

		toJSON() : any;

		//TODO: getScope?

		//TODO: static unserialize()
	}

	export class CellContainer extends Base implements IValue {
		fireCellChanged(index: any, newvalue: any, oldvalue: any, cell: Cell) { Util.notImplemented() };

		cell(index: any): Cell { Util.notImplemented(); return null; };
		toJSON() : any { Util.notImplemented(); return null; }

		get (): any;
		get (caller: Base, onChange: (newvalue: any, oldvalue: any) => void ): void;
		get (caller: Base, onChange: (newvalue: any, oldvalue: any) => void , fireInitialEvent: bool): any;
		get (caller?: Base, onChange?: (newvalue: any, oldvalue: any) => void , fireInitialEvent?: bool): any {
			//TODO: memoize
			if (onChange && fireInitialEvent !== false)
				onChange.call(caller, this);

			return new Constant(this);
		}


		toAST(): Object {
			return {
				type: "ref",
				id: this.noaid
			}
		}
	}

	export class ValueContainer extends Base implements IValue {
		public value: any; //TODO: private / protected?
		origin: CellContainer;

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
		};

		public changed(...args: any[]) {
			var a = Util.makeArray(arguments);
			a.unshift('change');
			this.fire.apply(this, a);
			return this;
		}

		onChange(caller: Base, callback: (newvalue: any, oldvalue: any) => void ) : void{
			this.on('change', caller, callback);
		}

		toAST(): Object { Util.notImplemented(); return null; };


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
	}

	export class Constant extends ValueContainer {

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

	export class Variable extends ValueContainer {
		//TODO: copy logic from expression.scope stuff
		constructor(private varname: string) {
			super();
		}
	}
}