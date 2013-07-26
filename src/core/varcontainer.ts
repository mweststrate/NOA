///<reference path='../noa.ts'/>
module NOA {

	//TODO: rename to var container
	export class CellContainer extends Base {

		constructor() {
			super();
		}

		cell(index: any): Variable { Util.notImplemented(); return null; }
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

	//TODO: remove code below?
	/*
	export class PlainValue extends Base implements IPlainValue {
		value: any;

		constructor(initialValue: any) {
			super();
			this.set(initialValue);
		}

		public get (): any;
		public get (caller: Base, onChange: (newvalue: any, oldvalue: any) => void ): void;
		public get (caller : Base, onChange : (newvalue: any, oldvalue: any) => void, fireInitialEvent: bool): any;
		public get (caller?: Base, onChange?: (newvalue: any, oldvalue: any) => void, fireInitialEvent?: bool): any {
			if (onChange)
				this.onChange(caller, onChange);

			var value = LangUtils.dereference(this.value);

			if (onChange && fireInitialEvent !== false)
				onChange.call(caller, value, undefined);

			return value;
		}

		set(newvalue : any) {
			if (newvalue != this.value) {
				var oldvalue = this.value;

				var ov = this.get();
				var nv = LangUtils.dereference(newvalue);

				this.value = newvalue;

				if (LangUtils.is(oldvalue, ValueType.PlainValue))
					LangUtils.unfollow(this, oldvalue);
				if (LangUtils.is(newvalue, ValueType.PlainValue));
					LangUtils.follow(this, newvalue);

				if (newvalue instanceofx Base)
					newvalue.live();
				if (oldvalue instanceofx Base)
					oldvalue.die();

				if (ov != nv)
					this.changed(nv, ov);
			}
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
			return value.toJSON();
		}

		getType() {
			return ValueType.PlainValue;
		}
	}

	*/

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

				if (oldvalue instanceofx List) {
					this.unlisten(<Base> oldvalue);

					var l = (<List>oldvalue).cells.length;
					for (var i = 0; i < l; i++)
						this.fire('remove', l - 1 - i, oldvalue.get(l - 1 - i));
				}
				//TODO: same for record

				else {
					this.changed(newvalue instanceofx List || newvalue instanceofx Record ? undefined : newvalue, oldvalue);
				}

				if (newvalue instanceofx List) {
					(<List>newvalue).each(this, (index, value) => this.fire('insert', index, value));

					//TODO: listen to all events
				}
				//TODO: same for record

				//No else for primitives; unless previous value was a list or record
				else if (oldvalue instanceofx List || oldvalue instanceofx Record) {
					this.changed(newvalue, undefined);
				}

				if (newvalue instanceofx Base)
					(<Base><any>newvalue).live();
				if (oldvalue instanceofx Base)
					(<Base>oldvalue).die();
			}
		}

		public free() {
			super.free();
			if (this.value instanceofx Base)
				this.value.die();
		}
	}*/
}