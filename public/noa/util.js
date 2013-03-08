NOA.require(["NOA.core.Base", "NOA.core.Binding"], function(){

  var util = {};
  NOA.define("NOA.util", util);



/**
 * binarySearch returns the first index of an object greater than needle.
 * - list
 * - needle
 * - comperator (func(a, b) -> int)
 
 * returnvalue in 0..list.length
 */
util.binarySearch = function(list, needle, comperator) {
  var l = list.length - 1;
  var lower = 0;
  var upper = l;
  
  if (l == -1)
    return 0;
    
  //first check the last one, which is 'out of range'
  if (comperator(needle, list[l]) > 0)
    return list.length;
  
  while(upper - lower > 1) { //check last one manually, loop might not finish due to rounding (avg(upper, lower) == lower))
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

util.identity = function(_) { return _; };
util.noop = function() {};

util.randomUUID = function() {
  return "todo";
};

});