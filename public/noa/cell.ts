module NOA {


    class CellOwner extends NOA.Base {
        fireCellChanged(any, any, any);
    }

    class Cell extends NOA.Base {

        private parent : CellOwner;
        private value  : any = undefined;
        private index  : any = -1; //int or string
        private initialized : bool = false;

        constructor (parent : CellOwner, index, value) {
            this.parent = parent;
            this.index = index;
            this.set(value);
            this.initialized = true;
        }

        /* TODO: why?! remove () {
         if(this.parent && NOA.Record.isA(this.parent)) {
         this.parent.remove(this.index);
         } else if(this.parent && NOA.List.isA(this.parent)) {
         this.parent.remove(this.index);
         } else {
         throw "Cell.Remove can only be invoked for cells owned by a list or record!";
         }
         },*/


        hasExpression () {
            return this.value instanceof NOA.Expression;
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
                    this.unlistenTo(orig, 'changed');
                }

                if(newvalue instanceof NOA.Base)
                    newvalue.live();

                if(orig instanceof NOA.Base)
                    orig.die();

                this.value = newvalue;

                if(this.hasExpression()) {
                    this.debug("now following", newvalue);

                    newvalue = newvalue.get((newv, oldv) => {
                        this.fireChanged(newv, oldv);
                    });
                }

                this.fireChanged(newvalue, oldvalue);
            }
            this.debugOut();
        }

        fireChanged (newv : any, oldv: any) {
            if (this.parent)
                this.parent.fireCellChanged(this.index, newv, oldv);
            this.changed(newv, oldv);
        }

        get (onchange? : (any, any) => void) : any {
            if(readTracker.length > 0) {
                readTracker[0][this.noaid] = this;
            }
            if(onchange)
                this.onChange(onchange);
            if (this.hasExpression)
                return this.value.get();
            return this.value;
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
                this.unlistenTo(this.value, 'changed');

            if(this.value instanceof NOA.Base)
                this.value.die();

            this.changed(undefined); //or fireChanged?
        }

        toString() : string {
            return ((this.parent ? this.parent.debugName() + "." + this.index : "Cell " + this.noaid) + ":" + this.value);
        }


        public static trackReads (list : Array) {
            readTracker.unshift(list);
        }

        public static untrackReads () {
            readTracker.shift();
        }
    }

    export  var readTracker : Array = [];//TODO: move to expression
}
//@ sourceMappingURL=cell.js.map
