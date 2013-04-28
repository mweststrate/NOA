///<reference path='noa.ts'/>
module NOA {
	export class CellContainer extends Base {
		fireCellChanged(index: any, newvalue: any, oldvalue: any, cell: Cell) { Util.notImplemented() };
		cell(index: any): Cell { Util.notImplemented(); return null; };
	}

	export class ValueContainer extends Base {
		public value: any; //TODO: private / protected?
		origin: CellContainer;

		public getOrigin(): CellContainer {
			return this.origin;
		}

		public setOrigin(origin: CellContainer) {
			this.origin = origin;
		}

		public get (caller?: Base, onChange?: (newvalue: any, oldvalue: any) => void ): any {
			if (onChange)
				this.onChange(caller, onChange);

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
	}
}