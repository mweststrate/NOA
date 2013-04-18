module NOA {
    class BaseData {
        private events;
        private subscriptions;
        public debugname: string;
        public refcount: number;
        public removeSubscription(binding: Binding): void;
        public addSubscription(binding: Binding): void;
        public getSubscriptions(): Binding[];
        public getListeners(eventname: string): {};
        public addEventListener(binding: Binding): void;
        public removeEventListener(binding: Binding): void;
        public free(): void;
    }
    class Base {
        static noaid: number;
        public noaid: number;
        public noabase: BaseData;
        public destroyed: bool;
        private freeing;
        constructor();
        public fire(event: string, ...args: any[]): Base;
        public on(ev: string, caller: Base, callback: Function): Binding;
        public listen(other: Base, event: string, callback: Function): Base;
        public unlisten(other: Base, event: string): Base;
        public free(): void;
        public onFree(caller: Base, callback: Function): Base;
        public live(): Base;
        public die(): Base;
        public uses(that: Base): Base;
        public debugName(): string;
        public debugName(newname: string): Base;
        public debug(...args: any[]): void;
        public debugIn(...args: any[]): void;
        public debugOut(...args: any[]): void;
    }
    class GlobalEvents extends Base {
        public onListMove(): void;
        public onListSet(): void;
        public onListInsert(): void;
        public onListRemove(): void;
        public onRecordPut(): void;
        public fireListMove(): void;
        public fireListSet(): void;
        public fireListRemove(): void;
        public fireListInsert(): void;
        public fireRecordPut(): void;
    }
    var Events: GlobalEvents;
}
module NOA {
    class Binding {
        static bindingcount: number;
        public event: string;
        public source: Base;
        public id: string;
        private dest;
        private callback;
        private _firing;
        constructor(event: string, source: Base, dest: Base, callback: Function);
        public fire(): void;
        public free(): void;
        public toString(): string;
    }
}
module NOA {
    class CellContainer extends Base {
        public fireCellChanged(index: any, newvalue: any, oldvalue: any, cell: Cell): void;
        public cell(index: any): Cell;
    }
    class ValueContainer extends Base {
        public value: any;
        public origin: CellContainer;
        public getOrigin(): CellContainer;
        public setOrigin(origin: CellContainer): void;
        public get(caller?: Base, onChange?: (newvalue: any, oldvalue: any) => void): any;
        public changed(...args: any[]): ValueContainer;
        public onChange(caller: Base, callback: (newvalue: any, oldvalue: any) => void): Binding;
    }
    class Cell extends ValueContainer {
        private parent;
        public index: any;
        private initialized;
        constructor(parent: CellContainer, index: number, value: ValueContainer);
        constructor(parent: CellContainer, index: string, value: ValueContainer);
        constructor(parent: CellContainer, index: string, value: any, origin: CellContainer);
        constructor(parent: CellContainer, index: number, value: any, origin: CellContainer);
        public hasExpression(): bool;
        public set(newvalue): void;
        public fireChanged(newv: any, oldv: any): void;
        public get(caller?: Base, onchange?: (newvalue: any, oldvalue: any) => void): any;
        public live(): Cell;
        public die(): Cell;
        public free(): void;
        public toString(): string;
    }
}
module NOA {
    class Scope {
        private static SCOPE;
        static getCurrentScope(): Scope;
        static newScope(basescope: Scope): Scope;
        static pushScope(scope): void;
        static popScope(): void;
        private vars;
        private parent;
        constructor(parentscope?: Scope);
        public get(varname: string, readTracker: Object): ValueContainer;
        public set(varname: string, value: ValueContainer): void;
    }
    class Expression extends ValueContainer {
        public func: Function;
        public scope: Object;
        public value: any;
        public params: {};
        public readTracker;
        constructor(func, scope);
        public _apply(): void;
        public variable(name: string);
        public free(): void;
    }
}
module NOA {
    class List extends CellContainer {
        static Aggregates: {
            count: string;
            numbercount: string;
            sum: string;
            min: string;
            max: string;
            vag: string;
            first: string;
            last: string;
        };
        public cells: Cell[];
        public aggregates: {};
        constructor();
        public insert(index: number, value: ValueContainer): List;
        public insert(index: number, value: any, origin: CellContainer): List;
        public set(index: number, value: ValueContainer): List;
        public set(index: number, value: any, origin: CellContainer): List;
        public fireCellChanged(index: any, newvalue: any, oldvalue: any, cell: Cell): void;
        public remove(index: number): any;
        public move(from: number, to: number): List;
        public cell(index: number): Cell;
        public onInsert(caller: Base, cb: (index: number, value: any, cell: Cell) => void): List;
        public onMove(caller: Base, cb: (from: number, to: number) => void): List;
        public onRemove(caller: Base, cb: (from: number, value: any) => void): List;
        public onSet(caller: Base, cb: (index: number, newvalue: any, oldvalue: any, cell: Cell) => void): List;
        public _updateIndexes(start: number, end: number, delta?: number): List;
        public replayInserts(cb: (index: number, value: any, cell: Cell) => void): void;
        public add(value: ValueContainer);
        public add(value: any, origin: CellContainer);
        public aggregate(index: string, caller?: Base, onchange?: (newvalue: any, oldvalue: any) => void);
        public get(index: number);
        public toArray(recurse?: bool): any[];
        public removeAll(value): void;
        public free(): void;
        public map(name: string, func: any): List;
        public filter(name: string, func: any): List;
        public subset(begin: number, end?: number): List;
        public tail(): ListTail;
        public last(): ListTail;
        public reverse(): List;
        public sort(comperator): List;
        public distinct(): List;
        public join(): List;
        public sum(): ListSum;
        public min(): ListMin;
        public max(): ListMax;
        public avg(): ListAverage;
        public count(): ListCount;
        public first(): ListFirst;
        public numbercount(): ListNumberCount;
        public atIndex(index: number): ListIndex;
    }
}
module NOA {
    class Record extends CellContainer {
        public data: {};
        public keys: List;
        public set(key: string, value: any): void;
        public fireCellChanged(index: any, newvalue: any, oldvalue: any): void;
        public remove(key: string): void;
        public cell(key: string): Cell;
        public get(key: string, caller?: Base, onchange?: (newvalue: any, oldvalue: any) => void);
        public has(key: string): bool;
        public replaySets(handler: (key: string, value: any) => void): void;
        public onSet(caller: Base, callback: (key: string, newvalue: any, oldvalue: any) => void): Binding;
        public onRemove(caller: Base, callback: (key: string, oldvalue: any) => void): Binding;
        public toObject(recurse?: bool): Object;
        public free(): void;
    }
}
module NOA {
    class ListTransformation extends List {
        public source: List;
        constructor(source: List);
        public onSourceInsert(index: number, value, cell: Cell): void;
        public onSourceRemove(index: number, value): void;
        public onSourceMove(from: number, to: number): void;
        public onSourceSet(index: number, newvalue, oldvalue, cell: Cell): void;
    }
    class MappedList extends ListTransformation {
        public basescope: Scope;
        public func: any;
        public varname: string;
        constructor(source: List, name: string, func: any);
        public onSourceInsert(index: number, _, source): void;
        public onSourceRemove(index: number, value): void;
        public onSourceMove(from: number, to: number): void;
    }
    class FilteredList extends ListTransformation {
        public parent: List;
        public mapping: any[];
        constructor(source: List, name: string, func: any);
        public updateMapping(index: number, delta: number, to?: number): void;
        public onSourceInsert(index: number, value): void;
        public onSourceRemove(index: number, value): void;
        public onSourceMove(from: number, to: number): void;
        public onSourceSet(index: number, should, _): void;
    }
    class SubSetList extends ListTransformation {
        public begin: number;
        public end: number;
        constructor(source: List, begin: number, end: number);
        public removeLast(): void;
        public addLast(): void;
        public removeFirst(): void;
        public addFirst(): void;
        public onSourceInsert(index, value, cell): void;
        public onSourceRemove(index): void;
        public onSourceMove(from, to): void;
    }
    class ReversedList extends ListTransformation {
        constructor(source: List);
        public onSourceInsert(index, value, cell): void;
        public onSourceRemove(index): void;
        public onSourceMove(from, to): void;
    }
    class SortedList extends ListTransformation {
        public mapping: number[];
        public func: any;
        constructor(source: List, comperator);
        public updateMapping(from: number, delta: number): void;
        public searcher(a, b: Cell);
        public onSourceInsert(baseindex: number, value, cell: Cell, _knownindex?: number): void;
        public onSourceRemove(baseindex: number, _?): void;
        public onSourceSet(index: number, value, _, cell): void;
    }
    class DistinctList extends ListTransformation {
        public occ: {};
        constructor(source: List);
        public toKey(value);
        public onSourceInsert(index: number, value, cell): void;
        public onSourceRemove(index: number, value): void;
        public onSourceSet(index: number, newvalue, origvalue, cell): void;
    }
    class JoinedList extends ListTransformation {
        public lmap: any[];
        constructor(source: List);
        public updateLmap(index: number, delta: number): void;
        public setupSublist(index: number, sublist): void;
        public onSourceInsert(index: number, value, cell): void;
        public onSourceRemove(index: number, value): void;
        public onSourceSet(index: number, newvalue, oldvalue, cell): void;
        public onSourceMove(from: number, to: number): void;
    }
    class ListTail extends ListTransformation {
        public start: number;
        constructor(source: List, start?: number);
        public onSourceInsert(index: number, _, cell): void;
        public onSourceRemove(index: number, value): void;
        public onSourceMove(from: number, to: number): void;
    }
}
module NOA {
    class Util {
        static depth: number;
        static count: number;
        static testnr: number;
        static GLOBALSCOPE;
        static debugbreakon: number;
        static debugIn(...args: any[]): void;
        static debugOut(...args: any[]): void;
        static debug(...args: any[]): void;
        static warn(...args: any[]): void;
        static assert(value: any): void;
        static test(test: any, expected: any): void;
        static each(ar: any, cb: (any: any, int: any) => bool, scope?: Object, flags?: string): any;
        static ensureObject(path: string, scope?: Object): Object;
        static exists(path: string, scope?: Object): bool;
        static isFunction(thing: any): bool;
        static isNumber(thing: any): bool;
        static isArray(thing: any): bool;
        static inArray(thing: any, array: any[]): number;
        static type(obj: any);
        static makeArray(ar: any): any[];
        static binarySearch(list: any[], needle: Object, comperator: (left: any, right: any) => number): number;
        static identity(x);
        static noop(): void;
        static notImplemented(): void;
        static randomUUID(): string;
        static runtests(tests: Object): void;
    }
}
module NOA {
    class ListAggregation extends ValueContainer {
        public source: List;
        public value;
        constructor(source: List);
        public onSourceInsert(index: number, value, cell: Cell): void;
        public onSourceRemove(index: number, value): void;
        public onSourceMove(from: number, to: number): void;
        public onSourceSet(index: number, newvalue, oldvalue, cell: Cell): void;
        public updateValue(newvalue, cell?: Cell): void;
    }
    class ListCount extends ListAggregation {
        public value: number;
        constructor(source: List);
        public onSourceInsert(index: number, value): void;
        public onSourceRemove(index: number, value): void;
    }
    class ListNumberCount extends ListAggregation {
        public value: number;
        constructor(source: List);
        public onSourceInsert(index: number, value): void;
        public onSourceRemove(index: number, value): void;
        public onSourceSet(index: number, newvalue, oldvalue): void;
    }
    class ListSum extends ListAggregation {
        public value: number;
        constructor(source: List);
        public onSourceInsert(index: number, value): void;
        public onSourceRemove(index: number, value): void;
        public onSourceSet(index: number, newvalue, oldvalue): void;
    }
    class ListAverage extends ListAggregation {
        public value: number;
        public sum: ListSum;
        public count: ListCount;
        constructor(source: List);
        public listChanged(): void;
        public free(): void;
    }
    class ListMax extends ListAggregation {
        public value: number;
        constructor(source: List);
        public findNewMax(): void;
        public onSourceInsert(index: number, value, cell): void;
        public onSourceRemove(index: number, value): void;
        public onSourceSet(index: number, newvalue, oldvalue): void;
    }
    class ListMin extends ListAggregation {
        public value: number;
        constructor(source: List);
        public findNewMin(): void;
        public onSourceInsert(index: number, value, cell: Cell): void;
        public onSourceRemove(index: number, value): void;
        public onSourceSet(index: number, newvalue, oldvalue): void;
    }
    class ListIndex extends ListAggregation {
        public index: number;
        public realindex: number;
        constructor(source: List, index: number);
        public updateRealIndex(): void;
        public update(): void;
        public onSourceInsert(index: number, value): void;
        public onSourceRemove(index: number, value): void;
        public onSourceMove(from: number, to: number): void;
    }
    class ListFirst extends ListIndex {
        constructor(source: List);
    }
    class ListLast extends ListIndex {
        constructor(source: List);
    }
}
