
/**
REQUIRE
*/
(function(nodejsrequire) {


var NOA = {};

NOA.isNodeJS = function() {
  return typeof(exports) != "undefined";
}

var GLOBALSCOPE = NOA.isNodeJS() ? exports : window;

var pendingModules = NOA.pending = {};

var basepath = "";

NOA.basepath = function(newbase) {
  basepath = newbase;
  return this;
}

function resolve(name, cb) {
  //loaded
  if (NOA.exists(name))
    cb.call(null, NOA.ensureObject(name));
  
  //not loading yet
  else if (!pendingModules[name]) {

    console.log("Loading " + name)

    pendingModules[name] = [cb];
    var filename = basepath + (name.replace(/\./g,"/") + ".js").toLowerCase();
    if (NOA.isNodeJS())
      nodejsrequire(filename);
    else {
      var s = document.createElement("script");
      s.src = filename;
      document.body.appendChild(s);
    }
    //else
    //  document.write("<script type='text/javascript' src='" + filename + "'></script>");
  }

  //being loaded
  else
    pendingModules[name].push(cb);
}

function define(name, value) {
  console.log("defining " + name);
  var cb; 

  if (NOA.exists(name, NOA))
    throw "NOA.define: already defined: " + name;

  var path = name.split(".");
  var key  = path.pop();
  NOA.ensureObject(path)[key] =  value;

  if (pendingModules[name])
    while(cb = pendingModules[name].shift())
      cb.call(null, value);

  delete pendingModules[name];

  return value;
}

function require(thing, cb) {
  if (NOA.isFunction(thing))
    //thing(NOA)
    thing();
  else if (!NOA.isFunction(cb)) {
    console.trace();
    throw "NOA.require: second argument should be function. Found: " + JSON.stringify(arguments);
  }
  else if (!NOA.isArray(thing)) {
    resolve(thing, function(resolved) {
      cb();//.call(null, resolved, NOA)
    })
    /*TODO: check if script call returns. setTimeout(10*1000, function() {
      if (!modules[thing])
        throw "Failed to resolve '" + thing + "' in 10 seconds"
    })*/
  }
  else if (NOA.isArray(thing)) {
    var res = [];
    var requirements = arguments[0];
    var left = requirements.length;
    res[left] = NOA; //always pass NOA Core as last argument
    for(var i = 0; i < requirements.length; i++) {
      (function(idx) {
        require(requirements[idx], function(resolved){
          res[idx] = resolved;
          left -= 1;
          if (left == 0)
            //cb.apply(null, res);
            cb();
        })
      })(i)
    }
  }
  else
    throw "unexpected required thing : " + thing;
}



/** DECLARE */
   
NOA.declare = function(name, properties /* and more properties.. */) {
    //setup the namespace
    var parts = name.split("."), i = 0;
    var typename = parts.pop();
    
    var scope = NOA.ensureObject(parts);  
    //var typename = name;
    var noaid = 0;

    //setup the prototype
    var implementsAr = [];
    var mixins = NOA.makeArray(arguments); //todo: UTIL.MAKEARRAY
    mixins.shift(); //remove first argument from array
    for(var i = 0; i < mixins.length; i++) {
      if (NOA.isFunction(mixins[i])) {
        mixins[i] = mixins[i].prototype; //From the mixins, if it a constructor, take the prototype
        if (mixins[i].interfaces)
          implementsAr = mixins[i].interfaces().concat(implementsAr); //ImplementsAr: this thing implements everything our mixins implements
      }
    }
    implementsAr.unshift(name);
    
    //constructor    
    var constructor = scope[typename] = function() {
        if (this == scope || this == GLOBALSCOPE || this == null) { //TODO: what is default scope in NODE js?
            NOA.warn("[NOA.util.declare] Constructor '" + name +"' called without new keyword");
            return arguments.callee.apply({}, arguments); //TODO: does empty object even if there are prototypes?
        }
        noaid += 1;
        this.noaid = noaid;
        this.init.apply(this, arguments);
        //arguments.callee.count = arguments.callee.count ? 1 + arguments.callee.count : 1;
        console.log("created" + typename);
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
              if (NOA.isFunction(thing) && NOA.isFunction(proto[propname])) {
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
      return !!(thing && thing.interfaces && NOA.inArray(this.classname, thing.interfaces()) > -1);
    }

    /*proto.free = function() {
      console.log("freed " + typename);
      scope[typename].count -= 1;
    }*/

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

    NOA.define(name, constructor);
    return constructor;  
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

  NOA.warn = function() {
    console.warn.apply(console, arguments);
  }

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
  scope = scope || GLOBALSCOPE;
  flags = flags || "";

  //valid flags are (m)ap, (f)filter, (s)parse, (r)everse
  //sparse skips the callback for non-values
  //reverse calls the callbacks in reverse order for arrays, which is useful while modifying the array while iterating
  var map     = flags.match(/m/),
      filter  = flags.match(/f/),
      sparse  = flags.match(/s/),
      isArray = NOA.type(ar.length) === "number", //no real array, but array like
      reverse = flags.match(/r/), 
      res     = isArray ? [] : {},
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
        scope = GLOBALSCOPE;
    
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
        scope = GLOBALSCOPE;
    
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

NOA.isArray = function(thing) {
  return Object.prototype.toString.call( thing ) === '[object Array]'
}

NOA.inArray = function(thing, array) {
  if (!NOA.isArray(array))
    throw "Second argument should be array";
  for (var i = 0; i < array.length; i++)
    if (array[i] == thing)
      return true;
  return false;
}

NOA.type = function(obj) {
  if (obj == null)
    return String(obj);
  else {
    //8 = length of "[object "
    return Object.prototype.toString.call(obj).substring(8).replace(/\]$/,"").toLowerCase();
  }
}

NOA.makeArray = function(ar) {
    var res = [];
    var i = ar.length;
    for(;i;i--)
      res[i-1] = ar[i-1];
    return res;
  }


/* Node jS */
/*(if (NOA.isNodeJS())
  exports = NOA; //TODO: wut?
else if (typeof(window) != "undefined") 
  GLOBALSCOPE.NOA = NOA;
else
  throw "Unrecognized environment! No NodeJS. No browser. Noa is lost"
*/
/** Declare noa core itself */
NOA.require = require;
NOA.define = define;
NOA.define("NOA", NOA);


})(typeof(require) != "undefined" ? require : null); //save pointer to nodejs require if possible