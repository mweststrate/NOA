/** basic class with init, events etc */
NOA.declare("NOA.core.Base", {
    init : function() {
      this.constructor.count += 1;

      /* Disabled, useful for debugging but a (potiential) 
      memory leak as well since objects cannog be gc-ed anymore until 
      free-ed by NOA (which might nog happen for cyclic referring objects)*/
      /*
      if (!this.constructor.instances)
        this.constructor.instances = [];
      this.constructor.instances[this.noaid] = this;
      */
    	this.noabase = {
            events : {},
            handlers : [],
            debugname : null,
            refcount : 0
        }
    },
    
    /* Fire all handlers registered in the onChange handler 
     	- all arguments are passed to the onChange handlers
     */
    changed : function(/* args */) {
    	var a = jQuery.makeArray(arguments);
    	a.unshift('changed');
    	return this.fire.apply(this, a);
        
    },
    
    /* 
     * Registers an onchange handler
     * - scope?
     * - callback
     * - bound arguments
     */
   	onChange : function(scope, callback /*hitchargs*/) {
   		var a = jQuery.makeArray(arguments);
    	a.unshift('changed');
    	return this.onEvent.apply(this, a);
   	},
   	
   	/*
   	 * fires an event, invoking all registered callbacks (see onEvent)
   	 * - eventsource (this)
   	 * - eventname
   	 * - arguments
   	 */
   	fire : function(event /*args */) {
   		if (this.destroyed)
        return this;
      var a = jQuery.makeArray(arguments);
   		a.shift();
   		
   		var listeners = this.noabase.events[event];
   		if (listeners) {
   			var l = listeners.length;
        
        if (l > 0) { 
          NOA.debugIn(this,"fires",event,":",a);

     			for(var i = 0 ; i < l; i++)
     				if (listeners[i])
     					listeners[i].fire.apply(listeners[i], a); //Note, event name is included in the call
     		
          NOA.debugOut();
        }
      }
      return this;
   	},
   	
   	/*
   	 * registers a handler on a certain event
   	 * the 'callback' is invoked on 'scope' when 'eventname' happens. Callbacks arguments are: [] eventname, bound arguments, event arguments ]
   	 * 
   	 * - eventname
   	 * - scope? (defaults to this);
   	 * - callback method
   	 * - bound arguments
   	 * 
   	 * Returns object, including a free method to destroy the listener (on both sides)
   	 */
   	onEvent : function(ev, sc /*? */, callback, hitchargs) {
   		
   		var a = jQuery.makeArray(arguments);
                var event = a.shift();
                var f = a.shift();
   		var scope = this;
                
                if (!jQuery.isFunction(f)) //Nope, its the scope...
   			scope = f;
   		f = a.shift();
   		
   		return new NOA.core.Binding(event, this, scope, f, a);
   	},

    on : function() {
      //TODO: remove onEvent
      this.onEvent.apply(this, arguments);
    },

    /*
     Listen to an event in another object. Free the listener upon destruction
     - other
     - event
     - callback
     - hitched args
     
     returns this
    */
    listenTo : function() {
        var a = jQuery.makeArray(arguments);
        var other = a.shift();
        a.splice(1,0, this); //set scope args to this
        
        var handler = other.onEvent.apply(other, a);
        return this;
    },

    unlistenTo : function(thing, event){
      if (!this.destroyed && !this.freeing) {
        var ar = this.noabase.handlers; l = ar.length;
        for(var i = 0; i < l; i++)
          if (ar[i] && ar[i].source == thing && ar[i].event == event)
            ar[i].free();
      }
      return this;
    },
   	
   	free : function() {
      if (this.destroyed || this.freeing)
        return;
      this.freeing = true;

      if (this.noabase.refcount > 0)
        throw this.debugName() + " refuses to destruct: It is kept alive by something else.";
        
      var a = jQuery.makeArray(arguments);
      a.unshift('free');
      this.fire.apply(this, a);
      
      for(var event in this.noabase.events) {
        var ar = this.noabase.events[event], l = ar.length;
        for(var i = 0; i < l; i++)
          if (ar[i])
            ar[i].free();
      }
      
      var ar = this.noabase.handlers; l = ar.length;
      for(var i = 0; i < l; i++)
        if (ar[i])
          ar[i].free();
      
      //delete this.constructor.instances[this.noaid];
      this.destroyed = true;
      delete this.freeing;
    	this.noabase = null; //forget the handlers, hope GC picks them up :)
      this.constructor.count -= 1;
   	},
   	
   	/*
   	 * See onChange, but triggers on the 'free' event. 
   	 */
   	onFree : function(scope, callback /*hitchargs*/) {
   		var a = jQuery.makeArray(arguments);
    	a.unshift('free');
    	return this.onEvent.apply(this, a);
   	},
   	
   	/*
   	 * Applies a function in the scope of this object
   	 * - function
   	 * - arguments
   	 */
   	exec : function(func /*args*/) {
   		var a = jQuery.makeArray(arguments);
   		var f = a.shift(); //the function
   		return f.apply(this, a);
                
    },
   	
   	/*
   	 * Binds a function to the scope of this object
   	 * - function (or function name)
   	 * - arguments to bind to the function
   	 */
   	bind : function(func /*hitchargs*/) {
   		var self = this;
   		var captured = jQuery.makeArray(arguments);
   		var f = captured.shift();
   		
   		return function() {
   			var a = jQuery.makeArray(arguments);
                        if (jQuery.isFunction(f))
                            return f.apply(self, captured.concat(a));
                        else
                            return self[f].apply(self, captured.concat(a));
   		}
   	},

    live : function() {
      this.noabase.refcount += 1;
      this.debug("live", this.noabase.refcount);

      if (this.destroyed)
        throw this + " Attempt to resurrect!"

      return this;
    },

    die : function() {
      if (this.destroyed || this.freeing)
        return this;

      this.noabase.refcount -= 1;
      this.debug("die", this.noabase.refcount);
      if (this.noabase.refcount == 0)
        this.free();
      else if (this.noabase.refcount < 0)
        throw this + " Trying to kill a thing which is not living";
      return this;
    },

    uses : function(that) {
      if (that) {
        that.live();
        this.onFree(that,that.die);
      }
      return this;
    },

    debugName : function(newname) {
      if (newname === undefined) {
        if (this.noabase && this.noabase.debugname)
          return this.noabase.debugname;
        else
          return this.toString();
      }
      else {
        this.noabase.debugname = newname;
        return this;
      }
    },

    debug : function() {
      NOA.debug.apply(NOA, [this].concat(jQuery.makeArray(arguments)));
    },

    debugIn : function() {
      NOA.debugIn.apply(NOA, [this].concat(jQuery.makeArray(arguments)));
    },

    debugOut : function() {
      NOA.debugOut();
    }


});
