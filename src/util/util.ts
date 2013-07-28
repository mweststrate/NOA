///<reference path='../noa.ts'/>

declare var require: Function;
declare var process : any;

module NOA {
	export class Util {

		//MWE: todo proper syntax for private members?
		static depth = 0;
		static count = 0;
		static testnr = 0;
		static GLOBALSCOPE = (function() { return this; })(); //MWE: TODO: proper?

		static toString(arg: any): string {
			return "" + (arg === undefined ? "undefined" : arg === null ? "null": arg.toString ? arg.toString() : arg);
		}
		/**
		 if debugbreakon is set, the debugger will pause when entering the provided debug line
		 */
		static  debugbreakon = -1;

		/**
		 writes debug data to the console (see NOA.debug) and increases the indentation depth before doing so
		 */
		static debugIn(...args: any[]) {
			Util.depth += 1;
			Util.debug.apply(Util, arguments);
		}

		/**
		 reduces the debug indentation depth (see debugIn)
		 */
		static debugOut(...args: any[]) {
			Util.depth = Math.max(Util.depth - 1, 0);
		}

		/**
		 accepts an arbitrary list of things and prints them to the console
		 */
		static debug(...args: any[]) {
			Util.count += 1;
			var p = '';
			for (var i = Util.depth; i >= 0; i--, p+=' ')
				;//EMPTY LOOP

			var stuff = [];

			for (var i = 0; i < arguments.length; i++) {
				var a = arguments[i];
				if (a === null)
					stuff.push("'null'");
				else if (a === undefined)
					stuff.push("'undefined'");
				else if (a.debugName)
					stuff.push(a.debugName())
				else if (a.toString().indexOf(' ') > -1)
					stuff.push("'" + a.toString() + "'");
				else
					stuff.push(a.toString());
			}

			console.log(Util.count + ':' + p + stuff.join(' '));
			if (Util.count == Util.debugbreakon) {
				debugger;
			}
		}

		static warn(...args: any[]) {
			console.warn.apply(console, arguments);
		}

		/**
		 assert the value argument to be true, throws an exception otherwise
		 */
		static assert(value: any, msg: string = "NOA assertion failed!") {
			if (!value)
				throw new Error(msg);
		}

		/**
		 * [test description]
		 * @param  {[type]} test [the expression to be tested]
		 * @param  {[type]} expected [the expected value]
		 * @return {[type]}
		 */
		static test(test : any, expected: any) : void {
			Util.testnr += 1;
			if (('' + test) != ('' + expected)) {
				var msg = "Test #" + Util.testnr + " failed: '" + test + "' expected '" + expected + "'";
				console.error(msg);
				document.write("<br/>" + msg);
			}
		}

		static getSize(collection: any): number {
			if (Util.isArray(collection))
				return collection.length;
			if (Util.isObject(collection)) {
				var cnt = 0;
				for (var key in collection)
					cnt += 1;
				return cnt;
			}
			return 0;
		}

		//TODO: kill map/filter/each? are provided by default already in typescript
		static map(collection: any[], cb: (value: any, index: number) => any, scope?: Object): any[];
		static map(collection : Object, cb : (value : any, key : string) => any, scope? : Object) : Object;
		static map(collection : any, cb : (value : any, key : any) => any, scope? : Object) : any {
			return Util.each(collection, cb, scope, 'm');
		}

		static filter(collection : Object, cb : (value : any, key : string) => bool, scope? : Object) : Object;
		static filter(collection : any[], cb : (value : any, index : number) => bool, scope? : Object) : any[];
		static filter(collection : any, cb : (value : any, key : any) => bool, scope? : Object) : any {
			return Util.each(collection, cb, scope, 'f');
		}

		static each (ar : Object, cb : (value : any, key : string) => any, scope? : Object, flags? : string) : any;
		static each (ar : any[], cb : (value : any, index : number) => any, scope? : Object, flags? : string) : any;
		static each (ar : any, cb : (value : any, key : any) => any, scope? : Object, flags? : string) : any {
			scope = scope || Util.GLOBALSCOPE;
			flags = flags || "";
			if (arguments.length == 3 && Util.type(scope) == "string") {
				flags = <any>scope;
				scope = Util.GLOBALSCOPE;
			}

			//valid flags are (m)ap, (f)filter, (s)parse, (r)everse
			//sparse skips the callback for non-values
			//reverse calls the callbacks in reverse order for arrays, which is useful while modifying the array while iterating
			var map     = flags.match(/m/),
				filter  = flags.match(/f/),
				sparse  = flags.match(/s/),
				reverse = flags.match(/r/),
				res     = [],
				start   = reverse ? ar.length -1 : 0,
				delta   = reverse ? -1 : 1,
				end     = reverse ? -1 : ar.length,
				isArray = Util.isArray(ar);

			if (isArray){
				for(var i = start; i != end; i += delta) {
					if (ar[i] == null && sparse)
						continue;

					var value = cb.call(scope, ar[i], i); //, ar, scope);

					//TODO: awful conditions
					if (map) {
						if (reverse)
							res.unshift(value);
						else
							res.push(value);
					}
					else if (filter) {
						if (value === true) {
							if (reverse)
								res.unshift(ar[i]);
							else
								res.push(ar[i]);
						}
					}
					else if (value === false) //return false from callback means 'break'
						break;
				}

				return res;
			}
			else {

				//object
				for(var key in ar) {
					if (ar[key] == null && sparse)
						continue;

					var value = cb.call(scope, ar[key], key); //, ar, scope);

					if (map)
						res[key] = value;
					else if (filter) {
						if (value === true)
							res[key] = ar[key]
					}
					else if (value === false)
						break;
				}
				return res;
			}
		}

