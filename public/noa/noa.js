if (!window.NOA) {
  window.NOA = {
        basepath : window.location.href.substring(0, 1 + window.location.href.lastIndexOf('/'))
          //.replace("file:///", "file://") //MWE: XXX need in chrome?!
  };
}

/**
 REQUIRE
 */
(function() {
	var reqs = {};

  function loadScriptJQ(url, cb) {
    jQuery.ajax({
      url : url,
      isLocal : window.location.protocol.indexOf("file:") == 0,
      dataType : "script",
      async : false,//TODO: async or not async?
      error : function(jqXHR, textStatus, errorThrown) {
        throw "NOA.require(jQuery): failed to load " + url + ". Error: " + textStatus + ": " + errorThrown;
      },
      success : cb
    });
  };

  function loadScriptPlain(url, check, cb) {
    document.write("<script type='text/javascript' src='" + url + "'></script>");
  };

  function loadScript(thing, url, cb) {
    if (NOA.exists(thing))
      cb();
    else {
      if (jQuery) {
        loadScriptJQ(url, function() {
          if (!NOA.exists(thing)) //post condition; thing should be available
            throw "NOA.require(jQuery): failed to load " + url + ". The file loaded correctly but '" + thing + "' has not been found";
          cb();
        });
      }
      else {
        loadScriptPlain(url);
        
        var attempts = 30;
        var check = function() {
          attempts -= 1;
          if (attemps == 0)
            throw "NOA.require(plain): failed to load '" + url + "'";
          if (NOA.util.exist(thing)) //TODO: find object more intelligently
            cb();
          else
            setTimeout(check, 100);
        };
        check();
      }
    }
  };
	
  NOA.require = function() {
  		var l = arguments.length;
  		
  		var callback = jQuery.isFunction(arguments[l - 1]) ? arguments[l - 1] : jQuery.noop;
  		
  		if (jQuery.isFunction(arguments[l-1]))
  			l -= 1;
  			
      var left = l;
  		for(var i = 0; i < l; i++) {
  			var thing = arguments[i];
  			if (!reqs[thing]) {
  				reqs[thing] = true;
          loadScript(thing, NOA.basepath + thing.replace(/\./g,"/").toLowerCase() + ".js", function() {
						left--;   
						if (left == 0)
							callback();
  				});
  			}
        else {
          left--;
  			
    			if (left == 0) //we had everything already
    				callback();
        } 
  		}
  }
})();

/** DECLARE */
   
NOA.declare = function(name, properties /* and more properties.. */) {
    //setup the namespace
    var parts = name.split("."), i = 0;
    var typename = parts.pop();
    var scope = NOA.ensureObject(parts);  
    var noaid = 0;

    //setup the prototype
    var implementsAr = [];
    var mixins = jQuery.makeArray(arguments);
    mixins.shift(); //remove first argument from array
    for(var i = 0; i < mixins.length; i++) {
      if (jQuery.isFunction(mixins[i])) {
        mixins[i] = mixins[i].prototype; //From the mixins, if it a constructor, take the prototype
        if (mixins[i].interfaces)
          implementsAr = mixins[i].interfaces().concat(implementsAr); //ImplementsAr: this thing implements everything our mixins implements
    }
  }
  implementsAr.unshift(name);
    
    //constructor    
    var constructor = scope[typename] = function() {
        if (this == scope || this == window) {
            NOA.warn("[NOA.util.declare] Constructor '" + name +"' called without new keyword");
            return arguments.callee.apply({}, arguments); //TODO: does empty object even if there are prototypes?
        }
        noaid += 1;
        this.noaid = noaid;
        this.init.apply(this, arguments);
        return this; //avoid warning
    };
    
    var proto = constructor.prototype = {}; //start with empty prototype
    
    //set toString on beforehand, so it can be overridden.  
    proto.toString = function() {
        return "[object " + this.constructor.classname + "#" + this.noaid + "]";  
    };
    
    //Copy properties from mixins
    for(var j = 0; j < mixins.length; j++) {
        for(var propname in mixins[j]) {
          (function() { //Function to capture thing in scope
            
              var thing = mixins[j][propname];
              if (jQuery.isFunction(thing) && jQuery.isFunction(proto[propname])) {
                        if (propname == "init") {
                            //already exists, lets monkey patch...
                            var base = proto[propname];
                            proto[propname] = function() {
                                    base.apply(this, arguments);
                                    thing.apply(this, arguments);
                                //func.superValue = base.apply(this, arguments); //TODO: document that superValue is available as arguments.callee.superValue ....
                                //return thing.apply(this, arguments);
                            }
                        }
                        else if (propname == "free") {
                            //already exists, lets monkey patch...
                            var base = proto[propname];
                            proto[propname] = function() {
                                    thing.apply(this, arguments); //NOTE: reverse order of init
                                    base.apply(this, arguments);
                                //func.superValue = base.apply(this, arguments); //TODO: document that superValue is available as arguments.callee.superValue ....
                                //return thing.apply(this, arguments);
                            }
                        }
                        else { //replace, but keep super pointer
                            thing.overrides = proto[propname];
                            proto[propname] = thing;   
                        }
              }
              else //one of them is not a function, just override
                  proto[propname] = thing;
                  
          })();
        }
    }
    
    //Finish; add some 'built ins' to the class
    constructor.classname = name; //store the classname
    proto.constructor = constructor; //store the constructor type to find the type back
    
    constructor.isA = function(thing) {
      return !!(thing && thing.interfaces && jQuery.inArray(this.classname, thing.interfaces()) > -1);
    }

    constructor.count = 0;
    
    //Some general functions
    proto.inherited = function() { 
        var f = args.callee;
        var g = f.overrides;
        if (!g)
          throw "inherited(): No super method available!";
            //return undefined;
        return g.apply(this, arguments);        
    };
    
    proto.interfaces = function() {
      return implementsAr;
    };    
};

