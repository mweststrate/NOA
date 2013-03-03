if (!NOA.ui)
	NOA.ui = {};

NOA.ui.getRendererFor = function(value) {
	if (NOA.list.isA(value))
		return NOA.ui.listview;
	else if (NOA.record.isA(value))
		return NOA.ui.recordview;
	else if (NOA.impl.cell.isA(value))
		return NOA.ui.valueview;
	return null;

}

NOA.ui.render = function(value, node, parent) {
	var constructor = NOA.ui.getRendererFor(value);
	new constructor(value, node, parent);
}

NOA.util.declare("NOA.ui.abstractview", NOA.util.Base, {
	subject : null,
	parentNode : null,
	parent : null,
	showing : true,
	children : null,

	init : function(subject, node, parent) {
		this.subject = subject;
		this.parentNode = node;
		this.parent = parent;

		if (parent)
			parent.registerChild(this);
	},


	registerChild : function(child) {
		this.children.push(child);
	},

	moveChild : function(from, to) {
		
	},

	show : function() {
		if (!this.showing) {
			this.showing = true;
			//insert all items
			this.list.replayInserts(this, this.onInsert); 
		}
	},

	hide : function() {
		if (this.showing) {
			this.showing = false;
			this.freeChildren();
		}	
	},

	freeChildren : function() {
		for (var i = this.children.length, item = null; item = this.children[i--];) 
			item.free();
		this.children = [];
	},

	free : function() {
		if (this.parent) 
			this.parent.unRegisterChild(this);		
		
		this.freeChildren();
		if (this.domNode)
			this.domNode.remove();
	}
});

NOA.util.declare("NOA.ui.valueview", NOA.ui.abstractview, {
	domNode : null,
	curviewer : null,

	init : function() {
		this.domNode = jQuery("<div class='noa-value'>").appendTo(this.parentNode);

		//subject is cell
		this.onChange(this.subject.get(this, this.onChange));	

		this.listenTo(this.subject, 'free', this.free);
	}, 

	onChange : function(newvalue) {
		if (newvalue === undefined)
			this.free(); 

		var newtype = NOA.ui.getRendererFor(newvalue);
		
		if (this.curviewer)
			this.curviewer.free();
			
		//complex type; create a renderer
		if (newtype != null) { 
				this.domNode.removeClass('noa-primitive');
				new newtype(newvalue, this.domNode, this);
		}
		else {
			this.domNode.addClass('noa-primitive');
			this.domNode.text(newvalue);
		}
	}
});

NOA.util.declare("NOA.ui.recordview", NOA.ui.abstractview, {
	
	domNode : null,

	/**
	 * 
	 * @param  {[type]} list  to render   [description]
	 * @param  {[type]} node to append to   [description]
	 * @return {[type]}
	 */
	init : function() {
		this.domNode = jQuery("<div class='noa-recordview'>").appendTo(node);
		//this.onRender = onRender;

		this.listenTo(this.subject, 'set', this.onSet);

		//TODO: listen to record.keys to support orderd keys. replayInserts on the keys
		this.record.replaySets(this, this.onSet);
	},

	onSet : function(key, value) {
		if (key == undefined) {
			if (key in this.children) {
				this.children[key][1].remove();
				this.children[key][0].remove();
				//NOte, no need to destroy the renderers, that is taken care of by the renderview
			}
		}
		else if (!(key in this.children)) {
			this.children[key] = [
				jQuery("<div class='noa-recordkey'>").appendTo(this.domNode).text(key),
				jQuery("<div class='noa-recordvalue'>").appendTo(this.domNode)
			];

			NOA.ui.render(this.subject.cell(key), this.children[key][1], this);
		}
	}
});

NOA.util.declare("NOA.ui.listview", NOA.ui.abstractview, {
	
	domNode : null,

	/**
	 * 
	 * @param  {[type]} list  to render   [description]
	 * @param  {[type]} node to append to   [description]
	 * @param  {[type]} onRender(value, node, parent), callback invoked for every item that is added. should use registerChild() if applicable [description]
	 * @return {[type]}
	 */
	init : function() {
		this.domNode = jQuery("<ol class='noa-listview'>").appendTo(this.parentNode);
		//this.onRender = onRender;

		this.listenTo(this.subject, 'insert', this.onInsert);
		this.listenTo(this.subject, 'remove', this.onRemove);
		this.listenTo(this.subject, 'move', this.onMove);
		
		this.show();
	},

	onInsert : function(index, value) {
		if (this.showing) {
			var li = jQuery("<li class='noa-listitem'>");

			if (index == 0)
				li.prependTo(this.domNode);
			else
				li.insertAfter(this.domNode.children()[index - 1]);

			//this.onRender(this.list.cell(index), li, this);
			NOA.ui.render(this.list.cell(index), li, this);
		}
	},

	onRemove : function(index) {
		if (this.showing)
			this.domNode.children().eq(index).remove();
	},

	onMove : function(from, to) {
		if (this.showing) {
			var li = this.domNode.children().eq(from).detach();

			if (to == 0)
				li.prependTo(this.domNode);
			else
				li.insertAfter(this.domNode.children()[to - 1]);
		}
	}
});
