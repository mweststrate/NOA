///<reference path='noa.ts'/>

module NOA{

	export class Record extends CellContainer implements IValue {

		data = {};
		keys = new List();

		set (key : string, value : any) {
			if (!this.has(key)) {
				this.data[key] = new Cell(this, key, value, this);
				this.keys.add(key, this);
				this.fire('set',key, value, undefined); //todo, needs to fire or is done automatically?
			}

			else if (this.get(key) != value) {
				(<Cell>this.data[key]).set(value); //fires event
			}
		}

		fireCellChanged(index: any, newvalue: any, oldvalue: any) {
			this.fire('set', index, newvalue, oldvalue);
		};

		remove(key : string) {
			if (!this.has(key))
				return;

			this.fire('remove', key);
			(<Cell>this.data[key]).free();

			this.keys.removeAll(key);
			delete this.data[key];
		}

		cell (key: string) : Cell{
			return this.data[key];
		}

		get (): any;
		get (caller: Base, onChange: (newvalue: any, oldvalue: any) => void ): void;
		get (caller: Base, onChange: (newvalue: any, oldvalue: any) => void , supressInitialEvent: bool): any;

		get (key: string) : any;
		get (key: string, caller : Base, onchange : (newvalue, oldvalue) => void, supressInitialEvent?: bool): any;
		get (key?: string, caller?: Base, onchange?: (newvalue, oldvalue) => void , supressInitialEvent?: bool): any {
			//access value
			if (arguments.length > 0 && Util.type(key) === "string") {
				if (!this.has(key))
					throw new Error("Value for '" + key + "' is not yet defined!")

				return (<Cell>this.data[key]).get(caller, onchange, supressInitialEvent);
			}
			//access self
			else
				return super.get.apply(this, arguments);
		}

		has (key: string): bool {
			return key in this.data;
		}

		replaySets(handler: (key:string, value:any)=> void) {
			for(var key in this.data) //TODO: use this.keys, to preserve order
				handler.call(key, this.get(key));
		}

		onSet (caller: Base, callback: (key : string,  newvalue : any, oldvalue : any) => void) {
			return this.on('set', caller, callback);
		}

		onRemove(caller: Base, callback: (key: string, oldvalue: any) => void ) {
			return this.on('remove', caller, callback);
		}

		toJSON (): Object {
			var res = {};
			for(var key in this.data)
				res[key] = this.cell(key).toJSON();
			return res;
		}

		toFullAST(): Object {
			var res = {
				type: 'Record',
				noaid: this.noaid,
				values: {}
			};
			for (var key in this.data)
				res.values[key] = this.cell(key).toAST();
			return res;
		}

		free () {
			for(var key in this.data)
				(<Cell>this.data[key]).free();

			this.keys.free();
			super.free();
		}
	}
}
