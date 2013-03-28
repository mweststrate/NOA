/** basic class with init, events etc */
module NOA {

	export class Base {

		static noaid : number = 0;

		public  noaid : number;
		public  noabase: Object;
		public  destroyed : bool = false;
		private freeing : bool = false;

		//TODO:? static count : number = 0;

		constructor () {
			this.noaid = NOA.Base.noaid += 1;
			var x = this['prototype']; //work around for webstorm typescript
			if (!x.count)
				x.count = 0;
			x.count += 1;

			this.noabase = {
				events : {},
				handlers : [],
				debugname : null,
				refcount : 0
			}
		}


		/*
		 * fires an event, invoking all registered callbacks (see onEvent)
		 * - eventsource (this)
		 * - eventname
		 */
		fire (event : String /*args*/) {
			if (this.destroyed)
				return this;
			var a = NOA.makeArray(arguments);
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
		}

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
		on(ev : string, callback : Function) {

			var a = NOA.makeArray(arguments);
			var event = a.shift();
			var f = a.shift();
			var scope = this;

			if (!NOA.isFunction(f)) //Nope, its the scope...
				scope = f;
			f = a.shift();

			return new NOA.core.Binding(event, this, scope, f, a);
		}


		/*
		 Listen to an event in another object. Free the listener upon destruction
		 - other
		 - event
		 - callback
		 - hitched args

		 returns this
		 */
		listenTo (other: NOA.Base, event: string, callback: Function) {
			other.on(event, callback)
			return this;
		}

		unlistenTo (thing, event){
			if (!this.destroyed && !this.freeing) {
				var ar = this.noabase.handlers, l = ar.length;
				for(var i = 0; i < l; i++)
					if (ar[i] && ar[i].source == thing && ar[i].event == event)
						ar[i].free();
			}
			return this;
		}

		free () {
			if (this.destroyed || this.freeing)
				return;
			this.freeing = true;

			if (this.noabase.refcount > 0)
				throw this.debugName() + " refuses to destruct: It is kept alive by something else.";

			this.fire('free')

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
			this['prototype'].count -= 1; //Webstorm typescript workaround
		}

		/*
		 * See onChange, but triggers on the 'free' event.
		 */
		onFree (callback: Function) {
			this.on('free', callback);
			return this;
		}


		live () {
			this.noabase.refcount += 1;
			this.debug("live", this.noabase.refcount);

			if (this.destroyed)
				throw this + " Attempt to resurrect!"

			return this;
		}

		die () {
			if (this.destroyed || this.freeing)
				return this;

			this.noabase.refcount -= 1;
			this.debug("die", this.noabase.refcount);
			if (this.noabase.refcount == 0)
				this.free();
			else if (this.noabase.refcount < 0)
				throw this + " Trying to kill a thing which is not living";
			return this;
		}

		uses (that) {
			if (that) {
				that.live();
				this.onFree(() => that.die());
			}
			return this;
		}

		debugName (newname) {
			if (newname === undefined) {
				if (this.noabase && this.noabase.debugname)
					return this.noabase.debugname;
				return this.toString();
			}
			else {
				this.noabase.debugname = newname;
				return this;
			}
		}

		debug () {
			NOA.debug.apply(NOA, [this].concat(NOA.makeArray(arguments)));
		}

		debugIn () {
			NOA.debugIn.apply(NOA, [this].concat(NOA.makeArray(arguments)));
		}

		debugOut () {
			NOA.debugOut();
		}

		toString() : String {
			return this['prototype'].toString.apply(this);
		}
	}
}