		static parallel(collection : Function[], callback : () => void);
		static parallel(collection : Object, onItem : (item: any, index: string, cb : () => void) => void, callback : () => void);
		static parallel(collection : any[], onItem : (item: any, index: number, cb : () => void) => void, callback : () => void);
		static parallel(collection : any, func1 : Function, func2? : Function) {
			var left = Util.getSize(collection);
			var onItem   = func1;
			var callback = func2;

			function itemdone() {
				left -= 1;
				if (left == 0)
					callback();
			}

			if (arguments.length == 2) {
				callback = func1;
				onItem = function(fun) {
					fun(itemdone);
				}
			}

			if (left == 0)
				callback()
			else
				Util.each(collection, (item, index) => {
					onItem(item, index, itemdone)
				})
		}

		//equals parallelMap, but preserves order, only supports array
		static sequence(collection : Function[], callback : () => void);
		static sequence(collection : any[], onItem : (item : any, index : number, cb : () => void) => void, callback : () => void);
		static sequence(collection : any[], onItem : Function, callback? : Function) {

			var iter = arguments.length == 3
			?	function (index: number) {
					if (index == collection.length)
						callback();
					else
						onItem(collection[index], index, () => {
							iter(index + 1); //MWE: TODO: watch stack depth for large lists! apply tail recursion by using timeouts
						});
				}
			: 	function (index : number) {
				if (index == collection.length)
					onItem(); //the callback
				else
					collection[index](() => { //collections are functions, provide ccallback
						iter(index + 1);
					})
			};

			iter(0);
		}

		/** makes a path available, given a context
		 *  path: string or array
		 *  scope: nothing or base scope
		 *
		 *  returns the most inner object
		 */
		static ensureObject (path : string, scope? : Object) : Object {
			var parts;
			if (Util.type(path) == "array")
				parts = path;
			else
				parts = path.split(".");

			if (scope == undefined)
				scope = Util.GLOBALSCOPE;

			for(var i = 0; i < parts.length; i++) {
				if (!scope[parts[i]])
					scope[parts[i]] = {};
				scope = scope[parts[i]];

			}
			return scope;
		}

		static exists(path : string, scope? : Object) : bool {
			var parts;
			if (Util.isArray(path))
				parts = path;
			else
				parts = path.split(".");

			if (!scope)
				scope = Util.GLOBALSCOPE;

			for(var i = 0; i < parts.length; i++) {
				if (!scope[parts[i]])
					return false;
				scope = scope[parts[i]];
			}
			return true;
		}

		static isFunction (thing : any) : bool {
			return Util.type(thing) === "function";
		}


		static isNumber(thing: any): bool {
			return Util.type(thing) == "number";
		}

		static isNumberLike(thing: any): bool {
			return isNumber(thing) || !isNaN(thing);
		}

		static isString(thing: any): bool {
			return Util.type(thing) == "string";
		}

		static isBool(thing: any): bool {
			return Util.type(thing) == "boolean";
		}

		static isBoolLike(thing: any): bool {
			return isBool(thing) || ("" + thing).match(/^(true|false)$/)
		}

		static isPrimitive(thing: any): bool {
			return thing === null || thing === undefined || Util.isString(thing) || Util.isBool(thing) || Util.isNumber(thing); //TODO: Date? Regex?
		}

		static isArray (thing : any) : bool {
			return Object.prototype.toString.call( thing ) === '[object Array]'
		}

		static isObject(thing: any): bool {
			return Object.prototype.toString.call(thing) === '[object Object]'
		}

		static toNumber(num: any): number {
			return isNumber(num) ? num : 1 * <any>num;
		}

		static toBool(val: any): bool {
			return isBool(val) ? val : "" + val === "true";
		}

