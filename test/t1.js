var should = require("should");
global . NOA = require('../public/noa/noa.js').NOA.basepath("./../");

describe("NOA test 1", function() {
it("NOA test 1.1" ,function(done) {

NOA.require("NOA.core", function() {

	var x = new NOA.List().live().debugName("x");;

	//base set
	x.add(3); 
	x.add(2);  
	x.add(6);

	//mutations
	x.insert(2,7);

	x.remove(1); //super fails if ONLY this is disabled
	x.cell(2).set(1);
	x.move(1,0); //JOIN fails if this is not disabled

	x.toArray().should.equal([7,3,1]);
	
	x.die();

	NOA.List.count.should.equal(0);
	done();
})

});

});