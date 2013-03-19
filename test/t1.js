var should = require("should");
global . NOA = require('../public/noa/noa.js').NOA.basepath("./../");

describe("NOA test 1", function() {
	it("NOA test 1.1" ,function(done) {

		NOA.require("NOA.core", function() {
			var x = new NOA.List().live().debugName("x");

			//base set
			x.add(3); 
			x.add(2);  
			x.add(6);

			//mutations
			x.insert(2,7);

			x.remove(1); //super fails if ONLY this is disabled
			x.cell(2).set(1);
			x.move(1,0); //JOIN fails if this is not disabled

			should.deepEqual(x.toArray(), [7,3,1]);
		
			x.die();

			should.equal(NOA.List.count, 0);
			should.equal(NOA.core.Cell.count, 0);

			done();
		})

	});

	it("NOA test 1.2", function(done) {
		NOA.require(["NOA.core", "NOA.List"], function() {
			debugger;
			var x = new NOA.List().live().debugName("x");;

		   	var y = x.map("x", function() { 
				var v = this.variable('x');
				//console.log("DOUBLEMAP: " + v + " * 2 = " + (v * 2));
				return v * 2; 
			}).debugName("y").live();

			//base set
			x.add(3); 
			x.add(2);  
			x.add(6);

			//mutations
			x.insert(2,7);

			x.remove(1); //super fails if ONLY this is disabled
			x.cell(2).set(1);
			x.move(1,0); //JOIN fails if this is not disabled

			should.deepEqual(x.toArray(), [7,3,1]);
			should.deepEqual(y.toArray(), [14,6,2])

			x.die();
			y.die();

			should.equal(NOA.List.count, 0);
			//should.equal(NOA.Record.count, 0);
			should.equal(NOA.core.Cell.count, 0);
			should.equal(NOA.core.Expression.count, 0);

			done();
		});
	});

});