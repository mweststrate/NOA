///<reference path='../noa.ts'/>
module NOA {

	export enum ValueType {
		Error,
		List,
		Record,
		PlainValue, //TODO: split to 'primitive' and 'valuecontainer (or similar)'
		Any
	}

	export class PlainValueEvent {
		public static UPDATE = "change";
		public static FREE = "free";
	}

	export interface IValue extends IBase {
		toJSON(): any;
		toAST(): Object;

		getType(): ValueType;
		is(expected: ValueType): bool;
		//TODO:
		//mightbe(expected): bool

		isError() : bool;
		asError() : ErrorValue;
	}

	export interface IPlainValue extends IValue { //TODO: cell and expression implement IPlainValue
		get(): any;
		get(caller: Base, onChange: (newvalue: any, oldvalue: any) => void , fireInitialEvent?: bool): any;
	}

	export interface IList extends IValue {
		onInsert(caller: Base, cb: (index: number, value) => void , fireInitialEvents?: bool);
		onMove(caller: Base, cb: (from: number, to: number) => void );
		onRemove(caller: Base, cb: (from: number, value) => void );
		onSet(caller: Base, cb: (index: number, newvalue, oldvalue) => void );


		each(scope, cb: (index: number, value: any) => void );
		size(): number;
		get(index: number): IValue;
	}

	export interface IMutableList extends IList {
		insert(index: number, value: IValue);
	}

	export interface IRecord extends IValue {
		onPut(caller: Base, callback: (key: string, newvalue: any, oldvalue: any) => void , fireInitialEvent?: bool);
	}

	export interface IMutableRecord extends IRecord {
		put(key: string, value: IValue);
	}
}