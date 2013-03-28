module NOA{

    export class Record extends NOA.CellContainer {

        data = {};
        keys = new NOA.List();

        set (key : string, value : any) {
            if (!this.has(key)) {
                this.data[key] = new NOA.Cell(this, key, value);
                this.keys.add(key);
                this.fire('put',key, value, undefined); //todo, needs to fire or is done automatically?
            }

            else if (this.get(key) != value) {
                this.data[key].set(value); //fires event
            }
        }

        remove(key : string) {
            if (!this.has(key))
                return;

            this.fire('remove', key);
            this.data[key].free();

            this.keys.removeAll(key);
            delete this.data[key];
        }

        cell (key) {
            return this.data[key];
        }

        get(key : string,  onchange? : (newvalue, oldvalue) => void) {
            if (!this.has(key))
                throw "Value for '" + key + "' is not yet defined!"
            //	return null;
            return this.data[key].get(onchange);
        }

        has (key: string): bool {
            return key in this.data;
        }

        keys () : NOA.List {
            return this.keys;
        }

        replaySets(handler: (key:string, value:any)=> void) {
            for(var key in this.data) //TODO: use this.keys, to preserve order
                handler.call(key, this.get(key));
        }

        onPut (callback: (key : string,  newvalue : any, oldvalue : any)) {
            return this.on('put', callback);
        }

        onRemove (callback: (key : string)) {
            return this.on('remove', callback);
        }

        toObject (): object {
            var res = {};
            for(var key in this.data)
                res[key] = this.get(key);
            return res;
        }

        free () {
            for(var key in this.data)
                this.data[key].die().free();

            this.keys.free();
            super.free();
        }
    }
}