		static find(thing : any, array : any[]) : number {
			if (!Util.isArray(array))
				throw "Second argument should be array";
			for (var i = 0; i < array.length; i++)
				if (array[i] == thing)
					return i;
			return -1;
		}

		static type (obj : any) {
			if (obj == null)
				return String(obj);
			else {
				//8 = length of "[object "
				return Object.prototype.toString.call(obj).substring(8).replace(/\]$/,"").toLowerCase();
			}
		}

		static makeArray (ar : any) : any[] {
			var res = [];
			var i = ar.length;
			for(;i;i--)
				res[i-1] = ar[i-1];
			return res;
		}


		/**
		 * binarySearch returns the first index of an object greater than needle.
		 * - list
		 * - needle
		 * - comperator (func(a, b) -> int)

		 * returnvalue in 0..list.length
		 */
		static binarySearch (list : any[], needle : Object, comperator : (left: any, right: any) => number) : number {
			var l = list.length - 1;
			var lower = 0;
			var upper = l;

			if (l == -1)
				return 0;

			//first check the last one, which is 'out of range'
			if (comperator(needle, list[l]) > 0)
				return list.length;

			while(upper - lower > 1) { //check last one manually, loop might not finish due to rounding (avg(upper, loweer) == lower))
				var t = Math.round((upper + lower) / 2);
				var v = comperator(needle, list[t]);
				if (v < 0)
					upper = t;
				else
					lower = t;
			}

			if (upper == lower)
				return upper;
			else if (comperator(needle, list[lower]) < 0) //edge case, see prev comment
				return lower;
			return upper;
		}

		static identity (x) { return x }
		static noop () {}
		public static notImplemented(): any { throw new Error("Not implemented. This function is TODO or supposed to be abstract"); }

		//TODO: factor out, should not be needed!
		public static applyConstructor(ctor: new (...args: any[]) => any, params: any[]) : any {
			//Source: http://stackoverflow.com/questions/3871731/dynamic-object-construction-in-javascript
			var obj, newobj;

			// Use a fake constructor function with the target constructor's
			// `prototype` property to create the object with the right prototype
			function fakeCtor() {
			}
			fakeCtor.prototype = ctor.prototype;
			obj = new fakeCtor();

			// Set the object's `constructor`
			obj.constructor = ctor;

			// Call the constructor function
			newobj = ctor.apply(obj, params);

			// Use the returned object if there is one.
			// Note that we handle the funky edge case of the `Function` constructor,
			// thanks to Mike's comment below. Double-checked the spec, that should be
			// the lot.
			if (newobj !== null
				&& (typeof newobj === "object" || typeof newobj === "function")
				) {
				obj = newobj;
			}

			// Done
			return obj;
		}

		static randomUUID () {
			return "todo";
		}

		static extractStringMap(input: string, prefix: string): any[]{
			//From miniup langauge definition
			var StringSingle = /'([^']|(\\[btnfr"'\\]))*'/g;
			var StringDouble = /"([^"]|(\\[btnfr"'\\]))*"/g;

			var map = {};
			var cnt = 0;
			var matcher = (match) => {
				var key = "" + prefix + (++cnt);
				map[key] = match;
				return key;
			}

			var output = input.replace(StringSingle, matcher).replace(StringDouble, matcher);				
			return [output, map];
		}

		static runtests(tests : Object) {
			var report : string[] = ["\n==[ TEST REPORT ]=="]
			var assert = typeof (require) !== "undefined" ? require("assert") : (<any>window).assert;
			var count = 0;
			var success = 0;
			var origdone = assert.done;

			var filter = function(_:string):bool { return true; }
			if (typeof (process) !== "undefined" && process.argv.length == 3)
				filter = function (name: string) { return name.indexOf(process.argv[2]) != -1; }
			else if (typeof (window) !== "undefined")
				filter = (name) => name.indexOf(window.location.hash.substring(1)) != -1;

			var failed = true;
			for(var key in tests) if (filter(key)) {
				console.log("\n[\x1b[34mRun\x1b[0m]   " +  key + "\n")

				failed = true; count += 1;
				assert.done = function() {
					report.push("[\x1b[32mok\x1b[0m]   " + key);
					failed = false;
					success +=1;
				}
				try {
					tests[key](assert);
					if (failed)
						throw new Error("Test finished without calling 'done'")

				}
				catch (e) {
					console.error(e)
					console.error(e.stack);

					report.push("\n[\x1b[1m\x1b[31mFAIL\x1b[0m] " + key + ":\n          " + e);
					if (e.stack)
						report.push("\x1b[37m      " + e.stack.split("\n")[1] + "\x1b[0m")
				}
			}

			console.log(report.join("\n"))
			console.log("\nCompleted test run: " + success + " out of " + count + " tests succeeded")
			assert.done = origdone;
		}
	}
}