///<reference path='util.ts'/>
///<reference path='base.ts'/>
///<reference path='binding.ts'/>
///<reference path='containers.ts'/>
///<reference path='interfaces.ts'/>
///<reference path='variable.ts'/>
///<reference path='cell.ts'/>
///<reference path='expression.ts'/>
///<reference path='list.ts'/>
///<reference path='record.ts'/>
///<reference path='scope.ts'/>
///<reference path='serializer.ts'/>
///<reference path='lang.ts'/>
///<reference path='error.ts'/>
///<reference path='aggregations/aggregations.ts'/>

///<reference path='transformations/transformations.ts'/>
///<reference path='transformations/distinct.ts'/>
///<reference path='transformations/filter.ts'/>
///<reference path='transformations/join.ts'/>
///<reference path='transformations/map.ts'/>
///<reference path='transformations/reverse.ts'/>
///<reference path='transformations/sort.ts'/>
///<reference path='transformations/subset.ts'/>
///<reference path='transformations/tail.ts'/>

module NOA {
	//Empty module, this is here just for the imports
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

//MWE this is a poor attempt to fix the export mechanism of typescript which I don't understand.
//If the module is exported, commonJS / AMD define code is generated. However, this causes that it
//is no longer to extend the NOA namespace of multiple files. Properly there is a proper way
//to do this, but for now, just export all items in the NOA namespace suffices.

declare var exports : any;
(function(root) {
//var exports = root['exports'];
	if (typeof(exports) !== "undefined") for(var key in NOA)
		exports[key] = NOA[key];
})(this);

