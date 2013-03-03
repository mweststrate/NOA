NOA(["noa/util", "noa/record", "noa/list", "noa/cell", "noa/expression"], function(util, record, list, cell, express) {
  core = {};

  NOA.define("noa/core", core);


  /**
  	accepts a string value and returns a NOA object structure, consisting of lists and records
  */
  core.fromJson = function(value) {
    return NOA.fromJS(jQuery.fromJSON(value));
  };

  (function() {

    primitivetypes = { boolean : 1, number : 1, string : 1, date : 1};
    strangetypes = { function : 1, regexp : 1 };

    /**
    	converts a javascript object/ value into a NOA object/ value
    	arrays map to NOA.List,
    	objects map to NOA.Record,
    	primitive values map to primitive values
    */
    core.fromJS = function(value) {
      if (value === null || value === undefined)
        return null;

      var type = jQuery.type(value);
      if (type in primitivetypes)
        return value;
      else if (type in strangetypes)
        return NOA.error("Unserializable type: " + type);
      else if (type === "array") {
        var res = new NOA.List();
        for(var i = 0, l = value.length; i < l; i++)
          res.add(NOA.fromJS(value[i]));      
        return res;
      }
      else { //object
        var res = new NOA.Record();
        for(var key in value)
          res.set(key, NOA.fromJS(value[key]));
        return res;
      }
    };
  })();
});