/**
  declare debug helper function 
*/
(function() {
  var depth = 0;
  var count = 0;
  var testnr = 0;

  /**
  if debugbreakon is set, the debugger will pause when entering the provided debug line
  */
  NOA.debugbreakon = -1;

  /**
  writes debug data to the console (see NOA.debug) and increases the indentation depth before doing so
  */
  NOA.debugIn = function() {
    depth += 1;
    NOA.debug.apply(NOA, arguments);
  };

  /**
  reduces the debug indentation depth (see debugIn)
  */
  NOA.debugOut = function() {
    depth = Math.max(depth - 1, 0);
  };

  /**
  accepts an arbitrary list of things and prints them to the console
  */
  NOA.debug = function() {
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

  /**
    assert the value argument to be true, throws an exception otherwise
  */
  NOA.assert = function(value) {
    if (!value)
      throw "NOA assertion failed!";
  };
  
  /**
   * [test description]
   * @param  {[type]} test [the expression to be tested]
   * @param  {[type]} expected [the expected value]
   * @return {[type]}
   */
  NOA.test = function(test, expected) {
    testnr += 1;
    if (('' + test) != ('' + expected)) {
      var msg = "Test #" + testnr + " failed: '" + test + "' expected '" + expected + "'";
      console.error(msg);
      document.write("<br/>" + msg);
    }
  }

})();

NOA.each = function(ar, cb, scope, flags) {
  if (NOA.type(scope) == "string") {
    flags = scope; 
    scope = flags; //undefined probably..
  }
  scope |= window;
  flags |= "";

  //valid flags are (m)ap, (f)filter, (s)parse, (r)everse
  //sparse skips the callback for non-values
  //reverse calls the callbacks in reverse order for arrays, which is useful while modifying the array while iterating
  var map     = flags.test(/m/),
      filter  = flags.test(/f/),
      sparse  = flags.test(/s/),
      isArray = NOA.type(ar.length) === "number",
      reverse = flags.test(/r/), 
      result  = filter  || map      ? (isArray ? [] : {}): undefined,
      start   = reverse && isArray  ? ar.length -1 : 0,
      delta   = reverse             ? -1 : 1,
      end     = reverse || !isArray ? -1 : ar.length;
  ;
  if (isArray) {
    for(var i = start; i != end; i += delta) {
      if (ar[i] == null && sparse)
        continue;

      var value = cb.call(scope, ar[i], i, ar, scope);
      
      //TODO: awful conditions
      if (map && reverse)
        res.unshift(value);
      else if (map)
        res.push(value);
      else if (filter && reverse && value === true)
        res.unshift(ar[i]);
      else if (filter && value === true)
        res.push(ar[i]);
      else if (!filter && !map && value === false)
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
    
};

/** makes a path available, given a context
 *  path: string or array
 *  scope: nothing or base scope
 *
 *  returns the most inner object
 */
NOA.ensureObject = function(path, scope) {
    var parts;
    if (NOA.type(path) == "array")
        parts = path;
    else
        parts = path.split(".");
    
    if (scope == undefined)
        scope = window;
    
    for(var i = 0; i < parts.length; i++) {
        if (!scope[parts[i]]) 
            scope[parts[i]] = {};
       scope = scope[parts[i]];
      
    }
    return scope;
};

NOA.exists = function(path, scope) {
    var parts;
    if (NOA.type(path) == "array")
        parts = path;
    else
        parts = path.split(".");
    
    if (scope == undefined)
        scope = window;
    
    for(var i = 0; i < parts.length; i++) {
        if (!scope[parts[i]]) 
            return false;
       scope = scope[parts[i]];
    }
    return true;
}; 

NOA.isFunction = function(thing) {
  return NOA.type(thing) === "function";
};

NOA.type = function() {
  if (jQuery)
    NOA.type = jQuery.type;
  else {
    NOA.type = function(obj) {
      if (obj == null)
        return String(obj);
      else {
        //8 = length of "[object "
        return Object.prototype.toString.call(obj).substring(8).replace(/\]$/,"").toLowerCase();
      }
    }
  }
  return NOA.type.apply(NOA.util, arguments);
};