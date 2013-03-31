///<reference path='noa.ts'/>

/** basic class with init, events etc */
module NOA {

	export class BaseData {
		private events : Object = {}; //map of string -> Binding[] with listeners
		private subscriptions: Object = {}; //map of string -> Binding with listening to..

		public debugname : string = null;
		public refcount = 0;


		public removeSubscription(binding: Binding) {
		    delete this.subscriptions[binding.id];
		}

		public addSubscription(binding: Binding) {
		    this.subscriptions[binding.id] = binding;
		}

		public getSubscriptions(): Binding[] {
		    var res = [];
		    for (var key in this.subscriptions)
		        res.push(this.subscriptions[key]);
		    return res;
		}

		public getListeners(eventname: string): Binding[]{
            if (this.events[eventname])
                return this.events[eventname];
            return [];
		}

		public addEventListener(binding: Binding) {
		    var eventname = binding.event;
		    if (!this.events[eventname])
		        this.events[eventname] = {};
		    this.events[eventname][binding.id] = binding;
		}

		public removeEventListener(binding: Binding) {
		    delete this.events[binding.event][binding.id];
		}

		public free() {
		    NOA.each(this.events, listeners =>
                NOA.each(listeners, listener => listener.free())); //Does JS behave as expected under concurrent modifications?

		    NOA.each(this.subscriptions, h => h.free());
		}
	}

	export class Base {

		static noaid : number = 0;

		public  noaid : number;
		public  noabase: BaseData;
		public  destroyed : bool = false;
		private freeing : bool = false;

		//TODO:? static count : number = 0;

		constructor() {
		    this.noabase = new BaseData();
			this.noaid = Base.noaid += 1;
			var x = this['prototype']; //work around for webstorm typescript
			if (!x.count)
				x.count = 0;
			x.count += 1;
		}


		/*
		 * fires an event, invoking all registered callbacks (see onEvent)
		 * - eventsource (this)
		 * - eventname
		 */
		fire (event : string, ...args : any[]) {
			if (this.destroyed)
				return this;
			var a = NOA.makeArray(arguments);
			a.shift();

			var listeners = this.noabase.getListeners(event);
			var l = listeners.length;

			if (l > 0) {
				NOA.debugIn(this,"fires",event,":",a);

				for(var i = 0 ; i < l; i++)
					if (listeners[i])
						listeners[i].fire.apply(listeners[i], a); //Note, event name is included in the call

				NOA.debugOut();
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
		on(ev : string, caller : Base, callback : Function) : Binding {
            //TODO: revise this method. Is it ever freed from the other side? introduce second argument owner?
			var a = NOA.makeArray(arguments);
			var event = a.shift();
			var f = a.shift();
			var scope = this;

			if (!NOA.isFunction(f)) //Nope, its the scope...
				scope = f;
			f = a.shift();

			return new Binding( event, this, caller, f);
		}


		/*
		 Listen to an event in another object. Free the listener upon destruction
		 - other
		 - event
		 - callback
		 - hitched args

		 returns this
		 */
		listen (other: Base, event: string, callback: Function) {
			other.on(event, this, callback)
			return this;
		}

		unlisten (other: Base, event: string){
			if (!this.destroyed && !this.freeing) {
				var ar = this.noabase.getSubscriptions(), l = ar.length;
				for(var i = 0; i < l; i++)
					if (ar[i] && ar[i].source == other && ar[i].event == event)
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

			this.noabase.free();

			//delete this.constructor.instances[this.noaid];
			this.destroyed = true;
			delete this.freeing;
			this.noabase = null; //forget the handlers, hope GC picks them up :)
			this['prototype'].count -= 1; //Webstorm typescript workaround
		}

		/*
		 * See onChange, but triggers on the 'free' event.
		 */
		onFree (caller: Base, callback: Function) {
			this.on('free', caller, callback);
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

		uses (that: Base) : Base{
			if (that) {
				that.live();
				this.onFree(this, () => that.die());
			}
			return this;
		}

		debugName (newname? : string) : string {
			if (newname === undefined) {
				if (this.noabase && this.noabase.debugname)
					return this.noabase.debugname;
				return this.toString();
			}
			else {
				this.noabase.debugname = newname;
				return this.toString();
			}
		}

		debug (...args : any[]) {
			NOA.debug.apply(NOA, [this].concat(NOA.makeArray(arguments)));
		}

		debugIn(...args: any[]) {
			NOA.debugIn.apply(NOA, [this].concat(NOA.makeArray(arguments)));
		}

		debugOut(...args: any[]) {
			NOA.debugOut();
		}

		toString() : string {
			return this['prototype'].toString.apply(this);
		}
	}

	export var Events : GlobalEvents = new GlobalEvents();

	export class GlobalEvents extends Base {

	    onListMove() { }

	    onListSet() { }

	    onListInsert() { }

	    onListRemove() { }

	    onRecordPut() { }

	    fireListMove() { }

	    fireListSet() { }

	    fireListRemove() { }

	    fireListInsert() { }

	    fireRecordPut() { }
	}
}
