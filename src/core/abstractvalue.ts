///<reference path='../noa.ts'/>
module NOA {

	//TODO: is this class really needed?
	export /*abstract*/ class AbstractValue extends Base implements IValue {

		constructor() {
			super();
		}

		getType() : ValueType {
			if (this instanceof ErrorValue)
				return ValueType.Error;
			if (this.is(ValueType.List))
				return ValueType.List;
			if (this.is(ValueType.Record))
				return ValueType.Record;
			if (this.is(ValueType.PlainValue))
				return ValueType.PlainValue;
			return ValueType.Any; //MWE; or: unknown?
		}

		is(type : ValueType): bool {
			return LangUtils.is(this, type);
		}

		isError () : bool { return this.is(ValueType.Error); }
		asError() {
			Util.assert(this.isError());
			return <ErrorValue> this;
		}

		toJSON(): any {
			return Util.notImplemented();
		}

		toAST(): Object {
			return Util.notImplemented();
		}
	}
}