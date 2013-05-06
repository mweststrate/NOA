///<reference path='noa.ts'/>
module NOA {

	export interface IValue {

		/*get (): any;
		get (caller: Base, onChange: (newvalue: any, oldvalue: any) => void ): void;
		get (caller: Base, onChange: (newvalue: any, oldvalue: any) => void , supressInitialEvent: bool): any;
		*/

		toAST(): Object;

		//TODO: getScope?

		//TODO: static unserialize()
	}

	export class CellContainer extends Base implements IValue {
		fireCellChanged(index: any, newvalue: any, oldvalue: any, cell: Cell) { Util.notImplemented() };

		cell(index: any): Cell { Util.notImplemented(); return null; };

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
		public get (caller : Base, onChange : (newvalue: any, oldvalue: any) => void, supressInitialEvent: bool): any;
		public get (caller?: Base, onChange?: (newvalue: any, oldvalue: any) => void, supressInitialEvent?: bool): any {
			if (onChange)
				this.onChange(caller, onChange);

			if (onChange && !supressInitialEvent)
				onChange.call(caller, this.value, undefined);

			return this.value;
		};

		public changed(...args: any[]) {
			var a = Util.makeArray(arguments);
			a.unshift('change');
			this.fire.apply(this, a);
			return this;
		}

		onChange(caller: Base, callback: (newvalue: any, oldvalue: any) => void ) {
			return this.on('change', caller, callback);
		}

		toAST(): Object { Util.notImplemented(); return null; };
	}
}