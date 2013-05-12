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

		public getListeners(eventname: string): {} {
			if (this.events[eventname])
				return this.events[eventname];
			return {};
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
			Util.each(this.events, listeners =>
				Util.each(listeners, listener => listener.free())); //Does JS behave as expected under concurrent modifications?

			Util.each(this.subscriptions, h => h.free());
		}
	}

	/* interface is needed because typescript 0.8 does not support class extending interfaces (0.9 does) */
	export interface IBase {
		free();
		live() : IBase;
		die(): IBase;
		uses(that: IBase): IBase;

		listen(other: IBase, event: string, callback: Function);

		unlisten(other: IBase, event?: string);

		on(ev: string, caller: IBase, callback: Function): Binding;
	}

	export class Base implements IBase {

		static noaid : number = 0;

		public  noaid : number;
		public  noabase: BaseData;
		public  destroyed : bool = false;
		private freeing : bool = false;

		constructor() {
			this.noabase = new BaseData();
			this.noaid = Base.noaid += 1;

			//TODO: expensive? use global debug flag
			var x : any = this;
			while(x = x['__proto__']) {
				if (!x.constructor.count)
					x.constructor.count = 0;
				x.constructor.count += 1;
			}
		}

		/*
		 * fires an event, invoking all registered callbacks (see onEvent)
		 * - eventsource (this)
		 * - eventname
		 */
		fire (event : string, ...args : any[]) {
			if (this.destroyed)
				return this;
			//TODO: remove all makeArray's, done by typescript :)
			var a = Util.makeArray(arguments);
			a.shift();

			var listeners = this.noabase.getListeners(event);
			//TODO: randomize the listners array before firing for test purposes
			Util.debugIn(this,"fires",event,":",a);

			for(var key in listeners)
				if (listeners[key])
					listeners[key].fire.apply(listeners[key], a); //Note, event name is included in the call

			Util.debugOut();
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
			var a = Util.makeArray(arguments);
			var event = a.shift();
			var f = a.shift();
			var scope = this;

			if (!Util.isFunction(f)) //Nope, its the scope...
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
		listen (other: IBase, event: string, callback: Function) {
			other.on(event, this, callback)
			return this;
		}

		unlisten (other: IBase, event?: string){
			if (!this.destroyed && !this.freeing) {
				var ar = this.noabase.getSubscriptions(), l = ar.length;
				for(var i = 0; i < l; i++)
					if (ar[i] && ar[i].source == other && (!event || ar[i].event == event))
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
			//this.noabase = null; //forget the handlers, hope GC picks them up :)

			//TODO: expensive; only do this if special debug flag is set?
			var x : any = this;
			while(x = x['__proto__']) {
				if(x.constructor.count !== undefined)
				   x.constructor.count -= 1;
			}
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
				throw new Error(this + " Attempt to resurrect!");

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
				throw new Error(this + " Trying to kill a thing which is not living");
			return this;
		}

		uses (that: Base) : Base{
			if (that) {
				that.live();
				this.onFree(this, () => that.die());
				that.onFree(this, () => this.die()); //MWE: added, might cause problems
			}
			return this;
		}

		unuse(that: Base) : Base {
			if (that) {
				that.die();
				//TODO: mimic uses, use list in NOAbase?
			}
			return this;
		}

		debugName () : string;
		debugName (newname : string) : Base;
		debugName (newname? : string) : any {
			if (!newname) {
				if (this.noabase && this.noabase.debugname)
					return this.noabase.debugname;
				return this.toString();
			}
			else {
				this.noabase.debugname = newname;
				return this;
			}
		}

		debug (...args : any[]) {
			Util.debug.apply(Util, [this].concat(Util.makeArray(arguments)));
		}

		debugIn(...args: any[]) {
			Util.debugIn.apply(Util, [this].concat(Util.makeArray(arguments)));
		}

		debugOut(...args: any[]) {
			Util.debugOut();
		}

		toString() : string {
			var n = this.noabase.debugname;
			if (n)
				return n;
			else
				return "[" + (<any>this).constructor.name + ":" + this.noaid + "]";
		}
	}
}
