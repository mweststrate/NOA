///<reference path='../noa.ts'/>


module NOA{

	export class RecordEvent {
		public static PUT = "put";
	}

	export class Record extends CellContainer implements IValue, IRecord, IMutableRecord {

		data = {};
		keys = <List>new List().live();

		put(key: string, value: any) {
			Util.assert(Util.isString(key));
			if (!this.has(key)) {

				//TODO: support function insertion a la list.map

				var cell = this.data[key] = new Variable(LangUtils.toValue(value));
				cell.live();
				cell.addIndex(this, key);
				this.keys.add(key);
				this.fire(RecordEvent.PUT.toString() ,key, value, undefined);

				cell.get(this, (newvalue, oldvalue) => {
					this.fire(RecordEvent.PUT.toString(), cell.getIndex(this), newvalue, oldvalue);
				},false)
			}

			else {
				(<Variable>this.data[key]).set(LangUtils.toValue(value)); //fires event
			}
		}

		remove(key : string) {
			if (!this.has(key))
				return;

			this.fire(RecordEvent.PUT.toString(), key, undefined, this.get(key));
			(<Variable>this.data[key]).die();

			this.keys.removeAll(key);
			delete this.data[key];
		}

		cell(key: string): Variable {
			return this.data[key];
		}

		get (key: string) : any;
		get (key: string, caller: Base, onchange: (newvalue, oldvalue) => void , fireInitialEvent?: bool): any;
		get (key?: string, caller?: Base, onchange?: (newvalue, oldvalue) => void , fireInitialEvent?: bool): any {
			if (!this.has(key))
				throw new Error("Value for '" + key + "' is not yet defined!")

			return (<Variable>this.data[key]).get(caller, onchange, fireInitialEvent);
		}

		has (key: string): bool {
			return key in this.data;
		}

		is(type: ValueType): bool {
			return type === ValueType.Record;
		}

		value(): any { return this; }

		replaySets(handler: (key:string, value:any)=> void) {
			for(var key in this.data) //TODO: use this.keys, to preserve order
				handler.call(key, this.get(key));
		}

		onPut (caller: Base, callback: (key : string,  newvalue : any, oldvalue : any) => void, fireInitialEvent? : bool) {
			return this.on(RecordEvent.PUT.toString(), caller, callback);
			//TOOD: implements fireInitialEvent
		}

		toJSON (): Object {
			var res = {};
			for(var key in this.data)
				res[key] = this.cell(key).toJSON();
			return res;
		}

		isError(): bool {
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

		free() {
			super.free();

			for(var key in this.data)
				(<Variable>this.data[key]).die();

			this.keys.die();
		}
	}
}
