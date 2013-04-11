///<reference path='base.ts'/>
///<reference path='binding.ts'/>
///<reference path='cell.ts'/>
///<reference path='expression.ts'/>
///<reference path='list.ts'/>
///<reference path='record.ts'/>
///<reference path='transformations.ts'/>
///<reference path='aggregations.ts'/>

module NOA {
export class NOA {

    //MWE: todo proper syntax for private members?
    static depth = 0;
    static count = 0;
    static testnr = 0;
    static GLOBALSCOPE = (function() { return this; })(); //MWE: TODO: proper?

    /**
     if debugbreakon is set, the debugger will pause when entering the provided debug line
     */
    static  debugbreakon = -1;

    /**
     writes debug data to the console (see NOA.debug) and increases the indentation depth before doing so
     */
    static debugIn(...args: any[]) {
        depth += 1;
        NOA.debug.apply(NOA, arguments);
    };

    /**
     reduces the debug indentation depth (see debugIn)
     */
    static debugOut(...args: any[]) {
        depth = Math.max(depth - 1, 0);
    };

    /**
     accepts an arbitrary list of things and prints them to the console
     */
    static debug(...args: any[]) {
        count += 1;
        var p = '';
        for(var i = depth; i >= 0; i--, p+=' ')
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

        console.log(count + ':' + p + stuff.join(' '));
        if (count == NOA.debugbreakon) {
            debugger;
        }
    };

    static warn(...args: any[]) {
        console.warn.apply(console, arguments);
    }

    /**
     assert the value argument to be true, throws an exception otherwise
     */
    static assert (value : any) {
        if (!value)
            throw "NOA assertion failed!";
    };

    /**
     * [test description]
     * @param  {[type]} test [the expression to be tested]
     * @param  {[type]} expected [the expected value]
     * @return {[type]}
     */
    static test(test : any, expected: any) : void {
        testnr += 1;
        if (('' + test) != ('' + expected)) {
            var msg = "Test #" + testnr + " failed: '" + test + "' expected '" + expected + "'";
            console.error(msg);
            document.write("<br/>" + msg);
        }
    }

    static each (ar : any, cb : (any, int /*, any, Object*/) => bool, scope? : Object, flags? : string) : any {
        scope = scope || GLOBALSCOPE;
        flags = flags || "";

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
            isArray = NOA.isArray(ar);

        if (isArray){
            for(var i = start; i != end; i += delta) {
                if (ar[i] == null && sparse)
                    continue;

                var value = cb.call(scope, ar[i], i, ar, scope);

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

                var value = cb.call(scope, ar[key], key, ar, scope);

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


    /** makes a path available, given a context
     *  path: string or array
     *  scope: nothing or base scope
     *
     *  returns the most inner object
     */
    static ensureObject (path : string, scope? : Object) : Object {
        var parts;
        if (NOA.type(path) == "array")
            parts = path;
        else
            parts = path.split(".");

        if (scope == undefined)
            scope = GLOBALSCOPE;

        for(var i = 0; i < parts.length; i++) {
            if (!scope[parts[i]])
                scope[parts[i]] = {};
            scope = scope[parts[i]];

        }
        return scope;
    };

    static exists(path : string, scope? : Object) : bool {
        var parts;
        if (NOA.isArray(path))
            parts = path;
        else
            parts = path.split(".");

        if (!scope)
            scope = GLOBALSCOPE;

        for(var i = 0; i < parts.length; i++) {
            if (!scope[parts[i]])
                return false;
            scope = scope[parts[i]];
        }
        return true;
    };

    static isFunction (thing : any) : bool {
        return NOA.type(thing) === "function";
    };


    static isNumber(thing: any): bool {
        return type(thing) == "number";
    }

    static isArray (thing : any) : bool {
        return Object.prototype.toString.call( thing ) === '[object Array]'
    }

    static inArray (thing : any, array : any[]) {
        if (!NOA.isArray(array))
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
	};

	static identity (x) { return x };
	static noop () {};
	public static notImplemented() { throw "Not implemented. This function is TODO or supposed to be abstract"}

	static randomUUID () {
		return "todo";
	};
}
}
/*
(function (root) {
    (function (root, NOA, exports, mod, define) {
        if (typeof exports === "object" && exports) {
            mod.exports = NOA; // CommonJS
        } else if (typeof define === "function" && define.amd) {
            define(NOA); // AMD
        } else {
            root.NOA = NOA; // <script>
        }
    })(root, NOA, root['exports'], root['module'], root['define']);
})(this);
*/