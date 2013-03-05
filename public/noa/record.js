/**
 * @author Michel
 */

//NOA.require("NOA.List");
NOA.require(["NOA.core.Base", "NOA.core.Cell"], function() {

NOA.declare("NOA.Record", NOA.core.Base, {
	data : null,
	keys : null,
	keyidx : null, //index of key in keys

	init : function() {
		this.data = {};
		this.keys = new NOA.List();
	},
	
	set : function(key, value) {
		var has = this.has(key);
		if (!has) { //add key value set
			this.data[key] = new NOA.core.Cell(this, key, value);
			this.keys.add(key); //TODO: mwe, swapped with above line, does not trigger error?
			this.fire('put',key, value);
		}
		
		else { //knownkey
			var orig = this.get(key);
			if (orig != value) { //update existing key //TODO: proper equal method
				this.data[key]._store(value);
				this.fire('put',key, value, orig);
			} 
		}
	},
	
	remove : function(key) {
		if (!this.has(key))
			return;
			
		this.fire('remove', key);
		this.data[key].free();
		
		this.keys.removeAll(key);
		delete this.data[key];
	},

	cell : function(key) {
    	return this.data[key];
    },
	
	get : function(key, scope, onchange) {
		if (!this.has(key))
			throw "Value for '" + key + "' is not yet defined!"
		//	return null;
		return this.data[key].get(scope, onchange);		
	},
	
	has : function(key) {
		return key in this.data;
	},
	
	keys : function() {
		return this.keys;
	},
	
	replaySets : function(scope, handler) {
		for(var key in this.data)
			handler.call(scope, key, this.get(key));	
	},

	toObject : function() {
		var res = {};
		for(var key in this.data)
			res[key] = this.get(key);
		return res;
	},

	free : function() {
		for(var key in this.data)
			this.data[key].die().free();

		this.keys.free();

	}
});

}); //require