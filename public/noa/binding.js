NOA(function(NOA) {
	
	NOA.declare("noa/binding", {
		init : function(event, source, dest, callback, args) {
			if (!callback)
				throw this.toString() + ": no callback provided!";
			this.event = event;

			this.source = source;
			if (!source.noabase.events[event])
				source.noabase.events[event] = [];
			this.sidx = source.noabase.events[event].length;
			source.noabase.events[event].push(this);

			this.dest = dest;
			this.dIsNoa = dest && dest.noabase;
			if (this.dIsNoa) {
				this.didx = dest.noabase.handlers.length;
				dest.noabase.handlers.push(this);
			}
			
			//console.info("Listening: " + this.source + " -> " +  this.event + " -> " + (this.dest ? this.dest : "(unknown)"));
			
			this.callback = callback;
			this.args = args;
		},
		
		fire : function() {
			if (this._firing) {
				if (this.event == 'free')
	        return; //Special case, items can attempt to free each other if intertwined as a result of the refcount mechanism
	      throw this.toString() + ": exception: circular event detected";
	    }
			this._firing = true;
			
			var a = jQuery.makeArray(arguments);
			
			//console.info("Firing: " + this.source + " -> " +  this.event + " -> " + (this.dest ? this.dest : "(unknown)"));
			try {
				this.callback.apply(this.dest, this.args.concat(a));
			}
			finally {
				this._firing = false;
			}
		},
		
		free : function(){
			if (this.dIsNoa && this.dest.noabase)
				this.dest.noabase.handlers[this.didx] =  null;
			this.source.noabase.events[this.event][this.sidx] = null;
		},
	        
	  toString : function() {
	      return "[noa/binding on '"+ this.event +"']";
	  }
	});
});