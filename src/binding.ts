///<reference path='noa.ts'/>
module NOA {

	export class Binding {
		static bindingcount = 0;

		event : string;
		source : Base;

		public id : string; //MWE: should be number, but number is not supported as object index
		private dest : Base;
		private callback : Function;
		private _firing : bool = false;

		constructor (event: string, source: Base, dest : Base, callback : Function) {
			if (!callback)
				throw this.toString() + ": no callback provided!";

			this.id = "" + (++Binding.bindingcount);
			this.event = event;

			this.source = source;
			source.noabase.addEventListener(this);

			this.dest = dest instanceof Base ? dest : null;
			if (this.dest)
				this.dest.noabase.addSubscription(this);

			//console.info("Listening: " + this.source + " -> " +  this.event + " -> " + (this.dest ? this.dest : "(unknown)"));

			this.callback = callback;
		}

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
		}

		free (){
			if (this.dest)
				this.dest.noabase.removeSubscription(this);
			this.source.noabase.removeEventListener(this);
		}

		toString () {
			return "[NOA.util.Binding on '"+ this.event +"']";
		}
	}
}