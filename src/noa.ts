///<reference path='util/util.ts'/>
///<reference path='util/base.ts'/>
///<reference path='util/binding.ts'/>

///<reference path='core/interfaces.ts'/>

///<reference path='types/constant.ts'/>
///<reference path='core/variable.ts'/>
///<reference path='core/expression.ts'/>
///<reference path='core/varcontainer.ts'/>
///<reference path='types/fun.ts'/>

///<reference path='types/list.ts'/>
///<reference path='types/record.ts'/>

///<reference path='types/error.ts'/>

///<reference path='util/serializer.ts'/>
///<reference path='core/langutils.ts'/>
///<reference path='lang/lang.ts'/>

///<reference path='lang/aggregations/aggregations.ts'/>

///<reference path='lang/transformations/transformations.ts'/>
///<reference path='lang/transformations/distinct.ts'/>
///<reference path='lang/transformations/filter.ts'/>
///<reference path='lang/transformations/join.ts'/>
///<reference path='lang/transformations/map.ts'/>
///<reference path='lang/transformations/reverse.ts'/>
///<reference path='lang/transformations/sort.ts'/>
///<reference path='lang/transformations/subset.ts'/>
///<reference path='lang/transformations/tail.ts'/>

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

