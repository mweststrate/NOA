module NOA {

	export class Binding {

		private event : String;
		private source : Base;
		private sidx : number;
		private dest : Base;
		private didx : number;
		private callback : Function;
		private _firing : bool = false;

		constructor (event: string, source: Base, dest : Base, callback : Function) {
			if (!callback)
				throw this.toString() + ": no callback provided!";
			this.event = event;

			this.source = source;
			if (!source.noabase.events[event])
				source.noabase.events[event] = [];
			this.sidx = source.noabase.events[event].length;
			source.noabase.events[event].push(this);

			this.dest = dest instanceof Base ? dest : null;
			if (this.dest){
				this.didx = dest.noabase.handlers.length;
				dest.noabase.handlers.push(this); //TODO: make handlers object, generate nr for this binding and delete by key to reduce memory print
			}

			//console.info("Listening: " + this.source + " -> " +  this.event + " -> " + (this.dest ? this.dest : "(unknown)"));

			this.callback = callback;
		};

		fire () {
			if (this._firing) {
				if (this.event == 'free')
					return; //Special case, items can attempt to free each other if intertwined as a result of the refcount mechanism
				throw this.toString() + ": exception: circular event detected";
			}
			this._firing = true;

			//console.info("Firing: " + this.source + " -> " +  this.event + " -> " + (this.dest ? this.dest : "(unknown)"));
			try {
				this.callback.apply(this.dest, arguments);
			}
			finally {
				this._firing = false;
			}
		};

		free (){
			if (this.dest)
				this.dest.noabase.handlers[this.didx] =  null;
			this.source.noabase.events[this.event][this.sidx] = null;
		};

		toString () {
			return "[NOA.util.Binding on '"+ this.event +"']";
		}
	}
}