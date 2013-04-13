///<reference path='noa.ts'/>

module NOA {


    export class CellContainer extends Base {
        fireCellChanged(index: any, newvalue: any, oldvalue: any, cell : Cell){ Util.notImplemented()};
        cell(index: any): Cell { Util.notImplemented(); return null; };
    }

	export class ValueContainer extends Base {
        public value : any; //TODO: private / protected?
        origin: CellContainer;

        public getOrigin() : CellContainer {
            return this.origin;
        }

        public setOrigin(origin : CellContainer) {
            this.origin = origin;
        }

        public get(caller?: Base, onChange?: (newvalue : any, oldvalue: any) => void): any {
            if (onChange)
                this.onChange(caller, onChange);

            return this.value;
        };

        public changed (...args : any[]) {
            var a = Util.makeArray(arguments);
            a.unshift('change');
            this.fire.apply(this, a);
            return this;
        }

        onChange (caller: Base, callback : (newvalue : any, oldvalue: any) => void) {
            return this.on('change', caller, callback);
        }
    }

    /**
        TODO: make cell not depend on parent, than it can be reused among multiple parents, and be passed around 
        in, for example, sublist, reverse, count, summ, aggregations and such

        replayInserts should have an variant which does not care about ordering
    */
    export class Cell extends ValueContainer {

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

        set(newvalue) {
            if(this.destroyed)
                return;

            this.debugIn("Receiving new value: " + newvalue);

            var orig = this.value;

            if(newvalue != orig) {
                var oldvalue = orig;
                if(this.hasExpression()) {
                    oldvalue = orig.get();
                    this.unlisten(orig, 'change');
                }

                if(newvalue instanceof Base)
                    newvalue.live();

                if(orig instanceof Base)
                    orig.die();

                this.value = newvalue;

                if(this.hasExpression()) {
                    this.debug("now following", newvalue);

                    newvalue = newvalue.get((newv, oldv) => {
                        this.fireChanged(newv, oldv);
                    });
                }

                if (this.initialized)
                    this.fireChanged(newvalue, oldvalue);
            }
            this.debugOut();
        }

        fireChanged (newv : any, oldv: any) {
            if (this.parent)
                this.parent.fireCellChanged(this.index, newv, oldv, this);
            this.changed(newv, oldv, this);
        }

        get (caller?: Base, onchange? : (newvalue : any, oldvalue: any) => void) : any {
            if(readTracker.length > 0) {
                readTracker[0][this.noaid] = this;
            }

            var res = super.get(caller, onchange)

            if (this.hasExpression)
                return res.get();
            return res;
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

        toString() : string {
            return ((this.parent ? this.parent.debugName() + "." + this.index : "Cell " + this.noaid) + ":" + this.value);
        }


        public static trackReads (list : Object) {
            readTracker.unshift(list);
        }

        public static untrackReads () {
            readTracker.shift();
        }
    }

    export  var readTracker  = [];//TODO: move to expression
}
//@ sourceMappingURL=cell.js.map
