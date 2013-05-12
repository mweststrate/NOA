///<reference path='noa.ts'/>

module NOA{

	export enum RecordEvent { PUT, FREE }

	export class Record extends CellContainer implements IValue, IRecord, IMutableRecord {

		data = {};
		keys = new List();

		set (key : string, value : any) {
			if (!this.has(key)) {
				var cell = this.data[key] = new Cell(this, key, value, this);
				this.keys.add(key, this);
				this.fire(RecordEvent.PUT.toString() ,key, value, undefined);

				cell.onChange(this, (newvalue, oldvalue) => {
					this.fire(RecordEvent.PUT.toString(), cell.index, newvalue, oldvalue, cell);
				}, false)
			}

			else if (this.get(key) != value) {
				(<Cell>this.data[key]).set(value); //fires event
			}
		}

		remove(key : string) {
			if (!this.has(key))
				return;

			this.fire(RecordEvent.PUT.toString(), key, undefined, this.get(key));
			(<Cell>this.data[key]).free();

			this.keys.removeAll(key);
			delete this.data[key];
		}

		cell (key: string) : Cell{
			return this.data[key];
		}

		get (key: string) : any;
		get (key: string, caller: Base, onchange: (newvalue, oldvalue) => void , fireInitialEvent?: bool): any;
		get (key?: string, caller?: Base, onchange?: (newvalue, oldvalue) => void , fireInitialEvent?: bool): any {
			if (!this.has(key))
				throw new Error("Value for '" + key + "' is not yet defined!")

			return (<Cell>this.data[key]).get(caller, onchange, fireInitialEvent);
		}

		has (key: string): bool {
			return key in this.data;
		}

		replaySets(handler: (key:string, value:any)=> void) {
			for(var key in this.data) //TODO: use this.keys, to preserve order
				handler.call(key, this.get(key));
		}

		onPut (caller: Base, callback: (key : string,  newvalue : any, oldvalue : any) => void, fireInitialEvent? boolean) {
			return this.on(RecordEvent.PUT.toString(), caller, callback);
			//TOOD: implements fireInitialEvent
		}

		toJSON (): Object {
			var res = {};
			for(var key in this.data)
				res[key] = this.cell(key).toJSON();
			return res;
		}

		isError(): boolean {
			return false;
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
